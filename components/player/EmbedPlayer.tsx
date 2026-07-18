import React, { useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { VideoSource } from '@/services/videoDetector';
import { COLORS } from '@/constants';

interface EmbedPlayerProps {
  source: VideoSource;
  isHost: boolean;
  isPlaying: boolean;
  currentTime: number;
}

// Build the embed URL for each platform
function getEmbedUrl(source: VideoSource, isHost: boolean): string {
  switch (source.type) {
    case 'vimeo': {
      const controls = isHost ? 1 : 0;
      return `https://player.vimeo.com/video/${source.videoId}?autoplay=1&controls=${controls}&byline=0&portrait=0&title=0`;
    }
    case 'twitch': {
      const base = source.videoId
        ? `https://player.twitch.tv/?video=${source.videoId}`
        : `https://player.twitch.tv/?channel=${source.channel}`;
      return `${base}&parent=watchparty.me&autoplay=true`;
    }
    case 'dailymotion':
      return `https://www.dailymotion.com/embed/video/${source.videoId}?autoplay=1&controls=${isHost ? 1 : 0}&queue-enable=false`;
    default:
      return '';
  }
}

// JS injected to seek/play/pause via postMessage for Vimeo
function getControlScript(isPlaying: boolean, currentTime: number, sourceType: string): string {
  if (sourceType === 'vimeo') {
    return `
      (function() {
        var iframe = document.querySelector('iframe') || window.frames[0];
        var player = window._vimeoPlayer;
        if (!player && typeof Vimeo !== 'undefined') {
          player = new Vimeo.Player(document.querySelector('iframe'));
          window._vimeoPlayer = player;
        }
        if (player) {
          player.setCurrentTime(${currentTime});
          ${isPlaying ? 'player.play();' : 'player.pause();'}
        }
      })();
      true;
    `;
  }
  return 'true;';
}

export function EmbedPlayer({ source, isHost, isPlaying, currentTime }: EmbedPlayerProps) {
  const webviewRef = useRef<WebView>(null);
  const embedUrl = getEmbedUrl(source, isHost);

  if (!embedUrl) return null;

  // Inject sync controls when state changes (non-host guests)
  const injectScript = !isHost ? getControlScript(isPlaying, currentTime, source.type) : undefined;

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ uri: embedUrl }}
        style={styles.webview}
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        injectedJavaScript={injectScript}
        originWhitelist={['*']}
      />
      {!isHost && (
        <View style={styles.syncBadge}>
          <Text style={styles.syncText}>Synced with host</Text>
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
  webview: { flex: 1 },
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
