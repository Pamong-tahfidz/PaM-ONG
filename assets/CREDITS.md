# CREDITS.md — Atribusi Aset PaM-ONG (v5)

Semua aset gambar di folder ini **gratis dan berlisensi jelas**. Tidak ada
satu pun aset hasil rip dari game komersial (Metal Slug/SNK atau lainnya).

## 1. Karakter pemain, musuh & bos Titan — "Open Gunner" oleh Master484

- **Sumber:** OpenGameArt.org
  - "Open Gunner Starter Kit" — https://opengameart.org/content/open-gunner-starter-kit
  - Berkas yang dipakai: `OpenGunnerHeroVer2.png`, `OpenGunnerEnemySoldier_0.png`, `OpenGunnerMechs.png`
- **Pembuat:** Master484 (M484 Games) — http://m484games.ucoz.com/
- **Lisensi:** **CC-BY 3.0** (+ OGA-BY) — tertulis di halaman sumber dan di
  kaki setiap sheet ("MADE BY MASTER484, LICENSE: CC-BY 3.0"). Atribusi ini
  adalah pemenuhan syarat lisensinya.
- **Pemakaian di game ini (dengan ubahan seperlunya, diizinkan CC-BY):**
  - `player.png` — hero Open Gunner dipotong per frame dari sheet-nya:
    berdiri, lari (8 frame), lompat, jongkok, bidik diagonal/atas, lempar,
    meluncur, tiarap. Diskala 4/3 (nearest-neighbor) ke dunia 480×270.
  - `enemies.png` — prajurit musuh Open Gunner, di-mirror agar menghadap
    kiri sesuai konvensi game. Rebel memakai warna asli; Grenade Soldier
    memakai remap palet cokelat-khaki; Bazooka Soldier memakai remap palet
    biru-baja + senjata digelapkan (keduanya turunan dari frame yang sama).
  - `titan.png` — mech hijau Open Gunner (berdiri + 2 pose tembak),
    di-mirror, diskala 3/2, sebagai badan Robot Titan.

## 2. Latar pegunungan & hutan — "Mountain at Dusk Background" oleh ansimuz

- **Sumber:** OpenGameArt.org —
  https://opengameart.org/content/mountain-at-dusk-background
  (paket `parallax_mountain_pack.zip`, folder `layers/`)
- **Pembuat:** Luis Zuno (@ansimuz) — ansimuz.com
- **Lisensi:** **CC0** (Public Domain) — tertulis di halaman sumber dan di
  `license.txt` di dalam paket unduhannya.
- **Pemakaian di game ini:**
  - `bg-far.png` — lapisan `parallax-mountain-montain-far.png` +
    `parallax-mountain-mountains.png` dikomposit menjadi strip 960×270
    (parallax 0.3). Kedua lapisan mulus (seamless) secara bawaan; lebar
    tile diselaraskan ke pembagi 960 agar sambungan gulir tak terlihat.
  - `bg-mid.png` — lapisan `parallax-mountain-trees.png` +
    `parallax-mountain-foreground-trees.png` dikomposit menjadi strip
    960×270 (parallax 0.6).

## 3. Tank Di-Cokka — "2D Side scrolling tank" oleh 2D Tyrant (baru di v5)

- **Sumber:** OpenGameArt.org —
  https://opengameart.org/content/2d-side-scrolling-tank
- **Pembuat:** 2D Tyrant
- **Lisensi:** **CC0** (Public Domain) — tertulis di halaman sumber.
- **Pemakaian di game ini:**
  - `tank.png` — sheet sumber 600×200 berisi 3 frame; tiap frame dipotong
    (konten 136×52) dan di-mirror horizontal agar menghadap kiri, disusun
    menjadi strip 408×52. Perbedaan antar-frame hanya animasi roda/rantai —
    persis kebutuhan bos tank yang bergerak maju-mundur.
  - Dipakai **hanya untuk Di-Cokka**, lewat loader terpisah di `assets.js`
    (`window.PAM_TANK`): diterapkan hanya bila set utama (bagian 1–2)
    berhasil penuh; bila gagal, Di-Cokka memakai tank gambar-kode proyek.
  - **Tidak dipakai untuk SV-001**: pada aset ini turet menyatu & diam,
    sedangkan SV-001 butuh turet putar 8-arah yang bisa diekspresikan
    pemain; proporsi badannya juga tidak pas dengan kotak Slug. SV-001
    tetap gambar-kode proyek (badan + turet terpisah di `sprites.js`).

## 4. Ledakan — "Explosion Set 2" oleh Master484 (baru di v5)

- **Sumber:** OpenGameArt.org —
  https://opengameart.org/content/explosion-set-2-m484-games
  (berkas `M484ExplosionSet2.png`; teks "LICENSE: PUBLIC DOMAIN / CC0"
  tercetak di kaki sheet-nya sendiri)
- **Pembuat:** Master484 (M484 Games) — http://m484games.ucoz.com/
- **Lisensi:** **CC0** (Public Domain) — tertulis di halaman sumber dan di
  sheet. Atribusi tidak diwajibkan; tetap dicantumkan sebagai terima kasih.
- **Pemakaian di game ini (olahan berat, diizinkan CC0):**
  - Siluet jamur api dari sheet diambil per sel 30×30, latar hitam diubah
    menjadi alfa, lalu di-remap ke gradasi api berlapis (tepi merah gelap
    → oranye → kuning → inti pucat) memakai pita erosi masker.
  - `explosion.png` — 4 frame (baris kuning) → `SPR.boom`: ledakan biasa.
  - `explosion-big.png` — 4 frame (baris merah, palet lebih panas + pijar
    tepi) → `SPR.boomBig`: ledakan besar (bos, Slug hancur, tong rantai),
    dipilih render dari flag partikel `boomBig`.
  - Dimuat loader terpisah `assets.js` (`window.PAM_FX`) dengan semantik
    yang sama seperti tank: hanya diterapkan bila set utama berhasil
    penuh; gagal → ledakan gambar-kode proyek.
  - Dievaluasi juga "Explosion Set 1" (Master484, CC0) dari sumber yang
    sama — gaya cincin/busa-nya kurang cocok sebagai bola api utama,
    jadi **tidak dipakai** (keputusan tercatat di `docs/KOREKSI.md`).

## 5. Wajah web: logo & ikon (karya proyek sendiri, sumber tunggal)

- `logo.png` (root proyek) — wordmark "PaM-ONG" digambar sendiri oleh
  proyek (huruf Liberation Sans Bold — font berlisensi SIL OFL 1.1 —
  diwarnai gradasi kuning-oranye, garis tepi gelap, bayangan merah,
  meniru gaya logo CSS v1–v4). Ditampilkan di layar judul sebagai
  `img#titleLogo` berukuran terkunci.
- **Semua ikon diturunkan dari `logo.png` yang sama** (satu wajah merek):
  - `icon-512.png`, `icon-192.png`, `apple-touch-icon.png` — wordmark
    utuh logo.png di atas persegi gradasi senja panggung.
  - `favicon.ico` (16/32/48) & `favicon-32.png` — **varian ukuran kecil
    yang disederhanakan**: potongan huruf "P" dari logo.png sendiri di
    atas persegi senja, agar siluet tetap terbaca tegas pada 16px
    (wordmark utuh tidak akan terbaca pada ukuran itu).
  - `og:image` & `twitter:image` juga menunjuk `logo.png`.
- Berkas-berkas ini adalah berkas web (logo/ikon), **bukan** aset
  gameplay — tidak dihitung dalam daftar aset fungsional game.

## 6. Bukan aset unduhan (tetap gambar-kode proyek, dibuat dari nol)

Peran berikut **tidak** diganti aset unduhan karena tidak ditemukan
aset berlisensi jelas yang cocok gayanya; sprite-nya digambar prosedural
oleh kode proyek sendiri (`sprites.js`, bebas hak cipta pihak ketiga):
langit senja, ubin tanah/jembatan/platform, POW, Shield Soldier,
SV-001 (alasan teknis di bagian 3), Monster Laut & tentakelnya,
tenda/gudang/menara, peti, tong bahan bakar, ikon senjata/pickup,
efek ledakan/partikel, potret HUD. Di-Cokka memiliki **dua** sumber
gambar: aset CC0 di bagian 3 (utama) dan gambar-kode (fallback).

## Catatan proses

- Sheet sumber dipotong dengan skrip (pendeteksian kotak frame putih +
  penghapusan warna latar menjadi transparan). Tidak ada piksel yang
  digambar ulang selain: mirror horizontal (musuh & Titan), remap palet
  HSV terbatas pada rona hijau seragam (varian Grenade/Bazooka), dan
  skala nearest-neighbor.
- Total ukuran folder `assets/` ≈ 139 KB (8 berkas PNG).
