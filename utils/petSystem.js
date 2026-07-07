function petPower(pet) {
  const base = {
    Common: 10,
    Uncommon: 20,
    Rare: 40,
    Legendary: 70,
    Mythic: 100,
  };
  return (base[pet.rarity] || 10) + pet.level * 5;
}

function petLevel(pet) {
  let leveled = false;
  while (pet.exp >= 50) {
    pet.level++;
    pet.exp -= 50;
    leveled = true;
  }
  return leveled;
}

function getMainPet(user) {
  if (!Array.isArray(user.pets) || !user.pets.length) return null;
  const index = typeof user.equippedPet === 'number' ? user.equippedPet : 0;
  return user.pets[index] || user.pets[0];
}

function getMainPetIndex(user) {
  if (!Array.isArray(user.pets) || !user.pets.length) return -1;
  const index = typeof user.equippedPet === 'number' ? user.equippedPet : 0;
  return user.pets[index] ? index : 0;
}

module.exports = { petPower, petLevel, getMainPet, getMainPetIndex };
