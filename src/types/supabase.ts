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
  parent_message_id: string | null; // New: Link to parent message for threading
  senderProfile?: Profile | null;
  receiverProfile?: Profile | null;
  replies?: Message[]; // New: For nested replies in UI
  status: 'open' | 'closed'; // New: Status of the message
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