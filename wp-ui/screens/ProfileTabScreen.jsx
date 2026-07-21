// Profile — identity, not settings. Avatar hero + level + XP + stats +
// achievements. Account/sign-out live in Settings (gear, top right).
// Wraps the avatar package's live data; falls back gracefully if it's absent.
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Icon, { I } from '../ui/Icon';
import ActionSheet from '../ui/Sheet';
import { Avatar, Badge, Btn, Card, Header, IconBtn, Screen, SectionLabel, Txt } from '../ui/kit';
import { c, r, sp } from '../ui/tokens';

function XPBar({ into = 0, needed = 1 }) {
  const pct = Math.min(100, Math.round((into / Math.max(1, needed)) * 100));
  return (
    <View style={st.xpTrack}>
      <View style={[st.xpFill, { width: `${Math.max(2, pct)}%` }]} />
    </View>
  );
}

function Stat({ value, label, icon, onPress }) {
  return (
    <Pressable style={st.stat} onPress={onPress} disabled={!onPress}>
      {icon ? <Icon name={icon} size={15} color={c.beam} /> : null}
      <Txt s="num" style={{ marginTop: 3 }}>{value ?? '—'}</Txt>
      <Txt s="cap" numberOfLines={1}>{label}</Txt>
      {onPress ? (
        <View style={st.statArrow}>
          <Icon name="chevron-forward" size={10} color={c.dim} />
        </View>
      ) : null}
    </Pressable>
  );
}

export default function ProfileTabScreen({
  name = 'You', progression, stats, achievements = [], AvatarHero,
  onEditAvatar, onInventory, onShop, onSettings, onAchievements, onShare,
  onOpenFriends, onOpenRooms,
}) {
  const [menu, setMenu] = useState(false);
  const p = progression;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 34 }} showsVerticalScrollIndicator={false}>
        <Header title="Profile" large right={
          <View style={{ flexDirection: 'row', gap: sp.s }}>
            <IconBtn name={I.more} label="More" onPress={() => setMenu(true)} />
            <IconBtn name={I.settings} label="Settings" onPress={onSettings} />
          </View>
        } />

        {/* avatar hero — AvatarHero is the 3D <AvatarStage>; falls back to a snapshot */}
        <View style={{ paddingHorizontal: sp.l }}>
          <View style={st.hero}>
            {AvatarHero ? <AvatarHero /> : (
              <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <Icon name="person" size={40} color={c.dim} />
                <Txt s="cap" style={{ marginTop: 6 }}>Open the studio to build your avatar</Txt>
              </View>
            )}
            <Pressable onPress={onEditAvatar} style={st.editFab}>
              <Icon name={I.edit} size={16} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* identity */}
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

        {/* actions */}
        <View style={{ flexDirection: 'row', gap: sp.s, paddingHorizontal: sp.l, marginTop: sp.l }}>
          <Btn title="Edit avatar" icon={I.edit} onPress={onEditAvatar} style={{ flex: 1 }} />
          <Btn title="Inventory" variant="secondary" onPress={onInventory} style={{ flex: 1 }} />
          <Btn title="Shop" variant="secondary" onPress={onShop} style={{ flex: 1 }} />
        </View>

        {/* stats */}
        <SectionLabel>STATS</SectionLabel>
        <View style={st.statGrid}>
          <Stat icon="play-circle-outline" value={stats && stats.watchSessions} label="Watch sessions" onPress={onOpenRooms} />
          <Stat icon={I.rooms} value={stats && stats.roomsJoined} label="Rooms joined" onPress={onOpenRooms} />
          <Stat icon="radio-outline" value={stats && stats.roomsHosted} label="Hosted" onPress={onOpenRooms} />
          <Stat icon={I.people} value={stats && stats.friends} label="Friends" onPress={onOpenFriends} />
          <Stat icon={I.fire} value={stats && stats.longestStreak} label="Best streak" />
          <Stat icon={I.invite} value={stats && stats.invitesAccepted} label="Invites" />
        </View>

        {/* achievements */}
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
                <View style={[st.trophy, { backgroundColor: a.unlocked ? c.beamDim : c.surface2 }]}>
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
          { icon: I.share, label: 'Share my profile', onPress: onShare },
          { icon: I.copy, label: 'Copy profile link', onPress: () => {} },
          { icon: I.trophy, label: 'All achievements', onPress: onAchievements },
          { icon: I.settings, label: 'Settings', onPress: onSettings },
        ]}
        onClose={() => setMenu(false)} />
    </Screen>
  );
}

const st = StyleSheet.create({
  hero: {
    height: 300, borderRadius: r.lg, backgroundColor: c.surface,
    borderWidth: 1, borderColor: c.border, overflow: 'hidden',
  },
  editFab: {
    position: 'absolute', right: sp.m, bottom: sp.m,
    width: 38, height: 38, borderRadius: 19, backgroundColor: c.beam,
    alignItems: 'center', justifyContent: 'center',
  },
  xpTrack: {
    height: 10, borderRadius: 5, backgroundColor: c.surface2,
    overflow: 'hidden', marginTop: sp.m, marginBottom: 5,
  },
  xpFill: { height: '100%', backgroundColor: c.beam, borderRadius: 5 },
  statGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: sp.s, paddingHorizontal: sp.l,
  },
  stat: {
    width: '31.6%', backgroundColor: c.surface, borderRadius: r.md,
    borderWidth: 1, borderColor: c.border, alignItems: 'center', paddingVertical: sp.m,
    position: 'relative',
  },
  statArrow: {
    position: 'absolute', bottom: 4, right: 6, opacity: 0.4,
  },
  trophy: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
