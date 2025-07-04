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
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const persistStateToDb = useCallback(async (stateToPersist: RoomState) => {
    if (!roomCode) return;
    const { error: updateError } = await supabase
      .from('wave_rooms')
      .update(stateToPersist)
      .eq('room_code', roomCode);

    if (updateError) {
      console.error("DB Sync Error:", updateError.message);
    }
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode || !user) {
      setIsLoading(false);
      return;
    }

    const channel = supabase.channel(`waveroom:${roomCode}`);
    channelRef.current = channel;

    const setupAndSubscribe = async () => {
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

      channel
        .on('broadcast', { event: 'state_update' }, (payload) => {
          if (userRef.current && payload.senderId !== userRef.current.id) {
            setRoomState(payload.state);
          }
        })
        .subscribe((status, err) => {
          if (status === 'CHANNEL_ERROR') {
            console.error('Realtime channel error:', err);
            setError('Realtime connection failed. Please refresh the page.');
            toast.error('Realtime connection failed.');
          }
        });
    };

    setupAndSubscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomCode, user]);

  const broadcastAndPersist = useCallback((newState: RoomState) => {
    if (channelRef.current && userRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'state_update',
        payload: { state: newState, senderId: userRef.current.id },
      });
    }
    persistStateToDb(newState);
  }, [persistStateToDb]);

  const setStation = useCallback((station: Station) => {
    setRoomState(() => {
      const newState: RoomState = { current_station: station, is_playing: true };
      broadcastAndPersist(newState);
      return newState;
    });
  }, [broadcastAndPersist]);

  const togglePlay = useCallback(() => {
    setRoomState(prevState => {
      const newState = { ...prevState, is_playing: !prevState.is_playing };
      broadcastAndPersist(newState);
      return newState;
    });
  }, [broadcastAndPersist]);

  const clearStation = useCallback(() => {
    setRoomState(() => {
      const newState: RoomState = { current_station: null, is_playing: false };
      broadcastAndPersist(newState);
      return newState;
    });
  }, [broadcastAndPersist]);

  return { roomState, setStation, togglePlay, clearStation, isLoading, error };
};