export interface User {
  id: string;
  email?: string;
  username: string;
  avatar_url?: string;
  is_guest: boolean;
}

export interface Room {
  id: string;
  name: string;
  code: string;
  host_id: string;
  current_video_url?: string;
  current_time: number;
  is_playing: boolean;
  created_at: string;
  member_count?: number;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  content: string;
  replyTo?: string;
  created_at: string;
  reactions?: Record<string, string[]>;
}

export interface QueueItem {
  id: string;
  room_id: string;
  title: string;
  url: string;
  added_by: string;
  upvotes: number;
  thumbnail?: string;
}

export interface RoomMember {
  user_id: string;
  username: string;
  avatar_url?: string;
  is_host: boolean;
  joined_at: string;
  is_in_voice?: boolean;
}

export interface Poll {
  id: string;
  room_id: string;
  question: string;
  options: PollOption[];
  created_by: string;
  is_active: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface VideoState {
  url: string;
  currentTime: number;
  isPlaying: boolean;
  duration: number;
}

export type AuthMode = 'login' | 'register' | 'guest';
