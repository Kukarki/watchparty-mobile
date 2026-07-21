import React, { useState, useEffect } from 'react';
import {
  BackHandler, Modal, View, Text, TextInput, Pressable,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
// @ts-ignore — JS component, typed via usage
import HubHomeRaw from '../../../wp-home/HubHome';
const HubHome = HubHomeRaw as React.ComponentType<any>;
import YouTubePicker from '../../../youtube/YouTubePicker';
import { useAuthStore } from '@/stores/auth.store';
import { useAvatarStore } from '../../../avatar';
import { useFriendStore } from '@/stores/friend.store';
import { useRoomStore } from '@/stores/room.store';
import { roomsApi } from '@/services/api';
import { hapticSuccess, hapticError } from '@/services/haptics';

export default function HomeTab() {
  const { user } = useAuthStore();
  const { progression } = useAvatarStore();
  const { friends, onlineFriendIds } = useFriendStore();
  const room = useRoomStore((s) => s.currentRoom);
  const setRoom = useRoomStore((s) => s.setRoom);

  const [refreshing, setRefreshing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const h = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => h.remove();
  }, []);

  const friendsOnline: any[] = friends
    .filter((f) => onlineFriendIds.has(f.userId))
    .map((f) => ({ id: f.userId, name: f.displayName || f.username || 'Friend', avatarUrl: f.avatar }));

  async function handlePick({ videoId, title }: any) {
    setShowPicker(false);
    if (!videoId) return;
    try {
      const { data } = await roomsApi.create(title || 'Watch party');
      setRoom(data.room);
      router.push(`/(app)/room/${data.room.id}` as any);
    } catch { /* silent */ }
  }

  async function handleCreateRoom() {
    const name = roomName.trim() || 'Watch Party';
    setBusy(true);
    try {
      const { data } = await roomsApi.create(name);
      setRoom(data.room);
      hapticSuccess();
      setShowCreateModal(false);
      setRoomName('');
      router.push(`/(app)/room/${data.room.id}` as any);
    } catch {
      hapticError();
      Toast.show({ type: 'error', text1: 'Could not create room' });
    } finally {
      setBusy(false);
    }
  }

  async function handleJoinRoom() {
    const code = roomCode.trim().toUpperCase();
    if (!code) return;
    setBusy(true);
    try {
      const { data } = await roomsApi.join(code);
      setRoom(data.room);
      hapticSuccess();
      setShowJoinModal(false);
      setRoomCode('');
      router.push(`/(app)/room/${data.room.id}` as any);
    } catch {
      hapticError();
      Toast.show({ type: 'error', text1: 'Room not found — check the code' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <HubHome
        name={user?.username ?? 'there'}
        progression={progression}
        live={[] as any[]}
        friendsOnline={friendsOnline}
        resume={room ? { title: room.name, subtitle: 'Resume your room', live: false } : undefined}
        refreshing={refreshing}
        onRefresh={async () => { setRefreshing(true); await new Promise(r => setTimeout(r, 600)); setRefreshing(false); }}
        onHost={() => setShowPicker(true)}
        onCreateRoom={() => setShowCreateModal(true)}
        onJoinRoom={() => setShowJoinModal(true)}
        onResume={() => room && router.push(`/(app)/room/${room.id}` as any)}
        onOpenLive={(item: any) => router.push(`/(app)/room/${item.id}` as any)}
        onOpenGames={() => router.push('/(app)/(tabs)/games' as any)}
        onOpenMusic={() => router.push('/(app)/(tabs)/music' as any)}
        onOpenFriends={() => router.push('/(app)/(tabs)/friends' as any)}
        onOpenRooms={() => router.push('/(app)/(tabs)/rooms' as any)}
        onOpenProfile={() => router.push('/(app)/(tabs)/profile' as any)}
        onOpenSettings={() => router.push('/(app)/settings' as any)}
      />

      <YouTubePicker
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onPick={handlePick}
      />

      {/* Create Room Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={st.backdrop}>
          <Pressable style={st.backdropTouch} onPress={() => setShowCreateModal(false)} />
          <View style={st.sheet}>
            <View style={st.grabber} />
            <Text style={st.sheetTitle}>Create a Room</Text>

            <Text style={st.label}>Room name <Text style={st.optional}>(optional)</Text></Text>
            <TextInput
              style={st.input}
              value={roomName}
              onChangeText={setRoomName}
              placeholder="Watch Party"
              placeholderTextColor="#6F7894"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreateRoom}
            />

            <Pressable
              style={[st.primaryBtn, busy && { opacity: 0.6 }]}
              onPress={handleCreateRoom}
              disabled={busy}>
              <Text style={st.primaryBtnTxt}>{busy ? 'Creating…' : 'Create Room'}</Text>
            </Pressable>
            <Pressable style={st.secondaryBtn} onPress={() => setShowCreateModal(false)}>
              <Text style={st.secondaryBtnTxt}>Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Join Room Modal */}
      <Modal visible={showJoinModal} transparent animationType="slide" onRequestClose={() => setShowJoinModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={st.backdrop}>
          <Pressable style={st.backdropTouch} onPress={() => setShowJoinModal(false)} />
          <View style={st.sheet}>
            <View style={st.grabber} />
            <Text style={st.sheetTitle}>Join a Room</Text>

            <Text style={st.label}>Room code</Text>
            <TextInput
              style={[st.input, { textTransform: 'uppercase', letterSpacing: 4, fontSize: 20, textAlign: 'center' }]}
              value={roomCode}
              onChangeText={(v) => setRoomCode(v.toUpperCase())}
              placeholder="ABCD12"
              placeholderTextColor="#6F7894"
              autoFocus
              autoCapitalize="characters"
              returnKeyType="done"
              maxLength={8}
              onSubmitEditing={handleJoinRoom}
            />

            <Pressable
              style={[st.primaryBtn, busy && { opacity: 0.6 }]}
              onPress={handleJoinRoom}
              disabled={busy}>
              <Text style={st.primaryBtnTxt}>{busy ? 'Joining…' : 'Join Room'}</Text>
            </Pressable>
            <Pressable style={st.secondaryBtn} onPress={() => setShowJoinModal(false)}>
              <Text style={st.secondaryBtnTxt}>Cancel</Text>
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
    backgroundColor: '#141826', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 12, paddingBottom: 40, paddingHorizontal: 20,
    borderTopWidth: 1, borderColor: '#232A3F',
  },
  grabber: {
    width: 38, height: 4, borderRadius: 2, backgroundColor: '#3A4460',
    alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle: { color: '#EEF1FA', fontSize: 20, fontWeight: '800', marginBottom: 18 },
  label: { color: '#A8B0C6', fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  optional: { color: '#6F7894', fontWeight: '400' },
  input: {
    backgroundColor: '#0B0D14', borderWidth: 1, borderColor: '#232A3F',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    color: '#EEF1FA', fontSize: 16, marginBottom: 6,
  },
  primaryBtn: {
    backgroundColor: '#8B7CFF', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginTop: 16,
  },
  primaryBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#1B2133', borderRadius: 16, paddingVertical: 14,
    alignItems: 'center', marginTop: 8,
  },
  secondaryBtnTxt: { color: '#A8B0C6', fontSize: 15, fontWeight: '600' },
});
