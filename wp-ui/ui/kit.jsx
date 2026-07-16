// Shared primitives every screen is built from. Keeps 15 screens consistent.
import React from 'react';
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import Icon, { I } from './Icon';
import { c, r, sp, t } from './tokens';

export const Txt = ({ s = 'body', style, children, ...p }) => (
  <Text style={[t[s], style]} {...p}>{children}</Text>
);

// ---- screen scaffold ---------------------------------------------------
export function Screen({ children, style }) {
  return <View style={[{ flex: 1, backgroundColor: c.ink }, style]}>{children}</View>;
}

export function Header({ title, subtitle, onBack, right, large }) {
  return (
    <View style={st.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: sp.m }}>
        {onBack && (
          <Pressable onPress={onBack} hitSlop={12}>
            <Icon name={I.back} size={26} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Txt s={large ? 'h1' : 'h2'} numberOfLines={1}>{title}</Txt>
          {subtitle ? <Txt s="cap" numberOfLines={1}>{subtitle}</Txt> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

export const IconBtn = ({ name, onPress, size = 20, color = c.text, dim, label }) => (
  <Pressable onPress={onPress} hitSlop={12} accessibilityLabel={label}
    style={[st.iconBtn, dim && { backgroundColor: 'transparent', borderWidth: 0 }]}>
    <Icon name={name} size={size} color={color} />
  </Pressable>
);

export const SectionLabel = ({ children, action, onAction }) => (
  <View style={st.sectionRow}>
    <Txt s="label">{children}</Txt>
    {action ? (
      <Pressable onPress={onAction} hitSlop={8}>
        <Txt s="cap" style={{ color: c.beamHot, fontWeight: '600' }}>{action}</Txt>
      </Pressable>
    ) : null}
  </View>
);

export const Card = ({ children, style, onPress, ...p }) => {
  const Comp = onPress ? Pressable : View;
  return (
    <Comp onPress={onPress} style={({ pressed }) => [
      st.card, style, pressed && onPress && { backgroundColor: c.surface2 },
    ]} {...p}>{children}</Comp>
  );
};

// ---- buttons -----------------------------------------------------------
export function Btn({ title, onPress, variant = 'primary', icon, size = 'md', disabled, style, loading }) {
  const v = {
    primary:   { bg: c.beam, fg: '#fff', bd: c.beam },
    secondary: { bg: c.surface, fg: c.text, bd: c.border },
    ghost:     { bg: 'transparent', fg: c.text2, bd: 'transparent' },
    danger:    { bg: 'transparent', fg: c.danger, bd: 'rgba(255,77,109,0.4)' },
  }[variant];
  const pad = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  return (
    <Pressable onPress={onPress} disabled={disabled || loading}
      style={({ pressed }) => [
        st.btn,
        { backgroundColor: v.bg, borderColor: v.bd, paddingVertical: pad,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        style,
      ]}>
      {loading ? <ActivityIndicator color={v.fg} size="small" /> : (
        <>
          {icon ? <Icon name={icon} size={17} color={v.fg} /> : null}
          <Txt style={{ color: v.fg, fontWeight: '700', fontSize: size === 'sm' ? 13 : 14.5 }}>
            {title}
          </Txt>
        </>
      )}
    </Pressable>
  );
}

// ---- bits --------------------------------------------------------------
export const Badge = ({ children, color = c.beam, tint }) => (
  <View style={[st.badge, { backgroundColor: tint || color }]}>
    <Txt style={{ fontSize: 10.5, fontWeight: '800', color: tint ? color : '#fff' }}>{children}</Txt>
  </View>
);

export const LiveDot = () => (
  <View style={st.live}>
    <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' }} />
    <Txt style={{ fontSize: 9.5, fontWeight: '800', color: '#fff' }}>LIVE</Txt>
  </View>
);

export function Avatar({ url, size = 40, ring, presence, name }) {
  return (
    <View style={{ width: size, height: size }}>
      <View style={{
        width: size, height: size, borderRadius: size / 2, overflow: 'hidden',
        backgroundColor: c.surface2, borderWidth: ring ? 2 : 1,
        borderColor: ring || c.border, alignItems: 'center', justifyContent: 'center',
      }}>
        {url ? <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} />
          : <Txt style={{ fontSize: size * 0.34, fontWeight: '700', color: c.dim }}>
              {(name || '?').slice(0, 1).toUpperCase()}
            </Txt>}
      </View>
      {presence ? (
        <View style={{
          position: 'absolute', right: -1, bottom: -1,
          width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14,
          backgroundColor: presence, borderWidth: 2, borderColor: c.ink,
        }} />
      ) : null}
    </View>
  );
}

export const Row = ({ icon, title, sub, right, onPress, danger, last }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [
    st.row, !last && st.rowBorder, pressed && { backgroundColor: c.surface2 },
  ]}>
    {icon ? <Icon name={icon} size={19} color={danger ? c.danger : c.text2} /> : null}
    <View style={{ flex: 1 }}>
      <Txt style={danger ? { color: c.danger } : null}>{title}</Txt>
      {sub ? <Txt s="cap" style={{ marginTop: 1 }}>{sub}</Txt> : null}
    </View>
    {right !== undefined ? right : <Icon name={I.next} size={17} color={c.dim} />}
  </Pressable>
);

export const Empty = ({ icon, title, sub, action, onAction }) => (
  <View style={st.empty}>
    <View style={st.emptyIcon}><Icon name={icon} size={26} color={c.beam} /></View>
    <Txt s="h3" style={{ marginTop: sp.m }}>{title}</Txt>
    <Txt s="sub" style={{ textAlign: 'center', marginTop: 4, maxWidth: 260 }}>{sub}</Txt>
    {action ? <Btn title={action} onPress={onAction} style={{ marginTop: sp.l, minWidth: 180 }} /> : null}
  </View>
);

export const Divider = () => <View style={{ height: 1, backgroundColor: c.border }} />;

export const Chips = ({ options, value, onChange, style }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[{ flexGrow: 0 }, style]}
    contentContainerStyle={{ gap: sp.s, paddingHorizontal: sp.l }}>
    {options.map((o) => {
      const id = o.id ?? o;
      const on = id === value;
      return (
        <Pressable key={id} onPress={() => onChange(id)}
          style={[st.chip, on && { backgroundColor: c.beamDim, borderColor: c.beam }]}>
          <Txt s="sub" style={{ color: on ? c.beamHot : c.text2, fontWeight: '600' }}>
            {o.name ?? o}
          </Txt>
        </Pressable>
      );
    })}
  </ScrollView>
);

const st = StyleSheet.create({
  header: { paddingHorizontal: sp.l, paddingTop: 8, paddingBottom: sp.m },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
  },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: sp.l, marginTop: sp.xl, marginBottom: sp.m,
  },
  card: {
    backgroundColor: c.surface, borderRadius: r.md,
    borderWidth: 1, borderColor: c.border, padding: sp.m,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderRadius: r.md, borderWidth: 1, paddingHorizontal: sp.l,
  },
  badge: { paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: r.pill },
  live: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: c.live, paddingHorizontal: 7, paddingVertical: 3, borderRadius: r.sm,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: sp.m,
    paddingVertical: 13, paddingHorizontal: sp.l,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: sp.l },
  emptyIcon: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: c.beamDim,
    alignItems: 'center', justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: r.pill,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
  },
});
