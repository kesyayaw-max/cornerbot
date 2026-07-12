
const { getUser } = require('../utils/getUser');
const { ACHIEVEMENTS } = require('../utils/achievements');
const { createGameEmbed, COLORS, createActionButtons } = require('../utils/theme');
const { achievementArtAttachment, attachmentImageUrl } = require('../utils/art');
const { bar } = require('../utils/embed');

function progressForAchievement(user, achievement) {
  const stats = user.stats || {};
  switch (achievement.id) {
    case 'daily_starter': return { now: stats.dailyClaims || 0, goal: 1, label: 'Daily' };
    case 'hunter_i': return { now: stats.huntCount || 0, goal: 10, label: 'Hunt' };
    case 'angler_i': return { now: stats.fishingCount || 0, goal: 10, label: 'Fishing' };
    case 'quest_runner': return { now: stats.questCount || 0, goal: 5, label: 'Quest' };
    case 'dungeon_raider': return { now: stats.dungeonWins || 0, goal: 3, label: 'Dungeon' };
    case 'pet_collector': return { now: Array.isArray(user.pets) ? user.pets.length : 0, goal: 5, label: 'Pets' };
    case 'duelist': return { now: stats.pvpWins || 0, goal: 5, label: 'PVP' };
    case 'boss_slayer': return { now: stats.bossWins || 0, goal: 1, label: 'Boss' };
    case 'level_5': return { now: user.level || 1, goal: 5, label: 'Level' };
    case 'level_10': return { now: user.level || 1, goal: 10, label: 'Level' };
    default: return { now: 0, goal: 1, label: 'Progress' };
  }
}

function buildAchievementsView(user, ownerId = '0', page = 0) {
  const perPage = 4;
  const maxPage = Math.max(0, Math.ceil(ACHIEVEMENTS.length / perPage) - 1);
  const safePage = Math.min(Math.max(Number(page) || 0, 0), maxPage);
  const entries = ACHIEVEMENTS.slice(safePage * perPage, safePage * perPage + perPage);
  const unlockedCount = ACHIEVEMENTS.filter((entry) => user.achievements.includes(entry.id)).length;
  const art = achievementArtAttachment(user, 'ACHIEVEMENT HUB');

  const fields = entries.map((entry) => {
    const unlocked = user.achievements.includes(entry.id);
    const progress = progressForAchievement(user, entry);
    const current = Math.min(progress.now, progress.goal);
    return {
      name: `${unlocked ? '✅' : '🔒'} ${entry.emoji} ${entry.title}`,
      value: `${entry.description}\nReward: **${entry.reward} coin**\n${progress.label}: **${current}/${progress.goal}**\n${bar(current, progress.goal)}`,
      inline: false,
    };
  });

  fields.unshift({
    name: '🏆 Progress Summary',
    value: `Unlocked **${unlockedCount}/${ACHIEVEMENTS.length}** achievement.\nHalaman **${safePage + 1}/${maxPage + 1}**`,
    inline: false,
  });

  return {
    embeds: [createGameEmbed({
      title: '🏆 Achievement Gallery X',
      description: 'Semua progress achievement sekarang tampil per halaman lengkap dengan reward dan bar progress.',
      color: unlockedCount ? COLORS.success : COLORS.warning,
      fields,
      image: attachmentImageUrl(art),
      footer: 'Cosmic Corner Bot • Achievement Hyper Tracker',
    })],
    files: [art],
    components: [
      ...createActionButtons([
        { id: `nav:achievements:${ownerId}:${safePage - 1}`, label: 'Prev', emoji: '⬅️', disabled: safePage <= 0 },
        { id: 'ui:rank', label: 'Rank', emoji: '⭐', style: 1 },
        { id: `nav:achievements:${ownerId}:${safePage + 1}`, label: 'Next', emoji: '➡️', disabled: safePage >= maxPage },
        { id: `nav:help:${ownerId}:tips:0`, label: 'Tips', emoji: '💡', style: 2 },
        { id: 'ui:profile', label: 'Profile', emoji: '🎮', style: 2 },
      ]),
    ],
  };
}

module.exports = {
  name: 'achievements',
  buildAchievementsView,
  async execute(msg, args = []) {
    const user = await getUser(msg.author.id);
    const page = Number(args[0]) || 0;
    return msg.reply(buildAchievementsView(user, msg.author.id, page));
  },
};
