/* =====================================================
   JBAS — Journey Beyond Aerospace Society
   script.js
   ===================================================== */

'use strict';

// ---- Utility: RAF-throttled pointer/scroll state ----
const state = {
  mouseX: 0, mouseY: 0,
  scrollY: 0,
  rafId: null,
  menuOpen: false,
};

// =====================================================
// STAR FIELD CANVAS
// =====================================================
(function initStars() {
  const canvas = document.getElementById('starsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Star data
  let stars = [];
  const STAR_COUNT = 220;

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    buildStars();
  }

  function buildStars() {
    stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.1 + 0.15,
      a: Math.random() * 0.6 + 0.1,
      twinkleSpeed: Math.random() * 0.018 + 0.006,
      twinklePhase: Math.random() * Math.PI * 2,
    }));
  }

  let then = 0;
  function tick(now) {
    const dt = now - then;
    then = now;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const W = canvas.width, H = canvas.height;

    stars.forEach(s => {
      s.twinklePhase += s.twinkleSpeed;
      const alpha = s.a * (0.55 + 0.45 * Math.sin(s.twinklePhase));
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,255,${alpha.toFixed(3)})`;
      ctx.fill();
    });

    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  requestAnimationFrame(tick);
})();

// =====================================================
// HERO CHAR REVEAL ANIMATION
// — assign staggered animation-delay to each char
// =====================================================
(function initHeroTitleChars() {
  const chars = document.querySelectorAll('.hero__title-char');
  chars.forEach((el, i) => {
    el.style.animationDelay = `${0.1 + i * 0.12}s`;
    // After animation, fill the character
    el.addEventListener('animationend', () => {
      el.classList.add('revealed');
    }, { once: true });
  });
})();

// =====================================================
// PARALLAX — cursor-driven parallax on hero content
// Optimized: one RAF loop, CSS variable update
// =====================================================
(function initParallax() {
  const hero = document.getElementById('hero');
  const parallaxEl = document.getElementById('heroParallax');
  if (!hero || !parallaxEl) return;

  // Target values
  let targetX = 0, targetY = 0;
  // Current interpolated values
  let curX = 0, curY = 0;
  const STRENGTH = 14;    // max px offset
  const LERP = 0.07;      // interpolation speed

  function onMouseMove(e) {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    // Normalize to [-1, 1]
    targetX = ((e.clientX - cx) / cx) * STRENGTH;
    targetY = ((e.clientY - cy) / cy) * STRENGTH;
  }

  function onTouchMove(e) {
    if (!e.touches.length) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    targetX = ((e.touches[0].clientX - cx) / cx) * (STRENGTH * 0.4);
    targetY = ((e.touches[0].clientY - cy) / cy) * (STRENGTH * 0.4);
  }

  function parallaxLoop() {
    curX += (targetX - curX) * LERP;
    curY += (targetY - curY) * LERP;
    parallaxEl.style.transform = `translate3d(${curX.toFixed(2)}px, ${curY.toFixed(2)}px, 0)`;
    requestAnimationFrame(parallaxLoop);
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  requestAnimationFrame(parallaxLoop);
})();

// =====================================================
// NAVBAR — scroll state
// =====================================================
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  let lastY = window.scrollY;
  let rafScheduled = false;

  function update() {
    rafScheduled = false;
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastY = window.scrollY;
  }

  window.addEventListener('scroll', () => {
    if (!rafScheduled) {
      rafScheduled = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
})();

// =====================================================
// HAMBURGER / SLIDE MENU
// =====================================================
(function initMenu() {
  const btn      = document.getElementById('hamburgerBtn');
  const menu     = document.getElementById('slideMenu');
  const overlay  = document.getElementById('menuOverlay');
  const closeBtn = document.getElementById('menuClose');
  if (!btn || !menu || !overlay) return;

  function openMenu() {
    state.menuOpen = true;
    menu.classList.add('open');
    overlay.classList.add('open');
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Enable tab focus in menu
    menu.querySelectorAll('[tabindex="-1"]').forEach(el => el.removeAttribute('tabindex'));
  }

  function closeMenu() {
    state.menuOpen = false;
    menu.classList.remove('open');
    overlay.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // Disable tab focus in menu
    menu.querySelectorAll('a, button').forEach(el => {
      if (el !== closeBtn) el.setAttribute('tabindex', '-1');
    });
  }

  btn.addEventListener('click', () => state.menuOpen ? closeMenu() : openMenu());
  overlay.addEventListener('click', closeMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && state.menuOpen) closeMenu();
  });
})();

// =====================================================
// INTERSECTION OBSERVER — program card reveals
// Sequential stagger from left to right
// =====================================================
(function initCardReveals() {
  const cards = document.querySelectorAll('.program-card');
  if (!cards.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const card = entry.target;
        // Respect the CSS transition-delay already set per nth-child
        card.classList.add('revealed');
        obs.unobserve(card);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -60px 0px',
  });

  cards.forEach(card => obs.observe(card));
})();

// =====================================================
// SMOOTH SCROLL — logo links back to top
// =====================================================
(function initLogoScroll() {
  document.querySelectorAll('.navbar__logo, .footer__logo-link').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
})();

// =====================================================
// CARD HOVER — subtle tilt based on mouse position
// within each card (skips mobile)
// =====================================================
(function initCardTilt() {
  if ('ontouchstart' in window) return; // skip on touch
  const cards = document.querySelectorAll('.program-card');

  cards.forEach(card => {
    const inner = card.querySelector('.program-card__inner');
    if (!inner) return;

    let raf = null;
    let targetRX = 0, targetRY = 0;
    let curRX = 0, curRY = 0;
    const TILT = 4; // degrees max

    function lerp() {
      curRX += (targetRX - curRX) * 0.1;
      curRY += (targetRY - curRY) * 0.1;
      inner.style.transform = `perspective(900px) rotateX(${curRX.toFixed(2)}deg) rotateY(${curRY.toFixed(2)}deg) scale(1.008)`;
      if (Math.abs(targetRX - curRX) > 0.01 || Math.abs(targetRY - curRY) > 0.01) {
        raf = requestAnimationFrame(lerp);
      } else {
        raf = null;
      }
    }

    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5 to 0.5
      const ny = (e.clientY - rect.top)  / rect.height - 0.5;
      targetRX = -ny * TILT;
      targetRY =  nx * TILT;
      if (!raf) raf = requestAnimationFrame(lerp);
    });

    card.addEventListener('mouseleave', () => {
      targetRX = 0;
      targetRY = 0;
      if (!raf) raf = requestAnimationFrame(lerp);
    });
  });
})();