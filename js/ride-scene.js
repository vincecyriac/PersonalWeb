import * as THREE from '../vendor/three.module.min.js';

import { TAU, CHECKPOINTS, noise, groundHeight, routePoint, routeFrame, distanceAt, ROUTE_LENGTH, cornerLean } from './ride-route.js?v=kochi-20261026';
import { addRideLandmarks } from './ride-landmarks.js?v=kochi-20261026';
const clamp = THREE.MathUtils.clamp;
export { groundHeight, routePoint } from './ride-route.js?v=kochi-20261026';

export function createRideScene(canvas, { reducedMotion = false, onError = () => {}, onReady = () => {}, onProgress = () => {} } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
  try {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    const scene = new THREE.Scene();
    const daySky = new THREE.Color('#b2bcab'), warmSky = new THREE.Color('#d4af83');
    scene.background = daySky.clone();
    scene.fog = new THREE.Fog(daySky, 1300, 3300);
    const camera = new THREE.PerspectiveCamera(40, 2, 1, 14000);
    const fill = new THREE.HemisphereLight('#dbe5d5', '#4d5840', 2.1);
    scene.add(fill);
    const sunLight = new THREE.DirectionalLight('#fff2d1', 2.6);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    Object.assign(sunLight.shadow.camera, { left: -240, right: 240, top: 240, bottom: -240, near: 1, far: 1600 });
    sunLight.shadow.normalBias = 1.2;
    scene.add(sunLight, sunLight.target);
    const mats = {};
    const material = (name, color, roughness = .8, metalness = 0) => mats[name] ||= new THREE.MeshStandardMaterial({ color, roughness, metalness });
    const rubber = material('rubber', '#1c2420', .95), metal = material('metal', '#9da89e', .35, .7);
    const olive = material('olive', '#a6b58a', .36, .3), frameMat = material('frame', '#2c3d31', .55, .3);
    const jacket = material('jacket', '#c8b58c', .95), pants = material('pants', '#344239', .95);
    const geoCache = new Map();
    function box(group, name, dims, p, mat, rotation) {
      const key = 'box:' + dims.join(',');
      if (!geoCache.has(key)) geoCache.set(key, new THREE.BoxGeometry(...dims));
      const mesh = new THREE.Mesh(geoCache.get(key), mat); mesh.name = name;
      mesh.position.set(...p); if (rotation) mesh.rotation.set(...rotation);
      mesh.castShadow = true; group.add(mesh); return mesh;
    }
    function ellipsoid(group, name, dims, p, mat) {
      if (!geoCache.has('sphere')) geoCache.set('sphere', new THREE.SphereGeometry(1, 24, 16));
      const mesh = new THREE.Mesh(geoCache.get('sphere'), mat); mesh.name = name;
      mesh.scale.set(...dims.map(v => v / 2)); mesh.position.set(...p); mesh.castShadow = true; group.add(mesh); return mesh;
    }
    function bar(group, a, b, radius, mat) {
      const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), diff = end.clone().sub(start);
      const key = `bar:${radius}:${diff.length().toFixed(4)}`;
      if (!geoCache.has(key)) geoCache.set(key, new THREE.CylinderGeometry(radius, radius, diff.length(), 10));
      const mesh = new THREE.Mesh(geoCache.get(key), mat); mesh.position.copy(start.add(end).multiplyScalar(.5));
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), diff.normalize()); mesh.castShadow = true; group.add(mesh); return mesh;
    }
    const bike = new THREE.Group(); bike.name = 'Motorcycle'; scene.add(bike);
    const wheelGeo = new THREE.TorusGeometry(14.5, 4, 10, 36), rimGeo = new THREE.TorusGeometry(11, .9, 8, 32);
    const wheels = [-37, 37].map(x => {
      const wheel = new THREE.Group(); wheel.position.set(x, 18.5, 0); bike.add(wheel);
      const tyre = new THREE.Mesh(wheelGeo, rubber); tyre.castShadow = true; wheel.add(tyre);
      wheel.add(new THREE.Mesh(rimGeo, metal));
      bar(wheel, [0, 0, -6], [0, 0, 6], 2.5, metal);
      for (let j = 0; j < 12; j++) {
        const a = j / 12 * TAU;
        bar(wheel, [0, 0, j % 2 ? -1.2 : 1.2], [Math.cos(a) * 11, Math.sin(a) * 11, 0], .38, metal);
      }
      return wheel;
    });
    box(bike, 'Saddle', [38, 6, 17], [-16, 40, 0], material('leather', '#4d3f2d', .8));
    ellipsoid(bike, 'Fuel tank', [34, 19, 22], [10, 42, 0], olive);
    box(bike, 'Engine', [23, 18, 17], [-3, 24, 0], metal);
    for (let i = 0; i < 5; i++) box(bike, 'Cooling fin', [24, 1, 19], [-3, 17 + i * 3, 0], frameMat);
    box(bike, 'Luggage rack', [24, 2, 24], [-37, 44, 0], metal);
    for (const side of [-1, 1]) {
      box(bike, 'Touring pannier', [23, 20, 10], [-29, 31, side * 15], material('pannier', '#78866a', .72));
      box(bike, 'Pannier strap', [3, 21, 10.4], [-29, 31, side * 15], frameMat);
      bar(bike, [37, 18.5, side * 6], [24, 50, side * 6], 1.9, metal);
      bar(bike, [24, 51, side * 6], [23, 54, side * 16], 1.5, metal);
      bar(bike, [23, 54, side * 13], [23, 54, side * 18], 2, rubber);
      bar(bike, [22, 54, side * 13], [27, 65, side * 19], .8, metal);
      ellipsoid(bike, 'Mirror', [6, 4, 2], [27, 66, side * 19], metal);
    }
    bar(bike, [-41, 13, 12], [-2, 13, 12], 3, metal);
    for (const [a, b] of [[[-37, 18, 0], [-14, 35, 0]], [[-14, 35, 0], [15, 16, 0]], [[15, 16, 0], [-37, 18, 0]], [[15, 16, 0], [25, 45, 0]], [[-14, 35, 0], [25, 45, 0]]]) bar(bike, a, b, 1.7, frameMat);
    const headlampMat = material('headlamp', '#f6e8b6', .2); headlampMat.emissive.set('#eed398'); headlampMat.emissiveIntensity = .6;
    ellipsoid(bike, 'Headlamp', [5, 13, 13], [36, 47, 0], headlampMat);
    const tailMat = material('taillamp', '#b45136', .5); tailMat.emissive.set('#b45136'); tailMat.emissiveIntensity = .5;
    box(bike, 'Tail lamp', [3, 5, 12], [-48, 37, 0], tailMat);
    ellipsoid(bike, 'Rider jacket', [23, 34, 22], [-8, 61, 0], jacket).rotation.z = -.2;
    ellipsoid(bike, 'Helmet', [18, 20, 18], [0, 86, 0], material('helmet', '#233e32', .3, .25));
    ellipsoid(bike, 'Visor', [3, 8, 16], [8, 87, 0], material('visor', '#7dada1', .13, .6));
    for (const side of [-1, 1]) {
      bar(bike, [-7, 70, side * 9], [12, 58, side * 14], 4, jacket);
      bar(bike, [12, 58, side * 14], [24, 54, side * 15], 3.4, jacket);
      bar(bike, [-15, 44, side * 8], [8, 31, side * 12], 4.8, pants);
      bar(bike, [8, 31, side * 12], [0, 15, side * 12], 3.8, pants);
      box(bike, 'Boot', [12, 6, 7], [3, 13, side * 12], rubber);
    }

    // One terrain mesh, with a color transition from foothills to distant ridges.
    const terrainGeo = new THREE.PlaneGeometry(7000, 6600, 210, 198); terrainGeo.rotateX(-Math.PI / 2);
    const vertices = terrainGeo.attributes.position, colors = [];
    const low = new THREE.Color('#576b46'), high = new THREE.Color('#8a9580'), sand = new THREE.Color('#c9b889');
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i), z = vertices.getZ(i) - 500, y = groundHeight(x, z);
      vertices.setXYZ(i, x, y, z);
      const c = low.clone().lerp(high, clamp((y - 90) / 400, 0, 1));
      c.lerp(sand, THREE.MathUtils.smoothstep(-x, 1550, 1950));
      c.multiplyScalar(.85 + noise(x * .023, z * .023) * .25); colors.push(c.r, c.g, c.b);
    }
    terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); terrainGeo.computeVertexNormals();
    const terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat); terrain.receiveShadow = true; scene.add(terrain);
    function ribbon(width, offset, mat) {
      const v = [], indices = [];
      for (let i = 0; i <= 600; i++) {
        const t = i / 600 * TAU, p = routePoint(t), next = routePoint(t + .001), dx = next.x - p.x, dz = next.z - p.z, len = Math.hypot(dx, dz);
        for (let j = 0; j <= 8; j++) { const s = j / 4 - 1, x = p.x - dz / len * width * s, z = p.z + dx / len * width * s; v.push(x, groundHeight(x, z) + offset, z); }
        if (i < 600) for (let j = 0; j < 8; j++) { const a = i * 9 + j; indices.push(a, a + 1, a + 9, a + 1, a + 10, a + 9); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setIndex(indices); g.computeVertexNormals();
      const mesh = new THREE.Mesh(g, mat); mesh.receiveShadow = true; scene.add(mesh); return g;
    }
    ribbon(78, 2.0, material('shoulder', '#a79e80', 1));
    ribbon(70, 3.3, material('asphalt', '#424b40', .97));
    const markerGeo = new THREE.BoxGeometry(5, 24, 5), markerMat = material('marker', '#dedcc0', .9);
    const markers = new THREE.InstancedMesh(markerGeo, markerMat, 100); markers.castShadow = true;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 100; i++) {
      const t = i / 100 * TAU, p = routePoint(t), next = routePoint(t + .001), tangent = next.sub(p).setY(0).normalize();
      p.add(new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(92));
      dummy.position.set(p.x, groundHeight(p.x, p.z) + 12, p.z); dummy.updateMatrix(); markers.setMatrixAt(i, dummy.matrix);
    }
    scene.add(markers);
    const stripeGeo = new THREE.BoxGeometry(15, .35, 2);
    const stripes = new THREE.InstancedMesh(stripeGeo, material('road paint', '#c8c7ac', .95), 220);
    for (let i = 0; i < 220; i++) {
      const t = i / 220 * TAU, p = routePoint(t), ahead = routePoint(t + .002), direction = ahead.sub(p).normalize();
      p.add(new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(-28));
      dummy.position.set(p.x, groundHeight(p.x, p.z) + 3.8, p.z);
      dummy.rotation.set(0, Math.atan2(-direction.z, direction.x), Math.atan2(direction.y, Math.hypot(direction.x, direction.z)), 'YXZ');
      dummy.updateMatrix(); stripes.setMatrixAt(i, dummy.matrix);
    }
    scene.add(stripes);

    // Instanced foliage keeps the full landscape inexpensive on mobile.
    const trunkGeo = new THREE.CylinderGeometry(1.4, 3.8, 1, 7), leafGeo = new THREE.IcosahedronGeometry(1, 1);
    const trunks = new THREE.InstancedMesh(trunkGeo, material('bark', '#6b6046', 1), 160);
    const leaves = new THREE.InstancedMesh(leafGeo, material('foliage', '#ffffff', 1), 480);
    const foliageColors = ['#40583b', '#526644', '#5a7149', '#496344'];
    const roadSamples = Array.from({ length: 192 }, (_, k) => routePoint(k / 192 * TAU));
    for (let i = 0; i < 160; i++) {
      const a = i * 2.39996;
      const r = i < 80 ? 250 + noise(i, 3) * 650 : 1650 + noise(i, 5) * 450;
      const x = Math.sin(a) * r;
      let z = Math.cos(a) * r * .78 - 180;
      const nearRoad = () => roadSamples.some(p => Math.hypot(p.x - x, p.z - z) < 165);
      while (nearRoad()) z -= 200;
      const y = groundHeight(x, z), height = 65 + noise(i, 9) * 85;
      dummy.position.set(x, y + height * .4, z); dummy.scale.set(1, height * .8, 1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix);
      for (let j = 0; j < 3; j++) {
        dummy.position.set(x + Math.sin(j * 2.1) * height * .13, y + height * (.63 + j * .12), z + Math.cos(j * 2.1) * height * .1);
        dummy.scale.set(height * (.28 - j * .025), height * (.29 - j * .025), height * (.24 - j * .018));
        dummy.rotation.set(.1 * j, i * .7, .12 * j); dummy.updateMatrix(); leaves.setMatrixAt(i * 3 + j, dummy.matrix);
        leaves.setColorAt(i * 3 + j, new THREE.Color(foliageColors[i % 4]));
      }
    }
    scene.add(trunks, leaves);
    const rockGeo = new THREE.DodecahedronGeometry(1, 0), rocks = new THREE.InstancedMesh(rockGeo, material('rock', '#878a72', .98), 30);
    for (let i = 0; i < 30; i++) {
      const a = i * 2.39996, x = Math.sin(a) * (1650 + i % 3 * 40), z = Math.cos(a) * 1150, s = 10 + noise(i, 20) * 16;
      dummy.position.set(x, groundHeight(x, z) + s * .3, z); dummy.scale.set(s * 1.3, s * .6, s); dummy.rotation.set(.2, i * .8, .1); dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix);
    }
    rocks.castShadow = true; scene.add(rocks);
    const landmarks = addRideLandmarks(scene, { groundHeight, routePoint, material, box, bar, ellipsoid });
    const sunGeo = new THREE.SphereGeometry(80, 24, 16), sunMat = new THREE.MeshBasicMaterial({ color: '#f5e3b0', fog: false });
    const sun = new THREE.Mesh(sunGeo, sunMat); sun.position.set(900, 690, -2300); scene.add(sun);

    let active = false, riding = false, reduced = reducedMotion, overview = false, disposed = false;
    let distanceTravelled = 0, speed = 0, cruiseSpeed = 270, lean = 0, heading = 0, warm = 0, warmTarget = 0, yaw = .48, yawTarget = .48, zoom = 1, zoomTarget = 1, raf = 0, last = 0;
    let firstFrame = true, lastCheckpoint = null, lastProgress = 0;
    let drag = null, lastWidth = 0, lastHeight = 0;
    const warmLight = new THREE.Color('#ffc17f'), warmGround = new THREE.Color('#d6bc88');
    const cameraGoal = new THREE.Vector3(), lookGoal = new THREE.Vector3(), lookAt = new THREE.Vector3();
    function placeBike(dt = 0, snap = false) {
      const { p, direction, curvature } = routeFrame(distanceTravelled);
      const targetLean = reduced ? 0 : cornerLean(speed, curvature);
      lean += (targetLean - lean) * (snap || reduced ? 1 : 1 - Math.exp(-dt * 7));
      const targetHeading = Math.atan2(-direction.z, direction.x);
      heading += Math.atan2(Math.sin(targetHeading - heading), Math.cos(targetHeading - heading));
      bike.position.copy(p);
      bike.rotation.set(lean, heading, Math.atan2(direction.y, Math.hypot(direction.x, direction.z)), 'YZX');
      wheels.forEach(w => { w.rotation.z = -distanceTravelled / 18.5; });
    }
    function poseCamera(snap = false, dt = .016) {
      const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
      const distance = (aspect < .9 ? 540 : 480) * zoom;
      if (overview) {
        const overviewScale = aspect < .9 ? 1.8 : 1;
        cameraGoal.set(Math.sin(yaw) * 3000 * overviewScale, 2400 * overviewScale, Math.cos(yaw) * 3000 * overviewScale);
        lookGoal.set(0, 40, -80);
      } else {
        lookGoal.copy(bike.position).add(new THREE.Vector3(0, 42, 0));
        const a = yaw + heading;
        cameraGoal.copy(bike.position).add(new THREE.Vector3(Math.sin(a) * distance, distance * .39, Math.cos(a) * distance));
      }
      cameraGoal.y = Math.max(cameraGoal.y, groundHeight(cameraGoal.x, cameraGoal.z) + 90);
      const blend = snap || reduced ? 1 : 1 - Math.exp(-dt * 5);
      camera.position.lerp(cameraGoal, blend); lookAt.lerp(lookGoal, blend); camera.lookAt(lookAt);
      sunLight.position.copy(bike.position).add(new THREE.Vector3(350, 750, 250)); sunLight.target.position.copy(bike.position);
    }
    function render() {
      if (disposed || !active) return;
      renderer.render(scene, camera);
      if (firstFrame) { firstFrame = false; onReady(); }
    }
    function frame(now) {
      raf = 0;
      if (!active || disposed) return;
      const dt = Math.min((now - last) / 1000 || 0, .05); last = now;
      const targetSpeed = riding && !reduced ? cruiseSpeed : 0;
      speed = reduced ? 0 : THREE.MathUtils.damp(speed, targetSpeed, targetSpeed ? 2.3 : 6, dt);
      if (speed < .05) speed = 0;
      distanceTravelled += speed * dt;
      const blend = reduced ? 1 : 1 - Math.exp(-dt * 6);
      yaw += (yawTarget - yaw) * blend; zoom += (zoomTarget - zoom) * blend; warm += (warmTarget - warm) * blend;
      scene.background.copy(daySky).lerp(warmSky, warm); scene.fog.color.copy(scene.background);
      scene.fog.near = overview ? 6500 : 1700; scene.fog.far = overview ? 13000 : 4800;
      sunLight.color.set('#fff2d1').lerp(warmLight, warm);
      terrainMat.color.set('#ffffff').lerp(warmGround, warm * .35);
      placeBike(dt); poseCamera(false, dt); render();
      if (now - lastProgress > 150 || !lastCheckpoint) {
        const frame = routeFrame(distanceTravelled);
        const checkpoint = CHECKPOINTS.reduce((best, point) => Math.abs(Math.atan2(Math.sin(frame.t - point.t), Math.cos(frame.t - point.t))) < Math.abs(Math.atan2(Math.sin(frame.t - best.t), Math.cos(frame.t - best.t))) ? point : best);
        onProgress({ checkpoint, speed: Math.round(speed), lean: Math.round(Math.abs(lean) * 180 / Math.PI), progress: (distanceTravelled % ROUTE_LENGTH + ROUTE_LENGTH) % ROUTE_LENGTH / ROUTE_LENGTH });
        lastCheckpoint = checkpoint.id; lastProgress = now;
      }
      if ((!reduced && riding) || speed > .05 || Math.abs(lean) > .001 || Math.abs(yawTarget - yaw) > .001 || Math.abs(warmTarget - warm) > .001 || Math.abs(zoomTarget - zoom) > .001 || camera.position.distanceTo(cameraGoal) > .1) wake();
    }
    function wake() { if (active && !disposed && !raf) { if (!last) last = performance.now(); raf = requestAnimationFrame(frame); } }
    function resize() {
      const width = canvas.clientWidth, height = canvas.clientHeight;
      if (!width || !height || disposed || (width === lastWidth && height === lastHeight)) return;
      lastWidth = width; lastHeight = height;
      renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); poseCamera(true); render();
    }
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(canvas);
    const onDown = e => { if (e.button !== 0) return; drag = { x: e.clientX, yaw: yawTarget, id: e.pointerId }; canvas.setPointerCapture(e.pointerId); };
    const onMove = e => { if (!drag || e.pointerId !== drag.id) return; yawTarget = drag.yaw + (drag.x - e.clientX) * .006; wake(); };
    const onUp = () => { drag = null; };
    const onKey = e => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); yawTarget += e.key === 'ArrowLeft' ? -.22 : .22; wake(); }
      if (e.key === '+' || e.key === '-' || e.key === '=') { e.preventDefault(); zoomTarget = clamp(zoomTarget + (e.key === '-' ? .12 : -.12), .65, 1.65); wake(); }
    };
    const lost = e => { e.preventDefault(); api.setActive(false); onError(); };
    canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp); canvas.addEventListener('lostpointercapture', onUp);
    canvas.addEventListener('keydown', onKey); canvas.addEventListener('webglcontextlost', lost);
    const api = {
      setActive(value) { if (active === value) return; active = value; last = 0; if (!active) { cancelAnimationFrame(raf); raf = 0; } else { resize(); wake(); } },
      setRiding(value) { riding = value; wake(); },
      setGolden(value) { warmTarget = value ? 1 : 0; wake(); },
      setReduced(value) { reduced = value; wake(); },
      setOverview(value) { overview = value; wake(); },
      setSpeed(value) { cruiseSpeed = clamp(value, 100, 300); wake(); },
      visit(id) {
        const point = CHECKPOINTS.find(p => p.id === id);
        if (!point) return;
        distanceTravelled = distanceAt(point.t); speed = 0; lean = 0; overview = false; lastCheckpoint = null;
        // Face the sea at the beach; other stops sit on the inside of the road.
        yaw = yawTarget = point.id === 'beach' ? Math.PI + .48 : .48; zoom = zoomTarget = 1;
        placeBike(0, true); poseCamera(true); wake();
      },
      orbit(delta) { yawTarget += delta; wake(); },
      reset() { distanceTravelled = 0; speed = 0; lean = 0; lastCheckpoint = null; yawTarget = .48; zoomTarget = 1; overview = false; placeBike(0, true); wake(); },
      dispose() {
        disposed = true; cancelAnimationFrame(raf); resizeObserver.disconnect();
        canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp); canvas.removeEventListener('lostpointercapture', onUp);
        canvas.removeEventListener('keydown', onKey); canvas.removeEventListener('webglcontextlost', lost);
        const geometries = new Set(), materials = new Set();
        scene.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) materials.add(o.material); if (o.isInstancedMesh) o.dispose(); });
        landmarks.dispose();
        geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); sunLight.shadow.dispose(); renderer.dispose();
      },
    };
    placeBike(0, true); poseCamera(true);
    return api;
  } catch (error) {
    renderer.dispose();
    throw error;
  }
}
