// WildBeam table: opponents on top, discard + draw pile center with the
// current color glow, your hand at the bottom. "LAST CARD!" arm button,
// color picker for Prism/Surge, turn countdown, end-of-game ranking.
//
// Props:
//   socket      your connected Socket.IO client
//   sessionId   from game:create / game:list
//   meId        current user's id (same id your socket auth uses)
//   playersMeta optional { [userId]: { name, avatarUrl } } for display
//   onExit      called when the player leaves / game ends
import React, { useEffect, useMemo, useState } from 'react';
import {
  Image, Modal, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useGameSocket } from '../useGameSocket';
import { Card } from './cardUi';
import { CARD_COLORS, colors } from '../theme';

const COLOR_NAMES = { beam: 'Beam', cyan: 'Cyan', amber: 'Amber', crimson: 'Crimson' };

function Countdown({ deadline }) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!deadline) return undefined;
    const id = setInterval(() => setLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))), 250);
    return () => clearInterval(id);
  }, [deadline]);
  if (!deadline) return null;
  return (
    <Text style={[st.timer, left <= 5 && { color: colors.danger }]}>{left}s</Text>
  );
}

function EventTicker({ events, nameOf }) {
  const msg = useMemo(() => {
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];
      if (e.type === 'played') return `${nameOf(e.pid)} played ${e.card.kind === 'num' ? e.card.value : e.card.kind}${e.chosenColor ? ` → ${COLOR_NAMES[e.chosenColor]}` : ''}`;
      if (e.type === 'boosted') return `${nameOf(e.pid)} draws +${e.n}!`;
      if (e.type === 'missed_call') return `${nameOf(e.pid)} forgot "Last card!" (+1 penalty)`;
      if (e.type === 'last_card') return `⚡ ${nameOf(e.pid)}: LAST CARD!`;
      if (e.type === 'went_out') return `🏁 ${nameOf(e.pid)} is out — place ${e.place}`;
      if (e.type === 'rewound') return '↺ Direction reversed';
      if (e.type === 'timed_out') return `${nameOf(e.pid)} timed out`;
      if (e.type === 'drew') return `${nameOf(e.pid)} drew a card`;
    }
    return null;
  }, [events, nameOf]);
  if (!msg) return <View style={{ height: 18 }} />;
  return <Text style={st.ticker} numberOfLines={1}>{msg}</Text>;
}

export default function WildBeamScreen({ socket, sessionId, meId, playersMeta = {}, onExit }) {
  const game = useGameSocket(socket, sessionId);
  const { state, hand, lobby, lastEvents, ended, move, start, leave } = game;
  const [lastCardArmed, setLastCardArmed] = useState(false);
  const [pendingWild, setPendingWild] = useState(null); // cardId awaiting color choice

  const nameOf = (pid) => (playersMeta[pid] && playersMeta[pid].name)
    || (pid === meId ? 'You' : `Player ${String(pid).slice(0, 4)}`);

  const myTurn = state && state.turn === meId;
  const myHand = (hand && hand.myHand) || [];

  useEffect(() => { if (myHand.length !== 2) setLastCardArmed(false); }, [myHand.length]);

  const playCard = (card, chooseColor) => {
    move({
      type: 'play',
      cardId: card.id,
      chooseColor,
      callLastCard: lastCardArmed || myHand.length === 1,
    }, (res) => { if (res.error) console.warn('[wildbeam]', res.error); });
    setLastCardArmed(false);
    setPendingWild(null);
  };

  const onCardPress = (card) => {
    if (!myTurn) return;
    if (card.kind === 'prism' || card.kind === 'surge4') setPendingWild(card);
    else playCard(card);
  };

  // ---------- lobby ----------
  if (!state && lobby) {
    const host = lobby.hostId === meId;
    return (
      <View style={[st.root, st.center]}>
        <Text style={st.title}>🎴 WildBeam</Text>
        <Text style={st.dim}>Waiting for players… {lobby.players.length} joined</Text>
        <View style={{ marginVertical: 16, gap: 6 }}>
          {lobby.players.map((p) => <Text key={p} style={st.txt}>• {nameOf(p)}</Text>)}
        </View>
        {host ? (
          <Pressable style={st.primaryBtn}
            onPress={() => start((r) => r.error && console.warn(r.error))}>
            <Text style={st.primaryTxt}>Start game</Text>
          </Pressable>
        ) : <Text style={st.dim}>Host starts the game</Text>}
        <Pressable onPress={() => { leave(); onExit && onExit(); }} style={{ marginTop: 20 }}>
          <Text style={st.dim}>Leave</Text>
        </Pressable>
      </View>
    );
  }

  if (!state) {
    return <View style={[st.root, st.center]}><Text style={st.dim}>Joining table…</Text></View>;
  }

  const opponents = state.order.filter((p) => p !== meId && !state.eliminated.includes(p));

  return (
    <View style={st.root}>
      {/* opponents */}
      <View style={st.oppRow}>
        {opponents.map((pid) => {
          const metaP = playersMeta[pid] || {};
          const out = state.winners.includes(pid);
          return (
            <View key={pid} style={[st.opp, state.turn === pid && st.oppActive]}>
              {metaP.avatarUrl
                ? <Image source={{ uri: metaP.avatarUrl }} style={st.oppAvatar} />
                : <View style={[st.oppAvatar, st.center]}><Text>👤</Text></View>}
              <Text style={st.oppName} numberOfLines={1}>{nameOf(pid)}</Text>
              <Text style={st.oppCount}>{out ? '🏁' : `🎴 ${state.handCounts[pid]}`}</Text>
            </View>
          );
        })}
      </View>

      <EventTicker events={lastEvents} nameOf={nameOf} />

      {/* table center */}
      <View style={st.table}>
        <Pressable
          onPress={() => myTurn && !hand?.drawnCard && move({ type: 'draw' })}
          style={{ alignItems: 'center', gap: 4 }}>
          <Card faceDown size={1.1} />
          <Text style={st.dim}>Draw · {state.deckCount}</Text>
        </Pressable>

        <View style={{ alignItems: 'center', gap: 6 }}>
          <View style={[st.colorRing, { borderColor: CARD_COLORS[state.currentColor] || colors.border }]}>
            <Card card={state.discardTop} size={1.25} />
          </View>
          <Text style={[st.dim, { color: CARD_COLORS[state.currentColor] }]}>
            {COLOR_NAMES[state.currentColor] || ''}
          </Text>
        </View>

        <View style={{ alignItems: 'center', width: 62 }}>
          {myTurn
            ? <><Text style={st.yourTurn}>YOUR{'\n'}TURN</Text><Countdown deadline={state.deadline} /></>
            : <Text style={st.dim}>{nameOf(state.turn)}{'\n'}playing…</Text>}
        </View>
      </View>

      {/* drew a playable card? */}
      {myTurn && hand && hand.drawnCard && (
        <Pressable onPress={() => move({ type: 'pass' })} style={st.passBtn}>
          <Text style={st.txt}>Keep it & pass</Text>
        </Pressable>
      )}

      {/* my hand */}
      <View style={st.handArea}>
        <View style={st.handHeader}>
          <Text style={st.dim}>Your hand · {myHand.length}</Text>
          {myHand.length === 2 && (
            <Pressable
              onPress={() => setLastCardArmed(!lastCardArmed)}
              style={[st.lastCardBtn, lastCardArmed && st.lastCardArmed]}>
              <Text style={{ color: lastCardArmed ? '#fff' : colors.danger, fontWeight: '800', fontSize: 12 }}>
                {lastCardArmed ? '⚡ ARMED' : 'LAST CARD!'}
              </Text>
            </Pressable>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingVertical: 8 }}>
          {myHand.map((c) => (
            <Card key={c.id} card={c}
              onPress={() => onCardPress(c)}
              disabled={!myTurn || (hand.drawnCard && c.id !== hand.drawnCard)}
              style={hand.drawnCard === c.id ? { borderColor: colors.beamHot } : null}
            />
          ))}
        </ScrollView>
      </View>

      {/* wild color picker */}
      <Modal visible={!!pendingWild} transparent animationType="fade">
        <View style={st.modalBg}>
          <View style={st.modalCard}>
            <Text style={st.title}>Pick a color</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
              {Object.entries(CARD_COLORS).map(([key, hex]) => (
                <Pressable key={key}
                  onPress={() => playCard(pendingWild, key)}
                  style={[st.colorPick, { backgroundColor: hex }]} />
              ))}
            </View>
            <Pressable onPress={() => setPendingWild(null)} style={{ marginTop: 14 }}>
              <Text style={st.dim}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* game over */}
      <Modal visible={!!ended} transparent animationType="slide">
        <View style={st.modalBg}>
          <View style={st.modalCard}>
            <Text style={st.title}>{ended && ended.cancelled ? 'Game cancelled' : '🏆 Results'}</Text>
            {(ended && ended.ranking || []).map((pid, i) => (
              <Text key={pid} style={[st.txt, { marginTop: 6 }]}>
                {['🥇', '🥈', '🥉'][i] || `${i + 1}.`} {nameOf(pid)}
              </Text>
            ))}
            <Pressable style={[st.primaryBtn, { marginTop: 18 }]}
              onPress={() => { leave(); onExit && onExit(); }}>
              <Text style={st.primaryTxt}>Back to room</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink, paddingTop: 54 },
  center: { alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  txt: { color: colors.text, fontSize: 14 },
  dim: { color: colors.dim, fontSize: 12, textAlign: 'center' },
  oppRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 10,
    paddingHorizontal: 12, flexWrap: 'wrap',
  },
  opp: {
    alignItems: 'center', padding: 8, borderRadius: 14, width: 74,
    backgroundColor: colors.inkRaised, borderWidth: 1.5, borderColor: colors.border,
  },
  oppActive: { borderColor: colors.beam },
  oppAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.ink },
  oppName: { color: colors.text, fontSize: 10, marginTop: 4 },
  oppCount: { color: colors.dim, fontSize: 10 },
  ticker: {
    color: colors.beamHot, fontSize: 12, textAlign: 'center', marginTop: 8, height: 18,
  },
  table: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-evenly', paddingHorizontal: 10,
  },
  colorRing: { borderWidth: 3, borderRadius: 16, padding: 5 },
  yourTurn: {
    color: colors.cyan, fontWeight: '800', fontSize: 13, textAlign: 'center',
  },
  timer: { color: colors.dim, fontSize: 13, textAlign: 'center', marginTop: 4 },
  passBtn: {
    alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.inkRaised, marginBottom: 6,
  },
  handArea: {
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.inkRaised + '88', paddingBottom: 24,
  },
  handHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 10,
  },
  lastCardBtn: {
    borderWidth: 1.5, borderColor: colors.danger, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  lastCardArmed: { backgroundColor: colors.danger },
  modalBg: {
    flex: 1, backgroundColor: '#000B', alignItems: 'center', justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: colors.inkRaised, borderRadius: 20, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border, minWidth: 260,
  },
  colorPick: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#FFFFFF33' },
  primaryBtn: {
    backgroundColor: colors.beam, paddingHorizontal: 26, paddingVertical: 12, borderRadius: 999,
  },
  primaryTxt: { color: '#fff', fontWeight: '700' },
});
