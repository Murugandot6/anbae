import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- TEMPORARY BYPASS FOR PREVIEW ---
  // Set initial state to simulate a logged-in user
  const [session, setSession] = useState<Session | null>({
    access_token: 'mock_access_token',
    token_type: 'Bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'mock_refresh_token',
    user: {
      id: 'mock-user-id-1234', // Use a consistent mock ID
      aud: 'authenticated',
      email: 'mock.user@example.com',
      phone: '',
      created_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
      email_confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      role: 'authenticated',
      updated_at: new Date().toISOString(),
      app_metadata: {
        provider: 'email',
        providers: ['email'],
      },
      user_metadata: {
        nickname: 'MockUser',
        partner_email: 'mock.partner@example.com', // Ensure this matches a potential partner in your DB if needed
        partner_nickname: 'MockPartner',
      },
    },
  });
  const [user, setUser] = useState<User | null>(session?.user || null);
  const [loading, setLoading] = useState(false); // Set to false as we're "loaded" with a mock user
  // --- END TEMPORARY BYPASS ---

  const navigate = useNavigate();

  useEffect(() => {
    // --- TEMPORARILY DISABLED FOR PREVIEW ---
    // const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
    //   setSession(currentSession);
    //   setUser(currentSession?.user || null);
    //   setLoading(false);

    //   if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
    //     if (currentSession && window.location.pathname === '/login' || window.location.pathname === '/register') {
    //       navigate('/dashboard');
    //     }
    //   } else if (event === 'SIGNED_OUT') {
    //     if (window.location.pathname === '/dashboard') {
    //       navigate('/login');
    //     }
    //   }
    // });

    // supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
    //   setSession(initialSession);
    //   setUser(initialSession?.user || null);
    //   setLoading(false);
    // });

    // return () => subscription.unsubscribe();
    // --- END TEMPORARILY DISABLED ---

    // For the bypass, immediately navigate to dashboard if not already there
    if (window.location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <SessionContext.Provider value={{ session, user, loading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};