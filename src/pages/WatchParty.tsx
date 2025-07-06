import React, { useState, useCallback, useEffect } from 'react';
import { User, Room } from '@/types/watchParty';
import Dashboard from '@/components/watch-party/Dashboard';
import Theater from '@/components/watch-party/Theater';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import BackgroundWrapper from '@/components/BackgroundWrapper'; // Import BackgroundWrapper

const LoadingSpinner: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
);

const WatchParty: React.FC = () => {
  const { session, user: authUser, loading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (session && authUser) {
       setUser({
        id: authUser.id,
        name: authUser.user_metadata.nickname || authUser.email?.split('@')[0] || 'Guest',
        email: authUser.email!,
      });
    } else {
        setUser(null);
        setCurrentRoom(null);
    }
  }, [session, authUser]);

  const handleJoinRoom = useCallback((room: Room) => {
    setCurrentRoom(room);
  }, []);

  const handleLeaveRoom = useCallback(() => {
    setCurrentRoom(null);
    navigate('/dashboard');
  }, [navigate]);

  if (sessionLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
        <BackgroundWrapper>
            <div className="w-full max-w-md bg-card/60 backdrop-blur-md border border-border/50 p-8 rounded-xl shadow-lg text-center">
                <h2 className="text-2xl font-bold mb-4 text-foreground">Authentication Error</h2>
                <p className="text-muted-foreground">Could not find a valid user session. Please ensure you are logged in.</p>
            </div>
        </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper> {/* Use BackgroundWrapper for consistent styling */}
      <main className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
        {currentRoom ? (
          <Theater room={currentRoom} onLeaveRoom={handleLeaveRoom} user={user} />
        ) : (
          <Dashboard onJoinRoom={handleJoinRoom} />
        )}
      </main>
    </BackgroundWrapper>
  );
};

export default WatchParty;