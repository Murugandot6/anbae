"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { useSession } from '@/components/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Room, ChatMessage, RoomUser } from '@/types/supabase';
import ReactPlayer from 'react-player/youtube';
import { Input } from '@/components/ui/input';
import { Send, Users, Video, MessageSquare, Copy, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, isLoading } = useSession();

  const [room, setRoom] = useState<Room | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [isShareRoomDialogOpen, setIsShareRoomDialogOpen] = useState(false);

  // Player state for local control
  const [playing, setPlaying] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);

  // Debounce for sending playback updates to Supabase
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const syncPlaybackState = useCallback((status: 'playing' | 'paused' | 'unstarted', time: number) => {
    if (!isHost || !room?.id) return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from('rooms')
        .update({
          playback_status: status,
          current_playback_time: time,
          last_updated_at: new Date().toISOString(),
        })
        .eq('id', room.id);

      if (error) {
        console.error('Error syncing playback state:', error.message);
      }
    }, 500); // Debounce by 500ms
  }, [isHost, room?.id]);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    const fetchRoomDetails = async () => {
      if (!roomId) {
        showError("No room ID provided.");
        navigate('/lobby');
        return;
      }

      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error || !data) {
        showError("Room not found or you don't have access.");
        console.error("Fetch room error:", error);
        navigate('/lobby');
        return;
      }

      setRoom(data);
      setIsHost(data.host_id === user.id);
      setVideoUrlInput(data.current_video_url || '');
      setPlaying(data.playback_status === 'playing');
      setPlaybackTime(data.current_playback_time);

      // Fetch initial chat messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching chat messages:', messagesError.message);
      } else {
        setChatMessages(messagesData || []);
      }

      // Fetch initial room users
      const { data: usersData, error: usersError } = await supabase
        .from('room_users')
        .select('*')
        .eq('room_id', roomId);

      if (usersError) {
        console.error('Error fetching room users:', usersError.message);
      } else {
        setRoomUsers(usersData || []);
      }
    };

    fetchRoomDetails();

    // Realtime subscription for room state changes
    const roomChannel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const updatedRoom = payload.new as Room;
          setRoom(updatedRoom);
          if (!isHost) { // Only sync for non-hosts
            setPlaying(updatedRoom.playback_status === 'playing');
            setPlaybackTime(updatedRoom.current_playback_time);
            if (playerRef.current && Math.abs(playerRef.current.getCurrentTime() - updatedRoom.current_playback_time) > 2) {
              playerRef.current.seekTo(updatedRoom.current_playback_time, 'seconds');
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setChatMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_users', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          // Re-fetch all users to ensure accurate list
          const { data: usersData, error: usersError } = await supabase
            .from('room_users')
            .select('*')
            .eq('room_id', roomId);

          if (usersError) {
            console.error('Error fetching room users on realtime update:', usersError.message);
          } else {
            setRoomUsers(usersData || []);
          }
        }
      )
      .subscribe();

    // Add user to room_users when entering the room
    const addUserToRoom = async () => {
      if (!user || !roomId) return;
      try {
        const { data: existingUser, error: fetchError } = await supabase
          .from('room_users')
          .select('id')
          .eq('room_id', roomId)
          .eq('user_id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('Error checking existing room user:', fetchError.message);
          return;
        }

        if (!existingUser) {
          const { error: insertError } = await supabase.from('room_users').insert({
            room_id: roomId,
            user_id: user.id,
            username: user.email || 'Guest',
          });
          if (insertError) {
            console.error('Error adding user to room_users:', insertError.message);
          }
        }
      } catch (error) {
        console.error('Unexpected error in addUserToRoom:', error);
      }
    };
    addUserToRoom();

    return () => {
      supabase.removeChannel(roomChannel);
      // Remove user from room_users when leaving the room
      const removeUserFromRoom = async () => {
        if (!user || !roomId) return;
        try {
          const { error } = await supabase
            .from('room_users')
            .delete()
            .eq('room_id', roomId)
            .eq('user_id', user.id);
          if (error) {
            console.error('Error removing user from room_users:', error.message);
          }
        } catch (error) {
          console.error('Unexpected error in removeUserFromRoom cleanup:', error);
        }
      };
      removeUserFromRoom();
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [roomId, user, isLoading, navigate, isHost, syncPlaybackState]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleVideoUrlChange = async () => {
    if (!isHost || !room?.id) return;
    const { error } = await supabase
      .from('rooms')
      .update({
        current_video_url: videoUrlInput,
        playback_status: 'unstarted', // Reset status when video changes
        current_playback_time: 0,     // Reset time
        last_updated_at: new Date().toISOString(),
      })
      .eq('id', room.id);

    if (error) {
      showError("Failed to update video URL: " + error.message);
    } else {
      showSuccess("Video URL updated!");
      setPlaying(false); // Stop playback on host side
      setPlaybackTime(0);
      if (playerRef.current) {
        playerRef.current.seekTo(0, 'seconds');
      }
    }
  };

  const handlePlayPause = () => {
    if (!isHost || !room?.id) return;
    const newStatus = playing ? 'paused' : 'playing';
    setPlaying(newStatus === 'playing');
    syncPlaybackState(newStatus, playerRef.current?.getCurrentTime() || 0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHost || !room?.id || !playerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * playerRef.current.getDuration();
    playerRef.current.seekTo(newTime, 'seconds');
    setPlaybackTime(newTime);
    syncPlaybackState(playing ? 'playing' : 'paused', newTime);
  };

  const handleProgress = (state: { playedSeconds: number }) => {
    if (!seeking && isHost) {
      setPlaybackTime(state.playedSeconds);
      syncPlaybackState(playing ? 'playing' : 'paused', state.playedSeconds);
    }
  };

  const handlePlayerReady = useCallback(() => {
    setPlayerReady(true);
    if (playerRef.current && room) {
      playerRef.current.seekTo(room.current_playback_time, 'seconds');
      if (room.playback_status === 'playing') {
        setPlaying(true);
      }
    }
  }, [room]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !room?.id || !newChatMessage.trim()) return;

    const { error } = await supabase.from('chat_messages').insert({
      room_id: room.id,
      user_id: user.id,
      username: user.email || 'Guest',
      message: newChatMessage.trim(),
    });

    if (error) {
      showError("Failed to send message: " + error.message);
    } else {
      setNewChatMessage('');
    }
  };

  const handleCopyRoomCode = () => {
    if (room?.room_code) {
      navigator.clipboard.writeText(room.room_code);
      showSuccess("Room code copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">Loading room...</p>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Room Not Found</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">The room you are looking for does not exist or you do not have permission to view it.</p>
        <Button onClick={() => navigate('/lobby')} variant="outline">
          Back to Lobby
        </Button>
        <MadeWithDyad />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Main Content Area (Video Player) */}
      <div className="flex-1 flex flex-col p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Room: {room.room_code}</h1>
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setIsShareRoomDialogOpen(true)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share Room Code</TooltipContent>
            </Tooltip>
            <Button onClick={() => navigate('/lobby')} variant="outline">
              <LogOut className="h-4 w-4 mr-2" /> Leave Room
            </Button>
          </div>
        </div>

        <Card className="mb-4 flex-1 flex flex-col bg-white dark:bg-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Video className="h-5 w-5 mr-2" /> Video Player
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {isHost && (
              <div className="flex space-x-2 mb-4">
                <Input
                  placeholder="Enter YouTube URL"
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleVideoUrlChange}>Set Video</Button>
              </div>
            )}
            <div className="relative pt-[56.25%] w-full bg-black rounded-md overflow-hidden"> {/* 16:9 Aspect Ratio */}
              {room.current_video_url ? (
                <ReactPlayer
                  ref={playerRef}
                  url={room.current_video_url}
                  playing={playing}
                  controls={false} // Host controls sync
                  width="100%"
                  height="100%"
                  className="absolute top-0 left-0"
                  onReady={handlePlayerReady}
                  onPlay={() => isHost && syncPlaybackState('playing', playerRef.current?.getCurrentTime() || 0)}
                  onPause={() => isHost && syncPlaybackState('paused', playerRef.current?.getCurrentTime() || 0)}
                  onSeek={(seconds) => isHost && syncPlaybackState(playing ? 'playing' : 'paused', seconds)}
                  onProgress={handleProgress}
                  onEnded={() => isHost && syncPlaybackState('unstarted', 0)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No video loaded. {isHost ? 'Enter a YouTube URL above.' : 'Waiting for host to load a video.'}
                </div>
              )}
            </div>
            {isHost && room.current_video_url && playerReady && (
              <div className="flex justify-center items-center mt-4 space-x-4">
                <Button onClick={handlePlayPause}>
                  {playing ? 'Pause' : 'Play'}
                </Button>
                {/* Simple progress bar for seeking */}
                <div
                  className="flex-1 h-2 bg-gray-300 dark:bg-gray-700 rounded-full cursor-pointer"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-blue-500 dark:bg-blue-400 rounded-full"
                    style={{ width: `${(playbackTime / (playerRef.current?.getDuration() || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar (Chat and Users) */}
      <div className="w-full lg:w-96 flex flex-col p-4 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
        <Card className="flex-1 flex flex-col mb-4 bg-gray-50 dark:bg-gray-700 shadow-none border-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" /> Participants ({roomUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-24 w-full rounded-md border p-2 bg-white dark:bg-gray-800">
              {roomUsers.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {roomUsers.map((ru) => (
                    <li key={ru.id} className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {ru.username} {ru.user_id === room.host_id && <span className="text-xs text-blue-500">(Host)</span>}
                      {ru.user_id === user?.id && <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(You)</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No other users in this room.</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-700 shadow-none border-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" /> Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 w-full rounded-md border p-4 bg-white dark:bg-gray-800" ref={chatScrollRef}>
              <div className="space-y-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${msg.user_id === user?.id ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white'}`}>
                      <p className="font-semibold text-sm mb-1">{msg.username}</p>
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs text-right mt-1 opacity-75">{new Date(msg.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="flex mt-4 space-x-2">
              <Input
                placeholder="Type your message..."
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />

      {/* Share Room Dialog */}
      <Dialog open={isShareRoomDialogOpen} onOpenChange={setIsShareRoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Room</DialogTitle>
            <DialogDescription>
              Share this room code with your friends to invite them to your watch party!
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="roomCodeShare">Room Code</Label>
            <div className="flex items-center space-x-2">
              <Input id="roomCodeShare" value={room?.room_code || ''} readOnly />
              <Button onClick={handleCopyRoomCode} size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareRoomDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Room;