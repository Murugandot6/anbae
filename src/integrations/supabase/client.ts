import { createClient } from '@supabase/supabase-js';

const supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing from environment variables! Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file or environment.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);