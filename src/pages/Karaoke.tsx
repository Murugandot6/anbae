import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useSupabaseRealtime } from '@/hooks/watch-party/useSupabaseRealtime';
import { supabase } from '@/integrations/supabase/client';
import { User, Room } from '@/types/watchParty';
import KaraokeLyrics from '@/components/watch-party/KaraokeLyrics';
import { parseLRC } from '@/lib/lrcParser';
import { ThemeToggle } from '@/components/ThemeToggle';

const LoadingSpinner = () => (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-4 text-xl">Loading Karaoke Session...</p>
    </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white text-center p-4">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
        <p>{message}</p>
    </div>
);

const KaraokePage = () => {
    const [searchParams] = useSearchParams();
    const roomId = searchParams.get('roomId');
    const { user: authUser, session, loading: sessionLoading } = useSession();
    
    const [user, setUser] = useState<User | null>(null);
    const [room, setRoom] = useState<Room | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (sessionLoading) return;
        if (!session || !authUser) {
            setError("You must be logged in to view this page.");
            setIsLoading(false);
            return;
        }
        setUser({
            id: authUser.id,
            name: authUser.user_metadata.nickname || authUser.email?.split('@')[0] || 'Guest',
            email: authUser.email!,
        });
    }, [session, authUser, sessionLoading]);

    useEffect(() => {
        if (!roomId) {
            setError("No Room ID provided in the URL.");
            setIsLoading(false);
            return;
        }
        const fetchRoomData = async () => {
            const { data, error } = await supabase
                .from('watch_party_rooms')
                .select('*')
                .eq('id', roomId)
                .single();
            
            if (error || !data) {
                setError(`Could not find room with ID: ${roomId}`);
                setIsLoading(false);
            } else {
                setRoom({
                    id: data.id,
                    title: `Room ${data.room_code}`,
                    videoUrl: data.video_url,
                    room_code: data.room_code,
                });
                setIsLoading(false);
            }
        };
        fetchRoomData();
    }, [roomId]);

    if (isLoading || sessionLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <ErrorDisplay message={error} />;
    }

    if (!user || !room) {
        return <ErrorDisplay message="Could not initialize karaoke session." />;
    }

    return <KaraokeSession user={user} room={room} />;
};

const KaraokeSession = ({ user, room }: { user: User, room: Room }) => {
    const { videoState, lrcContent } = useSupabaseRealtime(room.id, room.videoUrl, user);
    const parsedLyrics = useMemo(() => parseLRC(lrcContent), [lrcContent]);

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-8 text-white">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <h1 className="text-4xl font-bold mb-4">{room.title} - Lyrics</h1>
            <div className="w-full h-full flex-grow overflow-hidden">
                <KaraokeLyrics lyrics={parsedLyrics} currentTime={videoState.time} />
            </div>
        </div>
    );
};

export default KaraokePage;