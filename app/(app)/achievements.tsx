import React from 'react';
import { router } from 'expo-router';
import { AchievementsScreen } from '../../wp-ui';

export default function AchievementsRoute() {
  return <AchievementsScreen onBack={() => router.back()} />;
}
