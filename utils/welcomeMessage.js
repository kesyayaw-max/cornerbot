const { createGameEmbed, COLORS } = require('./theme');
const artUtil = require('./art');

// Builds the exact same welcome message payload used by guildMemberAdd,
// so the /welcomepreview command always shows what a real member will see.
async function buildWelcomeMessagePayload(member, memberCount, links = {}) {
  const art = await artUtil.welcomeArtAttachment(member, memberCount);
  const guildId = member.guild.id;

  const linkLine = (channelId, label) =>
    channelId ? `🔵 **${label}** » [KLIK DISINI](https://discord.com/channels/${guildId}/${channelId})` : null;

  const linkLines = [
    linkLine(links.rulesChannelId, 'BACA RULES SERVER'),
    linkLine(links.eventChannelId, 'EVENT & UPDATE TERBARU'),
    linkLine(links.announcementChannelId, 'PENGUMUMAN RESMI'),
    linkLine(links.reportChannelId, 'BUTUH BANTUAN? REPORT DISINI'),
    linkLine(links.verifyFemaleChannelId, 'KHUSUS CEWEK, JANGAN LUPA VERIFY'),
  ].filter(Boolean);

  const description = [
    `**WELCOME ${member} TO COSMIC CORNER, SEMOGA BETAH DISINI YA!**`,
    '',
    ...(linkLines.length ? [linkLines.join('\n'), ''] : []),
    'Terima kasih sudah bergabung dengan komunitas ini. Semoga kamu merasa nyaman, bisa menemukan teman baru, dan menikmati suasana di sini. Jangan ragu untuk ikut mengobrol dan berinteraksi dengan member lainnya ya.',
    '',
    'Kalau ada yang ingin ditanyakan, admin dan moderator siap membantu.\nSemoga betah dan enjoy di COSMIC CORNER!',
    '',
    '✅ **THANKS FOR JOINING COSMIC CORNER** ✅',
  ].join('\n');

  return {
    content: `👋 Selamat datang, ${member}!`,
    embeds: [
      createGameEmbed({
        description,
        color: COLORS.success,
        thumbnail: member.user.displayAvatarURL({ size: 256 }),
        image: artUtil.attachmentImageUrl(art),
        footer: `Cosmic Corner • Member ke-${memberCount}`,
      }),
    ],
    files: [art],
    allowedMentions: { users: [member.id] },
  };
}

module.exports = { buildWelcomeMessagePayload };
