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

  const roomStateRef = useRef(roomState);
  useEffect(() => {
    roomStateRef.current = roomState;
  }, [roomState]);

  useEffect(() => {
    if (!roomCode || !user) {
      setIsLoading(false);
      return;
    }

    let channel: RealtimeChannel | null = null;

    const setupRoom = async () => {
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

      channel = supabase.channel(`waveroom:${roomCode}`);

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
        .subscribe((status, err) => {
            if (status === 'CHANNEL_ERROR') {
                console.error('Wave Room channel error:', err);
                setError('Realtime connection failed.');
            }
        });
    };

    setupRoom();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [roomCode, user]);

  const updateRoomStateInDb = useCallback(async (newState: Partial<RoomState>) => {
    if (!roomCode) return;
    
    const { error: updateError } = await supabase
      .from('wave_rooms')
      .update(newState)
      .eq('room_code', roomCode);

    if (updateError) {
      toast.error('Failed to sync room state.');
      console.error('DB Update Error:', updateError);
    }
  }, [roomCode]);

  const setStation = useCallback((station: Station) => {
    updateRoomStateInDb({ current_station: station, is_playing: true });
  }, [updateRoomStateInDb]);

  const togglePlay = useCallback(() => {
    const newIsPlaying = !roomStateRef.current.is_playing;
    updateRoomStateInDb({ is_playing: newIsPlaying });
  }, [updateRoomStateInDb]);

  const clearStation = useCallback(() => {
    updateRoomStateInDb({ current_station: null, is_playing: false });
  }, [updateRoomStateInDb]);

  return { roomState, setStation, togglePlay, clearStation, isLoading, error };
};