const { getUser } = require('../utils/getUser');
const { petPower, petLevel, getMainPet, getMainPetIndex } = require('../utils/petSystem');
const { createGameEmbed, COLORS, createActionButtons, petThumbnail } = require('../utils/theme');

module.exports = {
  name: 'petbattle',
  async execute(msg) {
    const u = await getUser(msg.author.id);

    if (!Array.isArray(u.pets) || u.pets.length === 0) {
      return msg.reply({ embeds: [createGameEmbed({ title: '🐾 Pet Battle', description: 'Kamu belum punya pet. Pakai command `catch` dulu ya.', color: COLORS.warning })], components: createActionButtons([{ id: 'ui:catch', label: 'Catch Pet', emoji: '🎯', style: 1 }]) });
    }

    const p = getMainPet(u);
    const petIndex = getMainPetIndex(u);
    const enemy = Math.floor(Math.random() * 120) + 1;
    const power = petPower(p);
    const fields = [
      { name: '🐾 Main Pet', value: `${p.emoji || '🐾'} ${p.name} (#${petIndex + 1})`, inline: true },
      { name: '⚔️ Power', value: `${power}`, inline: true },
      { name: '👾 Enemy', value: `${enemy}`, inline: true },
    ];

    let description = '';
    let color = COLORS.danger;

    if (power >= enemy) {
      p.exp += 20;
      u.coin += 75;
      description = 'Pet kamu menang dan mendapat **+20 EXP** serta **+75 coin**!';
      color = COLORS.success;
    } else {
      p.exp += 5;
      description = 'Pet kamu kalah, tapi tetap belajar dari battle dan mendapat **+5 EXP**.';
      color = COLORS.warning;
    }

    const leveledUp = petLevel(p);
    fields.push({ name: '📈 Progress', value: leveledUp ? `Naik ke level **${p.level}**` : `${p.exp}/50 EXP`, inline: false });
    fields.push({ name: '💰 Coin', value: `${u.coin}`, inline: true });

    await u.save();
    return msg.reply({ embeds: [createGameEmbed({ title: '🐾 Pet Battle Arena', description, color, fields, thumbnail: petThumbnail(p) })], components: createActionButtons([{ id: 'ui:petbattle', label: 'Battle Lagi', emoji: '⚔️', style: 4 }, { id: 'ui:pets', label: 'Pet Deck', emoji: '🐾' }]) });
  }
};
