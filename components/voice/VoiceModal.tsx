import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { useRoomStore } from '@/stores/room.store';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useAuthStore } from '@/stores/auth.store';

interface VoiceModalProps {
  roomId: string;
  visible: boolean;
  onClose: () => void;
}

export function VoiceModal({ roomId, visible, onClose }: VoiceModalProps) {
  const { members, isMuted, isCameraOn, toggleMute, toggleCamera, toggleVoice } =
    useRoomStore();
  const { user } = useAuthStore();
  const { cleanup } = useWebRTC(roomId, user?.id ?? '');

  // Bug fix #9: ensure WebRTC cleanup runs even if parent unmounts without calling onClose
  useEffect(() => {
    return () => { cleanup(); };
  }, [cleanup]);

  const voiceMembers = members.filter((m) => m.is_in_voice);

  const handleLeave = () => {
    cleanup();
    toggleVoice();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleLeave}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Voice Channel</Text>
          <TouchableOpacity onPress={handleLeave} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>
          {voiceMembers.length} participant{voiceMembers.length !== 1 ? 's' : ''}
        </Text>

        <FlatList
          data={voiceMembers}
          keyExtractor={(m) => m.user_id}
          numColumns={3}
          renderItem={({ item }) => (
            <View style={styles.memberCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.username.charAt(0).toUpperCase()}
                </Text>
                {item.user_id === user?.id && isMuted && (
                  <View style={styles.mutedDot}>
                    <Ionicons name="mic-off" size={10} color="#fff" />
                  </View>
                )}
              </View>
              <Text style={styles.memberName} numberOfLines={1}>
                {item.username}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.memberGrid}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No one else in the channel</Text>
          }
        />

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={toggleMute} style={[styles.ctrlBtn, isMuted && styles.ctrlActive]}>
            <Ionicons
              name={isMuted ? 'mic-off' : 'mic'}
              size={24}
              color={isMuted ? COLORS.danger : '#fff'}
            />
            <Text style={styles.ctrlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLeave}
            style={[styles.ctrlBtn, styles.leaveBtn]}
          >
            <Ionicons name="call" size={24} color="#fff" />
            <Text style={styles.ctrlLabel}>Leave</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleCamera}
            style={[styles.ctrlBtn, isCameraOn && styles.ctrlActive]}
          >
            <Ionicons
              name={isCameraOn ? 'videocam' : 'videocam-off'}
              size={24}
              color={isCameraOn ? COLORS.primary : '#fff'}
            />
            <Text style={styles.ctrlLabel}>{isCameraOn ? 'Camera On' : 'Camera'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 8,
  },
  sectionLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  memberGrid: {
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  memberCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  mutedDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    padding: 3,
  },
  memberName: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 80,
  },
  emptyText: {
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 40,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  ctrlBtn: {
    alignItems: 'center',
    gap: 6,
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    minWidth: 80,
  },
  ctrlActive: {
    backgroundColor: COLORS.cardElevated,
  },
  leaveBtn: {
    backgroundColor: COLORS.danger,
  },
  ctrlLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
});
