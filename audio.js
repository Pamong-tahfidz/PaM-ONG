'use strict';
/* =====================================================================
   PaM-ONG — audio.js (v2)
   Semua suara DISINTESIS dengan WebAudio: SFX pendek + loop musik
   chiptune sederhana (bass + melodi + noise perkusi).
   Audio hanya mulai setelah gestur pengguna (tombol MULAI).
   v2: saklar musik & SFX terpisah (musicOn / sfxOn) untuk menu
   PENGATURAN; setMuted() lama dipertahankan sebagai saklar utama.
   ===================================================================== */

const AUDIO = {
  ctx: null,
  master: null,
  sfxGain: null,
  musicGain: null,
  muted: false,
  musicOn: true,
  sfxOn: true,
  musicTimer: null,
  nextNoteTime: 0,
  step: 0,

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.9;
    this.sfxGain.connect(this.master);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.5;
    this.musicGain.connect(this.master);
  },

  // Saklar utama (tombol mute lama / tombol M)
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.9;
  },
  // Saklar per kanal dari menu Pengaturan
  setMusicOn(on) {
    this.musicOn = on;
    if (this.musicGain && this.ctx) this.musicGain.gain.setTargetAtTime(on ? 0.5 : 0, this.ctx.currentTime, 0.02);
  },
  setSfxOn(on) {
    this.sfxOn = on;
    if (this.sfxGain && this.ctx) this.sfxGain.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.02);
  },

  // --- util dasar (SFX dirutekan ke sfxGain; musik memakai dest eksplisit)
  tone(freqA, freqB, dur, type, vol, when, dest) {
    if (!this.ctx || this.muted) return;
    const t = when || this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freqA, t);
    if (freqB !== freqA) o.frequency.exponentialRampToValueAtTime(Math.max(1, freqB), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(dest || this.sfxGain || this.master);
    o.start(t); o.stop(t + dur + 0.02);
  },

  noise(dur, vol, filterFreq, type, when, freqEnd) {
    if (!this.ctx || this.muted) return;
    const t = when || this.ctx.currentTime;
    const len = Math.max(1, (dur * this.ctx.sampleRate) | 0);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = type || 'lowpass';
    f.frequency.setValueAtTime(filterFreq, t);
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxGain || this.master);
    src.start(t); src.stop(t + dur + 0.02);
  },

  // --- SFX -------------------------------------------------------------
  sShoot()      { this.tone(820, 240, 0.07, 'square', 0.10); },
  sHmg()        { this.tone(660, 200, 0.045, 'square', 0.08); this.noise(0.03, 0.05, 3000, 'highpass'); },
  sRocketLaunch(){ this.noise(0.28, 0.12, 500, 'bandpass', 0, 2400); },
  sShotgun()    { this.noise(0.16, 0.22, 1400, 'lowpass', 0, 200); this.tone(160, 60, 0.12, 'square', 0.10); },
  sFlame()      { this.noise(0.14, 0.13, 900, 'lowpass', 0, 2400); },
  sLaser()      { this.tone(1400, 300, 0.11, 'sawtooth', 0.09); },
  sChaser()     { this.noise(0.2, 0.1, 700, 'bandpass', 0, 1800); this.tone(500, 900, 0.12, 'square', 0.05); },
  sVulcan()     { this.tone(700, 260, 0.04, 'square', 0.07); },
  sCannon()     { this.noise(0.3, 0.3, 700, 'lowpass', 0, 80); this.tone(120, 40, 0.25, 'sine', 0.32); },
  sTracks()     { this.noise(0.07, 0.045, 300, 'lowpass'); },  // gesekan rantai roda Slug
  sSplash()     { this.noise(0.22, 0.16, 1200, 'bandpass', 0, 400); },
  sWaterShot()  { this.noise(0.15, 0.1, 1600, 'bandpass', 0, 500); },
  sRoar()       { this.tone(90, 55, 0.5, 'sawtooth', 0.22); this.noise(0.4, 0.12, 400, 'lowpass', 0, 120); },
  sStomp()      { this.tone(70, 30, 0.3, 'sine', 0.4); this.noise(0.22, 0.22, 200, 'lowpass', 0, 60); },
  sExplosion(big) {
    this.noise(big ? 0.55 : 0.3, big ? 0.4 : 0.25, 900, 'lowpass', 0, 60);
    this.tone(big ? 130 : 110, 30, big ? 0.5 : 0.3, 'sine', 0.35);
  },
  sHit()        { this.tone(220, 140, 0.05, 'square', 0.10); },
  sShieldClank(){ this.tone(1350, 1100, 0.06, 'triangle', 0.16); this.noise(0.04, 0.08, 5000, 'highpass'); },
  sMelee()      { this.noise(0.08, 0.14, 2600, 'bandpass', 0, 500); },
  sJump()       { this.tone(280, 560, 0.13, 'sine', 0.07); },
  sThrow()      { this.noise(0.1, 0.05, 900, 'bandpass', 0, 2000); },
  sPickup()     { const t = this.ctx ? this.ctx.currentTime : 0; this.tone(660, 660, 0.07, 'square', 0.11, t); this.tone(990, 990, 0.1, 'square', 0.11, t + 0.07); },
  sDie()        { this.tone(420, 55, 0.55, 'sawtooth', 0.14); },
  sPlayerHit()  { this.tone(300, 50, 0.4, 'sawtooth', 0.2); this.noise(0.25, 0.15, 700, 'lowpass'); },
  sPowFree()    { const t = this.ctx ? this.ctx.currentTime : 0; this.tone(523, 523, 0.08, 'square', 0.1, t); this.tone(659, 659, 0.08, 'square', 0.1, t + 0.08); this.tone(784, 784, 0.12, 'square', 0.1, t + 0.16); },

  // --- Musik: loop chiptune bergaya militer ---------------------------
  BASS: [33,0,33,0, 36,0,33,0, 31,0,31,0, 33,0,38,0,
         33,0,33,0, 36,0,33,0, 40,0,38,0, 36,0,31,0],
  LEAD: [57,0,0,60, 0,64,0,60, 62,0,0,59, 0,57,0,0,
         57,0,0,60, 0,64,0,67, 69,0,67,64, 62,0,0,0],
  midiHz(m) { return 440 * Math.pow(2, (m - 69) / 12); },

  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    this.step = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.06;
    const stepDur = 60 / 132 / 2;
    const tick = () => {
      if (!this.ctx) return;
      while (this.nextNoteTime < this.ctx.currentTime + 0.14) {
        const s = this.step % 32;
        const t = this.nextNoteTime;
        if (!this.muted && this.musicOn) {
          const b = this.BASS[s];
          if (b) this.tone(this.midiHz(b), this.midiHz(b), stepDur * 0.9, 'triangle', 0.20, t, this.musicGain);
          const l = this.LEAD[s];
          if (l) this.tone(this.midiHz(l), this.midiHz(l), stepDur * 0.85, 'square', 0.055, t, this.musicGain);
          if (s % 8 === 4) this.noiseAt(t, 0.09, 0.06, 1800);
          else if (s % 2 === 0) this.noiseAt(t, 0.03, 0.02, 6000);
        }
        this.nextNoteTime += stepDur;
        this.step++;
      }
    };
    this.musicTimer = setInterval(tick, 40);
  },

  noiseAt(t, dur, vol, freq) {
    if (!this.ctx) return;
    const len = Math.max(1, (dur * this.ctx.sampleRate) | 0);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.musicGain);
    src.start(t); src.stop(t + dur + 0.02);
  },

  stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  }
};
