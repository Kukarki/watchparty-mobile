import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SPACE } from '@/constants';

interface SkeletonBoxProps {
  width: number | `${number}%` | 'auto';
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({ width, height, borderRadius = RADIUS.md, style }: SkeletonBoxProps) {
  const anim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.85, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.35, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: COLORS.cardElevated, opacity: anim }, style]}
    />
  );
}

export function RoomCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBox width={44} height={44} borderRadius={RADIUS.md} />
      <View style={styles.lines}>
        <SkeletonBox width="65%" height={14} borderRadius={RADIUS.sm} />
        <SkeletonBox width="40%" height={11} borderRadius={RADIUS.sm} />
      </View>
      <SkeletonBox width={36} height={36} borderRadius={RADIUS.sm} />
    </View>
  );
}

export function MemberAvatarSkeleton() {
  return (
    <View style={styles.avatarWrap}>
      <SkeletonBox width={38} height={38} borderRadius={RADIUS.full} />
      <SkeletonBox width={36} height={9} borderRadius={RADIUS.sm} style={{ marginTop: 4 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACE.lg,
    marginBottom: SPACE.sm,
    borderRadius: RADIUS.lg,
    padding: SPACE.md,
    gap: SPACE.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lines: { flex: 1, gap: SPACE.sm },
  avatarWrap: { alignItems: 'center', gap: 4, width: 52 },
});
