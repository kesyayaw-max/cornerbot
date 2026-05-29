const ICONS = {
  backpack: 'https://cdn3.emoji.gg/emojis/7293-backpack.png',
  coin: 'https://cdn3.emoji.gg/emojis/532883-cash.png',
  paw: 'https://cdn3.emoji.gg/emojis/235270-paw.png',

  rarity: {
    common: 'https://cdn3.emoji.gg/emojis/5410-whiteorb.png',
    uncommon: 'https://cdn3.emoji.gg/emojis/2143-greenorb.png',
    rare: 'https://cdn3.emoji.gg/emojis/6428-blueorb.png',
    epic: 'https://cdn3.emoji.gg/emojis/8731-purpleorb.png',
    legendary: 'https://cdn3.emoji.gg/emojis/5921-goldorb.png',
    mythic: 'https://cdn3.emoji.gg/emojis/4487-redorb.png',
  },
};

function getIcon(name) {
  return ICONS[name] || null;
}

function getRarityIconImage(rarity) {
  return ICONS.rarity[String(rarity || '').toLowerCase()] || ICONS.rarity.common;
}

module.exports = {
  ICONS,
  getIcon,
  getRarityIconImage,
};
