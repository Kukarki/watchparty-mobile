import React from 'react';
import { router } from 'expo-router';
import { PlayScreen } from '../../../wp-ui';

export default function GamesTab() {
  return (
    <PlayScreen
      activeSessions={[]}
      musicRooms={[]}
      onStartGame={(game: any) => {
        router.push('/(app)/(tabs)/rooms');
      }}
      onOpenMusicLobby={() => router.push('/(app)/(tabs)/music')}
      onOpenLeaderboard={() => router.push('/(app)/leaderboard')}
    />
  );
}
