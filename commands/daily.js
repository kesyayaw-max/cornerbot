
const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS, createActionButtons } = require('../utils/theme');
const { applyProgress, progressSummaryLines } = require('../utils/level');

module.exports = {
  name: 'daily',
  async execute(msg) {
    const user = await getUser(msg.author.id);
    const cooldown = 86400000;
    const remaining = cooldown - (Date.now() - user.lastDaily);

    if (remaining > 0) {
      const hours = Math.ceil(remaining / 3600000);
      return msg.reply({
        embeds: [createGameEmbed({
          title: '🎁 Daily Reward',
          description: `Kamu sudah claim hari ini. Coba lagi sekitar **${hours} jam** lagi.`,
          color: COLORS.warning,
        })],
        components: createActionButtons([
          { id: 'ui:profile', label: 'Profile', emoji: '🎮' },
          { id: 'ui:quest', label: 'Quest', emoji: '📜' },
          { id: 'ui:help', label: 'Help', emoji: '❔' },
        ]),
      });
    }

    user.coin += 200;
    user.lastDaily = Date.now();
    applyProgress(user, { exp: 20, stats: { dailyClaims: 1 } });
    await user.save();

    const extra = progressSummaryLines(user);
    return msg.reply({
      embeds: [createGameEmbed({
        title: '🎁 Daily Reward Claimed',
        description: ['Claim berhasil! Kamu mendapat **+200 coin** dan **+20 EXP**.', ...extra].join('\n\n'),
        color: COLORS.success,
        fields: [
          { name: '💰 Coin Sekarang', value: `${user.coin}`, inline: true },
          { name: '⭐ Level', value: `${user.level}`, inline: true },
          { name: '🏆 Achievement', value: `${user.achievements?.length || 0}`, inline: true },
        ],
      })],
      components: createActionButtons([
        { id: 'ui:hunt', label: 'Hunt', emoji: '🏹', style: 1 },
        { id: 'ui:shop', label: 'Shop', emoji: '🛒' },
        { id: 'ui:achievements', label: 'Achievements', emoji: '🏆' },
      ]),
    });
  }
};
