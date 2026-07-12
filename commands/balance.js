const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS } = require('../utils/theme');
const { getIcon } = require('../utils/icons');

module.exports = {
  name: 'balance',
  async execute(msg) {
    const user = await getUser(msg.author.id);
    const balance = Number(user.coin ?? user.cash ?? 0) || 0;

    return msg.reply({
      embeds: [
        createGameEmbed({
          title: '💰 Balance',
          description: `Coin kamu sekarang **${balance}**.`,
          color: COLORS.success,
          thumbnail: getIcon('coin'),
        }),
      ],
    });
  }
};
