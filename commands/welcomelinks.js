const GuildConfig = require('../models/GuildConfig');
const { ensureAdmin } = require('../utils/admin');
const { createGameEmbed, COLORS } = require('../utils/theme');

const LINK_KEYS = {
  rules: { field: 'rulesChannelId', label: '📋 Rules' },
  event: { field: 'eventChannelId', label: '📢 Event & Update' },
  announcement: { field: 'announcementChannelId', label: '📢 Announcement' },
  report: { field: 'reportChannelId', label: '📮 Report Member' },
  verifyfemale: { field: 'verifyFemaleChannelId', label: '📇 Verify Female' },
};

function extractChannel(msg, args) {
  let mentioned = msg.mentions?.channels?.first?.() || null;
  if (!mentioned) {
    const raw = args.find((a) => /^<#(\d+)>$/.test(String(a)));
    if (raw && msg.guild?.channels?.cache) {
      const match = String(raw).match(/^<#(\d+)>$/);
      mentioned = msg.guild.channels.cache.get(match[1]) || null;
    }
  }
  return mentioned;
}

function buildStatusFields(links = {}) {
  return Object.entries(LINK_KEYS).map(([key, { field, label }]) => ({
    name: label,
    value: links[field] ? `<#${links[field]}>` : '`belum diset`',
    inline: true,
  }));
}

module.exports = {
  name: 'welcomelinks',
  async execute(msg, args = []) {
    if (!(await ensureAdmin(msg))) return;

    const guildId = msg.guild?.id;
    if (!guildId) {
      return msg.reply({
        embeds: [createGameEmbed({
          title: '🔗 Welcome Links',
          description: 'Command ini hanya bisa dipakai di server.',
          color: COLORS.warning,
          footer: 'Cosmic Corner Bot • Welcome Links',
        })],
      });
    }

    const action = String(args?.[0] || '').toLowerCase();
    const key = String(args?.[1] || '').toLowerCase();

    if (!action || !['set', 'off'].includes(action)) {
      const existing = await GuildConfig.findOne({ guildId }).lean();
      return msg.reply({
        embeds: [createGameEmbed({
          title: '🔗 Welcome Links Setup',
          description: 'Atur channel tujuan buat 5 link yang muncul di pesan sambutan member baru.',
          color: COLORS.primary,
          fields: buildStatusFields(existing?.welcomeLinks || {}),
          footer: 'Cosmic Corner Bot • Prefix: welcomelinks set <key> #channel',
        })],
      });
    }

    if (!LINK_KEYS[key]) {
      return msg.reply({
        embeds: [createGameEmbed({
          title: '⚠️ Key Tidak Valid',
          description: `Pilih salah satu: \`${Object.keys(LINK_KEYS).join('`, `')}\`\nContoh: \`welcomelinks set rules #rules\``,
          color: COLORS.danger,
          footer: 'Cosmic Corner Bot • Welcome Links',
        })],
      });
    }

    const { field, label } = LINK_KEYS[key];

    if (action === 'off') {
      await GuildConfig.findOneAndUpdate(
        { guildId },
        { $set: { [`welcomeLinks.${field}`]: null } },
        { upsert: true, new: true }
      );
      return msg.reply({
        embeds: [createGameEmbed({
          title: '🔕 Link Dimatikan',
          description: `${label} tidak akan lagi muncul di pesan welcome.`,
          color: COLORS.warning,
          footer: 'Cosmic Corner Bot • Welcome Links',
        })],
      });
    }

    const channel = extractChannel(msg, args);
    if (!channel) {
      return msg.reply({
        embeds: [createGameEmbed({
          title: '⚠️ Channel Belum Dipilih',
          description: `Pakai format \`welcomelinks set ${key} #channel\` atau slash command lalu pilih channel.`,
          color: COLORS.danger,
          footer: 'Cosmic Corner Bot • Welcome Links',
        })],
      });
    }

    await GuildConfig.findOneAndUpdate(
      { guildId },
      { $set: { [`welcomeLinks.${field}`]: channel.id } },
      { upsert: true, new: true }
    );

    return msg.reply({
      embeds: [createGameEmbed({
        title: '✅ Link Diatur',
        description: `${label} sekarang mengarah ke ${channel}.`,
        color: COLORS.success,
        footer: 'Cosmic Corner Bot • Welcome Links',
      })],
    });
  },
  LINK_KEYS,
};
