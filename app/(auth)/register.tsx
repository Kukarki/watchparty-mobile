import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS, SPACE, RADIUS } from '@/constants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { register } from '@/services/auth';
import { useAuthStore } from '@/stores/auth.store';

export default function RegisterScreen() {
  const setUser = useAuthStore((s) => s.setUser);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!username.trim()) e.username = 'Username is required';
    else if (username.trim().length < 3) e.username = 'At least 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) e.username = 'Letters, numbers, underscores only';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'At least 8 characters';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await register(email.trim().toLowerCase(), password, username.trim());
      setUser(user);
      router.replace('/(app)');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed';
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <View style={styles.heading}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join WatchParty and invite friends</Text>
        </View>

        <View style={styles.card}>
          <Input
            label="Username"
            value={username}
            onChangeText={setUsername}
            placeholder="coolwatcher"
            leftIcon="person-outline"
            error={errors.username}
            autoCapitalize="none"
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="you@example.com"
            leftIcon="mail-outline"
            error={errors.email}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Min 8 characters"
            leftIcon="lock-closed-outline"
            secureTextEntry
            secureToggle
            error={errors.password}
          />
          <Input
            label="Confirm Password"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repeat password"
            leftIcon="lock-closed-outline"
            secureTextEntry
            secureToggle
            error={errors.confirm}
          />
          <Button title="Create Account" onPress={handleRegister} loading={loading} style={{ marginTop: SPACE.xs }} />
        </View>

        <TouchableOpacity onPress={() => router.back()} style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{'  '}
            <Text style={styles.footerLink}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scroll: {
    flexGrow: 1,
    padding: SPACE.lg,
    paddingTop: 60,
    gap: SPACE.lg,
  },
  back: { alignSelf: 'flex-start', padding: 4, marginBottom: SPACE.xs },
  heading: { gap: SPACE.xs },
  title: {
    color: COLORS.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitle: { color: COLORS.textSecondary, fontSize: 15 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACE.lg,
    gap: SPACE.md,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  footer: { alignItems: 'center' },
  footerText: { color: COLORS.textSecondary, fontSize: 14 },
  footerLink: { color: COLORS.primary, fontWeight: '600' },
});
