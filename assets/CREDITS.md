# CREDITS.md — Atribusi Aset PaM-ONG v4

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

## 3. Bukan aset unduhan (tetap gambar-kode proyek, dibuat dari nol)

Peran berikut **tidak** diganti aset unduhan pada v4 karena tidak ditemukan
aset berlisensi jelas yang cocok gayanya; sprite-nya digambar prosedural
oleh kode proyek sendiri (`sprites.js`, bebas hak cipta pihak ketiga):
langit senja & awan, ubin tanah/jembatan/platform, POW, Shield Soldier,
SV-001, Di-Cokka, Monster Laut & tentakelnya, tenda/gudang/menara, peti,
tong bahan bakar, ikon senjata/pickup, efek ledakan/partikel, potret HUD.

## Catatan proses

- Sheet sumber dipotong dengan skrip (pendeteksian kotak frame putih +
  penghapusan warna latar menjadi transparan). Tidak ada piksel yang
  digambar ulang selain: mirror horizontal (musuh & Titan), remap palet
  HSV terbatas pada rona hijau seragam (varian Grenade/Bazooka), dan
  skala nearest-neighbor.
- Total ukuran folder `assets/` ≈ 129 KB (5 berkas PNG).
