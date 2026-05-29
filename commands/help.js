
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const { createGameEmbed, COLORS, createActionButtons } = require('../utils/theme');
const { helpArtAttachment, attachmentImageUrl } = require('../utils/art');

const HELP_PANELS = {
  home: {
    title: '🌟 Cosmic Corner Hyper Help Center',
    color: COLORS.primary,
    description: 'Pilih kategori lewat select menu di bawah buat buka panel command yang lebih rapi, lebih premium, dan lebih gampang dipakai.',
    fields: [
      { name: '🎮 Main', value: 'Profile, dashboard, balance, daily, shop, inventory, leaderboard, rank.', inline: true },
      { name: '⚔️ Game', value: 'Hunt, fishing, quest, dungeon, boss, pvp, gambling.', inline: true },
      { name: '🐾 Pet', value: 'Catch pet, equip pet, pet battle, koleksi pet.', inline: true },
      { name: '🎵 Music', value: 'Play lagu, queue, skip, loop, nowplaying, volume.', inline: true },
      { name: '💡 Quick Start', value: '`start -> dashboard -> daily -> hunt/fishing -> shop -> quest -> dungeon -> achievements`', inline: false },
    ],
  },
  start: {
    title: '🚀 Start / Onboarding Commands',
    color: COLORS.success,
    description: 'Panel onboarding buat player baru atau pemain lama yang mau lihat jalur progress tercepat.',
    fields: [
      { name: '🚀 /cc main start', value: 'Buka dashboard onboarding, checklist, dan shortcut progress utama.', inline: false },
      { name: '🎁 Early Route', value: '`daily` buat modal awal, lanjut `hunt` atau `fishing`, lalu `shop` dan `catch`.', inline: false },
      { name: '⚔️ Mid Route', value: 'Kalau coin dan item sudah cukup, gas `quest`, `dungeon`, `boss`, lalu push `rank`.', inline: false },
      { name: '🏆 Fast Power', value: 'Achievement + level + pet = power score naik lebih cepat.', inline: false },
    ],
  },
  main: {
    title: '🎮 Main / Economy Commands',
    color: COLORS.primary,
    description: 'Panel command utama buat bangun akun dan ekonomi kamu.',
    commands: [
      ['start', 'Buka onboarding dashboard & starter checklist.'],
      ['dashboard', 'Buka command center interaktif.'],
      ['profile', 'Buka dashboard utama player.'],
      ['balance', 'Lihat total coin saat ini.'],
      ['daily', 'Claim reward harian.'],
      ['shop', 'Buka shop interaktif.'],
      ['buy <item>', 'Beli item dari shop.'],
      ['inventory', 'Lihat galeri item.'],
      ['leaderboard', 'Lihat papan peringkat.'],
      ['rank', 'Lihat level dan progress exp.'],
      ['achievements', 'Lihat achievement dan reward.'],
      ['help', 'Buka guide interaktif ini.'],
    ],
  },
  game: {
    title: '⚔️ Game Commands',
    color: COLORS.danger,
    description: 'Semua command tempur, farming, dan mini game.',
    commands: [
      ['hunt', 'Berburu buat dapat coin dan exp.'],
      ['fishing', 'Mancing untuk reward tambahan.'],
      ['quest', 'Jalankan quest dengan cooldown.'],
      ['dungeon', 'Raid dungeon untuk loot besar.'],
      ['boss', 'Lawan boss buat hadiah langka.'],
      ['pvp @user', 'Duel lawan player lain.'],
      ['slot <bet>', 'Slot machine cepat.'],
      ['blackjack <bet>', 'Blackjack economy.'],
      ['coinflip <bet> <choice>', 'Heads atau tails.'],
      ['dice <bet> <guess>', 'Tebak angka dadu.'],
      ['rps <bet> <choice>', 'Batu gunting kertas.'],
    ],
  },
  pet: {
    title: '🐾 Pet System Commands',
    color: COLORS.pet,
    description: 'Bikin pet collection kamu makin OP.',
    commands: [
      ['catch', 'Tangkap pet random.'],
      ['pets', 'Lihat pet gallery interaktif.'],
      ['petequip <nomor>', 'Pasang pet utama.'],
      ['petbattle', 'Battle pakai pet utama.'],
      ['profile', 'Lihat main pet di dashboard.'],
    ],
  },
  music: {
    title: '🎵 Music Commands',
    color: COLORS.success,
    description: 'Kontrol player musik server.',
    commands: [
      ['play <query>', 'Putar lagu dari judul / URL.'],
      ['queue', 'Lihat antrean lagu.'],
      ['nowplaying', 'Lihat lagu aktif.'],
      ['skip', 'Lewati lagu saat ini.'],
      ['loop', 'Aktif/nonaktif loop.'],
      ['stop', 'Hentikan player.'],
      ['volume <1-100>', 'Atur volume musik.'],
    ],
  },
  tips: {
    title: '💡 Pro Tips & Combo Farming',
    color: COLORS.warning,
    description: 'Biar progress lebih ngebut dan UI bot terasa hidup.',
    fields: [
      { name: '⚡ Combo Cepat', value: '`daily` + `hunt` + `fishing` buat coin awal yang stabil.', inline: false },
      { name: '🏰 Mid Game', value: 'Setelah punya gear, lanjut `quest` dan `dungeon` buat exp lebih besar.', inline: false },
      { name: '🏆 End Game', value: 'Push `boss`, `pvp`, dan koleksi achievement untuk reward bonus.', inline: false },
      { name: '🐾 Pet Build', value: 'Rajin `catch`, lalu equip pet terbaik biar profile dan battle makin keren.', inline: false },
      { name: '🎛️ UI Shortcut', value: 'Banyak panel sekarang punya tombol, selector, dan pager biar lebih wow.', inline: false },
    ],
  },
};

function commandFields(commands = [], page = 0, perPage = 5) {
  const maxPage = Math.max(0, Math.ceil(commands.length / perPage) - 1);
  const safePage = Math.min(Math.max(Number(page) || 0, 0), maxPage);
  const slice = commands.slice(safePage * perPage, safePage * perPage + perPage);
  return {
    safePage,
    maxPage,
    fields: slice.map((item, i) => ({
      name: `/${item[0]}`,
      value: item[1],
      inline: false,
    })),
  };
}

function buildHelpView(category = 'home', ownerId = '0', page = 0) {
  const panel = HELP_PANELS[category] || HELP_PANELS.home;
  const art = helpArtAttachment(category);

  let fields = panel.fields || [];
  let safePage = 0;
  let maxPage = 0;

  if (panel.commands) {
    const paged = commandFields(panel.commands, page);
    fields = [
      ...paged.fields,
      { name: '📄 Page', value: `Halaman **${paged.safePage + 1}/${paged.maxPage + 1}**`, inline: false },
    ];
    safePage = paged.safePage;
    maxPage = paged.maxPage;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId(`select:help:${ownerId}:${safePage}`)
    .setPlaceholder('Pilih kategori bantuan')
    .addOptions(Object.entries(HELP_PANELS).map(([key, value]) =>
      new StringSelectMenuOptionBuilder()
        .setLabel(value.title.replace(/^[^\s]+\s/, '').slice(0, 100))
        .setDescription(value.description.slice(0, 100))
        .setValue(key)
        .setDefault(key === category)
    ));

  return {
    embeds: [createGameEmbed({
      title: panel.title,
      description: `${panel.description}\n\nGunakan tombol di bawah untuk pindah panel secara cepat.`,
      color: panel.color || COLORS.primary,
      fields,
      image: attachmentImageUrl(art),
      footer: 'Cosmic Corner Bot • Hyper Help Navigator',
    })],
    files: [art],
    components: [
      ...createActionButtons([
        { id: `nav:help:${ownerId}:home:0`, label: 'Home', emoji: '🏠', style: 1 },
        { id: `nav:help:${ownerId}:${category}:${safePage - 1}`, label: 'Prev', emoji: '⬅️', disabled: safePage <= 0 },
        { id: `nav:help:${ownerId}:${category}:${safePage + 1}`, label: 'Next', emoji: '➡️', disabled: safePage >= maxPage },
        { id: 'ui:profile', label: 'Profile', emoji: '🎮', style: 2 },
        { id: `nav:achievements:${ownerId}:0`, label: 'Achievements', emoji: '🏆', style: 2 },
      ]),
      new ActionRowBuilder().addComponents(select),
    ],
  };
}

module.exports = {
  name: 'help',
  buildHelpView,
  async execute(msg, args = []) {
    const category = String(args[0] || 'home').toLowerCase();
    const page = Number(args[1]) || 0;
    return msg.reply(buildHelpView(category, msg.author.id, page));
  },
};
