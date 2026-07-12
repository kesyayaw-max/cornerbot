# Cara Ganti Logo / Icon Website

Icon tab browser (favicon) sekarang ada di:

```
public/assets/favicon.svg
```

File ini juga dipakai sebagai logo kecil di pojok kiri atas tiap halaman (`<img src="/assets/favicon.svg">`
di dalam `.brand` pada tiap file `.html`).

## Cara ganti pakai logo sendiri

**Opsi A — paling gampang (logo PNG/JPG):**
1. Siapkan gambar logo kamu, idealnya persegi (misal 256x256px), format PNG.
2. Upload/taruh file itu di folder `public/assets/`, kasih nama misalnya `logo.png`.
3. Di **setiap** file `.html` (`index.html`, `voice.html`, `coin.html`, `level.html`, `pets.html`), cari baris:
   ```html
   <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg" />
   ```
   ganti jadi:
   ```html
   <link rel="icon" type="image/png" href="/assets/logo.png" />
   ```
   Terus cari juga baris:
   ```html
   <img src="/assets/favicon.svg" alt="logo"/>
   ```
   ganti jadi:
   ```html
   <img src="/assets/logo.png" alt="logo"/>
   ```

**Opsi B — logo vektor (SVG) sendiri:**
Cukup timpa langsung isi file `public/assets/favicon.svg` dengan SVG logo kamu (nama file tetap sama),
nggak perlu ubah apa-apa lagi di HTML.

Setelah ganti file, restart bot/deploy ulang biar filenya ke-load ulang di server (Railway/Render biasanya
otomatis redeploy begitu ada file baru di-push).
