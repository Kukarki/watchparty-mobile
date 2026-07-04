import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS, SPACE, RADIUS, SHADOW } from '@/constants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RoomCardSkeleton } from '@/components/ui/SkeletonLoader';
import { hapticSuccess, hapticError } from '@/services/haptics';
import { roomsApi } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import { useRoomStore } from '@/stores/room.store';
import { Room } from '@/types';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

const PLATFORMS = [
  { name: 'YouTube',   color: '#FF0000', bg: '#1f0000', icon: 'logo-youtube'       as const },
  { name: 'Netflix',   color: '#E50914', bg: '#1a0000', icon: 'film-outline'        as const },
  { name: 'Prime',     color: '#00A8E1', bg: '#00111a', icon: 'play-circle-outline' as const },
  { name: 'Disney+',   color: '#5B8DEF', bg: '#000d2e', icon: 'star-outline'        as const },
  { name: 'Max',       color: '#4B9EFF', bg: '#000d24', icon: 'tv-outline'          as const },
  { name: 'Apple TV+', color: '#A3A3A3', bg: '#111111', icon: 'logo-apple'          as const },
];

type Tab = 'mine' | 'discover';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const setRoom = useRoomStore((s) => s.setRoom);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [publicRooms, setPublicRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [joinModal, setJoinModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [nameError, setNameError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('mine');

  // Deep link auto-open join modal
  const { joinCode: joinCodeParam } = useLocalSearchParams<{ joinCode?: string }>();
  useEffect(() => {
    if (joinCodeParam) {
      setJoinCodeInput(joinCodeParam);
      setJoinModal(true);
    }
  }, [joinCodeParam]);

  const fetchRooms = useCallback(async () => {
    try {
      const { data } = await roomsApi.list();
      setRooms(data.rooms ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchPublicRooms = useCallback(async () => {
    setDiscoverLoading(true);
    try {
      const api = roomsApi as Record<string, any>;
      if (typeof api.listPublic === 'function') {
        const { data } = await api.listPublic();
        setPublicRooms(data.rooms ?? []);
      } else {
        setPublicRooms([]);
      }
    } catch {
      setPublicRooms([]);
    } finally {
      setDiscoverLoading(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  useEffect(() => {
    if (tab === 'discover') fetchPublicRooms();
  }, [tab, fetchPublicRooms]);

  async function createRoom() {
    if (!roomName.trim()) { setNameError('Room name is required'); return; }
    if (roomName.trim().length < 3) { setNameError('At least 3 characters'); return; }
    setNameError('');
    setActionLoading(true);
    try {
      const { data } = await roomsApi.create(roomName.trim());
      setRoom(data.room);
      setCreateModal(false);
      setRoomName('');
      hapticSuccess();
      router.push(`/(app)/room/${data.room.id}`);
    } catch {
      hapticError();
      Toast.show({ type: 'error', text1: 'Could not create room' });
    } finally {
      setActionLoading(false);
    }
  }

  async function joinRoom() {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) { setCodeError('Enter a room code'); return; }
    if (code.length < 4) { setCodeError('Invalid code'); return; }
    setCodeError('');
    setActionLoading(true);
    try {
      const { data } = await roomsApi.join(code);
      setRoom(data.room);
      setJoinModal(false);
      setJoinCodeInput('');
      hapticSuccess();
      router.push(`/(app)/room/${data.room.id}`);
    } catch {
      hapticError();
      Toast.show({ type: 'error', text1: 'Room not found or code is invalid' });
    } finally {
      setActionLoading(false);
    }
  }

  function openRoom(room: Room) {
    setRoom(room);
    router.push(`/(app)/room/${room.id}`);
  }

  const listData = tab === 'mine' ? rooms : publicRooms;
  const isListLoading = tab === 'mine' ? loading : discoverLoading;
  const firstLetter = user?.username?.charAt(0).toUpperCase() ?? '?';

  return (
    <View style={styles.root}>
      <FlatList
        data={listData}
        keyExtractor={(r) => r.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchRooms(); }}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* ── Header ── */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Hey, {user?.username} 👋</Text>
                <Text style={styles.subGreet}>Ready to watch together?</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(app)/profile')}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{firstLetter}</Text>
              </TouchableOpacity>
            </View>

            {/* ── CTA cards ── */}
            <View style={styles.ctas}>
              <TouchableOpacity
                style={[styles.ctaCard, styles.ctaCreate]}
                onPress={() => setCreateModal(true)}
                activeOpacity={0.85}
              >
                <View style={styles.ctaIconWrap}>
                  <Ionicons name="add-circle" size={28} color={COLORS.background} />
                </View>
                <Text style={styles.ctaTitle}>Create Room</Text>
                <Text style={styles.ctaSub}>Start a new watch party</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.ctaCard, styles.ctaJoin]}
                onPress={() => setJoinModal(true)}
                activeOpacity={0.85}
              >
                <View style={styles.ctaIconWrap}>
                  <Ionicons name="enter-outline" size={28} color={COLORS.primary} />
                </View>
                <Text style={[styles.ctaTitle, { color: COLORS.primary }]}>Join Room</Text>
                <Text style={styles.ctaSub}>Enter an invite code</Text>
              </TouchableOpacity>
            </View>

            {/* ── Platform grid ── */}
            <Text style={styles.sectionLabel}>Watch from any platform</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.platformRow}
            >
              {PLATFORMS.map((p) => (
                <TouchableOpacity
                  key={p.name}
                  style={[styles.platformCard, { backgroundColor: p.bg, borderColor: p.color + '33' }]}
                  onPress={() =>
                    Toast.show({ type: 'info', text1: `Paste a ${p.name} URL after joining a room` })
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons name={p.icon} size={24} color={p.color} />
                  <Text style={[styles.platformName, { color: p.color }]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ── Tab row ── */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabBtn, tab === 'mine' && styles.tabActive]}
                onPress={() => setTab('mine')}
              >
                <Ionicons
                  name="bookmark-outline"
                  size={15}
                  color={tab === 'mine' ? COLORS.primary : COLORS.muted}
                />
                <Text style={[styles.tabText, tab === 'mine' && styles.tabTextActive]}>My Rooms</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, tab === 'discover' && styles.tabActive]}
                onPress={() => setTab('discover')}
              >
                <Ionicons
                  name="compass-outline"
                  size={15}
                  color={tab === 'discover' ? COLORS.primary : COLORS.muted}
                />
                <Text style={[styles.tabText, tab === 'discover' && styles.tabTextActive]}>Discover</Text>
              </TouchableOpacity>
            </View>

            {isListLoading && tab === 'mine' && (
              <>
                <RoomCardSkeleton />
                <RoomCardSkeleton />
                <RoomCardSkeleton />
              </>
            )}
            {isListLoading && tab === 'discover' && (
              <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
            )}
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.roomCard} onPress={() => openRoom(item)} activeOpacity={0.8}>
            <View style={styles.roomIcon}>
              <Ionicons name="tv-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.roomInfo}>
              <Text style={styles.roomName}>{item.name}</Text>
              <Text style={styles.roomMeta}>
                Code: <Text style={styles.roomCode}>{item.code}</Text>
                {'  ·  '}
                {format(new Date(item.created_at), 'MMM d')}
              </Text>
            </View>
            <View style={styles.memberBadge}>
              <Ionicons name="people" size={13} color={COLORS.muted} />
              <Text style={styles.memberCount}>{item.member_count ?? 0}</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.border} style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !isListLoading ? (
            tab === 'discover' ? (
              <View style={styles.empty}>
                <Ionicons name="compass-outline" size={52} color={COLORS.borderStrong} />
                <Text style={styles.emptyTitle}>No public rooms yet</Text>
                <Text style={styles.emptySub}>Create a room and make it public to appear here</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="film-outline" size={52} color={COLORS.borderStrong} />
                <Text style={styles.emptyTitle}>No rooms yet</Text>
                <Text style={styles.emptySub}>Create or join one above to get started</Text>
              </View>
            )
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />

      {/* ── Create Room Modal ── */}
      <Modal
        visible={createModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCreateModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHandle} />
          <View style={styles.modalIconRow}>
            <View style={[styles.modalIcon, { backgroundColor: COLORS.accentMuted }]}>
              <Ionicons name="add-circle" size={28} color={COLORS.primary} />
            </View>
          </View>
          <Text style={styles.modalTitle}>Create a Room</Text>
          <Text style={styles.modalSub}>Give your room a name and share the code with friends</Text>
          <Input
            label="Room name"
            value={roomName}
            onChangeText={setRoomName}
            placeholder="Movie Night 🎬"
            leftIcon="tv-outline"
            error={nameError}
            returnKeyType="done"
            onSubmitEditing={createRoom}
          />
          <View style={styles.modalActions}>
            <Button title="Cancel" onPress={() => setCreateModal(false)} variant="ghost" style={{ flex: 1 }} />
            <Button title="Create" onPress={createRoom} loading={actionLoading} style={{ flex: 1 }} />
          </View>
        </View>
      </Modal>

      {/* ── Join Room Modal ── */}
      <Modal
        visible={joinModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setJoinModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHandle} />
          <View style={styles.modalIconRow}>
            <View style={[styles.modalIcon, { backgroundColor: COLORS.accentMuted }]}>
              <Ionicons name="enter-outline" size={28} color={COLORS.primary} />
            </View>
          </View>
          <Text style={styles.modalTitle}>Join a Room</Text>
          <Text style={styles.modalSub}>Enter the invite code shared by your friend</Text>
          <Input
            label="Room code"
            value={joinCodeInput}
            onChangeText={(t) => setJoinCodeInput(t.toUpperCase())}
            placeholder="ABCD1234"
            leftIcon="key-outline"
            error={codeError}
            returnKeyType="go"
            onSubmitEditing={joinRoom}
            autoCapitalize="characters"
          />
          <View style={styles.modalActions}>
            <Button title="Cancel" onPress={() => setJoinModal(false)} variant="ghost" style={{ flex: 1 }} />
            <Button title="Join" onPress={joinRoom} loading={actionLoading} style={{ flex: 1 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  listContent: { paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.lg,
    paddingBottom: SPACE.sm,
  },
  greeting: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  subGreet: { color: COLORS.textSecondary, fontSize: 14, marginTop: 2 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.accent,
  },
  avatarText: { color: COLORS.background, fontSize: 18, fontWeight: '800' },

  ctas: {
    flexDirection: 'row',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
    gap: SPACE.md,
  },
  ctaCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: SPACE.lg,
    gap: SPACE.sm,
    minHeight: 140,
    justifyContent: 'flex-end',
    borderWidth: 1.5,
  },
  ctaCreate: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOW.accent,
  },
  ctaJoin: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.primary,
  },
  ctaIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaTitle: { color: COLORS.background, fontSize: 17, fontWeight: '700' },
  ctaSub: { color: 'rgba(0,0,0,0.55)', fontSize: 12 },

  sectionLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    paddingHorizontal: SPACE.lg,
    marginBottom: SPACE.sm,
    marginTop: SPACE.xs,
  },
  platformRow: {
    paddingHorizontal: SPACE.lg,
    gap: SPACE.sm,
    paddingBottom: SPACE.md,
  },
  platformCard: {
    width: 90,
    height: 80,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACE.xs,
    borderWidth: 1,
  },
  platformName: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACE.lg,
    gap: SPACE.sm,
    marginTop: SPACE.xs,
    marginBottom: SPACE.sm,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.accentMuted,
    borderColor: COLORS.primary + '66',
  },
  tabText: { color: COLORS.muted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary },

  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACE.lg,
    marginBottom: SPACE.sm,
    borderRadius: RADIUS.lg,
    padding: SPACE.md,
    gap: SPACE.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roomIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomInfo: { flex: 1 },
  roomName: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  roomMeta: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  roomCode: { color: COLORS.primary, fontWeight: '700' },
  memberBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  memberCount: { color: COLORS.muted, fontSize: 13 },

  empty: {
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: 60,
    paddingHorizontal: SPACE.lg,
  },
  emptyTitle: { color: COLORS.textSecondary, fontSize: 18, fontWeight: '700' },
  emptySub: { color: COLORS.muted, fontSize: 14, textAlign: 'center' },

  modal: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACE.lg,
    paddingTop: SPACE.md,
    gap: SPACE.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.borderStrong,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACE.sm,
  },
  modalIconRow: { alignItems: 'center' },
  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  modalSub: { color: COLORS.textSecondary, fontSize: 14, marginTop: -SPACE.sm },
  modalActions: { flexDirection: 'row', gap: SPACE.md, marginTop: SPACE.xs },
});
