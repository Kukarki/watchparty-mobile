import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { COLORS, SPACE, RADIUS, SHADOW } from '@/constants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { login, loginWithGoogle } from '@/services/auth';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginScreen() {
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'At least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      setUser(user);
      router.replace('/(app)');
    } catch (err: any) {
      if (!err?.message?.includes('cancelled')) {
        Toast.show({ type: 'error', text1: 'Google sign-in failed', text2: err?.message });
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login(email.trim().toLowerCase(), password);
      setUser(user);
      router.replace('/(app)');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Login failed';
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
        {/* ── Brand ── */}
        <View style={styles.brand}>
          {/* Amber glow halo behind logo */}
          <View style={styles.logoHalo}>
            <View style={styles.logoWrap}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logoImg}
                resizeMode="cover"
              />
            </View>
          </View>
          <Text style={styles.appName}>WatchParty</Text>
          <Text style={styles.tagline}>Watch together, anywhere.</Text>
        </View>

        {/* ── Sign-in card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSub}>Sign in to your account</Text>

          <View style={styles.fields}>
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
              placeholder="••••••••"
              leftIcon="lock-closed-outline"
              secureTextEntry
              secureToggle
              error={errors.password}
            />
          </View>

          <TouchableOpacity style={styles.forgotWrap}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.signInBtn}
          />

          {/* ── Divider ── */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google sign-in */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleLogin}
            disabled={googleLoading}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <Text style={styles.googleText}>Connecting…</Text>
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <Button
            title="Continue as Guest"
            onPress={() => router.push('/(auth)/guest')}
            variant="outline"
          />
        </View>

        {/* ── Footer ── */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/register')}
          style={styles.footer}
        >
          <Text style={styles.footerText}>
            Don't have an account?{'  '}
            <Text style={styles.footerLink}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.xxl,
    gap: SPACE.lg,
  },

  // ── Brand ──
  brand: {
    alignItems: 'center',
    gap: SPACE.sm,
    marginBottom: SPACE.sm,
  },
  logoHalo: {
    width: 110,
    height: 110,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accentMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACE.xs,
    ...SHADOW.accent,
  },
  logoWrap: {
    width: 84,
    height: 84,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  logoImg: {
    width: 84,
    height: 84,
  },
  appName: {
    color: COLORS.textPrimary,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  tagline: {
    color: COLORS.textSecondary,
    fontSize: 15,
    letterSpacing: 0.2,
  },

  // ── Card ──
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACE.lg,
    gap: SPACE.md,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    ...SHADOW.card,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  cardSub: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: -SPACE.sm,
  },
  fields: {
    gap: SPACE.md,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: -SPACE.xs,
  },
  forgot: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  signInBtn: {
    marginTop: SPACE.xs,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.muted,
    fontSize: 13,
  },

  // ── Google ──
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    backgroundColor: '#fff',
    borderRadius: RADIUS.md,
    paddingVertical: SPACE.md,
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleText: {
    color: '#3c4043',
    fontSize: 15,
    fontWeight: '600',
  },

  // ── Footer ──
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
