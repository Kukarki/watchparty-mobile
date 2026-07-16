import React, { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { RoomsScreen } from '../../../wp-ui';
import { useRoomStore } from '@/stores/room.store';
import { roomsApi } from '@/services/api';
import { hapticSuccess, hapticError } from '@/services/haptics';

export default function RoomsTab() {
  const setRoom = useRoomStore((s) => s.setRoom);
  const [myRooms, setMyRooms] = useState([]);
  const [discover, setDiscover] = useState([]);

  const load = useCallback(async () => {
    try {
      const [mine, pub] = await Promise.all([
        roomsApi.recent().catch(() => ({ data: { rooms: [] } })),
        roomsApi.listPublic().catch(() => ({ data: { rooms: [] } })),
      ]);
      setMyRooms(
        (mine.data.rooms ?? []).map((r: any) => ({
          id: r.id, title: r.name, code: r.code,
          count: r.member_count ?? 0, live: false,
        }))
      );
      setDiscover(
        (pub.data.rooms ?? []).map((r: any) => ({
          id: r.id, title: r.name, code: r.code,
          count: r.member_count ?? 0, live: false,
          hostName: r.host?.username,
        }))
      );
    } catch { /* silent */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    try {
      const { data } = await roomsApi.create('My Room');
      setRoom(data.room);
      hapticSuccess();
      router.push(`/(app)/room/${data.room.id}`);
    } catch {
      hapticError();
      Toast.show({ type: 'error', text1: 'Could not create room' });
    }
  }

  async function handleJoinCode(code: string) {
    try {
      const { data } = await roomsApi.join(code.trim());
      setRoom(data.room);
      hapticSuccess();
      router.push(`/(app)/room/${data.room.id}`);
    } catch {
      hapticError();
      Toast.show({ type: 'error', text1: 'Room not found or code invalid' });
    }
  }

  return (
    <RoomsScreen
      myRooms={myRooms}
      discover={discover}
      onOpenRoom={(room: any) => {
        setRoom({ id: room.id, name: room.title, code: room.code } as any);
        router.push(`/(app)/room/${room.id}`);
      }}
      onCreate={handleCreate}
      onJoinCode={handleJoinCode}
    />
  );
}
