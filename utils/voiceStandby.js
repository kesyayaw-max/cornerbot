const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
} = require('@discordjs/voice');
const { PermissionsBitField, ChannelType } = require('discord.js');

const CONNECT_TIMEOUT = 15_000;

function resolveTargetChannel(msg, args) {
  // Prioritas: channel yang di-mention/ID lewat argument, kalau nggak ada pakai voice channel user sendiri
  const raw = args?.[0];
  if (raw) {
    const cleanId = raw.replace(/[<#>]/g, '');
    const byId = msg.guild.channels.cache.get(cleanId);
    if (byId && (byId.type === ChannelType.GuildVoice || byId.type === ChannelType.GuildStageVoice)) {
      return byId;
    }
    const byName = msg.guild.channels.cache.find(
      (c) => (c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice)
        && c.name.toLowerCase() === raw.toLowerCase()
    );
    if (byName) return byName;
  }
  return msg.member?.voice?.channel || null;
}

function checkJoinPermissions(voiceChannel, botMember) {
  const perms = voiceChannel.permissionsFor(botMember);
  if (!perms?.has(PermissionsBitField.Flags.ViewChannel)) {
    throw new Error('Bot butuh permission **View Channel** buat channel ini.');
  }
  if (!perms?.has(PermissionsBitField.Flags.Connect)) {
    throw new Error('Bot butuh permission **Connect** buat masuk channel ini.');
  }
}

async function joinAndStandby(msg, args) {
  const voiceChannel = resolveTargetChannel(msg, args);
  if (!voiceChannel) {
    throw new Error('Masuk voice channel dulu, atau sebutkan nama/ID channel-nya. Contoh: `cc vcjoin General`');
  }

  checkJoinPermissions(voiceChannel, msg.guild.members.me);

  const existing = getVoiceConnection(msg.guild.id);
  if (
    existing
    && existing.joinConfig?.channelId === voiceChannel.id
    && existing.state.status !== VoiceConnectionStatus.Destroyed
  ) {
    return { channel: voiceChannel, alreadyThere: true };
  }
  if (existing) {
    try { existing.destroy(); } catch {}
  }

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: msg.guild.id,
    adapterCreator: msg.guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: false,
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, CONNECT_TIMEOUT);
  } catch (err) {
    try { connection.destroy(); } catch {}
    throw new Error('Gagal konek ke voice channel (timeout). Coba lagi beberapa detik lagi.');
  }

  return { channel: voiceChannel, alreadyThere: false };
}

function leaveVoice(guild) {
  const connection = getVoiceConnection(guild.id);
  if (!connection) return false;
  connection.destroy();
  return true;
}

function currentStandbyChannel(guild) {
  const connection = getVoiceConnection(guild.id);
  if (!connection || connection.state.status === VoiceConnectionStatus.Destroyed) return null;
  return connection.joinConfig?.channelId
    ? guild.channels.cache.get(connection.joinConfig.channelId)
    : null;
}

module.exports = { joinAndStandby, leaveVoice, currentStandbyChannel };
