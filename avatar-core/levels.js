// Level math. cost(n -> n+1) = LEVEL_COEFF * n
// Cumulative XP to reach level L = (LEVEL_COEFF / 2) * L * (L - 1)
// With LEVEL_COEFF = 400: Level 25 -> 26 costs exactly 10,000 XP.

const LEVEL_COEFF = 400;

const TITLES = [
  [1, 'Newcomer'], [5, 'Regular'], [10, 'Scene Kid'], [15, 'Curator'],
  [20, 'Entertainment Explorer'], [30, 'Showrunner'], [50, 'Icon'],
  [100, 'Legend of the Lobby'],
];

function costForLevel(level) {
  return LEVEL_COEFF * level;
}

function cumulativeXp(level) {
  return (LEVEL_COEFF / 2) * level * (level - 1);
}

function levelForXp(xp) {
  // Inverts cumulativeXp: (C/2)L^2 - (C/2)L - xp = 0
  const l = Math.floor((1 + Math.sqrt(1 + xp / (LEVEL_COEFF / 8))) / 2);
  return Math.max(1, l);
}

function titleForLevel(level) {
  let title = TITLES[0][1];
  for (const [minLevel, name] of TITLES) {
    if (level >= minLevel) title = name;
  }
  return title;
}

function unlockedTitles(level) {
  return TITLES.filter(([minLevel]) => level >= minLevel).map(([, name]) => name);
}

function progressForXp(xp) {
  const level = levelForXp(xp);
  const into = xp - cumulativeXp(level);
  const needed = costForLevel(level);
  return { level, into, needed, title: titleForLevel(level), xp };
}

// Coins granted when leveling up: 10 coins per level number gained.
function coinsForLevelUp(fromLevel, toLevel) {
  let coins = 0;
  for (let l = fromLevel + 1; l <= toLevel; l++) coins += l * 10;
  return coins;
}

module.exports = {
  LEVEL_COEFF, TITLES, costForLevel, cumulativeXp, levelForXp,
  titleForLevel, unlockedTitles, progressForXp, coinsForLevelUp,
};
