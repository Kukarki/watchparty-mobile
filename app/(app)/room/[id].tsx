import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Share,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Switch,
  AppState,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS, SOCKET_EVENTS, EMOJI_REACTIONS, SPACE, RADIUS, SHADOW } from '@/constants';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { VoiceModal } from '@/components/voice/VoiceModal';
import { FloatingReaction } from '@/components/ui/FloatingReaction';
import { socketService } from '@/services/socket';
import { roomsApi, chatApi, queueApi, mapChatMessage, mapMember, mapRoom, mapQueueItem } from '@/services/api';
import { useRoomStore } from '@/stores/room.store';
import { useAuthStore } from '@/stores/auth.store';
import { ChatMessage, RoomMember, QueueItem } from '@/types';
import { isAllowedVideoUrl, sanitizeInput } from '@/services/security';
import { showLocalNotification } from '@/services/notifications';
import { addToHistory } from '@/services/history';
import { hapticSuccess, hapticMedium, hapticLight } from '@/services/haptics';
import { useWebRTC } from '@/hooks/useWebRTC';
import { CameraCall } from '@/components/camera/CameraCall';

const { width: SCREEN_W } = Dimensions.get('window');

interface ReactionItem {
  id: string;
  emoji: string;
  x: number;
}

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const {
    currentRoom, members, messages, queue,
    isChatOpen, isVoiceActive,
    setRoom, setMembers, addMember, removeMember,
    addMessage, setMessages, setQueue, setVideoState,
    toggleChat, toggleVoice, reset,
    addTypingUser, removeTypingUser,
  } = useRoomStore();

  const { isScreenSharing, remoteScreenStream, startScreenShare, stopScreenShare } =
    useWebRTC(id ?? '', user?.id ?? '');

  // ── Badge count (app icon) ─────────────────────────────────────────────────
  const appStateRef = useRef(AppState.currentState);
  const unreadRef = useRef(0);
  const leavePayloadRef = useRef<{ endForAll?: boolean }>({});
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        unreadRef.current = 0;
        Notifications.setBadgeCountAsync(0).catch(() => {});
      }
      appStateRef.current = state;
    });
    Notifications.setBadgeCountAsync(0).catch(() => {});
    return () => sub.remove();
  }, []);

  const [loading, setLoading] = useState(true);
  const [showVoice, setShowVoice] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [addVideoUrl, setAddVideoUrl] = useState('');
  const [addVideoTitle, setAddVideoTitle] = useState('');
  const [addingVideo, setAddingVideo] = useState(false);

  // ── Floating reactions ──────────────────────────────────────────────────────
  const [reactions, setReactions] = useState<ReactionItem[]>([]);
  const reactionIdRef = useRef(0);

  function spawnReaction(emoji: string) {
    const id = String(reactionIdRef.current++);
    const x = SPACE.lg + Math.random() * (SCREEN_W - 100);
    setReactions((prev) => [...prev, { id, emoji, x }]);
  }

  function removeReaction(id: string) {
    setReactions((prev) => prev.filter((r) => r.id !== id));
  }

  function sendReaction(emoji: string) {
    spawnReaction(emoji);
    socketService.emit(SOCKET_EVENTS.CHAT_REACTION, { roomId: id, emoji });
  }

  // ── 3-2-1 Countdown ────────────────────────────────────────────────────────
  const [countdown, setCountdown] = useState<number | null>(null);
  const prevPlayingRef = useRef(false);
  const videoState = useRoomStore((s) => s.videoState);

  const countdownIvRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (videoState.isPlaying && !prevPlayingRef.current) {
      if (countdownIvRef.current) clearInterval(countdownIvRef.current);
      setCountdown(3);
      countdownIvRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c === null || c <= 1) {
            clearInterval(countdownIvRef.current!);
            countdownIvRef.current = null;
            return null;
          }
          return c - 1;
        });
      }, 1000);
    }
    prevPlayingRef.current = videoState.isPlaying;
    return () => {
      if (countdownIvRef.current) { clearInterval(countdownIvRef.current); countdownIvRef.current = null; }
    };
  }, [videoState.isPlaying]);

  const isHost = currentRoom?.host_id === user?.id;

  // ── Socket setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id || !user) return;
    let mounted = true;

    async function init() {
      try {
        await socketService.connect();
        const [roomRes, chatRes, queueRes] = await Promise.all([
          roomsApi.get(id),
          chatApi.getHistory(id),
          queueApi.get(id),
        ]);
        if (!mounted) return;
        setRoom(roomRes.data.room);
        setMessages(chatRes.data.messages ?? []);
        setQueue(queueRes.data.items ?? []);
        if (roomRes.data.room.current_video_url) {
          setVideoState({
            url: roomRes.data.room.current_video_url,
            currentTime: roomRes.data.room.current_time ?? 0,
            isPlaying: roomRes.data.room.is_playing ?? false,
          });
        }
        if (!mounted) return;
        socketService.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId: id });
        // Record to watch history (per-user)
        if (roomRes.data.room) {
          addToHistory({
            id: roomRes.data.room.id,
            name: roomRes.data.room.name,
            code: roomRes.data.room.code ?? roomRes.data.room.id,
          }, user?.id);
        }
        setLoading(false);
      } catch {
        Toast.show({ type: 'error', text1: 'Could not load room' });
        router.back();
      }
    }

    init();

    const onMemberJoined = (data: unknown) => {
      const { member } = data as { member: unknown };
      const mapped = mapMember(member);
      addMember(mapped);
      hapticSuccess();
      showLocalNotification('Someone joined!', `${mapped.username ?? 'A friend'} joined the room`);
    };
    const onMemberLeft = (data: unknown) => {
      const { userId } = data as { userId: string };
      removeMember(userId);
    };
    const onChatMessage = (data: unknown) => {
      const { message } = data as { message?: unknown };
      addMessage({ ...mapChatMessage(message ?? data), room_id: id });
      hapticLight();
      // Increment badge when app is in background
      if (appStateRef.current !== 'active') {
        unreadRef.current += 1;
        Notifications.setBadgeCountAsync(unreadRef.current).catch(() => {});
      }
    };
    const onChatTyping = (data: unknown) => {
      const { username } = data as { username?: string };
      if (username && username !== user?.username) addTypingUser(username);
    };
    const onChatStopTyping = (data: unknown) => {
      const { username } = data as { username?: string };
      if (username) removeTypingUser(username);
    };
    const onChatReaction = (data: unknown) => {
      const { emoji } = data as { emoji: string };
      if (emoji) spawnReaction(emoji);
    };
    const onVideoPlay = (data: unknown) => {
      const { currentTime } = data as { currentTime: number };
      setVideoState({ isPlaying: true, currentTime });
    };
    const onVideoPause = (data: unknown) => {
      const { currentTime } = data as { currentTime: number };
      setVideoState({ isPlaying: false, currentTime });
    };
    const onVideoSeek = (data: unknown) => {
      const { currentTime } = data as { currentTime: number };
      setVideoState({ currentTime });
    };
    const onQueueUpdate = (data: unknown) => {
      const { items } = data as { items: QueueItem[] };
      setQueue(items);
    };
    const onRoomJoined = (data: unknown) => {
      const payload = data as {
        room?: unknown;
        members?: unknown[];
        chatHistory?: unknown[];
        videoState?: { videoUrl?: string; currentTime?: number; isPlaying?: boolean };
      };
      if (payload.room) setRoom(mapRoom(payload.room));
      if (payload.members) setMembers(payload.members.map(mapMember));
      if (payload.chatHistory) {
        setMessages(payload.chatHistory.map((m) => ({ ...mapChatMessage(m), room_id: id })));
      }
      if (payload.videoState) {
        setVideoState({
          url: payload.videoState.videoUrl ?? '',
          currentTime: payload.videoState.currentTime ?? 0,
          isPlaying: payload.videoState.isPlaying ?? false,
        });
      }
      setLoading(false);
    };
    const onVideoState = (data: unknown) => {
      const state = data as { videoUrl?: string; currentTime?: number; isPlaying?: boolean };
      setVideoState({ url: state.videoUrl ?? '', currentTime: state.currentTime ?? 0, isPlaying: state.isPlaying ?? false });
    };
    const onRoomError = () => {
      Toast.show({ type: 'error', text1: 'Could not join room' });
      router.back();
    };

    socketService.on(SOCKET_EVENTS.ROOM_JOINED, onRoomJoined);
    socketService.on(SOCKET_EVENTS.ROOM_ERROR, onRoomError);
    socketService.on(SOCKET_EVENTS.MEMBER_JOINED, onMemberJoined);
    socketService.on(SOCKET_EVENTS.CHAT_TYPING, onChatTyping as (...args: unknown[]) => void);
    socketService.on(SOCKET_EVENTS.CHAT_STOP_TYPING, onChatStopTyping as (...args: unknown[]) => void);
    socketService.on(SOCKET_EVENTS.MEMBER_LEFT, onMemberLeft);
    socketService.on(SOCKET_EVENTS.CHAT_MESSAGE, onChatMessage);
    socketService.on(SOCKET_EVENTS.CHAT_REACTION, onChatReaction);
    socketService.on(SOCKET_EVENTS.VIDEO_STATE, onVideoState);
    socketService.on(SOCKET_EVENTS.VIDEO_PLAY, onVideoPlay);
    socketService.on(SOCKET_EVENTS.VIDEO_PAUSE, onVideoPause);
    socketService.on(SOCKET_EVENTS.VIDEO_SEEK, onVideoSeek);
    socketService.on(SOCKET_EVENTS.QUEUE_UPDATE, onQueueUpdate);

    return () => {
      mounted = false;
      socketService.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId: id, ...leavePayloadRef.current });
      socketService.off(SOCKET_EVENTS.ROOM_JOINED, onRoomJoined);
      socketService.off(SOCKET_EVENTS.ROOM_ERROR, onRoomError);
      socketService.off(SOCKET_EVENTS.MEMBER_JOINED, onMemberJoined);
      socketService.off(SOCKET_EVENTS.CHAT_TYPING, onChatTyping as (...args: unknown[]) => void);
      socketService.off(SOCKET_EVENTS.CHAT_STOP_TYPING, onChatStopTyping as (...args: unknown[]) => void);
      socketService.off(SOCKET_EVENTS.MEMBER_LEFT, onMemberLeft);
      socketService.off(SOCKET_EVENTS.CHAT_MESSAGE, onChatMessage);
      socketService.off(SOCKET_EVENTS.CHAT_REACTION, onChatReaction);
      socketService.off(SOCKET_EVENTS.VIDEO_STATE, onVideoState);
      socketService.off(SOCKET_EVENTS.VIDEO_PLAY, onVideoPlay);
      socketService.off(SOCKET_EVENTS.VIDEO_PAUSE, onVideoPause);
      socketService.off(SOCKET_EVENTS.VIDEO_SEEK, onVideoSeek);
      socketService.off(SOCKET_EVENTS.QUEUE_UPDATE, onQueueUpdate);
      reset();
    };
  }, [id, user]);

  const handleLeave = useCallback(() => {
    Alert.alert('Leave Room', 'Are you sure you want to leave?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => router.back() },
    ]);
  }, []);

  const shareRoom = useCallback(() => {
    if (!currentRoom) return;
    const deepLink = `watchparty://room/${currentRoom.code}`;
    Share.share({
      message: `Join my WatchParty room "${currentRoom.name}"!\nRoom code: ${currentRoom.code}\nOpen directly: ${deepLink}`,
      url: deepLink,
    });
  }, [currentRoom]);

  const handleEndRoom = useCallback(() => {
    Alert.alert('End Party', 'End the watch party for everyone?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Party',
        style: 'destructive',
        onPress: () => {
          leavePayloadRef.current = { endForAll: true };
          router.back();
        },
      },
    ]);
  }, [id]);

  async function loadVideoDirectly() {
    const url = addVideoUrl.trim();
    if (!url) return;
    if (!isAllowedVideoUrl(url)) {
      Toast.show({ type: 'error', text1: 'Invalid URL — only http/https allowed' });
      return;
    }
    setVideoState({ url, currentTime: 0, isPlaying: false });
    socketService.emit(SOCKET_EVENTS.VIDEO_CHANGE_URL, { roomId: id, videoUrl: url });
    setAddVideoUrl('');
    hapticSuccess();
    Toast.show({ type: 'success', text1: 'Video loaded!' });
  }

  async function addToQueue() {
    const url = addVideoUrl.trim();
    if (!url) return;
    if (!isAllowedVideoUrl(url)) {
      Toast.show({ type: 'error', text1: 'Invalid URL — only http/https allowed' });
      return;
    }
    setAddingVideo(true);
    try {
      const safeTitle = sanitizeInput(addVideoTitle.trim() || url);
      await queueApi.add(id, { url, title: safeTitle });
      setAddVideoUrl('');
      setAddVideoTitle('');
      Toast.show({ type: 'success', text1: 'Added to queue' });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not add video' });
    } finally {
      setAddingVideo(false);
    }
  }

  async function playFromQueue(item: QueueItem) {
    if (!isHost) return;
    setVideoState({ url: item.url, currentTime: 0, isPlaying: true });
    socketService.emit(SOCKET_EVENTS.VIDEO_CHANGE_URL, { roomId: id, videoUrl: item.url });
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Joining room…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleLeave} style={styles.iconBtn}>
          <Ionicons name="chevron-down" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.roomTitleWrap}>
          <Text style={styles.roomTitle} numberOfLines={1}>{currentRoom?.name}</Text>
          <View style={styles.codePill}>
            <Text style={styles.codePillText}>{currentRoom?.code}</Text>
          </View>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity onPress={shareRoom} style={styles.iconBtn}>
            <Ionicons name="share-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowQueue(true)} style={styles.iconBtn}>
            <Ionicons name="list" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          {isHost && (
            <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.iconBtn}>
              <Ionicons name="settings-outline" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Member presence bar ── */}
      {members.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presenceRow}
        >
          {members.map((m) => (
            <View key={m.user_id} style={styles.presenceItem}>
              <View style={styles.presenceAvatar}>
                <Text style={styles.presenceInitial}>
                  {(m.username ?? m.user_id).charAt(0).toUpperCase()}
                </Text>
                <View style={styles.onlineDot} />
              </View>
              <Text style={styles.presenceName} numberOfLines={1}>
                {m.username ?? 'Guest'}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ── Video + reactions layer ── */}
      <View style={styles.videoWrap}>
        <VideoPlayer roomId={id} isHost={isHost} />

        {/* Floating emoji reactions */}
        {reactions.map((r) => (
          <FloatingReaction
            key={r.id}
            emoji={r.emoji}
            x={r.x}
            onDone={() => removeReaction(r.id)}
          />
        ))}

        {/* 3-2-1 Countdown overlay */}
        {countdown !== null && (
          <View style={styles.countdownOverlay}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}
      </View>

      {/* ── Load video URL (host, no video loaded) ── */}
      {isHost && !videoState.url && (
        <View style={styles.loadVideoRow}>
          <Ionicons name="logo-youtube" size={20} color={COLORS.primary} style={{ marginLeft: SPACE.sm }} />
          <TextInput
            value={addVideoUrl}
            onChangeText={setAddVideoUrl}
            placeholder="YouTube, Vimeo, Twitch, Dailymotion, .m3u8, .mp4…"
            placeholderTextColor={COLORS.muted}
            style={styles.loadVideoInput}
            autoCapitalize="none"
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={loadVideoDirectly}
          />
          <TouchableOpacity
            onPress={loadVideoDirectly}
            style={[styles.loadVideoBtn, !addVideoUrl.trim() && { opacity: 0.4 }]}
            disabled={!addVideoUrl.trim()}
          >
            <Text style={styles.loadVideoBtnText}>Load</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Emoji quick-react bar ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.reactionBar}
      >
        {EMOJI_REACTIONS.map((emoji) => (
          <TouchableOpacity
            key={emoji}
            style={styles.reactionBtn}
            onPress={() => sendReaction(emoji)}
          >
            <Text style={styles.reactionEmoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Bottom controls ── */}
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={toggleChat}
          style={[styles.ctrlBtn, isChatOpen && styles.ctrlActive]}
        >
          <Ionicons
            name="chatbubble-outline"
            size={22}
            color={isChatOpen ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.ctrlLabel, isChatOpen && { color: COLORS.primary }]}>Chat</Text>
          {messages.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{Math.min(messages.length, 99)}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { if (!isVoiceActive) toggleVoice(); setShowVoice(true); }}
          style={[styles.ctrlBtn, isVoiceActive && styles.ctrlActive]}
        >
          <Ionicons
            name={isVoiceActive ? 'mic' : 'mic-outline'}
            size={22}
            color={isVoiceActive ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.ctrlLabel, isVoiceActive && { color: COLORS.primary }]}>Voice</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowQueue(true)} style={styles.ctrlBtn}>
          <Ionicons name="play-circle-outline" size={22} color={COLORS.textSecondary} />
          <Text style={styles.ctrlLabel}>Queue</Text>
          {queue.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{queue.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            hapticMedium();
            if (isScreenSharing) stopScreenShare();
            else startScreenShare();
          }}
          style={[styles.ctrlBtn, isScreenSharing && styles.ctrlActive]}
          accessibilityLabel={isScreenSharing ? 'Stop screen share' : 'Share screen'}
          accessibilityRole="button"
        >
          <Ionicons
            name={isScreenSharing ? 'stop-circle-outline' : 'share-social-outline'}
            size={22}
            color={isScreenSharing ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.ctrlLabel, isScreenSharing && { color: COLORS.primary }]}>
            {isScreenSharing ? 'Sharing' : 'Screen'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { hapticMedium(); setShowCamera(true); }}
          style={[styles.ctrlBtn, showCamera && styles.ctrlActive]}
          accessibilityLabel="Camera call"
          accessibilityRole="button"
        >
          <Ionicons
            name={showCamera ? 'videocam' : 'videocam-outline'}
            size={22}
            color={showCamera ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.ctrlLabel, showCamera && { color: COLORS.primary }]}>Camera</Text>
        </TouchableOpacity>
      </View>

      {/* ── Remote screen share overlay (WebRTC disabled) ── */}
      {remoteScreenStream && !isScreenSharing && (
        <View style={styles.screenShareOverlay}>
          <View style={styles.screenShareView} />
          <View style={styles.screenShareBadge}>
            <Ionicons name="share-social-outline" size={12} color={COLORS.background} />
            <Text style={styles.screenShareBadgeText}>Screen Shared</Text>
          </View>
        </View>
      )}

      {/* ── Chat slide-up overlay ── */}
      {isChatOpen && (
        <View style={styles.chatOverlay}>
          <TouchableOpacity onPress={toggleChat} style={styles.chatDismiss} />
          <View style={styles.chatPanel}>
            <View style={styles.chatHandle} />
            <ChatPanel roomId={id} />
          </View>
        </View>
      )}

      {/* ── Voice modal ── */}
      <VoiceModal roomId={id} visible={showVoice} onClose={() => setShowVoice(false)} />

      {/* ── Camera call modal ── */}
      <CameraCall
        visible={showCamera}
        roomId={id}
        displayName={user?.username ?? user?.email ?? 'Guest'}
        onClose={() => setShowCamera(false)}
      />

      {/* ── Queue modal ── */}
      <Modal visible={showQueue} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowQueue(false)}>
        <View style={styles.queueModal}>
          <View style={styles.modalHandle} />
          <View style={styles.queueHeader}>
            <Text style={styles.queueTitle}>Watch Queue</Text>
            <TouchableOpacity onPress={() => setShowQueue(false)} style={styles.iconBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.addVideoSection}>
            <TextInput
              value={addVideoTitle}
              onChangeText={setAddVideoTitle}
              placeholder="Title (optional)"
              placeholderTextColor={COLORS.muted}
              style={styles.addInput}
            />
            <TextInput
              value={addVideoUrl}
              onChangeText={setAddVideoUrl}
              placeholder="YouTube, Vimeo, Twitch, Dailymotion, HLS .m3u8, direct .mp4…"
              placeholderTextColor={COLORS.muted}
              style={styles.addInput}
              autoCapitalize="none"
              keyboardType="url"
            />
            <TouchableOpacity
              onPress={addToQueue}
              style={[styles.addBtn, (!addVideoUrl.trim() || addingVideo) && styles.addBtnDisabled]}
              disabled={!addVideoUrl.trim() || addingVideo}
            >
              <Ionicons name="add" size={20} color={COLORS.background} />
              <Text style={styles.addBtnText}>Add to Queue</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={queue}
            keyExtractor={(q) => q.id}
            renderItem={({ item }) => (
              <View style={styles.queueItem}>
                <View style={styles.queueThumb}>
                  <Ionicons name="film-outline" size={18} color={COLORS.primary} />
                </View>
                <View style={styles.queueItemInfo}>
                  <Text style={styles.queueItemTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.queueItemUrl} numberOfLines={1}>{item.url}</Text>
                </View>
                {isHost && (
                  <TouchableOpacity onPress={() => playFromQueue(item)} style={styles.playBtn}>
                    <Ionicons name="play" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyQueue}>Queue is empty. Add a video above!</Text>
            }
            contentContainerStyle={{ gap: SPACE.sm, paddingBottom: 40 }}
          />
        </View>
      </Modal>
      {/* ── Settings modal (host only) ── */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.queueModal}>
          <View style={styles.modalHandle} />
          <View style={styles.queueHeader}>
            <Text style={styles.queueTitle}>Room Settings</Text>
            <TouchableOpacity onPress={() => setShowSettings(false)} style={styles.iconBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Room Name</Text>
            <Text style={styles.settingValue}>{currentRoom?.name}</Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Room Code</Text>
            <Text style={[styles.settingValue, { color: COLORS.primary }]}>
              {currentRoom?.code}
            </Text>
          </View>

          <View style={[styles.settingRow, { justifyContent: 'space-between' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Public Room</Text>
              <Text style={styles.settingHint}>Visible in Discover tab</Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: COLORS.borderStrong, true: COLORS.primary }}
              thumbColor={COLORS.background}
              ios_backgroundColor={COLORS.borderStrong}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Members Online</Text>
            <Text style={styles.settingValue}>{members.length}</Text>
          </View>

          <View style={{ gap: SPACE.sm, marginTop: SPACE.md }}>
            <TouchableOpacity
              style={styles.settingShareBtn}
              onPress={() => { setShowSettings(false); shareRoom(); }}
            >
              <Ionicons name="share-outline" size={18} color={COLORS.primary} />
              <Text style={styles.settingShareText}>Share Invite Link</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingEndBtn} onPress={() => { setShowSettings(false); handleEndRoom(); }}>
              <Ionicons name="power-outline" size={18} color={COLORS.danger} />
              <Text style={styles.settingEndText}>End Party for Everyone</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACE.md,
    backgroundColor: COLORS.background,
  },
  loadingText: { color: COLORS.textSecondary, fontSize: 15 },

  // ── Top bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.sm,
    gap: SPACE.sm,
  },
  iconBtn: { padding: SPACE.sm },
  roomTitleWrap: { flex: 1, alignItems: 'center', gap: 4 },
  roomTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  codePill: {
    backgroundColor: COLORS.accentMuted,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
  },
  codePillText: { color: COLORS.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  topActions: { flexDirection: 'row' },

  // ── Presence bar ──
  presenceRow: {
    paddingHorizontal: SPACE.lg,
    gap: SPACE.md,
    paddingBottom: SPACE.sm,
  },
  presenceItem: { alignItems: 'center', gap: 4, width: 52 },
  presenceAvatar: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  presenceInitial: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  presenceName: { color: COLORS.muted, fontSize: 10, textAlign: 'center' },

  // ── Video ──
  videoWrap: { position: 'relative' },

  // ── Countdown overlay ──
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  countdownText: {
    fontSize: 96,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -4,
  },

  // ── Reaction bar ──
  reactionBar: {
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    gap: SPACE.sm,
  },
  reactionBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reactionEmoji: { fontSize: 22 },

  // ── Bottom controls ──
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  ctrlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: SPACE.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    minWidth: 64,
    position: 'relative',
  },
  ctrlActive: {
    backgroundColor: COLORS.accentMuted,
    borderWidth: 1,
    borderColor: COLORS.primary + '66',
  },
  ctrlLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '600' },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: COLORS.background, fontSize: 9, fontWeight: '800' },

  // ── Chat overlay ──
  chatOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
  },
  chatDismiss: { flex: 0.3, backgroundColor: 'rgba(0,0,0,0.4)' },
  chatPanel: {
    flex: 0.7,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.xl,
    overflow: 'hidden',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.borderStrong,
  },
  chatHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.borderStrong,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: SPACE.sm,
  },

  // ── Queue modal ──
  queueModal: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACE.lg,
    paddingTop: SPACE.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.borderStrong,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACE.md,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.lg,
  },
  queueTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '700' },
  addVideoSection: { gap: SPACE.sm, marginBottom: SPACE.lg },
  addInput: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.md,
    color: COLORS.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACE.md,
  },
  addBtnDisabled: { opacity: 0.45 },
  addBtnText: { color: COLORS.background, fontWeight: '700', fontSize: 15 },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACE.md,
    gap: SPACE.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  queueThumb: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.accentMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  queueItemInfo: { flex: 1 },
  queueItemTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  queueItemUrl: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  playBtn: {
    padding: SPACE.sm,
    backgroundColor: COLORS.accentMuted,
    borderRadius: RADIUS.sm,
  },
  emptyQueue: { color: COLORS.muted, textAlign: 'center', marginTop: 40, fontSize: 14 },

  // ── Settings modal ──
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACE.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACE.md,
  },
  settingLabel: { color: COLORS.textSecondary, fontSize: 14, flex: 1 },
  settingValue: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  settingHint: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  settingShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    backgroundColor: COLORS.accentMuted,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
    borderRadius: RADIUS.md,
    padding: SPACE.md,
  },
  settingShareText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  settingEndBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    backgroundColor: COLORS.danger + '14',
    borderWidth: 1,
    borderColor: COLORS.danger + '44',
    borderRadius: RADIUS.md,
    padding: SPACE.md,
  },
  settingEndText: { color: COLORS.danger, fontSize: 15, fontWeight: '600' },

  // ── Screen share overlay ──
  screenShareOverlay: {
    position: 'absolute',
    bottom: 80,
    right: SPACE.md,
    width: 140,
    aspectRatio: 16 / 9,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOW.accent,
  },
  screenShareView: { flex: 1 },
  screenShareBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  screenShareBadgeText: {
    color: COLORS.background,
    fontSize: 9,
    fontWeight: '700',
  },

  // ── Load video row ──
  loadVideoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.sm,
    gap: SPACE.sm,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderStrong,
  },
  loadVideoInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    color: COLORS.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  loadVideoBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadVideoBtnText: {
    color: COLORS.background,
    fontWeight: '700',
    fontSize: 14,
  },
});
