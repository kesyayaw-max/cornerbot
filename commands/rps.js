const { getUser } = require('../utils/getUser');
const User = require('../models/User');
const { createGameEmbed, COLORS } = require('../utils/theme');
const { casinoArtAttachment, attachmentImageUrl } = require('../utils/art');
const { check, formatRemaining } = require('../utils/cooldown');

const COOLDOWN_MS = 5000;

const CHOICES = {
  batu: '🪨',
  gunting: '✂️',
  kertas: '📄'
};

function getResult(player, bot) {
  if (player === bot) return 0;
  if (
    (player === 'batu' && bot === 'gunting') ||
    (player === 'gunting' && bot === 'kertas') ||
    (player === 'kertas' && bot === 'batu')
  ) return 1;
  return -1;
}

module.exports = {
  name: 'rps',
  async execute(msg, args) {
    const left = check(msg.author.id, 'rps', COOLDOWN_MS);
    if (left > 0) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🕹️ Rock Paper Scissors', description: `⏳ Tunggu **${formatRemaining(left)}** sebelum main lagi.`, color: COLORS.warning })] });
    }

    await getUser(msg.author.id);
    const bet = parseInt(args[0], 10);
    const pick = String(args[1] || '').toLowerCase();
    const options = Object.keys(CHOICES);

    if (!bet || bet <= 0 || !options.includes(pick)) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🕹️ Rock Paper Scissors', description: 'Format: `rps <bet> <batu/gunting/kertas>`', color: COLORS.warning })] });
    }

    const afterBet = await User.findOneAndUpdate(
      { userId: msg.author.id, coin: { $gte: bet } },
      { $inc: { coin: -bet } },
      { new: true }
    );
    if (!afterBet) return msg.reply({ embeds: [createGameEmbed({ title: '🕹️ Rock Paper Scissors', description: 'Coin kamu kurang untuk main.', color: COLORS.danger })] });

    const bot = options[Math.floor(Math.random() * options.length)];
    const result = getResult(pick, bot);
    let delta = 0;
    let outcome = 'Seri, coin dikembalikan';
    let color = COLORS.warning;

    if (result === 1) {
      delta = bet * 2;
      outcome = `Kamu menang +${bet} coin`;
      color = COLORS.success;
    } else if (result === -1) {
      outcome = `Kamu kalah -${bet} coin`;
      color = COLORS.danger;
    } else {
      delta = bet;
    }

    let finalUser = afterBet;
    if (delta > 0) {
      finalUser = await User.findOneAndUpdate({ userId: msg.author.id }, { $inc: { coin: delta } }, { new: true });
    }

    const netChange = delta - bet;
    const art = casinoArtAttachment('Rock Paper Scissors', netChange >= 0 ? `+${netChange} coin` : `${netChange} coin`, { win: netChange > 0, emoji: CHOICES[pick] });

    return msg.reply({
      embeds: [createGameEmbed({
        title: '🕹️ Rock Paper Scissors',
        description: `${CHOICES[pick]} Kamu pilih **${pick}**\n${CHOICES[bot]} Bot pilih **${bot}**\n\n**${outcome}**`,
        color,
        image: attachmentImageUrl(art),
        fields: [{ name: '💰 Coin Sekarang', value: `${finalUser.coin}`, inline: true }],
      })],
      files: [art],
    });
  }
};
