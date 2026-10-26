// Lazy-load the 3D escape; the illustrated landscape remains a WebGL fallback.
export function initOfflineMode(motionQuery) {
  const scene = document.getElementById('ride-scene');
  const toggle = document.getElementById('ride-toggle');
  const light = document.getElementById('ride-light');
  const status = document.getElementById('ride-status');
  if (!scene || !toggle || !light || !status) return;
  const canvas = document.getElementById('ride-canvas');
  const cameraControls = document.getElementById('ride-camera-controls');
  const view = document.getElementById('ride-view');
  const illustration = scene.querySelector('.ride-landscape');
  const pace = document.getElementById('ride-pace');
  const loader = document.getElementById('ride-loading');
  let ready = false, failed = false;
  let riding = false, visible = false, golden = false, overview = false, loading = false, world = null;
  const paused = () => motionQuery.matches || document.documentElement.classList.contains('motion-paused');
  function sync() {
    const blocked = paused();
    const active = visible && !document.hidden;
    scene.classList.toggle('ride-running', riding && active && !blocked);
    toggle.disabled = blocked || (!ready && !failed);
    toggle.setAttribute('aria-pressed', String(riding && !blocked));
    toggle.innerHTML = blocked ? 'Motion paused <span aria-hidden="true">Ⅱ</span>' : riding ? 'Park the bike <span aria-hidden="true">Ⅱ</span>' : 'Take a ride <span aria-hidden="true">↗</span>';
    const message = blocked ? 'A quiet view. Ride animation follows your motion settings.' : riding ? 'Taking the scenic route. Enjoy the ride.' : 'A little escape. No destination required.';
    const text = (golden ? 'Golden hour. ' : '') + message;
    if (status.textContent !== text) status.textContent = text;
    if (blocked || world) scene.style.removeProperty('--ride-look');
    if (world) {
      world.setReduced(blocked);
      world.setRiding(riding && !blocked);
      world.setGolden(golden);
      world.setOverview(overview);
      world.setActive(active);
    }
    if (view) {
      view.setAttribute('aria-pressed', String(overview));
      view.textContent = overview ? 'Back to bike' : 'View route';
    }
  }
  function fallback() {
    world?.dispose(); world = null;
    ready = false; failed = true;
    scene.classList.remove('ride-3d-ready');
    scene.classList.add('ride-fallback');
    scene.setAttribute('aria-busy', 'false');
    loader.hidden = true;
    pace.hidden = true;
    canvas?.setAttribute('aria-hidden', 'true');
    if (canvas) canvas.tabIndex = -1;
    if (cameraControls) cameraControls.hidden = true;
    illustration?.removeAttribute('aria-hidden');
    sync();
  }
  async function loadScene() {
    if (loading || !canvas) return;
    loading = true;
    try {
      const { createRideScene } = await import('./ride-scene.js?v=ride-kochi-20261026');
      world = createRideScene(canvas, {
        reducedMotion: paused(), onError: fallback,
        onReady() {
          ready = true;
          scene.classList.add('ride-3d-ready'); scene.setAttribute('aria-busy', 'false');
          loader.hidden = true; pace.hidden = false;
          canvas.removeAttribute('aria-hidden'); canvas.tabIndex = 0;
          cameraControls.hidden = false;
          world.setSpeed(Number(document.getElementById('ride-speed').value) || 270);
          illustration?.setAttribute('aria-hidden', 'true');
          sync();
        },
        onProgress({ speed, lean }) {
          const telemetry = document.getElementById('ride-telemetry');
          const text = speed > 1 ? `RIDING / ${lean}° LEAN` : 'READY WHEN YOU ARE';
          if (telemetry.textContent !== text) telemetry.textContent = text;
        },
      });
      sync();
    } catch (error) {
      console.warn('The interactive ride is unavailable; showing the illustrated landscape.', error);
      fallback();
    }
  }
  document.getElementById('ride-speed')?.addEventListener('change', event => world?.setSpeed(Number(event.target.value)));
  toggle.addEventListener('click', () => { riding = !riding; sync(); });
  light.addEventListener('click', () => {
    golden = !golden;
    scene.classList.toggle('golden-hour', golden);
    light.setAttribute('aria-pressed', String(golden));
    light.innerHTML = golden ? '◌ <span>Daylight</span>' : '☀ <span>Golden hour</span>';
    sync();
  });
  view?.addEventListener('click', () => { overview = !overview; sync(); });
  document.getElementById('ride-reset')?.addEventListener('click', () => { riding = false; overview = false; world?.reset(); sync(); });
  document.getElementById('ride-orbit-left')?.addEventListener('click', () => world?.orbit(-.35));
  document.getElementById('ride-orbit-right')?.addEventListener('click', () => world?.orbit(.35));
  canvas?.addEventListener('keydown', event => { if (event.code === 'Space') { event.preventDefault(); toggle.click(); } });
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  scene.addEventListener('pointermove', event => {
    if (world || paused() || !finePointer.matches || event.pointerType === 'touch') return;
    const rect = scene.getBoundingClientRect();
    scene.style.setProperty('--ride-look', `${((event.clientX - rect.left) / rect.width - .5) * 18}px`);
  });
  scene.addEventListener('pointerleave', () => scene.style.removeProperty('--ride-look'));
  const preload = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { loadScene(); preload.disconnect(); } }, { rootMargin: '800px' });
  preload.observe(scene);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .08 }).observe(scene);
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  motionQuery.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  sync();
}
