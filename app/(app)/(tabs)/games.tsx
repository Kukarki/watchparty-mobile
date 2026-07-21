import React, { useState } from 'react';
import {
  Modal, Pressable, StyleSheet, Text, View, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { PlayScreen } from '../../../wp-ui';
import { roomsApi } from '@/services/api';
import { useRoomStore } from '@/stores/room.store';

const GAME_META: Record<string, { hasSolo: boolean; emoji: string; desc: string }> = {
  ludo:       { hasSolo: true,  emoji: '🎲', desc: 'The classic race home' },
  wildbeam:   { hasSolo: false, emoji: '🃏', desc: 'Match colors, drop boosts' },
  matchblitz: { hasSolo: false, emoji: '🧠', desc: 'Memory pairs challenge' },
};

export default function GamesTab() {
  const setRoom = useRoomStore((s) => s.setRoom);
  const [modeModal, setModeModal] = useState<{ id: string; name: string } | null>(null);
  const [creating, setCreating] = useState(false);

  async function launchFriendsGame(gameId: string, gameName: string) {
    setModeModal(null);
    setCreating(true);
    try {
      const { data } = await roomsApi.create(`${gameName} table`, { roomType: 'game', gameType: gameId });
      setRoom(data.room);
      router.push(`/(app)/room/${data.room.id}`);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not create game room' });
    } finally {
      setCreating(false);
    }
  }

  function handleStartGame(game: { id: string; name: string }) {
    const meta = GAME_META[game.id];
    if (meta?.hasSolo) {
      setModeModal(game);
    } else {
      launchFriendsGame(game.id, game.name);
    }
  }

  return (
    <>
      <PlayScreen
        activeSessions={[]}
        musicRooms={[]}
        onStartGame={handleStartGame}
        onJoinSession={() => {}}
        onOpenMusicLobby={() => router.push('/(app)/(tabs)/music' as any)}
        onOpenMusicRoom={() => router.push('/(app)/(tabs)/music' as any)}
        onOpenLeaderboard={() => router.push('/(app)/leaderboard' as any)}
      />

      {/* Game mode picker for games that support solo */}
      <Modal
        visible={!!modeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setModeModal(null)}>
        <Pressable style={st.backdrop} onPress={() => setModeModal(null)} />
        <SafeAreaView style={st.sheet}>
          <View style={st.grabber} />
          {modeModal && (
            <>
              <Text style={st.sheetEmoji}>{GAME_META[modeModal.id]?.emoji}</Text>
              <Text style={st.sheetTitle}>{modeModal.name}</Text>
              <Text style={st.sheetSub}>{GAME_META[modeModal.id]?.desc}</Text>

              <View style={st.options}>
                {/* Solo vs AI — Ludo only */}
                <Pressable
                  style={st.optionCard}
                  onPress={() => { setModeModal(null); router.push('/(app)/ludo-solo' as any); }}>
                  <View style={[st.optionIcon, { backgroundColor: '#FFB45420' }]}>
                    <Ionicons name="hardware-chip-outline" size={24} color="#FFB454" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.optionTitle}>Play Solo vs AI</Text>
                    <Text style={st.optionSub}>1-3 CPU opponents · Easy or Hard</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#6F7894" />
                </Pressable>

                {/* With friends */}
                <Pressable
                  style={st.optionCard}
                  onPress={() => launchFriendsGame(modeModal.id, modeModal.name)}>
                  <View style={[st.optionIcon, { backgroundColor: '#8B7CFF20' }]}>
                    <Ionicons name="people-outline" size={24} color="#8B7CFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.optionTitle}>Play with Friends</Text>
                    <Text style={st.optionSub}>Create a room · share the code</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#6F7894" />
                </Pressable>
              </View>

              <Pressable style={st.cancelBtn} onPress={() => setModeModal(null)}>
                <Text style={st.cancelTxt}>Cancel</Text>
              </Pressable>
            </>
          )}
        </SafeAreaView>
      </Modal>

      {/* Full-screen loading while creating room */}
      <Modal visible={creating} transparent animationType="fade">
        <View style={st.loadingOverlay}>
          <ActivityIndicator size="large" color="#8B7CFF" />
          <Text style={st.loadingTxt}>Creating game room…</Text>
        </View>
      </Modal>
    </>
  );
}

const st = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#000B',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#141826', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingBottom: 24, paddingHorizontal: 20, paddingTop: 12,
    borderTopWidth: 1, borderColor: '#232A3F',
  },
  grabber: {
    width: 38, height: 4, borderRadius: 2, backgroundColor: '#3A4460',
    alignSelf: 'center', marginBottom: 20,
  },
  sheetEmoji: { textAlign: 'center', fontSize: 44, marginBottom: 6 },
  sheetTitle: { color: '#EEF1FA', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  sheetSub: { color: '#6F7894', fontSize: 13, textAlign: 'center', marginBottom: 20 },
  options: { gap: 10, marginBottom: 12 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1B2133', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#232A3F',
  },
  optionIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { color: '#EEF1FA', fontSize: 15, fontWeight: '700' },
  optionSub: { color: '#6F7894', fontSize: 12, marginTop: 2 },
  cancelBtn: {
    backgroundColor: '#0B0D14', borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#232A3F',
  },
  cancelTxt: { color: '#A8B0C6', fontSize: 15, fontWeight: '600' },
  loadingOverlay: {
    flex: 1, backgroundColor: '#000C', justifyContent: 'center', alignItems: 'center', gap: 12,
  },
  loadingTxt: { color: '#EEF1FA', fontSize: 15 },
});
