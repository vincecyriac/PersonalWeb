import assert from 'node:assert/strict';
import { CHECKPOINTS, TAU, ROUTE_LENGTH, routePoint, routeFrame, distanceAt, cornerLean } from '../js/ride-route.js';

assert(ROUTE_LENGTH > 6500, 'The scenic route should be substantially larger than the original loop.');
assert(routePoint(0).distanceTo(routePoint(TAU)) < 1e-8, 'Route must close without a visible jump.');
assert(routeFrame(-10).p.distanceTo(routeFrame(ROUTE_LENGTH - 10).p) < 1e-7);
let positive = false, negative = false;
for (let i = 0; i < 2000; i++) {
  const d = i / 2000 * ROUTE_LENGTH, f = routeFrame(d), next = routeFrame(d + 1);
  assert(Object.values(f.p).every(Number.isFinite));
  assert(Math.abs(f.p.distanceTo(next.p) - 1) < .02, 'Arc-length traversal must maintain consistent speed.');
  const slow = cornerLean(120, f.curvature), fast = cornerLean(270, f.curvature);
  assert(Math.abs(fast) >= Math.abs(slow), 'Increasing speed must increase lean.');
  assert.equal(Math.sign(fast), Math.sign(f.curvature), 'Lean must point into the turn.');
  assert(Math.abs(fast) <= .58, 'Limit maximum lean.');
  assert.equal(cornerLean(0, f.curvature), 0, 'A parked rider must be upright.');
  positive ||= f.curvature > 0; negative ||= f.curvature < 0;
}
assert(positive && negative, 'The route should contain both left and right corners.');
for (const point of CHECKPOINTS) {
  assert(routeFrame(distanceAt(point.t)).p.distanceTo(routePoint(point.t)) < .01, `Checkpoint ${point.id} must be on the route.`);
}
console.log('Route checks passed: larger closed circuit, constant-distance travel, seven checkpoints, signed speed-dependent lean.');
