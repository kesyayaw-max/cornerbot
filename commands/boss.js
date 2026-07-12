
const { getUser } = require('../utils/getUser');
const { createGameEmbed, COLORS, createActionButtons } = require('../utils/theme');
const { applyProgress, progressSummaryLines } = require('../utils/level');
const { check, formatRemaining } = require('../utils/cooldown');
const { bar } = require('../utils/embed');
const { getGuildEmotes } = require('../utils/emotes');
const { rollShiny, shinyCoinBonus } = require('../utils/shiny');

const COOLDOWN_MS = 60000;
const battles = new Map(); // key: guildId:userId -> battle state

function battleKey(guildId, userId) {
  return `${guildId || 'dm'}:${userId}`;
}

function makeBattle(level) {
  const bossMaxHp = 120 + level * 18;
  const playerMaxHp = 100 + level * 8;
  return {
    level,
    bossHp: bossMaxHp,
    bossMaxHp,
    playerHp: playerMaxHp,
    playerMaxHp,
    defending: false,
    round: 1,
  };
}

function buildBattleEmbed(battle, emotes, statusText = '') {
  const bossHpClamped = Math.max(0, battle.bossHp);
  const playerHpClamped = Math.max(0, battle.playerHp);
  const desc = [
    `${emotes.boss} **Boss** ${bar(bossHpClamped, battle.bossMaxHp)} ${bossHpClamped}/${battle.bossMaxHp}`,
    `🧑 **Kamu** ${bar(playerHpClamped, battle.playerMaxHp)} ${playerHpClamped}/${battle.playerMaxHp}`,
    '',
    statusText || 'Pilih aksi: Serang, Bertahan, atau Kabur.',
  ].join('\n');

  return createGameEmbed({
    title: `${emotes.boss} Boss Battle — Ronde ${battle.round}`,
    description: desc,
    color: battle.bossHp <= 0 ? COLORS.success : battle.playerHp <= 0 ? COLORS.danger : COLORS.primary,
    footer: 'Cosmic Corner Bot • Boss Battle',
  });
}

function buildBattleButtons(ownerId) {
  return createActionButtons([
    { id: `boss:attack:${ownerId}`, label: 'Serang', emoji: '⚔️', style: 1 },
    { id: `boss:defend:${ownerId}`, label: 'Bertahan', emoji: '🛡️', style: 2 },
    { id: `boss:flee:${ownerId}`, label: 'Kabur', emoji: '🏃', style: 4 },
  ]);
}

module.exports = {
  name: 'boss',
  async execute(msg) {
    const guildId = msg.guild?.id;
    const key = battleKey(guildId, msg.author.id);
    const emotes = await getGuildEmotes(guildId, ['boss', 'crit', 'shiny'], { boss: '👑', crit: '💥', shiny: '✨' });

    if (battles.has(key)) {
      const battle = battles.get(key);
      return msg.reply({
        embeds: [buildBattleEmbed(battle, emotes, '⚠️ Kamu masih ada battle yang berjalan!')],
        components: buildBattleButtons(msg.author.id),
      });
    }

    const left = check(msg.author.id, 'boss', COOLDOWN_MS);
    if (left > 0) {
      return msg.reply({ embeds: [createGameEmbed({ title: `${emotes.boss} Boss Battle`, description: `⏳ Boss masih regen. Coba lagi dalam **${formatRemaining(left)}**.`, color: COLORS.warning })] });
    }

    const u = await getUser(msg.author.id);
    const battle = makeBattle(u.level || 1);
    battles.set(key, battle);

    return msg.reply({
      embeds: [buildBattleEmbed(battle, emotes, '⚔️ Boss muncul! Siapkan strategi kamu.')],
      components: buildBattleButtons(msg.author.id),
    });
  },

  async handleAction(interaction, action) {
    const guildId = interaction.guild?.id;
    const key = battleKey(guildId, interaction.user.id);
    const battle = battles.get(key);
    const emotes = await getGuildEmotes(guildId, ['boss', 'crit', 'shiny'], { boss: '👑', crit: '💥', shiny: '✨' });

    if (!battle) {
      return interaction.update({
        embeds: [createGameEmbed({ title: `${emotes.boss} Boss Battle`, description: 'Battle ini sudah selesai atau kadaluarsa. Mulai baru dengan `/cc game boss`.', color: COLORS.warning })],
        components: [],
      }).catch(() => {});
    }

    if (action === 'flee') {
      battles.delete(key);
      return interaction.update({
        embeds: [createGameEmbed({ title: '🏃 Kabur!', description: 'Kamu mundur dari battle. Nggak ada reward, tapi HP aman.', color: COLORS.warning })],
        components: [],
      }).catch(() => {});
    }

    battle.round += 1;
    const statusLines = [];

    if (action === 'defend') {
      battle.defending = true;
      statusLines.push('🛡️ Kamu bersiap bertahan, damage boss berikutnya berkurang.');
    } else {
      const isCrit = Math.random() < 0.15;
      let dmg = Math.floor(Math.random() * (10 + battle.level * 2)) + 8;
      if (isCrit) {
        dmg = Math.floor(dmg * 1.8);
        statusLines.push(`${emotes.crit} **CRITICAL HIT!** Kamu deal **${dmg}** damage.`);
      } else {
        statusLines.push(`⚔️ Kamu serang dan deal **${dmg}** damage.`);
      }
      battle.bossHp -= dmg;
    }

    if (battle.bossHp > 0) {
      let bossDmg = Math.floor(Math.random() * (8 + battle.level)) + 5;
      if (battle.defending) {
        bossDmg = Math.floor(bossDmg / 2);
        statusLines.push(`🛡️ Pertahanan mengurangi damage jadi **${bossDmg}**.`);
      }
      battle.playerHp -= bossDmg;
      statusLines.push(`${emotes.boss} Boss balas serang, kamu kena **${bossDmg}** damage.`);
    }

    battle.defending = false;

    if (battle.bossHp <= 0) {
      battles.delete(key);
      const u = await getUser(interaction.user.id);
      let coin = 300 + battle.level * 25;
      const exp = 90 + battle.level * 6;
      let shinyLine = '';

      if (rollShiny()) {
        const bonus = shinyCoinBonus(coin);
        coin += bonus;
        u.stats.shinyCount = (u.stats.shinyCount || 0) + 1;
        shinyLine = `\n${emotes.shiny} **SHINY DROP!** Bonus +${bonus} coin!`;
      }

      u.coin += coin;
      applyProgress(u, { exp, stats: { bossWins: 1 } });
      await u.save();

      statusLines.push(`\n🎉 **Boss tumbang!** Reward: **+${coin} coin**, **+${exp} EXP**.${shinyLine}`, ...progressSummaryLines(u));

      return interaction.update({
        embeds: [buildBattleEmbed(battle, emotes, statusLines.join('\n'))],
        components: [],
      }).catch(() => {});
    }

    if (battle.playerHp <= 0) {
      battles.delete(key);
      statusLines.push('\n💀 **Kamu kalah.** Nggak ada reward kali ini, coba lagi nanti.');
      return interaction.update({
        embeds: [buildBattleEmbed(battle, emotes, statusLines.join('\n'))],
        components: [],
      }).catch(() => {});
    }

    return interaction.update({
      embeds: [buildBattleEmbed(battle, emotes, statusLines.join('\n'))],
      components: buildBattleButtons(interaction.user.id),
    }).catch(() => {});
  },
};
