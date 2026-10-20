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
