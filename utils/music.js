
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
} = require('@discordjs/voice');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
} = require('discord.js');
const play = require('play-dl');
const { getData } = require('spotify-url-info')(fetch);

const queue = new Map();
const CONNECT_TIMEOUT = 20_000;
const TRANSITION_TIMEOUT = 7_500;

function getQueue(guildId) {
  return queue.get(guildId);
}

function progressBar(size = 12) {
  return '▰'.repeat(Math.max(1, size - 3)) + '▱'.repeat(3);
}

function musicButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('music:skip').setLabel('⏭ Skip').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('music:pause').setLabel('⏯ Pause/Resume').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('music:loop').setLabel('🔁 Loop').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('music:stop').setLabel('⏹ Stop').setStyle(ButtonStyle.Danger)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('music:queue').setLabel('📜 Queue').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('music:nowplaying').setLabel('🎵 Now Playing').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('music:voldown').setLabel('🔉 Vol -').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('music:volup').setLabel('🔊 Vol +').setStyle(ButtonStyle.Secondary)
    ),
  ];
}

function createMusicEmbed({ title, description, footer, fields = [], color = 0x8b5cf6 }) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .addFields(fields)
    .setFooter({ text: footer || 'Cosmic Corner Music' })
    .setTimestamp();
}

async function resolveSpotify(query) {
  const data = await getData(query);
  if (!data) throw new Error('Spotify link tidak bisa dibaca.');

  const tracks = [];

  if (Array.isArray(data.trackList) && data.trackList.length) {
    for (const track of data.trackList.slice(0, 10)) {
      const title = track.title || track.name || 'Unknown Track';
      const artist = track.subtitle || track.artist || track.artists?.[0]?.name || '';
      const search = `${title} ${artist}`.trim();
      const result = await play.search(search, { limit: 1, source: { youtube: 'video' } });

      if (result?.[0]?.url) {
        tracks.push({
          title: `${title}${artist ? ` — ${artist}` : ''}`,
          url: result[0].url,
          source: 'spotify',
          requestedQuery: query,
        });
      }
    }

    return tracks;
  }

  const name = data.name || data.title || 'Unknown Track';
  const artist = data.artists?.[0]?.name || data.artist || data.subtitle || '';
  const result = await play.search(`${name} ${artist}`.trim(), {
    limit: 1,
    source: { youtube: 'video' },
  });

  if (!result?.[0]?.url) {
    throw new Error('Tidak menemukan padanan YouTube untuk link Spotify itu.');
  }

  return [{
    title: `${name}${artist ? ` — ${artist}` : ''}`,
    url: result[0].url,
    source: 'spotify',
    requestedQuery: query,
  }];
}

async function resolveSongs(query) {
  const raw = String(query || '').trim();
  if (!raw) throw new Error('Query lagu kosong.');

  if (raw.includes('spotify.com')) return resolveSpotify(raw);

  if (play.yt_validate(raw) === 'playlist') {
    const playlist = await play.playlist_info(raw, { incomplete: true });
    const videos = await playlist.all_videos();

    return videos.slice(0, 15).map((video) => ({
      title: video.title,
      url: video.url,
      source: 'youtube-playlist',
      requestedQuery: raw,
    }));
  }

  if (play.yt_validate(raw) === 'video') {
    const info = await play.video_basic_info(raw);
    return [{
      title: info.video_details.title,
      url: raw,
      source: 'youtube',
      requestedQuery: raw,
    }];
  }

  const result = await play.search(raw, { limit: 1, source: { youtube: 'video' } });
  if (!result?.[0]?.url) throw new Error('Lagu tidak ditemukan.');

  return [{
    title: result[0].title,
    url: result[0].url,
    source: 'search',
    requestedQuery: raw,
  }];
}

async function resolveVoiceChannel(msg) {
  const guild = msg.guild;
  const userId = msg.author?.id || msg.user?.id;
  if (!guild || !userId) return null;

  if (msg.member?.voice?.channel) return msg.member.voice.channel;

  const cachedVoiceState = guild.voiceStates?.cache?.get(userId);
  if (cachedVoiceState?.channel) return cachedVoiceState.channel;

  const cachedMember = guild.members?.cache?.get(userId);
  if (cachedMember?.voice?.channel) return cachedMember.voice.channel;

  try {
    const fetchedMember = await guild.members.fetch(userId);
    if (fetchedMember?.voice?.channel) return fetchedMember.voice.channel;
  } catch (err) {
    console.error('Gagal fetch member voice state:', err);
  }

  const refreshedVoiceState = guild.voiceStates?.cache?.get(userId);
  if (refreshedVoiceState?.channel) return refreshedVoiceState.channel;

  return null;
}

function ensureVoicePermissions(voiceChannel, me) {
  const permissions = voiceChannel.permissionsFor(me);
  if (!permissions?.has(PermissionsBitField.Flags.ViewChannel)) {
    throw new Error('Bot butuh permission View Channel.');
  }
  if (!permissions?.has(PermissionsBitField.Flags.Connect)) {
    throw new Error('Bot butuh permission Connect.');
  }

  const isStage = voiceChannel.type === ChannelType.GuildStageVoice;
  if (!isStage && !permissions?.has(PermissionsBitField.Flags.Speak)) {
    throw new Error('Bot butuh permission Speak.');
  }
}

async function waitForUsableConnection(connection) {
  if (connection.state.status === VoiceConnectionStatus.Ready) return connection;

  try {
    await Promise.race([
      entersState(connection, VoiceConnectionStatus.Signalling, TRANSITION_TIMEOUT),
      entersState(connection, VoiceConnectionStatus.Connecting, TRANSITION_TIMEOUT),
      entersState(connection, VoiceConnectionStatus.Ready, CONNECT_TIMEOUT),
    ]);
  } catch {}

  if (connection.state.status === VoiceConnectionStatus.Ready) return connection;

  for (let i = 0; i < 2; i++) {
    try {
      connection.rejoin();
    } catch {}

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, CONNECT_TIMEOUT);
      return connection;
    } catch (err) {
      console.error(`Voice rejoin attempt ${i + 1} gagal:`, err);
    }
  }

  throw new Error('Voice connection belum mencapai status Ready.');
}

function attachConnectionWatchers(connection, guildId) {
  if (connection.__sqWatchersAttached) return;
  connection.__sqWatchersAttached = true;

  connection.on('stateChange', async (oldState, newState) => {
    console.log(`[VOICE] ${guildId}: ${oldState.status} -> ${newState.status}`);

    if (newState.status === VoiceConnectionStatus.Disconnected) {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        cleanup(guildId);
      }
      return;
    }

    if (newState.status === VoiceConnectionStatus.Destroyed) {
      cleanup(guildId);
    }
  });
}

async function connectToVoiceChannel(msg, voiceChannel, maxAttempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let connection;
    try {
      const existing = getVoiceConnection(msg.guild.id);
      if (existing) {
        if (
          existing.joinConfig?.channelId === voiceChannel.id &&
          existing.state.status !== VoiceConnectionStatus.Destroyed
        ) {
          attachConnectionWatchers(existing, msg.guild.id);
          return await waitForUsableConnection(existing);
        }

        try {
          existing.destroy();
        } catch {}
      }

      connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: msg.guild.id,
        adapterCreator: msg.guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: false,
      });

      attachConnectionWatchers(connection, msg.guild.id);

      try {
        await entersState(connection, VoiceConnectionStatus.Connecting, TRANSITION_TIMEOUT);
      } catch {}

      const ready = await waitForUsableConnection(connection);
      return ready;
    } catch (err) {
      lastError = err;
      console.error(`Voice connect attempt ${attempt}/${maxAttempts}:`, err);

      try {
        connection?.destroy();
      } catch {}

      try {
        getVoiceConnection(msg.guild.id)?.destroy();
      } catch {}

      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }

  throw lastError || new Error('Gagal membuat koneksi voice.');
}

async function ensureQueue(msg) {
  const voiceChannel = await resolveVoiceChannel(msg);
  if (!voiceChannel) {
    throw new Error('Masuk voice channel dulu ya.');
  }

  const me = msg.guild.members.me || await msg.guild.members.fetchMe().catch(() => null);
  if (!me) {
    throw new Error('Bot belum siap membaca permission server.');
  }

  ensureVoicePermissions(voiceChannel, me);

  let serverQueue = queue.get(msg.guild.id);

  if (serverQueue) {
    serverQueue.textChannel = msg.channel;

    if (serverQueue.voiceChannelId === voiceChannel.id && serverQueue.connection) {
      try {
        await waitForUsableConnection(serverQueue.connection);
        return serverQueue;
      } catch {
        try {
          serverQueue.connection.destroy();
        } catch {}
        queue.delete(msg.guild.id);
        serverQueue = null;
      }
    } else {
      try {
        serverQueue.connection?.destroy();
      } catch {}
      queue.delete(msg.guild.id);
      serverQueue = null;
    }
  }

  let connection;
  try {
    connection = await connectToVoiceChannel(msg, voiceChannel, 3);
  } catch (err) {
    console.error('Final voice connect error:', err);
    throw new Error(
      'Gagal masuk voice channel. Kalau ini jalan di Railway/VPS, kemungkinan koneksi voice server lagi timeout. Coba ulang, pindah channel, atau cek region/permission voice server.'
    );
  }

  serverQueue = {
    voiceChannelId: voiceChannel.id,
    textChannel: msg.channel,
    songs: [],
    nowPlaying: null,
    player: createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
    }),
    connection,
    loop: false,
    volume: 0.7,
    isAdvancing: false,
  };

  serverQueue.player.on(AudioPlayerStatus.Idle, async () => {
    if (serverQueue.isAdvancing) return;
    serverQueue.isAdvancing = true;

    try {
      if (serverQueue.loop && serverQueue.songs.length > 0) {
      } else if (serverQueue.songs.length > 0) {
        serverQueue.songs.shift();
      }

      if (serverQueue.songs.length > 0) {
        await playSong(msg, serverQueue.songs[0]);
      } else {
        cleanup(msg.guild.id);
      }
    } catch (err) {
      console.error('Idle handler error:', err);
      if (serverQueue.textChannel) {
        await serverQueue.textChannel
          .send('❌ Lagu berikutnya gagal diputar, queue dihentikan.')
          .catch(() => {});
      }
      cleanup(msg.guild.id);
    } finally {
      serverQueue.isAdvancing = false;
    }
  });

  serverQueue.player.on('error', async (err) => {
    console.error('Audio player error:', err);

    if (serverQueue.textChannel) {
      await serverQueue.textChannel
        .send('❌ Player error, lagu dilewati.')
        .catch(() => {});
    }

    if (serverQueue.songs.length > 0) {
      serverQueue.songs.shift();
    }

    serverQueue.nowPlaying = null;

    if (serverQueue.songs.length > 0) {
      await playSong(msg, serverQueue.songs[0]).catch((nextErr) => {
        console.error('Player recovery error:', nextErr);
        cleanup(msg.guild.id);
      });
    } else {
      cleanup(msg.guild.id);
    }
  });

  connection.subscribe(serverQueue.player);
  queue.set(msg.guild.id, serverQueue);
  return serverQueue;
}

async function playMusic(msg, query) {
  const serverQueue = await ensureQueue(msg);
  serverQueue.textChannel = msg.channel;

  const songs = await resolveSongs(query);
  serverQueue.songs.push(...songs);

  const shouldStart =
    !serverQueue.nowPlaying &&
    serverQueue.player.state.status !== AudioPlayerStatus.Playing &&
    serverQueue.player.state.status !== AudioPlayerStatus.Buffering;

  if (shouldStart && serverQueue.songs[0]) {
    await playSong(msg, serverQueue.songs[0]);
  }

  const added =
    songs.length === 1
      ? `🎶 Masuk queue: **${songs[0].title}**`
      : `🎶 Playlist masuk queue: **${songs.length} lagu**`;

  return msg.reply({
    embeds: [createMusicEmbed({
      title: songs.length === 1 ? '🎧 Music Added' : '📚 Playlist Added',
      description: added,
      footer: `Queue sekarang: ${serverQueue.songs.length} lagu`,
      fields: [
        {
          name: 'Source',
          value: songs[0].source.includes('spotify') ? 'Spotify → YouTube' : 'YouTube/Search',
          inline: true,
        },
        {
          name: 'Channel',
          value: `<#${serverQueue.voiceChannelId}>`,
          inline: true,
        },
      ],
    })],
    components: musicButtons(),
  });
}

async function playSong(msg, song) {
  const serverQueue = queue.get(msg.guild.id);
  if (!serverQueue || !song) return;

  try {
    await waitForUsableConnection(serverQueue.connection);

    const stream = await play.stream(song.url, {
      discordPlayerCompatibility: true,
      quality: 2,
    });

    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
      inlineVolume: true,
      metadata: song,
    });

    if (resource.volume) {
      resource.volume.setVolume(serverQueue.volume);
    }

    serverQueue.nowPlaying = song;
    serverQueue.player.play(resource);

    if (serverQueue.textChannel) {
      await serverQueue.textChannel.send({
        embeds: [createMusicEmbed({
          title: '🎧 Now Playing',
          description: `**${song.title}**\n${progressBar()}${serverQueue.loop ? '\n🔁 Loop aktif' : ''}`,
          footer: `Volume ${(serverQueue.volume * 100).toFixed(0)}% • ${serverQueue.songs.length} lagu di queue`,
        })],
        components: musicButtons(),
      }).catch(() => {});
    }
  } catch (error) {
    console.error('PlaySong Error:', error);

    if (serverQueue.textChannel) {
      await serverQueue.textChannel
        .send('❌ Lagu gagal diputar (Abort/Stream Error), dilewati...')
        .catch(() => {});
    }

    if (serverQueue.songs.length > 0) {
      serverQueue.songs.shift();
    }

    serverQueue.nowPlaying = null;

    if (serverQueue.songs.length > 0) {
      return playSong(msg, serverQueue.songs[0]);
    }

    cleanup(msg.guild.id);
  }
}

function buildQueueLines(q, limit = 10) {
  return q.songs.slice(0, limit).map((song, i) => `${i === 0 ? '▶️' : `${i}.`} ${song.title}`);
}

function skip(msg) {
  const q = queue.get(msg.guild.id);
  if (!q?.songs?.length) return msg.reply('❌ Tidak ada musik yang sedang diputar.');

  q.loop = false;
  q.player.stop();
  return msg.reply('⏭ Lagu di-skip.');
}

function stop(msg) {
  const q = queue.get(msg.guild.id);
  if (!q) return msg.reply('❌ Tidak ada musik.');

  cleanup(msg.guild.id);
  return msg.reply('⏹ Musik dihentikan dan queue dibersihkan.');
}

function toggleLoop(msg) {
  const q = queue.get(msg.guild.id);
  if (!q) return msg.reply('❌ Tidak ada musik.');

  q.loop = !q.loop;
  return msg.reply({
    embeds: [createMusicEmbed({
      title: '🔁 Loop Diubah',
      description: `Loop sekarang **${q.loop ? 'aktif' : 'mati'}**.`,
      footer: q.nowPlaying ? `Lagu: ${q.nowPlaying.title}` : 'Belum ada lagu aktif',
    })],
    components: musicButtons(),
  });
}

function pauseResume(msg) {
  const q = queue.get(msg.guild.id);
  if (!q?.nowPlaying) return msg.reply('❌ Tidak ada musik yang sedang diputar.');

  const status = q.player.state?.status;

  if (status === AudioPlayerStatus.Playing) {
    q.player.pause();
    return msg.reply({
      embeds: [createMusicEmbed({
        title: '⏸ Musik Dijeda',
        description: `**${q.nowPlaying.title}**`,
        footer: `Volume ${(q.volume * 100).toFixed(0)}% • Klik tombol lagi untuk resume`,
      })],
      components: musicButtons(),
    });
  }

  q.player.unpause();
  return msg.reply({
    embeds: [createMusicEmbed({
      title: '▶️ Musik Dilanjutkan',
      description: `**${q.nowPlaying.title}**`,
      footer: `Volume ${(q.volume * 100).toFixed(0)}% • Loop ${q.loop ? 'ON' : 'OFF'}`,
    })],
    components: musicButtons(),
  });
}

function setVolume(msg, vol) {
  const q = queue.get(msg.guild.id);
  if (!q) return msg.reply('❌ Tidak ada musik.');

  const safe = Math.max(1, Math.min(100, Number(vol) || 0));
  q.volume = safe / 100;

  const current = q.player.state?.resource;
  if (current?.volume) {
    current.volume.setVolume(q.volume);
  }

  return msg.reply({
    embeds: [createMusicEmbed({
      title: '🔊 Volume Diubah',
      description: `Volume sekarang **${safe}%**.`,
      footer: q.nowPlaying ? `Lagu: ${q.nowPlaying.title}` : 'Belum ada lagu aktif',
    })],
    components: musicButtons(),
  });
}

function adjustVolume(msg, delta) {
  const q = queue.get(msg.guild.id);
  if (!q) return msg.reply('❌ Tidak ada musik.');

  const current = Math.round((q.volume || 0.7) * 100);
  return setVolume(msg, current + delta);
}

function cleanup(guildId) {
  const q = queue.get(guildId);
  if (!q) return;

  try {
    q.nowPlaying = null;
    q.songs = [];
  } catch {}

  try {
    q.player.stop(true);
  } catch {}

  try {
    q.connection.removeAllListeners();
  } catch {}

  try {
    q.connection.destroy();
  } catch {}

  try {
    const existing = getVoiceConnection(guildId);
    existing?.destroy();
  } catch {}

  queue.delete(guildId);
}

function queueView(msg) {
  const q = queue.get(msg.guild.id);
  if (!q || !q.songs.length) return msg.reply('📭 Queue masih kosong.');

  const lines = buildQueueLines(q, 10);
  return msg.reply({
    embeds: [createMusicEmbed({
      title: '📜 Music Queue',
      description: lines.join('\n'),
      footer: `${q.songs.length} total lagu • Loop ${q.loop ? 'ON' : 'OFF'}`,
    })],
    components: musicButtons(),
  });
}

function nowPlaying(msg) {
  const q = queue.get(msg.guild.id);
  if (!q?.nowPlaying) return msg.reply('📭 Belum ada lagu yang diputar.');

  return msg.reply({
    embeds: [createMusicEmbed({
      title: '🎵 Sedang Diputar',
      description: `**${q.nowPlaying.title}**\n${progressBar()}`,
      footer: `Volume ${(q.volume * 100).toFixed(0)}% • Loop ${q.loop ? 'ON' : 'OFF'}`,
    })],
    components: musicButtons(),
  });
}

module.exports = {
  playMusic,
  skip,
  stop,
  toggleLoop,
  pauseResume,
  adjustVolume,
  setVolume,
  queueView,
  nowPlaying,
  getQueue,
};
