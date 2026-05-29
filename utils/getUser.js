const User = require("../models/User");
const { ensurePetVisuals } = require("./gameAssets");
const { ensureAchievementState } = require("./achievements");

async function getUser(userOrMember) {
  const userId = typeof userOrMember === "string" ? userOrMember : userOrMember?.id;
  if (!userId) throw new Error("getUser: userId/member tidak valid");

  let user = await User.findOne({ userId });
  if (!user) user = await User.create({ userId });

  // simpan nama/avatar kalau yang dikirim adalah GuildMember
  if (typeof userOrMember !== "string" && userOrMember?.user) {
    user.username = userOrMember.user.username;
    user.displayName = userOrMember.displayName;
    user.avatar = userOrMember.user.displayAvatarURL({ extension: "png", size: 128 });
  }

  const normalizedBalance = Number(user.coin ?? user.cash ?? 0) || 0;
  user.coin = normalizedBalance;
  user.cash = normalizedBalance;

  if (!Array.isArray(user.inventory)) {
    if (user.inventory && typeof user.inventory === "object") {
      user.inventory = Object.values(user.inventory).filter(Boolean).map(String);
    } else {
      user.inventory = [];
    }
  }

  if (!Array.isArray(user.pets)) user.pets = [];
  user.pets = user.pets.map((pet, index) => ensurePetVisuals(pet, index));

  if (typeof user.equippedPet !== "number" || Number.isNaN(user.equippedPet)) {
    user.equippedPet = 0;
  }

  if (user.equippedPet < 0 || user.equippedPet >= user.pets.length) {
    user.equippedPet = 0;
  }

  if (typeof user.wins !== "number") user.wins = 0;
  if (typeof user.losses !== "number") user.losses = 0;
  if (typeof user.lastQuest !== "number") user.lastQuest = 0;
  if (typeof user.lastDungeon !== "number") user.lastDungeon = 0;

  ensureAchievementState(user);

  if (!user.voice || typeof user.voice !== "object") {
    user.voice = { totalMinutes: 0, totalXp: 0, totalCoins: 0 };
  }

  const voiceDefaults = {
    totalMinutes: 0,
    totalXp: 0,
    totalCoins: 0,
  };

  for (const [key, value] of Object.entries(voiceDefaults)) {
    if (typeof user.voice[key] !== "number") user.voice[key] = value;
  }

  const defaults = {
    huntCount: 0,
    fishingCount: 0,
    questCount: 0,
    dungeonRuns: 0,
    dungeonWins: 0,
    petCatchCount: 0,
    pvpWins: 0,
    bossWins: 0,
    dailyClaims: 0,
  };

  if (!user.stats || typeof user.stats !== "object") user.stats = {};

  for (const [key, value] of Object.entries(defaults)) {
    if (typeof user.stats[key] !== "number") user.stats[key] = value;
  }

  await user.save();
  return user;
}

module.exports = { getUser };
