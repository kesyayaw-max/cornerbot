
const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS, createActionButtons } = require('../utils/theme');
const { applyProgress, progressSummaryLines } = require('../utils/level');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

module.exports = {
  name: 'hunt',
  async execute(msg) {
    const user = await getUser(msg.author.id);

    const m = await msg.reply({ embeds: [createGameEmbed({ title: '🏹 Neon Hunt Sequence', description: '🌲 Tracker scan dimulai... memasuki area berburu premium.', color: COLORS.primary })] });
    await sleep(700);
    await m.edit({ embeds: [createGameEmbed({ title: '🏹 Neon Hunt Sequence', description: '👀 Jejak target ditemukan... mengunci posisi.', color: COLORS.warning })] });
    await sleep(700);
    await m.edit({ embeds: [createGameEmbed({ title: '🏹 Neon Hunt Sequence', description: '⚔️ Serangan dilepas... loot sedang dihitung.', color: COLORS.danger })] });

    const coin = Math.floor(Math.random() * 100) + 50;
    user.coin += coin;
    applyProgress(user, { exp: 18, stats: { huntCount: 1 } });
    await user.save();

    const extra = progressSummaryLines(user);
    await sleep(500);
    await m.edit({
      embeds: [createGameEmbed({
        title: '🏹 Hunt Complete',
        description: [`Perburuan sukses! Kamu dapat **+${coin} coin** dan **+18 EXP**.`, ...extra].join('\n\n'),
        color: COLORS.success,
        fields: [
          { name: '💰 Coin Sekarang', value: `${user.coin}`, inline: true },
          { name: '⭐ Level', value: `${user.level}`, inline: true },
          { name: '📊 Total Hunt', value: `${user.stats?.huntCount || 0}`, inline: true },
        ],
      })],
      components: createActionButtons([
        { id: 'ui:hunt', label: 'Hunt Lagi', emoji: '🏹', style: 1 },
        { id: 'ui:dungeon', label: 'Dungeon', emoji: '🏰', style: 4 },
        { id: 'ui:achievements', label: 'Achievements', emoji: '🏆' },
      ]),
    });
  }
};
