
const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS, createActionButtons } = require('../utils/theme');
const { applyProgress, progressSummaryLines } = require('../utils/level');
const { check, formatRemaining } = require('../utils/cooldown');

const COOLDOWN_MS = 60000;

module.exports = {
  name: 'boss',
  async execute(msg) {
    const left = check(msg.author.id, 'boss', COOLDOWN_MS);
    if (left > 0) {
      return msg.reply({ embeds: [createGameEmbed({ title: '👑 Boss Battle', description: `⏳ Boss masih regen. Coba lagi dalam **${formatRemaining(left)}**.`, color: COLORS.warning })] });
    }

    const u = await getUser(msg.author.id);
    const boss = 200;
    const power = u.level * 30;

    if (power > boss) {
      u.coin += 500;
      applyProgress(u, { exp: 90, stats: { bossWins: 1 } });
      await u.save();
      return msg.reply({
        embeds: [createGameEmbed({
          title: '👑 Boss Battle',
          description: [`Boss tumbang!\nPower kamu **${power}** vs boss **${boss}**\n\nReward: **+500 coin** dan **+90 EXP**`, ...progressSummaryLines(u)].join('\n\n'),
          color: COLORS.success,
        })],
        components: createActionButtons([
          { id: 'ui:profile', label: 'Profile', emoji: '🎮', style: 1 },
          { id: 'ui:achievements', label: 'Achievements', emoji: '🏆' },
          { id: 'ui:dungeon', label: 'Dungeon', emoji: '🏰', style: 4 },
        ]),
      });
    }

    return msg.reply({
      embeds: [createGameEmbed({ title: '👑 Boss Battle', description: `Kamu kalah.\nPower kamu **${power}**, minimal **${boss + 1}** untuk menang.`, color: COLORS.danger })],
      components: createActionButtons([
        { id: 'ui:rank', label: 'Rank', emoji: '⭐', style: 2 },
        { id: 'ui:profile', label: 'Profile', emoji: '🎮' },
      ]),
    });
  }
};
