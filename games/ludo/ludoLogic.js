// Ludo game logic — ported from backend for client-side solo play.
// Position encoding (relative to each color's own start square):
//   'home'     — token not yet released
//   0-50       — main track (52 squares, relative to this color's start)
//   51-56      — home stretch (6 squares)
//   'finished' — completed
const PLAYER_COLORS = ['red', 'green', 'yellow', 'blue'];
export const COLOR_START_OFFSET = { red: 0, green: 13, yellow: 26, blue: 39 };
export const SAFE_GLOBAL_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];

export function globalSquare(color, pos) {
  return (COLOR_START_OFFSET[color] + pos) % 52;
}

export function createInitialState(totalPlayers) {
  if (totalPlayers < 2 || totalPlayers > 4) throw new Error('Ludo needs 2-4 players');
  const players = PLAYER_COLORS.slice(0, totalPlayers).map((color, i) => ({
    userId: `player_${i}`,
    color,
    displayName: i === 0 ? 'You' : `CPU ${i}`,
  }));
  const tokens = {};
  for (const p of players) {
    for (let i = 0; i < 4; i++) {
      tokens[`${p.color}-${i}`] = { color: p.color, pos: 'home' };
    }
  }
  return {
    players,
    tokens,
    currentPlayerIndex: 0,
    diceValue: null,
    consecutiveSixes: 0,
    legalTokenIds: [],
    winner: null,
  };
}

function computeLegalMoves(tokens, color, diceValue) {
  const legal = [];
  for (const [tokenId, token] of Object.entries(tokens)) {
    if (token.color !== color) continue;
    if (token.pos === 'home') {
      if (diceValue === 6) legal.push(tokenId);
    } else if (token.pos !== 'finished') {
      if (token.pos + diceValue <= 57) legal.push(tokenId);
    }
  }
  return legal;
}

function advanceTurn(state) {
  return (state.currentPlayerIndex + 1) % state.players.length;
}

export function rollDice(state) {
  if (state.diceValue !== null) return { state, events: [] };
  const roll = 1 + Math.floor(Math.random() * 6);
  const player = state.players[state.currentPlayerIndex];
  const consecutiveSixes = roll === 6 ? state.consecutiveSixes + 1 : 0;

  if (consecutiveSixes === 3) {
    return {
      state: {
        ...state,
        currentPlayerIndex: advanceTurn(state),
        diceValue: null, consecutiveSixes: 0, legalTokenIds: [],
      },
      events: [{ type: 'forfeit_three_sixes', roll }],
    };
  }

  const legalTokenIds = computeLegalMoves(state.tokens, player.color, roll);
  if (legalTokenIds.length === 0) {
    return {
      state: {
        ...state,
        currentPlayerIndex: advanceTurn(state),
        diceValue: null, consecutiveSixes: 0, legalTokenIds: [],
      },
      events: [{ type: 'no_legal_moves', roll }],
    };
  }

  return {
    state: { ...state, diceValue: roll, consecutiveSixes, legalTokenIds },
    events: [{ type: 'rolled', roll }],
  };
}

export function moveToken(state, tokenId) {
  if (state.diceValue === null || !state.legalTokenIds.includes(tokenId)) {
    return { state, events: [] };
  }
  const token = state.tokens[tokenId];
  const newTokens = { ...state.tokens };
  const events = [];
  const newPos = token.pos === 'home' ? 0 : token.pos + state.diceValue;

  if (newPos === 57) {
    newTokens[tokenId] = { ...token, pos: 'finished' };
    events.push({ type: 'token_finished', tokenId });
  } else {
    newTokens[tokenId] = { ...token, pos: newPos };
    if (newPos <= 50) {
      const landedGlobal = globalSquare(token.color, newPos);
      if (!SAFE_GLOBAL_SQUARES.includes(landedGlobal)) {
        for (const [otherId, otherToken] of Object.entries(newTokens)) {
          if (otherId === tokenId || otherToken.color === token.color) continue;
          if (typeof otherToken.pos !== 'number' || otherToken.pos > 50) continue;
          if (globalSquare(otherToken.color, otherToken.pos) === landedGlobal) {
            newTokens[otherId] = { ...otherToken, pos: 'home' };
            events.push({ type: 'captured', tokenId, capturedTokenId: otherId });
          }
        }
      }
    }
  }

  const player = state.players[state.currentPlayerIndex];
  const playerTokens = Object.keys(newTokens).filter((id) => newTokens[id].color === player.color);
  const wonGame = playerTokens.every((id) => newTokens[id].pos === 'finished');

  if (wonGame) {
    events.push({ type: 'game_won' });
    return {
      state: { ...state, tokens: newTokens, winner: player.userId, diceValue: null, legalTokenIds: [] },
      events,
    };
  }

  const capturedSomething = events.some((e) => e.type === 'captured');
  const extraTurn = state.diceValue === 6 || capturedSomething;

  if (extraTurn) {
    return { state: { ...state, tokens: newTokens, diceValue: null, legalTokenIds: [] }, events };
  }

  return {
    state: {
      ...state,
      tokens: newTokens,
      currentPlayerIndex: advanceTurn(state),
      diceValue: null, consecutiveSixes: 0, legalTokenIds: [],
    },
    events,
  };
}

// CPU AI: pick best token to move
export function cpuPickToken(state, difficulty = 'easy') {
  const legal = state.legalTokenIds;
  if (!legal.length) return null;
  if (legal.length === 1) return legal[0];
  if (difficulty === 'easy') return legal[Math.floor(Math.random() * legal.length)];

  // Hard: prefer captures, then tokens furthest along
  const tokens = state.tokens;
  const dice = state.diceValue;

  for (const tokenId of legal) {
    const token = tokens[tokenId];
    const newPos = token.pos === 'home' ? 0 : token.pos + dice;
    if (newPos <= 50) {
      const landedGlobal = globalSquare(token.color, newPos);
      if (!SAFE_GLOBAL_SQUARES.includes(landedGlobal)) {
        for (const [otherId, otherToken] of Object.entries(tokens)) {
          if (otherToken.color === token.color || otherId === tokenId) continue;
          if (typeof otherToken.pos !== 'number' || otherToken.pos > 50) continue;
          if (globalSquare(otherToken.color, otherToken.pos) === landedGlobal) return tokenId;
        }
      }
    }
  }

  let bestToken = legal[0];
  let bestPos = -Infinity;
  for (const tokenId of legal) {
    const token = tokens[tokenId];
    const pos = token.pos === 'home' ? -1 : token.pos === 'finished' ? 999 : Number(token.pos);
    if (pos > bestPos) { bestPos = pos; bestToken = tokenId; }
  }
  return bestToken;
}

export function getFinishedCount(tokens, color) {
  return Object.values(tokens).filter((t) => t.color === color && t.pos === 'finished').length;
}
