const { getUser } = require('../utils/getUser');
const User = require('../models/User');
const { createGameEmbed, COLORS } = require('../utils/theme');
const { casinoArtAttachment, attachmentImageUrl } = require('../utils/art');
const { check, formatRemaining } = require('../utils/cooldown');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const COOLDOWN_MS = 5000;

module.exports = {
  name: 'slot',
  async execute(msg, args) {
    const left = check(msg.author.id, 'slot', COOLDOWN_MS);
    if (left > 0) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🎰 Slot Machine', description: `⏳ Mesin masih dingin. Coba lagi dalam **${formatRemaining(left)}**.`, color: COLORS.warning, footer: 'Cosmic Corner Bot • Casino Cooldown' })] });
    }

    await getUser(msg.author.id);
    const bet = parseInt(args[0], 10);
    if (!bet || bet <= 0) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🎰 Slot Machine', description: 'Format: `slot <bet>`', color: COLORS.warning, footer: 'Cosmic Corner Bot • Casino Spin' })] });
    }

    // Atomic bet deduction -- prevents double-spend from spamming the command
    const afterBet = await User.findOneAndUpdate(
      { userId: msg.author.id, coin: { $gte: bet } },
      { $inc: { coin: -bet } },
      { new: true }
    );
    if (!afterBet) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🎰 Slot Machine', description: 'Coin kamu kurang untuk taruhan itu.', color: COLORS.danger, footer: 'Cosmic Corner Bot • Casino Spin' })] });
    }

    const emoji = ['🍒', '🍋', '🍉', '💎', '⭐'];
    const roll = () => emoji[Math.floor(Math.random() * emoji.length)];

    const m = await msg.reply({
      embeds: [createGameEmbed({ title: '🎰 Slot Machine', description: '```\n[ 🎰 SPINNING... ]\n```', color: COLORS.primary, footer: 'Cosmic Corner Bot • Casino Spin' })]
    });

    let a, b, c;
    for (let i = 0; i < 3; i++) {
      a = roll(); b = roll(); c = roll();
      await m.edit({ embeds: [createGameEmbed({
        title: '🎰 Slot Machine',
        description: `\`\`\`\n┌─────────────────┐\n│   ${a}   ${b}   ${c}   │\n└─────────────────┘\n\`\`\`\n⏳ Spinning...`,
        color: COLORS.primary,
        footer: 'Cosmic Corner Bot • Casino Animation'
      })] });
      await sleep(600);
    }

    a = roll(); b = roll(); c = roll();

    let win = 0;
    if (a === b && b === c) win = bet * 5;
    else if (a === b || b === c || a === c) win = bet * 2;

    let finalUser = afterBet;
    if (win > 0) {
      finalUser = await User.findOneAndUpdate({ userId: msg.author.id }, { $inc: { coin: win } }, { new: true });
    }

    const resultLine = win ? `MENANG +${win} coin` : `KALAH -${bet} coin`;
    const art = casinoArtAttachment('Slot Machine', resultLine, { win: win > 0, emoji: win >= bet * 5 ? '💎' : '🎰' });

    await m.edit({
      embeds: [createGameEmbed({
        title: '🎰 Hasil Slot',
        description: `\`\`\`\n┌─────────────────┐\n│   ${a}   ${b}   ${c}   │\n└─────────────────┘\n\`\`\`\n${win ? `🎉 **MENANG +${win} coin**` : `💀 **KALAH -${bet} coin**`}`,
        color: win ? COLORS.success : COLORS.danger,
        footer: 'Cosmic Corner Bot • Casino Result',
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
