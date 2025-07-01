import React from 'react';
import TheaterApp from '../../theater/App';
import { SupabaseProvider } from '../../theater/contexts/SupabaseContext';
import { supabase } from '@/integrations/supabase/client';

const Theater = () => {
  // This component integrates the standalone "theater" app into the main application.
  // It uses the main app's Supabase client to ensure the user's session is shared,
  // providing a seamless, single-login experience.
  return (
    <SupabaseProvider client={supabase}>
      <TheaterApp />
    </SupabaseProvider>
  );
};

export default Theater;