const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS } = require('../utils/theme');
const { ITEM_DEFS } = require('../utils/gameAssets');
const { itemArtAttachment, attachmentImageUrl } = require('../utils/art');

module.exports = {
  name: 'buy',
  async execute(msg, args) {
    const user = await getUser(msg.author.id);
    const itemKey = String(args[0] || '').toLowerCase();
    const item = ITEM_DEFS[itemKey];

    if (!item) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🛒 Shop', description: 'Item tidak ada. Pakai: `sq buy potion`, `sq buy sword`, atau `sq buy petfood`.', color: COLORS.warning })] });
    }

    const art = itemArtAttachment(item);

    if (user.coin < item.price) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🛒 Shop', description: `Coin kamu kurang. **${item.emoji} ${item.name}** harganya **${item.price}** coin.`, color: COLORS.danger, image: attachmentImageUrl(art) })], files: [art] });
    }

    user.coin -= item.price;
    user.inventory.push(item.key);
    await user.save();

    return msg.reply({ embeds: [createGameEmbed({ title: '🛒 Pembelian Berhasil', description: `${item.emoji} Kamu membeli **${item.name}** seharga **${item.price}** coin.`, color: COLORS.success, image: attachmentImageUrl(art), fields: [{ name: '💰 Sisa Coin', value: `${user.coin}`, inline: true }, { name: '🎒 Total Item', value: `${user.inventory.length}`, inline: true }] })], files: [art] });
  }
};
