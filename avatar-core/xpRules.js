// XP sources with server-enforced caps. All grants happen on the backend.
//   dailyCap   -> max granted events per UTC day
//   dailyXpCap -> max XP per UTC day (trickle sources)
//   weeklyCap  -> max granted events per UTC week (Monday 00:00 UTC)

const XP_SOURCES = {
  join:             { amount: 10,  dailyCap: 10, label: 'Joined a room' },
  host:             { amount: 50,  dailyCap: 3,  label: 'Hosted a room' },
  invite:           { amount: 20,  dailyCap: 5,  label: 'Friend joined via invite' },
  login:            { amount: 5,   dailyCap: 1,  label: 'Daily login' },
  challenge_daily:  { amount: 100, dailyCap: 3,  label: 'Daily challenge' },
  challenge_weekly: { amount: 250, weeklyCap: 3, label: 'Weekly challenge' },
  social:           { amount: 1,   dailyXpCap: 30, label: 'Social activity' },
  watch:            { amount: 15,  dailyCap: 6,  label: 'Watch session' },
  game_play:        { amount: 15,  dailyCap: 5,  label: 'Played a game' },
  game_win:         { amount: 30,  dailyCap: 3,  label: 'Won a game' },
};

// Login streak multiplier — applies to the `login` source only.
function loginMultiplier(streakDay) {
  if (streakDay >= 7) return 2.0;
  if (streakDay >= 3) return 1.5;
  return 1.0;
}

// Daily login streak rewards (coins and/or a random item of a rarity).
const STREAK_REWARDS = {
  1:  { coins: 50 },
  2:  { coins: 75 },
  3:  { coins: 100 },
  5:  { itemRarity: 'uncommon' },
  7:  { coins: 150, itemRarity: 'rare' },
  14: { itemRarity: 'epic' },
  30: { itemRarity: 'legendary' },
};

function streakRewardForDay(day) {
  return STREAK_REWARDS[day] || { coins: 50 };
}

module.exports = { XP_SOURCES, loginMultiplier, STREAK_REWARDS, streakRewardForDay };
