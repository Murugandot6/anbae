import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase URL and Anon Key
const supabaseUrl = "https://eqjoilqkloizmvbwpoqq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3aHBhYm50YmdhdnpieG15Z2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0Mjc1ODgsImV4cCI6MjA2NjAwMzU4OH0.r80qGpG_aKGeMI6HHXxOlwm2XfXKcG6jgXsGkqGsvfA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});