const { createGameEmbed, COLORS } = require('../utils/theme');
const { getUser } = require('../utils/getUser');
const { getIcon } = require('../utils/icons');

const BOXES = {
  common: { price: 15000, emoji: '📦', name: 'Common Box' },
  rare: { price: 25000, emoji: '🎁', name: 'Rare Box' },
  epic: { price: 150000, emoji: '💎', name: 'Epic Box' },
};

module.exports = {
  name: 'buybox',
  description: 'Beli lootbox / gacha box',

  async execute(message, args = []) {
    try {
      const type = String(args[0] || '').toLowerCase();
      const qty = Math.max(1, parseInt(args[1], 10) || 1);

      if (!BOXES[type]) {
        return message.reply({
          embeds: [
            createGameEmbed({
              title: '🎁 Lootbox Shop',
              description:
                'Gunakan:\n`buybox common`\n`buybox rare`\n`buybox epic`\n\nAtau:\n`buybox common 3`',
              color: COLORS.warning,
              thumbnail: getIcon('backpack'),
              fields: Object.entries(BOXES).map(([_, box]) => ({
                name: `${box.emoji} ${box.name}`,
                value: `Harga: **${box.price}** coin`,
                inline: true,
              })),
            }),
          ],
        });
      }

      const user = await getUser(message.author.id);

      if (!user.lootboxes) {
        user.lootboxes = { common: 0, rare: 0, epic: 0 };
      }

      const totalPrice = BOXES[type].price * qty;
      const userBalance = Number(user.coin ?? user.cash ?? 0) || 0;

      if (userBalance < totalPrice) {
        return message.reply({
          embeds: [
            createGameEmbed({
              title: '❌ Coin Tidak Cukup',
              description: `Kamu butuh **${totalPrice}** coin untuk beli **${qty}x ${BOXES[type].name}**.\nCoin kamu sekarang: **${userBalance}**`,
              color: COLORS.danger || 0xff4444,
              thumbnail: getIcon('coin'),
            }),
          ],
        });
      }

      const newBalance = Math.max(0, userBalance - totalPrice);
      user.coin = newBalance;
      user.cash = newBalance;
      user.lootboxes[type] = (user.lootboxes[type] || 0) + qty;

      await user.save();

      return message.reply({
        embeds: [
          createGameEmbed({
            title: '🛒 Pembelian Berhasil',
            description: `Kamu membeli **${qty}x ${BOXES[type].name}**`,
            color: COLORS.success,
            thumbnail: getIcon('backpack'),
            fields: [
              { name: '💰 Total Harga', value: `${totalPrice} coin`, inline: true },
              { name: '📦 Total Box', value: `${user.lootboxes[type]}`, inline: true },
              { name: '🏦 Sisa Coin', value: `${newBalance}`, inline: true },
            ],
            footer: 'Cosmic Corner Bot • Lootbox Shop',
          }),
        ],
      });
    } catch (err) {
      console.error('buybox error:', err);
      return message.reply('❌ Gagal membeli lootbox.');
    }
  },
};
