import React, { useState } from 'react';
import { Room } from '@/types/watchParty';
import { PlusIcon, LoginIcon as JoinIcon } from '@/components/watch-party/icons';
import { supabase } from '@/integrations/supabase/client';

// Helper to format the DB response into the client-side Room object
const formatRoom = (dbRoom: any): Room => ({
    id: dbRoom.id,
    title: `Room ${dbRoom.room_code}`,
    videoUrl: dbRoom.video_url,
    room_code: dbRoom.room_code,
});

// Helper to generate a unique 6-character alphanumeric code
const generateRoomCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const Dashboard: React.FC<{ onJoinRoom: (room: Room) => void; }> = ({ onJoinRoom }) => {
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async () => {
    setLoading('create');
    setError(null);
    
    let roomCode = '';
    let isCodeUnique = false;
    let attempts = 0;

    // Loop to ensure the generated code is unique
    while (!isCodeUnique && attempts < 10) {
        roomCode = generateRoomCode();
        const { data: existing, error: checkError } = await supabase
            .from('watch_party_rooms')
            .select('id')
            .eq('room_code', roomCode)
            .single();
        
        if (checkError && checkError.code === 'PGRST116') { // PGRST116 means no rows found
            isCodeUnique = true;
        } else if (checkError) {
             console.error("Error checking for room code uniqueness:", checkError);
             setError("Could not verify room code. Please try again.");
             setLoading(null);
             return;
        }
        attempts++;
    }

    if (!isCodeUnique) {
        setError("Failed to generate a unique room code. Please try again.");
        setLoading(null);
        return;
    }

    // Insert the new room with the unique code and an empty video_url
    const { data: newRoom, error: insertError } = await supabase
      .from('watch_party_rooms')
      .insert({ room_code: roomCode, video_url: '', playback_status: 'unstarted' })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating room:', insertError);
      setError('Could not create a room. Please try again.');
    } else if (newRoom) {
      onJoinRoom(formatRoom(newRoom));
    }
    setLoading(null);
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
        setError("Please enter a room code.");
        return;
    }
    setLoading('join');
    setError(null);

    const codeToJoin = joinCode.trim().toUpperCase();

    const { data, error: findError } = await supabase
      .from('watch_party_rooms')
      .select('*')
      .eq('room_code', codeToJoin)
      .single();

    if (findError || !data) {
      setError(`Room with code "${codeToJoin}" not found.`);
    } else {
      onJoinRoom(formatRoom(data));
    }
    setLoading(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8 text-center">Your Watch Parties</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Create Room Card */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-8 flex flex-col items-center text-center">
            <div className="bg-blue-500/20 p-4 rounded-full mb-4">
                <PlusIcon className="h-10 w-10 text-blue-400"/>
            </div>
            <h2 className="text-2xl text-white font-semibold mb-2">Start a New Party</h2>
            <p className="text-gray-400 mb-6">Create a private room and get a shareable code. You can add a video once you're inside.</p>
            <div className="w-full flex flex-col gap-4">
                 {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                <button
                    onClick={handleCreateRoom}
                    disabled={!!loading}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-all transform hover:scale-105 disabled:bg-blue-800 disabled:cursor-not-allowed"
                >
                    <PlusIcon className="h-6 w-6"/>
                    {loading === 'create' ? 'Creating...' : 'Create Private Room'}
                </button>
            </div>
        </div>

        {/* Join Room Card */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-8 flex flex-col items-center text-center">
            <div className="bg-green-500/20 p-4 rounded-full mb-4">
                <JoinIcon className="h-10 w-10 text-green-400"/>
            </div>
            <h2 className="text-2xl text-white font-semibold mb-2">Join an Existing Party</h2>
            <p className="text-gray-400 mb-6">Enter the 6-character code your friend gave you.</p>
            <form onSubmit={handleJoinRoom} className="w-full flex flex-col gap-4">
                 <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => {
                        setJoinCode(e.target.value.toUpperCase());
                        if (error) setError(null);
                    }}
                    placeholder="ABC-123"
                    maxLength={7}
                    className="w-full text-center text-xl tracking-widest font-mono px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                    required
                    disabled={!!loading}
                />
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                    type="submit"
                    disabled={!!loading}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg transition-all transform hover:scale-105 disabled:bg-green-800 disabled:cursor-not-allowed"
                >
                    <JoinIcon className="h-6 w-6"/>
                    {loading === 'join' ? 'Joining...' : 'Join With Code'}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;