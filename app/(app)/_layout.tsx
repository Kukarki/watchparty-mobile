import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';
import { COLORS } from '@/constants';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Bug fix #1: never navigate during render — use useEffect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isLoading, isAuthenticated]);

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
      <Stack.Screen name="index" options={{ title: 'WatchParty' }} />
      <Stack.Screen
        name="room/[id]"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
    </Stack>
  );
}
