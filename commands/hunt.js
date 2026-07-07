
const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS, createActionButtons } = require('../utils/theme');
const { applyProgress, progressSummaryLines } = require('../utils/level');
const { check, formatRemaining } = require('../utils/cooldown');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const COOLDOWN_MS = 15000;

module.exports = {
  name: 'hunt',
  async execute(msg) {
    const left = check(msg.author.id, 'hunt', COOLDOWN_MS);
    if (left > 0) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🏹 Neon Hunt Sequence', description: `⏳ Area masih dipulihkan. Coba lagi dalam **${formatRemaining(left)}**.`, color: COLORS.warning })] });
    }

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
