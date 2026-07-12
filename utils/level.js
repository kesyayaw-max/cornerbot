
const { evaluateAchievements } = require('./achievements');

function expNeeded(level = 1) {
  return Math.max(100, Number(level || 1) * 100);
}

function applyProgress(user, payload = {}) {
  const {
    exp = 0,
    stats = {},
  } = payload;

  if (!user.stats || typeof user.stats !== 'object') user.stats = {};

  if (Number.isFinite(exp) && exp) {
    user.exp = Math.max(0, Number(user.exp || 0) + Math.floor(exp));
  }

  for (const [key, value] of Object.entries(stats || {})) {
    if (!Number.isFinite(value)) continue;
    user.stats[key] = Math.max(0, Number(user.stats[key] || 0) + value);
  }

  let levelUps = 0;
  while ((user.exp || 0) >= expNeeded(user.level)) {
    user.exp -= expNeeded(user.level);
    user.level += 1;
    levelUps += 1;
  }

  const unlockedAchievements = evaluateAchievements(user);
  user._progressMeta = { levelUps, unlockedAchievements };
  return user._progressMeta;
}

function checkLevelUp(user) {
  const meta = applyProgress(user);
  return meta.levelUps > 0;
}

function progressSummaryLines(user) {
  const meta = user?._progressMeta || { levelUps: 0, unlockedAchievements: [] };
  const lines = [];

  if (meta.levelUps > 0) {
    lines.push(`⬆️ **Level Up!** Sekarang level **${user.level}**`);
  }

  if (meta.unlockedAchievements.length) {
    const compact = meta.unlockedAchievements
      .slice(0, 3)
      .map((achievement) => `${achievement.emoji} **${achievement.title}**`)
      .join('\n');
    lines.push(`🏆 **Achievement Unlocked**\n${compact}`);
  }

  return lines;
}

module.exports = {
  expNeeded,
  applyProgress,
  checkLevelUp,
  progressSummaryLines,
};
