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

  useEffect(() => {
    if (!roomCode) return;

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
    channelRef.current = channel;

    channel
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'wave_rooms',
        filter: `room_code=eq.${roomCode}`,
      }, (payload) => {
        const { current_station, is_playing } = payload.new;
        setRoomState({ current_station, is_playing });
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomCode]);

  const updateRoomState = useCallback(async (newState: Partial<RoomState>) => {
    if (!roomCode) return;

    // Perform an optimistic update on the local state for instant UI feedback
    setRoomState(prevState => ({ ...prevState, ...newState }));
    
    // Then, send the update to Supabase to sync with other clients
    const { error: updateError } = await supabase
      .from('wave_rooms')
      .update(newState)
      .eq('room_code', roomCode);

    if (updateError) {
      toast.error('Failed to sync room state with other users.');
      console.error(updateError);
      // Note: We are not reverting the state on error for a simpler UX.
      // The user's player will work, but others might not see the change.
    }
  }, [roomCode]);

  const setStation = useCallback((station: Station) => {
    updateRoomState({ current_station: station, is_playing: true });
  }, [updateRoomState]);

  const togglePlay = useCallback(() => {
    // The new state depends on the current state
    updateRoomState({ is_playing: !roomState.is_playing });
  }, [roomState.is_playing, updateRoomState]);

  const clearStation = useCallback(() => {
    updateRoomState({ current_station: null, is_playing: false });
  }, [updateRoomState]);

  return { roomState, setStation, togglePlay, clearStation, isLoading, error };
};