import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RoomState, Station } from '../types';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useWaveRoomRealtime = (roomCode: string | undefined, user: User | null) => {
  const [roomState, setRoomState] = useState<RoomState>({ current_station: null, is_playing: false, timestamp: Date.now() });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const roomStateRef = useRef(roomState); // Ref to hold the latest roomState for broadcast responses

  // Keep the ref updated with the latest state
  useEffect(() => {
    roomStateRef.current = roomState;
  }, [roomState]);

  // Effect 1: Fetch initial room state from DB
  useEffect(() => {
    console.log('WaveRoom: Initial fetch useEffect START. roomCode:', roomCode, 'user:', user?.id);
    const fetchInitialState = async () => {
      if (!roomCode || !user) {
        setIsLoading(false);
        return;
      }
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
      
      // Initialize with fetched data and a new timestamp
      setRoomState({
        current_station: data.current_station,
        is_playing: data.is_playing,
        timestamp: Date.now(), // Set initial timestamp
      });
      console.log('WaveRoom: Initial room state fetched:', data);
      setIsLoading(false);
    };

    fetchInitialState();
  }, [roomCode, user]);

  // Effect 2: Set up Realtime broadcast subscription
  useEffect(() => {
    console.log('WaveRoom: Realtime subscription useEffect START. roomCode:', roomCode, 'user:', user?.id);

    if (!roomCode || !user) {
      console.log('WaveRoom: Realtime subscription useEffect BAILING OUT due to missing roomCode or user.');
      if (channelRef.current) {
        console.log(`WaveRoom: Unsubscribing existing channel before bail out: ${roomCode}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    if (channelRef.current) {
      console.log(`WaveRoom: Removing existing channel before re-subscribing: ${roomCode}`);
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log(`WaveRoom: Attempting to subscribe to broadcast channel: waveroom-broadcast:${roomCode}`);
    const channel = supabase.channel(`waveroom-broadcast:${roomCode}`, { config: { presence: { key: user.id } } })
      .on('broadcast', { event: 'room_state_update' }, ({ payload }) => {
        // Only update if the sender is not the current user AND the received state is newer
        if (payload.senderId !== user.id && payload.newState.timestamp > roomStateRef.current.timestamp) {
          console.log('WaveRoom: Broadcast update received (from other client):', payload.newState);
          setRoomState(payload.newState);
        }
      })
      .on('broadcast', { event: 'REQUEST_ROOM_STATE' }, ({ payload }) => {
        // If another client requests state, send our current state
        if (payload.senderId !== user.id && roomStateRef.current) {
          console.log('WaveRoom: Received REQUEST_ROOM_STATE, sending SYNC_ROOM_STATE.');
          channel.send({
            type: 'broadcast',
            event: 'SYNC_ROOM_STATE',
            payload: { roomState: roomStateRef.current, senderId: user.id },
          });
        }
      })
      .on('broadcast', { event: 'SYNC_ROOM_STATE' }, ({ payload }) => {
        // If we receive a sync state, update if it's from another client and newer
        if (payload.senderId !== user.id && payload.roomState.timestamp > roomStateRef.current.timestamp) {
          console.log('WaveRoom: Received SYNC_ROOM_STATE (from other client):', payload.roomState);
          setRoomState(payload.roomState);
        }
      })
      .subscribe(async (status, err) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('WaveRoom: Realtime channel error:', err);
          setError('Realtime connection failed. Please refresh the page.');
          toast.error('Realtime connection failed.');
        } else if (status === 'SUBSCRIBED') {
          console.log(`WaveRoom: Subscribed to broadcast channel: ${roomCode}`);
          // Request current state from other clients when we subscribe
          channel.send({ type: 'broadcast', event: 'REQUEST_ROOM_STATE', payload: { senderId: user.id } });
        } else {
          console.warn(`WaveRoom: Channel status changed to: ${status}`, err);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        console.log(`WaveRoom: Unsubscribing from channel: ${roomCode}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomCode, user]);

  // Function to update the database for persistence
  const updateDatabase = useCallback(async (newState: Partial<RoomState>) => {
    if (!roomCode) return;
    
    console.log('WaveRoom: Attempting to update database with:', newState);
    const { error: updateError } = await supabase
      .from('wave_rooms')
      .update({
        current_station: newState.current_station !== undefined ? newState.current_station : roomStateRef.current.current_station,
        is_playing: newState.is_playing !== undefined ? newState.is_playing : roomStateRef.current.is_playing,
      })
      .eq('room_code', roomCode);

    if (updateError) {
      toast.error("Failed to persist state to database.");
      console.error("WaveRoom: DB Sync Error:", updateError.message);
    } else {
        console.log('WaveRoom: Database update successful for:', newState);
    }
  }, [roomCode]);

  const setStation = useCallback((station: Station) => {
    const newState: RoomState = { current_station: station, is_playing: true, timestamp: Date.now() };
    setRoomState(newState); // Update local state immediately
    updateDatabase(newState); // Persist to DB
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'room_state_update',
        payload: { newState, senderId: user?.id },
      });
      console.log('WaveRoom: Broadcasted room_state_update for setStation:', newState);
    }
  }, [updateDatabase, user?.id]);

  const togglePlay = useCallback(() => {
    setRoomState(prevState => {
      const newState: RoomState = { ...prevState, is_playing: !prevState.is_playing, timestamp: Date.now() };
      updateDatabase(newState); // Persist to DB
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'room_state_update',
          payload: { newState, senderId: user?.id },
        });
        console.log('WaveRoom: Broadcasted room_state_update for togglePlay:', newState);
      }
      return newState;
    });
  }, [updateDatabase, user?.id]);

  const clearStation = useCallback(() => {
    const newState: RoomState = { current_station: null, is_playing: false, timestamp: Date.now() };
    setRoomState(newState); // Update local state immediately
    updateDatabase(newState); // Persist to DB
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'room_state_update',
        payload: { newState, senderId: user?.id },
      });
      console.log('WaveRoom: Broadcasted room_state_update for clearStation:', newState);
    }
  }, [updateDatabase, user?.id]);

  return { roomState, setStation, togglePlay, clearStation, isLoading, error };
};