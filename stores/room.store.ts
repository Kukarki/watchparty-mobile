import { create } from 'zustand';
import { Room, RoomMember, ChatMessage, QueueItem, VideoState } from '@/types';

interface RoomState {
  currentRoom: Room | null;
  members: RoomMember[];
  messages: ChatMessage[];
  queue: QueueItem[];
  videoState: VideoState;
  isChatOpen: boolean;
  isVoiceActive: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
  typingUsers: string[];
  isScreenSharing: boolean;

  setRoom: (room: Room | null) => void;
  setMembers: (members: RoomMember[]) => void;
  addMember: (member: RoomMember) => void;
  removeMember: (userId: string) => void;
  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  setQueue: (queue: QueueItem[]) => void;
  setVideoState: (state: Partial<VideoState>) => void;
  toggleChat: () => void;
  toggleVoice: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  addTypingUser: (username: string) => void;
  removeTypingUser: (username: string) => void;
  setScreenSharing: (v: boolean) => void;
  reset: () => void;
}

const defaultVideoState: VideoState = {
  url: '',
  currentTime: 0,
  isPlaying: false,
  duration: 0,
};

export const useRoomStore = create<RoomState>((set) => ({
  currentRoom: null,
  members: [],
  messages: [],
  queue: [],
  videoState: defaultVideoState,
  isChatOpen: false,
  isVoiceActive: false,
  isMuted: true,
  isCameraOn: false,
  typingUsers: [],
  isScreenSharing: false,

  setRoom: (room) => set({ currentRoom: room }),
  setMembers: (members) => set({ members }),
  addMember: (member) =>
    set((s) => ({
      members: s.members.some((m) => m.user_id === member.user_id)
        ? s.members
        : [...s.members, member],
    })),
  removeMember: (userId) =>
    set((s) => ({ members: s.members.filter((m) => m.user_id !== userId) })),
  addMessage: (msg) =>
    set((s) => {
      if (s.messages.some((m) => m.id === msg.id)) return s;
      return { messages: [...s.messages.slice(-199), msg] };
    }),
  setMessages: (messages) => set({ messages }),
  setQueue: (queue) => set({ queue }),
  setVideoState: (state) =>
    set((s) => ({ videoState: { ...s.videoState, ...state } })),
  toggleChat: () => set((s) => ({ isChatOpen: !s.isChatOpen })),
  toggleVoice: () => set((s) => ({ isVoiceActive: !s.isVoiceActive })),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleCamera: () => set((s) => ({ isCameraOn: !s.isCameraOn })),
  addTypingUser: (username) =>
    set((s) => ({
      typingUsers: s.typingUsers.includes(username)
        ? s.typingUsers
        : [...s.typingUsers, username],
    })),
  removeTypingUser: (username) =>
    set((s) => ({ typingUsers: s.typingUsers.filter((u) => u !== username) })),
  setScreenSharing: (v) => set({ isScreenSharing: v }),
  reset: () =>
    set({
      currentRoom: null,
      members: [],
      messages: [],
      queue: [],
      videoState: defaultVideoState,
      isChatOpen: false,
      isVoiceActive: false,
      isMuted: true,
      isCameraOn: false,
      typingUsers: [],
      isScreenSharing: false,
    }),
}));
