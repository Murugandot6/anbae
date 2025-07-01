
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl: string = 'https://lwhpabntbgavzbxmygdi.supabase.co';
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3aHBhYm50YmdhdnpieG15Z2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0Mjc1ODgsImV4cCI6MjA2NjAwMzU4OH0.r80qGpG_aKGeMI6HHXxOlwm2XfXKcG6jgXsGkqGsvfA';

if (!supabaseUrl || supabaseUrl.includes('YOUR_SUPABASE_URL')) {
  console.error("Supabase URL is not configured. Please add it to lib/supabaseClient.ts");
}
if (!supabaseAnonKey || supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY')) {
    console.error("Supabase anon key is not configured. Please add it to lib/supabaseClient.ts");
}

// Factory function to create a new Supabase client.
// This allows creating multiple clients with different session storage keys,
// which is useful for the DevView to simulate multiple users.
export const createSupabaseClient = (storageKey: string = 'supabase.auth.token'): SupabaseClient => {
    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
            storageKey: storageKey,
        },
    });
}

// Create a single, default Supabase client for the main application.
const supabase: SupabaseClient = createSupabaseClient();

export default supabase;
