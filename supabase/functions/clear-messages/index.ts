import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clearRequestId, userId, partnerId } = await req.json();

    // Validate input
    if (!clearRequestId || !userId || !partnerId) {
      return new Response(JSON.stringify({ success: false, message: 'Missing required parameters.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(JSON.stringify({ success: false, message: 'Server configuration error: Supabase credentials missing.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 1. Verify the clear request status
    const { data: clearRequest, error: fetchError } = await supabaseAdmin
      .from('clear_requests')
      .select('*')
      .eq('id', clearRequestId)
      .single();

    if (fetchError) {
      return new Response(JSON.stringify({ success: false, message: `Error fetching clear request: ${fetchError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    if (!clearRequest) {
      return new Response(JSON.stringify({ success: false, message: 'Clear request not found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    if (clearRequest.status !== 'accepted') {
      return new Response(JSON.stringify({ success: false, message: 'Clear request not accepted by partner.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // 2. Verify that the user invoking the function is the sender of the accepted request
    if (clearRequest.sender_id !== userId) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized to clear messages for this request.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    let totalDeletedCount = 0;
    let deletionErrorOccurred = false;

    // Handle messages sent between two distinct users OR messages sent to self
    if (userId === partnerId) {
      const { count, error } = await supabaseAdmin
        .from('messages')
        .delete({ count: 'exact' }) // Request exact count
        .eq('sender_id', userId)
        .eq('receiver_id', userId);

      if (error) {
        deletionErrorOccurred = true;
      } else {
        totalDeletedCount += count || 0;
      }
    } else {
      // Original logic for messages between two different users
      const { count: count1, error: deleteError1 } = await supabaseAdmin
        .from('messages')
        .delete({ count: 'exact' }) // Request exact count
        .eq('sender_id', userId)
        .eq('receiver_id', partnerId);

      if (deleteError1) {
        deletionErrorOccurred = true;
      } else {
        totalDeletedCount += count1 || 0;
      }

      const { count: count2, error: deleteError2 } = await supabaseAdmin
        .from('messages')
        .delete({ count: 'exact' }) // Request exact count
        .eq('sender_id', partnerId)
        .eq('receiver_id', userId);

      if (deleteError2) {
        deletionErrorOccurred = true;
      } else {
        totalDeletedCount += count2 || 0;
      }
    }

    if (deletionErrorOccurred) {
      return new Response(JSON.stringify({ success: false, message: 'Failed to delete some messages.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // 4. Update the clear request status to 'completed'
    const { error: updateRequestError } = await supabaseAdmin
      .from('clear_requests')
      .update({ status: 'completed' })
      .eq('id', clearRequestId);

    if (updateRequestError) {
      // This error is logged but doesn't prevent a success response for message clearing,
      // as messages are already deleted.
    }

    return new Response(JSON.stringify({ success: true, message: `Messages cleared successfully. Total deleted: ${totalDeletedCount}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) { // Explicitly type error as any for message property
    return new Response(JSON.stringify({ success: false, message: `Internal server error: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});