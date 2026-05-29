const { PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  name: 'broadcast',
  description: 'Broadcast message ke channel tertentu',

  async execute(msg, args = []) {
    if (!msg.memberPermissions?.has?.(PermissionFlagsBits.Administrator)) {
      return msg.reply({
        content: '❌ Hanya admin yang bisa broadcast.',
        ephemeral: true,
      });
    }

    let targetChannel = msg.channel;
    let pingMode = 'none';
    const textParts = [];

    for (const arg of args) {
      if (!arg) continue;

      if (arg === '--everyone') {
        pingMode = 'everyone';
        continue;
      }

      if (arg === '--here') {
        pingMode = 'here';
        continue;
      }

      const channelMatch = /^<#(\d+)>$/.exec(String(arg));
      if (channelMatch && msg.guild) {
        const found = msg.guild.channels.cache.get(channelMatch[1]);
        if (found) {
          targetChannel = found;
          continue;
        }
      }

      textParts.push(arg);
    }

    const message = textParts.join(' ').trim();

    if (!message) {
      return msg.reply({
        content: '❌ Isi pesan broadcast kosong.\nContoh: `sq broadcast <#channel> --everyone Halo semua!`',
        ephemeral: true,
      });
    }

    if (!targetChannel?.isTextBased?.()) {
      return msg.reply({
        content: '❌ Channel tujuan harus text channel.',
        ephemeral: true,
      });
    }

    if (
      typeof targetChannel.type !== 'undefined' &&
      targetChannel.type !== ChannelType.GuildText &&
      targetChannel.type !== ChannelType.PublicThread &&
      targetChannel.type !== ChannelType.PrivateThread &&
      targetChannel.type !== ChannelType.AnnouncementThread &&
      targetChannel.type !== ChannelType.GuildAnnouncement
    ) {
      return msg.reply({
        content: '❌ Broadcast hanya bisa dikirim ke channel teks.',
        ephemeral: true,
      });
    }

    let pingText = '';
    if (pingMode === 'everyone') pingText = '@everyone';
    if (pingMode === 'here') pingText = '@here';

    const embed = new EmbedBuilder()
      .setTitle('📢 Broadcast Message')
      .setDescription(message)
      .setColor('#ff9900')
      .setFooter({
        text: `Broadcast oleh ${msg.author?.username || msg.user?.username || 'Admin'}`,
      })
      .setTimestamp();

    await targetChannel.send({
      content: pingText || undefined,
      embeds: [embed],
      allowedMentions: {
        parse:
          pingMode === 'everyone'
            ? ['everyone']
            : pingMode === 'here'
            ? ['everyone']
            : [],
      },
    });

    return msg.reply({
      content: `✅ Broadcast dikirim ke ${targetChannel} • Ping: ${
        pingMode === 'none' ? 'tanpa ping' : pingMode
      }`,
      ephemeral: true,
    });
  },
};
