import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VideoState, VideoAction, ChatMessage, User, VideoHistoryEntry } from '@/types/watchParty';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner'; // Import toast for user feedback

// Reducer function to calculate the next state based on an action.
const videoStateReducer = (state: VideoState, action: VideoAction): VideoState => {
  switch (action.type) {
    case 'play':
      return { ...state, isPlaying: true, time: action.payload };
    case 'pause':
      return { ...state, isPlaying: false, time: action.payload };
    case 'seek':
      return { ...state, time: action.payload };
    case 'durationchange':
      // Only update if duration is valid and has actually changed.
      return action.payload > 0 && state.duration !== action.payload 
        ? { ...state, duration: action.payload } 
        : state;
    case 'source':
      return { ...state, source: action.payload, time: 0, isPlaying: false, duration: 0 };
    default:
      return state;
  }
};

export const useSupabaseRealtime = (roomId: string, initialVideoUrl: string | null, user: User) => {
  const [videoState, setVideoState] = useState<VideoState>({
    isPlaying: false,
    time: 0,
    source: initialVideoUrl,
    duration: 0,
    timestamp: Date.now(),
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [videoHistory, setVideoHistory] = useState<VideoHistoryEntry[]>([]);
  const [activeReactions, setActiveReactions] = useState<{ id: string; emoji: string; timestamp: number; }[]>([]); // New state for video reactions
  const [isConnectedToRealtime, setIsConnectedToRealtime] = useState(false); // New state for connection status
  const channelRef = useRef<RealtimeChannel | null>(null);
  const hasSyncedRef = useRef(false);
  
  const videoStateRef = useRef(videoState);
  useEffect(() => {
    videoStateRef.current = videoState;
  }, [videoState]);

  const addSystemMessage = useCallback((text: string) => {
    const systemMessage: ChatMessage = {
      id: `sys_${Date.now()}`,
      author: 'System',
      text: text,
      timestamp: Date.now(),
      isSystem: true,
    };
    setMessages(prev => [...prev, systemMessage]);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch chat messages
      const { data: msgData, error: msgError } = await supabase.from('watch_party_chat_messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true });
      if (msgError) {
        addSystemMessage(`Failed to load chat history: ${msgError.message}`);
      } else {
        const formattedMessages = msgData.map((msg: any) => ({
          id: msg.id, author: msg.author_name, text: msg.text, timestamp: new Date(msg.created_at).getTime(),
        }));
        setMessages(formattedMessages);
      }

      // Fetch video history
      const { data: historyData, error: historyError } = await supabase.from('watch_party_video_history').select('*').eq('room_id', roomId).order('created_at', { ascending: false });
      if (historyError) {
        addSystemMessage(`Failed to load video history: ${historyError.message}`);
      } else {
        const formattedHistory = historyData.map((item: any) => ({
          id: item.id, videoUrl: item.video_url, addedBy: item.user_name, timestamp: new Date(item.created_at).getTime(),
        }));
        setVideoHistory(prev => [...formattedHistory, ...prev]);
      }
    };
    fetchInitialData();

    const channel = supabase.channel(`room-${roomId}`, { config: { presence: { key: user.id } } }); 
    channelRef.current = channel;

    // Subscription for new chat messages
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'watch_party_chat_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
      const newMessage: any = payload.new;
      setMessages(prev => [...prev, {
        id: newMessage.id, author: newMessage.author_name, text: newMessage.text, timestamp: new Date(newMessage.created_at).getTime(),
      }]);
    });

    // Subscription for new video history entries
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'watch_party_video_history', filter: `room_id=eq.${roomId}` }, (payload) => {
      const newHistoryItem: any = payload.new;
      const formattedItem = {
        id: newHistoryItem.id, videoUrl: newHistoryItem.video_url, addedBy: newHistoryItem.user_name, timestamp: new Date(newHistoryItem.created_at).getTime(),
      };
      setVideoHistory(prev => [formattedItem, ...prev]);
    });

    // New: Listener for video reactions via broadcast
    channel.on('broadcast', { event: 'reaction_sent' }, ({ payload }) => {
      // Prevent the sender from processing their own broadcast
      if (payload.senderId === user.id) {
        return;
      }

      const { emoji } = payload;
      const reactionId = `${emoji}-${Date.now()}-${Math.random()}`; // Unique ID for animation
      
      setActiveReactions(prev => [...prev, { id: reactionId, emoji, timestamp: Date.now() }]);

      setTimeout(() => {
        setActiveReactions(prev => prev.filter(r => r.id !== reactionId));
      }, 5000); 
    });

    // Existing broadcast listeners for video state
    channel.on('broadcast', { event: 'video_state_update' }, ({ payload }) => {
      if (payload.senderId !== user.id) {
        setVideoState(currentState => {
          if (payload.newState.timestamp > currentState.timestamp) {
            return payload.newState;
          }
          return currentState;
        });
      }
    });
    
    channel.on('broadcast', { event: 'REQUEST_VIDEO_STATE' }, ({ payload }) => {
      if (payload.senderId !== user.id && videoStateRef.current) {
        channel.send({
          type: 'broadcast', event: 'SYNC_VIDEO_STATE', payload: { videoState: videoStateRef.current, senderId: user.id },
        });
      }
    });

    channel.on('broadcast', { event: 'SYNC_VIDEO_STATE' }, ({ payload }) => {
      if (payload.senderId !== user.id) {
        setVideoState(currentState => {
          if (!hasSyncedRef.current || payload.videoState.timestamp > currentState.timestamp) {
            hasSyncedRef.current = true;
            return payload.videoState;
          }
          return currentState;
        });
      }
    });

    channel.on('presence', { event: 'join' }, ({ newPresences }) => newPresences.forEach((p: any) => {
        if(p.user_name) addSystemMessage(`${p.user_name} joined.`)
    }));
    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => leftPresences.forEach((p: any) => {
        if(p.user_name) addSystemMessage(`${p.user_name} left.`)
    }));

    channel.subscribe(async (status, err) => {
      if (status === 'SUBSCRIBED') {
        setIsConnectedToRealtime(true);
        hasSyncedRef.current = false;
        await channel.track({ user_name: user.name, joined_at: new Date().toISOString() });
        channel.send({ type: 'broadcast', event: 'REQUEST_VIDEO_STATE', payload: { senderId: user.id } });

      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        setIsConnectedToRealtime(false);
        toast.error(`Realtime connection lost: ${err?.message || 'Please refresh.'}`);
      }
    });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnectedToRealtime(false);
      }
    };
  }, [roomId, addSystemMessage, user.name, user.id]);

  const sendVideoAction = useCallback((action: VideoAction) => {
    setVideoState(currentState => {
      const newState = videoStateReducer(currentState, action);
      if (newState === currentState) {
        return currentState;
      }
      const newStateWithTimestamp: VideoState = { ...newState, timestamp: Date.now() };
      if (channelRef.current && isConnectedToRealtime) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'video_state_update',
          payload: { newState: newStateWithTimestamp, senderId: user.id },
        });
      }
      return newStateWithTimestamp;
    });
  }, [user.id, isConnectedToRealtime]);

  const sendMessage = useCallback(async (text: string) => {
    const { error } = await supabase.from('watch_party_chat_messages').insert({
      room_id: roomId, user_id: user.id, author_name: user.name, text: text,
    });
    if (error) {
      addSystemMessage(`Could not send message: ${error.message}`);
    }
  }, [roomId, user.id, user.name, addSystemMessage]);

  const sendVideoReaction = useCallback(async (emoji: string) => {
    // 1. Optimistic UI update for the sender for instant feedback
    const optimisticId = `optimistic-${Date.now()}`;
    setActiveReactions(prev => [...prev, { id: optimisticId, emoji, timestamp: Date.now() }]);
    setTimeout(() => {
      setActiveReactions(prev => prev.filter(r => r.id !== optimisticId));
    }, 5000); // Animation duration

    // 2. Save to database
    const { error } = await supabase.from('reactions').insert({
      room_id: roomId,
      emoji: emoji,
      user_id: user.id,
    });

    if (error) {
      toast.error(`Failed to send reaction: ${error.message}`);
      // Rollback optimistic update on failure
      setActiveReactions(prev => prev.filter(r => r.id !== optimisticId));
    } else {
      // 3. Broadcast to other clients
      if (channelRef.current?.state === 'joined') {
        channelRef.current.send({
          type: 'broadcast',
          event: 'reaction_sent',
          payload: { emoji, senderId: user.id },
        });
      }
    }
  }, [roomId, user.id]);

  const changeVideoSource = useCallback(async (newUrl: string) => {
    if (!newUrl.trim()) return;

    const { error: updateError } = await supabase
      .from('watch_party_rooms')
      .update({ video_url: newUrl })
      .eq('id', roomId);

    if (updateError) {
      addSystemMessage(`Error: Could not change video. ${updateError.message}`);
      return;
    }
    
    const { error: historyError } = await supabase
      .from('watch_party_video_history')
      .insert({ room_id: roomId, user_id: user.id, user_name: user.name, video_url: newUrl });

    if (historyError) {
      // Handle error silently for now
    }
    
    sendVideoAction({ type: 'source', payload: newUrl });
  }, [roomId, user.id, user.name, sendVideoAction, addSystemMessage]);

  return { videoState, sendVideoAction, messages, sendMessage, sendVideoReaction, changeVideoSource, videoHistory, activeReactions, isConnectedToRealtime };
};