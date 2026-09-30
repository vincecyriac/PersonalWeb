// The maximum screen-space radius of a projected sphere is r / sqrt(1 - (r/d)^2).
// Fit the outer orbit (not just the core) and leave room for its glow and captions.
export function fitNeuralScene(width, height) {
  const orbitExtent = 1.43 / Math.sqrt(1 - (1.43 / 3.6) ** 2);
  const centerX = width / 2;
  const centerY = (32 + height - 74) / 2;
  const radius = Math.max(0, Math.min(
    (width / 2 - 22) / orbitExtent,
    (height - 32 - 74) / 2 / orbitExtent,
    width * .31,
  ));
  return { centerX, centerY, radius };
}

// Dependency-free 3D projection: a deforming neural sphere with orbital paths.
export function initScene(motionQuery) {
  const scene = document.getElementById('neural-scene');
  const canvas = document.getElementById('neural-canvas');
  const ctx = canvas?.getContext('2d');
  if (!scene || !ctx) return;
  const button = document.getElementById('motion-toggle');
  let width = 0, height = 0, frame = 0, previous = 0, time = 0;
  let layout = fitNeuralScene(0, 106);
  let visible = false, manuallyPaused = false;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const paused = () => motionQuery.matches || manuallyPaused;
  const rings = 30, segments = 64;
  const vertices = Array.from({ length: rings + 1 }, (_, i) =>
    Array.from({ length: segments + 1 }, (_, j) => ({ lat: Math.PI * i / rings, lon: Math.PI * 2 * j / segments })));

  function project(x, y, z, rotation, tilt) {
    const xx = x * Math.cos(rotation) + z * Math.sin(rotation);
    const zz = z * Math.cos(rotation) - x * Math.sin(rotation);
    const yy = y * Math.cos(tilt) - zz * Math.sin(tilt);
    const depth = y * Math.sin(tilt) + zz * Math.cos(tilt);
    const perspective = 3.6 / (3.6 - depth);
    const { radius, centerX, centerY } = layout;
    return { x: centerX + xx * radius * perspective, y: centerY + yy * radius * perspective, z: depth };
  }
  function draw() {
    ctx.clearRect(0, 0, width, height);
    const { radius, centerX: cx, centerY: cy } = layout;
    const halo = ctx.createRadialGradient(cx, cy, radius * .2, cx, cy, radius * 1.75);
    halo.addColorStop(0, '#a5e9b61a'); halo.addColorStop(.65, '#8dc99e08'); halo.addColorStop(1, '#8dc99e00');
    ctx.fillStyle = halo; ctx.fillRect(0, 0, width, height);
    const rotation = time * .12 + pointer.x * .4;
    const tilt = -.23 + pointer.y * .3;
    const mesh = vertices.map(row => row.map(({ lat, lon }) => {
      const r = 1 + Math.sin(lat) * (.048 * Math.sin(lat * 7 + lon * 3 + time * .6) + .027 * Math.cos(lon * 5 - time * .4));
      return project(r * Math.sin(lat) * Math.cos(lon), r * Math.cos(lat), r * Math.sin(lat) * Math.sin(lon), rotation, tilt);
    }));
    const faces = [];
    for (let i = 0; i < rings; i++) for (let j = 0; j < segments; j++) {
      const points = [mesh[i][j], mesh[i+1][j], mesh[i+1][j+1], mesh[i][j+1]];
      faces.push({ points, z: points.reduce((sum, p) => sum + p.z, 0) / 4, i, j });
    }
    faces.sort((a, b) => a.z - b.z);
    for (const { points, z, i, j } of faces) {
      const light = (z + 1.15) / 2.3;
      ctx.beginPath(); points.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath();
      ctx.fillStyle = `rgba(32,62,43,${.10 + light * .20})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(176,235,191,${.04 + Math.pow(light, 3) * .42})`;
      ctx.lineWidth = .6; ctx.stroke();
      if (i % 3 === 0 && j % 4 === 0 && z > -.1) {
        ctx.beginPath(); ctx.arc(points[0].x, points[0].y, .6 + light * .7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(214,255,222,${light * .7})`; ctx.fill();
      }
    }
    // Tilted orbital rings add spatial depth around the neural surface.
    for (let orbit = 0; orbit < 3; orbit++) {
      const orbitTilt = .65 + orbit * .7;
      let last;
      for (let j = 0; j <= 140; j++) {
        const a = Math.PI * 2 * j / 140;
        const p = project(Math.cos(a) * 1.43, Math.sin(a) * Math.sin(orbitTilt) * 1.43, Math.sin(a) * Math.cos(orbitTilt) * 1.43, rotation * .35 + orbit * .8, -.4);
        if (last) {
          ctx.beginPath();ctx.moveTo(last.x, last.y);ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = p.z > 0 ? '#b4ebc74a' : '#b4ebc715';ctx.lineWidth = .8;ctx.stroke();
        }
        last = p;
      }
      const a = time * (.16 + orbit * .035) + orbit * 2.1;
      const p = project(Math.cos(a) * 1.43, Math.sin(a) * Math.sin(orbitTilt) * 1.43, Math.sin(a) * Math.cos(orbitTilt) * 1.43, rotation * .35 + orbit * .8, -.4);
      ctx.shadowBlur = 15;ctx.shadowColor = '#b4ebc7';ctx.fillStyle = '#d1f7d8';
      ctx.beginPath();ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);ctx.fill();ctx.shadowBlur = 0;
    }
    // Fixed, deterministic star field avoids layout-dependent randomness.
    for (let i = 0; i < 32; i++) {
      const a = i * 2.39996;
      const horizontalLimit = (width / 2 - 8) / Math.max(Math.abs(Math.cos(a)), .001);
      const verticalLimit = (Math.sin(a) < 0 ? cy - 8 : height - cy - 65) / Math.max(Math.abs(Math.sin(a)) * .8, .001);
      const distance = Math.min(radius * (1.6 + (i % 5) * .15), horizontalLimit, verticalLimit);
      const x = cx + Math.cos(a) * distance, y = cy + Math.sin(a) * distance * .8;
      ctx.fillStyle = i % 4 === 0 ? '#b4ebc775' : '#b4ebc72b';
      ctx.fillRect(x, y, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
    }
  }
  function tick(now) {
    frame = 0;
    if (!visible || document.hidden || paused()) return;
    if (now - previous >= 1000 / 30) {
      time += Math.min((now - previous) / 1000, .05); previous = now;
      pointer.x += (pointer.tx - pointer.x) * .06; pointer.y += (pointer.ty - pointer.y) * .06;
      draw();
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);frame = 0; previous = performance.now();
    document.documentElement.classList.toggle('motion-paused', paused());
    button.setAttribute('aria-pressed', String(paused()));
    button.disabled = motionQuery.matches;
    button.setAttribute('aria-label', motionQuery.matches ? 'Animations disabled by your reduced motion preference' : paused() ? 'Resume animations' : 'Pause animations');
    document.getElementById('motion-label').textContent = motionQuery.matches ? 'Reduced motion' : paused() ? 'Resume motion' : 'Pause motion';
    document.getElementById('motion-icon').textContent = paused() ? '▷' : 'Ⅱ';
    if (visible && !document.hidden && !paused()) frame = requestAnimationFrame(tick);
    else draw();
  }
  new ResizeObserver(() => {
    width = scene.clientWidth; height = scene.clientHeight;
    layout = fitNeuralScene(width, height);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);draw();scene.classList.add('scene-ready');
  }).observe(scene);
  new IntersectionObserver(([entry]) => {visible = entry.isIntersecting;sync();}, {threshold:.05}).observe(scene);
  scene.addEventListener('pointermove', e => {
    if (paused() || e.pointerType === 'touch') return;
    const bounds = scene.getBoundingClientRect();
    pointer.tx = (e.clientX - bounds.left) / width - .5;pointer.ty = (e.clientY - bounds.top) / height - .5;
  });
  scene.addEventListener('pointerleave', () => {pointer.tx = 0;pointer.ty = 0;});
  button.addEventListener('click', () => {manuallyPaused = !manuallyPaused;sync();});
  motionQuery.addEventListener('change', sync);document.addEventListener('visibilitychange', sync);
  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('pointermove', e => {
      if (paused() || e.pointerType === 'touch') return;
      const r = card.getBoundingClientRect();
      card.style.transform = `perspective(1100px) rotateX(${((e.clientY-r.top)/r.height-.5)*-4}deg) rotateY(${((e.clientX-r.left)/r.width-.5)*4}deg)`;
    });
    card.addEventListener('pointerleave', () => {card.style.transform = '';});
    motionQuery.addEventListener('change', () => {card.style.transform = '';});
    button.addEventListener('click', () => {card.style.transform = '';});
  });
}
