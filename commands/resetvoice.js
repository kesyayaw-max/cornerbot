const { createGameEmbed, COLORS } = require('../utils/theme');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: "resetvoice",
  description: "Reset leaderboard voice",

  async execute(message) {
    try {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply("❌ Hanya admin yang bisa reset leaderboard voice");
      }

      const User = require('../models/User');

      await User.updateMany({}, {
        $set: {
          "voice.totalMinutes": 0,
          "voice.totalXp": 0,
          "voice.totalCoins": 0
        }
      });

      return message.reply({
        embeds: [
          createGameEmbed({
            title: "🔄 Voice Leaderboard Reset",
            description: "Leaderboard voice berhasil di reset",
            color: COLORS.warning,
            footer: "Cosmic Corner Bot • Voice System"
          })
        ]
      });

    } catch (err) {
      console.error(err);
      message.reply("❌ Gagal reset leaderboard voice");
    }
  }
};