import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Station, WaveRoom } from '@/types/waveRoom';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useWaveRoomRealtime = (roomCode: string) => {
  const [room, setRoom] = useState<WaveRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const fetchInitialRoom = async () => {
      const { data, error: fetchError } = await supabase
        .from('wave_rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single();

      if (fetchError || !data) {
        setError('Room not found or an error occurred.');
        setRoom(null);
      } else {
        setRoom(data as WaveRoom);
      }
    };

    fetchInitialRoom();

    const channel = supabase.channel(`waveroom:${roomCode}`);
    channelRef.current = channel;

    channel
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'wave_rooms',
        filter: `room_code=eq.${roomCode}`,
      }, (payload) => {
        setRoom(payload.new as WaveRoom);
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomCode]);

  const updateRoomState = async (updates: Partial<WaveRoom>) => {
    if (!room) return;
    const { error: updateError } = await supabase
      .from('wave_rooms')
      .update(updates)
      .eq('id', room.id);
    
    if (updateError) {
      console.error("Failed to update room state:", updateError);
      setError("Failed to sync state with other listeners.");
    }
  };

  const setStation = (station: Station | null) => {
    // When a new station is selected, load it but wait for the user to press play.
    // This prevents issues with browser autoplay policies.
    updateRoomState({ current_station: station, is_playing: false });
  };

  const setPlayState = (isPlaying: boolean) => {
    if (isPlaying && !room?.current_station) return;
    updateRoomState({ is_playing: isPlaying });
  };

  return { room, error, setStation, setPlayState };
};