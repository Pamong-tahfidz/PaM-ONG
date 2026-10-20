# PaM-ONG v3 — Misi 1: Operasi Senja

Game web **run-and-gun** terinspirasi *Metal Slug* (SNK) yang bisa dimainkan sampai
selesai satu misi penuh, ditulis dengan vanilla HTML5 Canvas 2D + JavaScript murni.

**Tanpa library, tanpa framework, tanpa satu pun aset gambar/audio eksternal.** Semua
sprite digambar prosedural dari peta piksel di `sprites.js` dan dirender sekali ke
offscreen canvas saat loading; semua suara disintesis WebAudio di `audio.js`. Karakter
"Pamong" adalah prajurit pixel-art **original** (bandana merah, rompi hijau) — bukan
salinan sprite SNK.

## Cara menjalankan

Buka `index.html` langsung di browser, atau sajikan lewat server statis apa pun:

```
cd pam-ong
python3 -m http.server 8080
# buka http://localhost:8080
```

Di HP: game tampil penuh layar apa pun orientasinya. Kontrol sentuh muncul otomatis
di perangkat sentuh.

## Yang berubah di v3 (menjawab 4 keluhan pemain v2)

1. **Fullscreen & landscape sekarang TOMBOL manual, bukan otomatis.** Tidak ada lagi
   `requestFullscreen` otomatis saat MULAI, tidak ada kunci orientasi paksa, dan
   **overlay "PUTAR HP ANDA" + jeda otomatis portrait DIHAPUS total**. Di pojok kanan
   atas panggung selalu ada dua tombol (di layar judul maupun saat bermain):
   - **⛶ PENUH** — toggle layar penuh dari klik; statusnya mengikuti `fullscreenchange`.
   - **↻ PUTAR** — dari klik: masuk fullscreen dulu, lalu coba kunci landscape;
     bila kunci ditolak/tidak didukung, panggung **diputar via CSS** (kelas `rot`)
     sampai memenuhi layar; klik lagi untuk melepas.
   Dalam portrait tanpa tombol PUTAR, panggung tampil proporsional di tengah —
   **tanpa overlay, tanpa pause paksa**, game tetap bisa dimulai & dimainkan.
   Menu PENGATURAN kini hanya berisi **Musik, SFX, Getar** (opsi layar otomatis
   dihapus; pengaturan lama dari v2 terbaca aman — kunci usang `fullscreen` diabaikan).
2. **Grafik dirombak.** Resolusi internal naik **320×224 → 480×270 (16:9)**. Semua
   sprite digambar ulang pada skala ±1,5×: pemain ±60px proporsi Metal Slug (kepala
   besar, kekar pendek), outline gelap, ≥3 tingkat shading, bandana berkibar, rompi &
   sabuk, lipatan celana, bot, sarung tangan. **Frame lari 8** (dulu 6), animasi
   **napas idle**, pose **kemenangan** (angkat senjata) saat Mission Complete, ayunan
   pisau & lempar granat lebih besar. Musuh & bos diperbesar sepadan — Titan ±150px
   berpanel baja, rivet, lampu indikator, dan core berdenyut; Monster Laut bersisik,
   bermata besar, bergigi, bertentakel segmen. Latar **4 lapis parallax** di-prerender
   (langit gradasi + awan organik; pegunungan bertekstur; hutan tengah dengan pohon
   bervariasi; rumpun foreground bergoyang pelan). Juice khas: **selongsong peluru
   beterbangan memantul**, percikan **tanah/air sesuai permukaan**, debu kaki saat
   lari & mendarat, ledakan berlapis api + asap membumbung, kilatan moncong, asap
   hitam dari kendaraan/bos rusak, dan **hit-flash putih** pada musuh. Palet senja
   keemasan; tanah bertekstur (kerikil, retakan, helai rumput) di-prerender per segmen.
3. **Dunia diperluas: Misi 1 kini 4600px** (dulu ±3300px) dengan **5 zona** (peta di
   bawah), **jalur atas** (platform) di zona 2–3 sebagai rute alternatif, dan
   **POW menjadi 7** (satu di jalur atas, satu di balik tenda kamp). Tidak ada
   bentangan kosong >±300px tanpa musuh/dekorasi/pickup (terverifikasi uji data).
4. **Layar pas.** Halaman full-bleed **100dvw × 100dvh** tanpa margin; canvas diskalakan
   dengan faktor **terbesar yang menampilkan seluruh 480×270** (contain) — di layar
   16:9 landscape **pas tepi-ke-tepi**. Sisa ruang pada rasio lain diisi **gradasi
   senja CSS senada langit game**, bukan hitam polos. Kontrol sentuh & tombol pojok
   kini **menindih di dalam panggung** (semi-transparan, menghormati
   `env(safe-area-inset-*)`), tidak memakan ruang tata letak. Rotasi CSS fallback
   tetap memenuhi layar.

Semua mekanik & konten v2 **dipertahankan perilakunya** — SV-001, 3 bos, 6 senjata +
Fire Bomb, POW, skor, timer, mati 1 pukulan — yang berubah adalah presentasi, skala,
dan kontrol layar. Konstanta fisika diskalakan ×1,5 mengikuti resolusi (kecepatan tetap
dinyatakan per detik).

## Peta urutan Misi 1 (4600px, 5 zona)

```
ZONA 1 Pantai & sungai         → MONSTER LAUT (mini-boss, 5000 poin)
ZONA 2 Hutan & menara pengawas → jalur atas berisi POW; peti FLAME
ZONA 3 Jembatan kayu besar     → SV-001 terparkir SEBELUM jembatan (±43% level)
ZONA 4 Kamp musuh              → tenda-tenda, gudang, tong → Di-Cokka (mini-boss, 1200 poin)
ZONA 5 Lapangan reruntuhan     → ROBOT TITAN (bos akhir, 15000 poin) → Mission Complete!
```

Setiap bos mengunci arena (kamera & gerak pemain terbatas) sampai kalah. Urutan misi
tetap: Monster Laut → SV-001 → Di-Cokka → Titan.

## Fitur yang dipertahankan dari v2

- **SV-001 "Metal Slug" BISA DINAIKI**: dekati + tekan ATAS ("OK!"). Vulcan 8-arah
  dengan turet berputar, Cannon beramunisi terpisah (awal 10, peti CANNON +5), lompat
  berat, suara rantai roda sintesis. **Armor 3 pukulan** — bar oranye di HUD; peluru
  musuh merusak armor, bukan pemain. Armor habis → Slug meledak, pemain terlontar
  keluar **hidup** (kebal 1 detik). Keluar: BAWAH + B.
- **Enam senjata spesial** dari POW/peti: HMG 200, Rocket Launcher 30, Shotgun 30,
  **Flame Shot** 30 (api parabolik, membakar tanah 1 detik, damage per tick),
  **Laser Gun** 200 (sinar lurus menembus; satu damage per target per sinar),
  **Enemy Chaser** 40 (homing kuat). Plus **Fire Bomb** (tipe granat kedua; membakar
  area 1,5 detik). *Granat Stone belum dibuat.*
- **Tiga bos berlapis**:
  - **Monster Laut** (zona 1): kepala muncul-tenggelam bergantian di 3 titik air sambil
    menyemburkan bola air melengkung (bisa ditembak jatuh); 2 tentakel menghantam
    dengan **bayangan peringatan 0,5 detik**; hanya bagian di atas air yang bisa
    ditembak. **Tidak ada mekanik berenang** — bertarung dari tepi sungai/jembatan.
  - **Di-Cokka** (zona 4): meriam parabola + maju-mundur; bar HP di atas tank.
  - **Robot Titan** (zona 5, ±150px): core dada = **damage ×2** (dinilai per pita
    vertikal dada); pola (a) meriam lengan beruntun 3×, (b) hentakan kaki → gelombang
    tanah yang **wajib dilompati**, (c) salvo rudal bahu; HP <50% → **enrage** (tempo
    0,62×). Mati → ledakan beruntun + hit-stop + "Mission Complete!".
- **Musuh**: Rebel, Shield (perisai pecah tepat 4 hit dari depan lalu kabur), Grenade,
  Bazooka (di platform/menara; roketnya bisa ditembak jatuh, +100). Skor: Rebel 100,
  lainnya 300, roket jatuh 100.
- **Dunia interaktif**: tenda & gudang bisa dihancurkan (satu tenda menyembunyikan
  POW), tong bahan bakar meledak berantai (pasangan berjarak ≤ jangkauan rantai —
  terverifikasi pada data kiriman), peti item, menara pengawas, karung pasir, kawat
  berduri, papan peringatan, tiang bendera, batu & bunga liar.
- **Rasa Metal Slug (CONFIG)**: lari 156px/s, lompat melayang (gravitasi naik 930 <
  turun 1350), kamera look-ahead, screen-shake, hit-stop ±60ms saat Titan meledak.
  Mati 1 pukulan, 3 nyawa, respawn + kebal 2 detik, bonus POW 5000, timer 99 (habis
  saat jalan kaki = mati lalu diisi 30; habis di dalam Slug = diisi 30 tanpa mati).
  Damage tuning: pistol/HMG/vulcan 1, roket & granat 3, pisau 3, laser/chaser 2.

## Kontrol

### Di luar Slug

| Aksi | Keyboard | Sentuh |
|---|---|---|
| Gerak / aim 8-arah | Panah ← → ↑ ↓ | D-pad kiri (di dalam panggung) |
| A — Tembak (tahan = auto-fire) | Z / J | Tombol A (kanan, besar) |
| B — Lompat | X / K | Tombol B |
| C — Granat / Fire Bomb (tipe aktif) | C / L | Tombol C |
| Masuk SV-001 | ↑ saat di samping Slug | D-pad ▲ |
| Pause | P / Esc | Tombol ❚❚ pojok kanan atas |
| Bisu | M | Tombol 🔊 pojok kanan atas |
| Layar penuh (manual) | — | Tombol **⛶ PENUH** pojok kanan atas |
| Putar landscape (manual) | — | Tombol **↻ PUTAR** pojok kanan atas |

### Di dalam SV-001

| Aksi | Cara |
|---|---|
| Vulcan (A) 8-arah | Tahan arah (turet berputar mengikuti) + A |
| Cannon (C) | Tombol C — amunisi terpisah; peti CANNON +5 |
| Lompat (B) | Tombol B (lebih rendah & berat dari lompatan pemain) |
| Keluar | ↓ + B |

Di dalam Slug pemain tidak bisa jongkok, melempar granat, atau memakai pisau.

## Struktur berkas

| Berkas | Isi |
|---|---|
| `index.html` | Kerangka halaman: layar judul (+avatar 108×108), pengaturan (Musik/SFX/Getar), pause, ringkasan, tombol pojok & kontrol sentuh di dalam panggung |
| `style.css` | Full-bleed 100dvw×100dvh, gradasi senja pengisi, rotasi CSS fallback (`body.rot`), kontrol menindih + safe-area |
| `sprites.js` | Peta piksel semua sprite skala v3 (pemain kaki+torso 8 frame lari, musuh, SV-001, 3 bos, latar 4 lapis, ubin tanah bertekstur) → offscreen canvas |
| `audio.js` | Sintesis SFX + musik chiptune WebAudio, kanal musik/SFX terpisah (tidak berubah dari v2) |
| `game.js` | CONFIG tuning, state, FSM musuh & 3 bos, fisika, Slug, tombol layar manual, loop, render, HUD |
| `docs/KOREKSI.md` | Catatan koreksi antar-agen — **wajib dibaca sebelum mengubah kode** |

Ukuran total ±217 KB. Semua konstanta tuning ada di `CONFIG` di atas `game.js`.

Kinerja: sprite & latar di-prerender sekali; culling viewport untuk semua entitas;
semua proyektil/partikel memakai **pool tetap** (partikel ≤240 termasuk selongsong &
debu); tanpa `shadowBlur`/gradien per frame; tanpa alokasi di loop panas; fixed
timestep 60fps dengan fallback otomatis 30fps + hit-stop.

## Pengujian yang sudah dilakukan (v3)

- `node --check` lolos untuk `sprites.js`, `audio.js`, `game.js`.
- **Uji asap Node agen upgrade v3: 149 lulus, 0 gagal** (stub DOM/canvas/WebAudio/
  fullscreen/orientation/localStorage), mencakup:
  - **Tombol layar manual**: `startGame` TIDAK memanggil `requestFullscreen`/
    `orientation.lock` (uji negatif); klik PENUH toggle fullscreen; klik PUTAR
    mencoba lock → mode native saat sukses, **jatuh ke kelas rotasi CSS** saat lock
    ditolak / API tidak ada, dan melepas putar memulihkan; tidak ada overlay/pauser
    portrait (uji negatif); resize tidak menjeda game.
  - **Tata letak**: `computeStageSize` (fungsi murni) untuk 16:9 (pas tepi-ke-tepi
    1920×1080), 19.5:9, 20:9, 4:3, portrait, dan portrait+rotasi CSS — selalu contain
    penuh tanpa overflow; struktur HTML membuktikan kontrol & tombol pojok DI DALAM
    `#stage`; migrasi `localStorage` v2→v3 aman.
  - **Regresi mekanik v2 penuh**: Slug (masuk ATAS, Vulcan, Cannon termasuk pool
    penuh tidak menghanguskan amunisi, armor 3→terlontar hidup, keluar BAWAH+B),
    timer di Slug, perisai 4 hit, pisau, jongkok kompensasi kaki, 6 senjata +
    amunisi, laser satu-damage-per-sinar + core Titan ×2 via pita vertikal, zona
    api per-tick, Fire Bomb, tong berantai pada data kiriman, POW platform &
    tersembunyi, POW = 7.
  - **Tiga bos ujung-ke-ujung**: Monster Laut (picu, kepala tertembak, tentakel
    membunuh, arena lepas), Di-Cokka (pola shell, mati, +1200), Titan (3 pola +
    gelombang membunuh pemain di tanah, mati → Mission Complete + pose kemenangan).
  - **Lari campuran 6000 langkah** tanpa exception; ukuran semua pool tetap;
    partikel aktif ≤240; **cakupan data level**: setiap jendela 300px berisi fitur.
  - Audit kunci sprite: seluruh 69 rujukan `SPR.*` + sub-kunci komposisi per senjata
    terbukti ada (ctx stub menelan `drawImage(undefined)` tanpa bunyi — karena itu
    kunci sprite diverifikasi eksplisit, bukan hanya render).
- Audit independen agen pengoreksi untuk v3: **SELESAI** — rangkaian uji terpisah
  dari nol (stub sendiri, `~/workspace/audit-scratch/`, berkas `t3-*.js`): **173 uji
  lulus, 0 gagal, stabil 3× jalan**. Tiga bug nyata ditemukan & diperbaiki:
  (1) kamera arena dipaku di tepi kiri membuat 255px arena Monster Laut (dan
  pemain di dinding kanannya) berada di luar layar + bola air titik jauh mati
  ter-cull — kini target kamera diklamp ke rentang arena; (2) salvo rudal Titan
  selalu mendarat ~30% jalan (min |dx| 79px vs radius ledakan 45 — pola mati
  secara angka) — vx diturunkan dari waktu terbang nyata 0,75s, kini min |dx| 9px;
  (3) laser menembus musuh pada fallback 30fps (28px/langkah vs jendela 28px) —
  kotak laser kini menutupi segmen langkah. Ditambah 7 baris peta piksel ragged
  diseragamkan (padding transparan, nol efek visual). Detail: entri "AUDIT v3"
  di KOREKSI.md. Satu diagnosis pengoreksi (kotak tangkap bola air) terbukti
  keliru oleh pengukuran lintasan dan DITARIK — juga tercatat di KOREKSI.md.
- Belum diuji di HP fisik — tetap target uji berikutnya (rasa tombol PENUH/PUTAR,
  rotasi CSS fallback, performa 60fps di HP kelas bawah).

## Yang BELUM ada (roadmap jujur)

- **Misi 2+**, rute bercabang, variasi latar lain.
- Granat **Stone**; senjata Iron Lizard; musuh Mortar/Minelayer.
- Penyimpanan skor tertinggi & PWA/offline.
- Suara announcer manusia — announcer masih teks + jingle sintesis.
- Angka damage hasil riset bersifat kualitatif; tuning sekarang perlu playtest rasa
  di HP sungguhan.

## Titik rawan untuk agen pengoreksi berikutnya (baru di v3)

1. **Tombol PUTAR mode native**: bila pengguna keluar fullscreen secara manual saat
   kunci orientasi native aktif, `rotateMode` direset oleh penangan
   `fullscreenchange` — periksa di Android Chrome sungguhan apakah perilaku
   `unlock()` implisit browser konsisten dengan status tombol.
2. **Rotasi CSS fallback**: `body.rot` menukar acuan dvh/dvw dan memutar
   `#stageWrap`; hitungan `computeStageSize(vw, vh, true)` terverifikasi stub,
   tetapi sumbu pointer pada elemen ter-rotate 90° hanya bisa dibuktikan di
   perangkat sungguhan.
3. **Jembatan vs kepala pemain**: dek jembatan (y=172/176) sejajar kepala pemain
   (±60px) yang mengarungi dasar sungai; jembatan digambar sebelum pemain sehingga
   pemain tampak di depan dek. Fungsional (platform satu-arah menangkap lompatan;
   POW jembatan terjangkau), tetapi nilai visualnya perlu mata manusia/pengoreksi.
4. **Kepala Monster Laut dari dek jembatan**: tembakan lurus dari atas dek (moncong
   y=133) melintas di atas kotak kepala (175..229) — sama seperti v2; pemain harus
   turun ke air atau menembak miring/ke bawah. Sengaja dipertahankan, silakan nilai.
5. **Culling berbasis kamera** untuk gelombang/rudal Titan: proyektil dibuang bila
   jauh di luar kamera. Aman karena arena bos mengunci kamera, tetapi uji teleportasi
   harus menyetel `G.camX` ke arena dulu — kalau tidak, proyektil tampak "tidak
   pernah lahir" (artefak uji, lihat KOREKSI v3).
6. Titik rawan warisan v2 yang sudah terverifikasi/diperbaiki (laser per-sinar,
   surfT monster, kotak intersepsi roket 13×12 kini) tetap berlaku — lihat entri
   "AUDIT v2" di KOREKSI.md.

## Aturan proyek

Setiap kesalahan yang ditemukan selama pengembangan **wajib** dicatat di
[`docs/KOREKSI.md`](docs/KOREKSI.md) — tanggal, kesalahan, penyebab, perbaikan, dan
pelajaran untuk agen lain — agar tidak terulang.
