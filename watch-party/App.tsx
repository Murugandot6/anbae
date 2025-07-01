import React, { useState, useCallback, useEffect } from 'react';
import { User, Room } from './types';
import Dashboard from './components/Dashboard';
import Theater from './components/Theater';
import { useSupabase } from './contexts/SupabaseContext';
import { Session } from '@supabase/supabase-js';

const LoadingSpinner: React.FC = () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
);

const App: React.FC = () => {
  const supabase = useSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);
  
  useEffect(() => {
    if (session) {
       setUser({
        id: session.user.id,
        name: session.user.user_metadata.nickname || session.user.email?.split('@')[0] || 'Guest',
        email: session.user.email!,
      });
    } else {
        setUser(null);
        setCurrentRoom(null);
    }
  }, [session]);

  const handleJoinRoom = useCallback((room: Room) => {
    setCurrentRoom(room);
  }, []);

  const handleLeaveRoom = useCallback(() => {
    setCurrentRoom(null);
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Authentication Error</h2>
            <p>Could not find a valid user session. Please ensure you are logged in.</p>
        </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans">
      <main className="p-4 sm:p-6 lg:p-8">
        {currentRoom ? (
          <Theater room={currentRoom} onLeaveRoom={handleLeaveRoom} user={user} />
        ) : (
          <Dashboard onJoinRoom={handleJoinRoom} />
        )}
      </main>
    </div>
  );
};

export default App;