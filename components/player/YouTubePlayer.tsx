import React, { useRef, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SOCKET_EVENTS } from '@/constants';
import { socketService } from '@/services/socket';
import { useRoomStore } from '@/stores/room.store';

interface YouTubePlayerProps {
  videoId: string;
  roomId: string;
  isHost: boolean;
}

export function YouTubePlayer({ videoId, roomId, isHost }: YouTubePlayerProps) {
  const { videoState, setVideoState } = useRoomStore();
  const playerRef = useRef<YoutubeIframeRef>(null);

  const onStateChange = useCallback(
    (state: string) => {
      if (!isHost) return;
      if (state === 'playing') {
        playerRef.current?.getCurrentTime().then((t) => {
          socketService.emit(SOCKET_EVENTS.VIDEO_PLAY, { roomId, currentTime: t });
          setVideoState({ isPlaying: true, currentTime: t });
        });
      } else if (state === 'paused') {
        playerRef.current?.getCurrentTime().then((t) => {
          socketService.emit(SOCKET_EVENTS.VIDEO_PAUSE, { roomId, currentTime: t });
          setVideoState({ isPlaying: false, currentTime: t });
        });
      }
    },
    [isHost, roomId, setVideoState]
  );

  return (
    <View style={styles.container}>
      <YoutubePlayer
        ref={playerRef}
        height={210}
        videoId={videoId}
        play={videoState.isPlaying}
        onChangeState={onStateChange}
        initialPlayerParams={{ modestbranding: true, rel: false, controls: isHost }}
      />
      {!isHost && (
        <View style={styles.syncBadge}>
          <Text style={styles.syncText}>Synced with host</Text>
        </View>
      )}
    </View>
  );
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&\s]+)/,
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtube\.com\/embed\/([^?&\s]+)/,
    /youtube\.com\/shorts\/([^?&\s]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000',
    position: 'relative',
  },
  syncBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(245,166,35,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  syncText: { color: '#000', fontSize: 11, fontWeight: '700' },
});
