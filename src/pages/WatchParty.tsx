import React, { useState, useCallback, useEffect } from 'react';
import { User, Room } from '@/types/watchParty';
import Dashboard from '@/components/watch-party/Dashboard';
import Theater from '@/components/watch-party/Theater';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import BackgroundWrapper from '@/components/BackgroundWrapper'; // Import BackgroundWrapper
import { supabase } from '@/integrations/supabase/client'; // Import supabase

const LoadingSpinner: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
);

// Helper to format the DB response into the client-side Room object
const formatRoom = (dbRoom: any): Room => ({
    id: dbRoom.id,
    title: `Room ${dbRoom.room_code}`,
    videoUrl: dbRoom.video_url,
    room_code: dbRoom.room_code,
});

const WatchParty: React.FC = () => {
  const { session, user: authUser, loading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [initialRoomLoading, setInitialRoomLoading] = useState(true); // New state for initial room loading

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
        localStorage.removeItem('watchPartyRoomId'); // Clear persisted room on logout
    }
  }, [session, authUser]);

  // Effect to load persisted room from localStorage
  useEffect(() => {
    const loadPersistedRoom = async () => {
      if (!sessionLoading && authUser) {
        const persistedRoomId = localStorage.getItem('watchPartyRoomId');
        if (persistedRoomId) {
          const { data, error } = await supabase
            .from('watch_party_rooms')
            .select('*')
            .eq('id', persistedRoomId)
            .single();

          if (error || !data) {
            console.error('Error loading persisted room:', error?.message);
            localStorage.removeItem('watchPartyRoomId'); // Clear invalid persisted ID
            setCurrentRoom(null);
          } else {
            setCurrentRoom(formatRoom(data));
          }
        }
      }
      setInitialRoomLoading(false); // Done with initial room loading check
    };

    loadPersistedRoom();
  }, [sessionLoading, authUser]); // Depend on session and authUser to ensure they are loaded

  const handleJoinRoom = useCallback((room: Room) => {
    setCurrentRoom(room);
    localStorage.setItem('watchPartyRoomId', room.id); // Persist room ID
  }, []);

  const handleLeaveRoom = useCallback(() => {
    setCurrentRoom(null);
    localStorage.removeItem('watchPartyRoomId'); // Remove persisted room ID
    navigate('/dashboard');
  }, [navigate]);

  if (sessionLoading || initialRoomLoading) { // Include initialRoomLoading in overall loading
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
          <>
            <h1 className="text-5xl font-bold tracking-tighter mb-8 text-foreground text-center">Watch Party</h1>
            <Dashboard onJoinRoom={handleJoinRoom} />
          </>
        )}
      </main>
    </BackgroundWrapper>
  );
};

export default WatchParty;