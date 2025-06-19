import { createClient } from '@supabase/supabase-js';

// Hardcoding public Supabase URL and Anon Key for static deployments
// These are safe to be public as they are client-side keys.
const supabaseUrl: string = 'https://lwhpabntbgavzbxmygdi.supabase.co';
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3aHBhYm50YmdhdnpieG15Z2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzk0MjksImV4cCI6MjA2NTY1NTQyOX0.X5JqIKLWoPhjjzSOit8PeIRXxkX17Jknd6gWhhb6XJw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);