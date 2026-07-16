// The room — two modes on one screen.
//   lounge   : before/after playback. avatars, games, vote on what's next.
//   watching : video is king. seat bar + chat + floating reactions.
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, TextInput, View,
} from 'react-native';
import Icon, { I } from '../ui/Icon';
import ActionSheet from '../ui/Sheet';
import { Avatar, Badge, Btn, Card, IconBtn, LiveDot, Screen, Txt } from '../ui/kit';
import { c, r, sp } from '../ui/tokens';

const REACTIONS = ['😂', '😱', '❤️', '🔥', '👏', '😭'];

function FloatingReaction({ emoji, onDone }) {
  const y = useRef(new Animated.Value(0)).current;
  const o = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(y, { toValue: -110, duration: 1800, useNativeDriver: true }),
      Animated.timing(o, { toValue: 0, duration: 1800, useNativeDriver: true }),
    ]).start(onDone);
  }, []);
  return (
    <Animated.Text style={{ position: 'absolute', right: 12 + Math.random() * 40, bottom: 10,
      fontSize: 26, transform: [{ translateY: y }], opacity: o }}>{emoji}</Animated.Text>
  );
}

export default function RoomScreen({
  title = 'Room', code, mode = 'lounge', isHost, members = [], messages = [],
  nowPlaying, queueVote = [], VideoPlayer, startsIn,
  onBack, onSend, onReact, onStartWatching, onOpenGames, onVote, onInvite, onLeave, onOpenPerson,
}) {
  const [text, setText] = useState('');
  const [menu, setMenu] = useState(null);
  const [msgMenu, setMsgMenu] = useState(null);
  const [showReactions, setShowReactions] = useState(false);
  const [floats, setFloats] = useState([]);

  const fire = (emoji) => {
    const id = Date.now() + Math.random();
    setFloats((f) => [...f, { id, emoji }]);
    onReact && onReact(emoji);
    setShowReactions(false);
  };

  const watching = mode === 'watching';

  return (
    <Screen>
      {/* top bar */}
      <View style={st.topBar}>
        <IconBtn name={I.back} dim onPress={onBack} label="Back" />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Txt s="h3" numberOfLines={1}>{title}</Txt>
            {watching ? <LiveDot /> : null}
          </View>
          <Txt s="cap">{members.length} here{code ? ` · ${code}` : ''}</Txt>
        </View>
        <IconBtn name={I.invite} dim onPress={onInvite} label="Invite" />
        <IconBtn name={I.more} dim onPress={() => setMenu({ room: true })} label="Room menu" />
      </View>

      {/* stage */}
      <View style={watching ? st.video : st.lounge}>
        {watching ? (
          VideoPlayer ? <VideoPlayer /> : (
            <View style={st.videoPlaceholder}><Icon name="play-circle" size={44} color={c.borderHi} /></View>
          )
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center',
              gap: sp.m, flex: 1, paddingBottom: sp.m }}>
              {members.slice(0, 6).map((m) => (
                <Pressable key={m.id} onPress={() => onOpenPerson && onOpenPerson(m)}
                  style={{ alignItems: 'center' }}>
                  <Avatar url={m.avatarUrl} name={m.name} size={44}
                    ring={m.isHost ? c.warn : m.frameColor} presence={c.beam} />
                  <Txt s="cap" numberOfLines={1} style={{ marginTop: 4, maxWidth: 52 }}>{m.name}</Txt>
                </Pressable>
              ))}
            </View>
            {startsIn ? (
              <Badge tint={c.beamDim} color={c.beamHot}>{`STARTS IN ${startsIn}`}</Badge>
            ) : null}
          </>
        )}
        {floats.map((f) => (
          <FloatingReaction key={f.id} emoji={f.emoji}
            onDone={() => setFloats((x) => x.filter((i) => i.id !== f.id))} />
        ))}
      </View>

      {/* seat bar — the avatar system, visible during playback */}
      {watching && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }} contentContainerStyle={st.seatBar}>
          {members.map((m) => (
            <Pressable key={m.id} onPress={() => onOpenPerson && onOpenPerson(m)}>
              <Avatar url={m.avatarUrl} name={m.name} size={34}
                ring={m.isHost ? c.warn : m.frameColor} presence={m.speaking ? c.ok : c.beam} />
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* lounge extras */}
      {!watching && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: sp.l, gap: sp.m }}>
          {queueVote.length > 0 && (
            <Card>
              <Txt s="label">UP NEXT · ROOM VOTES</Txt>
              <View style={{ gap: sp.s, marginTop: sp.m }}>
                {queueVote.map((q) => (
                  <Pressable key={q.id} onPress={() => onVote && onVote(q)}
                    style={[st.voteRow, q.mine && { borderColor: c.beam, backgroundColor: c.beamDim }]}>
                    <Txt s="sub" numberOfLines={1} style={{ flex: 1, color: c.text }}>{q.title}</Txt>
                    <Badge tint={c.surface2} color={q.mine ? c.beamHot : c.text2}>{`${q.votes}`}</Badge>
                  </Pressable>
                ))}
              </View>
            </Card>
          )}

          <View style={{ flexDirection: 'row', gap: sp.m }}>
            <Card onPress={onOpenGames} style={{ flex: 1, alignItems: 'center', paddingVertical: sp.l }}>
              <Icon name={I.play} size={21} color={c.beam} />
              <Txt s="sub" style={{ fontWeight: '600', marginTop: 5 }}>Play a game</Txt>
              <Txt s="cap">while you wait</Txt>
            </Card>
            <Card onPress={onInvite} style={{ flex: 1, alignItems: 'center', paddingVertical: sp.l }}>
              <Icon name={I.invite} size={21} color={c.beam} />
              <Txt s="sub" style={{ fontWeight: '600', marginTop: 5 }}>Invite</Txt>
              <Txt s="cap">{code || 'share link'}</Txt>
            </Card>
          </View>

          {isHost ? (
            <Btn title="Start watching" icon={I.playFill} size="lg" onPress={onStartWatching} />
          ) : (
            <Txt s="cap" style={{ textAlign: 'center' }}>Waiting for the host to start…</Txt>
          )}
        </ScrollView>
      )}

      {/* chat */}
      {watching && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: sp.m, gap: 6 }}>
          {messages.map((m) => (
            <Pressable key={m.id} onLongPress={() => setMsgMenu(m)} style={st.msg}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Txt s="cap" style={{ color: c.beamHot, fontWeight: '700' }}>{m.senderName}</Txt>
                {m.level ? <Badge tint={c.beamDim} color={c.beamHot}>{`LV ${m.level}`}</Badge> : null}
              </View>
              <Txt s="sub" style={{ color: c.text, marginTop: 1 }}>{m.text}</Txt>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* composer */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {showReactions && (
          <View style={st.reactionBar}>
            {REACTIONS.map((e) => (
              <Pressable key={e} onPress={() => fire(e)} hitSlop={6}>
                <Txt style={{ fontSize: 25 }}>{e}</Txt>
              </Pressable>
            ))}
          </View>
        )}
        <View style={st.composer}>
          <TextInput value={text} onChangeText={setText}
            placeholder="Message the room" placeholderTextColor={c.dim}
            style={st.input}
            onSubmitEditing={() => { if (text.trim()) { onSend && onSend(text.trim()); setText(''); } }} />
          <IconBtn name="happy-outline" dim label="Reactions"
            onPress={() => setShowReactions((v) => !v)} />
          {text.trim() ? (
            <Pressable onPress={() => { onSend && onSend(text.trim()); setText(''); }} style={st.send}>
              <Icon name="send" size={16} color="#fff" />
            </Pressable>
          ) : (
            <IconBtn name={I.play} dim label="Games" onPress={onOpenGames} />
          )}
        </View>
      </KeyboardAvoidingView>

      <ActionSheet visible={!!menu} title={title} subtitle={code ? `Code ${code}` : undefined}
        actions={[
          { icon: I.share, label: 'Share room', onPress: () => {} },
          { icon: I.copy, label: 'Copy invite code', onPress: () => {} },
          { icon: I.people, label: `People (${members.length})`, onPress: () => {} },
          ...(isHost ? [
            { icon: I.edit, label: 'Rename room', onPress: () => {} },
            { icon: I.lock, label: 'Room settings', onPress: () => {} },
          ] : []),
          { icon: I.leave, label: 'Leave room', danger: true, onPress: onLeave },
          { icon: I.report, label: 'Report', danger: true, onPress: () => {} },
        ]}
        onClose={() => setMenu(null)} />

      <ActionSheet visible={!!msgMenu} title={msgMenu && msgMenu.senderName}
        subtitle={msgMenu && msgMenu.text}
        actions={[
          { icon: 'arrow-undo-outline', label: 'Reply', onPress: () => {} },
          { icon: I.copy, label: 'Copy text', onPress: () => {} },
          { icon: 'happy-outline', label: 'React', onPress: () => setShowReactions(true) },
          { icon: I.profile, label: 'View profile', onPress: () => onOpenPerson && onOpenPerson(msgMenu) },
          { icon: I.report, label: 'Report message', danger: true, onPress: () => {} },
        ]}
        onClose={() => setMsgMenu(null)} />
    </Screen>
  );
}

const st = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: sp.s,
    paddingHorizontal: sp.m, paddingTop: 50, paddingBottom: sp.s,
  },
  video: { height: 220, backgroundColor: '#000', overflow: 'hidden' },
  videoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lounge: {
    height: 200, margin: sp.m, marginTop: 0, borderRadius: r.lg,
    backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
    alignItems: 'center', paddingVertical: sp.m, overflow: 'hidden',
  },
  seatBar: {
    gap: sp.s, paddingHorizontal: sp.m, paddingVertical: sp.s,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  msg: { paddingVertical: 4, paddingHorizontal: sp.s },
  voteRow: {
    flexDirection: 'row', alignItems: 'center', gap: sp.s,
    borderWidth: 1, borderColor: c.border, borderRadius: r.sm,
    paddingHorizontal: sp.m, paddingVertical: 10,
  },
  reactionBar: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: sp.s, backgroundColor: c.surface,
    borderTopWidth: 1, borderColor: c.border,
  },
  composer: {
    flexDirection: 'row', alignItems: 'center', gap: sp.s,
    padding: sp.m, paddingBottom: 26, borderTopWidth: 1, borderColor: c.border,
    backgroundColor: c.ink,
  },
  input: {
    flex: 1, backgroundColor: c.surface, borderRadius: r.pill,
    borderWidth: 1, borderColor: c.border,
    paddingHorizontal: sp.m, paddingVertical: 10, color: c.text, fontSize: 14,
  },
  send: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: c.beam,
    alignItems: 'center', justifyContent: 'center',
  },
});
