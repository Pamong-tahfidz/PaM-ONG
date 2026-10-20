# PaM-ONG v2 — Misi 1: Operasi Senja

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

Di HP: mainkan dalam posisi landscape. Kontrol sentuh muncul otomatis di perangkat sentuh.

## Peta urutan Misi 1

```
START → tepi sungai → MONSTER LAUT (mini-boss, 5000 poin) → jembatan kayu →
menara & tenda militer → SV-001 terparkir (±45% level) → tong bahan bakar →
Di-Cokka (mini-boss tank, 1200 poin) → arena terbuka → ROBOT TITAN (bos akhir,
15000 poin) → Mission Complete!
```

Level ±3300px. Setiap bos mengunci arena (kamera & gerak pemain terbatas) sampai kalah.

## Fitur v2

- **Menu PENGATURAN** (layar judul & pause): Layar Penuh, Musik, SFX, Getar — tersimpan
  di `localStorage` (kunci `pamong-settings`); kanal musik & SFX terpisah di mesin audio.
  MULAI MISI dengan Layar Penuh aktif meminta `requestFullscreen` + kunci orientasi
  landscape (khusus Android Chrome, dari gestur pengguna). Ada tombol layar-penuh cepat
  di layar judul dan tombol pause ❚❚ di pojok kanan atas saat bermain.
- **Landscape yang benar**: overlay "PUTAR HP ANDA ↻" muncul dan game **terjeda otomatis**
  saat portrait di perangkat sentuh; lanjut sendiri saat landscape. Canvas tetap 320×224,
  skala integer bila muat selain itu fit maksimal, letterbox gelap.
- **Karakter & avatar digambar ulang total**: pemain ±40px dengan **kaki + torso terpisah**
  ala Metal Slug — kaki lari 6 frame/idle/jongkok/lompat; torso aim lurus/diagonal/atas,
  jongkok 2 varian, lempar granat, pisau, mati 3 frame. **Avatar potret 72×72** di layar
  judul + ikon kepala kecil sebagai penanda nyawa di HUD. Musuh, Di-Cokka, muzzle flash,
  ledakan 4 frame + asap, dan percikan tanah/air digambar ulang selevel.
- **Musuh baru — Bazooka Soldier**: berdiri di platform tinggi, menembakkan roket lambat
  berkedip yang **bisa ditembak jatuh** (300 poin; roket yang jatuh = +100).
- **SV-001 "Metal Slug" BISA DINAIKI** (terparkir ±45% level): dekati + tekan ATAS
  ("OK!"). Vulcan 8-arah dengan turet berputar, Cannon beramunisi terpisah (awal 10,
  peti CANNON +5), lompat berat, suara rantai roda sintesis. **Armor 3 pukulan** — bar
  oranye di HUD menggantikan panel ARMS; peluru musuh merusak armor, bukan pemain. Armor
  habis → Slug meledak, pemain terlontar keluar **hidup** (kebal 1 detik).
- **Senjata baru** (total 6 senjata spesial dari POW/peti): **Flame Shot** 30 (api
  parabolik, membakar tanah 1 detik, damage per tick), **Laser Gun** 200 (sinar lurus
  menembus semua musuh sebaris), **Enemy Chaser** 40 (homing kuat, belokan tajam).
- **Fire Bomb**: tipe granat kedua dari POW/peti (HUD BOMB menampilkan tipe aktif);
  meledak menjadi api yang membakar area 1,5 detik. Granat biasa tetap ada (awal 10;
  seusai respawn minimal 3; isi ulang peti +2 / POW +5). *Granat Stone belum dibuat.*
- **Tiga bos berlapis**:
  - **Monster Laut** (sungai, ±15% level): kepala muncul-tenggelam bergantian di 3 titik
    air sambil menyemburkan bola air melengkung (bisa ditembak jatuh); 2 tentakel
    menghantam dengan **bayangan peringatan 0,5 detik**; hanya bagian di atas air yang
    bisa ditembak; HP ±1/3 Titan; kalah → tenggelam bergelembung, rute sungai terbuka.
    Pemain bertarung dari tepi sungai/jembatan — **tidak ada mekanik berenang**.
  - **Di-Cokka** (mini-boss tank di tengah level): pola v1 dipertahankan (meriam
    parabola, maju-mundur), kini sebagai mini-boss — bukan lagi bos akhir.
  - **Robot Titan** (bos AKHIR, ±2,5× tinggi pemain): core menyala di dada = **damage
    ×2**; pola (a) meriam lengan beruntun 3×, (b) hentakan kaki → gelombang tanah yang
    **wajib dilompati**, (c) salvo rudal bahu melengkung ke posisi pemain, (d) HP <50% →
    **enrage** (semua pola lebih cepat). Mati → ledakan beruntun + hit-stop + "Mission
    Complete!".
- **Dunia diperkaya**: latar **3 lapis parallax di-prerender** (langit senja + matahari +
  awan bergeser pelan; pegunungan + siluet hutan; palem & semak dekat); air sungai
  beranimasi garis riak; jembatan kayu besar bisa dinaiki dari kedua ujung; **tenda
  militer bisa dihancurkan** (runtuh jadi puing, kadang drop item, satu menyembunyikan
  POW); menara pengawas kayu; **tong bahan bakar meledak berantai** (radius adil);
  bendera & rambu musuh; semak foreground tipis digambar terakhir; permukaan tanah
  bervariasi (rumput/pasir/papan kayu).
- **Rasa Metal Slug (CONFIG)**: lari 104px/s, lompat melayang (gravitasi naik 620 <
  turun 900), kamera look-ahead mengikuti arah hadap, screen-shake pada ledakan besar &
  bos, **hit-stop ±60ms** saat Titan meledak. POW Misi 1 kini **5** (satu di jembatan,
  satu tersembunyi di balik tenda).

Perilaku v1 yang dipertahankan persis: mati 1 pukulan, 3 nyawa, respawn + kebal 2 detik,
skor Rebel 100 / Shield 300 / Grenade 300 / Di-Cokka 1200, bonus POW 5000, timer 99
(habis = mati, lalu diisi 30), pisau otomatis jarak dekat, perisai hancur tepat 4 hit
dari depan lalu kabur. Amunisi: HMG 200, Rocket 30, Shotgun 30.

## Kontrol

### Di luar Slug

| Aksi | Keyboard | Sentuh |
|---|---|---|
| Gerak / aim 8-arah | Panah ← → ↑ ↓ | D-pad kiri |
| A — Tembak (tahan = auto-fire) | Z / J | Tombol A (kanan, besar) |
| B — Lompat | X / K / Spasi | Tombol B |
| C — Granat / Fire Bomb (tipe aktif) | C / L | Tombol C |
| Masuk SV-001 | ↑ / W saat di samping Slug | D-pad ▲ |
| Pause | P / Esc | Tombol ❚❚ kanan atas |
| Bisu | M | Tombol 🔊 |

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
| `index.html` | Kerangka halaman: layar judul (+avatar), pengaturan, pause, ringkasan, kontrol sentuh |
| `style.css` | Tata letak letterbox landscape, overlay putar, tombol sentuh ≥44px |
| `sprites.js` | Peta piksel semua sprite (pemain kaki+torso, musuh, SV-001, 3 bos, latar 3 lapis) → offscreen canvas |
| `audio.js` | Sintesis SFX + musik chiptune WebAudio, kanal musik/SFX terpisah |
| `game.js` | CONFIG tuning, state, FSM musuh & 3 bos, fisika, Slug, loop, render, HUD |
| `docs/KOREKSI.md` | Catatan koreksi antar-agen — **wajib dibaca sebelum mengubah kode** |

Ukuran total ±165 KB. Semua konstanta tuning ada di `CONFIG` di atas `game.js`.

## Pengujian yang sudah dilakukan

- `node --check` lolos untuk `sprites.js`, `audio.js`, `game.js`.
- **Uji asap Node agen upgrade: 83 lulus, 0 gagal** (klaim agen upgrade; stub
  DOM/canvas/WebAudio/fullscreen/localStorage): pengaturan tersimpan & tersambung ke
  audio; overlay portrait menjeda; Monster Laut (muncul-tenggelam, peringatan tentakel,
  bisa ditembak, arena bebas); Slug (masuk, Vulcan 8-arah, Cannon berkurang, armor 3 hit
  → meledak & pemain hidup, keluar ↓+B); Flame/Laser/Chaser + amunisi; Fire Bomb
  membakar; Bazooka menembak & roketnya jatuh ditembak; tenda hancur → drop & POW
  tersembunyi terbuka; tong berantai; Di-Cokka mini-boss; Titan (3 pola + enrage +
  core ×2) → Mission Complete; regresi v1 (perisai 4 hit, POW, timer, game over); dan
  **urutan misi penuh tanpa exception**.
- **Audit independen agen pengoreksi (2026-10-20): 79 uji perilaku lulus, 0 gagal**
  (rangkaian terpisah, ditulis dari nol; 3× jalan berturut-turut stabil). Audit ini
  menemukan & memperbaiki 10 cacat yang lolos dari uji agen upgrade — termasuk laser
  multi-damage ke ketiga bos, core Titan tak terjangkau tembakan lurus, timer utang di
  Slug, dan POW jembatan teleport. Rincian: `docs/KOREKSI.md` entri "AUDIT v2".
- Belum diuji di HP fisik — tetap target uji berikutnya (rasa tombol, performa, kunci
  orientasi fullscreen hanya bisa dibuktikan di Android Chrome sungguhan).

## Yang BELUM ada (roadmap jujur)

- **Misi 2+**, rute bercabang, variasi latar lain.
- Granat **Stone**; senjata Iron Lizard; musuh Mortar/Minelayer.
- Penyimpanan skor tertinggi & PWA/offline.
- Suara announcer manusia — announcer masih teks + jingle sintesis.
- Angka damage hasil riset bersifat kualitatif; tuning sekarang: pistol/HMG 1, roket &
  granat 3, pisau 3, laser/chaser 2 — perlu playtest rasa di HP sungguhan.

## Titik rawan untuk agen pengoreksi berikutnya

1. **Laser vs bos** — DIPERBAIKI oleh agen pengoreksi (audit v2, 2026-10-20): ketiga bos
   kini punya penanda per-sinar dan penanda memakai nomor seri peluru (`bulletSerial`),
   bukan referensi objek pool. Satu sinar = satu damage per target, termasuk core Titan.
2. **Pijakan menara 2** — DIPERBAIKI (audit v2): platform x=2050 & Grenade Soldier x=2075
   diselaraskan ke y=144, mengikuti lantai kabin menara (143). Klaim lama "bazooka/128 vs
   140" tidak cocok dengan kode kiriman; selisih nyata terukur 5px.
3. **drawSlug()** memanggil `computeMuzzle()` saat render (fungsi murni — aman), tetapi
   logika moncong punya dua pemanggil; periksa keduanya bila diubah.
4. **surfT Monster Laut** hanya direset saat fase berganti — TERVERIFIKASI konsisten
   (audit v2): pemain mati di tengah fase hanya melewatkan semburan fase itu; fase
   berikutnya monster menembak normal. Bukan bug.
5. **Kotak intersepsi roket** sengaja longgar (9×8) demi keadilan tembak-jatuh — jangan
   diperkecil tanpa uji geometri (riwayat: KOREKSI v2, 2026-10-20).
6. Pemain yang terlempar dari Slug di dalam arena bos diklamp dinding arena pada frame
   berikutnya — bisa menempel dinding sesaat; bukan bug fatal.

## Aturan proyek

Setiap kesalahan yang ditemukan selama pengembangan **wajib** dicatat di
[`docs/KOREKSI.md`](docs/KOREKSI.md) — tanggal, kesalahan, penyebab, perbaikan, dan
pelajaran untuk agen lain — agar tidak terulang.
