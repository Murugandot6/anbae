import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// For debugging purposes, you can keep these logs temporarily:
console.log('Supabase URL (from env):', supabaseUrl);
console.log('Supabase Anon Key (from env, first 10 chars):', supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'Not set');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);