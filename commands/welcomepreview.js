const GuildConfig = require('../models/GuildConfig');
const { ensureAdmin } = require('../utils/admin');
const { createGameEmbed, COLORS } = require('../utils/theme');
const { buildWelcomeMessagePayload } = require('../utils/welcomeMessage');

module.exports = {
  name: 'welcomepreview',
  async execute(msg, args = []) {
    if (!(await ensureAdmin(msg))) return;

    const guildId = msg.guild?.id;
    if (!guildId) {
      return msg.reply({
        embeds: [createGameEmbed({
          title: '👁️ Welcome Preview',
          description: 'Command ini hanya bisa dipakai di server.',
          color: COLORS.warning,
          footer: 'Cosmic Corner Bot • Welcome Preview',
        })],
      });
    }

    // Optional: preview pakai avatar/nama user lain (mention atau slash "user" option).
    // Kalau tidak dikasih, dipreview pakai akun yang manggil command-nya sendiri.
    const targetUser = msg.mentions?.users?.first?.() || msg.targetUser || msg.author;
    const member = await msg.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
      return msg.reply({
        embeds: [createGameEmbed({
          title: '⚠️ Member Tidak Ditemukan',
          description: 'Gak nemu data member itu di server ini.',
          color: COLORS.danger,
          footer: 'Cosmic Corner Bot • Welcome Preview',
        })],
      });
    }

    const config = await GuildConfig.findOne({ guildId }).lean();
    const memberCount = msg.guild.memberCount || 0;
    const payload = await buildWelcomeMessagePayload(member, memberCount, config?.welcomeLinks || {});

    const missingLinks = ['rules', 'event', 'announcement', 'report', 'verifyfemale'].filter((key) => {
      const fieldMap = {
        rules: 'rulesChannelId',
        event: 'eventChannelId',
        announcement: 'announcementChannelId',
        report: 'reportChannelId',
        verifyfemale: 'verifyFemaleChannelId',
      };
      return !config?.welcomeLinks?.[fieldMap[key]];
    });

    await msg.reply({
      embeds: [createGameEmbed({
        title: '👁️ Preview Welcome Message',
        description: !config?.welcomeChannelId
          ? '⚠️ Channel welcome belum di-set (`welcome set #channel`). Ini cuma pratinjau, gak dikirim otomatis nanti sebelum di-set.'
          : `Ini pratinjau persis kayak yang bakal dikirim ke ${`<#${config.welcomeChannelId}>`} kalau ada member baru join. Preview ini cuma tampil di sini, gak dikirim ke channel welcome asli.`,
        color: COLORS.primary,
        fields: missingLinks.length
          ? [{ name: '🔗 Link Belum Diset', value: missingLinks.map((k) => `\`${k}\``).join(', '), inline: false }]
          : [],
        footer: 'Cosmic Corner Bot • Welcome Preview',
      })],
    });

    await msg.channel.send(payload).catch(() => {});
  },
};
