import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/constants';
import { ChatMessage, QueueItem, Room, RoomMember, User } from '@/types';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
    }
    return Promise.reject(error);
  }
);

export default api;

function mapUser(user: any): User {
  return {
    id: user.userId ?? user.id,
    email: user.email,
    username: user.displayName ?? user.username ?? 'Guest',
    avatar_url: user.avatar ?? user.avatar_url,
    is_guest: (user.provider ?? '').toLowerCase() === 'guest',
  };
}

export function mapRoom(room: any): Room {
  const videoState = room.videoState ?? {};
  return {
    id: room.id ?? room.room_id,
    name: room.name,
    code: room.code ?? room.id ?? room.room_id,
    host_id: room.hostId ?? room.host_id,
    current_video_url: videoState.videoUrl ?? room.current_video_url ?? room.current_url ?? '',
    current_time: videoState.currentTime ?? room.current_time ?? room.video_position ?? 0,
    is_playing: videoState.isPlaying ?? room.is_playing ?? false,
    created_at: room.created_at ?? new Date().toISOString(),
    member_count: room.member_count ?? 0,
  };
}

export function mapMember(member: any): RoomMember {
  return {
    user_id: member.userId ?? member.user_id,
    username: member.displayName ?? member.username ?? member.display_name ?? 'Guest',
    avatar_url: member.avatar ?? member.avatar_url,
    is_host: member.isHost ?? member.is_host ?? false,
    joined_at: member.joined_at ?? new Date().toISOString(),
    is_in_voice: member.is_in_voice ?? false,
  };
}

export function mapChatMessage(message: any): ChatMessage {
  return {
    id: message.id,
    room_id: message.room_id ?? message.roomId ?? '',
    user_id: message.userId ?? message.user_id,
    username: message.displayName ?? message.username ?? message.display_name ?? 'Guest',
    content: message.content,
    replyTo: message.replyTo ?? message.reply_to,
    created_at: message.createdAt
      ? new Date(message.createdAt).toISOString()
      : (message.created_at ?? new Date().toISOString()),
    reactions: message.reactions ?? {},
  };
}

export function mapQueueItem(item: any): QueueItem {
  return {
    id: item.id,
    room_id: item.room_id,
    title: item.title,
    url: item.url,
    added_by: item.added_by,
    upvotes: item.vote_count ?? item.upvotes ?? 0,
    thumbnail: item.thumbnail,
  };
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password })
      .then((res) => ({ ...res, data: { ...res.data, user: mapUser(res.data.user) } })),
  register: (email: string, password: string, username: string) =>
    api.post('/auth/register', { email, password, displayName: username })
      .then((res) => ({ ...res, data: { ...res.data, user: mapUser(res.data.user) } })),
  guest: (username: string) =>
    api.post('/auth/guest', { displayName: username })
      .then((res) => ({ ...res, data: { ...res.data, user: mapUser(res.data.user) } })),
  me: () => api.get('/auth/me')
    .then((res) => ({ ...res, data: { ...res.data, user: mapUser(res.data.user) } })),
};

// Rooms
export const roomsApi = {
  create: (name: string) => api.post('/rooms', { name })
    .then((res) => ({ ...res, data: { ...res.data, room: mapRoom(res.data.room) } })),
  join: (code: string) => api.get(`/rooms/${code}`)
    .then((res) => ({ ...res, data: { ...res.data, room: mapRoom(res.data.room) } })),
  get: (id: string) => api.get(`/rooms/${id}`)
    .then((res) => ({ ...res, data: { ...res.data, room: mapRoom(res.data.room) } })),
  list: () => api.get('/rooms')
    .then((res) => ({ ...res, data: { ...res.data, rooms: (res.data.rooms ?? []).map(mapRoom) } })),
  getMembers: (_id: string) => Promise.resolve({ data: { members: [] as RoomMember[] } }),
  leave: (_id: string) => Promise.resolve({ data: { ok: true } }),
};

// Chat
export const chatApi = {
  getHistory: (roomId: string, limit = 50) =>
    api.get(`/rooms/${roomId}/chat?count=${limit}`)
      .then((res) => ({ ...res, data: { ...res.data, messages: (res.data.messages ?? []).map(mapChatMessage) } })),
};

// Queue
export const queueApi = {
  get: (roomId: string) => api.get(`/rooms/${roomId}/queue`)
    .then((res) => ({ ...res, data: { ...res.data, items: (res.data.queue ?? []).map(mapQueueItem) } })),
  add: (roomId: string, url: string, title: string) =>
    api.post(`/rooms/${roomId}/queue`, { url, title })
      .then((res) => ({ ...res, data: { ...res.data, item: mapQueueItem(res.data.item) } })),
  remove: (roomId: string, itemId: string) =>
    api.delete(`/rooms/${roomId}/queue/${itemId}`),
  upvote: (roomId: string, itemId: string) =>
    api.post(`/rooms/${roomId}/queue/${itemId}/vote`)
      .then((res) => ({ ...res, data: { ...res.data, item: mapQueueItem(res.data.item) } })),
};
