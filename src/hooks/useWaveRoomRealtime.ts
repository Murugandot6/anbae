import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RoomState, Station } from '@/types/waveRoom';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export const useWaveRoomRealtime = (roomCode: string | undefined, user: User | null) => {
  const [roomState, setRoomState] = useState<RoomState>({ current_station: null, is_playing: false });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use a ref to hold the most current state to prevent race conditions in callbacks
  const roomStateRef = React.useRef(roomState);
  useEffect(() => {
    roomStateRef.current = roomState;
  }, [roomState]);

  useEffect(() => {
    if (!roomCode || !user) {
        setIsLoading(false);
        return;
    }

    const fetchInitialState = async () => {
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
    };

    fetchInitialState();

    const channel = supabase.channel(`waveroom:${roomCode}`);

    // Listen for database changes as the single source of truth
    channel
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'wave_rooms',
        filter: `room_code=eq.${roomCode}`,
      }, (payload) => {
        const { current_station, is_playing } = payload.new;
        // Update local state for all clients based on the database change
        setRoomState({ current_station, is_playing });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, user]);

  // This function now ONLY updates the database. The UI update will come from the listener above.
  const updateRoomStateInDb = useCallback(async (newState: Partial<RoomState>) => {
    if (!roomCode) return;
    
    const { error: updateError } = await supabase
      .from('wave_rooms')
      .update(newState)
      .eq('room_code', roomCode);

    if (updateError) {
      toast.error('Failed to sync room state.');
      console.error(updateError);
    }
  }, [roomCode]);

  const setStation = useCallback((station: Station) => {
    updateRoomStateInDb({ current_station: station, is_playing: true });
  }, [updateRoomStateInDb]);

  const togglePlay = useCallback(() => {
    // Use the ref to get the most current state to avoid race conditions
    const newIsPlaying = !roomStateRef.current.is_playing;
    updateRoomStateInDb({ is_playing: newIsPlaying });
  }, [updateRoomStateInDb]);

  const clearStation = useCallback(() => {
    updateRoomStateInDb({ current_station: null, is_playing: false });
  }, [updateRoomStateInDb]);

  return { roomState, setStation, togglePlay, clearStation, isLoading, error };
};