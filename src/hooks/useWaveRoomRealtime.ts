import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RoomState, Station } from '@/types/waveRoom';
import { RealtimeChannel, User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export const useWaveRoomRealtime = (roomCode: string | undefined, user: User | null) => {
  const [roomState, setRoomState] = useState<RoomState>({ current_station: null, is_playing: false });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  // This function ONLY updates the database. It's for persistence.
  const updateRoomStateInDb = useCallback(async (newState: Partial<RoomState>) => {
    if (!roomCode) return;
    
    const { error: updateError } = await supabase
      .from('wave_rooms')
      .update(newState)
      .eq('room_code', roomCode);

    if (updateError) {
      // Don't show a toast for this background task, just log it.
      console.error("Failed to persist room state:", updateError.message);
    }
  }, [roomCode]);

  // This function handles any user-initiated state change.
  const handleStateChange = useCallback((newState: RoomState) => {
    // 1. Update local state immediately for responsiveness.
    setRoomState(newState);

    // 2. Broadcast the change to other clients.
    if (channelRef.current && user) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'state_update',
        payload: { state: newState, senderId: user.id },
      });
    }

    // 3. Persist the change to the database.
    updateRoomStateInDb(newState);
  }, [user, updateRoomStateInDb]);


  useEffect(() => {
    if (!roomCode || !user) {
      setIsLoading(false);
      return;
    }

    const setupRoom = async () => {
      setIsLoading(true);
      setError(null);

      // Step 1: Fetch initial state from DB
      const { data, error: fetchError } = await supabase
        .from('wave_rooms')
        .select('current_station, is_playing')
        .eq('room_code', roomCode)
        .single();

      if (fetchError || !data) {
        setError('Could not find the specified Wave Room.');
        toast.error('Could not find the specified Wave Room.');
        setIsLoading(false);
        return;
      }
      
      setRoomState({
        current_station: data.current_station,
        is_playing: data.is_playing,
      });
      setIsLoading(false);

      // Step 2: Set up the realtime channel
      const channel = supabase.channel(`waveroom:${roomCode}`);
      channelRef.current = channel;

      channel
        .on('broadcast', { event: 'state_update' }, (payload) => {
          // Step 3: Listen for broadcasts from other clients
          if (payload.senderId !== user.id) {
            setRoomState(payload.state);
          }
        })
        .subscribe();
    };

    setupRoom();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomCode, user]);

  const setStation = useCallback((station: Station) => {
    const newState: RoomState = { current_station: station, is_playing: true };
    handleStateChange(newState);
  }, [handleStateChange]);

  const togglePlay = useCallback(() => {
    setRoomState(prevState => {
      const newState = { ...prevState, is_playing: !prevState.is_playing };
      handleStateChange(newState);
      return newState; // Return the new state for the local update
    });
  }, [handleStateChange]);

  const clearStation = useCallback(() => {
    const newState: RoomState = { current_station: null, is_playing: false };
    handleStateChange(newState);
  }, [handleStateChange]);

  return { roomState, setStation, togglePlay, clearStation, isLoading, error };
};