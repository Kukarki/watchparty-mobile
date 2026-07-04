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
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';
import { COLORS, SPACE, RADIUS, SHADOW } from '@/constants';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/Button';
import { getHistory, clearHistory, type HistoryEntry } from '@/services/history';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    getHistory().then((h) => {
      setHistory(h);
      setHistoryLoaded(true);
    });
  }, []);

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take a profile photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  function showAvatarOptions() {
    Alert.alert('Profile Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickAvatar },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

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
          await clearHistory();
          setHistory([]);
        },
      },
    ]);
  }

  const initials = user?.username?.charAt(0).toUpperCase() ?? '?';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Avatar ── */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={showAvatarOptions} style={styles.avatarWrap} activeOpacity={0.85}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={14} color={COLORS.background} />
          </View>
        </TouchableOpacity>

        <Text style={styles.username}>{user?.username}</Text>
        {user?.email && <Text style={styles.email}>{user.email}</Text>}

        {user?.is_guest && (
          <View style={styles.guestBadge}>
            <Ionicons name="person-outline" size={12} color={COLORS.warning} />
            <Text style={styles.guestText}>Guest Account</Text>
          </View>
        )}
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

      {/* ── Watch history ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Watch History</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={confirmClearHistory}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

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
      </View>

      <Button title="Sign Out" onPress={confirmLogout} variant="danger" style={{ marginTop: SPACE.sm }} />
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
  content: { padding: SPACE.lg, gap: SPACE.lg, paddingBottom: 40 },

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
  avatarText: { color: COLORS.background, fontSize: 38, fontWeight: '800' },
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
  },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
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
});
