/* =====================================================================
   PaM-ONG — assets.js (v4; v5 menambah tank Di-Cokka CC0 di bagian akhir)
   Pemuatan aset gambar ASLI berlisensi bebas (lihat assets/CREDITS.md):
   - Karakter: "Open Gunner" oleh Master484 (CC-BY 3.0, OpenGameArt).
   - Latar pegunungan/hutan: "Mountain at Dusk" oleh ansimuz (CC0).
   - Tank Di-Cokka (v5): "2D Side scrolling tank" oleh 2D Tyrant (CC0).
   - Ledakan (v5): "Explosion Set 2" oleh Master484 (CC0/Public Domain)
     — loader terpisah PAM_FX, lihat bagian akhir berkas.
   Aset menimpa entri SPR yang bersesuaian SETELAH semua berkas termuat.
   FALLBACK WAJIB: bila berkas apa pun gagal dimuat (404, offline, file://
   tanpa server, dsb.) game berjalan PERSIS seperti v3 dengan sprite
   gambar-kode — tidak ada jalur kode yang bergantung pada aset.
   Berkas ini dimuat TERAKHIR; bila berkas ini sendiri tidak ada,
   game tetap utuh (tidak ada referensi ke PAM_ASSETS dari game.js
   selain cabang gambar Titan yang memeriksa SPR.titanAsset).
   ===================================================================== */
(function () {
  'use strict';

  // Rect atlas (diproduksi skrip pembangunan aset; ukuran = ukuran gambar
  // persis seperti digambar game: pemain/musuh skala 4/3 dari sel sumber,
  // Titan skala 3/2 — semua NEAREST, jangkar bawah sama dengan sheet asli).
  const RECT = {
    player: {
      idle: [0, 9, 64, 64], idleB: [64, 9, 64, 64], jump: [128, 9, 64, 64],
      damage: [192, 9, 64, 64], crouch: [256, 9, 64, 64],
      run0: [320, 9, 64, 64], run1: [384, 9, 64, 64], run2: [448, 9, 64, 64],
      run3: [512, 9, 64, 64], run4: [576, 9, 64, 64], run5: [640, 9, 64, 64],
      run6: [704, 9, 64, 64], run7: [768, 9, 64, 64],
      diag: [832, 0, 64, 73], up: [896, 0, 64, 73], steep: [960, 0, 64, 73],
      jumpDiag: [1024, 0, 64, 73],
      throw: [1088, 9, 91, 64], dash: [1179, 9, 91, 64], prone: [1270, 9, 91, 64]
    },
    enemies: {
      rebel0: [0, 0, 64, 64], rebel1: [64, 0, 64, 64], rebel2: [128, 0, 64, 64],
      rebel3: [192, 0, 64, 64], rebel4: [256, 0, 64, 64], rebel5: [320, 0, 64, 64],
      rebel6: [384, 0, 64, 64], rebel7: [448, 0, 64, 64],
      rebelShoot: [512, 0, 64, 64], greIdle: [576, 0, 64, 64],
      greThrow: [640, 0, 64, 64], bazIdle: [704, 0, 64, 64]
    },
    titan: {
      stand: [0, 0, 207, 159], shoot: [207, 0, 207, 159], flash: [414, 0, 207, 159]
    }
  };
  const FILES = [
    { key: 'player', src: 'assets/player.png' },
    { key: 'enemies', src: 'assets/enemies.png' },
    { key: 'titan', src: 'assets/titan.png' },
    { key: 'bgFar', src: 'assets/bg-far.png' },
    { key: 'bgMid', src: 'assets/bg-mid.png' }
  ];
  const WEAPON_KEYS = ['handgun', 'hmg', 'rocket', 'shotgun', 'flame', 'laser', 'chaser'];

  const state = { loaded: 0, failed: 0, total: FILES.length, applied: false };
  window.PAM_ASSETS = state;

  function setStatus() {
    const el = document.getElementById('assetStatus');
    if (!el) return;
    if (state.applied) el.textContent = 'Aset gambar asli: AKTIF (Open Gunner CC-BY • latar ansimuz CC0).';
    else if (state.failed > 0 && state.loaded + state.failed >= state.total) {
      el.textContent = 'Sebagian aset tidak termuat — seluruh grafik memakai sprite cadangan (v3). Game tetap bisa dimainkan penuh.';
    } else if (state.loaded + state.failed >= state.total) el.textContent = '';
    else el.textContent = 'Memuat aset gambar… ' + state.loaded + '/' + state.total;
  }

  function slice(img, r) {
    const c = document.createElement('canvas');
    c.width = r[2]; c.height = r[3];
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
    return c;
  }

  // Siluet putih penuh untuk kilatan kena-hit (teknik yang sama seperti
  // whiteSilhouette() di sprites.js, diterapkan ke frame aset).
  function whiteSilhouette(img) {
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, c.width, c.height);
    return c;
  }

  function apply(imgs) {
    if (typeof SPR === 'undefined' || !SPR || !SPR.pIdle) return false;
    const P = {}, E = {}, T = {};
    for (const k in RECT.player) P[k] = slice(imgs.player, RECT.player[k]);
    for (const k in RECT.enemies) E[k] = slice(imgs.enemies, RECT.enemies[k]);
    for (const k in RECT.titan) T[k] = slice(imgs.titan, RECT.titan[k]);

    /* ---- Pemain: semua senjata memakai set frame aset yang sama
       (hero Open Gunner memegang satu meriam tangan besar; pembedaan
       per-senjata v3 gugur untuk peran ini — mekanik tidak berubah). */
    SPR.pIdle = P.idle;
    SPR.pIdleB = P.idleB;
    const run = [P.run0, P.run1, P.run2, P.run3, P.run4, P.run5, P.run6, P.run7];
    SPR.pRunByWeapon = {};
    SPR.pJumpByWeapon = {};
    SPR.pFireH = {}; SPR.pFireDiag = {}; SPR.pFireUp = {};
    SPR.pIdleGun = {}; SPR.pIdleGunB = {};
    SPR.pCrouchFire = {}; SPR.pCrouchUp = {};
    for (const w of WEAPON_KEYS) {
      SPR.pRunByWeapon[w] = run;
      SPR.pJumpByWeapon[w] = P.jump;
      SPR.pJumpByWeapon[w + 'Up'] = P.up;
      SPR.pJumpByWeapon[w + 'Diag'] = P.jumpDiag;
      SPR.pFireH[w] = P.idle;
      SPR.pFireDiag[w] = P.diag;
      SPR.pFireUp[w] = P.up;
      SPR.pIdleGun[w] = P.idle;
      SPR.pIdleGunB[w] = P.idleB;
      SPR.pCrouchFire[w] = P.crouch;
      SPR.pCrouchUp[w] = P.steep;
    }
    SPR.pCrouch = P.crouch;
    SPR.pThrow = P.throw;
    SPR.pMelee = P.damage;
    SPR.pVictory = P.up;
    SPR.pDie0 = P.damage;
    SPR.pDie1 = P.dash;
    SPR.pDie2 = P.prone;

    /* ---- Musuh: rebel (lari 8 frame + tembak), grenade (palet cokelat),
       bazooka (palet baja). Shield TIDAK ditimpa (tidak ada aset perisai
       yang cocok) — tetap sprite v3. Varian F = siluet putih kilatan. */
    SPR.rebelWalk = [E.rebel0, E.rebel1, E.rebel2, E.rebel3, E.rebel4, E.rebel5, E.rebel6, E.rebel7];
    SPR.rebelWalkF = SPR.rebelWalk.map(whiteSilhouette);
    SPR.rebelShoot = E.rebelShoot;
    SPR.rebelShootF = whiteSilhouette(E.rebelShoot);
    SPR.greIdle = E.greIdle;
    SPR.greIdleF = whiteSilhouette(E.greIdle);
    SPR.greThrow = E.greThrow;
    SPR.greThrowF = whiteSilhouette(E.greThrow);
    SPR.bazIdle = E.bazIdle;
    SPR.bazIdleF = whiteSilhouette(E.bazIdle);

    /* ---- Titan: mech Open Gunner. drawTitan di game.js memeriksa
       SPR.titanAsset; badan/lengan v3 hanya digambar bila bendera ini
       tidak ada. Core berdenyut & bar HP digambar kode seperti biasa. */
    SPR.titanMech = { stand: T.stand, shoot: T.shoot, flash: T.flash };
    SPR.titanMechF = whiteSilhouette(T.stand);
    SPR.titanAsset = true;

    /* ---- Latar: strip 960x270 aset ansimuz menggantikan strip gambar
       kode (langit & awan v3 dipertahankan — lapis aset transparan). */
    SPR.bgFar = imgs.bgFar;
    SPR.bgMid = imgs.bgMid;

    /* ---- Avatar judul: gambar ulang dari frame idle aset (potret
       helm+kepala diperbesar ke kanvas 108x108; CSS membulatkannya). */
    const ac = document.getElementById('avatarCanvas');
    if (ac) {
      const actx = ac.getContext('2d');
      actx.imageSmoothingEnabled = false;
      actx.clearRect(0, 0, ac.width, ac.height);
      actx.drawImage(P.idle, 16, 0, 34, 34, 0, 0, 108, 108);
    }

    state.applied = true;
    setStatus();
    return true;
  }

  // Muat semua berkas; terapkan hanya bila SEMUA berhasil — campuran
  // sebagian (mis. pemain aset + latar gagal) tidak konsisten secara gaya,
  // jadi kegagalan satu berkas = fallback penuh untuk SEMUA peran aset.
  const imgs = {};
  let settled = 0;
  function settle() {
    settled++;
    setStatus();
    if (settled < state.total) return;
    if (state.failed > 0) { setStatus(); return; }
    // SPR dibuat game.js saat evaluasi; skrip ini dimuat sesudahnya,
    // tetapi jaga-jaga tunggu hingga tersedia.
    let tries = 0;
    (function waitSPR() {
      if (apply(imgs)) return;
      if (++tries < 40) setTimeout(waitSPR, 50);
    })();
  }
  setStatus();
  for (const f of FILES) {
    const img = new Image();
    img.onload = () => { imgs[f.key] = img; state.loaded++; settle(); };
    img.onerror = () => { state.failed++; settle(); };
    img.src = f.src;
  }

  /* ---- v5: Tank Di-Cokka — "2D Side scrolling tank" oleh 2D Tyrant
     (CC0, OpenGameArt). Strip 3 frame animasi rantai roda, sudah
     di-mirror menghadap kiri & dipotong rapat (408x52) di assets/.
     Dimuat TERPISAH dari set utama di atas dengan SEMANTIK KETAT:
     hanya diterapkan bila set utama berhasil teraplikasi PENUH
     (state.applied). Bila set utama gagal (fallback v3) atau berkas
     tank ini gagal, Di-Cokka tetap memakai sprite gambar-kode —
     fallback satu-gaya-penuh v4 tidak pernah dicemari tank ini.
     SV-001 SENGAJA tidak memakai aset ini: turetnya menyatu & diam,
     sedangkan turet SV-001 wajib berputar 8 arah mengikuti pemain. */
  const tankState = { loaded: false, failed: false, applied: false };
  window.PAM_TANK = tankState;
  function tryApplyTank(img) {
    if (!state.applied || typeof SPR === 'undefined' || !SPR.tank) return false;
    const frames = [], framesF = [];
    for (let i = 0; i < 3; i++) {
      const f = slice(img, [i * 136, 0, 136, 52]);
      frames.push(f);
      framesF.push(whiteSilhouette(f));
    }
    SPR.tankFrames = frames;
    SPR.tankFramesF = framesF;
    SPR.tankAsset = true;
    tankState.applied = true;
    return true;
  }
  const tankImg = new Image();
  tankImg.onload = () => {
    tankState.loaded = true;
    // Set utama mungkin belum selesai dimuat; tunggu keputusannya.
    let tries = 0;
    (function waitMain() {
      if (tryApplyTank(tankImg)) return;
      const settledAll = state.loaded + state.failed >= state.total;
      if (settledAll && state.failed > 0) return; // set utama gagal: fallback penuh, tank ikut gugur
      if (++tries < 60) setTimeout(waitMain, 50);
    })();
  };
  tankImg.onerror = () => { tankState.failed = true; };
  tankImg.src = 'assets/tank.png';

  /* ---- v5: Ledakan — "Explosion Set 2" oleh Master484 (CC0 /
     Public Domain, OpenGameArt). Dua berkas peran berbeda:
     - explosion.png     → SPR.boom     (ledakan biasa: tong kecil,
       granat, roket, musuh meledak)
     - explosion-big.png → SPR.boomBig  (ledakan BESAR: kematian bos,
       Slug hancur, tong berantai — palet lebih panas + pijar tepi;
       dipilih render() dari flag p.boomBig di partikel)
     Frame hasil olahan: siluet jamur api sheet di-remap gradasi api
     berlapis (tepi merah gelap → oranye → kuning → inti pucat) dengan
     latar hitam diubah menjadi alfa; 4 frame 60x60 per strip.
     Semantik sama ketatnya dengan tank: TERPISAH dari set utama,
     hanya diterapkan bila set utama applied penuh; kegagalan salah
     satu berkas FX hanya menggugurkan peran FX itu sendiri —
     SPR.boom bawaan gambar-kode tetap menjadi fallback-nya. */
  const fxState = { boomApplied: false, bigApplied: false, boomFailed: false, bigFailed: false };
  window.PAM_FX = fxState;
  function loadFx(src, applyFn, okKey, failKey) {
    const img = new Image();
    img.onload = () => {
      let tries = 0;
      (function waitMain() {
        if (state.applied && typeof SPR !== 'undefined' && SPR.boom) {
          if (applyFn(img)) { fxState[okKey] = true; return; }
        }
        const settledAll = state.loaded + state.failed >= state.total;
        if (settledAll && state.failed > 0) return; // set utama gagal: FX ikut gugur
        if (++tries < 60) setTimeout(waitMain, 50);
      })();
    };
    img.onerror = () => { fxState[failKey] = true; };
    img.src = src;
  }
  function sliceStrip(img) {
    const frames = [];
    for (let i = 0; i < 4; i++) frames.push(slice(img, [i * 60, 0, 60, 60]));
    return frames;
  }
  loadFx('assets/explosion.png', (img) => { SPR.boom = sliceStrip(img); return true; }, 'boomApplied', 'boomFailed');
  loadFx('assets/explosion-big.png', (img) => { SPR.boomBig = sliceStrip(img); return true; }, 'bigApplied', 'bigFailed');
})();
