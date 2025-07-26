// src/types/supabase.ts

export interface Profile {
  id: string;
  username: string | null; // Explicitly defined
  email: string | null;
  partner_email?: string | null;
  partner_nickname?: string | null;
  created_at?: string; // Added created_at as it's in the table
  avatar_url?: string | null; // New: URL to the user's selected avatar
  lifetime_score?: number | null; // New: Lifetime score for the user
  last_watch_party_room_id?: string | null; // New: ID of the last watch party room
  relationship_status?: string | null; // New: User's relationship status
}

export interface Message {
  id: string;
  user_id: string; // Added missing user_id
  sender_id: string;
  receiver_id: string;
  author_name: string; // Added missing author_name
  subject: string;
  content: string;
  created_at: string;
  is_read: boolean;
  message_type: string;
  priority: string;
  mood: string;
  read_at: string | null;
  parent_message_id: string | null; // New: Link to parent message for threading
  senderProfile?: Profile | null;
  receiverProfile?: Profile | null;
  replies?: Message[]; // New: For nested replies in UI
  status: 'open' | 'closed'; // New: Status of the message
  sendingStatus?: 'sending' | 'sent' | 'failed'; // Added missing sendingStatus
  hasUnreadReplies?: boolean; // NEW: Indicates if this message has unread replies
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

export interface JournalEntry {
  id: string;
  created_at: string;
  heading: string | null;
  mood: string | null;
  content: string;
  emoji: string | null;
  user_id: string; // Added user_id for consistency with DB schema
}

export interface Reaction {
  id: string;
  room_id: string;
  emoji: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
  actorProfile?: Profile | null; // Profile of the user who triggered the notification
}