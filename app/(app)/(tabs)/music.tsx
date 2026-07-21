import React, { useState, useEffect } from 'react';
import {
  Modal, Pressable, StyleSheet, TextInput, View, Text, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { MusicLobbyScreen } from '../../../wp-ui';
import { useRoomStore } from '@/stores/room.store';
import { roomsApi } from '@/services/api';
import { hapticSuccess, hapticError } from '@/services/haptics';

export default function MusicTab() {
  const setRoom = useRoomStore((s) => s.setRoom);
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [creating, setCreating] = useState(false);

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

  async function handleConfirmCreate() {
    const name = roomName.trim() || 'Music Room';
    setCreating(true);
    try {
      const { data } = await roomsApi.create(name);
      setRoom(data.room);
      hapticSuccess();
      setShowForm(false);
      setRoomName('');
      setStreamUrl('');
      router.push(`/(app)/room/${data.room.id}` as any);
    } catch {
      hapticError();
      Toast.show({ type: 'error', text1: 'Could not create music room' });
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <MusicLobbyScreen
        rooms={rooms}
        onBack={() => router.back()}
        onOpen={(room: any) => {
          setRoom({ id: room.id, name: room.title } as any);
          router.push(`/(app)/room/${room.id}` as any);
        }}
        onCreate={() => { setRoomName(''); setStreamUrl(''); setShowForm(true); }}
      />

      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={st.backdrop}>
          <Pressable style={st.backdropTouch} onPress={() => setShowForm(false)} />
          <View style={st.sheet}>
            <View style={st.grabber} />
            <Text style={st.sheetTitle}>Start a music room</Text>

            <Text style={st.label}>Room name</Text>
            <TextInput
              style={st.input}
              value={roomName}
              onChangeText={setRoomName}
              placeholder="Music Room"
              placeholderTextColor="#6F7894"
              autoFocus
              returnKeyType="next"
            />

            <Text style={st.label}>Stream URL <Text style={st.optional}>(optional)</Text></Text>
            <TextInput
              style={st.input}
              value={streamUrl}
              onChangeText={setStreamUrl}
              placeholder="Paste a YouTube or music link"
              placeholderTextColor="#6F7894"
              autoCapitalize="none"
              keyboardType="url"
              returnKeyType="done"
              onSubmitEditing={handleConfirmCreate}
            />

            <Pressable
              style={[st.createBtn, creating && { opacity: 0.6 }]}
              onPress={handleConfirmCreate}
              disabled={creating}>
              <Text style={st.createBtnTxt}>{creating ? 'Creating…' : 'Create room'}</Text>
            </Pressable>
            <Pressable style={st.cancelBtn} onPress={() => setShowForm(false)}>
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
  optional: { color: '#6F7894', fontWeight: '400' },
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
