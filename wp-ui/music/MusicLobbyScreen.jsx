// Music lobby — list of listening rooms + create.
import React, { useState, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Icon, { I } from '../ui/Icon';
import ActionSheet from '../ui/Sheet';
import { Avatar, Btn, Card, Chips, Empty, Header, Screen, Txt } from '../ui/kit';
import { c, r, sp } from '../ui/tokens';

const FILTERS = [{ id: 'all', name: 'All' }];

export default function MusicLobbyScreen({ rooms = [], onBack, onOpen, onCreate }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [menu, setMenu] = useState(null);

  const list = useMemo(() => {
    let result = rooms.filter((r0) => filter === 'all' || (r0.tags || []).includes(filter));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r0) => r0.title?.toLowerCase().includes(q) || r0.nowPlaying?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [rooms, filter, search]);

  return (
    <Screen>
      <Header title="Music lobby" subtitle="Listen together in sync" onBack={onBack} />

      {/* Search bar */}
      <View style={st.searchRow}>
        <Icon name="search-outline" size={16} color={c.dim} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search rooms…"
          placeholderTextColor={c.dim}
          style={st.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Icon name="close-circle" size={16} color={c.dim} />
          </Pressable>
        ) : null}
      </View>

      <Chips options={FILTERS} value={filter} onChange={setFilter} style={{ marginBottom: sp.m }} />

      {list.length === 0 ? (
        search ? (
          <Empty icon="search-outline" title="No results"
            sub={`No rooms matching "${search}"`}
            action="Clear search" onAction={() => setSearch('')} />
        ) : (
          <Empty icon={I.music} title="No listening rooms"
            sub="Start one and queue up YouTube tracks — everyone hears the same second."
            action="Start a music room" onAction={onCreate} />
        )
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
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: sp.s,
    marginHorizontal: sp.l, marginBottom: sp.m,
    backgroundColor: c.surface, borderRadius: r.md, borderWidth: 1, borderColor: c.border,
    paddingHorizontal: sp.m, paddingVertical: sp.s,
  },
  searchInput: { flex: 1, color: c.text, fontSize: 14, paddingVertical: 0 },
});
