// Account — the destructive stuff lives here, at the bottom, behind confirms.
import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { I } from '../../ui/Icon';
import { Btn, Header, Row, Screen, SectionLabel, Txt } from '../../ui/kit';
import { c, sp } from '../../ui/tokens';

const Group = ({ children }) => (
  <View style={{ marginHorizontal: sp.l, backgroundColor: c.surface, borderRadius: 14,
    borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>{children}</View>
);

export default function AccountScreen({
  name, email, userId, accountType = 'Registered', joinedAt,
  onBack, onEditName, onChangeEmail, onChangePassword, onSignOut, onDelete, onCopyId,
}) {
  const [copied, setCopied] = useState(false);

  const confirmSignOut = () => Alert.alert('Sign out?', 'You can sign back in anytime.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign out', style: 'destructive', onPress: onSignOut },
  ]);

  const confirmDelete = () => Alert.alert(
    'Delete account?',
    'This permanently removes your avatar, level, items, and history. This cannot be undone.',
    [{ text: 'Cancel', style: 'cancel' },
     { text: 'Delete forever', style: 'destructive', onPress: onDelete }],
  );

  return (
    <Screen>
      <Header title="Account" onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionLabel>PROFILE</SectionLabel>
        <Group>
          <Row icon={I.profile} title="Display name" right={<Txt s="sub">{name}</Txt>} onPress={onEditName} />
          <Row icon="mail-outline" title="Email" right={<Txt s="sub" numberOfLines={1}
            style={{ maxWidth: 170 }}>{email}</Txt>} onPress={onChangeEmail} />
          <Row icon={I.lock} title="Password" onPress={onChangePassword} last />
        </Group>

        <SectionLabel>DETAILS</SectionLabel>
        <Group>
          <Row icon={I.shield} title="Account type" right={<Txt s="sub">{accountType}</Txt>} />
          <Row icon="calendar-outline" title="Member since"
            right={<Txt s="sub">{joinedAt || '—'}</Txt>} />
          <Row icon={I.copy} title="User ID"
            sub={copied ? 'Copied to clipboard' : undefined}
            right={<Txt s="cap" numberOfLines={1} style={{ maxWidth: 130 }}>
              {userId ? `${String(userId).slice(0, 8)}…` : '—'}
            </Txt>}
            onPress={() => { onCopyId && onCopyId(userId); setCopied(true); setTimeout(() => setCopied(false), 1600); }}
            last />
        </Group>

        <View style={{ paddingHorizontal: sp.l, marginTop: sp.xxl, gap: sp.m }}>
          <Btn title="Sign out" variant="secondary" icon={I.leave} onPress={confirmSignOut} />
          <Btn title="Delete account" variant="danger" onPress={confirmDelete} />
          <Txt s="cap" style={{ textAlign: 'center' }}>
            Deleting is permanent and removes your level, items, and history.
          </Txt>
        </View>
      </ScrollView>
    </Screen>
  );
}
