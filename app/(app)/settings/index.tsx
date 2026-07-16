import React from 'react';
import { router } from 'expo-router';
import { SettingsScreen } from '../../../wp-ui';
import { useAuthStore } from '@/stores/auth.store';
import { useAvatarStore } from '../../../avatar';

export default function SettingsRoute() {
  const { user } = useAuthStore();
  const { progression } = useAvatarStore();

  return (
    <SettingsScreen
      name={user?.username ?? ''}
      email={user?.email ?? ''}
      level={progression?.level}
      appVersion="1.0.0"
      onBack={() => router.back()}
      go={(screen: string) => {
        if (screen === 'account') router.push('/(app)/settings/account');
        else if (screen === 'avatar') router.push('/(app)/avatar-studio');
        else router.push({ pathname: '/(app)/settings/[pref]', params: { pref: screen } });
      }}
    />
  );
}
