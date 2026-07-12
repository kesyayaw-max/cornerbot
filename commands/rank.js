
const { getUser } = require('../utils/getUser');
const { createGameEmbed, profileFields, COLORS, createActionButtons, levelTitle } = require('../utils/theme');
const { expNeeded } = require('../utils/level');
const { dashboardArtAttachment, attachmentImageUrl } = require('../utils/art');

module.exports = {
  name: 'rank',
  async execute(msg) {
    const user = await getUser(msg.author.id);
    const need = expNeeded(user.level);
    const left = Math.max(0, need - user.exp);
    const art = dashboardArtAttachment(user);

    return msg.reply({
      embeds: [createGameEmbed({
        title: '⭐ Rank & Level Hyper Panel',
        description: `Kamu ada di **Level ${user.level}** dengan title **${levelTitle(user.level)}**.\nButuh **${left} EXP** lagi untuk naik ke level berikutnya.`,
        color: COLORS.primary,
        fields: [
          { name: '🚀 Progress', value: `${user.exp}/${need}`, inline: true },
          { name: '🏷️ Title', value: levelTitle(user.level), inline: true },
          { name: '💪 Power Score', value: `${user.level * 10 + (user.pets?.length || 0) * 5 + (user.achievements?.length || 0) * 15 + Math.floor((user.voice?.totalXp || 0) / 10) + ((user.invites?.regular || 0) * 8)}`, inline: true },
          { name: '🎤 Voice Track', value: `${user.voice?.totalXp || 0} XP • ${Math.floor(user.voice?.totalMinutes || 0)} min • ${user.voice?.totalCoins || 0} coin`, inline: false },
          { name: '📨 Invite Track', value: `${user.invites?.regular || 0} joined • ${user.invites?.left || 0} left • ${user.invites?.fake || 0} fake`, inline: false },
          ...profileFields(user),
        ],
        image: attachmentImageUrl(art),
        footer: 'Cosmic Corner Bot • Rank Tracker Deluxe X',
      })],
      files: [art],
      components: [
        ...createActionButtons([
          { id: 'ui:profile', label: 'Profile', emoji: '🎮', style: 1 },
          { id: `nav:achievements:${msg.author.id}:0`, label: 'Achievements', emoji: '🏆', style: 2 },
          { id: `nav:help:${msg.author.id}:tips:0`, label: 'Tips', emoji: '💡', style: 2 },
          { id: 'ui:dashboard', label: 'Dashboard', emoji: '🌌', style: 1 },
          { id: 'ui:leaderboard', label: 'Leaderboard', emoji: '👑', style: 3 },
        ]),
      ],
    });
  }
};
