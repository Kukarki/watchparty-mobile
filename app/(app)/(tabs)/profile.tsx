import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';
import { AvatarApi, useAvatarStore } from '../../../avatar';
import { ProfileTabScreen } from '../../../wp-ui';

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const { saved, catalogIndex, progression, init, refreshProgression } = useAvatarStore();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    init();
    refreshProgression();
    if (!user?.is_guest) {
      AvatarApi.stats().then(setStats).catch(() => {});
    }
  }, []);

  // AvatarStage loads expo-gl — lazy import so it doesn't inflate app startup.
  const [AvatarStage, setAvatarStage] = useState<React.ComponentType<any> | null>(null);
  useEffect(() => {
    if (saved) {
      import('../../../avatar/three/AvatarStage').then((m) => setAvatarStage(() => m.default));
    }
  }, [!!saved]);

  return (
    <ProfileTabScreen
      name={user?.username ?? 'You'}
      progression={progression}
      stats={stats}
      AvatarHero={
        saved && AvatarStage
          ? () => <AvatarStage recipe={saved} catalogIndex={catalogIndex} framing="full" />
          : null
      }
      onEditAvatar={() => router.push('/(app)/avatar-studio')}
      onInventory={() => router.push('/(app)/avatar-inventory')}
      onShop={() => router.push('/(app)/avatar-shop')}
      onSettings={() => router.push('/(app)/settings')}
      onAchievements={() => router.push('/(app)/achievements')}
    />
  );
}
