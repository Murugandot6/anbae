import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Station } from '@/features/waveroom/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';

interface WaveRoomPlayerContextType {
  currentStation: Station | null;
  isPlaying: boolean;
  roomCode: string | null;
  setStation: (station: Station, roomCode: string) => void;
  togglePlay: (roomCode: string) => void;
  clearStation: (roomCode: string) => void;
  isConnectedToRoom: boolean;
}

const WaveRoomPlayerContext = createContext<WaveRoomPlayerContextType | undefined>(undefined);

export const WaveRoomPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [isConnectedToRoom, setIsConnectedToRoom] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // This effect manages the Supabase channel subscription
  useEffect(() => {
    // If there's no room code, we don't need a channel. Clean up any existing one.
    if (!activeRoomCode) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnectedToRoom(false);
      return; // Exit early
    }

    // A room code exists, so we set up a new channel.
    const channel = supabase.channel(`room:${activeRoomCode}`, {
      config: { broadcast: { self: false, ack: true } },
    });
    channelRef.current = channel;

    channel.on('broadcast', { event: 'state_update' }, ({ payload }) => {
      setCurrentStation(payload.current_station);
      setIsPlaying(payload.is_playing);
    }).subscribe(async (status) => {
      setIsConnectedToRoom(status === 'SUBSCRIBED');
      if (status === 'SUBSCRIBED') {
        // Fetch initial state from DB on subscribe
        const { data, error } = await supabase
          .from('wave_rooms')
          .select('current_station, is_playing')
          .eq('code', activeRoomCode)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
          console.error('Error fetching initial room state:', error.message);
        } else if (data) {
          setCurrentStation(data.current_station);
          setIsPlaying(data.is_playing);
        }
      }
    });

    // The crucial cleanup function. This will run when the component unmounts
    // or when `activeRoomCode` changes, BEFORE the effect runs again.
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [activeRoomCode]);

  // Audio element control based on context state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentStation?.url_resolved) {
      if (audio.src !== currentStation.url_resolved) {
        audio.src = currentStation.url_resolved;
        audio.load(); // Load the new source
      }
      if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            // Autoplay was prevented. User needs to interact.
            console.warn("Autoplay prevented:", error);
            toast.info("Please tap to play audio.");
            setIsPlaying(false); // Reflect that it's not playing
          });
        }
      } else {
        audio.pause();
      }
    } else {
      audio.pause();
      audio.src = ''; // Clear source
    }
  }, [currentStation, isPlaying]);

  const syncStateToSupabase = useCallback(async (station: Station | null, playStatus: boolean, code: string) => {
    if (!supabase) {
      console.error('Supabase client not initialized.');
      return;
    }

    try {
      const { error: dbError } = await supabase
        .from('wave_rooms')
        .upsert([{
          code: code,
          current_station: station,
          is_playing: playStatus,
          updated_at: new Date().toISOString(), // Ensure updated_at is set
        }], { onConflict: 'code' });

      if (dbError) {
        console.error('Supabase DB update error:', dbError.message);
        toast.error('Failed to sync player state to server.');
        return;
      }

      if (channelRef.current) {
        const broadcastResult = await channelRef.current.send({
          type: 'broadcast',
          event: 'state_update',
          payload: {
            current_station: station,
            is_playing: playStatus,
            timestamp: Date.now(),
          },
        });
        if (broadcastResult === 'error') {
          console.error('Supabase broadcast error: Failed to send state update.');
        }
      }
    } catch (error) {
      console.error('Error syncing state:', error);
      toast.error('An unexpected error occurred while syncing player state.');
    }
  }, []);

  const setStation = useCallback((station: Station, roomCode: string) => {
    setActiveRoomCode(roomCode);
    setCurrentStation(station);
    setIsPlaying(true);
    syncStateToSupabase(station, true, roomCode);
  }, [syncStateToSupabase]);

  const togglePlay = useCallback((roomCode: string) => {
    setActiveRoomCode(roomCode); // Ensure room code is set
    setIsPlaying(prev => {
      const newState = !prev;
      syncStateToSupabase(currentStation, newState, roomCode);
      return newState;
    });
  }, [currentStation, syncStateToSupabase]);

  const clearStation = useCallback((roomCode: string) => {
    setActiveRoomCode(roomCode); // Ensure room code is set
    setCurrentStation(null);
    setIsPlaying(false);
    syncStateToSupabase(null, false, roomCode);
  }, [syncStateToSupabase]);

  const value = {
    currentStation,
    isPlaying,
    roomCode: activeRoomCode,
    setStation,
    togglePlay,
    clearStation,
    isConnectedToRoom,
  };

  return (
    <WaveRoomPlayerContext.Provider value={value}>
      <audio ref={audioRef} crossOrigin="anonymous" preload="auto" />
      {children}
    </WaveRoomPlayerContext.Provider>
  );
};

export const useWaveRoomPlayer = () => {
  const context = useContext(WaveRoomPlayerContext);
  if (context === undefined) {
    throw new Error('useWaveRoomPlayer must be used within a WaveRoomPlayerProvider');
  }
  return context;
};