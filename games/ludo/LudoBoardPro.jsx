/**
 * LudoBoardPro.jsx — Real classic Ludo board for WatchParty (React Native / Expo)
 * ------------------------------------------------------------------------------
 * ✅ Full 15×15 cross board (bases, 52-cell track, home columns, center goal)
 * ✅ 3D-tilted board + 3D-styled tokens & rolling die
 * ✅ Complete rules: roll 6 to leave base, captures, safe stars, blockade-safe
 *    stacks, exact roll to finish, extra turn on 6 / capture / finish,
 *    three-sixes forfeit
 * ✅ Hop-by-hop token animation, capture "sent home" animation
 * ✅ CPU AI opponent (heuristic), auto-move when only one legal move
 * ✅ Supports 2–4 players (human or cpu) via the `players` prop
 *
 * Install (if not already):  npx expo install react-native-svg
 */

import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  View, Text, Pressable, Animated, Easing, Dimensions, StyleSheet,
} from 'react-native';
import Svg, {
  Rect, Circle, Polygon, Defs, LinearGradient, RadialGradient, Stop, G,
} from 'react-native-svg';

/* ────────────────────────────── GEOMETRY ────────────────────────────── */

const SCREEN_W = Dimensions.get('window').width;
const BOARD = Math.min(SCREEN_W - 20, 420);
const CELL = BOARD / 15;
const TOKEN = CELL * 0.98;

const ORDER = ['red', 'green', 'yellow', 'blue'];

const THEME = {
  bg: '#0b0e17',
  card: '#141927',
  cardBorder: '#232a3d',
  text: '#e8ecf6',
  sub: '#8b93a7',
  button: '#8b8cf8',
};

const C = {
  red:    { main: '#f43f5e', dark: '#9f1239', light: '#fb7185', pale: '#ffe1e8' },
  green:  { main: '#22c55e', dark: '#166534', light: '#4ade80', pale: '#dcfce7' },
  yellow: { main: '#f59e0b', dark: '#92400e', light: '#fcd34d', pale: '#fef3c7' },
  blue:   { main: '#3b82f6', dark: '#1e40af', light: '#60a5fa', pale: '#dbeafe' },
};

// 52-cell main track, clockwise, index 0 = red's start cell. [col,row] on 15×15 grid.
const TRACK = [
  [1,6],[2,6],[3,6],[4,6],[5,6],
  [6,5],[6,4],[6,3],[6,2],[6,1],[6,0],
  [7,0],[8,0],
  [8,1],[8,2],[8,3],[8,4],[8,5],
  [9,6],[10,6],[11,6],[12,6],[13,6],[14,6],
  [14,7],[14,8],
  [13,8],[12,8],[11,8],[10,8],[9,8],
  [8,9],[8,10],[8,11],[8,12],[8,13],[8,14],
  [7,14],[6,14],
  [6,13],[6,12],[6,11],[6,10],[6,9],
  [5,8],[4,8],[3,8],[2,8],[1,8],[0,8],
  [0,7],[0,6],
];

const START = { red: 0, green: 13, yellow: 26, blue: 39 };

// 5 colored home-column cells per color (6th step = center goal, pos 56)
const HOME_COL = {
  red:    [[1,7],[2,7],[3,7],[4,7],[5,7]],
  green:  [[7,1],[7,2],[7,3],[7,4],[7,5]],
  yellow: [[13,7],[12,7],[11,7],[10,7],[9,7]],
  blue:   [[7,13],[7,12],[7,11],[7,10],[7,9]],
};

const BASE_ORIGIN = { red: [0,0], green: [9,0], yellow: [9,9], blue: [0,9] };
const BASE_SLOTS = [[1.5,1.5],[3.5,1.5],[1.5,3.5],[3.5,3.5]];
const FINISH_POS = { red: [6.7,7.5], green: [7.5,6.7], yellow: [8.3,7.5], blue: [7.5,8.3] };

const STAR_ABS = [8, 21, 34, 47];
const START_ABS = [0, 13, 26, 39];
const SAFE_ABS = new Set([...STAR_ABS, ...START_ABS]);
const BOOST_ABS = [4, 17, 30, 43];

function cellFor(color, pos, i) {
  if (pos === -1) {
    const o = BASE_ORIGIN[color], s = BASE_SLOTS[i];
    return { key: `b-${color}-${i}`, cx: (o[0] + s[0] + 0.5) * CELL, cy: (o[1] + s[1] + 0.5) * CELL };
  }
  if (pos <= 50) {
    const abs = (START[color] + pos) % 52;
    const [c, r] = TRACK[abs];
    return { key: `t-${abs}`, cx: (c + 0.5) * CELL, cy: (r + 0.5) * CELL };
  }
  if (pos <= 55) {
    const [c, r] = HOME_COL[color][pos - 51];
    return { key: `h-${color}-${pos}`, cx: (c + 0.5) * CELL, cy: (r + 0.5) * CELL };
  }
  const f = FINISH_POS[color];
  return { key: `f-${color}`, cx: f[0] * CELL, cy: f[1] * CELL };
}

function pixelFor(color, pos, i) {
  const { cx, cy } = cellFor(color, pos, i);
  return { x: cx - TOKEN / 2, y: cy - TOKEN / 2 };
}

function groupPattern(n) {
  if (n <= 1) return { s: 1, o: [[0, 0]] };
  if (n === 2) return { s: 0.72, o: [[-0.21, -0.1], [0.21, 0.1]] };
  if (n === 3) return { s: 0.6, o: [[0, -0.21], [-0.22, 0.17], [0.22, 0.17]] };
  if (n === 4) return { s: 0.55, o: [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]] };
  const o = [];
  for (let k = 0; k < n; k++) {
    const a = (2 * Math.PI * k) / n - Math.PI / 2;
    o.push([0.27 * Math.cos(a), 0.27 * Math.sin(a)]);
  }
  return { s: 0.45, o };
}

function computeLayout(tokens) {
  const groups = {};
  Object.keys(tokens).forEach(color => tokens[color].forEach((pos, i) => {
    const c = cellFor(color, pos, i);
    (groups[c.key] = groups[c.key] || []).push({ color, i, cx: c.cx, cy: c.cy });
  }));
  const layout = {};
  Object.keys(tokens).forEach(c => { layout[c] = []; });
  Object.values(groups).forEach(g => {
    g.sort((a, b) => ORDER.indexOf(a.color) - ORDER.indexOf(b.color) || a.i - b.i);
    const { s, o } = groupPattern(g.length);
    g.forEach((m, k) => {
      layout[m.color][m.i] = {
        x: m.cx + o[k][0] * CELL - TOKEN / 2,
        y: m.cy + o[k][1] * CELL - TOKEN / 2,
        scale: s,
      };
    });
  });
  return layout;
}

function groupBadges(tokens) {
  const map = {};
  Object.keys(tokens).forEach(color => tokens[color].forEach((pos, i) => {
    if (pos === -1) return;
    const c = cellFor(color, pos, i);
    map[c.key] = map[c.key] || { cx: c.cx, cy: c.cy, n: 0 };
    map[c.key].n++;
  }));
  return Object.values(map).filter(g => g.n >= 3);
}

function starPath(cx, cy, r) {
  const pts = [];
  for (let k = 0; k < 10; k++) {
    const rad = k % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    pts.push(`${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`);
  }
  return pts.join(' ');
}

function boltPath(cx, cy, h) {
  const p = [[0.08, -0.5], [-0.24, 0.1], [-0.02, 0.1], [-0.08, 0.5], [0.24, -0.1], [0.02, -0.1]];
  return p.map(([x, y]) => `${cx + x * h},${cy + y * h}`).join(' ');
}

/* ────────────────────────────── GAME LOGIC ────────────────────────────── */

const absOf = (color, pos) => (START[color] + pos) % 52;

function legalMoves(tokens, color, dice) {
  const res = [];
  tokens[color].forEach((pos, i) => {
    if (pos === -1) { if (dice === 6) res.push(i); }
    else if (pos + dice <= 56) res.push(i);
  });
  return res;
}

function initState({ players, mode }) {
  const tokens = {}; const shields = {};
  players.forEach(p => {
    tokens[p.color] = mode === 'power' ? [0, -1, -1, -1] : [-1, -1, -1, -1];
    shields[p.color] = [false, false, false, false];
  });
  return {
    players, mode, tokens, shields,
    turnIdx: 0, dice: null,
    phase: 'ROLL',
    legal: [], sixChain: 0,
    passExtra: false, winner: null,
    message: mode === 'power' ? 'Power Ludo — grab 🛡 shields & ⚡ boosts!' : 'Roll to start!',
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'ROLLED': {
      const v = action.value;
      const color = state.players[state.turnIdx].color;
      if (v === 6 && state.sixChain >= 2) {
        return { ...state, dice: v, phase: 'PASSING', passExtra: false,
          sixChain: 0, legal: [], message: 'Three 6s in a row — turn lost!' };
      }
      const chain = v === 6 ? state.sixChain + 1 : 0;
      const legal = legalMoves(state.tokens, color, v);
      if (legal.length === 0) {
        return { ...state, dice: v, sixChain: chain, legal: [],
          phase: 'PASSING', passExtra: v === 6,
          message: v === 6 ? 'No move — but 6 rolls again!' : `Rolled ${v} — no moves` };
      }
      return { ...state, dice: v, sixChain: chain, legal, phase: 'MOVE',
        message: v === 6 ? 'Rolled 6! Pick a token' : `Rolled ${v} — pick a token` };
    }

    case 'CHOOSE': {
      const { tIdx } = action;
      const color = state.players[state.turnIdx].color;
      if (state.phase !== 'MOVE' || !state.legal.includes(tIdx)) return state;

      const power = state.mode === 'power';
      const tokens = { ...state.tokens, [color]: [...state.tokens[color]] };
      const shields = {};
      Object.keys(state.shields).forEach(k => { shields[k] = [...state.shields[k]]; });
      const cur = tokens[color][tIdx];
      const dice = state.dice;
      let newPos = cur === -1 ? 0 : cur + dice;

      let captured = false, blocked = false, boosted = false, gotShield = false;

      const resolveCell = pos => {
        if (pos < 0 || pos > 50) return;
        const abs = absOf(color, pos);
        if (!SAFE_ABS.has(abs)) {
          ORDER.forEach(oc => {
            if (oc === color || !tokens[oc]) return;
            const there = tokens[oc]
              .map((p, j) => ({ p, j }))
              .filter(t => t.p >= 0 && t.p <= 50 && absOf(oc, t.p) === abs);
            if (there.length === 1) {
              const { j } = there[0];
              if (power && shields[oc][j]) {
                shields[oc][j] = false;
                blocked = true;
              } else {
                tokens[oc] = [...tokens[oc]];
                tokens[oc][j] = -1;
                shields[oc][j] = false;
                captured = true;
              }
            }
          });
        }
        if (power && STAR_ABS.includes(abs) && !shields[color][tIdx]) {
          shields[color][tIdx] = true;
          gotShield = true;
        }
      };

      resolveCell(newPos);
      if (power && newPos <= 50 && BOOST_ABS.includes(absOf(color, newPos)) && newPos + 3 <= 56) {
        newPos += 3; boosted = true;
        resolveCell(newPos);
      }
      tokens[color][tIdx] = newPos;
      if (newPos > 50) shields[color][tIdx] = false;

      const finished = newPos === 56;
      const won = tokens[color].every(p => p === 56);
      if (won) {
        return { ...state, tokens, shields, phase: 'END', winner: color, legal: [],
          message: `${state.players[state.turnIdx].name} wins! 🏆` };
      }
      const extra = dice === 6 || captured || finished;
      const bits = [];
      if (boosted) bits.push('⚡ Boost +3!');
      if (gotShield) bits.push('🛡 Shield gained!');
      if (blocked) bits.push('🛡 Shield blocked the capture!');
      if (extra) {
        bits.push(captured ? 'Captured! 🎯 Roll again'
          : finished ? 'Token home! 🏠 Roll again' : '6! Roll again');
        return { ...state, tokens, shields, dice: null, legal: [], phase: 'ROLL',
          message: bits.join(' ') };
      }
      const turnIdx = (state.turnIdx + 1) % state.players.length;
      bits.push(`${state.players[turnIdx].name}'s turn`);
      return { ...state, tokens, shields, dice: null, legal: [], phase: 'ROLL',
        turnIdx, sixChain: 0, message: bits.join(' ') };
    }

    case 'NEXT': {
      if (state.passExtra) {
        return { ...state, dice: null, legal: [], phase: 'ROLL',
          passExtra: false, message: 'Roll again!' };
      }
      const turnIdx = (state.turnIdx + 1) % state.players.length;
      return { ...state, dice: null, legal: [], phase: 'ROLL',
        turnIdx, sixChain: 0, passExtra: false,
        message: `${state.players[turnIdx].name}'s turn` };
    }

    case 'RESET':
      return initState({ players: state.players, mode: state.mode });

    default:
      return state;
  }
}

function aiPick(state) {
  const color = state.players[state.turnIdx].color;
  const dice = state.dice;
  let best = state.legal[0], bestScore = -Infinity;

  state.legal.forEach(i => {
    const cur = state.tokens[color][i];
    const np = cur === -1 ? 0 : cur + dice;
    let s = 0;
    if (np === 56) s += 100;
    if (cur === -1) s += 55;
    if (np >= 51 && np < 56) s += 40;
    if (np <= 50) {
      const abs = absOf(color, np);
      if (SAFE_ABS.has(abs)) s += 22;
      ORDER.forEach(oc => {
        if (oc === color || !state.tokens[oc]) return;
        const hits = state.tokens[oc]
          .map((p, j) => ({ p, j }))
          .filter(t => t.p >= 0 && t.p <= 50 && absOf(oc, t.p) === abs);
        if (hits.length === 1 && !SAFE_ABS.has(abs)) {
          s += state.mode === 'power' && state.shields[oc][hits[0].j] ? 28 : 85;
        }
      });
      if (state.mode === 'power' && BOOST_ABS.includes(abs)) s += 20;
      ORDER.forEach(oc => {
        if (oc === color || !state.tokens[oc]) return;
        state.tokens[oc].forEach(p => {
          if (p < 0 || p > 50) return;
          const d = (abs - absOf(oc, p) + 52) % 52;
          if (d >= 1 && d <= 6) s -= 14;
        });
      });
    }
    s += (cur === -1 ? 0 : cur) * 0.35;
    s += Math.random() * 2;
    if (s > bestScore) { bestScore = s; best = i; }
  });
  return best;
}

/* ────────────────────────────── BOARD (SVG) ────────────────────────────── */

const BoardSVG = React.memo(function BoardSVG({ activeColors, mode }) {
  const cells = [];

  TRACK.forEach(([c, r], idx) => {
    const isStart = START_ABS.includes(idx);
    const isStar = STAR_ABS.includes(idx);
    const isBoost = mode === 'power' && BOOST_ABS.includes(idx);
    let fill = 'url(#cellG)';
    if (isStart) {
      const col = ORDER.find(k => START[k] === idx);
      fill = C[col].main;
    }
    cells.push(
      <Rect key={`t${idx}`} x={c * CELL} y={r * CELL} width={CELL} height={CELL}
        fill={fill} stroke="#c9ced9" strokeWidth={0.8} />,
    );
    if (isBoost) {
      cells.push(
        <G key={`bz${idx}`}>
          <Rect x={c * CELL} y={r * CELL} width={CELL} height={CELL}
            fill="rgba(139,140,248,0.30)" stroke="#8b8cf8" strokeWidth={1} />
          <Polygon points={boltPath((c + 0.5) * CELL, (r + 0.5) * CELL, CELL * 0.62)}
            fill="#8b8cf8" stroke="#fff" strokeWidth={0.8} />
        </G>,
      );
    }
    if (isStar) {
      cells.push(
        <Polygon key={`s${idx}`} points={starPath((c + 0.5) * CELL, (r + 0.5) * CELL, CELL * 0.34)}
          fill="#aab2c2" stroke="#8b93a7" strokeWidth={0.7} />,
      );
    }
    if (isStart) {
      cells.push(
        <Polygon key={`ss${idx}`} points={starPath((c + 0.5) * CELL, (r + 0.5) * CELL, CELL * 0.32)}
          fill="rgba(255,255,255,0.9)" />,
      );
    }
  });

  ORDER.forEach(col => {
    HOME_COL[col].forEach(([c, r], i) => {
      cells.push(
        <Rect key={`h${col}${i}`} x={c * CELL} y={r * CELL} width={CELL} height={CELL}
          fill={C[col].main} opacity={0.92} stroke="#c9ced9" strokeWidth={0.8} />,
      );
    });
  });

  const bases = ORDER.map(col => {
    const [oc, or] = BASE_ORIGIN[col];
    const x = oc * CELL, y = or * CELL, S = 6 * CELL;
    const dim = !activeColors.has(col);
    return (
      <G key={`b${col}`} opacity={dim ? 0.35 : 1}>
        <Rect x={x} y={y} width={S} height={S} fill={`url(#g-${col})`} />
        <Rect x={x + CELL * 0.85} y={y + CELL * 0.85} width={S - CELL * 1.7} height={S - CELL * 1.7}
          rx={CELL * 0.7} fill="url(#baseInner)" stroke={C[col].dark} strokeWidth={1.5} />
        {BASE_SLOTS.map((s, i) => (
          <Circle key={i} cx={x + (s[0] + 0.5) * CELL} cy={y + (s[1] + 0.5) * CELL}
            r={CELL * 0.62} fill={C[col].pale} stroke={C[col].main} strokeWidth={2} />
        ))}
      </G>
    );
  });

  const m = 6 * CELL, M = 9 * CELL, ctr = 7.5 * CELL;
  const center = (
    <G key="center">
      <Rect x={m} y={m} width={3 * CELL} height={3 * CELL} fill="#fff" />
      <Polygon points={`${m},${m} ${m},${M} ${ctr},${ctr}`} fill={C.red.main} />
      <Polygon points={`${m},${m} ${M},${m} ${ctr},${ctr}`} fill={C.green.main} />
      <Polygon points={`${M},${m} ${M},${M} ${ctr},${ctr}`} fill={C.yellow.main} />
      <Polygon points={`${m},${M} ${M},${M} ${ctr},${ctr}`} fill={C.blue.main} />
      <Circle cx={ctr} cy={ctr} r={CELL * 0.5} fill="url(#goalG)" stroke="#fff" strokeWidth={2} />
      <Polygon points={starPath(ctr, ctr, CELL * 0.3)} fill="#fff" />
    </G>
  );

  const arrows = ORDER.map(col => {
    const [c, r] = TRACK[(START[col] + 51) % 52];
    return (
      <Circle key={`a${col}`} cx={(c + 0.5) * CELL} cy={(r + 0.5) * CELL}
        r={CELL * 0.16} fill={C[col].main} />
    );
  });

  return (
    <Svg width={BOARD} height={BOARD}>
      <Defs>
        <LinearGradient id="cellG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffffff" />
          <Stop offset="1" stopColor="#eef0f5" />
        </LinearGradient>
        <LinearGradient id="baseInner" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffffff" />
          <Stop offset="1" stopColor="#e8eaf0" />
        </LinearGradient>
        <RadialGradient id="goalG" cx="35%" cy="30%" r="80%">
          <Stop offset="0" stopColor="#4b5563" />
          <Stop offset="1" stopColor="#111827" />
        </RadialGradient>
        {ORDER.map(col => (
          <LinearGradient key={col} id={`g-${col}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={C[col].light} />
            <Stop offset="1" stopColor={C[col].dark} />
          </LinearGradient>
        ))}
      </Defs>
      <Rect x={0} y={0} width={BOARD} height={BOARD} rx={10} fill="#dde1ea" />
      {cells}
      {bases}
      {center}
      {arrows}
      <Rect x={1} y={1} width={BOARD - 2} height={BOARD - 2} rx={10}
        fill="none" stroke="#0b0e17" strokeWidth={2.5} />
    </Svg>
  );
});

/* ────────────────────────────── TOKEN ────────────────────────────── */

function TokenChip({ color, selectable, onPress, pulse, shielded }) {
  return (
    <Pressable onPress={onPress} disabled={!selectable} hitSlop={6}
      style={{ width: TOKEN, height: TOKEN, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute', bottom: -1, width: TOKEN * 0.7, height: TOKEN * 0.24,
        borderRadius: TOKEN, backgroundColor: 'rgba(0,0,0,0.38)',
      }} />
      {selectable && (
        <Animated.View style={{
          position: 'absolute', width: TOKEN * 1.22, height: TOKEN * 1.22,
          borderRadius: TOKEN, borderWidth: 2.5, borderColor: '#ffffff',
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.95] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] }) }],
        }} />
      )}
      <Svg width={TOKEN} height={TOKEN} style={{ marginTop: -TOKEN * 0.08 }}>
        <Defs>
          <RadialGradient id={`tk-${color}`} cx="33%" cy="28%" r="85%">
            <Stop offset="0" stopColor={C[color].light} />
            <Stop offset="0.55" stopColor={C[color].main} />
            <Stop offset="1" stopColor={C[color].dark} />
          </RadialGradient>
        </Defs>
        <Circle cx={TOKEN / 2} cy={TOKEN / 2} r={TOKEN * 0.44}
          fill={`url(#tk-${color})`} stroke="#ffffff" strokeWidth={2.2} />
        <Circle cx={TOKEN / 2} cy={TOKEN / 2} r={TOKEN * 0.2}
          fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={1.6} />
        <Circle cx={TOKEN * 0.38} cy={TOKEN * 0.34} r={TOKEN * 0.09}
          fill="rgba(255,255,255,0.75)" />
        {shielded && (
          <Circle cx={TOKEN / 2} cy={TOKEN / 2} r={TOKEN * 0.5}
            fill="none" stroke="#22d3ee" strokeWidth={2.4} strokeDasharray="4,3" />
        )}
      </Svg>
      {shielded && (
        <Text style={{
          position: 'absolute', top: -TOKEN * 0.22, right: -TOKEN * 0.08,
          fontSize: TOKEN * 0.36,
        }}>🛡</Text>
      )}
    </Pressable>
  );
}

/* ────────────────────────────── DICE ────────────────────────────── */

const PIPS = {
  1: [[.5,.5]],
  2: [[.28,.28],[.72,.72]],
  3: [[.26,.26],[.5,.5],[.74,.74]],
  4: [[.28,.28],[.72,.28],[.28,.72],[.72,.72]],
  5: [[.28,.28],[.72,.28],[.5,.5],[.28,.72],[.72,.72]],
  6: [[.28,.26],[.72,.26],[.28,.5],[.72,.5],[.28,.74],[.72,.74]],
};

function Dice3D({ face, spin }) {
  const S = 76;
  const rot = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const scale = spin.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.18, 1] });
  return (
    <Animated.View style={{ transform: [{ rotate: rot }, { scale }] }}>
      <View style={{
        position: 'absolute', top: 5, left: 3, width: S, height: S,
        borderRadius: 16, backgroundColor: '#9aa1b1',
      }} />
      <View style={{
        width: S, height: S, borderRadius: 16, backgroundColor: '#fff',
        borderWidth: 1, borderColor: '#cfd4de',
        shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 8,
        shadowOffset: { width: 0, height: 6 }, elevation: 8,
      }}>
        {(PIPS[face] || PIPS[6]).map(([px, py], i) => (
          <View key={i} style={{
            position: 'absolute',
            left: px * S - 7, top: py * S - 7,
            width: 14, height: 14, borderRadius: 7,
            backgroundColor: face === 1 && PIPS[face].length === 1 ? '#f43f5e' : '#1f2430',
          }} />
        ))}
      </View>
    </Animated.View>
  );
}

/* ────────────────────────────── MAIN COMPONENT ────────────────────────────── */

const DEFAULT_PLAYERS = [
  { color: 'red', name: 'You', type: 'human' },
  { color: 'green', name: 'CPU 1', type: 'cpu' },
];

export default function LudoBoardPro({ players = DEFAULT_PLAYERS, mode: fixedMode, onExit, onGameEnd }) {
  const [mode, setMode] = useState(fixedMode || null);
  if (!mode) return <ModeSelect onPick={setMode} onExit={onExit} />;
  return (
    <LudoGame key={mode} players={players} mode={mode}
      onExit={onExit} onGameEnd={onGameEnd}
      onMenu={fixedMode ? null : () => setMode(null)} />
  );
}

function ModeSelect({ onPick, onExit }) {
  return (
    <View style={[st.root, { justifyContent: 'center', paddingHorizontal: 22 }]}>
      <Text style={st.msTitle}>Choose a mode</Text>
      <Pressable onPress={() => onPick('classic')}
        style={({ pressed }) => [st.msCard, pressed && { transform: [{ scale: 0.98 }] }]}>
        <Text style={{ fontSize: 36 }}>🎲</Text>
        <Text style={st.msName}>Classic Ludo</Text>
        <Text style={st.msDesc}>
          The real thing — no power-ups. Dice, captures, safe stars, first to bring all 4 tokens home.
        </Text>
      </Pressable>
      <Pressable onPress={() => onPick('power')}
        style={({ pressed }) => [st.msCard, { borderColor: THEME.button },
          pressed && { transform: [{ scale: 0.98 }] }]}>
        <Text style={{ fontSize: 36 }}>⚡</Text>
        <Text style={st.msName}>Power Ludo</Text>
        <Text style={st.msDesc}>
          Start with 1 token already out, ★ star cells grant a 🛡 shield that blocks one capture,
          ⚡ cells boost you +3 steps.
        </Text>
      </Pressable>
      {onExit && (
        <Pressable onPress={onExit} style={{ alignSelf: 'center', marginTop: 20 }}>
          <Text style={{ color: THEME.sub, fontSize: 15 }}>← Back</Text>
        </Pressable>
      )}
    </View>
  );
}

function LudoGame({ players, mode, onExit, onGameEnd, onMenu }) {
  const [state, dispatch] = useReducer(reducer, { players, mode }, initState);
  const [rolling, setRolling] = useState(false);
  const [tempFace, setTempFace] = useState(6);
  const [tilt, setTilt] = useState(true);

  const activeColors = useMemo(() => new Set(players.map(p => p.color)), [players]);
  const current = state.players[state.turnIdx];
  const isHumanTurn = current.type === 'human' && !state.winner;

  const animRefs = useRef(null);
  const scaleRefs = useRef(null);
  if (!animRefs.current) {
    animRefs.current = {}; scaleRefs.current = {};
    ORDER.forEach(col => {
      if (!activeColors.has(col)) return;
      animRefs.current[col] = [0, 1, 2, 3].map(i => new Animated.ValueXY(pixelFor(col, -1, i)));
      scaleRefs.current[col] = [0, 1, 2, 3].map(() => new Animated.Value(1));
    });
  }
  const prevTokens = useRef(JSON.parse(JSON.stringify(state.tokens)));

  useEffect(() => {
    const layout = computeLayout(state.tokens);
    Object.keys(state.tokens).forEach(color => {
      state.tokens[color].forEach((pos, i) => {
        const old = prevTokens.current[color][i];
        const av = animRefs.current[color][i];
        const sv = scaleRefs.current[color][i];
        const t = layout[color][i];
        const settle = (dur = 220, easing) => Animated.parallel([
          Animated.timing(av, { toValue: { x: t.x, y: t.y }, duration: dur, easing, useNativeDriver: true }),
          Animated.timing(sv, { toValue: t.scale, duration: dur, useNativeDriver: true }),
        ]);
        if (old === pos) {
          settle(220).start();
        } else if (pos === -1) {
          Animated.sequence([
            Animated.delay(180),
            settle(480, Easing.out(Easing.quad)),
          ]).start();
        } else if (old >= 0 && pos > old && pos - old <= 6) {
          const seq = [Animated.timing(sv, { toValue: 1, duration: 90, useNativeDriver: true })];
          for (let p = old + 1; p < pos; p++) {
            seq.push(Animated.timing(av, {
              toValue: pixelFor(color, p, i), duration: 150,
              easing: Easing.inOut(Easing.quad), useNativeDriver: true,
            }));
          }
          seq.push(settle(170, Easing.inOut(Easing.quad)));
          Animated.sequence(seq).start();
        } else {
          settle(380, Easing.out(Easing.back(1.2))).start();
        }
      });
    });
    prevTokens.current = JSON.parse(JSON.stringify(state.tokens));
  }, [state.tokens]);

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  const spin = useRef(new Animated.Value(0)).current;
  const doRoll = () => {
    if (rolling || state.phase !== 'ROLL' || state.winner) return;
    setRolling(true);
    spin.setValue(0);
    Animated.timing(spin, {
      toValue: 1, duration: 850, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
    let n = 0;
    const iv = setInterval(() => {
      setTempFace(1 + Math.floor(Math.random() * 6));
      if (++n >= 8) {
        clearInterval(iv);
        const value = 1 + Math.floor(Math.random() * 6);
        setTempFace(value);
        setRolling(false);
        dispatch({ type: 'ROLLED', value });
      }
    }, 95);
  };

  useEffect(() => {
    if (state.winner) { onGameEnd && onGameEnd(state.winner); return; }
    let t;
    if (state.phase === 'ROLL' && current.type === 'cpu') {
      t = setTimeout(doRoll, 850);
    } else if (state.phase === 'MOVE') {
      if (current.type === 'cpu') {
        t = setTimeout(() => dispatch({ type: 'CHOOSE', tIdx: aiPick(state) }), 750);
      } else if (state.legal.length === 1) {
        t = setTimeout(() => dispatch({ type: 'CHOOSE', tIdx: state.legal[0] }), 550);
      }
    } else if (state.phase === 'PASSING') {
      t = setTimeout(() => dispatch({ type: 'NEXT' }), 1200);
    }
    return () => clearTimeout(t);
  }, [state.phase, state.turnIdx, state.winner, state.dice]);

  const doneCount = col => state.tokens[col].filter(p => p === 56).length;

  return (
    <View style={st.root}>
      <View style={st.header}>
        <Pressable onPress={onExit} hitSlop={12}>
          <Text style={st.exit}>← Exit</Text>
        </Pressable>
        <Text style={st.title}>{mode === 'power' ? 'Power Ludo ⚡' : 'Classic Ludo'}</Text>
        <Pressable onPress={() => setTilt(v => !v)} hitSlop={10}
          style={[st.tiltBtn, tilt && st.tiltBtnOn]}>
          <Text style={st.tiltTxt}>3D</Text>
        </Pressable>
      </View>

      <View style={st.playersRow}>
        {state.players.map((p, i) => {
          const isTurn = i === state.turnIdx && !state.winner;
          return (
            <View key={p.color} style={[st.pCard,
              isTurn && { borderColor: C[p.color].main, shadowColor: C[p.color].main }]}>
              <View style={[st.dot, { backgroundColor: C[p.color].main }]} />
              <Text style={st.pName} numberOfLines={1}>{p.name}</Text>
              {isTurn && (
                <View style={[st.turnBadge, { borderColor: C[p.color].main }]}>
                  <Text style={[st.turnTxt, { color: C[p.color].main }]}>TURN</Text>
                </View>
              )}
              <Text style={[st.score, { color: C[p.color].main }]}>{doneCount(p.color)}/4 ✓</Text>
            </View>
          );
        })}
      </View>

      <View style={{ alignItems: 'center', marginTop: 6 }}>
        <View style={{
          width: BOARD, height: BOARD,
          transform: tilt ? [{ perspective: 950 }, { rotateX: '14deg' }, { scale: 0.99 }] : [],
          shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 22,
          shadowOffset: { width: 0, height: 16 }, elevation: 18,
          borderRadius: 12,
        }}>
          <BoardSVG activeColors={activeColors} mode={mode} />
          {Object.keys(state.tokens).map(color =>
            state.tokens[color].map((pos, i) => {
              const selectable = isHumanTurn && state.phase === 'MOVE'
                && current.color === color && state.legal.includes(i);
              return (
                <Animated.View key={`${color}${i}`} pointerEvents="box-none" style={{
                  position: 'absolute', width: TOKEN, height: TOKEN,
                  transform: [
                    ...animRefs.current[color][i].getTranslateTransform(),
                    { scale: scaleRefs.current[color][i] },
                  ],
                  zIndex: selectable ? 30 : 10,
                }}>
                  <TokenChip color={color} selectable={selectable} pulse={pulse}
                    shielded={mode === 'power' && !!state.shields[color][i]}
                    onPress={() => dispatch({ type: 'CHOOSE', tIdx: i })} />
                </Animated.View>
              );
            }),
          )}
          {groupBadges(state.tokens).map((b, k) => (
            <View key={`bg${k}`} pointerEvents="none" style={{
              position: 'absolute', left: b.cx + CELL * 0.1, top: b.cy - CELL * 0.62,
              zIndex: 40, backgroundColor: '#111827', borderRadius: 8,
              paddingHorizontal: 4, minWidth: 16, alignItems: 'center',
              borderWidth: 1, borderColor: '#fff',
            }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{b.n}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={st.msg}>{state.message}</Text>

      <View style={st.diceRow}>
        <Dice3D face={rolling ? tempFace : (state.dice || tempFace)} spin={spin} />
        <Pressable
          onPress={doRoll}
          disabled={!isHumanTurn || state.phase !== 'ROLL' || rolling}
          style={({ pressed }) => [st.rollBtn,
            (!isHumanTurn || state.phase !== 'ROLL' || rolling) && { opacity: 0.4 },
            pressed && { transform: [{ scale: 0.97 }] }]}>
          <Text style={st.rollTxt}>
            {rolling ? 'Rolling…'
              : !isHumanTurn && !state.winner ? `${current.name} thinking…`
              : 'Roll the die'}
          </Text>
        </Pressable>
      </View>

      {state.winner && (
        <View style={st.overlay}>
          <View style={st.winCard}>
            <Text style={{ fontSize: 52 }}>🏆</Text>
            <Text style={st.winTitle}>
              {state.players.find(p => p.color === state.winner)?.name} wins!
            </Text>
            <Pressable style={st.againBtn} onPress={() => dispatch({ type: 'RESET' })}>
              <Text style={st.rollTxt}>Play again</Text>
            </Pressable>
            {onMenu && (
              <Pressable onPress={onMenu} style={{ marginTop: 14 }}>
                <Text style={{ color: THEME.button, fontSize: 15, fontWeight: '700' }}>Change mode</Text>
              </Pressable>
            )}
            {onExit && (
              <Pressable onPress={onExit} style={{ marginTop: 14 }}>
                <Text style={{ color: THEME.sub, fontSize: 15 }}>Exit to lobby</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

/* ────────────────────────────── STYLES ────────────────────────────── */

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.bg, paddingTop: 8 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  exit: { color: THEME.sub, fontSize: 16 },
  title: { color: THEME.text, fontSize: 20, fontWeight: '800', marginLeft: 14, flex: 1 },
  tiltBtn: {
    borderWidth: 1.5, borderColor: THEME.cardBorder, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  tiltBtnOn: { borderColor: THEME.button, backgroundColor: 'rgba(139,140,248,0.15)' },
  tiltTxt: { color: THEME.button, fontWeight: '800', fontSize: 12 },

  playersRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8 },
  pCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: THEME.card, borderWidth: 1.5, borderColor: THEME.cardBorder,
    borderRadius: 14, paddingHorizontal: 10, paddingVertical: 10,
  },
  dot: { width: 11, height: 11, borderRadius: 6 },
  pName: { color: THEME.text, fontWeight: '700', fontSize: 14, flexShrink: 1 },
  turnBadge: {
    borderWidth: 1.2, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1,
  },
  turnTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  score: { marginLeft: 'auto', fontWeight: '800', fontSize: 13 },

  msg: {
    color: THEME.text, textAlign: 'center', marginTop: 14,
    fontSize: 15, fontWeight: '600', minHeight: 20,
  },
  diceRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 22, marginTop: 12,
  },
  rollBtn: {
    backgroundColor: THEME.button, borderRadius: 16,
    paddingHorizontal: 30, paddingVertical: 16, minWidth: 190, alignItems: 'center',
    shadowColor: THEME.button, shadowOpacity: 0.4, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  rollTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },

  overlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,7,12,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },
  winCard: {
    backgroundColor: THEME.card, borderRadius: 22, borderWidth: 1.5,
    borderColor: THEME.cardBorder, padding: 28, alignItems: 'center', width: '80%',
  },
  winTitle: { color: THEME.text, fontSize: 22, fontWeight: '800', marginVertical: 14 },
  againBtn: {
    backgroundColor: THEME.button, borderRadius: 14,
    paddingHorizontal: 26, paddingVertical: 13, marginTop: 4,
  },

  msTitle: {
    color: THEME.text, fontSize: 26, fontWeight: '800',
    textAlign: 'center', marginBottom: 22,
  },
  msCard: {
    backgroundColor: THEME.card, borderWidth: 1.5, borderColor: THEME.cardBorder,
    borderRadius: 20, padding: 20, marginBottom: 16, alignItems: 'center',
  },
  msName: { color: THEME.text, fontSize: 19, fontWeight: '800', marginTop: 8 },
  msDesc: {
    color: THEME.sub, fontSize: 13.5, lineHeight: 19,
    textAlign: 'center', marginTop: 8,
  },
});
