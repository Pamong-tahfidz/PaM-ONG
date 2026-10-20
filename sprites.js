'use strict';
/* =====================================================================
   PaM-ONG — sprites.js
   Semua sprite digambar PROSEDURAL dari peta piksel (array string) saat
   loading, dirender SEKALI ke offscreen canvas, lalu di-blit saat main.
   Tidak ada aset gambar eksternal sama sekali.
   Renderer peta piksel bersifat toleran: baris boleh beda panjang,
   karakter yang tidak ada di palet dianggap transparan.
   ===================================================================== */

// Palet global (satu huruf = satu warna)
const PAL = {
  k: '#20242a', // hitam / outline / mata
  s: '#eec39a', // kulit
  S: '#c98d5f', // kulit bayangan
  r: '#cf3434', // bandana merah
  R: '#932222', // bandana gelap
  v: '#5c8140', // rompi hijau
  V: '#3e5c2b', // rompi gelap
  t: '#9a8a63', // baju krem (lengan)
  p: '#66754c', // celana hijau
  P: '#47543a', // celana gelap
  o: '#6e4f30', // sepatu bot cokelat
  G: '#3b4046', // senjata gelap
  g: '#79828c', // senjata terang
  w: '#e8e4da', // putih
  y: '#f2c230', // kuning kuningan
  n: '#8a6f3f', // tali / ikat pinggang
  u: '#707a5e', // seragam Rebel
  U: '#4d5540', // seragam Rebel gelap
  h: '#59614a', // helm Rebel
  x: '#7c8894', // logam perisai terang
  X: '#454f59', // logam perisai gelap
  q: '#b9bcbe', // baju POW abu terang
  Q: '#8f9296', // baju POW gelap
  m: '#8a5a2e', // kayu sedang
  M: '#6e3d20', // kayu gelap
  W: '#a9713f', // kayu terang
  e: '#d84f35', // oranye ledakan
  c: '#7ec8e3'  // biru terang
};

// Buat canvas kosong
function makeCanvas(w, h, fn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  if (fn) fn(c.getContext('2d'), w, h);
  return c;
}

// Render peta piksel -> canvas
function spr(rows, pal) {
  pal = pal || PAL;
  let w = 0;
  for (const row of rows) if (row.length > w) w = row.length;
  const h = rows.length;
  return makeCanvas(w, h, (ctx) => {
    for (let yy = 0; yy < h; yy++) {
      const row = rows[yy];
      for (let xx = 0; xx < row.length; xx++) {
        const col = pal[row[xx]];
        if (col) { ctx.fillStyle = col; ctx.fillRect(xx, yy, 1, 1); }
      }
    }
  });
}

// Salinan canvas yang dibalik horizontal (untuk arah hadap & variasi lari)
function flipCanvas(src) {
  return makeCanvas(src.width, src.height, (ctx) => {
    ctx.translate(src.width, 0); ctx.scale(-1, 1);
    ctx.drawImage(src, 0, 0);
  });
}

// Siluet putih penuh (untuk kilatan kena-hit pada boss)
function whiteSilhouette(src) {
  const c = makeCanvas(src.width, src.height, (ctx) => {
    ctx.drawImage(src, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, src.width, src.height);
  });
  return c;
}

// Gabung badan-atas + kaki menjadi satu frame utuh (18 x totalH)
function compose(upper, legs, totalH, upperY, legsY) {
  return makeCanvas(18, totalH, (ctx) => {
    ctx.drawImage(legs, 0, legsY);
    ctx.drawImage(upper, 0, upperY);
  });
}

/* ---------------------------------------------------------------------
   PEMAIN "Pamong" — prajurit ORIGINAL: bandana merah, rompi hijau.
   Badan atas 18x15, kaki 18x11, frame utuh 18x26.
   --------------------------------------------------------------------- */
const UP_IDLE = [
  ".....rrrrr........",
  "....rrrrrrr.......",
  "....rrrrrrr.R.....",
  "....sssssss.......",
  "....sssksss.......",
  "....ssssss........",
  ".....ssss.........",
  "..vvvvvvvv........",
  ".vvvvvvvvv........",
  ".vvvvvvvvvt.......",
  ".vVvvvvvVvs.......",
  ".vvvvvvvvv.G......",
  "..vvvvvvv..G......",
  "..nnnnnnn.........",
  "..ppppppp........."
];
const UP_FIRE = [
  ".....rrrrr........",
  "....rrrrrrr.......",
  "....rrrrrrr.R.....",
  "....sssssss.......",
  "....sssksss.......",
  "....ssssss........",
  ".....ssss.........",
  "..vvvvvvvv........",
  ".vvvvvvvvvtsGGGGGG",
  ".vvvvvvvvv........",
  ".vVvvvvvVv........",
  ".vvvvvvvvv........",
  "..vvvvvvv.........",
  "..nnnnnnn.........",
  "..ppppppp........."
];
const UP_UP = [
  ".....rrrrr..GG....",
  "....rrrrrrr.GG....",
  "....rrrrrrr.Gg....",
  "....sssssss.s.....",
  "....sssksss.s.....",
  "....ssssss..s.....",
  ".....ssss..tt.....",
  "..vvvvvvvv........",
  ".vvvvvvvvv........",
  ".vVvvvvvVv........",
  ".vvvvvvvvv........",
  ".vvvvvvvvv........",
  "..vvvvvvv.........",
  "..nnnnnnn.........",
  "..ppppppp........."
];
const UP_DIAG = [
  ".....rrrrr......G.",
  "....rrrrrrr....G..",
  "....rrrrrrr..G....",
  "....sssssss.G.....",
  "....sssksssg......",
  "....ssssss........",
  ".....ssss.........",
  "..vvvvvvvv........",
  ".vvvvvvvvvts......",
  ".vvvvvvvvv........",
  ".vVvvvvvVv........",
  ".vvvvvvvvv........",
  "..vvvvvvv.........",
  "..nnnnnnn.........",
  "..ppppppp........."
];

const LEGS_IDLE = [
  "..ppp..ppp........",
  "..ppp..ppp........",
  "..pPp..pPp........",
  "..ppp..ppp........",
  "..ppp..ppp........",
  "..ppp..ppp........",
  "..ppp..ppp........",
  "..ppp..ppp........",
  "..ppp..ppp........",
  ".oooo..oooo.......",
  ".oooo..oooo......."
];
const LEGS_RUN1 = [
  "..ppp...ppp.......",
  "..ppp....ppp......",
  "...pp.....ppp.....",
  "...pp......pp.....",
  "...pp......pp.....",
  "....pp.....pp.....",
  "....pp............",
  "....pp............",
  "....pp...oooo.....",
  "...ooo............",
  "...oooo..........."
];
const LEGS_RUN2 = [
  "....ppp.ppp.......",
  "....pppppp........",
  ".....pppp.........",
  ".....ppp..........",
  "....ppp...........",
  "....ppp...........",
  "....pp............",
  "....pp............",
  "....pp............",
  "...oooo...........",
  "...oooo..........."
];
const LEGS_JUMP = [
  "..ppp..ppp........",
  "..ppp..ppp........",
  "..pppppppp........",
  "...pp...pp........",
  "...pp...pp........",
  "..ppp...ppp.......",
  "..pp.....pp.......",
  "..oo.....oo.......",
  "..................",
  "..................",
  ".................."
];
const LEGS_CROUCH = [
  "..................",
  "..................",
  "..................",
  "..................",
  "..pppppppp........",
  "..ppp...ppp.......",
  "..ppp....ppp......",
  "..ppp.....pp......",
  ".oooo.....ppp.....",
  "..........oooo....",
  "..........oooo...."
];

// Tubuh terbaring (frame mati terakhir) 26x8
const DIE_FLAT = [
  "..........................",
  "....rrrrr.................",
  "...ssssssss...............",
  "...ssssssss.vvvvvvvvvvv...",
  "....sssss.vvvvvvvvvvvvppoo",
  ".........vvvvvvvvvvvppppoo",
  "..........................",
  ".........................."
];

/* ---------------------------------------------------------------------
   MUSUH — semua digambar menghadap KIRI (arah pemain datang).
   Di-flip saat runtime bila menghadap kanan.
   --------------------------------------------------------------------- */
// Prajurit Rebel 16x24
const REBEL_HEAD_TORSO = [
  ".....hhhhhh.....",
  "....hhhhhhhh....",
  "....ssssss......",
  "....ksssss......",
  "....sssss.......",
  ".....sss........",
  "..uuuuuuuu......",
  "GGGGuuuuuu......",
  "....uuuuuu......",
  "....uUUuuu......",
  "....uuuuuu......",
  "....uuuuuu......",
  ".....uuuu.......",
  "....nnnnnn......"
];
const REBEL_LEGS_STAND = [
  "....UU..UU......",
  "....UU..UU......",
  "....UU..UU......",
  "....UU..UU......",
  "....UU..UU......",
  "....UU..UU......",
  "....UU..UU......",
  "....UU..UU......",
  "...ooo..ooo.....",
  "...ooo..ooo....."
];
const REBEL_LEGS_WALK = [
  "....UU...UU.....",
  "....UU....UU....",
  ".....UU...UU....",
  ".....UU....UU...",
  ".....UU.........",
  ".....UU..ooo....",
  "....UU..........",
  "....ooo.........",
  "....ooo.........",
  "................"
];
const REBEL_WALK0 = REBEL_HEAD_TORSO.concat(REBEL_LEGS_STAND);
const REBEL_WALK1 = REBEL_HEAD_TORSO.concat(REBEL_LEGS_WALK);
const REBEL_SHOOT = REBEL_HEAD_TORSO.slice();
REBEL_SHOOT[7] = "GGGGGsuuuu......"; // kedua tangan menembak

// Shield Soldier 18x24 — perisai besar di depan (kolom 0-3)
const SHIELD_BODY = [
  "......hhhhhh......",
  ".....hhhhhhhh.....",
  "xXXx.ssssss.......",
  "xXXx.ksssss.......",
  "xXXx.sssss........",
  "xXXx..sss.........",
  "GGXXuuuuuuu.......",
  "xXXxuuuuuuu.......",
  "xXXxuuuuuuu.......",
  "xXXx.uUUuuu.......",
  "xXXxuuuuuuu.......",
  "xXXxuuuuuuu.......",
  "xXXx.uuuu.........",
  "xXXx.nnnnnn......."
];
const SHIELD_LEGS_STAND = [
  ".....UU..UU.......",
  ".....UU..UU.......",
  ".....UU..UU.......",
  ".....UU..UU.......",
  ".....UU..UU.......",
  ".....UU..UU.......",
  ".....UU..UU.......",
  ".....UU..UU.......",
  "....ooo..ooo......",
  "....ooo..ooo......"
];
const SHIELD_LEGS_WALK = [
  ".....UU...UU......",
  ".....UU....UU.....",
  "......UU...UU.....",
  "......UU....UU....",
  "......UU..........",
  "......UU..ooo.....",
  ".....UU...........",
  ".....ooo..........",
  ".....ooo..........",
  ".................."
];
const SHIELD_WALK0 = SHIELD_BODY.concat(SHIELD_LEGS_STAND);
const SHIELD_WALK1 = SHIELD_BODY.concat(SHIELD_LEGS_WALK);
// Tanpa perisai (perisai hancur -> kabur), tangan terangkat panik
const SHIELD_BROKEN = [
  "......hhhhhh......",
  ".....hhhhhhhh.....",
  "s....ssssss.......",
  ".s...ksssss.......",
  "..s..sssss........",
  "...s..sss.........",
  "....uuuuuuu.......",
  "....uuuuuuu.......",
  "....uuuuuuu.......",
  "....uUUuuu........",
  "....uuuuuuu.......",
  "....uuuuuuu.......",
  ".....uuuu.........",
  "....nnnnnn........"
].concat(SHIELD_LEGS_WALK);

// Grenade Soldier 16x24
const GRE_BASE = [
  ".....hhhhhh.....",
  "....hhhhhhhh....",
  "....ssssss......",
  "....ksssss......",
  "....sssss.......",
  ".....sss........",
  "..uuuuuuuu......",
  "...uuuuuuu......",
  "....uuuuuu......",
  "....uUUuuu......",
  "....uuuuuu......",
  "....uuuuuu......",
  ".....uuuu.......",
  "....nnnnnn......"
].concat(REBEL_LEGS_STAND);
const GRE_THROW = [
  ".....hhhhhh..VV.",
  "....hhhhhhhh.VVV",
  "....ssssss...s..",
  "....ksssss..s...",
  "....sssss..s....",
  ".....sss..s.....",
  "..uuuuuuuus.....",
  "...uuuuuuu......",
  "....uuuuuu......",
  "....uUUuuu......",
  "....uuuuuu......",
  "....uuuuuu......",
  ".....uuuu.......",
  "....nnnnnn......"
].concat(REBEL_LEGS_STAND);

// POW — terikat (14x15), berjalan (14x22), melambai (14x22)
const POW_TIED = [
  "....ssss......",
  "...ssssss.....",
  "...skssss.....",
  "...ssssss.....",
  "....ssss......",
  "...qqqqqq.....",
  "..qqqqqqqq....",
  "..qnqqqqnq....",
  "..qqqqqqqq....",
  "...qqqqqq.....",
  "..qqq..qqq....",
  "..qq....qq....",
  ".qqq....qqq...",
  ".ooo....ooo...",
  ".............."
];
const POW_WALK0 = [
  "....ssss......",
  "...ssssss.....",
  "...skssss.....",
  "...ssssss.....",
  "....ssss......",
  "...qqqqqq.....",
  "..sqqqqqqs....",
  "..sqqqqqqs....",
  "...qqqqqq.....",
  "....qqqq......",
  "....Q..Q......",
  "....Q..Q......",
  "....Q..Q......",
  "....Q..Q......",
  "....Q..Q......",
  "....Q..Q......",
  "....Q..Q......",
  "....Q..Q......",
  "...ooo.ooo....",
  "...ooo.ooo....",
  "..............",
  ".............."
];
const POW_WALK1 = [
  "....ssss......",
  "...ssssss.....",
  "...skssss.....",
  "...ssssss.....",
  "....ssss......",
  "...qqqqqq.....",
  "..sqqqqqqs....",
  "..sqqqqqqs....",
  "...qqqqqq.....",
  "....qqqq......",
  "....Q..Q......",
  "....Q...Q.....",
  "....Q....Q....",
  "....Q.....Q...",
  "....Q.........",
  "....Q....ooo..",
  "....Q.........",
  "....Q.........",
  "...ooo........",
  "...ooo........",
  "..............",
  ".............."
];
const POW_WAVE = [
  "....ssss...s..",
  "...ssssss.s...",
  "...sksssss....",
  "...ssssss.....",
  "....ssss......",
  "...qqqqqq.....",
  "..sqqqqqq.....",
  "..sqqqqqq.....",
  "...qqqqqq.....",
  "....qqqq......",
  "....Q..Q......",
  "....Q..Q......",
  "....Q..Q......",
  "....Q..Q......",
  "....Q..Q......",
  "....Q..Q......",
  "....Q..Q......",
  "....Q..Q......",
  "...ooo.ooo....",
  "...ooo.ooo....",
  "..............",
  ".............."
];

/* ---------------------------------------------------------------------
   ITEM / OBJEK
   --------------------------------------------------------------------- */
const CRATE = [
  "mmmmmmmmmmmmmmmmmm",
  "mWWWWWWWWWWWWWWWWm",
  "mWmmmmmmmmmmmmmmWm",
  "mWmWWWWWWWWWWWWmWm",
  "mWmmWWWWWWWWWWmmWm",
  "mWmmmWWWWWWWWmmmWm",
  "mWmmmmWWWWWWmmmmWm",
  "mWmmmmmWWWWmmmmmWm",
  "mWmmmmWWWWWWmmmmWm",
  "mWmmmWWWWWWWWmmmWm",
  "mWmmWWWWWWWWWWmmWm",
  "mWmWWWWWWWWWWWWmWm",
  "mWmmmmmmmmmmmmmmWm",
  "mWWWWWWWWWWWWWWWWm",
  "mmmmmmmmmmmmmmmmmm",
  "..................",
  "..................",
  ".................."
];
const BARREL = [
  "...xxxxxx...",
  "..xXXXXXXx..",
  "..xXxxxxXx..",
  "..xXXXXXXx..",
  "..xXXXXXXx..",
  "..xXxxxxXx..",
  "..xXXXXXXx..",
  "..xXXXXXXx..",
  "..xXxxxxXx..",
  "..xXXXXXXx..",
  "..xxxxxxxx..",
  "............"
];
const SIGN = [
  ".....mmmmmmmmm..",
  "....mWWWWWWWWm..",
  "....mWWmmmmWm...",
  "....mWWWWWWm....",
  "....mWWWWWWWWm..",
  ".....mmmmmmmmm..",
  ".......mm.......",
  ".......mm.......",
  ".......mm.......",
  ".......mm.......",
  ".......mm.......",
  ".......mm......."
];
// Ikon pickup senjata (digambar melayang di atas tanah)
const ICON_HMG = [
  "................",
  "..GGGGGGGGGGG...",
  ".GGGGGGGGGGGGG..",
  ".ggggggggggg....",
  "....GG...GG.....",
  "....GG...GG.....",
  "................",
  "................"
];
const ICON_ROCKET = [
  "................",
  ".....GGGGGGG....",
  "...GGgggggggG...",
  "..GrGGGGGGGGG...",
  "..rrr....GGGG...",
  "..rr............",
  "................",
  "................"
];
const ICON_SHOTGUN = [
  "................",
  ".GGGGGGGGGGG....",
  "GGGGGGGGGGGGG...",
  "GGGGGGG.........",
  "..mmmm..........",
  "..mmmm..........",
  "................",
  "................"
];
const ICON_GRENADE = [
  "...kk...",
  "..kGGk..",
  ".GGGGGG.",
  ".GgGGgG.",
  ".GGGGGG.",
  ".GGGGGG.",
  "..GGGG..",
  "........"
];

/* ---------------------------------------------------------------------
   TANK MINI-BOSS "Di-Cokka" — digambar prosedural dengan perintah
   canvas SEKALI saat loading (56x38), menghadap kiri.
   --------------------------------------------------------------------- */
function drawTank() {
  return makeCanvas(56, 38, (ctx) => {
    // roda rantai (treads)
    ctx.fillStyle = '#2c3138';
    ctx.fillRect(4, 28, 48, 8);
    ctx.fillStyle = '#454f59';
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(9 + i * 8, 32, 3, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#20242a';
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(9 + i * 8, 32, 1, 0, 7); ctx.fill(); }
    // badan
    ctx.fillStyle = '#5d6b45';
    ctx.fillRect(6, 20, 44, 9);
    ctx.fillStyle = '#6d7c52';
    ctx.fillRect(6, 20, 44, 3);
    ctx.fillStyle = '#47543a';
    ctx.fillRect(6, 26, 44, 3);
    // hidung miring kiri
    ctx.fillStyle = '#5d6b45';
    ctx.fillRect(2, 23, 5, 6);
    // kubah turret
    ctx.fillStyle = '#66754c';
    ctx.fillRect(20, 12, 22, 9);
    ctx.fillStyle = '#77875c';
    ctx.fillRect(22, 10, 16, 3);
    ctx.fillStyle = '#47543a';
    ctx.fillRect(20, 19, 22, 2);
    // meriam ke kiri
    ctx.fillStyle = '#3b4046';
    ctx.fillRect(2, 14, 19, 4);
    ctx.fillStyle = '#20242a';
    ctx.fillRect(0, 13, 3, 6);
    // periskop + antena
    ctx.fillStyle = '#3b4046';
    ctx.fillRect(36, 6, 2, 5);
    ctx.fillRect(35, 5, 5, 2);
    // bintang kuning + garis peringatan
    ctx.fillStyle = '#f2c230';
    ctx.fillRect(28, 14, 5, 5);
    ctx.fillRect(24, 23, 3, 3);
    ctx.fillRect(44, 23, 3, 3);
    // mata lampu
    ctx.fillStyle = '#f2e29a';
    ctx.fillRect(4, 21, 2, 2);
  });
}

/* ---------------------------------------------------------------------
   LATAR — parallax 2 lapis, digambar sekali.
   bgFar: langit senja + pegunungan (640x224)
   bgNear: siluet pohon & reruntuhan, transparan (640x224)
   --------------------------------------------------------------------- */
function drawBgFar() {
  return makeCanvas(640, 224, (ctx) => {
    // gradien langit dibuat SEKALI di sini (bukan per frame)
    const grad = ctx.createLinearGradient(0, 0, 0, 224);
    grad.addColorStop(0, '#2e3a5c');
    grad.addColorStop(0.45, '#7a4a63');
    grad.addColorStop(0.75, '#c97b4a');
    grad.addColorStop(1, '#e8b06a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 224);
    // matahari
    ctx.fillStyle = '#f7d774';
    ctx.beginPath(); ctx.arc(500, 128, 20, 0, 7); ctx.fill();
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath(); ctx.arc(500, 128, 15, 0, 7); ctx.fill();
    // pegunungan jauh
    ctx.fillStyle = '#4a3a5e';
    ctx.beginPath();
    ctx.moveTo(0, 170);
    const peaks = [60, 120, 90, 150, 110, 160, 100, 140, 80, 130];
    for (let i = 0; i <= 10; i++) ctx.lineTo(i * 64, 170 - peaks[i % peaks.length] * 0.55);
    ctx.lineTo(640, 224); ctx.lineTo(0, 224); ctx.fill();
    // pegunungan dekat
    ctx.fillStyle = '#33283f';
    ctx.beginPath();
    ctx.moveTo(0, 192);
    const peaks2 = [40, 75, 30, 65, 45, 80, 35, 60, 50, 70];
    for (let i = 0; i <= 10; i++) ctx.lineTo(i * 64, 192 - peaks2[i % peaks2.length] * 0.5);
    ctx.lineTo(640, 224); ctx.lineTo(0, 224); ctx.fill();
  });
}

function drawBgNear(groundY) {
  return makeCanvas(640, 224, (ctx) => {
    ctx.fillStyle = '#241b2e';
    // reruntuhan bangunan
    ctx.fillRect(40, groundY - 62, 46, 62);
    ctx.fillRect(52, groundY - 74, 20, 12);
    ctx.fillRect(430, groundY - 48, 60, 48);
    ctx.fillRect(448, groundY - 58, 24, 10);
    // jendela reruntuhan (langit senja tembus)
    ctx.fillStyle = '#c97b4a';
    ctx.fillRect(50, groundY - 52, 8, 10);
    ctx.fillRect(64, groundY - 38, 8, 10);
    ctx.fillRect(444, groundY - 36, 9, 9);
    ctx.fillRect(466, groundY - 22, 9, 9);
    // pohon siluet
    ctx.fillStyle = '#1d1526';
    const trees = [150, 250, 330, 540, 610];
    for (const tx of trees) {
      ctx.fillRect(tx, groundY - 46, 5, 46);                // batang
      ctx.beginPath(); ctx.arc(tx + 2, groundY - 52, 17, 0, 7); ctx.fill();  // tajuk
      ctx.beginPath(); ctx.arc(tx - 10, groundY - 44, 11, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(tx + 14, groundY - 43, 12, 0, 7); ctx.fill();
    }
  });
}

// Ubin tanah 64x32 (diulang), digambar sekali dengan pola deterministik
function drawGroundTile() {
  return makeCanvas(64, 32, (ctx) => {
    ctx.fillStyle = '#6e5636';
    ctx.fillRect(0, 0, 64, 32);
    ctx.fillStyle = '#9a7d4f';
    ctx.fillRect(0, 0, 64, 5);
    ctx.fillStyle = '#b08d58';
    ctx.fillRect(0, 0, 64, 2);
    // bintik tanah deterministik (LCG sederhana)
    let seed = 12345;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    ctx.fillStyle = '#59432a';
    for (let i = 0; i < 26; i++) ctx.fillRect((rnd() * 62) | 0, 6 + ((rnd() * 24) | 0), 2, 1);
    ctx.fillStyle = '#83683f';
    for (let i = 0; i < 14; i++) ctx.fillRect((rnd() * 62) | 0, 6 + ((rnd() * 24) | 0), 2, 1);
    // rumput kecil di permukaan
    ctx.fillStyle = '#5c8140';
    for (let i = 0; i < 8; i++) { const gx = (rnd() * 60) | 0; ctx.fillRect(gx, 3, 1, 3); ctx.fillRect(gx + 2, 4, 1, 2); }
  });
}

// Ubin platform kayu 32x10
function drawWoodTile() {
  return makeCanvas(32, 10, (ctx) => {
    ctx.fillStyle = '#8a5a2e';
    ctx.fillRect(0, 0, 32, 10);
    ctx.fillStyle = '#a9713f';
    ctx.fillRect(0, 0, 32, 3);
    ctx.fillStyle = '#6e3d20';
    ctx.fillRect(0, 8, 32, 2);
    ctx.fillRect(15, 0, 2, 10);
    ctx.fillRect(31, 0, 1, 10);
  });
}

/* ---------------------------------------------------------------------
   Bangun semua sprite menjadi objek SPR (dipanggil sekali saat boot)
   --------------------------------------------------------------------- */
function buildSprites(groundY) {
  const upIdle = spr(UP_IDLE), upFire = spr(UP_FIRE), upUp = spr(UP_UP), upDiag = spr(UP_DIAG);
  const legsIdle = spr(LEGS_IDLE), legsRun1 = spr(LEGS_RUN1), legsRun2 = spr(LEGS_RUN2);
  const legsJump = spr(LEGS_JUMP), legsCrouch = spr(LEGS_CROUCH);
  const legsRun3 = flipCanvas(legsRun1), legsRun4 = flipCanvas(legsRun2);

  const S = {};
  // Pemain: frame utuh 18x26 (badan atas di y=0, kaki di y=15)
  S.pIdle = compose(upIdle, legsIdle, 26, 0, 15);
  S.pFireH = compose(upFire, legsIdle, 26, 0, 15);
  S.pFireUp = compose(upUp, legsIdle, 26, 0, 15);
  S.pFireDiag = compose(upDiag, legsIdle, 26, 0, 15);
  S.pRun = [
    compose(upFire, legsRun1, 26, 0, 15),
    compose(upFire, legsRun2, 26, 0, 15),
    compose(upFire, legsRun3, 26, 0, 15),
    compose(upFire, legsRun4, 26, 0, 15)
  ];
  S.pJumpH = compose(upFire, legsJump, 26, 0, 15);
  S.pJumpUp = compose(upUp, legsJump, 26, 0, 15);
  S.pJumpDiag = compose(upDiag, legsJump, 26, 0, 15);
  S.pThrow = compose(upUp, legsIdle, 26, 0, 15);
  // Jongkok: canvas 18x20, badan atas menimpa kaki jongkok
  S.pCrouch = compose(upIdle, legsCrouch, 20, 0, 9);
  S.pCrouchFire = compose(upFire, legsCrouch, 20, 0, 9);
  // Mati: frame jatuh miring (dirotasi saat komposisi) + terbaring
  S.pDie0 = makeCanvas(26, 26, (ctx) => {
    ctx.translate(13, 15); ctx.rotate(-0.9);
    ctx.drawImage(S.pFireH, -9, -24);
  });
  S.pDie1 = spr(DIE_FLAT);

  // Musuh
  S.rebelWalk = [spr(REBEL_WALK0), spr(REBEL_WALK1)];
  S.rebelShoot = spr(REBEL_SHOOT);
  S.shieldWalk = [spr(SHIELD_WALK0), spr(SHIELD_WALK1)];
  S.shieldBroken = spr(SHIELD_BROKEN);
  S.greIdle = spr(GRE_BASE);
  S.greThrow = spr(GRE_THROW);

  // POW
  S.powTied = spr(POW_TIED);
  S.powWalk = [spr(POW_WALK0), spr(POW_WALK1)];
  S.powWave = spr(POW_WAVE);

  // Objek & ikon
  S.crate = spr(CRATE);
  S.barrel = spr(BARREL);
  S.sign = spr(SIGN);
  S.iconHmg = spr(ICON_HMG);
  S.iconRocket = spr(ICON_ROCKET);
  S.iconShotgun = spr(ICON_SHOTGUN);
  S.iconGrenade = spr(ICON_GRENADE);

  // Boss
  S.tank = drawTank();
  S.tankFlash = whiteSilhouette(S.tank);

  // Latar & ubin
  S.bgFar = drawBgFar();
  S.bgNear = drawBgNear(groundY);
  S.groundTile = drawGroundTile();
  S.woodTile = drawWoodTile();

  return S;
}
