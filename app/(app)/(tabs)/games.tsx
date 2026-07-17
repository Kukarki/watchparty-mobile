import React from 'react';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { PlayScreen } from '../../../wp-ui';
import { socketService } from '@/services/socket';

export default function GamesTab() {
  function launchGame(game: { id: string }) {
    const socket = socketService.instance;
    if (!socket) {
      Toast.show({ type: 'error', text1: 'Not connected', text2: 'Please rejoin a room first' });
      return;
    }
    socket.emit('game:create', { gameId: game.id }, (res: any) => {
      if (res?.error) {
        Toast.show({ type: 'error', text1: `Could not create game: ${res.error}` });
        return;
      }
      const { sessionId } = res.session ?? {};
      if (sessionId) {
        router.push({ pathname: '/(app)/game/[sessionId]', params: { sessionId, gameId: game.id } });
      }
    });
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
