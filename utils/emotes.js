const CUSTOM_EMOJI_RE = /^<a?:\w+:(\d+)>$/;

const EMOTE_KEYS = ['hunt', 'fishing', 'boss', 'shiny', 'crit', 'welcome'];

function getEmote(guildConfig, key, fallback) {
  if (!guildConfig) return fallback;
  const raw = guildConfig.customEmotes;
  if (!raw) return fallback;
  const val = typeof raw.get === 'function' ? raw.get(key) : raw[key];
  return val || fallback;
}

function emojiImageUrl(emoteString) {
  const match = CUSTOM_EMOJI_RE.exec(String(emoteString || '').trim());
  if (!match) return null;
  const animated = String(emoteString).startsWith('<a:');
  return `https://cdn.discordapp.com/emojis/${match[1]}.${animated ? 'gif' : 'png'}`;
}

async function resolveEmoteImageDataUri(emoteString) {
  const url = emojiImageUrl(emoteString);
  if (!url) return null;
  const { fetchImageAsDataUri } = require('./imageFetch');
  return fetchImageAsDataUri(url);
}

async function getGuildEmotes(guildId, keys = [], fallbacks = {}) {
  if (!guildId) {
    const out = {};
    keys.forEach((k) => { out[k] = fallbacks[k]; });
    return out;
  }
  const GuildConfig = require('../models/GuildConfig');
  const config = await GuildConfig.findOne({ guildId }).lean();
  const out = {};
  keys.forEach((k) => { out[k] = getEmote(config, k, fallbacks[k]); });
  return out;
}

module.exports = { getEmote, emojiImageUrl, resolveEmoteImageDataUri, getGuildEmotes, EMOTE_KEYS };
