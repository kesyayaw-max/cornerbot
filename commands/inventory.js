const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS, createActionButtons, itemDisplay } = require('../utils/theme');
const { getItemMeta } = require('../utils/gameAssets');
const { itemArtAttachment, attachmentImageUrl } = require('../utils/art');

function summarizeInventory(user) {
  return Object.values(user.inventory.reduce((acc, item) => {
    const itemMeta = getItemMeta(item);
    const key = itemMeta?.key || String(item);
    acc[key] = acc[key] || { key, label: itemDisplay(item), qty: 0, description: itemMeta?.description || 'Item koleksi', meta: itemMeta || { key, name: key, emoji: '🎁', description: 'Item koleksi', price: 0 } };
    acc[key].qty += 1;
    return acc;
  }, {}));
}

function buildInventoryView(user, ownerId, page = 0) {
  const items = summarizeInventory(user);
  const perPage = 4;
  const maxPage = Math.max(0, Math.ceil(items.length / perPage) - 1);
  const safePage = Math.min(Math.max(Number(page) || 0, 0), maxPage);
  const start = safePage * perPage;
  const pageItems = items.slice(start, start + perPage);
  const spotlight = pageItems[0]?.meta || items[0]?.meta;
  const art = spotlight ? itemArtAttachment(spotlight) : null;

  const fields = pageItems.map(item => ({ name: item.label, value: `x${item.qty}\n${item.description}`, inline: true }));
  const components = createActionButtons([
    { id: `nav:inventory:${ownerId}:${safePage - 1}`, label: 'Prev', emoji: '⬅️', disabled: safePage <= 0 },
    { id: 'ui:shop', label: 'Shop', emoji: '🛒', style: 1 },
    { id: `nav:inventory:${ownerId}:${safePage + 1}`, label: 'Next', emoji: '➡️', disabled: safePage >= maxPage },
    { id: 'ui:profile', label: 'Profile', emoji: '🎮' },
  ]);

  if (pageItems.length) {
    const select = new StringSelectMenuBuilder()
      .setCustomId(`select:inventory:${ownerId}:${safePage}`)
      .setPlaceholder('Lihat detail item')
      .addOptions(pageItems.map(item => new StringSelectMenuOptionBuilder()
        .setLabel(`${item.meta.emoji || '🎁'} ${item.meta.name}`.slice(0, 100))
        .setDescription(`Qty ${item.qty} • ${item.description}`.slice(0, 100))
        .setValue(item.key)));
    components.push(new ActionRowBuilder().addComponents(select));
  }

  return {
    embeds: [createGameEmbed({
      title: '🎒 Inventory Gallery',
      description: `Total item: **${user.inventory.length}** • Jenis item: **${items.length}** • Halaman **${safePage + 1}/${maxPage + 1}**`,
      color: COLORS.primary,
      fields,
      image: art ? attachmentImageUrl(art) : undefined,
      footer: 'SteakQurban Bot • Inventory Showcase',
    })],
    files: art ? [art] : [],
    components,
  };
}

module.exports = {
  name: 'inventory',
  buildInventoryView,
  summarizeInventory,
  async execute(msg, args = []) {
    const user = await getUser(msg.author.id);

    if (!Array.isArray(user.inventory) || user.inventory.length === 0) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🎒 Inventory', description: 'Inventory kamu masih kosong.', color: COLORS.warning })], components: createActionButtons([{ id: 'ui:shop', label: 'Buka Shop', emoji: '🛒', style: 1 }]) });
    }

    const page = Number(args[0]) || 0;
    return msg.reply(buildInventoryView(user, msg.author.id, page));
  }
};
