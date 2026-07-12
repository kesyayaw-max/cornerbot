const mongoose = require('mongoose');

const guildConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  voiceLogChannelId: { type: String, default: null },
  welcomeChannelId: { type: String, default: null },
  welcomeLinks: {
    rulesChannelId: { type: String, default: null },
    eventChannelId: { type: String, default: null },
    announcementChannelId: { type: String, default: null },
    reportChannelId: { type: String, default: null },
    verifyFemaleChannelId: { type: String, default: null },
  },
  customEmotes: { type: Map, of: String, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('GuildConfig', guildConfigSchema);
