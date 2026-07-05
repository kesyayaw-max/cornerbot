
const ACHIEVEMENTS = [
  {
    id: 'daily_starter',
    title: 'Daily Starter',
    emoji: '🎁',
    description: 'Claim daily reward pertama.',
    reward: 100,
    condition: (user) => (user.stats?.dailyClaims || 0) >= 1,
  },
  {
    id: 'hunter_i',
    title: 'Hunter I',
    emoji: '🏹',
    description: 'Selesaikan 10x hunt.',
    reward: 150,
    condition: (user) => (user.stats?.huntCount || 0) >= 10,
  },
  {
    id: 'angler_i',
    title: 'Angler I',
    emoji: '🎣',
    description: 'Mancing 10x.',
    reward: 150,
    condition: (user) => (user.stats?.fishingCount || 0) >= 10,
  },
  {
    id: 'quest_runner',
    title: 'Quest Runner',
    emoji: '📜',
    description: 'Selesaikan 5 quest.',
    reward: 200,
    condition: (user) => (user.stats?.questCount || 0) >= 5,
  },
  {
    id: 'dungeon_raider',
    title: 'Dungeon Raider',
    emoji: '🏰',
    description: 'Clear 3 dungeon.',
    reward: 250,
    condition: (user) => (user.stats?.dungeonWins || 0) >= 3,
  },
  {
    id: 'pet_collector',
    title: 'Pet Collector',
    emoji: '🐾',
    description: 'Kumpulkan 5 pet.',
    reward: 250,
    condition: (user) => Array.isArray(user.pets) && user.pets.length >= 5,
  },
  {
    id: 'duelist',
    title: 'Duelist',
    emoji: '⚔️',
    description: 'Menang 5 duel PVP.',
    reward: 300,
    condition: (user) => (user.stats?.pvpWins || 0) >= 5,
  },
  {
    id: 'boss_slayer',
    title: 'Boss Slayer',
    emoji: '👑',
    description: 'Kalahkan boss pertama.',
    reward: 500,
    condition: (user) => (user.stats?.bossWins || 0) >= 1,
  },
  {
    id: 'level_5',
    title: 'Rising Star',
    emoji: '⭐',
    description: 'Capai level 5.',
    reward: 300,
    condition: (user) => (user.level || 1) >= 5,
  },
  {
    id: 'level_10',
    title: 'Elite Grinder',
    emoji: '🌟',
    description: 'Capai level 10.',
    reward: 750,
    condition: (user) => (user.level || 1) >= 10,
  },
];

function ensureAchievementState(user) {
  if (!Array.isArray(user.achievements)) user.achievements = [];
  if (!user.stats || typeof user.stats !== 'object') user.stats = {};
  return user;
}

function evaluateAchievements(user) {
  ensureAchievementState(user);
  const unlocked = [];
  const owned = new Set(user.achievements);

  for (const achievement of ACHIEVEMENTS) {
    if (owned.has(achievement.id)) continue;
    if (!achievement.condition(user)) continue;
    user.achievements.push(achievement.id);
    if (achievement.reward) user.coin += achievement.reward;
    unlocked.push(achievement);
    owned.add(achievement.id);
  }

  return unlocked;
}

function achievementById(id) {
  return ACHIEVEMENTS.find((entry) => entry.id === id) || null;
}

function unlockedAchievementEntries(user) {
  ensureAchievementState(user);
  return user.achievements.map(achievementById).filter(Boolean);
}

module.exports = {
  ACHIEVEMENTS,
  achievementById,
  ensureAchievementState,
  evaluateAchievements,
  unlockedAchievementEntries,
};
