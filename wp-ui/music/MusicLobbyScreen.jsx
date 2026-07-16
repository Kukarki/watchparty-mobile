// Music lobby — list of listening rooms + create.
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Icon, { I } from '../ui/Icon';
import ActionSheet from '../ui/Sheet';
import { Avatar, Btn, Card, Chips, Empty, Header, Screen, Txt } from '../ui/kit';
import { c, r, sp } from '../ui/tokens';

const FILTERS = [{ id: 'all', name: 'All' }, { id: 'friends', name: 'Friends' }, { id: 'mine', name: 'Mine' }];

export default function MusicLobbyScreen({ rooms = [], onBack, onOpen, onCreate }) {
  const [filter, setFilter] = useState('all');
  const [menu, setMenu] = useState(null);
  const list = rooms.filter((r0) => filter === 'all' || (r0.tags || []).includes(filter));

  return (
    <Screen>
      <Header title="Music lobby" subtitle="Listen together in sync" onBack={onBack} />
      <Chips options={FILTERS} value={filter} onChange={setFilter} style={{ marginBottom: sp.m }} />

      {list.length === 0 ? (
        <Empty icon={I.music} title="No listening rooms" 
          sub="Start one and queue up YouTube tracks — everyone hears the same second."
          action="Start a music room" onAction={onCreate} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: sp.l, gap: sp.m, paddingBottom: 90 }}>
          {list.map((m) => (
            <Card key={m.id} onPress={() => onOpen && onOpen(m)}>
              <View style={{ flexDirection: 'row', gap: sp.m }}>
                <View style={st.art}>
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

      <View style={st.fabWrap}>
        <Btn title="Start a music room" icon={I.add} onPress={onCreate} size="lg" />
      </View>

      <ActionSheet visible={!!menu} title={menu && menu.title}
        actions={[
          { icon: I.share, label: 'Share', onPress: () => {} },
          { icon: I.copy, label: 'Copy code', onPress: () => {} },
          { icon: I.report, label: 'Report', danger: true, onPress: () => {} },
        ]}
        onClose={() => setMenu(null)} />
    </Screen>
  );
}

const st = StyleSheet.create({
  art: { width: 52, height: 52, borderRadius: r.sm, backgroundColor: c.beamDim, alignItems: 'center', justifyContent: 'center' },
  fabWrap: { position: 'absolute', left: sp.l, right: sp.l, bottom: 24 },
});
