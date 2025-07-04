import React, { useState } from 'react';
import { WaveIcon } from '../components/icons/WaveIcon';
import { UsersIcon } from '../components/icons/UsersIcon';

interface HomePageProps {
  onEnterRoom: (code: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onEnterRoom }) => {
  const [joinCode, setJoinCode] = useState('');
  
  const handleCreateRoom = () => {
    // Generate a simple random 4-letter code
    const newCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    onEnterRoom(newCode);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      onEnterRoom(joinCode.trim().toUpperCase());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900 text-white p-4">
      <div className="text-center">
        <WaveIcon className="w-20 h-20 text-indigo-400 mx-auto mb-4" />
        <h1 className="text-5xl font-bold tracking-tighter mb-2">Welcome to Wave Room</h1>
        <p className="text-lg text-gray-400 max-w-xl mx-auto">Create a private room, invite your friends, and listen to thousands of internet radio stations together in real-time.</p>
      </div>
      
      <div className="mt-12 flex flex-col md:flex-row gap-6 w-full max-w-2xl">
        {/* Create Room Card */}
        <div className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <UsersIcon className="w-12 h-12 text-indigo-400 mb-4"/>
          <h2 className="text-2xl font-semibold mb-2">Create a New Room</h2>
          <p className="text-gray-400 mb-6">Start a new listening party and invite others to join.</p>
          <button
            onClick={handleCreateRoom}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-indigo-500/40"
          >
            Create Room
          </button>
        </div>
        
        {/* Join Room Card */}
        <div className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <form onSubmit={handleJoinRoom} className="w-full flex flex-col">
            <h2 className="text-2xl font-semibold mb-2">Join an Existing Room</h2>
            <p className="text-gray-400 mb-6">Enter a room code below to join your friends.</p>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="ENTER CODE"
              className="w-full bg-gray-700 border-2 border-gray-600 text-white text-center font-bold tracking-widest text-lg rounded-lg px-4 py-3 mb-4 focus:border-indigo-500 focus:ring-0 outline-none transition-colors"
              maxLength={4}
              style={{ textTransform: 'uppercase' }}
            />
            <button
              type="submit"
              className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
              disabled={!joinCode.trim()}
            >
              Join Room
            </button>
          </form>
        </div>
      </div>

      <footer className="absolute bottom-4 text-gray-500 text-sm">
        <p>Discover music together. Powered by the Radio Browser API.</p>
      </footer>
    </div>
  );
};

export default HomePage;
