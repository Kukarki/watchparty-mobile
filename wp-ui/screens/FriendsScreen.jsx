// Friends — list / requests / add, with per-person three-dot actions.
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Icon, { I } from '../ui/Icon';
import ActionSheet from '../ui/Sheet';
import { Avatar, Badge, Btn, Card, Chips, Empty, Header, IconBtn, Screen, Txt } from '../ui/kit';
import { c, r, sp } from '../ui/tokens';

export default function FriendsScreen({
  friends = [], requests = [], searchResults = [],
  onSearch, onAccept, onDecline, onAdd, onOpenPerson, onInvite, onGift, onMessage, onBlock,
}) {
  const [tab, setTab] = useState('friends');
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(null);

  const TABS = [
    { id: 'friends', name: `Friends${friends.length ? ` · ${friends.length}` : ''}` },
    { id: 'requests', name: `Requests${requests.length ? ` · ${requests.length}` : ''}` },
    { id: 'add', name: 'Add' },
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
        <Txt s="cap" numberOfLines={1}>
          {p.status || (p.online ? 'Online' : 'Offline')}
        </Txt>
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
      <Chips options={TABS} value={tab} onChange={setTab} style={{ marginBottom: sp.m }} />

      {tab === 'add' ? (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: sp.l, flexDirection: 'row', gap: sp.s }}>
            <View style={st.searchWrap}>
              <Icon name={I.search} size={17} color={c.dim} />
              <TextInput value={q} onChangeText={(v) => { setQ(v); onSearch && onSearch(v); }}
                placeholder="Search by name or email" placeholderTextColor={c.dim}
                autoCapitalize="none" style={st.searchInput} />
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
                  <IconBtn name={I.close} dim label="Decline" onPress={() => onDecline && onDecline(p)} />
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
          { icon: I.profile, label: 'View profile', onPress: () => onOpenPerson && onOpenPerson(menu) },
          { icon: I.message, label: 'Message', onPress: () => onMessage && onMessage(menu) },
          { icon: I.invite, label: 'Invite to room', onPress: () => onInvite && onInvite(menu) },
          { icon: I.gift, label: 'Send a gift', onPress: () => onGift && onGift(menu) },
          { icon: I.block, label: 'Block', danger: true, onPress: () => onBlock && onBlock(menu) },
          { icon: I.report, label: 'Report', danger: true, onPress: () => {} },
        ]}
        onClose={() => setMenu(null)} />
    </Screen>
  );
}

const st = StyleSheet.create({
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: sp.s,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
    borderRadius: r.md, paddingHorizontal: sp.m,
  },
  searchInput: { flex: 1, paddingVertical: 11, color: c.text, fontSize: 14 },
});
