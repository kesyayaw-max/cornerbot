const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const { createGameEmbed, COLORS, createActionButtons } = require('../utils/theme');
const { ITEM_DEFS } = require('../utils/gameAssets');
const { itemArtAttachment, attachmentImageUrl } = require('../utils/art');

const SHOP_CATEGORIES = {
  all: { label: 'Semua Item', items: ['potion', 'sword', 'petfood'], description: 'Semua item yang tersedia di shop.' },
  battle: { label: 'Battle Gear', items: ['sword', 'potion'], description: 'Bekal buat fight, raid, dan damage boost.' },
  pet: { label: 'Pet Care', items: ['petfood', 'potion'], description: 'Keperluan buat rawat dan bantu pet kamu.' },
};

function buildShopView(category = 'all', ownerId = '0') {
  const current = SHOP_CATEGORIES[category] || SHOP_CATEGORIES.all;
  const items = current.items.map(key => ITEM_DEFS[key]).filter(Boolean);
  const spotlight = items[0] || ITEM_DEFS.potion;
  const art = itemArtAttachment(spotlight);
  const fields = items.map(item => ({
    name: `${item.emoji} ${item.name}`,
    value: `**${item.price}** coin\n${item.description}\nBeli: \`sq buy ${item.key}\``,
    inline: true,
  }));
  fields.push({ name: '✨ Tips', value: '`sq daily`, `sq hunt`, `sq blackjack`, `sq dice`, `sq rps`, `sq dungeon`, `sq quest` buat cari coin tambahan.', inline: false });

  const select = new StringSelectMenuBuilder()
    .setCustomId(`select:shop:${ownerId}`)
    .setPlaceholder('Pilih kategori shop')
    .addOptions(Object.entries(SHOP_CATEGORIES).map(([key, value]) => new StringSelectMenuOptionBuilder().setLabel(value.label).setDescription(value.description.slice(0, 100)).setValue(key).setDefault(key === category)));

  return {
    embeds: [createGameEmbed({ title: '🛒 Max UI Shop', description: `${current.label}\n${current.description}`, color: COLORS.primary, footer: 'Cosmic Corner Bot • Shop Showcase', fields, image: attachmentImageUrl(art) })],
    files: [art],
    components: [
      ...createActionButtons([
        { id: 'buy:potion', label: 'Buy Potion', emoji: '🧪', style: 3 },
        { id: 'buy:sword', label: 'Buy Sword', emoji: '🗡️', style: 1 },
        { id: 'buy:petfood', label: 'Buy PetFood', emoji: '🍖', style: 2 },
      ]),
      new ActionRowBuilder().addComponents(select),
    ],
  };
}

module.exports = {
  name: 'shop',
  buildShopView,
  execute(msg, args = []) {
    const category = String(args[0] || 'all').toLowerCase();
    return msg.reply(buildShopView(category, msg.author.id));
  }
};
