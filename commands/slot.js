const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS } = require('../utils/theme');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

module.exports = {
  name: 'slot',
  async execute(msg, args) {
    const user = await getUser(msg.author.id);
    const bet = parseInt(args[0], 10);
    if (!bet || bet <= 0) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🎰 Slot Machine', description: 'Format: `slot <bet>`', color: COLORS.warning, footer: 'Cosmic Corner Bot • Casino Spin' })] });
    }
    if (user.coin < bet) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🎰 Slot Machine', description: 'Bet salah atau coin kamu kurang.', color: COLORS.danger, footer: 'Cosmic Corner Bot • Casino Spin' })] });
    }

    const emoji = ['🍒', '🍋', '🍉', '💎', '⭐'];
    const roll = () => emoji[Math.floor(Math.random() * emoji.length)];

    const m = await msg.reply({
      embeds: [createGameEmbed({ title: '🎰 Slot Machine', description: 'Mesin mulai berputar...', color: COLORS.primary, footer: 'Cosmic Corner Bot • Casino Spin' })]
    });

    let a, b, c;
    for (let i = 0; i < 3; i++) {
      a = roll(); b = roll(); c = roll();
      await m.edit({ embeds: [createGameEmbed({ title: '🎰 Slot Machine', description: `╔════════════╗\n${a} • ${b} • ${c}\n╚════════════╝\n⏳ Spinning...`, color: COLORS.primary, footer: 'Cosmic Corner Bot • Casino Animation' })] });
      await sleep(650);
    }

    a = roll(); b = roll(); c = roll();

    let win = 0;
    if (a === b && b === c) win = bet * 5;
    else if (a === b || b === c || a === c) win = bet * 2;

    user.coin += win - bet;
    await user.save();

    await m.edit({ embeds: [createGameEmbed({
      title: '🎰 Hasil Slot',
      description: `╔════════════╗\n${a} • ${b} • ${c}\n╚════════════╝\n\n${win ? `🎉 MENANG **+${win}**` : `💀 KALAH **-${bet}**`}`,
      color: win ? COLORS.success : COLORS.danger,
      footer: 'Cosmic Corner Bot • Casino Result',
      fields: [{ name: '💰 Coin Sekarang', value: `${user.coin}`, inline: true }]
    })] });
  }
};
