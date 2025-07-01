"use client";

import React, { useState } from 'react';
import { useSession } from '@/contexts/SessionContext'; // Corrected import path
import { Button } from '@/components/ui/button';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Input } from '@/components/ui/input';
import { nanoid } from 'nanoid';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { ThemeToggle } from '@/components/ThemeToggle';

const Lobby: React.FC = () => {
  const { user, isLoading } = useSession();
  const navigate = useNavigate();
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError("Failed to log out: " + error.message);
    } else {
      // SessionContextProvider handles navigation on SIGNED_OUT event
    }
  };

  const handleCreateRoom = async () => {
    if (!user) {
      showError("You must be logged in to create a room.");
      return;
    }
    setIsCreatingRoom(true);
    try {
      const newRoomCode = nanoid(6); // Generate a 6-character unique ID
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          room_code: newRoomCode,
          host_username: user.user_metadata.nickname || user.email,
          current_video_id: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Default YouTube video URL
          playback_status: 'unstarted',
          current_playback_time: 0,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      showSuccess(`Room "${newRoomCode}" created successfully!`);
      navigate(`/room/${newRoomCode}`);
    } catch (error: any) {
      console.error('Error creating room:', error.message);
      showError("Failed to create room: " + error.message);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!user) {
      showError("You must be logged in to join a room.");
      return;
    }
    if (!roomCodeInput) {
      showError("Please enter a room code.");
      return;
    }
    setIsJoiningRoom(true);
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_code', roomCodeInput)
        .single();

      if (error || !data) {
        throw new Error("Room not found or an error occurred.");
      }

      showSuccess(`Joined room "${roomCodeInput}"!`);
      navigate(`/room/${roomCodeInput}`);
    } catch (error: any) {
      console.error('Error joining room:', error.message);
      showError("Failed to join room: " + error.message);
    } finally {
      setIsJoiningRoom(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">Loading user session...</p>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <BackgroundWrapper>
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        <div className="text-center bg-white/30 dark:bg-gray-800/30 p-8 rounded-xl shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Welcome, {user.user_metadata.nickname || user.email}!</h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            This is your lobby. Create a new watch party room or join an existing one.
          </p>
          <div className="flex flex-col gap-4 max-w-sm mx-auto">
            <Button onClick={handleCreateRoom} disabled={isCreatingRoom || isJoiningRoom} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isCreatingRoom ? 'Creating Room...' : 'Create New Room'}
            </Button>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter room code"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                disabled={isCreatingRoom || isJoiningRoom}
              />
              <Button onClick={handleJoinRoom} disabled={isCreatingRoom || isJoiningRoom}>
                {isJoiningRoom ? 'Joining...' : 'Join Room'}
              </Button>
            </div>
          </div>
          <Button onClick={handleLogout} variant="destructive" className="mt-8">
            Logout
          </Button>
        </div>
        <MadeWithDyad />
      </div>
    </BackgroundWrapper>
  );
};

export default Lobby;