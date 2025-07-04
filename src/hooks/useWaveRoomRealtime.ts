import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Station, WaveRoom } from '@/types/waveRoom';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useWaveRoomRealtime = (roomCode: string) => {
  const [room, setRoom] = useState<WaveRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleRoomUpdate = (payload: any) => {
    setRoom(payload.new as WaveRoom);
  };

  useEffect(() => {
    const fetchAndSubscribe = async () => {
      const { data, error: fetchError } = await supabase
        .from('wave_rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single();

      if (fetchError || !data) {
        setError('Room not found. Please check the code and try again.');
        console.error(fetchError);
        return;
      }
      setRoom(data);

      const channel = supabase
        .channel(`waveroom:${roomCode}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'wave_rooms',
            filter: `room_code=eq.${roomCode}`,
          },
          handleRoomUpdate
        )
        .subscribe();
      
      channelRef.current = channel;
    };

    fetchAndSubscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomCode]);

  const setStation = useCallback(async (station: Station | null) => {
    if (!room) return;
    const { error } = await supabase
      .from('wave_rooms')
      .update({ current_station: station, is_playing: !!station })
      .eq('id', room.id);
    if (error) console.error("Failed to set station:", error);
  }, [room]);

  const setPlayState = useCallback(async (isPlaying: boolean) => {
    if (!room || !room.current_station) return;
    const { error } = await supabase
      .from('wave_rooms')
      .update({ is_playing: isPlaying })
      .eq('id', room.id);
    if (error) console.error("Failed to set play state:", error);
  }, [room]);

  return { room, error, setStation, setPlayState };
};