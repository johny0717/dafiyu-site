/* 大肥鱼 · site behaviour — 零依赖，手写 */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TIER = { "值得看": "good", "可以看": "ok", "不值当": "meh" };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let DATA = null;
  let accent = "#5fe3c9";

  /* ---------------- theme ---------------- */
  function applyTheme(name) {
    document.documentElement.dataset.theme = name;
    localStorage.setItem("dafiyu-theme", name);
    const btn = $("#themeBtn");
    if (btn) btn.textContent = name === "deep" ? "☀" : "☾";
    const cs = getComputedStyle(document.documentElement);
    accent = (cs.getPropertyValue("--accent") || "#5fe3c9").trim();
  }
  function initTheme() {
    const saved = localStorage.getItem("dafiyu-theme") || "deep";
    applyTheme(saved);
    const btn = $("#themeBtn");
    if (btn) btn.addEventListener("click", () => {
      applyTheme(document.documentElement.dataset.theme === "deep" ? "dawn" : "deep");
    });
  }

  /* ---------------- nav / progress / cursor ---------------- */
  function initNav() {
    const nav = $("#nav");
    const onScroll = () => {
      if (nav) nav.classList.toggle("scrolled", window.scrollY > 24);
      const p = $("#progress");
      if (p) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        p.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    const page = document.body.dataset.page;
    $$("[data-nav]").forEach((a) => { if (a.dataset.nav === page) a.classList.add("active"); });
  }

  function initCursor() {
    const el = $(".cursor-glow");
    if (!el || reduced || !window.matchMedia("(hover: hover)").matches) return;
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    window.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      el.style.transform = `translate(${x - 260}px, ${y - 260}px)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ---------------- canvas sea ---------------- */
  function initCanvas() {
    const c = $("#sea");
    if (!c) return;
    const ctx = c.getContext("2d");
    let w = 0, h = 0, dpr = 1, last = 0, t = 0, mx = -999, my = -999;
    let dots = [], fishes = [];
    const rand = (a, b) => a + Math.random() * (b - a);

    function seed() {
      dots = [];
      const n = Math.min(72, Math.max(28, Math.floor((w * h) / 30000)));
      for (let i = 0; i < n; i++) {
        dots.push({ x: rand(0, w), y: rand(0, h), r: rand(0.6, 2.2), v: rand(0.06, 0.26), a: rand(0.08, 0.3), p: rand(0, 6.28) });
      }
      fishes = [
        { x: -200, y: h * 0.3, s: 0.9, dir: 1, sp: 0.16, a: 0.05 },
        { x: w + 220, y: h * 0.72, s: 1.25, dir: -1, sp: 0.1, a: 0.035 },
      ];
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      c.width = Math.floor(w * dpr); c.height = Math.floor(h * dpr);
      c.style.width = w + "px"; c.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function drawFish(f) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(f.s * f.dir, f.s);
      ctx.globalAlpha = f.a;
      ctx.fillStyle = accent;
      ctx.beginPath(); ctx.ellipse(0, 0, 74, 34, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(108, -28); ctx.lineTo(102, 28); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(18, -8, 10, 6, -0.4, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fill();
      ctx.restore();
    }

    function draw(dt) {
      ctx.clearRect(0, 0, w, h);
      fishes.forEach((f) => {
        f.x += f.sp * f.dir * dt * 60;
        if (f.dir > 0 && f.x > w + 260) f.x = -260;
        if (f.dir < 0 && f.x < -260) f.x = w + 260;
        drawFish(f);
      });

      for (const d of dots) {
        d.y -= d.v * dt * 60;
        d.p += dt;
        if (d.y < -10) { d.y = h + 10; d.x = rand(0, w); }
        const dx = d.x - mx, dy = d.y - my, dist = Math.hypot(dx, dy);
        if (dist < 130 && dist > 0.1) {
          d.x += (dx / dist) * (1 - dist / 130) * 1.4;
          d.y += (dy / dist) * (1 - dist / 130) * 1.4;
        }
        ctx.beginPath();
        ctx.arc(d.x, d.y + Math.sin(d.p + d.x * 0.01) * 4, d.r, 0, Math.PI * 2);
        ctx.globalAlpha = d.a;
        ctx.fillStyle = accent;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // slow waves
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        const base = h - 40 - k * 16;
        for (let x = 0; x <= w; x += 14) {
          const y = base + Math.sin(x * 0.006 + t * (0.5 + k * 0.2) + k) * (10 + k * 5);
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.globalAlpha = 0.045 - k * 0.01;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      t += dt;
      draw(dt);
      requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });
    if (reduced) { draw(0.016); return; }

    let raf = 0, started = false;
    const start = () => {
      if (started) return;
      started = true; last = performance.now(); raf = requestAnimationFrame(frame);
    };
    const stop = () => { started = false; cancelAnimationFrame(raf); };
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    start();
  }

  /* ---------------- reveal / tilt ---------------- */
  let observer = null;
  function observeReveal() {
    if (reduced) { $$(".reveal").forEach((el) => el.classList.add("in")); return; }
    if (!observer) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); observer.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    }
    $$(".reveal:not(.in)").forEach((el) => observer.observe(el));
  }

  function initTilt() {
    if (reduced || !window.matchMedia("(hover: hover)").matches) return;
    $$(".pick").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `translateY(-5px) rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 4).toFixed(2)}deg)`;
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  }

  /* ---------------- render helpers ---------------- */
  function pickCard(p) {
    const tier = TIER[p.tier] || "ok";
    return `<article class="card pick reveal">
      <div class="pick-top"><span class="badge ${tier}">${esc(p.tier || "可以看")}</span><span class="meta">${esc(p.date)}</span></div>
      <h3>${esc(p.title)}</h3>
      <p class="why">${esc(p.why)}</p>
      ${p.quote ? `<p class="quote">“${esc(p.quote)}”</p>` : ""}
      <div class="meta"><span>${esc(p.up)} · ${esc(p.bvid)}</span><button class="copy" data-link="${esc(p.link)}">复制 BV</button></div>
    </article>`;
  }

  function renderPicks() {
    const grid = $("#pondGrid");
    if (!grid || !DATA) return;
    grid.innerHTML = DATA.picks.slice(0, 6).map(pickCard).join("");
    observeReveal(); initTilt(); initCopy();
  }

  function renderTimeline() {
    const box = $("#timeline");
    if (!box || !DATA) return;
    box.innerHTML = (DATA.timeline || []).map((line) => {
      const m = line.match(/^(2026-\d{2}-\d{2})(?:\s+[\d:]+)?[：:]\s*([\s\S]+)$/) || line.match(/^(2026-\d{2}-\d{2})[^\d]*([\s\S]*)$/);
      const date = m ? m[1] : "";
      const text = m ? m[2] : line;
      return `<div class="tl-item"><div class="tl-date">${esc(date)}</div><div class="tl-text">${esc(text)}</div></div>`;
    }).join("");
    observeReveal();
  }

  function renderChips(sel) {
    const box = $(sel);
    if (!box || !DATA) return;
    box.innerHTML = (DATA.chips || []).map((c) => `<span class="chip"><i>${esc(c.icon)}</i>${esc(c.label)}</span>`).join("");
  }

  function setStat(id, value) {
    const el = $(id);
    if (el && value !== undefined && value !== null) el.textContent = value;
  }

  function renderHome() {
    if (!DATA) return;
    setStat("#stat-picks", DATA.stats.picks);
    setStat("#stat-plugins", DATA.stats.plugins);
    setStat("#stat-rules", DATA.stats.rules);
    setStat("#stat-memories", DATA.stats.memories);
    setStat("#stat-learnings", DATA.stats.learnings);
    setStat("#stat-reports", DATA.stats.reports);
    setStat("#stat-fav", DATA.stats.fav);
    setStat("#stat-following", DATA.stats.following);
    renderTimeline();
    renderPicks();
    renderChips("#chipList");
    const fb = $("#footerBytes");
    if (fb) fb.textContent = "≈ 42 KB · 含头像";
  }

  function renderMarquee() {
    const track = $("#marqueeTrack");
    if (!track) return;
    const quotes = (DATA && DATA.quotes && DATA.quotes.length) ? DATA.quotes : ["不是每条视频都值得说一句，但说出口的那句要像鱼说的。"];
    const text = quotes.map((q) => `<span>${esc(q)}</span>`).join("");
    track.innerHTML = text + text;
  }

  /* ---------------- diary ---------------- */
  let diaryFilter = "全部";
  function renderDiary() {
    const list = $("#diaryList");
    if (!list) return;
    const all = (DATA && DATA.picks) || [];
    const rows = diaryFilter === "全部" ? all : all.filter((p) => p.tier === diaryFilter);
    if (!rows.length) { list.innerHTML = `<p style="color:var(--muted)">这个档位还没有日记。</p>`; return; }
    list.innerHTML = rows.map((p) => `<article class="diary-item reveal">
      <div class="diary-date">${esc(p.date)}<br>${esc(p.bvid)}</div>
      <div class="diary-body">
        <h3>${esc(p.title)}</h3>
        <p class="why">${esc(p.why)}</p>
        ${p.quote ? `<p class="quote">“${esc(p.quote)}”</p>` : ""}
        <div class="diary-meta"><span class="badge ${TIER[p.tier] || "ok"}">${esc(p.tier || "")}</span><span>${esc(p.up)}</span><a class="link-arrow" href="${esc(p.link)}" target="_blank" rel="noopener">去 B站看 <i>↗</i></a></div>
      </div>
    </article>`).join("");
    observeReveal();
  }
  function initFilters() {
    $$("#filters .filter").forEach((btn) => {
      btn.addEventListener("click", () => {
        diaryFilter = btn.dataset.filter;
        $$("#filters .filter").forEach((b) => b.classList.toggle("active", b === btn));
        renderDiary();
      });
    });
  }

  /* ---------------- about ---------------- */
  function renderAbout() {
    if (!DATA) return;
    const rules = $("#ruleList");
    if (rules) rules.innerHTML = DATA.rules.map((r, i) => `<div class="rule"><b>${String(i + 1).padStart(2, "0")}</b><span>${esc(r)}</span></div>`).join("");
    const arch = $("#archGrid");
    if (arch) arch.innerHTML = DATA.architecture.map((a) => `<div class="card arch"><div class="n">${esc(a.n)}</div><h4>${esc(a.t)}</h4><p>${esc(a.d)}</p></div>`).join("");
    const plugs = $("#pluginCloud");
    if (plugs) plugs.innerHTML = DATA.plugins.map((p) => `<span class="plugin">${esc(p)}</span>`).join("");
    renderChips("#chipList");
    const fb = $("#footerBytes");
    if (fb) fb.textContent = "≈ 42 KB · 含头像";
  }

  /* ---------------- copy ---------------- */
  function initCopy() {
    $$(".copy").forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const link = btn.dataset.link || "";
        const bv = (link.match(/BV[0-9A-Za-z]+/) || [link])[0];
        try {
          await navigator.clipboard.writeText(link || bv);
          const old = btn.textContent;
          btn.textContent = "已复制";
          setTimeout(() => { btn.textContent = old; }, 1400);
        } catch (_) {
          window.prompt("复制这个 BV 号：", bv);
        }
      });
    });
  }

  /* ---------------- boot ---------------- */
  async function boot() {
    if (new URLSearchParams(location.search).get("preview") === "full") document.body.classList.add("preview-full");
    initTheme();
    initNav();
    initCursor();
    initCanvas();
    observeReveal();
    try {
      const res = await fetch("data.json", { cache: "no-store" });
      DATA = await res.json();
    } catch (e) { DATA = null; }
    renderMarquee();
    const page = document.body.dataset.page;
    if (page === "home") renderHome();
    if (page === "diary") { initFilters(); renderDiary(); }
    if (page === "about") renderAbout();
    observeReveal();
    // failsafe: never leave content invisible if IntersectionObserver is unavailable/throttled
    setTimeout(() => $$(".reveal:not(.in)").forEach((el) => el.classList.add("in")), 1600);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
