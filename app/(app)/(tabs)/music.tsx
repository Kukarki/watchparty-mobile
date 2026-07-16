import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { MusicLobbyScreen } from '../../../wp-ui';
import { useRoomStore } from '@/stores/room.store';
import { roomsApi } from '@/services/api';
import { hapticSuccess, hapticError } from '@/services/haptics';

export default function MusicTab() {
  const setRoom = useRoomStore((s) => s.setRoom);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    roomsApi.listPublic()
      .then(({ data }) =>
        setRooms(
          (data.rooms ?? []).map((r: any) => ({
            id: r.id, title: r.name,
            nowPlaying: 'Music room', count: r.member_count ?? 0, tags: ['all'],
          }))
        )
      )
      .catch(() => {});
  }, []);

  async function handleCreate() {
    try {
      const { data } = await roomsApi.create('Music Room');
      setRoom(data.room);
      hapticSuccess();
      router.push(`/(app)/room/${data.room.id}`);
    } catch {
      hapticError();
      Toast.show({ type: 'error', text1: 'Could not create music room' });
    }
  }

  return (
    <MusicLobbyScreen
      rooms={rooms}
      onOpen={(room: any) => {
        setRoom({ id: room.id, name: room.title } as any);
        router.push(`/(app)/room/${room.id}`);
      }}
      onCreate={handleCreate}
    />
  );
}
