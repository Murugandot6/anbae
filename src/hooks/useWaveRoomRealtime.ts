import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RoomState, Station } from '@/types/waveRoom';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

export const useWaveRoomRealtime = (roomCode: string | undefined) => {
  const [roomState, setRoomState] = useState<RoomState>({ current_station: null, is_playing: false });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = React.useRef<RealtimeChannel>();

  // This function will be used to fetch the initial state and to revert on error if needed.
  const fetchInitialState = useCallback(async () => {
    if (!roomCode) return;
    setIsLoading(true);
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
  }, [roomCode]);

  useEffect(() => {
    fetchInitialState();

    const channel = supabase.channel(`waveroom:${roomCode}`);
    channelRef.current = channel;

    channel
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'wave_rooms',
        filter: `room_code=eq.${roomCode}`,
      }, (payload) => {
        const { current_station, is_playing } = payload.new;
        // Update local state when a change is received from another client
        setRoomState({ current_station, is_playing });
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomCode, fetchInitialState]);

  const updateRoomStateInDb = useCallback(async (newState: Partial<RoomState>) => {
    if (!roomCode) return;
    
    const { error: updateError } = await supabase
      .from('wave_rooms')
      .update(newState)
      .eq('room_code', roomCode);

    if (updateError) {
      toast.error('Failed to sync room state with other users.');
      console.error(updateError);
      // If the DB update fails, refetch the ground truth from the server to revert the optimistic update
      fetchInitialState();
    }
  }, [roomCode, fetchInitialState]);

  const setStation = useCallback((station: Station) => {
    const newState = { current_station: station, is_playing: true };
    // Optimistically update the UI
    setRoomState(prevState => ({ ...prevState, ...newState }));
    // Then, send the update to the database
    updateRoomStateInDb(newState);
  }, [updateRoomStateInDb]);

  const togglePlay = useCallback(() => {
    // Use a functional update to get the most recent state
    setRoomState(prevState => {
      const newState = { is_playing: !prevState.is_playing };
      // Then, send the update to the database
      updateRoomStateInDb(newState);
      return { ...prevState, ...newState };
    });
  }, [updateRoomStateInDb]);

  const clearStation = useCallback(() => {
    const newState = { current_station: null, is_playing: false };
    // Optimistically update the UI
    setRoomState(prevState => ({ ...prevState, ...newState }));
    // Then, send the update to the database
    updateRoomStateInDb(newState);
  }, [updateRoomStateInDb]);

  return { roomState, setStation, togglePlay, clearStation, isLoading, error };
};