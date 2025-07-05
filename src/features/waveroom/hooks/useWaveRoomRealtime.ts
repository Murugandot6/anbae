import { useState, useEffect, useCallback, useRef } from 'react';
import { RoomState, Station } from '../types';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// --- Singleton Channel Manager ---
// This manager ensures only one channel connection, state, and set of action handlers exists per room code.

interface RoomManager {
  channel: RealtimeChannel;
  state: RoomState;
  isConnected: boolean;
  subscribers: Set<React.Dispatch<React.SetStateAction<RoomState>>>;
  connectionSubscribers: Set<React.Dispatch<React.SetStateAction<boolean>>>;
  refCount: number;
  // Action methods are now part of the manager
  setStation: (station: Station) => void;
  setPlaying: (shouldPlay: boolean) => void;
  clearStation: () => void;
}

const roomManagers: Map<string, RoomManager> = new Map();

const getManager = (
  roomCode: string,
  initialState: RoomState
): RoomManager => {
  if (roomManagers.has(roomCode)) {
    return roomManagers.get(roomCode)!;
  }

  if (!supabase) { // Simplified check
    throw new Error('Supabase not configured');
  }

  const manager: Partial<RoomManager> = {
    state: initialState,
    isConnected: false,
    subscribers: new Set(),
    connectionSubscribers: new Set(),
    refCount: 0,
  };

  const notifyStateChange = () => {
    manager.subscribers!.forEach(setState => setState(manager.state!));
  };
  
  const notifyConnectionChange = () => {
    manager.connectionSubscribers!.forEach(setConnection => setConnection(manager.isConnected!));
  }

  const handleIncomingUpdate = (payload: { state: RoomState }) => {
    manager.state = payload.state;
    notifyStateChange();
  };

  const syncState = async (newState: RoomState) => {
    if (!manager.channel || !supabase) return;
    try {
      const dbResult = await supabase
        .from('wave_rooms')
        .upsert([{
          code: roomCode, // Changed 'room_code' to 'code' to match DB schema
          current_station: newState.current_station,
          is_playing: newState.is_playing
        }], { onConflict: 'code' }); // Changed 'room_code' to 'code'
      if (dbResult.error) throw new Error(`DB Error: ${dbResult.error.message}`);
      
      const broadcastResult = await manager.channel.send({
        type: 'broadcast',
        event: 'state_update',
        payload: { state: newState },
      });
      if (broadcastResult === 'error') throw new Error('Broadcast failed');
    } catch (error) {
      // Errors are now handled silently in production.
    }
  };

  // Centralize action logic within the manager
  manager.setStation = (station: Station) => {
    const newState = { current_station: station, is_playing: true, timestamp: Date.now() }; // Added timestamp
    manager.state = newState;
    notifyStateChange();
    syncState(newState);
  };

  manager.setPlaying = (shouldPlay: boolean) => {
    if (!manager.state?.current_station) return;
    const newState = { ...manager.state, is_playing: shouldPlay, timestamp: Date.now() }; // Added timestamp
    manager.state = newState;
    notifyStateChange();
    syncState(newState);
  };

  manager.clearStation = () => {
    const newState = { current_station: null, is_playing: false, timestamp: Date.now() }; // Added timestamp
    manager.state = newState;
    notifyStateChange();
    syncState(newState);
  };

  const channel = supabase.channel(`room:${roomCode}`, {
    config: { broadcast: { self: false, ack: true } },
  });

  channel
    .on('broadcast', { event: 'state_update' }, ({ payload }) => {
      handleIncomingUpdate(payload as { state: RoomState });
    })
    .subscribe(async (status) => {
        const newIsConnected = status === 'SUBSCRIBED';
        if (manager.isConnected !== newIsConnected) {
            manager.isConnected = newIsConnected;
            notifyConnectionChange();
        }

      if (status === 'SUBSCRIBED') {
        const { data, error } = await supabase
          .from('wave_rooms')
          .select('code, created_at, current_station, is_playing') // Changed 'room_code' to 'code'
          .eq('code', roomCode) // Changed 'room_code' to 'code'
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
             return;
        }

        if (data) {
          manager.state = {
            current_station: data.current_station,
            is_playing: data.is_playing,
            timestamp: Date.now(), // Set timestamp on initial fetch
          };
        } else {
          await syncState(initialState);
        }
        notifyStateChange();
      }
    });

  manager.channel = channel;
  const fullManager = manager as RoomManager;
  roomManagers.set(roomCode, fullManager);
  return fullManager;
};

const destroyManager = (roomCode: string) => {
    if (!roomManagers.has(roomCode)) return;
    const manager = roomManagers.get(roomCode)!;
    supabase?.removeChannel(manager.channel);
    roomManagers.delete(roomCode);
};

// --- React Hook ---

const initialState: RoomState = {
  current_station: null,
  is_playing: false,
  timestamp: Date.now(), // Added timestamp
};

export const useWaveRoomRealtime = (roomCode: string) => { // Renamed hook
  const [roomState, setRoomState] = useState<RoomState>(initialState);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!supabase) return; // Simplified check

    const manager = getManager(roomCode, initialState);
    manager.refCount++;
    
    // Set initial state from manager
    setRoomState(manager.state);
    setIsConnected(manager.isConnected);

    // Subscribe to updates
    manager.subscribers.add(setRoomState);
    manager.connectionSubscribers.add(setIsConnected);

    return () => {
      manager.refCount--;
      manager.subscribers.delete(setRoomState);
      manager.connectionSubscribers.delete(setIsConnected);
      if (manager.refCount === 0) {
        destroyManager(roomCode);
      }
    };
  }, [roomCode]);

   // Handle audio playback based on shared state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (roomState.current_station?.url_resolved) {
      if (audio.src !== roomState.current_station.url_resolved) {
        audio.src = roomState.current_station.url_resolved;
      }
      if (roomState.is_playing) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {}); // Autoplay was prevented.
        }
      }
      else {
        audio.pause();
      }
    } else {
      audio.pause();
      audio.src = '';
    }
  }, [roomState.current_station?.stationuuid, roomState.is_playing]);


  // These functions now call the centralized methods on the manager
  const setStation = useCallback((station: Station) => {
    const manager = roomManagers.get(roomCode);
    manager?.setStation(station);
  }, [roomCode]);
  
  const togglePlay = useCallback(() => { // Renamed from setPlaying
    const manager = roomManagers.get(roomCode);
    manager?.setPlaying(!roomState.is_playing); // Pass the toggled state
  }, [roomCode, roomState.is_playing]); // Added roomState.is_playing to dependencies

  const clearStation = useCallback(() => {
    const manager = roomManagers.get(roomCode);
    manager?.clearStation();
  }, [roomCode]);

  return { 
    roomState, 
    setStation, 
    togglePlay, // Renamed
    clearStation, 
    audioRef,
    isConnected
  };
};