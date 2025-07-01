
import React, { createContext, useContext, ReactNode } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import supabaseDefault from '../lib/supabaseClient';

// Create a context for the Supabase client
const SupabaseContext = createContext<SupabaseClient | undefined>(undefined);

interface SupabaseProviderProps {
  children: ReactNode;
  client?: SupabaseClient; // Allow passing a custom client instance
}

// Create a provider component that will wrap our app.
export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children, client }) => {
  // Use the provided client, or fall back to the default singleton instance.
  // This allows the DevView to provide separate clients for each user panel.
  const supabase = client || supabaseDefault;
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
};

// Create a custom hook to easily use the Supabase client in any component
export const useSupabase = (): SupabaseClient => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
