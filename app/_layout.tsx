import '../global.css';
import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';
import { enforceHttps } from '@/services/security';
import { requestNotificationPermission } from '@/services/notifications';

enforceHttps();

function parseDeepLink(url: string): { roomCode?: string } {
  try {
    const parsed = Linking.parse(url);
    // watchparty://room/ABCD1234  or  https://watchparty.app/room/ABCD1234
    const pathParts = (parsed.path ?? '').split('/').filter(Boolean);
    if (pathParts[0] === 'room' && pathParts[1]) {
      return { roomCode: pathParts[1].toUpperCase() };
    }
    // Also handle ?code=ABCD1234
    if (parsed.queryParams?.code) {
      return { roomCode: String(parsed.queryParams.code).toUpperCase() };
    }
  } catch {}
  return {};
}

export default function RootLayout() {
  const loadStoredUser = useAuthStore((s) => s.loadStoredUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    loadStoredUser();
    requestNotificationPermission();
    SecureStore.getItemAsync('onboarding_done').then((done) => {
      if (!done) router.replace('/onboarding');
    });
  }, [loadStoredUser]);

  // Handle deep links while app is open
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      const { roomCode } = parseDeepLink(url);
      if (roomCode && isAuthenticated) {
        router.push({ pathname: '/(app)', params: { joinCode: roomCode } });
      }
    });
    return () => sub.remove();
  }, [isAuthenticated]);

  // Handle deep link that launched the app from cold start
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (!url) return;
      const { roomCode } = parseDeepLink(url);
      if (roomCode && isAuthenticated) {
        router.push({ pathname: '/(app)', params: { joinCode: roomCode } });
      }
    });
  }, [isAuthenticated]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      <Toast />
    </GestureHandlerRootView>
  );
}
