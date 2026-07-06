const { createGameEmbed, COLORS } = require('../utils/theme');
const { getUser } = require('../utils/getUser');

const BOXES = {
  common: { emoji: '📦', name: 'Common Box' },
  rare: { emoji: '🎁', name: 'Rare Box' },
  epic: { emoji: '💎', name: 'Epic Box' },
};

function ensureInventory(user) {
  if (!user.inventory || typeof user.inventory !== 'object') {
    user.inventory = {};
  }

  user.inventory.potion = Number(user.inventory.potion || 0);
  user.inventory.petfood = Number(user.inventory.petfood || 0);
}

function ensureLootboxes(user) {
  if (!user.lootboxes || typeof user.lootboxes !== 'object') {
    user.lootboxes = {};
  }

  user.lootboxes.common = Number(user.lootboxes.common || 0);
  user.lootboxes.rare = Number(user.lootboxes.rare || 0);
  user.lootboxes.epic = Number(user.lootboxes.epic || 0);
}

function pickWeighted(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;

  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }

  return items[items.length - 1];
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollReward(type) {
  if (type === 'common') {
    return pickWeighted([
      {
        weight: 55,
        reward: () => ({ kind: 'cash', amount: rand(100, 700), label: '💰 Coin' }),
      },
      {
        weight: 25,
        reward: () => ({ kind: 'potion', amount: rand(1, 2), label: '🧪 Potion' }),
      },
      {
        weight: 18,
        reward: () => ({ kind: 'petfood', amount: rand(1, 3), label: '🍖 Pet Food' }),
      },
      {
        weight: 2,
        reward: () => ({ kind: 'cash', amount: rand(1000, 1500), label: '✨ Jackpot Coin' }),
      },
    ]).reward();
  }

  if (type === 'rare') {
    return pickWeighted([
      {
        weight: 45,
        reward: () => ({ kind: 'cash', amount: rand(700, 2500), label: '💰 Coin' }),
      },
      {
        weight: 22,
        reward: () => ({ kind: 'potion', amount: rand(2, 4), label: '🧪 Potion' }),
      },
      {
        weight: 20,
        reward: () => ({ kind: 'petfood', amount: rand(2, 5), label: '🍖 Pet Food' }),
      },
      {
        weight: 10,
        reward: () => ({ kind: 'box', boxType: 'common', amount: 1, label: '📦 Bonus Common Box' }),
      },
      {
        weight: 3,
        reward: () => ({ kind: 'cash', amount: rand(3000, 5000), label: '🌟 Super Coin' }),
      },
    ]).reward();
  }

  return pickWeighted([
    {
      weight: 40,
      reward: () => ({ kind: 'cash', amount: rand(2500, 9000), label: '💰 Coin' }),
    },
    {
      weight: 22,
      reward: () => ({ kind: 'potion', amount: rand(4, 8), label: '🧪 Potion' }),
    },
    {
      weight: 20,
      reward: () => ({ kind: 'petfood', amount: rand(5, 10), label: '🍖 Pet Food' }),
    },
    {
      weight: 12,
      reward: () => ({ kind: 'box', boxType: 'rare', amount: 1, label: '🎁 Bonus Rare Box' }),
    },
    {
      weight: 6,
      reward: () => ({ kind: 'cash', amount: rand(10000, 15000), label: '💎 MEGA JACKPOT' }),
    },
  ]).reward();
}

function applyReward(user, reward) {
  ensureInventory(user);
  ensureLootboxes(user);

  if (reward.kind === 'cash') {
    user.cash = Number(user.cash || 0) + reward.amount;
  }

  if (reward.kind === 'potion') {
    user.inventory.potion += reward.amount;
  }

  if (reward.kind === 'petfood') {
    user.inventory.petfood += reward.amount;
  }

  if (reward.kind === 'box') {
    user.lootboxes[reward.boxType] = Number(user.lootboxes[reward.boxType] || 0) + reward.amount;
  }
}

function rewardText(reward) {
  if (reward.kind === 'cash') return `${reward.label}: **${reward.amount}**`;
  if (reward.kind === 'potion') return `${reward.label}: **${reward.amount}x**`;
  if (reward.kind === 'petfood') return `${reward.label}: **${reward.amount}x**`;
  if (reward.kind === 'box') return `${reward.label}: **${reward.amount}x**`;
  return 'Hadiah misterius';
}

module.exports = {
  name: 'lootbox',
  description: 'Buka lootbox / gacha',

  async execute(message, args = []) {
    try {
      const type = String(args[0] || '').toLowerCase();

      if (!BOXES[type]) {
        return message.reply({
          embeds: [
            createGameEmbed({
              title: '🎁 Buka Lootbox',
              description:
                'Gunakan:\n`lootbox common`\n`lootbox rare`\n`lootbox epic`',
              color: COLORS.warning,
            }),
          ],
        });
      }

      const user = await getUser(message.author.id);
      ensureInventory(user);
      ensureLootboxes(user);

      if ((user.lootboxes[type] || 0) <= 0) {
        return message.reply({
          embeds: [
            createGameEmbed({
              title: '❌ Lootbox Tidak Ada',
              description: `Kamu tidak punya **${BOXES[type].name}**.`,
              color: COLORS.danger || 0xff4444,
              fields: [
                { name: '📦 Common', value: `${user.lootboxes.common}`, inline: true },
                { name: '🎁 Rare', value: `${user.lootboxes.rare}`, inline: true },
                { name: '💎 Epic', value: `${user.lootboxes.epic}`, inline: true },
              ],
            }),
          ],
        });
      }

      user.lootboxes[type] -= 1;

      const reward = rollReward(type);
      applyReward(user, reward);

      await user.save();

      return message.reply({
        embeds: [
          createGameEmbed({
            title: `${BOXES[type].emoji} ${BOXES[type].name} Dibuka!`,
            description: `Kamu membuka **${BOXES[type].name}** dan mendapatkan:\n\n${rewardText(reward)}`,
            color: reward.label.includes('JACKPOT') ? (COLORS.warning || 0xffcc00) : COLORS.success,
            fields: [
              { name: '🏦 Coin', value: `${user.cash || 0}`, inline: true },
              { name: '🧪 Potion', value: `${user.inventory.potion || 0}`, inline: true },
              { name: '🍖 Pet Food', value: `${user.inventory.petfood || 0}`, inline: true },
              { name: '📦 Common', value: `${user.lootboxes.common || 0}`, inline: true },
              { name: '🎁 Rare', value: `${user.lootboxes.rare || 0}`, inline: true },
              { name: '💎 Epic', value: `${user.lootboxes.epic || 0}`, inline: true },
            ],
            footer: 'Cosmic Corner Bot • Lootbox System',
          }),
        ],
      });
    } catch (err) {
      console.error('lootbox error:', err);
      return message.reply('❌ Gagal membuka lootbox.');
    }
  },
};