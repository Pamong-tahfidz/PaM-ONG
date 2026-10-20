'use strict';
/* =====================================================================
   PaM-ONG — game.js
   Run-and-gun bergaya Metal Slug, satu misi penuh sampai mini-boss.
   Vanilla Canvas 2D, fixed timestep, object pooling, tanpa aset luar.
   ===================================================================== */

/* ================= CONFIG — semua konstanta tuning di sini ========== */
const CONFIG = {
  VIEW_W: 320, VIEW_H: 224,          // resolusi internal (Neo Geo)
  GROUND_Y: 192,                     // permukaan tanah (y)
  LEVEL_W: 2600,                     // lebar level Misi 1
  GRAVITY: 900,                      // px/s^2
  PLAYER_SPEED: 96,                  // px/s
  PLAYER_JUMP_VEL: -345,             // px/s
  PLAYER_W: 12, PLAYER_H: 26, PLAYER_H_CROUCH: 19,
  START_LIVES: 3,
  START_GRENADES: 10,
  MAX_GRENADES: 30,
  TIMER_START: 99,                   // detik
  RESPAWN_INVULN: 2.0,               // detik kebal berkedip
  MELEE_RANGE: 17,                   // px di depan pemain
  BOSS_HP: 60,                       // setara 60 tembakan pistol
  BOSS_SCORE: 1200,
  POW_BONUS: 5000,                   // poin per POW di ringkasan akhir
  POW_ITEM_SCORE: 1000,
  BULLET_POOL: 240,
  EBULLET_POOL: 80,
  GRENADE_POOL: 48,
  PARTICLE_POOL: 150,
  ARENA_TRIGGER_X: 2260              // pemain melewati ini -> boss aktif
};

// Definisi senjata (damage, jeda tembak, kecepatan proyektil)
const WEAPONS = {
  handgun: { name: 'HANDGUN',          rate: 0.24, speed: 300, dmg: 1, diag: false },
  hmg:     { name: 'HEAVY MACHINE GUN', rate: 0.085, speed: 300, dmg: 1, diag: true, ammo: 200 },
  rocket:  { name: 'ROCKET LAUNCHER',   rate: 0.5,  speed: 175, dmg: 3, diag: false, ammo: 30 },
  shotgun: { name: 'SHOTGUN',           rate: 0.6,  speed: 310, dmg: 1, diag: false, ammo: 30, pellets: 5, pelletLife: 0.23 }
};
const WEAPON_ANNOUNCE = { hmg: 'Heavy Machine Gun!', rocket: 'Rocket Launcher!', shotgun: 'Shotgun!' };
const WEAPON_ICON = { hmg: 'iconHmg', rocket: 'iconRocket', shotgun: 'iconShotgun' };

/* ================= Canvas & konteks ================================= */
const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d');
ctx.imageSmoothingEnabled = false;
const hudCvs = document.getElementById('hud');
const hudCtx = hudCvs.getContext('2d');
hudCtx.imageSmoothingEnabled = false;

const SPR = buildSprites(CONFIG.GROUND_Y);

/* ================= Data level ======================================= */
const PLATFORMS = [
  { x: 300,  y: 150, w: 70, h: 10 },
  { x: 640,  y: 140, w: 80, h: 10 },
  { x: 1050, y: 150, w: 70, h: 10 },
  { x: 1450, y: 135, w: 90, h: 10 },
  { x: 1900, y: 150, w: 70, h: 10 }
];
// Definisi musuh: {type:'rebel'|'shield'|'grenade', x, y?} y tanah bila kosong
const ENEMY_DEFS = [
  { type: 'rebel',   x: 500 }, { type: 'rebel', x: 565 },
  { type: 'grenade', x: 330, y: 150 }, { type: 'rebel', x: 760 },
  { type: 'shield',  x: 850 }, { type: 'rebel', x: 920 },
  { type: 'grenade', x: 1080, y: 150 }, { type: 'rebel', x: 1200 },
  { type: 'rebel',   x: 1305 }, { type: 'shield', x: 1560 },
  { type: 'grenade', x: 1490, y: 135 }, { type: 'rebel', x: 1650 },
  { type: 'rebel',   x: 1755 }, { type: 'grenade', x: 1930, y: 150 },
  { type: 'shield',  x: 2100 }, { type: 'rebel', x: 2160 }
];
const CRATE_DEFS = [
  { x: 420, drop: 'grenade' }, { x: 980, drop: 'hmg' },
  { x: 1380, drop: 'grenade' }, { x: 1700, drop: 'rocket' },
  { x: 2000, drop: 'shotgun' }
];
const POW_DEFS = [{ x: 380 }, { x: 1120 }, { x: 1830 }];
const DECOR = [
  { kind: 'barrel', x: 250 }, { kind: 'sign', x: 180 },
  { kind: 'barrel', x: 700 }, { kind: 'barrel', x: 1330 },
  { kind: 'sign', x: 1600 }, { kind: 'barrel', x: 2050 }
];

/* ================= State permainan ================================== */
const G = {
  screen: 'title',        // 'title' | 'play' | 'clear' | 'over'
  score: 0,
  lives: CONFIG.START_LIVES,
  powSaved: 0,
  timer: CONFIG.TIMER_START,
  timerAcc: 0,
  elapsed: 0,             // waktu main (detik) untuk ringkasan
  camX: 0,
  time: 0,                // jam animasi global
  shake: 0,
  announceText: '',
  announceT: 0,
  bossRef: null,
  clearT: -1              // hitung mundur ke layar ringkasan setelah boss mati
};

const player = {
  x: 40, y: CONFIG.GROUND_Y - CONFIG.PLAYER_H, w: CONFIG.PLAYER_W, h: CONFIG.PLAYER_H,
  vx: 0, vy: 0, face: 1, onGround: true, crouch: false,
  aim: 'h',               // 'h' | 'up' | 'diag'
  state: 'normal',        // 'normal' | 'dead'
  deadT: 0, invulnT: 0, fireCd: 0, fireShowT: 0, throwT: 0,
  animT: 0, weapon: 'handgun', ammo: 0, grenades: CONFIG.START_GRENADES
};

let enemies = [];
let crates = [];
let pows = [];
let pickups = [];
let boss = null;

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
const bullets = makePool(CONFIG.BULLET_POOL, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, dmg: 1, kind: 'bullet', life: 0, face: 1 }));
const ebullets = makePool(CONFIG.EBULLET_POOL, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0 }));
const grenades = makePool(CONFIG.GRENADE_POOL, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, hostile: false, shell: false, fuse: 0 }));
const particles = makePool(CONFIG.PARTICLE_POOL, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 1, color: '#fff', grav: 0 }));
// Kotak coretan dipakai ulang untuk uji tabrakan & gambar entitas —
// dilarang membuat objek baru per frame di loop update/render (lihat KOREKSI.md).
const _box = { x: 0, y: 0, w: 0, h: 0 };
const _pbox = { x: 0, y: 0, w: 0, h: 0 };
const _ent = { x: 0, y: 0, w: 0, h: 0 };

function spawnParticles(x, y, count, colors, speed, life, size, grav) {
  for (let i = 0; i < count; i++) {
    const p = poolGet(particles);
    if (!p) return;
    const a = Math.random() * Math.PI * 2;
    const sp = speed * (0.3 + Math.random() * 0.7);
    p.active = true;
    p.x = x; p.y = y;
    p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - speed * 0.25;
    p.maxLife = life * (0.6 + Math.random() * 0.7);
    p.life = p.maxLife;
    p.size = size * (0.6 + Math.random() * 0.8);
    p.color = colors[(Math.random() * colors.length) | 0];
    p.grav = grav;
  }
}
function explosionFx(x, y, big) {
  spawnParticles(x, y, big ? 26 : 12, ['#f2c230', '#d84f35', '#e87e35', '#8f9296'], big ? 120 : 80, big ? 0.6 : 0.4, big ? 3 : 2, 60);
  spawnParticles(x, y, big ? 10 : 5, ['#5a5a5a', '#3a3a3a'], 30, 0.9, 3, -20);
}

/* ================= Input: keyboard + sentuh ========================= */
const keys = { left: false, right: false, up: false, down: false, fire: false, jump: false, grenade: false };
const touchKeys = { left: false, right: false, up: false, down: false, fire: false, jump: false, grenade: false };
let jumpPressed = false, grenadePressed = false; // edge-trigger per langkah

const KEYMAP = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  KeyZ: 'fire', KeyJ: 'fire', KeyX: 'jump', KeyK: 'jump', KeyC: 'grenade', KeyL: 'grenade'
};
// Hitungan tombol fisik per aksi: satu aksi bisa diikat ke dua tombol
// (mis. Z dan J untuk tembak) — aksi baru padam bila SEMUA tombolnya lepas.
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
});
window.addEventListener('keyup', (e) => {
  const k = KEYMAP[e.code];
  if (k) {
    keyCounts[k] = Math.max(0, keyCounts[k] - 1);
    keys[k] = keyCounts[k] > 0;
    e.preventDefault();
  }
});
// Jendela kehilangan fokus (pindah aplikasi/tab): keyup bisa terlewat dan
// tombol macet "menyala" selamanya — lepas semua input di sini.
window.addEventListener('blur', () => {
  for (const k in keys) { keys[k] = false; keyCounts[k] = 0; }
  for (const k in touchKeys) touchKeys[k] = false;
  jumpPressed = false;
  grenadePressed = false;
  const ons = document.querySelectorAll('.tbtn.on');
  for (let i = 0; i < ons.length; i++) ons[i].classList.remove('on');
});

// Tombol sentuh multi-pointer: setiap pointerId dilacak dan ditangkap
// (pointer capture) agar pointerup tetap sampai walau jari bergeser
// keluar dari tombol — tanpa capture tombol bisa macet "menyala".
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
      if (activePtrs.size > 0) return; // jari lain masih menahan tombol ini
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

/* ================= Skala canvas (integer, letterbox) ================ */
function resize() {
  const vw = window.innerWidth, vh = window.innerHeight;
  let scale = Math.floor(Math.min(vw / CONFIG.VIEW_W, vh / CONFIG.VIEW_H));
  if (scale < 1) scale = Math.min(vw / CONFIG.VIEW_W, vh / CONFIG.VIEW_H); // layar sangat kecil: pecahan
  const stage = document.getElementById('stage');
  stage.style.width = (CONFIG.VIEW_W * scale) + 'px';
  stage.style.height = (CONFIG.VIEW_H * scale) + 'px';
}
window.addEventListener('resize', resize);
resize();

/* ================= util tabrakan ==================================== */
function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
function announce(text) { G.announceText = text; G.announceT = 1.4; }
function addScore(n) { G.score += n; }

/* ================= Setup level & mulai ================================ */
function buildLevel() {
  enemies = ENEMY_DEFS.map((d) => ({
    type: d.type, x: d.x, y: (d.y !== undefined ? d.y - 24 : CONFIG.GROUND_Y - 24),
    w: d.type === 'shield' ? 18 : 16, h: 24,
    face: -1, state: 'idle', hp: 1, shieldHp: d.type === 'shield' ? 4 : 0,
    active: false, spawned: false, fireT: 1 + Math.random(), throwT: 1.5 + Math.random(), throwShowT: 0,
    animT: Math.random() * 0.4, deadT: 0, hitT: 0, fleeT: 0, vx: 0
  }));
  crates = CRATE_DEFS.map((d) => ({ x: d.x, y: CONFIG.GROUND_Y - 18, w: 18, h: 18, hp: 2, drop: d.drop, broken: false }));
  pows = POW_DEFS.map((d) => ({ x: d.x, y: CONFIG.GROUND_Y - 15, w: 14, h: 15, state: 'tied', walkT: 0, vx: 0, animT: 0 }));
  pickups = [];
  boss = {
    x: 2420, y: CONFIG.GROUND_Y - 38, w: 56, h: 38, hp: CONFIG.BOSS_HP,
    active: false, dead: false, dying: 0, dir: -1, moveT: 0, fireT: 2.2, hitT: 0, recoilT: 0
  };
  G.bossRef = boss;
}

function resetPools() {
  for (const arr of [bullets, ebullets, grenades, particles]) for (const o of arr) o.active = false;
}

function startGame() {
  AUDIO.init();
  AUDIO.startMusic();
  jumpPressed = false;      // cegah input tepi dari layar judul bocor ke permainan
  grenadePressed = false;
  G.screen = 'play';
  G.score = 0; G.lives = CONFIG.START_LIVES; G.powSaved = 0;
  G.timer = CONFIG.TIMER_START; G.timerAcc = 0; G.elapsed = 0;
  G.camX = 0; G.shake = 0; G.announceT = 0; G.clearT = -1;
  resetPools();
  buildLevel();
  Object.assign(player, {
    x: 40, y: CONFIG.GROUND_Y - CONFIG.PLAYER_H, vx: 0, vy: 0, face: 1,
    onGround: true, crouch: false, aim: 'h', state: 'normal', deadT: 0,
    invulnT: 0, fireCd: 0, fireShowT: 0, throwT: 0, animT: 0,
    weapon: 'handgun', ammo: 0, grenades: CONFIG.START_GRENADES, h: CONFIG.PLAYER_H
  });
  announce('Mission Start!');
  document.getElementById('titleScreen').classList.add('hidden');
  document.getElementById('endScreen').classList.add('hidden');
}

function endScreen(win) {
  G.screen = win ? 'clear' : 'over';
  AUDIO.stopMusic();
  const powBonus = G.powSaved * CONFIG.POW_BONUS;
  const total = G.score + powBonus;
  document.getElementById('endTitle').textContent = win ? 'MISI SELESAI!' : 'GAME OVER';
  document.getElementById('endStats').innerHTML =
    'SKOR&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ' + G.score + '<br>' +
    'POW DISELAMATKAN: ' + G.powSaved + ' x ' + CONFIG.POW_BONUS + ' = ' + powBonus + '<br>' +
    'WAKTU&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ' + Math.floor(G.elapsed) + ' detik<br>' +
    '<b>SKOR AKHIR&nbsp;: ' + total + '</b>';
  document.getElementById('endScreen').classList.remove('hidden');
}

/* ================= Senjata pemain =================================== */
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

// Cari target pisau tepat di depan pemain
function meleeTarget() {
  const box = {
    x: player.face > 0 ? player.x + player.w : player.x - CONFIG.MELEE_RANGE,
    y: player.y + 2, w: CONFIG.MELEE_RANGE, h: player.h - 4
  };
  for (const e of enemies) if (e.spawned && e.state !== 'dead' && overlap(box, e)) return { kind: 'enemy', obj: e };
  for (const c of crates) if (!c.broken && overlap(box, c)) return { kind: 'crate', obj: c };
  if (boss && boss.active && !boss.dead && overlap(box, boss)) return { kind: 'boss', obj: boss };
  return null;
}

function muzzlePos() {
  const cx = player.x + player.w / 2;
  if (player.crouch) return { x: cx + player.face * 12, y: player.y + 11 };
  if (player.aim === 'up') return { x: cx + player.face * 4, y: player.y - 2 };
  if (player.aim === 'diag') return { x: cx + player.face * 11, y: player.y + 1 };
  return { x: cx + player.face * 12, y: player.y + 8 };
}

function playerFire() {
  const w = WEAPONS[player.weapon];
  // Pisau otomatis bila ada target sangat dekat
  const mt = meleeTarget();
  if (mt) {
    player.fireCd = 0.32;
    player.fireShowT = 0.12;
    AUDIO.sMelee();
    spawnParticles(player.x + player.w / 2 + player.face * 12, player.y + 10, 4, ['#e8e4da', '#f2c230'], 70, 0.15, 1, 0);
    if (mt.kind === 'enemy') damageEnemy(mt.obj, 3, player.face);
    else if (mt.kind === 'crate') damageCrate(mt.obj, 1);
    else damageBoss(2);
    return;
  }
  player.fireCd = w.rate;
  player.fireShowT = 0.1;
  const m = muzzlePos();
  const aim = (player.aim === 'diag' && !w.diag) ? 'h' : player.aim; // hanya HMG bisa diagonal
  const spawn = (ang) => {
    const b = poolGet(bullets);
    if (!b) return;
    b.active = true; b.kind = player.weapon; b.dmg = w.dmg; b.face = player.face;
    b.x = m.x - 1; b.y = m.y - 1;
    b.life = player.weapon === 'shotgun' ? WEAPONS.shotgun.pelletLife : 1.6;
    if (aim === 'up') { b.vx = Math.sin(ang) * w.speed; b.vy = -Math.cos(ang) * w.speed; }
    else if (aim === 'diag') { b.vx = Math.cos(-Math.PI / 4 + ang) * w.speed * player.face; b.vy = Math.sin(-Math.PI / 4 + ang) * w.speed; }
    else { b.vx = Math.cos(ang) * w.speed * player.face; b.vy = Math.sin(ang) * w.speed; }
  };
  if (player.weapon === 'shotgun') {
    for (let i = 0; i < WEAPONS.shotgun.pellets; i++) spawn((i - 2) * 0.14);
    AUDIO.sShotgun();
    G.shake = Math.max(G.shake, 1.5);
  } else if (player.weapon === 'rocket') {
    spawn(0);
    AUDIO.sRocketLaunch();
  } else if (player.weapon === 'hmg') {
    spawn((Math.random() - 0.5) * 0.04);
    AUDIO.sHmg();
  } else {
    spawn(0);
    AUDIO.sShoot();
  }
  spawnParticles(m.x, m.y, 1, ['#f2c230'], 24, 0.06, 1, 0);
  // Konsumsi amunisi senjata spesial
  if (player.weapon !== 'handgun') {
    player.ammo--;
    if (player.ammo <= 0) { player.weapon = 'handgun'; player.ammo = 0; }
  }
}

function playerThrowGrenade() {
  if (player.grenades <= 0) return;
  const g = poolGet(grenades);
  if (!g) return;
  player.grenades--;
  player.throwT = 0.25;
  g.active = true; g.hostile = false; g.shell = false; g.fuse = 2.5;
  g.x = player.x + player.w / 2; g.y = player.y + 4;
  g.vx = player.face * 95 + player.vx * 0.4;
  g.vy = -165;
  AUDIO.sThrow();
}

/* ================= Kerusakan & kematian =============================== */
function damageEnemy(e, dmg, fromDir) {
  if (e.state === 'dead') return;
  // Perisai menahan tembakan dari arah depan Shield Soldier:
  // fromDir = arah gerak proyektil; perisai menghadap ke e.face.
  if (e.type === 'shield' && e.shieldHp > 0 && fromDir !== undefined) {
    const hitsShield = (fromDir > 0 && e.face < 0) || (fromDir < 0 && e.face > 0);
    if (hitsShield) {
      e.shieldHp--;
      AUDIO.sShieldClank();
      spawnParticles(e.x + (e.face < 0 ? 0 : e.w), e.y + 10, 3, ['#f2c230', '#e8e4da'], 60, 0.15, 1, 120);
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
  spawnParticles(e.x + e.w / 2, e.y + 10, 6, ['#d84f35', '#f2c230'], 60, 0.3, 2, 100);
}

function damageCrate(c, dmg) {
  if (c.broken) return;
  c.hp -= dmg;
  AUDIO.sHit();
  if (c.hp <= 0) {
    c.broken = true;
    spawnParticles(c.x + 9, c.y + 9, 8, ['#a9713f', '#6e3d20', '#f2c230'], 70, 0.35, 2, 160);
    AUDIO.sExplosion(false);
    spawnPickup(c.x + 3, c.y, c.drop);
  }
}

function spawnPickup(x, y, kind) {
  pickups.push({ x: x, y: y, w: 12, h: 10, vy: 0, kind: kind, t: 0 });
}

function damageBoss(dmg) {
  if (!boss || boss.dead || !boss.active) return;
  boss.hp -= dmg;
  boss.hitT = 0.07;
  AUDIO.sHit();
  if (boss.hp <= 0 && boss.dying <= 0) {
    boss.dying = 1.6;
    addScore(CONFIG.BOSS_SCORE);
    AUDIO.sExplosion(true);
  }
}

// Ledakan area: granat pemain merusak musuh/boss/peti; granat musuh merusak pemain
function explodeAt(x, y, hostile, shell) {
  const radius = shell ? 30 : 26;
  explosionFx(x, y, shell);
  AUDIO.sExplosion(shell);
  G.shake = Math.max(G.shake, shell ? 3 : 2);
  if (hostile) {
    const pc = { x: player.x + player.w / 2, y: player.y + player.h / 2 };
    const dx = pc.x - x, dy = pc.y - y;
    if (dx * dx + dy * dy <= radius * radius && player.state === 'normal' && player.invulnT <= 0) killPlayer();
  } else {
    for (const e of enemies) {
      if (!e.spawned || e.state === 'dead') continue;
      const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
      const dx = ex - x, dy = ey - y;
      if (dx * dx + dy * dy <= (radius + 8) * (radius + 8)) damageEnemy(e, 3, dx >= 0 ? 1 : -1);
    }
    for (const c of crates) {
      if (c.broken) continue;
      const dx = c.x + 9 - x, dy = c.y + 9 - y;
      if (dx * dx + dy * dy <= (radius + 8) * (radius + 8)) damageCrate(c, 2);
    }
    if (boss && boss.active && !boss.dead) {
      const dx = boss.x + boss.w / 2 - x, dy = boss.y + boss.h / 2 - y;
      if (dx * dx + dy * dy <= (radius + 20) * (radius + 20)) damageBoss(3);
    }
  }
}

function killPlayer() {
  if (player.state !== 'normal' || player.invulnT > 0) return;
  player.state = 'dead';
  player.deadT = 1.15;
  player.vy = -160;
  AUDIO.sPlayerHit();
  spawnParticles(player.x + player.w / 2, player.y + 10, 10, ['#d84f35', '#f2c230'], 80, 0.4, 2, 120);
}

function respawnPlayer() {
  G.lives--;
  if (G.lives <= 0) { endScreen(false); return; }
  player.state = 'normal';
  player.h = CONFIG.PLAYER_H; // pulihkan tinggi penuh (bila mati saat jongkok)
  player.y = CONFIG.GROUND_Y - player.h;
  player.vy = 0; player.vx = 0;
  player.invulnT = CONFIG.RESPAWN_INVULN;
  player.weapon = 'handgun'; player.ammo = 0; // senjata spesial hilang saat respawn? (dipertahankan skor & POW)
  player.grenades = Math.max(player.grenades, 3);
}

/* ================= Update pemain ==================================== */
function updatePlayer(dt) {
  const p = player;
  if (p.state === 'dead') {
    p.deadT -= dt;
    p.vy += CONFIG.GRAVITY * dt;
    p.y += p.vy * dt;
    if (p.y > CONFIG.GROUND_Y - 10) p.y = CONFIG.GROUND_Y - 10;
    if (p.deadT <= 0) respawnPlayer();
    return;
  }
  if (p.invulnT > 0) p.invulnT -= dt;
  if (p.fireCd > 0) p.fireCd -= dt;
  if (p.fireShowT > 0) p.fireShowT -= dt;
  if (p.throwT > 0) p.throwT -= dt;
  p.animT += dt;

  const L = input('left'), R = input('right'), U = input('up'), D = input('down');
  if (R && !L) p.face = 1; else if (L && !R) p.face = -1;

  // Jongkok hanya di tanah. Saat tinggi kotak berubah, geser y sebesar
  // selisihnya agar kaki tetap menapak (tanpa ini pemain melayang sesaat
  // lalu jatuh 7px setiap kali mulai/berhenti jongkok).
  p.crouch = D && p.onGround;
  const targetH = p.crouch ? CONFIG.PLAYER_H_CROUCH : CONFIG.PLAYER_H;
  if (targetH !== p.h) {
    if (p.onGround) p.y += p.h - targetH;
    p.h = targetH;
  }

  // Arah aim
  if (p.crouch) p.aim = 'h';
  else if (U && (L || R)) p.aim = 'diag';
  else if (U) p.aim = 'up';
  else p.aim = 'h';

  // Gerak horizontal
  p.vx = 0;
  if (!p.crouch) {
    if (L) p.vx = -CONFIG.PLAYER_SPEED;
    if (R) p.vx = CONFIG.PLAYER_SPEED;
  }
  p.x += p.vx * dt;

  // Lompat (edge-trigger)
  if (jumpPressed && p.onGround && !p.crouch) {
    p.vy = CONFIG.PLAYER_JUMP_VEL;
    p.onGround = false;
    AUDIO.sJump();
  }

  // Gravitasi & tabrakan vertikal (platform satu arah + tanah)
  const prevBottom = p.y + p.h;
  p.vy += CONFIG.GRAVITY * dt;
  if (p.vy > 420) p.vy = 420;
  p.y += p.vy * dt;
  p.onGround = false;
  if (p.vy >= 0) {
    for (const pl of PLATFORMS) {
      if (p.x + p.w > pl.x + 2 && p.x < pl.x + pl.w - 2) {
        const top = pl.y;
        if (prevBottom <= top + 1 && p.y + p.h >= top) { p.y = top - p.h; p.vy = 0; p.onGround = true; }
      }
    }
    if (p.y + p.h >= CONFIG.GROUND_Y) { p.y = CONFIG.GROUND_Y - p.h; p.vy = 0; p.onGround = true; }
  }
  if (p.y < -40) p.y = -40;

  // Batas level; pemain tidak bisa melewati tank selama boss hidup
  p.x = clamp(p.x, 4, CONFIG.LEVEL_W - 20);
  if (boss && boss.active && !boss.dead) p.x = Math.min(p.x, boss.x - p.w - 2);

  // Tembak (tahan = auto-fire)
  if (input('fire') && p.fireCd <= 0 && p.throwT <= 0) playerFire();
  // Granat (edge-trigger)
  if (grenadePressed && p.onGround) playerThrowGrenade();

  // Sentuh POW terikat -> bebaskan
  for (const pw of pows) {
    if (pw.state === 'tied' && overlap(p, pw)) freePow(pw);
  }
  // Ambil pickup
  for (let i = pickups.length - 1; i >= 0; i--) {
    const pk = pickups[i];
    if (overlap(p, pk)) {
      applyPickup(pk.kind);
      pickups.splice(i, 1);
    }
  }
}

function applyPickup(kind) {
  if (kind === 'grenade') { addGrenades(5); announce('Granat +5'); }
  else giveWeapon(kind);
}

function freePow(pw) {
  if (pw.state !== 'tied') return;
  pw.state = 'free';
  pw.walkT = 1.6;
  pw.y = CONFIG.GROUND_Y - 22;
  pw.h = 22;
  AUDIO.sPowFree();
}

function rewardPow(pw) {
  pw.state = 'done';
  pw.walkT = 0.7;
  G.powSaved++;
  const roll = Math.random();
  if (roll < 0.3) giveWeapon('hmg');
  else if (roll < 0.5) giveWeapon('rocket');
  else if (roll < 0.65) giveWeapon('shotgun');
  else if (roll < 0.85) { addGrenades(5); }
  else addScore(CONFIG.POW_ITEM_SCORE);
  announce('Thank You!');
}

/* ================= Update musuh ===================================== */
function updateEnemies(dt) {
  const pcx = player.x + player.w / 2;
  for (const e of enemies) {
    if (!e.spawned) {
      if (e.x < G.camX + CONFIG.VIEW_W + 30 && e.x > G.camX - 60) e.spawned = true;
      else continue;
    }
    if (e.hitT > 0) e.hitT -= dt;
    e.animT += dt;
    const ecx = e.x + e.w / 2;
    const dist = Math.abs(pcx - ecx);
    const dirToPlayer = pcx < ecx ? -1 : 1;

    if (e.state === 'dead') {
      e.deadT -= dt;
      continue;
    }
    if (e.state === 'flee') {
      e.fleeT += dt;
      e.x += -e.face * 70 * dt; // kabur berlawanan arah hadap (menjauhi pemain)
      if (e.fleeT > 2.2) e.spawned = false;
      continue;
    }
    if (player.state !== 'normal') continue;

    // FSM: idle -> alert -> attack
    if (e.state === 'idle') {
      if (dist < 150) e.state = 'alert';
      else continue;
    }
    e.face = dirToPlayer;

    if (e.type === 'grenade') {
      // Diam di tempat, melempar granat melengkung berkala
      e.throwT -= dt;
      if (dist < 230 && e.throwT <= 0) {
        e.throwT = 2.3;
        e.throwShowT = 0.35;
        const g = poolGet(grenades);
        if (g) {
          const tFly = 0.95;
          g.active = true; g.hostile = true; g.shell = false; g.fuse = 3;
          g.x = ecx; g.y = e.y + 2;
          g.vx = (pcx - ecx) / tFly;
          g.vy = -0.5 * CONFIG.GRAVITY * tFly;
          AUDIO.sThrow();
        }
      }
      if (e.throwShowT > 0) e.throwShowT -= dt;
      continue;
    }

    // Rebel & Shield: mendekat, berhenti, menembak berkala
    const stopDist = e.type === 'shield' ? 62 : 52;
    if (dist > stopDist) {
      e.x += dirToPlayer * (e.type === 'shield' ? 26 : 34) * dt;
    } else {
      e.fireT -= dt;
      if (e.fireT <= 0) {
        e.fireT = e.type === 'shield' ? 1.9 : 1.55;
        const b = poolGet(ebullets);
        if (b) {
          b.active = true;
          b.x = ecx + e.face * (e.w / 2 + 2);
          b.y = e.y + 8;
          b.vx = e.face * 130;
          b.vy = 0;
          AUDIO.sShoot();
        }
      }
    }
  }
  // Buang musuh mati yang animasinya selesai
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].state === 'dead' && enemies[i].deadT <= 0) enemies.splice(i, 1);
  }
}

/* ================= Update boss ====================================== */
function updateBoss(dt) {
  if (!boss) return;
  if (!boss.active) {
    if (player.x > CONFIG.ARENA_TRIGGER_X && player.state === 'normal') {
      boss.active = true;
      announce('OK!');
      AUDIO.sPickup();
    } else return;
  }
  if (boss.dead) return;
  if (boss.hitT > 0) boss.hitT -= dt;
  if (boss.recoilT > 0) boss.recoilT -= dt;

  if (boss.dying > 0) {
    boss.dying -= dt;
    // Ledakan beruntun selama sekarat
    if (Math.random() < 0.35) {
      explosionFx(boss.x + Math.random() * boss.w, boss.y + Math.random() * boss.h, false);
      AUDIO.sExplosion(false);
      G.shake = Math.max(G.shake, 2.5);
    }
    if (boss.dying <= 0) {
      boss.dead = true;
      explosionFx(boss.x + boss.w / 2, boss.y + boss.h / 2, true);
      AUDIO.sExplosion(true);
      G.shake = 5;
      announce('Mission Complete!');
      G.clearT = 2.4;
    }
    return;
  }

  // Gerak pelan maju-mundur
  boss.moveT -= dt;
  if (boss.moveT <= 0) { boss.moveT = 1.6 + Math.random(); boss.dir = boss.dir * -1; }
  boss.x += boss.dir * 11 * dt;
  boss.x = clamp(boss.x, 2330, 2505);

  // Meriam melengkung berkala ke arah pemain
  if (player.state === 'normal') {
    boss.fireT -= dt;
    if (boss.fireT <= 0) {
      boss.fireT = 2.1;
      boss.recoilT = 0.18;
      const g = poolGet(grenades);
      if (g) {
        const sx = boss.x + 2, sy = boss.y + 14;
        const pcx = player.x + player.w / 2;
        const tFly = 1.1;
        g.active = true; g.hostile = true; g.shell = true; g.fuse = 3;
        g.x = sx; g.y = sy;
        g.vx = (pcx - sx) / tFly;
        g.vy = -0.5 * CONFIG.GRAVITY * tFly; // parabola murni: jatuh tepat di akhir tFly
        AUDIO.sRocketLaunch();
      }
    }
  }
}

/* ================= Update proyektil, POW, partikel =================== */
function updateProjectiles(dt) {
  // Peluru pemain
  for (const b of bullets) {
    if (!b.active) continue;
    b.life -= dt;
    if (b.life <= 0) { b.active = false; continue; }
    // Homing ringan roket: belok ke musuh terdekat
    if (b.kind === 'rocket') {
      let bestDx = 0, bestDy = 0, bestD = 190, hasBest = false;
      for (const e of enemies) {
        if (!e.spawned || e.state === 'dead') continue;
        const dx = e.x + e.w / 2 - b.x, dy = e.y + e.h / 2 - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < bestD) { bestD = d; bestDx = dx; bestDy = dy; hasBest = true; }
      }
      if (boss && boss.active && !boss.dead) {
        const dx = boss.x + boss.w / 2 - b.x, dy = boss.y + boss.h / 2 - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < bestD) { bestD = d; bestDx = dx; bestDy = dy; hasBest = true; }
      }
      if (hasBest) {
        const cur = Math.atan2(b.vy, b.vx);
        const want = Math.atan2(bestDy, bestDx);
        let diff = want - cur;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const turn = clamp(diff, -5.5 * dt, 5.5 * dt);
        const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        const na = cur + turn;
        b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp;
      }
      if (Math.random() < 0.6) spawnParticles(b.x, b.y, 1, ['#e8e4da', '#8f9296'], 8, 0.25, 1, 0);
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    _box.x = b.x; _box.y = b.y; _box.w = 3; _box.h = 2;
    const box = _box;
    let consumed = false;
    // Kena musuh
    for (const e of enemies) {
      if (!e.spawned || e.state === 'dead') continue;
      if (overlap(box, e)) {
        if (b.kind === 'rocket') { explodeAt(b.x, b.y, false, false); }
        else damageEnemy(e, b.dmg, b.vx > 0 ? 1 : -1);
        consumed = true; break;
      }
    }
    if (!consumed && boss && boss.active && !boss.dead && overlap(box, boss)) {
      if (b.kind === 'rocket') explodeAt(b.x, b.y, false, false);
      else damageBoss(b.dmg);
      consumed = true;
    }
    if (!consumed) {
      for (const c of crates) {
        if (c.broken) continue;
        if (overlap(box, c)) {
          if (b.kind === 'rocket') explodeAt(b.x, b.y, false, false);
          else damageCrate(c, b.dmg);
          consumed = true; break;
        }
      }
    }
    if (!consumed) {
      // Tembak ikatan POW -> bebaskan
      for (const pw of pows) {
        if (pw.state === 'tied' && overlap(box, pw)) { freePow(pw); consumed = true; break; }
      }
    }
    if (!consumed && (b.y >= CONFIG.GROUND_Y - 1 || b.x < 0 || b.x > CONFIG.LEVEL_W || b.y < -30)) {
      if (b.kind === 'rocket') explodeAt(b.x, Math.min(b.y, CONFIG.GROUND_Y - 2), false, false);
      else spawnParticles(b.x, b.y, 2, ['#f2c230'], 30, 0.12, 1, 60);
      consumed = true;
    }
    if (consumed) b.active = false;
  }

  // Peluru musuh (kotak pemain dihitung sekali — pemain tidak bergerak
  // selama update proyektil)
  _pbox.x = player.x + 1; _pbox.y = player.y + 2; _pbox.w = player.w - 2; _pbox.h = player.h - 2;
  for (const b of ebullets) {
    if (!b.active) continue;
    b.x += b.vx * dt;
    if (b.x < G.camX - 40 || b.x > G.camX + CONFIG.VIEW_W + 40 || b.y > CONFIG.GROUND_Y) { b.active = false; continue; }
    if (player.state === 'normal' && player.invulnT <= 0) {
      _box.x = b.x - 1; _box.y = b.y - 1; _box.w = 3; _box.h = 2;
      if (overlap(_box, _pbox)) { b.active = false; killPlayer(); }
    }
  }

  // Granat & peluru meriam (parabolik)
  for (const g of grenades) {
    if (!g.active) continue;
    g.fuse -= dt;
    g.vy += CONFIG.GRAVITY * dt;
    g.x += g.vx * dt;
    g.y += g.vy * dt;
    let boom = false;
    if (g.y >= CONFIG.GROUND_Y - 2) { g.y = CONFIG.GROUND_Y - 2; boom = true; }
    for (const pl of PLATFORMS) {
      if (g.vy > 0 && g.x > pl.x && g.x < pl.x + pl.w && g.y >= pl.y - 2 && g.y <= pl.y + 6) boom = true;
    }
    if (g.fuse <= 0) boom = true;
    if (!g.hostile && boss && boss.active && !boss.dead) {
      _box.x = g.x - 2; _box.y = g.y - 2; _box.w = 4; _box.h = 4;
      if (overlap(_box, boss)) boom = true;
    }
    if (boom) { g.active = false; explodeAt(g.x, g.y, g.hostile, g.shell); }
  }

  // POW bebas: berjalan pelan, lalu menunggu disentuh
  for (const pw of pows) {
    pw.animT += dt;
    if (pw.state === 'free') {
      if (pw.walkT > 0) { pw.walkT -= dt; pw.x += 13 * dt; }
      else if (player.state === 'normal' && overlap(player, pw)) rewardPow(pw);
    } else if (pw.state === 'done') {
      pw.walkT -= dt;
    }
  }

  // Pickup jatuh ke tanah, kedip, hilang setelah 9 detik
  for (let i = pickups.length - 1; i >= 0; i--) {
    const pk = pickups[i];
    pk.t += dt;
    if (pk.y + pk.h < CONFIG.GROUND_Y) { pk.vy += CONFIG.GRAVITY * dt; pk.y += pk.vy * dt; if (pk.y + pk.h > CONFIG.GROUND_Y) pk.y = CONFIG.GROUND_Y - pk.h; }
    if (pk.t > 9) pickups.splice(i, 1);
  }

  // Partikel
  for (const p of particles) {
    if (!p.active) continue;
    p.life -= dt;
    if (p.life <= 0) { p.active = false; continue; }
    p.vy += p.grav * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

/* ================= Update utama ===================================== */
function update(dt) {
  G.time += dt;
  if (G.announceT > 0) G.announceT -= dt;
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 9);
  if (G.screen !== 'play') return;

  G.elapsed += dt;
  // Timer misi hitung mundur
  G.timerAcc += dt;
  while (G.timerAcc >= 1) {
    G.timerAcc -= 1;
    G.timer--;
    if (G.timer <= 0) { G.timer = 0; if (player.state === 'normal') { killPlayer(); G.timer = 30; } }
  }

  updatePlayer(dt);
  updateEnemies(dt);
  updateBoss(dt);
  updateProjectiles(dt);

  // Kamera mengikuti pemain
  const target = clamp(player.x + player.w / 2 - 130, 0, CONFIG.LEVEL_W - CONFIG.VIEW_W);
  G.camX += (target - G.camX) * Math.min(1, dt * 8);
  if (Math.abs(target - G.camX) < 0.4) G.camX = target;

  // Setelah boss mati: jeda drama -> ringkasan
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
// Gambar sprite dengan jangkar bawah-tengah terhadap kotak entitas
function drawEntitySprite(img, e, flip) {
  const dx = e.x + e.w / 2 - img.width / 2;
  const dy = e.y + e.h - img.height;
  drawSprite(img, dx, dy, flip);
}

function render() {
  const camX = Math.round(G.camX);
  const shakeX = G.shake > 0 ? (Math.random() - 0.5) * G.shake : 0;
  const shakeY = G.shake > 0 ? (Math.random() - 0.5) * G.shake : 0;
  ctx.save();
  ctx.translate(Math.round(shakeX), Math.round(shakeY));

  // Langit & pegunungan (parallax 0.3)
  const farOff = -Math.floor(camX * 0.3) % 640;
  ctx.drawImage(SPR.bgFar, farOff, 0);
  ctx.drawImage(SPR.bgFar, farOff + 640, 0);
  // Siluet dekat (parallax 0.6)
  const nearOff = -Math.floor(camX * 0.6) % 640;
  ctx.drawImage(SPR.bgNear, nearOff, 0);
  ctx.drawImage(SPR.bgNear, nearOff + 640, 0);

  // Tanah
  const gOff = -(camX % 64);
  for (let x = gOff; x < CONFIG.VIEW_W; x += 64) ctx.drawImage(SPR.groundTile, x, CONFIG.GROUND_Y);
  // Sisi gelap di bawah tanah
  ctx.fillStyle = '#4a3823';
  ctx.fillRect(0, CONFIG.GROUND_Y + 32, CONFIG.VIEW_W, CONFIG.VIEW_H - CONFIG.GROUND_Y - 32);

  // Platform
  for (const pl of PLATFORMS) {
    const sx = pl.x - camX;
    if (sx + pl.w < 0 || sx > CONFIG.VIEW_W) continue;
    for (let x = 0; x < pl.w; x += 32) {
      const cw = Math.min(32, pl.w - x);
      // Potong sumber sebesar cw — jangan regangkan seluruh ubin ke sisa lebar
      ctx.drawImage(SPR.woodTile, 0, 0, cw, 10, sx + x, pl.y, cw, 10);
    }
    // kaki penyangga
    ctx.fillStyle = '#6e3d20';
    ctx.fillRect(sx + 4, pl.y + 10, 4, CONFIG.GROUND_Y - pl.y - 10);
    ctx.fillRect(sx + pl.w - 8, pl.y + 10, 4, CONFIG.GROUND_Y - pl.y - 10);
  }

  // Dekorasi
  for (const d of DECOR) {
    const img = d.kind === 'barrel' ? SPR.barrel : SPR.sign;
    const sx = d.x - camX;
    if (sx + img.width < 0 || sx > CONFIG.VIEW_W) continue;
    ctx.drawImage(img, sx, CONFIG.GROUND_Y - img.height);
  }

  // Peti
  for (const c of crates) {
    if (c.broken) continue;
    ctx.drawImage(SPR.crate, c.x - camX, c.y);
  }

  // POW
  for (const pw of pows) {
    if (pw.state === 'done' && pw.walkT <= 0) continue;
    const sx = pw.x - camX;
    if (sx + 20 < 0 || sx > CONFIG.VIEW_W) continue;
    let img;
    if (pw.state === 'tied') img = SPR.powTied;
    else if (pw.state === 'done') img = SPR.powWave;
    else img = SPR.powWalk[(pw.animT * 5) % 2 | 0];
    _ent.x = sx; _ent.y = pw.y; _ent.w = pw.w; _ent.h = pw.h;
    drawEntitySprite(img, _ent, false);
  }

  // Pickup senjata
  for (const pk of pickups) {
    if (pk.t > 7.5 && (pk.t * 6 | 0) % 2 === 0) continue; // kedip sebelum hilang
    const img = pk.kind === 'grenade' ? SPR.iconGrenade : SPR[WEAPON_ICON[pk.kind]];
    const bob = Math.sin(pk.t * 4) * 1.5;
    ctx.drawImage(img, Math.round(pk.x - camX - 2), Math.round(pk.y - 6 + bob));
  }

  // Musuh
  for (const e of enemies) {
    if (!e.spawned) continue;
    const sx = e.x - camX;
    if (sx + 40 < 0 || sx > CONFIG.VIEW_W + 10) continue;
    _ent.x = sx; _ent.y = e.y; _ent.w = e.w; _ent.h = e.h;
    const ee = _ent;
    const flip = e.face > 0; // sprite dasar menghadap kiri
    if (e.state === 'dead') {
      // jatuh berputar lalu hilang
      const img = e.type === 'shield' ? SPR.shieldWalk[0] : (e.type === 'grenade' ? SPR.greIdle : SPR.rebelWalk[0]);
      ctx.save();
      ctx.translate(sx + e.w / 2, e.y + e.h / 2);
      ctx.rotate(-(1 - Math.max(0, e.deadT) / 0.38) * 1.5 * (e.face > 0 ? -1 : 1));
      ctx.globalAlpha = Math.max(0, e.deadT / 0.38);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
      continue;
    }
    let img;
    if (e.type === 'rebel') img = (Math.abs(player.x - e.x) > 54 && e.state !== 'idle') ? SPR.rebelWalk[(e.animT * 6) % 2 | 0] : SPR.rebelShoot;
    else if (e.type === 'shield') img = e.state === 'flee' ? SPR.shieldBroken : SPR.shieldWalk[(e.animT * 6) % 2 | 0];
    else img = (e.throwShowT > 0) ? SPR.greThrow : SPR.greIdle;
    drawEntitySprite(img, ee, flip);
    if (e.hitT > 0) { // kilatan merah kena hit
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.globalCompositeOperation = 'lighter';
      drawEntitySprite(img, ee, flip);
      ctx.restore();
    }
  }

  // Boss
  if (boss && boss.active && !boss.dead) {
    const sx = boss.x - camX;
    if (sx + 70 > 0 && sx < CONFIG.VIEW_W + 10) {
      const recoil = boss.recoilT > 0 ? 2 : 0;
      ctx.drawImage(boss.hitT > 0 ? SPR.tankFlash : SPR.tank, Math.round(sx + recoil), Math.round(boss.y));
      // Bar HP boss
      if (boss.dying <= 0) {
        ctx.fillStyle = '#20242a';
        ctx.fillRect(Math.round(sx), boss.y - 9, 56, 5);
        ctx.fillStyle = '#d84f35';
        ctx.fillRect(Math.round(sx) + 1, boss.y - 8, 54 * Math.max(0, boss.hp) / CONFIG.BOSS_HP, 3);
      }
    }
  }

  // Pemain
  if (!(player.state === 'normal' && player.invulnT > 0 && (G.time * 14 | 0) % 2 === 0)) {
    drawPlayer(camX);
  }

  // Proyektil pemain
  for (const b of bullets) {
    if (!b.active) continue;
    const sx = b.x - camX;
    if (b.kind === 'rocket') {
      ctx.fillStyle = '#e8e4da';
      ctx.fillRect(Math.round(sx), Math.round(b.y), 6, 3);
      ctx.fillStyle = '#d84f35';
      ctx.fillRect(Math.round(sx) + (b.vx > 0 ? 0 : 4), Math.round(b.y), 2, 3);
    } else if (b.kind === 'shotgun') {
      ctx.fillStyle = '#f2c230';
      ctx.fillRect(Math.round(sx), Math.round(b.y), 2, 2);
    } else {
      ctx.fillStyle = '#ffe9a8';
      ctx.fillRect(Math.round(sx), Math.round(b.y), b.kind === 'hmg' ? 3 : 4, 1);
    }
  }
  // Peluru musuh
  ctx.fillStyle = '#ff9d5c';
  for (const b of ebullets) {
    if (!b.active) continue;
    ctx.fillRect(Math.round(b.x - camX), Math.round(b.y), 3, 2);
  }
  // Granat & peluru meriam
  for (const g of grenades) {
    if (!g.active) continue;
    const sx = g.x - camX;
    if (g.shell) {
      ctx.fillStyle = '#3b4046';
      ctx.fillRect(Math.round(sx) - 2, Math.round(g.y) - 2, 5, 5);
      ctx.fillStyle = '#f2c230';
      ctx.fillRect(Math.round(sx) - 1, Math.round(g.y) - 1, 2, 2);
    } else {
      ctx.fillStyle = g.hostile ? '#8f2f2f' : '#3e5c2b';
      ctx.fillRect(Math.round(sx) - 1, Math.round(g.y) - 1, 3, 3);
    }
  }

  // Partikel
  for (const p of particles) {
    if (!p.active) continue;
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x - camX), Math.round(p.y), p.size, p.size);
  }
  ctx.globalAlpha = 1;

  ctx.restore();

  // Teks announcer (di atas segalanya, tanpa guncangan)
  if (G.announceT > 0 && G.announceText) {
    const t = G.announceT;
    const scale = t > 1.25 ? 1 + (t - 1.25) * 2.2 : 1;
    ctx.save();
    ctx.translate(CONFIG.VIEW_W / 2, 62);
    ctx.scale(scale, scale);
    ctx.font = 'bold 19px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#20242a';
    ctx.strokeText(G.announceText, 0, 0);
    ctx.fillStyle = '#f2c230';
    ctx.fillText(G.announceText, 0, 0);
    ctx.restore();
  }
}

function drawPlayer(camX) {
  const p = player;
  const sx = p.x - camX;
  _ent.x = sx; _ent.y = p.y; _ent.w = p.w; _ent.h = p.h;
  const pe = _ent;
  const flip = p.face < 0;
  let img;
  if (p.state === 'dead') {
    img = p.deadT > 0.7 ? SPR.pDie0 : SPR.pDie1;
    ctx.drawImage(img, Math.round(sx + p.w / 2 - img.width / 2), Math.round(p.y + p.h - img.height));
    return;
  }
  if (p.throwT > 0) img = SPR.pThrow;
  else if (p.crouch) img = p.fireShowT > 0 ? SPR.pCrouchFire : SPR.pCrouch;
  else if (!p.onGround) img = p.aim === 'up' ? SPR.pJumpUp : (p.aim === 'diag' ? SPR.pJumpDiag : SPR.pJumpH);
  else if (p.vx !== 0) img = SPR.pRun[(p.animT * 9) % 4 | 0];
  else if (p.fireShowT > 0 || input('fire')) img = p.aim === 'up' ? SPR.pFireUp : (p.aim === 'diag' ? SPR.pFireDiag : SPR.pFireH);
  else img = SPR.pIdle;
  drawEntitySprite(img, pe, flip);
}

/* ================= HUD (canvas terpisah, gambar ulang saat berubah) = */
let hudCache = '';
function renderHUD() {
  const key = [G.score, G.lives, player.weapon, player.ammo, player.grenades, G.timer, G.powSaved, G.screen].join('|');
  if (key === hudCache) return;
  hudCache = key;
  hudCtx.clearRect(0, 0, CONFIG.VIEW_W, CONFIG.VIEW_H);
  if (G.screen === 'title') return;
  hudCtx.font = 'bold 9px "Courier New", monospace';
  hudCtx.textAlign = 'left';
  // Skor kiri atas
  hudCtx.fillStyle = '#20242a';
  hudCtx.fillText('SKOR', 7, 11);
  hudCtx.fillStyle = '#ffffff';
  hudCtx.fillText('SKOR', 6, 10);
  hudCtx.fillStyle = '#f2c230';
  hudCtx.fillText(String(G.score).padStart(6, '0'), 34, 10);
  // Nyawa
  hudCtx.fillStyle = '#ffffff';
  hudCtx.fillText('NYAWA x' + Math.max(0, G.lives - 1), 6, 21);
  // Senjata & amunisi
  const wname = WEAPONS[player.weapon].name;
  const ammoTxt = player.weapon === 'handgun' ? 'ARMS ∞' : 'ARMS ' + player.ammo;
  hudCtx.fillText(wname, 6, 32);
  hudCtx.fillStyle = '#7ec8e3';
  hudCtx.fillText(ammoTxt, 6, 43);
  hudCtx.fillStyle = '#ffffff';
  hudCtx.fillText('BOMB x' + player.grenades, 52, 43);
  // Timer tengah atas
  hudCtx.textAlign = 'center';
  hudCtx.font = 'bold 13px "Courier New", monospace';
  hudCtx.fillStyle = G.timer <= 10 ? '#d84f35' : '#ffffff';
  hudCtx.fillText(String(Math.max(0, G.timer)), CONFIG.VIEW_W / 2, 13);
  // POW kanan atas
  hudCtx.textAlign = 'right';
  hudCtx.font = 'bold 9px "Courier New", monospace';
  hudCtx.fillStyle = '#ffffff';
  hudCtx.fillText('POW x' + G.powSaved, CONFIG.VIEW_W - 6, 10);
  hudCtx.textAlign = 'left';
}

/* ================= Loop utama: fixed timestep + fallback 30fps ===== */
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

  // Deteksi kelambatan berkelanjutan -> turun ke 30 fps; pulih -> 60 fps
  if (dt > 0.021) { slowFrames++; fastFrames = 0; } else { fastFrames++; slowFrames = 0; }
  if (STEP === 1 / 60 && slowFrames > 90) { STEP = 1 / 30; slowFrames = 0; }
  else if (STEP === 1 / 30 && fastFrames > 240) { STEP = 1 / 60; fastFrames = 0; }

  if (dt > 0.25) dt = 0.25; // hindari spiral setelah tab tidak aktif
  accumulator += dt;
  let steps = 0;
  while (accumulator >= STEP && steps < 3) {
    update(STEP);
    accumulator -= STEP;
    steps++;
  }
  if (steps === 3) accumulator = 0; // buang sisa agar tidak menumpuk
  render();
  renderHUD();
}
requestAnimationFrame(frame);

/* ================= Tombol UI & mute ================================= */
function toggleMute() {
  AUDIO.setMuted(!AUDIO.muted);
  document.getElementById('muteBtn').textContent = AUDIO.muted ? '🔇' : '🔊';
}
document.getElementById('muteBtn').addEventListener('click', () => { AUDIO.init(); toggleMute(); });
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('againBtn').addEventListener('click', startGame);
document.getElementById('menuBtn').addEventListener('click', () => {
  AUDIO.stopMusic();
  G.screen = 'title';
  G.announceT = 0;
  G.announceText = '';
  document.getElementById('endScreen').classList.add('hidden');
  document.getElementById('titleScreen').classList.remove('hidden');
});
