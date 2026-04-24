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
  const icon = document.getElementById('wk-icon');
  if (icon) {
    icon.className = wk ? 'bi bi-laptop' : 'bi bi-sun';
  }
  document.getElementById('wk-lbl').textContent = wk ? 'WORK_MODE' : 'WEEKEND_MODE';
  document.getElementById('nav-suffix').textContent = wk ? '://WEEKEND' : '://PORTFOLIO';
  // Close mobile nav when switching
  closeMob();
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

// ── Skill Bars (Staggered Animation) ──
const sko = new IntersectionObserver(
  (ens) => {
    ens.forEach((e) => {
      if (e.isIntersecting) {
        const bars = e.target.querySelectorAll('.skr');
        bars.forEach((bar, i) => {
          setTimeout(() => {
            bar.classList.add('sk-vis');
            const fill = bar.querySelector('.skf');
            if (fill) fill.style.width = fill.dataset.w + '%';
          }, i * 60);
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

// ═══════════════════════════════════════════════
// ENHANCEMENTS
// ═══════════════════════════════════════════════

// ── 1. Boot Sequence Preloader ──
(function bootSequence() {
  const preloader = document.getElementById('preloader');
  const term = document.getElementById('boot-term');
  if (!preloader || !term) return;

  const lines = [
    { text: '> INITIALIZING SYSTEM...', cls: '' },
    { text: '> LOADING CORE_MODULES...', cls: 'dim' },
    { text: '> FONTS: Share Tech Mono, Orbitron, Space Mono ✓', cls: 'dim' },
    { text: '> STYLESHEET: style.css ✓', cls: 'dim' },
    { text: '', cls: 'bar' },
    { text: '> CONNECTING TO NODE: VC-' + CURRENT_YEAR + '...', cls: 'warn' },
    { text: '> PORTFOLIO_STATUS: ONLINE', cls: 'ok' },
    { text: '> LAUNCHING INTERFACE...', cls: 'ok' }
  ];

  let i = 0;
  const interval = setInterval(() => {
    if (i >= lines.length) {
      clearInterval(interval);
      setTimeout(() => {
        preloader.classList.add('done');
        // Re-trigger hero animations
        document.querySelectorAll('#hero .h-pre, #hero .h-name, #hero .h-sub, #hero .h-cta, #hero .h-stat').forEach(el => {
          el.style.animation = 'none';
          el.offsetHeight; // reflow
          el.style.animation = '';
        });
      }, 400);
      return;
    }

    const line = lines[i];
    if (line.cls === 'bar') {
      const barHtml = '<div class="line" style="animation-delay:0s"><div class="boot-bar"><div class="boot-fill" id="boot-fill"></div></div></div>';
      term.insertAdjacentHTML('beforeend', barHtml);
      setTimeout(() => {
        const fill = document.getElementById('boot-fill');
        if (fill) fill.style.width = '100%';
      }, 50);
    } else {
      const div = document.createElement('div');
      div.className = 'line ' + line.cls;
      div.textContent = line.text;
      div.style.animationDelay = '0s';
      term.appendChild(div);
    }
    i++;
  }, 180);
})();

// ── 3. Scroll Progress Indicator ──
(function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = progress + '%';
  }, { passive: true });
})();

// ── 4. Active Nav Highlighting ──
(function initActiveNav() {
  const sections = document.querySelectorAll('#main-content section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  const mobLinks = document.querySelectorAll('.mob-nav a');

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
          mobLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    },
    { rootMargin: '-30% 0px -60% 0px' }
  );

  sections.forEach((section) => observer.observe(section));
})();

// ── 65. Typed Terminal Effect on Hero ──
(function initTypedEffect() {
  const heroSub = document.querySelector('.h-sub');
  if (!heroSub) return;

  const lines = heroSub.querySelectorAll('.ln');
  if (!lines.length) return;

  // Store original content and clear
  const originals = [];
  lines.forEach((ln) => {
    originals.push(ln.innerHTML);
    // Keep the ::before pseudo but clear text
    ln.textContent = '';
  });

  // Wait for preloader to finish
  const startDelay = 2200;

  function typeText(element, html, speed, callback) {
    // Extract plain text (skip the cursor span in the last line)
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const text = temp.textContent || temp.innerText || '';
    
    let i = 0;
    element.textContent = '';
    const iv = setInterval(() => {
      element.textContent = text.substring(0, i + 1);
      i++;
      if (i >= text.length) {
        clearInterval(iv);
        // Restore full HTML (for cursor span etc)
        element.innerHTML = html;
        if (callback) callback();
      }
    }, speed);
  }

  setTimeout(() => {
    let lineIdx = 0;
    function typeLine() {
      if (lineIdx >= lines.length) return;
      typeText(lines[lineIdx], originals[lineIdx], 22, () => {
        lineIdx++;
        setTimeout(typeLine, 100);
      });
    }
    typeLine();
  }, startDelay);
})();
