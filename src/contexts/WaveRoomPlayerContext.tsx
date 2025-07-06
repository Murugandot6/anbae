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

  // Ref to store the current user's ID to avoid processing their own broadcasts
  const userIdRef = useRef<string | null>(null);
  useEffect(() => {
    userIdRef.current = user?.id || null;
  }, [user]);

  // Effect to setup and teardown the real-time subscription
  useEffect(() => {
    const setupRoom = async (code: string) => {
      // 1. Fetch initial state from DB for new joiners
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

      // 2. Subscribe to BROADCAST messages for real-time updates
      const channel = supabase.channel(`room:${code}`) // Using a simpler channel name for broadcast
        .on('broadcast', { event: 'wave_room_state_update' }, (payload) => {
          // Only update if the broadcast came from another user
          if (payload.payload.senderId !== userIdRef.current) {
            setCurrentStation(payload.payload.newState);
            setIsPlaying(payload.payload.isPlaying);
          }
        })
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
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
            // Crucial: Update local state to reflect actual playback status
            setIsPlaying(false); 
          } else {
            console.error("Audio playback error:", error);
            toast.error("Audio playback failed.");
            setIsPlaying(false); 
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

  // Function to update the database AND broadcast the state
  const syncState = useCallback(async (station: Station | null, playStatus: boolean) => {
    if (!activeRoomCode || !user) return;

    // Clean the station object before saving to DB and broadcasting
    const stationToSave = station ? {
        stationuuid: station.stationuuid,
        name: station.name,
        url_resolved: station.url_resolved,
        favicon: station.favicon,
        country: station.country,
        language: station.language,
        tags: station.tags,
    } : null;

    // Update database for persistence
    const { error: dbError } = await supabase
      .from('wave_rooms')
      .update({ current_station: stationToSave, is_playing: playStatus, updated_at: new Date().toISOString() })
      .eq('code', activeRoomCode);
    
    if (dbError) {
        toast.error(`Failed to save room state: ${dbError.message}`);
    }

    // Broadcast state to other clients
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'wave_room_state_update',
        payload: { newState: stationToSave, isPlaying: playStatus, senderId: user.id },
      });
    }
  }, [activeRoomCode, user]);

  // Action: Set a new station
  const setStation = useCallback((station: Station) => {
    setLocalUserHasInteracted(false);
    setCurrentStation(station); // Optimistic update
    setIsPlaying(true);         // Optimistic update
    syncState(station, true); // Use the new syncState function
  }, [syncState]);

  // Action: Toggle play/pause
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!currentStation) return;

    if (!localUserHasInteracted) {
        setLocalUserHasInteracted(true);
    }

    setIsPlaying(prevIsPlaying => { // Use functional update to get the latest state
        const newPlayStatus = !prevIsPlaying;
        
        if (audio) {
            if (newPlayStatus) {
                audio.play().catch(e => toast.error("Could not start playback."));
            } else {
                audio.pause();
            }
        }
        // Call syncState with the *new* status
        syncState(currentStation, newPlayStatus); 
        return newPlayStatus;
    });
  }, [currentStation, syncState, localUserHasInteracted]); // Removed isPlaying from dependencies as it's now handled by functional update

  // Action: Clear the player
  const clearStation = useCallback(() => {
    setCurrentStation(null); // Optimistic update
    setIsPlaying(false);     // Optimistic update
    if (activeRoomCode) {
        syncState(null, false); // Use the new syncState function
    }
  }, [activeRoomCode, syncState]);

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