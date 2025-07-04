import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RoomState, Station } from '../types';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useWaveRoomRealtime = (roomCode: string | undefined, user: User | null) => {
  const [roomState, setRoomState] = useState<RoomState>({ current_station: null, is_playing: false });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    console.log('WaveRoom: useWaveRoomRealtime useEffect running. roomCode:', roomCode, 'user:', user?.id); // NEW LOG

    if (!roomCode || !user) {
      setIsLoading(false);
      // If roomCode or user is missing, we should also ensure no channel is active.
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    const fetchInitialState = async () => {
      setIsLoading(true);
      setError(null);
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
      console.log('WaveRoom: Initial room state fetched:', data); // Added log
      setIsLoading(false);
    };

    fetchInitialState();

    // Ensure previous channel is removed before subscribing to a new one
    if (channelRef.current) {
      console.log(`WaveRoom: Removing existing channel before re-subscribing: ${roomCode}`);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase.channel(`waveroom-db-changes:${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wave_rooms',
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          const updatedRoom = payload.new as { current_station: Station | null; is_playing: boolean };
          console.log('WaveRoom: Realtime update received:', payload.new); // Added log
          setRoomState({
            current_station: updatedRoom.current_station,
            is_playing: updatedRoom.is_playing,
          });
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('WaveRoom: Realtime channel error:', err); // Added log
          setError('Realtime connection failed. Please refresh the page.');
          toast.error('Realtime connection failed.');
        } else if (status === 'SUBSCRIBED') {
            console.log(`WaveRoom: Subscribed to channel: ${roomCode}`); // Added log
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        console.log(`WaveRoom: Unsubscribing from channel: ${roomCode}`); // Added log
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomCode, user]);

  const updateDatabase = async (newState: Partial<RoomState>) => {
    if (!roomCode) return;
    
    console.log('WaveRoom: Attempting to update database with:', newState); // Added log
    const { error: updateError } = await supabase
      .from('wave_rooms')
      .update(newState)
      .eq('room_code', roomCode);

    if (updateError) {
      toast.error("Failed to sync state. Please try again.");
      console.error("WaveRoom: DB Sync Error:", updateError.message); // Added log
    } else {
        console.log('WaveRoom: Database update successful for:', newState); // Added log
    }
  };

  const setStation = useCallback((station: Station) => {
    console.log('WaveRoom: setStation called with:', station); // Added log
    setRoomState({ current_station: station, is_playing: true }); // Update local state immediately
    updateDatabase({ current_station: station, is_playing: true }); // Then update database
  }, [roomCode]);

  const togglePlay = useCallback(() => {
    setRoomState(prevState => {
      const newState = { ...prevState, is_playing: !prevState.is_playing };
      console.log('WaveRoom: togglePlay called, new local state:', newState); // Added log
      updateDatabase({ is_playing: newState.is_playing }); // Update database
      return newState;
    });
  }, [roomCode]);

  const clearStation = useCallback(() => {
    console.log('WaveRoom: clearStation called'); // Added log
    setRoomState({ current_station: null, is_playing: false }); // Update local state immediately
    updateDatabase({ current_station: null, is_playing: false }); // Then update database
  }, [roomCode]);

  return { roomState, setStation, togglePlay, clearStation, isLoading, error };
};