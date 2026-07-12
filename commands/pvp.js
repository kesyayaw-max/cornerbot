
const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS, createActionButtons } = require('../utils/theme');
const { getMainPet, petPower } = require('../utils/petSystem');
const { applyProgress, progressSummaryLines } = require('../utils/level');
const { check, formatRemaining } = require('../utils/cooldown');

const COOLDOWN_MS = 30000;

function calcPower(user) {
  const pet = getMainPet(user);
  return user.level * 30 + (pet ? petPower(pet) : 0) + Math.floor(Math.random() * 35);
}

module.exports = {
  name: 'pvp',
  async execute(msg) {
    const left = check(msg.author.id, 'pvp', COOLDOWN_MS);
    if (left > 0) {
      return msg.reply({ embeds: [createGameEmbed({ title: '⚔️ PVP Arena', description: `⏳ Kamu masih pemulihan. Coba duel lagi dalam **${formatRemaining(left)}**.`, color: COLORS.warning })] });
    }

    const target = msg.mentions?.users?.first?.() || msg.targetUser;
    if (!target || target.bot || target.id === msg.author.id) {
      return msg.reply({ embeds: [createGameEmbed({ title: '⚔️ PVP Arena', description: 'Format: `pvp @user` untuk duel cepat melawan player lain.', color: COLORS.warning })], components: createActionButtons([{ id: 'ui:profile', label: 'Profile', emoji: '🎮' }, { id: 'ui:dungeon', label: 'Dungeon', emoji: '🏰' }]) });
    }

    const you = await getUser(msg.author.id);
    const enemy = await getUser(target.id);
    const yourPower = calcPower(you);
    const enemyPower = calcPower(enemy);

    let description = `Duel antara <@${msg.author.id}> vs <@${target.id}>`;
    let color = COLORS.warning;

    if (yourPower > enemyPower) {
      you.coin += 200;
      you.wins += 1;
      enemy.losses += 1;
      applyProgress(you, { exp: 30, stats: { pvpWins: 1 } });
      description += '\n\n🎉 Kamu menang dan mendapat **+200 coin** + **30 EXP**!';
      color = COLORS.success;
    } else if (yourPower < enemyPower) {
      you.losses += 1;
      enemy.wins += 1;
      applyProgress(you, { exp: 10 });
      description += '\n\n💀 Kamu kalah di duel kali ini, tapi tetap dapat **+10 EXP**.';
      color = COLORS.danger;
    } else {
      applyProgress(you, { exp: 15 });
      description += '\n\n🤝 Duel berakhir seri. Kamu dapat **+15 EXP**.';
    }

    await you.save();
    await enemy.save();

    return msg.reply({
      embeds: [createGameEmbed({
        title: '⚔️ PVP Arena',
        description: [description, ...progressSummaryLines(you)].join('\n\n'),
        color,
        fields: [
          { name: 'Power Kamu', value: `${yourPower}`, inline: true },
          { name: 'Power Lawan', value: `${enemyPower}`, inline: true },
          { name: 'Coin Kamu', value: `${you.coin}`, inline: true },
        ]
      })],
      components: createActionButtons([{ id: 'ui:profile', label: 'Profile', emoji: '🎮' }, { id: 'ui:dungeon', label: 'Dungeon', emoji: '🏰' }, { id: 'ui:achievements', label: 'Achievements', emoji: '🏆' }])
    });
  }
};
