import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

interface Props {
  emoji: string;
  x: number;
  onDone: () => void;
}

export function FloatingReaction({ emoji, x, onDone }: Props) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }),
      Animated.timing(translateY, { toValue: -220, duration: 2200, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(1400),
        Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    ]).start(onDone);
  }, []);

  return (
    <Animated.View style={[styles.wrap, { left: x, transform: [{ translateY }, { scale }], opacity }]}>
      <Text style={styles.emoji}>{emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 16 },
  emoji: { fontSize: 38 },
});
