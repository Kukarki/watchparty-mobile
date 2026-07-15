import { create } from 'zustand';

export interface FriendEntry {
  userId: string;
  displayName: string;
  username?: string;
  avatar?: string;
  online: boolean;
  nickname?: string | null;
}

interface FriendState {
  friends: FriendEntry[];
  nicknames: Record<string, string>;
  onlineFriendIds: Set<string>;
  setFriends: (friends: FriendEntry[]) => void;
  setNickname: (friendId: string, nickname: string | null) => void;
  setOnline: (userId: string, online: boolean) => void;
  setOnlineFromSnapshot: (ids: string[]) => void;
  reset: () => void;
}

export const useFriendStore = create<FriendState>((set) => ({
  friends: [],
  nicknames: {},
  onlineFriendIds: new Set(),

  setFriends: (friends) => {
    const nicknames: Record<string, string> = {};
    for (const f of friends) {
      if (f.nickname) nicknames[f.userId] = f.nickname;
    }
    set((s) => ({ friends, nicknames: { ...s.nicknames, ...nicknames } }));
  },

  setNickname: (friendId, nickname) =>
    set((s) => {
      if (!nickname) {
        const { [friendId]: _, ...rest } = s.nicknames;
        return { nicknames: rest };
      }
      return { nicknames: { ...s.nicknames, [friendId]: nickname } };
    }),

  setOnline: (userId, online) =>
    set((s) => {
      const next = new Set(s.onlineFriendIds);
      online ? next.add(userId) : next.delete(userId);
      return { onlineFriendIds: next };
    }),

  setOnlineFromSnapshot: (ids) =>
    set({ onlineFriendIds: new Set(ids) }),

  reset: () => set({ friends: [], nicknames: {}, onlineFriendIds: new Set() }),
}));
