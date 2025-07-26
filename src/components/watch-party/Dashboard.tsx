import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Room } from '@/types/watchParty';
import { Plus, LogIn as JoinIcon, ArrowLeft } from 'lucide-react'; // Updated imports
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button'; // Import shadcn Button
import { useSession } from '@/contexts/SessionContext'; // Import useSession

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
  const { user } = useSession(); // Get the current user
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async () => {
    if (!user) {
        setError("You must be logged in to create a room.");
        return;
    }

    setLoading('create');
    setError(null);
    
    let roomCode = '';
    let isCodeUnique = false;
    let attempts = 0;

    while (!isCodeUnique && attempts < 10) {
        roomCode = generateRoomCode();
        const { data: existing, error: checkError } = await supabase
            .from('watch_party_rooms')
            .select('id')
            .eq('room_code', roomCode)
            .single();
        
        if (checkError && checkError.code === 'PGRST116') {
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

    const { data: newRoom, error: insertError } = await supabase
      .from('watch_party_rooms')
      .insert({ room_code: roomCode, video_url: '', playback_status: 'unstarted', creator_id: user.id }) // Include creator_id
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
    <div className="max-w-md sm:max-w-4xl mx-auto px-4"> {/* Added px-4 for mobile padding */}
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        {/* Back button on the left */}
        <div className="flex-shrink-0">
          <Link to="/dashboard" className="flex items-center justify-center bg-card/60 backdrop-blur-md border border-border/50 hover:bg-accent/60 text-foreground p-2.5 sm:p-3 rounded-full transition-colors shadow-md" aria-label="Back to Dashboard">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
        </div>
        {/* Title for the dashboard */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tighter text-foreground mx-auto">Theater</h1>
        <div className="flex-shrink-0 w-9 sm:w-10"></div> {/* Spacer for alignment */}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8"> {/* Changed to grid-cols-1 for mobile, md:grid-cols-2 for larger */}
        {/* Create Room Card */}
        <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl shadow-lg p-6 sm:p-8 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
            <div className="bg-primary/20 p-3 sm:p-4 rounded-full mb-3 sm:mb-4">
                <Plus className="h-8 w-8 sm:h-10 sm:w-10 text-primary"/>
            </div>
            <h2 className="text-xl sm:text-2xl text-foreground font-semibold mb-2">Start a New Theater</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-5 sm:mb-6">Create a private room and get a shareable code. You can add a video once you're inside.</p>
            <div className="w-full flex flex-col gap-3 sm:gap-4">
                 {error && <p className="text-destructive text-xs sm:text-sm mt-2">{error}</p>}
                <Button
                    onClick={handleCreateRoom}
                    disabled={!!loading}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg transition-all transform hover:scale-105 disabled:bg-primary/50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6"/>
                    {loading === 'create' ? 'Creating...' : 'Create Private Room'}
                </Button>
            </div>
        </div>

        {/* Join Room Card */}
        <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl shadow-lg p-6 sm:p-8 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
            <div className="bg-secondary/20 p-3 sm:p-4 rounded-full mb-3 sm:mb-4">
                <JoinIcon className="h-8 w-8 sm:h-10 sm:w-10 text-secondary"/>
            </div>
            <h2 className="text-xl sm:text-2xl text-foreground font-semibold mb-2">Join an Existing Theater</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-5 sm:mb-6">Enter the 6-character code your friend gave you.</p>
            <form onSubmit={handleJoinRoom} className="w-full flex flex-col gap-3 sm:gap-4">
                 <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => {
                        setJoinCode(e.target.value.toUpperCase());
                        if (error) setError(null);
                    }}
                    placeholder="ABC-123"
                    maxLength={7}
                    className="w-full text-center text-lg sm:text-xl tracking-widest font-mono px-3 py-2.5 sm:px-4 sm:py-3 bg-input/50 border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"
                    required
                    disabled={!!loading}
                />
                {error && <p className="text-destructive text-xs sm:text-sm">{error}</p>}
                <Button
                    type="submit"
                    disabled={!!loading}
                    className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg transition-all transform hover:scale-105 disabled:bg-secondary/50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                    <JoinIcon className="h-5 w-5 sm:h-6 sm:w-6"/>
                    {loading === 'join' ? 'Joining...' : 'Join With Code'}
                </Button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;