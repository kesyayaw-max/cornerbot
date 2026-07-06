
const User = require('../models/User');
const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS, createActionButtons } = require('../utils/theme');

module.exports = {
  name: 'invites',
  async execute(msg) {
    const user = await getUser(msg.author.id);
    const betterCount = (user.invites?.regular || 0) + (user.invites?.bonus || 0) - (user.invites?.left || 0) - (user.invites?.fake || 0);

    const top = await User.find()
      .sort({ 'invites.regular': -1, 'invites.bonus': -1, 'invites.left': 1 })
      .limit(5)
      .lean();

    const lines = top.length
      ? top.map((entry, index) => {
          const score = (entry.invites?.regular || 0) + (entry.invites?.bonus || 0) - (entry.invites?.left || 0) - (entry.invites?.fake || 0);
          return `${['🥇', '🥈', '🥉'][index] || `#${index + 1}`} <@${entry.userId}> • ${score} net`;
        }).join('\n')
      : 'Belum ada data invite.';

    return msg.reply({
      embeds: [createGameEmbed({
        title: '📨 Invite Tracker Center',
        description: `Stat invite untuk <@${msg.author.id}>`,
        color: COLORS.admin,
        fields: [
          { name: '✅ Joined', value: `${user.invites?.regular || 0}`, inline: true },
          { name: '🚪 Left', value: `${user.invites?.left || 0}`, inline: true },
          { name: '🕵️ Fake', value: `${user.invites?.fake || 0}`, inline: true },
          { name: '🎁 Bonus', value: `${user.invites?.bonus || 0}`, inline: true },
          { name: '📊 Net Invites', value: `${betterCount}`, inline: true },
          { name: '🏆 Top Inviter', value: lines, inline: false },
        ],
        footer: 'Cosmic Corner Bot • Invite Tracker',
      })],
      components: [
        ...createActionButtons([
          { id: 'ui:profile', label: 'Profile', emoji: '🎮', style: 1 },
          { id: 'ui:rank', label: 'Rank', emoji: '⭐', style: 2 },
          { id: 'ui:leaderboard', label: 'Leaderboard', emoji: '👑', style: 3 },
          { id: `nav:help:${msg.author.id}:home:0`, label: 'Help', emoji: '❔', style: 2 },
        ]),
      ],
    });
  }
};
