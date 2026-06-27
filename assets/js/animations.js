/* =========================================================
   Meridian / Grand Central — Animation layer (Pass 2)
   Listens for `slide:enter` and runs per-slide reveals.
   Every routine resets first so it replays on re-entry.
   ========================================================= */
(function () {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ---------- helpers ---------- */
  function clearTimers(el) {
    if (el && el._timers) { el._timers.forEach(clearTimeout); }
    if (el) el._timers = [];
  }
  function after(el, ms, fn) {
    const t = setTimeout(fn, ms);
    (el._timers = el._timers || []).push(t);
    return t;
  }

  /* ---------- counters ---------- */
  function runCounters(slide) {
    $$(".stat__n[data-count]", slide).forEach((node) => {
      const target = parseFloat(node.getAttribute("data-count"));
      const prefix = node.getAttribute("data-prefix") || "";
      const suffix = node.getAttribute("data-suffix") || "";
      const decimals = (String(target).split(".")[1] || "").length;
      const fmt = (v) => prefix + (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString()) + suffix;

      if (reduce) { node.textContent = fmt(target); return; }

      const dur = 900;
      const start = performance.now();
      function tick(now) {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        node.textContent = fmt(target * eased);
        if (p < 1) requestAnimationFrame(tick);
        else node.textContent = fmt(target);
      }
      requestAnimationFrame(tick);
    });
  }

  /* ---------- pivot reveal (slide 9: simple) ---------- */
  function revealPivotSimple(slide) {
    const tbl = $(".tbl", slide);
    if (!tbl) return;
    const cells = $$(".cell", tbl);
    clearTimers(tbl);
    tbl.classList.remove("revealed");
    if (reduce) { tbl.classList.add("revealed"); cells.forEach(c => c.style.transitionDelay = "0ms"); return; }
    cells.forEach((c, i) => c.style.transitionDelay = (i * 45) + "ms");
    // force reflow so the removal applies before re-adding
    void tbl.offsetWidth;
    requestAnimationFrame(() => tbl.classList.add("revealed"));
  }

  /* ---------- THE clustering reveal (slide 10) ---------- */
  function revealCluster(slide) {
    const tbl = $(".js-reveal", slide) || $(".tbl", slide);
    if (!tbl) return;
    const cells = $$(".cell", tbl);
    clearTimers(tbl);
    tbl.classList.remove("revealed", "washed");

    if (reduce) { tbl.classList.add("revealed", "washed"); return; }

    // Phase 1 — numbers fade in, reading order, NO colour yet
    cells.forEach((c, i) => c.style.transitionDelay = (i * 50) + "ms");
    void tbl.offsetWidth;
    requestAnimationFrame(() => tbl.classList.add("revealed"));

    // Phase 2 — after the grid reads as "random", wash the clusters in
    const washAt = cells.length * 50 + 750;
    after(tbl, washAt, () => {
      // drop the per-cell delays so the wash feels like one sweep
      cells.forEach((c) => c.style.transitionDelay = "0ms");
      tbl.classList.add("washed");
    });
  }

  /* ---------- architecture diagram fade-in (s3) ---------- */
  function drawArchitecture(slide) {
    const svg = $("svg", slide);
    if (!svg) return;
    clearTimers(svg);

    const lines = $$("line", svg);
    const boxes = $$("rect", svg);
    const texts = $$("text", svg);

    if (reduce) {
      [...lines, ...boxes, ...texts].forEach(n => { n.style.opacity = 1; });
      return;
    }

    // start hidden
    [...lines, ...boxes, ...texts].forEach((n) => {
      n.style.opacity = "0";
      n.style.transition = "opacity 0.45s var(--ease)";
    });

    void svg.getBoundingClientRect();

    // boxes first, then connecting lines, then labels — reads as the system assembling
    after(svg, 80,  () => boxes.forEach((n, i) => after(svg, i * 70, () => { n.style.opacity = "1"; })));
    after(svg, 360, () => lines.forEach((n, i) => after(svg, i * 60, () => { n.style.opacity = "1"; })));
    after(svg, 620, () => texts.forEach((n, i) => after(svg, i * 25, () => { n.style.opacity = "1"; })));
  }

  /* ---------- SVG draw (roadmap s29) ---------- */
  function drawRoadmap(slide) {
    const svg = $("svg", slide);
    if (!svg) return;
    clearTimers(svg);

    const line = $("line", svg);
    const circles = $$("circle", svg);
    const texts = $$("text", svg);

    if (reduce) {
      if (line) line.classList.remove("draw-line");
      [...circles, ...texts].forEach(n => n.style.opacity = 1);
      return;
    }

    if (line) {
      let len = 1020;
      try {
        const tl = line.getTotalLength();
        len = (tl && tl > 0) ? tl : 1020;
      } catch (e) {}
      line.classList.add("draw-line");
      line.classList.remove("is-drawn");
      line.style.setProperty("--len", len);
    }
    [...circles, ...texts].forEach((n) => { n.style.opacity = "0"; n.style.transition = "opacity 0.4s var(--ease), transform 0.5s cubic-bezier(0.34,1.56,0.64,1)"; });
    circles.forEach((c) => { c.style.transformBox = "fill-box"; c.style.transformOrigin = "center"; c.style.transform = "scale(0.2)"; });

    void svg.getBoundingClientRect();

    if (line) after(svg, 60, () => line.classList.add("is-drawn"));
    // pop nodes along the line
    circles.forEach((c, i) => after(svg, 300 + i * 200, () => { c.style.opacity = "1"; c.style.transform = "scale(1)"; }));
    texts.forEach((t, i) => after(svg, 380 + Math.floor(i / 2) * 200, () => { t.style.opacity = "1"; }));
  }

  /* ---------- log lines reveal (slide 15) ---------- */
  function revealLogs(slide) {
    $$(".code", slide).forEach((card) => {
      const lines = $$(".code__line", card);
      clearTimers(card);
      card.classList.remove("is-reading");
      if (reduce) { card.classList.add("is-reading"); lines.forEach(l => l.style.transitionDelay = "0ms"); return; }
      lines.forEach((l, i) => l.style.transitionDelay = (i * 90) + "ms");
      void card.offsetWidth;
      requestAnimationFrame(() => card.classList.add("is-reading"));
    });
  }

  /* ---------- dispatch table ---------- */
  const ROUTINES = {
    s2:  runCounters,
    s3:  drawArchitecture,
    s6:  runCounters,
    s7:  revealCluster,
    s9:  revealLogs,
    s14: drawRoadmap
  };

  window.addEventListener("slide:enter", (e) => {
    const { id, index } = e.detail;
    const slide = document.getElementById(id);
    if (!slide) return;
    const fn = ROUTINES[id];
    if (fn) {
      // small delay lets the slide transition settle before the reveal
      setTimeout(() => fn(slide), 180);
    }
  });
})();
