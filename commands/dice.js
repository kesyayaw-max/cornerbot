const { getUser } = require('../utils/getUser');
const User = require('../models/User');
const { createGameEmbed, COLORS } = require('../utils/theme');
const { casinoArtAttachment, attachmentImageUrl } = require('../utils/art');
const { check, formatRemaining } = require('../utils/cooldown');

const COOLDOWN_MS = 5000;
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

module.exports = {
  name: 'dice',
  async execute(msg, args) {
    const left = check(msg.author.id, 'dice', COOLDOWN_MS);
    if (left > 0) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🎲 Dice', description: `⏳ Dadu masih dikocok. Coba lagi dalam **${formatRemaining(left)}**.`, color: COLORS.warning })] });
    }

    await getUser(msg.author.id);
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

    const afterBet = await User.findOneAndUpdate(
      { userId: msg.author.id, coin: { $gte: bet } },
      { $inc: { coin: -bet } },
      { new: true }
    );
    if (!afterBet) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🎲 Dice', description: 'Coin kamu tidak cukup untuk bet itu.', color: COLORS.danger })] });
    }

    const result = Math.floor(Math.random() * 6) + 1;
    let delta = 0;
    let description = `Kamu pilih **${guess}** ${DICE_FACES[guess - 1]}\nDadu berhenti di **${result}** ${DICE_FACES[result - 1]}.`;

    if (guess === result) {
      delta = bet * 4;
      description += `\n\n🎉 Jackpot mini! Kamu menang **+${delta}** coin.`;
    } else if (Math.abs(guess - result) === 1) {
      delta = Math.floor(bet * 0.5);
      description += `\n\n✨ Hampir tepat. Bonus **+${delta}** coin.`;
    } else {
      description += `\n\n💀 Kamu kalah **-${bet}** coin.`;
    }

    let finalUser = afterBet;
    if (delta > 0) {
      finalUser = await User.findOneAndUpdate({ userId: msg.author.id }, { $inc: { coin: delta } }, { new: true });
    }

    const art = casinoArtAttachment('Dice Roll', delta > 0 ? `+${delta} coin` : `-${bet} coin`, { win: delta > 0, emoji: DICE_FACES[result - 1] });

    return msg.reply({
      embeds: [createGameEmbed({
        title: '🎲 Dice Result',
        description,
        color: delta > 0 ? COLORS.success : COLORS.danger,
        image: attachmentImageUrl(art),
        fields: [
          { name: '🎯 Taruhan', value: `${bet}`, inline: true },
          { name: '💰 Coin Sekarang', value: `${finalUser.coin}`, inline: true },
        ]
      })],
      files: [art],
    });
  }
};
