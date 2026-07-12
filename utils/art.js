
const { AttachmentBuilder } = require('discord.js');
const { Resvg } = require('@resvg/resvg-js');

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
  const pngName = name.replace(/\.svg$/i, '.png');
  try {
    const resvg = new Resvg(svgText);
    const pngBuffer = resvg.render().asPng();
    return new AttachmentBuilder(pngBuffer, { name: pngName });
  } catch (err) {
    // Fallback so a rasterization hiccup never crashes the command outright.
    console.error('SVG->PNG render error:', err);
    return new AttachmentBuilder(Buffer.from(svgText), { name });
  }
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

const { fetchImageAsDataUri, fileToDataUri } = require('./imageFetch');
function buildWelcomeSvg({
  username,
  memberCount = 1,
  backgroundImageDataUri = null,
  avatarImageDataUri = null,
  fallbackEmoji = '🚀',
}) {
  const safeUsername = esc(username).slice(0, 26).toUpperCase();
  const ordinal = `Member ke-${memberCount}`;

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="500" viewBox="0 0 1200 500">
    <defs>
      <linearGradient id="wfallback" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1e1b4b" />
        <stop offset="100%" stop-color="#4c1d95" />
      </linearGradient>
      <linearGradient id="wbottomFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(5,8,20,0)" />
        <stop offset="55%" stop-color="rgba(5,8,20,0.45)" />
        <stop offset="100%" stop-color="rgba(5,8,20,0.92)" />
      </linearGradient>
      <clipPath id="wcardClip"><rect x="0" y="0" width="1200" height="500" rx="26" /></clipPath>
      <clipPath id="wavatarClip"><circle cx="600" cy="196" r="92" /></clipPath>
    </defs>
    <rect width="1200" height="500" rx="26" fill="#0b1020" />
    <g clip-path="url(#wcardClip)">
      ${backgroundImageDataUri
        ? `<image href="${backgroundImageDataUri}" x="0" y="0" width="1200" height="500" preserveAspectRatio="xMidYMid slice" />`
        : `<rect width="1200" height="500" fill="url(#wfallback)" />`
      }
      <rect width="1200" height="500" fill="url(#wbottomFade)" />
    </g>
    <rect x="0" y="0" width="1200" height="500" rx="26" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="2" />

    <circle cx="600" cy="196" r="98" fill="rgba(10,10,20,0.4)" />
    ${avatarImageDataUri
      ? `<image href="${avatarImageDataUri}" x="508" y="104" width="184" height="184" clip-path="url(#wavatarClip)" />`
      : `<circle cx="600" cy="196" r="92" fill="rgba(255,255,255,0.12)" /><text x="600" y="222" text-anchor="middle" font-size="90">${esc(fallbackEmoji)}</text>`
    }
    <circle cx="600" cy="196" r="92" fill="none" stroke="#ffffff" stroke-width="5" />

    <text x="600" y="352" text-anchor="middle" font-family="Arial, sans-serif" font-size="66" font-weight="800" fill="#ffffff" style="paint-order: stroke; stroke: #4c1d95; stroke-width: 3px;">WELCOME</text>
    <text x="600" y="398" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff">${safeUsername}</text>
    <text x="600" y="434" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="600" letter-spacing="4" fill="rgba(255,255,255,0.85)">HOPE YOU ENJOY</text>

    <rect x="450" y="458" width="300" height="30" rx="15" fill="rgba(255,255,255,0.10)" />
    <text x="600" y="479" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.85)">✨ ${esc(ordinal)}</text>
  </svg>`;
}

async function welcomeArtAttachment(member, memberCount) {
  const avatarUrl = member.displayAvatarURL?.({ extension: 'png', size: 256 }) || member.user?.displayAvatarURL?.({ extension: 'png', size: 256 }) || null;
  const path = require('path');
  const backgroundPath = path.join(__dirname, '..', 'public', 'assets', 'welcome-bg.png');

  const [backgroundImageDataUri, avatarImageDataUri] = await Promise.all([
    Promise.resolve(fileToDataUri(backgroundPath)),
    fetchImageAsDataUri(avatarUrl),
  ]);

  return makeSvgAttachment(
    `welcome-${member.id}-${Date.now()}.svg`,
    buildWelcomeSvg({
      username: member.displayName || member.user?.username || 'Member Baru',
      memberCount,
      backgroundImageDataUri,
      avatarImageDataUri,
      fallbackEmoji: '🚀',
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
