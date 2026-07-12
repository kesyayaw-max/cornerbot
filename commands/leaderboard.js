const {
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require('discord.js');
const User = require('../models/User');
const { createGameEmbed, COLORS, createActionButtons } = require('../utils/theme');

const medals = ['🥇', '🥈', '🥉'];

function crown(index) {
  return medals[index] || `#${index + 1}`;
}

function fmtMinutes(minutes = 0) {
  const total = Math.max(0, Math.floor(minutes || 0));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (!hours) return `${mins}m`;
  if (!mins) return `${hours}j`;
  return `${hours}j ${mins}m`;
}

const LEADERBOARD_MODES = {
  wealth: {
    label: 'Top Coin',
    description: 'Peringkat pemain terkaya.',
    sort: { coin: -1, level: -1 },
    line: (u, i) => `${crown(i)} <@${u.userId}> — **${u.coin}** coin • Lv.${u.level}`,
    hero: (users = []) => users.slice(0, 3).map((u, i) => `${crown(i)} <@${u.userId}> • **${u.coin}** coin`).join('\n') || 'Belum ada data.',
  },
  level: {
    label: 'Top Level',
    description: 'Peringkat level tertinggi.',
    sort: { level: -1, exp: -1, coin: -1 },
    line: (u, i) => `${crown(i)} <@${u.userId}> — **Lv.${u.level}** • EXP ${u.exp || 0} • 🏆 ${u.achievements?.length || 0}`,
    hero: (users = []) => users.slice(0, 3).map((u, i) => `${crown(i)} <@${u.userId}> • **Lv.${u.level}**`).join('\n') || 'Belum ada data.',
  },
  warrior: {
    label: 'Top Warrior',
    description: 'Peringkat duel dan boss.',
    sort: { 'stats.pvpWins': -1, 'stats.bossWins': -1, wins: -1 },
    line: (u, i) => `${crown(i)} <@${u.userId}> — ⚔️ PVP ${u.stats?.pvpWins || 0} • 👑 Boss ${u.stats?.bossWins || 0} • W ${u.wins || 0}`,
    hero: (users = []) => users.slice(0, 3).map((u, i) => `${crown(i)} <@${u.userId}> • ⚔️ ${u.stats?.pvpWins || 0} PVP`).join('\n') || 'Belum ada data.',
  },
  voice: {
    label: 'Voice Kings',
    description: 'Peringkat aktivitas voice paling aktif.',
    sort: { 'voice.totalMinutes': -1, 'voice.totalXp': -1, 'voice.totalCoins': -1, level: -1 },
    line: (u, i) => `${crown(i)} <@${u.userId}> — **${fmtMinutes(u.voice?.totalMinutes)}** • ✨ ${u.voice?.totalXp || 0} XP • 💰 ${u.voice?.totalCoins || 0}`,
    hero: (users = []) => users.slice(0, 3).map((u, i) => `${crown(i)} <@${u.userId}> • **${fmtMinutes(u.voice?.totalMinutes)}**`).join('\n') || 'Belum ada data.',
  },
};

async function getUserRank(mode, userId) {
  const current = LEADERBOARD_MODES[mode] || LEADERBOARD_MODES.wealth;
  const all = await User.find().sort(current.sort).select('userId coin level exp achievements wins stats voice').lean();
  const index = all.findIndex((u) => String(u.userId) === String(userId));
  return {
    rank: index >= 0 ? index + 1 : null,
    user: index >= 0 ? all[index] : null,
    total: all.length,
  };
}

function buildModeInsights(mode, selfRank) {
  if (mode === 'voice') {
    const minutes = selfRank?.user?.voice?.totalMinutes || 0;
    const xp = selfRank?.user?.voice?.totalXp || 0;
    const coins = selfRank?.user?.voice?.totalCoins || 0;
    return [
      { name: '🎤 Aktivitas VC', value: fmtMinutes(minutes), inline: true },
      { name: '✨ Voice XP', value: `${xp}`, inline: true },
      { name: '💸 Voice Coins', value: `${coins}`, inline: true },
    ];
  }

  if (mode === 'level') {
    return [
      { name: '📍 Posisimu', value: selfRank?.rank ? `#${selfRank.rank} dari ${selfRank.total}` : 'Belum masuk rank', inline: true },
      { name: '⭐ Level', value: `${selfRank?.user?.level || 1}`, inline: true },
      { name: '🧠 EXP', value: `${selfRank?.user?.exp || 0}`, inline: true },
    ];
  }

  if (mode === 'warrior') {
    return [
      { name: '📍 Posisimu', value: selfRank?.rank ? `#${selfRank.rank} dari ${selfRank.total}` : 'Belum masuk rank', inline: true },
      { name: '⚔️ PVP', value: `${selfRank?.user?.stats?.pvpWins || 0}`, inline: true },
      { name: '👑 Boss', value: `${selfRank?.user?.stats?.bossWins || 0}`, inline: true },
    ];
  }

  return [
    { name: '📍 Posisimu', value: selfRank?.rank ? `#${selfRank.rank} dari ${selfRank.total}` : 'Belum masuk rank', inline: true },
    { name: '💰 Coin', value: `${selfRank?.user?.coin || 0}`, inline: true },
    { name: '⭐ Level', value: `${selfRank?.user?.level || 1}`, inline: true },
  ];
}

async function buildLeaderboardView(mode = 'wealth', ownerId = '0') {
  const current = LEADERBOARD_MODES[mode] || LEADERBOARD_MODES.wealth;
  const top = await User.find().sort(current.sort).limit(10).lean();
  const selfRank = ownerId && ownerId !== '0' ? await getUserRank(mode, ownerId) : null;
  const description = top.length
    ? top.map((u, i) => current.line(u, i)).join('\n')
    : 'Belum ada data leaderboard.';

  const select = new StringSelectMenuBuilder()
    .setCustomId(`select:leaderboard:${ownerId}`)
    .setPlaceholder('Pilih leaderboard')
    .addOptions(
      Object.entries(LEADERBOARD_MODES).map(([key, value]) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(value.label)
          .setDescription(value.description)
          .setValue(key)
          .setDefault(key === mode)
      )
    );

  const modeAccent = mode === 'voice' ? COLORS.primary : mode === 'warrior' ? COLORS.danger : mode === 'level' ? COLORS.success : COLORS.warning;

  return {
    embeds: [
      createGameEmbed({
        title: mode === 'voice' ? '🎤 Voice Leaderboard Cosmic Corner!' : '🏆 Leaderboard Arena',
        description: mode === 'voice'
          ? `Panel ini nunjukin member paling aktif di voice.\n\n${description}`
          : description,
        color: modeAccent,
        fields: [
          { name: '👑 Podium', value: current.hero(top), inline: false },
          { name: '📊 Mode', value: `**${current.label}**\n${current.description}`, inline: false },
          ...buildModeInsights(mode, selfRank),
        ],
        footer: mode === 'voice'
          ? 'Cosmic Corner Bot • Voice Kings Board'
          : 'Cosmic Corner Bot • Leaderboard Deluxe X',
      }),
    ],
    components: [
      ...createActionButtons([
        { id: 'ui:profile', label: 'Profile', emoji: '🎮', style: ButtonStyle.Primary },
        { id: 'ui:rank', label: 'Rank', emoji: '⭐', style: ButtonStyle.Secondary },
        { id: 'ui:leaderboard', label: 'Refresh', emoji: '🔄', style: ButtonStyle.Success },
        { id: `nav:achievements:${ownerId}:0`, label: 'Achievements', emoji: '🏆', style: ButtonStyle.Secondary },
        { id: `nav:help:${ownerId}:main:0`, label: 'Help', emoji: '❔', style: ButtonStyle.Secondary },
      ]),
      new ActionRowBuilder().addComponents(select),
    ],
  };
}

module.exports = {
  name: 'leaderboard',
  buildLeaderboardView,
  async execute(msg, args = []) {
    const rawMode = String(args[0] || 'wealth').toLowerCase();
    const mode = LEADERBOARD_MODES[rawMode] ? rawMode : (['voice', 'vc'].includes(rawMode) ? 'voice' : 'wealth');
    return msg.reply(await buildLeaderboardView(mode, msg.author.id));
  }
};
