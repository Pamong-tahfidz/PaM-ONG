# PaM-ONG v5 — Misi 1: Operasi Senja

Game web **run-and-gun** terinspirasi *Metal Slug* (SNK) yang bisa dimainkan sampai
selesai satu misi penuh, ditulis dengan vanilla HTML5 Canvas 2D + JavaScript murni.

**Tanpa library, tanpa framework.** Grafik memakai **aset gambar asli
berlisensi bebas**: pemain/musuh/Titan dari **"Open Gunner" oleh Master484
(CC-BY 3.0)**, latar pegunungan/hutan dari **"Mountain at Dusk" oleh ansimuz
(CC0)**, tank Di-Cokka dari **"2D Side scrolling tank" oleh 2D Tyrant (CC0)**,
dan ledakan dari **"Explosion Set 2" oleh Master484 (CC0)** — atribusi
lengkap di [`assets/CREDITS.md`](assets/CREDITS.md). Suara tetap disintesis
WebAudio di `audio.js`. Peran yang belum dapat aset cocok (POW, Shield Soldier,
SV-001, Monster Laut, langit & ubin tanah) tetap memakai sprite prosedural
proyek di `sprites.js`, yang juga menjadi **fallback penuh**: bila berkas aset
gagal dimuat, game berjalan persis seperti v3. **Tidak ada aset rip dari
game komersial mana pun.**

## Cara menjalankan

Buka `index.html` langsung di browser, atau sajikan lewat server statis apa pun:

```
cd pam-ong
python3 -m http.server 8080
# buka http://localhost:8080
```

Di HP: game tampil penuh layar apa pun orientasinya. Kontrol sentuh muncul otomatis
di perangkat sentuh.

## Yang berubah di v5 (menjawab vonis pemain v4: "masih jauh dari Metal Slug")

Fokus ronde ini adalah **GAME FEEL** — rasa main, kejelasan mekanik, dunia
luas, kelancaran — bukan sekadar tambah fitur.

1. **SMOOTH & rasa main (P0).**
   - **Kamera ditulis ulang**: deadzone 26px + damping + lookahead searah
     hadap/gerak yang diredam — tidak lagi kaku menempel pemain; kamera
     diam saat pemain mati; klamp arena bos dipertahankan.
   - **Animasi lari berbasis jarak tempuh** (`runDist`): frame kaki =
     fungsi jarak yang benar-benar ditempuh, sinkron tanah, tidak
     meluncur, independen dari laju frame.
   - **Juice berlapis**: hit-stop berjenjang (kill 20ms, pisau 45ms,
     ledakan bos 50–60ms) yang **tidak menelan input** (sinyal tepi
     di-buffer), knockback musuh dari peluru & pisau, recoil senjata,
     **teks skor melayang** (+100/+300/+15000…), popup hadiah POW besar
     ("HEAVY MACHINE GUN!"), panah **GO! >>** berkala di luar arena.
2. **MEKANIK JELAS (P0).**
   - **Pisau diperluas**: kini melukai **bos juga** (Monster Laut,
     Di-Cokka, Titan) dengan knockback & hit-stop — bukan hanya musuh.
   - **HIGH SCORE persisten** (localStorage `pamong-highscore`): tampil
     di layar judul ("SKOR TERBAIK"), di HUD (`HI …`), dan di layar
     akhir dengan tanda "REKOR BARU!" — hanya naik, tidak pernah turun.
   - Amunisi & stok granat tetap terlihat di HUD; mati tetap mengembalikan
     ke pistol + granat dasar.
3. **DUNIA LUAS (P1).** Misi 1 diperluas **4600 → 6400px, 5 → 7 zona**
   (peta di bawah): zona gudang & kamp kedua, reruntuhan & menara ketiga,
   POW 7 → **9**, musuh/peti/tong/dekor bertambah sepadan; invariant
   "tidak ada jendela 300px kosong" tetap dijaga uji data.
4. **ASET BARU (P1).** **Di-Cokka memakai tank CC0 asli** ("2D Side
   scrolling tank" oleh 2D Tyrant — 3 frame animasi rantai, di-mirror)
   lewat loader terpisah `PAM_TANK`; **ledakan memakai "Explosion Set 2"
   Master484 (CC0)** lewat loader `PAM_FX` — `explosion.png` untuk
   ledakan biasa (`SPR.boom`) dan `explosion-big.png` berpalet lebih
   panas untuk ledakan besar (`SPR.boomBig`). SV-001 **sengaja tetap
   gambar-kode**: turet aset tank menyatu & diam, sedangkan turet SV-001
   wajib berputar 8 arah. Semua loader baru tunduk pada aturan lama:
   hanya diterapkan bila set utama berhasil penuh — fallback satu gaya
   tidak pernah tercemar. Total aset fungsional kini **8 berkas** (daftar
   + bukti pemakaian per berkas di bagian Pengujian; perburuan kandidat
   lain & penolakannya tercatat jujur di `docs/KOREKSI.md`).
5. **UI/UX & wajah web (P1).** HUD diverifikasi tak bertabrakan di semua
   pratinjau; tombol kecil dinaikkan ke target sentuh 44px; layar jeda &
   selesai diperiksa visual. **Musik lobi**: musik mulai pada gestur
   pertama di layar judul (browser melarang autoplay), menghormati
   saklar Musik & tombol bisu, dan berlanjut mulus ke gameplay (loop
   sama, `startMusic` idempotent). **Metadata web lengkap** (description,
   theme-color, Open Graph, Twitter card), **logo berkas** `logo.png`
   (wordmark karya sendiri, ukuran tampil terkunci 54px), **favicon &
   ikon** (192/512/apple-touch) yang semuanya **diturunkan dari
   logo.png** — favicon memakai varian sederhana huruf "P" dari logo
   yang sama agar terbaca pada 16px — plus `manifest.webmanifest`.
6. **Standar profesional.** Dokumen baru [`docs/ARSITEKTUR.md`](docs/ARSITEKTUR.md):
   peta modul, aliran data, aturan CONFIG, dan panduan menambah musuh/
   senjata/zona secara data-driven. Semua angka tuning v5 hidup di
   `CONFIG` (kamera, hit-stop, siklus lari, GO!, jangkauan pisau).

## Yang berubah di v4 (menjawab 2 keluhan pemain v3)

1. **Gambar raksasa yang menghalangi layar judul — DIPERBAIKI (struktural).**
   Di v3, aturan CSS generik `#stage canvas { position:absolute; width:100%;
   height:100% }` ikut menelan `#avatarCanvas`, karena spesifikasinya
   (1 ID + 1 elemen) mengalahkan aturan `#avatarCanvas` (1 ID) — canvas avatar
   108×108 pun direntangkan sebesar panggung, menutupi logo, instruksi, dan
   tombol MULAI MISI (klik tertolak). Di v4 aturan sepenuh-panggung
   **dibatasi eksplisit ke `#stage > #game` dan `#stage > #hud`**; avatar
   diberi ukuran tampil tetap **84×84px**, `position: static`, `flex: none`,
   `border-radius: 50%` dengan selector diperkuat `#stage #avatarCanvas` —
   tidak ada jalur CSS yang bisa membuatnya menutupi layar lagi. Ada **uji
   struktural** yang membaca `style.css`/`index.html` untuk menjaga ini, dan
   perbaikan diverifikasi di browser sungguhan (Chromium headless): avatar
   terukur 84×84 dan `elementFromPoint` di tengah tombol MULAI mengembalikan
   tombol itu sendiri. Pelajaran besarnya tercatat di KOREKSI.md: *uji stub
   tidak melihat presentasi — rilis wajib diperiksa visualnya.*
2. **Grafik karakter & latar diganti aset gambar asli (gratis, berlisensi jelas).**
   Sprite peta-piksel kode untuk pemain, Rebel, Grenade, Bazooka, dan Titan
   digantikan gambar tangan profesional dari set **Open Gunner (Master484,
   CC-BY 3.0)**: pemain beranimasi lari 8 frame sungguhan + pose
   lompat/jongkok/bidik diagonal & atas/lempar/tiarap; musuh di-mirror
   menghadap kiri; Grenade memakai remap palet cokelat-khaki dan Bazooka
   palet biru-baja dari frame yang sama; Titan menjadi **mech hijau
   raksasa** (pose berdiri + tembak). Latar pegunungan & hutan tengah kini
   memakai lapisan parallax **"Mountain at Dusk" (ansimuz, CC0)**. Mekanik
   **tidak berubah sama sekali**: kotak tabrak, timing, pola bos, dan data
   level persis v3 — yang diganti hanya sumber gambarnya (frame aset
   dipetakan ke state animasi yang sudah ada; siklus jalan Rebel kini
   memakai 8 frame aset pada laju anim yang sama). Aset dimuat `assets.js`
   dengan indikator status di layar judul; **satu berkas gagal = fallback
   penuh ke sprite v3** untuk semua peran aset. Total `assets/` hanya
   ±129 KB (5 PNG). Avatar judul kini digambar dari frame hero aset.
   Pratinjau visual jujur (tangkapan layar browser sungguhan dari berkas &
   skala final) ada di `previews/` — folder itu **tidak** ikut dideploy.

   Yang **belum** terganti (tetap sprite v3, dilaporkan apa adanya): POW &
   Shield Soldier (tidak ada aset tawanan/perisai berlisensi yang cocok),
   SV-001 & Di-Cokka (tidak ada tank tampak-samping yang cocok di set
   gratis yang diperiksa), Monster Laut, langit senja & ubin tanah
   (lapisan langit v3 dipertahankan agar menyatu dengan strip aset;
   paket latar CC0 tidak menyediakan ubin tanah).

## Yang berubah di v3 (riwayat — menjawab 4 keluhan pemain v2)

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
   (langit gradasi + bintang + matahari; pegunungan bertekstur; hutan tengah dengan pohon
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

## Peta urutan Misi 1 (6400px, 7 zona — diperluas di v5)

```
ZONA 1 Pantai & sungai         → MONSTER LAUT (mini-boss, 5000 poin)
ZONA 2 Hutan & menara pengawas → jalur atas berisi POW; peti FLAME
ZONA 3 Jembatan kayu besar     → SV-001 terparkir SEBELUM jembatan
ZONA 4 Kamp musuh              → tenda-tenda, gudang, tong → Di-Cokka (mini-boss, 1200 poin)
ZONA 5 Gudang & kamp kedua     → tong berantai, peti roket/chaser, POW
ZONA 6 Reruntuhan & menara 3   → jalur atas, POW terakhir sebelum bos
ZONA 7 Lapangan akhir          → ROBOT TITAN (bos akhir, 15000 poin) → Mission Complete!
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
| `index.html` | Kerangka halaman: layar judul (+avatar tampil 84×84), pengaturan (Musik/SFX/Getar), pause, ringkasan, tombol pojok & kontrol sentuh di dalam panggung, indikator status aset |
| `style.css` | Full-bleed 100dvw×100dvh, gradasi senja pengisi, rotasi CSS fallback (`body.rot`), kontrol menindih + safe-area; aturan canvas sepenuh-panggung hanya untuk `#game`/`#hud` |
| `sprites.js` | Peta piksel semua sprite skala v3 (pemain kaki+torso 8 frame lari, musuh, SV-001, 3 bos, latar 4 lapis, ubin tanah bertekstur) → offscreen canvas. **Di v4 berperan sebagai fallback penuh + pemasok peran yang belum beraset** |
| `audio.js` | Sintesis SFX + musik chiptune WebAudio, kanal musik/SFX terpisah (tidak berubah dari v2) |
| `game.js` | CONFIG tuning, state, FSM musuh & 3 bos, fisika, Slug, tombol layar manual, loop, render, HUD |
| `assets.js` | Pemuatan aset PNG dari `assets/`, pemotongan frame atlas, penimpaan entri `SPR`, pembuatan siluet kilatan, gambar ulang avatar; status di `window.PAM_ASSETS`; loader terpisah v5: tank (`PAM_TANK`) & ledakan (`PAM_FX`) — hanya teraplikasi bila set utama sukses penuh |
| `assets/` | 8 berkas PNG aset gameplay berlisensi (pemain, musuh, Titan, 2 strip latar, tank, 2 ledakan) + `CREDITS.md` berisi atribusi wajib |
| `logo.png`, `favicon.ico`, `favicon-32.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `manifest.webmanifest` | Wajah web (v5): logo berkas di layar judul + favicon/ikon yang semuanya diturunkan dari `logo.png`; **bukan** aset gameplay |
| `docs/ARSITEKTUR.md` | **Peta sistem untuk developer**: modul & tanggung jawab, aliran data, sistem aset & fallback, panduan menambah musuh/senjata/zona |
| `docs/KOREKSI.md` | Catatan koreksi antar-agen — **wajib dibaca sebelum mengubah kode** |

> **Pengembangan:** sebelum mengubah atau menambah konten, baca
> [`docs/ARSITEKTUR.md`](docs/ARSITEKTUR.md) (pola CONFIG & data-driven
> yang wajib diikuti) dan [`docs/KOREKSI.md`](docs/KOREKSI.md).

Ukuran total ±350 KB (termasuk `assets/` ±129 KB). Semua konstanta tuning ada di `CONFIG` di atas `game.js`.

Kinerja: sprite & latar di-prerender sekali; culling viewport untuk semua entitas;
semua proyektil/partikel memakai **pool tetap** (partikel ≤240 termasuk selongsong &
debu); tanpa `shadowBlur`/gradien per frame; tanpa alokasi di loop panas; fixed
timestep 60fps dengan fallback otomatis 30fps + hit-stop.

## Pengujian yang sudah dilakukan (v5)

- `node --check` lolos untuk `sprites.js`, `audio.js`, `game.js`, `assets.js`.
- **Uji baru v5 agen pembangun: 128 uji lulus, 0 gagal**
  (`~/workspace/audit-scratch/t5-v5.js` 86 uji + `t5-assets.js` 42 uji):
  - **Mekanik**: matriks aim 8-arah terukur; pisau melukai musuh **dan
    ketiga bos** + knockback (perisai tanpa knockback); amunisi spesial
    habis → pistol; mati → pistol + granat dasar.
  - **High score**: terbaca saat boot dari localStorage, "REKOR BARU!"
    tersimpan, tidak pernah turun, HUD `HI` mengikuti skor berjalan.
  - **Hit-stop tidak menelan input**: lompat yang ditekan di tengah
    hit-stop tetap dieksekusi pada frame asli berikutnya.
  - **Kamera**: damping terukur, deadzone interior, lookahead berbalik
    arah, invariant empat sudut di arena Monster Laut & arena Titan
    geometri v5, kamera diam saat pemain mati.
  - **Data level 6400px**: POW = 9, rantai tong valid, cakupan jendela
    300px penuh, musuh ber-y tepat di platform, klamp & salvo Titan
    di-staging ulang pada geometri baru, ujung-ke-ujung Mission
    Complete +15000.
  - **Aset loader terpisah**: tank & kedua ledakan hanya teraplikasi
    bila set utama sukses penuh; kegagalan satu berkas FX hanya
    menggugurkan perannya; render membuktikan frame tank 136px, frame
    ledakan aset 60px, dan cabang `SPR.boomBig` untuk ledakan besar
    (penanda kanvas 61px).
  - **Musik lobi**: belum jalan sebelum gestur; mulai pada gestur
    pertama di judul; MULAI tidak mengulang/menumpuk musik (timer yang
    sama); saklar Musik mati = gestur tidak memulai musik.
  - **Wajah web struktural**: metadata/OG/Twitter lengkap, favicon &
    manifest tertaut, logo = `img#titleLogo` dengan kunci CSS 54px,
    dimensi berkas ikon persis (512/192/180, logo 758×164).
- **Audit independen v5 (agen pengoreksi): 87 uji baru, semua lulus**
  (`~/workspace/audit-scratch/t5-audit.js`) — kamera dinamis kedua
  arena saat bergerak nyata, siklus lari pada 60 & 30 fps, hit-stop
  lewat loop `frame()` asli, pisau ke ketiga bos + sapuan NaN ke
  seluruh musuh, siklus hidup high score penuh, invariant data,
  semantik kegagalan loader per berkas, wajah web struktural,
  disiplin CONFIG. Audit menemukan & memperbaiki **3 bug nyata**
  (pemicu Titan di luar arena → pemain/Slug teleport; musik lobi
  mati permanen setelah KE JUDUL; teks pengumuman membeku permanen
  di layar akhir pada jalur mati-saat-pengumuman) + kepatuhan
  CONFIG/dokumentasi — rincian & pelajaran di `docs/KOREKSI.md`.
- **Regresi suite lama (setelah rebase audit)**: audit v4 **66/66**,
  `t4-v4` **49/49**, layar v3 **29/29**, pemeriksaan langit v4.1
  lulus, suite era v3 (`t3-*`/main3) **145/145**. Kegagalan baseline
  (14 di main3 + 1 di t4-v4) terbukti **semuanya** perubahan disengaja
  v5 — staging Titan geometri 4600px, "POW tepat 7"→9, kunci `SPR`
  milik assets.js, string versi A12 — di-rebase di berkas uji;
  tidak ada satu pun yang ternyata bug kode.
- **Gerbang visual browser sungguhan** (Chromium headless via CDP):
  8 tangkapan di `previews/` diperiksa dengan mata — judul (logo berkas
  + avatar 84px + kredit lengkap), gameplay awal, tengah misi (popup
  "HEAVY MACHINE GUN!" + POW), Di-Cokka bertank CC0, Titan, ledakan
  aset besar/kecil, layar JEDA, layar MISI SELESAI (tally + REKOR
  BARU). `PAM_ASSETS`/`PAM_TANK`/`PAM_FX` semua `applied` di browser.
- **Bukti pemakaian per berkas aset fungsional (8)**: `player.png` →
  frame hero (render pemain); `enemies.png` → frame Rebel/Grenade/
  Bazooka; `titan.png` → badan mech Titan; `bg-far.png`/`bg-mid.png` →
  lapisan parallax; `tank.png` → frame Di-Cokka; `explosion.png` →
  `SPR.boom` (semua ledakan kecil); `explosion-big.png` → `SPR.boomBig`
  (ledakan besar via flag partikel). Target 17 berkas **belum tercapai
  secara jujur** — kandidat lain (tileset hutan Open Gunner Expansion,
  ubin negara, air laut, POW/tawanan, perisai) gugur di verifikasi
  lisensi/jalur unduh atau kecocokan; daftar lengkap di KOREKSI.md.
- Belum diuji di HP fisik — tetap target uji berikutnya.

## Pengujian yang sudah dilakukan (v4)

- `node --check` lolos untuk `sprites.js`, `audio.js`, `game.js`, `assets.js`.
- **Uji v4 agen pembangun: 49 lulus, 0 gagal, stabil 3× jalan**
  (`~/workspace/audit-scratch/t4-v4.js`, stub DOM/canvas/Image mandiri):
  - **Struktural anti-penghalang (12 uji)**: tidak ada aturan generik
    `#stage canvas`; aturan sepenuh-panggung hanya menargetkan `#game`/`#hud`;
    `#avatarCanvas` memiliki width/height 84px eksplisit + `position: static`
    + `flex: none` + `border-radius: 50%`; tidak ada aturan avatar 100%;
    struktur HTML (avatar di dalam `#stage`, `assets.js` sesudah `game.js`,
    `#assetStatus`, label v4).
  - **Fallback (skenario 404 total)**: `PAM_ASSETS.failed = 5`,
    `applied = false`, semua `SPR` tetap sprite v3 (termasuk Titan jalur
    gambar v3) dan misi berjalan normal — game utuh tanpa aset.
  - **Aset teraplikasi**: `SPR.pIdle` 64×64, siklus lari 8 frame untuk semua
    7 senjata, kunci lompat Up/Diag lengkap, `rebelWalk`/`rebelWalkF` 8 frame,
    varian Grenade/Bazooka + siluet kilatan, `shieldWalk` terbukti TIDAK
    ditimpa, strip latar 960×270, `titanMech` 207×159; 600 langkah gameplay
    + render Titan cabang aset (termasuk pose salvo) + bunuh Rebel beraset
    menaikkan skor.
  - **Berkas di cakram**: dimensi kelima PNG persis manifest; total
    `assets/` 129 KB ≤ batas 1,2 MB; CREDITS.md memuat atribusi + URL sumber.
- **Verifikasi visual browser sungguhan** (Chromium headless via CDP,
  `file://`): aset termuat 5/5 & `applied: true`; gaya terhitung avatar
  **84×84 statis**; `elementFromPoint` di pusat tombol MULAI = tombol itu
  sendiri; tangkapan layar judul/gameplay/Titan disimpan di `previews/`
  (di luar repo & deploy, lihat `.gitignore`).
- **Regresi silang**: rangkaian audit v3 (143 uji `t3-*` + `t3-screen`)
  dijalankan ulang terhadap kode v4 — semua lulus kecuali SATU invariant
  lama yang memang digantikan desain v4: "semua rujukan `SPR.*` terdefinisi
  oleh `sprites.js`" kini tidak mencakup `SPR.titanAsset`, `SPR.titanMech`,
  `SPR.titanMechF` yang didefinisikan `assets.js` saat aset termuat
  (ketidakhadirannya adalah sinyal fallback dan dijaga `SPR.titanAsset &&`
  di `drawTitan`). Invariant itu perlu diperbarui agen pengoreksi menjadi
  "terdefinisi oleh sprites.js ATAU assets.js".
- **Audit independen agen pengoreksi untuk v4: SELESAI** — rangkaian uji
  terpisah dari nol (stub DOM/canvas/Image sendiri,
  `~/workspace/audit-scratch/t4-audit.js`): **66 uji lulus, 0 gagal**
  (sebelum perbaikan: 55 lulus, 11 gagal). Empat bug nyata ditemukan &
  diperbaiki: (1) pita damage core Titan tidak mengikuti core visual cabang
  aset (tembakan ke core menyala ×1, ke pinggang justru ×2) — kini pita
  mengikuti visual aktif (aset y+36..54, fallback y+57..75); (2) penghitung
  "POW" HUD di kanan atas tertabrak gugus tombol pojok — dipindah ke samping
  timer (tengah atas); (3) langit: lingkaran bokeh krem alpha 0,28–0,50 dan
  pita `band()` melintang — pita dihapus, awan ditulis ulang pipih & redup
  (alpha ≤0,14, mulus di periode 960), halo matahari dilembutkan; (4) teks
  status aset saat gagal sebagian menyesatkan ("peran itu memakai sprite
  cadangan") — kini jujur ("seluruh grafik memakai sprite cadangan (v3)").
  Diverifikasi pula: fallback penuh satu gaya untuk SEMUA pola kegagalan
  (total/tunggal/awal/akhir/tengah), aset tiba di tengah permainan aman,
  zona hantu kepala musuh terukur 20–22px (< ambang 25px, tidak diperbaiki).
  Bukti visual: pratinjau judul/gameplay/Titan di `previews/` digenerate
  ulang dari Chromium headless (fraksi piksel krem-bokeh di langit:
  0,63%→0,00%); `elementFromPoint` membuktikan tombol MULAI bisa diklik,
  avatar 84×84 statis, dan teks POW bebas tombol. Detail: entri "AUDIT v4"
  di KOREKSI.md.
- **Perbaikan mikro v4.1 (pasca-rilis live v4):** strip awan gambar-kode
  (`cloudStrip`) DICABUT TOTAL — gumpalan cakram + garis alas `fillRect`-nya
  masih terbaca seperti noda bergaris pada tangkapan layar live meski sudah
  diperkecil audit v4. Langit akhir = gradasi + bintang + halo matahari
  redup + lapisan gambar ansimuz (bgFar/bgMid); fungsi `drawCloudStrip`,
  kunci `SPR.cloudStrip`, dan gambar lapisannya di `render()` dihapus
  bersih (nol rujukan). Suite tetap 66/66 & 143+1 pola lama (asersi langit
  diperbarui menegaskan ketiadaan strip); `SPR.cloudStrip` terbukti
  `undefined` saat jalan; analisis piksel komposit latar pada 5 fase
  kamera: run terang-lokal terpanjang di wilayah langit hanya 2px, jauh
  di bawah lebar alas awan lama (90–150px). Pratinjau digenerate ulang.
  Detail: entri "v4.1" di KOREKSI.md.
- Belum diuji di HP fisik — tetap target uji berikutnya.

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
- PWA/offline penuh (manifest dasar sudah ada di v5; service worker belum).
- Suara announcer manusia — announcer masih teks + jingle sintesis.
- Angka damage hasil riset bersifat kualitatif; tuning sekarang perlu playtest rasa
  di HP sungguhan.

## Titik rawan untuk agen pengoreksi berikutnya (baru di v5)

1. **Rebase uji lama**: staging Titan di suite era v3 memakai geometri
   4600px (pemicu 4150, Titan x=4400) — geser +1800 untuk v5; "POW tepat
   7" kini 9; daftar kunci `SPR` kini memuat `tankAsset/tankFrames/
   tankFramesF/boomBig`; string A12 `t4-v4` masih menuntut "v4".
2. **Urutan loader assets.js**: set utama (5) → tank (indeks Image 6) →
   FX ledakan (7, 8). Loader terpisah menunggu `state.applied` lewat
   polling 50ms hingga 60× — di jaringan sangat lambat, periksa apakah
   tank/FX tetap teraplikasi (dan tidak pernah teraplikasi saat set
   utama gagal).
3. **Ledakan aset vs gambar-kode**: frame aset seragam 60×60 (pertumbuhan
   dari gambar di dalam bingkai), sedangkan gambar-kode bertumbuh lewat
   ukuran kanvas [24,39,51,60] — rasa ledakan kecil di mode fallback
   sedikit berbeda ukurannya; nilai di playtest.
4. **Musik lobi**: gestur pertama apa pun di judul (termasuk klik PENUH/
   PUTAR) memulai musik; setelah KE JUDUL dari pause/akhir, musik lobi
   baru mulai pada gestur berikutnya (stopMusic dipanggil transisi).
   Periksa di HP nyata apakah ini terasa janggal.
5. **Kamera lookahead + arena**: lookahead diredam terpisah
   (`CAM_LOOK_SMOOTH`) — saat pemain berbalik arah cepat di tepi arena,
   pastikan tidak ada frame di mana bos keluar layar (invariant uji
   memakai posisi diam; gerak dinamis belum teruji stub).
6. **Popup POW besar** memakai pool teks melayang yang sama dengan teks
   skor kecil (24 slot) — dalam baku tembak ramai, popup bisa saling
   menggantikan; nilai keterbacaannya di pratinjau & playtest.

## Titik rawan untuk agen pengoreksi berikutnya (baru di v4)

1. **Urutan muat `assets.js`**: penimpaan `SPR` terjadi asinkron setelah
   halaman tampil; satu-dua frame pertama layar judul bisa masih memakai
   sprite v3 sebelum aset tiba (±129 KB, umumnya <1 detik). Avatar digambar
   ulang oleh `assets.js`; periksa di jaringan lambat apakah pergantian
   visualnya terasa mengganggu.
2. **Proporsi sprite aset vs kotak tabrak**: frame aset pemain/musuh 64px
   digambar untuk kotak 60/39px — musuh tampak lebih besar dari kotak
   tabraknya (jangkar kaki sama; kepala menjulang ±21px di atas kotak).
   Disengaja (musuh seukuran pemain seperti Metal Slug), tetapi nilai
   keadilannya (tembakan yang "mengenai kepala" secara visual vs kotak)
   perlu penilaian playtest.
3. **Pose per-senjata hilang untuk pemain**: semua senjata memakai frame
   hero yang sama (satu meriam tangan besar) — variasi sprite per senjata
   v3 (senjata di tangan berbeda-beda) gugur demi aset asli. Mekanik &
   moncong tembakan tidak berubah.
4. **Titan tanpa lengan putar**: pada cabang aset, meriam menyatu di badan
   mech (pose tembak saat `burstN > 0`); sudut bidik lengan `armAng` tidak
   lagi terlihat. Pola serangan & titik lahir proyektil tidak berubah
   (dihitung dari logika, bukan dari gambar lengan). Posisi core berdenyut
   pada mech disetel ke (30, 40) relatif kotak — periksa visualnya saat
   core menyala putih (damage ganda) di pratinjau Titan.
5. **Palet remap Grenade/Bazooka** dilakukan per-rentang-rona HSV dari satu
   frame sumber yang sama dengan Rebel — di layar kecil ketiganya harus
   tetap mudah dibedakan (hijau / khaki / biru-baja).
6. **Strip latar aset & warna langit v3**: lapisan pegunungan ansimuz
   berpalet ungu-biru di atas gradasi senja oranye v3; garis horizon
   berpendar krem pada lapisan jauh adalah bagian asli karya ansimuz.
   Nilai keserasiannya dari `previews/preview-game.png`.

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
