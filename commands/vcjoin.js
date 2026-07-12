const { ensureAdmin } = require('../utils/admin');
const { joinAndStandby } = require('../utils/voiceStandby');
const { createGameEmbed, COLORS } = require('../utils/theme');
const { safeReply } = require('../utils/safeReply');

module.exports = {
  name: 'vcjoin',
  async execute(msg, args) {
    if (!(await ensureAdmin(msg))) return;

    try {
      const { channel, alreadyThere } = await joinAndStandby(msg, args);

      return safeReply(msg, {
        embeds: [createGameEmbed({
          title: alreadyThere ? '🔊 Sudah Standby' : '✅ Bot Masuk Voice',
          description: alreadyThere
            ? `Bot udah standby di **${channel.name}**.`
            : `Bot sekarang standby di **${channel.name}** dan bakal tetap di situ.`,
          color: COLORS.success,
          fields: [
            { name: '📌 Catatan', value: 'Ini cuma buat jaga channel keliatan aktif — nggak nambah statistik jam voice member manapun.', inline: false },
          ],
          footer: 'Pakai `cc vcleave` buat keluarin bot dari voice',
        })],
      });
    } catch (err) {
      return safeReply(msg, {
        embeds: [createGameEmbed({
          title: '❌ Gagal Join Voice',
          description: err?.message || 'Terjadi kesalahan saat mencoba masuk voice channel.',
          color: COLORS.danger,
        })],
      });
    }
  },
};
