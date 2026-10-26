// Exercise the real scene graph and animation clock without a browser or GPU.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CHECKPOINTS, routePoint } from '../js/ride-route.js';
let scene, camera, renders = 0, ready = 0, latest, serial = 0;
const frames = new Map();
let now = performance.now();
class Renderer {
  shadowMap = {};
  setPixelRatio() {} setSize() {} dispose() {}
  render(value, view) { scene = value; camera = view; scene.updateMatrixWorld(); camera.updateMatrixWorld(); renders++; }
}
globalThis.__rideTestRenderer = Renderer;
globalThis.devicePixelRatio = 1;
globalThis.requestAnimationFrame = callback => { frames.set(++serial, callback); return serial; };
globalThis.cancelAnimationFrame = id => frames.delete(id);
globalThis.ResizeObserver = class { observe() {} disconnect() {} };
globalThis.document = { createElement() { return { getContext() { return { beginPath() {}, roundRect() {}, fill() {}, stroke() {}, fillText() {} }; } }; } };
const canvas = { clientWidth: 1182, clientHeight: 562, addEventListener() {}, removeEventListener() {}, setPointerCapture() {} };
const url = new URL('../js/ride-scene.js', import.meta.url);
let source = await readFile(url, 'utf8');
source = source.replace(/from '([^']+)'/g, (_, path) => `from '${new URL(path, url).href}'`);
source = source.replace(/import \* as THREE from '([^']+)';/, "import * as NativeThree from '$1'; const THREE = { ...NativeThree, WebGLRenderer: globalThis.__rideTestRenderer };");
const { createRideScene } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const world = createRideScene(canvas, { onReady: () => ready++, onProgress: value => latest = value });
function step(count) {
  for (let i = 0; i < count; i++) { now += 1000 / 60; const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(now)); }
}
assert.equal(ready, 0, 'Do not reveal the scene before rendering.');
world.setActive(true); step(2);
assert.equal(ready, 1);
const bike = scene.getObjectByName('Motorcycle');
const mountainFaces = scene.getObjectByName('Mountain pass').children.filter(child => child.isMesh);
assert.equal(mountainFaces.length, 3, 'Each mountain must use one surface, without an overlapping snow-cap mesh.');
for (const mesh of mountainFaces) {
  assert(mesh.material.vertexColors, 'Snow should be colored on the mountain surface.');
  assert.equal(mesh.geometry.attributes.color.count, mesh.geometry.attributes.position.count);
}

for (const point of CHECKPOINTS) {
  assert(scene.getObjectByName(point.name), `Missing 3D landmark: ${point.name}`);
  world.visit(point.id); step(20);
  assert.equal(latest.checkpoint.id, point.id);
  assert(bike.position.distanceTo(routePoint(point.t)) < .02);
  const landmark = scene.getObjectByName(point.name);
  const sign = landmark.children.find(child => child.isSprite);
  const projected = sign.getWorldPosition(bike.position.clone()).project(camera);
  assert(Math.abs(projected.x) < .85 && Math.abs(projected.y) < .95 && projected.z < 1, `Landmark ${point.id} should be in the desktop camera frame.`);
}
world.reset(); world.setRiding(true); step(240);
assert(latest.speed >= 269, 'Default Brisk pace must reach 270 units/s.');
world.setSpeed(120); step(180);
assert.equal(latest.speed, 120, 'Easy pace must slow the rider down.');
world.setSpeed(270); step(180);
assert(latest.speed >= 269, 'Brisk pace must increase riding speed.');
assert(Math.abs(bike.rotation.x) > .01, 'The bike should lean while cornering.');
world.setActive(false); const parked = bike.position.clone(), previousRenders = renders; step(120);
assert.equal(renders, previousRenders, 'Offscreen scenes must not consume render frames.');
assert(bike.position.equals(parked), 'Offscreen travel must pause.');
world.setActive(true); world.setReduced(true); step(120);
assert.equal(latest.speed, 0); assert.equal(bike.rotation.x, 0);
world.setRiding(false); world.setOverview(true); step(180);
assert(camera.position.length() > 3000, 'Overview must show the expanded circuit.');
canvas.clientWidth = 348; canvas.clientHeight = 438;
world.setActive(false); world.setActive(true); step(180);
assert(camera.position.length() > 6000, 'Portrait overview must back away to fit the route.');
world.setOverview(false);
for (const point of CHECKPOINTS) {
  world.visit(point.id); step(20);
  const sign = scene.getObjectByName(point.name).children.find(child => child.isSprite);
  const projected = sign.getWorldPosition(bike.position.clone()).project(camera);
  assert(Math.abs(projected.x) < .8 && Math.abs(projected.y) < .9 && projected.z < 1, `Landmark ${point.id} should be in the portrait camera frame.`);
  const right = bike.position.clone().set(1, 0, 0).applyQuaternion(camera.quaternion).multiplyScalar(sign.scale.x / 2);
  const rightEdge = sign.getWorldPosition(bike.position.clone()).add(right).project(camera);
  assert(rightEdge.x < 1, `Landmark label ${point.id} must fit in the portrait view.`);
}
assert.equal(ready, 1, 'Ready callback must fire only once.');
world.dispose(); assert.equal(frames.size, 0);
console.log('Scene checks passed: first-frame loading, all landmarks, pace changes, corner lean, offscreen/reduced-motion pause, portrait overview, disposal.');
