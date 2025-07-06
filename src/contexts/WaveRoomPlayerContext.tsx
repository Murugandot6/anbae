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
  setRoom: (code: string | null) => void;
  setStation: (station: Station) => void;
  togglePlay: () => void;
  clearStation: () => void;
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

  const setRoom = useCallback((code: string | null) => {
    setActiveRoomCode(code);
    // If leaving a room, we keep the station playing in the mini-player,
    // but the context is no longer associated with a specific room channel.
    if (!code) {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
        setIsConnectedToRoom(false);
    }
  }, []);

  useEffect(() => {
    // Clean up previous channel if it exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (!activeRoomCode || !user) {
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
        audio.play().catch(error => {
          console.warn("Autoplay prevented:", error);
          toast.info("Audio paused. Click play to start.");
        });
      } else {
        audio.pause();
      }
    } else {
      audio.pause();
      audio.src = '';
    }
  }, [currentStation, isPlaying]);

  const syncStateToSupabase = useCallback(async (station: Station | null, playStatus: boolean) => {
    if (!activeRoomCode || !supabase || !user) return;

    await supabase
      .from('wave_rooms')
      .update({ current_station: station, is_playing: playStatus, updated_at: new Date().toISOString() })
      .eq('code', activeRoomCode);

    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'state_update',
        payload: { current_station: station, is_playing: playStatus, senderId: user.id },
      });
    }
  }, [activeRoomCode, user]);

  const setStation = useCallback((station: Station) => {
    if (!activeRoomCode) return;
    setCurrentStation(station);
    setIsPlaying(true);
    syncStateToSupabase(station, true);
  }, [activeRoomCode, syncStateToSupabase]);

  const togglePlay = useCallback(() => {
    if (!activeRoomCode) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused && isPlaying) {
      audio.play().catch(() => toast.error("Could not start playback."));
      return;
    }

    const newState = !isPlaying;
    setIsPlaying(newState);
    syncStateToSupabase(currentStation, newState);
  }, [activeRoomCode, currentStation, isPlaying, syncStateToSupabase]);

  const clearStation = useCallback(() => {
    // This action is now global, not tied to a room, so it clears the player for the current user.
    setCurrentStation(null);
    setIsPlaying(false);
    if (activeRoomCode) {
        syncStateToSupabase(null, false);
    }
    setActiveRoomCode(null);
  }, [activeRoomCode, syncStateToSupabase]);

  const value = {
    currentStation,
    isPlaying,
    roomCode: activeRoomCode,
    setRoom,
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