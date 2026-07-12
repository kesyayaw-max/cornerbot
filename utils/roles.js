// Konfigurasi tingkatan role buat halaman "Struktur Tim" di website.
// Urutan array = urutan tampil di web (paling atas = paling tinggi).
// Setiap tier ambil Role ID Discord ASLI dari server kamu lewat env var di bawah.
// Kalau 1 tier punya lebih dari 1 role (misal "Founder" & "Owner" dianggap sama),
// isi env var-nya dipisah koma, contoh: ROLE_FOUNDER_ID=123456,789012
//
// Cara ambil Role ID: aktifkan Developer Mode di Discord (Settings > Advanced),
// lalu klik kanan role di Server Settings > Roles > Copy Role ID.

const ROLE_TIERS = [
  {
    key: 'founder',
    label: 'Founder',
    icon: '👑',
    color: '#facc15',
    envVar: 'ROLE_FOUNDER_ID',
  },
  {
    key: 'cofounder',
    label: 'Co-Founder',
    icon: '💫',
    color: '#f472b6',
    envVar: 'ROLE_COFOUNDER_ID',
  },
  {
    key: 'admin',
    label: 'Admin',
    icon: '🛡️',
    color: '#ef4444',
    envVar: 'ROLE_ADMIN_ID',
  },
  {
    key: 'moderator',
    label: 'Moderator',
    icon: '🔧',
    color: '#22d3ee',
    envVar: 'ROLE_MODERATOR_ID',
  },
  {
    key: 'helper',
    label: 'Helper',
    icon: '🌱',
    color: '#4ade80',
    envVar: 'ROLE_HELPER_ID',
  },
];

function roleIdsFor(tier) {
  return String(process.env[tier.envVar] || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

module.exports = { ROLE_TIERS, roleIdsFor };
