const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: { type: String, default: 'Pet' },
  species: { type: String, default: 'Pet' },
  rarity: { type: String, default: 'Common' },
  emoji: { type: String, default: '🐾' },
  level: { type: Number, default: 1 },
  exp: { type: Number, default: 0 }
}, { _id: false });

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String },
  displayName: { type: String },
  avatar: { type: String },

  coin: { type: Number, default: 0 },
  exp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  inventory: { type: [String], default: [] },
  pets: { type: [petSchema], default: [] },
  equippedPet: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  lastDaily: { type: Number, default: 0 },
  lastQuest: { type: Number, default: 0 },
  lastDungeon: { type: Number, default: 0 },
  achievements: { type: [String], default: [] },
  voice: {
    totalMinutes: { type: Number, default: 0 },
    totalXp: { type: Number, default: 0 },
    totalCoins: { type: Number, default: 0 },
  },
  stats: {
    huntCount: { type: Number, default: 0 },
    fishingCount: { type: Number, default: 0 },
    questCount: { type: Number, default: 0 },
    dungeonRuns: { type: Number, default: 0 },
    dungeonWins: { type: Number, default: 0 },
    petCatchCount: { type: Number, default: 0 },
    pvpWins: { type: Number, default: 0 },
    bossWins: { type: Number, default: 0 },
    dailyClaims: { type: Number, default: 0 }
  }
});

module.exports = mongoose.model('User', userSchema);
