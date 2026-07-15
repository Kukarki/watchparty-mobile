import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { COLORS, SPACE, RADIUS } from '@/constants';
import { Button } from '@/components/ui/Button';

const W = Dimensions.get('window').width;

const SLIDES = [
  {
    icon: 'tv-outline' as const,
    title: 'Watch Together',
    body: 'Stream any video in perfect sync with friends — no matter where they are in the world.',
    accent: COLORS.primary,
  },
  {
    icon: 'chatbubbles-outline' as const,
    title: 'Chat & React',
    body: 'Send messages, drop emoji reactions, and share every moment in real time.',
    accent: '#7C3AED',
  },
  {
    icon: 'link-outline' as const,
    title: 'Invite in One Tap',
    body: 'Share a room code or deep link — anyone joins instantly, no account needed.',
    accent: COLORS.success,
  },
];

export default function OnboardingScreen() {
  const [idx, setIdx] = useState(0);
  const listRef = useRef<FlatList>(null);

  async function finish() {
    await SecureStore.setItemAsync('onboarding_done', '1');
    router.replace('/(auth)/login');
  }

  function next() {
    if (idx < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: idx + 1, animated: true });
      setIdx(idx + 1);
    } else {
      finish();
    }
  }

  return (
    <View style={styles.container}>
      {/* Logo bar */}
      <View style={styles.logoBar}>
        <Ionicons name="film" size={22} color={COLORS.primary} />
        <Text style={styles.logoText}>WatchParty</Text>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: W }]}>
            <View
              style={[
                styles.iconRing,
                { backgroundColor: item.accent + '18', borderColor: item.accent + '44' },
              ]}
            >
              <Ionicons name={item.icon} size={72} color={item.accent} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      {/* Progress dots */}
      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === idx
                ? [styles.dotActive, { backgroundColor: s.accent }]
                : styles.dotDim,
            ]}
          />
        ))}
      </View>

      {/* Action row */}
      <View style={styles.footer}>
        {idx < SLIDES.length - 1 ? (
          <>
            <TouchableOpacity onPress={finish} style={styles.skip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <Button title="Next →" onPress={next} style={{ flex: 1 }} />
          </>
        ) : (
          <Button title="Get Started" onPress={finish} style={{ flex: 1 }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  logoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.xl,
    paddingBottom: SPACE.sm,
  },
  logoText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  slide: {
    paddingHorizontal: SPACE.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.lg,
    paddingBottom: 100,
  },
  iconRing: {
    width: 160,
    height: 160,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACE.md,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  body: {
    color: COLORS.textSecondary,
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: SPACE.lg,
  },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 28 },
  dotDim: { width: 8, backgroundColor: COLORS.borderStrong },

  footer: {
    flexDirection: 'row',
    paddingHorizontal: SPACE.lg,
    paddingBottom: SPACE.xxl,
    gap: SPACE.md,
    alignItems: 'center',
  },
  skip: { padding: SPACE.md },
  skipText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
});
