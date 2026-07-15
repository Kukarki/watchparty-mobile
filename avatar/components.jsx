// Shared UI pieces for the avatar feature — Projector Noir styling.
import React, { useEffect, useRef } from 'react';
import {
  Animated, Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { colors, radius, rarity as RARITY, type } from './theme';
import { PRESENCE } from '../avatar-core';

export const Txt = ({ s = 'body', style, children, ...rest }) => (
  <Text style={[type[s] || type.body, style]} {...rest}>{children}</Text>
);

// ---- chips / tabs -----------------------------------------------------------
export function Chip({ label, active, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={[st.chip, active && st.chipActive, style]}
      hitSlop={6}
    >
      <Txt s="dim" style={[st.chipTxt, active && st.chipTxtActive]}>{label}</Txt>
    </Pressable>
  );
}

export function ChipRow({ options, value, onChange, style }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={style}
      contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
      {options.map((o) => (
        <Chip key={o.id || o} label={o.name || o.label || o}
          active={(o.id || o) === value}
          onPress={() => onChange(o.id || o)} />
      ))}
    </ScrollView>
  );
}

// ---- color swatches ------------------------------------------------------------
export function ColorRow({ options, value, onChange, style }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={style}
      contentContainerStyle={{ paddingHorizontal: 14, gap: 10, alignItems: 'center' }}>
      {options.map((o) => (
        <Pressable key={o.id} onPress={() => onChange(o.id)} hitSlop={4}
          style={[st.swatch, { backgroundColor: o.hex }, o.id === value && st.swatchActive]} />
      ))}
    </ScrollView>
  );
}

// ---- item card ---------------------------------------------------------------------
const CATEGORY_GLYPH = {
  hair: '💇', top: '👕', bottom: '👖', shoes: '👟', outfit_full: '🧥',
  acc_head: '🧢', acc_ears: '🎧', acc_face: '👓', acc_hands: '🍿', acc_back: '🎒',
  effect: '✨', frame: '🖼️', background: '🌆',
};

export function ItemCard({ item, owned, equipped, level = 1, onPress, size = 96 }) {
  const cw = (Array.isArray(item.colorways) && item.colorways[0]) || {};
  const tint = cw.primary || '#3A4258';
  const locked = !owned && item.unlock_type !== 'default';
  const rc = RARITY[item.rarity] || RARITY.common;
  const needsLevel = item.unlock_type === 'level' && item.min_level > level;

  return (
    <Pressable onPress={() => onPress && onPress(item)}
      style={[st.card, { width: size, borderColor: equipped ? colors.beam : rc + '55' }]}>
      <View style={[st.cardArt, { backgroundColor: tint + '33' }]}>
        <Txt style={{ fontSize: 30, opacity: locked ? 0.45 : 1 }}>
          {CATEGORY_GLYPH[item.category] || '🎁'}
        </Txt>
        {locked && (
          <View style={st.lockBadge}>
            <Txt style={{ fontSize: 11 }}>🔒</Txt>
          </View>
        )}
        {equipped && (
          <View style={[st.equippedTick, { backgroundColor: colors.beam }]}>
            <Txt style={{ fontSize: 10, color: '#fff' }}>✓</Txt>
          </View>
        )}
      </View>
      <Txt s="dim" numberOfLines={1} style={{ fontSize: 11, color: colors.text }}>
        {item.name}
      </Txt>
      <Txt numberOfLines={1} style={{ fontSize: 10, color: locked ? colors.dim : rc }}>
        {locked
          ? (needsLevel || item.unlock_type === 'level' ? `Lv ${item.min_level}` : 'Shop')
          : item.rarity}
      </Txt>
    </Pressable>
  );
}

// ---- horizontal slider (no external dep) ----------------------------------------------
export function HSlider({ value = 0.5, onChange, width = 220 }) {
  const trackRef = useRef(null);
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt) => {
      if (!trackRef.current) return;
      trackRef.current.measure((x, y, w, h, pageX) => {
        const rel = (evt.nativeEvent.pageX - pageX) / w;
        onChange(Math.min(1, Math.max(0, rel)));
      });
    },
  })).current;

  return (
    <View ref={trackRef} style={[st.sliderTrack, { width }]} {...pan.panHandlers}>
      <View style={[st.sliderFill, { width: `${value * 100}%` }]} />
      <View style={[st.sliderThumb, { left: `${value * 100}%` }]} />
    </View>
  );
}

// ---- XP bar (animated beam fill) -----------------------------------------------------------
export function XPBar({ into = 0, needed = 1, height = 12, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(1, into / Math.max(1, needed)),
      duration: 650, useNativeDriver: false,
    }).start();
  }, [into, needed, anim]);

  return (
    <View style={[st.xpTrack, { height, borderRadius: height / 2 }, style]}>
      <Animated.View style={[st.xpFill, {
        borderRadius: height / 2,
        width: anim.interpolate({ inputRange: [0, 1], outputRange: ['2%', '100%'] }),
      }]} />
    </View>
  );
}

// ---- snapshot avatar (2D everywhere: chat, lists, seat bar) ---------------------------------
export function SnapshotAvatar({ url, size = 44, frameColor, presence, style }) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <View style={[st.snapWrap, {
        width: size, height: size, borderRadius: size / 2,
        borderColor: frameColor || colors.border,
        borderWidth: frameColor ? 2.5 : 1.5,
      }]}>
        {url ? (
          <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <View style={st.snapEmpty}><Txt style={{ fontSize: size * 0.4 }}>👤</Txt></View>
        )}
      </View>
      {presence && (
        <View style={[st.presenceDot, {
          backgroundColor: PRESENCE[presence] || PRESENCE.idle,
          width: size * 0.26, height: size * 0.26, borderRadius: size * 0.13,
        }]} />
      )}
    </View>
  );
}

export const Section = ({ label, style, children }) => (
  <View style={style}>
    <Txt s="dim" style={st.sectionLabel}>{label}</Txt>
    {children}
  </View>
);

const st = StyleSheet.create({
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill,
    backgroundColor: colors.inkRaised, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.beam + '22', borderColor: colors.beam },
  chipTxt: { fontSize: 13, fontWeight: '600' },
  chipTxtActive: { color: colors.beamHot },
  swatch: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 2, borderColor: 'transparent',
  },
  swatchActive: { borderColor: colors.beamHot, transform: [{ scale: 1.15 }] },
  card: {
    backgroundColor: colors.inkRaised, borderRadius: radius.md,
    borderWidth: 1.5, padding: 8, gap: 3,
  },
  cardArt: {
    height: 62, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute', top: 4, right: 4, backgroundColor: '#000A',
    borderRadius: 8, padding: 2,
  },
  equippedTick: {
    position: 'absolute', bottom: 4, right: 4, width: 16, height: 16,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  sliderTrack: {
    height: 26, borderRadius: 13, backgroundColor: colors.inkRaised,
    borderWidth: 1, borderColor: colors.border, justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    backgroundColor: colors.beam + '44', borderRadius: 13,
  },
  sliderThumb: {
    position: 'absolute', width: 20, height: 20, borderRadius: 10, marginLeft: -10,
    backgroundColor: colors.beamHot,
  },
  xpTrack: {
    backgroundColor: colors.inkRaised, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  xpFill: { height: '100%', backgroundColor: colors.beam },
  snapWrap: { overflow: 'hidden', backgroundColor: colors.inkRaised },
  snapEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  presenceDot: {
    position: 'absolute', bottom: 0, right: 0,
    borderWidth: 2, borderColor: colors.ink,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 8, marginLeft: 14,
  },
});
