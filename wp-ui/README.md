# WatchParty UI — production screen set

15 screens, one design system, wired for the avatar/XP/games backend you
already installed. Drop-in: copy `wp-ui/` into your app source (e.g.
`mobile/wp-ui/`) and point your routes at it.

**No new dependencies.** Icons use `@expo/vector-icons` (ships with Expo).

## Design rules this enforces

- **One accent.** Beam violet `#8B7CFF` for every primary action and active
  state. Brand colors (Netflix red, YouTube red…) appear ONLY on platform
  tiles — that's the whole point of `PLATFORMS` in `ui/tokens.js`.
- **No emoji in chrome.** Emoji are content (reactions), not icons.
  Everything else uses one icon set via `ui/Icon.jsx`.
- **Profile is identity, Settings is plumbing.** User IDs, sign out, delete
  account live in Settings → Account, never on the profile page.
- **Three dots everywhere.** One `<ActionSheet>` powers room, person, track,
  and message menus so they all behave identically.

## Screens

```
Tabs            HomeScreen · RoomsScreen · PlayScreen · ProfileTabScreen
Social          FriendsScreen
Room            RoomScreen (mode="lounge" | "watching")
Music           MusicLobbyScreen → MusicRoomScreen
Progress        AchievementsScreen · LeaderboardScreen
Settings stack  SettingsScreen → AccountScreen, NotificationsScreen,
                PrivacyScreen, PlaybackScreen, AppearanceScreen,
                StorageScreen, HelpScreen, AboutScreen
```

## Routing (expo-router)

```
app/(app)/
  (tabs)/_layout.tsx      <Tabs tabBar={p => <TabBar {...p} />} screenOptions={{headerShown:false}}>
  (tabs)/index.tsx        HomeScreen
  (tabs)/rooms.tsx        RoomsScreen
  (tabs)/play.tsx         PlayScreen
  (tabs)/profile.tsx      ProfileTabScreen      <-- fixes the missing XP
  friends.tsx             FriendsScreen
  room/[id].tsx           RoomScreen            (fullscreen modal)
  game/[sessionId].tsx    WildBeam/MatchBlitz   (fullscreen modal, from the games package)
  music/index.tsx         MusicLobbyScreen
  music/[id].tsx          MusicRoomScreen
  achievements.tsx        AchievementsScreen
  leaderboard.tsx         LeaderboardScreen
  settings/index.tsx      SettingsScreen
  settings/account.tsx    AccountScreen
  settings/[...].tsx      the Prefs screens
  avatar-studio.tsx       StudioScreen    (avatar package)
  avatar-inventory.tsx    InventoryScreen (avatar package)
  avatar-shop.tsx         ShopScreen      (avatar package)
```

## Wiring Profile to real XP (the current bug)

`ProfileTabScreen` is presentational — feed it live data:

```jsx
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { ProfileTabScreen } from '../../../wp-ui';
import { AvatarApi, useAvatarStore, AvatarStage } from '../../../avatar';

export default function Profile() {
  const { saved, catalogIndex, progression, init, refreshProgression } = useAvatarStore();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    init(); refreshProgression();
    AvatarApi.stats().then(setStats).catch(() => {});
  }, []);

  return (
    <ProfileTabScreen
      name={user.name}
      progression={progression}          // { level, into, needed, title, wallet, streak }
      stats={stats}
      AvatarHero={saved ? () => (
        <AvatarStage recipe={saved} catalogIndex={catalogIndex} framing="full" />
      ) : null}
      onEditAvatar={() => router.push('/avatar-studio')}
      onInventory={() => router.push('/avatar-inventory')}
      onShop={() => router.push('/avatar-shop')}
      onSettings={() => router.push('/settings')}
      onAchievements={() => router.push('/achievements')}
    />
  );
}
```

If `AvatarHero` is omitted the screen still works — it shows a prompt to open
the studio instead of the 3D stage. Everything else (level, XP bar, stats)
renders from `progression` / `stats`.

## Music room

`MusicRoomScreen` is UI + controls only; playback is your existing YouTube
sync layer. Feed it `nowPlaying` (`{ title, addedBy, elapsed, duration,
progressPct }`), `queue`, `listeners`, and handle `onAddTrack(url)`,
`onTogglePlay`, `onSkip`, `onVoteSkip`. Host-only controls are handled for
you via the `isHost` prop.

## Room screen

```jsx
<RoomScreen
  mode={playing ? 'watching' : 'lounge'}
  isHost={room.hostId === user.id}
  members={members}          // [{ id, name, avatarUrl, isHost, frameColor }]
  messages={messages}        // [{ id, senderName, text, level }]
  VideoPlayer={() => <YourExistingPlayer />}
  queueVote={votes}
  onSend={sendMessage} onReact={sendReaction}
  onStartWatching={startPlayback} onOpenGames={() => setShowPicker(true)}
/>
```
Pass member avatars from `AvatarApi.card(userId).snapshots.head` so the seat
bar and chat show real avatars.

## Customizing

All color/spacing/type lives in `ui/tokens.js`. Change `c.beam` and the whole
app re-themes. Add an icon by adding one line to `I` in `ui/Icon.jsx`.
