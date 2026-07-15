import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  GestureResponderEvent,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SOCKET_EVENTS, SPACE, RADIUS } from '@/constants';
import { socketService } from '@/services/socket';
import { useRoomStore } from '@/stores/room.store';
import { YouTubePlayer, extractYouTubeId } from './YouTubePlayer';

const SYNC_THRESHOLD = 2;

interface VideoPlayerProps {
  roomId: string;
  isHost: boolean;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VideoPlayer({ roomId, isHost }: VideoPlayerProps) {
  const { videoState, setVideoState } = useRoomStore();
  const suppressSyncRef = useRef(false);
  const videoViewRef = useRef<React.ElementRef<typeof VideoView>>(null);
  const trackWidthRef = useRef(0);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const player = useVideoPlayer(videoState.url || null, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (!player || !videoState.url) return;
    player.replace(videoState.url);
  }, [videoState.url]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!player) return;
    const drift = Math.abs(player.currentTime - videoState.currentTime);
    if (drift > SYNC_THRESHOLD) {
      suppressSyncRef.current = true;
      player.seekBy(videoState.currentTime - player.currentTime);
      setTimeout(() => { suppressSyncRef.current = false; }, 1000);
    }
    if (videoState.isPlaying && player.status === 'readyToPlay') {
      player.play();
    } else if (!videoState.isPlaying) {
      player.pause();
    }
  }, [videoState.isPlaying, videoState.currentTime, player]);

  // Poll time/duration for progress bar
  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      setCurrentTime(player.currentTime ?? 0);
      setDuration(isFinite(player.duration) ? player.duration : 0);
    }, 500);
    return () => clearInterval(interval);
  }, [player]);

  const handlePlayPause = useCallback(() => {
    if (!isHost) return;
    const newPlaying = !videoState.isPlaying;
    const event = newPlaying ? SOCKET_EVENTS.VIDEO_PLAY : SOCKET_EVENTS.VIDEO_PAUSE;
    socketService.emit(event, { roomId, currentTime: player?.currentTime ?? 0 });
    setVideoState({ isPlaying: newPlaying, currentTime: player?.currentTime ?? 0 });
    flashControls();
  }, [isHost, videoState.isPlaying, player, roomId, setVideoState]);

  const seek = useCallback(
    (delta: number) => {
      if (!isHost || !player) return;
      const newTime = Math.max(0, player.currentTime + delta);
      player.seekBy(delta);
      socketService.emit(SOCKET_EVENTS.VIDEO_SEEK, { roomId, currentTime: newTime });
      setVideoState({ currentTime: newTime });
    },
    [isHost, player, roomId, setVideoState]
  );

  const seekToRatio = useCallback(
    (e: GestureResponderEvent) => {
      if (!isHost || !duration || !trackWidthRef.current) return;
      const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / trackWidthRef.current));
      const newTime = ratio * duration;
      const delta = newTime - (player?.currentTime ?? 0);
      seek(delta);
    },
    [isHost, duration, seek, player]
  );

  function flashControls() {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  }

  function startPiP() {
    try {
      (videoViewRef.current as any)?.startPictureInPicture?.();
    } catch {}
  }

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  const youtubeId = videoState.url ? extractYouTubeId(videoState.url) : null;
  if (youtubeId) {
    return <YouTubePlayer videoId={youtubeId} roomId={roomId} isHost={isHost} />;
  }

  if (!videoState.url) {
    return (
      <View style={styles.empty}>
        <Ionicons name="film-outline" size={48} color={COLORS.muted} />
        <Text style={styles.emptyText}>No video loaded</Text>
        {isHost && (
          <Text style={styles.emptyHint}>Add a video from the queue to start watching</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={flashControls} accessibilityLabel="Toggle video controls">
        <View style={styles.videoTouchable}>
          <VideoView
            ref={videoViewRef}
            player={player}
            style={styles.video}
            contentFit="contain"
            nativeControls={false}
            allowsPictureInPicture
          />
        </View>
      </TouchableWithoutFeedback>

      {/* Overlay controls */}
      {showControls && (
        <View style={styles.controls} pointerEvents="box-none">
          <TouchableOpacity
            onPress={() => seek(-10)}
            disabled={!isHost}
            style={styles.ctrlBtn}
            accessibilityLabel="Seek back 10 seconds"
            accessibilityRole="button"
          >
            <Ionicons name="play-back" size={22} color={isHost ? '#fff' : COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePlayPause}
            disabled={!isHost}
            style={[styles.ctrlBtn, styles.playBtn]}
            accessibilityLabel={videoState.isPlaying ? 'Pause' : 'Play'}
            accessibilityRole="button"
          >
            <Ionicons
              name={videoState.isPlaying ? 'pause' : 'play'}
              size={28}
              color={isHost ? '#fff' : COLORS.muted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => seek(10)}
            disabled={!isHost}
            style={styles.ctrlBtn}
            accessibilityLabel="Seek forward 10 seconds"
            accessibilityRole="button"
          >
            <Ionicons name="play-forward" size={22} color={isHost ? '#fff' : COLORS.muted} />
          </TouchableOpacity>

          {/* PiP button */}
          <TouchableOpacity
            onPress={startPiP}
            style={[styles.ctrlBtn, styles.pipBtn]}
            accessibilityLabel="Picture in picture"
            accessibilityRole="button"
          >
            <Ionicons name="browsers-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Progress bar ── */}
      <View style={styles.progressRow}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <TouchableWithoutFeedback
          onPress={seekToRatio}
          disabled={!isHost || !duration}
          accessibilityLabel={`Video progress: ${formatTime(currentTime)} of ${formatTime(duration)}`}
        >
          <View
            style={styles.track}
            onLayout={(e) => { trackWidthRef.current = e.nativeEvent.layout.width; }}
          >
            <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
            <View
              style={[
                styles.trackThumb,
                { left: `${progress * 100}%` as any },
                !isHost && { display: 'none' },
              ]}
            />
          </View>
        </TouchableWithoutFeedback>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      {!isHost && (
        <View style={styles.guestBadge} accessibilityLabel="Synced with host">
          <Text style={styles.guestBadgeText}>Synced</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  videoTouchable: { flex: 1 },
  video: { flex: 1 },

  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 16,
    backgroundColor: COLORS.overlay,
  },
  ctrlBtn: { padding: 8 },
  playBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    padding: 12,
  },
  pipBtn: {
    position: 'absolute',
    right: 12,
    top: '50%' as any,
    marginTop: -14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: RADIUS.sm,
    padding: 6,
  },

  // ── Progress bar ──
  progressRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  timeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'center',
  },
  track: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  trackFill: {
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  trackThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    top: -4,
    marginLeft: -6,
  },

  // ── Empty ──
  empty: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '600' },
  emptyHint: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  guestBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(124,58,237,0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  guestBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
});
