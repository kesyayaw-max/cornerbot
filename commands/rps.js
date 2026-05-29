const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS } = require('../utils/theme');

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
    const user = await getUser(msg.author.id);
    const bet = parseInt(args[0], 10);
    const pick = String(args[1] || '').toLowerCase();
    const options = Object.keys(CHOICES);

    if (!bet || bet <= 0 || !options.includes(pick)) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🕹️ Rock Paper Scissors', description: 'Format: `rps <bet> <batu/gunting/kertas>`', color: COLORS.warning })] });
    }
    if (user.coin < bet) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🕹️ Rock Paper Scissors', description: 'Coin kamu kurang untuk main.', color: COLORS.danger })] });
    }

    const bot = options[Math.floor(Math.random() * options.length)];
    const result = getResult(pick, bot);
    let delta = 0;
    let outcome = 'Seri';
    let color = COLORS.warning;

    if (result === 1) {
      delta = bet;
      outcome = `Kamu menang +${bet} coin`;
      color = COLORS.success;
    } else if (result === -1) {
      delta = -bet;
      outcome = `Kamu kalah -${bet} coin`;
      color = COLORS.danger;
    }

    user.coin += delta;
    await user.save();

    return msg.reply({
      embeds: [createGameEmbed({
        title: '🕹️ Rock Paper Scissors',
        description: `${CHOICES[pick]} Kamu pilih **${pick}**\n${CHOICES[bot]} Bot pilih **${bot}**\n\n**${outcome}**`,
        color,
        fields: [{ name: '💰 Coin Sekarang', value: `${user.coin}`, inline: true }],
      })]
    });
  }
};
