// Leaderboard — friends vs global, by XP or game wins.
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { I } from '../ui/Icon';
import { Avatar, Badge, Card, Chips, Empty, Header, Screen, Txt } from '../ui/kit';
import { c, r, sp } from '../ui/tokens';

export default function LeaderboardScreen({ rows = [], meId, onBack, onOpenPerson }) {
  const [scope, setScope] = useState('friends');
  const [metric, setMetric] = useState('xp');
  const list = rows.filter((r0) => scope === 'global' || r0.isFriend || r0.id === meId);

  const medal = (i) => ['#FFD666', '#C8CEDB', '#D08B5B'][i];

  return (
    <Screen>
      <Header title="Leaderboard" onBack={onBack} />
      <Chips options={[{ id: 'friends', name: 'Friends' }, { id: 'global', name: 'Global' }]}
        value={scope} onChange={setScope} />
      <Chips options={[{ id: 'xp', name: 'By level' }, { id: 'wins', name: 'Game wins' }, { id: 'streak', name: 'Streak' }]}
        value={metric} onChange={setMetric} style={{ marginTop: sp.s, marginBottom: sp.m }} />

      {list.length === 0 ? (
        <Empty icon={I.trophy} title="No one to rank yet" sub="Add friends to see how you stack up." />
      ) : (
        <ScrollView contentContainerStyle={{ padding: sp.l, gap: sp.s, paddingBottom: 30 }}>
          {list.map((p, i) => (
            <Card key={p.id} onPress={() => onOpenPerson && onOpenPerson(p)}
              style={[{ flexDirection: 'row', alignItems: 'center', gap: sp.m },
                p.id === meId && { borderColor: c.beam, backgroundColor: c.beamDim }]}>
              <View style={[st.rank, i < 3 && { backgroundColor: medal(i) + '22' }]}>
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

const st = StyleSheet.create({
  rank: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: c.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
});
