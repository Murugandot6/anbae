import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RoomState, Station } from '@/types/waveRoom';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useWaveRoomRealtime = (roomCode: string | undefined, user: User | null) => {
  const [roomState, setRoomState] = useState<RoomState>({ current_station: null, is_playing: false });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!roomCode || !user) {
      setIsLoading(false);
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
      setIsLoading(false);
    };

    fetchInitialState();

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
          setRoomState({
            current_station: updatedRoom.current_station,
            is_playing: updatedRoom.is_playing,
          });
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime channel error:', err);
          setError('Realtime connection failed. Please refresh the page.');
          toast.error('Realtime connection failed.');
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomCode, user]);

  const updateDatabase = async (newState: Partial<RoomState>) => {
    if (!roomCode) return;
    
    const { error: updateError } = await supabase
      .from('wave_rooms')
      .update(newState)
      .eq('room_code', roomCode);

    if (updateError) {
      toast.error("Failed to sync state. Please try again.");
      console.error("DB Sync Error:", updateError.message);
    }
  };

  const setStation = useCallback((station: Station) => {
    setRoomState({ current_station: station, is_playing: true });
    updateDatabase({ current_station: station, is_playing: true });
  }, [roomCode]);

  const togglePlay = useCallback(() => {
    setRoomState(prevState => {
      const newState = { ...prevState, is_playing: !prevState.is_playing };
      updateDatabase({ is_playing: newState.is_playing });
      return newState;
    });
  }, [roomCode]);

  const clearStation = useCallback(() => {
    setRoomState({ current_station: null, is_playing: false });
    updateDatabase({ current_station: null, is_playing: false });
  }, [roomCode]);

  return { roomState, setStation, togglePlay, clearStation, isLoading, error };
};