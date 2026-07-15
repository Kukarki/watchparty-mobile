// WatchPartyUI.jsx — complete production UI in ONE file.
// 15 screens + design system + shared kit + three-dot menus.
// Zero new dependencies: icons from @expo/vector-icons (ships with Expo).
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Image, KeyboardAvoidingView,
  Linking, Modal, Platform, Pressable, ScrollView, StyleSheet,
  Switch, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ── tokens ────────────────────────────────────────────────────────────
export const c = {
  ink:      '#0B0D14',
  surface:  '#141826',
  surface2: '#1B2133',
  border:   '#232A3F',
  borderHi: '#3A4460',
  beam:     '#8B7CFF',
  beamHot:  '#B7A8FF',
  beamDim:  'rgba(139,124,255,0.14)',
  text:     '#EEF1FA',
  text2:    '#A8B0C6',
  dim:      '#6F7894',
  ok:       '#3DDC84',
  warn:     '#FFB454',
  danger:   '#FF4D6D',
  live:     '#FF4D6D',
};
export const r  = { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 };
export const sp = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 };
export const t  = {
  h1:    { fontSize: 26, fontWeight: '700', color: c.text, letterSpacing: -0.4 },
  h2:    { fontSize: 19, fontWeight: '700', color: c.text, letterSpacing: -0.2 },
  h3:    { fontSize: 15, fontWeight: '600', color: c.text },
  body:  { fontSize: 14, color: c.text },
  sub:   { fontSize: 13, color: c.text2 },
  cap:   { fontSize: 11, color: c.dim },
  label: { fontSize: 11, fontWeight: '700', color: c.dim, letterSpacing: 1.1 },
  num:   { fontSize: 20, fontWeight: '700', color: c.text, fontVariant: ['tabular-nums'] },
};
export const PLATFORMS = [
  { id: 'youtube', name: 'YouTube', color: '#FF0033' },
  { id: 'netflix', name: 'Netflix', color: '#E50914' },
  { id: 'prime',   name: 'Prime',   color: '#00A8E1' },
  { id: 'disney',  name: 'Disney+', color: '#1F80E0' },
  { id: 'hbo',     name: 'Max',     color: '#7B2BF9' },
];

// ── Icon ──────────────────────────────────────────────────────────────
export function Icon({ name, size = 20, color = c.text, style }) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}
export const I = {
  home:'home', homeOff:'home-outline',
  rooms:'tv', roomsOff:'tv-outline',
  play:'game-controller', playOff:'game-controller-outline',
  profile:'person-circle', profileOff:'person-circle-outline',
  settings:'settings-outline', more:'ellipsis-horizontal',
  back:'chevron-back', next:'chevron-forward', down:'chevron-down', close:'close',
  add:'add', plus:'add-circle-outline', join:'enter-outline',
  share:'share-social-outline', copy:'copy-outline', edit:'create-outline',
  trash:'trash-outline', leave:'exit-outline', report:'flag-outline',
  block:'ban-outline', gift:'gift-outline', message:'chatbubble-ellipses-outline',
  invite:'person-add-outline', music:'musical-notes', musicOff:'musical-notes-outline',
  pause:'pause', playFill:'play', skip:'play-skip-forward', queue:'list-outline',
  search:'search', bell:'notifications-outline', lock:'lock-closed-outline',
  eye:'eye-outline', moon:'moon-outline', disk:'server-outline',
  help:'help-circle-outline', info:'information-circle-outline',
  shield:'shield-checkmark-outline', sync:'sync-outline',
  star:'star', starOff:'star-outline', trophy:'trophy-outline',
  coin:'ellipse', fire:'flame', check:'checkmark',
  people:'people-outline', mic:'mic-outline', volume:'volume-high-outline',
  bookmark:'bookmark-outline', compass:'compass-outline', qr:'qr-code-outline',
  link:'link-outline', cards:'albums-outline', brain:'bulb-outline', dice:'dice-outline',
};

// ── kit ───────────────────────────────────────────────────────────────
export const Txt = ({ s = 'body', style, children, ...p }) => (
  <Text style={[t[s], style]} {...p}>{children}</Text>
);

export function Screen({ children, style }) {
  return <View style={[{ flex: 1, backgroundColor: c.ink }, style]}>{children}</View>;
}

export function Header({ title, subtitle, onBack, right, large }) {
  return (
    <View style={stkit.header}>
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
    style={[stkit.iconBtn, dim && { backgroundColor: 'transparent', borderWidth: 0 }]}>
    <Icon name={name} size={size} color={color} />
  </Pressable>
);

export const SectionLabel = ({ children, action, onAction }) => (
  <View style={stkit.sectionRow}>
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
    <Comp onPress={onPress}
      style={typeof style === 'function' ? style : ({ pressed }) => [
        stkit.card, style, pressed && onPress && { backgroundColor: c.surface2 },
      ]} {...p}>{children}</Comp>
  );
};

export function Btn({ title, onPress, variant = 'primary', icon, size = 'md', disabled, style, loading }) {
  const v = {
    primary:   { bg: c.beam,        fg: '#fff',    bd: c.beam },
    secondary: { bg: c.surface,     fg: c.text,    bd: c.border },
    ghost:     { bg: 'transparent', fg: c.text2,   bd: 'transparent' },
    danger:    { bg: 'transparent', fg: c.danger,  bd: 'rgba(255,77,109,0.4)' },
  }[variant];
  const pad = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  return (
    <Pressable onPress={onPress} disabled={disabled || loading}
      style={({ pressed }) => [
        stkit.btn,
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

export const Badge = ({ children, color = c.beam, tint }) => (
  <View style={[stkit.badge, { backgroundColor: tint || color }]}>
    <Txt style={{ fontSize: 10.5, fontWeight: '800', color: tint ? color : '#fff' }}>{children}</Txt>
  </View>
);

export const LiveDot = () => (
  <View style={stkit.live}>
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
        {url
          ? <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} />
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
    stkit.row, !last && stkit.rowBorder, pressed && { backgroundColor: c.surface2 },
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
  <View style={stkit.empty}>
    <View style={stkit.emptyIcon}><Icon name={icon} size={26} color={c.beam} /></View>
    <Txt s="h3" style={{ marginTop: sp.m }}>{title}</Txt>
    <Txt s="sub" style={{ textAlign: 'center', marginTop: 4, maxWidth: 260 }}>{sub}</Txt>
    {action ? <Btn title={action} onPress={onAction} style={{ marginTop: sp.l, minWidth: 180 }} /> : null}
  </View>
);

export const Divider = () => <View style={{ height: 1, backgroundColor: c.border }} />;

export const Chips = ({ options, value, onChange, style }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}
    style={[{ flexGrow: 0 }, style]}
    contentContainerStyle={{ gap: sp.s, paddingHorizontal: sp.l }}>
    {options.map((o) => {
      const id = o.id ?? o;
      const on = id === value;
      return (
        <Pressable key={id} onPress={() => onChange(id)}
          style={[stkit.chip, on && { backgroundColor: c.beamDim, borderColor: c.beam }]}>
          <Txt s="sub" style={{ color: on ? c.beamHot : c.text2, fontWeight: '600' }}>
            {o.name ?? o}
          </Txt>
        </Pressable>
      );
    })}
  </ScrollView>
);

const stkit = StyleSheet.create({
  header:     { paddingHorizontal: sp.l, paddingTop: 8, paddingBottom: sp.m },
  iconBtn:    {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
  },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: sp.l, marginTop: sp.xl, marginBottom: sp.m,
  },
  card:       {
    backgroundColor: c.surface, borderRadius: r.md,
    borderWidth: 1, borderColor: c.border, padding: sp.m,
  },
  btn:        {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderRadius: r.md, borderWidth: 1, paddingHorizontal: sp.l,
  },
  badge:      { paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: r.pill },
  live:       {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: c.live, paddingHorizontal: 7, paddingVertical: 3, borderRadius: r.sm,
  },
  row:        {
    flexDirection: 'row', alignItems: 'center', gap: sp.m,
    paddingVertical: 13, paddingHorizontal: sp.l,
  },
  rowBorder:  { borderBottomWidth: 1, borderBottomColor: c.border },
  empty:      { alignItems: 'center', paddingVertical: 48, paddingHorizontal: sp.l },
  emptyIcon:  {
    width: 60, height: 60, borderRadius: 30, backgroundColor: c.beamDim,
    alignItems: 'center', justifyContent: 'center',
  },
  chip:       {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: r.pill,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
  },
});

// ── ActionSheet ───────────────────────────────────────────────────────
export function ActionSheet({ visible, title, subtitle, actions = [], onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={stSheet.backdrop} onPress={onClose}>
        <Pressable style={stSheet.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={stSheet.grabber} />
          {title ? (
            <View style={{ paddingHorizontal: sp.l, paddingBottom: sp.m }}>
              <Txt s="h3">{title}</Txt>
              {subtitle ? <Txt s="cap">{subtitle}</Txt> : null}
            </View>
          ) : null}
          {actions.map((a, i) => (
            <Pressable key={i}
              onPress={() => { onClose && onClose(); a.onPress && a.onPress(); }}
              style={({ pressed }) => [stSheet.item, pressed && { backgroundColor: c.surface2 }]}>
              <Icon name={a.icon} size={19} color={a.danger ? c.danger : c.text2} />
              <Txt style={a.danger ? { color: c.danger } : null}>{a.label}</Txt>
            </Pressable>
          ))}
          <Pressable onPress={onClose} style={stSheet.cancel}>
            <Txt style={{ fontWeight: '700', color: c.text2 }}>Cancel</Txt>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
const stSheet = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000A', justifyContent: 'flex-end' },
  sheet:    {
    backgroundColor: c.surface, borderTopLeftRadius: r.xl, borderTopRightRadius: r.xl,
    paddingTop: sp.m, paddingBottom: 30, borderTopWidth: 1, borderColor: c.border,
  },
  grabber:  {
    width: 38, height: 4, borderRadius: 2, backgroundColor: c.borderHi,
    alignSelf: 'center', marginBottom: sp.m,
  },
  item:     {
    flexDirection: 'row', alignItems: 'center', gap: sp.m,
    paddingVertical: 14, paddingHorizontal: sp.l,
  },
  cancel:   {
    marginTop: sp.s, marginHorizontal: sp.l, paddingVertical: 13,
    alignItems: 'center', borderRadius: r.md, backgroundColor: c.surface2,
  },
});

// ── TabBar ────────────────────────────────────────────────────────────
export const TABS = [
  { name: 'index',   label: 'Home',    on: I.home,    off: I.homeOff },
  { name: 'rooms',   label: 'Rooms',   on: I.rooms,   off: I.roomsOff },
  { name: 'play',    label: 'Play',    on: I.play,    off: I.playOff },
  { name: 'profile', label: 'Profile', on: I.profile, off: I.profileOff },
];

export function TabBar({ state, navigation }) {
  return (
    <View style={stTabBar.bar}>
      {state.routes.map((route, i) => {
        const meta = TABS.find((tab) => tab.name === route.name);
        if (!meta) return null;
        const focused = state.index === i;
        return (
          <Pressable key={route.key} style={stTabBar.tab}
            onPress={() => {
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
            }}>
            <Icon name={focused ? meta.on : meta.off} size={23} color={focused ? c.beam : c.dim} />
            <Txt style={{
              fontSize: 10.5, fontWeight: focused ? '700' : '500',
              color: focused ? c.beam : c.dim, marginTop: 3,
            }}>{meta.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
const stTabBar = StyleSheet.create({
  bar: {
    flexDirection: 'row', backgroundColor: c.ink,
    borderTopWidth: 1, borderTopColor: c.border,
    paddingTop: sp.s, paddingBottom: 26,
  },
  tab: { flex: 1, alignItems: 'center' },
});

// ── HomeScreen ────────────────────────────────────────────────────────
export function HomeScreen({
  name = 'there', level, avatarUrl, liveRooms = [], friendsOnline = [], recent = [],
  onCreate, onJoin, onOpenRoom, onOpenSettings, onOpenPlay, onOpenMusic,
  onOpenRooms, onOpenProfile, onPlatform,
}) {
  const [menu, setMenu] = useState(null);
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <Header large title={`Hey, ${name}`} subtitle={level ? `Level ${level}` : undefined}
          right={
            <View style={{ flexDirection: 'row', gap: sp.s, alignItems: 'center' }}>
              <IconBtn name={I.bell} label="Notifications" onPress={() => {}} />
              <Pressable onPress={onOpenProfile}>
                <Avatar url={avatarUrl} name={name} size={36} ring={c.beam} />
              </Pressable>
            </View>
          }
        />

        <View style={{ paddingHorizontal: sp.l, gap: sp.m }}>
          <Pressable onPress={onCreate}
            style={({ pressed }) => [stHome.hero, pressed && { opacity: 0.9 }]}>
            <View style={stHome.heroIcon}><Icon name="videocam" size={22} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Start a watch party</Txt>
              <Txt style={{ fontSize: 12.5, color: '#EDE9FFCC' }}>Pick something, invite friends</Txt>
            </View>
            <Icon name={I.next} size={20} color="#fff" />
          </Pressable>
          <View style={{ flexDirection: 'row', gap: sp.m }}>
            <Btn title="Join with code" icon={I.join} variant="secondary" onPress={onJoin} style={{ flex: 1 }} />
            <Btn title="Music lobby"   icon={I.music} variant="secondary" onPress={onOpenMusic} style={{ flex: 1 }} />
          </View>
        </View>

        {liveRooms.length > 0 && (
          <>
            <SectionLabel action="See all" onAction={onOpenRooms}>LIVE NOW</SectionLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: sp.l, gap: sp.m }}>
              {liveRooms.map((room) => (
                <Card key={room.id} onPress={() => onOpenRoom && onOpenRoom(room)} style={stHome.liveCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <LiveDot />
                    <Pressable hitSlop={8} onPress={() => setMenu(room)}>
                      <Icon name={I.more} size={18} color={c.dim} />
                    </Pressable>
                  </View>
                  <Txt s="h3" numberOfLines={1} style={{ marginTop: sp.s }}>{room.title}</Txt>
                  <Txt s="cap" numberOfLines={1}>{room.nowPlaying || 'In the lounge'}</Txt>
                  <View style={{ flexDirection: 'row', marginTop: sp.m, alignItems: 'center' }}>
                    {(room.members || []).slice(0, 4).map((m, i) => (
                      <View key={i} style={{ marginLeft: i ? -9 : 0 }}>
                        <Avatar url={m.avatarUrl} name={m.name} size={24} />
                      </View>
                    ))}
                    <Txt s="cap" style={{ marginLeft: sp.s }}>{room.count} watching</Txt>
                  </View>
                </Card>
              ))}
            </ScrollView>
          </>
        )}

        {friendsOnline.length > 0 && (
          <>
            <SectionLabel>FRIENDS ONLINE</SectionLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: sp.l, gap: sp.l }}>
              {friendsOnline.map((f) => (
                <Pressable key={f.id} onPress={() => setMenu(f)}
                  style={{ alignItems: 'center', width: 62 }}>
                  <Avatar url={f.avatarUrl} name={f.name} size={50}
                    ring={f.frameColor} presence={f.presenceColor || c.ok} />
                  <Txt s="cap" numberOfLines={1} style={{ marginTop: 5, color: c.text2 }}>{f.name}</Txt>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        <SectionLabel>WATCH FROM</SectionLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: sp.l, gap: sp.s }}>
          {PLATFORMS.map((p) => (
            <Pressable key={p.id} onPress={() => onPlatform && onPlatform(p)}
              style={({ pressed }) => [stHome.platform, pressed && { backgroundColor: c.surface2 }]}>
              <View style={[stHome.platformDot, { backgroundColor: p.color }]} />
              <Txt s="sub" style={{ fontWeight: '600' }}>{p.name}</Txt>
            </Pressable>
          ))}
        </ScrollView>

        {recent.length > 0 && (
          <>
            <SectionLabel action="History" onAction={onOpenProfile}>JUMP BACK IN</SectionLabel>
            <View style={{ paddingHorizontal: sp.l, gap: sp.s }}>
              {recent.map((item) => (
                <Card key={item.id} onPress={() => onOpenRoom && onOpenRoom(item)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: sp.m }}>
                  <View style={stHome.thumb}><Icon name="play" size={16} color={c.beam} /></View>
                  <View style={{ flex: 1 }}>
                    <Txt s="h3" numberOfLines={1}>{item.title}</Txt>
                    <Txt s="cap">{item.subtitle}</Txt>
                  </View>
                  <Pressable hitSlop={8} onPress={() => setMenu(item)}>
                    <Icon name={I.more} size={18} color={c.dim} />
                  </Pressable>
                </Card>
              ))}
            </View>
          </>
        )}

        <SectionLabel action="All games" onAction={onOpenPlay}>PLAY TOGETHER</SectionLabel>
        <View style={{ flexDirection: 'row', paddingHorizontal: sp.l, gap: sp.m }}>
          {[
            { id: 'wildbeam',   name: 'WildBeam',    icon: I.cards, sub: '2–8' },
            { id: 'matchblitz', name: 'Match Blitz',  icon: I.brain, sub: '2–6' },
            { id: 'ludo',       name: 'Ludo',         icon: I.dice,  sub: '2–4' },
          ].map((g) => (
            <Card key={g.id} onPress={() => onOpenPlay && onOpenPlay(g)}
              style={{ flex: 1, alignItems: 'center', paddingVertical: sp.l }}>
              <Icon name={g.icon} size={22} color={c.beam} />
              <Txt s="sub" style={{ fontWeight: '600', marginTop: 6 }}>{g.name}</Txt>
              <Txt s="cap">{g.sub} players</Txt>
            </Card>
          ))}
        </View>
      </ScrollView>

      <ActionSheet visible={!!menu}
        title={menu && (menu.title || menu.name)}
        actions={menu && menu.name && !menu.title ? [
          { icon: I.profile,  label: 'View profile',   onPress: () => {} },
          { icon: I.message,  label: 'Message',         onPress: () => {} },
          { icon: I.invite,   label: 'Invite to room',  onPress: () => {} },
          { icon: I.gift,     label: 'Send a gift',     onPress: () => {} },
          { icon: I.block,    label: 'Block', danger: true, onPress: () => {} },
        ] : [
          { icon: I.share,    label: 'Share room',      onPress: () => {} },
          { icon: I.copy,     label: 'Copy invite code',onPress: () => {} },
          { icon: I.bookmark, label: 'Save for later',  onPress: () => {} },
          { icon: I.report,   label: 'Report', danger: true, onPress: () => {} },
        ]}
        onClose={() => setMenu(null)}
      />
    </Screen>
  );
}
const stHome = StyleSheet.create({
  hero:        {
    flexDirection: 'row', alignItems: 'center', gap: sp.m,
    backgroundColor: c.beam, borderRadius: r.lg, padding: sp.l,
  },
  heroIcon:    {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#FFFFFF2E', alignItems: 'center', justifyContent: 'center',
  },
  liveCard:    { width: 210 },
  platform:    {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
    paddingHorizontal: 13, paddingVertical: 9, borderRadius: r.pill,
  },
  platformDot: { width: 9, height: 9, borderRadius: 5 },
  thumb:       {
    width: 44, height: 44, borderRadius: r.sm, backgroundColor: c.beamDim,
    alignItems: 'center', justifyContent: 'center',
  },
});

// ── RoomsScreen ───────────────────────────────────────────────────────
const ROOM_FILTER_TABS = [
  { id: 'mine',     name: 'My rooms' },
  { id: 'discover', name: 'Discover' },
  { id: 'code',     name: 'Join by code' },
];
export function RoomsScreen({ myRooms = [], discover = [], onOpenRoom, onCreate, onJoinCode }) {
  const [tab,  setTab]  = useState('mine');
  const [code, setCode] = useState('');
  const [menu, setMenu] = useState(null);
  const list = tab === 'mine' ? myRooms : discover;

  return (
    <Screen>
      <Header title="Rooms" large right={<IconBtn name={I.add} label="Create" onPress={onCreate} />} />
      <Chips options={ROOM_FILTER_TABS} value={tab} onChange={setTab} style={{ marginBottom: sp.m }} />

      {tab === 'code' ? (
        <View style={{ padding: sp.l, gap: sp.m }}>
          <Card style={{ padding: sp.l, gap: sp.m }}>
            <Txt s="label">ENTER INVITE CODE</Txt>
            <TextInput value={code} onChangeText={(v) => setCode(v.toUpperCase().slice(0, 8))}
              placeholder="ABCD-1234" placeholderTextColor={c.dim}
              autoCapitalize="characters" style={stRooms.codeInput} />
            <Btn title="Join room" disabled={code.length < 4}
              onPress={() => onJoinCode && onJoinCode(code)} />
          </Card>
          <Card onPress={() => {}} style={{ flexDirection: 'row', alignItems: 'center', gap: sp.m }}>
            <Icon name={I.qr} size={20} color={c.beam} />
            <Txt style={{ flex: 1 }}>Scan a QR code</Txt>
            <Icon name={I.next} size={17} color={c.dim} />
          </Card>
        </View>
      ) : list.length === 0 ? (
        <Empty
          icon={tab === 'mine' ? I.rooms : I.compass}
          title={tab === 'mine' ? 'No rooms yet' : 'Nothing public right now'}
          sub={tab === 'mine'
            ? 'Create a room and invite friends to watch together in sync.'
            : 'Public rooms show up here when people open them to everyone.'}
          action={tab === 'mine' ? 'Create room' : undefined}
          onAction={onCreate}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: sp.l, gap: sp.m, paddingBottom: 30 }}>
          {list.map((room) => (
            <Card key={room.id} onPress={() => onOpenRoom && onOpenRoom(room)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: sp.m }}>
                <View style={stRooms.poster}>
                  <Icon name={room.live ? 'radio' : 'tv-outline'} size={18} color={c.beam} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: sp.s }}>
                    <Txt s="h3" numberOfLines={1} style={{ flex: 1 }}>{room.title}</Txt>
                    {room.live ? <LiveDot /> : null}
                  </View>
                  <Txt s="cap" numberOfLines={1}>
                    {room.nowPlaying || 'Lounge'} · {room.count || 0} {room.count === 1 ? 'person' : 'people'}
                  </Txt>
                  <View style={{ flexDirection: 'row', marginTop: sp.s, alignItems: 'center' }}>
                    {(room.members || []).slice(0, 5).map((m, i) => (
                      <View key={i} style={{ marginLeft: i ? -8 : 0 }}>
                        <Avatar url={m.avatarUrl} name={m.name} size={22} />
                      </View>
                    ))}
                    {room.hostName
                      ? <Txt s="cap" style={{ marginLeft: sp.s }}>Host: {room.hostName}</Txt>
                      : null}
                  </View>
                </View>
                <Pressable hitSlop={10} onPress={() => setMenu(room)}>
                  <Icon name={I.more} size={19} color={c.dim} />
                </Pressable>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      <ActionSheet visible={!!menu} title={menu && menu.title}
        subtitle={menu && menu.hostName ? `Host: ${menu.hostName}` : undefined}
        actions={[
          { icon: I.share,  label: 'Share room',       onPress: () => {} },
          { icon: I.copy,   label: 'Copy invite code', onPress: () => {} },
          ...(menu && menu.isHost ? [
            { icon: I.edit, label: 'Rename room',      onPress: () => {} },
            { icon: I.lock, label: 'Room settings',    onPress: () => {} },
          ] : []),
          { icon: I.leave,  label: 'Leave room',  danger: true, onPress: () => {} },
          { icon: I.report, label: 'Report',       danger: true, onPress: () => {} },
        ]}
        onClose={() => setMenu(null)}
      />
    </Screen>
  );
}
const stRooms = StyleSheet.create({
  poster:    {
    width: 52, height: 52, borderRadius: r.sm, backgroundColor: c.beamDim,
    alignItems: 'center', justifyContent: 'center',
  },
  codeInput: {
    backgroundColor: c.ink, borderWidth: 1, borderColor: c.border, borderRadius: r.md,
    paddingHorizontal: sp.m, paddingVertical: 14, color: c.text,
    fontSize: 19, fontWeight: '700', letterSpacing: 3, textAlign: 'center',
  },
});

// ── PlayScreen ────────────────────────────────────────────────────────
const GAMES_LIST = [
  { id: 'wildbeam',   name: 'WildBeam',    icon: I.cards, players: '2–8 players',
    blurb: 'Match colors, drop boosts, call last card', tint: '#8B7CFF' },
  { id: 'matchblitz', name: 'Match Blitz', icon: I.brain, players: '2–6 players',
    blurb: 'Memory pairs — match to keep your turn',   tint: '#35E0D0' },
  { id: 'ludo',       name: 'Ludo',        icon: I.dice,  players: '2–4 players',
    blurb: 'The classic race home',                    tint: '#FFB454' },
];
export function PlayScreen({
  activeSessions = [], musicRooms = [], onStartGame, onJoinSession,
  onOpenMusicLobby, onOpenMusicRoom, onOpenLeaderboard,
}) {
  const [menu, setMenu] = useState(null);
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <Header title="Play" large
          right={<IconBtn name={I.trophy} label="Leaderboard" onPress={onOpenLeaderboard} />} />

        {activeSessions.length > 0 && (
          <>
            <SectionLabel>HAPPENING NOW</SectionLabel>
            <View style={{ paddingHorizontal: sp.l, gap: sp.s }}>
              {activeSessions.map((s) => (
                <Card key={s.sessionId} onPress={() => onJoinSession && onJoinSession(s)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: sp.m, borderColor: c.beam }}>
                  <View style={[stPlay.gameIcon, { backgroundColor: c.beamDim }]}>
                    <Icon name={I.cards} size={19} color={c.beam} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt s="h3">{s.gameName}</Txt>
                    <Txt s="cap">{s.players} waiting · {s.roomTitle || 'open table'}</Txt>
                  </View>
                  <Badge tint={c.beamDim} color={c.beamHot}>JOIN</Badge>
                </Card>
              ))}
            </View>
          </>
        )}

        <SectionLabel>GAMES</SectionLabel>
        <View style={{ paddingHorizontal: sp.l, gap: sp.m }}>
          {GAMES_LIST.map((g) => (
            <Card key={g.id} onPress={() => onStartGame && onStartGame(g)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: sp.m }}>
              <View style={[stPlay.gameIcon, { backgroundColor: g.tint + '22' }]}>
                <Icon name={g.icon} size={21} color={g.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt s="h3">{g.name}</Txt>
                <Txt s="cap" numberOfLines={1}>{g.blurb}</Txt>
                <Txt s="cap" style={{ color: c.dim, marginTop: 2 }}>{g.players}</Txt>
              </View>
              <Pressable hitSlop={10} onPress={() => setMenu(g)}>
                <Icon name={I.more} size={19} color={c.dim} />
              </Pressable>
            </Card>
          ))}
        </View>

        <SectionLabel action="All lobbies" onAction={onOpenMusicLobby}>MUSIC</SectionLabel>
        <View style={{ paddingHorizontal: sp.l, gap: sp.m }}>
          <Pressable onPress={onOpenMusicLobby}
            style={({ pressed }) => [stPlay.musicHero, pressed && { opacity: 0.9 }]}>
            <View style={stPlay.musicIcon}><Icon name={I.music} size={21} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 15.5, fontWeight: '700', color: '#fff' }}>Music lobby</Txt>
              <Txt style={{ fontSize: 12.5, color: '#EDE9FFCC' }}>Listen together, queue tracks, vote skip</Txt>
            </View>
            <Icon name={I.next} size={19} color="#fff" />
          </Pressable>
          {musicRooms.slice(0, 3).map((m) => (
            <Card key={m.id} onPress={() => onOpenMusicRoom && onOpenMusicRoom(m)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: sp.m }}>
              <View style={stPlay.albumArt}><Icon name={I.musicOff} size={17} color={c.beam} /></View>
              <View style={{ flex: 1 }}>
                <Txt s="h3" numberOfLines={1}>{m.title}</Txt>
                <Txt s="cap" numberOfLines={1}>{m.nowPlaying}</Txt>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {(m.listeners || []).slice(0, 3).map((l, i) => (
                  <View key={i} style={{ marginLeft: i ? -8 : 0 }}>
                    <Avatar url={l.avatarUrl} name={l.name} size={22} />
                  </View>
                ))}
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>

      <ActionSheet visible={!!menu} title={menu && menu.name} subtitle={menu && menu.players}
        actions={[
          { icon: I.playFill, label: 'Start a table',  onPress: () => onStartGame && onStartGame(menu) },
          { icon: I.invite,   label: 'Invite friends', onPress: () => {} },
          { icon: I.help,     label: 'How to play',    onPress: () => {} },
          { icon: I.trophy,   label: 'Leaderboard',    onPress: onOpenLeaderboard },
        ]}
        onClose={() => setMenu(null)}
      />
    </Screen>
  );
}
const stPlay = StyleSheet.create({
  gameIcon:  { width: 46, height: 46, borderRadius: r.md, alignItems: 'center', justifyContent: 'center' },
  musicHero: {
    flexDirection: 'row', alignItems: 'center', gap: sp.m,
    backgroundColor: c.beam, borderRadius: r.lg, padding: sp.l,
  },
  musicIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF2E',
    alignItems: 'center', justifyContent: 'center',
  },
  albumArt:  {
    width: 44, height: 44, borderRadius: r.sm, backgroundColor: c.beamDim,
    alignItems: 'center', justifyContent: 'center',
  },
});

// ── ProfileTabScreen ──────────────────────────────────────────────────
function XPBar({ into = 0, needed = 1 }) {
  const pct = Math.min(100, Math.round((into / Math.max(1, needed)) * 100));
  return (
    <View style={stProfile.xpTrack}>
      <View style={[stProfile.xpFill, { width: `${Math.max(2, pct)}%` }]} />
    </View>
  );
}
function Stat({ value, label, icon }) {
  return (
    <View style={stProfile.stat}>
      {icon ? <Icon name={icon} size={15} color={c.beam} /> : null}
      <Txt s="num" style={{ marginTop: 3 }}>{value ?? '—'}</Txt>
      <Txt s="cap" numberOfLines={1}>{label}</Txt>
    </View>
  );
}
export function ProfileTabScreen({
  name = 'You', progression, stats, achievements = [], AvatarHero,
  onEditAvatar, onInventory, onShop, onSettings, onAchievements, onShare,
}) {
  const [menu, setMenu] = useState(false);
  const p = progression;
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 34 }} showsVerticalScrollIndicator={false}>
        <Header title="Profile" large right={
          <View style={{ flexDirection: 'row', gap: sp.s }}>
            <IconBtn name={I.more}     label="More"     onPress={() => setMenu(true)} />
            <IconBtn name={I.settings} label="Settings" onPress={onSettings} />
          </View>
        } />

        <View style={{ paddingHorizontal: sp.l }}>
          <View style={stProfile.hero}>
            {AvatarHero ? <AvatarHero /> : (
              <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <Icon name="person" size={40} color={c.dim} />
                <Txt s="cap" style={{ marginTop: 6 }}>Open the studio to build your avatar</Txt>
              </View>
            )}
            <Pressable onPress={onEditAvatar} style={stProfile.editFab}>
              <Icon name={I.edit} size={16} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View style={{ paddingHorizontal: sp.l, marginTop: sp.l }}>
          <Txt s="h1">{name}</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: sp.s, marginTop: 6 }}>
            <Badge>{`LEVEL ${p ? p.level : 1}`}</Badge>
            <Txt s="sub" style={{ color: c.beamHot, fontWeight: '600' }}>
              {p ? p.title : 'Newcomer'}
            </Txt>
          </View>
          <XPBar into={p ? p.into : 0} needed={p ? p.needed : 400} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt s="cap">
              {(p ? p.into : 0).toLocaleString()} / {(p ? p.needed : 400).toLocaleString()} XP
            </Txt>
            <Txt s="cap">Level {(p ? p.level : 1) + 1} next</Txt>
          </View>
          {p && p.wallet ? (
            <View style={{ flexDirection: 'row', gap: sp.l, marginTop: sp.m }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Icon name="ellipse" size={11} color={c.warn} />
                <Txt s="sub">{Number(p.wallet.coins).toLocaleString()}</Txt>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Icon name="diamond" size={11} color={c.beam} />
                <Txt s="sub">{Number(p.wallet.gems).toLocaleString()}</Txt>
              </View>
              {p.streak && p.streak.current > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Icon name={I.fire} size={12} color={c.danger} />
                  <Txt s="sub">{p.streak.current} day streak</Txt>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: sp.s, paddingHorizontal: sp.l, marginTop: sp.l }}>
          <Btn title="Edit avatar" icon={I.edit} onPress={onEditAvatar} style={{ flex: 1 }} />
          <Btn title="Inventory" variant="secondary" onPress={onInventory} style={{ flex: 1 }} />
          <Btn title="Shop"      variant="secondary" onPress={onShop}      style={{ flex: 1 }} />
        </View>

        <SectionLabel>STATS</SectionLabel>
        <View style={stProfile.statGrid}>
          <Stat icon="play-circle-outline" value={stats && stats.watchSessions} label="Watch sessions" />
          <Stat icon={I.rooms}  value={stats && stats.roomsJoined}       label="Rooms joined" />
          <Stat icon="radio-outline" value={stats && stats.roomsHosted}  label="Hosted" />
          <Stat icon={I.people} value={stats && stats.friends}           label="Friends" />
          <Stat icon={I.fire}   value={stats && stats.longestStreak}     label="Best streak" />
          <Stat icon={I.invite} value={stats && stats.invitesAccepted}   label="Invites" />
        </View>

        <SectionLabel action="See all" onAction={onAchievements}>ACHIEVEMENTS</SectionLabel>
        {achievements.length === 0 ? (
          <View style={{ paddingHorizontal: sp.l }}>
            <Card style={{ alignItems: 'center', paddingVertical: sp.l }}>
              <Icon name={I.trophy} size={22} color={c.dim} />
              <Txt s="sub" style={{ marginTop: 6, textAlign: 'center' }}>
                Host a party, keep a streak, win a game — they show up here.
              </Txt>
            </Card>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: sp.l, gap: sp.m }}>
            {achievements.map((a) => (
              <Card key={a.id} style={{ width: 104, alignItems: 'center', paddingVertical: sp.m,
                opacity: a.unlocked ? 1 : 0.45 }}>
                <View style={[stProfile.trophy, { backgroundColor: a.unlocked ? c.beamDim : c.surface2 }]}>
                  <Icon name={a.unlocked ? I.trophy : I.lock} size={17}
                    color={a.unlocked ? c.beam : c.dim} />
                </View>
                <Txt s="cap" numberOfLines={2} style={{ textAlign: 'center', marginTop: 6, color: c.text }}>
                  {a.name}
                </Txt>
              </Card>
            ))}
          </ScrollView>
        )}
      </ScrollView>

      <ActionSheet visible={menu} title={name}
        actions={[
          { icon: I.share,    label: 'Share my profile',  onPress: onShare },
          { icon: I.copy,     label: 'Copy profile link', onPress: () => {} },
          { icon: I.trophy,   label: 'All achievements',  onPress: onAchievements },
          { icon: I.settings, label: 'Settings',          onPress: onSettings },
        ]}
        onClose={() => setMenu(false)} />
    </Screen>
  );
}
const stProfile = StyleSheet.create({
  hero:     {
    height: 300, borderRadius: r.lg, backgroundColor: c.surface,
    borderWidth: 1, borderColor: c.border, overflow: 'hidden',
  },
  editFab:  {
    position: 'absolute', right: sp.m, bottom: sp.m,
    width: 38, height: 38, borderRadius: 19, backgroundColor: c.beam,
    alignItems: 'center', justifyContent: 'center',
  },
  xpTrack:  {
    height: 10, borderRadius: 5, backgroundColor: c.surface2,
    overflow: 'hidden', marginTop: sp.m, marginBottom: 5,
  },
  xpFill:   { height: '100%', backgroundColor: c.beam, borderRadius: 5 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: sp.s, paddingHorizontal: sp.l },
  stat:     {
    width: '31.6%', backgroundColor: c.surface, borderRadius: r.md,
    borderWidth: 1, borderColor: c.border, alignItems: 'center', paddingVertical: sp.m,
  },
  trophy:   { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});

// ── FriendsScreen ─────────────────────────────────────────────────────
export function FriendsScreen({
  friends = [], requests = [], searchResults = [],
  onSearch, onAccept, onDecline, onAdd, onOpenPerson,
  onInvite, onGift, onMessage, onBlock,
}) {
  const [tab,  setTab]  = useState('friends');
  const [q,    setQ]    = useState('');
  const [menu, setMenu] = useState(null);

  const friendTabs = [
    { id: 'friends',  name: `Friends${friends.length   ? ` · ${friends.length}`   : ''}` },
    { id: 'requests', name: `Requests${requests.length ? ` · ${requests.length}`  : ''}` },
    { id: 'add',      name: 'Add' },
  ];

  const Person = ({ p, right }) => (
    <Card onPress={() => onOpenPerson && onOpenPerson(p)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: sp.m }}>
      <Avatar url={p.avatarUrl} name={p.name} size={44}
        ring={p.frameColor} presence={p.online ? c.ok : undefined} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Txt s="h3" numberOfLines={1}>{p.name}</Txt>
          {p.level ? <Badge tint={c.beamDim} color={c.beamHot}>{`LV ${p.level}`}</Badge> : null}
        </View>
        <Txt s="cap" numberOfLines={1}>{p.status || (p.online ? 'Online' : 'Offline')}</Txt>
      </View>
      {right !== undefined ? right : (
        <Pressable hitSlop={10} onPress={() => setMenu(p)}>
          <Icon name={I.more} size={19} color={c.dim} />
        </Pressable>
      )}
    </Card>
  );

  return (
    <Screen>
      <Header title="Friends" large
        right={<IconBtn name={I.invite} label="Add friend" onPress={() => setTab('add')} />} />
      <Chips options={friendTabs} value={tab} onChange={setTab} style={{ marginBottom: sp.m }} />

      {tab === 'add' ? (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: sp.l }}>
            <View style={stFriends.searchWrap}>
              <Icon name={I.search} size={17} color={c.dim} />
              <TextInput value={q}
                onChangeText={(v) => { setQ(v); onSearch && onSearch(v); }}
                placeholder="Search by name or email"
                placeholderTextColor={c.dim}
                autoCapitalize="none"
                style={stFriends.searchInput} />
            </View>
          </View>
          <ScrollView contentContainerStyle={{ padding: sp.l, gap: sp.s }}>
            {searchResults.map((p) => (
              <Person key={p.id} p={p}
                right={<Btn title="Add" size="sm" onPress={() => onAdd && onAdd(p)} />} />
            ))}
            {q.length > 1 && searchResults.length === 0 && (
              <Txt s="sub" style={{ textAlign: 'center', paddingVertical: sp.xl }}>No one found</Txt>
            )}
          </ScrollView>
        </View>
      ) : tab === 'requests' ? (
        requests.length === 0 ? (
          <Empty icon={I.invite} title="No requests" sub="Friend requests will show up here." />
        ) : (
          <ScrollView contentContainerStyle={{ padding: sp.l, gap: sp.s }}>
            {requests.map((p) => (
              <Person key={p.id} p={p} right={
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Btn title="Accept" size="sm" onPress={() => onAccept && onAccept(p)} />
                  <IconBtn name={I.close} dim label="Decline"
                    onPress={() => onDecline && onDecline(p)} />
                </View>
              } />
            ))}
          </ScrollView>
        )
      ) : friends.length === 0 ? (
        <Empty icon={I.people} title="No friends yet"
          sub="Add people to see when they're watching and invite them to rooms."
          action="Find friends" onAction={() => setTab('add')} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: sp.l, gap: sp.s, paddingBottom: 30 }}>
          {friends.map((p) => <Person key={p.id} p={p} />)}
        </ScrollView>
      )}

      <ActionSheet visible={!!menu} title={menu && menu.name}
        subtitle={menu && menu.level ? `Level ${menu.level}` : undefined}
        actions={[
          { icon: I.profile, label: 'View profile',   onPress: () => onOpenPerson && onOpenPerson(menu) },
          { icon: I.message, label: 'Message',         onPress: () => onMessage && onMessage(menu) },
          { icon: I.invite,  label: 'Invite to room',  onPress: () => onInvite  && onInvite(menu)  },
          { icon: I.gift,    label: 'Send a gift',     onPress: () => onGift    && onGift(menu)    },
          { icon: I.block,   label: 'Block', danger: true, onPress: () => onBlock && onBlock(menu) },
        ]}
        onClose={() => setMenu(null)}
      />
    </Screen>
  );
}
const stFriends = StyleSheet.create({
  searchWrap:  {
    flexDirection: 'row', alignItems: 'center', gap: sp.s,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
    borderRadius: r.md, paddingHorizontal: sp.m, paddingVertical: 10,
  },
  searchInput: { flex: 1, color: c.text, fontSize: 14 },
});

// ── RoomScreen ────────────────────────────────────────────────────────
export function RoomScreen({
  room = {}, members = [], queue = [], isHost, isPlaying = false,
  onBack, onTogglePlay, onSkip, onInvite, onLeave, onKick, onOpenChat,
}) {
  const [menu, setMenu] = useState(null);
  return (
    <Screen>
      <Header title={room.title || 'Room'} subtitle={`${members.length} watching`}
        onBack={onBack}
        right={
          <View style={{ flexDirection: 'row', gap: sp.s }}>
            <Btn title="Invite" icon={I.invite} size="sm" variant="secondary" onPress={onInvite} />
            <IconBtn name={I.more} label="More" onPress={() => setMenu('room')} />
          </View>
        }
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        {/* video placeholder */}
        <View style={stRoom.videoArea}>
          <Icon name={isPlaying ? I.pause : I.playFill} size={36} color="#fff" />
          {room.nowPlaying ? (
            <Txt style={{ color: '#fff', fontWeight: '600', marginTop: sp.s }}>{room.nowPlaying}</Txt>
          ) : null}
        </View>

        {isHost && (
          <View style={{ flexDirection: 'row', paddingHorizontal: sp.l, gap: sp.s, marginTop: sp.m }}>
            <Btn title={isPlaying ? 'Pause' : 'Play'} icon={isPlaying ? I.pause : I.playFill}
              onPress={onTogglePlay} style={{ flex: 1 }} />
            <Btn title="Skip" icon={I.skip} variant="secondary" onPress={onSkip} style={{ flex: 1 }} />
            <IconBtn name={I.queue} label="Queue" onPress={() => {}} />
          </View>
        )}

        <SectionLabel>{members.length} MEMBERS</SectionLabel>
        <View style={{ paddingHorizontal: sp.l, gap: sp.s }}>
          {members.map((m) => (
            <Card key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: sp.m }}>
              <Avatar url={m.avatarUrl} name={m.name} size={38} presence={c.ok} />
              <View style={{ flex: 1 }}>
                <Txt s="h3" numberOfLines={1}>{m.name}</Txt>
                {m.isHost ? <Txt s="cap" style={{ color: c.beam }}>Host</Txt> : null}
              </View>
              {isHost && !m.isHost ? (
                <Pressable hitSlop={10} onPress={() => setMenu(m)}>
                  <Icon name={I.more} size={18} color={c.dim} />
                </Pressable>
              ) : null}
            </Card>
          ))}
        </View>

        {queue.length > 0 && (
          <>
            <SectionLabel>UP NEXT</SectionLabel>
            <View style={{ paddingHorizontal: sp.l, gap: sp.s }}>
              {queue.map((item, i) => (
                <Card key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: sp.m }}>
                  <View style={stRoom.queueNum}>
                    <Txt s="cap" style={{ fontWeight: '700' }}>{i + 1}</Txt>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt s="h3" numberOfLines={1}>{item.title}</Txt>
                    <Txt s="cap">{item.duration || ''}</Txt>
                  </View>
                </Card>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View style={stRoom.footer}>
        <Btn title="Chat" icon={I.message} variant="secondary" onPress={onOpenChat} style={{ flex: 1 }} />
        <Btn title="Leave" icon={I.leave} variant="danger" onPress={onLeave} style={{ flex: 1 }} />
      </View>

      <ActionSheet visible={!!menu}
        title={menu && typeof menu === 'object' && menu.name ? menu.name : room.title}
        actions={menu && typeof menu === 'object' && menu.name ? [
          { icon: I.mic,    label: 'Mute',        onPress: () => {} },
          { icon: I.trash,  label: 'Kick from room', danger: true, onPress: () => onKick && onKick(menu) },
        ] : [
          { icon: I.share,  label: 'Share room',  onPress: () => {} },
          { icon: I.copy,   label: 'Copy code',   onPress: () => {} },
          { icon: I.leave,  label: 'Leave room',  danger: true, onPress: onLeave },
        ]}
        onClose={() => setMenu(null)}
      />
    </Screen>
  );
}
const stRoom = StyleSheet.create({
  videoArea: {
    margin: sp.l, height: 200, borderRadius: r.lg,
    backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border,
  },
  queueNum:  {
    width: 28, height: 28, borderRadius: 14, backgroundColor: c.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  footer:    {
    flexDirection: 'row', gap: sp.m, padding: sp.l,
    borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.ink,
  },
});

// ── AchievementsScreen ────────────────────────────────────────────────
const ACH_FILTERS = [{ id: 'all', name: 'All' }, { id: 'unlocked', name: 'Unlocked' }, { id: 'locked', name: 'Locked' }];

export function AchievementsScreen({ achievements = [], onBack }) {
  const [f, setF] = useState('all');
  const list = achievements.filter((a) =>
    f === 'all' || (f === 'unlocked' ? a.unlocked : !a.unlocked));
  const done = achievements.filter((a) => a.unlocked).length;

  return (
    <Screen>
      <Header title="Achievements" subtitle={`${done} of ${achievements.length} unlocked`} onBack={onBack} />
      <Chips options={ACH_FILTERS} value={f} onChange={setF} style={{ marginBottom: sp.m }} />
      {list.length === 0 ? (
        <Empty icon={I.trophy} title="Nothing here yet"
          sub="Host parties, keep your streak, and win games to unlock these." />
      ) : (
        <ScrollView contentContainerStyle={{ padding: sp.l, gap: sp.s, paddingBottom: 30 }}>
          {list.map((a) => (
            <Card key={a.id} style={{ flexDirection: 'row', gap: sp.m, opacity: a.unlocked ? 1 : 0.6 }}>
              <View style={[stAchievementsScreen.icon, { backgroundColor: a.unlocked ? c.beamDim : c.surface2 }]}>
                <Icon name={a.unlocked ? I.trophy : I.lock} size={19} color={a.unlocked ? c.beam : c.dim} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt s="h3">{a.name}</Txt>
                <Txt s="cap">{a.description}</Txt>
                {!a.unlocked && a.progress != null ? (
                  <>
                    <View style={stAchievementsScreen.track}>
                      <View style={[stAchievementsScreen.fill, { width: `${Math.min(100, (a.progress / a.goal) * 100)}%` }]} />
                    </View>
                    <Txt s="cap" style={{ marginTop: 3 }}>{a.progress} / {a.goal}</Txt>
                  </>
                ) : null}
                {a.unlocked && a.xpReward ? (
                  <Txt s="cap" style={{ color: c.beamHot, marginTop: 2 }}>+{a.xpReward} XP</Txt>
                ) : null}
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}
const stAchievementsScreen = StyleSheet.create({
  icon:  { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  track: { height: 5, borderRadius: 3, backgroundColor: c.surface2, marginTop: 7, overflow: 'hidden' },
  fill:  { height: '100%', backgroundColor: c.beam },
});

// ── LeaderboardScreen ─────────────────────────────────────────────────
export function LeaderboardScreen({ rows = [], meId, onBack, onOpenPerson }) {
  const [scope,  setScope]  = useState('friends');
  const [metric, setMetric] = useState('xp');
  const list = rows.filter((r0) => scope === 'global' || r0.isFriend || r0.id === meId);
  const medal = (i) => ['#FFD666', '#C8CEDB', '#D08B5B'][i];

  return (
    <Screen>
      <Header title="Leaderboard" onBack={onBack} />
      <Chips options={[{ id: 'friends', name: 'Friends' }, { id: 'global', name: 'Global' }]}
        value={scope} onChange={setScope} />
      <Chips
        options={[{ id: 'xp', name: 'By level' }, { id: 'wins', name: 'Game wins' }, { id: 'streak', name: 'Streak' }]}
        value={metric} onChange={setMetric} style={{ marginTop: sp.s, marginBottom: sp.m }}
      />
      {list.length === 0 ? (
        <Empty icon={I.trophy} title="No one to rank yet" sub="Add friends to see how you stack up." />
      ) : (
        <ScrollView contentContainerStyle={{ padding: sp.l, gap: sp.s, paddingBottom: 30 }}>
          {list.map((p, i) => (
            <Card key={p.id} onPress={() => onOpenPerson && onOpenPerson(p)}
              style={[{ flexDirection: 'row', alignItems: 'center', gap: sp.m },
                p.id === meId && { borderColor: c.beam, backgroundColor: c.beamDim }]}>
              <View style={[stLeaderboardScreen.rank, i < 3 && { backgroundColor: medal(i) + '22' }]}>
                <Txt style={{ fontWeight: '800', fontSize: 13, color: i < 3 ? medal(i) : c.dim }}>
                  {i + 1}
                </Txt>
              </View>
              <Avatar url={p.avatarUrl} name={p.name} size={38} ring={p.frameColor} />
              <View style={{ flex: 1 }}>
                <Txt s="h3" numberOfLines={1}>{p.id === meId ? 'You' : p.name}</Txt>
                <Txt s="cap">{p.title}</Txt>
              </View>
              <Badge tint={c.surface2} color={c.beamHot}>
                {metric === 'xp' ? `LV ${p.level}` : metric === 'wins' ? `${p.wins} W` : `${p.streak}🔥`}
              </Badge>
            </Card>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const stLeaderboardScreen = StyleSheet.create({
  rank: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: c.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
});

// ── MusicLobbyScreen ──────────────────────────────────────────────────
const MUSIC_FILTERS = [{ id: 'all', name: 'All' }, { id: 'friends', name: 'Friends' }, { id: 'mine', name: 'Mine' }];

export function MusicLobbyScreen({ rooms = [], onBack, onOpen, onCreate }) {
  const [filter, setFilter] = useState('all');
  const [menu,   setMenu]   = useState(null);
  const list = rooms.filter((r0) => filter === 'all' || (r0.tags || []).includes(filter));

  return (
    <Screen>
      <Header title="Music lobby" subtitle="Listen together in sync" onBack={onBack} />
      <Chips options={MUSIC_FILTERS} value={filter} onChange={setFilter} style={{ marginBottom: sp.m }} />
      {list.length === 0 ? (
        <Empty icon={I.music} title="No listening rooms"
          sub="Start one and queue up YouTube tracks — everyone hears the same second."
          action="Start a music room" onAction={onCreate} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: sp.l, gap: sp.m, paddingBottom: 90 }}>
          {list.map((m) => (
            <Card key={m.id} onPress={() => onOpen && onOpen(m)}>
              <View style={{ flexDirection: 'row', gap: sp.m }}>
                <View style={stMusicLobbyScreen.art}>
                  <Icon name={m.playing ? 'volume-high' : 'musical-notes-outline'} size={19} color={c.beam} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt s="h3" numberOfLines={1}>{m.title}</Txt>
                  <Txt s="cap" numberOfLines={1}>{m.nowPlaying || 'Nothing queued'}</Txt>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: sp.s }}>
                    {(m.listeners || []).slice(0, 4).map((l, i) => (
                      <View key={i} style={{ marginLeft: i ? -8 : 0 }}>
                        <Avatar url={l.avatarUrl} name={l.name} size={22} />
                      </View>
                    ))}
                    <Txt s="cap" style={{ marginLeft: sp.s }}>{m.count || 0} listening</Txt>
                  </View>
                </View>
                <Pressable hitSlop={10} onPress={() => setMenu(m)}>
                  <Icon name={I.more} size={19} color={c.dim} />
                </Pressable>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
      <View style={stMusicLobbyScreen.fabWrap}>
        <Btn title="Start a music room" icon={I.add} onPress={onCreate} size="lg" />
      </View>
      <ActionSheet visible={!!menu} title={menu && menu.title}
        actions={[
          { icon: I.share,  label: 'Share',     onPress: () => {} },
          { icon: I.copy,   label: 'Copy code', onPress: () => {} },
          { icon: I.report, label: 'Report', danger: true, onPress: () => {} },
        ]}
        onClose={() => setMenu(null)} />
    </Screen>
  );
}
const stMusicLobbyScreen = StyleSheet.create({
  art:     { width: 52, height: 52, borderRadius: r.sm, backgroundColor: c.beamDim, alignItems: 'center', justifyContent: 'center' },
  fabWrap: { position: 'absolute', left: sp.l, right: sp.l, bottom: 24 },
});

// ── MusicRoomScreen ─────────────────────────────────────────────────
export function MusicRoomScreen({
  title = 'Music room', nowPlaying, queue = [], listeners = [], isHost, playing,
  onBack, onTogglePlay, onSkip, onAddTrack, onVoteSkip, onRemoveTrack, onReact, onLeave,
}) {
  const [menu,      setMenu]      = useState(null);
  const [trackMenu, setTrackMenu] = useState(null);
  const [url,       setUrl]       = useState('');

  return (
    <Screen>
      <Header title={title} subtitle={`${listeners.length} listening`} onBack={onBack}
        right={<IconBtn name={I.more} label="Room menu" onPress={() => setMenu({ room: true })} />} />
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={{ paddingHorizontal: sp.l }}>
          <Card style={{ padding: sp.l, alignItems: 'center' }}>
            <View style={stMusicRoomScreen.bigArt}>
              <Icon name={I.music} size={40} color={c.beam} />
            </View>
            <Txt s="h2" numberOfLines={1} style={{ marginTop: sp.l, textAlign: 'center' }}>
              {nowPlaying ? nowPlaying.title : 'Nothing playing'}
            </Txt>
            <Txt s="cap" numberOfLines={1}>
              {nowPlaying ? `Added by ${nowPlaying.addedBy}` : 'Add a YouTube link to start'}
            </Txt>
            <View style={stMusicRoomScreen.progress}>
              <View style={[stMusicRoomScreen.progressFill, { width: `${nowPlaying ? nowPlaying.progressPct || 0 : 0}%` }]} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <Txt s="cap">{nowPlaying ? nowPlaying.elapsed : '0:00'}</Txt>
              <Txt s="cap" style={{ color: c.beamHot }}>
                <Icon name={I.sync} size={10} color={c.beamHot} /> in sync
              </Txt>
              <Txt s="cap">{nowPlaying ? nowPlaying.duration : '0:00'}</Txt>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: sp.xl, marginTop: sp.l }}>
              <IconBtn name="heart-outline" label="React" onPress={() => onReact && onReact('❤️')} />
              <Pressable onPress={onTogglePlay} disabled={!isHost}
                style={[stMusicRoomScreen.playBtn, !isHost && { opacity: 0.4 }]}>
                <Icon name={playing ? I.pause : I.playFill} size={26} color="#fff" />
              </Pressable>
              <IconBtn name={I.skip} label="Vote skip"
                onPress={() => (isHost ? onSkip && onSkip() : onVoteSkip && onVoteSkip())} />
            </View>
            {!isHost && <Txt s="cap" style={{ marginTop: sp.s }}>Host controls playback · you can vote to skip</Txt>}
          </Card>
        </View>
        <SectionLabel>ADD A TRACK</SectionLabel>
        <View style={{ paddingHorizontal: sp.l, flexDirection: 'row', gap: sp.s }}>
          <TextInput value={url} onChangeText={setUrl}
            placeholder="Paste a YouTube link" placeholderTextColor={c.dim}
            style={stMusicRoomScreen.input} autoCapitalize="none" />
          <Btn title="Add" icon={I.add} disabled={!url.trim()}
            onPress={() => { onAddTrack && onAddTrack(url.trim()); setUrl(''); }} />
        </View>
        <SectionLabel>{`UP NEXT · ${queue.length}`}</SectionLabel>
        <View style={{ paddingHorizontal: sp.l, gap: sp.s }}>
          {queue.length === 0 ? (
            <Txt s="sub" style={{ textAlign: 'center', paddingVertical: sp.l }}>
              Queue is empty — add the next one.
            </Txt>
          ) : queue.map((tr, i) => (
            <Card key={tr.id} style={{ flexDirection: 'row', alignItems: 'center', gap: sp.m, padding: sp.s + 2 }}>
              <Txt s="cap" style={{ width: 16, textAlign: 'center' }}>{i + 1}</Txt>
              <View style={stMusicRoomScreen.qArt}><Icon name={I.musicOff} size={14} color={c.beam} /></View>
              <View style={{ flex: 1 }}>
                <Txt s="sub" numberOfLines={1} style={{ color: c.text }}>{tr.title}</Txt>
                <Txt s="cap">{tr.addedBy} · {tr.duration}</Txt>
              </View>
              {tr.skipVotes ? <Badge tint="rgba(255,180,84,0.18)" color={c.warn}>{tr.skipVotes} skip</Badge> : null}
              <Pressable hitSlop={10} onPress={() => setTrackMenu(tr)}>
                <Icon name={I.more} size={18} color={c.dim} />
              </Pressable>
            </Card>
          ))}
        </View>
        <SectionLabel>LISTENING</SectionLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: sp.l, gap: sp.l }}>
          {listeners.map((l) => (
            <View key={l.id} style={{ alignItems: 'center', width: 58 }}>
              <Avatar url={l.avatarUrl} name={l.name} size={46} ring={l.isHost ? c.warn : undefined}
                presence={c.beam} />
              <Txt s="cap" numberOfLines={1} style={{ marginTop: 4 }}>{l.name}</Txt>
              {l.isHost ? <Txt s="cap" style={{ color: c.warn, fontSize: 9 }}>HOST</Txt> : null}
            </View>
          ))}
        </ScrollView>
      </ScrollView>
      <ActionSheet visible={!!menu} title={title}
        actions={[
          { icon: I.share,  label: 'Share room',     onPress: () => {} },
          { icon: I.copy,   label: 'Copy code',      onPress: () => {} },
          { icon: I.invite, label: 'Invite friends', onPress: () => {} },
          ...(isHost ? [{ icon: I.settings, label: 'Room settings', onPress: () => {} }] : []),
          { icon: I.leave, label: 'Leave room', danger: true, onPress: onLeave },
        ]}
        onClose={() => setMenu(null)} />
      <ActionSheet visible={!!trackMenu} title={trackMenu && trackMenu.title}
        subtitle={trackMenu && `Added by ${trackMenu.addedBy}`}
        actions={[
          { icon: I.skip,     label: 'Vote to skip',    onPress: () => onVoteSkip && onVoteSkip(trackMenu) },
          { icon: I.bookmark, label: 'Save to my list', onPress: () => {} },
          { icon: I.profile,  label: 'Who added this',  onPress: () => {} },
          ...(isHost ? [{ icon: I.trash, label: 'Remove from queue', danger: true,
            onPress: () => onRemoveTrack && onRemoveTrack(trackMenu) }] : []),
        ]}
        onClose={() => setTrackMenu(null)} />
    </Screen>
  );
}
const stMusicRoomScreen = StyleSheet.create({
  bigArt:       { width: 150, height: 150, borderRadius: r.lg, backgroundColor: c.beamDim, alignItems: 'center', justifyContent: 'center' },
  progress:     { height: 4, backgroundColor: c.surface2, borderRadius: 2, width: '100%', marginTop: sp.l, marginBottom: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: c.beam },
  playBtn:      { width: 62, height: 62, borderRadius: 31, backgroundColor: c.beam, alignItems: 'center', justifyContent: 'center' },
  input:        { flex: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: r.md, paddingHorizontal: sp.m, paddingVertical: 11, color: c.text, fontSize: 14 },
  qArt:         { width: 34, height: 34, borderRadius: 7, backgroundColor: c.beamDim, alignItems: 'center', justifyContent: 'center' },
});

// ── SettingsScreen ────────────────────────────────────────────────────
export function SettingsScreen({ name, email, avatarUrl, level, appVersion = '1.0.0', onBack, go }) {
  return (
    <Screen>
      <Header title="Settings" onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: sp.l }}>
          <Card onPress={() => go('account')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: sp.m, padding: sp.l }}>
            <Avatar url={avatarUrl} name={name} size={52} ring={c.beam} />
            <View style={{ flex: 1 }}>
              <Txt s="h3">{name}</Txt>
              <Txt s="cap" numberOfLines={1}>{email}</Txt>
              {level ? <Txt s="cap" style={{ color: c.beamHot }}>Level {level}</Txt> : null}
            </View>
            <Icon name={I.next} size={18} color={c.dim} />
          </Card>
        </View>
        <SectionLabel>ACCOUNT</SectionLabel>
        <View style={{ marginHorizontal: sp.l, backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
          <Row icon={I.profile} title="Account"          sub="Name, email, sign-in"        onPress={() => go('account')} />
          <Row icon={I.edit}    title="Avatar & identity" sub="Studio, title, frame"         onPress={() => go('avatar')} />
          <Row icon={I.bell}    title="Notifications"                                         onPress={() => go('notifications')} />
          <Row icon={I.lock}    title="Privacy & safety"  sub="Who can invite you, blocking" onPress={() => go('privacy')} last />
        </View>
        <SectionLabel>APP</SectionLabel>
        <View style={{ marginHorizontal: sp.l, backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
          <Row icon={I.sync}  title="Playback & sync"  sub="Quality, auto-sync, subtitles" onPress={() => go('playback')} />
          <Row icon={I.moon}  title="Appearance"                                             onPress={() => go('appearance')} />
          <Row icon={I.disk}  title="Storage & data"                                        onPress={() => go('storage')} last />
        </View>
        <SectionLabel>SUPPORT</SectionLabel>
        <View style={{ marginHorizontal: sp.l, backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
          <Row icon={I.help}   title="Help center"                                      onPress={() => go('help')} />
          <Row icon={I.report} title="Report a problem"                                 onPress={() => go('help')} />
          <Row icon={I.info}   title="About"            sub={`Version ${appVersion}`}   onPress={() => go('about')} last />
        </View>
        <Txt s="cap" style={{ textAlign: 'center', marginTop: sp.xl }}>WatchParty v{appVersion}</Txt>
      </ScrollView>
    </Screen>
  );
}

// ── AccountScreen ─────────────────────────────────────────────────────
const Group = ({ children }) => (
  <View style={{ marginHorizontal: sp.l, backgroundColor: c.surface, borderRadius: 14,
    borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>{children}</View>
);

export function AccountScreen({
  name, email, userId, accountType = 'Registered', joinedAt,
  onBack, onEditName, onChangeEmail, onChangePassword, onSignOut, onDelete, onCopyId,
}) {
  const [copied, setCopied] = useState(false);
  const confirmSignOut = () => Alert.alert('Sign out?', 'You can sign back in anytime.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign out', style: 'destructive', onPress: onSignOut },
  ]);
  const confirmDelete = () => Alert.alert(
    'Delete account?',
    'This permanently removes your avatar, level, items, and history. This cannot be undone.',
    [{ text: 'Cancel', style: 'cancel' },
     { text: 'Delete forever', style: 'destructive', onPress: onDelete }],
  );
  return (
    <Screen>
      <Header title="Account" onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionLabel>PROFILE</SectionLabel>
        <Group>
          <Row icon={I.profile}       title="Display name" right={<Txt s="sub">{name}</Txt>}   onPress={onEditName} />
          <Row icon="mail-outline"    title="Email"        right={<Txt s="sub" numberOfLines={1} style={{ maxWidth: 170 }}>{email}</Txt>} onPress={onChangeEmail} />
          <Row icon={I.lock}          title="Password"                                           onPress={onChangePassword} last />
        </Group>
        <SectionLabel>DETAILS</SectionLabel>
        <Group>
          <Row icon={I.shield}           title="Account type"  right={<Txt s="sub">{accountType}</Txt>} />
          <Row icon="calendar-outline"   title="Member since"  right={<Txt s="sub">{joinedAt || '—'}</Txt>} />
          <Row icon={I.copy} title="User ID"
            sub={copied ? 'Copied to clipboard' : undefined}
            right={<Txt s="cap" numberOfLines={1} style={{ maxWidth: 130 }}>
              {userId ? `${String(userId).slice(0, 8)}…` : '—'}
            </Txt>}
            onPress={() => { onCopyId && onCopyId(userId); setCopied(true); setTimeout(() => setCopied(false), 1600); }}
            last />
        </Group>
        <View style={{ paddingHorizontal: sp.l, marginTop: sp.xxl, gap: sp.m }}>
          <Btn title="Sign out"       variant="secondary" icon={I.leave} onPress={confirmSignOut} />
          <Btn title="Delete account" variant="danger"                   onPress={confirmDelete} />
          <Txt s="cap" style={{ textAlign: 'center' }}>
            Deleting is permanent and removes your level, items, and history.
          </Txt>
        </View>
      </ScrollView>
    </Screen>
  );
}

// ── Shared prefs helpers ──────────────────────────────────────────────
const Toggle = ({ value, onChange }) => (
  <Switch value={value} onValueChange={onChange}
    trackColor={{ true: c.beam, false: c.surface2 }} thumbColor="#fff" />
);

// ── NotificationsScreen ────────────────────────────────────────────────
export function NotificationsScreen({ prefs = {}, onChange, onBack }) {
  const [s, setS] = useState({
    roomInvites: true, friendRequests: true, friendLive: true,
    gameTurn: true, gifts: true, levelUp: true, streak: true, marketing: false, ...prefs,
  });
  const set = (k) => (v) => { const next = { ...s, [k]: v }; setS(next); onChange && onChange(next); };
  return (
    <Screen>
      <Header title="Notifications" onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionLabel>SOCIAL</SectionLabel>
        <Group>
          <Row icon={I.invite}       title="Room invites"           right={<Toggle value={s.roomInvites}    onChange={set('roomInvites')} />} />
          <Row icon={I.people}       title="Friend requests"        right={<Toggle value={s.friendRequests} onChange={set('friendRequests')} />} />
          <Row icon="radio-outline"  title="Friend starts watching" right={<Toggle value={s.friendLive}     onChange={set('friendLive')} />} last />
        </Group>
        <SectionLabel>PLAY</SectionLabel>
        <Group>
          <Row icon={I.cards} title="Your turn in a game" right={<Toggle value={s.gameTurn} onChange={set('gameTurn')} />} />
          <Row icon={I.gift}  title="Gifts received"      right={<Toggle value={s.gifts}    onChange={set('gifts')} />} last />
        </Group>
        <SectionLabel>PROGRESS</SectionLabel>
        <Group>
          <Row icon={I.trophy}          title="Level ups & rewards"                                        right={<Toggle value={s.levelUp}   onChange={set('levelUp')} />} />
          <Row icon={I.fire}            title="Streak reminders" sub="One a day, before your streak expires" right={<Toggle value={s.streak}  onChange={set('streak')} />} />
          <Row icon="megaphone-outline" title="News & offers"                                              right={<Toggle value={s.marketing} onChange={set('marketing')} />} last />
        </Group>
      </ScrollView>
    </Screen>
  );
}

// ── PrivacyScreen ─────────────────────────────────────────────────────
export function PrivacyScreen({ prefs = {}, blockedCount = 0, onChange, onBack, onBlocked }) {
  const [s, setS] = useState({
    whoCanInvite: 'friends', showActivity: true, showLevel: true,
    discoverable: true, readReceipts: true, ...prefs,
  });
  const set = (k) => (v) => { const next = { ...s, [k]: v }; setS(next); onChange && onChange(next); };
  return (
    <Screen>
      <Header title="Privacy & safety" onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionLabel>WHO CAN INVITE ME</SectionLabel>
        <Chips
          options={[{ id: 'everyone', name: 'Everyone' }, { id: 'friends', name: 'Friends' }, { id: 'nobody', name: 'Nobody' }]}
          value={s.whoCanInvite} onChange={set('whoCanInvite')} />
        <SectionLabel>VISIBILITY</SectionLabel>
        <Group>
          <Row icon={I.eye}    title="Show my activity"  sub="Friends see what you're watching" right={<Toggle value={s.showActivity}  onChange={set('showActivity')} />} />
          <Row icon={I.star}   title="Show my level"                                             right={<Toggle value={s.showLevel}    onChange={set('showLevel')} />} />
          <Row icon={I.search} title="Findable by email"                                         right={<Toggle value={s.discoverable} onChange={set('discoverable')} />} />
          <Row icon={I.check}  title="Read receipts in chat"                                    right={<Toggle value={s.readReceipts} onChange={set('readReceipts')} />} last />
        </Group>
        <SectionLabel>SAFETY</SectionLabel>
        <Group>
          <Row icon={I.block}  title="Blocked people" right={<Txt s="sub">{blockedCount}</Txt>} onPress={onBlocked} />
          <Row icon={I.report} title="Report history"                                           onPress={() => {}} last />
        </Group>
      </ScrollView>
    </Screen>
  );
}

// ── PlaybackScreen ────────────────────────────────────────────────────
export function PlaybackScreen({ prefs = {}, onChange, onBack }) {
  const [s, setS] = useState({
    quality: 'auto', autoSync: true, resyncOnJoin: true,
    subtitles: false, dataSaver: false, reactionsOverlay: true, ...prefs,
  });
  const set = (k) => (v) => { const next = { ...s, [k]: v }; setS(next); onChange && onChange(next); };
  return (
    <Screen>
      <Header title="Playback & sync" onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionLabel>VIDEO QUALITY</SectionLabel>
        <Chips
          options={[{ id: 'auto', name: 'Auto' }, { id: '1080', name: '1080p' }, { id: '720', name: '720p' }, { id: '480', name: '480p' }]}
          value={s.quality} onChange={set('quality')} />
        <SectionLabel>SYNC</SectionLabel>
        <Group>
          <Row icon={I.sync}        title="Keep me in sync"    sub="Auto-correct drift during playback" right={<Toggle value={s.autoSync}     onChange={set('autoSync')} />} />
          <Row icon="enter-outline" title="Jump to live on join"                                         right={<Toggle value={s.resyncOnJoin} onChange={set('resyncOnJoin')} />} last />
        </Group>
        <SectionLabel>IN THE ROOM</SectionLabel>
        <Group>
          <Row icon="chatbubble-outline" title="Floating reactions"           right={<Toggle value={s.reactionsOverlay} onChange={set('reactionsOverlay')} />} />
          <Row icon="text-outline"       title="Subtitles by default"         right={<Toggle value={s.subtitles}        onChange={set('subtitles')} />} />
          <Row icon="cellular-outline"   title="Data saver" sub="Lower quality on mobile data" right={<Toggle value={s.dataSaver} onChange={set('dataSaver')} />} last />
        </Group>
      </ScrollView>
    </Screen>
  );
}

// ── AppearanceScreen ──────────────────────────────────────────────────
export function AppearanceScreen({ prefs = {}, onChange, onBack }) {
  const [s, setS] = useState({ theme: 'dark', reduceMotion: false, avatars3d: true, haptics: true, ...prefs });
  const set = (k) => (v) => { const next = { ...s, [k]: v }; setS(next); onChange && onChange(next); };
  return (
    <Screen>
      <Header title="Appearance" onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionLabel>THEME</SectionLabel>
        <Chips options={[{ id: 'dark', name: 'Dark' }, { id: 'system', name: 'System' }]}
          value={s.theme} onChange={set('theme')} />
        <Txt s="cap" style={{ paddingHorizontal: sp.l, marginTop: sp.s }}>
          WatchParty is built dark — it keeps the room dim while you watch.
        </Txt>
        <SectionLabel>MOTION & 3D</SectionLabel>
        <Group>
          <Row icon="cube-outline"           title="3D avatars"    sub="Turn off to use flat images (saves battery)" right={<Toggle value={s.avatars3d}     onChange={set('avatars3d')} />} />
          <Row icon="accessibility-outline"  title="Reduce motion"                                                   right={<Toggle value={s.reduceMotion} onChange={set('reduceMotion')} />} />
          <Row icon="phone-portrait-outline" title="Haptics"                                                         right={<Toggle value={s.haptics}      onChange={set('haptics')} />} last />
        </Group>
      </ScrollView>
    </Screen>
  );
}

// ── StorageScreen ─────────────────────────────────────────────────────
export function StorageScreen({ cacheSize = '—', onClearCache, onBack }) {
  return (
    <Screen>
      <Header title="Storage & data" onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ padding: sp.l }}>
          <Card style={{ alignItems: 'center', paddingVertical: sp.xl }}>
            <Txt s="h1">{cacheSize}</Txt>
            <Txt s="cap">Cached avatars, thumbnails and art</Txt>
            <Btn title="Clear cache" variant="secondary" size="sm"
              onPress={onClearCache} style={{ marginTop: sp.m, minWidth: 150 }} />
          </Card>
        </View>
        <Group>
          <Row icon="download-outline" title="Download over Wi-Fi only"
            right={<Toggle value onChange={() => {}} />} last />
        </Group>
      </ScrollView>
    </Screen>
  );
}

// ── HelpScreen ────────────────────────────────────────────────────────
export function HelpScreen({ onBack, supportEmail = 'support@watchparty.app' }) {
  return (
    <Screen>
      <Header title="Help" onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionLabel>COMMON QUESTIONS</SectionLabel>
        <Group>
          <Row icon={I.sync}    title="Video is out of sync"         onPress={() => {}} />
          <Row icon={I.rooms}   title="Friends can't join my room"   onPress={() => {}} />
          <Row icon={I.cards}   title="How games and XP work"        onPress={() => {}} />
          <Row icon={I.profile} title="Avatar won't save"            onPress={() => {}} last />
        </Group>
        <SectionLabel>CONTACT</SectionLabel>
        <Group>
          <Row icon="mail-outline" title="Email support" sub={supportEmail}
            onPress={() => Linking.openURL(`mailto:${supportEmail}`)} />
          <Row icon={I.report} title="Report a problem" onPress={() => {}} last />
        </Group>
      </ScrollView>
    </Screen>
  );
}

// ── AboutScreen ───────────────────────────────────────────────────────
export function AboutScreen({ onBack, appVersion = '1.0.0', build = '1' }) {
  return (
    <Screen>
      <Header title="About" onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', paddingVertical: sp.xxl }}>
          <View style={{ width: 74, height: 74, borderRadius: 20, backgroundColor: c.beam,
            alignItems: 'center', justifyContent: 'center' }}>
            <Txt style={{ fontSize: 30, fontWeight: '800', color: '#fff' }}>W</Txt>
          </View>
          <Txt s="h2" style={{ marginTop: sp.m }}>WatchParty</Txt>
          <Txt s="cap">Version {appVersion} ({build})</Txt>
        </View>
        <Group>
          <Row icon="document-text-outline" title="Terms of service"    onPress={() => {}} />
          <Row icon={I.shield}              title="Privacy policy"      onPress={() => {}} />
          <Row icon="code-slash-outline"    title="Open source licenses" onPress={() => {}} />
          <Row icon="star-outline"          title="Rate the app"         onPress={() => {}} last />
        </Group>
      </ScrollView>
    </Screen>
  );
}
