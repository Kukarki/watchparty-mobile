// Music room — synced YouTube audio: now playing, queue, listeners, reactions.
// Playback itself is your existing sync layer; this is the UI + controls.
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Icon, { I } from '../ui/Icon';
import ActionSheet from '../ui/Sheet';
import { Avatar, Badge, Btn, Card, Header, IconBtn, Screen, SectionLabel, Txt } from '../ui/kit';
import { c, r, sp } from '../ui/tokens';

export default function MusicRoomScreen({
  title = 'Music room', nowPlaying, queue = [], listeners = [], isHost, playing,
  onBack, onTogglePlay, onSkip, onAddTrack, onVoteSkip, onRemoveTrack, onReact, onLeave,
}) {
  const [menu, setMenu] = useState(null);
  const [trackMenu, setTrackMenu] = useState(null);
  const [url, setUrl] = useState('');

  return (
    <Screen>
      <Header title={title} subtitle={`${listeners.length} listening`} onBack={onBack}
        right={<IconBtn name={I.more} label="Room menu" onPress={() => setMenu({ room: true })} />} />

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {/* now playing */}
        <View style={{ paddingHorizontal: sp.l }}>
          <Card style={{ padding: sp.l, alignItems: 'center' }}>
            <View style={st.bigArt}>
              <Icon name={I.music} size={40} color={c.beam} />
            </View>
            <Txt s="h2" numberOfLines={1} style={{ marginTop: sp.l, textAlign: 'center' }}>
              {nowPlaying ? nowPlaying.title : 'Nothing playing'}
            </Txt>
            <Txt s="cap" numberOfLines={1}>
              {nowPlaying ? `Added by ${nowPlaying.addedBy}` : 'Add a YouTube link to start'}
            </Txt>

            <View style={st.progress}>
              <View style={[st.progressFill, { width: `${nowPlaying ? nowPlaying.progressPct || 0 : 0}%` }]} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <Txt s="cap">{nowPlaying ? nowPlaying.elapsed : '0:00'}</Txt>
              <Txt s="cap" style={{ color: c.beamHot }}>
                <Icon name={I.sync} size={10} color={c.beamHot} /> in sync
              </Txt>
              <Txt s="cap">{nowPlaying ? nowPlaying.duration : '0:00'}</Txt>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: sp.xl, marginTop: sp.l }}>
              <IconBtn name="heart-outline" label="React" onPress={() => onReact && onReact('❤️')} />
              <Pressable onPress={onTogglePlay} disabled={!isHost}
                style={[st.playBtn, !isHost && { opacity: 0.4 }]}>
                <Icon name={playing ? I.pause : I.playFill} size={26} color="#fff" />
              </Pressable>
              <IconBtn name={I.skip} label="Vote skip"
                onPress={() => (isHost ? onSkip && onSkip() : onVoteSkip && onVoteSkip())} />
            </View>
            {!isHost && <Txt s="cap" style={{ marginTop: sp.s }}>Host controls playback · you can vote to skip</Txt>}
          </Card>
        </View>

        {/* add track */}
        <SectionLabel>ADD A TRACK</SectionLabel>
        <View style={{ paddingHorizontal: sp.l, flexDirection: 'row', gap: sp.s }}>
          <TextInput
            value={url} onChangeText={setUrl}
            placeholder="Paste a YouTube link" placeholderTextColor={c.dim}
            style={st.input} autoCapitalize="none"
          />
          <Btn title="Add" icon={I.add} disabled={!url.trim()}
            onPress={() => { onAddTrack && onAddTrack(url.trim()); setUrl(''); }} />
        </View>

        {/* queue */}
        <SectionLabel>UP NEXT · {queue.length}</SectionLabel>
        <View style={{ paddingHorizontal: sp.l, gap: sp.s }}>
          {queue.length === 0 ? (
            <Txt s="sub" style={{ textAlign: 'center', paddingVertical: sp.l }}>
              Queue is empty — add the next one.
            </Txt>
          ) : queue.map((tr, i) => (
            <Card key={tr.id} style={{ flexDirection: 'row', alignItems: 'center', gap: sp.m, padding: sp.s + 2 }}>
              <Txt s="cap" style={{ width: 16, textAlign: 'center' }}>{i + 1}</Txt>
              <View style={st.qArt}><Icon name={I.musicOff} size={14} color={c.beam} /></View>
              <View style={{ flex: 1 }}>
                <Txt s="sub" numberOfLines={1} style={{ color: c.text }}>{tr.title}</Txt>
                <Txt s="cap">{tr.addedBy} · {tr.duration}</Txt>
              </View>
              {tr.skipVotes ? <Badge tint="rgba(255,180,84,0.18)" color={c.warn}>{tr.skipVotes} skip</Badge> : null}
              <Pressable hitSlop={10} onPress={() => setTrackMenu(tr)}>
                <Icon name={I.more} size={18} color={c.dim} />
              </Pressable>
            </Card>
          ))}
        </View>

        {/* listeners */}
        <SectionLabel>LISTENING</SectionLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: sp.l, gap: sp.l }}>
          {listeners.map((l) => (
            <View key={l.id} style={{ alignItems: 'center', width: 58 }}>
              <Avatar url={l.avatarUrl} name={l.name} size={46} ring={l.isHost ? c.warn : undefined}
                presence={c.beam} />
              <Txt s="cap" numberOfLines={1} style={{ marginTop: 4 }}>{l.name}</Txt>
              {l.isHost ? <Txt s="cap" style={{ color: c.warn, fontSize: 9 }}>HOST</Txt> : null}
            </View>
          ))}
        </ScrollView>
      </ScrollView>

      <ActionSheet visible={!!menu} title={title}
        actions={[
          { icon: I.share, label: 'Share room', onPress: () => {} },
          { icon: I.copy, label: 'Copy code', onPress: () => {} },
          { icon: I.invite, label: 'Invite friends', onPress: () => {} },
          ...(isHost ? [{ icon: I.settings, label: 'Room settings', onPress: () => {} }] : []),
          { icon: I.leave, label: 'Leave room', danger: true, onPress: onLeave },
        ]}
        onClose={() => setMenu(null)} />

      <ActionSheet visible={!!trackMenu} title={trackMenu && trackMenu.title}
        subtitle={trackMenu && `Added by ${trackMenu.addedBy}`}
        actions={[
          { icon: I.skip, label: 'Vote to skip', onPress: () => onVoteSkip && onVoteSkip(trackMenu) },
          { icon: I.bookmark, label: 'Save to my list', onPress: () => {} },
          { icon: I.profile, label: 'Who added this', onPress: () => {} },
          ...(isHost ? [{ icon: I.trash, label: 'Remove from queue', danger: true,
            onPress: () => onRemoveTrack && onRemoveTrack(trackMenu) }] : []),
        ]}
        onClose={() => setTrackMenu(null)} />
    </Screen>
  );
}

const st = StyleSheet.create({
  bigArt: {
    width: 150, height: 150, borderRadius: r.lg, backgroundColor: c.beamDim,
    alignItems: 'center', justifyContent: 'center',
  },
  progress: {
    height: 4, backgroundColor: c.surface2, borderRadius: 2,
    width: '100%', marginTop: sp.l, marginBottom: 6, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: c.beam },
  playBtn: {
    width: 62, height: 62, borderRadius: 31, backgroundColor: c.beam,
    alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
    borderRadius: r.md, paddingHorizontal: sp.m, paddingVertical: 11, color: c.text, fontSize: 14,
  },
  qArt: { width: 34, height: 34, borderRadius: 7, backgroundColor: c.beamDim, alignItems: 'center', justifyContent: 'center' },
});
