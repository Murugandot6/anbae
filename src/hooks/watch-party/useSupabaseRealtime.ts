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
    console.log(`[Realtime Debug] Setting up channel for room: ${roomId}`); // New log
    const fetchInitialData = async () => {
      // Fetch chat messages
      const { data: msgData, error: msgError } = await supabase.from('watch_party_chat_messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true });
      if (msgError) {
        console.error('Error fetching messages:', msgError.message);
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
        console.error('Error fetching video history:', historyError.message);
        addSystemMessage(`Failed to load video history: ${historyError.message}`);
      } else {
        const formattedHistory = historyData.map((item: any) => ({
          id: item.id, videoUrl: item.video_url, addedBy: item.user_name, timestamp: new Date(item.created_at).getTime(),
        }));
        setVideoHistory(prev => [formattedHistory, ...prev]); // Ensure new items are at the top
      }
    };
    fetchInitialData();

    // Changed: Removed presence config for testing broadcast listener
    const channel = supabase.channel(`room:${roomId}`); 
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

    channel.on('broadcast', { event: 'video_state_update' }, ({ payload }) => {
      if (payload.senderId !== user.id) {
        setVideoState(payload.newState);
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
        setVideoState(payload.videoState);
      }
    });

    // New: Listener for video reactions
    channel.on('broadcast', { event: 'video_reaction' }, ({ payload }) => {
      console.log(`[Reaction Debug] Listener triggered for video_reaction! Payload:`, payload); // New log
      const { emoji, senderId } = payload;
      console.log(`[Reaction Debug] Received reaction: ${emoji} from sender: ${senderId}`); 
      const reactionId = `${emoji}-${Date.now()}-${Math.random()}`; 
      
      setActiveReactions(prev => {
        const newReactions = [...prev, { id: reactionId, emoji, timestamp: Date.now() }];
        console.log(`[Reaction Debug] Active reactions updated:`, newReactions); 
        return newReactions;
      });

      // Schedule removal of the reaction after 5 seconds
      setTimeout(() => {
        setActiveReactions(prev => {
          const filtered = prev.filter(r => r.id !== reactionId);
          console.log(`[Reaction Debug] Reaction removed. Remaining:`, filtered); 
          return filtered;
        });
      }, 5000); 
    });

    // --- LISTENER FOR SELF-BROADCAST TEST ---
    channel.on('broadcast', { event: 'test_broadcast' }, (payload) => {
      console.log(`[Realtime Debug] Self-broadcast test received! Payload:`, payload);
    });
    // --- END LISTENER FOR SELF-BROADCAST TEST ---

    channel.on('presence', { event: 'join' }, ({ newPresences }) => newPresences.forEach((p: any) => {
        if(p.user_name) addSystemMessage(`${p.user_name} joined.`)
    }));
    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => leftPresences.forEach((p: any) => {
        if(p.user_name) addSystemMessage(`${p.user_name} left.`)
    }));

    channel.subscribe(async (status, err) => { // Added err parameter
      console.log(`[Realtime Debug] Channel subscription status: ${status}`); // New log
      if (status === 'SUBSCRIBED') {
        setIsConnectedToRealtime(true); // Set connected to true
        console.log(`[Realtime Debug] Channel ref after subscribe:`, channelRef.current); // New log
        // Removed channel.track for presence as presence config is removed
        channel.send({ type: 'broadcast', event: 'REQUEST_VIDEO_STATE', payload: { senderId: user.id } });

        // --- SELF-BROADCAST TEST ---
        console.log("[Realtime Debug] Attempting self-broadcast test...");
        channel.send({
          type: 'broadcast',
          event: 'test_broadcast',
          payload: { message: 'Hello from self-broadcast test!', senderId: user.id }
        });
        // --- END SELF-BROADCAST TEST ---

      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') { // Handle other error states
        setIsConnectedToRealtime(false); // Set connected to false
        console.error(`Realtime channel error or closed: ${status}`, err);
        toast.error(`Realtime connection lost: ${err?.message || 'Please refresh.'}`);
      }
    });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnectedToRealtime(false); // Ensure state is reset on unmount
      }
    };
  }, [roomId, user.id, user.name, addSystemMessage]);

  const sendVideoAction = useCallback((action: VideoAction) => {
    setVideoState(currentState => {
      const newState = videoStateReducer(currentState, action);
      if (newState === currentState) {
        return currentState;
      }
      const newStateWithTimestamp: VideoState = { ...newState, timestamp: Date.now() };
      if (channelRef.current && isConnectedToRealtime) { // Only send if connected
        channelRef.current.send({
          type: 'broadcast',
          event: 'video_state_update',
          payload: { newState: newStateWithTimestamp, senderId: user.id },
        });
      } else {
        console.warn("[Realtime Debug] Not connected to send video state update.");
      }
      return newStateWithTimestamp;
    });
  }, [user.id, isConnectedToRealtime]);

  const sendMessage = useCallback(async (text: string) => {
    if (!isConnectedToRealtime) { // Only send if connected
      toast.error("Cannot send message: Not connected to room.");
      return;
    }
    const { error } = await supabase.from('watch_party_chat_messages').insert({
      room_id: roomId, user_id: user.id, author_name: user.name, text: text,
    });
    if (error) {
      console.error('Error sending message:', error.message);
      addSystemMessage(`Could not send message: ${error.message}`);
    }
  }, [roomId, user.id, user.name, addSystemMessage, isConnectedToRealtime]);

  // New: Function to send a video reaction
  const sendVideoReaction = useCallback((emoji: string) => {
    if (channelRef.current && isConnectedToRealtime) { // Only send if connected
      console.log(`[Reaction Debug] Sending reaction: ${emoji} from user: ${user.id}`); 
      console.log(`[Reaction Debug] Channel ref current before send:`, channelRef.current); // New log
      channelRef.current.send({
        type: 'broadcast',
        event: 'video_reaction',
        payload: { emoji, senderId: user.id },
      });
      // Optionally, log to database for history/analytics
      supabase.from('reactions').insert({ room_id: roomId, emoji, created_at: new Date().toISOString() }).then(({ error }) => {
        if (error) console.error('Error logging reaction to DB:', error.message);
      });
    } else {
      console.warn("[Reaction Debug] Channel not connected, cannot send reaction.");
      toast.error("Cannot send reaction: Not connected to room.");
    }
  }, [roomId, user.id, isConnectedToRealtime]);

  const changeVideoSource = useCallback(async (newUrl: string) => {
    if (!newUrl.trim()) return;

    const { error: updateError } = await supabase
      .from('watch_party_rooms')
      .update({ video_url: newUrl })
      .eq('id', roomId);

    if (updateError) {
      console.error('Error updating video source:', updateError);
      addSystemMessage(`Error: Could not change video. ${updateError.message}`);
      return;
    }
    
    const { error: historyError } = await supabase
      .from('watch_party_video_history')
      .insert({ room_id: roomId, user_id: user.id, user_name: user.name, video_url: newUrl });

    if (historyError) {
      console.error('Error adding to video history:', historyError.message);
    }
    
    sendVideoAction({ type: 'source', payload: newUrl });
  }, [roomId, user.id, user.name, sendVideoAction, addSystemMessage]);

  return { videoState, sendVideoAction, messages, sendMessage, sendVideoReaction, changeVideoSource, videoHistory, activeReactions, isConnectedToRealtime };
};