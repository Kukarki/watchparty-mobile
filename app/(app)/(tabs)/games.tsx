import React, { useState } from 'react';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { PlayScreen } from '../../../wp-ui';
import { socketService } from '@/services/socket';

export default function GamesTab() {
  const [launching, setLaunching] = useState(false);

  async function launchGame(game: { id: string }) {
    if (launching) return;
    setLaunching(true);
    try {
      const socket = await socketService.connect();
      socket.emit('game:create', { gameId: game.id }, (res: any) => {
        setLaunching(false);
        if (res?.error) {
          Toast.show({ type: 'error', text1: `Could not start game: ${res.error}` });
          return;
        }
        const { sessionId } = res.session ?? {};
        if (sessionId) {
          router.push({ pathname: '/(app)/game/[sessionId]', params: { sessionId, gameId: game.id } });
        }
      });
    } catch (err) {
      setLaunching(false);
      Toast.show({ type: 'error', text1: 'Could not connect to server' });
    }
  }

  function joinSession(session: { sessionId: string; gameId?: string }) {
    router.push({
      pathname: '/(app)/game/[sessionId]',
      params: { sessionId: session.sessionId, gameId: session.gameId ?? 'wildbeam' },
    });
  }

  return (
    <PlayScreen
      activeSessions={[]}
      musicRooms={[]}
      onStartGame={launchGame}
      onJoinSession={joinSession}
      onOpenMusicLobby={() => router.push('/(app)/(tabs)/music')}
      onOpenLeaderboard={() => router.push('/(app)/leaderboard')}
    />
  );
}
