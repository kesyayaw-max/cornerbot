
const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS, createActionButtons } = require('../utils/theme');
const { rollPetPool, buildPetFromPool } = require('../utils/gameAssets');
const { petArtAttachment, attachmentImageUrl } = require('../utils/art');
const { applyProgress, progressSummaryLines } = require('../utils/level');

module.exports = {
  name: 'catch',
  async execute(msg) {
    const u = await getUser(msg.author.id);

    const picked = rollPetPool();
    const pet = buildPetFromPool(picked, u.pets.length);
    u.pets.push(pet);
    if (u.pets.length === 1) u.equippedPet = 0;
    applyProgress(u, { exp: 15, stats: { petCatchCount: 1 } });
    await u.save();

    const art = petArtAttachment(pet);
    const extra = progressSummaryLines(u);
    return msg.reply({
      embeds: [createGameEmbed({
        title: '🐾 Pet Tertangkap!',
        description: [`${pet.emoji} Kamu mendapatkan **${pet.name}** dengan rarity **${picked.rarity}**.`, ...extra].join('\n\n'),
        color: COLORS.pet,
        image: attachmentImageUrl(art),
        fields: [
          { name: '✨ Species', value: `${pet.name}`, inline: true },
          { name: '📦 Total Pet', value: `${u.pets.length}`, inline: true },
          { name: '⭐ Level', value: `${u.level}`, inline: true },
          { name: '👑 Status', value: u.pets.length === 1 ? 'Auto jadi main pet' : 'Gunakan `cc petequip` untuk ganti', inline: false }
        ]
      })],
      files: [art],
      components: createActionButtons([
        { id: 'ui:petbattle', label: 'Pet Battle', emoji: '⚔️', style: 4 },
        { id: 'ui:pets', label: 'Lihat Pets', emoji: '🐾' },
        { id: 'ui:catch', label: 'Catch Lagi', emoji: '🎯', style: 1 },
        { id: 'ui:achievements', label: 'Achievements', emoji: '🏆' },
      ])
    });
  }
};
