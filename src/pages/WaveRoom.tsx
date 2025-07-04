import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, LogIn } from 'lucide-react';

const generateRoomCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const WaveRoom: React.FC = () => {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async () => {
    setLoading('create');
    setError(null);
    
    let roomCode = '';
    let isCodeUnique = false;
    let attempts = 0;

    while (!isCodeUnique && attempts < 10) {
        roomCode = generateRoomCode();
        const { data: existing } = await supabase
            .from('wave_rooms')
            .select('id')
            .eq('room_code', roomCode)
            .single();
        if (!existing) isCodeUnique = true;
        attempts++;
    }

    if (!isCodeUnique) {
        setError("Failed to generate a unique room code. Please try again.");
        setLoading(null);
        return;
    }

    const { data: newRoom, error: insertError } = await supabase
      .from('wave_rooms')
      .insert({ room_code: roomCode })
      .select()
      .single();
    
    if (insertError || !newRoom) {
      setError('Could not create a room. Please try again.');
    } else {
      navigate(`/waveroom/${newRoom.room_code}`);
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
      .from('wave_rooms')
      .select('room_code')
      .eq('room_code', codeToJoin)
      .single();

    if (findError || !data) {
      setError(`Room with code "${codeToJoin}" not found.`);
    } else {
      navigate(`/waveroom/${data.room_code}`);
    }
    setLoading(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="max-w-4xl mx-auto w-full p-4">
            <div className="relative mb-8 text-center">
                <Link to="/dashboard" className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-full transition-colors" aria-label="Back to Dashboard">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-3xl font-bold text-white">FM Party</h1>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-gray-800 rounded-xl shadow-lg p-8 flex flex-col items-center text-center">
                    <div className="bg-blue-500/20 p-4 rounded-full mb-4">
                        <Plus className="h-10 w-10 text-blue-400"/>
                    </div>
                    <h2 className="text-2xl text-white font-semibold mb-2">Start a New Party</h2>
                    <p className="text-gray-400 mb-6">Create a private room and invite your partner to listen along.</p>
                    <Button
                        onClick={handleCreateRoom}
                        disabled={!!loading}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-all transform hover:scale-105 disabled:bg-blue-800 disabled:cursor-not-allowed"
                    >
                        <Plus className="h-6 w-6"/>
                        {loading === 'create' ? 'Creating...' : 'Create Private Room'}
                    </Button>
                </div>

                <div className="bg-gray-800 rounded-xl shadow-lg p-8 flex flex-col items-center text-center">
                    <div className="bg-green-500/20 p-4 rounded-full mb-4">
                        <LogIn className="h-10 w-10 text-green-400"/>
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
                            placeholder="ABCDEF"
                            maxLength={6}
                            className="w-full text-center text-xl tracking-widest font-mono px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                            required
                            disabled={!!loading}
                        />
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                        <Button
                            type="submit"
                            disabled={!!loading}
                            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg transition-all transform hover:scale-105 disabled:bg-green-800 disabled:cursor-not-allowed"
                        >
                            <LogIn className="h-6 w-6"/>
                            {loading === 'join' ? 'Joining...' : 'Join With Code'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    </div>
  );
};

export default WaveRoom;