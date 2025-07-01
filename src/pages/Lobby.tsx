"use client";

import React, { useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Button } from '@/components/ui/button';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { generate } from 'random-words'; // For generating room codes

const Lobby: React.FC = () => {
  const { user, isLoading } = useSession();
  const navigate = useNavigate();
  const [isCreateRoomDialogOpen, setIsCreateRoomDialogOpen] = useState(false);
  const [isJoinRoomDialogOpen, setIsJoinRoomDialogOpen] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [newRoomCode, setNewRoomCode] = useState('');

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError("Failed to log out: " + error.message);
    } else {
      // SessionContextProvider handles navigation on SIGNED_OUT event
    }
  };

  const generateRoomCode = () => {
    const code = generate({ exactly: 3, join: '-' }).toUpperCase();
    setNewRoomCode(code);
  };

  const handleCreateRoom = async () => {
    if (!user || !newRoomCode) {
      showError("User not logged in or room code not generated.");
      return;
    }

    try {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({
          room_code: newRoomCode,
          host_id: user.id,
          current_video_url: null,
          playback_status: 'unstarted',
          current_playback_time: 0,
        })
        .select()
        .single();

      if (roomError) {
        if (roomError.code === '23505') { // Unique violation
          showError("Room code already exists. Please try generating a new one.");
          generateRoomCode(); // Generate a new code if collision
        } else {
          showError("Failed to create room: " + roomError.message);
        }
        return;
      }

      // Add user to room_users table
      const { error: roomUserError } = await supabase
        .from('room_users')
        .insert({
          room_id: roomData.id,
          user_id: user.id,
          username: user.email || 'Guest', // Use email as fallback for username
        });

      if (roomUserError) {
        showError("Failed to add user to room: " + roomUserError.message);
        // Optionally, delete the created room if adding user fails
        await supabase.from('rooms').delete().eq('id', roomData.id);
        return;
      }

      showSuccess(`Room "${newRoomCode}" created successfully!`);
      setIsCreateRoomDialogOpen(false);
      navigate(`/room/${roomData.id}`);
    } catch (error: any) {
      console.error("Error creating room:", error.message);
      showError("An unexpected error occurred while creating the room.");
    }
  };

  const handleJoinRoom = async () => {
    if (!user || !roomCodeInput) {
      showError("Please enter a room code.");
      return;
    }

    try {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_code', roomCodeInput.toUpperCase())
        .single();

      if (roomError) {
        showError("Room not found. Please check the code.");
        return;
      }

      // Check if user is already in this room
      const { data: existingRoomUser, error: existingRoomUserError } = await supabase
        .from('room_users')
        .select('id')
        .eq('room_id', roomData.id)
        .eq('user_id', user.id)
        .single();

      if (existingRoomUserError && existingRoomUserError.code !== 'PGRST116') { // PGRST116 means no rows found
        showError("Error checking existing room membership: " + existingRoomUserError.message);
        return;
      }

      if (!existingRoomUser) {
        // Add user to room_users table if not already there
        const { error: roomUserError } = await supabase
          .from('room_users')
          .insert({
            room_id: roomData.id,
            user_id: user.id,
            username: user.email || 'Guest', // Use email as fallback for username
          });

        if (roomUserError) {
          showError("Failed to join room: " + roomUserError.message);
          return;
        }
      }

      showSuccess(`Joined room "${roomCodeInput.toUpperCase()}"!`);
      setIsJoinRoomDialogOpen(false);
      navigate(`/room/${roomData.id}`);
    } catch (error: any) {
      console.error("Error joining room:", error.message);
      showError("An unexpected error occurred while joining the room.");
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Welcome, {user.email}!</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
          This is your lobby. Here you can create a new watch party room or join an existing one.
        </p>
        <div className="space-x-4">
          <Button onClick={() => { generateRoomCode(); setIsCreateRoomDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white">
            Create New Room
          </Button>
          <Button onClick={() => setIsJoinRoomDialogOpen(true)} variant="secondary">
            Join Room
          </Button>
        </div>
        <Button onClick={handleLogout} variant="destructive" className="mt-8">
          Logout
        </Button>
      </div>
      <MadeWithDyad />

      {/* Create Room Dialog */}
      <Dialog open={isCreateRoomDialogOpen} onOpenChange={setIsCreateRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Watch Party Room</DialogTitle>
            <DialogDescription>
              Your unique room code is: <strong className="text-blue-600 dark:text-blue-400">{newRoomCode}</strong>. Share this with your friends!
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button onClick={generateRoomCode} variant="outline">Generate New Code</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateRoomDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateRoom}>Create Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join Room Dialog */}
      <Dialog open={isJoinRoomDialogOpen} onOpenChange={setIsJoinRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Watch Party Room</DialogTitle>
            <DialogDescription>
              Enter the room code provided by your host.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="roomCode">Room Code</Label>
            <Input
              id="roomCode"
              placeholder="e.g., ABC-XYZ-123"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJoinRoomDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleJoinRoom}>Join Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Lobby;