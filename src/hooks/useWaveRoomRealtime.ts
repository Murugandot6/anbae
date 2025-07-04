import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RoomState, Station } from '@/types/waveRoom';
import { RealtimeChannel, User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export const useWaveRoomRealtime = (roomCode: string | undefined, user: User | null) => {
  const [roomState, setRoomState] = useState<RoomState>({ current_station: null, is_playing: false });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = React.useRef<RealtimeChannel>();

  const updateRoomStateInDb = useCallback(async (newState: Partial<RoomState>) => {
    if (!roomCode) return;
    
    const { error: updateError } = await supabase
      .from('wave_rooms')
      .update(newState)
      .eq('room_code', roomCode);

    if (updateError) {
      toast.error('Failed to save room state.');
      console.error(updateError);
    }
  }, [roomCode]);

  const updateAndBroadcastState = useCallback((newState: RoomState) => {
    if (!user || !channelRef.current) return;

    // Broadcast the new state to other clients
    channelRef.current.send({
        type: 'broadcast',
        event: 'room_state_update',
        payload: { newState, senderId: user.id }
    });

    // Update the database in the background
    updateRoomStateInDb({
        current_station: newState.current_station,
        is_playing: newState.is_playing
    });
  }, [user, updateRoomStateInDb]);

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
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'room_state_update' }, (payload) => {
        if (payload.senderId !== user.id) {
            setRoomState(payload.newState);
        }
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomCode, user]);

  const setStation = useCallback((station: Station) => {
    setRoomState(prevState => {
        const newState = { ...prevState, current_station: station, is_playing: true };
        updateAndBroadcastState(newState);
        return newState;
    });
  }, [updateAndBroadcastState]);

  const togglePlay = useCallback(() => {
    setRoomState(prevState => {
      const newState = { ...prevState, is_playing: !prevState.is_playing };
      updateAndBroadcastState(newState);
      return newState;
    });
  }, [updateAndBroadcastState]);

  const clearStation = useCallback(() => {
    setRoomState(prevState => {
        const newState = { ...prevState, current_station: null, is_playing: false };
        updateAndBroadcastState(newState);
        return newState;
    });
  }, [updateAndBroadcastState]);

  return { roomState, setStation, togglePlay, clearStation, isLoading, error };
};