import { useState, useEffect, useCallback } from 'react';
import { RoomState, Station } from '../types';

const getRoomStateFromStorage = (roomCode: string): RoomState | null => {
  try {
    const item = localStorage.getItem(`waveroom-${roomCode}`);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error("Failed to parse room state from localStorage", error);
    return null;
  }
};

const setRoomStateInStorage = (roomCode: string, state: RoomState) => {
  const key = `waveroom-${roomCode}`;
  const value = JSON.stringify(state);
  localStorage.setItem(key, value);
  // Dispatch a custom event because the 'storage' event doesn't fire on the same page that made the change.
  // This ensures immediate UI updates on the active tab.
  window.dispatchEvent(new StorageEvent('storage', {
    key,
    newValue: value,
    storageArea: localStorage,
  }));
};

export const useRoomSync = (roomCode: string) => {
  const [roomState, setRoomState] = useState<RoomState>(
    () => getRoomStateFromStorage(roomCode) || { currentStation: null, isPlaying: false }
  );

  useEffect(() => {
    // Initialize the room state in storage if it doesn't exist
    if (!getRoomStateFromStorage(roomCode)) {
      setRoomStateInStorage(roomCode, { currentStation: null, isPlaying: false });
    }
    // Set the initial local state
    setRoomState(getRoomStateFromStorage(roomCode) || { currentStation: null, isPlaying: false });
  }, [roomCode]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === `waveroom-${roomCode}` && event.newValue) {
        try {
          const newState = JSON.parse(event.newValue);
          setRoomState(newState);
        } catch (error) {
          console.error("Failed to parse updated room state", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [roomCode]);

  const updateRoomState = useCallback((newState: Partial<RoomState>) => {
    const currentState = getRoomStateFromStorage(roomCode) || { currentStation: null, isPlaying: false };
    const updatedState = { ...currentState, ...newState };
    setRoomStateInStorage(roomCode, updatedState);
  }, [roomCode]);

  const setStation = useCallback((station: Station) => {
    updateRoomState({ currentStation: station, isPlaying: true });
  }, [updateRoomState]);

  const togglePlay = useCallback(() => {
    const currentState = getRoomStateFromStorage(roomCode);
    if (currentState?.currentStation) {
      updateRoomState({ isPlaying: !currentState.isPlaying });
    }
  }, [updateRoomState]);

  const clearStation = useCallback(() => {
    updateRoomState({ currentStation: null, isPlaying: false });
  }, [updateRoomState]);

  return { roomState, setStation, togglePlay, clearStation };
};
