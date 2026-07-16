// Rooms tab — my rooms / discover / join by code.
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Icon, { I } from '../ui/Icon';
import ActionSheet from '../ui/Sheet';
import {
  Avatar, Btn, Card, Chips, Empty, Header, IconBtn, LiveDot, Screen, Txt,
} from '../ui/kit';
import { c, r, sp } from '../ui/tokens';

const TABS = [
  { id: 'mine', name: 'My rooms' },
  { id: 'discover', name: 'Discover' },
  { id: 'code', name: 'Join by code' },
];

export default function RoomsScreen({
  myRooms = [], discover = [], onOpenRoom, onCreate, onJoinCode, onOpenSettings,
}) {
  const [tab, setTab] = useState('mine');
  const [code, setCode] = useState('');
  const [menu, setMenu] = useState(null);

  const list = tab === 'mine' ? myRooms : discover;

  return (
    <Screen>
      <Header title="Rooms" large right={<IconBtn name={I.add} label="Create room" onPress={onCreate} />} />
      <Chips options={TABS} value={tab} onChange={setTab} style={{ marginBottom: sp.m }} />

      {tab === 'code' ? (
        <View style={{ padding: sp.l, gap: sp.m }}>
          <Card style={{ padding: sp.l, gap: sp.m }}>
            <Txt s="label">ENTER INVITE CODE</Txt>
            <TextInput
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase().slice(0, 8))}
              placeholder="ABCD-1234"
              placeholderTextColor={c.dim}
              autoCapitalize="characters"
              style={st.codeInput}
            />
            <Btn title="Join room" disabled={code.length < 4}
              onPress={() => onJoinCode && onJoinCode(code)} />
          </Card>
          <Card onPress={() => {}} style={{ flexDirection: 'row', alignItems: 'center', gap: sp.m }}>
            <Icon name={I.qr} size={20} color={c.beam} />
            <Txt style={{ flex: 1 }}>Scan a QR code</Txt>
            <Icon name={I.next} size={17} color={c.dim} />
          </Card>
        </View>
      ) : list.length === 0 ? (
        <Empty
          icon={tab === 'mine' ? I.rooms : I.compass}
          title={tab === 'mine' ? 'No rooms yet' : 'Nothing public right now'}
          sub={tab === 'mine'
            ? 'Create a room and invite friends to watch together in sync.'
            : 'Public rooms show up here when people open them to everyone.'}
          action={tab === 'mine' ? 'Create room' : undefined}
          onAction={onCreate}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: sp.l, gap: sp.m, paddingBottom: 30 }}>
          {list.map((room) => (
            <Card key={room.id} onPress={() => onOpenRoom && onOpenRoom(room)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: sp.m }}>
                <View style={st.poster}>
                  <Icon name={room.live ? 'radio' : 'tv-outline'} size={18} color={c.beam} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: sp.s }}>
                    <Txt s="h3" numberOfLines={1} style={{ flex: 1 }}>{room.title}</Txt>
                    {room.live ? <LiveDot /> : null}
                  </View>
                  <Txt s="cap" numberOfLines={1}>
                    {room.nowPlaying || 'Lounge'} · {room.count || 0} {room.count === 1 ? 'person' : 'people'}
                  </Txt>
                  <View style={{ flexDirection: 'row', marginTop: sp.s, alignItems: 'center' }}>
                    {(room.members || []).slice(0, 5).map((m, i) => (
                      <View key={i} style={{ marginLeft: i ? -8 : 0 }}>
                        <Avatar url={m.avatarUrl} name={m.name} size={22} />
                      </View>
                    ))}
                    {room.hostName ? (
                      <Txt s="cap" style={{ marginLeft: sp.s }}>Host: {room.hostName}</Txt>
                    ) : null}
                  </View>
                </View>
                <Pressable hitSlop={10} onPress={() => setMenu(room)}>
                  <Icon name={I.more} size={19} color={c.dim} />
                </Pressable>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}

      <ActionSheet
        visible={!!menu}
        title={menu && menu.title}
        subtitle={menu && menu.hostName ? `Host: ${menu.hostName}` : undefined}
        actions={[
          { icon: I.share, label: 'Share room', onPress: () => {} },
          { icon: I.copy, label: 'Copy invite code', onPress: () => {} },
          ...(menu && menu.isHost ? [
            { icon: I.edit, label: 'Rename room', onPress: () => {} },
            { icon: I.lock, label: 'Room settings', onPress: () => {} },
          ] : []),
          { icon: I.leave, label: 'Leave room', danger: true, onPress: () => {} },
          { icon: I.report, label: 'Report', danger: true, onPress: () => {} },
        ]}
        onClose={() => setMenu(null)}
      />
    </Screen>
  );
}

const st = StyleSheet.create({
  poster: {
    width: 52, height: 52, borderRadius: r.sm, backgroundColor: c.beamDim,
    alignItems: 'center', justifyContent: 'center',
  },
  codeInput: {
    backgroundColor: c.ink, borderWidth: 1, borderColor: c.border, borderRadius: r.md,
    paddingHorizontal: sp.m, paddingVertical: 14, color: c.text,
    fontSize: 19, fontWeight: '700', letterSpacing: 3, textAlign: 'center',
  },
});
