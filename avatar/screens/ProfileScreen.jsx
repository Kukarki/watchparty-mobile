// Profile: 3D avatar hero, level + title + animated XP bar, verified stats
// grid, wallet, entry points to Studio and Inventory (design doc §3).
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import AvatarStage from '../three/AvatarStage';
import { useAvatarStore } from '../store';
import { AvatarApi } from '../api';
import { Txt, XPBar } from '../components';
import { colors, radius } from '../theme';

function StatCell({ value, label }) {
  return (
    <View style={st.statCell}>
      <Txt s="h1" style={{ color: colors.beamHot }}>{value ?? '—'}</Txt>
      <Txt s="dim" style={{ fontSize: 11 }}>{label}</Txt>
    </View>
  );
}

export default function ProfileScreen({ name = 'You', onEditAvatar, onOpenInventory }) {
  const { draft, saved, catalogIndex, progression, init, refreshProgression } = useAvatarStore();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    init();
    refreshProgression();
    AvatarApi.stats().then(setStats).catch(() => {});
  }, []);

  const recipe = saved || draft;
  const p = progression;

  return (
    <ScrollView style={st.root} contentContainerStyle={{ paddingBottom: 40 }}>
      {recipe ? (
        <AvatarStage recipe={recipe} catalogIndex={catalogIndex} framing="full" style={st.stage} />
      ) : (
        <View style={[st.stage, { alignItems: 'center', justifyContent: 'center' }]}>
          <Txt s="dim">Loading…</Txt>
        </View>
      )}

      <View style={st.identity}>
        <Txt s="display">{name}</Txt>
        {p && (
          <>
            <View style={st.levelRow}>
              <View style={st.levelBadge}>
                <Txt style={{ fontWeight: '800', color: '#fff' }}>Lv {p.level}</Txt>
              </View>
              <Txt s="h2" style={{ color: colors.beamHot }}>{p.title}</Txt>
            </View>
            <XPBar into={p.into} needed={p.needed} style={{ marginTop: 10 }} />
            <Txt s="mono" style={{ marginTop: 4 }}>
              {p.into.toLocaleString()} / {p.needed.toLocaleString()} XP to Level {p.level + 1}
            </Txt>
            {p.wallet && (
              <Txt s="dim" style={{ marginTop: 6 }}>
                🪙 {Number(p.wallet.coins).toLocaleString()} coins
                {'   '}💎 {Number(p.wallet.gems).toLocaleString()} gems
              </Txt>
            )}
          </>
        )}
      </View>

      <View style={st.actions}>
        <Pressable style={st.primaryBtn} onPress={onEditAvatar}>
          <Txt style={{ color: '#fff', fontWeight: '700' }}>Edit Avatar</Txt>
        </Pressable>
        <Pressable style={st.secondaryBtn} onPress={onOpenInventory}>
          <Txt s="h2">Inventory</Txt>
        </Pressable>
      </View>

      <Txt s="dim" style={st.sectionLabel}>STATS</Txt>
      <View style={st.statsGrid}>
        <StatCell value={stats && stats.watchSessions} label="Watch sessions" />
        <StatCell value={stats && stats.roomsJoined} label="Rooms joined" />
        <StatCell value={stats && stats.roomsHosted} label="Rooms hosted" />
        <StatCell value={stats && stats.friends} label="Friends" />
        <StatCell value={stats && stats.streak && `${stats.streak}🔥`} label="Login streak" />
        <StatCell value={stats && stats.invitesAccepted} label="Invites" />
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  stage: { height: 340, margin: 14, marginTop: 60, borderRadius: radius.lg },
  identity: { paddingHorizontal: 20 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  levelBadge: {
    backgroundColor: colors.beam, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: radius.pill,
  },
  actions: { flexDirection: 'row', gap: 10, padding: 20 },
  primaryBtn: {
    flex: 1, backgroundColor: colors.beam, alignItems: 'center',
    paddingVertical: 14, borderRadius: radius.md,
  },
  secondaryBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.inkRaised,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginLeft: 20, marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 14,
  },
  statCell: {
    width: '31%', backgroundColor: colors.inkRaised, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
    paddingVertical: 14, gap: 2,
  },
});
