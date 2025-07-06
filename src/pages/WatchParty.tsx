import React, { useState, useCallback, useEffect } from 'react';
import { User, Room } from '@/types/watchParty';
import Dashboard from '@/components/watch-party/Dashboard';
import Theater from '@/components/watch-party/Theater';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const LoadingSpinner: React.FC = () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
);

const WatchParty: React.FC = () => {
  const { session, user: authUser, loading: sessionLoading } = useSession();
  const navigate = useNavigate(); // Initialize useNavigate
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

  // Modified to navigate to the main dashboard
  const handleLeaveRoom = useCallback(() => {
    setCurrentRoom(null); // Clear the room state within WatchParty
    navigate('/dashboard'); // Navigate to the main dashboard
  }, [navigate]);

  if (sessionLoading) {
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

export default WatchParty;