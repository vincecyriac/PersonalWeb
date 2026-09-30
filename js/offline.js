// A small, local illustration of life away from the keyboard.
export function initOfflineMode(motionQuery) {
  const scene = document.getElementById('ride-scene');
  const toggle = document.getElementById('ride-toggle');
  const light = document.getElementById('ride-light');
  const status = document.getElementById('ride-status');
  if (!scene || !toggle || !light || !status) return;
  let riding = false, visible = false, golden = false;
  const paused = () => motionQuery.matches || document.documentElement.classList.contains('motion-paused');
  function sync() {
    const blocked = paused();
    scene.classList.toggle('ride-running', riding && visible && !document.hidden && !blocked);
    toggle.disabled = blocked;
    toggle.setAttribute('aria-pressed', String(riding));
    toggle.innerHTML = blocked ? 'Motion paused <span aria-hidden="true">Ⅱ</span>' : riding ? 'Park the bike <span aria-hidden="true">Ⅱ</span>' : 'Take a ride <span aria-hidden="true">↗</span>';
    const message = blocked ? 'A quiet view. Ride animation follows your motion settings.' : riding ? 'Taking the scenic route. Enjoy the ride.' : 'A little escape. No destination required.';
    const text = (golden ? 'Golden hour. ' : '') + message;
    if (status.textContent !== text) status.textContent = text;
    if (blocked) scene.style.removeProperty('--ride-look');
  }
  toggle.addEventListener('click', () => { riding = !riding; sync(); });
  light.addEventListener('click', () => {
    golden = !golden;
    scene.classList.toggle('golden-hour', golden);
    light.setAttribute('aria-pressed', String(golden));
    light.innerHTML = golden ? '◌ <span>Daylight</span>' : '☀ <span>Golden hour</span>';
    sync();
  });
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  scene.addEventListener('pointermove', event => {
    if (paused() || !finePointer.matches || event.pointerType === 'touch') return;
    const rect = scene.getBoundingClientRect();
    scene.style.setProperty('--ride-look', `${((event.clientX - rect.left) / rect.width - .5) * 18}px`);
  });
  scene.addEventListener('pointerleave', () => scene.style.removeProperty('--ride-look'));
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .08 }).observe(scene);
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  motionQuery.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  sync();
}
