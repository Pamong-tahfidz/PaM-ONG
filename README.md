# PaM-ONG — Misi 1: Operasi Senja

Game web run-and-gun bergaya Metal Slug yang **bisa dimainkan sampai selesai satu misi penuh**, ditulis dengan vanilla HTML5 Canvas 2D + JavaScript murni.

**Tanpa library, tanpa framework, tanpa satu pun aset gambar/audio eksternal.** Semua sprite digambar prosedural dari peta piksel di `sprites.js` dan dirender sekali ke offscreen canvas saat loading; semua suara disintesis WebAudio di `audio.js`. Karakter "Pamong" adalah prajurit pixel-art **original** (bandana merah, rompi hijau) — bukan salinan sprite SNK.

## Cara menjalankan

Buka `index.html` langsung di browser, atau sajikan lewat server statis apa pun:

```
cd pam-ong
python3 -m http.server 8080
# buka http://localhost:8080
```

Di HP: mainkan dalam posisi landscape. Kontrol sentuh muncul otomatis di perangkat sentuh.

## Kontrol

| Aksi | Keyboard | Sentuh |
|---|---|---|
| Gerak / aim | Panah ← → ↑ ↓ | D-pad kiri |
| A — Tembak (tahan = auto-fire) | Z / J | Tombol A (kanan, besar) |
| B — Lompat | X / K | Tombol B |
| C — Granat | C / L | Tombol C |
| Mulai / main lagi | Enter / Spasi | Tombol di layar |
| Bisu | M | Tombol 🔊 pojok kanan atas |

Aim: ↑ = tembak ke atas, ↑+arah = diagonal (khusus Heavy Machine Gun; senjata lain menembak lurus, sesuai perilaku seri awal Metal Slug). ↓ = jongkok. Pisau menyerang **otomatis** menggantikan tembakan bila musuh sangat dekat.

## Fitur yang SUDAH berfungsi

- **Satu misi utuh**: level ±2600px → arena mini-boss tank **Di-Cokka** (HP 60, meriam parabola) → ledakan besar → teks "Mission Complete!" → layar ringkasan (skor, bonus POW 5000/POW, waktu, MAIN LAGI). Game over juga berfungsi saat nyawa habis.
- **Pemain**: lari/lompat/jongkok/aim 3 arah, granat parabolik (10 di awal misi; seusai respawn granat terisi minimal 3), pisau otomatis jarak dekat, mati satu pukulan, 3 nyawa, respawn di tempat + kebal berkedip 2 detik. Skor & POW tersimpan antar-nyawa.
- **4 senjata persis data riset**: Handgun ∞; Heavy Machine Gun 200 peluru (rate tinggi, bisa diagonal); Rocket Launcher 30 (homing ringan, ledakan area, damage 3); Shotgun 30 (5 peluru menyebar, jangkauan pendek). Amunisi habis → kembali ke Handgun.
- **3 musuh ber-FSM** (idle → alert → attack): Prajurit Rebel (100 poin), Shield Soldier (perisai menahan tembakan depan, hancur setelah 4 hit lalu kabur; 300 poin), Grenade Soldier di platform (granat melengkung; 300 poin).
- **POW** (3 orang): bebaskan dengan tembakan/sentuhan → sentuh lagi → hadiah acak (senjata / granat +5 / 1000 poin) + "Thank You!".
- **Peti kayu** bisa dihancurkan, menjatuhkan pickup senjata/granat.
- **HUD** di canvas terpisah yang hanya digambar ulang saat nilai berubah: SKOR, nyawa, senjata + ARMS, BOMB, timer 99 detik (habis = mati), jumlah POW.
- **Teks announcer**: "Mission Start!", "Heavy Machine Gun!", "Rocket Launcher!", "Shotgun!", "OK!", "Thank You!", "Mission Complete!".
- **Audio sintesis WebAudio**: tembakan tiap senjata, ledakan, clank perisai, pickup, mati, + loop musik chiptune (bass/melodi/noise perkusi). Mulai hanya setelah gestur pengguna; ada tombol mute.
- **Performa untuk HP kelas bawah**: resolusi internal 320×224 di-upscale integer + `image-rendering: pixelated`; fixed timestep 60Hz (maks 3 langkah tangkap) dengan **fallback otomatis ke 30 fps** bila frame terus lambat; object pooling untuk peluru/granat/partikel (maks 150 partikel); tabrakan AABB saja; musuh hanya aktif dekat viewport; tidak ada `shadowBlur`/gradien per frame.

## Struktur berkas

| Berkas | Isi |
|---|---|
| `index.html` | Kerangka halaman, layar judul/ringkasan, kontrol sentuh |
| `style.css` | Tata letak letterbox, overlay, tombol sentuh ≥56px |
| `sprites.js` | Peta piksel semua sprite + latar parallax, dirender sekali ke offscreen canvas |
| `audio.js` | Sintesis SFX + musik chiptune WebAudio |
| `game.js` | CONFIG tuning, state, FSM musuh, fisika, loop, render, HUD |

Semua konstanta tuning (HP boss, bonus POW, kecepatan, ukuran pool, dll.) terkumpul di objek `CONFIG` di atas `game.js`.

## Pengujian yang sudah dilakukan

- `node --check` lolos untuk `sprites.js`, `audio.js`, `game.js`.
- Uji asap Node (stub DOM): boot game, 120 langkah gerak+tembak, ledakan, ganti senjata.
- Uji alur: boss aktif → mati → layar "clear"; kematian beruntun → "over"; POW bebas → hadiah tercatat; peti hancur → pickup HMG memberi 200 amunisi.

## Yang BELUM ada (roadmap jujur)

- **SV-001 (tank yang bisa dinaiki)** — belum; baru direncanakan setelah Misi 1 stabil.
- **Misi 2+**, rute bercabang ala MS3, dan variasi latar lain.
- Musuh tambahan: Bazooka Soldier, Mortar, Minelayer, kendaraan musuh (Di-Cokka berjalan, Girida-O).
- Suara announcer manusia — saat ini announcer hanya teks; SFX seluruhnya sintesis.
- Animasi pemain masih minimal (lari 4 frame; idle masih 1 frame statis — variasi frame idle kedua belum dibuat). Belum ada animasi reload; pose lempar granat memakai frame tembak-ke-atas.
- Angka damage hasil riset bersifat kualitatif (wiki tidak memuat angka); tuning sekarang: pistol/HMG 1, roket & granat 3, pisau 3 — perlu playtest rasa di HP sungguhan.
- Belum ada penyimpanan skor tertinggi (localStorage) dan belum ada PWA/offline.
- Belum diuji di perangkat fisik — target uji: HP Android kelas bawah (Chrome, Android 9).

## Aturan proyek

Setiap kesalahan yang ditemukan selama pengembangan **wajib** dicatat di [`docs/KOREKSI.md`](docs/KOREKSI.md) — tanggal, kesalahan, penyebab, perbaikan, dan pelajaran untuk agen lain — agar tidak terulang.
