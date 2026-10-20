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

## [2026-10-20] v4 — Avatar judul RAKSASA menutupi seluruh layar (bug presentasi lolos semua uji stub)

**Kesalahan:** Di layar judul v3, canvas avatar (potret 108×108) tergambar sebesar ±95%×100% panggung, menutupi logo, kotak instruksi, dan tombol MULAI MISI — klik ke tombol tertolak karena tertutup avatar. Pemilik menemukannya saat memainkan versi live; gameplay sendiri bersih.

**Penyebab:** Aturan CSS generik `#stage canvas { position:absolute; left:0; top:0; width:100%; height:100% }` ikut berlaku ke `#avatarCanvas` (yang tinggal di dalam `#stage`). Spesifisitasnya (1 ID + 1 elemen) mengalahkan aturan `#avatarCanvas { width:96px; height:96px }` (1 ID saja). Semua uji v1–v3 adalah stub Node yang tidak pernah merender CSS/DOM sungguhan, jadi tidak ada satu pun uji yang bisa melihatnya.

**Perbaikan:** Struktural, bukan tambal spesifik satu elemen: (1) aturan canvas sepenuh-panggung dibatasi eksplisit menjadi `#stage > #game, #stage > #hud { ... }` — tidak ada lagi aturan generik yang bisa menelan canvas lain; (2) avatar diperkuat sebagai `#stage #avatarCanvas { position: static; flex: none; width: 84px; height: 84px; border-radius: 50% }`. Diverifikasi di browser sungguhan (Chromium headless via CDP): gaya terhitung avatar = 84×84 statis, dan `elementFromPoint` di tengah tombol MULAI mengembalikan tombol itu sendiri (bisa diklik). Uji struktural baru membaca `style.css`/`index.html` dan meng-assert tidak ada aturan 100% yang terjangkau avatar.

**Pelajaran untuk agen lain:** **Uji stub tidak melihat presentasi.** Rangkaian uji logika yang hijau 100% tidak mengatakan apa-apa tentang CSS, tata letak, z-order, atau elemen yang tertutup. Setiap rilis WAJIB diperiksa visualnya (tangkapan layar browser sungguhan) sebelum disebut selesai — dan aturan CSS generik berbasis elemen (`#stage canvas`, `div *`, dst.) adalah jebakan spesifikitas: batasi selalu ke id/kelas eksplisit.

## [2026-10-20] v4 — Pergantian grafik ke aset asli berlisensi (metode & jebakan)

**Kesalahan (yang dihindari):** Sprite peta-piksel kode ditolak pemilik dua ronde ("burik, gak seperti Metal Slug"). Mengganti dengan aset unduhan membawa risiko lisensi: kandidat yang DITOLAK setelah diperiksa halaman sumbernya — paket hutan edermunizz (lisensi **CC BY-ND**: turunan dilarang, padahal pemotongan/skala itu wajib), "Heavy Terror Machine" (ada sengketa lisensi berkas di komentar halamannya), sheet "SNES Style Soldier" (jenis lisensi tidak tertera di halaman). Yang dipakai: **Open Gunner — Master484 (CC-BY 3.0**, tertulis di halaman & di kaki sheet) untuk pemain/musuh/mech Titan, dan **Mountain at Dusk — ansimuz (CC0**, ikon lisensi + `license.txt` dalam paket) untuk latar. Atribusi di `assets/CREDITS.md`, baris kredit di layar judul, dan README.

**Penyebab/Jebakan teknis yang ditemukan selama integrasi:**
1. Kotak frame pada sheet Open Gunner **berbagi tepi putih** — pendeteksi kotak naif menggabungkan satu baris menjadi satu "kotak" selebar 409px. Solusi: deteksi strip dulu, lalu pecah strip pada kolom yang putih ≥92% setinggi strip.
2. Ekstraksi teks halaman (browser) kadang menghilangkan blok "License(s)"/"File(s)" — verifikasi lisensi dilakukan dari ikon lisensi & teks lisensi di dalam berkas unduhan itu sendiri, bukan dari cuplikan halaman saja.
3. Konvensi arah hadap v3: sprite musuh menghadap KIRI bawaan (di-flip saat `face > 0`), pemain & Titan tidak. Frame aset menghadap kanan → frame musuh & mech **di-mirror saat pembangunan aset**, bukan dengan mengubah logika gambar game.
4. Konten karakter sumber hanya 45px; dunia kita 60px → skala seragam **4/3 nearest** (=60px pas). Mech 101px → **3/2** (=151px ≈ kotak Titan 150). Pose kembar "napas" di sheet ternyata beda registrasi beberapa piksel — memakainya sebagai frame napas membuat figur bergeser samping; varian napas dibuat dengan memampatkan frame yang sama 2px (jangkar kaki tetap).
5. Strip latar aset wajib mulus pada **periode 960** (game menggambar pada offset mod 960): lapisan diskala ke lebar yang membagi 960 (480/960) dengan jangkar bawah, bukan ke tinggi 270 membabi buta (pitch 918 menyisakan sambungan fase 42px).
6. Chromium headless lokal menolak navigasi ke `localhost` (ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS) — verifikasi visual memakai `file://` + `--allow-file-access-from-files`. Itu batas lingkungan uji, BUKAN bug game (aset termuat 5/5, `applied: true`).
7. Teleport uji untuk memotret bos bertabrakan dengan sistem arena game sendiri: Di-Cokka aktif & mendorong pemain keluar dari titik teleport (tabrakan badan bos), dan kunci arena Monster Laut mengklamp posisi pemain. Uji visual bos harus menonaktifkan pemicu/lock bos lain lebih dulu — perilaku gamenya sendiri benar.

**Perbaikan/Keputusan:** Integrasi lewat `assets.js` yang menimpa entri `SPR` setelah SEMUA berkas termuat (satu gagal = fallback penuh v3, tidak ada campuran gaya); `drawTitan` bercabang pada `SPR.titanAsset` (mech digambar jangkar bawah-tengah; core & bar HP tetap kode); indeks siklus jalan musuh mengikuti panjang array aktif (2 frame v3 / 8 frame aset, laju sama). Kotak tabrak & semua mekanik tidak diubah.

**Pelajaran untuk agen lain:** Untuk aset pihak ketiga: lisensi dibaca dari sumber primer (halaman + berkas), dicatat per berkas, dan kandidat berlisensi ND/tidak jelas/sengketa langsung dibuang betapa pun cocoknya. Saat menukar sumber gambar, samakan DULU konvensi (arah hadap, jangkar, periode tiling, registrasi antar-frame) — sebagian besar bug integrasi hidup di konvensi, bukan di kode.

## [2026-10-20] AUDIT v4 — Pita damage core Titan tidak mengikuti core VISUAL cabang aset

**Kesalahan:** `drawTitan` cabang aset (v4) menggambar core berdenyut di rel (30,40) — dada mech. Tetapi `damageTitan` memakai pita vertikal yang tetap di rel y+57..75 (posisi core sprite v3 yang digambar di y+62). Akibatnya pada cabang aset: tembakan tepat ke core yang menyala (rel 40..49) hanya dihitung damage ×1, sedangkan tembakan ke pinggang mech (rel 57..75, TANPA core visual) justru ×2. Terukur uji audit: tembakan rel 44 → delta 5 (×1), rel 66 → delta 10 (×2) — persis kebalikan dari yang dilihat pemain.

**Penyebab:** Integrasi aset memindahkan gambar core untuk mech (klaim README "(30,40) relatif") tanpa memindahkan pita damage yang menilainya — dua sumber kebenaran untuk satu titik lemah, kambuhan pola "kotak vs gambar" dari audit v2 (kepala Monster Laut).

**Perbaikan:** Pita kini mengikuti visual yang aktif, persis seperti `drawTitan`: `const coreBandY = (SPR.titanAsset && SPR.titanMech) ? titan.y + 36 : titan.y + 57` (pita 18px menutupi core visual 9px: aset 36..54 menutupi 40..49; fallback 57..75 menutupi 62..71). Terverifikasi uji: aset — rel 44 → ×2, rel 48 (tepi bawah core) → ×2, rel 66 → ×1, kaki rel 130 → ×1; fallback — rel 66 → ×2, rel 44 → ×1. Uji laser satu-damage-per-sinar tidak berubah.

**Pelajaran untuk agen lain:** Titik lemah visual yang dipindah wajib memindahkan JUGA geometri penilaiannya dalam commit yang sama. Uji penerimaan titik lemah selalu: tembak TEPAT ke gambarnya (bukan ke angka band), dan tembak ke tempat TANPA gambarnya — keduanya harus memberi hasil yang benar.

## [2026-10-20] AUDIT v4 — Penghitung POW HUD tertabrak gugus tombol pojok (cacat visual 3b)

**Kesalahan:** Teks "POW xN" digambar rata-kanan di (VIEW_W−10, 16) — tepat di bawah cluster tombol HTML pojok kanan atas (PENUH/PUTAR/bisu/jeda, ±200px CSS lebar). Pada pratinjau gameplay browser sungguhan, teks POW tertutup sebagian tombol (terbaca "P△W"). `elementFromPoint` di posisi POW lama mengembalikan `pauseBtn` — bukti terprogram.

**Penyebab:** HUD canvas (480×270, di-scale ke panggung) dan tombol HTML (ukuran CSS tetap) berbagi sudut kanan atas tanpa ada yang menghitung tumpang tindihnya; semua uji v1–v4 adalah stub Node yang tidak merender tata letak.

**Perbaikan:** POW dipindah ke samping timer (tengah atas): rata-kiri di (VIEW_W/2+30, 16), baseline sama dengan SKOR. Terverifikasi uji terprogram: span teks [270..317]×[3..16] tidak beririsan dengan rect cluster pada skala 2 ([380..480]×[0..25]) maupun skala 1,45 ([342..480]×[0..35]); SKOR (10,16) & timer (240,20, rata-tengah) tidak bergeser; di browser sungguhan `elementFromPoint` pada pusat teks POW mengembalikan canvas game (bukan tombol). Pratinjau gameplay menunjukkan "POW x0" bersih di samping timer.

**Pelajaran untuk agen lain:** Setiap elemen HUD di tepi layar wajib diuji terhadap rect CSS elemen HTML yang menindihnya pada skala tampil nyata (bukan koordinat canvas saja) — cluster tombol 200px CSS memakan 100px+ koordinat canvas pada stage kecil.

## [2026-10-20] AUDIT v4 — Noda bokeh & garis melintang di langit (cacat visual 3a)

**Kesalahan:** Dua elemen langit v3 terbaca sebagai cacat pada pratinjau gameplay: (1) `drawCloudStrip()` menumpuk lingkaran krem alpha 0,28–0,50 beradius sampai 44px + alas `fillRect` — di layar menjadi noda bokeh raksasa tembus pandang yang menutupi langit dan mengganggu keterbacaan teks announcer; (2) `band()` di `drawBgSky()` menggambar barisan lingkaran r=42 + `fillRect` sepenuh lebar di y=58 & y=96 — membentuk GARIS MELINTANG keras di tengah langit. Identifikasi dari kode + pratinjau: blob bokeh = cloudStrip (posisi cluster sama di dua pratinjau, warna krem khas), garis = rect band() sepenuh lebar (y cocok dengan garis pada pratinjau).

**Penyebab:** Awan dirancang sebagai "organik" dari lingkaran besar ber-alpha tinggi; pita dirancang sebagai "awan jauh membusur" tetapi dieksekusi sebagai barisan lingkaran + strip keras. Keduanya hanya dinilai dari kode, tidak pernah dilihat di layar sampai pemilik mengeluh.

**Perbaikan:** (1) `band()` DIHAPUS total dari `drawBgSky` (langit kini gradasi + bintang + matahari saja); halo matahari dilembutkan (0,18→0,10; 0,30→0,16). (2) `drawCloudStrip()` ditulis ulang: gumpalan PIPIH kecil (5 lingkaran r 5–9px sebaris + alas 3px, tinggi total ≤12px), alpha ≤0,14, dan awan yang menembus tepi digambar ulang di sisi seberang agar strip tetap mulus pada periode 960. Bukti: analisis piksel pratinjau — fraksi piksel krem-bokeh di wilayah langit turun dari 0,63%/0,37% (game/titan lama) menjadi 0,00% (ketiga pratinjau baru); tidak ada lagi garis melintang pada gambar.

**Pelajaran untuk agen lain:** Alpha >0,25 pada bentuk besar = noda, bukan awan. Setiap elemen latar baru wajib difoto di browser sungguhan sebelum dianggap selesai — dan uji piksel sederhana (fraksi warna di wilayah langit) bisa menjadi regresi otomatis untuk cacat visual semacam ini.

## [2026-10-20] AUDIT v4 — Teks status aset menyesatkan saat kegagalan sebagian

**Kesalahan:** Bila sebagian berkas aset gagal, `setStatus()` menulis "Sebagian aset tidak termuat — peran itu memakai sprite cadangan." Padahal semantik `apply()` adalah: satu berkas gagal = TIDAK ADA yang diterapkan — SELURUH peran memakai sprite v3. Frasa "peran itu" menyiratkan hanya peran yang gagal yang fallback.

**Penyebab:** Teks status ditulis dari sudut pandang kegagalan per-berkas, bukan dari keputusan apply() yang bersifat semua-atau-tidak-sama-sekali.

**Perbaikan:** Teks menjadi "Sebagian aset tidak termuat — seluruh grafik memakai sprite cadangan (v3). Game tetap bisa dimainkan penuh." Terverifikasi uji: pada pola gagal [0..4], [2], [1,3], dll., teks mengandung frasa jujur tersebut; `applied=false` dan identitas seluruh SPR v3 utuh.

**Pelajaran untuk agen lain:** Teks status/UX yang menjelaskan fallback harus ditulis dari KEPUTUSAN yang diambil kode (semua-atau-tidak), bukan dari peristiwa pemicunya (satu berkas gagal) — keduanya bisa berbeda makna.

## [2026-10-20] AUDIT v4 — Zona hantu kepala musuh aset TERUKUR, di bawah ambang (bukan bug)

**Temuan:** Frame musuh aset 64px digambar jangkar kaki pada kotak tabrak 39px. Diukur dari alpha aktual tiap frame (PIL): tinggi opak 59–61px → kepala visual menjulang 20–22px di atas kotak (klaim README "±21px" BENAR). Ambang perbaikan yang ditetapkan brief: >25px. Karena 22px < 25px, TIDAK diperbaiki — menaikkan kotak akan mengubah keseimbangan tembak-menembak yang sudah diaudit, mengecilkan gambar merusak konsistensi gaya.

**Catatan untuk playtest:** tembakan setinggi kepala visual (0–22px di atas kotak) meleset secara adil-menurut-kotak; ini disengaja (musuh seukuran pemain seperti Metal Slug). Bila pemain mengeluh "tembakan kena kepala tapi tidak mati", naikkan kotak ke 44px ATAU turunkan gambar — jangan keduanya.

**Pelajaran untuk agen lain:** Tetapkan ambang angka SEBELUM mengukur; ukur dari alpha aktual (bukan ukuran canvas); dan catat keputusan "sengaja tidak diperbaiki" beserta angkanya agar tidak dibuka ulang tanpa data baru.

## [2026-10-20] AUDIT v4 — Verifikasi lisensi aset (cek silang independen)

**Hasil:** Klaim lisensi pembangun TERVERIFIKASI dari sumber independen:
- **Open Gunner (Master484):** halaman OGA "Open Gunner Starter Kit" ada dan memuat persis isi yang dipakai (hero 120+ frame, enemy soldier, robot mech); "Attribution Instructions" di halaman mewajibkan kredit ke "Master484" (ciri lisensi keluarga BY, bukan CC0) — cocok dengan klaim CC-BY 3.0 (+OGA-BY); kaki sheet menyatakan "LICENSE: CC-BY 3.0". Kebijakan OGA sendiri hanya menerima lisensi bebas yang mengizinkan komersial & modifikasi (CC-BY 3.0, CC-BY-SA 3.0, OGA-BY 3.0, GPL/LGPL, CC0) — tidak ada skenario lisensi halaman ini yang melarang pemakaian kita. Atribusi terpenuhi di CREDITS.md + layar judul + README. Catatan jujur: kolom "License(s)" halaman tidak tertangkap ekstraksi teks browser (sidebar tidak ter-render), jadi string lisensi persis di halaman belum terbaca kata-per-kata; tiga jalur bukti di atas konvergen ke keluarga BY.
- **ansimuz "Mountain at Dusk":** halaman OGA-nya ada (oleh ansimuz); komentator di halaman itu sendiri menyebutnya public domain; halaman itch.io resmi ansimuz ("Mountain Dusk Parallax background") menyatakan eksplisit "Asset license: Creative Commons Zero v1.0 Universal". Judul ganda ("Mountain at Dusk" di OGA vs "Mountain Dusk" di itch) adalah karya yang sama dari pembuat yang sama — keduanya CC0. Berkas yang dipakai (bg-far/bg-mid) dikomposit dari lapisan paket tersebut sesuai CREDITS.
- **Daftar larangan bersih:** assets/ berisi tepat 5 PNG dari dua sumber di atas + CREDITS.md — tidak ada paket berbayar itch.io (pzUH/bitknight/Dead Revolver), insanozuke123, Digital Moons, maupun rip SNK.
- **Peluang v5 (dicatat, TIDAK dikerjakan):** "2D Side scrolling tank" oleh 2D Tyrant (opengameart.org/content/2d-side-scrolling-tank) — License(s): **CC0** tertulis di halamannya; berisi tank_right_strip3.png (sheet tank side-scrolling, 4 KB). Kandidat pengganti sprite kode SV-001 & Di-Cokka. Peringatan: hanya satu strip tank (bukan set animasi lengkap); kecocokan visual & kebutuhan turet putar harus dinilai dari sheet-nya sebelum dipakai.

---

## [2026-10-20] AUDIT v4 — Terverifikasi BUKAN bug / konfirmasi desain

- **Fallback semua-pola:** kegagalan total (5/5), tunggal tiap berkas, gagal-di-akhir (4 sukses lalu gagal), gagal-di-awal, 2-di-tengah — semuanya `applied=false` dengan identitas seluruh SPR v3 utuh (uji perbandingan objek di dalam VM). Semantik "satu gagal = fallback penuh satu gaya" terbukti, bukan klaim.
- **Balapan:** aset yang tiba 300 langkah setelah permainan berjalan menimpa SPR secara atomik antar-frame (JS single-thread); 600 langkah + 20 render pasca-terapan tanpa exception; selama muat, SPR tetap v3 penuh.
- **Avatar:** digambar ulang dari frame idle aset setelah apply (drawImage srcW=64 tercatat pada avatarCanvas); gaya terhitung browser 84×84 statis.
- **Titan guard:** tanpa aset, `drawTitan` memakai jalur gambar-kode v3 (burst/flash/stand) tanpa error; dengan aset, cabang mech dipakai (termasuk `titanMechF` saat hitT).
- **Musuh:** indeks siklus jalan memakai `% SPR.rebelWalk.length` — 2 frame fallback / 8 frame aset pada laju 6/dtk yang sama; `shieldWalk` terbukti TIDAK tersentuh aset.
- **Proyektil bos:** titik lahir dari logika (bukan gambar) tidak berubah oleh aset — suite bos v3 (143 uji) tetap lulus pada kode v4 kecuali SATU invariant yang memang digantikan desain v4 (`SPR.titanAsset/titanMech/titanMechF` didefinisikan assets.js, bukan sprites.js — ketidakhadirannya adalah sinyal fallback yang dijaga `&&` di drawTitan).
- **Muatan:** assets/ terukur 132.118 byte (≈129 KB, sesuai klaim); kelima PNG semuanya terpakai (player/enemies/titan/bgFar/bgMid — tidak ada berkas yatim); `previews/` ada di .gitignore dan tidak masuk daftar berkas rilis/deploy.
- **Sisa risiko yang tetap berlaku:** rasa tombol & rotasi CSS di Android Chrome sungguhan; frame rate riil 480×270 di HP kelas bawah; penilaian subjektif kualitas visual akhir oleh mata manusia (pemilik).

---

## [2026-10-20] v4.1 — Strip awan gambar-kode DICABUT TOTAL dari langit (gerbang rilis live v4)

**Kesalahan:** Pada tangkapan layar rilis live v4 masih terlihat gumpalan awan sebaris berbentuk cakram pipih dengan GARIS LURUS di tengahnya (terbaca seperti planet Saturnus / noda bergaris). Sumber persisnya `drawCloudStrip()` di sprites.js: helper `puff()` menumpuk 5 busur kecil PLUS `ctx.fillRect(x − w/2, y − 2, w, 3)` sebagai alas; lebar gumpalan 90–150px pada strip periode 960 yang digulir sebagai lapisan langit. Audit v4 sudah memperkecilnya dari bokeh raksasa v3 (alpha ≤0,14, r ≤9px), tetapi BENTUK cakram+garisnya tetap terbaca aneh oleh mata manusia di layar sungguhan — lolos uji angka, gagal uji mata, dan tertangkap gerbang rilis live.

**Penyebab:** Pelembutan parameter (alpha & radius diperkecil) tidak mengubah siluet dasar hasil primitif canvas: busur sebaris + alas persegi panjang selalu terbaca sebagai cakram bergaris, bukan awan. Kelas cacat yang sama dengan pita `band()` yang dibuang audit v4 — dekorasi langit dari primitif gambar-kode tidak mencapai mutu yang diterima mata, seberapa pun parameternya diturunkan.

**Perbaikan:** Cabut bersih, bukan dilembutkan lagi. Fungsi `drawCloudStrip()` DIHAPUS dari sprites.js beserta penugasan `S.cloudStrip = drawCloudStrip()`; dari `render()` di game.js DIHAPUS variabel `cloudOff` + kedua `drawImage(SPR.cloudStrip, …)` (komentar nomor lapis disesuaikan). Grep seluruh repo: nol rujukan `cloudStrip`/`drawCloudStrip`/`cloudOff`/`puff(` tersisa — tidak ada fungsi/kunci yatim. Langit akhir = gradasi senja + bintang + halo matahari redup (`drawBgSky`) + lapisan gambar ansimuz (bgFar/bgMid). Mekanik, aset, HUD, teks, dan data level tidak disentuh. Bukti: `node --check` semua berkas lolos; suite audit v4 tetap **66/66** dan regresi v3 tetap **143 lulus + 1 gagal pola lama** (asersi E2/E3 di `t4-audit.js` dan daftar kunci strip di `t3-sprites.js` diperbarui 1:1 dari menegaskan pelembutan menjadi menegaskan KETIADAAN strip — keputusan audit v4 "dilembutkan, bukan dihapus" resmi dibalik atas bukti layar live); di Chromium headless `SPR.cloudStrip === undefined` saat aset teraplikasi; analisis piksel atas komposit latar persis seperti `render()` menggambarnya (bgSky+bgFar+bgMid, 5 fase camX 0/777/1500/2900/4300, wilayah x 0–330, y 10–108): run horizontal terang-lokal (kelebihan luminansi >10 terhadap rata-rata baris y±4) terpanjang hanya **2px** (derau bintang) — sedangkan alas puff lama menurut konstruksinya selebar 90–150px pada kelebihan ≈+16–22, jauh di atas ambang deteksi ≥50px. Pratinjau `previews/preview-{title,game,titan}.png` digenerate ulang dari Chromium headless; cek browser pendampingnya (avatar 84×84 statis, tombol MULAI terklik, teks POW bebas tombol) tetap lulus.

**Pelajaran untuk agen lain:** Elemen dekoratif langit hasil gambar-kode dua kali ditolak mata manusia meski lulus uji angka — dekorasi langit serahkan ke gambar aset, bukan primitif canvas. Dan bila bentuk dasarnya yang ditolak, cabut elemennya; pelembutan parameter hanya menunda penolakan yang sama ke rilis berikutnya.
---

## [2026-10-20] v5 (PEMBANGUN) — Bug NaN dari field knockback yang tidak diinisialisasi

**Kesalahan:** Saat pisau & knockback ditambahkan, objek musuh rakitan tangan di uji (dan jalur mayat di `updateEnemies`) membaca `e.kbVx`/`e.runDist` yang belum tentu ada: cabang mayat menghitung `e.x += undefined * dt` → posisi menjadi `NaN` dan meracuni render & tabrakan. Terbukti oleh uji chaser era v3 yang mulai gagal `vy=0`.

**Penyebab:** Field baru (`kbT/kbVx/runDist/recoilT/camLook`) ditambahkan ke mesin tanpa daftar periksa inisialisasi di semua jalur pembuatan objek (buildLevel menutupi musuh level, tetapi objek rakitan uji & jalur tepi tidak).

**Perbaikan:** Penjaga defensif di titik pakai (`if (e.kbVx)`, `(e.runDist || 0)` di update & draw) + inisialisasi lengkap di `buildLevel()` dan `startGame()`. Setelah perbaikan, seluruh regresi pulih.

**Pelajaran untuk agen lain:** Setiap menambah field state baru, grep semua tempat objek sejenis dibuat/di-reset dan semua tempat field dibaca; objek rakitan uji WAJIB memakai objek dari `buildLevel()`, bukan literal setengah jadi. Uji yang merakit objek parsial akan menghasilkan kegagalan semu ATAU menyembunyikan bug NaN seperti ini.

---

## [2026-10-20] v5 (PEMBANGUN) — Tiga kesalahan staging uji oleh pembangun sendiri (semu terdeteksi, diperbaiki di berkas uji)

1. **Pemain di-staging di x=800**, ternyata dalam jangkauan pisau peti x=820 — 5 uji aim/amunisi/recoil gagal semu (pisau otomatis memotong tembakan). Dipindah ke x=700. *Pelajaran: sebelum staging uji tembak, periksa radius pisau `MELEE_RANGE` terhadap peti/musuh terdekat.*
2. **Uji deadzone kamera ditulis dari tepi zona mati** — kamera memang selalu di tepi setelah menetap, jadi asersi "tidak bergerak" selalu benar palsu. Ditulis ulang dari interior deadzone. *Pelajaran: uji deadzone harus berangkat dari posisi interior, bukan dari keadaan tunak.*
3. **Regex struktural CSS mengenai komentar**, bukan aturan — pola diperketat ke `#stage canvas\s*\{`. *Pelajaran warisan v4 yang kambuh: pola uji struktural harus menargetkan sintaks aturan, bukan teks bebas.*

---

## [2026-10-20] v5 (PEMBANGUN) — Keputusan tank CC0: Di-Cokka YA, SV-001 TIDAK

"2D Side scrolling tank" oleh 2D Tyrant (OpenGameArt, CC0 terkonfirmasi di halaman) dievaluasi dari sheet sumber 600×200 (3 frame; antar-frame hanya berbeda animasi roda/rantai). Diproses menjadi `assets/tank.png` 408×52 (crop per frame + mirror ke kiri). **Cocok untuk Di-Cokka** (tank musuh bergerak maju-mundur, turet diam memang karakternya). **Tidak untuk SV-001**: turet aset menyatu & diam — SV-001 wajib mengekspresikan turet putar 8-arah — dan proporsi badannya tidak pas ke kotak Slug 60×51. Loader tank dibuat TERPISAH (`window.PAM_TANK`) dan hanya menerapkan bila set utama sukses penuh, agar kegagalannya tidak mencemari fallback satu-gaya v4. SV-001 tetap gambar-kode dengan alasan teknis ini, bukan karena aset tidak dicari.
---

## [2026-10-20] v5 (PEMBANGUN) — Kegagalan suite lama yang DISENGAJA (pengoreksi: rebase, jangan "perbaiki" kode)

Perluasan level 4600→6400px & perubahan v5 lain membuat angka lama kedaluwarsa. Suite era v3 (`main3`/rangkaian `t3-*`): **130 lulus, 14 gagal — semuanya kategori ini**:

- 11× staging Titan geometri lama (uji menaruh Titan di x=4400 / pemicu 4150; kini pemicu 5750, Titan x=6200, arena {5880,6380}, klamp (6050,6296)). Rebase: geser +1800.
- 1× "POW total tepat 7" → kini **9** (POW_DEFS +{4550},{5580}).
- 1× daftar kunci `SPR` dari sprites.js → kini assets.js juga mendefinisikan `tankAsset/tankFrames/tankFramesF` (dan `boomBig` bila FX termuat) — kelas pola lama yang sama dengan `titanAsset` di v4.
- `t4-v4` 1× A12 "judul & tagline v4" → judul kini v5 (48/49).

Uji pembangun v5 (`t5-v5.js`) sudah men-staging ulang seluruh mekanik Titan pada geometri baru dan lulus 86/86 — mekaniknya sendiri tidak berubah.

---

## [2026-10-20] v5 (PEMBANGUN) — Pentasan pratinjau bos menabrak sistem arena game sendiri

**Kesalahan:** Tangkapan `preview-action/cokka/titan` pertama menampilkan adegan yang tertukar: action & titan sama-sama menampilkan pengumuman "Di-Cokka!" + tank, dan Titan tidak terlihat sama sekali. Penyebabnya staging skrip foto: pemain di-teleport melewati pemicu Di-Cokka yang masih dorman → `updateCokka` MENGAKTIFKANNYA (perilaku game yang benar), memasang arenaLock-nya, dan menyeret kamera/pemain ke arena Di-Cokka. Pada staging titan, `cokka.active = false` justru menghidupkannya lagi di frame berikutnya karena pemain berada melewati pemicu.

**Perbaikan:** Semua staging bos kini menandai bos sebelumnya **selesai** (`active = true, dead = true`) — bukan dimatikan — dan mengatur `arenaLock` eksplisit untuk Titan. Ketiga tangkapan diambil ulang & diperiksa: action = zona 5 + popup POW, cokka = menara 2 + tank CC0 utuh, titan = mech memenuhi arena.

**Pelajaran untuk agen lain:** Teleport staging BUKAN jalan pintas netral: pemicu bos berbasis posisi akan selalu menafsirkan teleport sebagai kedatangan sah. Tandai bos yang dilewati sebagai selesai, atau staging dari awal level. Ini pengulangan pelajaran audit v3 ("teleport uji bertabrakan dengan sistem arena") pada skrip pratinjau — berlaku juga di sana.
---

## [2026-10-20] v5 (PEMBANGUN) — Perburuan aset menuju target 17 berkas fungsional: hasil jujur 8, dan daftar penolakan

Pemilik menargetkan ≥17 berkas aset gambar FUNGSIONAL (masing-masing harus bisa dibuktikan dirender saat bermain) dan menegaskan angka jujur di bawah target lebih diterima daripada angka hasil pajangan/lisensi abu-abu. **Hasil ronde ini: 8 berkas fungsional** — 6 warisan v4 (player, enemies, titan, bg-far, bg-mid) + tank (v5 awal) + 2 baru ronde ini:

- **`assets/explosion.png`** — "Explosion Set 2" oleh Master484, **CC0** (tertulis di halaman OGA dan tercetak di kaki sheet: "LICENSE: PUBLIC DOMAIN / CC0"). Siluet jamur api di-remap gradasi api berlapis via pita erosi masker, latar hitam → alfa; 4 frame 60×60 → `SPR.boom` (semua ledakan kecil). Bukti render: uji penanda + `preview-boom.png`.
- **`assets/explosion-big.png`** — sumber sama, baris palet lebih panas + pijar tepi → `SPR.boomBig`, dipilih render dari flag partikel `boomBig` (ledakan bos/Slug/tong rantai). Bukti: uji kanvas penanda 61px membuktikan cabang render-nya.

Keduanya dimuat loader terpisah `window.PAM_FX` dengan semantik tank: hanya bila set utama applied penuh; gagal satu berkas hanya menggugurkan perannya.

**Kandidat yang DIEVALUASI & DITOLAK (dengan alasan — jangan buru ulang membabi buta):**

1. **Open Gunner Expansion Pack 1 & 2 (Master484)** — isinya ideal (Forest Tileset, "good woods" tileset, turret musuh baru, bos cyborg). DITOLAK SEMENTARA: halaman OGA kedua paket tidak mengekstrak blok File(s)/License lewat penarik teks yang tersedia (hanya teks badan + atribusi "credit Master484"), dan nama berkas unduhan tidak bisa ditebak (4 kandidat nama → 404 semua). Tanpa verifikasi lisensi kata-per-kata & jalur unduh pasti, aturan proyek melarang memakainya. Jalan lanjut yang sah: buka halaman lewat browser live/dashboard, catat nama berkas persisnya, unduh, verifikasi footer lisensi di sheet (pola Master484 konsisten CC-BY 3.0).
2. **"Country Side Platform Tiles" (OGA)** — halamannya hanya mengekstrak komentar; lisensi & berkas tidak terverifikasi → DITOLAK (lisensi tidak jelas = tolak).
3. **"Animated Ocean Water Tile" (OGA)** — sama: lisensi tidak terverifikasi lewat jalur tersedia → DITOLAK.
4. **"Explosion Set 1" (Master484, CC0 terverifikasi)** — diunduh & diperiksa; gaya cincin/busa menyebar kurang cocok sebagai bola api utama dibanding Set 2 → TIDAK DIPAKAI atas dasar kecocokan, bukan lisensi.
5. **"explosion" oleh johndekale (CC0 terverifikasi)** — diunduh (59 frame GIF 256×256); gaya lukis (bukan pixel) bentrok dengan gaya pixel game pada ukuran render → TIDAK DIPAKAI atas dasar kecocokan gaya.
6. **POW/tawanan & Shield Soldier** — pencarian OGA ("prisoner/hostage/captive", termasuk entri koleksi "Captive Tomi") tidak menghasilkan sprite tawanan/perisai tampak-samping yang cocok gaya & terverifikasi lisensinya (melanjutkan temuan v4). Tetap gambar-kode; dicatat sebagai utang aset, bukan disembunyikan.

**Pelajaran untuk agen lain:** Ekstraksi teks OGA tidak seragam — halaman pasca-2013 umumnya memuat blok License(s)+File(s), halaman lama sering tidak. Bila kedua blok itu tidak terbaca, kandidat dianggap TIDAK terverifikasi (bukan "mungkin CC0"). Dan target kuantitatif tidak pernah mengalahkan aturan lisensi: laporkan angka jujur + daftar penolakan ini.

---

## [2026-10-20] v5 (PEMBANGUN) — UI/UX: target sentuh kecil & teks pengumuman hantu

- **`.small-btn` hanya 42px** — di bawah target sentuh 44px yang dituntut standar UI/UX pemilik. Dinaikkan ke `min-height: 44px`. Tombol lain terukur aman: pojok 44×44, sentuh A/B/C 58–72px, D-pad 58px; jeda antar A/B/C 10px (pojok 6px & grid D-pad 4px dicatat sebagai catatan minor, bukan pelanggaran ukuran target).
- **Teks pengumuman "Mission Start!" tampak menghantui** di balik layar JEDA & SELESAI pada tangkapan pratinjau. Setelah ditelusuri ini artefak pentasan (endScreen/setPaused dipanggil tepat setelah startGame yang mengumumkan) — di permainan nyata pengumuman 1,4 detik sudah lama selesai sebelum jeda/akhir. Bukan bug; tetapi pengoreksi yang men-staging dengan cara sama akan melihat hal yang sama — staging layar akhir/jeda sebaiknya mendahului pengumuman dibersihkan (`G.announceT = 0`) agar tangkapan bersih.
- Tata letak layar judul dirapikan (`gap` 8→6px, line-height kotak kontrol 1.6→1.5) agar baris kredit terbawah tidak lagi terpotong di viewport 960×540; terverifikasi di pratinjau judul terbaru (logo berkas + semua baris kredit terbaca).
---

## [2026-10-20] v5 (PEMBANGUN) — Musik lobi, wajah web, dan jebakan stub AudioContext di harness

**Musik lobi:** Browser melarang audio sebelum gestur — musik judul kini dimulai listener `pointerdown`/`keydown` pertama saat `G.screen === 'title'` (`maybeLobbyMusic`), dan dari saklar Musik di Pengaturan bila dinyalakan saat masih di lobi. Transisi ke gameplay mulus BUKAN karena kode khusus: `AUDIO.startMusic()` memang idempotent (penjaga `musicTimer`), jadi panggilan kedua dari `startGame()` adalah no-op. Pelajaran: sebelum menulis logika transisi, periksa idempotensi API yang sudah ada.

**Jebakan uji:** Uji musik lobi pertama GAGAL bukan karena kode game, melainkan harness `t4-harness` tidak menyediakan stub `AudioContext` sama sekali — `AUDIO.init()` selalu pulang diam-diam di semua uji stub selama ini (musik tidak pernah benar-benar "berbunyi" di suite mana pun). Uji diperbaiki dengan menyuntikkan AudioContext tiruan minimal dari sisi uji. **Pelajaran untuk agen lain:** Asersi tentang audio di suite stub hanya bermakna bila konteks audionya disuntikkan; tanpa itu, "musik jalan" tidak teruji sama sekali — dan jangan buru-buru menyalahkan kode game atas kegagalan harness.

**Wajah web & sumber tunggal logo:** Pemilik menyederhanakan: SEMUA ikon diturunkan dari `logo.png` yang sama. Ikon versi pertama ronde ini memakai potongan kepala hero Open Gunner (gambar berbeda dari logo) — DIGANTI: icon-512/192/apple-touch = wordmark logo.png utuh di atas persegi gradasi senja; favicon = varian sederhana huruf "P" yang dipotong dari logo.png sendiri (wordmark utuh tidak terbaca pada 16px — diverifikasi dengan render 16px yang diperbesar: siluet "P" kuning tegas terbaca). `og:image`/`twitter:image` juga menunjuk logo.png. Logo sendiri adalah karya proyek (huruf Liberation Sans Bold, SIL OFL) yang digambar dengan PIL: percobaan pertama gagal total (masker teks tidak diterapkan ke gradasi sehingga logo menjadi balok oranye buram) — tertangkap karena hasil kompositnya DILIHAT, bukan hanya dipercaya dari kode. Pelajaran yang sama dengan gerbang visual: berkas gambar hasil generator wajib dibuka dan diperiksa.

**Kunci ukuran gambar judul:** `#titleLogo` dikunci di CSS (`height: 54px; width: auto; flex: none`, selector diperkuat `#stage #titleLogo`) — pelajaran bug avatar raksasa v4 diterapkan ke SEMUA gambar layar judul, bukan hanya canvas.

---

## [2026-10-20] AUDIT v5 — BUG: pemicu Titan di LUAR arena → pemain & Slug teleport ±130px (DIPERBAIKI)

- **Kesalahan:** `CONFIG.TITAN_TRIGGER_X = 5750`, sedangkan arena Titan adalah {5880, 6380} dan klamp pemain saat terkunci adalah [5882, 6358]. Pemain yang BERJALAN normal melewati x=5750 mengaktifkan kunci arena, dan pada langkah berikutnya klamp menyentak posisinya **+130,6px dalam satu frame** (terukur di uji progresi dinamis agen pengoreksi: jalan kaki dari x=5600, lompatan maksimum satu langkah 130,6px sebelum perbaikan). Pemain melompati penjaga terakhir di x=5800 tanpa bertarung. Pola ini menyimpang dari dua bos lain (pemicu laut 340 di dalam {40,760}; pemicu Di-Cokka 3400 di dalam {3350,3850}).
- **Penyebab lolos dari pembangun:** staging uji pembangun meneleport pemain langsung ke dalam arena (x=6000+) sehingga jalur berjalan tidak pernah dilalui — pelajaran staging v3 yang sama persis terulang. Aseri statis pembangun bahkan mengunci angka yang salah (`TITAN_TRIGGER_X === 5750` diasertakan sebagai kebenaran).
- **Perbaikan (dua tahap, keduanya terukur):** 5750 → 5890 menutup kasus jalan kaki, TETAPI uji kendaraan pengoreksi menunjukkan Slug masih tersentak **+10,9px**: pemicu membaca `player.x` yang saat berkendara bernilai `slug.x + 20`, sedangkan klamp arena bekerja pada `slug.x` (min 5882). Nilai final **5910** — di dalam arena dan di atas tepi klamp kendaraan (5882 + 20 + margin). Setelah perbaikan: lompatan maksimum pemain 2,6px/langkah (kecepatan jalan normal), Slug ≤ 6px/langkah, arena terkunci pada player.x=5912.
- **Pelajaran:** (1) Pemicu bos wajib diuji lewat PROGRESI BERJALAN dari sebelum pemicu, bukan teleport ke dalam arena. (2) Saat membandingkan pemicu terhadap klamp, periksa SEMUA koordinat yang diklamp arena — pemain jalan dan kendaraan punya offset berbeda. (3) Jangan pernah mengasertakan angka konfigurasi sebagai "kebenaran" di uji tanpa memeriksa konsistensinya terhadap geometri yang dikunci angka itu.

---

## [2026-10-20] AUDIT v5 — BUG: musik lobi mati permanen setelah KE JUDUL (DIPERBAIKI)

- **Kesalahan:** `maybeLobbyMusic()` dijaga latch satu-kali `lobbyMusicTried`. Skenario nyata: pemain membuka game (musik lobi jalan) → main → KE JUDUL (handler memanggil `AUDIO.stopMusic()`) → gestur berikutnya di judul TIDAK menyalakan musik lagi, selamanya, sampai reload. Ini bertentangan dengan perilaku yang dijanjikan README (titik rawan musik: "musik lobi baru mulai pada gestur berikutnya").
- **Perbaikan:** latch dihapus. Penjaga yang benar cukup dua: hanya di layar `title`, dan `AUDIO.startMusic()` yang memang idempoten (penjaga `musicTimer` di audio.js) — persis pelajaran pembangun sendiri di entri musik lobi, diterapkan konsisten. Uji siklus penuh pengoreksi: gestur→musik jalan; MULAI→timer yang sama (tidak dobel); KE JUDUL→berhenti; gestur→jalan lagi; saklar Musik mati & keadaan bisu tetap menahan musik.
- **Pelajaran:** Latch satu-kali untuk efek yang harus bisa menyala berulang adalah jebakan; bedakan "sudah pernah dicoba" dari "sedang berjalan". State berjalan (`musicTimer`) adalah sumber kebenaran yang tepat.

---

## [2026-10-20] AUDIT v5 — BUG: teks pengumuman membeku PERMANEN di layar akhir (DIPERBAIKI) + verifikasi klaim "artefak pentasan"

- **Verifikasi klaim pembangun:** Benar bahwa "Mission Start!" di tangkapan pratinjau JEDA/SELESAI berasal dari pentasan (setPaused/endScreen dipanggil tepat setelah startGame) — pengoreksi melihat sendiri hantunya di `previews/preview-pause.png` & `preview-end.png`. Untuk JEDA ini juga bukan bug: pengumuman memang sedang tampil, membeku selama jeda, dan berlanjut setelah LANJUTKAN.
- **Tetapi ada jalur nyata yang lolos dari penjelasan itu:** bila pemain mati di NYAWA TERAKHIR dalam sisa jendela pengumuman bos (pengumuman 1,4 dtk; animasi mati 1,15 dtk — jadi kematian ≤ ±0,25 dtk setelah pengumuman mulai, mis. rudal yang sudah meluncur), `endScreen(false)` terpanggil saat `announceT` masih > 0. Di luar layar `play`, `update()` berhenti total sehingga `announceT` TIDAK PERNAH berkurang — teks bos membeku permanen di balik panel GAME OVER.
- **Perbaikan:** `endScreen()` kini membersihkan `G.announceT`/`G.announceText` — aturan transisi proyek sendiri ("setiap transisi state membersihkan state sesaat") yang sudah dipatuhi handler KE JUDUL tetapi terlewat di sini.
- **Pelajaran:** "Artefak pentasan" adalah penjelasan yang harus DIBUKTIKAN per layar, bukan diterima sebagai kategori umum — jalur waktu (siapa mengurangi timer ini, dan apakah ia masih berjalan setelah transisi) menentukan apakah hantu itu berumur 1,4 detik atau selamanya.

---

## [2026-10-20] AUDIT v5 — Kepatuhan standar ARSITEKTUR: angka sihir dipindah ke CONFIG, dokumentasi loader dilengkapi

- **Angka sihir di logika baru v5 (klaim §3 ARSITEKTUR belum penuh):** faktor kecepatan lookahead kamera `velNow * 0.16`, knockback pisau `185`/`0.16`, knockback peluru `95`/`0.1`, dan hit-stop ledakan `0.03` (warisan v3 di `explodeAt`) tertulis literal. Dipindah ke CONFIG sebagai `CAM_LOOK_VEL`, `MELEE_KB_VX`, `MELEE_KB_T`, `KB_VX`, `KB_T`, `HITSTOP_EXPLODE` — nilai identik, perilaku tidak berubah (seluruh suite tetap hijau setelah pemindahan).
- **Dokumentasi tidak akurat:** `docs/ARSITEKTUR.md` tidak menyebut loader `PAM_FX` sama sekali (0 kemunculan) padahal kode memiliki TIGA loader terpisah. Diagram §2.4 dan tabel modul dilengkapi: PAM_FX (explosion + explosion-big, independen satu sama lain di bawah syarat set utama applied).
- **Catatan desain (bukan bug, dibiarkan sadar):** pisau yang TERTAHAN perisai Shield Soldier tetap memberi knockback `kbVx=185` ke prajuritnya, sedangkan peluru yang tertahan tidak memberi knockback sama sekali. Asimetri terukur di uji pengoreksi; dinilai masuk akal sebagai rasa fisik pisau vs proyektil dan tidak diubah — dicatat di sini agar keputusan ini disadari, bukan kebetulan yang tak terdokumentasi.

---

## [2026-10-20] AUDIT v5 — Putusan audit independen & rebase suite lama

**Metode:** suite independen baru `~/workspace/audit-scratch/t5-audit.js` (87 uji) ditulis dari nol di atas harness audit v4 — termasuk suntikan stub AudioContext (tanpa itu uji musik tidak bermakna) dan uji progresi berjalan sungguhan; kedelapan pratinjau diperiksa dengan mata; lisensi dua aset baru diverifikasi ulang langsung dari halaman OpenGameArt sumbernya (keduanya CC0, sesuai CREDITS.md).

**Putusan per klaim pembangun:** (1) Kamera — TERBUKTI: invariant kedua arena saat menetap, ayunan berbalik hanya 2,8px, kamera beku saat mati; sisa gerak pemain diam < 0,01px (asimtot damping, tak terlihat). (2) Siklus lari — TERBUKTI: `runDist` == perpindahan nyata pada 60 fps DAN 30 fps, membeku di udara. (3) Hit-stop — TERBUKTI lewat loop `frame()` asli: input ter-buffer dieksekusi, timer beku selama hit-stop, tanpa fast-forward sesudahnya. (4) Pisau & knockback — TERBUKTI: ketiga bos −3, pita core fallback ×2 utuh, sapuan NaN ke 33 musuh buildLevel bersih (perbaikan field `kbT/kbVx` pembangun tuntas di semua jalur spawn). (5) High score — TERBUKTI penuh: hanya naik, tampil di judul/HUD/akhir, tahan reload, tahan nilai rusak & skor 0. (6) Dunia 6400/9 POW — TERBUKTI: invariant data + freePow semua POW tanpa kaki berpindah (regresi teleport v2 tidak kembali). (7) Aset — TERBUKTI **8 berkas fungsional**, angka jujur pembangun akurat: per berkas ada jejak render (frame tank 136px & ledakan 60px tertangkap di render; cabang fallback 96px utuh), lisensi terverifikasi, semantik loader terpisah persis seperti didokumentasikan (satu berkas FX gagal = hanya perannya yang gugur; set utama gagal = semua ikut gugur, satu gaya utuh). Tidak ada berkas pajangan di antara yang diklaim. (8) Wajah web — TERBUKTI struktural (metadata/ikon/manifest/CSS) + favicon huruf "P" terbaca pada 16px; SATU cacat perilaku ditemukan & diperbaiki (musik lobi, lihat entri di atas). (9) UI/UX — TERBUKTI dari 8 pratinjau: HUD tak bertabrakan, kredit judul utuh terbaca, target sentuh ≥44px termasuk `.small-btn`. (10) Suite lama — TERBUKTI pernyataan pembangun: seluruh kegagalan baseline adalah perubahan disengaja (dirinci di bawah); nol bug kode bersembunyi di antaranya. (11) Standar ARSITEKTUR — TERBUKTI setelah dua perbaikan kepatuhan di entri sebelumnya.

**Rebase suite (berkas uji diubah, BUKAN kode):**
- `t3-mech.js`/`t3-boss.js`: staging Titan digeser +1800 mengikuti geometri 6400 (4200→6000, 4279→6079, 4280→6080, 4378→6178, 4496→6296, camX 3950→5750, laser dari 4350→6150); koordinat Y laser TIDAK berubah (titan.y tetap 82, pita fallback 139..157).
- `t3-boss.js`: "POW total tepat 7" → 9.
- `t3-sprites.js`: rujukan `SPR.*` tak terdefinisi kini diizinkan HANYA untuk himpunan kunci milik assets.js yang eksak (`titanAsset, titanMech, titanMechF, tankAsset, tankFrames, tankFramesF, boomBig` — ketiadaannya adalah sinyal fallback by design) dan himpunan itu diasertakan eksak agar kunci yatim baru tetap tertangkap.
- `t4-v4.js` A12: string judul v4 → v5.
- `t5-v5.js` (suite pembangun): asersi pemicu 5750 → 5910 dan staging arena 5800 → 5950 mengikuti perbaikan bug pemicu (entri pertama di atas).

**Hasil akhir semua suite:** audit independen **87/87**, pembangun **86/86** + **42/42**, warisan **66/66** + **49/49** + **145/145** + **29/29**, pemeriksaan langit v4.1 lolos — total 504 asersi hijau. Sisa risiko jujur: belum ada playtest HP fisik ronde ini (rasa kamera/hit-stop & keterbacaan favicon di tab browser nyata hanya bisa disahkan di perangkat), dan pentasan pratinjau cokka tidak menampilkan pemain di dalam bingkai (kosmetik pentasan, bukan cacat game).

---

## [2026-10-20] v5.1 — BUG: kontrol sentuh bocor ke lobi & semua layar menu di HP (DIPERBAIKI)

**Laporan pemilik (playtest HP fisik, Vivo Y12):** "Lobi kok sudah muncul banyak tombol." Di layar judul — dan ternyata juga pengaturan, jeda, dan selesai — D-Pad + tombol A/B/C sudah tampil sebelum permainan dimulai.

**Penyebab:** Aturan tampil di style.css hanya digerbang KEMAMPUAN perangkat: `body.has-touch #touchControls { display:flex }` dan `@media (pointer: coarse) { #touchControls { display:flex } }`. Keduanya buta status layar, jadi pada perangkat sentuh kontrol gameplay dirender permanen di atas semua layar. Cacat ini lolos dari SEMUA gerbang sebelumnya karena pratinjau & suite berjalan di desktop (tanpa has-touch, pointer fine) — kelas cacat yang hanya terlihat pada lintasan emulasi sentuh/perangkat nyata.

**Perbaikan (gerbang ganda — kemampuan DAN status):**
- `style.css`: kedua aturan digerbang kelas status `playing` di body → `body.has-touch.playing #touchControls` dan `@media (pointer: coarse) { body.playing #touchControls }`.
- `game.js` `showScreen(id)` (titik transisi terpusat, pola yang sama dengan tombol jeda pojok): menambah `document.body.classList.toggle('playing', !id && G.screen === 'play')`. Terverifikasi di semua pemanggil: startGame (screen='play' sebelum showScreen(null)) dan setPaused(false) menyalakan; endScreen (id 'endScreen'), setPaused(true), openSettings, closeSettings (ke jeda maupun judul), serta menuBtn/quitBtn (showScreen('titleScreen')) mematikan. Boot awal: body tanpa kelas → lobi bersih. Respawn tidak melewati showScreen → kelas bertahan selama mati→respawn, kontrol tidak berkedip hilang.
- Perilaku desktop tidak berubah (tanpa has-touch & pointer fine, aturan tampil tidak pernah cocok); perilaku bermain di HP tidak berubah (display flex penuh, termasuk setelah lanjut dari jeda).

**Bukti uji:**
- Suite baru `~/workspace/audit-scratch/t51-touchgate.js`: **26/26** — asersi statik CSS/JS + rantai status penuh di stub sentuh (boot bersih → main aktif → mati/respawn tetap aktif → jeda mati → pengaturan dari jeda & judul mati → lanjut aktif lagi → KE JUDUL mati → selesai/game over mati) + konsistensi stub desktop.
- Verifikasi Chromium headless `~/workspace/audit-scratch/t51-verify.js`: **11/11** — getComputedStyle(#touchControls).display diukur pada TIGA jalur: (A) kelas has-touch ditambahkan: judul none, pengaturan none, bermain flex, jeda none, lanjut flex, selesai none; (B) emulasi perangkat sentuh CDP (setTouchEmulationEnabled + setDeviceMetricsOverride mobile; matchMedia('(pointer: coarse)') terbukti matches): judul none, bermain flex, jeda none; (C) desktop murni: bermain tetap none. Catatan metode: `Emulation.setEmulatedMedia` fitur pointer TIDAK mengubah matchMedia pada build Chromium ini (prasyarat gagal membuktikannya) — emulasi pointer yang sah adalah emulasi perangkat CDP.
- Bukti visual: `previews/preview-touch-title.png` — layar judul dalam mode sentuh kini bersih total (hanya tombol pojok PENUH/PUTAR/bisu yang memang selalu ada).
- Regresi: suite lama tetap hijau — pembangun 86/86 + 42/42, audit independen 87/87, warisan 66/66 + t3-screen selesai tanpa GAGAL + pemeriksaan langit v4.1 lulus.

**Temuan samping (bukan akibat perbaikan ini, dipulihkan & dilaporkan apa adanya):** saat menjalankan suite, lima berkas wajah web di root proyek (favicon.ico, favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png) ditemukan HILANG dari ~/workspace/pam-ong/ (t5-assets gagal ENOENT) — padahal terverifikasi ada pada 13:08 UTC dan terunggah ke GitHub 14:39 UTC. Penyebab hilangnya tidak teridentifikasi dari jejak yang ada (bukan oleh perubahan v5.1: diff hanya style.css + showScreen). Kelimanya dipulihkan dari pohon staging rilis ~/workspace/.deploy-v5/tree/ setelah terbukti identik byte-per-byte (SHA-256 + cmp) dengan salinan yang tayang di pamongame.vercel.app; t5-assets kembali 42/42. Agen rilis berikutnya: periksa apakah alur staging-mu memindahkan (bukan menyalin) berkas root proyek.

**Pelajaran untuk agen lain:** (1) Aturan tampil berbasis kemampuan perangkat SAJA akan selalu membocorkan UI gameplay ke menu — visibilitas elemen gameplay wajib digerbang status layar juga. (2) Gerbang visual desktop TIDAK bisa melihat cacat kelas sentuh: setiap rilis yang menyentuh UI wajib menyertakan lintasan emulasi sentuh (kelas has-touch + emulasi perangkat CDP) dalam pemeriksaannya, atau cacat seperti ini lolos terus sampai ditemukan pemilik di HP fisik.
