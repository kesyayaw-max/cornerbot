const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS } = require('../utils/theme');

function drawCard() {
  return Math.floor(Math.random() * 10) + 1;
}

module.exports = {
  name: 'blackjack',
  async execute(msg, args) {
    const user = await getUser(msg.author.id);
    const bet = parseInt(args[0], 10);

    if (!bet || bet <= 0) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🃏 Blackjack', description: 'Format: `blackjack <bet>`', color: COLORS.warning, footer: 'Cosmic Corner Bot • Casino Table' })] });
    }

    if (user.coin < bet) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🃏 Blackjack', description: 'Coin kamu kurang untuk taruhan itu.', color: COLORS.danger, footer: 'Cosmic Corner Bot • Casino Table' })] });
    }

    const player = [drawCard(), drawCard()];
    const dealer = [drawCard(), drawCard()];
    const pTotal = player.reduce((a, b) => a + b, 0);
    const dTotal = dealer.reduce((a, b) => a + b, 0);

    let delta = -bet;
    let result = 'Dealer menang. Kamu kalah.';
    let color = COLORS.danger;

    if ((pTotal <= 21 && pTotal > dTotal) || dTotal > 21) {
      delta = bet;
      result = `Kamu menang **+${bet} coin**!`;
      color = COLORS.success;
    } else if (pTotal === dTotal) {
      delta = 0;
      result = 'Seri. Coin kamu aman.';
      color = COLORS.warning;
    }

    user.coin += delta;
    await user.save();

    return msg.reply({
      embeds: [createGameEmbed({
        title: '🃏 Blackjack Table',
        description: result,
        color,
        footer: 'Cosmic Corner Bot • Casino Result',
        fields: [
          { name: '🧑 Player', value: `${player.join(' + ')} = **${pTotal}**`, inline: true },
          { name: '🤖 Dealer', value: `${dealer.join(' + ')} = **${dTotal}**`, inline: true },
          { name: '💰 Coin Sekarang', value: `${user.coin}`, inline: false },
        ]
      })]
    });
  }
};
