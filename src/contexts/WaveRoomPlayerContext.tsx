import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [localUserHasInteracted, setLocalUserHasInteracted] = useState(false);
  const [isConnectedToRoom, setIsConnectedToRoom] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Effect to setup and teardown the real-time subscription
  useEffect(() => {
    const setupRoom = async (code: string) => {
      const { data, error } = await supabase
        .from('wave_rooms')
        .select('current_station, is_playing')
        .eq('code', code)
        .single();

      if (error || !data) {
        toast.error(`Could not join room ${code}. It may not exist.`);
        navigate('/waveroom');
        return;
      }

      setCurrentStation(data.current_station);
      setIsPlaying(data.is_playing);
      setIsConnectedToRoom(true);

      const channel = supabase.channel(`db-room-${code}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'wave_rooms',
            filter: `code=eq.${code}`
          },
          (payload) => {
            const { current_station, is_playing } = payload.new;
            setCurrentStation(current_station);
            setIsPlaying(is_playing);
          }
        )
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBE') {
                setIsConnectedToRoom(true);
            }
            if (status === 'CHANNEL_ERROR' || err) {
                const errorMessage = (err as Error)?.message || 'An unknown error occurred. Please refresh.';
                toast.error(`Connection to room lost: ${errorMessage}`);
                setIsConnectedToRoom(false);
            }
        });

      channelRef.current = channel;
    };

    const leaveRoom = () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnectedToRoom(false);
    };

    if (activeRoomCode && user) {
      setupRoom(activeRoomCode);
    } else {
      leaveRoom();
    }

    return () => {
      leaveRoom();
    };
  }, [activeRoomCode, user, navigate]);

  // Effect to control the HTMLAudioElement
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
          if (error.name === 'NotAllowedError') {
            console.warn("Autoplay prevented. User interaction required.");
            toast.info("Audio paused. Click play to start.");
          }
        });
      } else {
        audio.pause();
      }
    } else {
      audio.pause();
      audio.src = '';
    }
  }, [currentStation, isPlaying]);

  // Function to update the database
  const updateDatabaseState = useCallback(async (station: Station | null, playStatus: boolean) => {
    if (!activeRoomCode) return;

    const stationToSave = station ? {
        stationuuid: station.stationuuid,
        name: station.name,
        url_resolved: station.url_resolved,
        favicon: station.favicon,
        country: station.country,
        language: station.language,
        tags: station.tags,
    } : null;

    const { error } = await supabase
      .from('wave_rooms')
      .update({ current_station: stationToSave, is_playing: playStatus, updated_at: new Date().toISOString() })
      .eq('code', activeRoomCode);
    
    if (error) {
        toast.error(`Failed to update room state: ${error.message}`);
    }
  }, [activeRoomCode]);

  // Action: Set a new station
  const setStation = useCallback((station: Station) => {
    setLocalUserHasInteracted(false);
    setCurrentStation(station); // Optimistic update
    setIsPlaying(true);         // Optimistic update
    updateDatabaseState(station, true);
  }, [updateDatabaseState]);

  // Action: Toggle play/pause
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!currentStation) return;

    if (!localUserHasInteracted) {
        setLocalUserHasInteracted(true);
    }

    if (audio && audio.paused) {
        audio.play().catch(e => toast.error("Could not start playback."));
        if (!isPlaying) {
            setIsPlaying(true); // Optimistic update
            updateDatabaseState(currentStation, true);
        }
    } else {
        audio?.pause();
        setIsPlaying(false); // Optimistic update
        updateDatabaseState(currentStation, false);
    }
  }, [currentStation, isPlaying, updateDatabaseState, localUserHasInteracted]);

  // Action: Clear the player
  const clearStation = useCallback(() => {
    setCurrentStation(null); // Optimistic update
    setIsPlaying(false);     // Optimistic update
    if (activeRoomCode) {
        updateDatabaseState(null, false);
    }
  }, [updateDatabaseState, activeRoomCode]);

  const setRoom = useCallback((code: string | null) => {
    setActiveRoomCode(code);
  }, []);

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