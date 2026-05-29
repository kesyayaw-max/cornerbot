
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS, createActionButtons, levelTitle } = require('../utils/theme');
const { commandCenterArtAttachment, attachmentImageUrl } = require('../utils/art');
const { expNeeded } = require('../utils/level');
const { ACHIEVEMENTS } = require('../utils/achievements');
const { bar } = require('../utils/embed');

function buildMissionBoard(user) {
  const stats = user.stats || {};
  const missions = [
    {
      tier: 'Starter',
      emoji: '🎁',
      title: 'Claim modal harian',
      done: (stats.dailyClaims || 0) >= 1,
      guide: '/sq main daily',
      reward: 'Coin boost + momentum awal',
    },
    {
      tier: 'Grind',
      emoji: '🏹',
      title: 'Farm 10 hunt',
      done: (stats.huntCount || 0) >= 10,
      guide: '/sq game hunt',
      reward: 'Achievement + coin farming',
    },
    {
      tier: 'Explorer',
      emoji: '🎣',
      title: 'Fishing 10x',
      done: (stats.fishingCount || 0) >= 10,
      guide: '/sq game fishing',
      reward: 'Progress item & EXP',
    },
    {
      tier: 'Raider',
      emoji: '🏰',
      title: 'Menang dungeon 3x',
      done: (stats.dungeonWins || 0) >= 3,
      guide: '/sq game dungeon',
      reward: 'Loot + power growth',
    },
    {
      tier: 'Beastmaster',
      emoji: '🐾',
      title: 'Kumpulkan 3 pet',
      done: (Array.isArray(user.pets) ? user.pets.length : 0) >= 3,
      guide: '/sq pet catch',
      reward: 'Power score naik',
    },
    {
      tier: 'Ascend',
      emoji: '⭐',
      title: 'Capai level 5',
      done: (user.level || 1) >= 5,
      guide: 'hunt / quest / dungeon',
      reward: 'Unlock title lebih keren',
    },
  ];

  const available = missions.filter((m) => !m.done).slice(0, 4);
  const cleared = missions.filter((m) => m.done).length;
  return {
    summary: `${cleared}/${missions.length} mission selesai`,
    lines: (available.length ? available : missions.slice(0, 4))
      .map((m, i) => `${i + 1}. ${m.emoji} **${m.title}**\n> Tier: **${m.tier}** • Guide: \`${m.guide}\`\n> Reward vibe: ${m.reward}`)
      .join('\n\n'),
  };
}

function buildActivityDigest(user) {
  const stats = user.stats || {};
  const totalActions = (stats.huntCount || 0) + (stats.fishingCount || 0) + (stats.questCount || 0) + (stats.dungeonRuns || 0) + (stats.petCatchCount || 0);
  const combatScore = (stats.pvpWins || 0) * 3 + (stats.bossWins || 0) * 5 + (user.wins || 0);
  const economyScore = Math.floor((user.coin || 0) / 100) + (stats.dailyClaims || 0) * 2;
  const collectorScore = (Array.isArray(user.inventory) ? user.inventory.length : 0) + (Array.isArray(user.pets) ? user.pets.length * 3 : 0) + (user.achievements?.length || 0) * 2;

  const dominant = [
    { key: 'Economy', score: economyScore },
    { key: 'Combat', score: combatScore },
    { key: 'Collector', score: collectorScore },
    { key: 'Explorer', score: totalActions },
  ].sort((a, b) => b.score - a.score)[0];

  return {
    totalActions,
    dominant,
    fields: [
      { name: '🎯 Total Activity', value: `${totalActions} aksi`, inline: true },
      { name: '⚔️ Combat Score', value: `${combatScore}`, inline: true },
      { name: '💰 Economy Score', value: `${economyScore}`, inline: true },
      { name: '🧰 Collector Score', value: `${collectorScore}`, inline: true },
      { name: '🔥 Dominant Playstyle', value: dominant.key, inline: true },
      { name: '🏷️ Player Title', value: levelTitle(user.level), inline: true },
      { name: '📊 Breakdown', value: `Hunt ${stats.huntCount || 0} • Fish ${stats.fishingCount || 0} • Quest ${stats.questCount || 0} • Dungeon ${stats.dungeonRuns || 0} • Catch ${stats.petCatchCount || 0}`, inline: false },
    ],
  };
}

function dashboardComponents(ownerId, tab) {
  const select = new StringSelectMenuBuilder()
    .setCustomId(`select:dashboard:${ownerId}:${tab}`)
    .setPlaceholder('Pilih panel dashboard')
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel('Home Nexus').setDescription('Ringkasan akun & quick action').setValue('home').setEmoji('🌌').setDefault(tab === 'home'),
      new StringSelectMenuOptionBuilder().setLabel('Activity Tracker').setDescription('Stat, playstyle, dan digest progres').setValue('activity').setEmoji('📊').setDefault(tab === 'activity'),
      new StringSelectMenuOptionBuilder().setLabel('Quest Board').setDescription('Mission board & target progress').setValue('quests').setEmoji('📜').setDefault(tab === 'quests'),
      new StringSelectMenuOptionBuilder().setLabel('Fast Route').setDescription('Rute farming tercepat & rekomendasi').setValue('route').setEmoji('🧭').setDefault(tab === 'route'),
      new StringSelectMenuOptionBuilder().setLabel('Elite Tips').setDescription('Tips scaling power lebih sadis').setValue('elite').setEmoji('💎').setDefault(tab === 'elite'),
    );

  return [
    new ActionRowBuilder().addComponents(select),
    ...createActionButtons([
      { id: 'ui:daily', label: 'Daily', emoji: '🎁', style: ButtonStyle.Success },
      { id: 'ui:hunt', label: 'Hunt', emoji: '🏹', style: ButtonStyle.Primary },
      { id: 'ui:fishing', label: 'Fishing', emoji: '🎣', style: ButtonStyle.Primary },
      { id: 'ui:quest', label: 'Quest', emoji: '📜', style: ButtonStyle.Secondary },
      { id: 'ui:dungeon', label: 'Dungeon', emoji: '🏰', style: ButtonStyle.Danger },
    ]),
    ...createActionButtons([
      { id: 'ui:achievements', label: 'Achievements', emoji: '🏆', style: ButtonStyle.Secondary },
      { id: 'ui:rank', label: 'Rank', emoji: '⭐', style: ButtonStyle.Secondary },
      { id: 'ui:leaderboard', label: 'Leaderboard', emoji: '👑', style: ButtonStyle.Secondary },
      { id: 'ui:pets', label: 'Pets', emoji: '🐾', style: ButtonStyle.Secondary },
      { id: `nav:help:${ownerId}:home:0`, label: 'Guide', emoji: '🧠', style: ButtonStyle.Secondary },
    ]),
  ];
}

function buildDashboardView(user, ownerId = '0', tab = 'home') {
  const currentTab = ['home', 'activity', 'quests', 'route', 'elite'].includes(tab) ? tab : 'home';
  const art = commandCenterArtAttachment(user, currentTab);
  const need = expNeeded(user.level);
  const achievementCount = Array.isArray(user.achievements) ? user.achievements.length : 0;
  const activity = buildActivityDigest(user);
  const missions = buildMissionBoard(user);

  const payloadByTab = {
    home: {
      title: '🌌 Cosmic Corner Command Center',
      description: `Panel utama super interaktif buat **${levelTitle(user.level)}**.\n\nEXP **${user.exp}/${need}**\n${bar(Math.min(user.exp, need), need)}\n\n> Dari sini kamu bisa pindah ke tracker, mission board, atau jalur farming tercepat.`,
      fields: [
        { name: '💰 Coin', value: `${user.coin || 0}`, inline: true },
        { name: '⭐ Level', value: `${user.level || 1}`, inline: true },
        { name: '🏆 Achievement', value: `${achievementCount}/${ACHIEVEMENTS.length}`, inline: true },
        { name: '🐾 Pet', value: `${user.pets?.length || 0} koleksi`, inline: true },
        { name: '🎒 Inventory', value: `${user.inventory?.length || 0} item`, inline: true },
        { name: '🔥 Playstyle', value: activity.dominant.key, inline: true },
        { name: '🚀 Suggested Move', value: (user.lastDaily ? 'Lanjut hunt/quest untuk push level.' : 'Claim daily dulu, lalu gas hunt dan fishing.'), inline: false },
      ],
      color: COLORS.primary,
      footer: 'Cosmic Corner Bot • Command Center Nexus',
    },
    activity: {
      title: '📊 Activity Tracker',
      description: `Tracker ini nunjukin gaya main kamu saat ini.\n\n> Semakin seimbang economy + combat + collector, semakin cepat power score meledak.`,
      fields: activity.fields,
      color: COLORS.success,
      footer: 'Cosmic Corner Bot • Activity Tracker Ultra',
    },
    quests: {
      title: '📜 Interactive Quest Board',
      description: `Mission board dinamis berdasarkan progres akunmu.\n\n**Status:** ${missions.summary}`,
      fields: [
        { name: '🧩 Priority Missions', value: missions.lines, inline: false },
        { name: '⚡ Shortcut', value: '`daily` • `hunt` • `fishing` • `quest` • `dungeon` • `catch`', inline: false },
      ],
      color: COLORS.warning,
      footer: 'Cosmic Corner Bot • Mission Board Overdrive',
    },
    route: {
      title: '🧭 Fast Route Planner',
      description: 'Rute farm cepat buat boost akun tanpa buang momentum.',
      fields: [
        { name: '🌅 Early Game', value: '`start` → `daily` → `hunt` / `fishing` → `buy potion`', inline: false },
        { name: '🌇 Mid Game', value: '`quest` → `dungeon` → `catch` → `rank` → `achievements`', inline: false },
        { name: '🌃 Late Push', value: '`boss` → `pvp` → `leaderboard` → optimize pet & item', inline: false },
        { name: '💡 Pro Tip', value: 'Naik level sambil unlock achievement itu lebih efisien daripada cuma numpuk coin.', inline: false },
      ],
      color: COLORS.pet,
      footer: 'Cosmic Corner Bot • Route Optimizer X',
    },
    elite: {
      title: '💎 Elite Scaling Tips',
      description: 'Tips khusus buat bikin akunmu terasa jauh lebih premium dan sadis.',
      fields: [
        { name: '1. Stack Progress', value: 'Gabungin target level + achievement + pet dalam satu sesi grind.', inline: false },
        { name: '2. Jangan Diam di Coin', value: 'Coin yang nganggur mending diputar ke shop, item, atau setup pet.', inline: false },
        { name: '3. Keep Momentum', value: 'Daily claim → farm cepat → mission board → dungeon. Jangan putus streak main.', inline: false },
        { name: '4. Push Identity', value: `Playstyle kamu sekarang cenderung **${activity.dominant.key}**. Build di sana dulu, baru hybrid.`, inline: false },
      ],
      color: COLORS.danger,
      footer: 'Cosmic Corner Bot • Elite Meta Notes',
    },
  };

  const data = payloadByTab[currentTab];
  return {
    embeds: [
      createGameEmbed({
        ...data,
        image: attachmentImageUrl(art),
      }),
    ],
    files: [art],
    components: dashboardComponents(ownerId, currentTab),
  };
}

module.exports = {
  name: 'dashboard',
  buildDashboardView,
  async execute(msg) {
    const user = await getUser(msg.author.id);
    return msg.reply(buildDashboardView(user, msg.author.id, 'home'));
  },
};
