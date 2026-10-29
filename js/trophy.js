// Standalone enhancement also keeps the illustrated trophy working on file:// previews.
(() => {
  const stage = document.getElementById('award-trophy');
  if (!stage) return;
  const root = document.documentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const button = stage.closest('figure').querySelector('.trophy-turn');
  const moduleURL = new URL('./trophy-scene.js?v=20261029', document.currentScript.src);
  let scene, loading = false, visible = false, frame = 0, previous = 0;
  let angle = -.16, target = angle, rise = 0, targetRise = 0, turn = 0;
  const turns = [0, .65, -.65];
  const paused = () => motion.matches || root.classList.contains('motion-paused');

  function measure() {
    const rect = stage.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (innerHeight * .85 - rect.top) / (innerHeight * .85 + rect.height * .25)));
    target = (paused() ? -.16 : -.48 + progress * .72) + turns[turn];
    targetRise = paused() ? 0 : (1 - progress) * 22;
    if (paused()) { angle = target; rise = targetRise; }
  }
  function draw(now) {
    frame = 0;
    if (!visible || document.hidden) return;
    const ease = 1 - Math.exp(-Math.min((now - previous) / 1000 || .016, .05) * 10);
    previous = now;
    angle += (target - angle) * ease;
    rise += (targetRise - rise) * ease;
    stage.style.setProperty('--trophy-angle', `${angle}rad`);
    stage.style.setProperty('--trophy-rise', `${rise}px`);
    scene?.render(angle, rise);
    if (Math.abs(target - angle) > .0005 || Math.abs(targetRise - rise) > .05) schedule();
  }
  function schedule() {
    if (!frame && visible && !document.hidden) frame = requestAnimationFrame(draw);
  }
  function sync() { measure(); schedule(); }
  function showFallback() {
    stage.classList.remove('trophy-ready');
    scene?.dispose();
    scene = null;
  }
  async function load() {
    // Browser ES modules need HTTP; the SVG and scroll turn still work from disk.
    if (loading || location.protocol === 'file:') return;
    loading = true;
    try {
      const { createTrophyScene } = await import(moduleURL.href);
      scene = createTrophyScene(stage.querySelector('canvas'));
      scene.resize();
      scene.render(angle, rise);
      stage.classList.add('trophy-ready');
      schedule();
    } catch (error) {
      showFallback();
      console.warn('Using the illustrated award preview.', error);
    }
  }
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) { load(); sync(); }
    else { cancelAnimationFrame(frame); frame = 0; }
  }, { rootMargin: '80px' }).observe(stage);
  new ResizeObserver(() => { scene?.resize(); sync(); }).observe(stage);
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
  motion.addEventListener('change', sync);
  window.addEventListener('scroll', () => { if (visible) sync(); }, { passive: true });
  window.addEventListener('resize', sync, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else sync();
  });
  stage.querySelector('canvas').addEventListener('webglcontextlost', event => {
    event.preventDefault();
    showFallback();
  });
  button.addEventListener('click', () => { turn = (turn + 1) % turns.length; sync(); });
})();
