const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS } = require('../utils/theme');

module.exports = {
  name: 'dice',
  async execute(msg, args) {
    const user = await getUser(msg.author.id);
    const bet = parseInt(args[0], 10);
    const guess = parseInt(args[1], 10);

    if (!bet || bet <= 0 || !guess || guess < 1 || guess > 6) {
      return msg.reply({
        embeds: [createGameEmbed({
          title: '🎲 Dice',
          description: 'Format: `dice <bet> <angka 1-6>`\nContoh: `dice 100 4`',
          color: COLORS.warning,
        })]
      });
    }

    if (user.coin < bet) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🎲 Dice', description: 'Coin kamu tidak cukup untuk bet itu.', color: COLORS.danger })] });
    }

    const result = Math.floor(Math.random() * 6) + 1;
    let delta = -bet;
    let description = `Kamu pilih **${guess}**\nDadu berhenti di **${result}**.`;

    if (guess === result) {
      delta = bet * 4;
      description += `\n\n🎉 Jackpot mini! Kamu menang **+${delta}** coin.`;
    } else if (Math.abs(guess - result) === 1) {
      delta = Math.floor(bet * 0.5);
      description += `\n\n✨ Hampir tepat. Bonus **+${delta}** coin.`;
    } else {
      description += `\n\n💀 Kamu kalah **-${bet}** coin.`;
    }

    user.coin += delta;
    await user.save();

    return msg.reply({ embeds: [createGameEmbed({ title: '🎲 Dice Result', description, color: delta >= 0 ? COLORS.success : COLORS.danger, fields: [{ name: '💰 Coin Sekarang', value: `${user.coin}`, inline: true }] })] });
  }
};
