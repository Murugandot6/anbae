import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Radio, Users, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import BackgroundWrapper from '@/components/BackgroundWrapper';

const generateRoomCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const WaveRoomPage: React.FC = () => { // Renamed component
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState<'create' | 'join' | null>(null);
  const [createError, setCreateError] = useState<string | null>(null); // Separate error state for create
  const [joinError, setJoinError] = useState<string | null>(null);     // Separate error state for join

  const handleCreateRoom = async () => {
    setLoading('create');
    setCreateError(null); // Clear previous create error
    setJoinError(null);   // Clear join error if present

    let roomCode = '';
    let isCodeUnique = false;
    let attempts = 0;

    while (!isCodeUnique && attempts < 10) {
        roomCode = generateRoomCode();
        const { error: checkError } = await supabase
            .from('wave_rooms')
            .select('id')
            .eq('code', roomCode)
            .single();
        
        if (checkError && checkError.code === 'PGRST116') { // PGRST116 means no rows found, so code is unique
            isCodeUnique = true;
        } else if (checkError) {
             console.error("Error checking for room code uniqueness:", checkError); // Log the full error
             setCreateError(`Could not verify room code: ${checkError.message}. Please try again.`);
             setLoading(null);
             return;
        }
        attempts++;
    }

    if (!isCodeUnique) {
        setCreateError("Failed to generate a unique room code after multiple attempts. Please try again.");
        setLoading(null);
        return;
    }

    const { data: newRoom, error: insertError } = await supabase
      .from('wave_rooms')
      .insert({ code: roomCode, is_playing: false })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating room:', insertError);
      setCreateError(`Could not create a room: ${insertError.message}. Please try again.`);
    } else if (newRoom) {
      navigate(`/waveroom/${newRoom.code}`);
    }
    setLoading(null);
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
        setJoinError("Please enter a room code.");
        return;
    }
    setLoading('join');
    setJoinError(null);   // Clear previous join error
    setCreateError(null); // Clear create error if present

    const codeToJoin = joinCode.trim().toUpperCase();

    const { data, error: findError } = await supabase
      .from('wave_rooms')
      .select('code')
      .eq('code', codeToJoin)
      .single();

    if (findError || !data) {
      console.error('Error finding room:', findError); // Log the full error
      setJoinError(`Room with code "${codeToJoin}" not found.`);
    } else {
      navigate(`/waveroom/${data.code}`);
    }
    setLoading(null);
  };

  return (
    <BackgroundWrapper>
      <div className="text-center mb-12">
        <Radio className="w-20 h-20 text-indigo-400 mx-auto mb-4" />
        <h1 className="text-5xl font-bold tracking-tighter mb-2 text-white">Wave Room</h1>
        <p className="text-lg text-gray-300 max-w-xl mx-auto">Listen to internet radio with friends, in real-time.</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card className="bg-white/10 border-gray-700 text-white flex flex-col">
          <CardHeader className="text-center">
            <Users className="w-12 h-12 text-indigo-400 mx-auto mb-4"/>
            <CardTitle>Create a New Room</CardTitle>
            <CardDescription>
                Start a new listening party and invite others to join.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-grow justify-end">
            {createError && <p className="text-red-400 text-sm mb-2">{createError}</p>} {/* Display create error */}
            <Button
              onClick={handleCreateRoom}
              disabled={!!loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500"
            >
              {loading === 'create' ? 'Creating...' : 'Create Room'}
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 border-gray-700 text-white">
          <CardHeader className="text-center">
            <LogIn className="w-12 h-12 text-green-400 mx-auto mb-4"/>
            <CardTitle>Join an Existing Room</CardTitle>
            <CardDescription>Enter a room code below to join your friends.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinRoom} className="flex flex-col gap-4">
              <Input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className="text-center font-mono tracking-widest text-lg"
                maxLength={4}
              />
              {joinError && <p className="text-red-400 text-sm mt-2">{joinError}</p>} {/* Display join error */}
              <Button
                type="submit"
                disabled={!joinCode.trim() || !!loading}
                className="bg-green-600 hover:bg-green-500"
              >
                {loading === 'join' ? 'Joining...' : 'Join Room'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </BackgroundWrapper>
  );
};

export default WaveRoomPage;