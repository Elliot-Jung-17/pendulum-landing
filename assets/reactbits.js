// ============================================================================
// PENDULUM LAB — React Bits effects, ported to framework-free vanilla JS.
// Adapted from React Bits (MIT): MagicBento (spotlight + particles + border
// glow + tilt + magnetism) and DecryptedText (scramble-on-view). Re-skinned to
// the site's cyan/violet DNA.
// Uses the already-loaded global GSAP; degrades gracefully without it and under
// reduced-motion / coarse-pointer devices.
// ============================================================================
(function () {
  'use strict';

  const query = new URLSearchParams(window.location.search);
  const queryFlag = (name) => /^(?:1|true|yes)$/i.test(query.get(name) || '');
  const captureMode = queryFlag('captureHero') || window.__PENDULUM_CAPTURE_HERO === true;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactQuery = window.matchMedia('(max-width: 720px)');
  const fineQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const readReduced = () => motionQuery.matches || compactQuery.matches
    || navigator.connection?.saveData === true || captureMode;
  let reduced = readReduced();
  let fine = fineQuery.matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const CYAN = '24, 212, 248';
  const VIOLET = '157, 120, 255';

  // ==========================================================================
  // 1) DECRYPTED TEXT — structure-preserving scramble reveal.
  //    When a heading or short label scrolls in, every text node inside it is
  //    scrambled independently and then resolved left→right. Because we only
  //    rewrite text-node values (never innerHTML), gradient spans, <br> line
  //    breaks and inline <em> all survive. Every active reveal shares ONE
  //    requestAnimationFrame ticker, so the whole page decodes smoothly.
  // ==========================================================================
  const SCRAMBLE = '!<>-_\\/[]{}—=+*^?#01λθφΔΣπ§%';
  const randGlyph = () => SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0];
  const isSpace = (ch) => ch === ' ' || ch === '\n' || ch === '\t' || ch === ' ';

  // Never scramble text owned by another script: injected evidence numbers,
  // the count-up telemetry, or another script-owned region.
  const DECRYPT_SKIP = '[data-count],[data-evidence],[data-evidence-count],[data-no-decrypt]';

  function collectTextNodes(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (parent && parent.closest(DECRYPT_SKIP)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push({ node: n, base: n.nodeValue });
    return nodes;
  }

  const scrambleJobs = [];
  let scrambleTicking = false;

  function renderScramble(job, revealChars) {
    let pos = 0;
    for (const item of job.nodes) {
      const base = item.base;
      let out = '';
      for (let i = 0; i < base.length; i++) {
        const ch = base[i];
        if (isSpace(ch)) { out += ch; pos++; continue; }
        out += pos < revealChars ? ch : randGlyph();
        pos++;
      }
      item.node.nodeValue = out;
    }
  }

  function finishScramble(job) {
    const index = scrambleJobs.indexOf(job);
    if (index === -1) return;
    clearTimeout(job.deadline);
    for (const item of job.nodes) item.node.nodeValue = item.base; // exact restore
    if (job.visual && job.accessible) {
      while (job.visual.firstChild) job.el.insertBefore(job.visual.firstChild, job.visual);
      job.visual.remove();
      job.accessible.remove();
    }
    job.el.classList.remove('is-decrypting');
    job.el.classList.add('is-decrypted');
    scrambleJobs.splice(index, 1);
  }

  function tickScramble(now) {
    for (let i = scrambleJobs.length - 1; i >= 0; i--) {
      const job = scrambleJobs[i];
      if (now < job.start) { continue; }              // held fully scrambled
      const t = Math.min(1, (now - job.start) / job.duration);
      renderScramble(job, Math.floor(job.total * t));
      if (t >= 1) finishScramble(job);
    }
    if (scrambleJobs.length) requestAnimationFrame(tickScramble);
    else scrambleTicking = false;
  }

  function startScramble(el, delay) {
    if (el.__decrypted) return;
    el.__decrypted = true;
    const accessibleText = (el.textContent || '').replace(/\s+/g, ' ').trim();
    const nodes = collectTextNodes(el);
    if (!nodes.length) return;
    let total = 0;
    for (const item of nodes) {
      for (let i = 0; i < item.base.length; i++) if (!isSpace(item.base[i])) total++;
    }
    if (!total) return;
    // Keep a stable, valid accessible copy while the visible glyphs animate.
    // `aria-label` is not permitted on every generic span in the target list,
    // so use real hidden text and hide only the transient visual copy.
    const visual = document.createElement('span');
    visual.className = 'scramble-visual';
    visual.setAttribute('aria-hidden', 'true');
    while (el.firstChild) visual.append(el.firstChild);
    const accessible = document.createElement('span');
    accessible.className = 'scramble-accessible';
    accessible.dataset.noDecrypt = '';
    accessible.textContent = accessibleText;
    el.append(visual, accessible);
    const job = {
      el, nodes, total, visual, accessible,
      start: performance.now() + (delay || 0),
      duration: Math.min(1000, 340 + total * 11),
    };
    el.classList.add('is-decrypting');
    renderScramble(job, 0);                            // show ciphertext immediately
    scrambleJobs.push(job);
    // rAF can stall for seconds while the hero's WebGL shaders compile; a
    // wall-clock deadline guarantees the real copy is always restored.
    job.deadline = setTimeout(() => finishScramble(job), (delay || 0) + job.duration + 400);
    if (!scrambleTicking) { scrambleTicking = true; requestAnimationFrame(tickScramble); }
  }

  // Short, punchy text gets the full scramble treatment across the whole page.
  const SCRAMBLE_TARGETS = [
    '[data-decrypt]',
    '.hero-copy .kicker', '.hero-copy .display',
    '.sec-head .kicker', '.sec-head h2',
    '.console-copy .kicker', '.console-copy h2',
    '.preview-copy .kicker', '.preview-copy h2',
    '.science-grid .kicker', '.science-grid h2',
    '.cap-card h3', '.mode-card h3', '.frontier-card h3', '.step h3',
    '.mode-tag', '.recipe-card strong',
    '.launch .kicker', '.launch .display',
    '.val-stat .cap', '.val-board .vb-head > span', '.ledger .vb-head > span',
    '.diverge-tag span'
  ].join(',');

  function initDecrypt() {
    const targets = Array.from(new Set($$(SCRAMBLE_TARGETS)));
    if (!targets.length || reduced || !('IntersectionObserver' in window)) return () => {};

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        startScramble(en.target, 0);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });

    // Elements already on screen at load (the hero) decode in a quick cascade
    // instead of all firing on the same frame.
    const vh = window.innerHeight;
    let boot = 0;
    targets.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) startScramble(el, (boot++) * 120);
      else io.observe(el);
    });
    return () => {
      io.disconnect();
      while (scrambleJobs.length) finishScramble(scrambleJobs[0]);
    };
  }

  // ==========================================================================
  // 3) MAGIC BENTO — spotlight + particles + border glow + tilt + magnetism
  //    Enhances the existing capability & mode card grids in place.
  // ==========================================================================
  function makeParticle(x, y, color) {
    const el = document.createElement('span');
    el.className = 'mb-particle';
    el.style.cssText =
      `left:${x}px;top:${y}px;background:rgba(${color},1);box-shadow:0 0 7px rgba(${color},.7),0 0 12px rgba(${color},.35);`;
    return el;
  }

  let layoutVersion = 0;

  function enhanceCard(card, color, signal) {
    const particles = [];
    const timeouts = [];
    let hovered = false;
    let seed = null;
    let rect = null;
    let rectVersion = -1;
    const setters = hasGsap ? {
      rotateX: gsap.quickTo(card, 'rotateX', { duration: 0.24, ease: 'power2.out' }),
      rotateY: gsap.quickTo(card, 'rotateY', { duration: 0.24, ease: 'power2.out' }),
      x: gsap.quickTo(card, 'x', { duration: 0.24, ease: 'power2.out' }),
      y: gsap.quickTo(card, 'y', { duration: 0.24, ease: 'power2.out' }),
    } : null;
    if (hasGsap) gsap.set(card, { transformPerspective: 900 });

    function measure() {
      if (rectVersion !== layoutVersion || !rect) {
        rect = card.getBoundingClientRect();
        rectVersion = layoutVersion;
        seed = null;
      }
      return rect;
    }

    function clearParticles(immediate = false) {
      timeouts.forEach(clearTimeout); timeouts.length = 0;
      particles.forEach((p) => {
        if (hasGsap) gsap.killTweensOf(p);
        if (hasGsap && !immediate) {
          gsap.to(p, { scale: 0, opacity: 0, duration: 0.3, ease: 'back.in(1.7)', onComplete: () => p.remove() });
        } else { p.remove(); }
      });
      particles.length = 0;
    }

    function spawn() {
      if (!hovered) return;
      if (!seed) {
        const { width, height } = measure();
        seed = Array.from({ length: 11 }, () => [Math.random() * width, Math.random() * height]);
      }
      seed.forEach(([x, y], i) => {
        const t = setTimeout(() => {
          if (!hovered) return;
          const p = makeParticle(x, y, color);
          card.appendChild(p);
          particles.push(p);
          if (hasGsap) {
            gsap.fromTo(p, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });
            gsap.to(p, { x: (Math.random() - 0.5) * 90, y: (Math.random() - 0.5) * 90, rotation: Math.random() * 360,
              duration: 2 + Math.random() * 2, ease: 'none', repeat: -1, yoyo: true });
            gsap.to(p, { opacity: 0.3, duration: 1.5, ease: 'power2.inOut', repeat: -1, yoyo: true });
          }
        }, i * 90);
        timeouts.push(t);
      });
    }

    card.addEventListener('pointerenter', () => {
      hovered = true;
      measure();
      spawn();
    }, { signal, passive: true });
    card.addEventListener('pointerleave', () => {
      hovered = false; clearParticles();
      if (setters) Object.values(setters).forEach((set) => set(0));
    }, { signal, passive: true });
    card.addEventListener('pointermove', (e) => {
      const r = measure();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const cx = r.width / 2, cy = r.height / 2;
      if (setters && cx > 0 && cy > 0) {
        setters.rotateX(((y - cy) / cy) * -6);
        setters.rotateY(((x - cx) / cx) * 6);
        setters.x((x - cx) * 0.04);
        setters.y((y - cy) * 0.04);
      }
    }, { signal, passive: true });

    return () => {
      hovered = false;
      clearParticles(true);
      if (hasGsap) {
        gsap.killTweensOf(card);
        gsap.set(card, { clearProps: 'transform' });
      }
    };
  }

  function initGlobalSpotlight(configs, signal) {
    const spotlight = document.createElement('div');
    spotlight.className = 'mb-spotlight';
    document.body.appendChild(spotlight);
    const states = configs.map(({ grid, cards, color, radius }) => ({
      grid, cards, color,
      proximity: radius * 0.5,
      fade: radius * 0.75,
      gridRect: null,
      cardRects: [],
      measured: false,
    }));
    let activeColor = '';

    function measure() {
      states.forEach((state) => {
        state.gridRect = state.grid.getBoundingClientRect();
        state.cardRects = state.cards.map((card) => card.getBoundingClientRect());
        state.measured = true;
      });
    }
    const invalidate = () => {
      layoutVersion += 1;
      states.forEach((state) => { state.measured = false; });
    };
    window.addEventListener('scroll', invalidate, { signal, passive: true });
    window.addEventListener('resize', invalidate, { signal, passive: true });

    let lastX = 0, lastY = 0, raf = 0;
    const hide = () => {
      spotlight.style.opacity = '0';
      states.forEach((state) => {
        state.cards.forEach((card) => card.style.setProperty('--mb-glow', '0'));
      });
    };
    function paint() {
      raf = 0;
      if (states.some((state) => !state.measured)) measure();
      const active = states.find((state) => {
        const section = state.gridRect;
        return lastX >= section.left - 40 && lastX <= section.right + 40
          && lastY >= section.top - 40 && lastY <= section.bottom + 40;
      });
      if (!active) { hide(); return; }
      states.filter((state) => state !== active).forEach((state) => {
        state.cards.forEach((card) => card.style.setProperty('--mb-glow', '0'));
      });
      if (activeColor !== active.color) {
        activeColor = active.color;
        spotlight.style.background = `radial-gradient(circle, rgba(${active.color},.14) 0%, rgba(${active.color},.07) 18%, rgba(${active.color},.03) 35%, transparent 60%)`;
      }
      let minDist = Infinity;
      for (let i = 0; i < active.cards.length; i++) {
        const r = active.cardRects[i];
        if (!r) continue;
        const card = active.cards[i];
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const d = Math.hypot(lastX - cx, lastY - cy) - Math.max(r.width, r.height) / 2;
        const eff = Math.max(0, d);
        minDist = Math.min(minDist, eff);
        let glow = 0;
        if (eff <= active.proximity) glow = 1;
        else if (eff <= active.fade) glow = (active.fade - eff) / (active.fade - active.proximity);
        card.style.setProperty('--mb-glow-x', `${((lastX - r.left) / r.width) * 100}%`);
        card.style.setProperty('--mb-glow-y', `${((lastY - r.top) / r.height) * 100}%`);
        card.style.setProperty('--mb-glow', glow.toFixed(3));
      }
      spotlight.style.left = lastX + 'px';
      spotlight.style.top = lastY + 'px';
      spotlight.style.opacity = minDist <= active.proximity ? '0.9'
        : minDist <= active.fade
          ? (((active.fade - minDist) / (active.fade - active.proximity)) * 0.9).toFixed(3)
          : '0';
    }
    document.addEventListener('pointermove', (e) => {
      lastX = e.clientX; lastY = e.clientY;
      if (!raf && !document.hidden) raf = requestAnimationFrame(paint);
    }, { signal, passive: true });
    document.addEventListener('pointerleave', () => {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      hide();
    }, { signal, passive: true });
    measure();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      hide();
      spotlight.remove();
    };
  }

  function initMagicBento() {
    if (!fine || reduced) return () => {}; // full effect is desktop / fine-pointer only
    const controller = new AbortController();
    const cleanups = [];
    const activeConfigs = [];
    // Grids to upgrade: capability cards and mode cards. (Frontier cards own
    // their own ::after top-line, so they are intentionally left untouched.)
    const grids = [
      { sel: '.cap-grid', card: '.cap-card', color: CYAN, radius: 340 },
      { sel: '.mode-grid', card: '.mode-card', color: VIOLET, radius: 320 }
    ];
    grids.forEach(({ sel, card, color, radius }) => {
      const grid = $(sel);
      if (!grid) return;
      const cards = $$(card, grid);
      if (!cards.length) return;
      cards.forEach((c) => {
        c.classList.add('mb-card');
        c.style.setProperty('--mb-color', color);
        cleanups.push(enhanceCard(c, color, controller.signal));
      });
      activeConfigs.push({ grid, cards, color, radius });
    });
    const cleanupSpotlight = activeConfigs.length
      ? initGlobalSpotlight(activeConfigs, controller.signal)
      : () => {};
    return () => {
      controller.abort();
      cleanupSpotlight();
      cleanups.forEach((cleanup) => cleanup());
      activeConfigs.forEach(({ cards }) => cards.forEach((card) => {
        card.classList.remove('mb-card');
        ['--mb-color', '--mb-glow', '--mb-glow-x', '--mb-glow-y'].forEach((name) => {
          card.style.removeProperty(name);
        });
      }));
    };
  }

  // ==========================================================================
  let effectCleanups = [];
  function activateEffects() {
    effectCleanups.forEach((cleanup) => cleanup());
    effectCleanups = [initDecrypt(), initMagicBento()];
  }

  function boot() {
    activateEffects();
    const refreshPreferences = () => {
      const nextReduced = readReduced();
      const nextFine = fineQuery.matches;
      if (nextReduced === reduced && nextFine === fine) return;
      reduced = nextReduced;
      fine = nextFine;
      activateEffects();
    };
    [motionQuery, compactQuery, fineQuery].forEach((media) => {
      media.addEventListener?.('change', refreshPreferences);
    });
    navigator.connection?.addEventListener?.('change', refreshPreferences);
    window.addEventListener('pagehide', (event) => {
      if (event.persisted) return;
      effectCleanups.forEach((cleanup) => cleanup());
      effectCleanups = [];
    }, { once: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
