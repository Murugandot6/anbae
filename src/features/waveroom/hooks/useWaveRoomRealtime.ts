import { useState, useEffect, useCallback, useRef } from 'react';
import { RoomState, Station } from '../types';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useWaveRoomPlayer } from '@/contexts/WaveRoomPlayerContext'; // Import the new context

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
  // These methods will now only interact with Supabase, not directly with audio
  syncStateToDbAndBroadcast: (station: Station | null, playStatus: boolean) => Promise<void>;
}

const roomManagers: Map<string, RoomManager> = new Map();

const getManager = (
  roomCode: string,
  initialState: RoomState,
  onIncomingStateUpdate: (newState: RoomState) => void // Callback to update global player
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

  // This function is now part of the manager and handles DB update + broadcast
  manager.syncStateToDbAndBroadcast = async (station: Station | null, playStatus: boolean) => {
    const newState = { current_station: station, is_playing: playStatus, timestamp: Date.now() };
    manager.state = newState; // Update manager's internal state immediately

    try {
      const dbResult = await supabase
        .from('wave_rooms')
        .upsert([{
          code: roomCode,
          current_station: newState.current_station,
          is_playing: newState.is_playing,
          updated_at: new Date().toISOString(), // Ensure updated_at is set
        }], { onConflict: 'code' });
      if (dbResult.error) throw new Error(`DB Error: ${dbResult.error.message}`);
      
      const broadcastResult = await manager.channel!.send({
        type: 'broadcast',
        event: 'state_update',
        payload: { state: newState },
      });
      if (broadcastResult === 'error') throw new Error('Broadcast failed');
    } catch (error) {
      console.error('Error syncing state to DB and broadcasting:', error);
      // In production, you might want to toast an error here, but for a shared state,
      // it's often better to let the UI reflect the last known good state.
    }
  };

  const channel = supabase.channel(`room:${roomCode}`, {
    config: { broadcast: { self: false, ack: true } },
  });

  channel
    .on('broadcast', { event: 'state_update' }, ({ payload }) => {
      const incomingState = payload.state as RoomState;
      // Only update if the incoming state is newer or if it's a clear command
      if (incomingState.timestamp > (manager.state?.timestamp || 0) || incomingState.current_station === null) {
        manager.state = incomingState;
        notifyStateChange();
        onIncomingStateUpdate(incomingState); // Notify global player context
      }
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
          .select('code, current_station, is_playing')
          .eq('code', roomCode)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
             console.error('Error fetching initial room state from DB:', error.message);
             return;
        }

        const fetchedState: RoomState = {
          current_station: data?.current_station || null,
          is_playing: data?.is_playing || false,
          timestamp: Date.now(), // Set timestamp on initial fetch
        };
        manager.state = fetchedState;
        notifyStateChange();
        onIncomingStateUpdate(fetchedState); // Notify global player context
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
  timestamp: Date.now(),
};

export const useWaveRoomRealtime = (roomCode: string) => {
  const [roomState, setRoomState] = useState<RoomState>(initialState);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  const { setStation: setGlobalStation, togglePlay: toggleGlobalPlay, clearStation: clearGlobalStation } = useWaveRoomPlayer();

  useEffect(() => {
    if (!supabase) return;

    const manager = getManager(roomCode, initialState, (newState) => {
      // Callback to update the global player context when a state update is received
      setGlobalStation(newState.current_station!, roomCode); // Pass roomCode to setStation
      if (newState.current_station) {
        // Only toggle play if there's a station and the state indicates playing
        if (newState.is_playing) {
          setGlobalStation(newState.current_station, roomCode); // Ensure station is set and playing
        } else {
          toggleGlobalPlay(roomCode); // Just toggle play/pause
        }
      } else {
        clearGlobalStation(roomCode); // Clear if no station
      }
    });
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
  }, [roomCode, setGlobalStation, toggleGlobalPlay, clearGlobalStation]);

  // These functions now call the centralized methods on the manager to sync with Supabase
  const setStation = useCallback((station: Station) => {
    const manager = roomManagers.get(roomCode);
    if (manager) {
      manager.syncStateToDbAndBroadcast(station, true);
      setGlobalStation(station, roomCode); // Also update global player immediately
    }
  }, [roomCode, setGlobalStation]);
  
  const togglePlay = useCallback(() => {
    const manager = roomManagers.get(roomCode);
    if (manager) {
      manager.syncStateToDbAndBroadcast(manager.state.current_station, !manager.state.is_playing);
      toggleGlobalPlay(roomCode); // Also update global player immediately
    }
  }, [roomCode, toggleGlobalPlay]);

  const clearStation = useCallback(() => {
    const manager = roomManagers.get(roomCode);
    if (manager) {
      manager.syncStateToDbAndBroadcast(null, false);
      clearGlobalStation(roomCode); // Also update global player immediately
    }
  }, [roomCode, clearGlobalStation]);

  return { 
    roomState, 
    setStation, 
    togglePlay,
    clearStation, 
    isConnected
  };
};