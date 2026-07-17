import React from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';
import { socketService } from '@/services/socket';
import { WildBeamScreen, MatchBlitzScreen, LudoScreen } from '../../../games';

export default function GameScreen() {
  const { sessionId, gameId } = useLocalSearchParams<{ sessionId: string; gameId: string }>();
  const { user } = useAuthStore();

  const commonProps = {
    socket: socketService.instance,
    sessionId: sessionId ?? '',
    meId: user?.id ?? '',
    playersMeta: {},
    onExit: () => router.back(),
  };

  if (gameId === 'matchblitz') return <MatchBlitzScreen {...commonProps} />;
  if (gameId === 'ludo')      return <LudoScreen {...commonProps} />;
  return <WildBeamScreen {...commonProps} />;
}
