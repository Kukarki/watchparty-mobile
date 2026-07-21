import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal, Pressable, StyleSheet, TextInput, View, Text, KeyboardAvoidingView, Platform,
} from 'react-native';
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
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [creating, setCreating] = useState(false);

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

  async function handleConfirmCreate() {
    const name = roomName.trim() || 'My Room';
    setCreating(true);
    try {
      const { data } = await roomsApi.create(name);
      setRoom(data.room);
      hapticSuccess();
      setShowCreate(false);
      setRoomName('');
      router.push(`/(app)/room/${data.room.id}` as any);
    } catch {
      hapticError();
      Toast.show({ type: 'error', text1: 'Could not create room' });
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinCode(code: string) {
    try {
      const { data } = await roomsApi.join(code.trim());
      setRoom(data.room);
      hapticSuccess();
      router.push(`/(app)/room/${data.room.id}` as any);
    } catch {
      hapticError();
      Toast.show({ type: 'error', text1: 'Room not found or code invalid' });
    }
  }

  return (
    <>
      <RoomsScreen
        myRooms={myRooms}
        discover={discover}
        onOpenRoom={(room: any) => {
          setRoom({ id: room.id, name: room.title, code: room.code } as any);
          router.push(`/(app)/room/${room.id}` as any);
        }}
        onCreate={() => { setRoomName(''); setShowCreate(true); }}
        onJoinCode={handleJoinCode}
      />

      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={st.backdrop}>
          <Pressable style={st.backdropTouch} onPress={() => setShowCreate(false)} />
          <View style={st.sheet}>
            <View style={st.grabber} />
            <Text style={st.sheetTitle}>Create a room</Text>

            <Text style={st.label}>Room name</Text>
            <TextInput
              style={st.input}
              value={roomName}
              onChangeText={setRoomName}
              placeholder="My Room"
              placeholderTextColor="#6F7894"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleConfirmCreate}
            />

            <Pressable
              style={[st.createBtn, creating && { opacity: 0.6 }]}
              onPress={handleConfirmCreate}
              disabled={creating}>
              <Text style={st.createBtnTxt}>{creating ? 'Creating…' : 'Create room'}</Text>
            </Pressable>
            <Pressable style={st.cancelBtn} onPress={() => setShowCreate(false)}>
              <Text style={st.cancelBtnTxt}>Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const st = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  backdropTouch: { flex: 1, backgroundColor: '#000A' },
  sheet: {
    backgroundColor: '#141826', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingBottom: 36, paddingHorizontal: 20,
    borderTopWidth: 1, borderColor: '#232A3F',
  },
  grabber: {
    width: 38, height: 4, borderRadius: 2, backgroundColor: '#3A4460',
    alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: { color: '#EEF1FA', fontSize: 17, fontWeight: '700', marginBottom: 18 },
  label: { color: '#A8B0C6', fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#0B0D14', borderWidth: 1, borderColor: '#232A3F',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: '#EEF1FA', fontSize: 15,
  },
  createBtn: {
    backgroundColor: '#8B7CFF', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', marginTop: 20,
  },
  createBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: {
    backgroundColor: '#1B2133', borderRadius: 14, paddingVertical: 13,
    alignItems: 'center', marginTop: 8,
  },
  cancelBtnTxt: { color: '#A8B0C6', fontSize: 15, fontWeight: '600' },
});
