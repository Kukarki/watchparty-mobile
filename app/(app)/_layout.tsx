import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/stores/auth.store';
import { useFriendStore } from '@/stores/friend.store';
import { socketService } from '@/services/socket';
import { COLORS, SOCKET_EVENTS } from '@/constants';
import { configureAvatarApi, AvatarApi, useAvatarStore } from '../../avatar';

export default function AppLayout() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const { setOnline, setOnlineFromSnapshot } = useFriendStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    configureAvatarApi({
      baseUrl: process.env.EXPO_PUBLIC_AVATAR_URL ?? 'https://sandipwatch7.dedyn.io/api/v1/avatar-system',
      getToken: async () => SecureStore.getItemAsync('auth_token'),
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    useAvatarStore.getState().init();
    AvatarApi.claimLogin().catch(() => {});
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const onPresenceUpdate = (data: unknown) => {
      const { userId, online } = data as { userId: string; online: boolean };
      if (userId) setOnline(userId, online);
    };
    const onPresenceSnapshot = (data: unknown) => {
      const { onlineIds } = data as { onlineIds: string[] };
      if (Array.isArray(onlineIds)) setOnlineFromSnapshot(onlineIds);
    };

    socketService.on(SOCKET_EVENTS.PRESENCE_UPDATE, onPresenceUpdate);
    socketService.on(SOCKET_EVENTS.PRESENCE_SNAPSHOT, onPresenceSnapshot);

    return () => {
      socketService.off(SOCKET_EVENTS.PRESENCE_UPDATE, onPresenceUpdate);
      socketService.off(SOCKET_EVENTS.PRESENCE_SNAPSHOT, onPresenceSnapshot);
    };
  }, [isAuthenticated, user]);

  if (!isAuthenticated) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.card },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      {/* Main tab navigator — no header at this level */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Room screen: slides up full-screen over the tabs */}
      <Stack.Screen
        name="room/[id]"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />

      {/* Avatar screens */}
      <Stack.Screen name="avatar-studio" options={{ title: 'Avatar Studio', headerShown: false }} />
      <Stack.Screen name="avatar-inventory" options={{ title: 'Inventory' }} />
      <Stack.Screen name="avatar-shop" options={{ title: 'Shop' }} />

      {/* Game screen: slides up full-screen */}
      <Stack.Screen
        name="game/[sessionId]"
        options={{ headerShown: false, presentation: 'fullScreenModal' }}
      />

      {/* Settings stack */}
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="settings/account" options={{ headerShown: false }} />
      <Stack.Screen name="settings/[pref]" options={{ headerShown: false }} />

      {/* Social & progress */}
      <Stack.Screen name="achievements" options={{ headerShown: false }} />
      <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
    </Stack>
  );
}
