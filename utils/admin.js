const { PermissionsBitField } = require('discord.js');
const { createGameEmbed, COLORS } = require('./theme');

function isAdminLike(msg) {
  if (msg.memberPermissions?.has?.(PermissionsBitField.Flags.Administrator)) return true;
  if (msg.member?.permissions?.has?.(PermissionsBitField.Flags.Administrator)) return true;
  if (msg.author?.id && process.env.OWNER_ID && msg.author.id === process.env.OWNER_ID) return true;
  return false;
}

async function ensureAdmin(msg) {
  if (isAdminLike(msg)) return true;
  await msg.reply({
    embeds: [createGameEmbed({
      title: '🛡️ Admin Only',
      description: 'Command ini hanya bisa dipakai admin server atau OWNER_ID bot.',
      color: COLORS.danger,
      footer: 'Cosmic Corner Bot • Security Check',
    })]
  });
  return false;
}

module.exports = { isAdminLike, ensureAdmin };
