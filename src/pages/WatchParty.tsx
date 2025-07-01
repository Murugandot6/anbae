import React from 'react';
import WatchPartyApp from '../../watch-party/App';
import { SupabaseProvider } from '../../watch-party/contexts/SupabaseContext';
import { supabase } from '@/integrations/supabase/client';

const WatchParty = () => {
  // This component integrates the standalone "watch-party" app into the main application.
  // It uses the main app's Supabase client to ensure the user's session is shared,
  // providing a seamless, single-login experience.
  return (
    <SupabaseProvider client={supabase}>
      <WatchPartyApp />
    </SupabaseProvider>
  );
};

export default WatchParty;