
const { AttachmentBuilder } = require('discord.js');

function esc(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const rarityThemes = {
  Common: ['#7f8c8d', '#bdc3c7'],
  Uncommon: ['#16a34a', '#86efac'],
  Rare: ['#2563eb', '#93c5fd'],
  Legendary: ['#7c3aed', '#f0abfc'],
  Mythic: ['#ea580c', '#fde68a'],
  Admin: ['#f59e0b', '#fcd34d'],
  Item: ['#0f172a', '#60a5fa'],
  Neon: ['#312e81', '#22d3ee'],
  Gold: ['#92400e', '#facc15'],
  Emerald: ['#14532d', '#4ade80'],
  Danger: ['#7f1d1d', '#fca5a5'],
};

function buildCardSvg({ title, subtitle = '', emoji = '✨', theme = 'Item', badge = '', accent = '' }) {
  const [c1, c2] = rarityThemes[theme] || rarityThemes.Item;
  const safeTitle = esc(title).slice(0, 28);
  const safeSubtitle = esc(subtitle).slice(0, 60);
  const safeBadge = esc(badge).slice(0, 18);
  const safeAccent = esc(accent).slice(0, 22);

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="#0b1020" />
    <rect x="18" y="18" width="1164" height="594" rx="34" fill="url(#bg)" />
    <circle cx="1010" cy="140" r="130" fill="rgba(255,255,255,0.12)"/>
    <circle cx="180" cy="560" r="160" fill="rgba(255,255,255,0.08)"/>
    <rect x="48" y="48" width="1104" height="534" rx="28" fill="rgba(10,14,30,0.20)" stroke="rgba(255,255,255,0.16)" />
    <rect x="70" y="72" width="350" height="486" rx="28" fill="rgba(255,255,255,0.12)" />
    <text x="245" y="340" text-anchor="middle" font-size="210">${emoji}</text>
    <rect x="460" y="95" width="174" height="46" rx="23" fill="rgba(255,255,255,0.16)" />
    <text x="547" y="126" text-anchor="middle" font-family="Arial, sans-serif" font-size="23" fill="#fff">${safeBadge}</text>
    <text x="460" y="235" font-family="Arial, sans-serif" font-size="66" font-weight="700" fill="#fff">${safeTitle}</text>
    <text x="460" y="298" font-family="Arial, sans-serif" font-size="34" fill="rgba(255,255,255,0.92)">${safeSubtitle}</text>
    <rect x="460" y="420" width="420" height="82" rx="24" fill="rgba(10,14,30,0.22)" />
    <text x="490" y="470" font-family="Arial, sans-serif" font-size="32" fill="#fff">${safeAccent}</text>
    <text x="72" y="608" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.86)">Cosmic Corner • Card</text>
  </svg>`;
}

function buildDashboardSvg({ title, subtitle, leftStats = [], rightStats = [], accent = 'PLAYER HUB', emoji = '⚡', theme = 'Neon' }) {
  const [c1, c2] = rarityThemes[theme] || rarityThemes.Neon;
  const safeTitle = esc(title).slice(0, 30);
  const safeSubtitle = esc(subtitle).slice(0, 80);
  const safeAccent = esc(accent).slice(0, 22);
  const left = leftStats.slice(0, 4).map((line, i) => `<text x="104" y="${236 + i * 58}" font-family="Arial, sans-serif" font-size="31" fill="#fff">${esc(line).slice(0, 24)}</text>`).join('');
  const right = rightStats.slice(0, 5).map((line, i) => `<text x="620" y="${232 + i * 54}" font-family="Arial, sans-serif" font-size="30" fill="rgba(255,255,255,0.92)">${esc(line).slice(0, 34)}</text>`).join('');
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="30%" r="70%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.34)" />
        <stop offset="100%" stop-color="rgba(255,255,255,0)" />
      </radialGradient>
    </defs>
    <rect width="1200" height="630" fill="#070b18" />
    <rect x="18" y="18" width="1164" height="594" rx="38" fill="url(#bg)" />
    <rect x="42" y="42" width="1116" height="546" rx="30" fill="rgba(6,10,24,0.24)" stroke="rgba(255,255,255,0.18)"/>
    <rect x="82" y="98" width="430" height="430" rx="32" fill="rgba(255,255,255,0.12)"/>
    <circle cx="1000" cy="122" r="160" fill="url(#glow)" />
    <circle cx="965" cy="496" r="220" fill="rgba(255,255,255,0.08)" />
    <text x="298" y="342" text-anchor="middle" font-size="212">${emoji}</text>
    <rect x="570" y="96" width="182" height="48" rx="24" fill="rgba(255,255,255,0.16)" />
    <text x="661" y="128" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#fff">${safeAccent}</text>
    <text x="570" y="212" font-family="Arial, sans-serif" font-size="64" font-weight="700" fill="#fff">${safeTitle}</text>
    <text x="570" y="264" font-family="Arial, sans-serif" font-size="28" fill="rgba(255,255,255,0.92)">${safeSubtitle}</text>
    ${left}
    ${right}
    <text x="84" y="602" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.88)">Cosmic Corner • Dashboard</text>
  </svg>`;
}

function makeSvgAttachment(name, svgText) {
  return new AttachmentBuilder(Buffer.from(svgText), { name });
}

function petArtAttachment(pet) {
  return makeSvgAttachment(
    `pet-${Date.now()}.svg`,
    buildCardSvg({
      title: pet.name || pet.species || 'Unknown Pet',
      subtitle: `${pet.species || 'Pet'} • Lv ${pet.level || 1}`,
      emoji: pet.emoji || '🐾',
      theme: pet.rarity || 'Common',
      badge: pet.rarity || 'Common',
      accent: `EXP ${pet.exp || 0} • Companion Ready`,
    })
  );
}

function itemArtAttachment(item) {
  return makeSvgAttachment(
    `item-${item.key || 'card'}-${Date.now()}.svg`,
    buildCardSvg({
      title: item.name || 'Item',
      subtitle: item.description || 'Loot & utility item',
      emoji: item.emoji || '🎁',
      theme: 'Item',
      badge: `${item.price || 0} Coin`,
      accent: `Beli dengan cc buy ${item.key || 'item'}`,
    })
  );
}

function casinoArtAttachment(gameTitle, resultLine, { win = false, emoji = '🎰', badge } = {}) {
  return makeSvgAttachment(
    `casino-${Date.now()}.svg`,
    buildCardSvg({
      title: gameTitle,
      subtitle: resultLine,
      emoji,
      theme: win ? 'Gold' : 'Danger',
      badge: badge || (win ? 'MENANG' : 'KALAH'),
      accent: 'Cosmic Corner • Casino Table',
    })
  );
}

function adminArtAttachment() {
  return makeSvgAttachment(
    `admin-${Date.now()}.svg`,
    buildCardSvg({
      title: 'Admin Panel',
      subtitle: 'Broadcast • Economy • Controls',
      emoji: '🛡️',
      theme: 'Admin',
      badge: 'STAFF',
      accent: 'Kelola server dan cash player',
    })
  );
}

function dashboardArtAttachment(user) {
  const mainPet = user.pets?.[typeof user.equippedPet === 'number' ? user.equippedPet : 0];
  const emoji = mainPet?.emoji || '⚡';
  return makeSvgAttachment(
    `dashboard-${user.userId}-${Date.now()}.svg`,
    buildDashboardSvg({
      title: 'PLAYER HUB',
      subtitle: `Level ${user.level || 1} • ${user.coin || 0} Coin • ${(user.achievements || []).length} Achievements`,
      emoji,
      accent: 'ULTRA PANEL',
      theme: mainPet?.rarity === 'Legendary' || mainPet?.rarity === 'Mythic' ? 'Gold' : 'Neon',
      leftStats: [
        `Lv ${user.level || 1}`,
        `${user.coin || 0} coin`,
        `${(user.inventory || []).length} items`,
        `${(user.pets || []).length} pets`,
      ],
      rightStats: [
        `EXP ${user.exp || 0}`,
        `Win ${(user.wins || 0)} / Lose ${(user.losses || 0)}`,
        `Hunt ${user.stats?.huntCount || 0}`,
        `Quest ${user.stats?.questCount || 0}`,
        `Boss ${user.stats?.bossWins || 0}`,
      ],
    })
  );
}

function helpArtAttachment(category = 'home') {
  const map = {
    home: ['HELP CENTER', 'Panel interaktif semua command', '❔', 'Neon', 'GUIDE'],
    main: ['MAIN COMMANDS', 'Profile • daily • economy • rank', '🎮', 'Neon', 'MAIN'],
    game: ['GAME COMMANDS', 'Hunt • dungeon • boss • duel', '⚔️', 'Gold', 'GAME'],
    pet: ['PET SYSTEM', 'Catch • equip • battle • progress', '🐾', 'Emerald', 'PETS'],
    music: ['MUSIC CONTROL', 'Play • queue • loop • volume', '🎵', 'Neon', 'MUSIC'],
    admin: ['ADMIN PANEL', 'Broadcast • cash • controls', '🛡️', 'Admin', 'ADMIN'],
    tips: ['PRO TIPS', 'Combo farming, build, shortcut', '💡', 'Gold', 'TIPS'],
    start: ['ONBOARDING', 'Checklist cepat buat mulai main', '🚀', 'Neon', 'START'],
  };
  const current = map[category] || map.home;
  return makeSvgAttachment(
    `help-${category}-${Date.now()}.svg`,
    buildCardSvg({
      title: current[0],
      subtitle: current[1],
      emoji: current[2],
      theme: current[3],
      badge: current[4],
      accent: 'Cosmic Corner Hyper Guide',
    })
  );
}

function achievementArtAttachment(user, title = 'ACHIEVEMENTS') {
  return makeSvgAttachment(
    `achievements-${user.userId}-${Date.now()}.svg`,
    buildDashboardSvg({
      title,
      subtitle: `${(user.achievements || []).length} unlocked • Level ${user.level || 1}`,
      emoji: '🏆',
      accent: 'REWARD TRACKER',
      theme: 'Gold',
      leftStats: [
        `Unlock ${(user.achievements || []).length}`,
        `Daily ${user.stats?.dailyClaims || 0}`,
        `Hunt ${user.stats?.huntCount || 0}`,
        `Fish ${user.stats?.fishingCount || 0}`,
      ],
      rightStats: [
        `Quest ${user.stats?.questCount || 0}`,
        `Dungeon ${user.stats?.dungeonWins || 0}`,
        `Boss ${user.stats?.bossWins || 0}`,
        `PVP ${user.stats?.pvpWins || 0}`,
        `Pets ${(user.pets || []).length}`,
      ],
    })
  );
}



function startArtAttachment(user, checklist = { doneCount: 0, total: 0 }) {
  const mainPet = user.pets?.[typeof user.equippedPet === 'number' ? user.equippedPet : 0];
  return makeSvgAttachment(
    `start-${user.userId}-${Date.now()}.svg`,
    buildDashboardSvg({
      title: 'STARTER NEXUS',
      subtitle: `Checklist ${checklist.doneCount || 0}/${checklist.total || 0} • Level ${user.level || 1} • ${(user.achievements || []).length} achievements`,
      emoji: mainPet?.emoji || '🚀',
      accent: 'PLAYER BOOT',
      theme: mainPet?.rarity === 'Legendary' || mainPet?.rarity === 'Mythic' ? 'Gold' : 'Neon',
      leftStats: [
        `Coin ${user.coin || 0}`,
        `EXP ${user.exp || 0}`,
        `Pets ${(user.pets || []).length}`,
        `Items ${(user.inventory || []).length}`,
      ],
      rightStats: [
        `Daily ${user.stats?.dailyClaims || 0}`,
        `Hunt ${user.stats?.huntCount || 0}`,
        `Fish ${user.stats?.fishingCount || 0}`,
        `Quest ${user.stats?.questCount || 0}`,
        `Boss ${user.stats?.bossWins || 0}`,
      ],
    })
  );
}


function commandCenterArtAttachment(user, mode = 'home') {
  const mainPet = user.pets?.[typeof user.equippedPet === 'number' ? user.equippedPet : 0];
  const modeMap = {
    home: ['COMMAND CENTER', 'Dashboard nexus buat semua menu utama', '🌌', 'Neon', 'CENTER'],
    activity: ['ACTIVITY TRACKER', 'Pantau playstyle, stat, dan intensitas grind', '📊', 'Emerald', 'TRACKER'],
    quests: ['QUEST BOARD', 'Mission board progres akunmu', '📜', 'Gold', 'QUESTS'],
    route: ['FAST ROUTE', 'Jalur farming tercepat & scaling plan', '🧭', 'Neon', 'ROUTE'],
    elite: ['ELITE TIPS', 'Meta note buat build lebih sadis', '💎', 'Admin', 'ELITE'],
  };
  const current = modeMap[mode] || modeMap.home;
  return makeSvgAttachment(
    `command-center-${user.userId}-${mode}-${Date.now()}.svg`,
    buildDashboardSvg({
      title: current[0],
      subtitle: `${current[1]} • Lv ${user.level || 1} • ${user.coin || 0} Coin`,
      emoji: mainPet?.emoji || current[2],
      accent: current[4],
      theme: mainPet?.rarity === 'Legendary' || mainPet?.rarity === 'Mythic'
        ? 'Gold'
        : current[3],
      leftStats: [
        `Lv ${user.level || 1}`,
        `${user.coin || 0} coin`,
        `${(user.achievements || []).length} achievements`,
        `${(user.pets || []).length} pets`,
      ],
      rightStats: [
        `EXP ${user.exp || 0}`,
        `Daily ${user.stats?.dailyClaims || 0}`,
        `Hunt ${user.stats?.huntCount || 0}`,
        `Quest ${user.stats?.questCount || 0}`,
        `Boss ${user.stats?.bossWins || 0}`,
      ],
    })
  );
}

const { fetchImageAsDataUri } = require('./imageFetch');
function buildWelcomeSvg({
  username,
  guildName = 'Cosmic Corner',
  memberCount = 1,
  theme = 'Neon',
  backgroundImageDataUri = null,
  iconImageDataUri = null,
  centerImageDataUri = null,
  fallbackEmoji = '🚀',
}) {
  const [c1, c2] = rarityThemes[theme] || rarityThemes.Neon;
  const safeUsername = esc(username).slice(0, 28);
  const safeGuildName = esc(guildName).slice(0, 40);
  const ordinal = `Member ke-${memberCount}`;

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="500" viewBox="0 0 1200 500">
    <defs>
      <linearGradient id="wbg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>
      <linearGradient id="woverlay" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(5,8,20,0.30)" />
        <stop offset="55%" stop-color="rgba(5,8,20,0.55)" />
        <stop offset="100%" stop-color="rgba(5,8,20,0.88)" />
      </linearGradient>
      <clipPath id="wcardClip"><rect x="46" y="46" width="1108" height="408" rx="24" /></clipPath>
      <clipPath id="wiconClip"><circle cx="150" cy="150" r="52" /></clipPath>
      <clipPath id="wcenterClip"><circle cx="600" cy="150" r="66" /></clipPath>
    </defs>
    <rect width="1200" height="500" fill="#0b1020" />
    <rect x="16" y="16" width="1168" height="468" rx="30" fill="url(#wbg)" />
    <circle cx="1060" cy="90" r="150" fill="rgba(255,255,255,0.10)"/>
    <circle cx="120" cy="430" r="170" fill="rgba(255,255,255,0.08)"/>
    <circle cx="220" cy="80" r="4" fill="rgba(255,255,255,0.7)"/>
    <circle cx="340" cy="130" r="3" fill="rgba(255,255,255,0.5)"/>
    <circle cx="980" cy="380" r="3" fill="rgba(255,255,255,0.6)"/>
    <circle cx="900" cy="60" r="2.5" fill="rgba(255,255,255,0.5)"/>
    ${backgroundImageDataUri
      ? `<image href="${backgroundImageDataUri}" x="46" y="46" width="1108" height="408" preserveAspectRatio="xMidYMid slice" clip-path="url(#wcardClip)" />
         <rect x="46" y="46" width="1108" height="408" rx="24" fill="url(#woverlay)" />`
      : `<rect x="46" y="46" width="1108" height="408" rx="24" fill="rgba(10,14,30,0.22)" stroke="rgba(255,255,255,0.16)" />`
    }
    ${centerImageDataUri
      ? `<circle cx="600" cy="150" r="70" fill="rgba(255,255,255,0.14)" /><image href="${centerImageDataUri}" x="530" y="80" width="140" height="140" clip-path="url(#wcenterClip)" />`
      : `<text x="600" y="180" text-anchor="middle" font-size="90">${esc(fallbackEmoji)}</text>`
    }
    ${iconImageDataUri
      ? `<circle cx="150" cy="150" r="56" fill="rgba(255,255,255,0.16)" />
         <image href="${iconImageDataUri}" x="98" y="98" width="104" height="104" clip-path="url(#wiconClip)" />
         <circle cx="150" cy="150" r="52" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="3" />`
      : ''
    }
    <text x="600" y="250" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="700" fill="#fff">Selamat Datang!</text>
    <text x="600" y="305" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="600" fill="#fff">${safeUsername}</text>
    <text x="600" y="345" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.85)">telah bergabung ke ${safeGuildName}</text>
    <rect x="470" y="375" width="260" height="52" rx="26" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.25)" />
    <text x="600" y="409" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#fff">✨ ${esc(ordinal)}</text>
  </svg>`;
}

async function welcomeArtAttachment(member, memberCount, customWelcomeEmote = null) {
  const guild = member.guild;
  const bannerUrl = guild?.bannerURL?.({ extension: 'png', size: 1024 }) || null;
  const iconUrl = guild?.iconURL?.({ extension: 'png', size: 256 }) || null;

  const { emojiImageUrl } = require('./emotes');
  const customEmoteImageUrl = emojiImageUrl(customWelcomeEmote);

  const [backgroundImageDataUri, iconImageDataUri, centerImageDataUri] = await Promise.all([
    fetchImageAsDataUri(bannerUrl),
    fetchImageAsDataUri(iconUrl),
    customEmoteImageUrl ? fetchImageAsDataUri(customEmoteImageUrl) : Promise.resolve(null),
  ]);

  return makeSvgAttachment(
    `welcome-${member.id}-${Date.now()}.svg`,
    buildWelcomeSvg({
      username: member.displayName || member.user?.username || 'Member Baru',
      guildName: guild?.name,
      memberCount,
      theme: 'Neon',
      backgroundImageDataUri,
      iconImageDataUri,
      centerImageDataUri,
      fallbackEmoji: (!customEmoteImageUrl && customWelcomeEmote) ? customWelcomeEmote : '🚀',
    })
  );
}

function attachmentImageUrl(file) {
  return file?.name ? `attachment://${file.name}` : undefined;
}

module.exports = {
  petArtAttachment,
  itemArtAttachment,
  casinoArtAttachment,
  adminArtAttachment,
  dashboardArtAttachment,
  helpArtAttachment,
  achievementArtAttachment,
  startArtAttachment,
  commandCenterArtAttachment,
  welcomeArtAttachment,
  attachmentImageUrl,
};
