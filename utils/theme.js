
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { bar } = require('./embed');
const { expNeeded } = require('./level');
const { getTwemojiUrl, getItemMeta, ensurePetVisuals } = require('./gameAssets');

const COLORS = {
  primary: 0x5865F2,
  success: 0x57F287,
  danger: 0xED4245,
  warning: 0xFEE75C,
  pet: 0xEB459E,
  admin: 0xFAA61A,
  dark: 0x2B2D31,
};

function normalizeFields(fields = []) {
  return fields.filter(Boolean).map(field => ({
    name: field.name || 'Info',
    value: field.value ?? '-',
    inline: Boolean(field.inline),
  }));
}

function createGameEmbed({
  title,
  description,
  color = COLORS.primary,
  fields = [],
  footer = 'Cosmic Corner Bot • Modern Game UI',
  thumbnail,
  image,
  authorName,
}) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setFooter({ text: footer })
    .setTimestamp();

  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (authorName) embed.setAuthor({ name: authorName });
  const safeFields = normalizeFields(fields).slice(0, 25);
  if (safeFields.length) embed.addFields(safeFields);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (image) embed.setImage(image);
  return embed;
}

function createLinkButton(url, label, emoji) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setURL(url)
      .setLabel(label)
      .setStyle(ButtonStyle.Link)
      .setEmoji(emoji || undefined)
  );
  return [row];
}

function createActionButtons(buttons = []) {
  const row = new ActionRowBuilder();
  buttons.filter(Boolean).slice(0, 5).forEach(btn => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(btn.id)
        .setLabel(btn.label)
        .setStyle(btn.style || ButtonStyle.Secondary)
        .setEmoji(btn.emoji || undefined)
        .setDisabled(Boolean(btn.disabled))
    );
  });
  return row.components.length ? [row] : [];
}

function quickMenuButtons(ownerId = '0') {
  return [
    ...createActionButtons([
      { id: 'ui:profile', label: 'Profile', emoji: '🎮', style: ButtonStyle.Primary },
      { id: 'ui:daily', label: 'Daily', emoji: '🎁', style: ButtonStyle.Success },
      { id: 'ui:shop', label: 'Shop', emoji: '🛒' },
      { id: 'ui:dungeon', label: 'Dungeon', emoji: '🏰', style: ButtonStyle.Danger },
      { id: 'ui:quest', label: 'Quest', emoji: '📜' },
    ]),
    ...createActionButtons([
      { id: 'ui:start', label: 'Start', emoji: '🚀', style: ButtonStyle.Success },
      { id: 'ui:dashboard', label: 'Dashboard', emoji: '🌌', style: ButtonStyle.Primary },
      { id: `nav:help:${ownerId}:home:0`, label: 'Guide', emoji: '🧭', style: ButtonStyle.Secondary },
      { id: `nav:achievements:${ownerId}:0`, label: 'Achievements', emoji: '🏆', style: ButtonStyle.Secondary },
      { id: 'ui:inventory', label: 'Inventory', emoji: '🎒', style: ButtonStyle.Secondary },
      { id: 'ui:pets', label: 'Pets', emoji: '🐾', style: ButtonStyle.Secondary },
      { id: 'ui:rank', label: 'Rank', emoji: '⭐', style: ButtonStyle.Secondary },
    ]),
  ];
}

function levelTitle(level = 1) {
  if (level >= 25) return 'Cosmic Overlord';
  if (level >= 20) return 'Mythic Commander';
  if (level >= 15) return 'Legend Arena';
  if (level >= 10) return 'Elite Grinder';
  if (level >= 5) return 'Rising Star';
  return 'New Challenger';
}

function profileFields(user) {
  const nextLevelExp = expNeeded(user.level);
  const invCount = Array.isArray(user.inventory) ? user.inventory.length : 0;
  const petCount = Array.isArray(user.pets) ? user.pets.length : 0;
  const totalMatch = (user.wins || 0) + (user.losses || 0);
  const mainPet = user.pets?.[typeof user.equippedPet === 'number' ? user.equippedPet : 0];
  const achievementCount = Array.isArray(user.achievements) ? user.achievements.length : 0;
  return [
    { name: '💰 Coin', value: `${user.coin}`, inline: true },
    { name: '⭐ Level', value: `${user.level}`, inline: true },
    { name: '🏆 Achievements', value: `${achievementCount}`, inline: true },
    { name: '✨ EXP Progress', value: `${user.exp}/${nextLevelExp}\n${bar(Math.min(user.exp, nextLevelExp), nextLevelExp)}`, inline: false },
    { name: '🎒 Inventory', value: `${invCount} item`, inline: true },
    { name: '🐾 Pet', value: `${petCount} pet`, inline: true },
    { name: '👑 Main Pet', value: mainPet ? `${mainPet.emoji || '🐾'} ${mainPet.name}` : 'Belum ada', inline: true },
    { name: '⚔️ Match', value: `${user.wins || 0}W/${user.losses || 0}L${totalMatch ? ` (${Math.round(((user.wins || 0) / totalMatch) * 100)}%)` : ''}`, inline: true },
    { name: '📈 Activity', value: `Hunt ${user.stats?.huntCount || 0} • Fish ${user.stats?.fishingCount || 0} • Quest ${user.stats?.questCount || 0}`, inline: true },
    { name: '🗓️ Daily', value: user.lastDaily ? '<t:' + Math.floor(user.lastDaily / 1000) + ':R>' : 'Belum pernah claim', inline: true },
  ];
}

function createStatCard(user, mention) {
  const mainPet = user.pets?.[typeof user.equippedPet === 'number' ? user.equippedPet : 0];
  const achievementCount = Array.isArray(user.achievements) ? user.achievements.length : 0;
  return createGameEmbed({
    title: '✨ COSMIC CORNER PLAYER HUB ✨',
    description: `Selamat datang di panel utama ${mention}\n\n> Dashboard neon ini menampilkan power score, progress level, achievement, dan shortcut menu premium kamu.`,
    color: COLORS.primary,
    fields: [
      { name: '🌌 Account Power', value: `Lv.${user.level} • ${levelTitle(user.level)} • ${user.coin} coin • ${achievementCount} achievements • 🎤 ${user.voice?.totalXp || 0} Voice XP • 📨 ${user.invites?.regular || 0} invites`, inline: false },
      ...profileFields(user),
    ],
    footer: 'Cosmic Corner Bot • Ultra Dashboard',
    thumbnail: mainPet ? getTwemojiUrl(mainPet.emoji) : undefined,
  });
}

function rarityIcon(rarity) {
  return {
    Common: '⚪',
    Uncommon: '🟢',
    Rare: '🔵',
    Legendary: '🟣',
    Mythic: '🟠',
  }[rarity] || '⚪';
}

function formatPetLabel(pet, index, equipped = false) {
  const safePet = ensurePetVisuals(pet, index);
  return `${equipped ? '👑 ' : ''}${index + 1}. ${safePet.emoji} ${safePet.name}`;
}

function petThumbnail(pet) {
  if (!pet) return null;
  return getTwemojiUrl(ensurePetVisuals(pet).emoji);
}

function itemDisplay(itemName) {
  const item = getItemMeta(itemName);
  return item ? `${item.emoji} ${item.name}` : `🎁 ${itemName}`;
}

module.exports = {
  COLORS,
  createGameEmbed,
  profileFields,
  createStatCard,
  rarityIcon,
  createActionButtons,
  createLinkButton,
  quickMenuButtons,
  petThumbnail,
  itemDisplay,
  formatPetLabel,
  levelTitle,
};
