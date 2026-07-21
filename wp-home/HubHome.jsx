// HubHome — the Hub (F) that grows into the Live Grid (D).
//
// Quiet: resume card + big tappable widgets. Never looks empty.
// Busy (2+ live things): a LIVE NOW grid appears above the widgets.
// Same screen, no mode switch, no empty-state sadness.
//
// Everything is props — no data fetching in here.
import React, { useMemo, useRef } from 'react';
import {
  Animated, Image, Pressable, RefreshControl, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const c = {
  ink: '#0B0D14', surface: '#141826', surface2: '#1B2133',
  border: '#232A3F', borderHi: '#3A4460',
  beam: '#8B7CFF', beamHot: '#B7A8FF', beamDeep: '#6A5AE0',
  beamDim: 'rgba(139,124,255,0.14)',
  text: '#EEF1FA', text2: '#A8B0C6', dim: '#6F7894',
  live: '#FF4D6D', ok: '#3DDC84', warn: '#FFB454', cyan: '#35E0D0',
};

// tile art per kind — no images needed, still looks designed
const KIND = {
  watch: { grad: ['#4A3570', '#1B1030'], icon: 'play', label: 'LIVE', tone: c.live },
  music: { grad: ['#101A2E', '#0A0F1E'], icon: 'musical-notes', label: 'MUSIC', tone: c.beam },
  game:  { grad: ['#12233A', '#0A1220'], icon: 'albums', label: 'GAME', tone: c.cyan },
};

const Txt = ({ w, s = 13, col = c.text, style, children, ...p }) => (
  <Text style={[{ fontSize: s, color: col, fontWeight: w || '400' }, style]} {...p}>{children}</Text>
);

const Label = ({ children, action, onAction }) => (
  <View style={st.labelRow}>
    <Txt s={10.5} w="800" col={c.dim} style={{ letterSpacing: 1.2 }}>{children}</Txt>
    {action ? (
      <Pressable onPress={onAction} hitSlop={8}>
        <Txt s={11.5} w="700" col={c.beamHot}>{action}</Txt>
      </Pressable>
    ) : null}
  </View>
);

function Gradient({ colors, style, children }) {
  // Two stacked views fake a gradient without pulling in expo-linear-gradient.
  // Swap for <LinearGradient> if you already have it.
  return (
    <View style={[{ backgroundColor: colors[1], overflow: 'hidden' }, style]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors[0], opacity: 0.85,
        transform: [{ translateY: -20 }, { scaleY: 1.2 }] }]} />
      {children}
    </View>
  );
}

const Stack = ({ people = [], size = 20, max = 4 }) => (
  <View style={{ flexDirection: 'row' }}>
    {people.slice(0, max).map((p, i) => (
      <View key={i} style={[st.stackAvatar, { width: size, height: size, borderRadius: size / 2,
        marginLeft: i ? -size * 0.32 : 0 }]}>
        {p.avatarUrl
          ? <Image source={{ uri: p.avatarUrl }} style={{ width: '100%', height: '100%' }} />
          : <Txt s={size * 0.42} w="700" col={c.dim}>{(p.name || '?')[0].toUpperCase()}</Txt>}
      </View>
    ))}
  </View>
);

// ---------------------------------------------------------------- widget
function Widget({ icon, title, sub, badge, badgeTone = c.beam, onPress, tint }) {
  const scale = useRef(new Animated.Value(1)).current;
  const spring = (to) => Animated.spring(scale, {
    toValue: to, useNativeDriver: true, speed: 40, bounciness: 6,
  }).start();

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
      <Pressable onPress={onPress}
        onPressIn={() => spring(0.96)} onPressOut={() => spring(1)}
        style={st.widget}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={[st.widgetIcon, { backgroundColor: (tint || c.beam) + '26' }]}>
            <Ionicons name={icon} size={19} color={tint || c.beam} />
          </View>
          {badge ? (
            <View style={[st.badge, { backgroundColor: badgeTone }]}>
              <Txt s={9} w="800" col="#fff">{badge}</Txt>
            </View>
          ) : null}
        </View>
        <View>
          <Txt s={13.5} w="700">{title}</Txt>
          <Txt s={10.5} col={c.dim} numberOfLines={1}>{sub}</Txt>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------- action card
function ActionCard({ icon, tint, title, sub, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const spring = (to) => Animated.spring(scale, {
    toValue: to, useNativeDriver: true, speed: 40, bounciness: 6,
  }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => spring(0.97)}
        onPressOut={() => spring(1)}
        style={st.actionCard}>
        <View style={[st.actionIcon, { backgroundColor: tint + '22' }]}>
          <Ionicons name={icon} size={22} color={tint} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt s={14} w="700">{title}</Txt>
          <Txt s={10.5} col={c.dim} numberOfLines={1}>{sub}</Txt>
        </View>
        <Ionicons name="chevron-forward" size={16} color={c.dim} />
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------- live tile
function LiveTile({ item, wide, onPress }) {
  const k = KIND[item.kind] || KIND.watch;
  return (
    <Pressable onPress={() => onPress && onPress(item)}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }, wide ? { width: '100%' } : { flex: 1 }]}>
      <Gradient colors={k.grad} style={[st.tile, { height: wide ? 132 : 104 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={[st.tilePill, { backgroundColor: k.tone }]}>
            {item.kind === 'watch' ? <View style={st.dot} /> : null}
            <Txt s={8.5} w="800" col={item.kind === 'game' ? '#04211E' : '#fff'}>{k.label}</Txt>
          </View>
          {item.count ? (
            <View style={st.tileCount}>
              <Ionicons name="people" size={9} color="#ffffffcc" />
              <Txt s={9} w="700" col="#ffffffcc">{item.count}</Txt>
            </View>
          ) : null}
        </View>

        <View>
          <Txt s={wide ? 14.5 : 11.5} w="700" col="#fff" numberOfLines={1}>{item.title}</Txt>
          <Txt s={9} col="#ffffff99" numberOfLines={1}>{item.subtitle}</Txt>
          {wide && item.members ? (
            <View style={{ marginTop: 8 }}><Stack people={item.members} size={19} /></View>
          ) : null}
        </View>
      </Gradient>
    </Pressable>
  );
}

// ---------------------------------------------------------------- screen
export default function HubHome({
  name = 'there', avatarUrl, progression, resume, live = [], friendsOnline = [],
  challenge, refreshing, onRefresh,
  onResume, onHost, onCreateRoom, onJoinRoom, onOpenGames, onOpenMusic, onOpenFriends, onOpenRooms,
  onOpenLive, onOpenProfile, onOpenSettings, onOpenChallenge,
}) {
  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Still up' : hour < 12 ? 'Good morning'
    : hour < 18 ? 'Good afternoon' : 'Good evening';

  const counts = useMemo(() => ({
    games: live.filter((l) => l.kind === 'game').reduce((n, l) => n + (l.count || 1), 0),
    music: live.filter((l) => l.kind === 'music').reduce((n, l) => n + (l.count || 0), 0),
    watching: live.filter((l) => l.kind === 'watch').length,
  }), [live]);

  const p = progression;
  const pct = p ? Math.min(100, Math.round((p.into / Math.max(1, p.needed)) * 100)) : 0;

  return (
    <View style={st.root}>
      <ScrollView
        contentContainerStyle={{ padding: 14, paddingTop: 54, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        refreshControl={onRefresh
          ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.beam} />
          : undefined}>

        {/* identity strip */}
        <View style={st.top}>
          <Pressable onPress={onOpenProfile} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={st.me}>
              {avatarUrl ? <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} />
                : <Ionicons name="person" size={17} color={c.dim} />}
            </View>
            <View>
              <Txt s={10.5} col={c.dim}>{greeting}</Txt>
              <Txt s={16} w="800">{name}</Txt>
            </View>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={onOpenFriends} style={st.iconBtn}>
              <Ionicons name="people-outline" size={17} color={c.text2} />
              {friendsOnline.length ? <View style={st.dotBadge} /> : null}
            </Pressable>
            <Pressable onPress={onOpenSettings} style={st.iconBtn}>
              <Ionicons name="settings-outline" size={17} color={c.text2} />
            </Pressable>
          </View>
        </View>

        {/* resume card */}
        {resume && (
          <Pressable onPress={() => onResume && onResume(resume)}
            style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }, { marginBottom: 12 }]}>
            <Gradient colors={[c.beam, c.beamDeep]} style={st.resume}>
              <Txt s={9.5} w="800" col="#ffffffaa" style={{ letterSpacing: 1.2 }}>
                PICK UP WHERE YOU LEFT OFF
              </Txt>
              <Txt s={16.5} w="700" col="#fff" numberOfLines={1} style={{ marginTop: 6 }}>
                {resume.title}
              </Txt>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
                {resume.members ? <Stack people={resume.members} size={18} /> : null}
                <Txt s={10} col="#ffffffcc" style={{ flex: 1 }} numberOfLines={1}>{resume.subtitle}</Txt>
                <View style={st.resumeGo}>
                  <Ionicons name="play" size={13} color={c.beam} />
                  <Txt s={11} w="800" col={c.beam}>Resume</Txt>
                </View>
              </View>
            </Gradient>
          </Pressable>
        )}

        {/* Main action cards */}
        <Label>START SOMETHING</Label>
        <View style={{ gap: 9, marginBottom: 6 }}>
          {/* Create a room */}
          <ActionCard
            icon="add-circle"
            tint={c.beam}
            title="Create a Room"
            sub="Start a watch party, game, or music session"
            onPress={onCreateRoom || onHost}
          />
          {/* Join a room */}
          <ActionCard
            icon="enter-outline"
            tint={c.cyan}
            title="Join a Room"
            sub="Enter a room code to join friends"
            onPress={onJoinRoom}
          />
          {/* Watch together */}
          <ActionCard
            icon="play-circle"
            tint={c.beamHot}
            title="Watch Together"
            sub="YouTube, Vimeo, Twitch, Dailymotion, or direct link"
            onPress={onHost}
          />
        </View>

        {/* widgets */}
        <Label>DO SOMETHING</Label>
        <View style={{ gap: 9 }}>
          <View style={{ flexDirection: 'row', gap: 9 }}>
            <Widget icon="videocam" title="Host" sub="YouTube, or sync any app"
              onPress={onHost} />
            <Widget icon="albums" title="Games" tint={c.cyan}
              sub={counts.games ? `${counts.games} at a table` : 'Play together'}
              badge={counts.games ? String(counts.games) : null} badgeTone={c.cyan}
              onPress={onOpenGames} />
          </View>
          <View style={{ flexDirection: 'row', gap: 9 }}>
            <Widget icon="musical-notes" title="Music" tint={c.beamHot}
              sub={counts.music ? `${counts.music} listening` : 'Queue tracks together'}
              badge={counts.music ? String(counts.music) : null} badgeTone={c.beam}
              onPress={onOpenMusic} />
            <Widget icon="people" title="Friends" tint={c.warn}
              sub={friendsOnline.length
                ? `${friendsOnline[0].name}${friendsOnline.length > 1 ? ` +${friendsOnline.length - 1}` : ''} online`
                : 'Invite people you watch with'}
              badge={counts.watching ? 'LIVE' : null} badgeTone={c.live}
              onPress={onOpenFriends} />
          </View>
        </View>

        {/* friends row */}
        {friendsOnline.length > 0 && (
          <>
            <Label action="All" onAction={onOpenFriends}>ONLINE</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 14, paddingVertical: 2 }}>
              {friendsOnline.map((f) => (
                <Pressable key={f.id} onPress={() => onOpenFriends && onOpenFriends(f)}
                  style={{ alignItems: 'center', width: 58 }}>
                  <View style={[st.ring, { borderColor: f.live ? c.live : c.ok }]}>
                    <View style={st.ringInner}>
                      {f.avatarUrl
                        ? <Image source={{ uri: f.avatarUrl }} style={{ width: '100%', height: '100%' }} />
                        : <Txt s={17} w="700" col={c.dim}>{(f.name || '?')[0].toUpperCase()}</Txt>}
                    </View>
                  </View>
                  <Txt s={9.5} col={c.text2} numberOfLines={1} style={{ marginTop: 4 }}>{f.name}</Txt>
                  {f.live ? <Txt s={8} w="800" col={c.live}>LIVE</Txt> : null}
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {/* progress + challenge */}
        {p && (
          <Pressable onPress={onOpenProfile} style={st.xpCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <View style={st.lvBadge}><Txt s={10} w="800" col="#fff">LV {p.level}</Txt></View>
                <Txt s={12} w="700" col={c.beamHot}>{p.title}</Txt>
              </View>
              {p.streak && p.streak.current > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="flame" size={12} color={c.live} />
                  <Txt s={11} w="700" col={c.text2}>{p.streak.current}</Txt>
                </View>
              ) : null}
            </View>
            <View style={st.xpTrack}><View style={[st.xpFill, { width: `${Math.max(2, pct)}%` }]} /></View>
            <Txt s={9.5} col={c.dim}>
              {p.into.toLocaleString()} / {p.needed.toLocaleString()} XP to Level {p.level + 1}
            </Txt>
          </Pressable>
        )}

        {challenge && (
          <Pressable onPress={onOpenChallenge} style={st.challenge}>
            <View style={st.chIcon}><Ionicons name="trophy-outline" size={17} color={c.warn} /></View>
            <View style={{ flex: 1 }}>
              <Txt s={12.5} w="700">{challenge.title}</Txt>
              <Txt s={9.5} col={c.dim}>{challenge.sub}</Txt>
            </View>
            <Ionicons name="chevron-forward" size={15} color={c.dim} />
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.ink },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  me: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: c.surface2,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    borderWidth: 1.5, borderColor: c.beam,
  },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: c.surface,
    borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center',
  },
  dotBadge: {
    position: 'absolute', top: 6, right: 6, width: 7, height: 7,
    borderRadius: 4, backgroundColor: c.ok, borderWidth: 1.5, borderColor: c.surface,
  },
  resume: { borderRadius: 22, padding: 16 },
  resumeTrack: {
    height: 4, backgroundColor: '#ffffff33', borderRadius: 2, marginTop: 12, overflow: 'hidden',
  },
  resumeFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  resumeGo: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7,
  },
  labelRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 22, marginBottom: 10,
  },
  tile: { borderRadius: 18, padding: 11, justifyContent: 'space-between' },
  tilePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start',
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },
  tileCount: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#00000059', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6,
  },
  actionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: c.surface, borderRadius: 18, borderWidth: 1, borderColor: c.border,
    padding: 14,
  },
  actionIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addTile: {
    flex: 1, height: 104, borderRadius: 18, borderWidth: 1.5, borderColor: c.borderHi,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  widget: {
    backgroundColor: c.surface, borderRadius: 20, borderWidth: 1, borderColor: c.border,
    padding: 13, height: 104, justifyContent: 'space-between',
  },
  widgetIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, minWidth: 20, alignItems: 'center' },
  stackAvatar: {
    backgroundColor: c.surface2, borderWidth: 1.5, borderColor: c.ink,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  ring: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  ringInner: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: c.surface2,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  xpCard: {
    backgroundColor: c.surface, borderRadius: 18, borderWidth: 1, borderColor: c.border,
    padding: 13, marginTop: 22, gap: 8,
  },
  lvBadge: { backgroundColor: c.beam, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  xpTrack: { height: 6, backgroundColor: c.surface2, borderRadius: 3, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: c.beam, borderRadius: 3 },
  challenge: {
    flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 9,
    backgroundColor: c.surface, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 12,
  },
  chIcon: {
    width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,180,84,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
});
