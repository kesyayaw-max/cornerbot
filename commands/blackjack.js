const { getUser } = require('../utils/getUser');
const User = require('../models/User');
const { createGameEmbed, COLORS } = require('../utils/theme');
const { casinoArtAttachment, attachmentImageUrl } = require('../utils/art');
const { check, formatRemaining } = require('../utils/cooldown');

const COOLDOWN_MS = 6000;

function drawCard() {
  return Math.floor(Math.random() * 10) + 1;
}

module.exports = {
  name: 'blackjack',
  async execute(msg, args) {
    const left = check(msg.author.id, 'blackjack', COOLDOWN_MS);
    if (left > 0) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🃏 Blackjack', description: `⏳ Meja masih dikocok. Coba lagi dalam **${formatRemaining(left)}**.`, color: COLORS.warning, footer: 'Cosmic Corner Bot • Casino Table' })] });
    }

    await getUser(msg.author.id);
    const bet = parseInt(args[0], 10);

    if (!bet || bet <= 0) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🃏 Blackjack', description: 'Format: `blackjack <bet>`', color: COLORS.warning, footer: 'Cosmic Corner Bot • Casino Table' })] });
    }

    const afterBet = await User.findOneAndUpdate(
      { userId: msg.author.id, coin: { $gte: bet } },
      { $inc: { coin: -bet } },
      { returnDocument: 'after' }
    );
    if (!afterBet) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🃏 Blackjack', description: 'Coin kamu kurang untuk taruhan itu.', color: COLORS.danger, footer: 'Cosmic Corner Bot • Casino Table' })] });
    }

    const player = [drawCard(), drawCard()];
    const dealer = [drawCard(), drawCard()];
    const pTotal = player.reduce((a, b) => a + b, 0);
    const dTotal = dealer.reduce((a, b) => a + b, 0);

    let delta = 0;
    let result = 'Dealer menang. Kamu kalah.';
    let color = COLORS.danger;

    if ((pTotal <= 21 && pTotal > dTotal) || dTotal > 21) {
      delta = bet * 2;
      result = `Kamu menang **+${bet} coin**!`;
      color = COLORS.success;
    } else if (pTotal === dTotal) {
      delta = bet;
      result = 'Seri. Coin kamu dikembalikan.';
      color = COLORS.warning;
    }

    let finalUser = afterBet;
    if (delta > 0) {
      finalUser = await User.findOneAndUpdate({ userId: msg.author.id }, { $inc: { coin: delta } }, { returnDocument: 'after' });
    }

    const netChange = delta - bet;
    const art = casinoArtAttachment('Blackjack', netChange >= 0 ? `+${netChange} coin` : `${netChange} coin`, { win: netChange > 0, emoji: '🃏' });

    return msg.reply({
      embeds: [createGameEmbed({
        title: '🃏 Blackjack Table',
        description: result,
        color,
        footer: 'Cosmic Corner Bot • Casino Result',
        image: attachmentImageUrl(art),
        fields: [
          { name: '🧑 Player', value: `${player.join(' + ')} = **${pTotal}**`, inline: true },
          { name: '🤖 Dealer', value: `${dealer.join(' + ')} = **${dTotal}**`, inline: true },
          { name: '💰 Coin Sekarang', value: `${finalUser.coin}`, inline: false },
        ]
      })],
      files: [art],
    });
  }
};
