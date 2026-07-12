const { getUser } = require('../utils/getUser');
const User = require('../models/User');
const { createGameEmbed, COLORS } = require('../utils/theme');
const { casinoArtAttachment, attachmentImageUrl } = require('../utils/art');
const { check, formatRemaining } = require('../utils/cooldown');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const COOLDOWN_MS = 5000;

module.exports = {
  name: 'coinflip',
  async execute(msg, args) {
    const left = check(msg.author.id, 'coinflip', COOLDOWN_MS);
    if (left > 0) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🪙 Coinflip', description: `⏳ Tunggu **${formatRemaining(left)}** lagi sebelum lempar koin berikutnya.`, color: COLORS.warning })] });
    }

    await getUser(msg.author.id);
    const bet = parseInt(args[0], 10);
    const choice = String(args[1] || '').toLowerCase();

    if (!bet || bet <= 0 || !['heads', 'tails'].includes(choice)) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🪙 Coinflip', description: 'Format: `coinflip <jumlah> <heads/tails>`', color: COLORS.warning })] });
    }

    const afterBet = await User.findOneAndUpdate(
      { userId: msg.author.id, coin: { $gte: bet } },
      { $inc: { coin: -bet } },
      { returnDocument: 'after' }
    );
    if (!afterBet) return msg.reply({ embeds: [createGameEmbed({ title: '🪙 Coinflip', description: 'Coin kamu kurang!', color: COLORS.danger })] });

    const m = await msg.reply({ embeds: [createGameEmbed({ title: '🪙 Coinflip', description: '🪙 Melempar koin...', color: COLORS.primary })] });

    const anim = ['🪙 Berputar...', '🔄 Masih berputar...', '🪙 Hampir berhenti...'];
    for (const frame of anim) {
      await sleep(450);
      await m.edit({ embeds: [createGameEmbed({ title: '🪙 Coinflip', description: frame, color: COLORS.primary })] });
    }

    const result = Math.random() > 0.5 ? 'heads' : 'tails';
    const won = choice === result;

    let finalUser = afterBet;
    if (won) {
      finalUser = await User.findOneAndUpdate({ userId: msg.author.id }, { $inc: { coin: bet * 2 } }, { returnDocument: 'after' });
    }

    const desc = won
      ? `Hasilnya **${result}**.\n🎉 Kamu menang **+${bet} coin**!`
      : `Hasilnya **${result}**.\n💀 Kamu kalah **-${bet} coin**.`;

    const art = casinoArtAttachment('Coinflip', won ? `MENANG +${bet} coin` : `KALAH -${bet} coin`, { win: won, emoji: result === 'heads' ? '🪙' : '🥈' });

    await m.edit({
      embeds: [createGameEmbed({
        title: '🪙 Coinflip Result',
        description: desc,
        color: won ? COLORS.success : COLORS.danger,
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
