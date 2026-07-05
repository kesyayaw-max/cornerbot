
const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS, createActionButtons } = require('../utils/theme');
const { applyProgress, progressSummaryLines } = require('../utils/level');
const { check, formatRemaining } = require('../utils/cooldown');

const COOLDOWN_MS = 15000;

const catches = [
  { name: 'Ikan Kecil', reward: 40, icon: '🐟' },
  { name: 'Ikan Besar', reward: 120, icon: '🐠' },
  { name: 'Peti Harta', reward: 250, icon: '🪙' },
  { name: 'Sampah Laut', reward: 5, icon: '🗑️' },
];

module.exports = {
  name: 'fishing',
  async execute(msg) {
    const left = check(msg.author.id, 'fishing', COOLDOWN_MS);
    if (left > 0) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🎣 Ocean Loot', description: `⏳ Umpan masih dipasang. Coba lagi dalam **${formatRemaining(left)}**.`, color: COLORS.warning })] });
    }

    const user = await getUser(msg.author.id);
    const loot = catches[Math.floor(Math.random() * catches.length)];
    user.coin += loot.reward;
    applyProgress(user, { exp: 10, stats: { fishingCount: 1 } });
    await user.save();

    const extra = progressSummaryLines(user);
    return msg.reply({
      embeds: [createGameEmbed({
        title: '🎣 Ocean Loot',
        description: [`${loot.icon} Kamu mendapatkan **${loot.name}** dan membawa pulang **+${loot.reward} coin**!`, ...extra].join('\n\n'),
        color: COLORS.success,
        footer: 'Cosmic Corner Bot • Fishing Result Deluxe',
        fields: [
          { name: '💰 Coin Sekarang', value: `${user.coin}`, inline: true },
          { name: '✨ EXP Bonus', value: '+10 EXP', inline: true },
          { name: '🎣 Total Fishing', value: `${user.stats?.fishingCount || 0}`, inline: true },
        ]
      })],
      components: createActionButtons([
        { id: 'ui:fishing', label: 'Mancing Lagi', emoji: '🎣', style: 1 },
        { id: 'ui:inventory', label: 'Inventory', emoji: '🎒' },
        { id: 'ui:achievements', label: 'Achievements', emoji: '🏆' },
      ]),
    });
  }
};
