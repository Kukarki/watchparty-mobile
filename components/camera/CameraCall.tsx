import React from 'react';
import {
  Modal, View, StyleSheet, TouchableOpacity, Text, SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACE, RADIUS } from '@/constants';

interface CameraCallProps {
  visible: boolean;
  roomId: string;
  displayName?: string;
  onClose: () => void;
}

export function CameraCall({ visible, roomId, displayName = 'Guest', onClose }: CameraCallProps) {
  // Sanitize roomId for use in URL
  const jitsiRoom = `watchparty${roomId.replace(/[^a-zA-Z0-9]/g, '')}`;

  // Config via URL hash — no prejoin page, only camera/mic/hangup toolbar
  const url =
    `https://meet.jit.si/${jitsiRoom}` +
    `#userInfo.displayName="${encodeURIComponent(displayName)}"` +
    `&config.prejoinPageEnabled=false` +
    `&config.startWithAudioMuted=false` +
    `&config.startWithVideoMuted=false` +
    `&interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","hangup","tileview"]` +
    `&interfaceConfig.SHOW_JITSI_WATERMARK=false` +
    `&interfaceConfig.SHOW_BRAND_WATERMARK=false`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>📹 Camera Call</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <WebView
          source={{ uri: url }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          originWhitelist={['*']}
          // Grant camera/mic on Android
          onPermissionRequest={(request: any) => {
            if (request?.grant) request.grant(request.resources);
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  closeBtn: {
    padding: SPACE.sm,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
  },
  webview: { flex: 1 },
});
