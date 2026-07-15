import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS, SPACE, RADIUS } from '@/constants';
import { friendApi } from '@/services/api';
import { useFriendStore, FriendEntry } from '@/stores/friend.store';
import { useAuthStore } from '@/stores/auth.store';
import { socketService } from '@/services/socket';
import { SOCKET_EVENTS } from '@/constants';
import { FriendRequest } from '@/types';

type Tab = 'friends' | 'requests' | 'add';

interface SearchResult {
  userId: string;
  displayName: string;
  username?: string;
  avatar?: string;
}

export default function FriendsScreen() {
  const [tab, setTab] = useState<Tab>('friends');
  const { user } = useAuthStore();
  const { friends, nicknames, onlineFriendIds, setFriends, setNickname } = useFriendStore();

  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Nickname dialog
  const [nicknameDialog, setNicknameDialog] = useState<{ friend: FriendEntry } | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadFriends = useCallback(async () => {
    setLoadingFriends(true);
    try {
      const res = await friendApi.list();
      const raw: any[] = res.data.friends ?? res.data ?? [];
      setFriends(raw.map((f: any) => ({
        userId: f.userId ?? f.user_id ?? f.id,
        displayName: f.displayName ?? f.display_name ?? f.username ?? 'Unknown',
        username: f.username,
        avatar: f.avatar ?? f.avatar_url,
        online: false,
        nickname: f.nickname ?? null,
      })));
    } catch {
      Toast.show({ type: 'error', text1: 'Could not load friends' });
    } finally {
      setLoadingFriends(false);
    }
  }, [setFriends]);

  const loadRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await friendApi.requests();
      setRequests(res.data.requests ?? res.data ?? []);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not load requests' });
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, [loadFriends, loadRequests]);

  // Listen for friend invite socket events
  useEffect(() => {
    const onFriendInvite = () => loadRequests();
    socketService.on(SOCKET_EVENTS.FRIEND_INVITE, onFriendInvite);
    socketService.on(SOCKET_EVENTS.FRIEND_INVITED, onFriendInvite);
    return () => {
      socketService.off(SOCKET_EVENTS.FRIEND_INVITE, onFriendInvite);
      socketService.off(SOCKET_EVENTS.FRIEND_INVITED, onFriendInvite);
    };
  }, [loadRequests]);

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await friendApi.search(searchQuery.trim());
        const raw = res.data.results ?? res.data.users ?? res.data ?? [];
        setSearchResults(raw.map((u: any) => ({
          userId: u.userId ?? u.user_id ?? u.id,
          displayName: u.displayName ?? u.display_name ?? u.username ?? 'Unknown',
          username: u.username,
          avatar: u.avatar ?? u.avatar_url,
        })));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [searchQuery]);

  async function sendRequest(toUserId: string) {
    try {
      await friendApi.send(toUserId);
      Toast.show({ type: 'success', text1: 'Friend request sent!' });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not send request' });
    }
  }

  async function respondRequest(requestId: string, action: 'accept' | 'decline') {
    try {
      await friendApi.respond(requestId, action);
      setRequests((prev) => prev.filter((r) => r.requestId !== requestId));
      if (action === 'accept') {
        Toast.show({ type: 'success', text1: 'Friend added!' });
        loadFriends();
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Could not respond to request' });
    }
  }

  async function removeFriend(friendId: string, name: string) {
    Alert.alert('Remove Friend', `Remove ${name} from your friends?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await friendApi.remove(friendId);
            setFriends(friends.filter((f) => f.userId !== friendId));
            Toast.show({ type: 'success', text1: 'Friend removed' });
          } catch {
            Toast.show({ type: 'error', text1: 'Could not remove friend' });
          }
        },
      },
    ]);
  }

  async function saveNickname() {
    if (!nicknameDialog) return;
    const nick = nicknameInput.trim() || null;
    try {
      await friendApi.setNickname(nicknameDialog.friend.userId, nick);
      setNickname(nicknameDialog.friend.userId, nick);
      setNicknameDialog(null);
      Toast.show({ type: 'success', text1: nick ? 'Nickname saved' : 'Nickname cleared' });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not save nickname' });
    }
  }

  function openNicknameDialog(friend: FriendEntry) {
    setNicknameInput(nicknames[friend.userId] ?? '');
    setNicknameDialog({ friend });
  }

  const displayName = (f: FriendEntry) => nicknames[f.userId] ?? f.displayName;

  return (
    <View style={styles.root}>
      {/* Tab row */}
      <View style={styles.tabRow}>
        {(['friends', 'requests', 'add'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'friends' ? 'Friends' : t === 'requests' ? `Requests${requests.length ? ` (${requests.length})` : ''}` : 'Add Friend'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Friends tab */}
      {tab === 'friends' && (
        <FlatList
          data={friends}
          keyExtractor={(f) => f.userId}
          refreshing={loadingFriends}
          onRefresh={loadFriends}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.friendRow}>
              <View style={styles.avatarWrap}>
                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>
                      {displayName(item).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={[styles.onlineDot, onlineFriendIds.has(item.userId) && styles.onlineDotActive]} />
              </View>
              <View style={styles.friendInfo}>
                <Text style={styles.friendName} numberOfLines={1}>{displayName(item)}</Text>
                {item.username && (
                  <Text style={styles.friendHandle}>@{item.username}</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.nickBtn}
                onPress={() => openNicknameDialog(item)}
              >
                <Ionicons name="pencil-outline" size={16} color={COLORS.muted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeFriend(item.userId, displayName(item))}
              >
                <Ionicons name="person-remove-outline" size={16} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            !loadingFriends ? (
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={48} color={COLORS.borderStrong} />
                <Text style={styles.emptyTitle}>No friends yet</Text>
                <Text style={styles.emptySub}>Search for people in the "Add Friend" tab</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Requests tab */}
      {tab === 'requests' && (
        <FlatList
          data={requests}
          keyExtractor={(r) => r.requestId}
          refreshing={loadingRequests}
          onRefresh={loadRequests}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.requestRow}>
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>
                  {item.fromUsername.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{item.fromUsername}</Text>
                <Text style={styles.friendHandle}>Wants to be your friend</Text>
              </View>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => respondRequest(item.requestId, 'accept')}
              >
                <Ionicons name="checkmark" size={18} color={COLORS.background} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => respondRequest(item.requestId, 'decline')}
              >
                <Ionicons name="close" size={18} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            !loadingRequests ? (
              <View style={styles.empty}>
                <Ionicons name="mail-outline" size={48} color={COLORS.borderStrong} />
                <Text style={styles.emptyTitle}>No pending requests</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Add Friend tab */}
      {tab === 'add' && (
        <View style={styles.addContainer}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={COLORS.muted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by username or email…"
              placeholderTextColor={COLORS.muted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searching && <ActivityIndicator size="small" color={COLORS.primary} />}
          </View>

          {searchQuery.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(r) => r.userId}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={styles.friendRow}>
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>
                      {item.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{item.displayName}</Text>
                    {item.username && (
                      <Text style={styles.friendHandle}>@{item.username}</Text>
                    )}
                  </View>
                  {item.userId !== user?.id && (
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() => sendRequest(item.userId)}
                    >
                      <Ionicons name="person-add-outline" size={16} color={COLORS.background} />
                      <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              ListEmptyComponent={
                !searching ? (
                  <View style={styles.empty}>
                    <Text style={styles.emptySub}>No users found for "{searchQuery}"</Text>
                  </View>
                ) : null
              }
            />
          )}

          {searchQuery.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="person-add-outline" size={48} color={COLORS.borderStrong} />
              <Text style={styles.emptyTitle}>Find Friends</Text>
              <Text style={styles.emptySub}>Search by username or email address</Text>
            </View>
          )}
        </View>
      )}

      {/* Nickname Dialog */}
      <Modal
        visible={!!nicknameDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setNicknameDialog(null)}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Set Nickname</Text>
            <Text style={styles.dialogSub}>
              Only visible to you. Leave blank to use their real name.
            </Text>
            <TextInput
              style={styles.dialogInput}
              value={nicknameInput}
              onChangeText={setNicknameInput}
              placeholder={nicknameDialog?.friend.displayName ?? 'Nickname'}
              placeholderTextColor={COLORS.muted}
              maxLength={30}
              autoFocus
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.dialogBtnCancel]}
                onPress={() => setNicknameDialog(null)}
              >
                <Text style={styles.dialogBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogBtn, styles.dialogBtnSave]}
                onPress={saveNickname}
              >
                <Text style={styles.dialogBtnSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
    gap: SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACE.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.accentMuted,
    borderColor: COLORS.primary + '66',
  },
  tabText: { color: COLORS.muted, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary },

  listContent: { padding: SPACE.lg, gap: SPACE.sm, flexGrow: 1 },

  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACE.md,
    gap: SPACE.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarWrap: { position: 'relative' },
  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.primary + '44',
  },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { color: COLORS.background, fontSize: 17, fontWeight: '800' },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: COLORS.borderStrong,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  onlineDotActive: { backgroundColor: COLORS.success },
  friendInfo: { flex: 1 },
  friendName: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  friendHandle: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  nickBtn: {
    padding: SPACE.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  removeBtn: {
    padding: SPACE.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.danger + '14',
    borderWidth: 1,
    borderColor: COLORS.danger + '33',
  },

  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACE.md,
    gap: SPACE.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.danger + '20',
    borderWidth: 1,
    borderColor: COLORS.danger + '44',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addContainer: { flex: 1 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACE.lg,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    paddingHorizontal: SPACE.md,
    gap: SPACE.sm,
  },
  searchIcon: { marginRight: 4 },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    paddingVertical: SPACE.md,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
  },
  addBtnText: { color: COLORS.background, fontWeight: '700', fontSize: 13 },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    paddingVertical: 60,
  },
  emptyTitle: { color: COLORS.textSecondary, fontSize: 18, fontWeight: '700' },
  emptySub: { color: COLORS.muted, fontSize: 14, textAlign: 'center', paddingHorizontal: SPACE.lg },

  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACE.lg,
    width: '80%',
    gap: SPACE.md,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  dialogTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700' },
  dialogSub: { color: COLORS.muted, fontSize: 13 },
  dialogInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    color: COLORS.textPrimary,
    fontSize: 15,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
  },
  dialogActions: { flexDirection: 'row', gap: SPACE.md },
  dialogBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACE.md,
    borderRadius: RADIUS.md,
  },
  dialogBtnCancel: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dialogBtnCancelText: { color: COLORS.muted, fontWeight: '600' },
  dialogBtnSave: { backgroundColor: COLORS.primary },
  dialogBtnSaveText: { color: COLORS.background, fontWeight: '700' },
});
