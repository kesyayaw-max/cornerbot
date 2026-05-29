
const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS, createActionButtons, levelTitle } = require('../utils/theme');
const { startArtAttachment, attachmentImageUrl } = require('../utils/art');
const { ACHIEVEMENTS } = require('../utils/achievements');
const { expNeeded } = require('../utils/level');
const { bar } = require('../utils/embed');

function buildChecklist(user) {
  const stats = user.stats || {};
  const tasks = [
    {
      done: (stats.dailyClaims || 0) >= 1,
      label: 'Claim daily pertama',
      guide: '`/sq main daily`',
    },
    {
      done: (stats.huntCount || 0) >= 1,
      label: 'Coba hunt sekali',
      guide: '`/sq game hunt`',
    },
    {
      done: (stats.fishingCount || 0) >= 1,
      label: 'Coba fishing sekali',
      guide: '`/sq game fishing`',
    },
    {
      done: (Array.isArray(user.pets) ? user.pets.length : 0) >= 1,
      label: 'Tangkap 1 pet',
      guide: '`/sq pet catch`',
    },
    {
      done: (user.inventory || []).length >= 1,
      label: 'Punya 1 item',
      guide: '`/sq main buy potion`',
    },
    {
      done: (user.level || 1) >= 3,
      label: 'Naik ke level 3',
      guide: '`hunt`, `quest`, `dungeon`',
    },
  ];

  const doneCount = tasks.filter((task) => task.done).length;
  return {
    doneCount,
    total: tasks.length,
    lines: tasks.map((task) => `${task.done ? '✅' : '⬜'} ${task.label} • ${task.guide}`).join('\n'),
  };
}

module.exports = {
  name: 'start',
  async execute(msg) {
    const user = await getUser(msg.author.id);
    const checklist = buildChecklist(user);
    const unlocked = Array.isArray(user.achievements) ? user.achievements.length : 0;
    const achievementRate = `${unlocked}/${ACHIEVEMENTS.length}`;
    const need = expNeeded(user.level);
    const art = startArtAttachment(user, checklist);

    return msg.reply({
      embeds: [
        createGameEmbed({
          title: '🚀 Cosmic Corner Onboarding',
          description:
            `Selamat datang <@${msg.author.id}>.\n` +
            `Panel ini jadi **starting dashboard** buat player baru maupun lama: semua jalur progress utama, checklist cepat, dan tombol shortcut ada di sini.\n\n` +
            `> **Status:** ${checklist.doneCount === checklist.total ? 'Onboarding selesai, kamu siap push mid-game.' : 'Masih ada checklist yang bisa kamu beresin buat buka progress lebih cepat.'}`,
          color: COLORS.success,
          image: attachmentImageUrl(art),
          fields: [
            {
              name: '🌟 Player Status',
              value: `Level **${user.level}** • **${levelTitle(user.level)}**\nCoin **${user.coin}** • Pets **${(user.pets || []).length}** • Inventory **${(user.inventory || []).length}**`,
              inline: false,
            },
            {
              name: '🧭 Starter Checklist',
              value: checklist.lines,
              inline: false,
            },
            {
              name: '📈 Progress Engine',
              value: `EXP **${user.exp}/${need}**\n${bar(Math.min(user.exp, need), need)}`,
              inline: true,
            },
            {
              name: '🏆 Achievement Rate',
              value: `Unlocked **${achievementRate}**\nKejar reward bonus coin dari milestone.`,
              inline: true,
            },
            {
              name: '⚡ Recommended Route',
              value: '`daily` → `hunt` → `fishing` → `shop` → `catch` → `quest` → `dungeon`',
              inline: false,
            },
          ],
          footer: 'Cosmic Corner Bot • Onboarding Nexus',
        }),
      ],
      files: [art],
      components: [
        ...createActionButtons([
          { id: 'ui:daily', label: 'Claim Daily', emoji: '🎁', style: 3 },
          { id: 'ui:hunt', label: 'Start Hunt', emoji: '🏹', style: 1 },
          { id: 'ui:catch', label: 'Catch Pet', emoji: '🐾', style: 2 },
          { id: 'ui:shop', label: 'Open Shop', emoji: '🛒', style: 2 },
          { id: 'ui:quest', label: 'Quest', emoji: '📜', style: 4 },
        ]),
        ...createActionButtons([
          { id: 'ui:profile', label: 'Profile', emoji: '🎮', style: 1 },
          { id: 'ui:rank', label: 'Rank', emoji: '⭐', style: 2 },
          { id: 'ui:leaderboard', label: 'Leaderboard', emoji: '👑', style: 2 },
          { id: `nav:achievements:${msg.author.id}:0`, label: 'Achievements', emoji: '🏆', style: 2 },
          { id: 'ui:dashboard', label: 'Dashboard', emoji: '🌌', style: 1 },
          { id: `nav:help:${msg.author.id}:start:0`, label: 'Guide', emoji: '🧭', style: 2 },
        ]),
      ],
    });
  },
};
