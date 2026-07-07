const { EmbedBuilder } = require('discord.js');

function createEmbed(title, desc) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .setColor("#FFB6C1")
    .setFooter({ text: "Cosmic Corner Bot! ✨" })
    .setTimestamp();
}

function bar(cur, max) {
  const size = 10;
  const fill = Math.round((cur/max)*size);
  return "🟩".repeat(fill) + "⬜".repeat(size-fill);
}

module.exports = { createEmbed, bar };