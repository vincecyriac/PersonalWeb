import * as THREE from '../vendor/three.module.min.js';

export const TAU = Math.PI * 2;
export const CHECKPOINTS = [
  { id: 'home', name: 'Home', t: 0, note: 'Every good ride starts here.' },
  { id: 'tea', name: 'Tea stop', t: .85, note: 'A small chai break. A big part of the journey.' },
  { id: 'forest', name: 'Forest', t: 1.7, note: 'Through the trees, away from the noise.' },
  { id: 'mountains', name: 'Mountain pass', t: 2.55, note: 'A few more bends. A little more sky.' },
  { id: 'view', name: 'Viewpoint', t: 3.4, note: 'Pull over. Take it all in.' },
  { id: 'work', name: 'Kochi', t: 4.3, note: 'Back to building things with a fresh perspective.' },
  { id: 'beach', name: 'Beach', t: 5.3, note: 'The road meets the sea.' },
];
export function noise(x, z) {
  const hash = (a, b) => { const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n); };
  const ix = Math.floor(x), iz = Math.floor(z);
  let u = x - ix, v = z - iz;
  u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix, iz), hash(ix + 1, iz), u), THREE.MathUtils.lerp(hash(ix, iz + 1), hash(ix + 1, iz + 1), u), v);
}
export function groundHeight(x, z) {
  const hills = 24 + 12 * Math.sin(x * .004) + 16 * Math.cos(z * .004) + noise(x * .006, z * .006) * 14;
  const ridge = Math.exp(-(((z + 1850) / 700) ** 2)) * (280 + 280 * noise(x * .003, z * .003));
  // The western coast eases down to the sea without a cliff at the beach.
  const coast = THREE.MathUtils.smoothstep(-x, 1500, 1980);
  return THREE.MathUtils.lerp(hills + ridge * (.4 + .6 * noise(x * .008, z * .008)), 3, coast);
}
export function routePoint(t) {
  const x = 1250 * Math.sin(t) + 220 * Math.sin(2 * t), z = 900 * Math.cos(t) + 130 * Math.sin(3 * t);
  return new THREE.Vector3(x, groundHeight(x, z) + 4, z);
}
const samples = Array.from({ length: 2049 }, (_, i) => routePoint(i / 2048 * TAU));
const distances = [0];
for (let i = 1; i < samples.length; i++) distances.push(distances[i - 1] + samples[i].distanceTo(samples[i - 1]));
export const ROUTE_LENGTH = distances.at(-1);
export function distanceAt(t) {
  const f = ((t % TAU + TAU) % TAU) / TAU * 2048, i = Math.floor(f);
  return THREE.MathUtils.lerp(distances[i], distances[i + 1], f - i);
}
export function routeFrame(distance) {
  const d = (distance % ROUTE_LENGTH + ROUTE_LENGTH) % ROUTE_LENGTH;
  let lo = 0, hi = distances.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (distances[mid] > d) hi = mid; else lo = mid; }
  const t = (lo + (d - distances[lo]) / (distances[hi] - distances[lo])) / 2048 * TAU;
  const p = routePoint(t), before = routePoint(t - .002), after = routePoint(t + .002);
  const direction = after.clone().sub(before).normalize();
  const dx = 1250 * Math.cos(t) + 440 * Math.cos(2 * t), dz = -900 * Math.sin(t) + 390 * Math.cos(3 * t);
  const ddx = -1250 * Math.sin(t) - 880 * Math.sin(2 * t), ddz = -900 * Math.cos(t) - 1170 * Math.sin(3 * t);
  return { t, p, direction, curvature: (dx * ddz - dz * ddx) / Math.pow(dx * dx + dz * dz, 1.5) };
}
export function cornerLean(speed, curvature) {
  if (!speed) return 0;
  // Scaled gravity matches the miniature world; signed curvature leans into each bend.
  return THREE.MathUtils.clamp(Math.atan(speed * speed * curvature / 160), -.58, .58);
}
