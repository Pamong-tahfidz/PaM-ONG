'use strict';
/* =====================================================================
   PaM-ONG — sprites.js (v3)
   Semua sprite digambar PROSEDURAL dari peta piksel (array string) saat
   loading, dirender SEKALI ke offscreen canvas, lalu di-blit saat main.
   Tidak ada aset gambar eksternal sama sekali.
   v3: resolusi dunia baru 480x270 — SEMUA sprite digambar ulang lebih
   besar & detail: pemain 36x60 (kepala besar ala Metal Slug, outline
   gelap, 3 tingkat shading per warna utama), kaki+torso terpisah, lari
   8 frame, pose kemenangan, napas idle 2 frame, ekor bandana berkibar;
   musuh & ketiga bos diperbesar sepadan (Titan 96x150); latar 4 lapis
   parallax di-prerender; elemen dunia lebih rapat & bertekstur.
   ===================================================================== */

// Palet (satu huruf = satu warna; 3 tingkat bayangan per warna utama)
const PAL = {
  k: '#20242a', // hitam / outline / mata
  s: '#f2d3a0', // kulit terang
  S: '#d69c60', // kulit tengah
  j: '#b57a3e', // kulit gelap / bayangan rahang
  r: '#e0453a', // bandana merah terang
  R: '#a52a24', // bandana merah tengah
  B: '#701d18', // bandana merah gelap
  C: '#86b45e', // rompi hijau terang
  v: '#67984a', // rompi hijau tengah
  V: '#3e5c2b', // rompi hijau gelap
  D: '#2c4420', // rompi hijau tergelap (kantong/tepi)
  t: '#b09a6c', // baju krem terang
  T: '#8a744c', // baju krem gelap
  E: '#9aa578', // celana terang
  p: '#75855a', // celana tengah
  P: '#4c5a3a', // celana gelap
  F: '#39432c', // celana tergelap
  o: '#7d5732', // sepatu bot terang
  O: '#523a20', // sepatu bot gelap
  L: '#3a2e22', // cokelat tergelap (sol/gagang)
  G: '#3b4046', // senjata/baja gelap
  g: '#8b95a0', // senjata/baja terang
  w: '#e8e4da', // putih
  y: '#f2c230', // kuning kuningan
  n: '#8a6f3f', // tali / ikat pinggang
  u: '#7d8a68', // seragam Rebel terang
  U: '#4d5540', // seragam Rebel tengah
  H: '#39412f', // seragam Rebel gelap
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
  a: '#3f7fbf', // baja biru Titan tengah
  A: '#274a73', // baja biru Titan gelap
  I: '#6fa8dc', // baja biru Titan terang
  J: '#16283f', // baja biru Titan tergelap
  d: '#58c7d8', // core sian menyala
  f: '#e87e35', // api oranye
  z: '#4d7942', // kulit monster laut tengah
  Z: '#6fa055', // kulit monster laut terang
  i: '#35542c'  // kulit monster laut gelap
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
   PEMAIN "Pamong" v3 — total 36x60. TORSO 36x35 (y 0..34), KAKI 36x25
   (digambar di y 35..59). Proporsi ala Metal Slug: kepala besar, tubuh
   kekar pendek. Sprite dasar menghadap KANAN.
   ===================================================================== */
// Kepala bersama (baris 0..13) dipakai semua varian torso berdiri:
// bandana berlapis + simpul kanan, wajah berpipi, rahang berbayang.
const HEAD_FRONT = [
  ".........rrrrrrrrrrrrrrrr...........",
  "........rrrrrrrrrrrrrrrrrr..........",
  "........rrrrrrrrrrrrrrrrRRR.........",
  "........rrrrrrrrrrrrrrrRRRR.........",
  ".........BBBBBBBBBBBBBBBB...........",
  ".........ssssssssssssss.............",
  ".........ssssssssssssSj.............",
  ".........ssskksssskksss.............",
  ".........ssssssssssssSj.............",
  ".........ssssssssskkSSj.............",
  "..........ssssssssSSj...............",
  "..........SSSSSSSSSS................",
  ".............SSSS...................",
  ".............jjjj..................."
];
// Badan rompi (baris 14..34): bahu lebar, kantong, sabuk berbuckle.
const BODY_FRONT = [
  "......CCCCCCCCCCCCCCCCCC............",
  ".....CvvvvvvvvvvvvvvvvvvC...........",
  ".....vvvvvvvvvvvvvvvvvvvvs..........",
  ".....vVvvvvvvvvvvvvvvvvvss..........",
  ".....vVvvvvvDDvvvvvvvvvsss..........",
  ".....vvvvvvvDDvvvvvvvvvvss..........",
  ".....vvvvvvvvvvvvvvvvvvvvs..........",
  ".....vVvvvvvvvvvvvvvvvVvvs..........",
  ".....vvvvvvvvvvvvvvvvvvvvs..........",
  "......DDvvvvvvvvvvvvDD..............",
  "......nnnnnnnnnnyynnn...............",
  "......nnnnnnnnnnnnnnn...............",
  "......pppppppppppppp................",
  "......pPppppppppppPp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......FFppppppppppFF................",
  "......FFFFFFFFFFFFFF................"
];
const TORSO_FRONT = HEAD_FRONT.concat(BODY_FRONT);
// Varian NAPAS idle: dada turun 1px (baris bahu digeser, isi sama)
const BODY_FRONT_B = [
  "....................................",
  "......CCCCCCCCCCCCCCCCCC............",
  ".....CvvvvvvvvvvvvvvvvvvC...........",
  ".....vvvvvvvvvvvvvvvvvvvvs..........",
  ".....vVvvvvvvvvvvvvvvvvvss..........",
  ".....vVvvvvvDDvvvvvvvvvsss..........",
  ".....vvvvvvvDDvvvvvvvvvvss..........",
  ".....vvvvvvvvvvvvvvvvvvvvs..........",
  ".....vVvvvvvvvvvvvvvvvVvvs..........",
  ".....vvvvvvvvvvvvvvvvvvvvs..........",
  "......DDvvvvvvvvvvvvDD..............",
  "......nnnnnnnnnnyynnn...............",
  "......nnnnnnnnnnnnnnn...............",
  "......pppppppppppppp................",
  "......pPppppppppppPp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......FFppppppppppFF................",
  "......FFFFFFFFFFFFFF................"
];
const TORSO_FRONT_B = HEAD_FRONT.concat(BODY_FRONT_B);
// Aim ATAS: kepala sama, lengan kanan terangkat di sisi kanan (tangan
// memegang senjata vertikal — senjata sendiri digambar compUp).
const BODY_UP = [
  "......CCCCCCCCCCCCCCCCCC......ss....",
  ".....CvvvvvvvvvvvvvvvvvvC....sss....",
  ".....vvvvvvvvvvvvvvvvvvvvs...ss.....",
  ".....vVvvvvvvvvvvvvvvvvvss..........",
  ".....vVvvvvvDDvvvvvvvvvsss..........",
  ".....vvvvvvvDDvvvvvvvvvvss..........",
  ".....vvvvvvvvvvvvvvvvvvvvs..........",
  ".....vVvvvvvvvvvvvvvvvVvvs..........",
  ".....vvvvvvvvvvvvvvvvvvvvs..........",
  "......DDvvvvvvvvvvvvDD..............",
  "......nnnnnnnnnnyynnn...............",
  "......nnnnnnnnnnnnnnn...............",
  "......pppppppppppppp................",
  "......pPppppppppppPp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......FFppppppppppFF................",
  "......FFFFFFFFFFFFFF................"
];
const TORSO_UP = HEAD_FRONT.concat(BODY_UP);
// Aim DIAGONAL: lengan kanan setengah terangkat.
const BODY_DIAG = [
  "......CCCCCCCCCCCCCCCCCC............",
  ".....CvvvvvvvvvvvvvvvvvvC.....ss....",
  ".....vvvvvvvvvvvvvvvvvvvvs...sss....",
  ".....vVvvvvvvvvvvvvvvvvvss..ss......",
  ".....vVvvvvvDDvvvvvvvvvsss..........",
  ".....vvvvvvvDDvvvvvvvvvvss..........",
  ".....vvvvvvvvvvvvvvvvvvvvs..........",
  ".....vVvvvvvvvvvvvvvvvVvvs..........",
  ".....vvvvvvvvvvvvvvvvvvvvs..........",
  "......DDvvvvvvvvvvvvDD..............",
  "......nnnnnnnnnnyynnn...............",
  "......nnnnnnnnnnnnnnn...............",
  "......pppppppppppppp................",
  "......pPppppppppppPp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......FFppppppppppFF................",
  "......FFFFFFFFFFFFFF................"
];
const TORSO_DIAG = HEAD_FRONT.concat(BODY_DIAG);
// LEMPAR granat: lengan kanan terayun jauh ke belakang-atas.
const BODY_THROW = [
  "......CCCCCCCCCCCCCCCCCC.......s....",
  ".....CvvvvvvvvvvvvvvvvvvC.....ss....",
  ".....vvvvvvvvvvvvvvvvvvvvs...ss.....",
  ".....vVvvvvvvvvvvvvvvvvvss..s.......",
  ".....vVvvvvvDDvvvvvvvvvsss..........",
  ".....vvvvvvvDDvvvvvvvvvv............",
  ".....vvvvvvvvvvvvvvvvvvvvs..........",
  ".....vVvvvvvvvvvvvvvvvVvvs..........",
  ".....vvvvvvvvvvvvvvvvvvvvs..........",
  "......DDvvvvvvvvvvvvDD..............",
  "......nnnnnnnnnnyynnn...............",
  "......nnnnnnnnnnnnnnn...............",
  "......pppppppppppppp................",
  "......pPppppppppppPp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......FFppppppppppFF................",
  "......FFFFFFFFFFFFFF................"
];
const TORSO_THROW = HEAD_FRONT.concat(BODY_THROW);
// PISAU: lengan teracung jauh ke depan (pisau digambar comp).
const BODY_MELEE = [
  "......CCCCCCCCCCCCCCCCCC............",
  ".....CvvvvvvvvvvvvvvvvvvC...........",
  ".....vvvvvvvvvvvvvvvvvvvvs..........",
  ".....vVvvvvvvvvvvvvvvvvvssssss......",
  ".....vVvvvvvDDvvvvvvvvvv............",
  ".....vvvvvvvDDvvvvvvvvvv............",
  ".....vvvvvvvvvvvvvvvvvvvvs..........",
  ".....vVvvvvvvvvvvvvvvvVvvs..........",
  ".....vvvvvvvvvvvvvvvvvvvvs..........",
  "......DDvvvvvvvvvvvvDD..............",
  "......nnnnnnnnnnyynnn...............",
  "......nnnnnnnnnnnnnnn...............",
  "......pppppppppppppp................",
  "......pPppppppppppPp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......FFppppppppppFF................",
  "......FFFFFFFFFFFFFF................"
];
const TORSO_MELEE = HEAD_FRONT.concat(BODY_MELEE);
// KEMENANGAN: dua lengan terangkat (tangan kanan menggenggam senjata ke
// atas — senjata digambar compVictory), wajah riang (mata tertutup ^ ^).
const HEAD_VICTORY = [
  ".........rrrrrrrrrrrrrrrr...........",
  "........rrrrrrrrrrrrrrrrrr..........",
  "........rrrrrrrrrrrrrrrrRRR.........",
  "........rrrrrrrrrrrrrrrRRRR.........",
  ".........BBBBBBBBBBBBBBBB...........",
  ".........ssssssssssssss.............",
  ".........ssssssssssssSj.............",
  ".........sskkksssskkkss.............",
  ".........ssssssssssssSj.............",
  ".........ssssskkkkkkSSj.............",
  "..........ssssssssSSj...............",
  "..........SSSSSSSSSS................",
  ".............SSSS...................",
  ".............jjjj..................."
];
const BODY_VICTORY = [
  "....ss....CCCCCCCCCCCCCCCCCC....ss..",
  "....sss..CvvvvvvvvvvvvvvvvvvC..sss..",
  ".....ss..vvvvvvvvvvvvvvvvvvvvs..s...",
  "......s.vVvvvvvvvvvvvvvvvvvss.......",
  "........vVvvvvvDDvvvvvvvvvsss.......",
  "........vvvvvvvDDvvvvvvvvvvss.......",
  "........vvvvvvvvvvvvvvvvvvvvs.......",
  "........vVvvvvvvvvvvvvvvvVvvs.......",
  "........vvvvvvvvvvvvvvvvvvvvs.......",
  ".........DDvvvvvvvvvvvvDD...........",
  ".........nnnnnnnnnnyynnn............",
  ".........nnnnnnnnnnnnnnn............",
  ".........pppppppppppppp.............",
  ".........pPppppppppppPp.............",
  ".........pppppppppppppp.............",
  ".........pppppppppppppp.............",
  ".........pppppppppppppp.............",
  ".........pppppppppppppp.............",
  ".........pppppppppppppp.............",
  ".........FFppppppppppFF.............",
  ".........FFFFFFFFFFFFFF............."
];
const TORSO_VICTORY = HEAD_VICTORY.concat(BODY_VICTORY);
// TORSO JONGKOK 36x30 (dipakai di komposisi jongkok 36x45, y 0..29)
const TORSO_CROUCH = HEAD_FRONT.concat([
  "......CCCCCCCCCCCCCCCCCC............",
  ".....CvvvvvvvvvvvvvvvvvvC...........",
  ".....vvvvvvvvvvvvvvvvvvvvs..........",
  ".....vVvvvvvvvvvvvvvvvvvss..........",
  ".....vVvvvvvDDvvvvvvvvvsss..........",
  ".....vvvvvvvDDvvvvvvvvvvss..........",
  ".....vvvvvvvvvvvvvvvvvvvvs..........",
  ".....vVvvvvvvvvvvvvvvvVvvs..........",
  "......DDvvvvvvvvvvvvDD..............",
  "......nnnnnnnnnnyynnn...............",
  "......nnnnnnnnnnnnnnn...............",
  "......pppppppppppppp................",
  "......pPppppppppppPp................",
  "......pppppppppppppp................",
  "......pppppppppppppp................",
  "......FFFFFFFFFFFFFF................"
]);

// Ekor bandana berkibar (digambar di belakang torso, sisi kiri):
// 2 varian ayunan untuk frame lari.
const TAIL0 = [
  "..........",
  "RRR.......",
  "BRRRR.....",
  ".BBRRR....",
  "...BBB...."
];
const TAIL1 = [
  "..........",
  "...RRR....",
  "RRRBRR....",
  ".BBB......",
  ".........."
];

// --- KAKI (36x25), digambar di y=35 pada komposisi utuh ---
const LEGS_IDLE = [
  "......pppppppppppppp................",
  "......pppppp..pppppp................",
  "......pPpp....pPpp..................",
  "......pppp....pppp..................",
  "......pppp....pppp..................",
  "......pppp....pppp..................",
  "......pPpp....pPpp..................",
  "......pppp....pppp..................",
  "......pppp....pppp..................",
  "......pppp....pppp..................",
  "......pppp....pppp..................",
  "......pppp....pppp..................",
  "......pppp....pppp..................",
  "......pppp....pppp..................",
  "......pppp....pppp..................",
  "......pppp....pppp..................",
  "......pppp....pppp..................",
  "......pppp....pppp..................",
  "......pppp....pppp..................",
  "......pppp....pppp..................",
  ".....ooooo....ooooo.................",
  ".....ooooo....ooooo.................",
  ".....ooooo....ooooo.................",
  ".....OOOOO....OOOOO.................",
  "....OOOOOO....OOOOOO................"
];
// Lari 8 frame: kontak–tolak–lewat–terbang (x2 kaki bergantian)
const LEGS_RUN0 = [ // kontak depan kanan, belakang tertinggal
  "......pppppppppppppp................",
  "......pppppp...ppppp................",
  "......pppp......pppp................",
  "......ppp........ppp................",
  "......ppp.........pp................",
  "......pp..........pp................",
  "......pp..........pp................",
  "......pp...........p................",
  ".....ppp............................",
  ".....ppp............................",
  ".....pp.............................",
  ".....pp..........oooo...............",
  "....oooo........oooo................",
  "....oooo............................",
  "....oooo............................",
  "...ooooo............................",
  "...OOOOO............................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "...................................."
];
const LEGS_RUN1 = [ // tolak: kaki depan menekuk, belakang lurus menapak ujung
  "......pppppppppppppp................",
  "......pppppppppppp..................",
  "......pppppppppp....................",
  ".......ppppppp......................",
  ".......ppppp........................",
  ".......pppp.........................",
  ".......ppp..........................",
  ".......ppp..........................",
  ".......pp...........................",
  ".......pp...........pp..............",
  ".......pp..........ppp..............",
  ".......pp.........pppp..............",
  "......oooo.......pppp...............",
  "......oooo........pp................",
  "......oooo..........................",
  ".....ooooo..........................",
  ".....OOOOO..........................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "...................................."
];
const LEGS_RUN2 = [ // lewat: kedua kaki di bawah badan
  "......pppppppppppppp................",
  "......pppppp..pppppp................",
  "......ppppp....ppppp................",
  "......pppp......pppp................",
  "......ppp........ppp................",
  "......ppp........ppp................",
  "......pp..........pp................",
  "......pp..........pp................",
  "......pp..........pp................",
  "......pp.........pp.................",
  "......pp........ooo.................",
  ".....oooo......oooo.................",
  ".....oooo...........................",
  ".....oooo...........................",
  "....ooooo...........................",
  "....OOOOO...........................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "...................................."
];
const LEGS_RUN3 = [ // terbang: kaki depan meraih, belakang menekuk di belakang
  "......pppppppppppppp................",
  "......pppppp....pppp................",
  ".......pppp......ppp................",
  ".......ppp........pp................",
  ".......ppp.........p................",
  ".......pp...........................",
  ".......pp.........pp................",
  ".......pp........ppp................",
  ".......pp.......pppp................",
  ".......pp......oooo.................",
  ".......pp.....oooo..................",
  "......oooo..........................",
  "......oooo..........................",
  "......oooo..........................",
  ".....ooooo..........................",
  ".....OOOOO..........................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "...................................."
];
const LEGS_RUN4 = [ // kontak depan kiri (cermin fase RUN0)
  "......pppppppppppppp................",
  "......ppppp...pppppp................",
  "......pppp......pppp................",
  "......ppp........ppp................",
  "......pp.........ppp................",
  "......pp..........pp................",
  "......pp..........pp................",
  ".......p..........pp................",
  "............................ppp.....",
  "............................ppp.....",
  ".............................pp.....",
  "...............oooo..........pp.....",
  "................oooo........oooo....",
  "............................oooo....",
  "............................oooo....",
  "...........................ooooo....",
  "...........................OOOOO....",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "...................................."
];
const LEGS_RUN5 = [ // tolak kaki kiri
  "......pppppppppppppp................",
  "......pppppppppppp..................",
  "......pppppppppp....................",
  ".......ppppppp......................",
  ".......ppppp........................",
  ".......pppp.........................",
  ".......ppp..........................",
  ".......ppp...........pp.............",
  ".......pp...........ppp.............",
  ".......pp..........pppp.............",
  ".......pp.........pppp..............",
  ".......pp........pppp...............",
  "......oooo......pppp................",
  "......oooo.......pp.................",
  "......oooo..........................",
  ".....ooooo..........................",
  ".....OOOOO..........................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "...................................."
];
const LEGS_RUN6 = [ // lewat kedua
  "......pppppppppppppp................",
  "......pppppp..pppppp................",
  "......ppppp....ppppp................",
  "......pppp......pppp................",
  "......ppp........ppp................",
  "......ppp........ppp................",
  "......pp..........pp................",
  "......pp..........pp................",
  "......pp..........pp................",
  ".........pp.........pp..............",
  "........ooo........pp...............",
  ".......oooo......oooo...............",
  "...........................oooo.....",
  "...........................oooo.....",
  "..........................ooooo.....",
  "..........................OOOOO.....",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "...................................."
];
const LEGS_RUN7 = [ // terbang kedua
  "......pppppppppppppp................",
  "......pppp....pppppp................",
  "......ppp......pppp.................",
  "......pp........ppp.................",
  "......p.........ppp.................",
  "...........................pp.......",
  "..................pp......pp........",
  ".................ppp......pp........",
  "................pppp......pp........",
  "................oooo......pp........",
  ".........................oooo.......",
  "..........................oooo......",
  "..........................oooo......",
  "..........................oooo......",
  ".........................ooooo......",
  ".........................OOOOO......",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "...................................."
];
const LEGS_JUMP = [
  "......pppppppppppppp................",
  "......pppppp...ppppp................",
  "......pppp......pppp................",
  "......pppp.......ppp................",
  "......ppppppppppppp.................",
  "......pppp....ppppp.................",
  "......ppp......pppp.................",
  "......ppp.......ppp.................",
  ".....ppp.........pp.................",
  ".....ppp.........pp.................",
  ".....pp...........pp................",
  ".....pp...........pp................",
  "....oooo.........oooo...............",
  "....oooo.........oooo...............",
  "....oooo.........oooo...............",
  "....oooo.........oooo...............",
  "....OOOO.........OOOO...............",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "...................................."
];
const LEGS_CROUCH = [ // 36x15, digambar di y=30 pada komposisi jongkok 36x45
  "......pppppppppppppppppppp..........",
  "......pppppppppppppppppppp..........",
  "......pppppppp......pppppp..........",
  "......pppppp..........pppp..........",
  "......pppp.............ppp..........",
  ".....ooooo.............pppp.........",
  ".....oooooooo...........pppp........",
  ".....OOOOOOOO..........ooooo........",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "....................................",
  "...................................."
];
// Terkapar 54x15 (frame mati terakhir)
const DIE_FLAT = [
  "......................................................",
  "......rrrrrr..........................................",
  ".....ssssssss.........................................",
  ".....sskkssss..vvvvvvvvvvvvvvvvvvv....................",
  "......ssssss.vvvvvvvvvvvvvvvvvvvvvvpppppppp...........",
  "...........vvvvvvvvvvvvvvvvvvvvvvvvvpppppppoooo.......",
  "............nnnnnnnnnnnnn..........ppppppppoooo.......",
  "......................................................",
  "......................................................",
  "......................................................",
  "......................................................",
  "......................................................",
  "......................................................",
  "......................................................",
  "......................................................"
];

// Senjata tangan v3 (digambar terpisah dari torso, asal di tangan kanan)
const GUN_PISTOL = [
  "GGGGGGGGGGGG........",
  "Gggggggggggg........",
  ".GGGG..ss...........",
  ".......ss...........",
  ".......ss..........."
];
const GUN_HMG = [
  "GGGGGGGGGGGGGGGGGG..",
  "Gggggggggggggggggg..",
  ".GGGgGGgGGgGGgGG....",
  "..GGGG..sss.........",
  "........sss.........",
  "........sss........."
];
const GUN_ROCKET = [
  ".GGGGGGGGGGGGGGGGG..",
  "GGgggggggggggggggGG.",
  "GGGGGGGGGGGGGGGGGGG.",
  ".GGGG..sss..........",
  ".......sss..........",
  ".......sss.........."
];
const GUN_SHOTGUN = [
  "GGGGGGGGGGGGGGGG....",
  "GGGGGGGGGGGGGGG.....",
  ".mmmmmmmmmmmm.......",
  "..GGGG.sss..........",
  ".......sss..........",
  ".......sss.........."
];
const GUN_FLAME = [
  ".GGGGGGGGGGGGGG.....",
  "GGgggGGGGGGGGGG.....",
  ".GGGGGG..yy.........",
  "..GGGG..sss.........",
  "........sss.........",
  "........sss........."
];
const GUN_LASER = [
  "GGGGGGGGGGGGGGGGGG..",
  "GgGGccccGGGGGGGGG...",
  ".GGGG.....sss.......",
  "..........sss.......",
  "..........sss......."
];
const GUN_CHASER = [
  ".GGGGGGGGGGGG.......",
  "GGggggggggggGG......",
  "GGGGGGGGG..sss......",
  ".GGGG......sss......",
  "...........sss......"
];
const KNIFE = [
  "......wwwwww",
  "...wwwwwwwww",
  "nnnwww......",
  "nnn........."
];

/* ---------------------------------------------------------------------
   MUSUH v3 — 36x39, digambar menghadap KIRI. Runtime di-flip bila
   menghadap kanan. Torso 36x21 + kaki 36x18.
   --------------------------------------------------------------------- */
function enemyTorso3(armRow, helmet) {
  const H = helmet || 'h';
  return [
    "........." + H.repeat(15) + "............",
    "........" + H.repeat(18) + "..........",
    "......." + H.repeat(19) + "HH........",
    ".........ssssssssssssss.............",
    ".........ksssssssssssS..............",
    ".........ssssssssssssS..............",
    "..........SSSSSSSSSS................",
    "...........SSSSSS...................",
    ".....uuuuuuuuuuuuuuuu...............",
    armRow,
    ".....uuuuuuuuuuuuuuuU...............",
    ".....uuUUuuuuuuuuuuu................",
    ".....uuuuuuuuuuuuuuu................",
    ".....uuuuuuuuuuuuuu.................",
    ".....uuuuuuuuuuuu...................",
    "....nnnnnnnnnnnnnn..................",
    "....pppppppppppppp..................",
    "....pppppppppppppp..................",
    "....pppppppppppppp..................",
    "....pppppppppppppp..................",
    "....pppppppppppppp.................."
  ];
}
const EN_LEGS_STAND = [
  "....pppppp....pppppp................",
  "....pppppp....pppppp................",
  "....pPpppp....pPpppp................",
  "....pppppp....pppppp................",
  "....pppppp....pppppp................",
  "....pppppp....pppppp................",
  "....pppppp....pppppp................",
  "....pppppp....pppppp................",
  "....pppppp....pppppp................",
  "....pppppp....pppppp................",
  "....pppppp....pppppp................",
  "....pppppp....pppppp................",
  "....pppppp....pppppp................",
  "....pppppp....pppppp................",
  "...oooooo......oooooo...............",
  "...oooooo......oooooo...............",
  "...oooooo......oooooo...............",
  "...OOOOOO......OOOOOO..............."
];
const EN_LEGS_WALK0 = [
  "....pppppp.....ppppp................",
  "....pppppp......pppp................",
  "....ppppp........ppp................",
  "....ppppp.........pp................",
  "....pppp..........pp................",
  "....pppp..........pp................",
  "....ppp...........pp................",
  "....ppp.............................",
  "....ppp.............................",
  "....pp..............................",
  "....pp............ooo...............",
  "...oooo..........oooo...............",
  "...oooo.............................",
  "...oooo.............................",
  "...oooo.............................",
  "...oooo.............................",
  "..ooooo.............................",
  "..OOOOO............................."
];
const EN_LEGS_WALK1 = [
  "....pppppppppp......................",
  "....ppppppppp.......................",
  ".....ppppppp........................",
  ".....pppppp.........................",
  ".....ppppp..........................",
  ".....pppp...........................",
  ".....pppp...........................",
  ".....ppp............................",
  ".....ppp............................",
  ".....pp.............................",
  "....oooo............................",
  "....oooo............................",
  "....oooo............................",
  "....oooo............................",
  "....oooo............................",
  "....oooo............................",
  "...ooooo............................",
  "...OOOOO............................"
];
function enemySprite3(armRow, legs) {
  return enemyTorso3(armRow).concat(legs);
}
// Rebel: berjalan (2 frame) & menembak (lengan + senapan ke kiri)
const REBEL_WALK0 = enemySprite3("GGGGGGsssuuuuuuu....................", EN_LEGS_WALK0);
const REBEL_WALK1 = enemySprite3("GGGGGGsssuuuuuuu....................", EN_LEGS_WALK1);
const REBEL_SHOOT = enemySprite3("GGGGGGGGsssssuuu....................", EN_LEGS_STAND);
// Grenade Soldier: diam & lempar (lengan terayun ke atas-belakang)
const GRE_IDLE = enemySprite3(".....uuuuuuuuuuu....................", EN_LEGS_STAND);
const GRE_THROW = [
  ".........hhhhhhhhhhhhhhh............",
  "........hhhhhhhhhhhhhhhhhh..........",
  ".......hhhhhhhhhhhhhhhhhhhHH........",
  ".........ssssssssssssss......s......",
  ".........ksssssssssssS......ss......",
  ".........ssssssssssssS....ss........",
  "..........SSSSSSSSSS......s.........",
  "...........SSSSSS..........s........",
  ".....uuuuuuuuuuuuuuuus..............",
  "GGGuuuuuuuuuuuuuuuu.................",
  "....uuuuuuuuuuuuuuuU................",
  "....uuUUuuuuuuuuuuu.................",
  "....uuuuuuuuuuuuuuu.................",
  "....uuuuuuuuuuuuuu..................",
  ".....uuuuuuuuuuu....................",
  "....nnnnnnnnnnnnnn..................",
  "....pppppppppppppp..................",
  "....pppppppppppppp..................",
  "....pppppppppppppp..................",
  "....pppppppppppppp..................",
  "....pppppppppppppp.................."
].concat(EN_LEGS_STAND);
// Bazooka Soldier: tabung bazooka besar di bahu kiri
const BAZ_IDLE = enemySprite3("GGGGGGGGGGGsuuuuuu..................", EN_LEGS_STAND);

// Shield Soldier 36x39 — perisai baja besar di kolom 0..8 (depan/kiri)
const SHIELD_BODY = [
  ".........hhhhhhhhhhhhhhh............",
  "........hhhhhhhhhhhhhhhhhh..........",
  "xxxxxxxx.hhhhhhhhhhhhhhhHH..........",
  "xXXXXXXx.sssssssssssssS.............",
  "xXwwwwXx.ksssssssssssS..............",
  "xXwxxwXx.ssssssssssssS..............",
  "xXwwwwXx..SSSSSSSSSS................",
  "xXXXXXXx...SSSSSS...................",
  "xXXXXxxuuuuuuuuuuuuuu...............",
  "GGXXXXxuuuuuuuuuuuuuu...............",
  "xXXXXXXuuuuuuuuuuuuuuU..............",
  "xXXXXXXuuUUuuuuuuuuuu...............",
  "xXXXXXXuuuuuuuuuuuuuu...............",
  "xXXXXXXuuuuuuuuuuuuu................",
  "xXXXXXXuuuuuuuuuuu..................",
  "xXXXXXXnnnnnnnnnnnnn................",
  "xXXXXXXpppppppppppp.................",
  "xXXXXXXpppppppppppp.................",
  "xXXXXXXpppppppppppp.................",
  "xXXXXXXpppppppppppp.................",
  "xXXXXXXpppppppppppp................."
];
const SHIELD_LEGS0 = [
  "......pppppp....pppppp..............",
  "......pppppp....pppppp..............",
  "......pPpppp....pPpppp..............",
  "......pppppp....pppppp..............",
  "......pppppp....pppppp..............",
  "......pppppp....pppppp..............",
  "......pppppp....pppppp..............",
  "......pppppp....pppppp..............",
  "......pppppp....pppppp..............",
  "......pppppp....pppppp..............",
  "......pppppp....pppppp..............",
  "......pppppp....pppppp..............",
  "......pppppp....pppppp..............",
  "......pppppp....pppppp..............",
  ".....oooooo......oooooo.............",
  ".....oooooo......oooooo.............",
  ".....oooooo......oooooo.............",
  ".....OOOOOO......OOOOOO............."
];
const SHIELD_LEGS1 = [
  "......pppppp.....ppppp..............",
  "......pppppp......pppp..............",
  "......ppppp........ppp..............",
  "......ppppp.........pp..............",
  "......pppp..........pp..............",
  "......pppp..........pp..............",
  "......ppp...........pp..............",
  "......ppp...........................",
  "......ppp...........................",
  "......pp............................",
  "......pp............ooo.............",
  ".....oooo..........oooo.............",
  ".....oooo...........................",
  ".....oooo...........................",
  ".....oooo...........................",
  ".....oooo...........................",
  "....ooooo...........................",
  "....OOOOO..........................."
];
const SHIELD_WALK0 = SHIELD_BODY.concat(SHIELD_LEGS0);
const SHIELD_WALK1 = SHIELD_BODY.concat(SHIELD_LEGS1);
const SHIELD_BROKEN = [
  ".........hhhhhhhhhhhhhhh............",
  "........hhhhhhhhhhhhhhhhhh..........",
  "...s....ssssssssssssss..............",
  "....s...ksssssssssssS...............",
  ".....s..ssssssssssssS...............",
  ".....s...SSSSSSSSSS.................",
  "..........SSSSSS....................",
  ".....uuuuuuuuuuuuuu.................",
  ".....uuuuuuuuuuuuuuU................",
  ".....uuUUuuuuuuuuuu.................",
  ".....uuuuuuuuuuuuuu.................",
  ".....uuuuuuuuuuuuu..................",
  "......uuuuuuuuuu....................",
  ".....nnnnnnnnnnnnn..................",
  ".....pppppppppppp...................",
  ".....pppppppppppp...................",
  ".....pppppppppppp...................",
  ".....pppppppppppp...................",
  ".....pppppppppppp...................",
  ".....pppppppppppp...................",
  ".....pppppppppppp..................."
].concat(SHIELD_LEGS1);

/* ---------------------------------------------------------------------
   POW v3 — 24 lebar. Terikat total 30 (kepala+badan 16 + kaki 14),
   berjalan/melambai total 39 (badan 17 + kaki 22). Wajah berekspresi:
   mulut cemas saat terikat, tersenyum saat bebas.
   --------------------------------------------------------------------- */
const POW_HEAD_TIED = [
  "......ssssssssss......",
  ".....ssssssssssss.....",
  ".....skksssskkss......",
  ".....sssssssssss......",
  ".....ssskkkkssss......",
  "......ssssssss........",
  "....qqqqqqqqqqqq......",
  "...qqqqqqqqqqqqqq.....",
  "...qnqqqqqqqqqqnq.....",
  "...qqqqqqqqqqqqqq.....",
  "....qqqqqqqqqqqq......",
  "....qqqqqqqqqqqq......",
  "....qqqqqqqqqqqq......",
  ".....qqqqqqqqqq.......",
  ".....qqqqqqqqqq.......",
  ".....qqqqqqqqqq......."
];
const POW_TIED = POW_HEAD_TIED.concat([
  ".....qqqq..qqqq.......",
  ".....qqqq..qqqq.......",
  ".....QQQQ..QQQQ.......",
  ".....qqqq..qqqq.......",
  ".....qqqq..qqqq.......",
  ".....qqqq..qqqq.......",
  ".....qqqq..qqqq.......",
  ".....qqqq..qqqq.......",
  ".....qqqq..qqqq.......",
  ".....qqqq..qqqq.......",
  "....oooo....oooo......",
  "....oooo....oooo......",
  "....oooo....oooo......",
  "....OOOO....OOOO......"
]);
const POW_BODY_WALK = [
  "......ssssssssss......",
  ".....ssssssssssss.....",
  ".....skksssskkss......",
  ".....sssssssssss......",
  "......ssssssss........",
  "....qqqqqqqqqqqq......",
  "...sqqqqqqqqqqqqs.....",
  "...sqqqqqqqqqqqqs.....",
  "...sqqqqqqqqqqqqs.....",
  "....qqqqqqqqqqqq......",
  ".....qqqqqqqqqq.......",
  ".....qqqqqqqqqq.......",
  ".....qqqqqqqqqq.......",
  ".....qqqqqqqqqq.......",
  ".....qqqqqqqqqq.......",
  ".....qqqqqqqqqq.......",
  ".....qqqqqqqqqq......."
];
const POW_LEGS0 = [
  ".....qqqq..qqqq.......",
  ".....qqqq..qqqq.......",
  ".....QQQQ..QQQQ.......",
  ".....qqqq..qqqq.......",
  ".....qqqq..qqqq.......",
  ".....qqqq..qqqq.......",
  ".....qqqq..qqqq.......",
  ".....qqqq..qqqq.......",
  ".....qqqq..qqqq.......",
  ".....qqqq..qqqq.......",
  ".....qqqq..qqqq.......",
  ".....qqqq..qqqq.......",
  ".....qqqq..qqqq.......",
  ".....qqqq..qqqq.......",
  ".....qqqq..qqqq.......",
  ".....qqqq..qqqq.......",
  ".....qqqq..qqqq.......",
  ".....qqqq..qqqq.......",
  "....oooo....oooo......",
  "....oooo....oooo......",
  "....oooo....oooo......",
  "....OOOO....OOOO......"
];
const POW_LEGS1 = [
  ".....qqqq...qqqq......",
  ".....qqqq....qqq......",
  ".....QQQQ.....qq......",
  ".....qqqq......q......",
  ".....qqqq.............",
  ".....qqqq.............",
  ".....qqqq....qqq......",
  ".....qqqq...qqqq......",
  ".....qqqq..oooo.......",
  ".....qqqq.............",
  ".....qqqq.............",
  ".....qqqq.............",
  ".....qqqq.............",
  ".....qqqq.............",
  ".....qqqq.............",
  ".....qqqq.............",
  ".....qqqq.............",
  ".....qqqq.............",
  "....oooo..............",
  "....oooo..............",
  "....oooo..............",
  "....OOOO.............."
];
const POW_WALK0 = POW_BODY_WALK.concat(POW_LEGS0);
const POW_WALK1 = POW_BODY_WALK.concat(POW_LEGS1);
const POW_WAVE0 = [
  "......ssssssssss....s.",
  ".....ssssssssssss..ss.",
  ".....skksssskksss..s..",
  ".....sssssssssss......",
  "......ssssssss........",
  "....qqqqqqqqqqqq......",
  "...sqqqqqqqqqqqq......",
  "...sqqqqqqqqqqqq......",
  "....qqqqqqqqqqqq......",
  ".....qqqqqqqqqq.......",
  ".....qqqqqqqqqq.......",
  ".....qqqqqqqqqq.......",
  ".....qqqqqqqqqq.......",
  ".....qqqqqqqqqq.......",
  ".....qqqqqqqqqq.......",
  ".....qqqqqqqqqq.......",
  ".....qqqqqqqqqq......."
].concat(POW_LEGS0);
const POW_WAVE1 = [
  "......ssssssssss..s...",
  ".....ssssssssssss.s...",
  ".....skksssskkss......",
  ".....sssssssssss......",
  "......ssssssss........",
  "....qqqqqqqqqqqq......",
  "...sqqqqqqqqqqqq......",
  "...sqqqqqqqqqqqq......",
  "....qqqqqqqqqqqq......",
  ".....qqqqqqqqqq.......",
  ".....qqqqqqqqqq.......",
  ".....qqqqqqqqqq.......",
  ".....qqqqqqqqqq.......",
  ".....qqqqqqqqqq.......",
  ".....qqqqqqqqqq.......",
  ".....qqqqqqqqqq.......",
  ".....qqqqqqqqqq......."
].concat(POW_LEGS0);

/* ---------------------------------------------------------------------
   ITEM / OBJEK v3
   --------------------------------------------------------------------- */
const CRATE = [
  "mmmmmmmmmmmmmmmmmmmmmmmmmmm",
  "mWWWWWWWWWWWWWWWWWWWWWWWWWm",
  "mWmmmmmmmmmmmmmmmmmmmmmmWm.",
  "mWmWWWWWWWWWWWWWWWWWWWWmWm.",
  "mWmmWWWWWWWWWWWWWWWWWWmmWm.",
  "mWmmmWWWWWWWWWWWWWWWWmmmWm.",
  "mWmmmmWWWWWWWWWWWWWWmmmmWm.",
  "mWmmmmmWWWWWWWWWWWWmmmmmWm.",
  "mWmmmmmmWWWWWWWWWWmmmmmmWm.",
  "mWmmmmmmmWWWWWWWWmmmmmmmWm.",
  "mWmmmmmmmmWWWWWWmmmmmmmmWm.",
  "mWmmmmmmmmmWWWWmmmmmmmmmWm.",
  "mWmmmmmmmmWWWWWWmmmmmmmmWm.",
  "mWmmmmmmmWWWWWWWWmmmmmmmWm.",
  "mWmmmmmmWWWWWWWWWWmmmmmmWm.",
  "mWmmmmmWWWWWWWWWWWWmmmmmWm.",
  "mWmmmmWWWWWWWWWWWWWWmmmmWm.",
  "mWmmmWWWWWWWWWWWWWWWWmmmWm.",
  "mWmmWWWWWWWWWWWWWWWWWWmmWm.",
  "mWmWWWWWWWWWWWWWWWWWWWWmWm.",
  "mWmmmmmmmmmmmmmmmmmmmmmmWm.",
  "mWWWWWWWWWWWWWWWWWWWWWWWWWm",
  "mmmmmmmmmmmmmmmmmmmmmmmmmmm",
  "...........................",
  "...........................",
  "...........................",
  "..........................."
];
const BARREL = [
  ".....eeeeeeee.....",
  "....eEEEEEEEEe....",
  "...eEEeeeeeeEEe...",
  "...eEEEEEEEEEEe...",
  "...eEEeEEEEeEEe...",
  "...eEEEEEEEEEEe...",
  "...eEEeeeeeeEEe...",
  "...eEEEEEEEEEEe...",
  "...eEEeEEEEeEEe...",
  "...eEEEEEEEEEEe...",
  "...eEEeeeeeeEEe...",
  "...eEEEEEEEEEEe...",
  "....eEEEEEEEEe....",
  ".....eeeeeeee.....",
  "..................",
  "..................",
  "..................",
  ".................."
];
const SIGN = [
  "......mmmmmmmmmmmmmm....",
  ".....mWWWWWWWWWWWWWWm...",
  ".....mWWmmmmmmmmmmWWm...",
  ".....mWWmWWWWWWWWmWWm...",
  ".....mWWmmWWWWWWmmWWm...",
  ".....mWWmmmmmmmmmmWWm...",
  ".....mWWWWWWWWWWWWWWm...",
  "......mmmmmmmmmmmmmm....",
  "..........mmmm..........",
  "..........mmmm..........",
  "..........mmmm..........",
  "..........mmmm..........",
  "..........mmmm..........",
  "..........mmmm..........",
  "..........mmmm..........",
  "..........mmmm..........",
  "..........mmmm..........",
  "..........mmmm.........."
];
const ICON_HMG = [
  "........................",
  "...GGGGGGGGGGGGGGGGGG...",
  "..GGGGGGGGGGGGGGGGGGGG..",
  "..gggggggggggggggggg....",
  ".....GGGG....GGGG.......",
  ".....GGGG....GGGG.......",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................"
];
const ICON_ROCKET = [
  "........................",
  ".......GGGGGGGGGG.......",
  ".....GGggggggggggGG.....",
  "....GrGGGGGGGGGGGGGr....",
  "....rrrr......GGGG......",
  "....rrr.................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................"
];
const ICON_SHOTGUN = [
  "........................",
  "..GGGGGGGGGGGGGGGGGG....",
  ".GGGGGGGGGGGGGGGGGGGG...",
  ".GGGGGGGGGG.............",
  "...mmmmmmmm.............",
  "...mmmmmmmm.............",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................"
];
const ICON_FLAME = [
  "........................",
  "......ff................",
  ".....feff......GGGGGG...",
  "....feeeef..GGGGGGGGGG..",
  "....feeeefGGGGGG........",
  ".....feff...............",
  "......ff................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................"
];
const ICON_LASER = [
  "........................",
  "...GGGGGGGGGGGGGGGG.....",
  "..GGGGccGGGGGGGGGGG.....",
  "..GGGGGGGGGG............",
  "...GGGG.................",
  "...GGGG.................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................"
];
const ICON_CHASER = [
  "........................",
  ".....GGGGGGGGGG.........",
  "....GGggggggggGG........",
  "....GGGGGGGGGGG.........",
  ".....GG....GG...........",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................"
];
const ICON_GRENADE = [
  ".....kkkk.....",
  "....kGGGGk....",
  "...GGGGGGGG...",
  "...GgGGGGgG...",
  "...GGGGGGGG...",
  "...GGGGGGGG...",
  "...GGGGGGGG...",
  "....GGGGGG....",
  "..............",
  "..............",
  "..............",
  ".............."
];
const ICON_FIREBOMB = [
  ".....kkkk.....",
  "....keeeek....",
  "...eeffffee...",
  "...efffffee...",
  "...eeffffee...",
  "...eeeeeeee...",
  "...eeeeeeee...",
  "....eeeeee....",
  "..............",
  "..............",
  "..............",
  ".............."
];
const ICON_CANNON = [
  "........................",
  "...GGGGGGGGGG...........",
  "..GGGGGGGGGGGG..........",
  "..GgggggggggggG.........",
  "...GGGGGGGGGG...........",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................"
];

/* ---------------------------------------------------------------------
   AVATAR Pamong v3 — potret bust 108x108 (layar judul) + kepala 12x12
   (penanda nyawa HUD).
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
  return makeCanvas(108, 108, (ctx) => {
    ctx.fillStyle = '#31435f';
    ctx.beginPath(); ctx.arc(54, 54, 51, 0, 7); ctx.fill();
    ctx.fillStyle = '#3f5a80';
    ctx.beginPath(); ctx.arc(54, 49, 45, 0, 7); ctx.fill();
    ctx.fillStyle = '#2a2f38';
    ctx.fillRect(0, 87, 108, 21);
    ctx.save();
    ctx.beginPath(); ctx.arc(54, 54, 51, 0, 7); ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bust, 0, 6, 108, 108);
    ctx.restore();
    ctx.strokeStyle = '#f2c230';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(54, 54, 50, 0, 7); ctx.stroke();
  });
}
const HEAD_ROWS = [
  "..rrrrrrrr..",
  ".rrrrrrrrrr.",
  ".rrrrrrrrrr.",
  ".ssssssssss.",
  ".sskssssks..",
  ".ssssssssss.",
  "..ssssssss..",
  ".vvvvvvvvvv.",
  "vvvvvvvvvvvv",
  "vvvvvvvvvvvv",
  ".nnnnnnnnnn.",
  "............"
];
function drawHeadIcon() { return spr(HEAD_ROWS); }

/* ---------------------------------------------------------------------
   SV-001 "METAL SLUG" v3 — prosedural canvas 78x51, menghadap KANAN.
   Badan + roda; turet digambar terpisah (berputar 8 arah) oleh game.js.
   Titik putar turet pada badan: (39, 15) relatif kotak tabrak.
   --------------------------------------------------------------------- */
function drawSlugBody() {
  return makeCanvas(78, 51, (ctx) => {
    // rantai roda + roda jalan bergerigi
    ctx.fillStyle = '#24282e'; ctx.fillRect(4, 38, 70, 12);
    ctx.fillStyle = '#31373f'; ctx.fillRect(4, 38, 70, 3);
    ctx.fillStyle = '#4a5560';
    for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(11 + i * 8, 44, 4.4, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#171a1e';
    for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(11 + i * 8, 44, 1.8, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#5d6850';
    for (let i = 0; i < 9; i++) ctx.fillRect(7 + i * 8, 47, 4, 3); // tapak rantai
    // lambung berlapis + garis panel + rivet
    ctx.fillStyle = '#6d7c52'; ctx.fillRect(7, 24, 64, 15);
    ctx.fillStyle = '#7f915f'; ctx.fillRect(7, 24, 64, 4);
    ctx.fillStyle = '#8ba06e'; ctx.fillRect(7, 24, 64, 2);
    ctx.fillStyle = '#47543a'; ctx.fillRect(7, 35, 64, 4);
    ctx.fillStyle = '#55663f'; ctx.fillRect(36, 24, 2, 15); ctx.fillRect(56, 24, 2, 15);
    ctx.fillStyle = '#3e4a33';
    for (let i = 0; i < 6; i++) { ctx.fillRect(11 + i * 11, 31, 2, 2); }
    // hidung kanan miring + lampu
    ctx.fillStyle = '#6d7c52'; ctx.fillRect(69, 28, 8, 11);
    ctx.fillStyle = '#7f915f'; ctx.fillRect(72, 28, 5, 3);
    ctx.fillStyle = '#f2e29a'; ctx.fillRect(73, 32, 3, 3);
    ctx.fillStyle = '#20242a'; ctx.fillRect(73, 32, 1, 1);
    // palka belakang + knalpot + tangki samping
    ctx.fillStyle = '#55663f'; ctx.fillRect(12, 16, 15, 9);
    ctx.fillStyle = '#47543a'; ctx.fillRect(12, 23, 15, 2);
    ctx.fillStyle = '#3b4046'; ctx.fillRect(9, 12, 4, 7);
    ctx.fillStyle = '#5d6b45'; ctx.fillRect(14, 28, 16, 8);
    ctx.fillStyle = '#f2c230'; ctx.fillRect(17, 30, 3, 3);
    // bintang & strip penanda
    ctx.fillStyle = '#f2c230'; ctx.fillRect(50, 28, 7, 7);
    ctx.fillStyle = '#e8e4da'; ctx.fillRect(29, 29, 10, 3);
  });
}
function drawSlugTurret() {
  // Kubu turet menghadap KANAN; titik putar di (12, 17). Vulcan ganda.
  return makeCanvas(45, 24, (ctx) => {
    ctx.fillStyle = '#66754c'; ctx.fillRect(0, 6, 22, 15);
    ctx.fillStyle = '#77875c'; ctx.fillRect(1, 3, 18, 4);
    ctx.fillStyle = '#8ba06e'; ctx.fillRect(1, 3, 18, 2);
    ctx.fillStyle = '#47543a'; ctx.fillRect(0, 18, 22, 3);
    // garis panel + rivet kubu
    ctx.fillStyle = '#55663f'; ctx.fillRect(10, 6, 2, 15);
    ctx.fillStyle = '#3e4a33'; ctx.fillRect(4, 15, 2, 2); ctx.fillRect(16, 15, 2, 2);
    // laras Vulcan ganda ke kanan
    ctx.fillStyle = '#3b4046'; ctx.fillRect(22, 9, 21, 3); ctx.fillRect(22, 15, 21, 3);
    ctx.fillStyle = '#20242a'; ctx.fillRect(42, 8, 3, 5); ctx.fillRect(42, 14, 3, 5);
    // palka atas + periskop
    ctx.fillStyle = '#55663f'; ctx.fillRect(6, 0, 10, 4);
    ctx.fillStyle = '#3b4046'; ctx.fillRect(17, 1, 2, 3);
  });
}
function drawSlugCannonMuzzle() {
  // Meriam utama (sesaat saat menembak cannon): laras besar pendek.
  return makeCanvas(45, 24, (ctx) => {
    ctx.fillStyle = '#66754c'; ctx.fillRect(0, 6, 22, 15);
    ctx.fillStyle = '#77875c'; ctx.fillRect(1, 3, 18, 4);
    ctx.fillStyle = '#47543a'; ctx.fillRect(0, 18, 22, 3);
    ctx.fillStyle = '#55663f'; ctx.fillRect(10, 6, 2, 15);
    ctx.fillStyle = '#2c3138'; ctx.fillRect(21, 7, 22, 11);
    ctx.fillStyle = '#20242a'; ctx.fillRect(40, 6, 4, 13);
    ctx.fillStyle = '#55663f'; ctx.fillRect(6, 0, 10, 4);
  });
}

/* ---------------------------------------------------------------------
   Tank mini-boss "Di-Cokka" v3 — 96x66, menghadap KIRI, detail penuh:
   rantai roda bergerigi, kubah berlapis, periskop, antena, rivet.
   --------------------------------------------------------------------- */
function drawTank() {
  return makeCanvas(96, 66, (ctx) => {
    // rantai roda
    ctx.fillStyle = '#2c3138'; ctx.fillRect(7, 51, 82, 13);
    ctx.fillStyle = '#3a4046'; ctx.fillRect(7, 51, 82, 3);
    ctx.fillStyle = '#4a5560';
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(14 + i * 9, 57.5, 5, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#171a1e';
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(14 + i * 9, 57.5, 2, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#5d6850';
    for (let i = 0; i < 10; i++) ctx.fillRect(10 + i * 8.6, 61, 5, 3);
    // badan berlapis + panel + rivet
    ctx.fillStyle = '#5d6b45'; ctx.fillRect(10, 36, 76, 16);
    ctx.fillStyle = '#74855a'; ctx.fillRect(10, 36, 76, 6);
    ctx.fillStyle = '#8ba06e'; ctx.fillRect(10, 36, 76, 2);
    ctx.fillStyle = '#47543a'; ctx.fillRect(10, 47, 76, 5);
    ctx.fillStyle = '#66754c'; ctx.fillRect(38, 36, 2, 16); ctx.fillRect(62, 36, 2, 16);
    ctx.fillStyle = '#3e4a33';
    for (let i = 0; i < 6; i++) ctx.fillRect(16 + i * 12, 44, 2, 2);
    ctx.fillStyle = '#5d6b45'; ctx.fillRect(3, 42, 9, 10); // ekor kiri
    // kubah
    ctx.fillStyle = '#66754c'; ctx.fillRect(33, 19, 41, 18);
    ctx.fillStyle = '#7f915f'; ctx.fillRect(37, 15, 29, 6);
    ctx.fillStyle = '#8ba06e'; ctx.fillRect(37, 15, 29, 2);
    ctx.fillStyle = '#47543a'; ctx.fillRect(33, 34, 41, 3);
    // meriam ke kiri + rem moncong
    ctx.fillStyle = '#3b4046'; ctx.fillRect(3, 24, 31, 7);
    ctx.fillStyle = '#20242a'; ctx.fillRect(0, 22, 4, 11);
    ctx.fillStyle = '#2c3138'; ctx.fillRect(8, 23, 4, 9);
    // periskop + antena + palka + lampu
    ctx.fillStyle = '#3b4046'; ctx.fillRect(63, 8, 3, 8); ctx.fillRect(60, 7, 9, 3);
    ctx.fillRect(45, 5, 2, 11);
    ctx.fillStyle = '#d84f35'; ctx.fillRect(44, 3, 4, 3);
    ctx.fillStyle = '#55663f'; ctx.fillRect(39, 11, 13, 4);
    ctx.fillStyle = '#f2e29a'; ctx.fillRect(6, 38, 4, 4);
    // bintang + strip peringatan
    ctx.fillStyle = '#f2c230'; ctx.fillRect(48, 24, 9, 9);
    ctx.fillRect(40, 41, 6, 4); ctx.fillRect(75, 41, 6, 4);
  });
}

/* ---------------------------------------------------------------------
   ROBOT TITAN v3 (bos akhir) — prosedural canvas 96x150, menghadap
   KIRI. Panel baja berlapis + rivet + lampu indikator. Core di dada
   pada (39..57, 57..75) relatif sprite. Lengan meriam terpisah
   ditarik dari titik bahu (21, 45) relatif sprite.
   --------------------------------------------------------------------- */
function buildTitanSprite() {
  return makeCanvas(96, 150, (ctx) => {
    // kaki baja besar berlapis
    ctx.fillStyle = '#274a73'; ctx.fillRect(18, 111, 21, 27); ctx.fillRect(57, 111, 21, 27);
    ctx.fillStyle = '#3f7fbf'; ctx.fillRect(18, 111, 21, 6); ctx.fillRect(57, 111, 21, 6);
    ctx.fillStyle = '#16283f'; ctx.fillRect(18, 128, 21, 10); ctx.fillRect(57, 128, 21, 10);
    ctx.fillStyle = '#1b3552'; ctx.fillRect(12, 135, 30, 12); ctx.fillRect(54, 135, 30, 12); // telapak
    ctx.fillStyle = '#0f1f33'; ctx.fillRect(12, 144, 30, 3); ctx.fillRect(54, 144, 30, 3);
    ctx.fillStyle = '#58c7d8'; ctx.fillRect(24, 120, 4, 9); ctx.fillRect(68, 120, 4, 9); // lampu lutut
    ctx.fillStyle = '#f2c230'; ctx.fillRect(33, 116, 3, 3); ctx.fillRect(60, 116, 3, 3); // rivet lutut
    // pinggang + sabuk daya
    ctx.fillStyle = '#2c3138'; ctx.fillRect(27, 99, 42, 13);
    ctx.fillStyle = '#3a4046'; ctx.fillRect(27, 99, 42, 3);
    ctx.fillStyle = '#f2c230'; ctx.fillRect(43, 103, 10, 5);
    ctx.fillStyle = '#d84f35'; ctx.fillRect(30, 104, 4, 3); ctx.fillRect(62, 104, 4, 3);
    // badan utama berpanel
    ctx.fillStyle = '#3f7fbf'; ctx.fillRect(15, 39, 66, 63);
    ctx.fillStyle = '#6fa8dc'; ctx.fillRect(15, 39, 66, 5);
    ctx.fillStyle = '#5b93cf'; ctx.fillRect(15, 44, 66, 4);
    ctx.fillStyle = '#274a73'; ctx.fillRect(15, 87, 66, 15);
    ctx.fillStyle = '#1b3552'; ctx.fillRect(21, 48, 12, 33); ctx.fillRect(63, 48, 12, 33); // panel samping
    ctx.fillStyle = '#16283f'; ctx.fillRect(24, 52, 6, 4); ctx.fillRect(66, 52, 6, 4);   // ventilasi
    ctx.fillRect(24, 60, 6, 4); ctx.fillRect(66, 60, 6, 4);
    ctx.fillRect(24, 68, 6, 4); ctx.fillRect(66, 68, 6, 4);
    ctx.fillStyle = '#f2c230'; ctx.fillRect(22, 90, 7, 7); ctx.fillRect(67, 90, 7, 7);     // kunci panel
    ctx.fillStyle = '#d84f35'; ctx.fillRect(34, 92, 3, 3); ctx.fillRect(59, 92, 3, 3);     // lampu status
    ctx.fillStyle = '#58c7d8'; ctx.fillRect(34, 97, 3, 2); ctx.fillRect(59, 97, 3, 2);
    // rivet rangka badan
    ctx.fillStyle = '#274a73';
    for (let i = 0; i < 5; i++) { ctx.fillRect(19 + i * 15, 42, 3, 3); ctx.fillRect(19 + i * 15, 96, 3, 3); }
    // CORE menyala di dada (titik lemah) — kotak (39..57, 57..75)
    ctx.fillStyle = '#20242a'; ctx.fillRect(36, 54, 24, 24);
    ctx.fillStyle = '#3a4046'; ctx.fillRect(36, 54, 24, 3); ctx.fillRect(36, 75, 24, 3);
    ctx.fillStyle = '#58c7d8'; ctx.fillRect(39, 57, 18, 18);
    ctx.fillStyle = '#8fe3f2'; ctx.fillRect(42, 60, 12, 12);
    ctx.fillStyle = '#e8fbff'; ctx.fillRect(45, 63, 6, 6);
    // bahu + bantalan rudal (salvo bahu)
    ctx.fillStyle = '#274a73'; ctx.fillRect(3, 27, 24, 21); ctx.fillRect(69, 27, 24, 21);
    ctx.fillStyle = '#3f7fbf'; ctx.fillRect(3, 27, 24, 6); ctx.fillRect(69, 27, 24, 6);
    ctx.fillStyle = '#6fa8dc'; ctx.fillRect(3, 27, 24, 2); ctx.fillRect(69, 27, 24, 2);
    ctx.fillStyle = '#20242a';
    for (let i = 0; i < 3; i++) { ctx.fillRect(6 + i * 7, 17, 5, 10); ctx.fillRect(72 + i * 7, 17, 5, 10); }
    ctx.fillStyle = '#d84f35';
    for (let i = 0; i < 3; i++) { ctx.fillRect(7 + i * 7, 15, 3, 3); ctx.fillRect(73 + i * 7, 15, 3, 3); }
    // kepala + visor + antena
    ctx.fillStyle = '#3f7fbf'; ctx.fillRect(33, 9, 30, 21);
    ctx.fillStyle = '#6fa8dc'; ctx.fillRect(33, 9, 30, 5);
    ctx.fillStyle = '#274a73'; ctx.fillRect(33, 25, 30, 5);
    ctx.fillStyle = '#20242a'; ctx.fillRect(36, 18, 24, 6);
    ctx.fillStyle = '#d84f35'; ctx.fillRect(39, 20, 6, 3); ctx.fillRect(51, 20, 6, 3); // mata merah
    ctx.fillStyle = '#2c3138'; ctx.fillRect(45, 0, 3, 9); // antena
    ctx.fillStyle = '#d84f35'; ctx.fillRect(43, 0, 7, 3);
    ctx.fillStyle = '#f2c230'; ctx.fillRect(35, 11, 3, 3); ctx.fillRect(58, 11, 3, 3);
    // lengan kanan menempel (kiri digambar terpisah sebagai meriam)
    ctx.fillStyle = '#274a73'; ctx.fillRect(72, 48, 15, 39);
    ctx.fillStyle = '#3f7fbf'; ctx.fillRect(72, 48, 15, 6);
    ctx.fillStyle = '#1b3552'; ctx.fillRect(72, 70, 15, 17);
    ctx.fillStyle = '#2c3138'; ctx.fillRect(70, 84, 18, 15); // kepalan kanan
    ctx.fillStyle = '#3a4046'; ctx.fillRect(70, 84, 18, 3);
  });
}
function drawTitanArm() {
  // Lengan meriam kiri: asal putar di bahu (39, 9); laras ke KIRI.
  return makeCanvas(51, 21, (ctx) => {
    ctx.fillStyle = '#274a73'; ctx.fillRect(27, 2, 22, 18);
    ctx.fillStyle = '#3f7fbf'; ctx.fillRect(27, 2, 22, 5);
    ctx.fillStyle = '#6fa8dc'; ctx.fillRect(27, 2, 22, 2);
    ctx.fillStyle = '#f2c230'; ctx.fillRect(30, 15, 12, 3);
    ctx.fillStyle = '#58c7d8'; ctx.fillRect(44, 4, 3, 3);
    ctx.fillStyle = '#2c3138'; ctx.fillRect(3, 5, 25, 12);   // laras
    ctx.fillStyle = '#3a4046'; ctx.fillRect(3, 5, 25, 3);
    ctx.fillStyle = '#171a1e'; ctx.fillRect(0, 3, 4, 16);   // moncong
  });
}

/* ---------------------------------------------------------------------
   MONSTER LAUT v3 — kepala 72x60 (menghadap KANAN, di-flip sesuai
   posisi) bersisik bermata besar bergigi + tentakel 24x84 bersegmen.
   --------------------------------------------------------------------- */
function drawSeaHead() {
  return makeCanvas(72, 60, (ctx) => {
    // cangkang atas bersisik
    ctx.fillStyle = '#5e8f52'; ctx.fillRect(9, 3, 54, 18);
    ctx.fillStyle = '#7fae6d'; ctx.fillRect(15, 0, 42, 7);
    ctx.fillStyle = '#4d7942'; ctx.fillRect(9, 15, 54, 7);
    ctx.fillStyle = '#6fa055';
    for (let i = 0; i < 6; i++) ctx.fillRect(13 + i * 8, 5 + (i % 2) * 4, 5, 3); // sisik cangkang
    // duri cangkang
    ctx.fillStyle = '#35542c';
    for (let i = 0; i < 5; i++) ctx.fillRect(15 + i * 10, -0 + (i % 2), 4, 6);
    // wajah
    ctx.fillStyle = '#8fbc7d'; ctx.fillRect(6, 21, 60, 24);
    ctx.fillStyle = '#a8cf97'; ctx.fillRect(6, 21, 60, 6);
    ctx.fillStyle = '#6fa055'; ctx.fillRect(6, 39, 60, 6);
    // bintik sisik pipi
    ctx.fillStyle = '#7fae6d';
    ctx.fillRect(10, 28, 4, 3); ctx.fillRect(17, 33, 4, 3); ctx.fillRect(52, 30, 4, 3); ctx.fillRect(58, 35, 4, 3);
    // mata bertangkai besar
    ctx.fillStyle = '#4d7942'; ctx.fillRect(15, 12, 4, 10); ctx.fillRect(51, 12, 4, 10);
    ctx.fillStyle = '#f2e29a'; ctx.fillRect(12, 6, 10, 9); ctx.fillRect(48, 6, 10, 9);
    ctx.fillStyle = '#fdf6d8'; ctx.fillRect(13, 7, 8, 3); ctx.fillRect(49, 7, 8, 3);
    ctx.fillStyle = '#20242a'; ctx.fillRect(15, 9, 4, 4); ctx.fillRect(51, 9, 4, 4);
    // mulut + taring atas & bawah
    ctx.fillStyle = '#5e2f2f'; ctx.fillRect(18, 36, 36, 9);
    ctx.fillStyle = '#7a3a30'; ctx.fillRect(18, 42, 36, 3);
    ctx.fillStyle = '#e8e4da';
    ctx.fillRect(21, 36, 4, 6); ctx.fillRect(31, 36, 4, 6); ctx.fillRect(41, 36, 4, 6);
    ctx.fillRect(26, 41, 4, 4); ctx.fillRect(36, 41, 4, 4); ctx.fillRect(46, 41, 4, 4);
    // insang menyamping
    ctx.fillStyle = '#5e8f52'; ctx.fillRect(6, 27, 5, 12); ctx.fillRect(61, 27, 5, 12);
    ctx.fillStyle = '#4d7942'; ctx.fillRect(7, 29, 2, 8); ctx.fillRect(63, 29, 2, 8);
    // dagu
    ctx.fillStyle = '#7fae6d'; ctx.fillRect(15, 45, 42, 9);
    ctx.fillStyle = '#5e8f52'; ctx.fillRect(15, 51, 42, 6);
    ctx.fillStyle = '#4d7942'; ctx.fillRect(15, 55, 42, 3);
  });
}
function drawTentacle() {
  // Tentakel bersegmen melengkung, pangkal di bawah (84), ujung di atas.
  return makeCanvas(24, 84, (ctx) => {
    const seg = [ [5,72,15],[4,61,15],[4,50,14],[5,40,13],[7,30,11],[9,21,10],[11,13,8],[12,5,7] ];
    ctx.fillStyle = '#4d7942';
    for (const s of seg) ctx.fillRect(s[0], s[1], s[2], 13);
    ctx.fillStyle = '#6da35c';
    for (const s of seg) ctx.fillRect(s[0] + 2, s[1], 4, 13);
    ctx.fillStyle = '#35542c';
    for (const s of seg) ctx.fillRect(s[0], s[1] + 11, s[2], 2); // garis segmen
    // cangkir isap
    ctx.fillStyle = '#c9a0b4';
    ctx.fillRect(9, 66, 4, 4); ctx.fillRect(8, 52, 4, 4); ctx.fillRect(10, 39, 4, 4); ctx.fillRect(12, 27, 3, 3); ctx.fillRect(14, 16, 3, 3);
  });
}

/* ---------------------------------------------------------------------
   ELEMEN DUNIA v3 — tenda 66x45, gudang 96x60, menara 45x96 (lantai
   kabin di offset y=22 dari atas gambar), bendera, batu, karung pasir,
   kawat berduri, bunga liar, reruntuhan.
   --------------------------------------------------------------------- */
function drawTent() { // jangkar bawah di tanah
  return makeCanvas(66, 45, (ctx) => {
    ctx.fillStyle = '#5c6b45';
    ctx.beginPath(); ctx.moveTo(3, 45); ctx.lineTo(33, 6); ctx.lineTo(63, 45); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6d7c52';
    ctx.beginPath(); ctx.moveTo(33, 6); ctx.lineTo(63, 45); ctx.lineTo(33, 45); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7f915f'; ctx.fillRect(31, 6, 4, 39);
    ctx.fillStyle = '#47543a'; ctx.fillRect(3, 41, 60, 4);
    // tali pasak
    ctx.fillStyle = '#3b4046'; ctx.fillRect(0, 43, 4, 2); ctx.fillRect(62, 43, 4, 2);
    // pintu
    ctx.fillStyle = '#2e3524';
    ctx.beginPath(); ctx.moveTo(25, 45); ctx.lineTo(33, 22); ctx.lineTo(41, 45); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1d2316';
    ctx.beginPath(); ctx.moveTo(29, 45); ctx.lineTo(33, 30); ctx.lineTo(37, 45); ctx.closePath(); ctx.fill();
    // palang merah (tenda medis musuh)
    ctx.fillStyle = '#e8e4da'; ctx.fillRect(48, 21, 10, 10);
    ctx.fillStyle = '#d84f35'; ctx.fillRect(51, 22, 4, 8); ctx.fillRect(49, 25, 8, 3);
    // tiang + bendera kecil
    ctx.fillStyle = '#3b4046'; ctx.fillRect(32, 1, 2, 6);
    ctx.fillStyle = '#a03232'; ctx.fillRect(34, 1, 7, 4);
  });
}
function drawWarehouse() { // gudang kamp 96x60 — bisa dihancurkan
  return makeCanvas(96, 60, (ctx) => {
    // dinding papan berlapis
    ctx.fillStyle = '#6e5636'; ctx.fillRect(4, 14, 88, 46);
    ctx.fillStyle = '#7d6540'; ctx.fillRect(4, 14, 88, 6);
    ctx.fillStyle = '#5d4630';
    for (let y = 24; y < 58; y += 9) ctx.fillRect(4, y, 88, 2);
    ctx.fillRect(30, 14, 3, 46); ctx.fillRect(63, 14, 3, 46);
    // atap seng miring
    ctx.fillStyle = '#5a6068';
    ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(48, 2); ctx.lineTo(96, 15); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6d747d';
    ctx.beginPath(); ctx.moveTo(6, 13); ctx.lineTo(48, 3); ctx.lineTo(90, 13); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#454b52'; ctx.fillRect(46, 1, 4, 4);
    // pintu geser + gembok
    ctx.fillStyle = '#4a3823'; ctx.fillRect(36, 28, 24, 32);
    ctx.fillStyle = '#5d4630'; ctx.fillRect(38, 30, 20, 3); ctx.fillRect(38, 42, 20, 3);
    ctx.fillStyle = '#f2c230'; ctx.fillRect(56, 44, 3, 4);
    // jendela menyala
    ctx.fillStyle = '#f2e29a'; ctx.fillRect(12, 30, 10, 10); ctx.fillRect(74, 30, 10, 10);
    ctx.fillStyle = '#6e5636'; ctx.fillRect(16, 30, 2, 10); ctx.fillRect(78, 30, 2, 10);
    // lambang tengkorak cat putih
    ctx.fillStyle = '#e8e4da'; ctx.fillRect(44, 17, 8, 6);
    ctx.fillStyle = '#20242a'; ctx.fillRect(46, 19, 2, 2); ctx.fillRect(50, 19, 2, 2);
  });
}
function drawTower() { // menara pengawas 45x96; lantai kabin offset 22
  return makeCanvas(45, 96, (ctx) => {
    // kaki + penguat silang
    ctx.fillStyle = '#6e3d20';
    ctx.fillRect(6, 21, 4, 75); ctx.fillRect(35, 21, 4, 75);
    ctx.fillRect(6, 51, 33, 4); ctx.fillRect(6, 76, 33, 4);
    ctx.save(); ctx.translate(22, 63); ctx.rotate(0.62); ctx.fillRect(-21, -2, 42, 3); ctx.restore();
    ctx.save(); ctx.translate(22, 63); ctx.rotate(-0.62); ctx.fillRect(-21, -2, 42, 3); ctx.restore();
    ctx.save(); ctx.translate(22, 34); ctx.rotate(0.62); ctx.fillRect(-20, -2, 40, 3); ctx.restore();
    ctx.save(); ctx.translate(22, 34); ctx.rotate(-0.62); ctx.fillRect(-20, -2, 40, 3); ctx.restore();
    // kabin atas: lantai di offset 22
    ctx.fillStyle = '#8a5a2e'; ctx.fillRect(0, 6, 45, 16);
    ctx.fillStyle = '#a9713f'; ctx.fillRect(0, 6, 45, 4);
    ctx.fillStyle = '#2e2418'; ctx.fillRect(6, 12, 33, 8); // celah pandang gelap
    ctx.fillStyle = '#8a5a2e'; ctx.fillRect(0, 20, 45, 3); // bibir lantai kabin
    // atap
    ctx.fillStyle = '#5c6b45';
    ctx.beginPath(); ctx.moveTo(-3, 7); ctx.lineTo(22, -4 + 4); ctx.lineTo(48, 7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#47543a';
    ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(48, 7); ctx.lineTo(22, 7); ctx.closePath(); ctx.fill();
    // tangga
    ctx.fillStyle = '#6e3d20';
    for (let i = 0; i < 6; i++) ctx.fillRect(18, 28 + i * 11, 9, 3);
    ctx.fillRect(17, 24, 2, 70); ctx.fillRect(27, 24, 2, 70);
  });
}
function drawFlag() { // bendera musuh 21x45
  return makeCanvas(21, 45, (ctx) => {
    ctx.fillStyle = '#3b4046'; ctx.fillRect(2, 0, 3, 45);
    ctx.fillStyle = '#2c3138'; ctx.fillRect(0, 43, 7, 2);
    ctx.fillStyle = '#a03232'; ctx.fillRect(5, 2, 16, 12);
    ctx.fillStyle = '#7e2626'; ctx.fillRect(5, 9, 16, 5);
    ctx.fillStyle = '#f2c230'; ctx.fillRect(10, 5, 6, 6); // lambang
    ctx.fillStyle = '#a03232'; ctx.fillRect(12, 7, 2, 2);
  });
}
function drawRock() { // batu besar 36x24
  return makeCanvas(36, 24, (ctx) => {
    ctx.fillStyle = '#5d6066';
    ctx.beginPath(); ctx.moveTo(2, 24); ctx.lineTo(6, 10); ctx.lineTo(16, 3); ctx.lineTo(28, 5); ctx.lineTo(34, 14); ctx.lineTo(35, 24); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#767a80';
    ctx.beginPath(); ctx.moveTo(6, 10); ctx.lineTo(16, 3); ctx.lineTo(24, 6); ctx.lineTo(18, 12); ctx.lineTo(9, 13); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#45484e';
    ctx.beginPath(); ctx.moveTo(18, 12); ctx.lineTo(24, 6); ctx.lineTo(34, 14); ctx.lineTo(35, 24); ctx.lineTo(22, 24); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8f939a'; ctx.fillRect(11, 7, 5, 2);
    ctx.fillStyle = '#2f3237'; ctx.fillRect(20, 15, 6, 1); ctx.fillRect(8, 18, 5, 1); // retakan
  });
}
function drawSandbags() { // karung pasir 42x21
  return makeCanvas(42, 21, (ctx) => {
    const bag = (x, y, w, base, light) => {
      ctx.fillStyle = base; ctx.fillRect(x, y, w, 9);
      ctx.fillStyle = light; ctx.fillRect(x + 1, y + 1, w - 2, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, y + 7, w, 2);
    };
    bag(1, 12, 19, '#8a7a4e', '#a89468'); bag(21, 12, 20, '#7d6c44', '#9a845a');
    bag(6, 4, 18, '#8a7a4e', '#a89468'); bag(25, 4, 15, '#7d6c44', '#9a845a');
    bag(14, -3 + 3, 16, '#8a7a4e', '#a89468');
  });
}
function drawWire() { // kawat berduri 48x24
  return makeCanvas(48, 24, (ctx) => {
    ctx.fillStyle = '#5d4630'; ctx.fillRect(3, 4, 3, 20); ctx.fillRect(42, 4, 3, 20);
    ctx.strokeStyle = '#8b95a0'; ctx.lineWidth = 1.5;
    for (const yy of [8, 15, 21]) {
      ctx.beginPath(); ctx.moveTo(2, yy);
      for (let x = 2; x <= 46; x += 4) ctx.lineTo(x, yy + ((x / 4) % 2 ? -1.5 : 1.5));
      ctx.stroke();
    }
    ctx.fillStyle = '#c4c7c9';
    for (let x = 6; x < 46; x += 8) { ctx.fillRect(x, 6, 2, 2); ctx.fillRect(x + 3, 13, 2, 2); ctx.fillRect(x, 19, 2, 2); }
  });
}
function drawFlowers() { // rumput & bunga liar 30x15
  return makeCanvas(30, 15, (ctx) => {
    ctx.fillStyle = '#557f36';
    let seed = 31415;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let i = 0; i < 12; i++) {
      const gx = 1 + (rnd() * 27) | 0, gh = 5 + (rnd() * 7) | 0;
      ctx.fillRect(gx, 15 - gh, 1, gh);
      ctx.fillRect(gx + 1, 15 - gh + 2, 1, gh - 2);
    }
    ctx.fillStyle = '#e87e35'; ctx.fillRect(6, 5, 3, 3); ctx.fillRect(21, 3, 3, 3);
    ctx.fillStyle = '#f2c230'; ctx.fillRect(13, 7, 3, 3); ctx.fillRect(26, 8, 2, 2);
    ctx.fillStyle = '#e8e4da'; ctx.fillRect(17, 4, 2, 2);
  });
}
function drawRuin() { // dinding reruntuhan 54x48 (zona lapangan akhir)
  return makeCanvas(54, 48, (ctx) => {
    ctx.fillStyle = '#6b5a48'; ctx.fillRect(2, 10, 50, 38);
    ctx.fillStyle = '#7d6a54'; ctx.fillRect(2, 10, 50, 5);
    ctx.fillStyle = '#57493a';
    for (let y = 18; y < 46; y += 8) ctx.fillRect(2, y, 50, 2);
    ctx.fillRect(16, 10, 3, 14); ctx.fillRect(36, 24, 3, 24); ctx.fillRect(24, 40, 3, 8);
    // runtuhan atas tidak rata
    ctx.clearRect(30, 4, 24, 8); ctx.clearRect(40, 0, 14, 12);
    ctx.fillStyle = '#6b5a48'; ctx.fillRect(28, 6, 10, 6);
    // lubang jendela gelap + retakan
    ctx.fillStyle = '#241c14'; ctx.fillRect(10, 22, 11, 13); ctx.fillRect(32, 28, 9, 11);
    ctx.fillStyle = '#3a2f22'; ctx.fillRect(44, 16, 2, 14); ctx.fillRect(6, 36, 12, 2);
    // lumut bawah
    ctx.fillStyle = '#557f36'; ctx.fillRect(4, 44, 14, 4); ctx.fillRect(38, 45, 12, 3);
  });
}

/* ---------------------------------------------------------------------
   LATAR 4 LAPIS v3 — tiap lapis di-prerender SEKALI (960x270).
   Lapis 1 bgSky: gradasi senja kaya + matahari + awan organik jauh.
   Lapis 2 cloudStrip: awan berlapis bentuk organik (parallax 0.05).
   Lapis 3 bgFar: pegunungan bertekstur + siluet hutan jauh (0.3).
   Lapis 4 bgMid: hutan tengah BERVARIASI (0.6) — 3 tipe pohon.
   Foreground: rumpun tepi bawah semi-transparan 2 varian (bergoyang).
   --------------------------------------------------------------------- */
function drawBgSky() {
  return makeCanvas(960, 270, (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 0, 270);
    grad.addColorStop(0, '#1f2a47');
    grad.addColorStop(0.3, '#46325e');
    grad.addColorStop(0.52, '#8a4a5e');
    grad.addColorStop(0.72, '#c97b4a');
    grad.addColorStop(0.9, '#eeaa5e');
    grad.addColorStop(1, '#f7c26a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 960, 270);
    // bintang tipis di langit atas
    let seed = 777;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 60; i++) ctx.fillRect((rnd() * 958) | 0, (rnd() * 70) | 0, 1, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let i = 0; i < 30; i++) ctx.fillRect((rnd() * 958) | 0, (rnd() * 100) | 0, 2, 1);
    // matahari rendah + halo berlapis (dilembutkan audit v4: cincin halo
    // tembus pandang yang besar terbaca sebagai noda di langit)
    ctx.fillStyle = 'rgba(247,215,116,0.10)';
    ctx.beginPath(); ctx.arc(738, 168, 58, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(247,215,116,0.16)';
    ctx.beginPath(); ctx.arc(738, 168, 42, 0, 7); ctx.fill();
    ctx.fillStyle = '#f7d774'; ctx.beginPath(); ctx.arc(738, 168, 31, 0, 7); ctx.fill();
    ctx.fillStyle = '#f9e08a'; ctx.beginPath(); ctx.arc(738, 168, 24, 0, 7); ctx.fill();
    ctx.fillStyle = '#f7d774'; ctx.fillRect(706, 166, 64, 3);
    // (Pita awan melintang warisan v3 DIHAPUS audit v4: baris lingkaran
    // r=42 + fillRect sepenuh lebar membentuk GARIS MELINTANG keras di
    // tengah langit pada pratinjau gameplay — langit kini bersih, awan
    // hanya hidup di lapis cloudStrip yang redup.)
  });
}
function drawCloudStrip() {
  return makeCanvas(960, 270, (ctx) => {
    // Awan PIPIH & REDUP (ditulis ulang audit v4): versi lama menumpuk
    // lingkaran krem alpha 0.28-0.5 beradius sampai 44px + alas fillRect
    // lebar — di layar terbaca sebagai noda bokeh raksasa yang menutupi
    // langit & teks announcer. Kini: gumpalan kecil sebaris (r <= 9px,
    // tinggi total <= 12px), alpha <= 0.14, dan setiap awan yang
    // menembus tepi digambar ulang di sisi seberang agar strip mulus
    // pada periode gulir 960.
    const puff = (x, y, w, tone) => {
      ctx.fillStyle = tone;
      const n = 5;
      for (let i = 0; i < n; i++) {
        const cx = x - w / 2 + (i + 0.5) * (w / n);
        const r = 5 + ((i * 7) % 4);
        ctx.beginPath(); ctx.arc(cx, y - r * 0.4, r, 0, 7); ctx.fill();
      }
      ctx.fillRect(x - w / 2, y - 2, w, 3);
    };
    const cloud = (x, y, w, tone) => {
      puff(x, y, w, tone);
      if (x - w / 2 < 0) puff(x + 960, y, w, tone);
      if (x + w / 2 > 960) puff(x - 960, y, w, tone);
    };
    cloud(150, 46, 120, 'rgba(250,224,180,0.14)');
    cloud(430, 74, 150, 'rgba(246,205,160,0.12)');
    cloud(720, 40, 110, 'rgba(250,224,180,0.14)');
    cloud(905, 96, 130, 'rgba(240,190,150,0.10)');
    cloud(60, 104, 90, 'rgba(246,205,160,0.10)');
  });
}
function drawBgFar(groundY) {
  return makeCanvas(960, 270, (ctx) => {
    // pegunungan jauh bertekstur (bahu berbayang + flek batuan)
    ctx.fillStyle = '#4a3a5e';
    ctx.beginPath();
    ctx.moveTo(0, 216);
    const peaks = [70, 130, 95, 165, 120, 180, 105, 150, 85, 140, 115, 160];
    for (let i = 0; i <= 12; i++) ctx.lineTo(i * 80, 216 - peaks[i % peaks.length] * 0.62);
    ctx.lineTo(960, 270); ctx.lineTo(0, 270); ctx.fill();
    ctx.fillStyle = 'rgba(255,190,130,0.13)';
    ctx.beginPath();
    ctx.moveTo(0, 216);
    for (let i = 0; i <= 12; i++) ctx.lineTo(i * 80, 216 - peaks[i % peaks.length] * 0.62);
    for (let i = 12; i >= 0; i--) ctx.lineTo(i * 80 + 26, 216 - peaks[i % peaks.length] * 0.62 + 16);
    ctx.closePath(); ctx.fill();
    let seed = 20240;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    for (let i = 0; i < 260; i++) ctx.fillRect((rnd() * 958) | 0, 120 + ((rnd() * 110) | 0), 2, 1);
    ctx.fillStyle = 'rgba(255,220,180,0.10)';
    for (let i = 0; i < 120; i++) ctx.fillRect((rnd() * 958) | 0, 120 + ((rnd() * 100) | 0), 2, 1);
    // pegunungan dekat
    ctx.fillStyle = '#33283f';
    ctx.beginPath();
    ctx.moveTo(0, groundY + 6);
    const peaks2 = [48, 88, 36, 78, 54, 96, 42, 72, 60, 84, 46, 68];
    for (let i = 0; i <= 12; i++) ctx.lineTo(i * 80, groundY + 6 - peaks2[i % peaks2.length] * 0.55);
    ctx.lineTo(960, 270); ctx.lineTo(0, 270); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let i = 0; i < 200; i++) ctx.fillRect((rnd() * 958) | 0, groundY - 40 + ((rnd() * 60) | 0), 2, 1);
    // siluet hutan jauh di kaki gunung
    ctx.fillStyle = '#2a2136';
    for (let x = 0; x < 960; x += 8) {
      const th = 10 + rnd() * 17;
      ctx.fillRect(x, groundY - th + 8, 7, th);
      ctx.beginPath(); ctx.arc(x + 3, groundY - th + 5, 6 + rnd() * 5, 0, 7); ctx.fill();
    }
  });
}
function drawBgMid(groundY) {
  return makeCanvas(960, 270, (ctx) => {
    // reruntuhan bangunan jauh
    ctx.fillStyle = '#241b2e';
    ctx.fillRect(60, groundY - 76, 56, 76);
    ctx.fillRect(76, groundY - 90, 24, 14);
    ctx.fillRect(640, groundY - 58, 72, 58);
    ctx.fillRect(664, groundY - 70, 28, 12);
    ctx.fillStyle = '#c97b4a';
    ctx.fillRect(74, groundY - 62, 10, 12);
    ctx.fillRect(92, groundY - 44, 10, 12);
    ctx.fillRect(658, groundY - 42, 11, 11);
    ctx.fillRect(686, groundY - 26, 11, 11);
    // 3 tipe pohon, penempatan & ukuran bervariasi (deterministik)
    let seed = 60606;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const palm = (x, h, lean) => {
      ctx.fillStyle = '#1d1526';
      for (let i = 0; i < h; i += 4) ctx.fillRect(x + Math.sin(i * 0.05) * 5 + lean * i * 0.04, groundY - i - 5, 6, 5);
      const tx = x + Math.sin(h * 0.05) * 5 + lean * h * 0.04, ty = groundY - h;
      for (let a = 0; a < 6; a++) {
        ctx.save(); ctx.translate(tx + 3, ty); ctx.rotate(-0.7 + a * 0.3);
        ctx.fillRect(0, -2, 24, 3); ctx.restore();
      }
      ctx.beginPath(); ctx.arc(tx + 3, ty, 7, 0, 7); ctx.fill();
      ctx.fillStyle = '#2a2136'; ctx.beginPath(); ctx.arc(tx - 2, ty + 5, 3, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(tx + 8, ty + 5, 3, 0, 7); ctx.fill();
    };
    const jungle = (x, h) => {
      ctx.fillStyle = '#1d1526';
      ctx.fillRect(x + 6, groundY - h * 0.5, 5, h * 0.5);
      ctx.beginPath(); ctx.arc(x + 8, groundY - h * 0.62, h * 0.3, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(x - 4, groundY - h * 0.5, h * 0.2, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 20, groundY - h * 0.52, h * 0.22, 0, 7); ctx.fill();
      ctx.fillStyle = '#251b31';
      ctx.beginPath(); ctx.arc(x + 4, groundY - h * 0.66, h * 0.16, 0, 7); ctx.fill();
    };
    const pine = (x, h) => {
      ctx.fillStyle = '#1d1526';
      ctx.fillRect(x + 4, groundY - 12, 4, 12);
      for (let i = 0; i < 4; i++) {
        const wdt = 26 - i * 5, yy = groundY - 10 - i * (h - 12) / 4;
        ctx.beginPath(); ctx.moveTo(x + 6 - wdt / 2, yy); ctx.lineTo(x + 6 + wdt / 2, yy); ctx.lineTo(x + 6, yy - (h - 8) / 4); ctx.closePath(); ctx.fill();
      }
    };
    const types = [palm, jungle, pine, jungle, palm, pine, jungle, palm, jungle, pine, palm, jungle];
    for (let i = 0; i < 12; i++) {
      const x = 20 + i * 78 + ((rnd() * 30) | 0);
      const h = 52 + ((rnd() * 34) | 0);
      types[i](x, h, rnd() - 0.5);
    }
    // semak belukar rapat
    ctx.fillStyle = '#20182a';
    for (let i = 0; i < 34; i++) {
      const bx = (rnd() * 950) | 0, bh = 6 + rnd() * 11;
      ctx.beginPath(); ctx.arc(bx, groundY - bh + 8, bh, 0, 7); ctx.fill();
    }
  });
}
// Rumpun foreground tepi bawah (semi-transparan), 2 varian goyangan
function drawFgTuft(variant) {
  return makeCanvas(120, 40, (ctx) => {
    let seed = variant ? 2718 : 1618;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let i = 0; i < 16; i++) {
      const bx = (rnd() * 116) | 0, bh = 10 + (rnd() * 22) | 0;
      ctx.fillStyle = 'rgba(18,30,12,0.85)';
      ctx.fillRect(bx, 40 - bh, 2, bh);
      ctx.fillRect(bx + 3, 40 - bh + 4, 2, bh - 4);
      ctx.fillRect(bx - 3, 40 - bh + 6, 2, bh - 6);
      ctx.beginPath(); ctx.arc(bx + 8, 40 - bh * 0.4, bh * 0.42, 0, 7); ctx.fill();
    }
  });
}

// Ubin tanah bertekstur (96x38): bintik, kerikil, retakan deterministik
function drawGroundTile(base, top, light, seedInit) {
  return makeCanvas(96, 38, (ctx) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, 96, 38);
    ctx.fillStyle = top; ctx.fillRect(0, 0, 96, 6);
    ctx.fillStyle = light; ctx.fillRect(0, 0, 96, 2);
    let seed = seedInit;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let i = 0; i < 34; i++) ctx.fillRect((rnd() * 94) | 0, 8 + ((rnd() * 28) | 0), 2, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    for (let i = 0; i < 16; i++) ctx.fillRect((rnd() * 94) | 0, 8 + ((rnd() * 28) | 0), 2, 1);
    // kerikil
    ctx.fillStyle = 'rgba(255,240,210,0.20)';
    for (let i = 0; i < 7; i++) { const px = (rnd() * 92) | 0, py = 10 + ((rnd() * 24) | 0); ctx.fillRect(px, py, 3, 2); ctx.fillRect(px + 1, py - 1, 1, 1); }
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    for (let i = 0; i < 4; i++) { const px = (rnd() * 92) | 0, py = 12 + ((rnd() * 22) | 0); ctx.fillRect(px, py, 3, 2); }
    // retakan
    ctx.strokeStyle = 'rgba(0,0,0,0.30)'; ctx.lineWidth = 1;
    for (let i = 0; i < 2; i++) {
      let cx0 = (rnd() * 80) | 0, cy0 = 12 + ((rnd() * 18) | 0);
      ctx.beginPath(); ctx.moveTo(cx0, cy0);
      for (let s2 = 0; s2 < 3; s2++) { cx0 += 4 + ((rnd() * 6) | 0); cy0 += ((rnd() * 5) | 0) - 2; ctx.lineTo(cx0, cy0); }
      ctx.stroke();
    }
  });
}
function drawGrassTile() {
  const c = drawGroundTile('#5d4a2c', '#6f9a44', '#8fbc5a', 12345);
  const ctx = c.getContext('2d');
  let seed = 5150;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  // helai rumput di tepi atas, satu per satu
  ctx.fillStyle = '#557f36';
  for (let i = 0; i < 22; i++) { const gx = (rnd() * 94) | 0, gh = 2 + ((rnd() * 4) | 0); ctx.fillRect(gx, 4 - gh, 1, gh + 2); }
  ctx.fillStyle = '#8fbc5a';
  for (let i = 0; i < 10; i++) { const gx = (rnd() * 94) | 0; ctx.fillRect(gx, 1, 1, 3); }
  // bunga kecil liar
  ctx.fillStyle = '#e87e35';
  for (let i = 0; i < 3; i++) ctx.fillRect((rnd() * 92) | 0, 3, 2, 2);
  return c;
}
function drawSandTile() {
  const c = drawGroundTile('#8a6f42', '#c2a165', '#dcc084', 22334);
  const ctx = c.getContext('2d');
  let seed = 777;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  ctx.strokeStyle = 'rgba(120,90,50,0.4)'; ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) { // riak pasir
    const y0 = 12 + i * 6 + ((rnd() * 3) | 0);
    ctx.beginPath(); ctx.moveTo((rnd() * 30) | 0, y0); ctx.lineTo(40 + ((rnd() * 40) | 0), y0); ctx.stroke();
  }
  return c;
}
function drawDirtTile() {
  const c = drawGroundTile('#6e5636', '#9a7d4f', '#b08d58', 9876);
  const ctx = c.getContext('2d');
  let seed = 31337;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  ctx.fillStyle = 'rgba(60,42,22,0.5)';
  for (let i = 0; i < 5; i++) ctx.fillRect((rnd() * 90) | 0, 10 + ((rnd() * 24) | 0), 5, 3); // gumpalan tanah
  return c;
}
// Ubin platform kayu 48x15
function drawWoodTile() {
  return makeCanvas(48, 15, (ctx) => {
    ctx.fillStyle = '#8a5a2e'; ctx.fillRect(0, 0, 48, 15);
    ctx.fillStyle = '#a9713f'; ctx.fillRect(0, 0, 48, 4);
    ctx.fillStyle = '#c08b52'; ctx.fillRect(0, 0, 48, 1);
    ctx.fillStyle = '#6e3d20'; ctx.fillRect(0, 12, 48, 3);
    ctx.fillRect(23, 0, 2, 15); ctx.fillRect(47, 0, 1, 15);
    ctx.fillStyle = '#3a2e22'; ctx.fillRect(4, 6, 2, 2); ctx.fillRect(28, 6, 2, 2); ctx.fillRect(42, 6, 2, 2); // paku
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, 8, 48, 1);
  });
}
// Papan jembatan 96x18 dengan tali & simpul
function drawBridgeTile() {
  return makeCanvas(96, 18, (ctx) => {
    ctx.fillStyle = '#8a5a2e'; ctx.fillRect(0, 0, 96, 15);
    ctx.fillStyle = '#a9713f'; ctx.fillRect(0, 0, 96, 4);
    ctx.fillStyle = '#c08b52'; ctx.fillRect(0, 0, 96, 1);
    ctx.fillStyle = '#6e3d20'; ctx.fillRect(0, 12, 96, 3);
    ctx.fillRect(23, 0, 2, 15); ctx.fillRect(47, 0, 2, 15); ctx.fillRect(71, 0, 2, 15);
    ctx.fillStyle = '#3a2e22'; ctx.fillRect(5, 6, 2, 2); ctx.fillRect(29, 6, 2, 2); ctx.fillRect(53, 6, 2, 2); ctx.fillRect(77, 6, 2, 2);
    ctx.fillStyle = '#d8c491'; ctx.fillRect(0, 15, 96, 3); // tali bawah
    ctx.fillStyle = '#b39b62'; ctx.fillRect(10, 15, 3, 3); ctx.fillRect(46, 15, 3, 3); ctx.fillRect(82, 15, 3, 3);
  });
}
// Ledakan 4 frame berlapis lebih besar (api inti + tepi + asap membumbung)
function drawExplosionFrame(i) {
  const sizes = [24, 39, 51, 60];
  const s = sizes[i];
  return makeCanvas(s, s, (ctx) => {
    const cx = s / 2, cy = s / 2;
    const blob = (r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); };
    blob(s * 0.48, '#8a3b1e');
    blob(s * 0.41, '#d84f35');
    blob(s * 0.31, '#e87e35');
    if (i < 3) blob(s * 0.2, '#f2c230');
    if (i < 2) blob(s * 0.11, '#fdf3c0');
    let seed = 100 + i * 37;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    ctx.fillStyle = '#d84f35';
    for (let j = 0; j < 8 - i * 2; j++) {
      const a = rnd() * Math.PI * 2, d = s * (0.34 + rnd() * 0.15);
      ctx.fillRect(cx + Math.cos(a) * d - 2, cy + Math.sin(a) * d - 2, 5, 5);
    }
    ctx.fillStyle = '#e87e35';
    for (let j = 0; j < 5 - i; j++) {
      const a = rnd() * Math.PI * 2, d = s * (0.2 + rnd() * 0.2);
      ctx.fillRect(cx + Math.cos(a) * d - 1, cy + Math.sin(a) * d - 1, 3, 3);
    }
    // asap membumbung di frame akhir
    if (i >= 2) {
      ctx.fillStyle = 'rgba(90,90,90,0.75)';
      ctx.beginPath(); ctx.arc(cx - s * 0.14, cy - s * 0.4, s * 0.13, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + s * 0.12, cy - s * 0.46, s * 0.1, 0, 7); ctx.fill();
    }
  });
}
// Muzzle flash 2 varian (18x12)
function drawMuzzle(i) {
  return makeCanvas(18, 12, (ctx) => {
    ctx.fillStyle = '#f2c230';
    ctx.fillRect(4, 5, 10, 3);
    ctx.fillRect(9, 2, 4, 9);
    ctx.fillRect(13, 4, 4, 5);
    if (i === 0) { ctx.fillStyle = '#fdf3c0'; ctx.fillRect(8, 4, 6, 5); }
    ctx.fillStyle = '#e87e35';
    ctx.fillRect(15, 5, 3, 3);
    ctx.fillRect(2, 5, 2, 3);
  });
}

/* ---------------------------------------------------------------------
   Komposisi pemain v3: kanvas 44x60, badan di offset x=4 (ruang untuk
   moncong senjata di depan & ekor bandana di belakang).
   KAKI di y=35, TORSO di y=0, ekor bandana di belakang (digambar dulu).
   Komposisi jongkok: kanvas 44x45, TORSO_CROUCH 36x30 di y=0,
   LEGS_CROUCH di y=30.
   --------------------------------------------------------------------- */
function buildSprites(groundY) {
  const S = {};
  const tFront = spr(TORSO_FRONT), tFrontB = spr(TORSO_FRONT_B), tUp = spr(TORSO_UP), tDiag = spr(TORSO_DIAG);
  const tThrow = spr(TORSO_THROW), tMelee = spr(TORSO_MELEE), tCrouch = spr(TORSO_CROUCH), tVictory = spr(TORSO_VICTORY);
  const tails = [spr(TAIL0), spr(TAIL1)];
  const lIdle = spr(LEGS_IDLE), lJump = spr(LEGS_JUMP);
  const lRun = [spr(LEGS_RUN0), spr(LEGS_RUN1), spr(LEGS_RUN2), spr(LEGS_RUN3),
                spr(LEGS_RUN4), spr(LEGS_RUN5), spr(LEGS_RUN6), spr(LEGS_RUN7)];
  const lCrouch = spr(LEGS_CROUCH);
  S.guns = {
    handgun: spr(GUN_PISTOL), hmg: spr(GUN_HMG), rocket: spr(GUN_ROCKET), shotgun: spr(GUN_SHOTGUN),
    flame: spr(GUN_FLAME), laser: spr(GUN_LASER), chaser: spr(GUN_CHASER), knife: spr(KNIFE)
  };
  function comp(torso, legs, gun, tailIdx) {
    return makeCanvas(44, 60, (ctx) => {
      if (tailIdx !== undefined && tailIdx !== null) ctx.drawImage(tails[tailIdx], 0, 2);
      ctx.drawImage(legs, 4, 35);
      ctx.drawImage(torso, 4, 0);
      if (gun) ctx.drawImage(gun, 23, 16);
    });
  }
  function compUp(torso, legs, gun) {
    return makeCanvas(44, 60, (ctx) => {
      ctx.drawImage(tails[0], 0, 2);
      ctx.drawImage(legs, 4, 35);
      ctx.drawImage(torso, 4, 0);
      if (gun) { // senjata vertikal di atas tangan (pivot ~ (31,15))
        ctx.save(); ctx.translate(31, 15); ctx.rotate(-Math.PI / 2);
        ctx.drawImage(gun, 0, -6); ctx.restore();
      }
    });
  }
  function compDiag(torso, legs, gun) {
    return makeCanvas(44, 60, (ctx) => {
      ctx.drawImage(tails[0], 0, 2);
      ctx.drawImage(legs, 4, 35);
      ctx.drawImage(torso, 4, 0);
      if (gun) {
        ctx.save(); ctx.translate(27, 19); ctx.rotate(-Math.PI / 4);
        ctx.drawImage(gun, 0, -5); ctx.restore();
      }
    });
  }
  // Idle / berdiri (2 frame napas) & menembak lurus per senjata
  S.pIdle = comp(tFront, lIdle, null, 0);
  S.pIdleB = comp(tFrontB, lIdle, null, 0);
  S.pIdleGun = {}; S.pIdleGunB = {};
  S.pFireH = {}; S.pFireUp = {}; S.pFireDiag = {};
  for (const w in S.guns) {
    if (w === 'knife') continue;
    S.pIdleGun[w] = comp(tFront, lIdle, S.guns[w], 0);
    S.pIdleGunB[w] = comp(tFrontB, lIdle, S.guns[w], 0);
    S.pFireH[w] = S.pIdleGun[w];
    S.pFireUp[w] = compUp(tUp, lIdle, S.guns[w]);
    S.pFireDiag[w] = compDiag(tDiag, lIdle, S.guns[w]);
  }
  // Lari 8 frame per senjata (ekor bandana bergantian 2 varian)
  S.pRunByWeapon = {};
  for (const w in S.guns) {
    if (w === 'knife') continue;
    S.pRunByWeapon[w] = lRun.map((lg, i) => comp(tFront, lg, S.guns[w], i % 2));
  }
  // Lompat
  S.pJumpByWeapon = {};
  for (const w in S.guns) {
    if (w === 'knife') continue;
    S.pJumpByWeapon[w] = comp(tFront, lJump, S.guns[w], 0);
    S.pJumpByWeapon[w + 'Up'] = compUp(tUp, lJump, S.guns[w]);
    S.pJumpByWeapon[w + 'Diag'] = compDiag(tDiag, lJump, S.guns[w]);
  }
  // Jongkok 44x45
  function compCrouch(gun, up) {
    return makeCanvas(44, 45, (ctx) => {
      ctx.drawImage(lCrouch, 4, 30);
      ctx.drawImage(tCrouch, 4, 0);
      if (gun) {
        if (up) {
          ctx.save(); ctx.translate(28, 14); ctx.rotate(-Math.PI / 2);
          ctx.drawImage(gun, 0, -6); ctx.restore();
        } else ctx.drawImage(gun, 23, 15);
      }
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
  // Lempar, melee, kemenangan
  S.pThrow = comp(tThrow, lIdle, null, 0);
  S.pMelee = makeCanvas(44, 60, (ctx) => {
    ctx.drawImage(tails[0], 0, 2);
    ctx.drawImage(lIdle, 4, 35);
    ctx.drawImage(tMelee, 4, 0);
    ctx.drawImage(S.guns.knife, 32, 14);
  });
  S.pVictory = makeCanvas(44, 60, (ctx) => {
    ctx.drawImage(tails[0], 0, 2);
    ctx.drawImage(lIdle, 4, 35);
    ctx.drawImage(tVictory, 4, 0);
    ctx.save(); ctx.translate(37, 17); ctx.rotate(-Math.PI / 2);
    ctx.drawImage(S.guns.handgun, 0, -5); ctx.restore();
  });
  // Mati: 0 terpental, 1 jatuh (rotasi komposisi berdiri), 2 terkapar
  S.pDie0 = makeCanvas(60, 42, (ctx) => {
    ctx.translate(30, 26); ctx.rotate(-1.15);
    ctx.drawImage(S.pIdle, -22, -52);
  });
  S.pDie1 = makeCanvas(60, 42, (ctx) => {
    ctx.translate(30, 28); ctx.rotate(-1.5);
    ctx.drawImage(S.pIdle, -22, -52);
  });
  S.pDie2 = spr(DIE_FLAT);

  // Avatar & ikon kepala
  S.avatar = drawAvatar();
  S.headIcon = drawHeadIcon();

  // Musuh + siluet putih (hit-flash 1 frame saat terkena)
  S.rebelWalk = [spr(REBEL_WALK0), spr(REBEL_WALK1)];
  S.rebelShoot = spr(REBEL_SHOOT);
  S.greIdle = spr(GRE_IDLE);
  S.greThrow = spr(GRE_THROW);
  S.bazIdle = spr(BAZ_IDLE);
  S.shieldWalk = [spr(SHIELD_WALK0), spr(SHIELD_WALK1)];
  S.shieldBroken = spr(SHIELD_BROKEN);
  S.rebelWalkF = S.rebelWalk.map(whiteSilhouette);
  S.rebelShootF = whiteSilhouette(S.rebelShoot);
  S.greIdleF = whiteSilhouette(S.greIdle);
  S.greThrowF = whiteSilhouette(S.greThrow);
  S.bazIdleF = whiteSilhouette(S.bazIdle);
  S.shieldWalkF = S.shieldWalk.map(whiteSilhouette);
  S.shieldBrokenF = whiteSilhouette(S.shieldBroken);

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
  S.warehouse = drawWarehouse();
  S.tower = drawTower();
  S.flag = drawFlag();
  S.rock = drawRock();
  S.sandbags = drawSandbags();
  S.wire = drawWire();
  S.flowers = drawFlowers();
  S.ruin = drawRuin();

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
  S.bgMid = drawBgMid(groundY);
  S.fgTufts = [drawFgTuft(0), drawFgTuft(1)];
  S.grassTile = drawGrassTile();
  S.sandTile = drawSandTile();
  S.dirtTile = drawDirtTile();
  S.woodTile = drawWoodTile();
  S.bridgeTile = drawBridgeTile();

  return S;
}
