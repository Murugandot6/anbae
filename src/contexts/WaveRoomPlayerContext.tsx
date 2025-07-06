import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Station } from '@/features/waveroom/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useSession } from '@/contexts/SessionContext';

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
  const { user } = useSession();
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [isConnectedToRoom, setIsConnectedToRoom] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const stateRef = useRef({ currentStation, isPlaying });
  useEffect(() => {
    stateRef.current = { currentStation, isPlaying };
  }, [currentStation, isPlaying]);

  useEffect(() => {
    if (!activeRoomCode || !user) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnectedToRoom(false);
      return;
    }

    const channel = supabase.channel(`room:${activeRoomCode}`, {
      config: { broadcast: { self: false, ack: true } },
    });
    channelRef.current = channel;

    channel.on('broadcast', { event: 'state_update' }, ({ payload }) => {
      if (payload.senderId !== user.id) {
        setCurrentStation(payload.current_station);
        setIsPlaying(payload.is_playing);
      }
    });

    channel.on('broadcast', { event: 'REQUEST_STATE' }, ({ payload }) => {
      if (payload.senderId !== user.id) {
        channel.send({
          type: 'broadcast',
          event: 'SYNC_STATE',
          payload: { ...stateRef.current, senderId: user.id },
        });
      }
    });

    channel.on('broadcast', { event: 'SYNC_STATE' }, ({ payload }) => {
      if (payload.senderId !== user.id) {
        setCurrentStation(payload.current_station);
        setIsPlaying(payload.is_playing);
      }
    });

    channel.subscribe(async (status) => {
      setIsConnectedToRoom(status === 'SUBSCRIBED');
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'REQUEST_STATE',
          payload: { senderId: user.id },
        });
      }
    });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [activeRoomCode, user]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentStation?.url_resolved) {
      if (audio.src !== currentStation.url_resolved) {
        audio.src = currentStation.url_resolved;
        audio.load();
      }
      if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn("Autoplay prevented:", error);
            toast.info("Please tap to play audio.");
            setIsPlaying(false);
          });
        }
      } else {
        audio.pause();
      }
    } else {
      audio.pause();
      audio.src = '';
    }
  }, [currentStation, isPlaying]);

  const syncStateToSupabase = useCallback(async (station: Station | null, playStatus: boolean, code: string) => {
    if (!supabase || !user) {
      console.error('Supabase client or user not initialized.');
      return;
    }

    try {
      const { error: dbError } = await supabase
        .from('wave_rooms')
        .update({
          current_station: station,
          is_playing: playStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('code', code);

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
            senderId: user.id,
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
  }, [user]);

  const setStation = useCallback((station: Station, roomCode: string) => {
    setActiveRoomCode(roomCode);
    setCurrentStation(station);
    setIsPlaying(true);
    syncStateToSupabase(station, true, roomCode);
  }, [syncStateToSupabase]);

  const togglePlay = useCallback((roomCode: string) => {
    setActiveRoomCode(roomCode);
    setIsPlaying(prev => {
      const newState = !prev;
      syncStateToSupabase(currentStation, newState, roomCode);
      return newState;
    });
  }, [currentStation, syncStateToSupabase]);

  const clearStation = useCallback((roomCode: string) => {
    setActiveRoomCode(roomCode);
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