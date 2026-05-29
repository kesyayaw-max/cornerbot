const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);

require('dotenv').config();

process.env.DISCORD_DISABLE_VOICE_CONNECTION_TIMEOUT = 'true';

const fs = require('fs');
const mongoose = require('mongoose');
mongoose.set('bufferCommands', false);

const {
  Client,
  GatewayIntentBits,
  Collection,
  REST,
  Routes,
  SlashCommandBuilder,
  MessageFlags,
} = require('discord.js');

const { generateDependencyReport } = require('@discordjs/voice');
const { createGameEmbed, COLORS } = require('./utils/theme');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands = new Collection();

let mongoReady = false;
const GuildConfig = require('./models/GuildConfig');
const voiceSessions = new Map();

const {
  skip,
  stop,
  toggleLoop,
  pauseResume,
  adjustVolume,
  queueView,
  nowPlaying,
} = require('./utils/music');

const files = fs.readdirSync('./commands').filter((f) => f.endsWith('.js'));
for (const file of files) {
  const cmd = require(`./commands/${file}`);
  if (cmd?.name) {
    client.commands.set(cmd.name, cmd);
  }
}

const commandDescriptions = {
  resetvoice: 'Reset leaderboard voice',
  admincash: 'Admin ubah cash player',
  achievements: 'Lihat progress achievement',
  adminpanel: 'Buka panel admin bot',
  buybox: 'Beli lootbox / gacha box',
  lootbox: 'Buka lootbox / gacha',
  balance: 'Lihat coin kamu',
  blackjack: 'Game blackjack cepat',
  boss: 'Lawan boss untuk hadiah coin',
  broadcast: 'Broadcast pesan ke channel server',
  voicelog: 'Atur channel voice log server',
  buy: 'Beli item dari shop',
  catch: 'Tangkap pet baru',
  coinflip: 'Game coinflip',
  daily: 'Ambil reward harian',
  dashboard: 'Buka command center interaktif',
  dice: 'Tebak angka dadu',
  dungeon: 'Raid dungeon untuk loot',
  fishing: 'Mancing untuk hadiah coin',
  hunt: 'Berburu untuk dapat coin',
  help: 'Buka help menu interaktif',
  inventory: 'Lihat isi inventory',
  leaderboard: 'Lihat papan peringkat',
  petbattle: 'Battle memakai pet utama',
  petequip: 'Pilih pet utama kamu',
  pets: 'Lihat daftar pet kamu',
  profile: 'Lihat profil game kamu',
  pvp: 'Duel melawan player lain',
  quest: 'Jalankan quest harian mini',
  queue: 'Lihat antrean musik',
  rank: 'Lihat rank dan progress',
  rps: 'Main batu gunting kertas',
  shop: 'Lihat daftar shop',
  start: 'Dashboard onboarding dan quick start',
  skip: 'Lewati lagu yang sedang diputar',
  slot: 'Main slot machine',
  stop: 'Hentikan musik dan kosongkan antrean',
  nowplaying: 'Lihat lagu yang sedang diputar',
  loop: 'Aktif/nonaktif loop musik',
  play: 'Putar musik dari YouTube, Spotify, atau kata kunci',
  volume: 'Atur volume musik',
};

function addCommandOptions(builder, commandName) {
  if (commandName === 'buybox') {
    builder
      .addStringOption((opt) =>
        opt
          .setName('type')
          .setDescription('Jenis box')
          .setRequired(true)
          .addChoices(
            { name: 'common', value: 'common' },
            { name: 'rare', value: 'rare' },
            { name: 'epic', value: 'epic' }
          )
      )
      .addIntegerOption((opt) =>
        opt
          .setName('qty')
          .setDescription('Jumlah box')
          .setRequired(false)
      );
  }

  if (commandName === 'lootbox') {
    builder.addStringOption((opt) =>
      opt
        .setName('type')
        .setDescription('Jenis box')
        .setRequired(true)
        .addChoices(
          { name: 'common', value: 'common' },
          { name: 'rare', value: 'rare' },
          { name: 'epic', value: 'epic' }
        )
    );
  }

  if (commandName === 'slot') {
    builder.addIntegerOption((opt) =>
      opt.setName('bet').setDescription('Jumlah taruhan').setRequired(true)
    );
  }

  if (commandName === 'coinflip') {
    builder
      .addIntegerOption((opt) =>
        opt.setName('bet').setDescription('Jumlah taruhan').setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName('choice')
          .setDescription('Pilih heads atau tails')
          .setRequired(true)
          .addChoices(
            { name: 'heads', value: 'heads' },
            { name: 'tails', value: 'tails' }
          )
      );
  }

  if (commandName === 'buy') {
    builder.addStringOption((opt) =>
      opt
        .setName('item')
        .setDescription('Nama item')
        .setRequired(true)
        .addChoices(
          { name: 'potion', value: 'potion' },
          { name: 'sword', value: 'sword' },
          { name: 'petfood', value: 'petfood' }
        )
    );
  }

  if (commandName === 'volume') {
    builder.addIntegerOption((opt) =>
      opt.setName('value').setDescription('Volume 1-100').setRequired(true)
    );
  }

  if (commandName === 'play') {
    builder.addStringOption((opt) =>
      opt
        .setName('query')
        .setDescription('URL YouTube/Spotify atau judul lagu')
        .setRequired(true)
    );
  }

  if (commandName === 'dice') {
    builder
      .addIntegerOption((opt) =>
        opt.setName('bet').setDescription('Jumlah taruhan').setRequired(true)
      )
      .addIntegerOption((opt) =>
        opt.setName('guess').setDescription('Tebak angka 1-6').setRequired(true)
      );
  }

  if (commandName === 'blackjack') {
    builder.addIntegerOption((opt) =>
      opt.setName('bet').setDescription('Jumlah taruhan').setRequired(true)
    );
  }

  if (commandName === 'voicelog') {
    builder
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Atur voice log')
          .setRequired(true)
          .addChoices(
            { name: 'set', value: 'set' },
            { name: 'off', value: 'off' }
          )
      )
      .addChannelOption((opt) =>
        opt
          .setName('channel')
          .setDescription('Channel tujuan voice log')
          .setRequired(false)
      );
  }

  if (commandName === 'broadcast') {
    builder
      .addStringOption((opt) =>
        opt
          .setName('message')
          .setDescription('Isi pesan broadcast')
          .setRequired(true)
      )
      .addChannelOption((opt) =>
        opt
          .setName('channel')
          .setDescription('Channel tujuan broadcast')
          .setRequired(false)
      )
      .addStringOption((opt) =>
        opt
          .setName('ping')
          .setDescription('Jenis ping')
          .setRequired(false)
          .addChoices(
            { name: 'Tanpa Ping', value: 'none' },
            { name: '@everyone', value: 'everyone' },
            { name: '@here', value: 'here' }
          )
      );
  }

  if (commandName === 'admincash') {
    builder
      .addStringOption((opt) =>
        opt
          .setName('action')
          .setDescription('Pilih aksi')
          .setRequired(true)
          .addChoices(
            { name: 'set', value: 'set' },
            { name: 'add', value: 'add' },
            { name: 'remove', value: 'remove' }
          )
      )
      .addUserOption((opt) =>
        opt.setName('user').setDescription('Target user').setRequired(true)
      )
      .addIntegerOption((opt) =>
        opt.setName('amount').setDescription('Jumlah cash').setRequired(true)
      );
  }

  if (commandName === 'petequip') {
    builder.addIntegerOption((opt) =>
      opt
        .setName('number')
        .setDescription('Nomor pet yang ingin dipakai')
        .setRequired(true)
    );
  }

  if (commandName === 'pvp') {
    builder.addUserOption((opt) =>
      opt.setName('user').setDescription('Lawan duel').setRequired(true)
    );
  }

  if (commandName === 'rps') {
    builder
      .addIntegerOption((opt) =>
        opt.setName('bet').setDescription('Jumlah taruhan').setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName('pick')
          .setDescription('Pilih batu, gunting, atau kertas')
          .setRequired(true)
          .addChoices(
            { name: 'batu', value: 'batu' },
            { name: 'gunting', value: 'gunting' },
            { name: 'kertas', value: 'kertas' }
          )
      );
  }

  return builder;
}

const slashStructure = {
  main: ['start', 'dashboard', 'profile', 'balance', 'daily', 'shop', 'buy', 'buybox', 'lootbox', 'inventory', 'leaderboard', 'rank', 'help', 'achievements'],
  game: ['hunt', 'fishing', 'coinflip', 'dice', 'rps', 'slot', 'blackjack', 'quest', 'dungeon', 'boss', 'pvp'],
  pet: ['catch', 'pets', 'petequip', 'petbattle'],
  admin: ['adminpanel', 'admincash', 'broadcast', 'voicelog', 'resetvoice'],
  music: ['play', 'queue', 'nowplaying', 'skip', 'loop', 'stop', 'volume'],
};

const sqBuilder = new SlashCommandBuilder()
  .setName('sq')
  .setDescription('Cosmic Corner command center');

for (const [groupName, commandNames] of Object.entries(slashStructure)) {
  sqBuilder.addSubcommandGroup((group) => {
    group.setName(groupName).setDescription(`Menu ${groupName}`);
    for (const commandName of commandNames) {
      group.addSubcommand((sub) =>
        addCommandOptions(
          sub.setName(commandName).setDescription(commandDescriptions[commandName] || commandName),
          commandName
        )
      );
    }
    return group;
  });
}

const slashCommands = [sqBuilder.toJSON()];
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

function getMessageCommand(content) {
  const configuredPrefix = process.env.PREFIX || '!';
  const trimmed = String(content || '').trim();

  if (trimmed.startsWith(configuredPrefix)) {
    const withoutPrefix = trimmed.slice(configuredPrefix.length).trim();
    if (!withoutPrefix) return null;
    const parts = withoutPrefix.split(/ +/);
    return { cmd: parts.shift().toLowerCase(), args: parts };
  }

  if (/^sq\s+/i.test(trimmed)) {
    const withoutSq = trimmed.replace(/^sq\s+/i, '').trim();
    if (!withoutSq) return null;
    const parts = withoutSq.split(/ +/);
    return { cmd: parts.shift().toLowerCase(), args: parts };
  }

  return null;
}

function normalizePayload(data) {
  if (typeof data === 'string') return { content: data };
  return { ...(data || {}) };
}

async function safeInteractionReply(interaction, data) {
  const payload = normalizePayload(data);

  if (!interaction.deferred && !interaction.replied) {
    await interaction.reply(payload);
    return interaction.fetchReply().catch(() => null);
  }

  if (interaction.deferred && !interaction.replied) {
    await interaction.editReply(payload);
    return interaction.fetchReply().catch(() => null);
  }

  return interaction.followUp(payload);
}

function wrapEditableMessage(message, fallbackEdit) {
  return {
    raw: message,
    edit: async (nextData) => {
      const payload = normalizePayload(nextData);
      if (message?.editable && typeof message.edit === 'function') {
        return message.edit(payload);
      }
      return fallbackEdit(payload);
    },
  };
}

async function createSlashMessage(interaction) {
  let member = interaction.member;
  try {
    if ((!member || !member.voice) && interaction.guild && interaction.user?.id) {
      member = await interaction.guild.members.fetch(interaction.user.id);
    }
  } catch {}

  return {
    author: interaction.user,
    guild: interaction.guild,
    channel: interaction.channel,
    client: interaction.client,
    member,
    memberPermissions: interaction.memberPermissions,
    content: '',
    mentions: {
      users: {
        first: () => interaction.options?.getUser?.('user') || null,
      },
    },
    reply: async (data) => {
      const sent = await safeInteractionReply(interaction, data);
      return wrapEditableMessage(sent, async (payload) => interaction.editReply(payload));
    },
  };
}

function isAdminLike(interaction) {
  if (!interaction?.member) return false;
  if (process.env.OWNER_ID && interaction.user.id === process.env.OWNER_ID) return true;
  if (interaction.guild?.ownerId === interaction.user.id) return true;
  return interaction.member.permissions?.has('Administrator');
}

async function ensureMongoReply(interaction) {
  if (mongoReady) return true;

  const payload = { content: '❌ Database belum tersambung. Coba lagi sebentar ya.' };

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply(payload).catch(() => {});
  } else {
    await interaction.reply({ ...payload, flags: MessageFlags.Ephemeral }).catch(() => {});
  }

  return false;
}

function formatVoiceDuration(ms = 0) {
  const totalMinutes = Math.max(0, ms / 60000);
  if (totalMinutes < 1) return `${Math.max(1, Math.round(ms / 1000))} detik`;
  if (totalMinutes < 60) return `${totalMinutes.toFixed(1)} menit`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} jam ${minutes.toFixed(1)} menit`;
}

async function getVoiceLogChannel(guildId) {
  if (!guildId || !mongoReady) return null;
  const config = await GuildConfig.findOne({ guildId }).lean();
  return config?.voiceLogChannelId || null;
}

function isVoiceStateInactive(state) {
  if (!state || !state.channelId) return true;

  const isMuted =
    state.selfMute ||
    state.selfDeaf ||
    state.serverMute ||
    state.serverDeaf;

  const isAfk =
    !!state.guild?.afkChannelId &&
    state.channelId === state.guild.afkChannelId;

  return isMuted || isAfk;
}

function getEligibleVoiceMembers(channel) {
  if (!channel?.members) return [];

  return [...channel.members.values()].filter((member) => {
    if (!member || member.user?.bot) return false;

    const state = member.voice;
    if (!state?.channelId) return false;
    if (isVoiceStateInactive(state)) return false;

    return true;
  });
}

function getVoiceRewardMultiplier(activeCount = 0) {
  if (activeCount >= 5) return 1.25;
  if (activeCount >= 4) return 1.15;
  if (activeCount >= 3) return 1.05;
  if (activeCount >= 2) return 1;
  return 0;
}

function getActiveCountTier(activeCount = 0) {
  if (activeCount >= 5) return '5';
  if (activeCount >= 4) return '4';
  if (activeCount >= 3) return '3';
  if (activeCount >= 2) return '2';
  return '0';
}

function ensureSessionBuckets(session) {
  if (!session.activeBuckets) {
    session.activeBuckets = {
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    };
  }

  if (!session.currentTier) session.currentTier = '0';
  if (!session.lastTierAt) session.lastTierAt = Date.now();
}

function updateSessionTierTime(session, now = Date.now()) {
  ensureSessionBuckets(session);

  const elapsed = Math.max(0, now - (session.lastTierAt || now));
  if (elapsed > 0 && session.currentTier && session.currentTier !== '0') {
    session.activeBuckets[session.currentTier] += elapsed;
  }

  session.lastTierAt = now;
}

function syncChannelSessionPauses(channel, now = Date.now()) {
  if (!channel) return;

  const eligibleMembers = getEligibleVoiceMembers(channel);
  const activeCount = eligibleMembers.length;
  const enoughPeople = activeCount >= 2;
  const tier = getActiveCountTier(activeCount);

  for (const member of channel.members.values()) {
    if (!member || member.user?.bot) continue;

    const sessionKey = `${channel.guild.id}:${member.id}`;
    const session = voiceSessions.get(sessionKey);
    if (!session) continue;

    ensureSessionBuckets(session);

    const shouldPause = isVoiceStateInactive(member.voice) || !enoughPeople;
    const wasPaused = session.paused;

    if (!wasPaused && shouldPause) {
      updateSessionTierTime(session, now);
      session.paused = true;
      session.pausedAt = now;
      session.currentTier = '0';
    } else if (wasPaused && !shouldPause) {
      if (session.pausedAt) {
        session.totalPaused += now - session.pausedAt;
      }

      session.paused = false;
      session.pausedAt = null;
      session.currentTier = tier;
      session.lastTierAt = now;
    } else if (!wasPaused && !shouldPause) {
      if (session.currentTier !== tier) {
        updateSessionTierTime(session, now);
        session.currentTier = tier;
      }
    }
  }
}

function calculateVoiceRewards(durationMs = 0) {
  const totalMinutes = Math.max(0, durationMs / 60000);
  const roundedMinutes = Math.max(0, Math.floor(totalMinutes));
  const xpGain = roundedMinutes;
  const coinGain = Math.floor((roundedMinutes / 14) * 4);

  return {
    durationMs,
    totalMinutes,
    roundedMinutes,
    xpGain,
    coinGain,
  };
}

function calculateTieredVoiceRewards(activeBuckets = {}) {
  const bucket2 = Number(activeBuckets['2'] || 0);
  const bucket3 = Number(activeBuckets['3'] || 0);
  const bucket4 = Number(activeBuckets['4'] || 0);
  const bucket5 = Number(activeBuckets['5'] || 0);

  const weightedMs =
    (bucket2 * getVoiceRewardMultiplier(2)) +
    (bucket3 * getVoiceRewardMultiplier(3)) +
    (bucket4 * getVoiceRewardMultiplier(4)) +
    (bucket5 * getVoiceRewardMultiplier(5));

  return calculateVoiceRewards(weightedMs);
}

function getHighestMultiplier(activeBuckets = {}) {
  let maxTier = 2;

  for (const tier of ['5', '4', '3', '2']) {
    if ((activeBuckets[tier] || 0) > 0) {
      maxTier = Number(tier);
      break;
    }
  }

  return getVoiceRewardMultiplier(maxTier);
}

function formatTierBreakdown(activeBuckets = {}) {
  const lines = [];

  if ((activeBuckets['2'] || 0) > 0) {
    lines.push(`👥 Duo Time: ${Math.floor(activeBuckets['2'] / 60000)} menit`);
  }
  if ((activeBuckets['3'] || 0) > 0) {
    lines.push(`👥 Trio Time: ${Math.floor(activeBuckets['3'] / 60000)} menit`);
  }
  if ((activeBuckets['4'] || 0) > 0) {
    lines.push(`👥 Squad Time: ${Math.floor(activeBuckets['4'] / 60000)} menit`);
  }
  if ((activeBuckets['5'] || 0) > 0) {
    lines.push(`👥 Party Time: ${Math.floor(activeBuckets['5'] / 60000)} menit`);
  }

  return lines.join('\n') || 'Belum ada aktivitas VC.';
}

async function applyVoiceSessionRewards(userOrMember, durationMs = 0) {
  const userId = typeof userOrMember === 'string' ? userOrMember : userOrMember?.id;

  if (!userId || !mongoReady) {
    return { durationMs: 0, totalMinutes: 0, roundedMinutes: 0, xpGain: 0, coinGain: 0, user: null };
  }

  const rewards = calculateVoiceRewards(durationMs);
  if (rewards.totalMinutes <= 0) {
    return { ...rewards, user: null };
  }

  const { getUser } = require('./utils/getUser');
  const user = await getUser(userOrMember);

  user.voice.totalMinutes = Math.max(0, Number(user.voice.totalMinutes || 0) + rewards.totalMinutes);
  user.voice.totalXp = Math.max(0, Number(user.voice.totalXp || 0) + rewards.xpGain);
  user.voice.totalCoins = Math.max(0, Number(user.voice.totalCoins || 0) + rewards.coinGain);

  await user.save();
  return { ...rewards, user };
}

async function syncStoredUserProfiles() {
  if (!mongoReady || !client.guilds?.cache?.size) return;

  try {
    const User = require('./models/User');
    const { getUser } = require('./utils/getUser');

    const storedUsers = await User.find({}, 'userId').lean();
    if (!storedUsers.length) return;

    let synced = 0;

    for (const doc of storedUsers) {
      const userId = String(doc.userId || '');
      if (!userId) continue;

      for (const guild of client.guilds.cache.values()) {
        try {
          const member = await guild.members.fetch(userId).catch(() => null);
          if (!member || member.user?.bot) continue;

          await getUser(member);
          synced++;
          break;
        } catch {}
      }
    }

    console.log(`✅ Synced ${synced} user profile(s) ke MongoDB.`);
  } catch (err) {
    console.error('❌ Gagal sync user profiles:', err);
  }
}

async function registerSlashCommands() {
  try {
    const applicationId = process.env.CLIENT_ID || process.env.APPLICATION_ID || client.user?.id;
    if (!applicationId) {
      console.log('⚠️ Slash command dilewati: CLIENT_ID/APPLICATION_ID belum ada.');
      return;
    }

    const route = process.env.GUILD_ID
      ? Routes.applicationGuildCommands(applicationId, process.env.GUILD_ID)
      : Routes.applicationCommands(applicationId);

    console.log(`🔄 Registering /sq slash command${process.env.GUILD_ID ? ' ke guild' : ' secara global'}...`);
    await rest.put(route, { body: slashCommands });
    console.log('✅ Slash command /sq siap!');
  } catch (err) {
    console.error('❌ Gagal register slash command:', err);
  }
}

async function connectMongo() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI belum diisi di .env');
    }

    console.log('🔄 Menghubungkan ke MongoDB...');

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 20000,
      family: 4,
      maxPoolSize: 10,
    });

    mongoReady = true;
    console.log('✅ MongoDB connected');
  } catch (err) {
    mongoReady = false;
    console.error('❌ Gagal connect:', err);
  }
}

mongoose.connection.on('connected', () => {
  mongoReady = true;
  console.log('✅ Mongoose connected');
});

mongoose.connection.on('disconnected', () => {
  mongoReady = false;
  console.log('⚠️ Mongoose disconnected');
});

mongoose.connection.on('error', (err) => {
  mongoReady = false;
  console.error('❌ Mongoose error:', err);
});

client.on('clientReady', async () => {
  console.log(`🤖 Login sebagai ${client.user.tag}`);

  console.log("===== VOICE DEPENDENCY REPORT =====");
  console.log(generateDependencyReport());
  console.log("===================================");

  await registerSlashCommands();
  await syncStoredUserProfiles();

  const activities = [
    { name: 'Cosmic Corner Bot!🔥', type: 0 },
    { name: 'Bot Event! 🛡️', type: 2 },
    { name: 'Enjoy! 😎', type: 1, url: 'https://twitch.tv/' },
  ];

  setInterval(() => {
    const act = activities[Math.floor(Math.random() * activities.length)];
    client.user.setPresence({
      activities: [{ name: act.name, type: act.type, url: act.type === 1 ? act.url : undefined }],
      status: 'online',
    });
  }, 3000);
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  const parsed = getMessageCommand(msg.content);
  if (!parsed) return;

  const { cmd, args } = parsed;
  const command = client.commands.get(cmd);
  if (!command) return;

  try {
    if (!mongoReady) {
      return await msg.reply('❌ Database belum tersambung. Coba lagi sebentar ya.');
    }

    await command.execute(msg, args);
  } catch (err) {
    console.error(err);
    await msg.reply('❌ Terjadi error saat menjalankan command.').catch(() => {});
  }
});

client.on('interactionCreate', async (interaction) => {
  const respondNotOwner = async () => {
    const payload = {
      content: '⚠️ Tombol/menu ini cuma buat user yang buka panelnya.',
      flags: MessageFlags.Ephemeral,
    };

    if (interaction.deferred || interaction.replied) {
      return interaction.followUp(payload).catch(() => {});
    }
    return interaction.reply(payload).catch(() => {});
  };

  if (interaction.isButton()) {
    const customId = interaction.customId;

    const makeButtonMsg = () => ({
      author: interaction.user,
      guild: interaction.guild,
      channel: interaction.channel,
      client: interaction.client,
      member: interaction.member,
      memberPermissions: interaction.memberPermissions,
      content: '',
      mentions: { users: { first: () => null } },
      targetUser: interaction.message?.mentions?.users?.first?.() || null,
      reply: async (data) => {
        const payload = normalizePayload(data);
        const sent = await interaction.channel.send(payload);
        return wrapEditableMessage(sent, async (nextPayload) => sent.edit(nextPayload));
      },
    });

    const fakeMsg = {
      guild: interaction.guild,
      reply: (txt) =>
        interaction.reply({
          content: typeof txt === 'string' ? txt : txt?.content || 'OK',
          flags: MessageFlags.Ephemeral,
        }),
    };

    try {
      if (!mongoReady && !customId.startsWith('music:')) {
        return ensureMongoReply(interaction);
      }

      if (customId === 'music:skip') return skip(fakeMsg);
      if (customId === 'music:stop') return stop(fakeMsg);
      if (customId === 'music:loop') return toggleLoop(fakeMsg);
      if (customId === 'music:pause') return pauseResume(fakeMsg);
      if (customId === 'music:queue') return queueView(fakeMsg);
      if (customId === 'music:nowplaying') return nowPlaying(fakeMsg);
      if (customId === 'music:volup') return adjustVolume(fakeMsg, 10);
      if (customId === 'music:voldown') return adjustVolume(fakeMsg, -10);

      const buttonMsg = makeButtonMsg();

      if (customId.startsWith('nav:')) {
        const [, view, ownerId, rawPage] = customId.split(':');
        if (ownerId && ownerId !== interaction.user.id) return respondNotOwner();
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate().catch(() => {});
        const page = Number(rawPage) || 0;
        const { getUser } = require('./utils/getUser');
        const user = await getUser(interaction.user.id);

        if (view === 'pets') {
          const command = require('./commands/pets');
          return interaction.editReply(command.buildPetsView(user, interaction.user.id, page)).catch(() => {});
        }

        if (view === 'inventory') {
          const command = require('./commands/inventory');
          return interaction.editReply(command.buildInventoryView(user, interaction.user.id, page)).catch(() => {});
        }

        if (view === 'help') {
          const [, , ownerId, category, rawPage] = customId.split(':');
          if (ownerId && ownerId !== interaction.user.id) return respondNotOwner();
          const command = require('./commands/help');
          return interaction.editReply(command.buildHelpView(category || 'home', interaction.user.id, Number(rawPage) || 0)).catch(() => {});
        }

        if (view === 'dashboard') {
          const [, , ownerId, tab] = customId.split(':');
          if (ownerId && ownerId !== interaction.user.id) return respondNotOwner();
          const command = require('./commands/dashboard');
          return interaction.editReply(command.buildDashboardView(user, interaction.user.id, tab || 'home')).catch(() => {});
        }

        if (view === 'achievements') {
          const command = require('./commands/achievements');
          return interaction.editReply(command.buildAchievementsView(user, interaction.user.id, page)).catch(() => {});
        }
      }

      if (customId.startsWith('ui:')) {
        const action = customId.split(':')[1];
        const buttonCommands = {
          profile: ['profile', []],
          daily: ['daily', []],
          shop: ['shop', []],
          dungeon: ['dungeon', []],
          quest: ['quest', []],
          pets: ['pets', []],
          petbattle: ['petbattle', []],
          inventory: ['inventory', []],
          help: ['help', []],
          start: ['start', []],
          dashboard: ['dashboard', []],
          achievements: ['achievements', []],
          rank: ['rank', []],
          leaderboard: ['leaderboard', []],
          catch: ['catch', []],
          hunt: ['hunt', []],
          fishing: ['fishing', []],
          adminhelp: ['adminpanel', []],
        };

        if (buttonCommands[action]) {
          const [name, args] = buttonCommands[action];
          const command = client.commands.get(name);
          if (command) return command.execute(buttonMsg, args);
        }
      }

      if (customId.startsWith('buy:')) {
        const item = customId.split(':')[1];
        const command = client.commands.get('buy');
        if (command) return command.execute(buttonMsg, [item]);
      }
    } catch (err) {
      console.error(err);
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({
          content: '❌ Error saat memproses tombol.',
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      }
      return interaction.followUp({
        content: '❌ Error saat memproses tombol.',
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
    }
  }

  if (interaction.isStringSelectMenu()) {
    const customId = interaction.customId;

    try {
      if (!(await ensureMongoReply(interaction))) return;

      if (customId.startsWith('select:shop:')) {
        const [, , , ownerId] = customId.split(':');
        if (ownerId && ownerId !== interaction.user.id) return respondNotOwner();
        const command = require('./commands/shop');
        return interaction.update(command.buildShopView(interaction.values[0], interaction.user.id)).catch(() => {});
      }

      if (customId.startsWith('select:help:')) {
        const [, , ownerId] = customId.split(':');
        if (ownerId && ownerId !== interaction.user.id) return respondNotOwner();
        const command = require('./commands/help');
        return interaction.update(command.buildHelpView(interaction.values[0] || 'home', interaction.user.id, 0)).catch(() => {});
      }

      if (customId.startsWith('select:leaderboard:')) {
        const [, , ownerId] = customId.split(':');
        if (ownerId && ownerId !== interaction.user.id) return respondNotOwner();
        const command = require('./commands/leaderboard');
        return interaction.update(await command.buildLeaderboardView(interaction.values[0] || 'wealth', interaction.user.id)).catch(() => {});
      }

      if (customId.startsWith('select:dashboard:')) {
        const [, , ownerId] = customId.split(':');
        if (ownerId && ownerId !== interaction.user.id) return respondNotOwner();
        const { getUser } = require('./utils/getUser');
        const user = await getUser(interaction.user.id);
        const command = require('./commands/dashboard');
        return interaction.update(command.buildDashboardView(user, interaction.user.id, interaction.values[0] || 'home')).catch(() => {});
      }

      if (customId.startsWith('select:pets:')) {
        const [, , ownerId, currentPage] = customId.split(':');
        if (ownerId && ownerId !== interaction.user.id) return respondNotOwner();
        const { getUser } = require('./utils/getUser');
        const user = await getUser(interaction.user.id);
        const index = Number(interaction.values[0]);

        if (!Number.isNaN(index) && user.pets[index]) {
          user.equippedPet = index;
          await user.save();
        }

        const command = require('./commands/pets');
        return interaction.update(command.buildPetsView(user, interaction.user.id, Number(currentPage) || 0)).catch(() => {});
      }

      if (customId.startsWith('select:inventory:')) {
        const [, , ownerId, currentPage] = customId.split(':');
        if (ownerId && ownerId !== interaction.user.id) return respondNotOwner();
        const { getUser } = require('./utils/getUser');
        const user = await getUser(interaction.user.id);
        const invCommand = require('./commands/inventory');
        const items = invCommand.summarizeInventory(user);
        const selected = items.find((item) => item.key === interaction.values[0]);
        const artUtil = require('./utils/art');
        const theme = require('./utils/theme');
        const art = selected ? artUtil.itemArtAttachment(selected.meta) : null;

        return interaction.reply({
          flags: MessageFlags.Ephemeral,
          embeds: [
            theme.createGameEmbed({
              title: `🎁 ${selected?.meta?.name || 'Item'}`,
              description: selected
                ? `${selected.meta.emoji} Kamu punya **${selected.qty}x** item ini.`
                : 'Item tidak ditemukan.',
              color: theme.COLORS.primary,
              image: art ? artUtil.attachmentImageUrl(art) : undefined,
              fields: selected
                ? [
                    { name: 'Deskripsi', value: selected.description, inline: false },
                    { name: 'Quick Buy', value: `\`sq buy ${selected.key}\``, inline: true },
                    { name: 'Halaman', value: `${(Number(currentPage) || 0) + 1}`, inline: true },
                  ]
                : [],
            }),
          ],
          files: art ? [art] : [],
        }).catch(() => {});
      }
    } catch (err) {
      console.error(err);
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({
          content: '❌ Error saat memproses menu.',
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      }
      return interaction.followUp({
        content: '❌ Error saat memproses menu.',
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
    }
  }

  if (interaction.isChatInputCommand()) {
    if (interaction.commandName !== 'sq') return;

    try {
      await interaction.deferReply();

      if (!(await ensureMongoReply(interaction))) return;

      const subcommandGroup = interaction.options.getSubcommandGroup(false);
      const subcommand = interaction.options.getSubcommand();
      const command = client.commands.get(subcommand);
      if (!command) {
        return interaction.editReply({ content: '❌ Command tidak ditemukan.' }).catch(() => {});
      }

      if (subcommandGroup === 'admin' && !isAdminLike(interaction)) {
        return interaction.editReply({ content: '❌ Command ini hanya untuk admin.' }).catch(() => {});
      }

      const fakeMsg = await createSlashMessage(interaction);
      const args = [];

      if (subcommand === 'slot') args.push(interaction.options.getInteger('bet'));
      if (subcommand === 'coinflip') {
        args.push(interaction.options.getInteger('bet'));
        args.push(interaction.options.getString('choice'));
      }
      if (subcommand === 'buy') args.push(interaction.options.getString('item'));
      if (subcommand === 'play') args.push(interaction.options.getString('query'));
      if (subcommand === 'volume') args.push(interaction.options.getInteger('value'));
      if (subcommand === 'dice') {
        args.push(interaction.options.getInteger('bet'));
        args.push(interaction.options.getInteger('guess'));
      }
      if (subcommand === 'blackjack') args.push(interaction.options.getInteger('bet'));
      if (subcommand === 'buybox') {
        args.push(interaction.options.getString('type'));
        args.push(interaction.options.getInteger('qty') || 1);
      }

      if (subcommand === 'lootbox') {
        args.push(interaction.options.getString('type'));
      }

      if (subcommand === 'broadcast') {
        const message = interaction.options.getString('message');
        const channel = interaction.options.getChannel('channel');
        const ping = interaction.options.getString('ping');

        if (channel) args.push(`<#${channel.id}>`);
        if (ping === 'everyone') args.push('--everyone');
        if (ping === 'here') args.push('--here');
        if (message) args.push(message);
      }

      if (subcommand === 'voicelog') {
        args.push(interaction.options.getString('action'));
        const channel = interaction.options.getChannel('channel');
        if (channel) args.push(`<#${channel.id}>`);
      }

      if (subcommand === 'admincash') {
        args.push(interaction.options.getString('action'));
        args.push(interaction.options.getInteger('amount'));
        fakeMsg.targetUser = interaction.options.getUser('user');
      }

      if (subcommand === 'petequip') args.push(interaction.options.getInteger('number'));
      if (subcommand === 'pvp') fakeMsg.targetUser = interaction.options.getUser('user');

      if (subcommand === 'rps') {
        args.push(interaction.options.getInteger('bet'));
        args.push(interaction.options.getString('pick'));
      }

      await command.execute(fakeMsg, args);
    } catch (err) {
      console.error(err);
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content: '❌ Error saat menjalankan command.' }).catch(() => {});
      } else {
        await interaction.reply({
          content: '❌ Error saat menjalankan command.',
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      }
    }
  }
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  try {
    if (!mongoReady) return;

    const member = newState.member || oldState.member;
    if (!member || member.user?.bot) return;

    const guildId = newState.guild?.id || oldState.guild?.id;
    const sessionKey = `${guildId}:${member.id}`;
    const now = Date.now();

    const oldChannelId = oldState.channelId;
    const newChannelId = newState.channelId;

    if (!oldChannelId && newChannelId) {
      voiceSessions.set(sessionKey, {
        channelId: newChannelId,
        startTime: now,
        paused: true,
        pausedAt: now,
        totalPaused: 0,
        activeBuckets: {
          '2': 0,
          '3': 0,
          '4': 0,
          '5': 0,
        },
        currentTier: '0',
        lastTierAt: now,
      });

      syncChannelSessionPauses(newState.channel, now);
      return;
    }

    const session = voiceSessions.get(sessionKey);
    if (!session) {
      if (newState.channel) syncChannelSessionPauses(newState.channel, now);
      if (oldState.channel && oldState.channelId !== newState.channelId) {
        syncChannelSessionPauses(oldState.channel, now);
      }
      return;
    }

    if (oldChannelId && newChannelId && oldChannelId === newChannelId) {
      syncChannelSessionPauses(newState.channel, now);
      return;
    }

    if (oldChannelId && (!newChannelId || oldChannelId !== newChannelId)) {
      ensureSessionBuckets(session);

      if (!session.paused) {
        updateSessionTierTime(session, now);
      }

      let durationMs = now - session.startTime;

      if (session.paused && session.pausedAt) {
        session.totalPaused += now - session.pausedAt;
      }

      durationMs -= session.totalPaused;
      voiceSessions.delete(sessionKey);

      const weightedRewards = calculateTieredVoiceRewards(session.activeBuckets);
      const rewardDurationMs = weightedRewards.durationMs || 0;

      if (rewardDurationMs >= 15000) {
        const rewards = await applyVoiceSessionRewards(member, rewardDurationMs);

        const logChannelId = await getVoiceLogChannel(guildId);
        if (logChannelId) {
          const logChannel =
            newState.guild?.channels.cache.get(logChannelId) ||
            oldState.guild?.channels.cache.get(logChannelId);

          if (logChannel && logChannel.isTextBased()) {
            const movedChannel = !!newChannelId && oldChannelId !== newChannelId;
            const multiplier = getHighestMultiplier(session.activeBuckets);

            await logChannel.send({
              embeds: [
                createGameEmbed({
                  title: '🎮 Voice Session Complete',
                  description: movedChannel
                    ? `${member} selesai farming voice reward di **${oldState.channel?.name || 'Unknown Channel'}** dan pindah ke **${newState.channel?.name || 'Unknown Channel'}**.`
                    : `${member} selesai farming voice reward di **${oldState.channel?.name || 'Unknown Channel'}**.`,
                  color: movedChannel ? COLORS.primary : COLORS.success,
                  fields: [
                    {
                      name: '⏱️ Waktu Main',
                      value: formatVoiceDuration(durationMs),
                      inline: true,
                    },
                    {
                      name: '🎯 Waktu Dihitung',
                      value: formatVoiceDuration(rewardDurationMs),
                      inline: true,
                    },
                    {
                      name: '⚡ Bonus Party',
                      value: `x${multiplier.toFixed(2)}`,
                      inline: true,
                    },
                    {
                      name: '👥 Party Activity',
                      value: formatTierBreakdown(session.activeBuckets),
                      inline: false,
                    },
                    {
                      name: '✨ XP Didapat',
                      value: `${rewards.xpGain} XP`,
                      inline: true,
                    },
                    {
                      name: '💰 Coin Didapat',
                      value: `${rewards.coinGain} coin`,
                      inline: true,
                    },
                    {
                      name: '🏦 Total Waktu VC',
                      value: `${Math.floor(rewards.user?.voice?.totalMinutes || 0)} menit`,
                      inline: true,
                    },
                    ...(movedChannel
                      ? [
                          { name: '📤 Dari Channel', value: `<#${oldChannelId}>`, inline: true },
                          { name: '📥 Pindah Ke', value: `<#${newChannelId}>`, inline: true },
                        ]
                      : [
                          { name: '🔊 Channel', value: `<#${oldChannelId}>`, inline: true },
                          { name: '🕓 Selesai', value: `<t:${Math.floor(now / 1000)}:t>`, inline: true },
                        ]),
                  ],
                  footer: 'Cosmic Corner Bot • Voice Tracker',
                }),
              ],
              allowedMentions: { users: [member.id] },
            }).catch(() => {});
          }
        }
      }

      if (oldState.channel) {
        syncChannelSessionPauses(oldState.channel, now);
      }

      if (newChannelId) {
        voiceSessions.set(sessionKey, {
          channelId: newChannelId,
          startTime: now,
          paused: true,
          pausedAt: now,
          totalPaused: 0,
          activeBuckets: {
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0,
          },
          currentTier: '0',
          lastTierAt: now,
        });

        syncChannelSessionPauses(newState.channel, now);
      }
    }
  } catch (error) {
    console.error('voiceStateUpdate error:', error);
  }
});

// ===== WEBSITE 1:1 DISCORD LEADERBOARD API =====
const express = require('express');
const User = require('./models/User');

const apiApp = express();

function formatVoiceTime(minutes = 0) {
  const total = Math.floor(minutes); // buang desimal
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}j ${m}m`;
}

function getMedal(index) {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `#${index + 1}`;
}

async function buildVoiceLeaderboardPayload() {
  const users = await User.find({
    'voice.totalMinutes': { $gt: 0 },
  })
    .sort({ 'voice.totalMinutes': -1 })
    .limit(10)
    .lean();

  const leaderboard = users.map((u, i) => ({
    rank: i + 1,
    medal: getMedal(i),
    userId: u.userId,
    name: u.displayName || u.username || (u.userId ? `User ${String(u.userId).slice(-4)}` : 'Unknown'),
    avatar: u.avatar || null,
    time: formatVoiceTime(u.voice?.totalMinutes || 0),
    totalMinutes: u.voice?.totalMinutes || 0,
    xp: u.voice?.totalXp || 0,
    coins: u.voice?.totalCoins || 0,
  }));

  return {
    ok: true,
    source: 'botsteakbeta2',
    updatedAt: new Date().toISOString(),
    leaderboard,
    podium: leaderboard.slice(0, 3),
    insights: {
      topTime: leaderboard[0]?.time || '0j 0m',
      topXp: leaderboard[0]?.xp || 0,
      topCoins: leaderboard[0]?.coins || 0,
    },
  };
}

apiApp.get('/health', (req, res) => {
  res.json({
    ok: true,
    bot: client.user?.tag || null,
    mongoReady,
    status: 'running',
  });
});

apiApp.get('/api/leaderboard/voice', async (req, res) => {
  try {
    if (!mongoReady) {
      return res.status(503).json({
        ok: false,
        error: 'MongoDB belum tersambung',
        leaderboard: [],
      });
    }

    const payload = await buildVoiceLeaderboardPayload();
    return res.json(payload);
  } catch (err) {
    console.error('API ERROR:', err);
    return res.status(500).json({
      ok: false,
      error: 'API error',
      message: err.message,
      leaderboard: [],
    });
  }
});

let apiServerStarted = false;

function startApiServer() {
  if (apiServerStarted) return;

  const PORT = process.env.PORT || process.env.API_PORT || 3000;
  apiApp.listen(PORT, () => {
    apiServerStarted = true;
    console.log(`🌐 API aktif di port ${PORT}`);
  });
}

// ===== START BOT + MONGODB + API =====
(async () => {
  try {
    await connectMongo();

    if (!mongoReady) {
      console.warn('⚠️ MongoDB belum tersambung. Bot tetap login, tapi command database akan menunggu koneksi.');
    }

    await client.login(process.env.TOKEN);
    startApiServer();
  } catch (err) {
    console.error('❌ Startup error:', err);
    process.exit(1);
  }
})();

