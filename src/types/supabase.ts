export interface Profile {
  id: string;
  username: string | null;
  email: string | null;
  partner_email?: string | null;
  partner_nickname?: string | null;
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