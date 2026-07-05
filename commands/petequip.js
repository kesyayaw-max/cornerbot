const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS, createActionButtons, petThumbnail } = require('../utils/theme');

module.exports = {
  name: 'petequip',
  async execute(msg, args) {
    const user = await getUser(msg.author.id);
    const index = parseInt(args[0], 10) - 1;

    if (!user.pets.length) {
      return msg.reply({ embeds: [createGameEmbed({ title: '👑 Pet Equip', description: 'Kamu belum punya pet. Pakai `catch` dulu.', color: COLORS.warning })], components: createActionButtons([{ id: 'ui:catch', label: 'Catch Pet', emoji: '🎯', style: 1 }]) });
    }

    if (Number.isNaN(index)) {
      return msg.reply({ embeds: [createGameEmbed({ title: '👑 Pet Equip', description: `Format: \`petequip <nomor pet>\`\nContoh: \`petequip 2\`\nKamu punya **${user.pets.length}** pet.`, color: COLORS.warning })], components: createActionButtons([{ id: 'ui:pets', label: 'Lihat Pets', emoji: '🐾' }]) });
    }

    const pet = user.pets[index];
    if (!pet) {
      return msg.reply({ embeds: [createGameEmbed({ title: '👑 Pet Equip', description: `Pet nomor **${index + 1}** tidak ditemukan.`, color: COLORS.danger })], components: createActionButtons([{ id: 'ui:pets', label: 'Lihat Pets', emoji: '🐾' }]) });
    }

    user.equippedPet = index;
    await user.save();

    return msg.reply({ embeds: [createGameEmbed({ title: '👑 Main Pet Diganti', description: `Sekarang **${pet.emoji || '🐾'} ${pet.name}** menjadi main pet kamu.`, color: COLORS.pet, thumbnail: petThumbnail(pet), fields: [{ name: 'Rarity', value: pet.rarity, inline: true }, { name: 'Level', value: `${pet.level}`, inline: true }] })], components: createActionButtons([{ id: 'ui:petbattle', label: 'Pet Battle', emoji: '⚔️', style: 4 }, { id: 'ui:pets', label: 'Kembali ke Pets', emoji: '🐾' }]) });
  }
};
