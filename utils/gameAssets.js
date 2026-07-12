const ITEM_DEFS = {
  potion: { key: 'potion', name: 'Potion', price: 100, emoji: '🧪', description: 'Heal & utility item' },
  sword: { key: 'sword', name: 'Sword', price: 500, emoji: '🗡️', description: 'Boost koleksi gear' },
  petfood: { key: 'petfood', name: 'PetFood', price: 150, emoji: '🍖', description: 'Snack favorit pet' },
};

const PET_POOLS = [
  { rarity: 'Common', weight: 45, emoji: '🐣', species: ['Chicko', 'Mochi Chick', 'Sunny Birb', 'Peepster'] },
  { rarity: 'Uncommon', weight: 30, emoji: '🐱', species: ['Neko Puff', 'Luna Cat', 'Mimi Claw', 'Pawsy'] },
  { rarity: 'Rare', weight: 18, emoji: '🐺', species: ['Shadow Wolf', 'Frost Fang', 'Moon Howl', 'Lobo'] },
  { rarity: 'Legendary', weight: 6, emoji: '🐉', species: ['Drako Flame', 'Azure Wing', 'Storm Scale', 'Inferno Drake'] },
  { rarity: 'Mythic', weight: 1, emoji: '🦄', species: ['Nova Horn', 'Aurora Mane', 'Starlight', 'Celestia'] },
];

function getTwemojiUrl(emoji) {
  if (!emoji) return null;
  const codePoints = Array.from(emoji, char => char.codePointAt(0).toString(16)).join('-');
  return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${codePoints}.png`;
}

function getItemMeta(itemName) {
  const raw = String(itemName || '').toLowerCase();
  return ITEM_DEFS[raw] || Object.values(ITEM_DEFS).find(item => item.name.toLowerCase() === raw) || null;
}

function rollPetPool() {
  const roll = Math.random() * 100;
  let total = 0;
  return PET_POOLS.find(item => (total += item.weight) >= roll) || PET_POOLS[0];
}

function buildPetFromPool(pool, count = 0) {
  const species = pool.species[Math.floor(Math.random() * pool.species.length)] || `Pet ${count + 1}`;
  return {
    name: species,
    species,
    rarity: pool.rarity,
    emoji: pool.emoji,
    level: 1,
    exp: 0,
  };
}

function ensurePetVisuals(pet, index = 0) {
  if (!pet.name) pet.name = pet.species || `Pet ${index + 1}`;
  if (!pet.species) pet.species = pet.name;
  if (!pet.emoji) {
    const found = PET_POOLS.find(pool => pool.rarity === pet.rarity);
    pet.emoji = found?.emoji || '🐾';
  }
  return pet;
}

module.exports = { ITEM_DEFS, PET_POOLS, getTwemojiUrl, getItemMeta, rollPetPool, buildPetFromPool, ensurePetVisuals };
