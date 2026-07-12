
const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS, createActionButtons } = require('../utils/theme');
const { applyProgress, progressSummaryLines } = require('../utils/level');
const { check, formatRemaining } = require('../utils/cooldown');
const { getGuildEmotes } = require('../utils/emotes');
const { rollShiny, shinyCoinBonus } = require('../utils/shiny');

const COOLDOWN_MS = 15000;
const STREAK_WINDOW_MS = COOLDOWN_MS * 3;

const safeCatches = [
  { name: 'Ikan Kecil', reward: 40, icon: '🐟' },
  { name: 'Ikan Besar', reward: 90, icon: '🐠' },
  { name: 'Sampah Laut', reward: 15, icon: '🗑️' },
];

module.exports = {
  name: 'fishing',
  async execute(msg) {
    const left = check(msg.author.id, 'fishing', COOLDOWN_MS);
    if (left > 0) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🎣 Ocean Loot', description: `⏳ Umpan masih dipasang. Coba lagi dalam **${formatRemaining(left)}**.`, color: COLORS.warning })] });
    }

    const guildId = msg.guild?.id;
    const emotes = await getGuildEmotes(guildId, ['fishing'], { fishing: '🎣' });

    return msg.reply({
      embeds: [createGameEmbed({
        title: `${emotes.fishing} Ocean Loot`,
        description: [
          'Pilih gaya mancing kamu:',
          '',
          '🟢 **Aman** — hasil tangkapan biasa, pasti dapat sesuatu.',
          '🔴 **Beresiko** — mancing di spot dalam, hasil gede tapi bisa juga kail putus (gagal).',
        ].join('\n'),
        color: COLORS.primary,
      })],
      components: createActionButtons([
        { id: `fishing:safe:${msg.author.id}`, label: 'Aman', emoji: '🟢', style: 3 },
        { id: `fishing:risky:${msg.author.id}`, label: 'Beresiko', emoji: '🔴', style: 4 },
      ]),
    });
  },

  async handleChoice(interaction, choice) {
    const guildId = interaction.guild?.id;
    const emotes = await getGuildEmotes(guildId, ['fishing', 'shiny'], { fishing: '🎣', shiny: '✨' });
    const user = await getUser(interaction.user.id);

    const now = Date.now();
    const lastAt = user.stats?.lastFishingAt || 0;
    const streak = (now - lastAt <= STREAK_WINDOW_MS) ? (user.stats?.fishingStreak || 0) + 1 : 1;

    let coin = 0;
    let failed = false;
    let catchName = '';
    let catchIcon = emotes.fishing;

    if (choice === 'risky') {
      failed = Math.random() < 0.3;
      if (!failed) {
        coin = Math.floor(Math.random() * 220) + 130; // 130-350
        catchName = 'Peti Harta Karam';
        catchIcon = '🪙';
      }
    } else {
      const loot = safeCatches[Math.floor(Math.random() * safeCatches.length)];
      coin = loot.reward;
      catchName = loot.name;
      catchIcon = loot.icon;
    }

    const streakBonusPct = Math.min(streak, 10) * 0.03;
    const streakBonus = Math.floor(coin * streakBonusPct);
    coin += streakBonus;

    let shinyLine = '';
    if (!failed && rollShiny()) {
      const bonus = shinyCoinBonus(coin);
      coin += bonus;
      user.stats.shinyCount = (user.stats.shinyCount || 0) + 1;
      shinyLine = `\n${emotes.shiny} **SHINY DROP!** Bonus +${bonus} coin!`;
    }

    user.coin += coin;
    user.stats.lastFishingAt = now;
    user.stats.fishingStreak = streak;

    let desc;
    let fields = [];

    if (failed) {
      desc = `🪢 Kail putus di spot dalam! Kamu pulang tangan kosong kali ini.\n\n🔥 Fishing Streak: **${streak}x**`;
      await user.save();
    } else {
      applyProgress(user, { exp: 10, stats: { fishingCount: 1 } });
      await user.save();
      const extra = progressSummaryLines(user);
      desc = [
        `${catchIcon} Kamu mendapatkan **${catchName}** — **+${coin} coin** (termasuk bonus streak +${streakBonus}) dan **+10 EXP**.`,
        `🔥 Fishing Streak: **${streak}x**`,
        shinyLine,
        ...extra,
      ].filter(Boolean).join('\n');
      fields = [
        { name: '💰 Coin Sekarang', value: `${user.coin}`, inline: true },
        { name: '🎣 Total Fishing', value: `${user.stats?.fishingCount || 0}`, inline: true },
      ];
    }

    return interaction.update({
      embeds: [createGameEmbed({
        title: `${emotes.fishing} Fishing Result`,
        description: desc,
        color: failed ? COLORS.danger : COLORS.success,
        footer: 'Cosmic Corner Bot • Fishing Result Deluxe',
        fields,
      })],
      components: createActionButtons([
        { id: 'ui:fishing', label: 'Mancing Lagi', emoji: '🎣', style: 1 },
        { id: 'ui:inventory', label: 'Inventory', emoji: '🎒' },
        { id: 'ui:achievements', label: 'Achievements', emoji: '🏆' },
      ]),
    }).catch(() => {});
  },
};
