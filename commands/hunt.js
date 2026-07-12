
const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS, createActionButtons } = require('../utils/theme');
const { applyProgress, progressSummaryLines } = require('../utils/level');
const { check, formatRemaining } = require('../utils/cooldown');
const { getGuildEmotes } = require('../utils/emotes');
const { rollShiny, shinyCoinBonus } = require('../utils/shiny');

const COOLDOWN_MS = 15000;
const STREAK_WINDOW_MS = COOLDOWN_MS * 3;

module.exports = {
  name: 'hunt',
  async execute(msg) {
    const left = check(msg.author.id, 'hunt', COOLDOWN_MS);
    if (left > 0) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🏹 Neon Hunt Sequence', description: `⏳ Area masih dipulihkan. Coba lagi dalam **${formatRemaining(left)}**.`, color: COLORS.warning })] });
    }

    const guildId = msg.guild?.id;
    const emotes = await getGuildEmotes(guildId, ['hunt'], { hunt: '🏹' });

    return msg.reply({
      embeds: [createGameEmbed({
        title: `${emotes.hunt} Neon Hunt Sequence`,
        description: [
          'Pilih gaya berburu kamu:',
          '',
          '🟢 **Aman** — reward pasti, kecil-menengah, nggak ada risiko gagal.',
          '🔴 **Beresiko** — reward jauh lebih gede, tapi ada peluang pulang tangan kosong.',
        ].join('\n'),
        color: COLORS.primary,
      })],
      components: createActionButtons([
        { id: `hunt:safe:${msg.author.id}`, label: 'Aman', emoji: '🟢', style: 3 },
        { id: `hunt:risky:${msg.author.id}`, label: 'Beresiko', emoji: '🔴', style: 4 },
      ]),
    });
  },

  async handleChoice(interaction, choice) {
    const guildId = interaction.guild?.id;
    const emotes = await getGuildEmotes(guildId, ['hunt', 'shiny'], { hunt: '🏹', shiny: '✨' });
    const user = await getUser(interaction.user.id);

    const now = Date.now();
    const lastAt = user.stats?.lastHuntAt || 0;
    const streak = (now - lastAt <= STREAK_WINDOW_MS) ? (user.stats?.huntStreak || 0) + 1 : 1;

    let coin = 0;
    let failed = false;

    if (choice === 'risky') {
      failed = Math.random() < 0.3;
      coin = failed ? 0 : Math.floor(Math.random() * 200) + 120; // 120-320
    } else {
      coin = Math.floor(Math.random() * 60) + 50; // 50-110
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
    user.stats.lastHuntAt = now;
    user.stats.huntStreak = streak;

    let desc;
    let fields = [];

    if (failed) {
      desc = `💨 Buruan kabur! Kamu pulang tangan kosong kali ini.\n\n🔥 Hunt Streak: **${streak}x**`;
      await user.save();
    } else {
      applyProgress(user, { exp: 18, stats: { huntCount: 1 } });
      await user.save();
      const extra = progressSummaryLines(user);
      desc = [
        `${choice === 'risky' ? '🔴 Mode Beresiko' : '🟢 Mode Aman'} — dapat **+${coin} coin** (termasuk bonus streak +${streakBonus}) dan **+18 EXP**.`,
        `🔥 Hunt Streak: **${streak}x**`,
        shinyLine,
        ...extra,
      ].filter(Boolean).join('\n');
      fields = [
        { name: '💰 Coin Sekarang', value: `${user.coin}`, inline: true },
        { name: '⭐ Level', value: `${user.level}`, inline: true },
        { name: '📊 Total Hunt', value: `${user.stats?.huntCount || 0}`, inline: true },
      ];
    }

    return interaction.update({
      embeds: [createGameEmbed({
        title: `${emotes.hunt} Hunt Result`,
        description: desc,
        color: failed ? COLORS.danger : COLORS.success,
        fields,
      })],
      components: createActionButtons([
        { id: 'ui:hunt', label: 'Hunt Lagi', emoji: '🏹', style: 1 },
        { id: 'ui:dungeon', label: 'Dungeon', emoji: '🏰', style: 4 },
        { id: 'ui:achievements', label: 'Achievements', emoji: '🏆' },
      ]),
    }).catch(() => {});
  },
};
