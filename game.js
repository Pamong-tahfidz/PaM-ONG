'use strict';
/* =====================================================================
   PaM-ONG — game.js (v4)
   Run-and-gun Metal Slug — Misi 1 (5 zona): Monster Laut -> SV-001 ->
   Di-Cokka -> ROBOT TITAN. Vanilla Canvas 2D, fixed timestep, pooling.
   v3: dunia 480x270 & level 4600px; fullscreen/landscape = TOMBOL
   MANUAL (tidak ada request/orientasi/pause otomatis); grafik & juice
   dirombak (selongsong, debu kaki, percikan permukaan, hit-flash).
   Aturan proyek (docs/KOREKSI.md) WAJIB: pointer capture di tombol
   sentuh; refcount keyboard + reset saat blur; TANPA alokasi objek di
   jalur panas update/render (pakai coretan modul); kompensasi y saat
   tinggi entitas berubah; reset flag tepi & teks announcer di setiap
   transisi state; penanda per-tembakan = nomor seri, bukan objek pool;
   tanpa konstanta yatim / dead code / kolisi nama fungsi.
   ===================================================================== */

/* ================= CONFIG — semua konstanta tuning di sini ========== */
const CONFIG = {
  VIEW_W: 480, VIEW_H: 270,
  GROUND_Y: 232,
  LEVEL_W: 4600,
  GRAVITY: 1350,
  GRAVITY_UP: 930,               // gravitasi saat naik (lompatan melayang ala MS)
  PLAYER_SPEED: 156,
  PLAYER_JUMP_VEL: -552,
  PLAYER_W: 20, PLAYER_H: 60, PLAYER_H_CROUCH: 45,
  START_LIVES: 3,
  START_GRENADES: 10,
  MAX_GRENADES: 30,
  TIMER_START: 99,
  RESPAWN_INVULN: 2.0,
  MELEE_RANGE: 26,
  POW_BONUS: 5000,
  POW_ITEM_SCORE: 1000,
  BULLET_POOL: 260,
  EBULLET_POOL: 120,
  GRENADE_POOL: 64,
  PARTICLE_POOL: 240,
  FLAME_ZONE_POOL: 24,
  BURN_TICK: 0.25,               // jeda tick damage api membakar
  // --- SV-001 ---
  SLUG_X: 1980,                  // terparkir sebelum jembatan zona 3
  SLUG_W: 60, SLUG_H: 51,
  SLUG_SPEED: 126,
  SLUG_JUMP_VEL: -450,
  SLUG_ARMOR: 3,
  SLUG_CANNON_START: 10,
  SLUG_CANNON_PICKUP: 5,
  VULCAN_RATE: 0.075,
  CANNON_RATE: 0.55,
  // --- Monster Laut (mini-boss sungai zona 1) ---
  SEA_HP: 80,
  SEA_SCORE: 5000,
  SEA_TRIGGER_X: 340,
  // --- Di-Cokka (mini-boss kamp zona 4) ---
  BOSS_HP: 60,
  BOSS_SCORE: 1200,
  COKKA_TRIGGER_X: 3400,
  // --- Robot Titan (bos akhir zona 5) ---
  TITAN_HP: 240,
  TITAN_SCORE: 15000,
  TITAN_TRIGGER_X: 4150,
  TITAN_CORE_MULT: 2,            // damage x2 di core dada
  HITSTOP_BOSS: 0.06             // hit-stop 60ms saat bos meledak
};

const WEAPONS = {
  handgun: { name: 'HANDGUN',          rate: 0.24, speed: 480, dmg: 1, diag: false },
  hmg:     { name: 'HEAVY MACHINE GUN', rate: 0.085, speed: 480, dmg: 1, diag: true, ammo: 200 },
  rocket:  { name: 'ROCKET LAUNCHER',   rate: 0.5,  speed: 278, dmg: 3, diag: false, ammo: 30 },
  shotgun: { name: 'SHOTGUN',           rate: 0.6,  speed: 495, dmg: 1, diag: false, ammo: 30, pellets: 5, pelletLife: 0.23 },
  flame:   { name: 'FLAME SHOT',        rate: 0.34, speed: 225, dmg: 1, diag: false, ammo: 30 },
  laser:   { name: 'LASER GUN',         rate: 0.30, speed: 840, dmg: 2, diag: false, ammo: 200 },
  chaser:  { name: 'ENEMY CHASER',      rate: 0.38, speed: 285, dmg: 2, diag: false, ammo: 40 }
};
const WEAPON_ANNOUNCE = {
  hmg: 'Heavy Machine Gun!', rocket: 'Rocket Launcher!', shotgun: 'Shotgun!',
  flame: 'Flame Shot!', laser: 'Laser Gun!', chaser: 'Enemy Chaser!'
};
const WEAPON_ICON = {
  hmg: 'iconHmg', rocket: 'iconRocket', shotgun: 'iconShotgun',
  flame: 'iconFlame', laser: 'iconLaser', chaser: 'iconChaser'
};
// Rotasi hadiah acak POW (6 senjata spesial)
const POW_WEAPON_TABLE = ['hmg', 'rocket', 'shotgun', 'flame', 'laser', 'chaser'];

/* ================= Pengaturan (localStorage) ========================
   v3: hanya Musik / SFX / Getar. Kunci lama 'fullscreen' dari v2
   diabaikan dengan aman (loop hanya membaca kunci yang dikenal). */
const SETTINGS = { music: true, sfx: true, vibrate: true };
try {
  const raw = localStorage.getItem('pamong-settings');
  if (raw) {
    const saved = JSON.parse(raw);
    for (const k in SETTINGS) if (typeof saved[k] === 'boolean') SETTINGS[k] = saved[k];
  }
} catch (err) { /* localStorage tidak tersedia: pakai bawaan */ }
function saveSettings() {
  try { localStorage.setItem('pamong-settings', JSON.stringify(SETTINGS)); } catch (err) { /* abaikan */ }
}
function vibrate(pattern) {
  if (!SETTINGS.vibrate) return;
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (err) { /* abaikan */ }
}

/* ================= Canvas & konteks ================================= */
const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d');
ctx.imageSmoothingEnabled = false;
const hudCvs = document.getElementById('hud');
const hudCtx = hudCvs.getContext('2d');
hudCtx.imageSmoothingEnabled = false;

const SPR = buildSprites(CONFIG.GROUND_Y);
// Avatar potret di layar judul (canvas DOM, digambar sekali)
(function drawAvatarToTitle() {
  const ac = document.getElementById('avatarCanvas');
  if (ac) { const actx = ac.getContext('2d'); actx.imageSmoothingEnabled = false; actx.drawImage(SPR.avatar, 0, 0); }
})();

/* ================= Data level (5 zona, 4600px) ======================
   Zona 1 pantai & sungai (0..720) — Monster Laut.
   Zona 2 hutan & menara (720..1850) — jalur atas platform.
   Zona 3 jembatan besar (1850..2750) — SV-001 sebelum jembatan.
   Zona 4 kamp musuh (2750..3850) — tenda, gudang, Di-Cokka.
   Zona 5 lapangan reruntuhan (3850..4600) — Robot Titan.            */
const RIVER = { x0: 60, x1: 700, waterY: CONFIG.GROUND_Y };
const RIVER2 = { x0: 2150, x1: 2750, waterY: CONFIG.GROUND_Y };
const BRIDGE = { x: 90, y: 172, w: 640, h: 18, bridge: true };
const BRIDGE2 = { x: 2150, y: 176, w: 600, h: 18, bridge: true };
const PLATFORMS = [
  BRIDGE, BRIDGE2,
  { x: 855,  y: 158, w: 120, h: 15 },   // platform menara 1 (lantai kabin menara = 158)
  { x: 1080, y: 170, w: 110, h: 15 },   // jalur atas zona 2
  { x: 1260, y: 150, w: 110, h: 15 },   // jalur atas + POW
  { x: 1440, y: 170, w: 110, h: 15 },   // jalur atas (bazooka)
  { x: 2520, y: 146, w: 110, h: 15 },   // di atas jembatan zona 3 (bazooka)
  { x: 3375, y: 158, w: 120, h: 15 },   // platform menara 2 (kamp)
  { x: 3950, y: 160, w: 110, h: 15 }    // reruntuhan zona 5 (bazooka)
];
// Permukaan tanah per segmen: {from, kind:'grass'|'sand'|'dirt'}
const GROUND_SEGMENTS = [
  { from: 0, kind: 'sand' }, { from: 720, kind: 'grass' },
  { from: 1900, kind: 'dirt' }, { from: 3850, kind: 'sand' }
];
// Tenda (66x45, hp 4) & gudang (96x60, hp 8, big) bisa dihancurkan.
const TENT_DEFS = [
  { x: 1700, big: true, drop: 'flame' },
  { x: 2850, drop: 'rocket' },
  { x: 3050, drop: null, hidesPow: true },
  { x: 3250, drop: 'shotgun' }
];
// Menara pengawas (dekor kokoh; musuh berdiri di platform di atasnya)
const TOWER_DEFS = [{ x: 880 }, { x: 3400 }];
// Tong bahan bakar — MELEDAK berantai (pasangan berjarak 60 <= jangkauan rantai 63)
const FUEL_DEFS = [{ x: 1500 }, { x: 1560 }, { x: 2950 }, { x: 3010 }, { x: 3550 }];

const ENEMY_DEFS = [
  // Zona 1: di jembatan sungai (bertahan saat Monster Laut)
  { type: 'rebel',   x: 300, y: 172 }, { type: 'rebel', x: 520, y: 172 },
  // Zona 2: hutan & menara & jalur atas
  { type: 'rebel',   x: 760 },
  { type: 'grenade', x: 905, y: 158 },                    // menara 1
  { type: 'shield',  x: 1010 },
  { type: 'rebel',   x: 1120, y: 170 },                   // jalur atas
  { type: 'rebel',   x: 1180 },
  { type: 'bazooka', x: 1470, y: 170 },                   // jalur atas
  { type: 'rebel',   x: 1560 }, { type: 'shield', x: 1700 },
  // Zona 3: penjaga SV-001 & jembatan besar
  { type: 'rebel',   x: 1920 }, { type: 'shield', x: 2050 },
  { type: 'rebel',   x: 2380, y: 176 },                   // di jembatan 2
  { type: 'bazooka', x: 2555, y: 146 },                   // platform di atas jembatan
  // Zona 4: kamp musuh
  { type: 'rebel',   x: 2820 }, { type: 'shield', x: 2920 },
  { type: 'rebel',   x: 3180 }, { type: 'shield', x: 3320 },
  { type: 'grenade', x: 3425, y: 158 },                   // menara 2
  { type: 'rebel',   x: 3600 },
  // Zona 5: reruntuhan
  { type: 'rebel',   x: 3920 }, { type: 'rebel', x: 4020 },
  { type: 'bazooka', x: 3985, y: 160 }
];
const ENEMY_H = { rebel: 39, shield: 39, grenade: 39, bazooka: 39 };
const CRATE_DEFS = [
  { x: 820, drop: 'flame' }, { x: 1380, drop: 'grenade' },
  { x: 1900, drop: 'hmg' }, { x: 2080, drop: 'cannon' },
  { x: 2780, drop: 'chaser' }, { x: 3300, drop: 'firebomb' },
  { x: 3620, drop: 'shotgun' }
];
// 7 POW: jembatan 1, hutan, jalur atas, jembatan 2, balik tenda, kamp, reruntuhan
const POW_DEFS = [
  { x: 380, y: 172 },
  { x: 1150 },
  { x: 1300, y: 150 },
  { x: 2450, y: 176 },
  { x: 3065, hidden: true },
  { x: 3150 },
  { x: 4200 }
];
const DECOR = [
  { kind: 'sign', x: 150 }, { kind: 'flowers', x: 480 }, { kind: 'rock', x: 760 },
  { kind: 'flowers', x: 950 }, { kind: 'wire', x: 1230 }, { kind: 'sandbags', x: 1330 },
  { kind: 'flag', x: 1560 }, { kind: 'flowers', x: 1760 }, { kind: 'rock', x: 1960 },
  { kind: 'sign', x: 2100 }, { kind: 'flag', x: 2760 }, { kind: 'sandbags', x: 2900 },
  { kind: 'wire', x: 3120 }, { kind: 'rock', x: 3200 }, { kind: 'flowers', x: 3480 },
  { kind: 'sign', x: 3660 }, { kind: 'ruin', x: 3900 }, { kind: 'flag', x: 3880 },
  { kind: 'ruin', x: 4120 }, { kind: 'wire', x: 4240 }, { kind: 'rock', x: 4380 },
  { kind: 'flowers', x: 4520 }
];

/* ================= State permainan ================================== */
const G = {
  screen: 'title',        // 'title' | 'play' | 'clear' | 'over'
  paused: false,
  settingsReturn: 'title',// layar asal menu pengaturan: 'title' | 'pause'
  score: 0,
  lives: CONFIG.START_LIVES,
  powSaved: 0,
  timer: CONFIG.TIMER_START,
  timerAcc: 0,
  elapsed: 0,
  camX: 0,
  arenaLock: null,        // {minX, maxX, boss} batas kamera+pemain saat bos aktif
  time: 0,
  shake: 0,
  hitStop: 0,             // sisa hit-stop (detik) — loop membeku sesaat
  announceText: '',
  announceT: 0,
  clearT: -1
};

const player = {
  x: 40, y: CONFIG.GROUND_Y - CONFIG.PLAYER_H, w: CONFIG.PLAYER_W, h: CONFIG.PLAYER_H,
  vx: 0, vy: 0, face: 1, onGround: true, crouch: false,
  aim: 'h',               // 'h' | 'up' | 'diag' | 'down'
  state: 'normal',        // 'normal' | 'dead' | 'slug'
  deadT: 0, invulnT: 0, fireCd: 0, fireShowT: 0, throwT: 0, meleeT: 0,
  animT: 0, weapon: 'handgun', ammo: 0, dustT: 0,
  grenades: CONFIG.START_GRENADES, grenadeType: 'normal', firebombs: 0
};

// SV-001: satu objek persisten per misi
const slug = {
  x: CONFIG.SLUG_X, y: CONFIG.GROUND_Y - CONFIG.SLUG_H, w: CONFIG.SLUG_W, h: CONFIG.SLUG_H,
  vx: 0, vy: 0, face: 1, onGround: true, occupied: false,
  armor: CONFIG.SLUG_ARMOR, cannon: CONFIG.SLUG_CANNON_START,
  turretAng: 0,           // sudut turet radian (0 = kanan, negatif = atas)
  fireCd: 0, cannonCd: 0, trackT: 0, destroyed: false, hitT: 0
};

// Monster Laut (mini-boss sungai). Kotak kepala mengikuti RUMUS GAMBAR:
// y = GROUND_Y + 6 - 63*rise (satu sumber kebenaran, lihat KOREKSI.md).
const sea = {
  state: 'dormant',       // dormant | fighting | dying | dead
  hp: CONFIG.SEA_HP, hitT: 0, phaseT: 0, curSpot: 0, surfT: 0, dieT: 0, laserMark: null,
  head: { x: 0, y: CONFIG.GROUND_Y + 6, w: 66, h: 54, rise: 0 },
  tents: [
    { x: 225, w: 21, h: 78, rise: 0, state: 'down', t: 0, warnX: 0 },
    { x: 495, w: 21, h: 78, rise: 0, state: 'down', t: 1.2, warnX: 0 }
  ]
};
const SEA_SPOTS = [200, 390, 580];

// Di-Cokka (mini-boss kamp)
const cokka = {
  x: 3700, y: CONFIG.GROUND_Y - 66, w: 96, h: 66, hp: CONFIG.BOSS_HP,
  active: false, dead: false, dying: 0, dir: -1, moveT: 0, fireT: 2.2, hitT: 0, recoilT: 0, laserMark: null
};

// Robot Titan (bos akhir). Core dada: pita vertikal y+57..y+75.
const titan = {
  x: 4400, y: CONFIG.GROUND_Y - 150, w: 78, h: 150, hp: CONFIG.TITAN_HP,
  active: false, dead: false, dying: 0, stateT: 0, atkT: 2.0, pattern: 0,
  burstN: 0, burstT: 0, armAng: Math.PI, stepT: 0, vx: 0, hitT: 0, flashCoreT: 0,
  introT: 0, laserMark: null
};

let enemies = [];
let crates = [];
let pows = [];
let pickups = [];
let tents = [];
let fuels = [];

/* ================= Object pools ===================================== */
function makePool(n, factory) {
  const arr = [];
  for (let i = 0; i < n; i++) { const o = factory(); o.active = false; arr.push(o); }
  return arr;
}
function poolGet(arr) {
  for (let i = 0; i < arr.length; i++) if (!arr[i].active) return arr[i];
  return null;
}
const bullets = makePool(CONFIG.BULLET_POOL, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, dmg: 1, kind: 'bullet', life: 0, face: 1, laser: false, burn: 0, id: 0 }));
let bulletSerial = 0;   // nomor seri unik tiap aktivasi peluru pemain — penanda laser per TEMBAKAN (bukan per objek pool)
const ebullets = makePool(CONFIG.EBULLET_POOL, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, water: false, gravity: 0 }));
const erockets = makePool(24, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, blinkT: 0, titan: false }));
const grenades = makePool(CONFIG.GRENADE_POOL, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, hostile: false, shell: false, firebomb: false, fuse: 0 }));
const particles = makePool(CONFIG.PARTICLE_POOL, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 1, color: '#fff', grav: 0, boom: -1, water: false, casing: false }));
const flameZones = makePool(CONFIG.FLAME_ZONE_POOL, () => ({ active: false, x: 0, y: 0, w: 39, t: 0, dur: 1, tickT: 0, hostile: false }));
const groundWaves = makePool(6, () => ({ active: false, x: 0, dir: 1, speed: 180, fromBoss: true }));
// Kotak coretan dipakai ulang — dilarang alokasi objek per frame (KOREKSI.md).
const _box = { x: 0, y: 0, w: 0, h: 0 };
const _pbox = { x: 0, y: 0, w: 0, h: 0 };
const _ent = { x: 0, y: 0, w: 0, h: 0 };
const _muzzle = { x: 0, y: 0 };

function spawnParticles(x, y, count, colors, speed, life, size, grav) {
  for (let i = 0; i < count; i++) {
    const p = poolGet(particles);
    if (!p) return;
    const a = Math.random() * Math.PI * 2;
    const sp = speed * (0.3 + Math.random() * 0.7);
    p.active = true; p.boom = -1; p.water = false; p.casing = false;
    p.x = x; p.y = y;
    p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - speed * 0.25;
    p.maxLife = life * (0.6 + Math.random() * 0.7);
    p.life = p.maxLife;
    p.size = size * (0.6 + Math.random() * 0.8);
    p.color = colors[(Math.random() * colors.length) | 0];
    p.grav = grav;
  }
}
function spawnBoom(x, y, big) {
  // Ledakan sprite berbingkai berlapis (bukan sekadar partikel kotak)
  const p = poolGet(particles);
  if (p) {
    p.active = true; p.boom = 0; p.water = false; p.casing = false;
    p.x = x; p.y = y; p.vx = 0; p.vy = 0;
    p.maxLife = 0.34; p.life = 0.34; p.size = big ? 1.6 : 1; p.grav = 0; p.color = '#fff';
  }
  spawnParticles(x, y, big ? 18 : 9, ['#f2c230', '#d84f35', '#8f9296'], big ? 165 : 105, big ? 0.55 : 0.35, 3, 90);
  spawnParticles(x, y, big ? 8 : 4, ['#5a5a5a', '#3a3a3a'], 40, 1.0, 4, -27); // asap membumbung
}
function explosionFx(x, y, big) { spawnBoom(x, y, big); }
function spawnSplashFx(x, y, count) {
  for (let i = 0; i < count; i++) {
    const p = poolGet(particles);
    if (!p) return;
    p.active = true; p.boom = -1; p.water = true; p.casing = false;
    p.x = x + (Math.random() - 0.5) * 20; p.y = y;
    p.vx = (Math.random() - 0.5) * 60;
    p.vy = -90 - Math.random() * 105;
    p.maxLife = 0.5 + Math.random() * 0.3; p.life = p.maxLife;
    p.size = 1.5 + Math.random() * 2; p.color = '#bfe6f2'; p.grav = 450;
  }
}
function spawnCasing(x, y, dir) {
  // Selongsong peluru beterbangan & memantul di tanah (juice khas MS)
  const p = poolGet(particles);
  if (!p) return;
  p.active = true; p.boom = -1; p.water = false; p.casing = true;
  p.x = x; p.y = y;
  p.vx = -dir * (40 + Math.random() * 45);
  p.vy = -(120 + Math.random() * 70);
  p.maxLife = 0.75; p.life = 0.75;
  p.size = 2; p.color = '#f2c230'; p.grav = 800;
}
function spawnDust(x, y, count) {
  for (let i = 0; i < count; i++) {
    const p = poolGet(particles);
    if (!p) return;
    p.active = true; p.boom = -1; p.water = false; p.casing = false;
    p.x = x + (Math.random() - 0.5) * 14; p.y = y - 1;
    p.vx = (Math.random() - 0.5) * 36;
    p.vy = -12 - Math.random() * 22;
    p.maxLife = 0.32 + Math.random() * 0.2; p.life = p.maxLife;
    p.size = 2 + Math.random() * 2; p.color = '#c9b18a'; p.grav = -14;
  }
}
function spawnSmoke(x, y) {
  const p = poolGet(particles);
  if (!p) return;
  p.active = true; p.boom = -1; p.water = false; p.casing = false;
  p.x = x + (Math.random() - 0.5) * 10; p.y = y;
  p.vx = (Math.random() - 0.5) * 8; p.vy = -26 - Math.random() * 14;
  p.maxLife = 1.1; p.life = 1.1;
  p.size = 3 + Math.random() * 3; p.color = '#2e2e2e'; p.grav = -20;
}
function spawnFlameZone(x, y, dur, hostile) {
  const z = poolGet(flameZones);
  if (!z) return;
  z.active = true; z.x = x; z.y = y; z.t = 0; z.dur = dur; z.tickT = 0; z.hostile = !!hostile;
}

/* ================= Input: keyboard + sentuh ========================= */
const keys = { left: false, right: false, up: false, down: false, fire: false, jump: false, grenade: false };
const touchKeys = { left: false, right: false, up: false, down: false, fire: false, jump: false, grenade: false };
let jumpPressed = false, grenadePressed = false; // edge-trigger per langkah

const KEYMAP = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  KeyZ: 'fire', KeyJ: 'fire', KeyX: 'jump', KeyK: 'jump', KeyC: 'grenade', KeyL: 'grenade'
};
const keyCounts = { left: 0, right: 0, up: 0, down: 0, fire: 0, jump: 0, grenade: 0 };
window.addEventListener('keydown', (e) => {
  const k = KEYMAP[e.code];
  if (k) {
    if (!e.repeat) {
      keyCounts[k]++;
      keys[k] = true;
      if (k === 'jump') jumpPressed = true;
      if (k === 'grenade') grenadePressed = true;
    }
    e.preventDefault();
  }
  if (e.code === 'Enter' || e.code === 'Space') {
    if (G.screen === 'title') startGame();
    else if (G.screen === 'clear' || G.screen === 'over') startGame();
    e.preventDefault();
  }
  if (e.code === 'KeyM') toggleMute();
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (G.screen === 'play') togglePause();
  }
});
window.addEventListener('keyup', (e) => {
  const k = KEYMAP[e.code];
  if (k) {
    keyCounts[k] = Math.max(0, keyCounts[k] - 1);
    keys[k] = keyCounts[k] > 0;
    e.preventDefault();
  }
});
window.addEventListener('blur', () => {
  for (const k in keys) { keys[k] = false; keyCounts[k] = 0; }
  for (const k in touchKeys) touchKeys[k] = false;
  jumpPressed = false;
  grenadePressed = false;
  const ons = document.querySelectorAll('.tbtn.on');
  for (let i = 0; i < ons.length; i++) ons[i].classList.remove('on');
});

// Tombol sentuh multi-pointer DENGAN pointer capture (lihat KOREKSI.md:
// tanpa capture tombol macet "menyala" bila jari bergeser keluar).
function bindTouchButton(id, name) {
  const el = document.getElementById(id);
  if (!el) return;
  const activePtrs = new Set();
  const on = (e) => {
    e.preventDefault();
    document.body.classList.add('has-touch');
    if (e.pointerId !== undefined) {
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* browser lama: abaikan */ }
      if (activePtrs.has(e.pointerId)) return;
      activePtrs.add(e.pointerId);
    }
    el.classList.add('on');
    if (name === 'jump' && !touchKeys.jump) jumpPressed = true;
    if (name === 'grenade' && !touchKeys.grenade) grenadePressed = true;
    touchKeys[name] = true;
  };
  const off = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.pointerId !== undefined) {
      activePtrs.delete(e.pointerId);
      if (activePtrs.size > 0) return;
    }
    el.classList.remove('on');
    touchKeys[name] = false;
  };
  el.addEventListener('pointerdown', on);
  el.addEventListener('pointerup', off);
  el.addEventListener('pointercancel', off);
  el.addEventListener('lostpointercapture', off);
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}
bindTouchButton('btnLeft', 'left');
bindTouchButton('btnRight', 'right');
bindTouchButton('btnUp', 'up');
bindTouchButton('btnDown', 'down');
bindTouchButton('btnA', 'fire');
bindTouchButton('btnB', 'jump');
bindTouchButton('btnC', 'grenade');
window.addEventListener('touchstart', () => document.body.classList.add('has-touch'), { passive: true });

function input(name) { return keys[name] || touchKeys[name]; }

/* ================= Tata letak: panggung pas layar (contain) =========
   Fungsi murni agar bisa diuji: diberi viewport (dan status rotasi CSS),
   kembalikan ukuran panggung terbesar yang menampilkan SELURUH 480x270. */
function computeStageSize(vw, vh, rotated) {
  const aw = rotated ? vh : vw;
  const ah = rotated ? vw : vh;
  const s = Math.min(aw / CONFIG.VIEW_W, ah / CONFIG.VIEW_H);
  return { w: Math.floor(CONFIG.VIEW_W * s), h: Math.floor(CONFIG.VIEW_H * s), scale: s };
}
let cssRotated = false;   // true bila fallback rotasi CSS sedang aktif
function resize() {
  const size = computeStageSize(window.innerWidth, window.innerHeight, cssRotated);
  const stage = document.getElementById('stage');
  stage.style.width = size.w + 'px';
  stage.style.height = size.h + 'px';
}
window.addEventListener('resize', resize);
resize();

/* ================= Tombol layar MANUAL: PENUH & PUTAR ================
   TIDAK ADA fullscreen / kunci orientasi / jeda otomatis di v3.
   Fullscreen hanya berubah dari klik tombol PENUH; landscape hanya
   dari klik tombol PUTAR. startGame() tidak menyentuh keduanya.      */
let rotateMode = 'off';   // 'off' | 'native' | 'css'
function syncFsBtn() {
  document.getElementById('fsBtn').classList.toggle('on', !!document.fullscreenElement);
}
function syncRotBtn() {
  document.getElementById('rotBtn').classList.toggle('on', rotateMode !== 'off');
}
function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      const p = document.exitFullscreen && document.exitFullscreen();
      if (p && p.catch) p.catch(() => { /* abaikan */ });
    } else {
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) {
        const p = req.call(el);
        if (p && p.catch) p.catch(() => { /* ditolak: tetap main non-penuh */ });
      }
    }
  } catch (err) { /* fullscreen tidak tersedia */ }
}
function applyCssRotate() {
  rotateMode = 'css';
  cssRotated = true;
  document.body.classList.add('rot');
  resize();
  syncRotBtn();
}
function stopRotate() {
  try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (err) { /* abaikan */ }
  if (rotateMode === 'css') {
    cssRotated = false;
    document.body.classList.remove('rot');
  }
  rotateMode = 'off';
  resize();
  syncRotBtn();
}
function toggleRotate() {
  if (rotateMode !== 'off') { stopRotate(); return; }
  // Dari gestur klik ini: masuk fullscreen dulu (bila belum), lalu coba
  // kunci orientasi landscape; gagal/tidak didukung -> rotasi CSS.
  let fsP = null;
  try {
    if (!document.fullscreenElement) {
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) fsP = req.call(el);
    }
  } catch (err) { /* abaikan */ }
  const tryLock = () => {
    let attempted = false;
    try {
      if (screen.orientation && screen.orientation.lock) {
        attempted = true;
        const p = screen.orientation.lock('landscape');
        if (p && p.then) {
          p.then(() => { rotateMode = 'native'; syncRotBtn(); }).catch(() => applyCssRotate());
          return;
        }
        rotateMode = 'native'; syncRotBtn(); return;
      }
    } catch (err) { attempted = false; }
    if (!attempted) applyCssRotate();
  };
  if (fsP && fsP.then) fsP.then(tryLock).catch(tryLock);
  else tryLock();
}
document.addEventListener('fullscreenchange', () => {
  syncFsBtn();
  if (!document.fullscreenElement && rotateMode === 'native') {
    // Keluar fullscreen mengakhiri kunci orientasi native.
    rotateMode = 'off';
    syncRotBtn();
  }
  resize();
});

/* ================= util ============================================= */
function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
function announce(text) { G.announceText = text; G.announceT = 1.4; }
function addScore(n) { G.score += n; }

/* ================= Setup level & mulai ================================ */
function buildLevel() {
  enemies = ENEMY_DEFS.map((d) => ({
    type: d.type, x: d.x, y: (d.y !== undefined ? d.y - ENEMY_H[d.type] : CONFIG.GROUND_Y - ENEMY_H[d.type]),
    w: d.type === 'shield' ? 30 : 23, h: ENEMY_H[d.type],
    face: -1, state: 'idle', hp: 1, shieldHp: d.type === 'shield' ? 4 : 0,
    active: false, spawned: false, fireT: 1 + Math.random(), throwT: 1.5 + Math.random(), throwShowT: 0,
    animT: Math.random() * 0.4, deadT: 0, hitT: 0, fleeT: 0, vx: 0, rocketT: 2 + Math.random() * 1.5,
    laserMark: null
  }));
  crates = CRATE_DEFS.map((d) => ({ x: d.x, y: CONFIG.GROUND_Y - 27, w: 27, h: 27, hp: 2, drop: d.drop, broken: false }));
  pows = POW_DEFS.map((d) => ({
    x: d.x, y: d.y !== undefined ? d.y - 30 : CONFIG.GROUND_Y - 30, w: 19, h: 30,
    state: d.hidden ? 'hidden' : 'tied', walkT: 0, vx: 0, animT: 0
  }));
  pickups = [];
  tents = TENT_DEFS.map((d) => ({
    x: d.x, y: CONFIG.GROUND_Y - (d.big ? 60 : 45), w: d.big ? 96 : 66, h: d.big ? 60 : 45,
    hp: d.big ? 8 : 4, drop: d.drop, hidesPow: !!d.hidesPow, big: !!d.big, broken: false
  }));
  fuels = FUEL_DEFS.map((d) => ({ x: d.x, y: CONFIG.GROUND_Y - 18, w: 18, h: 18, hp: 1, broken: false }));
  // Reset SV-001
  slug.x = CONFIG.SLUG_X; slug.y = CONFIG.GROUND_Y - CONFIG.SLUG_H;
  slug.vx = 0; slug.vy = 0; slug.face = 1; slug.onGround = true; slug.occupied = false;
  slug.armor = CONFIG.SLUG_ARMOR; slug.cannon = CONFIG.SLUG_CANNON_START;
  slug.turretAng = 0; slug.fireCd = 0; slug.cannonCd = 0; slug.trackT = 0;
  slug.destroyed = false; slug.hitT = 0;
  // Reset Monster Laut
  sea.state = 'dormant'; sea.hp = CONFIG.SEA_HP; sea.hitT = 0; sea.phaseT = 0;
  sea.curSpot = 0; sea.surfT = 0; sea.dieT = 0; sea.laserMark = null;
  sea.head.x = SEA_SPOTS[0] - 33; sea.head.y = CONFIG.GROUND_Y + 6; sea.head.rise = 0;
  for (const t of sea.tents) { t.rise = 0; t.state = 'down'; t.t = Math.random() * 1.5; }
  // Reset Di-Cokka
  cokka.x = 3700; cokka.y = CONFIG.GROUND_Y - 66; cokka.hp = CONFIG.BOSS_HP;
  cokka.active = false; cokka.dead = false; cokka.dying = 0; cokka.dir = -1;
  cokka.moveT = 0; cokka.fireT = 2.2; cokka.hitT = 0; cokka.recoilT = 0; cokka.laserMark = null;
  // Reset Titan
  titan.x = 4400; titan.y = CONFIG.GROUND_Y - titan.h; titan.hp = CONFIG.TITAN_HP;
  titan.active = false; titan.dead = false; titan.dying = 0; titan.stateT = 0;
  titan.atkT = 2.0; titan.pattern = 0; titan.burstN = 0; titan.burstT = 0;
  titan.armAng = Math.PI; titan.stepT = 0; titan.vx = 0; titan.hitT = 0;
  titan.flashCoreT = 0; titan.introT = 0; titan.laserMark = null;
  G.arenaLock = null;
}

function resetPools() {
  for (const arr of [bullets, ebullets, erockets, grenades, particles, flameZones, groundWaves]) {
    for (const o of arr) o.active = false;
  }
}

function showScreen(id) {
  const ids = ['titleScreen', 'endScreen', 'settingsScreen', 'pauseScreen'];
  for (const s of ids) document.getElementById(s).classList.toggle('hidden', s !== id);
  if (!id) for (const s of ids) document.getElementById(s).classList.add('hidden');
}

function startGame() {
  AUDIO.init();
  AUDIO.setMusicOn(SETTINGS.music);
  AUDIO.setSfxOn(SETTINGS.sfx);
  AUDIO.startMusic();
  jumpPressed = false;      // cegah input tepi dari layar judul bocor ke permainan
  grenadePressed = false;
  G.screen = 'play';
  G.paused = false;
  G.score = 0; G.lives = CONFIG.START_LIVES; G.powSaved = 0;
  G.timer = CONFIG.TIMER_START; G.timerAcc = 0; G.elapsed = 0;
  G.camX = 0; G.shake = 0; G.hitStop = 0; G.announceT = 0; G.announceText = ''; G.clearT = -1;
  resetPools();
  buildLevel();
  Object.assign(player, {
    x: 40, y: CONFIG.GROUND_Y - CONFIG.PLAYER_H, w: CONFIG.PLAYER_W, h: CONFIG.PLAYER_H,
    vx: 0, vy: 0, face: 1, onGround: true, crouch: false, aim: 'h', state: 'normal',
    deadT: 0, invulnT: 0, fireCd: 0, fireShowT: 0, throwT: 0, meleeT: 0, animT: 0, dustT: 0,
    weapon: 'handgun', ammo: 0, grenades: CONFIG.START_GRENADES, grenadeType: 'normal', firebombs: 0
  });
  announce('Mission Start!');
  showScreen(null);
  document.getElementById('pauseBtn').classList.remove('hidden');
  // v3: TANPA fullscreen/rotasi otomatis di sini — itu urusan tombol manual.
}

function endScreen(win) {
  G.screen = win ? 'clear' : 'over';
  G.paused = false;
  AUDIO.stopMusic();
  document.getElementById('pauseBtn').classList.add('hidden');
  const powBonus = G.powSaved * CONFIG.POW_BONUS;
  const total = G.score + powBonus;
  document.getElementById('endTitle').textContent = win ? 'MISI SELESAI!' : 'GAME OVER';
  document.getElementById('endStats').innerHTML =
    'SKOR&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ' + G.score + '<br>' +
    'POW DISELAMATKAN: ' + G.powSaved + ' x ' + CONFIG.POW_BONUS + ' = ' + powBonus + '<br>' +
    'WAKTU&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ' + Math.floor(G.elapsed) + ' detik<br>' +
    '<b>SKOR AKHIR&nbsp;: ' + total + '</b>';
  showScreen('endScreen');
}

function setPaused(on) {
  if (G.screen !== 'play') return;
  G.paused = on;
  if (on) { AUDIO.stopMusic(); showScreen('pauseScreen'); }
  else {
    showScreen(null);
    if (SETTINGS.music || SETTINGS.sfx) { AUDIO.init(); AUDIO.startMusic(); }
    jumpPressed = false;      // transisi state: bersihkan flag tepi (KOREKSI.md)
    grenadePressed = false;
  }
}
function togglePause() { setPaused(!G.paused); }

function openSettings(from) {
  G.settingsReturn = from;
  document.getElementById('optMusic').checked = SETTINGS.music;
  document.getElementById('optSfx').checked = SETTINGS.sfx;
  document.getElementById('optVibrate').checked = SETTINGS.vibrate;
  showScreen('settingsScreen');
}
function closeSettings() {
  if (G.settingsReturn === 'pause' && G.screen === 'play') showScreen('pauseScreen');
  else if (G.screen === 'play' && G.paused) showScreen('pauseScreen');
  else showScreen('titleScreen');
  if (G.screen !== 'play') G.screen = 'title';
}

/* ================= Senjata & item =================================== */
function giveWeapon(kind) {
  player.weapon = kind;
  player.ammo = WEAPONS[kind].ammo;
  announce(WEAPON_ANNOUNCE[kind]);
  AUDIO.sPickup();
}
function addGrenades(n) {
  player.grenades = Math.min(CONFIG.MAX_GRENADES, player.grenades + n);
  AUDIO.sPickup();
}
function addFirebombs(n) {
  player.firebombs = Math.min(CONFIG.MAX_GRENADES, player.firebombs + n);
  if (player.grenadeType === 'normal') player.grenadeType = 'fire';
  AUDIO.sPickup();
}
function applyPickup(kind) {
  if (kind === 'grenade') { addGrenades(5); announce('Granat +5'); }
  else if (kind === 'firebomb') { addFirebombs(3); announce('Fire Bomb!'); }
  else if (kind === 'cannon') { slug.cannon = Math.min(99, slug.cannon + CONFIG.SLUG_CANNON_PICKUP); announce('Cannon +5'); AUDIO.sPickup(); }
  else giveWeapon(kind);
}
function spawnPickup(x, y, kind) {
  pickups.push({ x: x, y: y, w: 18, h: 15, vy: 0, kind: kind, t: 0 });
}

function freePow(pw) {
  if (pw.state !== 'tied') return;
  pw.state = 'free';
  pw.walkT = 1.6;
  pw.y = pw.y + pw.h - 39;   // jaga posisi KAKI: tinggi berubah 30->39 (POW platform tetap di dek)
  pw.h = 39;
  AUDIO.sPowFree();
}
function rewardPow(pw) {
  pw.state = 'done';
  pw.walkT = 0.9;
  G.powSaved++;
  const roll = Math.random();
  if (roll < 0.55) giveWeapon(POW_WEAPON_TABLE[(Math.random() * POW_WEAPON_TABLE.length) | 0]);
  else if (roll < 0.70) addFirebombs(3);
  else if (roll < 0.85) addGrenades(5);
  else addScore(CONFIG.POW_ITEM_SCORE);
  announce('Thank You!');
}

/* ================= Muzzle & tembakan pemain ========================= */
function computeMuzzle() {
  const p = player, m = _muzzle;
  const cx = p.x + p.w / 2;
  if (p.state === 'slug') {
    m.x = slug.x + slug.w / 2 + Math.cos(slug.turretAng) * 33;
    m.y = slug.y + 15 + Math.sin(slug.turretAng) * 33;
    return m;
  }
  if (p.crouch) { m.x = cx + p.face * 20; m.y = p.y + 26; return m; }
  if (p.aim === 'up') { m.x = cx + p.face * 8; m.y = p.y - 3; return m; }
  if (p.aim === 'diag') { m.x = cx + p.face * 20; m.y = p.y + 5; return m; }
  if (p.aim === 'down') { m.x = cx + p.face * 9; m.y = p.y + p.h - 1; return m; }
  m.x = cx + p.face * 20; m.y = p.y + 21; return m;
}

function meleeTarget() {
  _box.x = player.face > 0 ? player.x + player.w : player.x - CONFIG.MELEE_RANGE;
  _box.y = player.y + 3; _box.w = CONFIG.MELEE_RANGE; _box.h = player.h - 6;
  for (const e of enemies) if (e.spawned && e.state !== 'dead' && overlap(_box, e)) return e;
  return null;
}
function damageMeleeTarget() {
  const e = meleeTarget();
  if (e) { damageEnemy(e, 3, player.face); return true; }
  _box.x = player.face > 0 ? player.x + player.w : player.x - CONFIG.MELEE_RANGE;
  _box.y = player.y + 3; _box.w = CONFIG.MELEE_RANGE; _box.h = player.h - 6;
  for (const c of crates) if (!c.broken && overlap(_box, c)) { damageCrate(c, 1); return true; }
  for (const t of tents) if (!t.broken && overlap(_box, t)) { damageDestructible(t, 1); return true; }
  return false;
}

function playerFire() {
  const w = WEAPONS[player.weapon];
  if (player.crouch === false && player.onGround && damageMeleeTarget()) {
    player.fireCd = 0.32;
    player.fireShowT = 0.12;
    player.meleeT = 0.18;
    AUDIO.sMelee();
    spawnParticles(player.x + player.w / 2 + player.face * 18, player.y + 24, 5, ['#e8e4da', '#f2c230'], 105, 0.15, 2, 0);
    return;
  }
  player.fireCd = w.rate;
  player.fireShowT = 0.1;
  const m = computeMuzzle();
  const aim = (player.aim === 'diag' && !w.diag) ? 'h' : player.aim;
  const spawn = (ang) => {
    const b = poolGet(bullets);
    if (!b) return;
    b.active = true; b.id = ++bulletSerial; b.kind = player.weapon; b.dmg = w.dmg; b.face = player.face;
    b.x = m.x - 1; b.y = m.y - 1; b.laser = player.weapon === 'laser'; b.burn = 0;
    b.life = player.weapon === 'shotgun' ? WEAPONS.shotgun.pelletLife : (player.weapon === 'flame' ? 0.55 : 1.6);
    if (aim === 'up') { b.vx = Math.sin(ang) * w.speed; b.vy = -Math.cos(ang) * w.speed; }
    else if (aim === 'diag') { b.vx = Math.cos(-Math.PI / 4 + ang) * w.speed * player.face; b.vy = Math.sin(-Math.PI / 4 + ang) * w.speed; }
    else if (aim === 'down') { b.vx = Math.sin(ang) * w.speed * player.face * 0.4; b.vy = Math.cos(ang) * w.speed; }
    else { b.vx = Math.cos(ang) * w.speed * player.face; b.vy = Math.sin(ang) * w.speed; }
    if (player.weapon === 'flame') { b.vy -= 60; b.vx *= 0.9; }  // semburan parabolik
  };
  if (player.weapon === 'shotgun') {
    for (let i = 0; i < WEAPONS.shotgun.pellets; i++) spawn((i - 2) * 0.14);
    AUDIO.sShotgun();
    G.shake = Math.max(G.shake, 2.2);
    spawnCasing(m.x, m.y, player.face); spawnCasing(m.x, m.y, player.face);
  } else if (player.weapon === 'rocket') { spawn(0); AUDIO.sRocketLaunch(); }
  else if (player.weapon === 'chaser') { spawn(0); AUDIO.sChaser(); spawnCasing(m.x, m.y, player.face); }
  else if (player.weapon === 'flame') { spawn((Math.random() - 0.5) * 0.16); AUDIO.sFlame(); }
  else if (player.weapon === 'laser') { spawn(0); AUDIO.sLaser(); }
  else if (player.weapon === 'hmg') { spawn((Math.random() - 0.5) * 0.04); AUDIO.sHmg(); spawnCasing(m.x, m.y, player.face); }
  else { spawn(0); AUDIO.sShoot(); spawnCasing(m.x, m.y, player.face); }
  spawnParticles(m.x, m.y, 1, ['#f2c230'], 36, 0.06, 2, 0);
  if (player.weapon !== 'handgun') {
    player.ammo--;
    if (player.ammo <= 0) { player.weapon = 'handgun'; player.ammo = 0; }
  }
}

function playerThrowGrenade() {
  let useFire = player.grenadeType === 'fire' && player.firebombs > 0;
  if (!useFire && player.grenades <= 0) { if (player.firebombs > 0) { player.grenadeType = 'fire'; useFire = true; } else return; }
  if (useFire && player.firebombs <= 0) return;
  const g = poolGet(grenades);
  if (!g) return;   // pool dulu, baru stok dikurangi (KOREKSI audit v2)
  if (useFire) player.firebombs--; else player.grenades--;
  if (useFire && player.firebombs <= 0) player.grenadeType = 'normal';
  if (!useFire && player.grenades <= 0 && player.firebombs > 0) player.grenadeType = 'fire';
  player.throwT = 0.25;
  g.active = true; g.hostile = false; g.shell = false; g.firebomb = useFire; g.fuse = 2.5;
  g.x = player.x + player.w / 2; g.y = player.y + 6;
  g.vx = player.face * 143 + player.vx * 0.4;
  g.vy = -248;
  AUDIO.sThrow();
}

/* ================= SV-001: masuk / keluar / tembak =================== */
function enterSlug() {
  if (slug.destroyed || slug.occupied || player.state !== 'normal') return;
  _box.x = player.x - 9; _box.y = player.y; _box.w = player.w + 18; _box.h = player.h;
  if (!overlap(_box, slug)) return;
  slug.occupied = true;
  player.state = 'slug';
  player.x = slug.x + (slug.w - player.w) / 2;
  player.y = slug.y - 18;
  player.vx = 0; player.vy = 0;
  slug.face = player.face;
  announce('OK!');
  AUDIO.sPickup();
}
function exitSlug() {
  if (!slug.occupied) return;
  slug.occupied = false;
  player.state = 'normal';
  player.h = CONFIG.PLAYER_H;
  player.x = clamp(slug.x + slug.w / 2 - player.w / 2 + (slug.face > 0 ? -slug.w / 2 - 6 : slug.w / 2 + 6), 4, CONFIG.LEVEL_W - 30);
  player.y = slug.y - 9;
  player.vy = -210;               // terlontar kecil ke samping-atas
  player.vx = slug.face > 0 ? -90 : 90;
  player.onGround = false;
  player.invulnT = Math.max(player.invulnT, 0.5);
}
function ejectFromSlug() {
  // Armor habis: Slug hancur, pemain terlontar HIDUP + kebal 1 detik.
  slug.occupied = false;
  slug.destroyed = true;
  explosionFx(slug.x + slug.w / 2, slug.y + slug.h / 2, true);
  AUDIO.sExplosion(true);
  G.shake = Math.max(G.shake, 6);
  vibrate(120);
  player.state = 'normal';
  player.h = CONFIG.PLAYER_H;
  player.x = clamp(slug.x + slug.w / 2 - player.w / 2, 4, CONFIG.LEVEL_W - 30);
  player.y = slug.y - 15;
  player.vy = -330;
  player.vx = -slug.face * 105;
  player.onGround = false;
  player.invulnT = 1.0;
}
function damageSlug(dmg) {
  if (!slug.occupied || slug.destroyed) return;
  slug.armor -= dmg;
  slug.hitT = 0.1;
  AUDIO.sShieldClank();
  if (slug.armor <= 0) ejectFromSlug();
}
function slugFireVulcan() {
  slug.fireCd = CONFIG.VULCAN_RATE;
  const m = computeMuzzle();
  const b = poolGet(bullets);
  if (!b) return;
  b.active = true; b.id = ++bulletSerial; b.kind = 'vulcan'; b.dmg = 1; b.face = slug.face; b.laser = false; b.burn = 0;
  b.x = m.x - 1; b.y = m.y - 1; b.life = 1.1;
  const spread = (Math.random() - 0.5) * 0.05;
  b.vx = Math.cos(slug.turretAng + spread) * 510;
  b.vy = Math.sin(slug.turretAng + spread) * 510;
  AUDIO.sVulcan();
  spawnParticles(m.x, m.y, 1, ['#f2c230'], 33, 0.05, 2, 0);
  spawnCasing(slug.x + slug.w / 2, slug.y + 8, slug.face);
}
function slugFireCannon() {
  if (slug.cannon <= 0) { AUDIO.sHit(); return; }
  const g = poolGet(grenades);
  if (!g) return;   // pool penuh: amunisi TIDAK hangus (KOREKSI audit v2)
  slug.cannon--;
  slug.cannonCd = CONFIG.CANNON_RATE;
  const m = computeMuzzle();
  g.active = true; g.hostile = false; g.shell = true; g.firebomb = false; g.fuse = 3;
  g.x = m.x; g.y = m.y;
  g.vx = Math.cos(slug.turretAng) * 390;
  g.vy = Math.sin(slug.turretAng) * 390 - 45;
  AUDIO.sCannon();
  G.shake = Math.max(G.shake, 3);
}

/* ================= Kerusakan & kematian =============================== */
function targetSeaParts(box) {
  // Kembalikan true bila kotak mengenai kepala/tentakel monster laut yang muncul.
  if (sea.state !== 'fighting' && sea.state !== 'dying') return false;
  if (sea.head.rise > 0.4) {
    _ent.x = sea.head.x; _ent.y = sea.head.y; _ent.w = sea.head.w; _ent.h = sea.head.h;
    if (overlap(box, _ent)) return true;
  }
  for (const t of sea.tents) {
    if (t.rise < 0.4) continue;
    _ent.x = t.x; _ent.y = CONFIG.GROUND_Y - t.h * t.rise; _ent.w = t.w; _ent.h = t.h * t.rise;
    if (overlap(box, _ent)) return true;
  }
  return false;
}

function damageEnemy(e, dmg, fromDir) {
  if (e.state === 'dead') return;
  if (e.type === 'shield' && e.shieldHp > 0 && fromDir !== undefined) {
    const hitsShield = (fromDir > 0 && e.face < 0) || (fromDir < 0 && e.face > 0);
    if (hitsShield) {
      e.shieldHp--;
      AUDIO.sShieldClank();
      spawnParticles(e.x + (e.face < 0 ? 0 : e.w), e.y + 15, 4, ['#f2c230', '#e8e4da'], 90, 0.15, 2, 180);
      if (e.shieldHp <= 0) { e.state = 'flee'; e.fleeT = 0; }
      return;
    }
  }
  e.hp -= dmg;
  e.hitT = 0.08;
  AUDIO.sHit();
  if (e.hp <= 0) killEnemy(e);
}
function killEnemy(e) {
  e.state = 'dead';
  e.deadT = 0.38;
  addScore(e.type === 'rebel' ? 100 : 300);
  spawnParticles(e.x + e.w / 2, e.y + 15, 8, ['#d84f35', '#f2c230'], 90, 0.3, 3, 150);
}
function damageCrate(c, dmg) {
  if (c.broken) return;
  c.hp -= dmg;
  AUDIO.sHit();
  if (c.hp <= 0) {
    c.broken = true;
    spawnParticles(c.x + 13, c.y + 13, 10, ['#a9713f', '#6e3d20', '#f2c230'], 105, 0.35, 3, 240);
    AUDIO.sExplosion(false);
    spawnPickup(c.x + 4, c.y, c.drop);
  }
}
function damageDestructible(t, dmg) {   // tenda / gudang
  if (t.broken) return;
  t.hp -= dmg;
  AUDIO.sHit();
  if (t.hp <= 0) {
    t.broken = true;
    spawnParticles(t.x + t.w / 2, t.y + 16, 16, ['#5c6b45', '#47543a', '#f2c230'], 120, 0.4, 3, 210);
    AUDIO.sExplosion(false);
    if (t.drop) spawnPickup(t.x + (t.big ? 39 : 24), t.y + 12, t.drop);
    if (t.hidesPow) {
      for (const pw of pows) if (pw.state === 'hidden') { pw.state = 'tied'; pw.x = t.x + 22; pw.y = CONFIG.GROUND_Y - 30; }
      announce('POW ditemukan!');
    }
  }
}
function damageFuel(f, dmg) {
  if (f.broken) return;
  f.hp -= dmg;
  if (f.hp <= 0) {
    f.broken = true;
    explodeAt(f.x + f.w / 2, f.y + f.h / 2, false, true);
  }
}
function damageCokka(dmg) {
  if (!cokka.active || cokka.dead || cokka.dying > 0) return;
  cokka.hp -= dmg;
  cokka.hitT = 0.07;
  AUDIO.sHit();
  if (cokka.hp <= 0) {
    cokka.dying = 1.6;
    addScore(CONFIG.BOSS_SCORE);
    AUDIO.sExplosion(true);
  }
}
function damageSea(dmg) {
  if (sea.state !== 'fighting') return;
  sea.hp -= dmg;
  sea.hitT = 0.07;
  AUDIO.sHit();
  if (sea.hp <= 0) {
    sea.state = 'dying';
    sea.dieT = 2.2;
    addScore(CONFIG.SEA_SCORE);
    AUDIO.sRoar();
    spawnSplashFx(sea.head.x + 33, CONFIG.GROUND_Y, 26);
    if (G.arenaLock && G.arenaLock.boss === 'sea') G.arenaLock = null;
  }
}
function damageTitan(box, dmg) {
  if (!titan.active || titan.dead || titan.dying > 0) return;
  // Core dada dinilai dari PITA VERTIKAL (KOREKSI audit v2): proyektil
  // setinggi dada yang mengenai badan dihitung mengenai core. Pita
  // mengikuti posisi core VISUAL yang sedang aktif (audit v4): mech
  // aset menggambar core berdenyut di rel (30,40), sprite v3 di rel
  // (34,62). Sebelum audit v4 pita selalu di y+57..75, sehingga pada
  // cabang aset tembakan tepat ke core yang menyala hanya dihitung x1
  // dan tembakan ke pinggang mech (tanpa core visual) justru x2.
  const coreBandY = (SPR.titanAsset && SPR.titanMech) ? titan.y + 36 : titan.y + 57;
  _ent.x = titan.x + 30; _ent.y = coreBandY; _ent.w = 18; _ent.h = 18;
  let mult = 1;
  if (box && box.y < _ent.y + _ent.h && box.y + box.h > _ent.y &&
      box.x < titan.x + titan.w && box.x + box.w > titan.x) { mult = CONFIG.TITAN_CORE_MULT; titan.flashCoreT = 0.1; }
  titan.hp -= dmg * mult;
  titan.hitT = 0.06;
  AUDIO.sHit();
  if (titan.hp <= 0) {
    titan.dying = 2.2;
    addScore(CONFIG.TITAN_SCORE);
    AUDIO.sExplosion(true);
    G.hitStop = CONFIG.HITSTOP_BOSS;
  }
}
function titanEnraged() { return titan.hp <= CONFIG.TITAN_HP * 0.5; }

// Damage pemain: di dalam Slug, peluru musuh merusak ARMOR, bukan pemain.
function hitPlayerByBullet() {
  if (player.state === 'slug') { damageSlug(1); return; }
  if (player.state === 'normal' && player.invulnT <= 0) killPlayer();
}
function explodeAt(x, y, hostile, big) {
  const radius = big ? 45 : 39;
  explosionFx(x, y, big);
  AUDIO.sExplosion(big);
  G.shake = Math.max(G.shake, big ? 4.5 : 3);
  if (big) vibrate(60);
  // Reaksi berantai tong bahan bakar
  for (const f of fuels) {
    if (f.broken) continue;
    const dx = f.x + 9 - x, dy = f.y + 9 - y;
    if (dx * dx + dy * dy <= (radius + 18) * (radius + 18)) damageFuel(f, 1);
  }
  // Tong bisa menghancurkan tenda & peti di dekatnya
  if (!hostile) {
    for (const t of tents) {
      if (t.broken) continue;
      const dx = t.x + t.w / 2 - x, dy = t.y + t.h / 2 - y;
      if (dx * dx + dy * dy <= (radius + 24) * (radius + 24)) damageDestructible(t, 2);
    }
  }
  if (hostile) {
    const pcx = player.state === 'slug' ? slug.x + slug.w / 2 : player.x + player.w / 2;
    const pcy = player.state === 'slug' ? slug.y + slug.h / 2 : player.y + player.h / 2;
    const dx = pcx - x, dy = pcy - y;
    if (dx * dx + dy * dy <= radius * radius) {
      if (player.state === 'slug') damageSlug(1);
      else if (player.state === 'normal' && player.invulnT <= 0) killPlayer();
    }
  } else {
    for (const e of enemies) {
      if (!e.spawned || e.state === 'dead') continue;
      const dx = e.x + e.w / 2 - x, dy = e.y + e.h / 2 - y;
      if (dx * dx + dy * dy <= (radius + 12) * (radius + 12)) damageEnemy(e, 3, dx >= 0 ? 1 : -1);
    }
    for (const c of crates) {
      if (c.broken) continue;
      const dx = c.x + 13 - x, dy = c.y + 13 - y;
      if (dx * dx + dy * dy <= (radius + 12) * (radius + 12)) damageCrate(c, 2);
    }
    if (sea.state === 'fighting') {
      _box.x = x - radius; _box.y = y - radius; _box.w = radius * 2; _box.h = radius * 2;
      if (targetSeaParts(_box)) damageSea(3);
    }
    if (cokka.active && !cokka.dead) {
      const dx = cokka.x + cokka.w / 2 - x, dy = cokka.y + cokka.h / 2 - y;
      if (dx * dx + dy * dy <= (radius + 33) * (radius + 33)) damageCokka(3);
    }
    if (titan.active && !titan.dead) {
      _box.x = x - radius; _box.y = y - radius; _box.w = radius * 2; _box.h = radius * 2;
      if (overlap(_box, titan)) damageTitan(_box, 3);
    }
    // Catatan desain: Slug yang terparkir TIDAK rusak oleh ledakan pemain (adil).
  }
}

function killPlayer() {
  if (player.state !== 'normal' || player.invulnT > 0) return;
  player.state = 'dead';
  player.deadT = 1.15;
  player.vy = -240;
  AUDIO.sPlayerHit();
  vibrate(80);
  spawnParticles(player.x + player.w / 2, player.y + 21, 12, ['#d84f35', '#f2c230'], 120, 0.4, 3, 180);
}
function respawnPlayer() {
  G.lives--;
  if (G.lives <= 0) { endScreen(false); return; }
  player.state = 'normal';
  player.h = CONFIG.PLAYER_H;
  let rx = clamp(player.x, 4, CONFIG.LEVEL_W - 30);
  if (G.arenaLock) rx = clamp(rx, G.arenaLock.minX + 4, G.arenaLock.maxX - player.w - 4);
  player.x = rx;
  player.y = CONFIG.GROUND_Y - player.h;
  player.vy = 0; player.vx = 0;
  player.invulnT = CONFIG.RESPAWN_INVULN;
  player.weapon = 'handgun'; player.ammo = 0;
  player.grenades = Math.max(player.grenades, 3);
  if (player.firebombs <= 0) player.grenadeType = 'normal';
}

/* ================= Update pemain ==================================== */
function physicsBody(b, dt, speed, jumpVel, allowPlatforms) {
  // b: objek dengan x,y,w,h,vx,vy,onGround. Gravitasi melayang ala MS:
  // naik lebih ringan daripada turun.
  const prevBottom = b.y + b.h;
  const g = b.vy < 0 ? CONFIG.GRAVITY_UP : CONFIG.GRAVITY;
  b.vy += g * dt;
  if (b.vy > 645) b.vy = 645;
  b.y += b.vy * dt;
  b.onGround = false;
  if (b.vy >= 0) {
    if (allowPlatforms) {
      for (const pl of PLATFORMS) {
        if (b.x + b.w > pl.x + 3 && b.x < pl.x + pl.w - 3) {
          if (prevBottom <= pl.y + 1 && b.y + b.h >= pl.y) { b.y = pl.y - b.h; b.vy = 0; b.onGround = true; }
        }
      }
    }
    if (b.y + b.h >= CONFIG.GROUND_Y) { b.y = CONFIG.GROUND_Y - b.h; b.vy = 0; b.onGround = true; }
  }
  if (b.y < -90) b.y = -90;
}

function updatePlayer(dt) {
  const p = player;
  if (p.state === 'dead') {
    p.deadT -= dt;
    p.vy += CONFIG.GRAVITY * dt;
    p.y += p.vy * dt;
    if (p.y > CONFIG.GROUND_Y - 15) p.y = CONFIG.GROUND_Y - 15;
    if (p.deadT <= 0) respawnPlayer();
    return;
  }
  if (p.state === 'slug') { updateSlug(dt); return; }
  if (p.invulnT > 0) p.invulnT -= dt;
  if (p.fireCd > 0) p.fireCd -= dt;
  if (p.fireShowT > 0) p.fireShowT -= dt;
  if (p.throwT > 0) p.throwT -= dt;
  if (p.meleeT > 0) p.meleeT -= dt;
  p.animT += dt;

  const L = input('left'), R = input('right'), U = input('up'), D = input('down');
  if (R && !L) p.face = 1; else if (L && !R) p.face = -1;

  // Masuk SV-001: tekan ATAS saat berdekatan dengan Slug terparkir.
  if (U && slug.occupied === false && !slug.destroyed) { enterSlug(); if (p.state === 'slug') return; }

  p.crouch = D && p.onGround;
  const targetH = p.crouch ? CONFIG.PLAYER_H_CROUCH : CONFIG.PLAYER_H;
  if (targetH !== p.h) {
    if (p.onGround) p.y += p.h - targetH;   // kompensasi kaki (KOREKSI.md)
    p.h = targetH;
  }

  // Aim 8-arah
  if (p.crouch) p.aim = U ? 'up' : 'h';
  else if (U && (L || R)) p.aim = 'diag';
  else if (U) p.aim = 'up';
  else if (D && !p.onGround) p.aim = 'down';
  else p.aim = 'h';

  p.vx = 0;
  if (!p.crouch) {
    if (L) p.vx = -CONFIG.PLAYER_SPEED;
    if (R) p.vx = CONFIG.PLAYER_SPEED;
  }
  p.x += p.vx * dt;

  if (jumpPressed && p.onGround && !p.crouch) {
    p.vy = CONFIG.PLAYER_JUMP_VEL;
    p.onGround = false;
    AUDIO.sJump();
  }
  const wasGround = p.onGround, fallV = p.vy;
  physicsBody(p, dt, CONFIG.PLAYER_SPEED, CONFIG.PLAYER_JUMP_VEL, true);
  // Debu mendarat & debu kaki saat berlari (juice)
  if (!wasGround && p.onGround && fallV > 240) spawnDust(p.x + p.w / 2, CONFIG.GROUND_Y <= p.y + p.h + 1 ? p.y + p.h : p.y + p.h, 6);
  if (p.onGround && p.vx !== 0) {
    p.dustT -= dt;
    if (p.dustT <= 0) { p.dustT = 0.13; spawnDust(p.x + p.w / 2 - p.face * 7, p.y + p.h, 1); }
  }

  p.x = clamp(p.x, 4, CONFIG.LEVEL_W - 30);
  if (G.arenaLock) p.x = clamp(p.x, G.arenaLock.minX + 2, G.arenaLock.maxX - p.w - 2);
  if (cokka.active && !cokka.dead) p.x = Math.min(p.x, cokka.x - p.w - 2);
  if (titan.active && !titan.dead) p.x = Math.min(p.x, titan.x - p.w - 2);

  if (input('fire') && p.fireCd <= 0 && p.throwT <= 0 && p.meleeT <= 0) playerFire();
  if (grenadePressed && p.onGround) playerThrowGrenade();

  for (const pw of pows) if (pw.state === 'tied' && overlap(p, pw)) freePow(pw);
  for (let i = pickups.length - 1; i >= 0; i--) {
    if (overlap(p, pickups[i])) { applyPickup(pickups[i].kind); pickups.splice(i, 1); }
  }
}

/* ================= Update SV-001 ==================================== */
function updateSlug(dt) {
  const p = player;
  if (p.invulnT > 0) p.invulnT -= dt;
  if (slug.fireCd > 0) slug.fireCd -= dt;
  if (slug.cannonCd > 0) slug.cannonCd -= dt;
  if (slug.hitT > 0) slug.hitT -= dt;
  p.animT += dt;

  const L = input('left'), R = input('right'), U = input('up'), D = input('down');
  if (R && !L) slug.face = 1; else if (L && !R) slug.face = -1;
  p.face = slug.face;

  // Keluar: BAWAH + B (lompat ditekan saat menahan bawah)
  if (D && jumpPressed) { exitSlug(); return; }

  // Sudut turet 8-arah dari input arah (sudut absolut dunia).
  let ang = slug.face > 0 ? 0 : Math.PI;
  if (U && L) ang = -Math.PI * 0.75;
  else if (U && R) ang = -Math.PI * 0.25;
  else if (U) ang = -Math.PI / 2;
  else if (D && L) ang = Math.PI * 0.75;
  else if (D && R) ang = Math.PI * 0.25;
  else if (D && !slug.onGround) ang = Math.PI / 2;
  else if (L) ang = Math.PI;
  else if (R) ang = 0;
  slug.turretAng = ang;

  slug.vx = 0;
  if (L) slug.vx = -CONFIG.SLUG_SPEED;
  if (R) slug.vx = CONFIG.SLUG_SPEED;
  slug.x += slug.vx * dt;

  if (jumpPressed && slug.onGround) {
    slug.vy = CONFIG.SLUG_JUMP_VEL;
    slug.onGround = false;
    AUDIO.sJump();
  }
  const slugWasGround = slug.onGround, slugFallV = slug.vy;
  physicsBody(slug, dt, CONFIG.SLUG_SPEED, CONFIG.SLUG_JUMP_VEL, true);
  if (!slugWasGround && slug.onGround && slugFallV > 200) spawnDust(slug.x + slug.w / 2, slug.y + slug.h, 7);
  slug.x = clamp(slug.x, 4, CONFIG.LEVEL_W - slug.w - 4);
  if (G.arenaLock) slug.x = clamp(slug.x, G.arenaLock.minX + 2, G.arenaLock.maxX - slug.w - 2);
  if (cokka.active && !cokka.dead) slug.x = Math.min(slug.x, cokka.x - slug.w - 2);
  if (titan.active && !titan.dead) slug.x = Math.min(slug.x, titan.x - slug.w - 2);

  // Suara rantai roda saat bergerak di tanah
  if (slug.vx !== 0 && slug.onGround) {
    slug.trackT -= dt;
    if (slug.trackT <= 0) { slug.trackT = 0.16; AUDIO.sTracks(); }
  }
  // Asap hitam saat armor tinggal 1 (kendaraan rusak)
  if (slug.armor === 1 && Math.random() < dt * 5) spawnSmoke(slug.x + slug.w / 2, slug.y + 4);

  // Pemain menempel di atas Slug
  p.x = slug.x + (slug.w - p.w) / 2;
  p.y = slug.y - 18;
  p.vx = slug.vx; p.vy = slug.vy;

  if (input('fire') && slug.fireCd <= 0) slugFireVulcan();
  if (grenadePressed) slugFireCannon();

  // Pickup tetap bisa diambil saat naik Slug (kotak pemain mengikuti Slug)
  _pbox.x = slug.x; _pbox.y = slug.y - 18; _pbox.w = slug.w; _pbox.h = slug.h + 18;
  for (let i = pickups.length - 1; i >= 0; i--) {
    if (overlap(_pbox, pickups[i])) { applyPickup(pickups[i].kind); pickups.splice(i, 1); }
  }
}

/* ================= Update musuh ===================================== */
function enemyShoot(e, ecx) {
  const b = poolGet(ebullets);
  if (!b) return;
  b.active = true; b.water = false; b.gravity = 0;
  b.x = ecx + e.face * (e.w / 2 + 3);
  b.y = e.y + 13;
  b.vx = e.face * 195;
  b.vy = 0;
  AUDIO.sShoot();
}
function updateEnemies(dt) {
  const pcx = player.state === 'slug' ? slug.x + slug.w / 2 : player.x + player.w / 2;
  for (const e of enemies) {
    if (!e.spawned) {
      if (e.x < G.camX + CONFIG.VIEW_W + 45 && e.x > G.camX - 90) e.spawned = true;
      else continue;
    }
    if (e.hitT > 0) e.hitT -= dt;
    e.animT += dt;
    const ecx = e.x + e.w / 2;
    const dist = Math.abs(pcx - ecx);
    const dirToPlayer = pcx < ecx ? -1 : 1;

    if (e.state === 'dead') { e.deadT -= dt; continue; }
    if (e.state === 'flee') {
      e.fleeT += dt;
      e.x += -e.face * 105 * dt;
      if (e.fleeT > 2.2) e.spawned = false;
      continue;
    }
    if (player.state === 'dead') continue;

    if (e.state === 'idle') {
      if (dist < 225) e.state = 'alert';
      else continue;
    }
    e.face = dirToPlayer;

    if (e.type === 'grenade') {
      e.throwT -= dt;
      if (dist < 345 && e.throwT <= 0) {
        e.throwT = 2.3;
        e.throwShowT = 0.35;
        const g = poolGet(grenades);
        if (g) {
          const tFly = 0.95;
          g.active = true; g.hostile = true; g.shell = false; g.firebomb = false; g.fuse = 3;
          g.x = ecx; g.y = e.y + 3;
          g.vx = (pcx - ecx) / tFly;
          g.vy = -0.5 * CONFIG.GRAVITY * tFly;
          AUDIO.sThrow();
        }
      }
      if (e.throwShowT > 0) e.throwShowT -= dt;
      continue;
    }
    if (e.type === 'bazooka') {
      // Diam di platform: menembakkan roket lambat berkedip (bisa ditembak jatuh)
      e.rocketT -= dt;
      if (dist < 375 && e.rocketT <= 0) {
        e.rocketT = 3.0;
        const r = poolGet(erockets);
        if (r) {
          r.active = true; r.titan = false; r.blinkT = 0;
          r.x = ecx + e.face * 15; r.y = e.y + 7;
          r.vx = e.face * 93; r.vy = 0;
          AUDIO.sRocketLaunch();
        }
      }
      continue;
    }
    // Rebel & Shield
    const stopDist = e.type === 'shield' ? 93 : 78;
    if (dist > stopDist) {
      e.x += dirToPlayer * (e.type === 'shield' ? 39 : 51) * dt;
    } else {
      e.fireT -= dt;
      if (e.fireT <= 0) {
        e.fireT = e.type === 'shield' ? 1.9 : 1.55;
        enemyShoot(e, ecx);
      }
    }
  }
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].state === 'dead' && enemies[i].deadT <= 0) enemies.splice(i, 1);
  }
}

/* ================= Update Monster Laut =============================== */
function seaSpawnWaterBall(tx) {
  const b = poolGet(ebullets);
  if (!b) return;
  const sx = sea.head.x + 33, sy = sea.head.y + 30;
  const tFly = 0.9;
  b.active = true; b.water = true; b.gravity = CONFIG.GRAVITY * 0.55;
  b.x = sx; b.y = sy;
  b.vx = (tx - sx) / tFly;
  b.vy = -0.5 * b.gravity * tFly;
  AUDIO.sWaterShot();
}
function updateSea(dt) {
  if (sea.state === 'dormant') {
    if (player.x > CONFIG.SEA_TRIGGER_X && player.state !== 'dead') {
      sea.state = 'fighting';
      sea.phaseT = 0.5;
      G.arenaLock = { minX: 40, maxX: 760, boss: 'sea' };
      announce('Monster Laut!');
      AUDIO.sRoar();
      spawnSplashFx(sea.head.x + 33, CONFIG.GROUND_Y, 18);
    }
    return;
  }
  if (sea.state === 'dead') return;
  if (sea.hitT > 0) sea.hitT -= dt;
  if (sea.state === 'dying') {
    sea.dieT -= dt;
    sea.head.rise = Math.max(0, sea.head.rise - dt * 0.4);
    sea.head.y = CONFIG.GROUND_Y + 6 - 63 * sea.head.rise;
    for (const t of sea.tents) t.rise = Math.max(0, t.rise - dt * 0.5);
    if (Math.random() < 0.3) spawnSplashFx(sea.head.x + 33, CONFIG.GROUND_Y, 4);
    if (sea.dieT <= 0) { sea.state = 'dead'; announce('Sungai aman!'); }
    return;
  }
  // fighting. Kotak kepala memakai rumus gambar yang sama.
  sea.phaseT -= dt;
  if (sea.phaseT <= 0) {
    sea.phaseT = 3.0;
    sea.curSpot = (sea.curSpot + 1 + ((Math.random() * 2) | 0)) % SEA_SPOTS.length;
    sea.head.x = SEA_SPOTS[sea.curSpot] - 33;
    sea.surfT = 0;
    spawnSplashFx(sea.head.x + 33, CONFIG.GROUND_Y, 9);
    AUDIO.sSplash();
  }
  if (sea.phaseT < 1.2 && sea.phaseT > 0.6 && sea.surfT <= 0 && player.state !== 'dead') {
    sea.surfT = 1;  // satu semburan per kemunculan
    const tx = player.state === 'slug' ? slug.x + slug.w / 2 : player.x + player.w / 2;
    seaSpawnWaterBall(tx);
  }
  const target = sea.phaseT > 0.6 ? 1 : 0;
  sea.head.rise += clamp(target - sea.head.rise, -dt * 1.8, dt * 1.8);
  sea.head.y = CONFIG.GROUND_Y + 6 - 63 * sea.head.rise;
  // Tentakel: siklus down -> warn (bayangan 0.5 dtk) -> rise -> slam -> hold -> down
  const pcx = player.state === 'slug' ? slug.x + slug.w / 2 : player.x + player.w / 2;
  for (const t of sea.tents) {
    t.t -= dt;
    if (t.state === 'down') {
      t.rise = Math.max(0, t.rise - dt * 2);
      if (t.t <= 0) { t.state = 'warn'; t.t = 0.5; t.warnX = clamp(pcx - 10, RIVER.x0 + 9, RIVER.x1 - 30); AUDIO.sSplash(); }
    } else if (t.state === 'warn') {
      if (t.t <= 0) { t.state = 'rise'; t.t = 0.28; t.x = t.warnX; }
    } else if (t.state === 'rise') {
      t.rise = Math.min(1, t.rise + dt / 0.28);
      if (t.t <= 0) {
        t.state = 'slam'; t.t = 0.5;
        spawnSplashFx(t.x + 10, CONFIG.GROUND_Y, 12);
        AUDIO.sSplash();
        G.shake = Math.max(G.shake, 2.2);
        // Hantaman mengenai pemain yang berdiri di tanah dalam jangkauan
        _ent.x = t.x - 3; _ent.y = CONFIG.GROUND_Y - 15; _ent.w = t.w + 6; _ent.h = 18;
        if (player.state === 'normal' && player.onGround && player.invulnT <= 0 && overlap(_ent, player)) killPlayer();
        else if (player.state === 'slug' && slug.onGround && overlap(_ent, slug)) damageSlug(1);
      }
    } else if (t.state === 'slam') {
      if (t.t <= 0) { t.state = 'down'; t.t = 1.6 + Math.random() * 1.6; }
    }
  }
}

/* ================= Update Di-Cokka =================================== */
function updateCokka(dt) {
  if (!cokka.active) {
    if (player.x > CONFIG.COKKA_TRIGGER_X && player.state !== 'dead') {
      cokka.active = true;
      G.arenaLock = { minX: 3350, maxX: 3850, boss: 'cokka' };
      announce('Di-Cokka!');
      AUDIO.sPickup();
    }
    return;
  }
  if (cokka.dead) return;
  if (cokka.hitT > 0) cokka.hitT -= dt;
  if (cokka.recoilT > 0) cokka.recoilT -= dt;
  if (cokka.dying > 0) {
    cokka.dying -= dt;
    if (Math.random() < 0.35) {
      explosionFx(cokka.x + Math.random() * cokka.w, cokka.y + Math.random() * cokka.h, false);
      AUDIO.sExplosion(false);
      G.shake = Math.max(G.shake, 3.5);
    }
    if (cokka.dying <= 0) {
      cokka.dead = true;
      explosionFx(cokka.x + cokka.w / 2, cokka.y + cokka.h / 2, true);
      AUDIO.sExplosion(true);
      G.shake = 7;
      announce('Mini-boss hancur!');
      if (G.arenaLock && G.arenaLock.boss === 'cokka') G.arenaLock = null;
    }
    return;
  }
  // Asap hitam saat rusak berat
  if (cokka.hp <= CONFIG.BOSS_HP * 0.5 && Math.random() < dt * 6) spawnSmoke(cokka.x + cokka.w / 2, cokka.y + 6);
  cokka.moveT -= dt;
  if (cokka.moveT <= 0) { cokka.moveT = 1.6 + Math.random(); cokka.dir = cokka.dir * -1; }
  cokka.x += cokka.dir * 17 * dt;
  cokka.x = clamp(cokka.x, 3560, 3748);
  if (player.state !== 'dead') {
    cokka.fireT -= dt;
    if (cokka.fireT <= 0) {
      cokka.fireT = 2.1;
      cokka.recoilT = 0.18;
      const g = poolGet(grenades);
      if (g) {
        const sx = cokka.x + 3, sy = cokka.y + 24;
        const pcx = player.state === 'slug' ? slug.x + slug.w / 2 : player.x + player.w / 2;
        const tFly = 1.1;
        g.active = true; g.hostile = true; g.shell = true; g.firebomb = false; g.fuse = 3;
        g.x = sx; g.y = sy;
        g.vx = (pcx - sx) / tFly;
        g.vy = -0.5 * CONFIG.GRAVITY * tFly;
        AUDIO.sRocketLaunch();
      }
    }
  }
}

/* ================= Update Robot Titan ================================ */
function titanBurstShot() {
  const b = poolGet(ebullets);
  if (!b) return;
  const mx = titan.x + 3, my = titan.y + 51;
  const pcx = player.state === 'slug' ? slug.x + slug.w / 2 : player.x + player.w / 2;
  const pcy = player.state === 'slug' ? slug.y + 30 : player.y + 24;
  const dx = pcx - mx, dy = pcy - my;
  const d = Math.sqrt(dx * dx + dy * dy) || 1;
  const sp = 248;
  b.active = true; b.water = false; b.gravity = 0;
  b.x = mx; b.y = my; b.vx = dx / d * sp; b.vy = dy / d * sp;
  AUDIO.sShoot();
}
function titanMissile(tx) {
  const r = poolGet(erockets);
  if (!r) return;
  r.active = true; r.titan = true; r.blinkT = 0;
  r.x = titan.x + 12 + Math.random() * 54; r.y = titan.y + 12;
  // Waktu terbang NYATA rudal: vy0 -225, gravitasi 0.8*GRAVITY (=1080),
  // jatuh dari titan.y+12 ke GROUND_Y-3 (=135px) -> t = 0.75s. vx WAJIB
  // menempuh (tx - r.x) dalam 0.75s itu; rumus lama (/1.25 *0.5) membuat
  // rudal selalu mendarat ~30% jalan — salvo tak pernah mencapai pemain
  // (audit v3: min |dx| 79px dari pemain diam, radius ledakan hanya 45).
  const tFly = 0.75;
  r.vx = (tx - r.x) / tFly;
  r.vy = -225;
  AUDIO.sRocketLaunch();
}
function updateTitan(dt) {
  if (!titan.active) {
    if (player.x > CONFIG.TITAN_TRIGGER_X && player.state !== 'dead') {
      titan.active = true;
      titan.introT = 1.2;
      G.arenaLock = { minX: 4080, maxX: 4580, boss: 'titan' };
      announce('ROBOT TITAN!');
      AUDIO.sRoar();
      vibrate(100);
    }
    return;
  }
  if (titan.dead) return;
  if (titan.hitT > 0) titan.hitT -= dt;
  if (titan.flashCoreT > 0) titan.flashCoreT -= dt;
  if (titan.introT > 0) { titan.introT -= dt; return; }
  if (titan.dying > 0) {
    titan.dying -= dt;
    if (Math.random() < 0.4) {
      explosionFx(titan.x + Math.random() * titan.w, titan.y + Math.random() * titan.h, Math.random() < 0.4);
      AUDIO.sExplosion(false);
      G.shake = Math.max(G.shake, 4);
    }
    if (titan.dying <= 0) {
      titan.dead = true;
      explosionFx(titan.x + titan.w / 2, titan.y + 75, true);
      explosionFx(titan.x + titan.w / 2, titan.y + 30, true);
      AUDIO.sExplosion(true);
      G.shake = 9;
      G.hitStop = CONFIG.HITSTOP_BOSS;
      vibrate(150);
      announce('Mission Complete!');
      if (G.arenaLock && G.arenaLock.boss === 'titan') G.arenaLock = null;
      G.clearT = 2.6;
    }
    return;
  }
  // Asap hitam saat rusak berat / enrage
  if (titan.hp <= CONFIG.TITAN_HP * 0.5 && Math.random() < dt * 8) spawnSmoke(titan.x + titan.w / 2, titan.y + 10);
  // Berjalan pelan mendekati / menjaga jarak dari pemain
  const pcx = player.state === 'slug' ? slug.x + slug.w / 2 : player.x + player.w / 2;
  const dist = (titan.x + titan.w / 2) - pcx;
  titan.vx = 0;
  if (dist > 180) titan.vx = -20;
  else if (dist < 105) titan.vx = 14;
  titan.x += titan.vx * dt;
  titan.x = clamp(titan.x, 4250, 4496);
  // Langkah berat menimbulkan suara & getar kecil berkala
  titan.stepT -= dt;
  if (titan.vx !== 0 && titan.stepT <= 0) { titan.stepT = 0.55; AUDIO.sStomp(); G.shake = Math.max(G.shake, 1); }

  // Arah lengan meriam ke pemain (untuk digambar)
  const mx = titan.x + 3, my = titan.y + 51;
  titan.armAng = Math.atan2((player.y + 24) - my, pcx - mx);

  // Mesin pola serangan (enrage: tempo 0.62x)
  const tempo = titanEnraged() ? 0.62 : 1;
  if (titan.burstN > 0) {
    titan.burstT -= dt;
    if (titan.burstT <= 0) { titan.burstT = 0.22 * tempo; titan.burstN--; titanBurstShot(); }
  } else {
    titan.atkT -= dt;
    if (titan.atkT <= 0 && player.state !== 'dead') {
      titan.pattern = (titan.pattern + 1) % 3;
      if (titan.pattern === 0) { titan.burstN = 3; titan.burstT = 0; titan.atkT = 2.2; }
      else if (titan.pattern === 1) {
        // Hentakan kaki: gelombang tanah ke arah pemain
        AUDIO.sStomp();
        G.shake = Math.max(G.shake, 4);
        vibrate(60);
        const wv = poolGet(groundWaves);
        if (wv) { wv.active = true; wv.fromBoss = true; wv.dir = pcx < titan.x ? -1 : 1; wv.x = wv.dir < 0 ? titan.x - 9 : titan.x + titan.w + 9; wv.speed = 180; }
        titan.atkT = 2.4;
      } else {
        // Salvo rudal bahu ke posisi pemain
        const n = titanEnraged() ? 4 : 3;
        for (let i = 0; i < n; i++) titanMissile(pcx + (i - (n - 1) / 2) * 39);
        titan.atkT = 2.6;
      }
      titan.atkT *= tempo;
    }
  }
}

/* ================= Update proyektil & zona =========================== */
function bulletHitWorld(b) {
  // Kembalikan true bila peluru pemain mengenai sesuatu yang padat.
  // Urutan uji tetap; semua kotak memakai coretan modul.
  for (const e of enemies) {
    if (!e.spawned || e.state === 'dead') continue;
    if (overlap(_box, e)) {
      if (b.kind === 'rocket' || b.kind === 'chaser') explodeAt(b.x, b.y, false, false);
      else damageEnemy(e, b.dmg, b.vx > 0 ? 1 : -1);
      return true;
    }
  }
  if (targetSeaParts(_box)) {
    if (b.kind === 'rocket' || b.kind === 'chaser') explodeAt(b.x, b.y, false, false);
    else damageSea(b.dmg);
    return true;
  }
  if (cokka.active && !cokka.dead && overlap(_box, cokka)) {
    if (b.kind === 'rocket' || b.kind === 'chaser') explodeAt(b.x, b.y, false, false);
    else damageCokka(b.dmg);
    return true;
  }
  if (titan.active && !titan.dead && overlap(_box, titan)) {
    if (b.kind === 'rocket' || b.kind === 'chaser') explodeAt(b.x, b.y, false, false);
    else damageTitan(_box, b.dmg);
    return true;
  }
  for (const c of crates) {
    if (c.broken) continue;
    if (overlap(_box, c)) {
      if (b.kind === 'rocket' || b.kind === 'chaser') explodeAt(b.x, b.y, false, false);
      else damageCrate(c, b.dmg);
      return true;
    }
  }
  for (const t of tents) {
    if (t.broken) continue;
    if (overlap(_box, t)) {
      if (b.kind === 'rocket' || b.kind === 'chaser') explodeAt(b.x, b.y, false, false);
      else damageDestructible(t, b.dmg);
      return true;
    }
  }
  for (const f of fuels) {
    if (f.broken) continue;
    if (overlap(_box, f)) { damageFuel(f, 1); return true; }
  }
  // Roket bazooka & rudal Titan bisa ditembak jatuh (kotak longgar di sekitar badan roket)
  for (const r of erockets) {
    if (!r.active) continue;
    _ent.x = r.x - 6; _ent.y = r.y - 6; _ent.w = 13; _ent.h = 12;
    if (overlap(_box, _ent)) {
      r.active = false;
      addScore(100);
      spawnBoom(r.x, r.y, false);
      AUDIO.sExplosion(false);
      return true;
    }
  }
  for (const pw of pows) {
    if (pw.state === 'tied' && overlap(_box, pw)) { freePow(pw); return true; }
  }
  // Bola air monster laut bisa ditembak jatuh
  for (const eb of ebullets) {
    if (!eb.active || !eb.water) continue;
    _ent.x = eb.x - 3; _ent.y = eb.y - 3; _ent.w = 7; _ent.h = 7;
    if (overlap(_box, _ent)) { eb.active = false; spawnSplashFx(eb.x, eb.y, 5); return true; }
  }
  if (!slug.destroyed && !slug.occupied && overlap(_box, slug)) return true; // peluru pemain berhenti di Slug parkir
  return false;
}
function inRiverX(x) {
  return (x >= RIVER.x0 && x <= RIVER.x1) || (x >= RIVER2.x0 && x <= RIVER2.x1);
}

function updateProjectiles(dt) {
  // --- Peluru pemain ---
  for (const b of bullets) {
    if (!b.active) continue;
    b.life -= dt;
    if (b.life <= 0) { b.active = false; continue; }
    // Homing: roket = ringan; chaser = kuat dengan belokan tajam
    if (b.kind === 'rocket' || b.kind === 'chaser') {
      const turnRate = b.kind === 'chaser' ? 10.5 : 5.5;
      let bestDx = 0, bestDy = 0, bestD = b.kind === 'chaser' ? 390 : 285, hasBest = false;
      for (const e of enemies) {
        if (!e.spawned || e.state === 'dead') continue;
        const dx = e.x + e.w / 2 - b.x, dy = e.y + e.h / 2 - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < bestD) { bestD = d; bestDx = dx; bestDy = dy; hasBest = true; }
      }
      if (sea.state === 'fighting' && sea.head.rise > 0.4) {
        const dx = sea.head.x + 33 - b.x, dy = sea.head.y + 27 - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < bestD) { bestD = d; bestDx = dx; bestDy = dy; hasBest = true; }
      }
      if (cokka.active && !cokka.dead) {
        const dx = cokka.x + cokka.w / 2 - b.x, dy = cokka.y + cokka.h / 2 - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < bestD) { bestD = d; bestDx = dx; bestDy = dy; hasBest = true; }
      }
      if (titan.active && !titan.dead) {
        const dx = titan.x + titan.w / 2 - b.x, dy = titan.y + 66 - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < bestD) { bestD = d; bestDx = dx; bestDy = dy; hasBest = true; }
      }
      if (hasBest) {
        const cur = Math.atan2(b.vy, b.vx);
        const want = Math.atan2(bestDy, bestDx);
        let diff = want - cur;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const turn = clamp(diff, -turnRate * dt, turnRate * dt);
        const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        const na = cur + turn;
        b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp;
      }
      if (Math.random() < 0.6) spawnParticles(b.x, b.y, 1, ['#e8e4da', '#8f9296'], 12, 0.25, 2, 0);
    }
    if (b.kind === 'flame') {
      b.vy += CONFIG.GRAVITY * 0.5 * dt;  // jatuh parabolik
      if (Math.random() < 0.7) spawnParticles(b.x, b.y, 1, ['#e87e35', '#f2c230', '#d84f35'], 21, 0.22, 3, -45);
    }
    const prevX = b.x, prevY = b.y;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    // Laser menembus: tidak berhenti di target pertama; damage sekali per target per peluru (nomor seri).
    // Kotak laser menutupi SEGMEN yang ditempuh langkah ini: pada fallback
    // 30fps sinar bergerak 28px/langkah — kotak titik 5px bisa melompati
    // musuh selebar 23px tepat pada satu fase lattice (audit v3).
    if (b.laser) {
      _box.x = Math.min(prevX, b.x); _box.y = Math.min(prevY, b.y);
      _box.w = Math.abs(b.x - prevX) + 5; _box.h = Math.abs(b.y - prevY) + 4;
    } else {
      _box.x = b.x; _box.y = b.y; _box.w = 5; _box.h = 4;
    }
    let consumed = false;
    if (b.laser) {
      for (const e of enemies) {
        if (!e.spawned || e.state === 'dead') continue;
        if (overlap(_box, e) && e.laserMark !== b.id) { damageEnemy(e, b.dmg, b.vx > 0 ? 1 : -1); e.laserMark = b.id; }
      }
      if (targetSeaParts(_box) && sea.laserMark !== b.id) { damageSea(b.dmg); sea.laserMark = b.id; }
      if (cokka.active && !cokka.dead && overlap(_box, cokka) && cokka.laserMark !== b.id) { damageCokka(b.dmg); cokka.laserMark = b.id; }
      if (titan.active && !titan.dead && overlap(_box, titan) && titan.laserMark !== b.id) { damageTitan(_box, b.dmg); titan.laserMark = b.id; }
    } else {
      consumed = bulletHitWorld(b);
    }
    if (!consumed && b.kind === 'flame' && b.y >= CONFIG.GROUND_Y - 3) {
      spawnFlameZone(b.x, CONFIG.GROUND_Y, 1.0, false);   // api membakar tanah 1 detik
      consumed = true;
    }
    if (!consumed && (b.y >= CONFIG.GROUND_Y - 1 || b.x < 0 || b.x > CONFIG.LEVEL_W || b.y < -60)) {
      if (b.kind === 'rocket' || b.kind === 'chaser') explodeAt(b.x, Math.min(b.y, CONFIG.GROUND_Y - 3), false, false);
      else if (b.kind !== 'flame') {
        // Percikan sesuai permukaan: air di sungai, tanah di darat
        if (b.y >= CONFIG.GROUND_Y - 2 && inRiverX(b.x)) spawnSplashFx(b.x, CONFIG.GROUND_Y, 4);
        else spawnParticles(b.x, Math.min(b.y, CONFIG.GROUND_Y - 1), 3, ['#f2c230', '#9a7d4f'], 45, 0.14, 2, 90);
      }
      consumed = true;
    }
    if (consumed) b.active = false;
  }

  // --- Peluru musuh & bola air (kotak target dihitung sekali per langkah) ---
  playerTargetBox();
  for (const b of ebullets) {
    if (!b.active) continue;
    b.vy += (b.gravity || 0) * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < G.camX - 60 || b.x > G.camX + CONFIG.VIEW_W + 60 || b.y > CONFIG.GROUND_Y + 6) { b.active = false; continue; }
    _box.x = b.x - 2; _box.y = b.y - 2; _box.w = 4; _box.h = 4;
    if (overlap(_box, _pbox)) { b.active = false; hitPlayerByBullet(); }
  }

  // --- Roket bazooka & rudal Titan (musuh) ---
  for (const r of erockets) {
    if (!r.active) continue;
    r.blinkT += dt;
    if (r.titan) {
      r.vy += CONFIG.GRAVITY * 0.8 * dt;
      if (Math.random() < 0.5) spawnParticles(r.x, r.y - 6, 1, ['#8f9296'], 9, 0.3, 2, -15);
    }
    r.x += r.vx * dt;
    r.y += r.vy * dt;
    let boom = false;
    if (r.y >= CONFIG.GROUND_Y - 3) { r.y = CONFIG.GROUND_Y - 3; boom = true; }
    if (r.x < G.camX - 90 || r.x > G.camX + CONFIG.VIEW_W + 90 || r.y < -120) r.active = false;
    if (r.active && !boom) {
      _box.x = r.x - 5; _box.y = r.y - 3; _box.w = 10; _box.h = 7;
      playerTargetBox();
      if (overlap(_box, _pbox)) boom = true;
    }
    if (boom) { r.active = false; explodeAt(r.x, r.y, true, r.titan); }
  }

  // --- Gelombang tanah Titan (wajib dilompati) ---
  for (const wv of groundWaves) {
    if (!wv.active) continue;
    wv.x += wv.dir * wv.speed * dt;
    if (wv.x < G.camX - 45 || wv.x > G.camX + CONFIG.VIEW_W + 45) { wv.active = false; continue; }
    if (Math.random() < 0.8) spawnParticles(wv.x, CONFIG.GROUND_Y - 3, 1, ['#9a7d4f', '#6e5636'], 36, 0.3, 3, -60);
    _box.x = wv.x - 8; _box.y = CONFIG.GROUND_Y - 17; _box.w = 16; _box.h = 17;
    if (player.state === 'normal' && player.onGround && player.invulnT <= 0 && overlap(_box, player)) killPlayer();
    else if (player.state === 'slug' && slug.onGround && overlap(_box, slug)) damageSlug(1);
  }

  // --- Granat & peluru meriam ---
  for (const g of grenades) {
    if (!g.active) continue;
    g.fuse -= dt;
    g.vy += CONFIG.GRAVITY * dt;
    g.x += g.vx * dt;
    g.y += g.vy * dt;
    let boom = false;
    if (g.y >= CONFIG.GROUND_Y - 3) { g.y = CONFIG.GROUND_Y - 3; boom = true; }
    for (const pl of PLATFORMS) {
      if (g.vy > 0 && g.x > pl.x && g.x < pl.x + pl.w && g.y >= pl.y - 3 && g.y <= pl.y + 9) boom = true;
    }
    if (g.fuse <= 0) boom = true;
    if (!g.hostile) {
      _box.x = g.x - 3; _box.y = g.y - 3; _box.w = 6; _box.h = 6;
      if ((cokka.active && !cokka.dead && overlap(_box, cokka)) ||
          (titan.active && !titan.dead && overlap(_box, titan)) ||
          targetSeaParts(_box)) boom = true;
    }
    if (boom) {
      g.active = false;
      if (g.firebomb) { spawnFlameZone(g.x, CONFIG.GROUND_Y, 1.5, g.hostile); explosionFx(g.x, g.y, false); AUDIO.sExplosion(false); }
      else explodeAt(g.x, g.y, g.hostile, g.shell);
    }
  }

  // --- Zona api membakar (damage per tick) ---
  for (const z of flameZones) {
    if (!z.active) continue;
    z.t += dt;
    z.tickT -= dt;
    if (Math.random() < 0.75) spawnParticles(z.x + (Math.random() - 0.5) * z.w, z.y - 3, 1, ['#e87e35', '#f2c230', '#d84f35'], 18, 0.35, 3, -69);
    if (z.tickT <= 0) {
      z.tickT = CONFIG.BURN_TICK;
      _box.x = z.x - z.w / 2; _box.y = z.y - 18; _box.w = z.w; _box.h = 20;
      if (!z.hostile) {
        for (const e of enemies) if (e.spawned && e.state !== 'dead' && overlap(_box, e)) damageEnemy(e, 1, 0);
        if (sea.state === 'fighting' && targetSeaParts(_box)) damageSea(1);
        if (cokka.active && !cokka.dead && overlap(_box, cokka)) damageCokka(1);
        if (titan.active && !titan.dead && overlap(_box, titan)) damageTitan(_box, 1);
        for (const f of fuels) if (!f.broken && overlap(_box, f)) damageFuel(f, 1);
        for (const t of tents) if (!t.broken && overlap(_box, t)) damageDestructible(t, 1);
      }
    }
    if (z.t >= z.dur) z.active = false;
  }

  // --- POW ---
  for (const pw of pows) {
    pw.animT += dt;
    if (pw.state === 'free') {
      if (pw.walkT > 0) { pw.walkT -= dt; pw.x += 20 * dt; }
      else if (player.state === 'normal' && overlap(player, pw)) rewardPow(pw);
    } else if (pw.state === 'done') {
      pw.walkT -= dt;
    }
  }

  // --- Pickup ---
  for (let i = pickups.length - 1; i >= 0; i--) {
    const pk = pickups[i];
    pk.t += dt;
    if (pk.y + pk.h < CONFIG.GROUND_Y) { pk.vy += CONFIG.GRAVITY * dt; pk.y += pk.vy * dt; if (pk.y + pk.h > CONFIG.GROUND_Y) pk.y = CONFIG.GROUND_Y - pk.h; }
    if (pk.t > 9) pickups.splice(i, 1);
  }

  // --- Partikel (selongsong memantul sekali-dua kali di tanah) ---
  for (const p of particles) {
    if (!p.active) continue;
    p.life -= dt;
    if (p.life <= 0) { p.active = false; continue; }
    if (p.boom >= 0) { p.boom = Math.min(3, ((1 - p.life / p.maxLife) * 4) | 0); continue; }
    p.vy += p.grav * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.casing && p.vy > 0 && p.y >= CONFIG.GROUND_Y - 2) {
      p.y = CONFIG.GROUND_Y - 2;
      p.vy *= -0.42;
      p.vx *= 0.7;
      if (Math.abs(p.vy) < 26) p.vy = 0;
    }
    if (p.water && p.y > CONFIG.GROUND_Y + 3) p.active = false;
  }
}
function playerTargetBox() {
  if (player.state === 'slug') { _pbox.x = slug.x + 2; _pbox.y = slug.y - 15; _pbox.w = slug.w - 4; _pbox.h = slug.h + 15; }
  else { _pbox.x = player.x + 2; _pbox.y = player.y + 3; _pbox.w = player.w - 4; _pbox.h = player.h - 3; }
}

/* ================= Update utama ===================================== */
function update(dt) {
  G.time += dt;
  if (G.announceT > 0) G.announceT -= dt;
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 13);
  if (G.screen !== 'play' || G.paused) return;

  G.elapsed += dt;
  G.timerAcc += dt;
  while (G.timerAcc >= 1) {
    G.timerAcc -= 1;
    G.timer--;
    if (G.timer <= 0) { G.timer = 0; if (player.state === 'normal') { killPlayer(); G.timer = 30; } else if (player.state === 'slug') { G.timer = 30; } }
  }

  updatePlayer(dt);
  updateEnemies(dt);
  updateSea(dt);
  updateCokka(dt);
  updateTitan(dt);
  updateProjectiles(dt);

  // Kamera: look-ahead mengikuti arah hadap + kunci arena bos.
  // Saat arena terkunci, target kamera DIKLAMP ke rentang arena (bukan
  // dipaku di tepi kiri): pemain & bos harus selalu terlihat — memaku di
  // minX membuat 255px arena Monster Laut (termasuk titik muncul 580 dan
  // pemain sendiri di maxX) berada di luar layar (audit v3).
  const focusX = player.state === 'slug' ? slug.x + slug.w / 2 : player.x + player.w / 2;
  const lookAhead = (player.state === 'slug' ? slug.face : player.face) * 39;
  let target = clamp(focusX + lookAhead - 225, 0, CONFIG.LEVEL_W - CONFIG.VIEW_W);
  if (G.arenaLock) {
    const camLo = clamp(G.arenaLock.minX - 15, 0, CONFIG.LEVEL_W - CONFIG.VIEW_W);
    const camHi = clamp(G.arenaLock.maxX - CONFIG.VIEW_W + 15, 0, CONFIG.LEVEL_W - CONFIG.VIEW_W);
    target = clamp(target, camLo, camHi);
  }
  G.camX += (target - G.camX) * Math.min(1, dt * 7);
  if (Math.abs(target - G.camX) < 0.4) G.camX = target;

  if (G.clearT > 0) {
    G.clearT -= dt;
    if (G.clearT <= 0) { G.clearT = -1; endScreen(true); }
  }

  jumpPressed = false;
  grenadePressed = false;
}

/* ================= Render =========================================== */
function drawSprite(img, x, y, flip) {
  if (flip) {
    ctx.save();
    ctx.translate(Math.round(x) + img.width, Math.round(y));
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  } else {
    ctx.drawImage(img, Math.round(x), Math.round(y));
  }
}
function drawEntitySprite(img, e, flip) {
  const dx = e.x + e.w / 2 - img.width / 2;
  const dy = e.y + e.h - img.height;
  drawSprite(img, dx, dy, flip);
}
function groundTileFor(x) {
  let kind = 'grass';
  for (const s of GROUND_SEGMENTS) if (x >= s.from) kind = s.kind;
  return kind === 'sand' ? SPR.sandTile : (kind === 'dirt' ? SPR.dirtTile : SPR.grassTile);
}
function drawWater(river, camX) {
  const rx0 = Math.max(0, river.x0 - camX), rx1 = Math.min(CONFIG.VIEW_W, river.x1 - camX);
  if (rx1 <= rx0) return;
  ctx.fillStyle = '#2b5d8a';
  ctx.fillRect(rx0, river.waterY, rx1 - rx0, CONFIG.VIEW_H - river.waterY);
  ctx.fillStyle = '#3f7fbf';
  ctx.fillRect(rx0, river.waterY, rx1 - rx0, 4);
  ctx.fillStyle = 'rgba(191,230,242,0.8)';
  const ripOff = Math.floor(G.time * 20) % 24;
  for (let x = rx0 - 24 + ripOff; x < rx1; x += 24) ctx.fillRect(x, river.waterY + 9 + ((x * 7) % 3) * 7, 10, 2);
  ctx.fillStyle = 'rgba(191,230,242,0.35)';
  for (let x = rx0 - 12 + ((ripOff * 0.5) | 0); x < rx1; x += 36) ctx.fillRect(x, river.waterY + 24, 14, 2);
}

function render() {
  const camX = Math.round(G.camX);
  const shakeX = G.shake > 0 ? (Math.random() - 0.5) * G.shake : 0;
  const shakeY = G.shake > 0 ? (Math.random() - 0.5) * G.shake : 0;
  ctx.save();
  ctx.translate(Math.round(shakeX), Math.round(shakeY));

  // Lapis 1: langit senja (statis)
  ctx.drawImage(SPR.bgSky, 0, 0);
  // Lapis 2: awan organik bergeser sangat pelan (0.05 + waktu)
  const cloudOff = -Math.floor(camX * 0.05 + G.time * 1.8) % 960;
  ctx.drawImage(SPR.cloudStrip, cloudOff, 0);
  ctx.drawImage(SPR.cloudStrip, cloudOff + 960, 0);
  // Lapis 3: pegunungan bertekstur & hutan jauh (0.3)
  const farOff = -Math.floor(camX * 0.3) % 960;
  ctx.drawImage(SPR.bgFar, farOff, 0);
  ctx.drawImage(SPR.bgFar, farOff + 960, 0);
  // Lapis 4: hutan tengah bervariasi (0.6)
  const midOff = -Math.floor(camX * 0.6) % 960;
  ctx.drawImage(SPR.bgMid, midOff, 0);
  ctx.drawImage(SPR.bgMid, midOff + 960, 0);

  // Tanah per segmen permukaan (ubin 96px)
  for (let wx = Math.floor(camX / 96) * 96; wx < camX + CONFIG.VIEW_W; wx += 96) {
    ctx.drawImage(groundTileFor(wx), wx - camX, CONFIG.GROUND_Y);
  }

  // Sungai zona 1 (+ Monster Laut) & perairan zona 3
  drawWater(RIVER, camX);
  drawSeaMonster(camX);
  drawWater(RIVER2, camX);

  // Platform & jembatan
  for (const pl of PLATFORMS) {
    const sx = pl.x - camX;
    if (sx + pl.w < 0 || sx > CONFIG.VIEW_W) continue;
    if (pl.bridge) {
      for (let x = 0; x < pl.w; x += 96) {
        const cw = Math.min(96, pl.w - x);
        ctx.drawImage(SPR.bridgeTile, 0, 0, cw, 18, sx + x, pl.y, cw, 18);
      }
      // Pilar jembatan masuk ke air
      ctx.fillStyle = '#6e3d20';
      for (let px = 45; px < pl.w; px += 150) ctx.fillRect(sx + px, pl.y + 18, 9, CONFIG.GROUND_Y - pl.y - 18 + 30);
    } else {
      for (let x = 0; x < pl.w; x += 48) {
        const cw = Math.min(48, pl.w - x);
        ctx.drawImage(SPR.woodTile, 0, 0, cw, 15, sx + x, pl.y, cw, 15);
      }
      ctx.fillStyle = '#6e3d20';
      ctx.fillRect(sx + 6, pl.y + 15, 6, CONFIG.GROUND_Y - pl.y - 15);
      ctx.fillRect(sx + pl.w - 12, pl.y + 15, 6, CONFIG.GROUND_Y - pl.y - 15);
    }
  }

  // Menara pengawas
  for (const tw of TOWER_DEFS) {
    const sx = tw.x - camX;
    if (sx + 50 < 0 || sx > CONFIG.VIEW_W) continue;
    ctx.drawImage(SPR.tower, sx, CONFIG.GROUND_Y - 96);
  }
  // Tenda & gudang (bisa hancur)
  for (const t of tents) {
    const sx = t.x - camX;
    if (sx + t.w < 0 || sx > CONFIG.VIEW_W) continue;
    if (t.broken) {
      // puing
      ctx.fillStyle = '#47543a';
      ctx.fillRect(sx + 6, CONFIG.GROUND_Y - 7, t.w - 12, 7);
      ctx.fillRect(sx + t.w * 0.3, CONFIG.GROUND_Y - 13, t.w * 0.32, 6);
      continue;
    }
    ctx.drawImage(t.big ? SPR.warehouse : SPR.tent, sx, t.y);
  }
  // Dekorasi statis rapat (batu, karung pasir, kawat, bunga, reruntuhan...)
  for (const d of DECOR) {
    const img = SPR[d.kind];
    const sx = d.x - camX;
    if (sx + img.width < 0 || sx > CONFIG.VIEW_W) continue;
    ctx.drawImage(img, sx, CONFIG.GROUND_Y - img.height);
  }
  // Tong bahan bakar
  for (const f of fuels) {
    if (f.broken) continue;
    ctx.drawImage(SPR.barrel, f.x - camX, f.y);
    ctx.fillStyle = '#f2c230';
    ctx.fillRect(f.x - camX + 5, f.y + 5, 3, 3); // penanda bahaya
  }
  // Peti
  for (const c of crates) {
    if (c.broken) continue;
    ctx.drawImage(SPR.crate, c.x - camX, c.y);
  }

  // SV-001 terparkir / dikendarai
  if (!slug.destroyed) drawSlug(camX);

  // POW
  for (const pw of pows) {
    if (pw.state === 'hidden') continue;
    if (pw.state === 'done' && pw.walkT <= 0) continue;
    const sx = pw.x - camX;
    if (sx + 30 < 0 || sx > CONFIG.VIEW_W) continue;
    let img;
    if (pw.state === 'tied') img = SPR.powTied;
    else if (pw.state === 'done') img = SPR.powWave[(pw.animT * 4) % 2 | 0];
    else img = SPR.powWalk[(pw.animT * 5) % 2 | 0];
    _ent.x = sx; _ent.y = pw.y; _ent.w = pw.w; _ent.h = pw.h;
    drawEntitySprite(img, _ent, false);
  }

  // Pickup (ikon terpusat di kotak pickup)
  for (const pk of pickups) {
    if (pk.t > 7.5 && (pk.t * 6 | 0) % 2 === 0) continue;
    const img = pk.kind === 'grenade' ? SPR.iconGrenade : (pk.kind === 'firebomb' ? SPR.iconFirebomb : (pk.kind === 'cannon' ? SPR.iconCannon : SPR[WEAPON_ICON[pk.kind]]));
    const bob = Math.sin(pk.t * 4) * 2;
    if ((pk.t * 2 | 0) % 2 === 0) {
      ctx.fillStyle = 'rgba(242,194,48,0.25)';
      ctx.fillRect(Math.round(pk.x - camX - 6), Math.round(pk.y - 12 + bob), 30, 30);
    }
    ctx.drawImage(img, Math.round(pk.x + pk.w / 2 - img.width / 2 - camX), Math.round(pk.y - 9 + bob));
  }

  // Musuh (hit-flash: siluet putih penuh saat hitT aktif)
  for (const e of enemies) {
    if (!e.spawned) continue;
    const sx = e.x - camX;
    if (sx + 55 < 0 || sx > CONFIG.VIEW_W + 15) continue;
    _ent.x = sx; _ent.y = e.y; _ent.w = e.w; _ent.h = e.h;
    const flip = e.face > 0;
    if (e.state === 'dead') {
      const img = e.type === 'shield' ? SPR.shieldWalk[0] : (e.type === 'grenade' ? SPR.greIdle : (e.type === 'bazooka' ? SPR.bazIdle : SPR.rebelWalk[0]));
      ctx.save();
      ctx.translate(sx + e.w / 2, e.y + e.h / 2);
      ctx.rotate(-(1 - Math.max(0, e.deadT) / 0.38) * 1.5 * (e.face > 0 ? -1 : 1));
      ctx.globalAlpha = Math.max(0, e.deadT / 0.38);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
      continue;
    }
    let img, imgF;
    const flash = e.hitT > 0;
    if (e.type === 'rebel') {
      // Panjang siklus mengikuti array aktif: 2 frame (sprite v3) atau
      // 8 frame (aset v4) — laju animT tidak berubah.
      const wi = ((e.animT * 6) | 0) % SPR.rebelWalk.length;
      const moving = Math.abs(player.x - e.x) > 81 && e.state !== 'idle';
      img = moving ? SPR.rebelWalk[wi] : SPR.rebelShoot;
      imgF = moving ? SPR.rebelWalkF[wi] : SPR.rebelShootF;
    }
    else if (e.type === 'shield') {
      const wi = ((e.animT * 6) | 0) % SPR.shieldWalk.length;
      img = e.state === 'flee' ? SPR.shieldBroken : SPR.shieldWalk[wi];
      imgF = e.state === 'flee' ? SPR.shieldBrokenF : SPR.shieldWalkF[wi];
    }
    else if (e.type === 'bazooka') { img = SPR.bazIdle; imgF = SPR.bazIdleF; }
    else {
      img = (e.throwShowT > 0) ? SPR.greThrow : SPR.greIdle;
      imgF = (e.throwShowT > 0) ? SPR.greThrowF : SPR.greIdleF;
    }
    drawEntitySprite(flash ? imgF : img, _ent, flip);
  }

  // Di-Cokka
  if (cokka.active && !cokka.dead) {
    const sx = cokka.x - camX;
    if (sx + 105 > 0 && sx < CONFIG.VIEW_W + 15) {
      const recoil = cokka.recoilT > 0 ? 3 : 0;
      ctx.drawImage(cokka.hitT > 0 ? SPR.tankFlash : SPR.tank, Math.round(sx + recoil), Math.round(cokka.y));
      if (cokka.dying <= 0) drawBossBar(sx, cokka.y - 13, 96, cokka.hp, CONFIG.BOSS_HP, '#d84f35');
    }
  }

  // Robot Titan
  if (titan.active && !titan.dead) drawTitan(camX);

  // Pemain (tidak digambar saat di dalam Slug; kedip saat kebal respawn)
  const invulnBlink = player.state === 'normal' && player.invulnT > 0 && (G.time * 14 | 0) % 2 === 0;
  if (player.state !== 'slug' && !invulnBlink) drawPlayer(camX);

  // Zona api
  for (const z of flameZones) {
    if (!z.active) continue;
    const fx = z.x - camX;
    const hgt = 15 + Math.sin(G.time * 30 + z.x) * 3;
    ctx.fillStyle = 'rgba(216,79,53,0.85)';
    ctx.fillRect(Math.round(fx - z.w / 2), Math.round(z.y - hgt * 0.5), z.w, hgt * 0.5);
    ctx.fillStyle = 'rgba(232,126,53,0.9)';
    ctx.fillRect(Math.round(fx - z.w / 2 + 4), Math.round(z.y - hgt * 0.8), z.w - 8, hgt * 0.6);
    ctx.fillStyle = '#f2c230';
    ctx.fillRect(Math.round(fx - 4), Math.round(z.y - hgt), 9, hgt * 0.5);
  }

  // Proyektil pemain
  for (const b of bullets) {
    if (!b.active) continue;
    const sx = b.x - camX;
    if (b.kind === 'rocket' || b.kind === 'chaser') {
      ctx.fillStyle = '#e8e4da';
      ctx.fillRect(Math.round(sx), Math.round(b.y), 9, 4);
      ctx.fillStyle = b.kind === 'chaser' ? '#7ec8e3' : '#d84f35';
      ctx.fillRect(Math.round(sx) + (b.vx > 0 ? 0 : 6), Math.round(b.y), 3, 4);
    } else if (b.kind === 'shotgun') {
      ctx.fillStyle = '#f2c230'; ctx.fillRect(Math.round(sx), Math.round(b.y), 3, 3);
    } else if (b.kind === 'flame') {
      ctx.fillStyle = (G.time * 20 | 0) % 2 ? '#e87e35' : '#f2c230';
      ctx.fillRect(Math.round(sx), Math.round(b.y), 6, 4);
    } else if (b.kind === 'laser') {
      ctx.fillStyle = '#58c7d8'; ctx.fillRect(Math.round(sx) - 4, Math.round(b.y), 13, 3);
      ctx.fillStyle = '#e8fbff'; ctx.fillRect(Math.round(sx) - 1, Math.round(b.y), 7, 1);
    } else if (b.kind === 'vulcan') {
      ctx.fillStyle = '#ffe9a8'; ctx.fillRect(Math.round(sx), Math.round(b.y), 4, 3);
    } else {
      ctx.fillStyle = '#ffe9a8'; ctx.fillRect(Math.round(sx), Math.round(b.y), 6, 2);
    }
  }
  // Peluru musuh & bola air
  for (const b of ebullets) {
    if (!b.active) continue;
    if (b.water) {
      ctx.fillStyle = '#7ec8e3'; ctx.fillRect(Math.round(b.x - camX), Math.round(b.y), 6, 6);
      ctx.fillStyle = '#e8fbff'; ctx.fillRect(Math.round(b.x - camX) + 2, Math.round(b.y) + 1, 2, 2);
    } else {
      ctx.fillStyle = '#ff9d5c'; ctx.fillRect(Math.round(b.x - camX), Math.round(b.y), 4, 3);
    }
  }
  // Roket musuh (berkedip) & rudal Titan
  for (const r of erockets) {
    if (!r.active) continue;
    const sx = r.x - camX;
    const blink = (r.blinkT * 9 | 0) % 2 === 0;
    ctx.fillStyle = blink ? '#e8e4da' : '#d84f35';
    if (r.titan) {
      ctx.fillRect(Math.round(sx) - 3, Math.round(r.y) - 7, 6, 12);
      ctx.fillStyle = '#f2c230'; ctx.fillRect(Math.round(sx) - 3, Math.round(r.y) + 5, 6, 3);
    } else {
      ctx.fillRect(Math.round(sx) - 5, Math.round(r.y) - 2, 10, 4);
      ctx.fillStyle = '#f2c230'; ctx.fillRect(Math.round(sx) + (r.vx > 0 ? -7 : 6), Math.round(r.y) - 2, 3, 4);
    }
  }
  // Granat & peluru meriam
  for (const g of grenades) {
    if (!g.active) continue;
    const sx = g.x - camX;
    if (g.shell) {
      ctx.fillStyle = '#3b4046'; ctx.fillRect(Math.round(sx) - 3, Math.round(g.y) - 3, 7, 7);
      ctx.fillStyle = '#f2c230'; ctx.fillRect(Math.round(sx) - 1, Math.round(g.y) - 1, 3, 3);
    } else if (g.firebomb) {
      ctx.fillStyle = '#d84f35'; ctx.fillRect(Math.round(sx) - 2, Math.round(g.y) - 2, 4, 4);
      ctx.fillStyle = '#f2c230'; ctx.fillRect(Math.round(sx), Math.round(g.y), 2, 2);
    } else {
      ctx.fillStyle = g.hostile ? '#8f2f2f' : '#3e5c2b';
      ctx.fillRect(Math.round(sx) - 2, Math.round(g.y) - 2, 4, 4);
    }
  }
  // Gelombang tanah
  for (const wv of groundWaves) {
    if (!wv.active) continue;
    const sx = wv.x - camX;
    ctx.fillStyle = '#9a7d4f';
    ctx.fillRect(Math.round(sx) - 8, CONFIG.GROUND_Y - 14, 16, 14);
    ctx.fillStyle = '#b08d58';
    ctx.fillRect(Math.round(sx) - 5, CONFIG.GROUND_Y - 18, 10, 7);
    ctx.fillStyle = '#6e5636';
    ctx.fillRect(Math.round(sx) + (wv.dir > 0 ? 3 : -8), CONFIG.GROUND_Y - 9, 5, 6);
  }

  // Bayangan peringatan tentakel monster laut
  if (sea.state === 'fighting') {
    for (const t of sea.tents) {
      if (t.state !== 'warn') continue;
      const sx = t.warnX - camX;
      ctx.fillStyle = (G.time * 8 | 0) % 2 ? 'rgba(216,79,53,0.5)' : 'rgba(242,194,48,0.5)';
      ctx.fillRect(Math.round(sx) - 3, CONFIG.GROUND_Y - 3, t.w + 6, 4);
      ctx.fillRect(Math.round(sx) + 7, CONFIG.GROUND_Y - 9, 5, 5);
    }
  }

  // Partikel (bingkai ledakan sprite, cipratan, selongsong, debu, asap)
  for (const p of particles) {
    if (!p.active) continue;
    const sx = p.x - camX;
    if (p.boom >= 0) {
      const img = SPR.boom[p.boom];
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      const sc = p.size;
      ctx.drawImage(img, Math.round(sx - img.width * sc / 2), Math.round(p.y - img.height * sc / 2), img.width * sc, img.height * sc);
      ctx.globalAlpha = 1;
      continue;
    }
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(sx), Math.round(p.y), p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // Lapis foreground: rumpun tepi bawah bergoyang pelan (2 varian)
  ctx.globalAlpha = 0.55;
  const fgOff = -Math.floor(camX * 1.15) % 120;
  let tuftIdx = Math.floor(camX * 1.15 / 120);
  for (let x = fgOff - 120; x < CONFIG.VIEW_W; x += 120, tuftIdx++) {
    const sway = Math.sin(G.time * 1.4 + tuftIdx * 1.7) * 1.6;
    ctx.drawImage(SPR.fgTufts[((tuftIdx % 2) + 2) % 2], Math.round(x + sway), CONFIG.VIEW_H - 38);
  }
  ctx.globalAlpha = 1;

  ctx.restore();

  // Teks announcer
  if (G.announceT > 0 && G.announceText) {
    const t = G.announceT;
    const scale = t > 1.25 ? 1 + (t - 1.25) * 2.2 : 1;
    ctx.save();
    ctx.translate(CONFIG.VIEW_W / 2, 92);
    ctx.scale(scale, scale);
    ctx.font = 'bold 26px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#20242a';
    ctx.strokeText(G.announceText, 0, 0);
    ctx.fillStyle = '#f2c230';
    ctx.fillText(G.announceText, 0, 0);
    ctx.restore();
  }
}

function drawBossBar(sx, y, wdt, hp, maxHp, color) {
  ctx.fillStyle = '#20242a';
  ctx.fillRect(Math.round(sx), y, wdt, 7);
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(sx) + 1, y + 1, (wdt - 2) * Math.max(0, hp) / maxHp, 5);
}

function drawSeaMonster(camX) {
  // Tentakel (di belakang kepala)
  for (const t of sea.tents) {
    if (t.rise <= 0.02 || sea.state === 'dormant' || sea.state === 'dead') continue;
    const sx = t.x - camX;
    if (sx + 30 < 0 || sx > CONFIG.VIEW_W) continue;
    const img = SPR.tentacle;
    const visH = img.height * t.rise;
    // Ujung tentakel muncul lebih dulu: potong sumber dari ATAS (9 argumen)
    ctx.drawImage(img, 0, 0, img.width, visH, Math.round(sx - 1), Math.round(CONFIG.GROUND_Y - visH + 9), img.width, visH);
  }
  if (sea.state === 'dormant' || sea.state === 'dead') return;
  if (sea.head.rise <= 0.02) return;
  const img = sea.hitT > 0 ? SPR.seaHeadFlash : SPR.seaHead;
  const sx = sea.head.x - camX;
  const visH = img.height * sea.head.rise;
  // Kepala muncul dari atasnya dulu: potong sumber dari ATAS (9 argumen)
  ctx.drawImage(img, 0, 0, img.width, visH, Math.round(sx - 3), Math.round(CONFIG.GROUND_Y + 6 - visH), img.width, visH);
}

function drawSlug(camX) {
  const sx = slug.x - camX;
  if (sx + 90 < 0 || sx > CONFIG.VIEW_W + 15) return;
  const sy = slug.y;
  // Badan (flip bila menghadap kiri)
  drawSprite(slug.hitT > 0 && slug.occupied ? SPR.slugFlash : SPR.slugBody, sx - 9, sy, slug.face < 0);
  // Kepala pemain mengintip dari palka saat dikendarai
  if (slug.occupied) {
    ctx.drawImage(SPR.headIcon, Math.round(sx + slug.w / 2 - 9), Math.round(sy - 20), 18, 18);
  }
  // Turet berputar 8-arah (asal putar di kubu (30,15) relatif kotak)
  const tur = (slug.occupied && slug.cannonCd > CONFIG.CANNON_RATE - 0.15) ? SPR.slugCannon : SPR.slugTurret;
  ctx.save();
  ctx.translate(Math.round(sx + 30), Math.round(sy + 15));
  if (slug.occupied) ctx.rotate(slug.turretAng);
  else ctx.rotate(slug.face > 0 ? 0 : Math.PI);
  ctx.drawImage(tur, -12, -17);
  ctx.restore();
  // Muzzle flash turet saat baru menembak
  if (slug.occupied && slug.fireCd > CONFIG.VULCAN_RATE - 0.03) {
    const m = computeMuzzle();
    const img = SPR.muzzle[(G.time * 24 | 0) % 2];
    ctx.save();
    ctx.translate(Math.round(m.x - camX), Math.round(m.y));
    ctx.rotate(slug.turretAng);
    ctx.drawImage(img, 0, -6);
    ctx.restore();
  }
}

function drawTitan(camX) {
  const sx = titan.x - camX;
  if (sx + 210 < 0 || sx > CONFIG.VIEW_W + 120) return;
  // Posisi core berdenyut (relatif kotak Titan); beda per sumber grafik.
  let coreX = sx + 34, coreY = titan.y + 62;
  if (SPR.titanAsset && SPR.titanMech) {
    // v4: badan mech ASLI (Open Gunner, CC-BY) — jangkar bawah-tengah pada
    // kotak tabrak; pose tembak saat salvo meriam berjalan (burstN > 0).
    // Lengan putar v3 tidak digambar: meriam menyatu di badan mech.
    let img = SPR.titanMech.stand;
    if (titan.burstN > 0) img = ((G.time * 10 | 0) % 2 === 0) ? SPR.titanMech.flash : SPR.titanMech.shoot;
    if (titan.hitT > 0) img = SPR.titanMechF;
    ctx.drawImage(img, Math.round(sx + titan.w / 2 - img.width / 2), Math.round(titan.y + titan.h - img.height));
    coreX = sx + 30; coreY = titan.y + 40;
  } else {
  const img = titan.hitT > 0 ? SPR.titanFlash : SPR.titan;
  // Badan: sprite 96 lebar digambar di titan.x-9 (badan baja di dalamnya)
  ctx.drawImage(img, Math.round(sx - 9), Math.round(titan.y));
  // Lengan meriam berputar di bahu (relatif sprite (21,45) -> layar (sx+12, y+45); asal gambar lengan (39,9))
  ctx.save();
  ctx.translate(Math.round(sx + 12), Math.round(titan.y + 45));
  ctx.rotate(titan.armAng);
  ctx.drawImage(SPR.titanArm, -39, -9);
  ctx.restore();
  }
  // Core berdenyut menyala (berkedip putih saat baru kena damage ganda)
  const pulse = 0.6 + 0.4 * Math.sin(G.time * 6);
  ctx.fillStyle = titan.flashCoreT > 0 ? '#ffffff' : (titanEnraged() ? '#ff7a4d' : '#58c7d8');
  ctx.globalAlpha = pulse;
  ctx.fillRect(Math.round(coreX), Math.round(coreY), 9, 9);
  ctx.globalAlpha = 1;
  // Bar HP bos
  if (titan.dying <= 0) {
    drawBossBar(sx - 6, titan.y - 14, 90, titan.hp, CONFIG.TITAN_HP, titanEnraged() ? '#ff5a2a' : '#d84f35');
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText('TITAN', Math.round(sx + 39), Math.round(titan.y - 18));
    ctx.textAlign = 'left';
  }
}

function drawPlayer(camX) {
  const p = player;
  const sx = p.x - camX;
  _ent.x = sx; _ent.y = p.y; _ent.w = p.w; _ent.h = p.h;
  const flip = p.face < 0;
  let img;
  if (p.state === 'dead') {
    img = p.deadT > 0.75 ? SPR.pDie0 : (p.deadT > 0.35 ? SPR.pDie1 : SPR.pDie2);
    ctx.drawImage(img, Math.round(sx + p.w / 2 - img.width / 2), Math.round(p.y + p.h - img.height));
    return;
  }
  const w = p.weapon;
  if (G.clearT > 0 && p.onGround) img = SPR.pVictory;   // pose kemenangan saat Mission Complete
  else if (p.meleeT > 0) img = SPR.pMelee;
  else if (p.throwT > 0) img = SPR.pThrow;
  else if (p.crouch) {
    if (p.aim === 'up') img = SPR.pCrouchUp[w] || SPR.pCrouch;
    else if (p.fireShowT > 0 || input('fire')) img = SPR.pCrouchFire[w] || SPR.pCrouch;
    else img = SPR.pCrouch;
  }
  else if (!p.onGround) {
    if (p.aim === 'up') img = SPR.pJumpByWeapon[w + 'Up'];
    else if (p.aim === 'diag') img = SPR.pJumpByWeapon[w + 'Diag'];
    else img = SPR.pJumpByWeapon[w];
  }
  else if (p.vx !== 0) {
    img = SPR.pRunByWeapon[w][(p.animT * 10) % 8 | 0];
  }
  else if (p.fireShowT > 0 || input('fire')) {
    img = p.aim === 'up' ? SPR.pFireUp[w] : (p.aim === 'diag' ? SPR.pFireDiag[w] : SPR.pFireH[w]);
  }
  else {
    // Idle dengan napas terlihat (2 frame bergantian pelan)
    const breath = (G.time * 1.6 | 0) % 2 === 0;
    img = breath ? (SPR.pIdleGun[w] || SPR.pIdle) : (SPR.pIdleGunB[w] || SPR.pIdleB);
  }
  if (!img) img = SPR.pIdle;
  drawEntitySprite(img, _ent, flip);
  // Muzzle flash di ujung senjata saat menembak
  if (p.fireShowT > 0 && p.meleeT <= 0) {
    const m = computeMuzzle();
    const fimg = SPR.muzzle[(G.time * 24 | 0) % 2];
    drawSprite(fimg, m.x - camX - 3, m.y - 6, flip);
  }
}

/* ================= HUD ============================================== */
let hudCache = '';
function renderHUD() {
  const inSlug = player.state === 'slug';
  const bombTxt = player.grenadeType === 'fire' ? 'FIRE x' + player.firebombs : 'BOMB x' + player.grenades;
  const key = [G.score, G.lives, player.weapon, player.ammo, bombTxt, G.timer, G.powSaved, G.screen,
    inSlug, slug.armor, slug.cannon, sea.state, cokka.active, titan.active, G.paused].join('|');
  if (key === hudCache) return;
  hudCache = key;
  hudCtx.clearRect(0, 0, CONFIG.VIEW_W, CONFIG.VIEW_H);
  if (G.screen === 'title') return;
  hudCtx.font = 'bold 13px "Courier New", monospace';
  hudCtx.textAlign = 'left';
  hudCtx.fillStyle = '#20242a';
  hudCtx.fillText('SKOR', 11, 17);
  hudCtx.fillStyle = '#ffffff';
  hudCtx.fillText('SKOR', 10, 16);
  hudCtx.fillStyle = '#f2c230';
  hudCtx.fillText(String(G.score).padStart(6, '0'), 52, 16);
  // Nyawa: ikon kepala + jumlah sisa
  const livesLeft = Math.max(0, G.lives - 1);
  hudCtx.drawImage(SPR.headIcon, 10, 22, 15, 15);
  hudCtx.fillStyle = '#ffffff';
  hudCtx.fillText('x' + livesLeft, 28, 34);
  if (inSlug) {
    // Panel Slug: bar ARMOR oranye + amunisi CANNON (menggantikan ARMS)
    hudCtx.fillStyle = '#ffffff';
    hudCtx.fillText('SLUG ARMOR', 10, 52);
    hudCtx.fillStyle = '#20242a';
    hudCtx.fillRect(10, 57, 92, 9);
    hudCtx.fillStyle = '#e87e35';
    hudCtx.fillRect(11, 58, 90 * Math.max(0, slug.armor) / CONFIG.SLUG_ARMOR, 7);
    hudCtx.fillStyle = '#7ec8e3';
    hudCtx.fillText('CANNON ' + slug.cannon, 10, 82);
    hudCtx.fillStyle = '#ffffff';
    hudCtx.fillText(bombTxt, 120, 82);
  } else {
    const wname = WEAPONS[player.weapon].name;
    const ammoTxt = player.weapon === 'handgun' ? 'ARMS ∞' : 'ARMS ' + player.ammo;
    hudCtx.fillStyle = '#ffffff';
    hudCtx.fillText(wname, 10, 52);
    hudCtx.fillStyle = '#7ec8e3';
    hudCtx.fillText(ammoTxt, 10, 68);
    hudCtx.fillStyle = '#ffffff';
    hudCtx.fillText(bombTxt, 84, 68);
    if (player.firebombs > 0 && player.grenadeType === 'normal') {
      hudCtx.fillStyle = '#e87e35';
      hudCtx.fillText('FIRE x' + player.firebombs, 168, 68);
    }
  }
  // Timer tengah atas
  hudCtx.textAlign = 'center';
  hudCtx.font = 'bold 20px "Courier New", monospace';
  hudCtx.fillStyle = G.timer <= 10 ? '#d84f35' : '#ffffff';
  hudCtx.fillText(String(Math.max(0, G.timer)), CONFIG.VIEW_W / 2, 20);
  // POW di SAMPING TIMER (tengah atas) — audit v4: posisi lama rata-kanan
  // di (VIEW_W-10, 16) tertabrak gugus tombol pojok HTML (PENUH/PUTAR/
  // bisu/jeda menempati ±200px CSS di kanan atas panggung), teks POW
  // tertutup sebagian tombol pada pratinjau gameplay.
  hudCtx.textAlign = 'left';
  hudCtx.font = 'bold 13px "Courier New", monospace';
  hudCtx.fillStyle = '#ffffff';
  hudCtx.fillText('POW x' + G.powSaved, CONFIG.VIEW_W / 2 + 30, 16);
  hudCtx.textAlign = 'left';
}

/* ================= Loop utama: fixed timestep + hit-stop ============ */
let STEP = 1 / 60;
let accumulator = 0;
let lastTs = 0;
let slowFrames = 0;
let fastFrames = 0;

function frame(ts) {
  requestAnimationFrame(frame);
  if (!lastTs) { lastTs = ts; return; }
  let dt = (ts - lastTs) / 1000;
  lastTs = ts;

  if (dt > 0.021) { slowFrames++; fastFrames = 0; } else { fastFrames++; slowFrames = 0; }
  if (STEP === 1 / 60 && slowFrames > 90) { STEP = 1 / 30; slowFrames = 0; }
  else if (STEP === 1 / 30 && fastFrames > 240) { STEP = 1 / 60; fastFrames = 0; }

  if (dt > 0.25) dt = 0.25;
  accumulator += dt;
  let steps = 0;
  while (accumulator >= STEP && steps < 3) {
    if (G.hitStop > 0) { G.hitStop -= STEP; accumulator -= STEP; steps++; continue; } // bekukan dunia sesaat
    update(STEP);
    accumulator -= STEP;
    steps++;
  }
  if (steps === 3) accumulator = 0;
  render();
  renderHUD();
}
requestAnimationFrame(frame);

// Terapkan pengaturan audio sejak awal (mesin audio dibuat saat gestur pertama)
AUDIO.musicOn = SETTINGS.music;
AUDIO.sfxOn = SETTINGS.sfx;

/* ================= Tombol UI ======================================== */
function toggleMute() {
  AUDIO.setMuted(!AUDIO.muted);
  document.getElementById('muteBtn').textContent = AUDIO.muted ? '🔇' : '🔊';
}
const muteBtnEl = document.getElementById('muteBtn');
muteBtnEl.addEventListener('click', () => { AUDIO.init(); AUDIO.setMusicOn(SETTINGS.music); AUDIO.setSfxOn(SETTINGS.sfx); toggleMute(); });
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('againBtn').addEventListener('click', startGame);
document.getElementById('menuBtn').addEventListener('click', () => {
  AUDIO.stopMusic();
  G.screen = 'title';
  G.paused = false;
  G.announceT = 0;          // bersihkan state sesaat saat transisi (KOREKSI.md)
  G.announceText = '';
  document.getElementById('pauseBtn').classList.add('hidden');
  showScreen('titleScreen');
});
document.getElementById('settingsBtn').addEventListener('click', () => openSettings('title'));
document.getElementById('pauseSettingsBtn').addEventListener('click', () => openSettings('pause'));
document.getElementById('settingsBackBtn').addEventListener('click', closeSettings);
document.getElementById('resumeBtn').addEventListener('click', () => setPaused(false));
document.getElementById('quitBtn').addEventListener('click', () => {
  AUDIO.stopMusic();
  G.screen = 'title';
  G.paused = false;
  G.announceT = 0;
  G.announceText = '';
  jumpPressed = false;
  grenadePressed = false;
  document.getElementById('pauseBtn').classList.add('hidden');
  showScreen('titleScreen');
});
document.getElementById('pauseBtn').addEventListener('click', () => { if (G.screen === 'play') togglePause(); });
document.getElementById('fsBtn').addEventListener('click', toggleFullscreen);
document.getElementById('rotBtn').addEventListener('click', toggleRotate);
syncFsBtn();
syncRotBtn();

function bindSetting(id, key2, apply) {
  const el = document.getElementById(id);
  el.addEventListener('change', () => {
    SETTINGS[key2] = el.checked;
    saveSettings();
    if (apply) apply(el.checked);
    if (key2 === 'vibrate' && el.checked) vibrate(30);
  });
}
bindSetting('optMusic', 'music', (on) => { AUDIO.init(); AUDIO.setMusicOn(on); });
bindSetting('optSfx', 'sfx', (on) => { AUDIO.init(); AUDIO.setSfxOn(on); });
bindSetting('optVibrate', 'vibrate', null);
