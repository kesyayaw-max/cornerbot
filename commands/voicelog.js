const GuildConfig = require('../models/GuildConfig');
const { ensureAdmin } = require('../utils/admin');
const { createGameEmbed, COLORS } = require('../utils/theme');

module.exports = {
  name: 'voicelog',
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
          title: '🎙️ Voice Log',
          description: 'Command ini hanya bisa dipakai di server.',
          color: COLORS.warning,
          footer: 'Cosmic Corner Bot • Voice Tracker',
        })],
      });
    }

    if (!action || !['set', 'off'].includes(action)) {
      const existing = await GuildConfig.findOne({ guildId }).lean();
      const current = existing?.voiceLogChannelId ? `<#${existing.voiceLogChannelId}>` : '`belum diset`';
      return msg.reply({
        embeds: [createGameEmbed({
          title: '🎙️ Voice Log Setup',
          description: 'Atur channel khusus untuk log user setelah selesai VC.',
          color: COLORS.primary,
          fields: [
            { name: '📌 Channel Saat Ini', value: current, inline: false },
            { name: '🛠️ Prefix', value: '`voicelog set #channel`\n`voicelog off`', inline: true },
            { name: '⚡ Slash', value: '`/cc admin voicelog action:set channel:#voice-log`', inline: true },
          ],
          footer: 'Cosmic Corner Bot • Voice Tracker',
        })],
      });
    }

    if (action === 'off') {
      await GuildConfig.findOneAndUpdate(
        { guildId },
        { $set: { voiceLogChannelId: null } },
        { upsert: true, new: true }
      );

      return msg.reply({
        embeds: [createGameEmbed({
          title: '🔕 Voice Log Dimatikan',
          description: 'Bot tidak akan lagi kirim log selesai VC sampai diaktifkan lagi.',
          color: COLORS.warning,
          footer: 'Cosmic Corner Bot • Voice Tracker',
        })],
      });
    }

    if (!mentionedChannel) {
      return msg.reply({
        embeds: [createGameEmbed({
          title: '⚠️ Channel Belum Dipilih',
          description: 'Pakai format `voicelog set #channel` atau slash command lalu pilih channel.',
          color: COLORS.danger,
          footer: 'Cosmic Corner Bot • Voice Tracker',
        })],
      });
    }

    await GuildConfig.findOneAndUpdate(
      { guildId },
      { $set: { voiceLogChannelId: mentionedChannel.id } },
      { upsert: true, new: true }
    );

    return msg.reply({
      embeds: [createGameEmbed({
        title: '✅ Voice Log Aktif',
        description: `Log selesai VC sekarang akan dikirim ke ${mentionedChannel}.`,
        color: COLORS.success,
        fields: [
          { name: '📣 Trigger', value: 'Saat user keluar VC atau pindah channel.', inline: true },
          { name: '⏱️ Filter', value: 'Session di bawah 15 detik akan diabaikan.', inline: true },
        ],
        footer: 'Cosmic Corner Bot • Voice Tracker',
      })],
    });
  }
};
