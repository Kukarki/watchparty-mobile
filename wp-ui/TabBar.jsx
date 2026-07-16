// Custom tab bar — 4 tabs, single accent, filled icon when active.
// With expo-router: <Tabs tabBar={(props) => <TabBar {...props} />} ... />
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon, { I } from './ui/Icon';
import { Txt } from './ui/kit';
import { c, sp } from './ui/tokens';

export const TABS = [
  { name: 'index',   label: 'Home',    on: I.home,    off: I.homeOff },
  { name: 'rooms',   label: 'Rooms',   on: I.rooms,   off: I.roomsOff },
  { name: 'play',    label: 'Play',    on: I.play,    off: I.playOff },
  { name: 'profile', label: 'Profile', on: I.profile, off: I.profileOff },
];

export default function TabBar({ state, navigation }) {
  return (
    <View style={st.bar}>
      {state.routes.map((route, i) => {
        const meta = TABS.find((t) => t.name === route.name);
        if (!meta) return null;
        const focused = state.index === i;
        return (
          <Pressable key={route.key} style={st.tab}
            onPress={() => {
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
            }}>
            <Icon name={focused ? meta.on : meta.off} size={23} color={focused ? c.beam : c.dim} />
            <Txt style={{ fontSize: 10.5, fontWeight: focused ? '700' : '500',
              color: focused ? c.beam : c.dim, marginTop: 3 }}>{meta.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  bar: {
    flexDirection: 'row', backgroundColor: c.ink,
    borderTopWidth: 1, borderTopColor: c.border,
    paddingTop: sp.s, paddingBottom: 26,
  },
  tab: { flex: 1, alignItems: 'center' },
});
