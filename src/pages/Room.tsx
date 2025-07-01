"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { useSession } from '@/contexts/SessionContext'; // Corrected import path
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import ReactPlayer from 'react-player';
import { Input } from '@/components/ui/input';
import { Send, Play, Pause, FastForward, Rewind, Volume2, VolumeX, Users, MessageSquare, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface RoomData {
  id: string;
  room_code: string;
  host_username: string;
  current_video_id: string;
  playback_status: 'unstarted' | 'playing' | 'paused' | 'ended';
  current_playback_time: number;
  last_updated_at: string;
}

interface ChatMessage {
  id: number;
  created_at: string;
  room_id: string;
  username: string;
  message: string;
}

const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, isLoading } = useSession();

  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [videoUrlInput, setVideoUrlInput] = useState('');

  const playerRef = useRef<ReactPlayer>(null);
  const chatScrollRef = useRef<HTMLDivSlement>(null);

  const isHost = user?.user_metadata.nickname === roomData?.host_username || user?.email === roomData?.host_username;

  const parseYouTubeVideoId = (url: string): string | null => {
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
  };

  const updateRoomPlayback = useCallback(async (status: 'playing' | 'paused' | 'ended', time: number) => {
    if (!roomData || !user || !isHost) return;

    const { error } = await supabase
      .from('rooms')
      .update({
        playback_status: status,
        current_playback_time: time,
        last_updated_at: new Date().toISOString(),
      })
      .eq('id', roomData.id);

    if (error) {
      console.error('Error updating room playback:', error.message);
      showError('Failed to sync playback.');
    }
  }, [roomData, user, isHost]);

  const handlePlay = useCallback(() => {
    if (isHost) updateRoomPlayback('playing', playerRef.current?.getCurrentTime() || 0);
  }, [isHost, updateRoomPlayback]);

  const handlePause = useCallback(() => {
    if (isHost) updateRoomPlayback('paused', playerRef.current?.getCurrentTime() || 0);
  }, [isHost, updateRoomPlayback]);

  const handleSeek = useCallback((time: number) => {
    if (isHost) updateRoomPlayback(roomData?.playback_status || 'paused', time);
  }, [isHost, updateRoomPlayback, roomData?.playback_status]);

  const handleProgress = useCallback((state: { playedSeconds: number }) => {
    // Only host updates the time frequently
    if (isHost && roomData?.playback_status === 'playing') {
      // Debounce or only update every few seconds to reduce writes
      // For simplicity, we'll update on play/pause/seek and let real-time handle small drifts
    }
  }, [isHost, roomData?.playback_status]);

  const handleEnded = useCallback(() => {
    if (isHost) updateRoomPlayback('ended', playerRef.current?.getDuration() || 0);
  }, [isHost, updateRoomPlayback]);

  const handleSetVideo = async () => {
    if (!roomData || !user || !isHost) {
      showError("You are not the host or room data is missing.");
      return;
    }
    const videoId = parseYouTubeVideoId(videoUrlInput);
    if (!videoId) {
      showError("Please enter a valid YouTube URL.");
      return;
    }

    const { error } = await supabase
      .from('rooms')
      .update({
        current_video_id: videoId,
        playback_status: 'unstarted', // Reset status when new video is set
        current_playback_time: 0,
        last_updated_at: new Date().toISOString(),
      })
      .eq('id', roomData.id);

    if (error) {
      console.error('Error setting video:', error.message);
      showError('Failed to set video.');
    } else {
      showSuccess('Video updated successfully!');
      setVideoUrlInput(''); // Clear input after setting
    }
  };

  const handleSendMessage = async () => {
    if (!user || !roomData || !newChatMessage.trim()) return;

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomData.id,
        username: user.user_metadata.nickname || user.email,
        message: newChatMessage.trim(),
      });

    if (error) {
      console.error('Error sending message:', error.message);
      showError('Failed to send message.');
    } else {
      setNewChatMessage('');
    }
  };

  const copyRoomCodeToClipboard = () => {
    if (roomData?.room_code) {
      navigator.clipboard.writeText(roomData.room_code);
      showSuccess('Room code copied to clipboard!');
    }
  };

  useEffect(() => {
    const fetchRoomData = async () => {
      if (!roomId) {
        showError("No room ID provided.");
        navigate('/lobby');
        return;
      }

      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomId)
        .single();

      if (error || !data) {
        console.error('Error fetching room:', error?.message || 'Room not found');
        showError("Room not found or an error occurred.");
        navigate('/lobby');
        return;
      }
      setRoomData(data);
      setLoadingRoom(false);
    };

    const fetchChatMessages = async () => {
      if (!roomData?.id) return;
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomData.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching chat messages:', error.message);
      } else {
        setChatMessages(data || []);
      }
    };

    if (!isLoading && user) {
      fetchRoomData();
    } else if (!isLoading && !user) {
      navigate('/login');
    }
  }, [roomId, isLoading, user, navigate]);

  useEffect(() => {
    if (!roomData?.id) return;

    // Subscribe to room changes
    const roomChannel = supabase
      .channel(`room:${roomData.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomData.id}` },
        (payload) => {
          const updatedRoom = payload.new as RoomData;
          setRoomData(updatedRoom);
          // Sync player state if not host or if host's state is out of sync
          if (playerRef.current && (!isHost || (isHost && updatedRoom.playback_status !== playerRef.current.props.playing))) {
            if (updatedRoom.playback_status === 'playing' && !playerRef.current.props.playing) {
              playerRef.current.seekTo(updatedRoom.current_playback_time, 'seconds');
              playerRef.current.getInternalPlayer().playVideo();
            } else if (updatedRoom.playback_status === 'paused' && playerRef.current.props.playing) {
              playerRef.current.seekTo(updatedRoom.current_playback_time, 'seconds');
              playerRef.current.getInternalPlayer().pauseVideo();
            } else if (updatedRoom.playback_status === 'unstarted' && updatedRoom.current_video_id !== playerRef.current.props.url) {
              // This case handles new video being set
              playerRef.current.seekTo(0, 'seconds');
              playerRef.current.getInternalPlayer().stopVideo(); // Or loadVideoById
            }
          }
        }
      )
      .subscribe();

    // Subscribe to chat messages
    const chatChannel = supabase
      .channel(`chat:${roomData.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomData.id}` },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setChatMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    // Initial fetch for chat messages
    const fetchInitialChatMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomData.id)
        .order('created_at', { ascending: true });
      if (error) {
        console.error('Error fetching initial chat messages:', error.message);
      } else {
        setChatMessages(data || []);
      }
    };
    fetchInitialChatMessages();

    return () => {
      supabase.removeChannel(roomChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [roomData?.id, isHost]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

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
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Main Content Area (Video Player & Controls) */}
      <div className="flex-1 flex flex-col p-4 lg:p-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Room: {roomData.room_code}</h1>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={copyRoomCodeToClipboard}>
                <Copy className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy Room Code</TooltipContent>
          </Tooltip>
          <Button onClick={() => navigate('/lobby')} variant="outline">
            Back to Lobby
          </Button>
        </div>

        <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden shadow-xl mb-4">
          <ReactPlayer
            ref={playerRef}
            url={`https://www.youtube.com/watch?v=${roomData.current_video_id}`}
            playing={roomData.playback_status === 'playing'}
            controls={false} // Custom controls below
            width="100%"
            height="100%"
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onProgress={handleProgress}
            config={{
              youtube: {
                playerVars: {
                  modestbranding: 1,
                  rel: 0,
                  showinfo: 0,
                  iv_load_policy: 3,
                },
              },
            }}
          />
        </div>

        {isHost && (
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex gap-2">
              <Input
                placeholder="YouTube video URL"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              />
              <Button onClick={handleSetVideo}>Set Video</Button>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => playerRef.current?.seekTo(playerRef.current.getCurrentTime() - 10, 'seconds')} variant="outline" size="icon">
                <Rewind className="w-5 h-5" />
              </Button>
              <Button onClick={() => playerRef.current?.getInternalPlayer().playVideo()} disabled={roomData.playback_status === 'playing'} variant="outline" size="icon">
                <Play className="w-5 h-5" />
              </Button>
              <Button onClick={() => playerRef.current?.getInternalPlayer().pauseVideo()} disabled={roomData.playback_status === 'paused'} variant="outline" size="icon">
                <Pause className="w-5 h-5" />
              </Button>
              <Button onClick={() => playerRef.current?.seekTo(playerRef.current.getCurrentTime() + 10, 'seconds')} variant="outline" size="icon">
                <FastForward className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {!isHost && (
          <div className="text-center text-gray-600 dark:text-gray-400 mb-4">
            You are a viewer. Only the host ({roomData.host_username}) can control playback.
          </div>
        )}
      </div>

      {/* Chat and User List Sidebar */}
      <div className="w-full lg:w-80 flex flex-col bg-white dark:bg-gray-800 p-4 lg:p-6 shadow-lg rounded-lg lg:rounded-l-none lg:rounded-r-lg">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" /> Chat
        </h2>
        <ScrollArea className="flex-1 mb-4 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600" ref={chatScrollRef}>
          {chatMessages.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">No messages yet. Say hello!</p>
          ) : (
            chatMessages.map((msg) => (
              <div key={msg.id} className="mb-2">
                <span className="font-semibold text-blue-600 dark:text-blue-400">{msg.username}:</span> {msg.message}
              </div>
            ))
          )}
        </ScrollArea>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Type your message..."
            value={newChatMessage}
            onChange={(e) => setNewChatMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500"
          />
          <Button onClick={handleSendMessage} size="icon">
            <Send className="w-5 h-5" />
          </Button>
        </div>

        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" /> Participants
        </h2>
        <div className="flex flex-wrap gap-2">
          {/* For now, just show the host. Realtime presence for all users is more complex. */}
          <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full text-blue-800 dark:text-blue-200 text-sm">
            <Avatar className="w-6 h-6">
              <AvatarImage src="" alt="Host Avatar" />
              <AvatarFallback className="bg-blue-300 dark:bg-blue-700 text-blue-900 dark:text-blue-100 text-xs">H</AvatarFallback>
            </Avatar>
            {roomData.host_username} (Host)
          </div>
          {/* Add other participants here if using Supabase Realtime Presence */}
        </div>
      </div>
    </div>
  );
};

export default Room;