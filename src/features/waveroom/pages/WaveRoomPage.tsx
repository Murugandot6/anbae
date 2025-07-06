import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, LogIn, ArrowLeft } from 'lucide-react';
import { WaveIcon, RadioIcon } from '../components/icons'; // Import RadioIcon
import { toast } from 'sonner';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useWaveRoomPlayer } from '@/contexts/WaveRoomPlayerContext';

const generateRoomCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const WaveRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { roomCode: activePlayerRoomCode, isConnectedToRoom } = useWaveRoomPlayer();
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState<'create' | 'join' | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (activePlayerRoomCode && isConnectedToRoom) {
      navigate(`/waveroom/${activePlayerRoomCode}`);
    }
  }, [activePlayerRoomCode, isConnectedToRoom, navigate]);

  const handleCreateRoom = async () => {
    setLoading('create');
    setCreateError(null);
    setJoinError(null);

    let roomCode = '';
    let isCodeUnique = false;
    let attempts = 0;

    while (!isCodeUnique && attempts < 10) {
        roomCode = generateRoomCode();
        const { error: checkError } = await supabase
            .from('wave_rooms')
            .select('code')
            .eq('code', roomCode)
            .single();
        
        if (checkError && checkError.code === 'PGRST116') {
            isCodeUnique = true;
        } else if (checkError) {
             console.error("Error checking for room code uniqueness:", checkError);
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
    setJoinError(null);
    setCreateError(null);

    const codeToJoin = joinCode.trim().toUpperCase();

    const { data, error: findError } = await supabase
      .from('wave_rooms')
      .select('code')
      .eq('code', codeToJoin)
      .single();

    if (findError || !data) {
      console.error('Error finding room:', findError);
      setJoinError(`Room with code "${codeToJoin}" not found.`);
    } else {
      navigate(`/waveroom/${data.code}`);
    }
    setLoading(null);
  };

  return (
    <BackgroundWrapper className="pt-0 md:pt-0">
      <div className="relative w-full max-w-4xl mx-auto mt-16 md:mt-8 mb-12">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/dashboard">
                <Button variant="outline" size="icon" className="w-10 h-10 rounded-full text-foreground border-border hover:bg-accent hover:text-accent-foreground shadow-md">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Back to Dashboard</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="text-center">
          <RadioIcon className="w-20 h-20 text-primary mx-auto mb-4" /> {/* Changed to RadioIcon */}
          <h1 className="text-5xl font-bold tracking-tighter mb-2 text-foreground">Wave Room</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">Listen to internet radio with friends, in real-time.</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card className="bg-card/60 backdrop-blur-md border border-border/50 text-foreground flex flex-col rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
          <CardHeader className="text-center">
            <Users className="w-12 h-12 text-primary mx-auto mb-4"/>
            <CardTitle>Create a New Room</CardTitle>
            <CardDescription className="text-muted-foreground">
                Start a new listening party and invite others to join.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-grow justify-end">
            {createError && <p className="text-destructive text-sm mb-2">{createError}</p>}
            <Button
              onClick={handleCreateRoom}
              disabled={!!loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading === 'create' ? 'Creating...' : 'Create Room'}
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-card/60 backdrop-blur-md border border-border/50 text-foreground flex flex-col rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
          <CardHeader className="text-center">
            <LogIn className="w-12 h-12 text-secondary mx-auto mb-4"/>
            <CardTitle>Join an Existing Room</CardTitle>
            <CardDescription className="text-muted-foreground">Enter a room code below to join your friends.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinRoom} className="flex flex-col gap-4">
              <Input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className="text-center font-mono tracking-widest text-lg bg-input/50 border-border/50 text-foreground focus:ring-primary"
                maxLength={4}
              />
              {joinError && <p className="text-destructive text-sm mt-2">{joinError}</p>}
              <Button
                type="submit"
                disabled={!joinCode.trim() || !!loading}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
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