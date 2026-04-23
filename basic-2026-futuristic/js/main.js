// ═══════════════════════════════════════════════
// VINCE CYRIAC — SYS_PORTFOLIO — MAIN.JS
// ═══════════════════════════════════════════════

// ── EmailJS Config ──
const EMAILJS_PUBLIC_KEY = '9BCKsdm0TPj6SYs1X';
const EMAILJS_SERVICE_ID = 'service_7z12yjm';
const EMAILJS_TEMPLATE_ID = 'template_02uikno';

// ── Dynamic Dates ──
const CAREER_START = new Date(2020, 7, 10); // August 10, 2020
const CURRENT_YEAR = new Date().getFullYear();

/**
 * Calculate years of professional experience from career start date.
 */
function getExperienceYears() {
  const now = new Date();
  let years = now.getFullYear() - CAREER_START.getFullYear();
  const monthDiff = now.getMonth() - CAREER_START.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < CAREER_START.getDate())) {
    years--;
  }
  return years;
}

// ── Session Timer ──
const t0 = Date.now();

function fmt(s) {
  return [
    Math.floor(s / 3600),
    Math.floor((s % 3600) / 60),
    s % 60
  ].map(n => String(n).padStart(2, '0')).join(':');
}

function tick() {
  const s = Math.floor((Date.now() - t0) / 1000);
  const u = document.getElementById('uptime');
  const wu = document.getElementById('wk-up');
  if (u) u.textContent = fmt(s);
  if (wu) wu.textContent = 'SESSION: ' + fmt(s);
  const cl = document.getElementById('ft-clock');
  if (cl) cl.textContent = 'SYS_TIME: ' + new Date().toLocaleTimeString('en-US', { hour12: false });
}

setInterval(tick, 1000);
tick();

// ── Experience Counter Animation ──
function countUp(el, to, ms) {
  let i = 0;
  const step = ms / to;
  const iv = setInterval(() => {
    i++;
    el.textContent = i + '+';
    if (i >= to) clearInterval(iv);
  }, step);
}

// ── About Section Counter Animations ──
const expYears = getExperienceYears();
const expEl = document.getElementById('exp-n');
const projEl = document.getElementById('proj-n');
const coffeeEl = document.getElementById('coffee-n');

/**
 * Animate coffee counter: counts up rapidly, then ends with ∞
 */
function countUpCoffee(el, ms) {
  const fakeTarget = 9999;
  const steps = 40;
  const stepTime = ms / steps;
  let i = 0;
  const iv = setInterval(() => {
    i++;
    const val = Math.floor((i / steps) * fakeTarget);
    el.textContent = val.toLocaleString();
    if (i >= steps) {
      clearInterval(iv);
      el.textContent = '∞';
    }
  }, stepTime);
}

const aboutObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        if (expEl) countUp(expEl, expYears, 800);
        if (projEl) countUp(projEl, 15, 800);
        if (coffeeEl) countUpCoffee(coffeeEl, 1200);
        aboutObserver.disconnect();
      }
    });
  },
  { threshold: 0.5 }
);
// Observe the parent stat box container
const statBox = expEl ? expEl.closest('.sb') : null;
if (statBox) aboutObserver.observe(statBox);

// ── Dynamic Year & Experience in Hero ──
const heroExpEl = document.getElementById('hero-exp');
if (heroExpEl) heroExpEl.textContent = expYears + '+ YRS';

const heroYearEl = document.getElementById('hero-year');
if (heroYearEl) heroYearEl.textContent = CURRENT_YEAR;

const footerYearEl = document.getElementById('footer-year');
if (footerYearEl) footerYearEl.textContent = CURRENT_YEAR;

// ── Weekend Toggle ──
let wk = false;

function toggleWeekend() {
  wk = !wk;
  document.body.classList.toggle('weekend', wk);
  document.getElementById('wk-dot').classList.toggle('on', wk);
  document.getElementById('wk-lbl').textContent = wk ? 'WEEKEND_ON' : 'WEEKEND_OFF';
  document.getElementById('nav-suffix').textContent = wk ? '://WEEKEND' : '://PORTFOLIO';
  if (wk) {
    document.querySelectorAll('#weekend .rv').forEach((el) => {
      el.classList.remove('vis');
      setTimeout(() => el.classList.add('vis'), 100);
    });
  }
}

function toggleMob() {
  document.getElementById('mob-nav').classList.toggle('open');
}

function closeMob() {
  document.getElementById('mob-nav').classList.remove('open');
}

// ── Scroll Reveal ──
const ro = new IntersectionObserver(
  (ens) => {
    ens.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add('vis');
    });
  },
  { threshold: 0.08 }
);
document.querySelectorAll('#main-content .rv').forEach((el) => ro.observe(el));

// ── Skill Bars ──
const sko = new IntersectionObserver(
  (ens) => {
    ens.forEach((e) => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.skf').forEach((b) => {
          b.style.width = b.dataset.w + '%';
        });
        sko.unobserve(e.target);
      }
    });
  },
  { threshold: 0.2 }
);
const sg = document.getElementById('skgrid');
if (sg) sko.observe(sg);

// ── Contact Form (EmailJS) ──
(function initContactForm() {
  // Initialize EmailJS
  if (typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }

  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const nameInput = document.getElementById('cf-name');
    const emailInput = document.getElementById('cf-email');
    const messageInput = document.getElementById('cf-message');
    const submitBtn = form.querySelector('button[type="submit"]');
    const statusEl = document.getElementById('form-status');

    // Validate
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !email || !message) {
      showStatus(statusEl, 'error', '// ERROR: ALL FIELDS REQUIRED');
      return;
    }

    if (!isValidEmail(email)) {
      showStatus(statusEl, 'error', '// ERROR: INVALID EMAIL FORMAT');
      return;
    }

    // Check if EmailJS is configured
    if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
      showStatus(statusEl, 'error', '// TRANSMISSION FAILED — NO USE IN TRYING AGAIN');
      return;
    }

    // Send
    submitBtn.disabled = true;
    submitBtn.textContent = 'TRANSMITTING...';
    showStatus(statusEl, 'sending', '// ESTABLISHING CONNECTION...');

    emailjs
      .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        from_name: name,
        from_email: email,
        message: message,
        to_name: 'Vince Cyriac'
      })
      .then(function () {
        showStatus(statusEl, 'success', '// TRANSMISSION SUCCESSFUL — MESSAGE DELIVERED');
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'TRANSMIT_MESSAGE';
      })
      .catch(function () {
        showStatus(statusEl, 'error', '// TRANSMISSION FAILED — TRY AGAIN');
        submitBtn.disabled = false;
        submitBtn.textContent = 'TRANSMIT_MESSAGE';
      });
  });
})();

function showStatus(el, type, msg) {
  if (!el) return;
  el.className = 'form-status ' + type;
  el.textContent = msg;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
