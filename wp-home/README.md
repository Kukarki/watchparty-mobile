# HubHome + 5-tab bar

The Home you picked (**F · Hub**) that **grows into D · Live Grid** on its own:

- **Quiet** → resume card + four big widgets + your level. Never looks empty.
- **2+ live things** → a `LIVE NOW` grid appears above the widgets, with the
  biggest room as a wide tile. Same screen, no mode switch.

Bottom bar: **Home · Rooms · Games · Music · You**, with a red count badge on
Games (and any other tab) when something's running.

No new dependencies — icons are `@expo/vector-icons`, gradients are faked with
stacked views (swap in `expo-linear-gradient` if you already have it).

## Wire it up

```jsx
// app/(app)/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import TabBar5 from '../../../wp-home/TabBar5';

export default function Layout() {
  const liveGames = useLiveGameCount();   // however you track it
  return (
    <Tabs screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar5 {...props} badges={{ games: liveGames }} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="rooms" />
      <Tabs.Screen name="games" />
      <Tabs.Screen name="music" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
```

```jsx
// app/(app)/(tabs)/index.tsx
import HubHome from '../../../wp-home/HubHome';

<HubHome
  name={user.name}
  avatarUrl={card?.snapshots?.head}
  progression={progression}              // from useAvatarStore()
  resume={lastRoom && {
    title: lastRoom.title, subtitle: 'with Sita, Ram',
    progressPct: 62, members: lastRoom.members, live: lastRoom.live,
  }}
  live={liveItems}                       // see shape below
  friendsOnline={friends.filter(f => f.online)}
  challenge={{ title: 'Daily challenge', sub: 'Host a room · +100 XP' }}
  onHost={() => setShowYouTubePicker(true)}
  onResume={(r) => router.push(`/room/${r.id}`)}
  onOpenLive={(item) => router.push(
    item.kind === 'music' ? `/music/${item.id}`
    : item.kind === 'game' ? `/game/${item.id}`
    : `/room/${item.id}`)}
  onOpenGames={() => router.push('/games')}
  onOpenMusic={() => router.push('/music')}
  onOpenFriends={() => router.push('/friends')}
  onOpenRooms={() => router.push('/rooms')}
  onOpenProfile={() => router.push('/profile')}
  onOpenSettings={() => router.push('/settings')}
  onRefresh={reload}
  refreshing={loading}
/>
```

`live` items — one array, three kinds, sorted by whatever you want surfaced:

```js
[
  { id:'r1', kind:'watch', title:'PMPL Thailand Fall', subtitle:"Hari's room",
    count:6, members:[{name:'Hari',avatarUrl},{name:'Sita'}] },
  { id:'m1', kind:'music', title:'Lofi room', subtitle:'Sita queued 4 tracks', count:4 },
  { id:'g1', kind:'game',  title:'WildBeam',  subtitle:'2 waiting', count:2 },
]
```

Tiles color themselves by `kind` — no artwork needed.

## Behaviour worth knowing

- Grid appears at **2+** live items (one reads as noise, two reads as a scene).
- With exactly 2, a dashed **"Start one"** tile fills the third slot.
- Widgets show live counts in their subtitle and a badge: Games "3", Friends "LIVE".
- No `resume` → the hero becomes **"Host a watch party"**, so first-run isn't blank.
- Everything is props. No fetching inside the screen.
