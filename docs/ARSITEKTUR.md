# ARSITEKTUR PaM-ONG

Dokumen ini adalah peta sistem PaM-ONG untuk developer (manusia maupun agen AI)
yang ingin memahami, merawat, atau memperluas game ini **tanpa membedah mesin**.
Standar proyek: kode rapi & ringan, pemisahan concern antar berkas, semua angka
tuning lewat `CONFIG`, dan konten (musuh/senjata/zona) didefinisikan sebagai
**data**, bukan logika tersebar.

> Baca juga: [`../README.md`](../README.md) (panduan pemain & riwayat rilis) dan
> [`KOREKSI.md`](KOREKSI.md) (**wajib** sebelum mengubah kode — berisi semua
> pelajaran & kesalahan ronde sebelumnya agar tidak terulang).

---

## 1. Peta modul & tanggung jawab

Urutan muat di `index.html` adalah urutan ketergantungan — jangan diubah
sembarangan: `sprites.js` → `audio.js` → `game.js` → `assets.js`.

| Berkas | Pemilik concern | Isi | TIDAK boleh berisi |
|---|---|---|---|
| `index.html` | Kerangka halaman & DOM | Kanvas `#game`/`#hud`, layar judul/pengaturan/pause/ringkasan, tombol pojok (⛶ PENUH, ↻ PUTAR, 🔊, ❚❚), kontrol sentuh, elemen `#titleHi` (skor terbaik), `#assetStatus` | Logika game, gaya visual (itu milik CSS) |
| `style.css` | Presentasi halaman | Full-bleed 100dvw×100dvh, gradasi senja pengisi, rotasi CSS fallback (`body.rot`), kontrol menindih + safe-area | Aturan kanvas generik — aturan sepenuh-panggung **hanya** boleh menargetkan `#stage > #game` dan `#stage > #hud` (bug v4: aturan generik membuat avatar judul raksasa menutupi layar; avatar terkunci 84×84) |
| `sprites.js` | Sprite gambar-kode (prosedural) | Peta piksel semua sprite → offscreen canvas di objek global `SPR`; latar 4 lapis prerender; ubin tanah | Logika game. Peran ganda sejak v4: **fallback penuh** bila aset gambar gagal + pemasok peran yang belum beraset (POW, Shield, SV-001, Monster Laut, Di-Cokka versi gambar-kode) |
| `audio.js` | Semua suara | Objek `AUDIO`: sintesis SFX + musik chiptune WebAudio, kanal musik/SFX terpisah, patuh pengaturan `SETTINGS` | Referensi ke state game (game yang memanggil `AUDIO.sXxx()`) |
| `game.js` | Mesin game (satu-satunya pemilik logika) | `CONFIG`, tabel senjata, data level, state `G`, input, fisika, FSM musuh & 3 bos, Slug, kamera, loop fixed-timestep, render, HUD | Memuat berkas eksternal (itu milik `assets.js`); angka tuning di luar `CONFIG` |
| `assets.js` | Aset gambar asli (opsional) | Memuat PNG dari `assets/`, memotong frame atlas, menimpa entri `SPR`, membuat siluet kilatan putih, menggambar ulang avatar; status di `window.PAM_ASSETS`, loader tank terpisah `window.PAM_TANK`, loader FX terpisah `window.PAM_FX` | Mengubah mekanik — aset murni mengganti **sumber gambar**; kotak tabrak/timing/pola tidak berubah |
| `assets/` | Berkas gambar berlisensi | PNG aset + `CREDITS.md` (atribusi wajib CC-BY/CC0) | Aset tanpa lisensi jelas — **dilarang** aset rip dari game komersial |
| `docs/KOREKSI.md` | Memori koreksi antar-agen | Setiap kesalahan + penyebab + perbaikan + pelajaran | — |

### Aturan pemisahan yang dijaga

- `game.js` tidak tahu aset berasal dari mana: ia membaca `SPR.*` saja. Cabang
  visual (mis. Di-Cokka aset vs gambar-kode) memilih **sumber gambar**, bukan
  perilaku — mekanik identik di kedua cabang.
- `assets.js` tidak pernah wajib: game harus utuh & bisa tamat tanpanya.

---

## 2. Aliran data utama

### 2.1 Loop permainan (fixed timestep)

```
requestAnimationFrame → frame(ts)
  ├─ akumulasi dt; STEP = 1/60 (turun otomatis ke 1/30 bila lambat,
  │  naik lagi bila cepat) — maksimal 3 langkah per frame
  ├─ per langkah:
  │    ├─ bila G.hitStop > 0 → kurangi hitStop, DUNIA DILEWATI
  │    │  (input tetap ter-buffer — lompat di tepi hit-stop tidak hilang)
  │    └─ update(STEP)
  │         ├─ updatePlayer / updateSlug (input → gerak → pisau/tembak/granat)
  │         ├─ updateEnemies, updateSea, updateCokka, updateTitan
  │         ├─ updateProjectiles (peluru, granat, zona api, teks melayang)
  │         └─ kamera (deadzone + damping + lookahead — lihat §2.3)
  └─ render() ke kanvas #game, lalu renderHUD() ke kanvas #hud
```

Kunci desain rasa (v5):

- **Animasi berbasis jarak**: `runDist` diakumulasi dari perpindahan nyata;
  frame lari = `floor(runDist / CONFIG.RUN_CYCLE_DIST) % jumlahFrame` —
  kaki sinkron tanah, tidak meluncur, independen dari laju frame.
- **Juice terpusat**: `spawnFloatText()` (skor/popup melayang, pool 24),
  hit-stop berjenjang (`HITSTOP_KILL/MELEE/BOSSDEATH/BOSS`), screen shake,
  recoil senjata (`player.recoilT`), knockback musuh (`e.kbVx/e.kbT`).
- **Pool tetap, nol alokasi per frame** di jalur panas: peluru, peluru musuh,
  granat, partikel, zona api, teks melayang — semua didaur ulang
  (`resetPools()`).

### 2.2 Input

Dua sumber digabung di satu gerbang: `input(name)` = keyboard (`keys`) ATAU
sentuh (`touchKeys`). Sinyal tepi-muncul (`jumpPressed`, `grenadePressed`)
di-buffer agar tidak tertelan hit-stop atau pergantian langkah. Keyboard
dibersihkan saat window blur; tombol sentuh memakai pointer capture.
Layar penuh & putar landscape adalah **tombol manual** (⛶/↻) — tidak ada
fullscreen/rotasi otomatis dan tidak ada overlay jeda portrait (keputusan
pemilik sejak v3, jangan diubah).

### 2.3 Kamera

Kamera tidak menempel pemain: ada **deadzone** `CAM_DEADZONE` di sekitar
pusat; di luar itu target kamera dikejar dengan **damping** `CAM_SMOOTH`,
ditambah **lookahead** `CAM_LOOK_FACE` searah hadap + faktor kecepatan, yang
sendiri diredam `CAM_LOOK_SMOOTH`. Saat arena bos aktif (`G.arenaLock`),
target diklamp ke rentang arena — invariant yang dijaga uji: *pemain & bos
selalu terlihat bersama di keempat sudut arena*. Saat pemain mati kamera diam.

### 2.4 Sistem aset & fallback (assets.js)

Prinsip: **satu gaya penuh atau tidak sama sekali** — dilarang mencampur
gaya visual setengah-setengah.

```
assets.js dimuat terakhir
  ├─ Set utama (5 PNG: player, enemies, titan, bg-far, bg-mid)
  │    ├─ SEMUA berhasil → apply(): potong frame atlas, timpa entri SPR,
  │    │   buat siluet putih (…F) untuk hit-flash, gambar ulang avatar,
  │    │   PAM_ASSETS.applied = true
  │    └─ SATU pun gagal → tidak ada yang ditimpa; game memakai sprite
  │        gambar-kode sprites.js secara penuh (persis perilaku fallback v4)
  └─ Loader tank TERPISAH (tank.png, CC0) → PAM_TANK
       └─ hanya diterapkan bila set utama SUDAH applied; kegagalannya
           tidak mencemari fallback set utama. Mengisi
           SPR.tankFrames/tankFramesF/tankAsset untuk Di-Cokka.
  └─ Loader FX TERPISAH (explosion.png + explosion-big.png, CC0) → PAM_FX
       └─ syarat yang sama (set utama harus applied), tetapi kedua berkas
           INDEPENDEN satu sama lain: satu gagal hanya menggugurkan
           perannya sendiri (PAM_FX.boomApplied / PAM_FX.bigApplied).
           Mengisi SPR.boom / SPR.boomBig untuk partikel ledakan.
```

Render memilih cabang dari keberadaan kunci: mis. `drawCokka()` menggambar
frame `SPR.tankFrames` bila `SPR.tankAsset` ada, selain itu tank gambar-kode
`sprites.js`. Ketiadaan kunci **adalah** sinyal fallback — jangan menggantinya
dengan flag terpisah.

### 2.5 Penyimpanan lokal (localStorage)

| Kunci | Isi | Pemilik |
|---|---|---|
| `pamong-highscore` | Skor tertinggi (angka) | `game.js` — dibaca saat boot, ditulis `saveHighScore()` hanya bila rekor baru; tampil di layar judul (`#titleHi`), HUD (`HI …`), dan layar akhir ("REKOR BARU!") |
| kunci pengaturan | Musik/SFX/Getar (`SETTINGS`) | `game.js` — kunci usang dari versi lama diabaikan dengan aman |

---

## 3. Tuning lewat CONFIG (aturan keras)

Semua angka yang memengaruhi rasa main hidup di objek `CONFIG` di kepala
`game.js` — kecepatan, gravitasi, jangkauan pisau, kamera, hit-stop, HP &
skor bos, ambang pemicu, ukuran pool, dsb. **Dilarang angka sihir baru di
tengah logika.** Bila menambah mekanik, tambahkan dulu kuncinya ke `CONFIG`
dengan komentar satuan (px, detik, px/detik). Tabel data (senjata, level)
adalah satu-satunya tempat angka konten boleh tinggal di luar `CONFIG`,
karena tabel itu sendiri adalah konfigurasinya.

---

## 4. Cara menambah konten (data-driven)

### 4.1 Musuh baru

1. **Data**: satu baris di `ENEMY_DEFS` (di `game.js`) —
   `{ type: 'rebel', x: 760 }`, `{ type: 'grenade', x: 905, y: 158 }`.
   Tanpa `y` = berdiri di tanah; `y` = di platform/menara pada ketinggian itu
   (harus cocok dengan entri `PLATFORMS`/`TOWER_DEFS` di x tersebut — dijaga uji).
2. **Perilaku**: tipe yang sudah ada (`rebel`, `shield`, `grenade`, `bazooka`)
   langsung jalan — FSM bersama di `updateEnemies` + `damageEnemy`. Tipe yang
   benar-benar baru butuh cabang FSM sendiri + skor di jalur `killEnemy`.
3. **Gambar**: frame di `sprites.js` (atau atlas via `assets.js`); wajib ada
   varian normal + siluet putih `…F` untuk hit-flash; siklus lari dari
   `runDist` seperti musuh lain.
4. Objek musuh **wajib** diinisialisasi lengkap oleh `buildLevel()`
   (`runDist`, `kbT`, `kbVx`, …) — field yang hilang pernah membuat posisi
   `NaN` (lihat KOREKSI ronde v5). Uji tidak boleh merakit objek musuh
   setengah jadi; pakai objek dari `buildLevel()`.

### 4.2 Senjata baru

1. **Data**: satu entri di tabel `WEAPONS` —
   `hmg: { name: 'HEAVY MACHINE GUN', rate: 0.085, speed: 480, dmg: 1, diag: true, ammo: 200 }`.
   `rate` = jeda antar-tembakan (detik), `speed` px/detik, `diag: true`
   mengizinkan bidik diagonal, `ammo` absen = tak terbatas (pola pistol).
2. **Teks & ikon**: nama pengumuman di `WEAPON_ANNOUNCE`, kunci ikon di
   `WEAPON_ICON` (ikon digambar di `sprites.js`).
3. **Distribusi**: masukkan kunci senjata ke `POW_WEAPON_TABLE` agar bisa
   jadi hadiah POW, dan/atau jadikan isi peti di `CRATE_DEFS`.
4. Perilaku tembak khusus (pellet, homing, sinar, api) adalah cabang di
   jalur tembak `updateProjectiles` — pola yang sudah ada untuk
   shotgun/flame/laser/chaser; amunisi & kembali-ke-pistol saat habis/mati
   ditangani generik oleh `giveWeapon()` + HUD, tidak perlu kode baru.

### 4.3 Zona / perluasan level

1. **Lebar**: naikkan `CONFIG.LEVEL_W`; geser pemicu & arena bos di `CONFIG`
   (`SEA_TRIGGER_X`, `COKKA_TRIGGER_X`, `TITAN_TRIGGER_X`) serta klamp gerak
   bos di fungsi update-nya agar konsisten satu sama lain.
2. **Data per zona**: tambahkan entri pada `GROUND_SEGMENTS` (rentang jenis
   tanah), `ENEMY_DEFS`, `PLATFORMS`, `TENT_DEFS`, `TOWER_DEFS`, `FUEL_DEFS`,
   `CRATE_DEFS`, `POW_DEFS`, `DECOR` — semuanya array data di `game.js`;
   `buildLevel()` mengubahnya menjadi objek hidup.
3. **Invariant yang dijaga uji data** (langgar = uji merah, jangan dilonggarkan):
   - tidak ada jendela 300px tanpa musuh/dekorasi/pickup;
   - pasangan tong untuk ledakan berantai berjarak ≤ jangkauan rantai;
   - musuh ber-`y` berdiri tepat di platform/menara;
   - zona bos: pemicu < arena < posisi bos konsisten.
4. Bos baru mengikuti pola tiga bos yang ada: objek state sendiri +
   `updateXxx(dt)` + `drawXxx()` + entri `CONFIG` (HP, skor, pemicu) +
   `arenaLock` selama pertarungan + teks melayang skor saat mati.

---

## 5. Invariant & batasan yang tidak boleh dilanggar

- Resolusi internal **480×270**; target HP kelas bawah (Vivo Y12 / Helio P22).
- Langit **hanya** gradasi + bintang + halo matahari + lapisan gambar ansimuz.
  Dilarang dekorasi langit gambar-kode (ditolak mata manusia dua kali —
  lihat KOREKSI v4/v4.1).
- Setiap rilis wajib **gerbang visual**: tangkapan layar browser sungguhan
  (judul, gameplay, bos) diperiksa dengan mata. Uji stub tidak melihat
  presentasi.
- Pentasan foto/uji bos: tandai bos sebelumnya **selesai** (`active=true,
  dead=true`), jangan `active=false` — teleport melewati pemicu akan
  mengaktifkannya lagi dan mengacaukan adegan (KOREKSI ronde v5).
- Semua aset wajib gratis & berlisensi jelas (CC0/CC-BY + atribusi di
  `assets/CREDITS.md` dan layar judul). Tidak ada pembelian, tidak ada rip.
- Perubahan mekanik = ubah `CONFIG`/tabel data dulu; bila uji lama merah
  karena angka yang **sengaja** berubah (staging bos, hitungan POW, kunci
  `SPR` baru), catat di KOREKSI.md agar pengoreksi me-rebase ujinya —
  jangan "memperbaiki" kode demi angka lama.

---

## 6. Pengujian

Suite Node (stub DOM/canvas/WebAudio/Image mandiri) hidup di
`~/workspace/audit-scratch/` (di luar repo): `t5-v5.js` & `t5-assets.js`
(ronde v5), `t4-audit.js`, `t4-v4.js`, `t3-screen.js`, `t41-skycheck.js`,
rangkaian `t3-*`/`harness3.js`. Pratinjau visual dibuat
`t5-preview.js` (Chromium headless via CDP) ke `previews/` (di-.gitignore).
Pola emas: pembangun menulis uji fitur barunya; **agen pengoreksi terpisah**
menulis rangkaian auditnya sendiri dari nol, lalu semua koreksi dicatat di
`docs/KOREKSI.md`.
