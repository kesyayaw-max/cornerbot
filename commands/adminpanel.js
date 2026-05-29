const { ensureAdmin } = require('../utils/admin');
const { createGameEmbed, COLORS, createActionButtons } = require('../utils/theme');
const { adminArtAttachment, attachmentImageUrl } = require('../utils/art');

module.exports = {
  name: 'adminpanel',
  async execute(msg) {
    if (!(await ensureAdmin(msg))) return;

    const art = adminArtAttachment();
    return msg.reply({
      embeds: [createGameEmbed({
        title: '🛡️ Admin Control Center',
        description: 'Panel cepat untuk fitur admin bot.',
        color: COLORS.admin,
        image: attachmentImageUrl(art),
        fields: [
          { name: '📢 Broadcast', value: '`cc broadcast <pesan>` kirim pengumuman ke semua text channel yang bisa diakses bot.', inline: false },
          { name: '💸 Custom Cash', value: '`cc admincash <set/add/remove> @user <jumlah>` untuk ubah cash player.', inline: false },
          { name: '🧰 Quick Notes', value: 'Bisa dipakai untuk event, kompensasi bug, reward winner, atau reset ekonomi kecil.', inline: false },
          { name: '👑 Owner Access', value: 'Set `OWNER_ID` di `.env` supaya owner bot juga bisa akses command admin.', inline: false },
        ]
      })],
      files: [art],
      components: createActionButtons([
        { id: 'ui:adminhelp', label: 'Refresh Panel', emoji: '🛡️', style: 1 },
        { id: 'ui:profile', label: 'Profile', emoji: '🎮' },
      ])
    });
  }
};
