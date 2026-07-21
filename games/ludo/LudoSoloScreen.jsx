// LudoSoloScreen — fully client-side Ludo vs AI.
// No server required; uses the same rule-set as the backend.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createInitialState, rollDice, moveToken, cpuPickToken, getFinishedCount } from './ludoLogic';
import { colors } from '../theme';

const TINT = { red: '#FF4D6D', green: '#3DDC84', yellow: '#FFB454', blue: '#35E0D0' };
const HOME_BG = { red: '#2A0010', green: '#0A200A', yellow: '#2A1C00', blue: '#002828' };
const DIE_FACE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const CPU_ROLL_DELAY = 950;
const CPU_MOVE_DELAY = 600;

function tokenLabel(pos) {
  if (pos === 'home') return '●';
  if (pos === 'finished') return '✓';
  if (typeof pos === 'number' && pos >= 51) return `H${pos - 50}`;
  return typeof pos === 'number' ? String(pos + 1) : '?';
}

// ── Config screen ──────────────────────────────────────────────────────────────
function ConfigScreen({ onStart, onBack }) {
  const [cpuCount, setCpuCount] = useState(1);
  const [difficulty, setDifficulty] = useState('easy');

  return (
    <View style={cfg.root}>
      <Pressable onPress={onBack} style={cfg.backBtn} hitSlop={12}>
        <Text style={cfg.backTxt}>← Back</Text>
      </Pressable>

      <Text style={cfg.emoji}>🎲</Text>
      <Text style={cfg.title}>Ludo vs AI</Text>
      <Text style={cfg.subtitle}>The classic race home</Text>

      <View style={cfg.card}>
        <Text style={cfg.label}>AI Opponents</Text>
        <View style={cfg.pillRow}>
          {[1, 2, 3].map((n) => (
            <Pressable
              key={n}
              style={[cfg.pill, cpuCount === n && cfg.pillActive]}
              onPress={() => setCpuCount(n)}>
              <Text style={[cfg.pillTxt, cpuCount === n && cfg.pillTxtActive]}>
                {n} {n === 1 ? 'CPU' : 'CPUs'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={cfg.card}>
        <Text style={cfg.label}>Difficulty</Text>
        <View style={cfg.pillRow}>
          {[
            { id: 'easy', label: 'Easy', emoji: '😊' },
            { id: 'hard', label: 'Hard', emoji: '🔥' },
          ].map((d) => (
            <Pressable
              key={d.id}
              style={[cfg.pill, cfg.pillWide, difficulty === d.id && cfg.pillActive]}
              onPress={() => setDifficulty(d.id)}>
              <Text style={[cfg.pillTxt, difficulty === d.id && cfg.pillTxtActive]}>
                {d.emoji} {d.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable style={cfg.startBtn} onPress={() => onStart(cpuCount, difficulty)}>
        <Text style={cfg.startTxt}>Start Game</Text>
      </Pressable>
    </View>
  );
}

// ── Token circle ───────────────────────────────────────────────────────────────
function Token({ color, pos, selectable, onPress }) {
  const tint = TINT[color] || '#888';
  const bg = pos === 'home' ? HOME_BG[color] || '#1B2133' : tint + 'CC';
  return (
    <Pressable
      onPress={selectable ? onPress : undefined}
      style={[st.token, { backgroundColor: bg, borderColor: tint }, selectable && st.tokenActive]}>
      <Text style={[st.tokenTxt, { color: pos === 'home' ? tint : '#fff' }]}>
        {tokenLabel(pos)}
      </Text>
    </Pressable>
  );
}

// ── Player panel ───────────────────────────────────────────────────────────────
function PlayerPanel({ player, playerIdx, tokens, currentPlayerIdx, legalTokenIds, onMoveToken }) {
  const isActive = currentPlayerIdx === playerIdx;
  const tint = TINT[player.color] || '#888';
  const myTokens = [0, 1, 2, 3].map((i) => ({
    id: `${player.color}-${i}`,
    pos: tokens[`${player.color}-${i}`]?.pos ?? 'home',
  }));
  const doneCount = myTokens.filter((t) => t.pos === 'finished').length;

  return (
    <View style={[st.panel, isActive && { borderColor: tint }]}>
      <View style={st.panelHeader}>
        <View style={[st.colorDot, { backgroundColor: tint }]} />
        <Text style={[st.panelName, isActive && { color: tint }]} numberOfLines={1}>
          {player.displayName}
        </Text>
        {isActive && (
          <View style={[st.turnBadge, { backgroundColor: tint + '33', borderColor: tint }]}>
            <Text style={[st.turnBadgeTxt, { color: tint }]}>TURN</Text>
          </View>
        )}
        <Text style={[st.doneText, { color: tint }]}>{doneCount}/4 ✓</Text>
      </View>
      <View style={st.tokensRow}>
        {myTokens.map((t) => (
          <Token
            key={t.id}
            color={player.color}
            pos={t.pos}
            selectable={isActive && legalTokenIds.includes(t.id)}
            onPress={() => onMoveToken(t.id)}
          />
        ))}
      </View>
    </View>
  );
}

// ── End screen ─────────────────────────────────────────────────────────────────
function EndScreen({ gameState, onPlayAgain, onExit }) {
  const { players, tokens, winner } = gameState;
  const ranking = [...players].sort((a, b) => {
    if (a.userId === winner) return -1;
    if (b.userId === winner) return 1;
    return getFinishedCount(tokens, b.color) - getFinishedCount(tokens, a.color);
  });
  const isHumanWon = winner === 'player_0';

  return (
    <View style={[st.root, st.center]}>
      <Text style={st.emoji}>{isHumanWon ? '🏆' : '💀'}</Text>
      <Text style={st.bigTitle}>{isHumanWon ? 'You won!' : `${ranking[0]?.displayName} wins!`}</Text>
      <View style={{ marginVertical: 12, gap: 6 }}>
        {ranking.map((p, i) => (
          <Text key={p.userId} style={[st.listItem, i === 0 && st.winnerTxt]}>
            {i + 1}. {p.displayName} — {getFinishedCount(tokens, p.color)}/4 home
          </Text>
        ))}
      </View>
      <Pressable style={[st.primaryBtn, { marginTop: 24 }]} onPress={onPlayAgain}>
        <Text style={st.primaryTxt}>Play again</Text>
      </Pressable>
      <Pressable onPress={onExit} style={{ marginTop: 14 }}>
        <Text style={[st.sub, { color: colors.danger }]}>Exit</Text>
      </Pressable>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function LudoSoloScreen({ onExit }) {
  const [phase, setPhase] = useState('config');
  const [gameState, setGameState] = useState(null);
  const [difficulty, setDifficulty] = useState('easy');
  const cpuTimer = useRef(null);

  function startGame(cpuCount, diff) {
    if (cpuTimer.current) clearTimeout(cpuTimer.current);
    setDifficulty(diff);
    setGameState(createInitialState(cpuCount + 1));
    setPhase('game');
  }

  const handleRoll = useCallback(() => {
    if (!gameState || gameState.diceValue !== null) return;
    const { state } = rollDice(gameState);
    setGameState(state);
    if (state.winner) setPhase('end');
  }, [gameState]);

  const handleMoveToken = useCallback((tokenId) => {
    if (!gameState || !gameState.legalTokenIds.includes(tokenId)) return;
    const { state } = moveToken(gameState, tokenId);
    setGameState(state);
    if (state.winner) setPhase('end');
  }, [gameState]);

  // Auto-play CPU turns
  useEffect(() => {
    if (phase !== 'game' || !gameState || gameState.winner) return;
    const player = gameState.players[gameState.currentPlayerIndex];
    const isCpu = player.userId !== 'player_0';
    if (!isCpu) return;

    if (cpuTimer.current) clearTimeout(cpuTimer.current);

    if (gameState.diceValue === null) {
      cpuTimer.current = setTimeout(() => {
        const { state } = rollDice(gameState);
        setGameState(state);
        if (state.winner) setPhase('end');
      }, CPU_ROLL_DELAY);
    } else if (gameState.legalTokenIds.length > 0) {
      cpuTimer.current = setTimeout(() => {
        const tokenId = cpuPickToken(gameState, difficulty);
        if (tokenId) {
          const { state } = moveToken(gameState, tokenId);
          setGameState(state);
          if (state.winner) setPhase('end');
        }
      }, CPU_MOVE_DELAY);
    }

    return () => { if (cpuTimer.current) clearTimeout(cpuTimer.current); };
  }, [gameState, phase, difficulty]);

  if (phase === 'config') {
    return <ConfigScreen onStart={startGame} onBack={onExit} />;
  }

  if (phase === 'end' && gameState) {
    return (
      <EndScreen
        gameState={gameState}
        onPlayAgain={() => { setPhase('config'); setGameState(null); }}
        onExit={onExit}
      />
    );
  }

  if (!gameState) return null;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer.userId === 'player_0';
  const canRoll = isMyTurn && gameState.diceValue === null;
  const canMove = isMyTurn && gameState.legalTokenIds.length > 0;

  return (
    <View style={st.root}>
      <View style={st.topBar}>
        <Pressable onPress={() => { if (cpuTimer.current) clearTimeout(cpuTimer.current); setPhase('config'); setGameState(null); }} hitSlop={12}>
          <Text style={[st.sub, { fontSize: 12 }]}>← Exit</Text>
        </Pressable>
        <Text style={st.topTitle}>Ludo vs AI</Text>
        <Text style={[st.sub, { fontSize: 12, textAlign: 'right', flex: 1 }]} numberOfLines={1}>
          {isMyTurn
            ? (canRoll ? 'Your turn — roll!' : 'Tap a token to move')
            : `${currentPlayer.displayName} thinking…`}
        </Text>
      </View>

      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        {gameState.players.map((p, i) => (
          <PlayerPanel
            key={p.userId}
            player={p}
            playerIdx={i}
            tokens={gameState.tokens}
            currentPlayerIdx={gameState.currentPlayerIndex}
            legalTokenIds={gameState.legalTokenIds}
            onMoveToken={handleMoveToken}
          />
        ))}

        <View style={st.dieCard}>
          <Text style={st.dieFace}>
            {gameState.diceValue != null ? (DIE_FACE[gameState.diceValue] ?? `${gameState.diceValue}`) : '🎲'}
          </Text>
          {gameState.diceValue != null && (
            <Text style={[st.sub, { marginTop: 2 }]}>
              Rolled {gameState.diceValue}{gameState.diceValue === 6 ? ' — extra turn! 🎉' : ''}
            </Text>
          )}
          {canRoll && (
            <Pressable style={st.rollBtn} onPress={handleRoll}>
              <Text style={st.rollTxt}>Roll the die</Text>
            </Pressable>
          )}
          {canMove && (
            <Text style={[st.sub, { marginTop: 10, textAlign: 'center' }]}>
              Tap a glowing token above
            </Text>
          )}
          {!isMyTurn && (
            <Text style={[st.sub, { marginTop: 10, textAlign: 'center' }]}>
              {currentPlayer.displayName} is thinking…
            </Text>
          )}
        </View>

        <View style={st.legend}>
          {gameState.players.map((p) => (
            <View key={p.userId} style={st.legendItem}>
              <View style={[st.colorDot, { backgroundColor: TINT[p.color] }]} />
              <Text style={[st.sub, { fontSize: 10 }]}>{p.displayName}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const cfg = StyleSheet.create({
  root: {
    flex: 1, backgroundColor: colors.ink, padding: 24,
    paddingTop: 60, alignItems: 'center',
  },
  backBtn: { position: 'absolute', top: 54, left: 20 },
  backTxt: { color: colors.dim, fontSize: 13 },
  emoji: { fontSize: 56, marginTop: 32, marginBottom: 8 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: colors.dim, fontSize: 14, marginBottom: 28 },
  card: {
    width: '100%', backgroundColor: colors.inkRaised, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12,
  },
  label: { color: colors.dim, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  pillRow: { flexDirection: 'row', gap: 8 },
  pill: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: colors.ink, borderWidth: 1, borderColor: colors.border,
  },
  pillWide: { flex: 1 },
  pillActive: { backgroundColor: '#8B7CFF22', borderColor: '#8B7CFF' },
  pillTxt: { color: colors.dim, fontSize: 13, fontWeight: '600' },
  pillTxtActive: { color: '#8B7CFF' },
  startBtn: {
    width: '100%', backgroundColor: '#8B7CFF', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  startTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
});

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  scroll: { padding: 16, paddingBottom: 40 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingTop: 54, paddingBottom: 10, gap: 8,
  },
  topTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },

  panel: {
    backgroundColor: colors.inkRaised, borderRadius: 14, borderWidth: 1,
    borderColor: colors.border, padding: 12, marginBottom: 10,
  },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  panelName: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '600' },
  turnBadge: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1,
  },
  turnBadgeTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  doneText: { fontSize: 11, fontWeight: '700' },
  tokensRow: { flexDirection: 'row', gap: 8 },

  token: {
    flex: 1, aspectRatio: 1, maxWidth: 64, borderRadius: 32, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  tokenActive: { borderColor: '#fff', borderWidth: 3 },
  tokenTxt: { fontSize: 13, fontWeight: '800' },

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

  emoji: { fontSize: 52, marginBottom: 8 },
  bigTitle: { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 6 },
  sub: { color: colors.dim, fontSize: 13 },
  listItem: { color: colors.text, fontSize: 14 },
  winnerTxt: { color: '#FFD700', fontWeight: '700', fontSize: 16 },
  primaryBtn: {
    backgroundColor: '#8B7CFF', paddingHorizontal: 36, paddingVertical: 14, borderRadius: 12,
  },
  primaryTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
