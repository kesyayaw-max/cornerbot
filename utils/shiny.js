const SHINY_CHANCE = 0.06; // 6% peluang tiap sukses main

function rollShiny() {
  return Math.random() < SHINY_CHANCE;
}

function shinyCoinBonus(baseCoin = 0) {
  return Math.floor(baseCoin * 1.8) + 40;
}

module.exports = { rollShiny, shinyCoinBonus, SHINY_CHANCE };
