const GuildConfig = require('../models/GuildConfig');
const { ensureAdmin } = require('../utils/admin');
const { createGameEmbed, COLORS } = require('../utils/theme');

module.exports = {
  name: 'welcome',
  async execute(msg, args) {
    if (!(await ensureAdmin(msg))) return;

    const action = String(args?.[0] || '').toLowerCase();
    let mentionedChannel = msg.mentions?.channels?.first?.() || null;
    if (!mentionedChannel && args?.[1]) {
      const match = String(args[1]).match(/^<#(\d+)>$/);
      if (match && msg.guild?.channels?.cache) {
        mentionedChannel = msg.guild.channels.cache.get(match[1]) || null;
      }
    }

    const guildId = msg.guild?.id;
    if (!guildId) {
      return msg.reply({
        embeds: [createGameEmbed({
          title: '👋 Welcome Setup',
          description: 'Command ini hanya bisa dipakai di server.',
          color: COLORS.warning,
          footer: 'Cosmic Corner Bot • Welcome',
        })],
      });
    }

    if (!action || !['set', 'off'].includes(action)) {
      const existing = await GuildConfig.findOne({ guildId }).lean();
      const current = existing?.welcomeChannelId ? `<#${existing.welcomeChannelId}>` : '`belum diset`';
      return msg.reply({
        embeds: [createGameEmbed({
          title: '👋 Welcome Setup',
          description: 'Atur channel buat kirim pesan sambutan otomatis pas ada member baru join.',
          color: COLORS.primary,
          fields: [
            { name: '📌 Channel Saat Ini', value: current, inline: false },
            { name: '🛠️ Prefix', value: '`welcome set #channel`\n`welcome off`', inline: true },
            { name: '⚡ Slash', value: '`/cc admin welcome action:set channel:#welcome`', inline: true },
          ],
          footer: 'Cosmic Corner Bot • Welcome',
        })],
      });
    }

    if (action === 'off') {
      await GuildConfig.findOneAndUpdate(
        { guildId },
        { $set: { welcomeChannelId: null } },
        { upsert: true, new: true }
      );

      return msg.reply({
        embeds: [createGameEmbed({
          title: '🔕 Welcome Message Dimatikan',
          description: 'Bot tidak akan lagi kirim sambutan otomatis sampai diaktifkan lagi.',
          color: COLORS.warning,
          footer: 'Cosmic Corner Bot • Welcome',
        })],
      });
    }

    if (!mentionedChannel) {
      return msg.reply({
        embeds: [createGameEmbed({
          title: '⚠️ Channel Belum Dipilih',
          description: 'Pakai format `welcome set #channel` atau slash command lalu pilih channel.',
          color: COLORS.danger,
          footer: 'Cosmic Corner Bot • Welcome',
        })],
      });
    }

    await GuildConfig.findOneAndUpdate(
      { guildId },
      { $set: { welcomeChannelId: mentionedChannel.id } },
      { upsert: true, new: true }
    );

    return msg.reply({
      embeds: [createGameEmbed({
        title: '✅ Welcome Message Aktif',
        description: `Sambutan member baru sekarang akan dikirim ke ${mentionedChannel}.`,
        color: COLORS.success,
        fields: [
          { name: '📣 Trigger', value: 'Otomatis saat member baru join server.', inline: true },
          { name: '🎨 Isi Pesan', value: 'Banner custom + jumlah member ke-berapa.', inline: true },
        ],
        footer: 'Cosmic Corner Bot • Welcome',
      })],
    });
  }
};
