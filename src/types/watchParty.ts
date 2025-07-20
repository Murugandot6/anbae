export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Room {
  id: string;
  title: string;
  videoUrl: string | null;
  room_code: string;
}

export interface ChatMessage {
  id: string;
  author: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  reactions?: string[]; // Added for emoji reactions
}

export interface VideoState {
  isPlaying: boolean;
  time: number;
  source: string | null;
  duration: number;
  timestamp: number; // The server timestamp of when this state was set
}

export type VideoActionType = 'play' | 'pause' | 'seek' | 'source' | 'durationchange';

export interface VideoAction {
  type: VideoActionType;
  payload?: any;
}

export interface VideoHistoryEntry {
  id: string;
  videoUrl: string;
  addedBy: string;
  timestamp: number;
}