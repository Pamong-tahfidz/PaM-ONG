# KOREKSI.md — Catatan Kesalahan & Perbaikan PaM-ONG

Dokumen ini adalah memori kesalahan proyek. **Aturan untuk semua agen yang menyentuh kode ini:**

1. Koreksi kesalahanmu sendiri segera begitu ketahuan — jangan serahkan kode rusak.
2. Setiap kesalahan yang ditemukan & diperbaiki, catat di sini: tanggal, kesalahan, penyebab, perbaikan, pelajaran.
3. Sebelum menulis kode baru, baca dokumen ini agar tidak mengulangi kesalahan yang sama.

Format entri: `## [tanggal] Judul singkat` lalu **Kesalahan**, **Penyebab**, **Perbaikan**, **Pelajaran untuk agen lain**.

---

## [2026-10-20] Rumus tembakan diagonal salah arah di `playerFire()`

**Kesalahan:** Cabang aim `'diag'` pada fungsi `spawn()` menghitung `vy = -speed * sin(ang)` dengan `ang ≈ 0` (ang hanyalah sudut sebaran kecil), sehingga peluru "diagonal" terbang lurus horizontal dengan kecepatan 0,707×. Ada pula cabang penimpa (`if (ang !== 0)`) yang menimpa hasil hitung sebelumnya dengan rumus berbeda, membuat perilaku tidak konsisten.

**Penyebab:** Dua pendekatan rumus vektor (basis sudut −45° vs. komponen manual) ditulis tercampur dalam satu fungsi saat draf pertama.

**Perbaikan:** Ditulis ulang satu jalur bersih per mode aim: `up` → `vx = sin(ang)·speed, vy = −cos(ang)·speed`; `diag` → sudut dasar −π/4 ditambah sebaran; `lurus` → `cos/sin` dikali arah hadap.

**Pelajaran untuk agen lain:** Untuk proyektil multi-arah, selalu turunkan vx/vy dari **satu sudut dasar per mode** (0, −π/4, −π/2) plus sebaran kecil. Jangan pernah mencampur rumus komponen manual dengan rumus sudut dalam fungsi yang sama.

## [2026-10-20] Variabel ganda identik pada logika perisai `damageEnemy()`

**Kesalahan:** Dua variabel `bulletFromFront` dan `hitsShield` menyimpan kondisi boolean yang persis sama, lalu digabung dengan `&&` — redundan dan menyesatkan pembaca soal logika penahan perisai.

**Penyebab:** Sisa salin-tempel saat menyusun draf logika perisai; tidak dibaca ulang sebelum lanjut.

**Perbaikan:** Ditinggal satu variabel `hitsShield` dengan komentar yang menjelaskan makna `fromDir` (arah gerak proyektil) vs `e.face` (arah hadap perisai).

**Pelajaran untuk agen lain:** Baca ulang setiap fungsi kerusakan/tabrakkan sebelum beralih menulis bagian lain. Kondisi duplikat adalah tempat bug logika bersembunyi.

## [2026-10-20] Dead code pada cabang kabur musuh & tembakan meriam boss

**Kesalahan:** (1) Cabang `flee` Shield Soldier berisi tiga baris manipulasi `e.x`, dua di antaranya no-op (`* 0`, `+= 0`). (2) `updateBoss()` menugaskan `g.vy` dua kali berurutan — nilai pertama (yang berisi sisa eksperimen `* 0`) langsung ditimpa dan tidak pernah berpengaruh.

**Penyebab:** Sisa eksperimen perhitungan arah yang tidak dibersihkan saat kode ditulis sekali jalan.

**Perbaikan:** `flee` menjadi satu baris `e.x += -e.face * 70 * dt` (kabur berlawanan arah hadap). `g.vy` boss menjadi satu penugasan parabola murni `−0.5 · GRAVITY · tFly`.

**Pelajaran untuk agen lain:** Dead code yang "tidak berbahaya" tetap berbahaya: agen berikutnya akan mengira baris itu bermakna dan membangun di atasnya. Hapus sisa eksperimen **pada saat itu juga**, bukan nanti.

## [2026-10-20] Input tepi bocor dari layar judul ke permainan

**Kesalahan:** Flag edge-trigger `jumpPressed`/`grenadePressed` hanya direset di akhir `update()` saat `screen === 'play'`. Menekan tombol C/X/K di layar judul menyalakan flag, dan flag itu bertahan sampai langkah pertama permainan — pemain langsung melompat/melempar granat begitu misi dimulai.

**Penyebab:** Pembersihan flag digabungkan ke jalur update permainan saja, tanpa mempertimbangkan transisi state layar.

**Perbaikan:** `startGame()` kini mereset `jumpPressed` dan `grenadePressed` sebelum permainan dimulai.

**Pelajaran untuk agen lain:** Flag edge-trigger harus dibersihkan di **setiap transisi state** (judul → main → ringkasan), bukan hanya di loop utama.

## [2026-10-20] Sisa konstanta & baris arena yang tidak berpengaruh

**Kesalahan:** Ada baris pembatas arena `p.x = Math.max(p.x, 0)` yang tidak mengubah perilaku apa pun, dan konstanta `CONFIG.ARENA_LEFT` yang tidak lagi dirujuk setelah logika arena disederhanakan menjadi "pemain tidak bisa melewati tank".

**Penyebab:** Penyederhanaan desain di tengah penulisan tanpa membersihkan sisa versi sebelumnya.

**Perbaikan:** Baris dan konstanta yatim dihapus; satu-satunya pembatas adalah `Math.min(p.x, boss.x - p.w - 2)` selama boss hidup.

**Pelajaran untuk agen lain:** Konstanta yatim menipu: pembaca berikutnya menyangka ada mekanisme arena yang ternyata tidak ada. Setelah menyederhanakan desain, grep nama konstanta lama dan hapus semua sisanya.

## [2026-10-20] Variabel `bob` idle yang selalu 0 di `drawPlayer()`

**Kesalahan:** `const bob = (kondisi) ? 0 : 0;` — kedua cabang ternary bernilai 0, jadi "animasi bob idle" yang terlihat seperti fitur sebenarnya tidak pernah melakukan apa-apa, dan membuang satu objek alokasi per frame (`{...pe, y: pe.y + bob}` dibuat baru setiap gambar).

**Penyebab:** Placeholder ditinggalkan seolah-olah fitur; maksud awal memakai 2 frame idle tidak pernah diselesaikan.

**Perbaikan:** Variabel dan objek salinan dihapus; `drawEntitySprite(img, pe, flip)` langsung. README diperbarui jujur: animasi idle masih 1 frame statis + daftar roadmap.

**Pelajaran untuk agen lain:** Jangan tinggalkan placeholder yang menyamar sebagai fitur, apalagi yang mengalokasi objek di jalur render per frame (melanggar aturan object pooling proyek ini). Kalau belum jadi, tulis di roadmap README — bukan di kode.

---

## [2026-10-20] Pointer capture tidak pernah dipasang — tombol sentuh bisa macet "menyala" (audit agen pengoreksi)

**Kesalahan:** Komentar di `bindTouchButton()` mengklaim pointer "dilacak per pointerId lewat pointer capture", tetapi `setPointerCapture()` tidak dipanggil di mana pun. Akibatnya, bila jari bergeser keluar dari tombol lalu diangkat, `pointerup` terkirim ke elemen lain dan `off()` tidak pernah jalan: `touchKeys` macet menyala (pemain terus menembak/bergerak sendiri). Selain itu `off()` mematikan tombol seketika walau masih ada jari kedua yang menahan tombol yang sama.

**Penyebab:** Penanganan multi-pointer ditulis seolah-olah capture aktif, tanpa pernah memasangnya; tidak ada pelacakan pointerId per tombol sama sekali.

**Perbaikan:** `bindTouchButton()` kini menyimpan `Set` pointerId aktif per tombol, memanggil `el.setPointerCapture(e.pointerId)` saat `pointerdown` (dibungkus try/catch untuk browser lama), dan `off()` hanya mematikan state bila tidak ada pointer lain yang masih menahan tombol itu.

**Pelajaran untuk agen lain:** Komentar yang mengklaim mekanisme keamanan input bukanlah bukti mekanisme itu ada — grep nama API-nya (`setPointerCapture`) untuk membuktikan. Dan untuk tombol sentuh: capture + hitung pointer aktif per tombol, bukan boolean tunggal.

## [2026-10-20] Input keyboard macet saat jendela kehilangan fokus & binding ganda saling menimpa (audit agen pengoreksi)

**Kesalahan:** (1) Tidak ada handler `blur`: bila pengguna pindah aplikasi/tab saat tombol masih ditekan, `keyup` terlewat dan aksi macet menyala permanen sampai tombol yang sama ditekan lagi. (2) Satu aksi diikat ke dua tombol fisik (Z dan J = tembak, X dan K = lompat, C dan L = granat), tetapi `keyup` salah satu tombol langsung mematikan aksi walau tombol pasangannya masih ditekan.

**Penyebab:** State input disimpan sebagai boolean tunggal per aksi, tanpa menghitung berapa tombol fisik yang sedang menahannya, dan tanpa jalur pembersihan saat fokus hilang.

**Perbaikan:** Ditambah `keyCounts` (hitungan tombol fisik per aksi; aksi menyala selama hitungan > 0) dan handler `window blur` yang melepas semua `keys`, `touchKeys`, flag tepi, hitungan, serta kelas visual `.on` pada tombol sentuh.

**Pelajaran untuk agen lain:** Setiap sistem input wajib punya jalur "lepas semua" untuk kehilangan fokus, dan aksi dengan banyak binding harus di-refcount — boolean tunggal selalu salah untuk dua kasus ini.

## [2026-10-20] Berjongkok membuat kaki melayang 7px; respawn mempertahankan tinggi jongkok (audit agen pengoreksi)

**Kesalahan:** `updatePlayer()` mengganti `p.h` (26 ↔ 19) tanpa menggeser `p.y`, sehingga setiap mulai/berhenti jongkok dasar kotak pemain melompat 7px: pemain melayang lalu jatuh singkat. Cacat yang sama terbawa ke `respawnPlayer()`: pemain yang mati saat jongkok bangkit dengan `h = 19` dan posisi y dihitung dari tinggi yang salah selama satu frame.

**Penyebab:** Tinggi kotak tabrakan diperlakukan sebagai nilai yang bisa diganti bebas, padahal y ditambatkan ke sisi atas — mengganti tinggi tanpa kompensasi menggerakkan sisi bawah (kaki).

**Perbaikan:** Saat `targetH !== p.h` dan pemain di tanah, `p.y += p.h - targetH` sebelum tinggi diganti (kaki tetap menapak). `respawnPlayer()` kini memulihkan `player.h = CONFIG.PLAYER_H` sebelum menghitung y.

**Pelajaran untuk agen lain:** Bila sebuah entitas ditambatkan ke tanah lewat sisi bawahnya, setiap perubahan tinggi WAJIB disertai kompensasi y sebesar selisihnya — dan semua jalur yang me-reset posisi (spawn, respawn) harus me-reset tinggi juga.

## [2026-10-20] Alokasi objek per frame di jalur panas TERULANG (audit agen pengoreksi)

**Kesalahan:** Pola yang sudah dikoreksi pada entri `bob` di atas muncul lagi di lima tempat: target homing roket membuat objek `{dx, dy}` baru per roket per langkah; loop peluru pemain & musuh membuat literal kotak tabrakan per peluru per langkah (kotak pemain bahkan dibuat ulang untuk SETIAP peluru musuh); render POW/musuh/pemain membuat literal `{x, y, w, h}` per entitas per frame; loop granat membuat literal kotak untuk uji tabrakan boss.

**Penyebab:** Literal objek terasa "kecil dan tidak berbahaya" saat ditulis, jadi aturan pooling hanya diterapkan ke entitas besar (peluru/partikel) dan dilupakan di kotak bantu sementara.

**Perbaikan:** Tiga kotak coretan dipakai ulang di level modul (`_box`, `_pbox`, `_ent`) — nilainya diisi ulang sebelum dipakai dan dibaca seketika oleh `overlap()`/`drawEntitySprite()`. Homing roket memakai skalar `bestDx/bestDy/hasBest`. Kotak pemain untuk peluru musuh dihitung sekali per langkah, di luar loop.

**Pelajaran untuk agen lain:** Aturan "tanpa alokasi di loop" berlaku juga untuk objek bantu sekecil apa pun — kotak tabrakan, kotak gambar, vektor target. Bila sebuah nilai hanya dipakai sesaat di tempat itu juga, pakai coretan modul yang dipakai ulang. Audit berikutnya: grep `= { x:` dan `{ dx:` di dalam fungsi update/render.

## [2026-10-20] Ubin platform terakhir meregang; konstanta yatim `MAX_PARTICLES`; teks announcer bocor ke layar judul (audit agen pengoreksi)

**Kesalahan:** (1) Platform digambar dengan `drawImage(img, dx, dy, dw, dh)` memakai lebar sisa ubin — bentuk 5 argumen ini MEREGANGKAN seluruh ubin 32px ke lebar sisa (mis. 6px), bukan memotongnya, sehingga tepi kanan semua platform tampak gepeng. (2) `CONFIG.MAX_PARTICLES` tidak dirujuk di mana pun (batas partikel sebenarnya ditegakkan `PARTICLE_POOL`) — pengulangan pola konstanta yatim dari entri lama. (3) Tombol "KE JUDUL" tidak membersihkan `G.announceText/announceT`, sehingga sisa teks announcer (mis. "Mission Complete!") ikut tampil di atas layar judul sampai 1,4 detik.

**Penyebab:** (1) Dua bentuk `drawImage` tertukar. (2) Konstanta duplikat makna ditinggal saat desain pool disederhanakan. (3) Transisi state layar tidak membersihkan state presentasi sesaat — keluarga yang sama dengan kebocoran flag tepi dulu.

**Perbaikan:** (1) Bentuk 9 argumen: `drawImage(SPR.woodTile, 0, 0, cw, 10, sx + x, pl.y, cw, 10)` (potong sumber). (2) `MAX_PARTICLES` dihapus dari CONFIG. (3) Handler `menuBtn` kini mengosongkan `announceT` dan `announceText`. Ditambah juga `-webkit-touch-callout: none` di CSS agar tekan-lama di iOS tidak memunculkan callout.

**Pelajaran untuk agen lain:** `drawImage` 5 argumen = regangkan, 9 argumen = potong; jangan tertukar. Setiap transisi state layar harus membersihkan SEMUA state sesaat (flag input, teks announcer, timer efek), bukan hanya yang terlihat bermasalah saat itu.

## [2026-10-20] Klaim README tidak akurat: "granat 10/nyawa" (audit agen pengoreksi)

**Kesalahan:** README menyebut granat "10/nyawa", padahal `respawnPlayer()` hanya mengisi ulang granat sampai minimal 3 (`Math.max(player.grenades, 3)`) — angka 10 hanya berlaku di awal misi. Dokumentasi yang melebihkan perilaku kode sama menyesatkannya dengan kode yang salah.

**Penyebab:** Ringkasan fitur ditulis dari niat awal, bukan dibaca ulang dari kode final.

**Perbaikan:** README diubah menjadi "10 di awal misi; seusai respawn granat terisi minimal 3".

**Pelajaran untuk agen lain:** Setiap angka di README (amunisi, HP, bonus, jumlah frame) harus bisa ditunjuk baris kodenya. Audit dokumen adalah bagian dari audit kode.

## [2026-10-20] UPGRADE v2 — Kolisi nama `drawTitan` antara sprites.js dan game.js

**Kesalahan:** `sprites.js` menamai pelukis sprite Titan `drawTitan()` dan `game.js` menamai perender Titan di layar juga `drawTitan(camX)`. Karena semua `<script>` klasik berbagi lingkup global, deklarasi terakhir (game.js) menimpa yang pertama: `buildSprites()` memanggil `drawTitan()` milik game.js → menyentuh konstanta `titan` yang belum terinisialisasi (TDZ) → game gagal boot total dengan `ReferenceError`.

**Penyebab:** Dua berkas, satu nama fungsi generik ("draw" + nama entitas) untuk dua peran berbeda (pelukis sprite vs perender entitas).

**Perbaikan:** Pelukis di `sprites.js` diganti nama menjadi `buildTitanSprite()`; perender di `game.js` tetap `drawTitan`. Ditangkap oleh uji asap Node sebelum sempat tayang.

**Pelajaran untuk agen lain:** Konvensi awalan wajib: pelukis sprite = `build*`/`draw*Sprite`, perender entitas = `draw*` di game.js saja. Setiap menambah fungsi global baru, grep dulu namanya di SEMUA berkas .js — kolisi nama lintas berkas tidak terdeteksi `node --check` per berkas.

## [2026-10-20] UPGRADE v2 — Kotak tabrak kepala Monster Laut tenggelam di bawah tanah

**Kesalahan:** Rumus `sea.head.y = GROUND_Y + 46 - 44 * rise` menaruh kotak kepala pada y=194..230 saat rise penuh — seluruhnya DI BAWAH permukaan tanah, sementara gambarnya digambar muncul di y=156..196. Akibatnya kepala tidak akan pernah bisa ditembak pemain.

**Penyebab:** Rumus kotak logika ditulis dari ingatan, bukan diturunkan dari rumus gambar (`drawImage` di `GROUND_Y + 4 - visH`). Dua sumber kebenaran untuk satu posisi.

**Perbaikan:** Satu rumus dipakai bersama: `sea.head.y = GROUND_Y + 4 - 42 * rise`, konsisten di buildLevel, updateSea (fase bertarung & sekarat), dan gambar. Terverifikasi uji asap: kotak tembak uji mengenai kepala saat rise ≥ 0,6.

**Pelajaran untuk agen lain:** Untuk entitas yang digambar dengan rumus offset/rise, kotak tabrak HARUS memakai rumus yang sama persis. Uji asap wajib menembak target dari geometri nyata, bukan memanggil fungsi damage secara langsung saja.

## [2026-10-20] UPGRADE v2 — Potongan sprite muncul dari sisi yang salah (kepala & tentakel laut)

**Kesalahan:** Awalnya kemunculan kepala/tentakel memakai potongan sumber dari BAWAH (`srcY = img.height - visH`) sehingga pangkal/dagu muncul lebih dulu dari air — kebalikan dari gerakan muncul ke atas.

**Penyebab:** Kebiasaan pola "potong dari bawah" untuk batang yang memanjang ke bawah diterapkan mentah-mentah pada objek yang muncul ke atas dari permukaan.

**Perbaikan:** Potongan sumber dari ATAS (`srcY = 0`, tinggi `visH`), tujuan digambar menempel permukaan air; ujung tentakel & puncak kepala muncul lebih dulu.

**Pelajaran untuk agen lain:** Untuk animasi muncul/tenggelam, tentukan dulu titik yang menembus permukaan lebih dulu, baru pilih sisi potongan sumbernya. Uji visual tidak bisa digantikan uji logika — catat sebagai titik periksa visual bagi pengoreksi.

## [2026-10-20] UPGRADE v2 — Roket Bazooka nyaris tidak bisa ditembak jatuh (geometri ketinggian)

**Kesalahan:** Roket bazooka lahir di `e.y + 6` dengan kotak tangkap 7×4, sedangkan peluru pemain terbang pada ketinggian moncong yang berbeda beberapa piksel — intersepsi sejajar (kasus paling umum) meleset di tepi kotak (`overlap` memakai pertidaksamaan ketat).

**Penyebab:** Angka lahir roket dan kotak tangkap dipilih tanpa menghitung contoh geometri nyata pemain-di-tanah vs bazooka-di-tanah/platform.

**Perbaikan:** Lahir roket `e.y + 5`, kotak peluru pemain dipertebal (h=3), kotak tangkap roket dilonggarkan menjadi 9×8 di sekitar badan roket. Terverifikasi uji asap: pemain di tanah menembak jatuh roket bazooka di tanah.

**Pelajaran untuk agen lain:** Setiap proyektil yang "bisa ditembak jatuh" wajib diuji dengan angka geometri sungguhan (ketinggian moncong pemain vs ketinggian terbang proyektil) — bukan hanya "fungsi tabrakannya ada".

## [2026-10-20] UPGRADE v2 — Kesalahan ketik string font & sisa dead code dalam penulisan sendiri

**Kesalahan:** (1) `hudCtx.font = 'bold 13px "Courier New", monospace";` — penutup string tertukar (`"` bukan `'`) → SyntaxError. (2) Beberapa dead code lolos dalam draf sendiri: ternari dua cabang identik untuk varian turet Slug, blok `else if` kosong untuk kedip kebal, loop kosong di `bulletHitWorld`, blok kosong di `startGame`, dan variabel tak terpakai `surfacing` di updateSea.

**Penyebab:** Menulis game.js dalam 7 tumpukan append besar lalu baru menjalankan `node --check` di akhir; peninjauan mandiri per tumpukan terlewat.

**Perbaikan:** String diperbaiki; semua dead code di atas dihapus/diganti logika nyata (varian turet Cannon kini sungguhan memakai `slug.cannonCd`). `node --check` dijalankan setelah tiap tumpukan mulai sekarang.

**Pelajaran untuk agen lain:** File besar ditulis bertahap = periksa sintaks SETIAP selesai satu tumpukan, bukan di ujung. Setelah menulis, grep hasil tulisanmu sendiri untuk pola malas: ternari bercabang sama, blok kosong `{}`, variabel yang hanya dideklarasikan.

## Titik rawan BARU v2 (untuk agen pengoreksi berikutnya) — STATUS SETELAH AUDIT v2 (2026-10-20)

1. ~~Laser vs Titan/Monster Laut/Di-Cokka tanpa penanda per-sinar~~ — **DIPERBAIKI** (lihat entri AUDIT v2: laser bos + nomor seri peluru).
2. ~~Pijakan menara 2 tidak selaras~~ — **DIPERBAIKI**; angka klaim awal keliru (bukan bazooka/12px; selisih nyata 5px vs lantai kabin) — lihat entri AUDIT v2.
3. `drawSlug()` memanggil `computeMuzzle()` saat render — terverifikasi fungsi murni tanpa efek samping; dibiarkan, tetap periksa kedua pemanggil bila logika moncong diubah.
4. ~~surfT Monster Laut tertunda~~ — **TERVERIFIKASI KONSISTEN**, bukan bug (lihat entri AUDIT v2 "Terbukti BUKAN bug").
5. Culling proyektil musuh memakai margin kamera (camX−60..+380) — **TERVERIFIKASI AMAN** untuk pola kiriman; tetap waspada bila kelak ada penembak di luar layar.
6. Laser menembus peti/tenda/tong/POW tanpa berinteraksi dan tidak bisa menembak jatuh roket (cabang laser hanya mengenai musuh & bos) — inkonsistensi kecil yang DIBIARKAN (desain sinar penembus); catat bila suatu saat laser terasa "melewati" objek dunia.
7. Kotak logika core Titan (x relatif 16..28) bergeser ±4px dari inti visual sprite (26..38 relatif gambar yang digambar di titan.x−6) — tumpang tindih sebagian besar; sempurnakan bila ada keluhan visual.


## [2026-10-20] AUDIT v2 — Laser memberi damage berkali-kali ke ketiga bos dalam satu sinar (titik rawan 1 TERBUKTI)

**Kesalahan:** Cabang laser di `updateProjectiles` memanggil `damageSea`/`damageCokka`/`damageTitan` tanpa penanda per-sinar. Terukur dengan uji asap agen pengoreksi (satu peluru laser dmg 2 ditembakkan relatif ke posisi bos): Titan badan kehilangan 12 HP (6 hit), core 16 HP (4 hit ×2), Di-Cokka 4 HP (2 hit, tertahan gerbang `hitT` 0,07 dtk), Monster Laut 4 HP (2 hit, juga via `hitT`). Komentar kode bahkan sudah menulis "damage sekali per target per peluru" — niatnya ada, implementasinya hanya untuk musuh biasa.

**Penyebab:** Penanda `laserMark` hanya ditambahkan ke objek musuh biasa saat fitur laser dibuat; tiga bos ditangani cabang terpisah yang tidak pernah diberi penanda. Gerbang `hitT` adalah gerbang *waktu*, bukan per-sinar, jadi tetap bocor 2× dan bergantung geometri/kecepatan relatif.

**Perbaikan:** Field `laserMark` ditambahkan ke `sea`, `cokka`, `titan` (direset di `buildLevel`); cabang laser kini memeriksa & memasang penanda sebelum memberi damage, menggantikan gerbang `hitT` untuk bos. Uji ulang: ketiga bos menerima tepat 1× damage per sinar (core Titan tepat 1× dengan pengali ×2).

**Pelajaran untuk agen lain:** Bila satu mekanisme punya daftar target yang tumbuh (musuh, lalu bos A, bos B, bos C), periksa SEMUA cabang penanganannya setiap kali target baru ditambahkan — perbaikan di cabang pertama tidak menular ke cabang lain.

## [2026-10-20] AUDIT v2 — Penanda laser memakai identitas objek pool: tembakan daur ulang bisa kebal

**Kesalahan:** `laserMark` menyimpan referensi objek peluru (`e.laserMark = b`). Peluru berasal dari pool dan dipakai ulang; bila objek yang sama kelak diaktifkan lagi sebagai tembakan laser baru ke target yang penandanya belum terganti, target menganggapnya sinar lama dan TIDAK menerima damage sama sekali. Terbukti saat agen pengoreksi menguji core Titan dengan tembakan kedua: delta HP 0.

**Penyebab:** Identitas objek pool ≠ identitas tembakan. Penanda dirancang saat laser pertama dibuat (pola v1 untuk musuh biasa) tanpa memikirkan siklus hidup pool.

**Perbaikan:** Nomor seri unik `bulletSerial`: setiap aktivasi peluru pemain di `playerFire` menaikkan `b.id = ++bulletSerial`; semua penanda laser (musuh biasa + ketiga bos) kini menyimpan & membandingkan `b.id`. Objek daur ulang selalu membawa nomor baru.

**Pelajaran untuk agen lain:** Jangan pernah memakai referensi objek pool sebagai identitas kejadian. Kejadian (tembakan, ledakan, spawn) butuh nomor seri monoton sendiri.

## [2026-10-20] AUDIT v2 — Core Titan tidak pernah terjangkau tembakan lurus

**Kesalahan:** `damageTitan` memberi pengali ×2 hanya bila kotak proyektil *tumpang tindih penuh* dengan kotak core (relatif x 16..28). Proyektil selalu berhenti di tepi depan badan Titan (x relatif ~0), jadi tembakan setinggi dada dari depan — cara pemain seharusnya mengenai core — selalu dihitung damage badan. Core ×2 praktis hanya terjangkau ledakan/zona api.

**Penyebab:** Uji core meniru geometri sprite, bukan geometri lintasan proyektil yang berhenti di kontak pertama.

**Perbaikan:** Core kini dinilai dari *pita vertikal*: proyektil yang mengenai badan Titan pada ketinggian pita core (titan.y+38..+50) dihitung mengenai core; tembakan ke kaki/kepala tetap damage normal. Terverifikasi: laser setinggi core = 1 hit ×2; setinggi badan bawah = 1 hit ×1; kotak uji langsung ke badan tetap ×1.

**Pelajaran untuk agen lain:** Untuk titik lemah di dalam kotak tabrakan yang lebih besar, tanyakan "bagaimana proyektil nyata mencapai titik ini?" sebelum memilih uji geometrinya.

## [2026-10-20] AUDIT v2 — Penyelarasan menara 2 (titik rawan 2: angka klaim keliru, selisih nyata 5px)

**Kesalahan:** Catatan titik rawan menyebut "Bazooka Soldier gy=128 vs platform y=140". Kode kiriman tidak cocok dengan klaim itu: yang berdiri di menara 2 adalah **Grenade Soldier** (x=2075) dan platformnya y=138 — kaki musuh sebenarnya sudah tepat di platform. Ketidakselarasan yang nyata: sprite menara digambar dengan lantai kabin di dunia y=143 (gambar di GROUND_Y−64, lantai kabin offset 15), sedangkan platform & musuh di y=138 — musuh terlihat berdiri 5px menembus kabin/atap menara.

**Penyebab:** Klaim titik rawan ditulis dari ingatan/draf, bukan diukur dari kode final; tidak ada konstanta bersama antara geometri gambar menara dan data platform.

**Perbaikan:** PLATFORMS {x:2050} dan Grenade Soldier x=2075 diselaraskan 138 → 144 (lantai kabin 143 ±1). Uji data: seluruh musuh ber-`y` kini berdiri tepat di platformnya, dan platform menara 2 selaras lantai kabin.

**Pelajaran untuk agen lain:** Titik rawan warisan tetap wajib diukur ulang dari kode kiriman — jangan memperbaiki angka dari catatan tanpa memverifikasi angka di kode; klaim yang keliru bisa menyembunyikan selisih yang sebenarnya.

## [2026-10-20] AUDIT v2 — Timer misi menumpuk "utang" saat pemain di dalam Slug

**Kesalahan:** Cabang timer hanya menangani `state === 'normal'`. Selama pemain di dalam SV-001, timer terus berkurang sampai 0 dan tertahan di sana; begitu pemain turun (manual, kebal hanya 0,5 dtk), tick berikutnya (≤1 dtk) memanggil `killPlayer()` — kematian tidak adil tanpa peringatan, padahal HUD menampilkan 0 sejak lama. Terukur uji asap: pemain yang timernya habis di dalam Slug mati pada tick pertama setelah turun.

**Penyebab:** Pola lama "flag/timer bocor antar-state": state baru (slug) ditambahkan tanpa meninjau ulang mesin timer yang ditulis untuk dua state (normal/dead).

**Perbaikan:** Bila timer mencapai 0 saat `state === 'slug'`, timer direset ke 30 tanpa membunuh (setara perlakuan state 'dead' yang tertutup kebal respawn). Perilaku di darat tidak berubah: habis saat jalan kaki tetap mati sekali & timer 30 (teruji).

**Pelajaran untuk agen lain:** Setiap state pemain baru wajib diaudit terhadap SEMUA mesin berkala global (timer, zona api, gelombang, target musuh) — bukan hanya input & render.

## [2026-10-20] AUDIT v2 — playerThrowGrenade: granat bisa −1 dan tipe terlempar salah (laten)

**Kesalahan:** `useFire` dihitung SEBELUM saklar tipe otomatis: pada keadaan (tipe='normal', granat=0, firebomb>0) fungsi mengganti tipe ke 'fire' tetapi tetap memakai `useFire=false` lama → cabang `player.grenades--` mengeksekusi (granat menjadi **−1**) dan yang terlempar granat BIASA. Terukur uji asap dengan menyetel state langsung: hasil {granat: −1, firebomb utuh, terlempar: biasa}. Jalur ini sulit dicapai permainan normal (addFirebombs selalu mengalihkan tipe), tetapi cacat logikanya nyata.

**Penyebab:** Nilai turunan (`useFire`) dibekukan dengan `const` sebelum mutasi yang seharusnya mengubahnya.

**Perbaikan:** `useFire` menjadi `let` dan dihitung ulang (`useFire = true`) di dalam cabang saklar tipe. Uji ulang: firebomb berkurang 1, granat tetap 0, yang terlempar fire bomb.

**Pelajaran untuk agen lain:** Bila sebuah fungsi mengganti mode/tipe di tengah jalan, hitung ulang semua nilai turunan setelah penggantian — atau lakukan penggantian SEBELUM turunan dihitung.

## [2026-10-20] AUDIT v2 — Cannon Slug: amunisi hangus saat pool granat penuh

**Kesalahan:** `slugFireCannon` mengurangi `slug.cannon` dan memasang cooldown SEBELUM `poolGet(grenades)`; bila pool granat sedang penuh, fungsi keluar tanpa menembak tetapi amunisi sudah berkurang. Terukur uji asap: pool diisi penuh → cannon 9 menjadi 8 tanpa peluru.

**Penyebab:** Urutan "bayar dulu, ambil sumber daya kemudian" — kebalikan dari `playerThrowGrenade` yang sudah benar (poolGet dulu, baru kurangi stok).

**Perbaikan:** `poolGet` dipindah ke depan; amunisi & cooldown hanya berubah bila peluru meriam benar-benar didapat.

**Pelajaran untuk agen lain:** Untuk aksi berbayar: periksa sumber daya → ambil dari pool → BARU kenakan biaya. Satu urutan yang benar di satu fungsi tidak menjamin fungsi kembarannya benar.

## [2026-10-20] AUDIT v2 — freePow: POW jembatan teleport ke tanah (pola kompensasi tinggi kambuh)

**Kesalahan:** `freePow` memasang `pw.y = GROUND_Y - 26` tanpa syarat saat tinggi POW berubah 20 → 26. Untuk POW di atas jembatan (kaki di dek y=138), kakinya melompat ke 192 — POW terlihat teleport menembus dek ke tanah/air. Ini pola persis koreksi lama "kompensasi y saat tinggi berubah", kambuh karena v2 menambahkan POW berplatform tanpa meninjau fungsi pembebas dari v1 (di v1 semua POW di tanah sehingga rumusnya kebetulan benar).

**Penyebab:** Rumus absolut (posisi tanah) dipakai untuk perubahan yang seharusnya relatif (jaga kaki).

**Perbaikan:** `pw.y = pw.y + pw.h - 26` sebelum `pw.h = 26` — kaki tetap di permukaan yang sama untuk semua POW (di tanah hasilnya identik dengan rumus lama). Terverifikasi uji: kaki POW jembatan tetap 138 setelah dibebaskan.

**Pelajaran untuk agen lain:** Saat mengganti tinggi/lebar entitas, selalu jangkar ke titik yang tidak boleh bergerak (kaki untuk karakter berdiri) — dan curigai setiap rumus absolut warisan saat konteks baru (platform, kendaraan) ditambahkan.

## [2026-10-20] AUDIT v2 — Reaksi berantai tong tidak pernah terpicu pada tata letak kiriman

**Kesalahan:** Fitur "tong meledak berantai" terdokumentasi, tetapi tong kiriman berada di x=1010, 1150, 2200: jarak antar-tong terdekat 140px, sedangkan jangkauan rantai ledakan besar hanya 42px dari pusat ke pusat. Tidak ada pasangan tong yang bisa saling memicu; fiturnya mati secara data. Kode rantainya sendiri benar (terverifikasi pada jarak ≤42).

**Penyebab:** Angka tata letak dan angka jangkauan dipilih terpisah tanpa uji keterjangkauan antar-tong.

**Perbaikan:** Tong kedua digeser 1150 → 1050 (pusat-ke-pusat 40 ≤ 42): satu pasangan berantai kini benar-benar ada di jalur pemain. Uji ulang pada tata letak kiriman: menembak tong pertama menghancurkan tong kedua, dan pemain yang berdiri di antaranya tetap tidak terluka (ledakan tong pemain tidak pernah `hostile`).

**Pelajaran untuk agen lain:** Fitur yang bergantung jarak/ambang wajib diuji pada DATA kiriman, bukan hanya pada unit yang diatur berdekatan.

## [2026-10-20] AUDIT v2 — Kode mati kambuh di v2 (fungsi yatim, sprite tak terpakai, cabang ganda)

**Kesalahan:** (1) `groundTopAt()` terdefinisi tetapi tidak pernah dipanggil. (2) `SPR.pRun` (6 canvas) dan `SPR.splash` + `drawSplash()` dibangun setiap boot tetapi tidak pernah dirujuk `game.js` (percikan air memakai partikel persegi). (3) Di `drawPlayer`, cabang lari memasang sprite yang sama dua kali — komentarnya menjanjikan komposisi berbeda ("idle-gun") yang tidak pernah ada.

**Penyebab:** Pola yang sama dengan entri dead code v2 sebelumnya: kode ditulis besar-besaran, pembersihan akhir hanya mengejar yang teringat.

**Perbaikan:** Ketiganya dihapus/disederhanakan (perilaku visual identik; canvas boot turun 207 → 197). Kehadiran/ketidakhadiran dibuktikan grep dua arah (definisi & rujukan) sebelum menghapus.

**Pelajaran untuk agen lain:** Sebelum menghapus "kode mati", buktikan nol rujukan dengan grep di SEMUA berkas; sebelum mengklaim bersih, grep juga pola: fungsi tanpa pemanggil, kunci objek tanpa pembaca, penugasan ganda identik.

## [2026-10-20] AUDIT v2 — Terverifikasi BUKAN bug (agar tidak "diperbaiki" ulang)

- **Titik rawan 4 (surfT Monster Laut):** state monster konsisten setelah pemain mati di tengah fase — fase berganti normal, `surfT` tereset per fase, dan monster terbukti menembak lagi pada fase berikutnya (uji: mati pada phaseT 1,1 → semburan terhitung ≥1 dalam 7 dtk pasca-respawn). Semburan yang terlewat hanya pada fase berjalan, sesuai desain satu semburan per kemunculan.
- **Titik rawan 5 (culling proyektil musuh):** aman untuk semua pola kiriman — diuji: roket pada camX+300, camX+370, dan camX−50 semuanya hidup; semua penembak hanya menembak saat di dalam/di tepi layar; rudal Titan lahir di dalam arena terkunci. Peringatan tetap berlaku untuk penembak luar-layar di masa depan.
- **Pengaturan & fullscreen & overlay:** terbukti uji — localStorage `pamong-settings` terbaca saat boot & tertulis saat toggle; kanal Musik/SFX benar-benar terpisah; getar aman di desktop; penolakan `requestFullscreen`/`orientation.lock` tidak merusak alur mulai; pause orientasi tidak menimpa pause manual; resume membersihkan flag tepi.
- **SV-001:** terbukti uji — masuk hanya dengan ATAS, Cannon = tombol granat, armor 3 → terlontar hidup + kebal, keluar BAWAH+B, Slug terkurung arena bos, suara rantai memakai satu interval yang dibersihkan.

## [2026-10-20] v3 — Baris peta piksel melebihi lebar kisi (helm musuh & typo spasi)

**Kesalahan:** Saat menggambar ulang sprite skala v3, dua baris peta piksel rusak: (1) baris helm `enemyTorso3` berisi 37 karakter pada kisi 36 kolom — komposisi torso musuh akan bergeser 1px dan terpotong; (2) baris sprite mati rata (`DIE_FLAT`) mengandung spasi di tengah string (`'pppppppo oo...'`) sehingga lebar baris berubah dan satu piksel kulit hilang. Keduanya lolos dari `node --check` karena secara sintaks valid.

**Penyebab:** Peta piksel ditulis tangan dalam jumlah besar; lebar baris tidak pernah diverifikasi mesin — mata manusia tidak bisa menghitung 36 karakter secara andal.

**Perbaikan:** Ditulis validator dimensi sekali jalan yang memeriksa SETIAP peta terhadap lebar/tinggi yang diharapkan sebelum komposisi dibangun. Baris helm dikurangi 1 titik; spasi pada `DIE_FLAT` dihapus. Setelah perbaikan validator menyatakan semua dimensi OK, dan validator yang sama dipakai ulang untuk seluruh sprite v3 (pemain, musuh, POW, bos, ubin, latar).

**Pelajaran untuk agen lain:** Untuk sprite peta piksel, `node --check` TIDAK cukup — selalu jalankan validator lebar/tinggi per baris. Spasi di tengah string baris adalah bug senyap: ia tidak mengubah sintaks, hanya geometri.

## [2026-10-20] v3 — Ekspektasi validator yang salah (lebar POW 24 vs 22)

**Kesalahan:** Validator dimensi v3 awalnya menuntut sprite POW selebar 24px dan melaporkan "kegagalan" pada berkas yang sebenarnya benar: peta POW memang digambar 22px lebar (dengan hitbox 19px di `game.js`, konsisten). Satu-satunya yang salah adalah angka ekspektasi di alat uji.

**Penyebab:** Angka ekspektasi disalin dari ingatan ukuran v2 yang dibulatkan, bukan dihitung dari peta yang digambar.

**Perbaikan:** Lebar setiap baris peta POW dihitung ulang manual per baris (22), ekspektasi validator dikoreksi ke 22, dan seluruh rujukan silang (hitbox `POW_DEFS`/`buildLevel`, kompensasi `freePow`) diverifikasi terhadap angka yang sama.

**Pelajaran untuk agen lain:** Saat alat uji berteriak, curigai alat ujinya juga. Tetapkan angka dari sumber primer (peta/konstanta di berkas), bukan dari ingatan rencana — dan catat mana yang dikoreksi: kode, atau ujinya.

## [2026-10-20] v3 — "Kegagalan" uji semu karena melanggar invariant progresi game

**Kesalahan:** Rangkaian uji asap v3 pertama melaporkan 10 kegagalan yang tampak seperti bug game, padahal semuanya artefak cara uji meneleportasi pemain & membaca konstanta dari ingatan: (1) Titan "tidak menerima damage laser" — uji menaruh Titan di x=1000, tetapi `updateTitan` mengklamp Titan ke arena sahnya (4250..4496) sehingga peluru menembus ruang kosong; (2) pola Titan "tidak pernah lahir" — gelombang/rudal dibuang culling berbasis kamera karena `G.camX` belum menetap di arena; (3) pemain "terdorong" ke x=3679 saat uji Titan — uji melompati Di-Cokka (yang belum mati) sehingga klamp dinding Cokka yang sah menahan pemain; (4) uji jongkok mengasumsikan kaki di GROUND_Y padahal pemain baru saja mendarat di DEK JEMBATAN (platform satu-arah menangkap lompatan dari atas); (5) ekspektasi angka dari ingatan: TITAN_HP disangka 300 (berkas: 240, skala ×1,2 dari v2), pool granat disangka 24 (berkas: 64).

**Penyebab:** Uji ditulis dari rencana & ingatan, bukan dari invariant kode yang dikirim: klamp arena bos, culling kamera, urutan progresi antar-bos, dan konstanta CONFIG.

**Perbaikan:** Setiap kegagalan diisolasi per fungsi update (memanggil `updateSea`/`updateTitan`/`updateProjectiles` satu-satu dan mengintip state) sebelum satu baris kode game pun diubah — hasilnya: nol perubahan kode game; semua perbaikan ada di uji (Titan diuji di dalam arenanya, `G.camX` disetel ke arena, Cokka ditandai mati sebelum uji Titan, posisi uji memakai permukaan yang benar, angka dibaca dari `CONFIG`). Setelah itu 149/149 uji lulus.

**Pelajaran untuk agen lain:** Teleportasi dalam uji melanggar invariant yang dijaga gameplay (arena lock, progresi bos, kamera). Bila uji gagal secara aneh, isolasi per fungsi dan buktikan dulu apakah yang salah kode atau panggung ujinya — jangan "memperbaiki" kode yang benar agar cocok dengan uji yang salah.

## [2026-10-20] AUDIT v3 — Kamera arena dipaku di tepi kiri: 255px arena Monster Laut tidak terlihat

**Kesalahan:** Saat `arenaLock` aktif, target kamera dipaku ke `minX - 15`. Untuk arena Monster Laut {40, 760} kamera menetap di camX=25 (jendela 25..505), padahal pemain boleh berjalan sampai x=738 dan titik muncul kepala terjauh di 580: pemain bisa berjalan KELUAR LAYAR sepenuhnya, kepala di titik 580 tidak terlihat, dan bola airnya mati ter-cull seketika (lahir di x=580 > camX+540=565). Cacat yang sama lebih ringan di dua arena lain (tepi kanan Di-Cokka/Titan bisa 29px di luar layar). Terukur uji audit: pemain di dinding kanan arena laut berada di screen x=713 (viewport 480).

**Penyebab:** "Kamera terkunci" ditafsirkan sebagai "kamera diam di tepi kiri arena", bukan "kamera tidak pernah keluar dari rentang arena". Rumus warisan ini tidak pernah diuji terhadap lebar viewport baru 480 (di 320 cacatnya lebih kecil dan lolos audit v2).

**Perbaikan:** Target kamera kini target ikuti-pemain yang DIKLAMP ke rentang [minX−15, maxX−VIEW_W+15] arena. Terverifikasi uji: pemain di dinding kanan arena laut tetap terlihat penuh (screen x ≤ 460), bola air dari titik 580 lahir & hidup, seluruh badan Titan (tepi kanan) di dalam layar.

**Pelajaran untuk agen lain:** Setiap rumus kamera/arena wajib diuji pada EMPAT sudut: pemain di minX, pemain di maxX, bos di posisi ekstremnya, proyektil terjauh bos — semuanya harus berada di dalam viewport pada resolusi yang dikirim.

## [2026-10-20] AUDIT v3 — Salvo rudal Titan selalu mendarat ~30% jalan (pola mati secara angka)

**Kesalahan:** `titanMissile` memakai `vx = (tx - r.x) / 1.25 * 0.5` — mengandaikan waktu terbang 1,25s lalu mengoreksi setengahnya. Waktu terbang NYATA rudal (vy0 −225, gravitasi 0.8·GRAVITY=1080, jatuh 135px dari titan.y+12 ke tanah) adalah 0,75s, jadi rudal hanya menempuh 0,3× jarak ke sasaran. Terukur: salvo ke pemain diam pada jarak tempur 150px mendarat dengan |dx| minimum 79px dari pusat pemain — radius ledakan hanya 45, jadi pola rudal TIDAK PERNAH bisa mengenai pemain yang diam sekalipun. Kelas cacat yang sama dengan "rantai tong tidak terpicu" audit v2: fitur mati secara angka, bukan secara kode.

**Penyebab:** Konstanta tFly ditebak dari rasa, bukan diturunkan dari persamaan gerak yang dipakai fungsi update rudal itu sendiri (gravitasi & ketinggian lahirnya ada di berkas yang sama).

**Perbaikan:** `vx = (tx - r.x) / 0.75` dengan komentar penurunan 0,75s di kode. Terukur ulang: min |dx| = 9px — salvo mendarat tepat di posisi pemain; pemain harus bergerak/melompat untuk menghindar, sebagaimana mestinya pola bos.

**Pelajaran untuk agen lain:** Untuk proyektil berlintasan lengkung yang "menarget posisi", turunkan waktu terbang dari vy0, gravitasi, dan beda ketinggian yang BENAR-BENAR dipakai update-nya, lalu uji: target diam pada jarak tempur wajar harus terkena. Pola serangan yang tidak bisa mengenai target diam adalah bug, bukan "tuning".

## [2026-10-20] AUDIT v3 — Laser menembus musuh pada fallback 30fps (tunneling lattice)

**Kesalahan:** Pada STEP 1/30 (fallback fps), sinar laser bergerak 840/30 = 28px per langkah, sedangkan jendela tabrakan musuh selebar 23+5 = 28px dengan pertidaksamaan ketat — tepat SATU fase lattice membuat sinar melompat dari `e.x-5` ke `e.x+23` tanpa pernah tumpang tindih: tembakan laser menembus musuh tanpa damage. Terukur uji audit: 1 dari 14 fase offset gagal pada dt=1/30 (pada 60fps langkah 14px < jendela, aman).

**Penyebab:** Kotak tabrakan laser adalah kotak TITIK di posisi akhir langkah; kecepatan×langkah terbesar tidak pernah dibandingkan dengan lebar target tersempit.

**Perbaikan:** Kotak laser kini menutupi SEGMEN yang ditempuh langkah itu (dari posisi sebelum integrasi ke posisi sesudah, +5/+4). Mekanisme satu-damage-per-sinar (nomor seri) tidak berubah. Terukur ulang: 0 miss dari 14 fase pada dt=1/30.

**Pelajaran untuk agen lain:** Setiap proyektil wajib memenuhi: kecepatan × dt_terbesar ≤ lebar target tersempit + lebar kotak proyektil — atau gunakan kotak sapuan segmen. Uji tunneling harus memakai dt fallback (1/30), bukan hanya 60fps.

## [2026-10-20] AUDIT v3 — Sisa baris peta piksel ragged (klaim validator v3 tidak lengkap)

**Kesalahan:** Validator dimensi agen upgrade menyatakan semua peta OK, tetapi validator audit menemukan 7 baris ragged: `BODY_DIAG` baris 3 selebar 35 (kisi 36), `DIE_FLAT` baris 5 selebar 53 (kisi 54), dan 5 baris lengan `enemySprite3` selebar 35 (kisi 36). Ketiganya selamat karena `spr()` mengambil lebar MAKS baris sebagai lebar canvas — baris yang lebih pendek tidak menggeser apa pun, hanya diam-diam lebih sempit.

**Penyebab:** Validator v3 memeriksa lebar canvas HASIL (yang selalu = maks) dan/atau sebagian peta, bukan SETIAP baris terhadap lebar kisi yang diharapkan.

**Perbaikan:** Ketujuh baris ditambah tepat 1 karakter '.' — yang kurang memang selalu padding transparan di tepi kanan (piksel opak terakhir jauh dari tepi), jadi nol perubahan visual; invariant "setiap baris selebar kisi" kini benar-benar berlaku dan validator audit (78 peta terurai dari sumber) menyatakan 0 ragged.

**Pelajaran untuk agen lain:** Validator peta piksel yang benar memeriksa PANJANG SETIAP BARIS terhadap kisi, bukan dimensi canvas hasil — canvas hasil selalu tampak benar karena memakai nilai maksimum.

## [2026-10-20] AUDIT v3 — Diagnosis yang DITARIK: bola air Monster Laut (bukan tunneling)

**Kesalahan:** Agen pengoreksi awalnya mencurigai bola air sulit ditembak jatuh karena tunneling kotak tangkap (interseksi tembakan beruntun baru terjadi pada langkah ke-46 dari 54) dan sempat memperlebar kotak tangkapnya menjadi 11×10.

**Penyebab:** Diagnosis dibuat sebelum lintasannya diukur: bola air melengkung NAIK ke puncak y≈130 — jauh di atas garis tembak lurus pemain (y≈193) — dan baru turun memasuki garis tembak di fase akhir penerbangan. Jeda intersepsi adalah geometri busur, bukan kotak tabrak; pelebaran kotak tidak mengubah angka sama sekali (46 → 46).

**Perbaikan:** Pelebaran kotak DIBATALKAN (kembali 7×7 seperti kiriman). Bukti final: bola ditembak jatuh oleh tembakan beruntun sebelum mengenai pemain, dan bola yang sama MEMBUNUH pemain diam bila tidak ditembak — mekanik "bisa ditembak jatuh" terbukti hidup apa adanya.

**Pelajaran untuk agen lain:** Ukur lintasan (posisi per langkah) sebelum menyalahkan ukuran kotak. Perbaikan yang tidak mengubah angka terukur bukanlah perbaikan — tarik kembali dan catat penarikannya di sini.

## [2026-10-20] AUDIT v3 — Terverifikasi BUKAN bug (agar tidak "diperbaiki" ulang)

- **Timer habis saat state 'dead':** timer memang tertahan di 0 selama animasi mati, tetapi tick pertama setelah respawn selalu tertutup kebal respawn 2 detik (killPlayer no-op) dan timer direset ke 30 oleh cabang yang sama. Teruji empiris: pemain yang mati dengan timer=1 mati tepat satu kali. Berbeda dari kasus Slug audit v2 karena di sana pemain langsung bisa dikendalikan tanpa kebal.
- **Keadilan spawn penembak:** lemparan granat pertama terjadi saat musuh sudah di sx=88 (di dalam layar) dan roket bazooka pertama di sx=55 — syarat spawn (camX+525) + ambang jarak tembak membuat proyektil pertama selalu lahir terlihat; klaim "menembak dari luar layar" tidak terbukti pada data kiriman.
- **Reskala ×1,5 konsisten:** lompatan terukur 159,3px (teori 163,8); seluruh 9 transisi platform jalur atas/jembatan terjangkau dalam simulasi input nyata; Slug bisa lewat DI BAWAH maupun lompat KE ATAS jembatan 2; tidak ada konstanta era 320×224 yang bocor (grep angka mencurigakan hanya mengenai koordinat data level); 97 fungsi game.js tanpa yatim, 42 kunci CONFIG semuanya terpakai, nol kolisi nama antar-berkas.
