/* ============================================================
   100天纪念日 · main controller
   - Password gate
   - Starfield (twinkling stars + nebula glow + shooting stars)
   - Fireworks engine wiring
   - Live "在一起多久" counter
   - Floating hearts overlay
   - Background music toggle (optional, drop assets/song.mp3)
   ============================================================ */
(function () {
  'use strict';

  /* =========================================================
     Config — change these to make it yours
     ========================================================= */
  const PASSWORD   = '20260321';
  const START_DATE = new Date(2026, 2, 21, 0, 0, 0); // 2026-03-21 00:00 local time
  const VIEWER     = 'Ms Gao';   // 观看人
  const MAKER      = 'Mr. Liu';  // 制作人

  // rotating love lines shown in the footer (addressed to Ms Gao)
  const LOVE_LINES = [
    '愿往后每一夜的星空，都有你与我同看。',
    'Ms Gao，遇见你之后，平凡的日子都开始发光。',
    '99 天，刚刚好；往后的每一天，都想和你数下去。',
    '你是我抬头看见的那束烟花，也是落下后仍在心里的光。',
    '想把世界上最浪漫的夜空，都搬来送给你。',
  ];

  /* =========================================================
     Password gate
     ========================================================= */
  const gate  = document.getElementById('gate');
  const form  = document.getElementById('gate-form');
  const input = document.getElementById('gate-input');
  const msg   = document.getElementById('gate-msg');
  const scene = document.getElementById('scene');

  function unlock() {
    gate.classList.add('fadeout');
    setTimeout(() => {
      gate.style.display = 'none';
      scene.classList.remove('hidden');
      requestAnimationFrame(() => scene.classList.add('show'));
      bootScene();
    }, 1100);
  }

  function fail() {
    gate.classList.add('shake');
    msg.textContent = '不是这一天哦，再想想 ♥';
    msg.classList.add('show');
    setTimeout(() => gate.classList.remove('shake'), 500);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value.trim() === PASSWORD) {
      msg.textContent = `欢迎回家，${VIEWER} ♥`;
      msg.classList.add('show');
      setTimeout(unlock, 600);
    } else {
      fail();
      input.select();
    }
  });

  /* =========================================================
     Scene boot
     ========================================================= */
  function bootScene() {
    initStars();
    initFireworks();
    initCounter();
    initHearts();
    initLoveLines();
    initSlideshow();
    initMusic();
  }

  /* ---------------- Starfield (optimized) ----------------
     - nebula painted ONCE to an offscreen canvas (no per-frame gradients)
     - stars drawn as plain arcs (no per-star shadowBlur)
     - a couple of "bright" stars get a cheap cached glow sprite
     - dpr capped at 1.5                                       */
  function initStars() {
    const c   = document.getElementById('stars');
    const ctx = c.getContext('2d');
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    let stars = [], shootings = [], w, h;
    let nebula = null;

    // cached soft glow sprite for the few bright stars
    const glow = document.createElement('canvas');
    glow.width = glow.height = 24;
    (function () {
      const g = glow.getContext('2d');
      const gr = g.createRadialGradient(12, 12, 0, 12, 12, 12);
      gr.addColorStop(0, 'rgba(255,240,220,0.9)');
      gr.addColorStop(1, 'rgba(255,240,220,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 24, 24);
    })();

    function buildNebula() {
      nebula = document.createElement('canvas');
      nebula.width = Math.floor(w * dpr);
      nebula.height = Math.floor(h * dpr);
      const g = nebula.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g1 = g.createRadialGradient(w * 0.20, h * 0.15, 0, w * 0.20, h * 0.15, w * 0.55);
      g1.addColorStop(0, 'rgba(255,150,200,0.08)');
      g1.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = g1; g.fillRect(0, 0, w, h);
      const g2 = g.createRadialGradient(w * 0.85, h * 0.72, 0, w * 0.85, h * 0.72, w * 0.50);
      g2.addColorStop(0, 'rgba(155,109,255,0.07)');
      g2.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = g2; g.fillRect(0, 0, w, h);
      const g3 = g.createRadialGradient(w * 0.5, h * 1.02, 0, w * 0.5, h * 1.02, w * 0.6);
      g3.addColorStop(0, 'rgba(255,120,170,0.05)');
      g3.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = g3; g.fillRect(0, 0, w, h);
    }

    function resize() {
      w = window.innerWidth; h = window.innerHeight;
      c.width  = Math.floor(w * dpr); c.height = Math.floor(h * dpr);
      c.style.width = w + 'px'; c.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildNebula();
      stars = [];
      const N = Math.min(220, Math.floor((w * h) / 3200));
      for (let i = 0; i < N; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h * 0.92,
          r: Math.random() * 1.3 + 0.2,
          tw: Math.random() * Math.PI * 2,
          spd: 0.010 + Math.random() * 0.022,
          bright: Math.random() < 0.12,
        });
      }
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      ctx.clearRect(0, 0, w, h);
      // blit pre-rendered nebula (1 drawImage instead of 2-3 gradients/frame)
      ctx.drawImage(nebula, 0, 0, w, h);

      ctx.fillStyle = '#fff';
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.tw += s.spd;
        const a = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(s.tw));
        if (s.bright) {
          const r = s.r * 6;
          ctx.globalAlpha = a;
          ctx.drawImage(glow, s.x - r, s.y - r, r * 2, r * 2);
        }
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (Math.random() < 0.004 && shootings.length < 2) {
        shootings.push({
          x: Math.random() * w * 0.7, y: Math.random() * h * 0.3,
          vx: 6 + Math.random() * 3, vy: 2 + Math.random() * 1.5, life: 1,
        });
      }
      ctx.lineWidth = 1.6;
      for (let i = shootings.length - 1; i >= 0; i--) {
        const s = shootings[i];
        s.x += s.vx; s.y += s.vy; s.life -= 0.012;
        ctx.strokeStyle = `rgba(255,235,200,${Math.max(0, s.life)})`;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 8, s.y - s.vy * 8);
        ctx.stroke();
        if (s.life <= 0 || s.x > w + 100) shootings.splice(i, 1);
      }

      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ---------------- Fireworks ---------------- */
  function initFireworks() {
    const c  = document.getElementById('fireworks');
    const fw = new window.FireworksEngine(c);
    fw.start();
    window._fw = fw;
  }

  /* ---------------- Counter ---------------- */
  function initCounter() {
    const dEl = document.getElementById('d');
    const hEl = document.getElementById('h');
    const mEl = document.getElementById('m');
    const sEl = document.getElementById('s');
    const pad = (n) => String(n).padStart(2, '0');

    function tick() {
      const now = new Date();
      let diff = Math.max(0, now - START_DATE);
      const days = Math.floor(diff / 86400000); diff -= days * 86400000;
      const hrs  = Math.floor(diff / 3600000);  diff -= hrs  * 3600000;
      const mins = Math.floor(diff / 60000);    diff -= mins * 60000;
      const secs = Math.floor(diff / 1000);
      dEl.textContent = days;
      hEl.textContent = pad(hrs);
      mEl.textContent = pad(mins);
      sEl.textContent = pad(secs);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------- Floating hearts ---------------- */
  function initHearts() {
    const wrap   = document.getElementById('hearts');
    const SHAPES = ['♥', '❤', '♡', '✿', '❀'];
    const COLORS = ['#ff4e88', '#ff8ec7', '#ffd6e8', '#ffadd2', '#ffe7a3'];

    function spawn() {
      const el = document.createElement('span');
      el.className = 'heart';
      el.textContent = SHAPES[(Math.random() * SHAPES.length) | 0];
      el.style.left = Math.random() * 100 + 'vw';
      el.style.fontSize = (16 + Math.random() * 22) + 'px';
      el.style.animationDuration = (7 + Math.random() * 6) + 's';
      el.style.color = COLORS[(Math.random() * COLORS.length) | 0];
      el.style.opacity = 0.7 + Math.random() * 0.3;
      wrap.appendChild(el);
      setTimeout(() => el.remove(), 14000);
    }
    setInterval(spawn, 700);
    for (let i = 0; i < 6; i++) setTimeout(spawn, i * 220);
  }

  /* ---------------- Rotating love lines ---------------- */
  function initLoveLines() {
    const el = document.querySelector('.msg .line');
    if (!el) return;
    let idx = 0;
    el.textContent = LOVE_LINES[0];
    setInterval(() => {
      idx = (idx + 1) % LOVE_LINES.length;
      el.style.transition = 'opacity .8s ease';
      el.style.opacity = '0';
      setTimeout(() => {
        el.textContent = LOVE_LINES[idx];
        el.style.opacity = '1';
      }, 800);
    }, 6000);
  }

  /* ---------------- Photo slideshow ----------------
     Looks for assets/photos/1..10.{heic|jpg|jpeg|png|webp};
     HEIC is auto-decoded to JPEG via heic2any (Chrome/FF can't
     display HEIC natively). Missing slots are silently skipped;
     plays 1→N→1 in a loop.                                       */
  const EXTS    = ['jpg', 'JPG', 'jpeg', 'JPEG', 'heic', 'HEIC', 'heif', 'HEIF', 'png', 'PNG', 'webp', 'WEBP'];
  const TOTAL   = 10;
  const FADE_MS = 1000;
  const HOLD_MS = 5000;

  // lazy-load heic2any (only when at least one HEIC is detected)
  let _heicLoading = null;
  function loadHeicLib() {
    if (_heicLoading) return _heicLoading;
    _heicLoading = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
      s.onload  = () => res(window.heic2any);
      s.onerror = () => rej(new Error('heic2any cdn failed'));
      document.head.appendChild(s);
    });
    return _heicLoading;
  }

  // HEAD-probe a candidate path; return url if 200, else null
  async function headExists(url) {
    try {
      const r = await fetch(url, { method: 'HEAD' });
      return r.ok ? url : null;
    } catch (_) { return null; }
  }

  async function probeSlot(idx) {
    for (const ext of EXTS) {
      const url = `assets/photos/${idx}.${ext}`;
      const ok  = await headExists(url);
      if (ok) return ok;
    }
    return null;
  }

  // Convert HEIC to a blob URL on-the-fly; pass through other formats.
  async function resolveImg(url) {
    if (!/\.heic$|\.heif$/i.test(url)) return url;
    try {
      const heic2any = await loadHeicLib();
      const r = await fetch(url);
      if (!r.ok) throw new Error('fetch heic failed');
      const blob = await r.blob();
      const out  = await heic2any({ blob, toType: 'image/jpeg', quality: 0.88 });
      const jpeg = Array.isArray(out) ? out[0] : out;
      return URL.createObjectURL(jpeg);
    } catch (e) {
      console.warn('[slideshow] heic decode failed for', url, e);
      return url; // last resort — Safari will render natively, others show broken
    }
  }

  // delay before first photo appears (from scene boot)
  const INITIAL_DELAY_MS = 12000;

  function initSlideshow() {
    const root     = document.getElementById('slideshow');
    const polaroid = document.getElementById('polaroid');
    const imgEl    = document.getElementById('slide-img');
    const cap      = document.getElementById('slide-caption');
    const pad2     = (n) => String(n).padStart(2, '0');
    const wait     = (ms) => new Promise((r) => setTimeout(r, ms));
    const cache    = new Map();   // idx -> resolved (possibly converted) src

    async function getSrc(slot) {
      if (cache.has(slot.idx)) return cache.get(slot.idx);
      const u = await resolveImg(slot.url);
      cache.set(slot.idx, u);
      return u;
    }

    (async () => {
      // discover all 10 slots in parallel (HEAD requests are cheap)
      const found = (await Promise.all(
        Array.from({ length: TOTAL }, (_, i) => probeSlot(i + 1).then((u) => u && { idx: i + 1, url: u }))
      )).filter(Boolean);

      if (!found.length) { root.style.display = 'none'; return; }

      // pre-warm slide #1 (HEIC decode etc.) DURING the initial delay,
      // so the first photo appears at exactly INITIAL_DELAY_MS with no extra latency
      const firstReady = getSrc(found[0]);
      await wait(INITIAL_DELAY_MS);
      await firstReady;

      let i = 0;
      while (true) {
        const slot = found[i % found.length];
        const src  = await getSrc(slot);
        await new Promise((r) => { imgEl.onload = r; imgEl.onerror = r; imgEl.src = src; });
        cap.textContent = `${pad2(slot.idx)} / ${pad2(TOTAL)}`;
        polaroid.style.setProperty('--tilt', (Math.random() * 4 - 2).toFixed(2) + 'deg');
        polaroid.classList.remove('out');
        polaroid.classList.add('show');

        // pre-warm the NEXT slide while this one is showing
        const nextSlot = found[(i + 1) % found.length];
        if (nextSlot) getSrc(nextSlot);

        await wait(FADE_MS + HOLD_MS);
        polaroid.classList.remove('show');
        polaroid.classList.add('out');
        await wait(FADE_MS);
        polaroid.classList.remove('out');
        i++;
      }
    })();
  }

  /* ---------------- Music ----------------
     Tries local files in order, falls back to a hidden YouTube
     iframe if none are present so there is *always* music.      */
  const MUSIC_CANDIDATES = [
    'assets/music.mp4',  // <- the file Ms Gao uploads
    'assets/music.mp3',
    'assets/song.mp3',
    'assets/song.m4a',
  ];
  const YT_VIDEO_ID = 'FB5-rPa5wBA';

  function initMusic() {
    const btn  = document.getElementById('muteBtn');
    let mode   = null;     // 'local' | 'yt'
    let audio  = null;
    let yt     = null;
    let muted  = true;
    btn.classList.add('muted');

    function probeAudio(src) {
      return new Promise((res) => {
        const a = new Audio();
        a.preload = 'auto';
        let done = false;
        const ok = () => { if (!done) { done = true; res(a); } };
        const no = () => { if (!done) { done = true; res(null); } };
        a.addEventListener('canplaythrough', ok, { once: true });
        a.addEventListener('loadedmetadata', ok, { once: true });
        a.addEventListener('error', no, { once: true });
        setTimeout(no, 2500);
        a.src = src;
      });
    }

    function loadYTAPI() {
      return new Promise((res) => {
        if (window.YT && window.YT.Player) return res();
        window.onYouTubeIframeAPIReady = () => res();
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      });
    }

    async function ensureMode() {
      if (mode) return;
      for (const src of MUSIC_CANDIDATES) {
        const a = await probeAudio(src);
        if (a) {
          a.loop = true; a.volume = 0.5;
          audio = a; mode = 'local';
          return;
        }
      }
      // fallback: hidden YouTube iframe
      await loadYTAPI();
      const host = document.createElement('div');
      host.id = 'yt-host';
      host.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
      document.body.appendChild(host);
      await new Promise((r) => {
        yt = new window.YT.Player('yt-host', {
          videoId: YT_VIDEO_ID,
          playerVars: {
            autoplay: 0, controls: 0, modestbranding: 1, playsinline: 1,
            loop: 1, playlist: YT_VIDEO_ID, disablekb: 1, fs: 0, rel: 0,
          },
          events: { onReady: () => r() },
        });
      });
      try { yt.setVolume(45); } catch (_) {}
      mode = 'yt';
    }

    async function play()  { await ensureMode(); if (mode === 'local') return audio.play(); if (mode === 'yt') yt.playVideo(); }
    function       pause() { if (mode === 'local') audio.pause(); else if (mode === 'yt') yt.pauseVideo(); }

    btn.addEventListener('click', async () => {
      try {
        if (muted) { await play();  muted = false; btn.classList.remove('muted'); btn.textContent = '♫'; }
        else       { pause();       muted = true;  btn.classList.add('muted');    btn.textContent = '♪'; }
      } catch (_) { /* autoplay rejection — user can retry */ }
    });

    // try auto-start while still in the unlock user-gesture chain
    setTimeout(async () => {
      try {
        await play();
        muted = false;
        btn.classList.remove('muted');
        btn.textContent = '♫';
      } catch (_) { /* blocked — wait for user click */ }
    }, 1500);
  }
})();
