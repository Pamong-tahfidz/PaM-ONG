'use strict';
/* =====================================================================
   PaM-ONG — sprites.js (v2)
   Semua sprite digambar PROSEDURAL dari peta piksel (array string) saat
   loading, dirender SEKALI ke offscreen canvas, lalu di-blit saat main.
   Tidak ada aset gambar eksternal sama sekali.
   v2: pemain digambar ulang lebih besar (±40px) & terpisah KAKI + TORSO
   seperti Metal Slug asli; avatar potret; musuh & bos digambar ulang;
   latar 3 lapis parallax di-prerender; set dressing dunia diperkaya.
   ===================================================================== */

// Palet (satu huruf = satu warna; dua tingkat bayangan per warna utama)
const PAL = {
  k: '#20242a', // hitam / outline / mata
  s: '#f0cd9e', // kulit terang
  S: '#c98d5f', // kulit bayangan
  r: '#d63a3a', // bandana merah terang
  R: '#932222', // bandana merah gelap
  v: '#67984a', // rompi hijau terang
  V: '#3e5c2b', // rompi hijau gelap
  t: '#b09a6c', // baju krem terang
  T: '#8a744c', // baju krem gelap
  p: '#75855a', // celana terang
  P: '#4c5a3a', // celana gelap
  o: '#7d5732', // sepatu bot terang
  O: '#523a20', // sepatu bot gelap
  G: '#3b4046', // senjata/baja gelap
  g: '#8b95a0', // senjata/baja terang
  w: '#e8e4da', // putih
  y: '#f2c230', // kuning kuningan
  n: '#8a6f3f', // tali / ikat pinggang
  u: '#7d8a68', // seragam Rebel terang
  U: '#4d5540', // seragam Rebel gelap
  h: '#6a7458', // helm Rebel
  x: '#93a3b1', // logam perisai terang
  X: '#454f59', // logam perisai gelap
  q: '#c4c7c9', // baju POW terang
  Q: '#8f9296', // baju POW gelap
  m: '#8a5a2e', // kayu sedang
  M: '#6e3d20', // kayu gelap
  W: '#a9713f', // kayu terang
  e: '#d84f35', // oranye ledakan
  c: '#7ec8e3', // biru terang
  a: '#3f7fbf', // baja biru Titan terang
  A: '#274a73', // baja biru Titan gelap
  d: '#58c7d8', // core sian menyala
  f: '#e87e35', // api oranye
  z: '#4d7942'  // kulit monster laut hijau
};

function makeCanvas(w, h, fn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  if (fn) fn(c.getContext('2d'), w, h);
  return c;
}

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

function flipCanvas(src) {
  return makeCanvas(src.width, src.height, (ctx) => {
    ctx.translate(src.width, 0); ctx.scale(-1, 1);
    ctx.drawImage(src, 0, 0);
  });
}

function whiteSilhouette(src) {
  const c = makeCanvas(src.width, src.height, (ctx) => {
    ctx.drawImage(src, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, src.width, src.height);
  });
  return c;
}

/* =====================================================================
   PEMAIN "Pamong" v2 — total 24x40. TORSO 24x23 (y 0..22), KAKI 24x17
   (digambar di y 23..39). Sprite dasar menghadap KANAN.
   ===================================================================== */
// --- TORSO: menghadap kanan, tanpa senjata (senjata digambar terpisah) ---
const TORSO_FRONT = [
  "......rrrrrr........",
  ".....rrrrrrrr.......",
  ".....rrrrrrrr.......",
  ".....rrrrrrrRR......",
  ".....ssssssss.......",
  ".....ssskksss.......",  // mata memicing ke depan
  ".....ssssssss.......",
  "......SSSSSS........",
  ".......SSSS.........",
  "..vvvvvvvvvv........",
  ".vvvvvvvvvvvv.......",
  ".vVvvvvvvvvvvs......",  // tangan kanan (kulit) mulai terlihat
  ".vVvvvvvvvvvsss.....",
  ".vvvvvvvvvvvv.......",
  "..vVvvvvvvVv........",
  "..vvvvvvvvvv........",
  "..nnnnnnnnnn........",
  "...pppppppp.........",
  "...pppppppp.........",
  "...pppppppp.........",
  "...pppppppp.........",
  "...pppppppp.........",
  "...pppppppp........."
];
const TORSO_UP = [
  "......rrrrrr..ss....",
  ".....rrrrrrrr.ss....",
  ".....rrrrrrrr.ss....",
  ".....rrrrrrrRRtt....",
  ".....sssssssstt.....",
  ".....ssskksss.......",
  ".....ssssssss.......",
  "......SSSSSS........",
  ".......SSSS.........",
  "..vvvvvvvvvv........",
  ".vvvvvvvvvvvv.......",
  ".vVvvvvvvvvvv.......",
  ".vVvvvvvvvvvv.......",
  ".vvvvvvvvvvvv.......",
  "..vVvvvvvvVv........",
  "..vvvvvvvvvv........",
  "..nnnnnnnnnn........",
  "...pppppppp.........",
  "...pppppppp.........",
  "...pppppppp.........",
  "...pppppppp.........",
  "...pppppppp.........",
  "...pppppppp........."
];
const TORSO_DIAG = [
  "......rrrrrr...ss...",
  ".....rrrrrrrr..ss...",
  ".....rrrrrrrr.ss....",
  ".....rrrrrrrRt......",
  ".....ssssssss.......",
  ".....ssskksss.......",
  ".....ssssssss.......",
  "......SSSSSS........",
  ".......SSSS.........",
  "..vvvvvvvvvv........",
  ".vvvvvvvvvvvv.......",
  ".vVvvvvvvvvvvs......",
  ".vVvvvvvvvvvsss.....",
  ".vvvvvvvvvvvv.......",
  "..vVvvvvvvVv........",
  "..vvvvvvvvvv........",
  "..nnnnnnnnnn........",
  "...pppppppp.........",
  "...pppppppp.........",
  "...pppppppp.........",
  "...pppppppp.........",
  "...pppppppp.........",
  "...pppppppp........."
];
const TORSO_THROW = [ // lengan kanan terayun ke belakang-atas
  "......rrrrrr.....s..",
  ".....rrrrrrrr...ss..",
  ".....rrrrrrrr...s...",
  ".....rrrrrrrRR......",
  ".....ssssssss.......",
  ".....ssskksss.......",
  ".....ssssssss.......",
  "......SSSSSS........",
  ".......SSSS.........",
  "..vvvvvvvvvv........",
  ".vvvvvvvvvvvv.......",
  ".vVvvvvvvvvv........",
  ".vVvvvvvvvvv........",
  ".vvvvvvvvvvvv.......",
  "..vVvvvvvvVv........",
  "..vvvvvvvvvv........",
  "..nnnnnnnnnn........",
  "...pppppppp.........",
  "...pppppppp.........",
  "...pppppppp.........",
  "...pppppppp.........",
  "...pppppppp.........",
  "...pppppppp........."
];
const TORSO_MELEE = [ // lengan teracung ke depan
  "......rrrrrr........",
  ".....rrrrrrrr.......",
  ".....rrrrrrrr.......",
  ".....rrrrrrrRR......",
  ".....ssssssss.......",
  ".....ssskksss.......",
  ".....ssssssss.......",
  "......SSSSSS........",
  ".......SSSS.........",
  "..vvvvvvvvvv........",
  ".vvvvvvvvvvvv.......",
  ".vVvvvvvvvvvvssss...",
  ".vVvvvvvvvvvv.......",
  ".vvvvvvvvvvvv.......",
  "..vVvvvvvvVv........",
  "..vvvvvvvvvv........",
  "..nnnnnnnnnn........",
  "...pppppppp.........",
  "...pppppppp.........",
  "...pppppppp.........",
  "...pppppppp.........",
  "...pppppppp.........",
  "...pppppppp........."
];
const TORSO_CROUCH = [ // torso jongkok (dipakai di komposisi 24x30)
  "......rrrrrr........",
  ".....rrrrrrrr.......",
  ".....rrrrrrrr.......",
  ".....rrrrrrrRR......",
  ".....ssssssss.......",
  ".....ssskksss.......",
  ".....ssssssss.......",
  "......SSSSSS........",
  ".......SSSS.........",
  "..vvvvvvvvvv........",
  ".vvvvvvvvvvvv.......",
  ".vVvvvvvvvvvvs......",
  ".vVvvvvvvvvvsss.....",
  ".vvvvvvvvvvvv.......",
  "..vVvvvvvvVv........",
  "..vvvvvvvvvv........",
  "..nnnnnnnnnn........",
  "...pppppppp........."
];

// --- KAKI (24x17), digambar di y=23 pada komposisi utuh ---
const LEGS_IDLE = [
  "....pppp..pppp......",
  "....pppp..pppp......",
  "....pPpp..pPpp......",
  "....pppp..pppp......",
  "....pppp..pppp......",
  "....pppp..pppp......",
  "....pPpp..pPpp......",
  "....pppp..pppp......",
  "....pppp..pppp......",
  "....pppp..pppp......",
  "....pppp..pppp......",
  "....pppp..pppp......",
  "....pppp..pppp......",
  "...ooooo..ooooo.....",
  "...ooooo..ooooo.....",
  "...ooooo..ooooo.....",
  "...OOOOO..OOOOO....."
];
const LEGS_RUN0 = [
  "....pppp...pppp.....",
  "....pppp....pppp....",
  "....pPpp.....ppp....",
  ".....ppp......pp....",
  ".....ppp......pp....",
  ".....pp.......pp....",
  ".....pp.......pp....",
  ".....pp.............",
  "....ppp.............",
  "....ppp.............",
  "....pp..............",
  "....pp......oooo....",
  "...oooo.....oooo....",
  "...oooo.............",
  "...oooo.............",
  "..ooooo.............",
  "..OOOOO.............",
  "...................."
];
const LEGS_RUN1 = [
  ".....pppppppp.......",
  ".....pppppppp.......",
  "......pppppp........",
  "......ppppp.........",
  "......pppp..........",
  ".....pppp...........",
  ".....ppp............",
  ".....ppp............",
  ".....pp.............",
  ".....pp.............",
  ".....pp.............",
  "....oooo............",
  "....oooo............",
  "....oooo............",
  "...ooooo............",
  "...ooooo............",
  "...OOOOO............"
];
const LEGS_RUN2 = [
  "....pppp....pppp....",
  "....pppp....pppp....",
  "....pppp.....ppp....",
  "....pppp......pp....",
  "....pppp......pp....",
  "....pppp......pp....",
  "....pppp......pp....",
  "....pppp............",
  "....pppp............",
  "....pppp....ooo.....",
  "....pppp...oooo.....",
  "....pppp..oooo......",
  "....pppp............",
  "....pppp............",
  "....pppp............",
  "...ooooo............",
  "...OOOOO............",
  "...................."
];
const LEGS_RUN3 = [
  "......pppppp........",
  ".....pppppppp.......",
  ".....ppppppp........",
  "......ppppp.........",
  "......pppp..........",
  ".....pppp...........",
  ".....pppp...........",
  ".....ppp............",
  ".....ppp............",
  "....pppp............",
  "....pppp............",
  "...ooooo............",
  "...ooooo............",
  "...ooooo............",
  "...ooooo............",
  "...ooooo............",
  "...OOOOO............",
  "...................."
];
const LEGS_JUMP = [
  "....pppp..pppp......",
  "....pppp...ppp......",
  "....pppppppppp......",
  "....pppp...ppp......",
  "....ppp.....pp......",
  "....ppp.....pp......",
  "...ppp.......pp.....",
  "...ppp.......pp.....",
  "...pp.........pp....",
  "...pp.........pp....",
  "...pp.........pp....",
  "..oooo.......oooo...",
  "..oooo.......oooo...",
  "..oooo.......oooo...",
  "..oooo.......oooo...",
  "..OOOO.......OOOO...",
  "....................",
  "...................."
];
const LEGS_CROUCH = [ // 24x7, digambar di y=23 pada komposisi jongkok 24x30
  "...pppppppppppp.....",
  "...pppppppppppp.....",
  "...ppp......pppp....",
  "...ppp.......ppp....",
  "..oooo........pppp..",
  "..oooooooo.....ppp..",
  "..OOOOOOOO....oooo.."
];
// Frame mati: terpental (tubuh miring di komposisi canvas 40x24)
const DIE_FLAT = [ // terkapar 36x10
  "....................................",
  "....rrrrrr..........................",
  "...ssssssss.........................",
  "...sskkssss..vvvvvvvvvvvvvv.........",
  "....ssssss.vvvvvvvvvvvvvvvvvppp.....",
  ".........vvvvvvvvvvvvvvvvvvvvppppoo.",
  "..........nnnnnnnnnnn.......ppppooo.",
  "....................................",
  "....................................",
  "...................................."
];

// Senjata tangan (digambar terpisah dari torso, asal gambar di moncong torso)
const GUN_PISTOL = [
  "GGGGGGG.....",
  "Gggggggg....",
  ".GG..ss.....",
  ".....ss....."
];
const GUN_HMG = [
  "GGGGGGGGGGGG....",
  "Gggggggggggg....",
  ".GGGgGGgGGG.....",
  "..GG..sss.......",
  "......sss......."
];
const GUN_ROCKET = [
  ".GGGGGGGGGGGGG..",
  "GGgggggggggggGG.",
  "GGGGGGGGGGGGGGG.",
  ".GGG..sss.......",
  "......sss......."
];
const GUN_SHOTGUN = [
  "GGGGGGGGGGGG....",
  "GGGGGGGGGGG.....",
  ".mmmmmmmm.......",
  "..GG.sss........",
  ".....sss........"
];
const GUN_FLAME = [
  ".GGGGGGGGGGG....",
  "GGgggGGGGGGG....",
  ".GGGG..y........",
  "..GG..sss.......",
  "......sss......."
];
const GUN_LASER = [
  "GGGGGGGGGGGGG...",
  "GgGGccGGGGGGG...",
  ".GGG...sss......",
  ".......sss......"
];
const GUN_CHASER = [
  ".GGGGGGGGG......",
  "GGgggggggGG.....",
  "GGGGGGG..sss....",
  ".GG......sss...."
];
const KNIFE = [
  "....wwww",
  "..wwwwww",
  "nnww....",
  "nn......"
];

/* ---------------------------------------------------------------------
   MUSUH — digambar menghadap KIRI. Runtime di-flip bila menghadap kanan.
   --------------------------------------------------------------------- */
function enemyTorso(armRow7, helmet) {
  const H = helmet || 'h';
  return [
    "......" + H.repeat(6) + "......",
    "....." + H.repeat(8) + ".....",
    ".....sssssss.......",
    ".....kssssss.......",
    ".....ssssss........",
    "......ssss.........",
    "...uuuuuuuuu.......",
    armRow7,
    "....uuuuuuuu.......",
    "....uuUUuuu........",
    "....uuuuuuuu.......",
    "....uuuuuuuu.......",
    ".....uuuuuu........",
    "....nnnnnnn........",
    "....pppppp........."
  ];
}
const EN_LEGS_STAND = [
  "....ppp..ppp........",
  "....ppp..ppp........",
  "....Ppp..Ppp........",
  "....ppp..ppp........",
  "....ppp..ppp........",
  "....ppp..ppp........",
  "....ppp..ppp........",
  "....ppp..ppp........",
  "....ppp..ppp........",
  "...ooo....ooo.......",
  "...ooo....ooo......."
];
const EN_LEGS_WALK0 = [
  "....ppp...ppp.......",
  "....ppp....ppp......",
  "....ppp.....pp......",
  "....ppp.....pp......",
  "....pp......pp......",
  "....pp.......pp.....",
  "....pp........pp....",
  "....pp..............",
  "...ooo..............",
  "...ooo....ooo.......",
  "..........ooo......."
];
const EN_LEGS_WALK1 = [
  ".....ppppppp........",
  ".....pppppp.........",
  "......pppp..........",
  "......pppp..........",
  ".....pppp...........",
  ".....ppp............",
  ".....ppp............",
  ".....pp.............",
  "....ooo.............",
  "....ooo.............",
  "...oooo.............",
  "...................."
];
function enemySprite(armRow7, legs) {
  return enemyTorso(armRow7).concat(legs);
}
// Rebel: berjalan (2 frame) & menembak
const REBEL_WALK0 = enemySprite("GGGGGsuuuuu........", EN_LEGS_WALK0);
const REBEL_WALK1 = enemySprite("GGGGGsuuuuu........", EN_LEGS_WALK1);
const REBEL_SHOOT = enemySprite("GGGGGGGssssuu......", EN_LEGS_STAND);
// Grenade Soldier: diam & lempar
const GRE_IDLE = enemySprite("...uuuuuuuu........", EN_LEGS_STAND);
const GRE_THROW = [
  "......hhhhhh.....s..",
  ".....hhhhhhhh...ss..",
  ".....sssssss...ss...",
  ".....kssssss..s.....",
  ".....ssssss..s......",
  "......ssss..s.......",
  "...uuuuuuuuuus......",
  "GGGuuuuuuuuu........",
  "....uuuuuuuu........",
  "....uuUUuuu.........",
  "....uuuuuuuu........",
  "....uuuuuuuu........",
  ".....uuuuuu.........",
  "....nnnnnnn.........",
  "....pppppp.........."
].concat(EN_LEGS_STAND);
// Bazooka Soldier: tabung bazooka di bahu
const BAZ_IDLE = enemySprite("GGGGGGGGuuuuu.......", EN_LEGS_STAND);

// Shield Soldier 22x26 — perisai tegas di kolom 0-4
const SHIELD_BODY = [
  "........hhhhhh........",
  ".......hhhhhhhh.......",
  "xxxxx..sssssss........",
  "xXXXx..kssssss........",
  "xXXXx..ssssss.........",
  "xXXXx...ssss..........",
  "GGXxxuuuuuuuuu........",
  "xXXXxuuuuuuuuu........",
  "xXXXxuuuuuuuuu........",
  "xXXXx.uuUUuuu.........",
  "xXXXxuuuuuuuuu........",
  "xXXXxuuuuuuuuu........",
  "xXXXx.uuuuuu..........",
  "xXXXx.nnnnnnn.........",
  "xXXXx.pppppp.........."
];
const SHIELD_LEGS0 = [
  "......ppp..ppp........",
  "......ppp..ppp........",
  "......Ppp..Ppp........",
  "......ppp..ppp........",
  "......ppp..ppp........",
  "......ppp..ppp........",
  "......ppp..ppp........",
  "......ppp..ppp........",
  "......ppp..ppp........",
  ".....ooo....ooo.......",
  ".....ooo....ooo......."
];
const SHIELD_LEGS1 = [
  "......ppp...ppp.......",
  "......ppp....ppp......",
  "......ppp.....pp......",
  "......ppp.....pp......",
  "......pp......pp......",
  "......pp.......pp.....",
  "......pp........pp....",
  "......pp..............",
  ".....ooo..............",
  ".....ooo....ooo.......",
  "............ooo......."
];
const SHIELD_WALK0 = SHIELD_BODY.concat(SHIELD_LEGS0);
const SHIELD_WALK1 = SHIELD_BODY.concat(SHIELD_LEGS1);
const SHIELD_BROKEN = [
  "........hhhhhh........",
  ".......hhhhhhhh.......",
  "..s....sssssss........",
  "...s...kssssss........",
  "....s..ssssss.........",
  ".....s..ssss..........",
  ".....uuuuuuuuu........",
  ".....uuuuuuuuu........",
  ".....uuuuuuuuu........",
  ".....uuUUuuu..........",
  ".....uuuuuuuuu........",
  ".....uuuuuuuuu........",
  "......uuuuuu..........",
  ".....nnnnnnn..........",
  ".....pppppp..........."
].concat(SHIELD_LEGS1);

/* ---------------------------------------------------------------------
   POW — terikat 16x20, berjalan & melambai 16x26 (2 frame lambaian)
   --------------------------------------------------------------------- */
const POW_HEAD = [
  ".....ssssss.....",
  "....ssssssss....",
  "....skksssss....",
  "....ssssssss....",
  ".....ssssss.....",
  "....qqqqqqqq....",
  "...qqqqqqqqqq...",
  "...qnqqqqqqnq...",
  "...qqqqqqqqqq...",
  "....qqqqqqqq...."
];
const POW_TIED = POW_HEAD.concat([
  "....qqq..qqq....",
  "....qq....qq....",
  "....qq....qq....",
  "...qqq....qqq...",
  "...ooo....ooo...",
  "...ooo....ooo...",
  "................",
  "................",
  "................",
  "................"
]);
const POW_LEGS0 = [
  "....qqq..qqq....",
  "....qqq..qqq....",
  "....QQQ..QQQ....",
  "....qqq..qqq....",
  "....qqq..qqq....",
  "....qqq..qqq....",
  "....qqq..qqq....",
  "....qqq..qqq....",
  "....qqq..qqq....",
  "....qqq..qqq....",
  "....qqq..qqq....",
  "....qqq..qqq....",
  "....qqq..qqq....",
  "....qqq..qqq....",
  "...oooo..oooo...",
  "...oooo..oooo..."
];
const POW_LEGS1 = [
  "....qqq..qqq....",
  "....qqq...qqq...",
  "....QQQ....qqq..",
  "....qqq.....qq..",
  "....qqq.....qq..",
  "....qqq.........",
  "....qqq.........",
  "....qqq.....qq..",
  "....qqq....qqq..",
  "....qqq...oooo..",
  "....qqq.........",
  "....qqq.........",
  "....qqq.........",
  "...oooo.........",
  "...oooo.........",
  "................"
];
const POW_BODY_WALK = POW_HEAD.slice(0, 5).concat([
  "....qqqqqqqq....",
  "...sqqqqqqqqs...",
  "...sqqqqqqqqs...",
  "....qqqqqqqq....",
  ".....qqqqqq....."
]);
const POW_WALK0 = POW_BODY_WALK.concat(POW_LEGS0);
const POW_WALK1 = POW_BODY_WALK.concat(POW_LEGS1);
const POW_WAVE0 = [
  ".....ssssss...s.",
  "....ssssssss.ss.",
  "....skkssssss...",
  "....ssssssss....",
  ".....ssssss.....",
  "....qqqqqqqq....",
  "...sqqqqqqqq....",
  "...sqqqqqqqq....",
  "....qqqqqqqq....",
  ".....qqqqqq....."
].concat(POW_LEGS0);
const POW_WAVE1 = [
  ".....ssssss.s...",
  "....sssssssss...",
  "....skksssss....",
  "....ssssssss....",
  ".....ssssss.....",
  "....qqqqqqqq....",
  "...sqqqqqqqq....",
  "...sqqqqqqqq....",
  "....qqqqqqqq....",
  ".....qqqqqq....."
].concat(POW_LEGS0);

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
  "...eeeeee...",
  "..eEEEEEEe..",
  "..eEeeeeEe..",
  "..eEEEEEEe..",
  "..eEEEEEEe..",
  "..eEeeeeEe..",
  "..eEEEEEEe..",
  "..eEEEEEEe..",
  "..eEeeeeEe..",
  "..eEEEEEEe..",
  "..eeeeeeee..",
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
const ICON_FLAME = [
  "................",
  "....ff..........",
  "...feff...GGGG..",
  "..feeeefGGGGGG..",
  "...feef..GG.....",
  "....ff..........",
  "................",
  "................"
];
const ICON_LASER = [
  "................",
  "..GGGGGGGGGG....",
  ".GGccGGGGGGG....",
  ".GGGGGGGG.......",
  "..GG............",
  "..GG............",
  "................",
  "................"
];
const ICON_CHASER = [
  "................",
  "....GGGGGG......",
  "...GGggggGG.....",
  "...GGGGGGG......",
  "....G..G........",
  "................",
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
const ICON_FIREBOMB = [
  "...kk...",
  "..keek..",
  ".eeffee.",
  ".effffe.",
  ".eeffee.",
  ".eeeeee.",
  "..eeee..",
  "........"
];
const ICON_CANNON = [
  "................",
  "..GGGGGGGG......",
  ".GGGGGGGGGG.....",
  ".GggggggggG.....",
  "..GGGGGGGG......",
  "................",
  "................",
  "................"
];

/* ---------------------------------------------------------------------
   AVATAR Pamong — potret bust 72x72 (untuk layar judul) + kepala 16x16
   (penanda nyawa HUD). Digambar prosedural dari peta piksel kasar yang
   diskalakan 4x (blok piksel besar) + lingkaran latar digambar canvas.
   --------------------------------------------------------------------- */
const AVATAR_ROWS = [
  "..................",
  ".....rrrrrrr......",
  "....rrrrrrrrr.....",
  "....rrrrrrrrr.....",
  "....sssssssss.....",
  "....sskkssks......",
  "....ssssssss......",
  ".....ssssss.......",
  "..vvvvvvvvvvvv....",
  ".vvvvvvvvvvvvvv...",
  ".vvvvvvvvvvvvvv...",
  ".vvVvvvvvvvvVvv...",
  "..vvvvvvvvvvvv....",
  "...nnnnnnnnnn.....",
  "..................",
  "..................",
  "..................",
  ".................."
];
function drawAvatar() {
  const bust = spr(AVATAR_ROWS);
  return makeCanvas(72, 72, (ctx) => {
    // lingkaran latar
    ctx.fillStyle = '#31435f';
    ctx.beginPath(); ctx.arc(36, 36, 34, 0, 7); ctx.fill();
    ctx.fillStyle = '#3f5a80';
    ctx.beginPath(); ctx.arc(36, 33, 30, 0, 7); ctx.fill();
    ctx.fillStyle = '#2a2f38';
    ctx.fillRect(0, 58, 72, 14);
    // bust diskalakan 4x (piksel besar) dipotong lingkaran
    ctx.save();
    ctx.beginPath(); ctx.arc(36, 36, 34, 0, 7); ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bust, 0, 4, 72, 72);
    ctx.restore();
    // bingkai
    ctx.strokeStyle = '#f2c230';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(36, 36, 33, 0, 7); ctx.stroke();
  });
}
const HEAD_ROWS = [
  "..rrrrrr..",
  ".rrrrrrrr.",
  ".rrrrrrrr.",
  ".ssssssss.",
  ".sskssk...",
  ".ssssssss.",
  "..ssssss..",
  ".vvvvvvvv.",
  "vvvvvvvvvv",
  "vvvvvvvvvv"
];
function drawHeadIcon() { return spr(HEAD_ROWS); }

/* ---------------------------------------------------------------------
   SV-001 "METAL SLUG" — prosedural canvas 52x34, menghadap KANAN.
   Badan + roda; turet digambar terpisah (berputar 8 arah) oleh game.js
   dari S.slugTurret (segitiga laras sederhana digambar di canvas sendiri).
   --------------------------------------------------------------------- */
function drawSlugBody() {
  return makeCanvas(52, 34, (ctx) => {
    // rantai roda
    ctx.fillStyle = '#24282e'; ctx.fillRect(3, 25, 46, 8);
    ctx.fillStyle = '#4a5560';
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(8 + i * 7.5, 29, 3, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#171a1e';
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(8 + i * 7.5, 29, 1.2, 0, 7); ctx.fill(); }
    // lambung
    ctx.fillStyle = '#6d7c52'; ctx.fillRect(5, 16, 42, 10);
    ctx.fillStyle = '#7f915f'; ctx.fillRect(5, 16, 42, 3);
    ctx.fillStyle = '#47543a'; ctx.fillRect(5, 23, 42, 3);
    // hidung kanan miring
    ctx.fillStyle = '#6d7c52'; ctx.fillRect(46, 19, 5, 7);
    ctx.fillStyle = '#7f915f'; ctx.fillRect(48, 19, 3, 2);
    // palka belakang + knalpot
    ctx.fillStyle = '#55663f'; ctx.fillRect(8, 11, 10, 6);
    ctx.fillStyle = '#3b4046'; ctx.fillRect(6, 8, 3, 5);
    // bintang & penanda
    ctx.fillStyle = '#f2c230'; ctx.fillRect(34, 19, 5, 5);
    ctx.fillStyle = '#e8e4da'; ctx.fillRect(20, 20, 7, 2);
    // lampu depan
    ctx.fillStyle = '#f2e29a'; ctx.fillRect(48, 21, 2, 2);
  });
}
function drawSlugTurret() {
  // Kubu turet menghadap KANAN; titik putar di (8, 11). Vulcan = laras ganda.
  return makeCanvas(30, 16, (ctx) => {
    ctx.fillStyle = '#66754c'; ctx.fillRect(0, 4, 15, 10);
    ctx.fillStyle = '#77875c'; ctx.fillRect(1, 2, 12, 3);
    ctx.fillStyle = '#47543a'; ctx.fillRect(0, 12, 15, 2);
    // laras Vulcan ganda ke kanan
    ctx.fillStyle = '#3b4046'; ctx.fillRect(15, 6, 14, 2); ctx.fillRect(15, 10, 14, 2);
    ctx.fillStyle = '#20242a'; ctx.fillRect(28, 5, 2, 4); ctx.fillRect(28, 9, 2, 4);
    // palka atas
    ctx.fillStyle = '#55663f'; ctx.fillRect(4, 0, 7, 3);
  });
}
function drawSlugCannonMuzzle() {
  // Meriam utama (dipakai sesaat saat menembak cannon): laras besar pendek.
  return makeCanvas(30, 16, (ctx) => {
    ctx.fillStyle = '#66754c'; ctx.fillRect(0, 4, 15, 10);
    ctx.fillStyle = '#77875c'; ctx.fillRect(1, 2, 12, 3);
    ctx.fillStyle = '#2c3138'; ctx.fillRect(14, 5, 15, 7);
    ctx.fillStyle = '#20242a'; ctx.fillRect(27, 4, 3, 9);
    ctx.fillStyle = '#55663f'; ctx.fillRect(4, 0, 7, 3);
  });
}

/* ---------------------------------------------------------------------
   Tank mini-boss "Di-Cokka" v2 — 64x44, menghadap KIRI, lebih detail.
   --------------------------------------------------------------------- */
function drawTank() {
  return makeCanvas(64, 44, (ctx) => {
    // rantai roda
    ctx.fillStyle = '#2c3138'; ctx.fillRect(5, 34, 54, 9);
    ctx.fillStyle = '#4a5560';
    for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(10 + i * 7.5, 38.5, 3.4, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#171a1e';
    for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(10 + i * 7.5, 38.5, 1.4, 0, 7); ctx.fill(); }
    // badan
    ctx.fillStyle = '#5d6b45'; ctx.fillRect(7, 24, 50, 11);
    ctx.fillStyle = '#74855a'; ctx.fillRect(7, 24, 50, 4);
    ctx.fillStyle = '#47543a'; ctx.fillRect(7, 31, 50, 4);
    ctx.fillStyle = '#5d6b45'; ctx.fillRect(2, 28, 6, 7);
    // kubah
    ctx.fillStyle = '#66754c'; ctx.fillRect(22, 13, 27, 12);
    ctx.fillStyle = '#7f915f'; ctx.fillRect(25, 10, 19, 4);
    ctx.fillStyle = '#47543a'; ctx.fillRect(22, 23, 27, 2);
    // meriam ke kiri
    ctx.fillStyle = '#3b4046'; ctx.fillRect(2, 16, 21, 5);
    ctx.fillStyle = '#20242a'; ctx.fillRect(0, 15, 3, 7);
    // periskop + antena + palka
    ctx.fillStyle = '#3b4046'; ctx.fillRect(42, 6, 2, 5); ctx.fillRect(40, 5, 6, 2);
    ctx.fillRect(30, 4, 1, 7);
    ctx.fillStyle = '#55663f'; ctx.fillRect(26, 8, 9, 3);
    // bintang + strip peringatan
    ctx.fillStyle = '#f2c230'; ctx.fillRect(32, 16, 6, 6);
    ctx.fillRect(27, 27, 4, 3); ctx.fillRect(50, 27, 4, 3);
    ctx.fillStyle = '#f2e29a'; ctx.fillRect(4, 25, 3, 3);
    // baut-baut lambung
    ctx.fillStyle = '#3e4a33';
    for (let i = 0; i < 5; i++) ctx.fillRect(12 + i * 10, 29, 2, 2);
  });
}

/* ---------------------------------------------------------------------
   ROBOT TITAN (bos akhir) — digambar prosedural canvas 64x100,
   menghadap KIRI. Core di dada pada (26..38, 34..48) relatif sprite.
   Lengan meriam terpisah ditarik dari titik bahu (14, 30).
   --------------------------------------------------------------------- */
function buildTitanSprite() {
  return makeCanvas(64, 100, (ctx) => {
    // kaki baja besar
    ctx.fillStyle = '#274a73'; ctx.fillRect(12, 74, 14, 18); ctx.fillRect(38, 74, 14, 18);
    ctx.fillStyle = '#3f7fbf'; ctx.fillRect(12, 74, 14, 4); ctx.fillRect(38, 74, 14, 4);
    ctx.fillStyle = '#1b3552'; ctx.fillRect(8, 90, 20, 8); ctx.fillRect(36, 90, 20, 8); // telapak
    ctx.fillStyle = '#58c7d8'; ctx.fillRect(16, 80, 3, 6); ctx.fillRect(45, 80, 3, 6); // lampu lutut
    // pinggang
    ctx.fillStyle = '#2c3138'; ctx.fillRect(18, 66, 28, 9);
    ctx.fillStyle = '#f2c230'; ctx.fillRect(29, 69, 6, 3);
    // badan utama
    ctx.fillStyle = '#3f7fbf'; ctx.fillRect(10, 26, 44, 42);
    ctx.fillStyle = '#5b93cf'; ctx.fillRect(10, 26, 44, 6);
    ctx.fillStyle = '#274a73'; ctx.fillRect(10, 58, 44, 10);
    ctx.fillStyle = '#1b3552'; ctx.fillRect(14, 32, 8, 22); ctx.fillRect(42, 32, 8, 22); // panel samping
    ctx.fillStyle = '#f2c230'; ctx.fillRect(15, 60, 5, 5); ctx.fillRect(44, 60, 5, 5);
    // CORE menyala di dada (titik lemah) — kotak (26..38, 38..50)
    ctx.fillStyle = '#20242a'; ctx.fillRect(24, 36, 16, 16);
    ctx.fillStyle = '#58c7d8'; ctx.fillRect(26, 38, 12, 12);
    ctx.fillStyle = '#c8f4fb'; ctx.fillRect(29, 41, 6, 6);
    // bahu + bantalan rudal (salvo bahu)
    ctx.fillStyle = '#274a73'; ctx.fillRect(2, 18, 16, 14); ctx.fillRect(46, 18, 16, 14);
    ctx.fillStyle = '#3f7fbf'; ctx.fillRect(2, 18, 16, 4); ctx.fillRect(46, 18, 16, 4);
    ctx.fillStyle = '#20242a';
    for (let i = 0; i < 3; i++) { ctx.fillRect(4 + i * 5, 11, 3, 7); ctx.fillRect(48 + i * 5, 11, 3, 7); }
    // kepala + visor
    ctx.fillStyle = '#3f7fbf'; ctx.fillRect(22, 6, 20, 14);
    ctx.fillStyle = '#5b93cf'; ctx.fillRect(22, 6, 20, 4);
    ctx.fillStyle = '#20242a'; ctx.fillRect(24, 12, 16, 4);
    ctx.fillStyle = '#d84f35'; ctx.fillRect(26, 13, 4, 2); ctx.fillRect(34, 13, 4, 2); // mata merah
    ctx.fillStyle = '#2c3138'; ctx.fillRect(30, 0, 2, 6); // antena
    ctx.fillStyle = '#d84f35'; ctx.fillRect(29, 0, 4, 2);
    // lengan kiri (meriam ditarik terpisah), lengan kanan menempel
    ctx.fillStyle = '#274a73'; ctx.fillRect(48, 32, 10, 26);
    ctx.fillStyle = '#3f7fbf'; ctx.fillRect(48, 32, 10, 4);
    ctx.fillStyle = '#2c3138'; ctx.fillRect(47, 56, 12, 10); // kepalan kanan
  });
}
function drawTitanArm() {
  // Lengan meriam kiri: asal putar di bahu (26, 6); laras ke KIRI.
  return makeCanvas(34, 14, (ctx) => {
    ctx.fillStyle = '#274a73'; ctx.fillRect(18, 1, 15, 12);
    ctx.fillStyle = '#3f7fbf'; ctx.fillRect(18, 1, 15, 3);
    ctx.fillStyle = '#2c3138'; ctx.fillRect(2, 3, 17, 8);   // laras
    ctx.fillStyle = '#171a1e'; ctx.fillRect(0, 2, 3, 10);   // moncong
    ctx.fillStyle = '#f2c230'; ctx.fillRect(20, 10, 8, 2);
  });
}

/* ---------------------------------------------------------------------
   MONSTER LAUT (mini-boss sungai) — kepala 48x40 (menghadap pemain,
   digambar menghadap KANAN, di-flip sesuai posisi) + tentakel 16x56.
   --------------------------------------------------------------------- */
function drawSeaHead() {
  return makeCanvas(48, 40, (ctx) => {
    // cangkang atas
    ctx.fillStyle = '#5e8f52'; ctx.fillRect(6, 2, 36, 12);
    ctx.fillStyle = '#7fae6d'; ctx.fillRect(10, 0, 28, 5);
    ctx.fillStyle = '#4d7942'; ctx.fillRect(6, 10, 36, 5);
    // duri cangkang
    ctx.fillStyle = '#3c5f33';
    for (let i = 0; i < 5; i++) ctx.fillRect(10 + i * 7, -0 + (i % 2), 3, 4);
    // wajah
    ctx.fillStyle = '#8fbc7d'; ctx.fillRect(4, 14, 40, 16);
    ctx.fillStyle = '#a8cf97'; ctx.fillRect(4, 14, 40, 4);
    // mata bertangkai
    ctx.fillStyle = '#4d7942'; ctx.fillRect(10, 8, 3, 7); ctx.fillRect(34, 8, 3, 7);
    ctx.fillStyle = '#f2e29a'; ctx.fillRect(8, 4, 7, 6); ctx.fillRect(32, 4, 7, 6);
    ctx.fillStyle = '#20242a'; ctx.fillRect(10, 6, 3, 3); ctx.fillRect(34, 6, 3, 3);
    // mulut + taring
    ctx.fillStyle = '#5e2f2f'; ctx.fillRect(12, 24, 24, 6);
    ctx.fillStyle = '#e8e4da';
    ctx.fillRect(14, 24, 3, 4); ctx.fillRect(21, 24, 3, 4); ctx.fillRect(28, 24, 3, 4);
    ctx.fillRect(17, 27, 3, 3); ctx.fillRect(25, 27, 3, 3);
    // pipi/insang
    ctx.fillStyle = '#6da35c'; ctx.fillRect(4, 18, 4, 8); ctx.fillRect(40, 18, 4, 8);
    // dagu
    ctx.fillStyle = '#7fae6d'; ctx.fillRect(10, 30, 28, 6);
    ctx.fillStyle = '#5e8f52'; ctx.fillRect(10, 34, 28, 4);
  });
}
function drawTentacle() {
  // Tentakel melengkung, pangkal di bawah (56), ujung di atas (0).
  return makeCanvas(16, 56, (ctx) => {
    ctx.fillStyle = '#4d7942';
    const seg = [ [3,48,10],[2,40,10],[3,32,9],[4,25,8],[6,18,7],[8,12,6],[9,6,5] ];
    for (const s of seg) ctx.fillRect(s[0], s[1], s[2], 9);
    ctx.fillStyle = '#6da35c';
    for (const s of seg) ctx.fillRect(s[0] + 1, s[1], 3, 9);
    // cangkir isap
    ctx.fillStyle = '#c9a0b4';
    ctx.fillRect(6, 44, 3, 3); ctx.fillRect(5, 34, 3, 3); ctx.fillRect(7, 24, 3, 3); ctx.fillRect(9, 14, 2, 2);
  });
}

/* ---------------------------------------------------------------------
   ELEMEN DUNIA — digambar prosedural canvas (tenda, menara, jembatan,
   bendera, rambu) + ubin permukaan.
   --------------------------------------------------------------------- */
function drawTent() { // tenda militer 44x30, jangkar bawah
  return makeCanvas(44, 30, (ctx) => {
    ctx.fillStyle = '#5c6b45';
    ctx.beginPath(); ctx.moveTo(2, 30); ctx.lineTo(22, 4); ctx.lineTo(42, 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6d7c52';
    ctx.beginPath(); ctx.moveTo(22, 4); ctx.lineTo(42, 30); ctx.lineTo(22, 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#47543a'; ctx.fillRect(2, 27, 40, 3);
    // pintu
    ctx.fillStyle = '#2e3524';
    ctx.beginPath(); ctx.moveTo(17, 30); ctx.lineTo(22, 15); ctx.lineTo(27, 30); ctx.closePath(); ctx.fill();
    // palang merah di sisi (tenda medis musuh)
    ctx.fillStyle = '#e8e4da'; ctx.fillRect(32, 14, 7, 7);
    ctx.fillStyle = '#d84f35'; ctx.fillRect(34, 15, 3, 5); ctx.fillRect(33, 17, 5, 2);
    // tiang
    ctx.fillStyle = '#3b4046'; ctx.fillRect(21, 1, 2, 4);
  });
}
function drawTower() { // menara pengawas kayu 30x64, platform di atas
  return makeCanvas(30, 64, (ctx) => {
    ctx.fillStyle = '#6e3d20';
    ctx.fillRect(4, 14, 3, 50); ctx.fillRect(23, 14, 3, 50);
    ctx.fillRect(4, 34, 22, 3); ctx.fillRect(4, 50, 22, 3);
    // silang penguat
    ctx.save(); ctx.translate(15, 40); ctx.rotate(0.6); ctx.fillRect(-14, -1, 28, 2); ctx.restore();
    ctx.save(); ctx.translate(15, 40); ctx.rotate(-0.6); ctx.fillRect(-14, -1, 28, 2); ctx.restore();
    // kabin atas
    ctx.fillStyle = '#8a5a2e'; ctx.fillRect(0, 4, 30, 11);
    ctx.fillStyle = '#a9713f'; ctx.fillRect(0, 4, 30, 3);
    ctx.fillStyle = '#2e2418'; ctx.fillRect(4, 8, 22, 5);
    // atap
    ctx.fillStyle = '#5c6b45';
    ctx.beginPath(); ctx.moveTo(-2, 5); ctx.lineTo(15, -3 + 3); ctx.lineTo(32, 5); ctx.closePath(); ctx.fill();
    // tangga
    ctx.fillStyle = '#6e3d20';
    for (let i = 0; i < 5; i++) ctx.fillRect(12, 20 + i * 9, 6, 2);
  });
}
function drawFlag() { // bendera musuh berkibar statis 14x30
  return makeCanvas(14, 30, (ctx) => {
    ctx.fillStyle = '#3b4046'; ctx.fillRect(1, 0, 2, 30);
    ctx.fillStyle = '#a03232'; ctx.fillRect(3, 1, 11, 8);
    ctx.fillStyle = '#7e2626'; ctx.fillRect(3, 6, 11, 3);
    ctx.fillStyle = '#f2c230'; ctx.fillRect(6, 3, 4, 4); // lambang
  });
}

/* ---------------------------------------------------------------------
   LATAR 3 LAPIS — tiap lapis di-prerender SEKALI (640x224).
   bgSky: gradasi senja + matahari + bintang tipis.
   bgFar: pegunungan + siluet hutan jauh (parallax 0.3).
   bgNear: pohon palem & semak dekat transparan (parallax 0.6).
   Awan: strip terpisah (parallax 0.15, digeser sangat pelan oleh game).
   --------------------------------------------------------------------- */
function drawBgSky() {
  return makeCanvas(640, 224, (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 0, 224);
    grad.addColorStop(0, '#26324f');
    grad.addColorStop(0.4, '#6d4260');
    grad.addColorStop(0.72, '#c97b4a');
    grad.addColorStop(1, '#eeb26a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 224);
    // bintang tipis di langit atas
    let seed = 777;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 40; i++) ctx.fillRect((rnd() * 638) | 0, (rnd() * 60) | 0, 1, 1);
    // matahari rendah
    ctx.fillStyle = '#f7d774'; ctx.beginPath(); ctx.arc(492, 132, 22, 0, 7); ctx.fill();
    ctx.fillStyle = '#f2c94c'; ctx.beginPath(); ctx.arc(492, 132, 16, 0, 7); ctx.fill();
    ctx.fillStyle = '#f7d774'; ctx.fillRect(470, 130, 44, 2);
  });
}
function drawCloudStrip() {
  return makeCanvas(640, 224, (ctx) => {
    ctx.fillStyle = 'rgba(247,215,160,0.55)';
    const cloud = (x, y, w) => {
      ctx.beginPath(); ctx.arc(x, y, w * 0.28, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(x + w * 0.3, y + 3, w * 0.22, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(x - w * 0.3, y + 4, w * 0.2, 0, 7); ctx.fill();
      ctx.fillRect(x - w * 0.3, y, w * 0.6, 5);
    };
    cloud(90, 42, 90); cloud(300, 66, 120); cloud(520, 36, 80); cloud(640 - 30, 84, 100); cloud(30, 92, 70);
  });
}
function drawBgFar(groundY) {
  return makeCanvas(640, 224, (ctx) => {
    // pegunungan jauh
    ctx.fillStyle = '#4a3a5e';
    ctx.beginPath();
    ctx.moveTo(0, 176);
    const peaks = [60, 120, 90, 150, 110, 160, 100, 140, 80, 130];
    for (let i = 0; i <= 10; i++) ctx.lineTo(i * 64, 176 - peaks[i % peaks.length] * 0.55);
    ctx.lineTo(640, 224); ctx.lineTo(0, 224); ctx.fill();
    // pegunungan dekat
    ctx.fillStyle = '#33283f';
    ctx.beginPath();
    ctx.moveTo(0, groundY + 4);
    const peaks2 = [40, 75, 30, 65, 45, 80, 35, 60, 50, 70];
    for (let i = 0; i <= 10; i++) ctx.lineTo(i * 64, groundY + 4 - peaks2[i % peaks2.length] * 0.5);
    ctx.lineTo(640, 224); ctx.lineTo(0, 224); ctx.fill();
    // siluet hutan jauh di kaki gunung
    ctx.fillStyle = '#2a2136';
    let seed = 4242;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let x = 0; x < 640; x += 7) {
      const th = 8 + rnd() * 14;
      ctx.fillRect(x, groundY - th + 6, 6, th);
      ctx.beginPath(); ctx.arc(x + 3, groundY - th + 4, 5 + rnd() * 4, 0, 7); ctx.fill();
    }
  });
}
function drawBgNear(groundY) {
  return makeCanvas(640, 224, (ctx) => {
    // reruntuhan bangunan
    ctx.fillStyle = '#241b2e';
    ctx.fillRect(40, groundY - 62, 46, 62);
    ctx.fillRect(52, groundY - 74, 20, 12);
    ctx.fillRect(430, groundY - 48, 60, 48);
    ctx.fillRect(448, groundY - 58, 24, 10);
    ctx.fillStyle = '#c97b4a';
    ctx.fillRect(50, groundY - 52, 8, 10);
    ctx.fillRect(64, groundY - 38, 8, 10);
    ctx.fillRect(444, groundY - 36, 9, 9);
    ctx.fillRect(466, groundY - 22, 9, 9);
    // pohon palem siluet
    const palm = (x, h) => {
      ctx.fillStyle = '#1d1526';
      for (let i = 0; i < h; i += 4) ctx.fillRect(x + Math.sin(i * 0.06) * 4, groundY - i - 4, 5, 5);
      const tx = x + Math.sin(h * 0.06) * 4, ty = groundY - h;
      for (let a = 0; a < 5; a++) {
        ctx.save(); ctx.translate(tx + 2, ty); ctx.rotate(-0.5 + a * 0.32);
        ctx.fillRect(0, -2, 20, 3); ctx.restore();
      }
      ctx.beginPath(); ctx.arc(tx + 2, ty, 6, 0, 7); ctx.fill();
    };
    palm(150, 58); palm(262, 44); palm(352, 64); palm(548, 50); palm(616, 56); palm(96, 40);
    // semak belukar
    ctx.fillStyle = '#20182a';
    let seed = 999;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let i = 0; i < 26; i++) {
      const bx = (rnd() * 630) | 0, bh = 5 + rnd() * 9;
      ctx.beginPath(); ctx.arc(bx, groundY - bh + 6, bh, 0, 7); ctx.fill();
    }
  });
}

// Ubin tanah per jenis permukaan (64x32), digambar sekali, pola deterministik
function drawGroundTile(base, top, light, seedInit) {
  return makeCanvas(64, 32, (ctx) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, 64, 32);
    ctx.fillStyle = top; ctx.fillRect(0, 0, 64, 5);
    ctx.fillStyle = light; ctx.fillRect(0, 0, 64, 2);
    let seed = seedInit;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let i = 0; i < 24; i++) ctx.fillRect((rnd() * 62) | 0, 6 + ((rnd() * 24) | 0), 2, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    for (let i = 0; i < 12; i++) ctx.fillRect((rnd() * 62) | 0, 6 + ((rnd() * 24) | 0), 2, 1);
  });
}
function drawGrassTile() {
  const c = drawGroundTile('#5d4a2c', '#6f9a44', '#8fbc5a', 12345);
  const ctx = c.getContext('2d');
  let seed = 5150;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  ctx.fillStyle = '#557f36';
  for (let i = 0; i < 10; i++) { const gx = (rnd() * 60) | 0; ctx.fillRect(gx, 2, 1, 4); ctx.fillRect(gx + 2, 3, 1, 3); }
  return c;
}
function drawSandTile() { return drawGroundTile('#8a6f42', '#c2a165', '#dcc084', 22334); }
function drawDirtTile() { return drawGroundTile('#6e5636', '#9a7d4f', '#b08d58', 9876); }
// Ubin platform kayu 32x10
function drawWoodTile() {
  return makeCanvas(32, 10, (ctx) => {
    ctx.fillStyle = '#8a5a2e'; ctx.fillRect(0, 0, 32, 10);
    ctx.fillStyle = '#a9713f'; ctx.fillRect(0, 0, 32, 3);
    ctx.fillStyle = '#6e3d20'; ctx.fillRect(0, 8, 32, 2);
    ctx.fillRect(15, 0, 2, 10); ctx.fillRect(31, 0, 1, 10);
  });
}
// Papan jembatan 64x12 dengan tali & tiang gantung (ditarik di bawah papan)
function drawBridgeTile() {
  return makeCanvas(64, 12, (ctx) => {
    ctx.fillStyle = '#8a5a2e'; ctx.fillRect(0, 0, 64, 10);
    ctx.fillStyle = '#a9713f'; ctx.fillRect(0, 0, 64, 3);
    ctx.fillStyle = '#6e3d20'; ctx.fillRect(0, 8, 64, 2);
    ctx.fillRect(15, 0, 2, 10); ctx.fillRect(31, 0, 2, 10); ctx.fillRect(47, 0, 2, 10);
    ctx.fillStyle = '#d8c491'; ctx.fillRect(0, 10, 64, 2); // tali bawah
  });
}
// Ledakan 4 frame berlapis (api inti + tepi), prosedural radial
function drawExplosionFrame(i) {
  const sizes = [16, 26, 34, 40];
  const s = sizes[i];
  return makeCanvas(s, s, (ctx) => {
    const cx = s / 2, cy = s / 2;
    const blob = (r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); };
    blob(s * 0.48, '#8a3b1e');
    blob(s * 0.4, '#d84f35');
    blob(s * 0.3, '#e87e35');
    if (i < 3) blob(s * 0.19, '#f2c230');
    if (i < 2) blob(s * 0.1, '#fdf3c0');
    // lidah api acak deterministik
    let seed = 100 + i * 37;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    ctx.fillStyle = '#d84f35';
    for (let j = 0; j < 6 - i; j++) {
      const a = rnd() * Math.PI * 2, d = s * (0.34 + rnd() * 0.14);
      ctx.fillRect(cx + Math.cos(a) * d - 2, cy + Math.sin(a) * d - 2, 4, 4);
    }
  });
}
// Muzzle flash 2 varian
function drawMuzzle(i) {
  return makeCanvas(12, 8, (ctx) => {
    ctx.fillStyle = '#f2c230';
    ctx.fillRect(3, 3, 6, 2);
    ctx.fillRect(6, 1, 3, 6);
    if (i === 0) { ctx.fillStyle = '#fdf3c0'; ctx.fillRect(5, 2, 4, 4); }
    ctx.fillStyle = '#e87e35';
    ctx.fillRect(9, 3, 3, 2);
  });
}

/* ---------------------------------------------------------------------
   Komposisi pemain: TORSO (24x23) + senjata + KAKI (24x17) -> 24x40.
   Komposisi jongkok: TORSO_CROUCH (24x18) + LEGS_CROUCH (24x7) -> 24x30,
   kaki digambar mulai y=22 (tumpang tindih pinggang).
   --------------------------------------------------------------------- */
function buildSprites(groundY) {
  const S = {};
  const tFront = spr(TORSO_FRONT), tUp = spr(TORSO_UP), tDiag = spr(TORSO_DIAG);
  const tThrow = spr(TORSO_THROW), tMelee = spr(TORSO_MELEE), tCrouch = spr(TORSO_CROUCH);
  const lIdle = spr(LEGS_IDLE), lJump = spr(LEGS_JUMP);
  const lRun = [spr(LEGS_RUN0), spr(LEGS_RUN1), spr(LEGS_RUN2), spr(LEGS_RUN3), flipCanvas(spr(LEGS_RUN0)), flipCanvas(spr(LEGS_RUN2))];
  const lCrouch = spr(LEGS_CROUCH);
  S.guns = {
    handgun: spr(GUN_PISTOL), hmg: spr(GUN_HMG), rocket: spr(GUN_ROCKET), shotgun: spr(GUN_SHOTGUN),
    flame: spr(GUN_FLAME), laser: spr(GUN_LASER), chaser: spr(GUN_CHASER), knife: spr(KNIFE)
  };
  function comp(torso, legs, gun) {
    return makeCanvas(24, 40, (ctx) => {
      ctx.drawImage(legs, 0, 23);
      ctx.drawImage(torso, 0, 0);
      if (gun) ctx.drawImage(gun, 11, 11);
    });
  }
  function compUp(torso, legs, gun) {
    return makeCanvas(24, 40, (ctx) => {
      ctx.drawImage(legs, 0, 23);
      ctx.drawImage(torso, 0, 0);
      if (gun) { // senjata vertikal: putar 90° di atas tangan (asal ~ (16,-2))
        ctx.save(); ctx.translate(19, 10); ctx.rotate(-Math.PI / 2);
        ctx.drawImage(gun, 0, -4); ctx.restore();
      }
    });
  }
  function compDiag(torso, legs, gun) {
    return makeCanvas(24, 40, (ctx) => {
      ctx.drawImage(legs, 0, 23);
      ctx.drawImage(torso, 0, 0);
      if (gun) {
        ctx.save(); ctx.translate(15, 12); ctx.rotate(-Math.PI / 4);
        ctx.drawImage(gun, 0, -3); ctx.restore();
      }
    });
  }
  // Idle / berdiri menembak per senjata
  S.pIdle = comp(tFront, lIdle, null);
  S.pIdleGun = {};
  S.pFireH = {}; S.pFireUp = {}; S.pFireDiag = {};
  for (const w in S.guns) {
    if (w === 'knife') continue;
    S.pIdleGun[w] = comp(tFront, lIdle, S.guns[w]);
    S.pFireH[w] = comp(tFront, lIdle, S.guns[w]);
    S.pFireUp[w] = compUp(tUp, lIdle, S.guns[w]);
    S.pFireDiag[w] = compDiag(tDiag, lIdle, S.guns[w]);
  }
  // Lari 6 frame per senjata (komposisi torso depan + kaki lari + senjata)
  S.pRunByWeapon = {};
  for (const w in S.guns) {
    if (w === 'knife') continue;
    S.pRunByWeapon[w] = lRun.map((lg) => comp(tFront, lg, S.guns[w]));
  }
  // Lompat
  S.pJump = comp(tFront, lJump, S.guns.handgun);
  S.pJumpByWeapon = {};
  for (const w in S.guns) {
    if (w === 'knife') continue;
    S.pJumpByWeapon[w] = comp(tFront, lJump, S.guns[w]);
    S.pJumpByWeapon[w + 'Up'] = compUp(tUp, lJump, S.guns[w]);
    S.pJumpByWeapon[w + 'Diag'] = compDiag(tDiag, lJump, S.guns[w]);
  }
  // Jongkok 24x30
  function compCrouch(gun, up) {
    return makeCanvas(24, 30, (ctx) => {
      ctx.drawImage(lCrouch, 0, 22);
      ctx.drawImage(up ? tUp : tCrouch, 0, 0);
      if (gun) ctx.drawImage(gun, 11, 10);
    });
  }
  S.pCrouch = compCrouch(null, false);
  S.pCrouchFire = {};
  S.pCrouchUp = {};
  for (const w in S.guns) {
    if (w === 'knife') continue;
    S.pCrouchFire[w] = compCrouch(S.guns[w], false);
    S.pCrouchUp[w] = compCrouch(S.guns[w], true);
  }
  // Lempar & melee (berdiri)
  S.pThrow = comp(tThrow, lIdle, null);
  S.pMelee = comp(tMelee, lIdle, S.guns.knife);
  // Mati: 0 terpental (rotasi komposisi berdiri), 1 jatuh, 2 terkapar
  S.pDie0 = makeCanvas(40, 28, (ctx) => {
    ctx.translate(20, 16); ctx.rotate(-1.15);
    ctx.drawImage(S.pIdle, -12, -34);
  });
  S.pDie1 = makeCanvas(40, 28, (ctx) => {
    ctx.translate(20, 18); ctx.rotate(-1.5);
    ctx.drawImage(S.pIdle, -12, -34);
  });
  S.pDie2 = spr(DIE_FLAT);

  // Avatar & ikon kepala
  S.avatar = drawAvatar();
  S.headIcon = drawHeadIcon();

  // Musuh
  S.rebelWalk = [spr(REBEL_WALK0), spr(REBEL_WALK1)];
  S.rebelShoot = spr(REBEL_SHOOT);
  S.greIdle = spr(GRE_IDLE);
  S.greThrow = spr(GRE_THROW);
  S.bazIdle = spr(BAZ_IDLE);
  S.shieldWalk = [spr(SHIELD_WALK0), spr(SHIELD_WALK1)];
  S.shieldBroken = spr(SHIELD_BROKEN);

  // POW
  S.powTied = spr(POW_TIED);
  S.powWalk = [spr(POW_WALK0), spr(POW_WALK1)];
  S.powWave = [spr(POW_WAVE0), spr(POW_WAVE1)];

  // Objek & ikon pickup
  S.crate = spr(CRATE);
  S.barrel = spr(BARREL);
  S.sign = spr(SIGN);
  S.iconHmg = spr(ICON_HMG);
  S.iconRocket = spr(ICON_ROCKET);
  S.iconShotgun = spr(ICON_SHOTGUN);
  S.iconFlame = spr(ICON_FLAME);
  S.iconLaser = spr(ICON_LASER);
  S.iconChaser = spr(ICON_CHASER);
  S.iconGrenade = spr(ICON_GRENADE);
  S.iconFirebomb = spr(ICON_FIREBOMB);
  S.iconCannon = spr(ICON_CANNON);
  S.tent = drawTent();
  S.tower = drawTower();
  S.flag = drawFlag();

  // Kendaraan & bos
  S.slugBody = drawSlugBody();
  S.slugTurret = drawSlugTurret();
  S.slugCannon = drawSlugCannonMuzzle();
  S.slugFlash = whiteSilhouette(S.slugBody);
  S.tank = drawTank();
  S.tankFlash = whiteSilhouette(S.tank);
  S.titan = buildTitanSprite();
  S.titanFlash = whiteSilhouette(S.titan);
  S.titanArm = drawTitanArm();
  S.seaHead = drawSeaHead();
  S.seaHeadFlash = whiteSilhouette(S.seaHead);
  S.tentacle = drawTentacle();

  // Efek
  S.muzzle = [drawMuzzle(0), drawMuzzle(1)];
  S.boom = [drawExplosionFrame(0), drawExplosionFrame(1), drawExplosionFrame(2), drawExplosionFrame(3)];

  // Latar & ubin
  S.bgSky = drawBgSky();
  S.cloudStrip = drawCloudStrip();
  S.bgFar = drawBgFar(groundY);
  S.bgNear = drawBgNear(groundY);
  S.grassTile = drawGrassTile();
  S.sandTile = drawSandTile();
  S.dirtTile = drawDirtTile();
  S.woodTile = drawWoodTile();
  S.bridgeTile = drawBridgeTile();

  return S;
}
