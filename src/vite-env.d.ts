/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  // Note: VITE_SUPABASE_SERVICE_ROLE_KEY is used for server-side/Edge Functions
  // and should NOT be exposed in client-side code.
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}