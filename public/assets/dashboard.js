/* Shared logic for every leaderboard page (voice/coin/level/pets).
   Each page just calls initLeaderboardPage('voice' | 'coin' | 'level' | 'pets'). */

const REFRESH_MS = 15000;

function escapeHtml(str){
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function hashCode(str){
  let hash = 0;
  for (let i = 0; i < str.length; i++){ hash = (hash << 5) - hash + str.charCodeAt(i); hash |= 0; }
  return hash;
}

function fallbackAvatar(name){
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  const colors = ['#7c3aed','#22d3ee','#f472b6','#facc15','#4ade80'];
  const color = colors[Math.abs(hashCode(name||'x')) % colors.length];
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="${color}" rx="40"/><text x="50%" y="54%" font-family="Arial" font-size="34" fill="white" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`
  )}`;
}

function avatarSrc(entry){ return entry.avatar || fallbackAvatar(entry.name); }

function formatUpdatedAt(iso){
  if (!iso) return '-';
  try { const d = new Date(iso); return `Update terakhir: ${d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}`; }
  catch { return '-'; }
}

function num(n){ return (n||0).toLocaleString('id-ID'); }

const FIELD_SETS = {
  coin: {
    insights: (ins) => ([
      { label: '💰 Coin Terbanyak', value: num(ins.topCoin) },
      { label: '👥 Total Pemain', value: num(ins.totalPlayers) },
      { label: '🏆 Ranking Tercatat', value: '10 Teratas' },
    ]),
    podiumMain: (e) => num(e.coin) + ' coin',
    podiumSub: (e) => `Level ${e.level}`,
    rowMain: (e) => num(e.coin) + ' coin',
    rowSub: (e) => `Lv ${e.level}`,
  },
  level: {
    insights: (ins) => ([
      { label: '⭐ Level Tertinggi', value: num(ins.topLevel) },
      { label: '✨ XP Tertinggi', value: num(ins.topExp) },
      { label: '🏆 Ranking Tercatat', value: '10 Teratas' },
    ]),
    podiumMain: (e) => `Level ${e.level}`,
    podiumSub: (e) => `${num(e.exp)} XP • ${num(e.wins)} menang`,
    rowMain: (e) => `Level ${e.level}`,
    rowSub: (e) => `${num(e.exp)} XP`,
  },
  pets: {
    insights: (ins) => ([
      { label: '🐾 Pet Terbanyak', value: num(ins.topPetCount) },
      { label: '🧑‍🌾 Total Trainer', value: num(ins.totalTrainers) },
      { label: '🏆 Ranking Tercatat', value: '10 Teratas' },
    ]),
    podiumMain: (e) => `${e.petCount} pet`,
    podiumSub: (e) => `${e.topPetEmoji} ${escapeHtml(e.topPetName)} (${escapeHtml(e.topPetRarity)})`,
    rowMain: (e) => `${e.petCount} pet`,
    rowSub: (e) => `${e.topPetEmoji} Lv${e.topPetLevel}`,
  },
  voice: {
    insights: (ins) => ([
      { label: '⏱️ Waktu Terbanyak', value: escapeHtml(ins.topTime) },
      { label: '✨ XP Tertinggi', value: num(ins.topXp) },
      { label: '💰 Coin Tertinggi', value: num(ins.topCoins) },
    ]),
    podiumMain: (e) => escapeHtml(e.time),
    podiumSub: (e) => `${num(e.xp)} XP • ${num(e.coins)} coin`,
    rowMain: (e) => escapeHtml(e.time),
    rowSub: (e) => `${num(e.xp)} XP`,
  },
};

const EMPTY_STATES = {
  voice: { emoji: '🎧', msg: 'Belum ada aktivitas voice yang tercatat.<br/>Yuk nongkrong dulu di voice channel!' },
  coin: { emoji: '💰', msg: 'Belum ada yang punya coin.<br/>Yuk main game atau kerja buat dapetin coin!' },
  level: { emoji: '⭐', msg: 'Belum ada yang naik level.<br/>Yuk kumpulin XP dulu!' },
  pets: { emoji: '🐾', msg: 'Belum ada yang punya pet.<br/>Coba tangkap pet pertamamu!' },
};

function initLeaderboardPage(category){
  const content = document.getElementById('content');
  const statusText = document.getElementById('statusText');
  const updatedAtEl = document.getElementById('updatedAt');
  const searchInput = document.getElementById('searchInput');

  let fullLeaderboard = [];
  let podium = [];
  let insightsData = {};
  let query = '';

  const fields = FIELD_SETS[category];
  const empty = EMPTY_STATES[category];

  function draw(){
    const insights = fields.insights(insightsData || {});
    const insightsHtml = `
      <div class="insights">
        ${insights.map(i => `<div class="insight-card"><div class="label">${i.label}</div><div class="value">${i.value}</div></div>`).join('')}
      </div>
    `;

    const filtered = query
      ? fullLeaderboard.filter(u => (u.name || '').toLowerCase().includes(query))
      : fullLeaderboard;

    const showPodium = !query && podium.length;
    const rest = query ? filtered : filtered.slice(3);

    const podiumHtml = showPodium ? `
      <div class="podium">
        ${podium.map(p => `
          <div class="podium-card rank-${p.rank}">
            <span class="medal">${p.medal}</span>
            <img class="avatar" src="${avatarSrc(p)}" alt="${escapeHtml(p.name)}" onerror="this.src='${fallbackAvatar(p.name)}'"/>
            <div class="podium-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</div>
            <div class="podium-time">${fields.podiumMain(p)}</div>
            <div class="podium-sub">${fields.podiumSub(p)}</div>
          </div>
        `).join('')}
      </div>
    ` : '';

    const listHtml = rest.length ? `
      <div class="list-section">
        <h2>${query ? '🔎 Hasil Pencarian' : '📋 Peringkat Lainnya'}</h2>
        <div class="list">
          ${rest.map(u => `
            <div class="row">
              <div class="rank-num">#${u.rank}</div>
              <img class="avatar-sm" src="${avatarSrc(u)}" alt="" onerror="this.src='${fallbackAvatar(u.name)}'"/>
              <div class="name" title="${escapeHtml(u.name)}">${escapeHtml(u.name)}</div>
              <div class="time-val">${fields.rowMain(u)}</div>
              <div class="xp-val">${fields.rowSub(u)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    const nothingFound = query && !rest.length;
    const trulyEmpty = !query && !podium.length && !fullLeaderboard.length;

    const emptyHtml = trulyEmpty ? `
      <div class="state-box"><span class="emoji">${empty.emoji}</span>${empty.msg}</div>
    ` : nothingFound ? `
      <div class="state-box"><span class="emoji">🔍</span>Nggak ketemu member dengan nama itu.</div>
    ` : '';

    content.innerHTML = insightsHtml + podiumHtml + listHtml + emptyHtml;
  }

  function renderError(message){
    content.innerHTML = `<div class="state-box"><span class="emoji">⚠️</span>${escapeHtml(message)}</div>`;
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      query = e.target.value.trim().toLowerCase();
      draw();
    });
  }

  async function load(){
    try {
      const res = await fetch('/api/leaderboard/all', { cache: 'no-store' });
      const data = await res.json();

      if (!data.ok) {
        statusText.textContent = '🔴 ' + (data.error || 'Gagal memuat data');
        renderError(data.error || 'Server belum siap. Coba lagi sebentar.');
        return;
      }

      const cat = data.categories?.[category];
      if (!cat) { renderError('Data belum tersedia.'); return; }

      statusText.textContent = '🟢 Live';
      updatedAtEl.textContent = formatUpdatedAt(data.updatedAt);
      fullLeaderboard = cat.leaderboard || [];
      podium = cat.podium || [];
      insightsData = cat.insights || {};
      draw();
    } catch (err) {
      statusText.textContent = '🔴 Gagal terhubung ke server';
      renderError('Tidak bisa menghubungi API. Pastikan bot sedang online.');
    }
  }

  load();
  setInterval(load, REFRESH_MS);
}

/* Home hub page: shows a highlight card per category, linking to its full page. */
function initHomePage(){
  const grid = document.getElementById('hubGrid');
  const statusText = document.getElementById('statusText');
  const updatedAtEl = document.getElementById('updatedAt');

  const CARDS = [
    { key: 'voice', href: '/voice', icon: '🎧', color: '#22d3ee', title: 'Voice Leaderboard', desc: 'Member paling aktif nongkrong di voice channel.',
      highlight: (e) => e ? `${escapeHtml(e.time)} • ${num(e.xp)} XP` : '-' },
    { key: 'coin', href: '/coin', icon: '💰', color: '#facc15', title: 'Coin Leaderboard', desc: 'Member paling kaya di Cosmic Corner.',
      highlight: (e) => e ? `${num(e.coin)} coin • Lv${e.level}` : '-' },
    { key: 'level', href: '/level', icon: '⭐', color: '#7c3aed', title: 'Level Leaderboard', desc: 'Member dengan level & XP tertinggi.',
      highlight: (e) => e ? `Level ${e.level} • ${num(e.exp)} XP` : '-' },
    { key: 'pets', href: '/pets', icon: '🐾', color: '#f472b6', title: 'Pet Collectors', desc: 'Member dengan koleksi pet terbanyak.',
      highlight: (e) => e ? `${e.petCount} pet • ${e.topPetEmoji} ${escapeHtml(e.topPetName)}` : '-' },
  ];

  function renderCards(categories){
    grid.innerHTML = CARDS.map(c => {
      const cat = categories?.[c.key];
      const top = cat?.podium?.[0];
      const highlightHtml = top ? `
        <div class="hub-highlight">
          <img src="${avatarSrc(top)}" alt="" onerror="this.src='${fallbackAvatar(top.name)}'"/>
          <div>
            <div class="hh-name">${escapeHtml(top.name)}</div>
            <div class="hh-val">${c.highlight(top)}</div>
          </div>
        </div>
      ` : `<div class="hub-highlight"><div class="hh-val">Belum ada data</div></div>`;

      return `
        <a class="hub-card" href="${c.href}" style="--card-accent:${c.color}">
          <span class="hub-icon">${c.icon}</span>
          <div class="hub-title">${c.title}</div>
          <div class="hub-desc">${c.desc}</div>
          ${highlightHtml}
          <span class="hub-arrow">Lihat selengkapnya →</span>
        </a>
      `;
    }).join('');
  }

  async function load(){
    try {
      const res = await fetch('/api/leaderboard/all', { cache: 'no-store' });
      const data = await res.json();
      if (!data.ok) {
        statusText.textContent = '🔴 ' + (data.error || 'Gagal memuat data');
        return;
      }
      statusText.textContent = '🟢 Live';
      updatedAtEl.textContent = formatUpdatedAt(data.updatedAt);
      renderCards(data.categories);
    } catch (err) {
      statusText.textContent = '🔴 Gagal terhubung ke server';
    }
  }

  load();
  setInterval(load, REFRESH_MS);
}
