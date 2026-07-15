import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { authApi } from '@/services/api';
import { saveSession } from '@/services/auth';
import { useAuthStore } from '@/stores/auth.store';

// Required for expo-web-browser to complete the auth session on this screen
WebBrowser.maybeCompleteAuthSession();

export default function AuthCallback() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    async function handleCallback() {
      try {
        const url = await Linking.getInitialURL();
        if (!url) {
          router.replace('/(auth)/login');
          return;
        }

        // Supabase puts the token in the URL hash: #access_token=...
        const hash = url.split('#')[1] ?? '';
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token') ??
          new URLSearchParams(url.split('?')[1] ?? '').get('access_token');

        if (!accessToken) {
          router.replace('/(auth)/login');
          return;
        }

        const { data } = await authApi.supabaseCallback(accessToken);
        await saveSession(data.token, data.user);
        setUser(data.user);
        router.replace('/(app)');
      } catch {
        router.replace('/(auth)/login');
      }
    }

    handleCallback();
  }, [setUser]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#09090f' }}>
      <ActivityIndicator color="#F5A623" size="large" />
    </View>
  );
}
