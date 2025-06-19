import { createClient } from '@supabase/supabase-js';

// TEMPORARY: HARDCODED SUPABASE CREDENTIALS FOR DEBUGGING
// DO NOT USE IN PRODUCTION - REVERT TO ENVIRONMENT VARIABLES AFTER TESTING
const supabaseUrl = 'https://lwhpabntbgavzbxmygdi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3aHBhYm50YmdhdnpieG15Z2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzk0MjksImV4cCI6MjA2NTY1NTQyOX0.X5JqIKLWoPhjjzSOit8PeIRHxkX17Jknd6gWhhb6XJw';

console.log('Supabase URL (Hardcoded):', supabaseUrl);
console.log('Supabase Anon Key (Hardcoded, first 10 chars):', supabaseAnonKey.substring(0, 10) + '...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);