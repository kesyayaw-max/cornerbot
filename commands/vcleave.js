const { ensureAdmin } = require('../utils/admin');
const { leaveVoice, currentStandbyChannel } = require('../utils/voiceStandby');
const { createGameEmbed, COLORS } = require('../utils/theme');

module.exports = {
  name: 'vcleave',
  async execute(msg) {
    if (!(await ensureAdmin(msg))) return;

    const channel = currentStandbyChannel(msg.guild);
    const left = leaveVoice(msg.guild);

    return msg.reply({
      embeds: [createGameEmbed({
        title: left ? '👋 Bot Keluar Voice' : 'ℹ️ Bot Nggak Lagi di Voice',
        description: left
          ? `Bot udah keluar dari **${channel?.name || 'voice channel'}**.`
          : 'Bot memang lagi nggak standby di voice channel manapun.',
        color: left ? COLORS.primary : COLORS.warning,
      })],
    });
  },
};
