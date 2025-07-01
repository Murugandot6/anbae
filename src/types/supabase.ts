// src/types/supabase.ts

export interface Profile {
  id: string;
  username: string | null;
  email: string | null;
  partner_email?: string | null;
  partner_nickname?: string | null;
  created_at?: string;
  avatar_url?: string | null;
  lifetime_score?: number | null;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string;
  content: string;
  created_at: string;
  is_read: boolean;
  message_type: string;
  priority: string;
  mood: string;
  read_at: string | null;
  parent_message_id: string | null;
  senderProfile?: Profile | null;
  receiverProfile?: Profile | null;
  replies?: Message[];
  status: 'open' | 'closed';
}

export interface ClearRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'denied' | 'completed';
  sender_message: string | null;
  receiver_response_message: string | null;
  created_at: string;
  updated_at: string;
  senderProfile?: Profile | null;
  receiverProfile?: Profile | null;
}

export interface Room {
  id: string;
  created_at: string;
  room_code: string;
  host_id: string;
  current_video_url: string | null;
  playback_status: 'playing' | 'paused' | 'unstarted';
  current_playback_time: number;
  last_updated_at: string;
}

export interface ChatMessage {
  id: number;
  created_at: string;
  room_id: string;
  user_id: string;
  username: string;
  message: string;
}

export interface RoomUser {
  id: number;
  created_at: string;
  room_id: string;
  user_id: string;
  username: string;
}