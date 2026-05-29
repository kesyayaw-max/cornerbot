const { playMusic } = require('../utils/music');
const { createGameEmbed, COLORS } = require('../utils/theme');

module.exports = {
  name: 'play',
  async execute(msg, args) {
    const query = args.join(' ').trim();
    if (!query) {
      return msg.reply({
        embeds: [createGameEmbed({
          title: '🎵 Cara Pakai Music',
          description: 'Pakai URL YouTube, URL Spotify, atau judul lagu.\n\nContoh:\n`sq play https://youtu.be/...`\n`sq play https://open.spotify.com/track/...`\n`sq play lofi hip hop`',
          color: COLORS.primary,
        })],
      });
    }

    try {
      await playMusic(msg, query);
    } catch (err) {
      console.error('Play command error:', err);

      let description = err?.message || 'Gagal memutar musik.';

      if (
        description.includes('Gagal masuk voice channel') ||
        description.includes('Masuk voice channel dulu') ||
        description.includes('Bot butuh permission') ||
        description.includes('AbortError')
      ) {
        description =
          'Bot gagal masuk ke voice channel.\n\nCoba ini:\n' +
          '• pastikan kamu sudah masuk voice channel\n' +
          '• pakai voice channel biasa, jangan stage\n' +
          '• coba voice channel lain\n' +
          '• pastikan bot punya izin **View Channel**, **Connect**, dan **Speak**\n' +
          '• kalau pakai VPN/firewall, coba matikan dulu\n' +
          '• coba lagi beberapa detik lagi';
      }

      await msg.reply({
        embeds: [createGameEmbed({
          title: '❌ Music Error',
          description,
          color: COLORS.danger,
        })],
      }).catch(() => {});
    }
  },
};
