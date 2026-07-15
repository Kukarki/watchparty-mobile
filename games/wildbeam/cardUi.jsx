// WildBeam card rendered from pure Views — no image assets, original design.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CARD_COLORS, colors } from '../theme';

const KIND_GLYPH = { freeze: '❄', rewind: '↺', boost2: '+2', prism: '◆', surge4: '+4' };

export function cardLabel(card) {
  if (!card) return '';
  if (card.kind === 'num') return String(card.value);
  return KIND_GLYPH[card.kind] || '?';
}

export function Card({ card, size = 1, onPress, disabled, faceDown, style }) {
  const w = 62 * size;
  const h = 90 * size;
  if (faceDown || !card) {
    return (
      <View style={[st.card, st.back, { width: w, height: h }, style]}>
        <Text style={[st.backGlyph, { fontSize: 22 * size }]}>▲</Text>
      </View>
    );
  }
  const isWild = card.kind === 'prism' || card.kind === 'surge4';
  const bg = isWild ? '#191D2C' : CARD_COLORS[card.color] || '#3A4258';
  const glyph = cardLabel(card);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={[st.card, { width: w, height: h, backgroundColor: bg, opacity: disabled ? 0.55 : 1 }, style]}
    >
      <Text style={[st.corner, { fontSize: 11 * size }]}>{glyph}</Text>
      <Text style={[st.glyph, { fontSize: (card.kind === 'num' ? 30 : 24) * size }]}>{glyph}</Text>
      {isWild && (
        <View style={st.prismRow}>
          {Object.values(CARD_COLORS).map((c) => (
            <View key={c} style={[st.prismDot, { backgroundColor: c }]} />
          ))}
        </View>
      )}
      <Text style={[st.corner, st.cornerBottom, { fontSize: 11 * size }]}>{glyph}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  card: {
    borderRadius: 10, padding: 5,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFFFFF22',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  back: { backgroundColor: colors.inkRaised, borderColor: colors.beam + '66' },
  backGlyph: { color: colors.beam, fontWeight: '800' },
  glyph: { color: '#FFFFFF', fontWeight: '800' },
  corner: { position: 'absolute', top: 4, left: 6, color: '#FFFFFFDD', fontWeight: '700' },
  cornerBottom: {
    top: undefined, left: undefined, bottom: 4, right: 6,
    transform: [{ rotate: '180deg' }],
  },
  prismRow: { flexDirection: 'row', gap: 3, marginTop: 4 },
  prismDot: { width: 7, height: 7, borderRadius: 4 },
});
