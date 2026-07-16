// Play tab — games + music lobby in one place ("things to do with people").
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Icon, { I } from '../ui/Icon';
import ActionSheet from '../ui/Sheet';
import { Avatar, Badge, Card, Header, IconBtn, Screen, SectionLabel, Txt } from '../ui/kit';
import { c, r, sp } from '../ui/tokens';

const GAMES = [
  { id: 'wildbeam', name: 'WildBeam', icon: I.cards, players: '2–8 players',
    blurb: 'Match colors, drop boosts, call last card', tint: '#8B7CFF' },
  { id: 'matchblitz', name: 'Match Blitz', icon: I.brain, players: '2–6 players',
    blurb: 'Memory pairs — match to keep your turn', tint: '#35E0D0' },
  { id: 'ludo', name: 'Ludo', icon: I.dice, players: '2–4 players',
    blurb: 'The classic race home', tint: '#FFB454' },
];

export default function PlayScreen({
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
                  <View style={[st.gameIcon, { backgroundColor: c.beamDim }]}>
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
          {GAMES.map((g) => (
            <Card key={g.id} onPress={() => onStartGame && onStartGame(g)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: sp.m }}>
              <View style={[st.gameIcon, { backgroundColor: g.tint + '22' }]}>
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
            style={({ pressed }) => [st.musicHero, pressed && { opacity: 0.9 }]}>
            <View style={st.musicIcon}><Icon name={I.music} size={21} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 15.5, fontWeight: '700', color: '#fff' }}>Music lobby</Txt>
              <Txt style={{ fontSize: 12.5, color: '#EDE9FFCC' }}>Listen together, queue tracks, vote skip</Txt>
            </View>
            <Icon name={I.next} size={19} color="#fff" />
          </Pressable>

          {musicRooms.slice(0, 3).map((m) => (
            <Card key={m.id} onPress={() => onOpenMusicRoom && onOpenMusicRoom(m)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: sp.m }}>
              <View style={st.albumArt}><Icon name={I.musicOff} size={17} color={c.beam} /></View>
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

      <ActionSheet
        visible={!!menu} title={menu && menu.name} subtitle={menu && menu.players}
        actions={[
          { icon: I.playFill, label: 'Start a table', onPress: () => onStartGame && onStartGame(menu) },
          { icon: I.invite, label: 'Invite friends', onPress: () => {} },
          { icon: I.help, label: 'How to play', onPress: () => {} },
          { icon: I.trophy, label: 'Leaderboard', onPress: onOpenLeaderboard },
        ]}
        onClose={() => setMenu(null)}
      />
    </Screen>
  );
}

const st = StyleSheet.create({
  gameIcon: { width: 46, height: 46, borderRadius: r.md, alignItems: 'center', justifyContent: 'center' },
  musicHero: {
    flexDirection: 'row', alignItems: 'center', gap: sp.m,
    backgroundColor: c.beam, borderRadius: r.lg, padding: sp.l,
  },
  musicIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF2E',
    alignItems: 'center', justifyContent: 'center',
  },
  albumArt: {
    width: 44, height: 44, borderRadius: r.sm, backgroundColor: c.beamDim,
    alignItems: 'center', justifyContent: 'center',
  },
});
