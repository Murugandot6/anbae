import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Edge Function started processing request.'); // Very early log

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request.');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clearRequestId, userId, partnerId } = await req.json();
    console.log('Edge Function received payload:', { clearRequestId, userId, partnerId });

    // Validate input
    if (!clearRequestId || !userId || !partnerId) {
      console.error('Missing required parameters:', { clearRequestId, userId, partnerId });
      return new Response(JSON.stringify({ success: false, message: 'Missing required parameters.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Supabase environment variables are not set!');
      return new Response(JSON.stringify({ success: false, message: 'Server configuration error: Supabase credentials missing.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    console.log('Supabase admin client created.');

    // 1. Verify the clear request status
    const { data: clearRequest, error: fetchError } = await supabaseAdmin
      .from('clear_requests')
      .select('*')
      .eq('id', clearRequestId)
      .single();

    if (fetchError) {
      console.error('Error fetching clear request:', fetchError.message, fetchError);
      return new Response(JSON.stringify({ success: false, message: `Error fetching clear request: ${fetchError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    if (!clearRequest) {
      console.error('Clear request not found:', { clearRequestId });
      return new Response(JSON.stringify({ success: false, message: 'Clear request not found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    console.log('Fetched clear request:', clearRequest);

    if (clearRequest.status !== 'accepted') {
      console.error('Clear request status is not accepted:', clearRequest.status);
      return new Response(JSON.stringify({ success: false, message: 'Clear request not accepted by partner.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // 2. Verify that the user invoking the function is the sender of the accepted request
    if (clearRequest.sender_id !== userId) {
      console.error('Unauthorized: userId does not match sender_id.', { clearRequestSenderId: clearRequest.sender_id, userId });
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized to clear messages for this request.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    let totalDeletedCount = 0;
    let deletionErrorOccurred = false;

    // Handle messages sent between two distinct users OR messages sent to self
    if (userId === partnerId) {
      console.log('Detected self-messaging scenario. Attempting to delete messages where sender_id and receiver_id are the same.');
      const { count, error } = await supabaseAdmin
        .from('messages')
        .delete({ count: 'exact' }) // Request exact count
        .eq('sender_id', userId)
        .eq('receiver_id', userId);

      if (error) {
        console.error('Error deleting self-sent messages:', error.message, error);
        deletionErrorOccurred = true;
      } else {
        totalDeletedCount += count || 0;
        console.log(`Deleted ${count} self-sent messages.`);
      }
    } else {
      // Original logic for messages between two different users
      console.log('Attempting to delete messages from sender to receiver:', userId, '->', partnerId);
      const { count: count1, error: deleteError1 } = await supabaseAdmin
        .from('messages')
        .delete({ count: 'exact' }) // Request exact count
        .eq('sender_id', userId)
        .eq('receiver_id', partnerId);

      if (deleteError1) {
        console.error('Error deleting messages (sender to receiver):', deleteError1.message, deleteError1);
        deletionErrorOccurred = true;
      } else {
        totalDeletedCount += count1 || 0;
        console.log(`Deleted ${count1} messages from sender to receiver.`);
      }

      console.log('Attempting to delete messages from receiver to sender:', partnerId, '->', userId);
      const { count: count2, error: deleteError2 } = await supabaseAdmin
        .from('messages')
        .delete({ count: 'exact' }) // Request exact count
        .eq('sender_id', partnerId)
        .eq('receiver_id', userId);

      if (deleteError2) {
        console.error('Error deleting messages (receiver to sender):', deleteError2.message, deleteError2);
        deletionErrorOccurred = true;
      } else {
        totalDeletedCount += count2 || 0;
        console.log(`Deleted ${count2} messages from receiver to sender.`);
      }
    }

    if (deletionErrorOccurred) {
      return new Response(JSON.stringify({ success: false, message: 'Failed to delete some messages.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // 4. Update the clear request status to 'completed'
    console.log('Attempting to update clear request status to completed for ID:', clearRequestId);
    const { error: updateRequestError } = await supabaseAdmin
      .from('clear_requests')
      .update({ status: 'completed' })
      .eq('id', clearRequestId);

    if (updateRequestError) {
      console.error('Error updating clear request status to completed:', updateRequestError.message, updateRequestError);
      // This error is logged but doesn't prevent a success response for message clearing,
      // as messages are already deleted.
    } else {
      console.log('Clear request status updated to completed.');
    }

    return new Response(JSON.stringify({ success: true, message: `Messages cleared successfully. Total deleted: ${totalDeletedCount}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) { // Explicitly type error as any for message property
    console.error('General Edge function error:', error.message, error);
    return new Response(JSON.stringify({ success: false, message: `Internal server error: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});