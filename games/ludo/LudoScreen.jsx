// Ludo — 2-4 players. Classic board game.
// Same props contract as WildBeam/MatchBlitz.
//
// Visual: each player panel shows their 4 pawns as tappable circles.
// Home-base pawn = filled dot. Track position shown as number (1-52).
// Home-stretch position shown as H1-H6. Finished = ✓.
// Highlighted (selectable) pawns glow white when it's your turn to choose.

import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useGameSocket } from '../useGameSocket';
import { colors } from '../theme';

const TINT = {
  beam:    '#8B7CFF',
  amber:   '#FFB454',
  crimson: '#FF4D6D',
  cyan:    '#35E0D0',
};
const HOME_BG = {
  beam:    '#150D2F',
  amber:   '#2A1C00',
  crimson: '#2A0010',
  cyan:    '#002828',
};

const DIE_FACE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function pawnLabel(pos) {
  if (pos === -1)  return '●';          // home base
  if (pos >= 58)   return '✓';          // finished
  if (pos >= 52)   return `H${pos - 51}`; // home stretch
  return String(pos + 1);              // main track 1-52
}

function Pawn({ color, pos, selectable, onPress }) {
  const tint = TINT[color] || '#888';
  const atHome = pos === -1;
  const bg = atHome ? HOME_BG[color] || '#1B2133' : tint + 'DD';

  return (
    <Pressable
      onPress={selectable ? onPress : undefined}
      style={[
        st.pawn,
        { backgroundColor: bg, borderColor: tint },
        selectable && st.pawnActive,
      ]}
    >
      <Text style={[st.pawnTxt, { color: atHome ? tint : '#fff' }]}>
        {pawnLabel(pos)}
      </Text>
    </Pressable>
  );
}

function PlayerPanel({ player, meId, isCurrentTurn, options, onMovePawn }) {
  const isMe = player.id === meId;
  const tint = TINT[player.color] || '#888';

  return (
    <View style={[st.panel, isCurrentTurn && { borderColor: tint }]}>
      <View style={st.panelHeader}>
        <View style={[st.dot, { backgroundColor: tint }]} />
        <Text style={[st.panelName, isCurrentTurn && { color: tint }]} numberOfLines={1}>
          {isMe ? 'You' : player.id.slice(0, 8)}
        </Text>
        {isCurrentTurn && (
          <View style={[st.turnBadge, { backgroundColor: tint + '33', borderColor: tint }]}>
            <Text style={[st.turnBadgeTxt, { color: tint }]}>TURN</Text>
          </View>
        )}
        <Text style={[st.done, { color: tint }]}>{player.done}/4 ✓</Text>
      </View>

      <View style={st.pawnsRow}>
        {player.pawns.map((pos, i) => (
          <Pawn
            key={i}
            color={player.color}
            pos={pos}
            selectable={isMe && isCurrentTurn && options.includes(i)}
            onPress={() => onMovePawn(i)}
          />
        ))}
      </View>
    </View>
  );
}

export default function LudoScreen({ socket, sessionId, meId, playersMeta = {}, onExit }) {
  const { state, lobby, ended, move, start, leave } = useGameSocket(socket, sessionId);

  const nameOf = useCallback(
    (pid) => (playersMeta[pid]?.name) || (pid === meId ? 'You' : pid.slice(0, 8)),
    [playersMeta, meId],
  );

  function handleRoll() {
    move({ type: 'roll' }, (res) => {
      if (res?.error) console.warn('[ludo]', res.error);
    });
  }

  function handleMovePawn(pawnIdx) {
    move({ type: 'move_pawn', pawnIdx }, (res) => {
      if (res?.error) console.warn('[ludo]', res.error);
    });
  }

  // ── lobby ─────────────────────────────────────────────────────────────────
  if (!state && lobby) {
    const isHost = lobby.hostId === meId;
    return (
      <View style={[st.root, st.center]}>
        <Text style={st.emoji}>🎲</Text>
        <Text style={st.bigTitle}>Ludo</Text>
        <Text style={st.sub}>{lobby.players.length} / 4 players joined</Text>
        <View style={{ marginVertical: 12, gap: 6 }}>
          {lobby.players.map((p) => (
            <Text key={p} style={st.listItem}>• {nameOf(p)}</Text>
          ))}
        </View>
        {isHost ? (
          <Pressable style={st.primaryBtn} onPress={() => start()}>
            <Text style={st.primaryTxt}>Start game</Text>
          </Pressable>
        ) : (
          <Text style={st.sub}>Waiting for host to start…</Text>
        )}
        <Pressable onPress={() => { leave(); onExit?.(); }} style={{ marginTop: 20 }}>
          <Text style={[st.sub, { color: colors.danger }]}>Leave</Text>
        </Pressable>
      </View>
    );
  }

  // ── ended / winner declared ────────────────────────────────────────────────
  if (ended) {
    return (
      <View style={[st.root, st.center]}>
        <Text style={st.emoji}>🏆</Text>
        <Text style={st.bigTitle}>Game over!</Text>
        {(ended.ranking || []).map((r, i) => (
          <Text key={r.id} style={[st.listItem, i === 0 && st.winner]}>
            {i + 1}. {nameOf(r.id)} — {r.done}/4 home
          </Text>
        ))}
        <Pressable style={[st.primaryBtn, { marginTop: 24 }]} onPress={() => onExit?.()}>
          <Text style={st.primaryTxt}>Exit</Text>
        </Pressable>
      </View>
    );
  }

  if (!state) {
    return (
      <View style={[st.root, st.center]}>
        <Text style={st.sub}>Joining…</Text>
      </View>
    );
  }

  const myTurn = state.turn === meId;
  const canRoll = myTurn && state.phase === 'roll';
  const canMove = myTurn && state.phase === 'move';

  // ── game ──────────────────────────────────────────────────────────────────
  return (
    <View style={st.root}>
      {/* status bar */}
      <View style={st.topBar}>
        <Pressable onPress={() => { leave(); onExit?.(); }} hitSlop={12}>
          <Text style={[st.sub, { fontSize: 12 }]}>← Exit</Text>
        </Pressable>
        <Text style={st.topTitle}>Ludo</Text>
        <Text style={[st.sub, { fontSize: 12, textAlign: 'right', flex: 1 }]} numberOfLines={1}>
          {myTurn
            ? (canRoll ? 'Your turn — roll!' : 'Tap a pawn to move')
            : `${nameOf(state.turn)}'s turn`}
        </Text>
      </View>

      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>

        {/* player panels */}
        {state.players.map((p) => (
          <PlayerPanel
            key={p.id}
            player={p}
            meId={meId}
            isCurrentTurn={state.turn === p.id}
            options={state.turn === p.id && state.phase === 'move' && p.id === meId
              ? state.options : []}
            onMovePawn={handleMovePawn}
          />
        ))}

        {/* die + action */}
        <View style={st.dieCard}>
          <Text style={st.dieFace}>
            {state.die != null ? DIE_FACE[state.die] ?? `${state.die}` : '🎲'}
          </Text>
          {state.die != null && (
            <Text style={[st.sub, { marginTop: 2 }]}>
              Rolled {state.die}{state.die === 6 ? ' — extra turn! 🎉' : ''}
            </Text>
          )}

          {canRoll && (
            <Pressable style={st.rollBtn} onPress={handleRoll}>
              <Text style={st.rollTxt}>Roll the die</Text>
            </Pressable>
          )}
          {canMove && (
            <Text style={[st.sub, { marginTop: 10, textAlign: 'center' }]}>
              Tap a glowing pawn above to move it
            </Text>
          )}
          {!myTurn && (
            <Text style={[st.sub, { marginTop: 10, textAlign: 'center' }]}>
              Waiting for {nameOf(state.turn)}…
            </Text>
          )}
        </View>

        {/* legend */}
        <View style={st.legend}>
          {state.players.map((p) => (
            <View key={p.id} style={st.legendItem}>
              <View style={[st.dot, { backgroundColor: TINT[p.color] }]} />
              <Text style={[st.sub, { fontSize: 10 }]}>{nameOf(p.id)}</Text>
            </View>
          ))}
        </View>

        {/* inline win banner */}
        {state.winner != null && (
          <View style={st.winBanner}>
            <Text style={st.winTxt}>🏆 {nameOf(state.winner)} wins!</Text>
            <Pressable style={[st.primaryBtn, { marginTop: 12 }]} onPress={() => onExit?.()}>
              <Text style={st.primaryTxt}>Exit</Text>
            </Pressable>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  scroll: { padding: 16, paddingBottom: 40 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16,
    paddingBottom: 8, gap: 8,
  },
  topTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },

  panel: {
    backgroundColor: colors.inkRaised, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 10,
  },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  panelName: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '600' },
  turnBadge: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1,
  },
  turnBadgeTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  done: { fontSize: 11, fontWeight: '700' },
  pawnsRow: { flexDirection: 'row', gap: 8 },

  pawn: {
    flex: 1, aspectRatio: 1, maxWidth: 64, borderRadius: 32, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  pawnActive: { borderColor: '#fff', borderWidth: 3 },
  pawnTxt: { fontSize: 13, fontWeight: '800' },

  dieCard: {
    backgroundColor: colors.inkRaised, borderRadius: 14, borderWidth: 1,
    borderColor: colors.border, padding: 20, alignItems: 'center', marginBottom: 10,
  },
  dieFace: { fontSize: 64, lineHeight: 72 },

  rollBtn: {
    marginTop: 16, backgroundColor: '#8B7CFF', paddingHorizontal: 44,
    paddingVertical: 15, borderRadius: 14,
  },
  rollTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },

  legend: { flexDirection: 'row', gap: 16, justifyContent: 'center', marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },

  winBanner: {
    backgroundColor: '#1a1208', borderRadius: 14, borderWidth: 1,
    borderColor: '#FFD700', padding: 20, alignItems: 'center',
  },
  winTxt: { color: '#FFD700', fontSize: 22, fontWeight: '800' },

  emoji:      { fontSize: 52, marginBottom: 8 },
  bigTitle:   { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 6 },
  sub:        { color: colors.dim, fontSize: 13 },
  listItem:   { color: colors.text, fontSize: 14 },
  winner:     { color: '#FFD700', fontWeight: '700', fontSize: 16 },
  primaryBtn: {
    backgroundColor: '#8B7CFF', paddingHorizontal: 36, paddingVertical: 14, borderRadius: 12,
  },
  primaryTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
