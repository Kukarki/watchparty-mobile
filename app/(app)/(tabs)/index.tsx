import React, { useState, useEffect, useCallback } from 'react';
import { BackHandler } from 'react-native';
import { router } from 'expo-router';
import HubHome from '../../../wp-home/HubHome';
import YouTubePicker from '../../../youtube/YouTubePicker';
import { useAuthStore } from '@/stores/auth.store';
import { useAvatarStore } from '../../../avatar';
import { useFriendStore } from '@/stores/friend.store';
import { useRoomStore } from '@/stores/room.store';
import { roomsApi } from '@/services/api';

export default function HomeTab() {
  const { user } = useAuthStore();
  const { progression } = useAvatarStore();
  const { friends, onlineFriendIds } = useFriendStore();
  const room = useRoomStore((s) => s.currentRoom);
  const setRoom = useRoomStore((s) => s.setRoom);

  const [live, setLive] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const h = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => h.remove();
  }, []);

  const load = useCallback(async () => {
    try {
      const { data } = await roomsApi.listPublic();
      setLive(
        (data.rooms ?? []).slice(0, 8).map((r: any) => ({
          id: r.id,
          kind: 'watch',
          title: r.name,
          subtitle: `Code: ${r.code}`,
          count: r.member_count ?? 0,
          members: [],
        }))
      );
    } catch { /* silent */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const friendsOnline = friends
    .filter((f) => onlineFriendIds.has(f.userId))
    .map((f) => ({ id: f.userId, name: f.displayName || f.username || 'Friend', avatarUrl: f.avatar }));

  async function handlePick({ videoId, title, mode }: any) {
    setShowPicker(false);
    if (!videoId) return;
    try {
      const { data } = await roomsApi.create(title || 'Watch party');
      setRoom(data.room);
      router.push(`/(app)/room/${data.room.id}`);
    } catch { /* silent */ }
  }

  return (
    <>
      <HubHome
        name={user?.username ?? 'there'}
        progression={progression}
        live={live}
        friendsOnline={friendsOnline}
        resume={room ? { title: room.name, subtitle: 'Resume your room', live: false } : undefined}
refreshing={refreshing}
        onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
        onHost={() => setShowPicker(true)}
        onResume={() => room && router.push(`/(app)/room/${room.id}`)}
        onOpenLive={(item: any) => router.push(`/(app)/room/${item.id}`)}
        onOpenGames={() => router.push('/(app)/(tabs)/games')}
        onOpenMusic={() => router.push('/(app)/(tabs)/music')}
        onOpenFriends={() => router.push('/(app)/(tabs)/friends')}
        onOpenRooms={() => router.push('/(app)/(tabs)/rooms')}
        onOpenProfile={() => router.push('/(app)/(tabs)/profile')}
        onOpenSettings={() => router.push('/(app)/settings')}
      />
      <YouTubePicker
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onPick={handlePick}
      />
    </>
  );
}
