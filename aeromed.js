/* =====================================================
   JBAS — SHARED PROGRAM-PAGE BASE SCRIPT
   Star field, navbar scroll state, slide menu,
   scroll-reveal system, logo-to-top behaviour.
===================================================== */

'use strict';

const JBAS = { menuOpen: false };
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------- STAR FIELD ----------------
(function initStars() {
  const canvas = document.getElementById('starsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  const STAR_COUNT = 200;

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.1 + 0.15,
      a: Math.random() * 0.6 + 0.1,
      twinkleSpeed: Math.random() * 0.018 + 0.006,
      twinklePhase: Math.random() * Math.PI * 2,
    }));
  }

  function tick() {
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

// ---------------- NAVBAR SCROLL STATE ----------------
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  let scheduled = false;
  function update() {
    scheduled = false;
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();

// ---------------- SLIDE MENU ----------------
(function initMenu() {
  const btn = document.getElementById('hamburgerBtn');
  const menu = document.getElementById('slideMenu');
  const overlay = document.getElementById('menuOverlay');
  if (!btn || !menu || !overlay) return;

  function open() {
    JBAS.menuOpen = true;
    menu.classList.add('open'); overlay.classList.add('open'); btn.classList.add('open');
    btn.setAttribute('aria-label', 'Close menu');
    btn.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    menu.querySelectorAll('[tabindex="-1"]').forEach(el => el.removeAttribute('tabindex'));
  }
  function close() {
    JBAS.menuOpen = false;
    menu.classList.remove('open'); overlay.classList.remove('open'); btn.classList.remove('open');
    btn.setAttribute('aria-label', 'Open menu');
    btn.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    menu.querySelectorAll('.slide-menu__link, .slide-menu__small-link').forEach(el => el.setAttribute('tabindex', '-1'));
  }

  btn.addEventListener('click', () => JBAS.menuOpen ? close() : open());
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && JBAS.menuOpen) close(); });
})();

// ---------------- SCROLL REVEAL ----------------
(function initReveals() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;
  if (prefersReducedMotion) { items.forEach(el => el.classList.add('revealed')); return; }

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
        el.style.transitionDelay = `${delay * 0.08}s`;
        el.classList.add('revealed');
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

  items.forEach(el => obs.observe(el));
})();

// ---------------- LOGO -> TOP ----------------
(function initLogoScroll() {
  document.querySelectorAll('.navbar__logo, .footer__logo-link').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
})();

// ---------------- HERO PARALLAX (subtle) ----------------
(function initHeroParallax() {
  const el = document.getElementById('heroParallax');
  if (!el || prefersReducedMotion) return;
  let tX = 0, tY = 0, cX = 0, cY = 0;
  const STRENGTH = 10, LERP = 0.07;
  window.addEventListener('mousemove', e => {
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    tX = ((e.clientX - cx) / cx) * STRENGTH;
    tY = ((e.clientY - cy) / cy) * STRENGTH;
  }, { passive: true });
  (function loop() {
    cX += (tX - cX) * LERP; cY += (tY - cY) * LERP;
    el.style.transform = `translate3d(${cX.toFixed(2)}px, ${cY.toFixed(2)}px, 0)`;
    requestAnimationFrame(loop);
  })();
})();
/* =====================================================
   AEROMED — page-specific behaviour
   Scroll-spy for the sticky telemetry sub-nav.
===================================================== */

(function initSubnavSpy() {
  const links = Array.from(document.querySelectorAll('.subnav__link'));
  if (!links.length) return;

  const map = new Map();
  links.forEach(link => {
    const id = link.getAttribute('href').replace('#', '');
    const target = document.getElementById(id);
    if (target) map.set(target, link);
  });
  if (!map.size) return;

  // Smooth scroll with offset for the fixed navbar + sticky subnav
  links.forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href').replace('#', '');
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const offset = 132;
      const y = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const link = map.get(entry.target);
        if (!link) return;
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, { rootMargin: '-140px 0px -65% 0px', threshold: 0 });

  map.forEach((_, section) => obs.observe(section));
})();
