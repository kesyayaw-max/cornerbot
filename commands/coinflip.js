const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS } = require('../utils/theme');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

module.exports = {
  name: 'coinflip',
  async execute(msg, args) {
    const user = await getUser(msg.author.id);

    const bet = parseInt(args[0], 10);
    const choice = String(args[1] || '').toLowerCase();

    if (!bet || !['heads', 'tails'].includes(choice)) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🪙 Coinflip', description: 'Format: `coinflip <jumlah> <heads/tails>`', color: COLORS.warning })] });
    }
    if (user.coin < bet) return msg.reply({ embeds: [createGameEmbed({ title: '🪙 Coinflip', description: 'Coin kamu kurang!', color: COLORS.danger })] });

    const m = await msg.reply({ embeds: [createGameEmbed({ title: '🪙 Coinflip', description: 'Melempar koin...', color: COLORS.primary })] });

    const anim = ['🪙 Berputar...', '🔄 Masih berputar...', '🪙 Hampir berhenti...'];
    for (const frame of anim) {
      await sleep(450);
      await m.edit({ embeds: [createGameEmbed({ title: '🪙 Coinflip', description: frame, color: COLORS.primary })] });
    }

    const result = Math.random() > 0.5 ? 'heads' : 'tails';
    let desc;
    let color;

    if (choice === result) {
      user.coin += bet;
      desc = `Hasilnya **${result}**.
🎉 Kamu menang **+${bet}** coin!`;
      color = COLORS.success;
    } else {
      user.coin -= bet;
      desc = `Hasilnya **${result}**.
💀 Kamu kalah **-${bet}** coin.`;
      color = COLORS.danger;
    }

    await user.save();
    await m.edit({ embeds: [createGameEmbed({ title: '🪙 Coinflip Result', description: desc, color, fields: [{ name: '💰 Coin Sekarang', value: `${user.coin}`, inline: true }] })] });
  }
};
