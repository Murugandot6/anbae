import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, LogIn, ArrowLeft } from 'lucide-react';
import { WaveIcon, RadioIcon } from '../components/icons'; // Keep both imports, but use WaveIcon
import { toast } from 'sonner';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useConcertPlayer } from '@/contexts/ConcertPlayerContext'; // Updated import
import { Helmet } from 'react-helmet-async'; // Import Helmet
import LoadingPulsar from '@/components/LoadingPulsar';
import { useSession } from '@/contexts/SessionContext'; // Import useSession to get user ID

const generateRoomCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const ConcertPage: React.FC = () => { // Renamed component
  const navigate = useNavigate();
  const { user } = useSession(); // Get the current user from session
  const { roomCode: activePlayerRoomCode, isConnectedToRoom } = useConcertPlayer(); // Updated hook
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState<'create' | 'join' | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (activePlayerRoomCode && isConnectedToRoom) {
      navigate(`/concert/${activePlayerRoomCode}`); // Updated route
    }
  }, [activePlayerRoomCode, isConnectedToRoom, navigate]);

  const handleCreateRoom = async () => {
    if (!user) {
      setCreateError("You must be logged in to create a room.");
      return;
    }

    setLoading('create');
    setCreateError(null);
    setJoinError(null);

    let roomCode = '';
    let isCodeUnique = false;
    let attempts = 0;

    while (!isCodeUnique && attempts < 10) {
        roomCode = generateRoomCode();
        const { error: checkError } = await supabase
            .from('wave_rooms') // Table name remains 'wave_rooms' in DB
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
      .from('wave_rooms') // Table name remains 'wave_rooms' in DB
      .insert({ code: roomCode, is_playing: false, creator_id: user.id }) // Add creator_id here
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating room:', insertError);
      setCreateError(`Could not create a room: ${insertError.message}. Please try again.`);
    } else if (newRoom) {
      navigate(`/concert/${newRoom.code}`); // Updated route
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
      .from('wave_rooms') // Table name remains 'wave_rooms' in DB
      .select('code')
      .eq('code', codeToJoin)
      .single();

    if (findError || !data) {
      console.error('Error finding room:', findError);
      setJoinError(`Room with code "${codeToJoin}" not found.`);
    } else {
      navigate(`/concert/${data.code}`); // Updated route
    }
    setLoading(null);
  };

  return (
    <>
      <Helmet>
        <title>Concert - Anbae</title>
        <meta name="description" content="Create or join a Concert to listen to internet radio stations with your partner in real-time." />
      </Helmet>
      <BackgroundWrapper className="pt-0 md:pt-0">
        <div className="relative w-full max-w-xl sm:max-w-4xl mx-auto mt-16 md:mt-8 mb-8 sm:mb-12 px-4"> {/* Adjusted max-width and padding */}
          <div className="absolute top-1/2 -translate-y-1/2 left-3 z-10"> {/* Adjusted left position */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/dashboard">
                  <Button variant="outline" size="icon" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full text-foreground border-border hover:bg-accent hover:text-accent-foreground shadow-md">
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Back to Dashboard</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="text-center">
            <WaveIcon className="w-16 h-16 sm:w-20 h-20 text-primary mx-auto mb-3 sm:mb-4" /> {/* Adjusted icon size */}
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-1 sm:mb-2 text-foreground">Concert</h1> {/* Updated text */}
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">Listen to internet radio with friends, in real-time.</p> {/* Updated text */}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full max-w-xl sm:max-w-4xl px-4"> {/* Adjusted grid, max-width and padding */}
          <Card className="bg-card/60 backdrop-blur-md border border-border/50 text-foreground flex flex-col rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] p-6 sm:p-8"> {/* Adjusted padding */}
            <CardHeader className="text-center pb-4"> {/* Adjusted padding */}
              <Users className="w-10 h-10 sm:w-12 h-12 text-primary mx-auto mb-3 sm:mb-4"/> {/* Adjusted icon size */}
              <CardTitle className="text-xl sm:text-2xl">Create a New Room</CardTitle> {/* Adjusted font size */}
              <CardDescription className="text-muted-foreground text-sm sm:text-base">
                  Start a new listening party and invite others to join.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow justify-end pt-0">
              {createError && <p className="text-destructive text-xs sm:text-sm mb-2">{createError}</p>} {/* Adjusted font size */}
              <Button
                onClick={handleCreateRoom}
                disabled={!!loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base py-2.5 sm:py-3" // Adjusted font size and padding
              >
                {loading === 'create' ? 'Creating...' : 'Create Room'}
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-card/60 backdrop-blur-md border border-border/50 text-foreground flex flex-col rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] p-6 sm:p-8"> {/* Adjusted padding */}
            <CardHeader className="text-center pb-4"> {/* Adjusted padding */}
              <LogIn className="w-10 h-10 sm:w-12 h-12 text-secondary mx-auto mb-3 sm:mb-4"/> {/* Adjusted icon size */}
              <CardTitle className="text-xl sm:text-2xl">Join an Existing Room</CardTitle> {/* Adjusted font size */}
              <CardDescription className="text-muted-foreground text-sm sm:text-base">Enter a room code below to join your friends.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleJoinRoom} className="flex flex-col gap-3 sm:gap-4"> {/* Adjusted gap */}
                <Input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  className="text-center font-mono tracking-widest text-lg sm:text-xl bg-input/50 border-border/50 text-foreground focus:ring-primary h-10 sm:h-12" // Adjusted font size and height
                  maxLength={4}
                />
                {joinError && <p className="text-destructive text-xs sm:text-sm mt-2">{joinError}</p>} {/* Adjusted font size */}
                <Button
                  type="submit"
                  disabled={!joinCode.trim() || !!loading}
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground text-sm sm:text-base py-2.5 sm:py-3" // Adjusted font size and padding
                >
                  {loading === 'join' ? 'Joining...' : 'Join Room'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </BackgroundWrapper>
    </>
  );
};

export default ConcertPage;