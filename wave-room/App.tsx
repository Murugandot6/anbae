import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';

const App: React.FC = () => {
  const [roomCode, setRoomCode] = useState<string | null>(null);

  // Check for a room code in the URL hash on initial load
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setRoomCode(hash);
    }
  }, []);

  const handleEnterRoom = (code: string) => {
    const sanitizedCode = code.trim();
    if (sanitizedCode) {
      window.location.hash = sanitizedCode;
      setRoomCode(sanitizedCode);
    }
  };

  const handleLeaveRoom = () => {
    window.location.hash = '';
    setRoomCode(null);
  };

  return (
    <div className="h-full w-full bg-gray-900 text-gray-200 antialiased">
      {roomCode ? (
        <RoomPage roomCode={roomCode} onLeaveRoom={handleLeaveRoom} />
      ) : (
        <HomePage onEnterRoom={handleEnterRoom} />
      )}
    </div>
  );
};

export default App;
