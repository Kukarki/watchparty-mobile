# YouTubePicker — full YouTube inside your app (Hearo-style)

```
npx expo install react-native-webview
```
Copy `YouTubePicker.jsx` into your app. No other dependencies.

## How it works

The user gets **real YouTube** in a WebView: search, browse, channels, feed,
Shorts — and they can sign in, which persists in your app's own cookie jar
(so subscriptions/history show up on later visits).

Every navigation passes through `onShouldStartLoadWithRequest`. Anything that
isn't a video page loads normally. The moment the URL is a watch page, we
**cancel the navigation** and show your own sheet instead:

```
search "pmpl"  -> loads (it's just a search page)
tap a channel  -> loads
sign in        -> loads
tap a video    -> INTERCEPTED -> "Create a watch party / Watch alone"
```

So YouTube never plays inside its own page — your app always gets the video id
first and decides what happens.

## Usage

```jsx
import YouTubePicker from './YouTubePicker';

const [showPicker, setShowPicker] = useState(false);

// Home: the YouTube platform tile
<Pressable onPress={() => setShowPicker(true)}>…</Pressable>

<YouTubePicker
  visible={showPicker}
  onClose={() => setShowPicker(false)}
  roomExists={!!currentRoomId}     // shows "Play in this room" + "Add to queue"
  onPick={async ({ videoId, url, title, author, mode }) => {
    if (mode === 'room') {
      const room = currentRoomId
        ? currentRoomId
        : await createRoom({ title: title || 'Watch party', videoId });
      playInRoom(room, videoId);          // your existing sync layer
      router.push(`/room/${room}`);
    } else if (mode === 'queue') {
      addToQueue(currentRoomId, { videoId, title });
    } else {
      router.push({ pathname: '/watch', params: { videoId } });
    }
  }}
/>
```

`onPick` gives you `{ videoId, url, title, author, mode }` where mode is
`'room' | 'queue' | 'alone'`.

## Playing it afterwards

Use the YouTube IFrame API (via `react-native-youtube-iframe` or a WebView) —
it exposes play/pause/seek/getCurrentTime, which is all your sync layer needs:

```
npx expo install react-native-youtube-iframe
```
```jsx
<YoutubePlayer height={220} play={playing} videoId={videoId}
  onChangeState={(s) => s === 'playing' && syncSeek(playerRef)} />
```

## Notes

- **Only YouTube works this way.** Netflix/Prime/Disney are DRM (Widevine) and
  cannot play in a third-party app — that's why Teleparty is a browser
  extension. For those, run "sync mode": everyone opens the app themselves,
  your room keeps the timer, chat, avatars, and reactions.
- **Cookies are per-app.** You cannot read the user's Chrome session (OS
  sandbox). Signing in inside this picker is what gives them their feed.
- `parseYouTubeId` is unit-tested against 19 URL shapes: `/watch?v=`,
  `youtu.be`, `/shorts/`, `/live/`, `/embed/`, plus search, channel, playlist,
  feed, and Google sign-in URLs that must NOT trigger the sheet.
- `setSupportMultipleWindows={false}` keeps `target=_blank` links from opening
  the system browser and escaping the picker.
