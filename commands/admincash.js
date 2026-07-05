const User = require('../models/User');
const { ensureAdmin } = require('../utils/admin');
const { createGameEmbed, COLORS } = require('../utils/theme');

module.exports = {
  name: 'admincash',
  async execute(msg, args) {
    if (!(await ensureAdmin(msg))) return;

    const target = msg.mentions?.users?.first?.() || msg.targetUser;
    const action = String(args.find(arg => ['set', 'add', 'remove'].includes(String(arg).toLowerCase())) || '').toLowerCase();
    const amountRaw = [...args].reverse().find(arg => !Number.isNaN(parseInt(arg, 10)));
    const amount = parseInt(amountRaw, 10);

    if (!target || !['set', 'add', 'remove'].includes(action) || Number.isNaN(amount) || amount < 0) {
      return msg.reply({ embeds: [createGameEmbed({ title: '💸 Admin Cash', description: 'Format:\n`admincash <set/add/remove> @user <jumlah>`\nContoh: `admincash add @member 5000`', color: COLORS.warning, footer: 'Cosmic Corner Bot • Admin Economy' })] });
    }

    let user = await User.findOne({ userId: target.id });
    if (!user) user = await User.create({ userId: target.id });

    if (action === 'set') user.coin = amount;
    if (action === 'add') user.coin += amount;
    if (action === 'remove') user.coin = Math.max(0, user.coin - amount);

    await user.save();

    return msg.reply({ embeds: [createGameEmbed({
      title: '💸 Admin Cash Updated',
      description: `Cash untuk <@${target.id}> berhasil diubah.`,
      color: COLORS.admin,
      footer: 'Cosmic Corner Bot • Economy Control',
      fields: [
        { name: '⚙️ Aksi', value: action.toUpperCase(), inline: true },
        { name: '🔢 Nominal', value: `${amount}`, inline: true },
        { name: '💰 Cash Sekarang', value: `${user.coin}`, inline: true },
      ]
    })] });
  }
};
