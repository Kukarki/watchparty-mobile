import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { COLORS, SPACE, RADIUS, SHADOW } from '@/constants';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/services/api';
import { getHistory, clearHistory, type HistoryEntry } from '@/services/history';
import Toast from 'react-native-toast-message';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  useEffect(() => {
    getHistory(user?.id).then((h) => {
      setHistory(h);
      setHistoryLoaded(true);
    });
  }, [user?.id]);

  function confirmLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: handleLogout },
    ]);
  }

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  function confirmClearHistory() {
    Alert.alert('Clear History', 'Remove all watch history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearHistory(user?.id);
          setHistory([]);
        },
      },
    ]);
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await authApi.deleteAccount();
              await logout();
              router.replace('/(auth)/login');
            } catch {
              Toast.show({ type: 'error', text1: 'Could not delete account. Try again.' });
            }
          },
        },
      ]
    );
  }

  const initials = user?.username?.charAt(0).toUpperCase() ?? '?';
  const avatarUrl = user?.avatar_url;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Avatar ── */}
      <View style={styles.avatarSection}>
        <TouchableOpacity
          onPress={() => router.push('/(app)/avatar-editor')}
          style={styles.avatarWrap}
          activeOpacity={0.85}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.editBadge}>
            <Ionicons name="brush-outline" size={13} color={COLORS.background} />
          </View>
        </TouchableOpacity>

        <Text style={styles.username}>{user?.username}</Text>
        {user?.handle && <Text style={styles.handle}>@{user.handle}</Text>}
        {user?.email && <Text style={styles.email}>{user.email}</Text>}

        {user?.is_guest && (
          <View style={styles.guestBadge}>
            <Ionicons name="person-outline" size={12} color={COLORS.warning} />
            <Text style={styles.guestText}>Guest Account</Text>
          </View>
        )}
      </View>

      {/* ── Quick actions ── */}
      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(app)/avatar-editor')}>
          <Ionicons name="color-palette-outline" size={22} color={COLORS.primary} />
          <Text style={styles.quickLabel}>Customize Avatar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(app)/friends')}>
          <Ionicons name="people-outline" size={22} color={COLORS.primary} />
          <Text style={styles.quickLabel}>Friends</Text>
        </TouchableOpacity>
      </View>

      {/* ── Info card ── */}
      <View style={styles.infoCard}>
        <InfoRow
          icon="id-card-outline"
          label="User ID"
          value={user?.id ? user.id.slice(0, 14) + '…' : '—'}
        />
        <View style={styles.divider} />
        <InfoRow
          icon="shield-checkmark-outline"
          label="Account type"
          value={user?.is_guest ? 'Guest' : 'Registered'}
        />
      </View>

      {/* ── Guest upgrade prompt ── */}
      {user?.is_guest && (
        <TouchableOpacity style={styles.upgradeCard} onPress={() => router.push('/(auth)/register')}>
          <Ionicons name="star" size={22} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.upgradeTitle}>Create a free account</Text>
            <Text style={styles.upgradeSub}>Save your rooms and chat history</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
        </TouchableOpacity>
      )}

      {/* ── Watch history (collapsible) ── */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setHistoryExpanded((v) => !v)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>Watch History</Text>
          <View style={styles.sectionHeaderRight}>
            {historyLoaded && history.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{history.length}</Text>
              </View>
            )}
            <Ionicons
              name={historyExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={COLORS.muted}
            />
          </View>
        </TouchableOpacity>

        {historyExpanded && (
          <>
            {history.length > 0 && (
              <TouchableOpacity onPress={confirmClearHistory} style={styles.clearBtn}>
                <Ionicons name="trash-outline" size={13} color={COLORS.danger} />
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            )}
            {!historyLoaded ? null : history.length === 0 ? (
              <View style={styles.historyEmpty}>
                <Ionicons name="time-outline" size={32} color={COLORS.borderStrong} />
                <Text style={styles.historyEmptyText}>No watch history yet</Text>
              </View>
            ) : (
              history.map((h) => (
                <View key={h.id + h.at} style={styles.historyItem}>
                  <View style={styles.historyIcon}>
                    <Ionicons name="play-circle" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyName} numberOfLines={1}>{h.name}</Text>
                    <Text style={styles.historyMeta}>
                      Code: <Text style={{ color: COLORS.primary, fontWeight: '700' }}>{h.code}</Text>
                      {'  ·  '}
                      {format(new Date(h.at), 'MMM d, h:mm a')}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </View>

      {/* ── Actions ── */}
      <Button title="Sign Out" onPress={confirmLogout} variant="danger" style={{ marginTop: SPACE.sm }} />

      {!user?.is_guest && (
        <TouchableOpacity style={styles.deleteLink} onPress={confirmDeleteAccount}>
          <Text style={styles.deleteLinkText}>Delete Account</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as never} size={18} color={COLORS.muted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACE.lg, gap: SPACE.lg, paddingBottom: 60 },

  avatarSection: { alignItems: 'center', gap: SPACE.sm, paddingVertical: SPACE.lg },
  avatarWrap: { position: 'relative' },
  avatarImg: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.full,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.accent,
  },
  avatarInitials: { color: COLORS.background, fontSize: 38, fontWeight: '800' },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  username: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '800' },
  handle: { color: COLORS.muted, fontSize: 14, fontWeight: '500' },
  email: { color: COLORS.textSecondary, fontSize: 14 },
  guestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    backgroundColor: COLORS.accentMuted,
    paddingHorizontal: SPACE.md,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  guestText: { color: COLORS.warning, fontSize: 12, fontWeight: '600' },

  quickRow: { flexDirection: 'row', gap: SPACE.md },
  quickCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '33',
    padding: SPACE.md,
    alignItems: 'center',
    gap: SPACE.sm,
  },
  quickLabel: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600', textAlign: 'center' },

  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    padding: SPACE.md,
  },
  infoLabel: { color: COLORS.textSecondary, fontSize: 14, flex: 1 },
  infoValue: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '500' },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACE.md },

  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    backgroundColor: COLORS.accentMuted,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
    borderRadius: RADIUS.lg,
    padding: SPACE.md,
  },
  upgradeTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  upgradeSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },

  section: { gap: SPACE.sm },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACE.sm,
  },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  sectionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  countBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  countBadgeText: { color: COLORS.background, fontSize: 10, fontWeight: '800' },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
  },
  clearText: { color: COLORS.danger, fontSize: 13, fontWeight: '600' },

  historyEmpty: {
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.xl,
  },
  historyEmptyText: { color: COLORS.muted, fontSize: 14 },

  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    gap: SPACE.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accentMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyInfo: { flex: 1 },
  historyName: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  historyMeta: { color: COLORS.muted, fontSize: 11, marginTop: 2 },

  deleteLink: { alignItems: 'center', paddingVertical: SPACE.md },
  deleteLinkText: { color: COLORS.danger, fontSize: 13, fontWeight: '500' },
});
