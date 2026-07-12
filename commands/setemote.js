const GuildConfig = require('../models/GuildConfig');
const { ensureAdmin } = require('../utils/admin');
const { createGameEmbed, COLORS } = require('../utils/theme');
const { EMOTE_KEYS } = require('../utils/emotes');

module.exports = {
  name: 'setemote',
  async execute(msg, args) {
    if (!(await ensureAdmin(msg))) return;

    const guildId = msg.guild?.id;
    if (!guildId) {
      return msg.reply({
        embeds: [createGameEmbed({
          title: '🎭 Custom Emote',
          description: 'Command ini hanya bisa dipakai di server.',
          color: COLORS.warning,
        })],
      });
    }

    const key = String(args?.[0] || '').toLowerCase();
    const emoji = args?.[1];

    if (!key || !EMOTE_KEYS.includes(key)) {
      const existing = await GuildConfig.findOne({ guildId }).lean();
      const map = existing?.customEmotes || {};
      const lines = EMOTE_KEYS.map((k) => `\`${k}\` → ${map[k] || '_default_'}`);
      return msg.reply({
        embeds: [createGameEmbed({
          title: '🎭 Custom Emote Setup',
          description: 'Ganti emote yang dipakai bot di minigame tertentu pakai emoji custom server kamu.',
          color: COLORS.primary,
          fields: [
            { name: '📌 Emote Saat Ini', value: lines.join('\n'), inline: false },
            { name: '🛠️ Prefix', value: `\`setemote <key> <emoji>\`\nKey valid: ${EMOTE_KEYS.map((k) => `\`${k}\``).join(', ')}`, inline: false },
            { name: '⚡ Slash', value: '`/cc admin setemote key:hunt emoji:<emoji_kamu>`', inline: false },
          ],
          footer: 'Cosmic Corner Bot • Custom Emote',
        })],
      });
    }

    if (!emoji) {
      return msg.reply({
        embeds: [createGameEmbed({
          title: '⚠️ Emoji Belum Diisi',
          description: 'Sertakan emoji-nya, contoh: `setemote hunt <:huntku:123456789012345678>` (harus emoji dari server kamu, custom atau unicode juga bisa).',
          color: COLORS.danger,
        })],
      });
    }

    await GuildConfig.findOneAndUpdate(
      { guildId },
      { $set: { [`customEmotes.${key}`]: emoji } },
      { upsert: true, returnDocument: 'after' }
    );

    return msg.reply({
      embeds: [createGameEmbed({
        title: '✅ Emote Diganti',
        description: `Emote untuk **${key}** sekarang: ${emoji}`,
        color: COLORS.success,
        footer: 'Cosmic Corner Bot • Custom Emote',
      })],
    });
  }
};
