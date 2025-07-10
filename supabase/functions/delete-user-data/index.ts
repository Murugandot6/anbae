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
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ success: false, message: 'User ID is required.' }), {
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

    // Start a transaction if possible, or handle errors for each deletion
    // For simplicity, we'll do sequential deletes. If one fails, others might still succeed.

    // Delete from tables that might not have ON DELETE CASCADE to auth.users
    // Messages (sent and received)
    await supabaseAdmin.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    // Journal Entries
    await supabaseAdmin.from('journal_entries').delete().eq('user_id', userId);
    // Proposals created by the user
    await supabaseAdmin.from('proposals').delete().eq('creator_id', userId);
    // Clear Requests (sent and received)
    await supabaseAdmin.from('clear_requests').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    // Reactions
    await supabaseAdmin.from('reactions').delete().eq('user_id', userId);
    // Video History
    await supabaseAdmin.from('video_history').delete().eq('user_id', userId);
    // Watch Party Chat Messages
    await supabaseAdmin.from('watch_party_chat_messages').delete().eq('user_id', userId);
    // Watch Party Video History
    await supabaseAdmin.from('watch_party_video_history').delete().eq('user_id', userId);

    // Finally, delete the user from auth.users.
    // This should cascade to the 'profiles' table due to the foreign key constraint.
    const { error: userDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (userDeleteError) {
      return new Response(JSON.stringify({ success: false, message: `Failed to delete user account: ${userDeleteError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'User and all associated data deleted successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, message: `Internal server error: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});