// Settings hub — everything that was cluttering the old Profile lives here.
import React from 'react';
import { ScrollView, View } from 'react-native';
import { I } from '../../ui/Icon';
import { Avatar, Card, Header, Row, Screen, SectionLabel, Txt } from '../../ui/kit';
import { c, sp } from '../../ui/tokens';

export default function SettingsScreen({
  name, email, avatarUrl, level, appVersion = '1.0.0', onBack, go,
}) {
  return (
    <Screen>
      <Header title="Settings" onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: sp.l }}>
          <Card onPress={() => go('account')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: sp.m, padding: sp.l }}>
            <Avatar url={avatarUrl} name={name} size={52} ring={c.beam} />
            <View style={{ flex: 1 }}>
              <Txt s="h3">{name}</Txt>
              <Txt s="cap" numberOfLines={1}>{email}</Txt>
              {level ? <Txt s="cap" style={{ color: c.beamHot }}>Level {level}</Txt> : null}
            </View>
          </Card>
        </View>

        <SectionLabel>ACCOUNT</SectionLabel>
        <View style={{ marginHorizontal: sp.l, backgroundColor: c.surface, borderRadius: 14,
          borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
          <Row icon={I.profile} title="Account" sub="Name, email, sign-in" onPress={() => go('account')} />
          <Row icon={I.edit} title="Avatar & identity" sub="Studio, title, frame" onPress={() => go('avatar')} />
          <Row icon={I.bell} title="Notifications" onPress={() => go('notifications')} />
          <Row icon={I.lock} title="Privacy & safety" sub="Who can invite you, blocking" onPress={() => go('privacy')} last />
        </View>

        <SectionLabel>APP</SectionLabel>
        <View style={{ marginHorizontal: sp.l, backgroundColor: c.surface, borderRadius: 14,
          borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
          <Row icon={I.sync} title="Playback & sync" sub="Quality, auto-sync, subtitles" onPress={() => go('playback')} />
          <Row icon={I.moon} title="Appearance" onPress={() => go('appearance')} />
          <Row icon={I.disk} title="Storage & data" onPress={() => go('storage')} last />
        </View>

        <SectionLabel>SUPPORT</SectionLabel>
        <View style={{ marginHorizontal: sp.l, backgroundColor: c.surface, borderRadius: 14,
          borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
          <Row icon={I.help} title="Help center" onPress={() => go('help')} />
          <Row icon={I.report} title="Report a problem" onPress={() => go('help')} />
          <Row icon={I.info} title="About" sub={`Version ${appVersion}`} onPress={() => go('about')} last />
        </View>

        <Txt s="cap" style={{ textAlign: 'center', marginTop: sp.xl }}>
          WatchParty v{appVersion}
        </Txt>
      </ScrollView>
    </Screen>
  );
}
