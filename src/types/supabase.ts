export interface Profile {
  id: string;
  username: string | null;
  email: string | null;
  partner_email: string | null;
  partner_nickname: string | null;
  created_at: string;
  user_id: string | null;
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
  senderProfile?: Profile | null;
  receiverProfile?: Profile | null;
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