const Event = require('../models/Event');
const { ensureAdmin } = require('../utils/admin');
const { createGameEmbed, createLinkButton, COLORS } = require('../utils/theme');

const SITE_URL = process.env.SITE_URL || 'https://cosmiccorner.up.railway.app';

function parseEventDate(raw) {
  // Terima format "YYYY-MM-DD HH:mm", SELALU dianggap WIB (UTC+7)
  // — apapun timezone server hosting-nya (Railway dkk biasanya UTC).
  const cleaned = String(raw || '').trim();
  const match = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, y, mo, da, h, mi] = match;
  const isoWithOffset = `${y}-${mo}-${da}T${h}:${mi}:00+07:00`;
  const d = new Date(isoWithOffset);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function usageEmbed() {
  return createGameEmbed({
    title: '📅 Event Manager',
    description:
      'Kelola event Cosmic Corner yang bakal tampil di website.\n\n' +
      '**Tambah event:**\n`event add <judul> | <YYYY-MM-DD HH:mm> | <deskripsi> | <link gambar (opsional)>`\n' +
      'Contoh:\n`event add Movie Night | 2026-07-20 20:00 | Nonton bareng + quiz berhadiah coin! | https://contoh.com/banner.png`\n\n' +
      '**Lihat semua event:**\n`event list`\n\n' +
      '**Hapus event:**\n`event remove <id>` (id bisa dilihat dari `event list`)',
    color: COLORS.warning,
    footer: 'Cosmic Corner Bot • Event Manager',
  });
}

module.exports = {
  name: 'event',
  description: 'Kelola event Cosmic Corner (admin only)',
  async execute(msg, args = []) {
    if (!(await ensureAdmin(msg))) return;

    const sub = String(args[0] || '').toLowerCase();

    if (sub === 'add') {
      const raw = args.slice(1).join(' ');
      const parts = raw.split('|').map((p) => p.trim());
      const [title, dateRaw, description, image] = parts;

      if (!title || !dateRaw || !description) {
        return msg.reply({ embeds: [usageEmbed()] });
      }

      const date = parseEventDate(dateRaw);
      if (!date) {
        return msg.reply({
          embeds: [createGameEmbed({
            title: '⚠️ Format Tanggal Salah',
            description: 'Pakai format `YYYY-MM-DD HH:mm`, contoh: `2026-07-20 20:00`.',
            color: COLORS.danger,
            footer: 'Cosmic Corner Bot • Event Manager',
          })],
        });
      }

      const event = await Event.create({
        title,
        description,
        date,
        image: image || '',
        createdBy: msg.author.id,
        createdByName: msg.member?.displayName || msg.author.username,
      });

      // Konfirmasi ke admin
      await msg.reply({
        embeds: [createGameEmbed({
          title: '✅ Event Berhasil Ditambahkan',
          description: `Event **${title}** udah masuk dan bakal tampil di website.`,
          color: COLORS.success,
          fields: [
            { name: '🆔 Event ID', value: `\`${event._id}\``, inline: false },
            { name: '🗓️ Waktu', value: `<t:${Math.floor(date.getTime() / 1000)}:F>`, inline: false },
          ],
          footer: 'Cosmic Corner Bot • Event Manager',
        })],
      });

      // Pengumuman publik di channel yang sama
      return msg.channel.send({
        embeds: [createGameEmbed({
          title: `📅 Event Baru: ${title}`,
          description,
          color: COLORS.primary,
          image: image || undefined,
          fields: [
            { name: '🗓️ Waktu', value: `<t:${Math.floor(date.getTime() / 1000)}:F> (<t:${Math.floor(date.getTime() / 1000)}:R>)`, inline: false },
            { name: '📌 Info Lengkap', value: 'Klik tombol di bawah buat liat detail event di website Cosmic Corner!', inline: false },
          ],
          footer: `Diumumkan oleh ${msg.member?.displayName || msg.author.username}`,
        })],
        components: createLinkButton(`${SITE_URL}/events`, 'Lihat di Web', '🌐'),
      });
    }

    if (sub === 'list') {
      const events = await Event.find({}).sort({ date: 1 }).lean();
      if (!events.length) {
        return msg.reply({
          embeds: [createGameEmbed({
            title: '📅 Daftar Event',
            description: 'Belum ada event yang dibuat.',
            color: COLORS.dark,
            footer: 'Cosmic Corner Bot • Event Manager',
          })],
        });
      }

      const fields = events.slice(0, 15).map((e) => ({
        name: `${e.title} • \`${e._id}\``,
        value: `<t:${Math.floor(new Date(e.date).getTime() / 1000)}:f>`,
        inline: false,
      }));

      return msg.reply({
        embeds: [createGameEmbed({
          title: '📅 Daftar Event',
          description: `Total ${events.length} event tercatat.`,
          color: COLORS.primary,
          fields,
          footer: 'Cosmic Corner Bot • Event Manager',
        })],
      });
    }

    if (sub === 'remove' || sub === 'delete') {
      const id = args[1];
      if (!id) {
        return msg.reply({
          embeds: [createGameEmbed({
            title: '⚠️ ID Event Kosong',
            description: 'Format: `event remove <id>`. Lihat ID lewat `event list`.',
            color: COLORS.danger,
            footer: 'Cosmic Corner Bot • Event Manager',
          })],
        });
      }

      const deleted = await Event.findByIdAndDelete(id).catch(() => null);
      if (!deleted) {
        return msg.reply({
          embeds: [createGameEmbed({
            title: '❌ Event Tidak Ditemukan',
            description: `Event dengan ID \`${id}\` gak ketemu.`,
            color: COLORS.danger,
            footer: 'Cosmic Corner Bot • Event Manager',
          })],
        });
      }

      return msg.reply({
        embeds: [createGameEmbed({
          title: '🗑️ Event Dihapus',
          description: `Event **${deleted.title}** berhasil dihapus.`,
          color: COLORS.success,
          footer: 'Cosmic Corner Bot • Event Manager',
        })],
      });
    }

    return msg.reply({ embeds: [usageEmbed()] });
  },
};
