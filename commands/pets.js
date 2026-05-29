const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const { getUser } = require('../utils/getUser');
const { petPower } = require('../utils/petSystem');
const { createGameEmbed, COLORS, rarityIcon, createActionButtons, formatPetLabel } = require('../utils/theme');
const { petArtAttachment, attachmentImageUrl } = require('../utils/art');

function buildPetsView(user, ownerId, page = 0) {
  const equipped = typeof user.equippedPet === 'number' ? user.equippedPet : 0;
  const perPage = 5;
  const maxPage = Math.max(0, Math.ceil(user.pets.length / perPage) - 1);
  const safePage = Math.min(Math.max(Number(page) || 0, 0), maxPage);
  const start = safePage * perPage;
  const pagePets = user.pets.slice(start, start + perPage);
  const mainPet = user.pets[equipped] || user.pets[0];
  const art = petArtAttachment(mainPet);

  const fields = pagePets.map((pet, offset) => {
    const index = start + offset;
    return {
      name: formatPetLabel(pet, index, index === equipped),
      value: `Rarity **${rarityIcon(pet.rarity)} ${pet.rarity}**\nLevel **${pet.level}** • EXP **${pet.exp}/50** • Power **${petPower(pet)}**\nGunakan \`cc petequip ${index + 1}\` untuk equip`,
      inline: false,
    };
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId(`select:pets:${ownerId}:${safePage}`)
    .setPlaceholder('Pilih pet untuk lihat / equip')
    .addOptions(
      pagePets.map((pet, offset) => {
        const index = start + offset;
        return new StringSelectMenuOptionBuilder()
          .setLabel(`${index + 1}. ${pet.name}`.slice(0, 100))
          .setDescription(`${pet.rarity} • Lv ${pet.level} • Power ${petPower(pet)}`.slice(0, 100))
          .setValue(String(index))
          .setEmoji(pet.emoji || '🐾')
          .setDefault(index === equipped);
      })
    );

  const components = [
    ...createActionButtons([
      { id: `nav:pets:${ownerId}:${safePage - 1}`, label: 'Prev', emoji: '⬅️', disabled: safePage <= 0 },
      { id: 'ui:catch', label: 'Catch Lagi', emoji: '🎯', style: 1 },
      { id: `nav:pets:${ownerId}:${safePage + 1}`, label: 'Next', emoji: '➡️', disabled: safePage >= maxPage },
      { id: 'ui:petbattle', label: 'Pet Battle', emoji: '⚔️', style: 4 },
    ]),
    new ActionRowBuilder().addComponents(select),
  ];

  return {
    embeds: [createGameEmbed({
      title: '🐾 Koleksi Pet Max UI',
      description: `Total pet: **${user.pets.length}** • Halaman **${safePage + 1}/${maxPage + 1}** • Pet dengan ikon 👑 sedang dipakai sebagai main pet.`,
      color: COLORS.pet,
      fields,
      image: attachmentImageUrl(art),
      footer: 'Cosmic Corner Bot • Pet Deck Gallery',
    })],
    files: [art],
    components,
  };
}

module.exports = {
  name: 'pets',
  buildPetsView,
  async execute(msg, args = []) {
    const user = await getUser(msg.author.id);

    if (!user.pets.length) {
      return msg.reply({
        embeds: [createGameEmbed({
          title: '🐾 Koleksi Pet',
          description: 'Kamu belum punya pet. Gunakan `cc catch` untuk menangkap pet pertamamu.',
          color: COLORS.warning,
          footer: 'Cosmic Corner Bot • Pet Collection',
        })],
        components: createActionButtons([
          { id: 'ui:catch', label: 'Catch Pet', emoji: '🎯', style: 1 },
          { id: 'ui:profile', label: 'Profile', emoji: '🎮' },
        ])
      });
    }

    const page = Number(args[0]) || 0;
    return msg.reply(buildPetsView(user, msg.author.id, page));
  }
};
