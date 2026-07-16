// The simple preference pages: notifications, privacy, playback, appearance,
// storage, help, about. All share one Toggle/Group pattern.
import React, { useState } from 'react';
import { Linking, ScrollView, Switch, View } from 'react-native';
import { I } from '../../ui/Icon';
import { Btn, Card, Chips, Header, Row, Screen, SectionLabel, Txt } from '../../ui/kit';
import { c, sp } from '../../ui/tokens';

const Group = ({ children }) => (
  <View style={{ marginHorizontal: sp.l, backgroundColor: c.surface, borderRadius: 14,
    borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>{children}</View>
);

const Toggle = ({ value, onChange }) => (
  <Switch value={value} onValueChange={onChange}
    trackColor={{ true: c.beam, false: c.surface2 }} thumbColor="#fff" />
);

// ---------------------------------------------------------------- notifications
export function NotificationsScreen({ prefs = {}, onChange, onBack }) {
  const [s, setS] = useState({
    roomInvites: true, friendRequests: true, friendLive: true,
    gameTurn: true, gifts: true, levelUp: true, streak: true, marketing: false,
    ...prefs,
  });
  const set = (k) => (v) => { const next = { ...s, [k]: v }; setS(next); onChange && onChange(next); };

  return (
    <Screen>
      <Header title="Notifications" onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionLabel>SOCIAL</SectionLabel>
        <Group>
          <Row icon={I.invite} title="Room invites" right={<Toggle value={s.roomInvites} onChange={set('roomInvites')} />} />
          <Row icon={I.people} title="Friend requests" right={<Toggle value={s.friendRequests} onChange={set('friendRequests')} />} />
          <Row icon="radio-outline" title="Friend starts watching" right={<Toggle value={s.friendLive} onChange={set('friendLive')} />} last />
        </Group>

        <SectionLabel>PLAY</SectionLabel>
        <Group>
          <Row icon={I.cards} title="Your turn in a game" right={<Toggle value={s.gameTurn} onChange={set('gameTurn')} />} />
          <Row icon={I.gift} title="Gifts received" right={<Toggle value={s.gifts} onChange={set('gifts')} />} last />
        </Group>

        <SectionLabel>PROGRESS</SectionLabel>
        <Group>
          <Row icon={I.trophy} title="Level ups & rewards" right={<Toggle value={s.levelUp} onChange={set('levelUp')} />} />
          <Row icon={I.fire} title="Streak reminders" sub="One a day, before your streak expires"
            right={<Toggle value={s.streak} onChange={set('streak')} />} />
          <Row icon="megaphone-outline" title="News & offers" right={<Toggle value={s.marketing} onChange={set('marketing')} />} last />
        </Group>
      </ScrollView>
    </Screen>
  );
}

// ---------------------------------------------------------------- privacy
export function PrivacyScreen({ prefs = {}, blockedCount = 0, onChange, onBack, onBlocked }) {
  const [s, setS] = useState({
    whoCanInvite: 'friends', showActivity: true, showLevel: true,
    discoverable: true, readReceipts: true, ...prefs,
  });
  const set = (k) => (v) => { const next = { ...s, [k]: v }; setS(next); onChange && onChange(next); };

  return (
    <Screen>
      <Header title="Privacy & safety" onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionLabel>WHO CAN INVITE ME</SectionLabel>
        <Chips options={[{ id: 'everyone', name: 'Everyone' }, { id: 'friends', name: 'Friends' }, { id: 'nobody', name: 'Nobody' }]}
          value={s.whoCanInvite} onChange={set('whoCanInvite')} />

        <SectionLabel>VISIBILITY</SectionLabel>
        <Group>
          <Row icon={I.eye} title="Show my activity" sub="Friends see what you're watching"
            right={<Toggle value={s.showActivity} onChange={set('showActivity')} />} />
          <Row icon={I.star} title="Show my level" right={<Toggle value={s.showLevel} onChange={set('showLevel')} />} />
          <Row icon={I.search} title="Findable by email" right={<Toggle value={s.discoverable} onChange={set('discoverable')} />} />
          <Row icon={I.check} title="Read receipts in chat" right={<Toggle value={s.readReceipts} onChange={set('readReceipts')} />} last />
        </Group>

        <SectionLabel>SAFETY</SectionLabel>
        <Group>
          <Row icon={I.block} title="Blocked people"
            right={<Txt s="sub">{blockedCount}</Txt>} onPress={onBlocked} />
          <Row icon={I.report} title="Report history" onPress={() => {}} last />
        </Group>
      </ScrollView>
    </Screen>
  );
}

// ---------------------------------------------------------------- playback
export function PlaybackScreen({ prefs = {}, onChange, onBack }) {
  const [s, setS] = useState({
    quality: 'auto', autoSync: true, resyncOnJoin: true,
    subtitles: false, dataSaver: false, reactionsOverlay: true, ...prefs,
  });
  const set = (k) => (v) => { const next = { ...s, [k]: v }; setS(next); onChange && onChange(next); };

  return (
    <Screen>
      <Header title="Playback & sync" onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionLabel>VIDEO QUALITY</SectionLabel>
        <Chips options={[{ id: 'auto', name: 'Auto' }, { id: '1080', name: '1080p' }, { id: '720', name: '720p' }, { id: '480', name: '480p' }]}
          value={s.quality} onChange={set('quality')} />

        <SectionLabel>SYNC</SectionLabel>
        <Group>
          <Row icon={I.sync} title="Keep me in sync" sub="Auto-correct drift during playback"
            right={<Toggle value={s.autoSync} onChange={set('autoSync')} />} />
          <Row icon="enter-outline" title="Jump to live on join"
            right={<Toggle value={s.resyncOnJoin} onChange={set('resyncOnJoin')} />} last />
        </Group>

        <SectionLabel>IN THE ROOM</SectionLabel>
        <Group>
          <Row icon="chatbubble-outline" title="Floating reactions"
            right={<Toggle value={s.reactionsOverlay} onChange={set('reactionsOverlay')} />} />
          <Row icon="text-outline" title="Subtitles by default"
            right={<Toggle value={s.subtitles} onChange={set('subtitles')} />} />
          <Row icon="cellular-outline" title="Data saver" sub="Lower quality on mobile data"
            right={<Toggle value={s.dataSaver} onChange={set('dataSaver')} />} last />
        </Group>
      </ScrollView>
    </Screen>
  );
}

// ---------------------------------------------------------------- appearance
export function AppearanceScreen({ prefs = {}, onChange, onBack }) {
  const [s, setS] = useState({ theme: 'dark', reduceMotion: false, avatars3d: true, haptics: true, ...prefs });
  const set = (k) => (v) => { const next = { ...s, [k]: v }; setS(next); onChange && onChange(next); };

  return (
    <Screen>
      <Header title="Appearance" onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionLabel>THEME</SectionLabel>
        <Chips options={[{ id: 'dark', name: 'Dark' }, { id: 'system', name: 'System' }]}
          value={s.theme} onChange={set('theme')} />
        <Txt s="cap" style={{ paddingHorizontal: sp.l, marginTop: sp.s }}>
          WatchParty is built dark — it keeps the room dim while you watch.
        </Txt>

        <SectionLabel>MOTION & 3D</SectionLabel>
        <Group>
          <Row icon="cube-outline" title="3D avatars" sub="Turn off to use flat images (saves battery)"
            right={<Toggle value={s.avatars3d} onChange={set('avatars3d')} />} />
          <Row icon="accessibility-outline" title="Reduce motion"
            right={<Toggle value={s.reduceMotion} onChange={set('reduceMotion')} />} />
          <Row icon="phone-portrait-outline" title="Haptics"
            right={<Toggle value={s.haptics} onChange={set('haptics')} />} last />
        </Group>
      </ScrollView>
    </Screen>
  );
}

// ---------------------------------------------------------------- storage
export function StorageScreen({ cacheSize = '—', onClearCache, onBack }) {
  return (
    <Screen>
      <Header title="Storage & data" onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ padding: sp.l }}>
          <Card style={{ alignItems: 'center', paddingVertical: sp.xl }}>
            <Txt s="h1">{cacheSize}</Txt>
            <Txt s="cap">Cached avatars, thumbnails and art</Txt>
            <Btn title="Clear cache" variant="secondary" size="sm"
              onPress={onClearCache} style={{ marginTop: sp.m, minWidth: 150 }} />
          </Card>
        </View>
        <Group>
          <Row icon="download-outline" title="Download over Wi-Fi only" right={<Toggle value onChange={() => {}} />} last />
        </Group>
      </ScrollView>
    </Screen>
  );
}

// ---------------------------------------------------------------- help / about
export function HelpScreen({ onBack, supportEmail = 'support@watchparty.app' }) {
  return (
    <Screen>
      <Header title="Help" onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionLabel>COMMON QUESTIONS</SectionLabel>
        <Group>
          <Row icon={I.sync} title="Video is out of sync" onPress={() => {}} />
          <Row icon={I.rooms} title="Friends can't join my room" onPress={() => {}} />
          <Row icon={I.cards} title="How games and XP work" onPress={() => {}} />
          <Row icon={I.profile} title="Avatar won't save" onPress={() => {}} last />
        </Group>
        <SectionLabel>CONTACT</SectionLabel>
        <Group>
          <Row icon="mail-outline" title="Email support" sub={supportEmail}
            onPress={() => Linking.openURL(`mailto:${supportEmail}`)} />
          <Row icon={I.report} title="Report a problem" onPress={() => {}} last />
        </Group>
      </ScrollView>
    </Screen>
  );
}

export function AboutScreen({ onBack, appVersion = '1.0.0', build = '1' }) {
  return (
    <Screen>
      <Header title="About" onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', paddingVertical: sp.xxl }}>
          <View style={{ width: 74, height: 74, borderRadius: 20, backgroundColor: c.beam,
            alignItems: 'center', justifyContent: 'center' }}>
            <Txt style={{ fontSize: 30, fontWeight: '800', color: '#fff' }}>W</Txt>
          </View>
          <Txt s="h2" style={{ marginTop: sp.m }}>WatchParty</Txt>
          <Txt s="cap">Version {appVersion} ({build})</Txt>
        </View>
        <Group>
          <Row icon="document-text-outline" title="Terms of service" onPress={() => {}} />
          <Row icon={I.shield} title="Privacy policy" onPress={() => {}} />
          <Row icon="code-slash-outline" title="Open source licenses" onPress={() => {}} />
          <Row icon="star-outline" title="Rate the app" onPress={() => {}} last />
        </Group>
      </ScrollView>
    </Screen>
  );
}
