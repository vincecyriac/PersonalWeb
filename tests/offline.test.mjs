import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
class Element {
  attrs = {}; events = {}; textContent = ''; hidden = false; disabled = false; dataset = {};
  classes = new Set();
  classList = { contains: x => this.classes.has(x), add: x => this.classes.add(x), remove: x => this.classes.delete(x), toggle: (x, value) => value ? this.classes.add(x) : this.classes.delete(x) };
  style = { removeProperty() {}, setProperty() {} };
  setAttribute(k, v) { this.attrs[k] = v; } removeAttribute(k) { delete this.attrs[k]; }
  addEventListener(k, f) { this.events[k] = f; }
  click() { if (!this.disabled) this.events.click?.({}); }
}
const names = ['ride-scene', 'ride-toggle', 'ride-light', 'ride-status', 'ride-canvas', 'ride-camera-controls', 'ride-view', 'ride-pace', 'ride-loading', 'ride-telemetry', 'ride-speed', 'ride-reset', 'ride-orbit-left', 'ride-orbit-right'];
const els = Object.fromEntries(names.map(id => [id, new Element()]));
const illustration = new Element(); illustration.setAttribute('aria-hidden', 'true');
els['ride-scene'].querySelector = () => illustration;
els['ride-pace'].hidden = els['ride-camera-controls'].hidden = true;
els['ride-speed'].value = '270';
const root = new Element(), observers = [], mutations = [];
globalThis.document = { documentElement: root, hidden: false, getElementById: id => els[id], querySelectorAll: () => [], addEventListener() {} };
globalThis.matchMedia = () => ({ matches: true });
globalThis.IntersectionObserver = class { constructor(fn) { this.fn = fn; observers.push(this); } observe() {} disconnect() {} };
globalThis.MutationObserver = class { constructor(fn) { mutations.push(fn); } observe() {} };
const motion = { matches: false, addEventListener(k, fn) { this.sync = fn; } };
let callbacks, state = {};
const world = Object.fromEntries(['setReduced', 'setRiding', 'setGolden', 'setOverview', 'setActive', 'setSpeed', 'visit', 'orbit', 'reset', 'dispose'].map(method => [method, value => { state[method] = value ?? true; }]));
globalThis.__rideTestImport = async () => ({ createRideScene(canvas, options) { callbacks = options; return world; } });
let source = await readFile(new URL('../js/offline.js', import.meta.url), 'utf8');
source = source.replace(/await import\('[^']+'\)/, 'await globalThis.__rideTestImport()');
const { initOfflineMode } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
initOfflineMode(motion);
assert(els['ride-toggle'].disabled);
observers[1].fn([{ isIntersecting: true }]); observers[0].fn([{ isIntersecting: true }]);
await new Promise(resolve => setImmediate(resolve));
assert(!els['ride-scene'].classes.has('ride-3d-ready'));
assert(!els['ride-loading'].hidden, 'Loading must remain until the first rendered frame.');
assert.equal(illustration.attrs['aria-hidden'], 'true');
callbacks.onReady();
assert(els['ride-loading'].hidden); assert(!els['ride-toggle'].disabled);
assert.equal(els['ride-scene'].attrs['aria-busy'], 'false');
els['ride-toggle'].click(); assert(state.setRiding);
assert.equal(state.setSpeed, 270, 'Brisk should be the initial pace.');
els['ride-speed'].events.change({ target: { value: '120' } }); assert.equal(state.setSpeed, 120);
callbacks.onProgress({ speed: 0, lean: 0 });
assert.equal(els['ride-telemetry'].textContent, 'READY WHEN YOU ARE');
motion.matches = true; motion.sync(); assert(els['ride-toggle'].disabled); assert(state.setReduced);
observers[1].fn([{ isIntersecting: false }]); assert.equal(state.setActive, false);
callbacks.onError();
assert(state.dispose); assert(els['ride-scene'].classes.has('ride-fallback'));
assert(!els['ride-scene'].classes.has('ride-3d-ready')); assert.equal(illustration.attrs['aria-hidden'], undefined);
assert(els['ride-pace'].hidden);
console.log('Controller checks passed: first-frame reveal, default Brisk pace, speed changes, motion preference, visibility, and failure-only fallback.');
