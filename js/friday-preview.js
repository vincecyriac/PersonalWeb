// Load the local WebGL renderer only when the FRIDAY project approaches the viewport.
const stage = document.getElementById('friday-orb-stage');
if (stage) {
  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    try {
      const { initOrb } = await import('./friday-orb.js');
      initOrb();
    } catch {
      stage.querySelector('canvas')?.remove();
      stage.classList.remove('orb-ready');
      document.getElementById('friday-orb-pause').hidden = true;
      document.getElementById('friday-orb-hint').textContent = 'Color preview';
    }
  }, { rootMargin: '200px' });
  observer.observe(stage);
}
