
const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS, createActionButtons } = require('../utils/theme');
const { applyProgress, progressSummaryLines } = require('../utils/level');

const QUESTS = [
  { title: 'Goblin Camp', coin: 120, exp: 35, loot: 'Potion' },
  { title: 'Bandit Road', coin: 180, exp: 45, loot: 'Sword' },
  { title: 'Ancient Shrine', coin: 240, exp: 55, loot: 'PetFood' },
];

module.exports = {
  name: 'quest',
  async execute(msg) {
    const user = await getUser(msg.author.id);
    const cooldown = 60 * 60 * 1000;
    const remaining = cooldown - (Date.now() - user.lastQuest);
    if (remaining > 0) {
      return msg.reply({
        embeds: [createGameEmbed({ title: '📜 Quest Board', description: `Quest berikutnya siap <t:${Math.floor((Date.now() + remaining) / 1000)}:R>.`, color: COLORS.warning, fields: [{ name: 'Tips', value: 'Sambil nunggu, coba `hunt`, `fishing`, atau `dungeon`.', inline: false }] })],
        components: createActionButtons([{ id: 'ui:dungeon', label: 'Dungeon', emoji: '🏰', style: 4 }, { id: 'ui:hunt', label: 'Hunt', emoji: '🏹' }, { id: 'ui:help', label: 'Help', emoji: '❔' }])
      });
    }

    const quest = QUESTS[Math.floor(Math.random() * QUESTS.length)];
    user.coin += quest.coin;
    user.inventory.push(quest.loot);
    user.lastQuest = Date.now();
    applyProgress(user, { exp: quest.exp, stats: { questCount: 1 } });
    await user.save();

    const extra = progressSummaryLines(user);
    return msg.reply({
      embeds: [createGameEmbed({
        title: '📜 Quest Complete',
        description: [`Misi **${quest.title}** selesai!`, ...extra].join('\n\n'),
        color: COLORS.success,
        fields: [
          { name: '💰 Coin', value: `+${quest.coin}`, inline: true },
          { name: '✨ EXP', value: `+${quest.exp}`, inline: true },
          { name: '🎒 Loot', value: quest.loot, inline: true },
          { name: '📊 Total Quest', value: `${user.stats?.questCount || 0}`, inline: true },
          { name: '⭐ Level', value: `${user.level}`, inline: true },
          { name: '🏆 Achievement', value: `${user.achievements?.length || 0}`, inline: true },
        ]
      })],
      components: createActionButtons([{ id: 'ui:inventory', label: 'Inventory', emoji: '🎒' }, { id: 'ui:quest', label: 'Quest Lagi', emoji: '📜', style: 1 }, { id: 'ui:achievements', label: 'Achievements', emoji: '🏆' }])
    });
  }
};
