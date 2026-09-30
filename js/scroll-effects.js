// Scroll-led motion: render only while input or its short easing tail is active.
export function initScrollEffects(motionQuery) {
  const root = document.documentElement;
  const canvas = document.createElement('canvas');
  canvas.className = 'scroll-atmosphere';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  const ctx = canvas.getContext('2d');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let width = 0, height = 0, pageHeight = 1, frame = 0, lastTime = 0;
  let scroll = window.scrollY, targetScroll = scroll;
  let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;
  const paused = () => motionQuery.matches || root.classList.contains('motion-paused');
  const activeAnimations = new Set();
  const scenes = [...document.querySelectorAll('.project-art')];
  const cards = [...document.querySelectorAll('.work-card, .service-card')];
  const particles = Array.from({ length: 44 }, (_, i) => ({
    x: ((i * 0.618034) % 1), y: ((i * 0.754877) % 1), depth: .18 + (i % 5) * .11,
  }));

  function drawAtmosphere() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const phase = scroll * .0012;
    // A gently twisting ribbon of contour lines travels through the background.
    // The denser geometry stays at the edges, leaving reading space in the center.
    for (let side = 0; side < 2; side++) {
      const originX = width * (side ? .98 : -.04) + pointerX * 20;
      const originY = height * (.45 + Math.sin(phase * .5 + side * 2) * .22) + pointerY * 12;
      const radius = Math.min(width * .44, 540);
      const glow = ctx.createRadialGradient(originX, originY, 0, originX, originY, radius);
      glow.addColorStop(0, side ? 'rgba(145,185,215,.065)' : 'rgba(155,225,176,.085)');
      glow.addColorStop(1, 'rgba(155,225,176,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
      const lines = width < 600 ? 12 : 22;
      for (let line = 0; line < lines; line++) {
        ctx.beginPath();
        for (let step = 0; step <= 55; step++) {
          const a = (step / 55) * Math.PI * 2;
          const wave = Math.sin(a * 3 + phase + line * .065) * .15;
          const r = radius * (.6 + line * .025 + wave);
          const x = originX + Math.cos(a + phase * .13) * r * (.65 + Math.sin(phase * .3) * .15);
          const y = originY + Math.sin(a) * r * .8 + Math.cos(a * 2 + phase) * 20;
          if (step === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = side ? 'rgba(151,193,213,.11)' : 'rgba(180,235,199,.14)';
        ctx.lineWidth = .65;
        ctx.stroke();
      }
    }
    for (const p of particles) {
      const x = p.x * width + pointerX * p.depth * 24;
      const y = ((p.y * height - scroll * p.depth * .15) % height + height) % height;
      ctx.fillStyle = `rgba(180,235,199,${.14 + p.depth * .25})`;
      ctx.beginPath(); ctx.arc(x, y, p.depth > .5 ? 1.5 : .8, 0, Math.PI * 2); ctx.fill();
    }
  }

  function render(now) {
    frame = 0;
    if (document.hidden || paused()) return;
    const dt = Math.min((now - lastTime) / 1000 || .016, .05);
    lastTime = now;
    const ease = 1 - Math.exp(-dt * 9);
    scroll += (targetScroll - scroll) * ease;
    pointerX += (targetX - pointerX) * ease;
    pointerY += (targetY - pointerY) * ease;
    drawAtmosphere();
    // Translate only the artwork layers, keeping labels and links still.
    for (const scene of scenes) {
      const rect = scene.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > height) continue;
      const offset = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - height / 2) / height));
      scene.style.setProperty('--art-drift', `${offset * 38}px`);
    }
    if (Math.abs(targetScroll - scroll) > .15 || Math.abs(targetX - pointerX) > .002 || Math.abs(targetY - pointerY) > .002) schedule();
  }
  function schedule() {
    if (!frame && !document.hidden && !paused()) frame = requestAnimationFrame(render);
  }
  function updateProgress() {
    progress.style.transform = `scaleX(${Math.max(0, Math.min(1, targetScroll / pageHeight))})`;
  }
  function onScroll() {
    targetScroll = window.scrollY;
    updateProgress();
    schedule();
  }
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    pageHeight = Math.max(1, root.scrollHeight - height);
    if (ctx) {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    onScroll();
  }
  function syncMotion() {
    cancelAnimationFrame(frame); frame = 0;
    canvas.hidden = paused();
    if (paused()) {
      activeAnimations.forEach(animation => animation.finish());
      scenes.forEach(scene => scene.style.removeProperty('--art-drift'));
      cards.forEach(card => card.classList.remove('pointer-lit'));
    } else {
      scroll = targetScroll = window.scrollY;
      lastTime = performance.now();
      schedule();
    }
  }

  // Progressive enhancement: nothing is hidden while waiting for JavaScript.
  const reveals = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      reveals.unobserve(entry.target);
      if (paused() || !entry.target.animate) continue;
      const siblings = entry.target.parentElement.children;
      const index = Array.prototype.indexOf.call(siblings, entry.target);
      const animation = entry.target.animate([
        { opacity: .35, translate: '0 28px' },
        { opacity: 1, translate: '0 0' },
      ], { duration: 700, delay: Math.min(index * 65, 180), easing: 'cubic-bezier(.2,.7,.2,1)' });
      activeAnimations.add(animation);
      animation.finished.catch(() => {}).finally(() => activeAnimations.delete(animation));
    }
  }, { threshold: .12 });
  document.querySelectorAll('.section-heading, .about-copy, .portrait-card, .featured-project, .work-card, .service-card, .timeline-item, .project-list article, .contact-layout > div, .contact-form, .ride-scene').forEach(el => reveals.observe(el));
  document.addEventListener('focusin', () => activeAnimations.forEach(animation => animation.finish()));

  cards.forEach(card => {
    card.addEventListener('pointermove', event => {
      if (paused() || !finePointer.matches || event.pointerType === 'touch') return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
      card.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
      card.classList.add('pointer-lit');
    });
    card.addEventListener('pointerleave', () => card.classList.remove('pointer-lit'));
  });
  window.addEventListener('pointermove', event => {
    if (paused() || !finePointer.matches || event.pointerType === 'touch') return;
    targetX = event.clientX / width - .5;
    targetY = event.clientY / height - .5;
    schedule();
  }, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  // Archive expansion and font reflow can change the document's height.
  new ResizeObserver(resize).observe(document.body);
  new MutationObserver(syncMotion).observe(root, { attributes: true, attributeFilter: ['class'] });
  motionQuery.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else { lastTime = performance.now(); onScroll(); }
  });
  resize();
  syncMotion();
}
