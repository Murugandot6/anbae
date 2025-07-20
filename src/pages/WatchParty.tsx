import React, { useState, useCallback, useEffect, useRef } from 'react';
import { User, Room } from '@/types/watchParty';
import Dashboard from '@/components/watch-party/Dashboard';
import Theater from '@/components/watch-party/Theater';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client'; // Import supabase
import { Profile } from '@/types/supabase'; // Import Profile type
import { Helmet } from 'react-helmet-async'; // Import Helmet
import LoadingPulsar from '@/components/LoadingPulsar';

const LoadingSpinner: React.FC = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <LoadingPulsar />
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
        // No need to clear localStorage here, as we'll rely on Supabase
    }
  }, [session, authUser]);

  // Effect to load persisted room from Supabase
  useEffect(() => {
    const loadPersistedRoom = async () => {
      if (!sessionLoading && authUser) {
        // Fetch user's profile to get last_watch_party_room_id
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('last_watch_party_room_id')
          .eq('id', authUser.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('Error fetching user profile for watch party:', profileError.message);
        }

        const persistedRoomId = profileData?.last_watch_party_room_id;

        if (persistedRoomId) {
          const { data, error } = await supabase
            .from('watch_party_rooms')
            .select('*')
            .eq('id', persistedRoomId)
            .single();

          if (error || !data) {
            console.error('Error loading persisted room from DB:', error?.message);
            // If room not found or error, clear the stored ID in profile
            await supabase.from('profiles').update({ last_watch_party_room_id: null }).eq('id', authUser.id);
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

  const handleJoinRoom = useCallback(async (room: Room) => {
    setCurrentRoom(room);
    // Persist room ID to Supabase profile
    if (authUser) {
      const { error } = await supabase
        .from('profiles')
        .update({ last_watch_party_room_id: room.id })
        .eq('id', authUser.id);
      if (error) {
        console.error('Error saving last room ID to profile:', error.message);
      }
    }
  }, [authUser]);

  const handleLeaveRoom = useCallback(async () => {
    setCurrentRoom(null);
    // Clear persisted room ID from Supabase profile
    if (authUser) {
      const { error } = await supabase
        .from('profiles')
        .update({ last_watch_party_room_id: null })
        .eq('id', authUser.id);
      if (error) {
        console.error('Error clearing last room ID from profile:', error.message);
      }
    }
    navigate('/dashboard');
  }, [navigate, authUser]);

  if (sessionLoading || initialRoomLoading) { // Include initialRoomLoading in overall loading
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
        <>
            <Helmet>
                <title>Theater - Anbae</title>
                <meta name="description" content="Join or create a theater to watch videos with your partner in real-time." />
            </Helmet>
            {/* Replaced BackgroundWrapper with a simple div */}
            <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center justify-center">
                <div className="w-full max-w-sm sm:max-w-md bg-card/60 backdrop-blur-md border border-border/50 p-6 sm:p-8 rounded-xl shadow-lg text-center">
                    <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-foreground">Authentication Error</h2>
                    <p className="text-sm sm:text-base text-muted-foreground">Could not find a valid user session. Please ensure you are logged in.</p>
                </div>
            </div>
        </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Theater - Anbae</title>
        <meta name="description" content="Join or create a theater to watch videos with your partner in real-time." />
      </Helmet>
      {/* Replaced BackgroundWrapper with a simple div */}
      <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
        <main className="flex-grow min-h-0 w-full p-0">
          {currentRoom ? (
            <Theater room={currentRoom} onLeaveRoom={handleLeaveRoom} user={user} />
          ) : (
            <>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-6 sm:mb-8 text-foreground text-center">Theater</h1>
              <Dashboard onJoinRoom={handleJoinRoom} />
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default WatchParty;