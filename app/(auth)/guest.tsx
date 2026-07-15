import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS, SPACE, RADIUS, SHADOW } from '@/constants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { loginAsGuest } from '@/services/auth';
import { useAuthStore } from '@/stores/auth.store';

export default function GuestScreen() {
  const setUser = useAuthStore((s) => s.setUser);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGuest() {
    const trimmed = username.trim();
    if (!trimmed) { setError('Enter a display name'); return; }
    if (trimmed.length < 2) { setError('At least 2 characters'); return; }
    if (!/^[a-zA-Z0-9_ ]+$/.test(trimmed)) { setError('Letters, numbers, spaces, underscores only'); return; }
    setError('');
    setLoading(true);
    try {
      const user = await loginAsGuest(trimmed);
      setUser(user);
      router.replace('/(app)');
    } catch {
      Toast.show({ type: 'error', text1: 'Could not start guest session' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Icon */}
        <View style={styles.iconHalo}>
          <Ionicons name="person-circle-outline" size={64} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Guest Access</Text>
        <Text style={styles.subtitle}>
          Jump right in without an account.{'\n'}Your data won't be saved after the session.
        </Text>

        <View style={styles.card}>
          <Input
            label="Display name"
            value={username}
            onChangeText={setUsername}
            placeholder="Enter a name to show others"
            leftIcon="person-outline"
            error={error}
            returnKeyType="go"
            onSubmitEditing={handleGuest}
          />
          <Button title="Join as Guest" onPress={handleGuest} loading={loading} />
        </View>

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.muted} />
          <Text style={styles.noticeText}>
            Guest sessions expire after 24 hours. Create an account to save your watch history.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flex: 1,
    padding: SPACE.lg,
    paddingTop: 60,
    gap: SPACE.lg,
  },
  back: { alignSelf: 'flex-start', padding: 4 },
  iconHalo: {
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accentMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACE.md,
    ...SHADOW.accent,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACE.lg,
    gap: SPACE.md,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  notice: {
    flexDirection: 'row',
    gap: SPACE.sm,
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    padding: SPACE.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noticeText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});
