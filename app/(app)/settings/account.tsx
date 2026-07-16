import React from 'react';
import { router } from 'expo-router';
import { AccountScreen } from '../../../wp-ui';
import { useAuthStore } from '@/stores/auth.store';

export default function AccountRoute() {
  const { user, logout } = useAuthStore();

  return (
    <AccountScreen
      name={user?.username ?? ''}
      email={user?.email ?? ''}
      userId={user?.id ?? ''}
      onBack={() => router.back()}
      onSignOut={() => { logout().then(() => router.replace('/(auth)/login')); }}
    />
  );
}
