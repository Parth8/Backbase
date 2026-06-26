/* =========================================================
   Meridian / Grand Central — Presentation controller
   Handles: slide navigation, keyboard, rail progress, act nodes
   ========================================================= */
(function () {
  "use strict";

  const slides = Array.from(document.querySelectorAll(".slide"));
  const total = slides.length;
  let current = 0;

  // Act definitions: which slide indices belong to which act
  // Six acts mapped to the bottom rail nodes
  const ACTS = [
    { name: "Setting the Scene", start: 0 },   // S1-3
    { name: "The Crisis",        start: 3 },   // S4-5
    { name: "The Investigation", start: 5 },   // S6-10
    { name: "The Decision",      start: 10 },  // S11-12
    { name: "The Fix",           start: 12 },  // S13-14
    { name: "Resolution",        start: 14 }   // S15
  ];

  const navLeft  = document.querySelector(".navzone--left");
  const navRight = document.querySelector(".navzone--right");
  const railProgress = document.querySelector(".rail__progress");
  const railNodes = Array.from(document.querySelectorAll(".rail__node"));
  const metaNum = document.querySelector(".meta__num");
  const metaAct = document.querySelector(".meta__act");

  function actIndexForSlide(i) {
    let act = 0;
    for (let a = 0; a < ACTS.length; a++) {
      if (i >= ACTS[a].start) act = a;
    }
    return act;
  }

  function dispatchEnter() {
    const slide = slides[current];
    if (!slide) return;
    window.dispatchEvent(new CustomEvent("slide:enter", {
      detail: { index: current, id: slide.id }
    }));
  }

  function updateChrome() {
    // progress line width
    const pct = total > 1 ? (current / (total - 1)) * 100 : 0;
    if (railProgress) railProgress.style.width = pct + "%";

    // act nodes state
    const activeAct = actIndexForSlide(current);
    railNodes.forEach((node, a) => {
      let state = "todo";
      if (a < activeAct) state = "done";
      else if (a === activeAct) state = "active";
      node.setAttribute("data-state", state);
    });

    // meta corner
    if (metaNum) {
      metaNum.innerHTML = "<b>" + String(current + 1).padStart(2, "0") + "</b> / " + String(total).padStart(2, "0");
    }
    if (metaAct) {
      metaAct.textContent = ACTS[activeAct].name;
    }

    // nav button enabled/disabled
    if (navLeft) navLeft.disabled = current === 0;
    if (navRight) navRight.disabled = current === total - 1;
  }

  function goTo(index) {
    if (index < 0 || index >= total || index === current) return;
    const prev = current;
    current = index;

    slides.forEach((s, i) => {
      s.classList.remove("is-active", "is-prev");
      if (i === current) {
        s.classList.add("is-active");
      } else if (i < current) {
        s.classList.add("is-prev");
      }
    });

    // reset scroll position of the newly active slide
    if (slides[current]) slides[current].scrollTop = 0;

    updateChrome();

    // notify animation layer
    dispatchEnter();

    // update hash without jumping
    history.replaceState(null, "", "#" + (current + 1));
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  // ---- Events ----
  if (navLeft) navLeft.addEventListener("click", prev);
  if (navRight) navRight.addEventListener("click", next);

  // rail node click → jump to act start
  railNodes.forEach((node, a) => {
    node.addEventListener("click", () => goTo(ACTS[a].start));
  });

  // keyboard
  document.addEventListener("keydown", (e) => {
    // ignore if focus is in an input/textarea
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;

    switch (e.key) {
      case "ArrowRight":
      case "PageDown":
        e.preventDefault(); next(); break;
      case " ":
        e.preventDefault(); next(); break;
      case "ArrowLeft":
      case "PageUp":
        e.preventDefault(); prev(); break;
      case "Home":
        e.preventDefault(); goTo(0); break;
      case "End":
        e.preventDefault(); goTo(total - 1); break;
      default:
        // number keys 1-6 jump to acts
        if (e.key >= "1" && e.key <= "6") {
          const a = parseInt(e.key, 10) - 1;
          if (ACTS[a]) { e.preventDefault(); goTo(ACTS[a].start); }
        }
    }
  });

  // touch / swipe
  let touchX = null, touchY = null;
  document.addEventListener("touchstart", (e) => {
    touchX = e.changedTouches[0].clientX;
    touchY = e.changedTouches[0].clientY;
  }, { passive: true });
  document.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    // horizontal swipe, not a vertical scroll
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) next(); else prev();
    }
    touchX = touchY = null;
  }, { passive: true });

  // wheel navigation (debounced, horizontal-ish / large vertical)
  let wheelLock = false;
  document.addEventListener("wheel", (e) => {
    const active = slides[current];
    // if the slide is scrollable and not at an edge, let it scroll
    if (active) {
      const atTop = active.scrollTop <= 0;
      const atBottom = active.scrollTop + active.clientHeight >= active.scrollHeight - 2;
      const scrollable = active.scrollHeight > active.clientHeight + 4;
      if (scrollable && !((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom))) {
        return; // allow internal scroll
      }
    }
    if (wheelLock) return;
    if (Math.abs(e.deltaY) < 24 && Math.abs(e.deltaX) < 24) return;
    wheelLock = true;
    if (e.deltaY > 0 || e.deltaX > 0) next(); else prev();
    setTimeout(() => { wheelLock = false; }, 700);
  }, { passive: true });

  // deep-link via hash on load
  function initFromHash() {
    const h = parseInt((location.hash || "").replace("#", ""), 10);
    if (!isNaN(h) && h >= 1 && h <= total) {
      current = h - 1;
    }
    slides.forEach((s, i) => {
      s.classList.toggle("is-active", i === current);
      s.classList.toggle("is-prev", i < current);
    });
    updateChrome();
    dispatchEnter();
  }

  initFromHash();
})();
