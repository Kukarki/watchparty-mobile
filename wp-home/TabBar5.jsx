// 5-tab bar with live badges. Games shows a red count when tables are running.
//
//   <Tabs tabBar={(props) => <TabBar5 {...props} badges={{ games: 2, music: 4 }} />}
//         screenOptions={{ headerShown: false }}>
//     <Tabs.Screen name="index" /> <Tabs.Screen name="rooms" />
//     <Tabs.Screen name="games" /> <Tabs.Screen name="music" />
//     <Tabs.Screen name="profile" />
//   </Tabs>
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const c = {
  ink: '#0B0D14', surface: '#141826', border: '#232A3F',
  beam: '#8B7CFF', dim: '#6F7894', live: '#FF4D6D',
};

export const TAB_META = [
  { name: 'index',   label: 'Home',  on: 'home',              off: 'home-outline' },
  { name: 'rooms',   label: 'Rooms', on: 'tv',                off: 'tv-outline' },
  { name: 'games',   label: 'Games', on: 'game-controller',   off: 'game-controller-outline' },
  { name: 'music',   label: 'Music', on: 'musical-notes',     off: 'musical-notes-outline' },
  { name: 'profile', label: 'You',   on: 'person-circle',     off: 'person-circle-outline' },
];

function Tab({ meta, focused, badge, onPress }) {
  const lift = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(lift, { toValue: focused ? 1 : 0, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
  }, [focused, lift]);

  return (
    <Pressable onPress={onPress} style={st.tab} hitSlop={6}>
      <Animated.View style={{ transform: [{ translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }] }}>
        <View>
          <Ionicons name={focused ? meta.on : meta.off} size={23} color={focused ? c.beam : c.dim} />
          {badge ? (
            <View style={st.badge}>
              <Text style={st.badgeTxt}>{badge > 9 ? '9+' : badge}</Text>
            </View>
          ) : null}
        </View>
      </Animated.View>
      <Text style={[st.label, focused && { color: c.beam, fontWeight: '700' }]}>{meta.label}</Text>
      <Animated.View style={[st.pip, { opacity: lift, transform: [{ scale: lift }] }]} />
    </Pressable>
  );
}

export default function TabBar5({ state, navigation, badges = {} }) {
  return (
    <View style={st.bar}>
      {state.routes.map((route, i) => {
        const meta = TAB_META.find((t) => t.name === route.name);
        if (!meta) return null;
        const focused = state.index === i;
        return (
          <Tab key={route.key} meta={meta} focused={focused} badge={badges[meta.name]}
            onPress={() => {
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
            }} />
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  bar: {
    flexDirection: 'row', backgroundColor: c.ink,
    borderTopWidth: 1, borderTopColor: c.border,
    paddingTop: 9, paddingBottom: Platform.OS === 'ios' ? 26 : 12,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontSize: 10, color: c.dim, fontWeight: '500' },
  badge: {
    position: 'absolute', top: -5, right: -9, minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: c.live, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, borderWidth: 1.5, borderColor: c.ink,
  },
  badgeTxt: { color: '#fff', fontSize: 8.5, fontWeight: '800' },
  pip: { position: 'absolute', top: -9, width: 16, height: 2.5, borderRadius: 2, backgroundColor: c.beam },
});
