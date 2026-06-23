/* ============================================================
   Fireworks engine (v2 — performance optimized + more variety)

   Shapes: peony / chrysanthemum / willow / ring / double-ring /
           star / heart / palm / crossette / strobe / spiral
   Perf: pre-rendered glow sprites + additive 'lighter' blending
         (NO per-particle shadowBlur), trails come from full-canvas
         fade (no per-particle trail loops), dpr capped at 1.5.
   Exposes: window.FireworksEngine
   ============================================================ */
(function () {
  'use strict';

  const PALETTES = [
    ['255,138,191', '255,99,170',  '255,205,229', '255,247,236'], // pink / blush
    ['179,136,255', '224,180,255', '255,206,238', '255,255,255'], // purple / lilac
    ['255,179,71',  '255,222,135', '255,247,150', '255,255,229'], // gold / champagne
    ['255,107,107', '255,157,143', '255,210,179', '255,255,255'], // coral
    ['144,180,255', '186,210,255', '224,236,255', '255,255,255'], // cool sky
    ['255,86,140',  '255,155,194', '255,206,229', '255,247,236'], // rose
    ['255,236,180', '255,200,140', '255,160,200', '255,220,235'], // sunset
    ['120,255,214', '170,255,230', '214,255,246', '255,255,255'], // mint aurora (rare accent)
  ];

  const pick = (a) => a[(Math.random() * a.length) | 0];
  const rnd  = (a, b) => a + Math.random() * (b - a);

  /* ---- glow sprite cache: one soft radial sprite per color ---- */
  const SPRITES = new Map();
  function sprite(color) {
    let s = SPRITES.get(color);
    if (s) return s;
    const size = 64, r = size / 2;
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const g = cv.getContext('2d');
    const grd = g.createRadialGradient(r, r, 0, r, r, r);
    grd.addColorStop(0,    `rgba(${color},1)`);
    grd.addColorStop(0.25, `rgba(${color},0.85)`);
    grd.addColorStop(0.55, `rgba(${color},0.30)`);
    grd.addColorStop(1,    `rgba(${color},0)`);
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
    SPRITES.set(color, cv);
    return cv;
  }

  /* ----------------------------- Particle ----------------------------- */
  class Particle {
    constructor(x, y, angle, speed, color, opts = {}) {
      this.x = x; this.y = y;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.gravity  = opts.gravity  ?? 0.055;
      this.friction = opts.friction ?? 0.984;
      this.color    = color;
      this.alpha    = 1;
      this.decay    = opts.decay  ?? (0.006 + Math.random() * 0.012);
      this.size     = opts.size   ?? (2.0 + Math.random() * 2.2);
      this.shimmer  = opts.shimmer ?? false;
      this.wind     = opts.wind   ?? 0;
      this.life     = 0;
      // crossette: split into a small secondary burst once
      this.splitAt    = opts.splitAt    ?? 0;
      this.splitColor = opts.splitColor ?? color;
      this._split     = false;
    }
    update() {
      this.life++;
      this.vx = this.vx * this.friction + this.wind;
      this.vy = this.vy * this.friction + this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= this.decay;
    }
    draw(ctx) {
      let a = this.alpha;
      if (this.shimmer) a *= (0.35 + 0.65 * Math.abs(Math.sin(this.life * 0.45)));
      if (a <= 0) return;
      const r = this.size * (0.7 + 0.3 * this.alpha) * 2.2;
      ctx.globalAlpha = a;
      const sp = sprite(this.color);
      ctx.drawImage(sp, this.x - r, this.y - r, r * 2, r * 2);
    }
    isDead() { return this.alpha <= 0.02; }
  }

  /* ----------------------------- Rocket ----------------------------- */
  class Rocket {
    constructor(sx, sy, tx, ty, palette, type) {
      this.x = sx; this.y = sy;
      this.ty = ty;
      const angle = Math.atan2(ty - sy, tx - sx);
      const speed = 9 + Math.random() * 3;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.palette = palette;
      this.type = type;
      this.color = palette[3] || palette[0];
      this.exploded = false;
    }
    update() {
      this.vy += 0.04;
      this.x += this.vx;
      this.y += this.vy;
      if (this.vy >= -0.6 || this.y <= this.ty) this.exploded = true;
    }
    draw(ctx) {
      const r = 5.5;
      ctx.globalAlpha = 1;
      ctx.drawImage(sprite(this.color), this.x - r, this.y - r, r * 2, r * 2);
    }
  }

  /* ---------------------------- Engine ----------------------------- */
  class FireworksEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.dpr = Math.min(1.5, window.devicePixelRatio || 1);
      this.rockets = [];
      this.particles = [];
      this.flash = null;
      this.running = false;
      this.lastSpawn = 0;
      this.spawnInterval = 900;
      this.maxParticles = 1400;           // safety cap to keep frame budget
      this.tick = this.tick.bind(this);
      this.resize = this.resize.bind(this);
      window.addEventListener('resize', this.resize);
      this.canvas.addEventListener('pointerdown', (e) => this.onClick(e));
      this.resize();
    }

    resize() {
      const w = window.innerWidth, h = window.innerHeight;
      this.canvas.width  = Math.floor(w * this.dpr);
      this.canvas.height = Math.floor(h * this.dpr);
      this.canvas.style.width  = w + 'px';
      this.canvas.style.height = h + 'px';
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.w = w; this.h = h;
    }

    onClick(e) {
      const rect = this.canvas.getBoundingClientRect();
      this.launch(e.clientX - rect.left, e.clientY - rect.top, this.randomType());
    }

    randomType() {
      const types = [
        'heart', 'heart', 'willow', 'chrysanthemum', 'chrysanthemum',
        'ring', 'doublering', 'star', 'peony', 'palm', 'crossette',
        'strobe', 'spiral',
      ];
      return pick(types);
    }

    launch(tx, ty, type) {
      const palette = pick(PALETTES);
      const sx = tx + rnd(-40, 40);
      this.launchFrom(sx, this.h + 10, tx, ty, palette, type);
    }
    launchFrom(sx, sy, tx, ty, palette, type) {
      this.rockets.push(new Rocket(sx, sy, tx, ty, palette, type));
    }

    autoSpawn(t) {
      if (t - this.lastSpawn < this.spawnInterval) return;
      this.lastSpawn = t;
      this.spawnInterval = 360 + Math.random() * 1000;
      // occasional finale
      if (Math.random() < 0.08) { this.finale(); return; }
      const tx = this.w * (0.10 + Math.random() * 0.80);
      const ty = this.h * (0.16 + Math.random() * 0.34);
      const burst = Math.random() < 0.18 ? 3 : (Math.random() < 0.34 ? 2 : 1);
      for (let i = 0; i < burst; i++) {
        setTimeout(() =>
          this.launch(tx + rnd(-170, 170), ty + rnd(-50, 50), this.randomType()),
          i * 200
        );
      }
    }

    finale() {
      const n = 5 + ((Math.random() * 3) | 0);
      for (let i = 0; i < n; i++) {
        setTimeout(() => {
          const tx = this.w * (0.12 + Math.random() * 0.76);
          const ty = this.h * (0.14 + Math.random() * 0.34);
          this.launch(tx, ty, this.randomType());
        }, i * 160);
      }
    }

    /* ---------- explosion router ---------- */
    explode(rocket) {
      const { x, y, palette, type } = rocket;
      ({
        heart:         () => this.spawnHeart(x, y, palette),
        willow:        () => this.spawnWillow(x, y, palette),
        chrysanthemum: () => this.spawnChrysanthemum(x, y, palette),
        ring:          () => this.spawnRing(x, y, palette, 1),
        doublering:    () => this.spawnRing(x, y, palette, 2),
        star:          () => this.spawnStar(x, y, palette),
        palm:          () => this.spawnPalm(x, y, palette),
        crossette:     () => this.spawnCrossette(x, y, palette),
        strobe:        () => this.spawnStrobe(x, y, palette),
        spiral:        () => this.spawnSpiral(x, y, palette),
        peony:         () => this.spawnPeony(x, y, palette),
      }[type] || (() => this.spawnPeony(x, y, palette)))();
      this.flash = { x, y, a: 0.30, color: palette[1] };
    }

    _cap(n) {                              // throttle when overloaded
      const room = this.maxParticles - this.particles.length;
      return Math.max(0, Math.min(n, room));
    }

    /* ---------- shapes ---------- */
    spawnPeony(x, y, palette) {
      const n = this._cap(120 + ((Math.random() * 50) | 0));
      const core = palette[3];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.05;
        const s = 2 + Math.random() * 5;
        const col = i % 7 === 0 ? core : pick(palette);   // bright pistil sparks
        this.particles.push(new Particle(x, y, a, s, col, {}));
      }
    }
    spawnChrysanthemum(x, y, palette) {
      const n = this._cap(140);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.08;
        const s = 3 + Math.random() * 4;
        this.particles.push(new Particle(x, y, a, s, pick(palette), {
          decay: 0.004 + Math.random() * 0.006,
          shimmer: Math.random() < 0.25,
        }));
      }
    }
    spawnWillow(x, y, palette) {
      const n = this._cap(90);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.1;
        const s = 1.5 + Math.random() * 3;
        this.particles.push(new Particle(x, y, a, s, pick(palette), {
          gravity: 0.09, friction: 0.965, decay: 0.0035,
          size: 1.8 + Math.random() * 1.2, wind: rnd(-0.012, 0.012),
        }));
      }
    }
    spawnRing(x, y, palette, rings) {
      const total = this._cap(rings === 2 ? 140 : 90);
      const per = Math.floor(total / rings);
      for (let k = 0; k < rings; k++) {
        const rs = (4.2 + k * 1.6) + Math.random() * 0.6;
        const col = palette[k % palette.length];
        for (let i = 0; i < per; i++) {
          const a = (i / per) * Math.PI * 2;
          this.particles.push(new Particle(x, y, a, rs, col, { decay: 0.006 }));
        }
      }
      const fill = this._cap(34);
      for (let i = 0; i < fill; i++) {
        this.particles.push(new Particle(x, y, Math.random() * Math.PI * 2,
          Math.random() * 2.4, pick(palette), { decay: 0.012, size: 1 + Math.random() }));
      }
    }
    spawnStar(x, y, palette) {
      const points = 5;
      for (let i = 0; i < points; i++) {
        const arm = (i / points) * Math.PI * 2 - Math.PI / 2;
        const n = this._cap(22);
        for (let j = 0; j < n; j++) {
          const r = j / 22;
          const a = arm + (Math.random() - 0.5) * 0.10;
          this.particles.push(new Particle(x, y, a, 4.8 * r + 1.5, pick(palette), { decay: 0.006 }));
        }
      }
      const fill = this._cap(55);
      for (let i = 0; i < fill; i++) {
        this.particles.push(new Particle(x, y, Math.random() * Math.PI * 2,
          Math.random() * 2.5 + 0.5, pick(palette), { decay: 0.012 }));
      }
    }
    spawnPalm(x, y, palette) {
      // few thick rising fronds that arc over (like a palm tree)
      const fronds = 7 + ((Math.random() * 3) | 0);
      const col = palette[2];
      for (let f = 0; f < fronds; f++) {
        const base = -Math.PI / 2 + rnd(-0.9, 0.9);
        const n = this._cap(10);
        for (let j = 0; j < n; j++) {
          const a = base + (Math.random() - 0.5) * 0.12;
          const s = 5 + Math.random() * 3;
          this.particles.push(new Particle(x, y, a, s, pick(palette), {
            gravity: 0.10, friction: 0.972, decay: 0.005,
            size: 2.4 + Math.random() * 1.4,
          }));
        }
      }
    }
    spawnCrossette(x, y, palette) {
      const n = this._cap(36);
      const childCol = pick(palette);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        this.particles.push(new Particle(x, y, a, 4 + Math.random() * 1.5, palette[3], {
          decay: 0.004, splitAt: 26 + ((Math.random() * 8) | 0), splitColor: childCol,
        }));
      }
    }
    spawnStrobe(x, y, palette) {
      const n = this._cap(110);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.1;
        this.particles.push(new Particle(x, y, a, 2 + Math.random() * 4, pick(palette), {
          shimmer: true, decay: 0.0045 + Math.random() * 0.004, friction: 0.99,
        }));
      }
    }
    spawnSpiral(x, y, palette) {
      const n = this._cap(120);
      const turns = 3;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const a = t * Math.PI * 2 * turns;
        const s = 1.2 + t * 5.2;
        this.particles.push(new Particle(x, y, a, s, pick(palette), { decay: 0.006 }));
      }
    }
    spawnHeart(x, y, palette) {
      const n = this._cap(150);
      const scale = 0.20 + Math.random() * 0.04;
      const cols = palette.slice(0, 2);
      for (let i = 0; i < n; i++) {
        const t  = (i / n) * Math.PI * 2;
        const hx =  16 * Math.pow(Math.sin(t), 3);
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
        const angle = Math.atan2(hy, hx);
        const speed = Math.hypot(hx, hy) * scale;
        this.particles.push(new Particle(x, y, angle, speed, pick(cols), {
          gravity: 0.04, decay: 0.005 + Math.random() * 0.004, size: 2.2 + Math.random() * 1.2,
        }));
      }
    }

    /* crossette children spawned mid-flight */
    _maybeSplit(p) {
      if (p.splitAt && !p._split && p.life >= p.splitAt) {
        p._split = true;
        const m = this._cap(8);
        for (let i = 0; i < m; i++) {
          const a = (i / 8) * Math.PI * 2;
          this.particles.push(new Particle(p.x, p.y, a, 2.2 + Math.random(), p.splitColor, {
            decay: 0.02, size: 1.6,
          }));
        }
      }
    }

    drawFlash() {
      if (!this.flash) return;
      const f = this.flash;
      const grd = this.ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 220);
      grd.addColorStop(0, `rgba(${f.color}, ${f.a})`);
      grd.addColorStop(1, `rgba(${f.color}, 0)`);
      this.ctx.globalAlpha = 1;
      this.ctx.fillStyle = grd;
      this.ctx.fillRect(0, 0, this.w, this.h);
      f.a *= 0.84;
      if (f.a < 0.02) this.flash = null;
    }

    tick(t) {
      if (!this.running) return;
      const ctx = this.ctx;

      // motion-blur trail via fade (this IS the trail — no per-particle trails)
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.20)';
      ctx.fillRect(0, 0, this.w, this.h);

      ctx.globalCompositeOperation = 'lighter';

      this.autoSpawn(t);

      for (let i = this.rockets.length - 1; i >= 0; i--) {
        const r = this.rockets[i];
        r.update(); r.draw(ctx);
        if (r.exploded) { this.explode(r); this.rockets.splice(i, 1); }
      }
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.update();
        this._maybeSplit(p);
        p.draw(ctx);
        if (p.isDead()) this.particles.splice(i, 1);
      }
      this.drawFlash();

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(this.tick);
    }

    start() {
      if (this.running) return;
      this.running = true;
      const cx = this.w / 2, cy = this.h * 0.4;
      const queue = [
        [cx - 220, cy,       'heart',         200],
        [cx + 220, cy,       'heart',         650],
        [cx,       cy - 60,  'chrysanthemum', 1250],
        [cx - 110, cy + 80,  'star',          1800],
        [cx + 110, cy + 80,  'willow',        2300],
        [cx,       cy - 120, 'doublering',    2900],
        [cx,       cy - 30,  'crossette',     3500],
      ];
      for (const [x, y, ty, d] of queue) setTimeout(() => this.launch(x, y, ty), d);
      requestAnimationFrame(this.tick);
    }
    stop() { this.running = false; }
  }

  window.FireworksEngine = FireworksEngine;
})();
