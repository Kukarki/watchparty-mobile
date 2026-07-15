// Match Blitz table: 4x6 memory grid, live scores, match = play again.
// Same props as WildBeamScreen.
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useGameSocket } from '../useGameSocket';
import { colors } from '../theme';

export default function MatchBlitzScreen({ socket, sessionId, meId, playersMeta = {}, onExit }) {
  const { state, lobby, lastEvents, ended, move, start, leave } = useGameSocket(socket, sessionId);
  const [reveal, setReveal] = useState(null); // brief flash of a missed pair
  const revealTimer = useRef(null);

  const nameOf = (pid) => (playersMeta[pid] && playersMeta[pid].name)
    || (pid === meId ? 'You' : `Player ${String(pid).slice(0, 4)}`);

  // when the server reports a miss, keep both icons visible for 1.1 s locally
  useEffect(() => {
    const miss = [...lastEvents].reverse().find((e) => e.type === 'miss');
    const flips = lastEvents.filter((e) => e.type === 'flip');
    if (miss && flips.length) {
      const icons = {};
      for (const f of flips) icons[f.index] = f.icon;
      setReveal({ indices: miss.indices, icons });
      clearTimeout(revealTimer.current);
      revealTimer.current = setTimeout(() => setReveal(null), 1100);
    }
    return () => {};
  }, [lastEvents]);

  if (!state && lobby) {
    const host = lobby.hostId === meId;
    return (
      <View style={[st.root, st.center]}>
        <Text style={st.title}>🧠 Match Blitz</Text>
        <Text style={st.dim}>{lobby.players.length} players joined</Text>
        <View style={{ marginVertical: 14, gap: 6 }}>
          {lobby.players.map((p) => <Text key={p} style={st.txt}>• {nameOf(p)}</Text>)}
        </View>
        {host ? (
          <Pressable style={st.primaryBtn} onPress={() => start()}>
            <Text style={st.primaryTxt}>Start game</Text>
          </Pressable>
        ) : <Text style={st.dim}>Host starts the game</Text>}
        <Pressable onPress={() => { leave(); onExit && onExit(); }} style={{ marginTop: 18 }}>
          <Text style={st.dim}>Leave</Text>
        </Pressable>
      </View>
    );
  }

  if (!state) {
    return <View style={[st.root, st.center]}><Text style={st.dim}>Joining…</Text></View>;
  }

  const flippedNow = Object.fromEntries(state.flipped.map((f) => [f.index, f.icon]));
  const myTurn = state.turn === meId;

  const cellFace = (cell, i) => {
    if (cell.matched) return cell.icon;
    if (flippedNow[i] != null) return flippedNow[i];
    if (reveal && reveal.indices.includes(i)) return reveal.icons[i];
    return null;
  };

  return (
    <View style={st.root}>
      {/* scores */}
      <View style={st.scoreRow}>
        {state.order.filter((p) => !state.eliminated.includes(p)).map((pid) => (
          <View key={pid} style={[st.scoreCell, state.turn === pid && st.scoreActive]}>
            <Text style={st.scoreName} numberOfLines={1}>{nameOf(pid)}</Text>
            <Text style={st.scoreVal}>{state.scores[pid] ?? 0} ⭐</Text>
          </View>
        ))}
      </View>
      <Text style={st.dim}>
        {myTurn ? 'Your turn — flip two cards' : `${nameOf(state.turn)} is flipping…`}
        {'  ·  '}{state.pairsLeft} pairs left
      </Text>

      {/* board */}
      <View style={st.grid}>
        {state.cells.map((cell, i) => {
          const face = cellFace(cell, i);
          return (
            <Pressable
              key={i}
              disabled={!myTurn || cell.matched || face != null}
              onPress={() => move({ type: 'flip', index: i })}
              style={[
                st.cell,
                cell.matched && st.cellMatched,
                face != null && !cell.matched && st.cellFlipped,
              ]}>
              <Text style={{ fontSize: 26, opacity: cell.matched ? 0.45 : 1 }}>
                {face != null ? face : '❔'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Modal visible={!!ended} transparent animationType="slide">
        <View style={st.modalBg}>
          <View style={st.modalCard}>
            <Text style={st.title}>{ended && ended.cancelled ? 'Game cancelled' : '🏆 Results'}</Text>
            {(ended && ended.ranking || []).map((pid, i) => (
              <Text key={pid} style={[st.txt, { marginTop: 6 }]}>
                {['🥇', '🥈', '🥉'][i] || `${i + 1}.`} {nameOf(pid)}
                {state.scores[pid] != null ? `  · ${state.scores[pid]} pairs` : ''}
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
  root: { flex: 1, backgroundColor: colors.ink, paddingTop: 54, alignItems: 'center' },
  center: { justifyContent: 'center' },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  txt: { color: colors.text, fontSize: 14 },
  dim: { color: colors.dim, fontSize: 12, marginTop: 8, textAlign: 'center' },
  scoreRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 10 },
  scoreCell: {
    backgroundColor: colors.inkRaised, borderRadius: 12, paddingHorizontal: 12,
    paddingVertical: 6, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center',
  },
  scoreActive: { borderColor: colors.beam },
  scoreName: { color: colors.text, fontSize: 11, maxWidth: 80 },
  scoreVal: { color: colors.amber, fontSize: 13, fontWeight: '800' },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', width: 4 * 74 + 3 * 8,
    gap: 8, marginTop: 16, justifyContent: 'center',
  },
  cell: {
    width: 74, height: 74, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.inkRaised, borderWidth: 1.5, borderColor: colors.border,
  },
  cellFlipped: { borderColor: colors.cyan, backgroundColor: colors.cyan + '15' },
  cellMatched: { borderColor: colors.border, backgroundColor: colors.ink },
  modalBg: { flex: 1, backgroundColor: '#000B', alignItems: 'center', justifyContent: 'center' },
  modalCard: {
    backgroundColor: colors.inkRaised, borderRadius: 20, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border, minWidth: 260,
  },
  primaryBtn: { backgroundColor: colors.beam, paddingHorizontal: 26, paddingVertical: 12, borderRadius: 999 },
  primaryTxt: { color: '#fff', fontWeight: '700' },
});
