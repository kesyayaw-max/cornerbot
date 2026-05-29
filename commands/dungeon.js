
const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS, createActionButtons, petThumbnail } = require('../utils/theme');
const { getMainPet, petPower } = require('../utils/petSystem');
const { applyProgress, progressSummaryLines } = require('../utils/level');

module.exports = {
  name: 'dungeon',
  async execute(msg) {
    const user = await getUser(msg.author.id);
    const cooldown = 30 * 60 * 1000;
    const remaining = cooldown - (Date.now() - user.lastDungeon);
    if (remaining > 0) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🏰 Dungeon Raid', description: `Dungeon masih cooldown. Buka lagi <t:${Math.floor((Date.now() + remaining) / 1000)}:R>.`, color: COLORS.warning })], components: createActionButtons([{ id: 'ui:quest', label: 'Quest', emoji: '📜' }, { id: 'ui:profile', label: 'Profile', emoji: '🎮' }, { id: 'ui:help', label: 'Help', emoji: '❔' }]) });
    }

    const pet = getMainPet(user);
    const playerPower = user.level * 35 + (pet ? petPower(pet) : 0) + Math.floor(Math.random() * 50);
    const bossPower = 90 + Math.floor(Math.random() * 180);
    const clear = playerPower >= bossPower;

    let coin = 60 + Math.floor(Math.random() * 140);
    let exp = 20 + Math.floor(Math.random() * 50);
    if (clear) {
      coin += 150;
      exp += 50;
      user.wins += 1;
    } else {
      coin = Math.floor(coin / 2);
      exp = Math.floor(exp / 2);
      user.losses += 1;
    }

    user.coin += coin;
    user.lastDungeon = Date.now();
    applyProgress(user, { exp, stats: { dungeonRuns: 1, ...(clear ? { dungeonWins: 1 } : {}) } });
    await user.save();

    const extra = progressSummaryLines(user);
    return msg.reply({
      embeds: [createGameEmbed({
        title: '🏰 Dungeon Result',
        description: [clear ? 'Raid sukses! Tim kamu membersihkan dungeon.' : 'Raid gagal total, tapi masih membawa sedikit loot pulang.', ...extra].join('\n\n'),
        color: clear ? COLORS.success : COLORS.danger,
        thumbnail: petThumbnail(pet),
        fields: [
          { name: '⚔️ Power Kamu', value: `${playerPower}`, inline: true },
          { name: '👹 Boss Power', value: `${bossPower}`, inline: true },
          { name: '🐾 Main Pet', value: pet ? `${pet.emoji || '🐾'} ${pet.name}` : 'Tidak ada', inline: true },
          { name: '💰 Reward', value: `+${coin} coin`, inline: true },
          { name: '✨ EXP', value: `+${exp} exp`, inline: true },
          { name: '📊 Dungeon Clear', value: `${user.stats?.dungeonWins || 0}`, inline: true },
        ]
      })],
      components: createActionButtons([{ id: 'ui:dungeon', label: 'Raid Lagi', emoji: '🏰', style: 4 }, { id: 'ui:profile', label: 'Profile', emoji: '🎮' }, { id: 'ui:pets', label: 'Pets', emoji: '🐾' }, { id: 'ui:achievements', label: 'Achievements', emoji: '🏆' }])
    });
  }
};
