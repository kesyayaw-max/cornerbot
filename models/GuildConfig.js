const mongoose = require('mongoose');

const guildConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  voiceLogChannelId: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('GuildConfig', guildConfigSchema);
