// Achievements — full list with progress. Reads /progression + your own list.
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Icon, { I } from '../ui/Icon';
import { Card, Chips, Empty, Header, Screen, Txt } from '../ui/kit';
import { c, r, sp } from '../ui/tokens';

const FILTERS = [{ id: 'all', name: 'All' }, { id: 'unlocked', name: 'Unlocked' }, { id: 'locked', name: 'Locked' }];

export default function AchievementsScreen({ achievements = [], onBack }) {
  const [f, setF] = useState('all');
  const list = achievements.filter((a) =>
    f === 'all' || (f === 'unlocked' ? a.unlocked : !a.unlocked));
  const done = achievements.filter((a) => a.unlocked).length;

  return (
    <Screen>
      <Header title="Achievements" subtitle={`${done} of ${achievements.length} unlocked`} onBack={onBack} />
      <Chips options={FILTERS} value={f} onChange={setF} style={{ marginBottom: sp.m }} />
      {list.length === 0 ? (
        <Empty icon={I.trophy} title="Nothing here yet"
          sub="Host parties, keep your streak, and win games to unlock these." />
      ) : (
        <ScrollView contentContainerStyle={{ padding: sp.l, gap: sp.s, paddingBottom: 30 }}>
          {list.map((a) => (
            <Card key={a.id} style={{ flexDirection: 'row', gap: sp.m, opacity: a.unlocked ? 1 : 0.6 }}>
              <View style={[st.icon, { backgroundColor: a.unlocked ? c.beamDim : c.surface2 }]}>
                <Icon name={a.unlocked ? I.trophy : I.lock} size={19} color={a.unlocked ? c.beam : c.dim} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt s="h3">{a.name}</Txt>
                <Txt s="cap">{a.description}</Txt>
                {!a.unlocked && a.progress != null ? (
                  <>
                    <View style={st.track}>
                      <View style={[st.fill, { width: `${Math.min(100, (a.progress / a.goal) * 100)}%` }]} />
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

const st = StyleSheet.create({
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  track: { height: 5, borderRadius: 3, backgroundColor: c.surface2, marginTop: 7, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: c.beam },
});
