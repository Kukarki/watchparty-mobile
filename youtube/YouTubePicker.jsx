// YouTubePicker — full YouTube inside the app (Hearo-style).
//
// The user searches, browses, and can sign in — it's a real YouTube session
// with its own cookie jar (separate from Chrome; nothing is read from the
// system browser, which is impossible anyway).
//
// The trick: we let every URL load EXCEPT watch pages. When the user taps a
// video, we cancel the navigation, pull the video id out of the URL, and show
// our own "Create room / Watch alone" sheet.
//
//   npx expo install react-native-webview
//
//   <YouTubePicker
//     visible={show}
//     onClose={() => setShow(false)}
//     onPick={({ videoId, url, title }) => { ... }}   // choice made in-sheet
//   />
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator, Image, Modal, Platform, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

// ---- tokens (kept local so this file drops in anywhere) -----------------
const c = {
  ink: '#0B0D14', surface: '#141826', surface2: '#1B2133', border: '#232A3F',
  beam: '#8B7CFF', beamHot: '#B7A8FF', beamDim: 'rgba(139,124,255,0.14)',
  text: '#EEF1FA', text2: '#A8B0C6', dim: '#6F7894', warn: '#FFB454',
};

const HOME = 'https://m.youtube.com/';

/**
 * Pull a video id out of any YouTube URL shape:
 *   m.youtube.com/watch?v=ID    youtu.be/ID
 *   m.youtube.com/shorts/ID     /live/ID     /embed/ID
 * Returns null for search pages, channels, the feed, etc.
 */
export function parseYouTubeId(url = '') {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0];
      return /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (!/(^|\.)youtube\.com$/.test(host)) return null;

    if (u.pathname === '/watch') {
      const id = u.searchParams.get('v');
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }
    const m = u.pathname.match(/^\/(shorts|live|embed|v)\/([\w-]{11})/);
    return m ? m[2] : null;
  } catch {
    return null;
  }
}

// Ask the page for its title/author once we've caught a video.
const GRAB_META = `
(function () {
  try {
    var t = document.querySelector('meta[name="title"]')
         || document.querySelector('meta[property="og:title"]');
    var a = document.querySelector('link[itemprop="name"]');
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'meta',
      title: (t && t.content) || document.title.replace(/ - YouTube$/, ''),
      author: a ? a.content : null,
    }));
  } catch (e) {}
})();
true;
`;

export default function YouTubePicker({
  visible, onClose, onPick, allowWatchAlone = true, roomExists = false,
}) {
  const webRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [canBack, setCanBack] = useState(false);
  const [pending, setPending] = useState(null);   // { videoId, url, title? }

  // Called for every navigation attempt inside the WebView.
  const onShouldStart = useCallback((req) => {
    // Only judge top-level navigations (iOS reports iframes too).
    if (Platform.OS === 'ios' && !req.isTopFrame) return true;

    const videoId = parseYouTubeId(req.url);
    if (!videoId) return true;             // search, channel, feed, login -> allow

    // It's a video: don't navigate, ask what to do with it.
    setPending({ videoId, url: `https://youtu.be/${videoId}` });
    return false;
  }, []);

  const onMessage = useCallback((e) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'meta') {
        setPending((p) => (p ? { ...p, title: msg.title, author: msg.author } : p));
      }
    } catch {}
  }, []);

  const choose = (mode) => {
    const picked = { ...pending, mode };   // mode: 'room' | 'alone' | 'queue'
    setPending(null);
    onPick && onPick(picked);
    onClose && onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={st.root}>
        {/* our header — the only chrome over YouTube */}
        <View style={st.bar}>
          <Pressable onPress={() => (canBack ? webRef.current.goBack() : onClose())}
            hitSlop={12} style={st.barBtn}>
            <Ionicons name={canBack ? 'chevron-back' : 'close'} size={22} color={c.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={st.barTitle}>Choose a video</Text>
            <Text style={st.barSub}>Search or sign in — it stays in WatchParty</Text>
          </View>
          <Pressable onPress={() => webRef.current.injectJavaScript(`location.href='${HOME}';true;`)}
            hitSlop={12} style={st.barBtn}>
            <Ionicons name="home-outline" size={19} color={c.text2} />
          </Pressable>
        </View>

        <WebView
          ref={webRef}
          source={{ uri: HOME }}
          onShouldStartLoadWithRequest={onShouldStart}
          onNavigationStateChange={(nav) => setCanBack(nav.canGoBack)}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onMessage={onMessage}
          injectedJavaScript={GRAB_META}
          // a real mobile browser UA so YouTube serves the normal mobile site
          // (and Google's sign-in isn't blocked as an "insecure browser")
          userAgent={Platform.select({
            ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            android: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
          })}
          sharedCookiesEnabled          // iOS: persist the YouTube login
          thirdPartyCookiesEnabled      // Android: same
          domStorageEnabled
          javaScriptEnabled
          allowsBackForwardNavigationGestures
          setSupportMultipleWindows={false}   // keep target=_blank in this view
          style={{ flex: 1, backgroundColor: c.ink }}
        />

        {loading && (
          <View style={st.loader}><ActivityIndicator color={c.beam} /></View>
        )}

        {/* what do you want to do with this video? */}
        <Modal visible={!!pending} transparent animationType="fade"
          onRequestClose={() => setPending(null)}>
          <Pressable style={st.backdrop} onPress={() => setPending(null)}>
            <Pressable style={st.sheet} onPress={(e) => e.stopPropagation()}>
              <View style={st.grab} />
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 18 }}>
                <Image source={{ uri: pending ? `https://i.ytimg.com/vi/${pending.videoId}/mqdefault.jpg` : undefined }}
                  style={st.thumb} />
                <View style={{ flex: 1 }}>
                  <Text style={st.title} numberOfLines={2}>
                    {(pending && pending.title) || 'This video'}
                  </Text>
                  {pending && pending.author
                    ? <Text style={st.sub} numberOfLines={1}>{pending.author}</Text> : null}
                </View>
              </View>

              <Pressable style={st.primary} onPress={() => choose('room')}>
                <Ionicons name="people" size={18} color="#fff" />
                <Text style={st.primaryTxt}>
                  {roomExists ? 'Play in this room' : 'Create a watch party'}
                </Text>
              </Pressable>

              {roomExists && (
                <Pressable style={st.secondary} onPress={() => choose('queue')}>
                  <Ionicons name="list-outline" size={18} color={c.text} />
                  <Text style={st.secondaryTxt}>Add to the queue</Text>
                </Pressable>
              )}

              {allowWatchAlone && (
                <Pressable style={st.secondary} onPress={() => choose('alone')}>
                  <Ionicons name="person-outline" size={18} color={c.text} />
                  <Text style={st.secondaryTxt}>Watch alone</Text>
                </Pressable>
              )}

              <Pressable style={st.cancel} onPress={() => setPending(null)}>
                <Text style={{ color: c.text2, fontWeight: '700' }}>Keep browsing</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.ink },
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingTop: 52, paddingBottom: 10,
    backgroundColor: c.ink, borderBottomWidth: 1, borderBottomColor: c.border,
  },
  barBtn: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
  },
  barTitle: { color: c.text, fontSize: 15, fontWeight: '700' },
  barSub: { color: c.dim, fontSize: 11 },
  loader: {
    position: 'absolute', top: 110, left: 0, right: 0, alignItems: 'center',
  },
  backdrop: { flex: 1, backgroundColor: '#000B', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: c.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26,
    padding: 18, paddingBottom: 32, borderTopWidth: 1, borderColor: c.border,
  },
  grab: {
    width: 38, height: 4, borderRadius: 2, backgroundColor: c.border,
    alignSelf: 'center', marginBottom: 16,
  },
  thumb: { width: 92, height: 56, borderRadius: 8, backgroundColor: c.surface2 },
  title: { color: c.text, fontSize: 15, fontWeight: '700' },
  sub: { color: c.dim, fontSize: 12, marginTop: 2 },
  primary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: c.beam, borderRadius: 14, paddingVertical: 14,
  },
  primaryTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: c.surface2, borderRadius: 14, paddingVertical: 13, marginTop: 10,
    borderWidth: 1, borderColor: c.border,
  },
  secondaryTxt: { color: c.text, fontWeight: '600', fontSize: 14 },
  cancel: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
});
