import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/constants';
import { ChatMessage, QueueItem, Room, RoomMember, User } from '@/types';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 35000,
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
    handle: user.username,
    avatar_url: user.avatar ?? user.avatar_url,
    is_guest: (user.provider ?? '').toLowerCase() === 'guest',
  };
}

export function mapRoom(room: any): Room {
  const videoState = room.videoState ?? {};
  const id = room.id ?? room.room_id ?? room.roomId ?? '';
  return {
    id,
    name: room.name,
    code: room.code ?? id,
    host_id: room.hostId ?? room.host_id ?? '',
    current_video_url: videoState.videoUrl ?? room.current_video_url ?? room.current_url ?? '',
    current_time: videoState.currentTime ?? room.current_time ?? room.video_position ?? 0,
    is_playing: videoState.isPlaying ?? room.is_playing ?? false,
    created_at: room.created_at ?? room.joinedAt ?? new Date().toISOString(),
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
    added_by_name: item.added_by_name,
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
  supabaseCallback: (supabaseToken: string, displayName?: string, avatar?: string) =>
    api.post('/auth/supabase-callback', { supabaseToken, displayName, avatar })
      .then((res) => ({ ...res, data: { ...res.data, user: mapUser(res.data.user) } })),
  me: () => api.get('/auth/me')
    .then((res) => ({ ...res, data: { ...res.data, user: mapUser(res.data.user) } })),
  updateProfile: (fields: { displayName?: string; avatar?: string }) =>
    api.patch('/auth/profile', fields)
      .then((res) => ({ ...res, data: { ...res.data, user: mapUser(res.data.user ?? {}) } })),
  deleteAccount: () => api.delete('/auth/account'),
};

// Rooms
const mapRooms = (res: any) => ({ ...res, data: { ...res.data, rooms: (res.data.rooms ?? []).map(mapRoom) } });

export const roomsApi = {
  create: (name: string) => api.post('/rooms', { name })
    .then((res) => ({ ...res, data: { ...res.data, room: mapRoom(res.data.room) } })),
  join: (code: string) => api.get(`/rooms/${code}`)
    .then((res) => ({ ...res, data: { ...res.data, room: mapRoom(res.data.room) } })),
  get: (id: string) => api.get(`/rooms/${id}`)
    .then((res) => ({ ...res, data: { ...res.data, room: mapRoom(res.data.room) } })),
  // User's own rooms (recently visited/hosted) — used in "My Rooms" tab
  recent: () => api.get('/rooms/recent').then(mapRooms),
  // All public rooms — used in "Discover" tab
  listPublic: () => api.get('/rooms').then(mapRooms),
  // Keep list() as alias for recent() so any old callsites still work
  list: () => api.get('/rooms/recent').then(mapRooms),
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
  list: (roomId: string) => queueApi.get(roomId),
  add: (roomId: string, payload: { url: string; title: string; thumbnail?: string; type?: string }) =>
    api.post(`/rooms/${roomId}/queue`, payload)
      .then((res) => ({ ...res, data: { ...res.data, item: mapQueueItem(res.data.item ?? {}) } })),
  remove: (roomId: string, itemId: string) =>
    api.delete(`/rooms/${roomId}/queue/${itemId}`),
  upvote: (roomId: string, itemId: string) =>
    api.post(`/rooms/${roomId}/queue/${itemId}/vote`)
      .then((res) => ({ ...res, data: { ...res.data, item: mapQueueItem(res.data.item ?? {}) } })),
  vote: (roomId: string, itemId: string) => queueApi.upvote(roomId, itemId),
  playNext: (roomId: string, itemId: string) =>
    api.post(`/rooms/${roomId}/queue/${itemId}/play-next`),
};

// Polls
export const pollApi = {
  active: (roomId: string) => api.get(`/rooms/${roomId}/poll/active`),
  create: (roomId: string, question: string, options: string[]) =>
    api.post(`/rooms/${roomId}/poll`, { question, options }),
  vote: (roomId: string, pollId: string, optionIndex: number) =>
    api.post(`/rooms/${roomId}/poll/${pollId}/vote/${optionIndex}`),
  end: (roomId: string, pollId: string) =>
    api.post(`/rooms/${roomId}/poll/${pollId}/end`),
};

// Friends
export const friendApi = {
  list: () => api.get('/friends'),
  requests: () => api.get('/friends/requests'),
  search: (query: string) =>
    api.get(`/friends/search?q=${encodeURIComponent(query)}`),
  send: (toUserId: string) =>
    api.post('/friends/request', { toUserId }),
  sendByEmail: (email: string) =>
    api.post('/friends/request/email', { email }),
  respond: (requestId: string, action: 'accept' | 'decline') =>
    api.post(`/friends/request/${requestId}/respond`, { action }),
  remove: (friendId: string) =>
    api.delete(`/friends/${friendId}`),
  setNickname: (friendId: string, nickname: string | null) =>
    api.put(`/friends/${friendId}/nickname`, { nickname }),
};

// Playlists
export const playlistApi = {
  list: () => api.get('/playlists'),
  create: (name: string) => api.post('/playlists', { name }),
  get: (id: string) => api.get(`/playlists/${id}`),
  getShared: (shareToken: string) => api.get(`/playlists/shared/${shareToken}`),
  update: (id: string, fields: { name?: string }) => api.patch(`/playlists/${id}`, fields),
  delete: (id: string) => api.delete(`/playlists/${id}`),
  addTrack: (id: string, track: { url: string; title: string; thumbnail?: string }) =>
    api.post(`/playlists/${id}/tracks`, track),
  removeTrack: (id: string, trackId: string) =>
    api.delete(`/playlists/${id}/tracks/${trackId}`),
  importToRoom: (id: string, roomId: string) =>
    api.post(`/playlists/${id}/import`, { roomId }),
};
