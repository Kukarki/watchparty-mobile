import React from 'react';
import { router } from 'expo-router';
import { LeaderboardScreen } from '../../wp-ui';

export default function LeaderboardRoute() {
  return <LeaderboardScreen onBack={() => router.back()} />;
}
