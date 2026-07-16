// Home — one hero action, then what's happening, then a shortcut row.
// Single accent (beam). Platform tiles are the only brand-colored things.
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Icon, { I } from '../ui/Icon';
import ActionSheet from '../ui/Sheet';
import {
  Avatar, Badge, Btn, Card, Header, IconBtn, LiveDot, Screen, SectionLabel, Txt,
} from '../ui/kit';
import { c, r, sp, PLATFORMS } from '../ui/tokens';

export default function HomeScreen({
  name = 'there', level, avatarUrl, liveRooms = [], friendsOnline = [], recent = [],
  onCreate, onJoin, onOpenRoom, onOpenSettings, onOpenPlay, onOpenMusic,
  onOpenRooms, onOpenProfile, onPlatform,
}) {
  const [menu, setMenu] = useState(null);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <Header
          large
          title={`Hey, ${name}`}
          subtitle={level ? `Level ${level}` : undefined}
          right={
            <View style={{ flexDirection: 'row', gap: sp.s, alignItems: 'center' }}>
              <IconBtn name={I.bell} label="Notifications" onPress={() => {}} />
              <Pressable onPress={onOpenProfile}>
                <Avatar url={avatarUrl} name={name} size={36} ring={c.beam} />
              </Pressable>
            </View>
          }
        />

        {/* hero */}
        <View style={{ paddingHorizontal: sp.l, gap: sp.m }}>
          <Pressable onPress={onCreate} style={({ pressed }) => [st.hero, pressed && { opacity: 0.9 }]}>
            <View style={st.heroIcon}><Icon name="videocam" size={22} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Start a watch party</Txt>
              <Txt style={{ fontSize: 12.5, color: '#EDE9FFCC' }}>Pick something, invite friends</Txt>
            </View>
            <Icon name={I.next} size={20} color="#fff" />
          </Pressable>
          <View style={{ flexDirection: 'row', gap: sp.m }}>
            <Btn title="Join with code" icon={I.join} variant="secondary" onPress={onJoin} style={{ flex: 1 }} />
            <Btn title="Music lobby" icon={I.music} variant="secondary" onPress={onOpenMusic} style={{ flex: 1 }} />
          </View>
        </View>

        {/* live now */}
        {liveRooms.length > 0 && (
          <>
            <SectionLabel action="See all" onAction={onOpenRooms}>LIVE NOW</SectionLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: sp.l, gap: sp.m }}>
              {liveRooms.map((room) => (
                <Card key={room.id} onPress={() => onOpenRoom && onOpenRoom(room)} style={st.liveCard}>
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

        {/* friends */}
        {friendsOnline.length > 0 && (
          <>
            <SectionLabel>FRIENDS ONLINE</SectionLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: sp.l, gap: sp.l }}>
              {friendsOnline.map((f) => (
                <Pressable key={f.id} onPress={() => setMenu(f)} style={{ alignItems: 'center', width: 62 }}>
                  <Avatar url={f.avatarUrl} name={f.name} size={50}
                    ring={f.frameColor} presence={f.presenceColor || c.ok} />
                  <Txt s="cap" numberOfLines={1} style={{ marginTop: 5, color: c.text2 }}>{f.name}</Txt>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {/* platforms */}
        <SectionLabel>WATCH FROM</SectionLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: sp.l, gap: sp.s }}>
          {PLATFORMS.map((p) => (
            <Pressable key={p.id} onPress={() => onPlatform && onPlatform(p)}
              style={({ pressed }) => [st.platform, pressed && { backgroundColor: c.surface2 }]}>
              <View style={[st.platformDot, { backgroundColor: p.color }]} />
              <Txt s="sub" style={{ fontWeight: '600' }}>{p.name}</Txt>
            </Pressable>
          ))}
        </ScrollView>

        {/* jump back in */}
        {recent.length > 0 && (
          <>
            <SectionLabel action="History" onAction={onOpenProfile}>JUMP BACK IN</SectionLabel>
            <View style={{ paddingHorizontal: sp.l, gap: sp.s }}>
              {recent.map((item) => (
                <Card key={item.id} onPress={() => onOpenRoom && onOpenRoom(item)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: sp.m }}>
                  <View style={st.thumb}><Icon name="play" size={16} color={c.beam} /></View>
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
            { id: 'wildbeam', name: 'WildBeam', icon: I.cards, sub: '2–8' },
            { id: 'matchblitz', name: 'Match Blitz', icon: I.brain, sub: '2–6' },
            { id: 'ludo', name: 'Ludo', icon: I.dice, sub: '2–4' },
          ].map((g) => (
            <Card key={g.id} onPress={() => onOpenPlay && onOpenPlay(g)} style={{ flex: 1, alignItems: 'center', paddingVertical: sp.l }}>
              <Icon name={g.icon} size={22} color={c.beam} />
              <Txt s="sub" style={{ fontWeight: '600', marginTop: 6 }}>{g.name}</Txt>
              <Txt s="cap">{g.sub} players</Txt>
            </Card>
          ))}
        </View>
      </ScrollView>

      <ActionSheet
        visible={!!menu}
        title={menu && (menu.title || menu.name)}
        actions={menu && menu.name && !menu.title ? [
          { icon: I.profile, label: 'View profile', onPress: () => {} },
          { icon: I.message, label: 'Message', onPress: () => {} },
          { icon: I.invite, label: 'Invite to room', onPress: () => {} },
          { icon: I.gift, label: 'Send a gift', onPress: () => {} },
          { icon: I.block, label: 'Block', danger: true, onPress: () => {} },
        ] : [
          { icon: I.share, label: 'Share room', onPress: () => {} },
          { icon: I.copy, label: 'Copy invite code', onPress: () => {} },
          { icon: I.bookmark, label: 'Save for later', onPress: () => {} },
          { icon: I.report, label: 'Report', danger: true, onPress: () => {} },
        ]}
        onClose={() => setMenu(null)}
      />
    </Screen>
  );
}

const st = StyleSheet.create({
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: sp.m,
    backgroundColor: c.beam, borderRadius: r.lg, padding: sp.l,
  },
  heroIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#FFFFFF2E', alignItems: 'center', justifyContent: 'center',
  },
  liveCard: { width: 210 },
  platform: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
    paddingHorizontal: 13, paddingVertical: 9, borderRadius: r.pill,
  },
  platformDot: { width: 9, height: 9, borderRadius: 5 },
  thumb: {
    width: 44, height: 44, borderRadius: r.sm, backgroundColor: c.beamDim,
    alignItems: 'center', justifyContent: 'center',
  },
});
