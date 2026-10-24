/* =====================================================================
   Dhamodharan & Lakshmi - Wedding Invitation
   Modules: Music | FlowerFX | Scratch heart | Typewriter | Tilt |
            Quotes | Countdown | Reveal | Ripple | Background
   ===================================================================== */
(() => {
  "use strict";

  /* ---------------- Settings ---------------- */
  const CONFIG = {
    weddingStart: new Date("2026-11-16T09:15:00+05:30"),   // 16 Nov 2026, 9:15 AM IST
    weddingEnd:   new Date("2026-11-16T10:15:00+05:30"),   // 10:15 AM
    murugaImage:  "muruga.jpg",                            // put your Lord Muruga picture here
    revealAt:     0.5,                                     // auto-reveal when 50% scratched
    brushSize:    38,
  };

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const pad = (n) => String(n).padStart(2, "0");
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* =====================================================================
     1. BACKGROUND - Lord Muruga image at 20%, with a drawn Vel fallback
     ===================================================================== */
  const Background = {
    init() {
      const layer = $("#bgMuruga");
      const img = new Image();
      img.onload = () => {};   // image is chosen in CSS (portrait for phones, wide for laptops)
      img.onerror = () => {
        // image file not added yet: show a Vel + peacock-feather design instead
        layer.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(this.fallbackSVG())}")`;
        layer.style.backgroundSize = "cover";
        layer.style.backgroundPosition = "center";
        layer.style.backgroundRepeat = "no-repeat";
      };
      img.src = CONFIG.murugaImage;
    },
    feather(x, y, rot, s) {
      return `
      <g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
        <path d="M0 330 C-14 220 14 130 0 40" stroke="#9c6f1c" stroke-width="5" fill="none"/>
        ${Array.from({ length: 14 }, (_, i) => {
          const yy = 60 + i * 18, w = 70 - Math.abs(i - 5) * 3;
          return `<path d="M0 ${yy} q-${w} -16 -${w + 10} 12 M0 ${yy} q${w} -16 ${w + 10} 12" stroke="#7b1a2b" stroke-width="2.2" fill="none"/>`;
        }).join("")}
        <ellipse cx="0" cy="95" rx="44" ry="62" fill="#7b1a2b"/>
        <ellipse cx="0" cy="95" rx="32" ry="48" fill="#1b3f8b"/>
        <ellipse cx="0" cy="95" rx="20" ry="32" fill="#d9a73a"/>
        <ellipse cx="0" cy="95" rx="11" ry="18" fill="#3a0612"/>
      </g>`;
    },
    fallbackSVG() {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">
        ${this.feather(110, 320, -18, 1.05)}
        ${this.feather(490, 320, 18, 1.05)}
        ${this.feather(300, 380, 0, 1.2)}
        <g transform="translate(300 0)">
          <path d="M0 60 C46 130 52 230 0 330 C-52 230 -46 130 0 60Z" fill="#d9a73a" stroke="#9c6f1c" stroke-width="4"/>
          <path d="M0 90 L0 300" stroke="#9c6f1c" stroke-width="3"/>
          <rect x="-7" y="330" width="14" height="420" rx="6" fill="#b8862a"/>
          <circle cx="0" cy="345" r="16" fill="#9c6f1c"/>
        </g>
        <text x="300" y="790" text-anchor="middle" font-size="42" font-family="serif" fill="#7b1a2b">ஓம் முருகா</text>
      </svg>`;
    },
  };

  /* =====================================================================
     2. MUSIC - song.mp3 if present, otherwise a built-in melody
     ===================================================================== */
  const Music = {
    bgm: $("#bgm"), btn: $("#musicBtn"),
    ctx: null, timer: null, synthOn: false, useFile: true, enabled: true,

    init() {
      const fail = () => { this.useFile = false; };
      this.bgm.addEventListener("error", fail);
      $("source", this.bgm).addEventListener("error", fail);
      this.btn.addEventListener("click", () => (this.enabled ? this.pause() : this.play()));
    },
    audio() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = this.ctx || new AC();
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    },
    play() {
      this.enabled = true;
      this.btn.classList.add("playing");
      this.btn.classList.remove("muted");
      if (this.useFile) {
        this.bgm.volume = 0.7;
        this.bgm.play().catch(() => { this.useFile = false; this.startSynth(); });
      } else this.startSynth();
    },
    pause() {
      this.enabled = false;
      this.btn.classList.remove("playing");
      this.btn.classList.add("muted");
      this.bgm.pause();
      this.stopSynth();
    },
    startSynth() {
      if (this.synthOn || !this.audio()) return;
      this.synthOn = true;
      const ac = this.ctx;
      const S = 261.63, R = 293.66, G = 329.63, P = 392.0, D = 440.0, S2 = 523.25;
      const phrase = [
        [G, 1], [P, 1], [D, 2], [P, 1], [G, 1], [R, 2],
        [G, 1], [P, 1], [S2, 2], [D, 1], [P, 1], [G, 2],
        [R, 1], [G, 1], [P, 2], [G, 1], [R, 1], [S, 2],
      ];
      const beat = 0.5;
      let idx = 0;
      const master = ac.createGain();
      master.gain.value = 0.18;
      master.connect(ac.destination);

      const note = (f, dur, when) => {
        [["triangle", f, 0.9], ["sine", f / 2, 0.25]].forEach(([type, freq, vol]) => {
          const o = ac.createOscillator(), g = ac.createGain();
          o.type = type; o.frequency.value = freq;
          g.gain.setValueAtTime(0.0001, when);
          g.gain.exponentialRampToValueAtTime(vol, when + 0.05);
          g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
          o.connect(g); g.connect(master);
          o.start(when); o.stop(when + dur + 0.05);
        });
      };
      const schedule = () => {
        if (!this.synthOn) return;
        let t = ac.currentTime + 0.1;
        for (let i = 0; i < 6; i++) {
          const [f, b] = phrase[idx++ % phrase.length];
          note(f, b * beat * 1.1, t);
          t += b * beat;
        }
        this.timer = setTimeout(schedule, Math.max(100, (t - ac.currentTime - 0.3) * 1000));
      };
      schedule();
    },
    stopSynth() {
      this.synthOn = false;
      clearTimeout(this.timer);
      if (this.ctx) this.ctx.suspend();
    },
    chime() {                                   // little bell arpeggio on reveal
      const ac = this.audio();
      if (!ac) return;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        const t = ac.currentTime + i * 0.12;
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        o.connect(g); g.connect(ac.destination);
        o.start(t); o.stop(t + 1);
      });
    },
  };

  /* =====================================================================
     3. FLOWER FX - canvas particle system (flowers, petals, sparkles)
     ===================================================================== */
  class FlowerFX {
    constructor(canvas) {
      this.c = canvas;
      this.ctx = canvas.getContext("2d");
      this.items = [];
      this.rate = 0;                 // flowers per second
      this.acc = 0;
      this.last = performance.now();
      this.palette = [
        ["#ff7aa8", "#ffd1e0"], ["#ff4f81", "#ffc2d6"], ["#ffb703", "#fff0b3"],
        ["#ff8c1a", "#ffd9a8"], ["#ffffff", "#ffe6f0"], ["#c77dff", "#ead7ff"],
      ];
      this.resize();
      addEventListener("resize", () => this.resize());
      requestAnimationFrame((t) => this.loop(t));
    }
    resize() {
      this.dpr = Math.min(devicePixelRatio || 1, 2);
      this.w = innerWidth; this.h = innerHeight;
      this.c.width = this.w * this.dpr;
      this.c.height = this.h * this.dpr;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
    setRate(n) { this.rate = n * (innerWidth < 600 ? 0.6 : 1); }
    flower(x, y, opts = {}) {
      if (this.items.length > 55) return;
      const [c1, c2] = pick(this.palette);
      this.items.push({
        kind: Math.random() < 0.22 ? "petal" : "flower",
        x, y,
        vx: opts.vx ?? rand(-18, 18),
        vy: opts.vy ?? rand(50, 130),
        size: rand(8, innerWidth < 600 ? 13 : 16),
        rot: rand(0, Math.PI * 2),
        vr: rand(-2.2, 2.2),
        phase: rand(0, 6.28),
        sway: rand(16, 46),
        petals: pick([5, 5, 6, 8]),
        c1, c2,
        life: 1,
      });
    }
    spark(x, y) {
      for (let i = 0; i < 1; i++) {
        this.items.push({
          kind: "spark", x, y,
          vx: rand(-60, 60), vy: rand(-70, 20),
          size: rand(2, 4.5), life: 1, rot: 0, vr: 0, phase: 0, sway: 0,
        });
      }
    }
    heart(x, y) {
      this.items.push({
        kind: "heart", x, y,
        vx: rand(-90, 90), vy: rand(-220, -80),
        size: rand(8, 16), life: 1, rot: 0, vr: 0, phase: 0, sway: 0,
      });
    }
    burst(n = 120) {                               // rain from the whole top edge
      for (let i = 0; i < n; i++) {
        setTimeout(() => this.flower(rand(0, this.w), rand(-80, -10), { vy: rand(120, 260) }), i * 18);
      }
    }
    heartBurst(x, y, n = 26) { for (let i = 0; i < n; i++) this.heart(x, y); }

    loop(now) {
      const dt = Math.min((now - this.last) / 1000, 0.05);
      this.last = now;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);

      this.acc += this.rate * dt;
      while (this.acc >= 1) { this.acc -= 1; this.flower(rand(0, this.w), -30); }

      this.items = this.items.filter((p) => {
        p.phase += dt * 2;
        if (p.kind === "spark") {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 140 * dt; p.life -= dt * 1.8;
          if (p.life <= 0) return false;
          this.drawSpark(p); return true;
        }
        if (p.kind === "heart") {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.life -= dt * 0.8;
          if (p.life <= 0) return false;
          this.drawHeart(p); return true;
        }
        p.x += (p.vx + Math.sin(p.phase) * p.sway) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.y > this.h + 40) return false;
        p.kind === "petal" ? this.drawPetal(p) : this.drawFlower(p);
        return true;
      });
      requestAnimationFrame((t) => this.loop(t));
    }
    drawFlower(p) {
      const ctx = this.ctx, r = p.size;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.cos(p.phase * 0.7)));   // tumbling look
      for (let i = 0; i < p.petals; i++) {
        ctx.rotate((Math.PI * 2) / p.petals);
        const g = ctx.createRadialGradient(0, -r * 0.5, 1, 0, -r * 0.5, r * 0.7);
        g.addColorStop(0, p.c2); g.addColorStop(1, p.c1);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.55, r * 0.3, r * 0.58, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#ffd23f";
      ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    drawPetal(p) {
      const ctx = this.ctx;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, 0.5 + 0.5 * Math.abs(Math.cos(p.phase)));
      ctx.fillStyle = p.c1;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.5);
      ctx.quadraticCurveTo(p.size * 0.6, 0, 0, p.size * 0.6);
      ctx.quadraticCurveTo(-p.size * 0.6, 0, 0, -p.size * 0.5);
      ctx.fill();
      ctx.restore();
    }
    drawSpark(p) {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = "#ffe08a";
      ctx.shadowColor = "#ffcf40"; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    drawHeart(p) {
      const ctx = this.ctx, s = p.size;
      ctx.save();
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.translate(p.x, p.y);
      ctx.fillStyle = "#ff3d77";
      ctx.beginPath();
      ctx.moveTo(0, s * 0.35);
      ctx.bezierCurveTo(-s, -s * 0.4, -s * 0.5, -s, 0, -s * 0.4);
      ctx.bezierCurveTo(s * 0.5, -s, s, -s * 0.4, 0, s * 0.35);
      ctx.fill();
      ctx.restore();
    }
  }

  /* =====================================================================
     4. SCRATCH HEART - foil canvas shaped like a heart
     ===================================================================== */
  class ScratchHeart {
    constructor({ wrap, canvas, svg, fx, onFirstScratch, onProgress, onReveal }) {
      Object.assign(this, { wrap, canvas, svg, fx, onFirstScratch, onProgress, onReveal });
      this.ctx = canvas.getContext("2d", { willReadFrequently: true });
      this.revealed = false;
      this.started = false;
      this.drawing = false;
      this.last = null;
      this.lastMeasure = 0;
      this.setup();
      this.bind();
      addEventListener("resize", () => { if (!this.started && !this.revealed) this.setup(); });
    }

    /* heart outline from the classic parametric equation */
    heartPoints(w, h, pad = 6, n = 160) {
      const s = Math.min((w - pad * 2) / 32, (h - pad * 2) / 29);
      const ox = w / 2, oy = (h - 29 * s) / 2;
      const pts = [];
      for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI * 2;
        const x = 16 * Math.sin(t) ** 3;
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        pts.push([ox + x * s, oy + (12 - y) * s]);
      }
      return pts;
    }

    setup() {
      const w = this.wrap.clientWidth;
      const h = Math.round(w * 0.92);
      this.w = w; this.h = h;
      this.wrap.style.height = h + "px";
      const dpr = Math.min(devicePixelRatio || 1, 2);
      this.dpr = dpr;
      this.canvas.width = w * dpr;
      this.canvas.height = h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      this.pts = this.heartPoints(w, h);
      this.drawBackdrop();
      this.drawFoil();
      this.sampleBase();
    }

    drawBackdrop() {
      const poly = this.pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ");
      this.svg.setAttribute("viewBox", `0 0 ${this.w} ${this.h}`);
      this.svg.innerHTML = `
        <defs>
          <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#e91e63"/>
            <stop offset="0.55" stop-color="#b3124f"/>
            <stop offset="1" stop-color="#6d0a31"/>
          </linearGradient>
        </defs>
        <polygon points="${poly}" fill="url(#hg)" stroke="#fbeab0" stroke-width="3" stroke-linejoin="round"/>`;
    }

    drawFoil() {
      const { ctx, w, h } = this;
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      this.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.clip();

      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#f9e7a6");
      g.addColorStop(0.35, "#d9a73a");
      g.addColorStop(0.65, "#f6dd8b");
      g.addColorStop(1, "#a97a22");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // brushed-metal lines + glitter
      ctx.strokeStyle = "rgba(255,255,255,.22)";
      ctx.lineWidth = 1;
      for (let i = -h; i < w; i += 9) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke();
      }
      for (let i = 0; i < 260; i++) {
        ctx.fillStyle = `rgba(255,255,255,${rand(0.2, 0.7)})`;
        ctx.fillRect(rand(0, w), rand(0, h), rand(1, 2.5), rand(1, 2.5));
      }

      // label
      ctx.fillStyle = "rgba(90,50,0,.75)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${Math.round(w * 0.075)}px Cinzel, serif`;
      ctx.fillText("SCRATCH", w / 2, h * 0.40);
      ctx.font = `${Math.round(w * 0.11)}px serif`;
      ctx.fillText("♥", w / 2, h * 0.54);
      ctx.font = `600 ${Math.round(w * 0.045)}px Cinzel, serif`;
      ctx.fillText("to reveal the date", w / 2, h * 0.67);
      ctx.restore();
    }

    /* remember which sample pixels are opaque so progress can be measured */
    sampleBase() {
      const { canvas, ctx } = this;
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const step = 6;
      this.sampleIdx = [];
      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const i = (y * canvas.width + x) * 4 + 3;
          if (data[i] > 128) this.sampleIdx.push(i);
        }
      }
    }
    measure() {
      const { canvas, ctx } = this;
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let left = 0;
      for (const i of this.sampleIdx) if (data[i] > 40) left++;
      return 1 - left / this.sampleIdx.length;
    }

    pos(e) {
      const r = this.canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, cx: e.clientX, cy: e.clientY };
    }
    bind() {
      const c = this.canvas;
      c.addEventListener("pointerdown", (e) => {
        if (this.revealed) return;
        this.drawing = true;
        c.setPointerCapture(e.pointerId);
        this.wrap.classList.add("scratching");
        this.last = this.pos(e);
        this.scratch(this.last, this.last);
        if (!this.started) { this.started = true; this.onFirstScratch && this.onFirstScratch(); }
      });
      c.addEventListener("pointermove", (e) => {
        if (!this.drawing || this.revealed) return;
        const p = this.pos(e);
        this.scratch(this.last, p);
        this.last = p;
        this.fx.spark(p.cx, p.cy);
        const now = performance.now();
        if (now - this.lastMeasure > 140) {
          this.lastMeasure = now;
          const pr = this.measure();
          this.onProgress && this.onProgress(pr);
          if (pr >= CONFIG.revealAt) this.reveal();
        }
      });
      const end = () => { this.drawing = false; this.wrap.classList.remove("scratching"); };
      c.addEventListener("pointerup", end);
      c.addEventListener("pointercancel", end);
      c.addEventListener("pointerleave", end);
    }
    scratch(a, b) {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineCap = ctx.lineJoin = "round";
      ctx.lineWidth = CONFIG.brushSize;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x + 0.01, b.y + 0.01);
      ctx.stroke();
      ctx.restore();
    }
    reveal() {
      if (this.revealed) return;
      this.revealed = true;
      this.drawing = false;
      this.canvas.classList.add("gone");
      this.wrap.classList.remove("scratching");
      this.wrap.classList.add("done");
      this.onProgress && this.onProgress(1);
      this.onReveal && this.onReveal();
    }
  }

  /* =====================================================================
     5. SMALL EFFECTS
     ===================================================================== */
  // typewriter for the names
  async function typeText(el, speed = 90) {
    const text = el.dataset.full || el.textContent;
    el.dataset.full = text;
    el.textContent = "";
    el.classList.add("caret");
    for (const ch of text) { el.textContent += ch; await sleep(speed); }
    await sleep(250);
    el.classList.remove("caret");
  }

  // 3D tilt on the photo
  function initTilt() {
    const box = $("#tilt"), frame = $(".photo-frame", box);
    const move = (e) => {
      const r = box.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      frame.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 14}deg)`;
    };
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerleave", () => (frame.style.transform = ""));
  }

  // click ripple on buttons
  function initRipple() {
    document.addEventListener("click", (e) => {
      const b = e.target.closest(".btn-gold, .btn-ghost");
      if (!b) return;
      const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height);
      const s = document.createElement("span");
      s.className = "ripple";
      s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
      b.appendChild(s);
      setTimeout(() => s.remove(), 700);
    });
  }

  // scroll progress bar + reveal on scroll
  function initScroll() {
    const bar = $("#scrollBar");
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + "%";
    };
    addEventListener("scroll", update, { passive: true });
    update();

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("show"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    $$(".reveal").forEach((el) => io.observe(el));
  }

  // quotes slider
  function initQuotes() {
    const quotes = $$(".quote"), box = $("#dots");
    let i = 0, timer;
    quotes.forEach((_, n) => {
      const d = document.createElement("span");
      if (!n) d.classList.add("on");
      d.addEventListener("click", () => { show(n); restart(); });
      box.appendChild(d);
    });
    const show = (n) => {
      const old = quotes[i];
      old.classList.remove("active"); old.classList.add("leaving");
      setTimeout(() => old.classList.remove("leaving"), 900);
      box.children[i].classList.remove("on");
      i = n;
      quotes[i].classList.add("active");
      box.children[i].classList.add("on");
    };
    const restart = () => { clearInterval(timer); timer = setInterval(() => show((i + 1) % quotes.length), 5000); };
    restart();
  }

  // countdown with flip animation
  function initCountdown() {
    const els = { d: $("#cd-days"), h: $("#cd-hours"), m: $("#cd-mins"), s: $("#cd-secs") };
    const msg = $("#cd-msg");
    const set = (el, v) => {
      if (el.textContent === v) return;
      el.textContent = v;
      el.classList.remove("flip"); void el.offsetWidth; el.classList.add("flip");
    };
    // progress ring around each box (full circle = its maximum)
    const CIRC = 2 * Math.PI * 44;
    const ring = (el, v) => {
      const box = el.parentElement, max = +box.dataset.max;
      const bar = $(".bar", box);
      bar.style.strokeDasharray = CIRC;
      bar.style.strokeDashoffset = CIRC * (1 - Math.min(v, max) / max);
    };
    const tick = () => {
      const now = new Date();
      let diff = CONFIG.weddingStart - now;
      if (diff <= 0) {
        Object.values(els).forEach((e) => (e.textContent = "00"));
        msg.textContent = now < CONFIG.weddingEnd
          ? "The ceremony is happening right now. Join us with your blessings!"
          : "Thank you for blessing us on our special day. 💛";
        return;
      }
      const d = Math.floor(diff / 864e5); diff -= d * 864e5;
      const h = Math.floor(diff / 36e5);  diff -= h * 36e5;
      const m = Math.floor(diff / 6e4);   diff -= m * 6e4;
      const s = Math.floor(diff / 1000);
      set(els.d, pad(d)); set(els.h, pad(h)); set(els.m, pad(m)); set(els.s, pad(s));
      ring(els.d, d); ring(els.h, h); ring(els.m, m); ring(els.s, s);
      msg.textContent = "";
    };
    tick();
    setInterval(tick, 1000);
  }


  /* =====================================================================
     MAP - exact coordinates, lazy load, view switch, directions, distance
     ===================================================================== */
  function initMap() {
    const LAT = 10.5959632, LNG = 78.4339017, ZOOM = 17;
    const coords = `${LAT},${LNG}`;
    const embed = (t) => `https://www.google.com/maps?q=${coords}&z=${ZOOM}&hl=en&t=${t}&output=embed`;
    const openUrl = `https://www.google.com/maps?q=${coords}&z=${ZOOM}&hl=en`;

    const wrap = $("#mapWrap"), frame = $("#mapFrame");
    $("#mapFallback").href = "https://www.google.com/maps/place/Akilandeshwari+Thirumana+Mahal/@10.5957859,78.4333729,135m/data=!3m1!1e3!4m6!3m5!1s0x3baa6fd26d3d102b:0x9e1e7d777cfb0368!8m2!3d10.5959632!4d78.4339017!16s%2Fg%2F11ckqn9hg9";

    // load the iframe only when the map scrolls near the screen
    let loaded = false, view = "m", failTimer;
    const load = () => {
      wrap.classList.remove("loaded", "failed");
      clearTimeout(failTimer);
      failTimer = setTimeout(() => { if (!wrap.classList.contains("loaded")) wrap.classList.add("failed"); }, 12000);
      frame.src = embed(view);
    };
    frame.addEventListener("load", () => {
      if (!frame.src || frame.src === "about:blank") return;
      clearTimeout(failTimer); wrap.classList.add("loaded");
    });
    new IntersectionObserver((es, o) => {
      if (es[0].isIntersecting && !loaded) { loaded = true; load(); o.disconnect(); }
    }, { rootMargin: "300px" }).observe(wrap);

    // tap-to-explore shield (scrolling the page will not get stuck inside the map)
    const shield = $("#mapShield");
    shield.addEventListener("click", () => wrap.classList.add("active"));
    document.addEventListener("pointerdown", (e) => {
      if (!wrap.contains(e.target)) wrap.classList.remove("active");   // tap outside: lock again
    });

    // Map / Satellite switch
    $$(".map-tabs .tab").forEach((b) => b.addEventListener("click", () => {
      $$(".map-tabs .tab").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-selected", x === b); });
      view = b.dataset.view;
      loaded = true;
      load();
    }));

  }


  /* =====================================================================
     HAPPY MOMENTS - stacked polaroids: tap / swipe / auto, lightbox
     ===================================================================== */
  function initMoments() {
    const stack = $("#stack");
    const cards = $$(".polaroid", stack);
    const dotsBox = $("#momDots");
    let cur = 0, busy = false, timer, startX = null, moved = false;

    cards.forEach((_, i) => {
      const d = document.createElement("span");
      d.addEventListener("click", () => goTo(i));
      dotsBox.appendChild(d);
    });

    const layout = () => {
      cards.forEach((c, i) => {
        const pos = (i - cur + cards.length) % cards.length;
        c.style.setProperty("--pos", pos);
        c.classList.toggle("top", pos === 0);
      });
      [...dotsBox.children].forEach((d, i) => d.classList.toggle("on", i === cur));
    };
    const next = () => {
      if (busy) return;
      busy = true;
      cards[cur].classList.add("fly");
      setTimeout(() => {
        cards[cur].classList.remove("fly");
        cur = (cur + 1) % cards.length;
        layout();
        busy = false;
      }, 520);
    };
    const goTo = (i) => { if (i === cur) return; while (cur !== i && !busy) { cur = (cur + 1) % cards.length; } layout(); restart(); };
    const restart = () => { clearInterval(timer); timer = setInterval(next, 5200); };

    stack.addEventListener("pointerdown", (e) => { startX = e.clientX; moved = false; clearInterval(timer); });
    stack.addEventListener("pointermove", (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 8) moved = true;
      cards[cur].style.setProperty("--dx", dx + "px");
    });
    const end = (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      cards[cur].style.removeProperty("--dx");
      const hitZoom = e.target.closest && e.target.closest(".zoom");
      if (!hitZoom && (Math.abs(dx) > 40 || !moved)) { next(); }
      startX = null; restart();
    };
    stack.addEventListener("pointerup", end);
    stack.addEventListener("pointercancel", () => { startX = null; cards[cur].style.removeProperty("--dx"); restart(); });

    // lightbox
    const lb = $("#lightbox"), lbImg = $("#lbImg"), lbCap = $("#lbCap");
    let lbi = 0;
    const show = (i) => {
      lbi = (i + cards.length) % cards.length;
      lbImg.classList.remove("swap"); void lbImg.offsetWidth; lbImg.classList.add("swap");
      lbImg.src = $("img", cards[lbi]).src;
      lbCap.textContent = cards[lbi].dataset.cap;
    };
    const open = (card) => {
      show(cards.indexOf(card));
      lb.classList.add("open"); lb.setAttribute("aria-hidden", "false");
    };
    $(".lb-nav.prev", lb).addEventListener("click", (e) => { e.stopPropagation(); show(lbi - 1); });
    $(".lb-nav.next", lb).addEventListener("click", (e) => { e.stopPropagation(); show(lbi + 1); });
    let lx = null;
    lb.addEventListener("touchstart", (e) => { lx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", (e) => {
      if (lx === null) return;
      const dx = e.changedTouches[0].clientX - lx; lx = null;
      if (Math.abs(dx) > 50) { show(lbi + (dx < 0 ? 1 : -1)); e.preventDefault(); }
    });
    const close = () => { lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true"); };
    $$(".zoom", stack).forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); open(b.closest(".polaroid")); }));
    lb.addEventListener("click", close);
    addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") show(lbi + 1);
      if (e.key === "ArrowLeft") show(lbi - 1);
    });

    layout();
    restart();
    new IntersectionObserver((es, o) => {
      if (es[0].isIntersecting) { fx.burst(6); o.disconnect(); }
    }, { threshold: 0.4 }).observe(stack);
  }

  /* =====================================================================
     DATE & TIME - calendar, clock, muhurtham slot, days-left chip
     ===================================================================== */
  const DateTime = {
    el: null,
    init() {
      this.el = $("#dtCard");
      this.buildCalendar();
      this.buildClock();
      this.updateLeft();
      setInterval(() => this.updateLeft(), 60000);
      const lock = $("#dtLock");
      lock.addEventListener("click", () => $("#scratch").scrollIntoView({ behavior: "smooth", block: "center" }));
    },
    buildCalendar() {
      const cal = $("#cal");
      const y = 2026, m = 10;                                   // November
      const first = new Date(y, m, 1).getDay();
      const days = new Date(y, m + 1, 0).getDate();
      const today = new Date();
      const isNov = today.getFullYear() === y && today.getMonth() === m;
      let html = `<div class="cal-head">November 2026</div><div class="cal-grid">`;
      "SMTWTFS".split("").forEach((d) => (html += `<span class="wd">${d}</span>`));
      for (let i = 0; i < first; i++) html += `<span></span>`;
      for (let d = 1; d <= days; d++) {
        const cls = [d === 16 ? "wed" : "", isNov && d < today.getDate() ? "past" : "", isNov && d === today.getDate() ? "today" : ""].join(" ");
        html += `<span class="${cls}" style="--i:${d}">${d === 16 ? "<b>16</b>" : d}</span>`;
      }
      cal.innerHTML = html + "</div>";
    },
    buildClock() {
      const g = $("#clockTicks");
      let t = "";
      for (let i = 0; i < 60; i++) {
        const major = i % 5 === 0, a = (i * 6 * Math.PI) / 180;
        const r1 = major ? 76 : 83, r2 = 89;
        t += `<line class="${major ? "tk big" : "tk"}" x1="${100 + r1 * Math.sin(a)}" y1="${100 - r1 * Math.cos(a)}" x2="${100 + r2 * Math.sin(a)}" y2="${100 - r2 * Math.cos(a)}"/>`;
      }
      [12, 3, 6, 9].forEach((n, i) => {
        const a = (i * 90 * Math.PI) / 180;
        t += `<text class="num" x="${100 + 62 * Math.sin(a)}" y="${100 - 62 * Math.cos(a) + 5}" text-anchor="middle">${n}</text>`;
      });
      g.innerHTML = t;

      // glowing arc for 9:15 -> 10:15
      const pt = (deg) => { const a = (deg * Math.PI) / 180; return [100 + 80 * Math.sin(a), 100 - 80 * Math.cos(a)]; };
      const [x1, y1] = pt(277.5), [x2, y2] = pt(307.5);
      $("#clockArc").setAttribute("d", `M${x1} ${y1} A80 80 0 0 1 ${x2} ${y2}`);
    },
    updateLeft() {
      const diff = CONFIG.weddingStart - new Date();
      const chip = $("#dtLeft");
      if (diff <= 0) { chip.textContent = "Today 💛"; return; }
      const d = Math.ceil(diff / 864e5);
      chip.textContent = d === 1 ? "Tomorrow" : `${d} days to go`;
    },
    unlock() {
      this.el.classList.remove("locked");
      $("#dtLock").style.display = "none";
      // clock hands sweep from 12:00 to 9:15
      const hh = $("#handH"), mm = $("#handM");
      requestAnimationFrame(() => {
        hh.style.transform = "rotate(277.5deg)";
        mm.style.transform = "rotate(90deg)";
      });
      // slot bar: 6 AM .. 12 PM
      const from = (9.25 - 6) / 6 * 100, width = (1 / 6) * 100;
      setTimeout(() => {
        $("#slotFill").style.cssText = `left:${from}%;width:${width}%`;
        $("#slotDot").style.left = from + "%";
      }, 400);
      // count the start time up
      const out = $("#dtStart");
      let n = 0;
      const id = setInterval(() => {
        n++;
        out.textContent = n < 8 ? `${n + 2}:${pad((n * 7) % 60)}` : "9:15";
        if (n >= 8) clearInterval(id);
      }, 80);
      // calendar cells pop in
      $$("#cal .cal-grid span[style]").forEach((c, i) => setTimeout(() => c.classList.add("in"), i * 25));
    },
  };

  /* =====================================================================
     VENUE - sunrise / sunset on the wedding day + animated sun path
     ===================================================================== */
  function sunTimes(lat, lng, tz, y, m, d) {
    const n = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 864e5);
    const g = (2 * Math.PI / 365) * (n - 1);
    const eot = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    const la = (lat * Math.PI) / 180;
    const cosH = Math.cos((90.833 * Math.PI) / 180) / (Math.cos(la) * Math.cos(dec)) - Math.tan(la) * Math.tan(dec);
    const ha = (Math.acos(Math.max(-1, Math.min(1, cosH))) * 180) / Math.PI;
    return {
      rise: 720 - 4 * (lng + ha) - eot + tz * 60,   // minutes after midnight, local time
      set:  720 - 4 * (lng - ha) - eot + tz * 60,
    };
  }
  const fmtMin = (mins) => {
    const h24 = Math.floor(mins / 60), m = Math.round(mins % 60);
    const h = ((h24 + 11) % 12) + 1;
    return `${h}:${pad(m)} ${h24 < 12 ? "AM" : "PM"}`;
  };

  function initVenue() {
    const LAT = 10.5959632, LNG = 78.4339017;
    const { rise, set } = sunTimes(LAT, LNG, 5.5, 2026, 11, 16);
    $("#vSunrise").textContent = fmtMin(rise);
    $("#vSunset").textContent = fmtMin(set);

    const start = 9.25 * 60;
    const frac = (start - rise) / (set - rise);
    const after = start - rise;
    $("#sunNote").textContent =
      `Muhurtham begins about ${Math.floor(after / 60)} h ${Math.round(after % 60)} min after sunrise, in soft golden morning light.`;

    const path = $("#sunPath"), dot = $("#sunDot");
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    const place = (f) => { const p = path.getPointAtLength(f * len); dot.setAttribute("transform", `translate(${p.x} ${p.y})`); };
    place(0);

    const animate = () => {
      const t0 = performance.now(), dur = 2600;
      const step = (now) => {
        const k = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - k, 3);
        const f = frac * e;
        path.style.strokeDashoffset = len * (1 - f);
        place(f);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { animate(); o.disconnect(); } }, { threshold: 0.5 }).observe($(".sun-card"));

    const grid = $("#vGrid");
    $$(".v-item", grid).forEach((it, i) => it.style.setProperty("--d", i * 90 + "ms"));
    new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { grid.classList.add("in"); o.disconnect(); } }, { threshold: 0.25 }).observe(grid);
  }


  /* =====================================================================
     PREMIUM EXTRAS - parallax, cursor glow, magnetic buttons, card tilt,
     section dots navigation
     ===================================================================== */
  function initPremium() {
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // background parallax (bounded, so it never shows an edge)
    const bg = $("#bgMuruga");
    let tick = false;
    const par = () => {
      tick = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? scrollY / max : 0;
      bg.style.setProperty("--py", ((0.5 - p) * 50).toFixed(1) + "px");
    };
    if (!reduce) addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(par); } }, { passive: true });
    par();

    // section dots (laptop / desktop)
    const defs = [[".hero", "Home"], [".couple", "Couple"], [".quotes", "Love"], [".scratch-sec", "Date & Time"], [".count-sec", "Countdown"], [".venue", "Venue"], [".moments", "Moments"]];
    const nav = $("#sideNav");
    const items = defs.map(([sel, label]) => ({ el: $(sel), label })).filter((d) => d.el);
    items.forEach((d) => {
      const b = document.createElement("button");
      b.type = "button"; b.setAttribute("aria-label", d.label);
      b.innerHTML = `<span>${d.label}</span>`;
      b.addEventListener("click", () => d.el.scrollIntoView({ behavior: "smooth", block: "start" }));
      nav.appendChild(b); d.btn = b;
    });
    const spy = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        items.forEach((d) => d.btn.classList.toggle("on", d.el === e.target));
      });
    }, { rootMargin: "-40% 0px -50% 0px" });
    items.forEach((d) => spy.observe(d.el));

    if (!fine || reduce) return;

    // cursor glow
    const glow = $("#cursorGlow");
    let gx = 0, gy = 0, tx = 0, ty = 0;
    addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; glow.classList.add("on"); });
    document.addEventListener("pointerleave", () => glow.classList.remove("on"));
    (function loop() {
      gx += (tx - gx) * 0.14; gy += (ty - gy) * 0.14;
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
      requestAnimationFrame(loop);
    })();

    // magnetic buttons
    $$(".btn-gold, .btn-ghost, #musicBtn").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25, y = (e.clientY - r.top - r.height / 2) * 0.35;
        b.style.transform = `translate(${x}px, ${y}px)`;
      });
      b.addEventListener("pointerleave", () => (b.style.transform = ""));
    });

    // gentle 3D tilt on cards
    $$(".glass, .dt-card").forEach((c) => {
      c.addEventListener("pointermove", (e) => {
        if (!c.classList.contains("show") && c.classList.contains("reveal")) return;
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        c.style.transition = "transform .15s ease-out";
        c.style.transform = `perspective(1000px) rotateY(${x * 3}deg) rotateX(${-y * 3}deg)`;
      });
      c.addEventListener("pointerleave", () => { c.style.transition = ""; c.style.transform = ""; });
    });
  }


  /* =====================================================================
     LUXURY LAYER - ornaments, twinkles, back-to-top ring, alternating
     reveals, floating hero photo
     ===================================================================== */
  function initLuxury() {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ornamental dividers between sections
    const orn = `<svg viewBox="0 0 300 24" aria-hidden="true">
      <defs><linearGradient id="og" x1="0" x2="1"><stop offset="0" stop-color="#d9a73a" stop-opacity="0"/><stop offset=".5" stop-color="#fbeab0"/><stop offset="1" stop-color="#d9a73a" stop-opacity="0"/></linearGradient></defs>
      <line x1="0" y1="12" x2="118" y2="12" stroke="url(#og)" stroke-width="1.4"/>
      <line x1="182" y1="12" x2="300" y2="12" stroke="url(#og)" stroke-width="1.4"/>
      <path d="M150 2 L158 12 L150 22 L142 12Z" fill="#fbeab0" stroke="#d9a73a" stroke-width="1"/>
      <circle cx="130" cy="12" r="2.4" fill="#fbeab0"/><circle cx="170" cy="12" r="2.4" fill="#fbeab0"/>
      <circle cx="116" cy="12" r="1.5" fill="#d9a73a"/><circle cx="184" cy="12" r="1.5" fill="#d9a73a"/>
    </svg>`;
    const ornIO = new IntersectionObserver((es, o) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("show"); o.unobserve(e.target); } }), { threshold: 0.3 });
    [".quotes", ".scratch-sec", ".count-sec", ".moments"].forEach((sel) => {
      const el = $(sel);
      if (!el) return;
      const d = document.createElement("div");
      d.className = "orn";
      d.innerHTML = orn;
      el.parentNode.insertBefore(d, el);
      ornIO.observe(d);
    });

    // alternating slide directions for reveals
    $$("#invite > .reveal").forEach((el, i) => { el.dataset.from = i % 2 ? "right" : "left"; });

    // twinkling gold dust (static positions, no falling)
    if (!reduce) {
      const box = document.createElement("div");
      box.id = "stars"; box.setAttribute("aria-hidden", "true");
      const n = innerWidth < 600 ? 16 : 30;
      for (let i = 0; i < n; i++) {
        const s = document.createElement("i");
        s.style.cssText = `left:${rand(0, 100)}%;top:${rand(0, 100)}%;--s:${rand(2, 5).toFixed(1)}px;--d:${rand(2.5, 6).toFixed(1)}s;animation-delay:${rand(0, 5).toFixed(1)}s`;
        box.appendChild(s);
      }
      document.body.appendChild(box);
    }

    // back-to-top button with a scroll progress ring
    const top = $("#toTop"), bar = $("#toTopBar");
    const C = 2 * Math.PI * 19;
    bar.style.strokeDasharray = C;
    let tick = false;
    const upd = () => {
      tick = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(scrollY / max, 1) : 0;
      bar.style.strokeDashoffset = C * (1 - p);
      top.classList.toggle("show", scrollY > 500);
      // hero photo floats slightly slower than the page
      const orbit = $(".photo-orbit");
      if (orbit && !reduce) orbit.style.setProperty("--fy", Math.min(scrollY * 0.06, 40).toFixed(1) + "px");
    };
    addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    top.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
    upd();
  }

  /* =====================================================================
     6. START EVERYTHING
     ===================================================================== */
  const fx = new FlowerFX($("#fx"));

  Background.init();
  Music.init();
  initTilt();
  initRipple();
  initScroll();
  initQuotes();
  initCountdown();
  initMap();
  initVenue();
  DateTime.init();
  initMoments();
  initPremium();
  initLuxury();

  // scratch card
  const heartWrap = $("#heartWrap");
  const hint = $("#scratchHint");
  const meter = $("#meterFill"), pct = $("#scratchPct");

  const heart = new ScratchHeart({
    wrap: heartWrap,
    canvas: $("#scratch"),
    svg: $("#heartSvg"),
    fx,
    onFirstScratch() {
      hint.textContent = "Keep scratching... 💞";
      fx.setRate(3);                                   // flowers start falling as you scratch
    },
    onProgress(p) {
      const v = Math.round(p * 100);
      pct.textContent = v;
      meter.style.width = v + "%";
    },
    onReveal() {
      hint.textContent = "Save the date. We can't wait to celebrate with you! 💖";
      DateTime.unlock();
      $("#revealBtn").style.display = "none";
      Music.chime();
      if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
      fx.burst(24);                                    // heavy flower shower top to bottom
      const r = heartWrap.getBoundingClientRect();
      fx.heartBurst(r.left + r.width / 2, r.top + r.height * 0.45, 18);
      fx.setRate(2);
      setTimeout(() => fx.setRate(0.8), 7000);            // calm down to a gentle fall
    },
  });
  $("#revealBtn").addEventListener("click", () => heart.reveal());

  // open the invitation
  $("#openBtn").addEventListener("click", async () => {
    $("#intro").classList.add("open");
    document.body.classList.remove("locked");
    $("#musicBtn").classList.remove("hidden");
    Music.play();
    scrollTo(0, 0);
    fx.burst(10);
    fx.setRate(0.8);
    setTimeout(() => $("#intro").classList.add("gone"), 1800);

    await sleep(900);
    await typeText($("#typeName1"), 95);
    await typeText($("#typeName2"), 110);
  });

  // hide names until the invitation opens so the typewriter can play
  $("#typeName1").dataset.full = $("#typeName1").textContent;
  $("#typeName2").dataset.full = $("#typeName2").textContent;
  $("#typeName1").textContent = "";
  $("#typeName2").textContent = "";
})();
