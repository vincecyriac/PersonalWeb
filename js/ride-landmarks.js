import * as THREE from '../vendor/three.module.min.js';
import { CHECKPOINTS } from './ride-route.js?v=kochi-20261026';

// Small roadside places, deliberately fictional rather than personal locations.
export function addRideLandmarks(scene, { groundHeight, routePoint, material, box, bar, ellipsoid }) {
  const textures = [];
  const cream = material('plaster', '#d5c9a7'), wood = material('timber', '#69513b');
  const roof = material('terracotta', '#9e6045'), glass = material('window', '#6a9391', .25, .2);
  const signMat = material('sign post', '#d4cbb0');
  function label(group, text, y = 190) {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 112;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#183328'; ctx.beginPath(); ctx.roundRect(3, 3, 506, 106, 20); ctx.fill();
    ctx.strokeStyle = '#d6c59b'; ctx.lineWidth = 3; ctx.stroke();
    ctx.font = '500 36px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f4ead1'; ctx.fillText(text, 256, 58);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; textures.push(texture);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: true }));
    sprite.position.set(0, y, 0); sprite.scale.set(180, 39.4, 1); group.add(sprite);
  }
  function cabin(group, width, height, depth) {
    box(group, 'Plaster walls', [width, height, depth], [0, height / 2, 0], cream);
    const slope = .4, half = width / 2 + 14;
    for (const side of [-1, 1]) box(group, 'Pitched roof', [half / Math.cos(slope), 9, depth + 30], [side * half / 2, height + 21, 0], roof, [0, 0, -side * slope]);
    box(group, 'Door', [30, 65, 3], [0, 32.5, depth / 2 + 2], wood);
    for (const side of [-1, 1]) box(group, 'Window', [30, 30, 4], [side * width * .3, height * .58, depth / 2 + 3], glass);
  }
  function pine(group, x, z, height) {
    bar(group, [x, 0, z], [x, height * .65, z], 5, wood);
    for (let j = 0; j < 3; j++) {
      const mesh = new THREE.Mesh(new THREE.ConeGeometry(height * (.29 - j * .055), height * .48, 7), material('pine', '#345347'));
      mesh.position.set(x, height * (.44 + j * .2), z); mesh.castShadow = true; group.add(mesh);
    }
  }
  for (const point of CHECKPOINTS) {
    const p = routePoint(point.t), direction = routePoint(point.t + .002).sub(p).setY(0).normalize();
    const normal = new THREE.Vector3(-direction.z, 0, direction.x);
    const location = p.clone().addScaledVector(normal, point.id === 'beach' ? 260 : -260);
    const group = new THREE.Group(); group.name = point.name;
    group.position.set(location.x, groundHeight(location.x, location.z), location.z);
    // The fronts face the road. A low foundation absorbs the rolling terrain.
    group.rotation.y = Math.atan2(normal.x, normal.z);
    scene.add(group);
    const stone = material('foundation', '#8e9276');
    if (['home', 'tea', 'work', 'view'].includes(point.id)) box(group, 'Foundation', [230, 16, 180], [0, 2, 0], stone);
    if (point.id === 'home') {
      cabin(group, 170, 95, 125);
      for (const x of [-105, 105]) { bar(group, [x, 0, 100], [x, 43, 100], 3, wood); }
      bar(group, [-105, 30, 100], [-35, 30, 100], 2.5, wood); bar(group, [35, 30, 100], [105, 30, 100], 2.5, wood);
      label(group, 'HOME', 175);
    } else if (point.id === 'tea') {
      cabin(group, 160, 80, 90);
      box(group, 'Tea counter', [125, 30, 22], [0, 32, 58], wood);
      box(group, 'Canvas awning', [180, 5, 70], [0, 78, 65], material('awning', '#d7b76f'), [.13, 0, 0]);
      for (const x of [-76, 76]) bar(group, [x, 5, 96], [x, 74, 96], 2, wood);
      for (const x of [-30, 0, 30]) {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(5, 3.5, 8, 12), cream); cup.position.set(x, 51, 60); group.add(cup);
      }
      box(group, 'Bench', [100, 5, 18], [0, 20, 125], wood);
      for (const x of [-40, 40]) bar(group, [x, 0, 125], [x, 18, 125], 3, wood);
      label(group, 'TEA STOP', 160);
    } else if (point.id === 'forest') {
      [[-100, -60, 180], [-45, -100, 220], [40, -110, 190], [105, -60, 165]].forEach(args => pine(group, ...args));
      bar(group, [-85, 0, 65], [-85, 110, 65], 5, wood); bar(group, [85, 0, 65], [85, 110, 65], 5, wood);
      bar(group, [-90, 110, 65], [90, 110, 65], 6, wood);
      label(group, 'FOREST', 150);
    } else if (point.id === 'mountains') {
      for (const [x, h, r] of [[-190, 310, 230], [70, 450, 260], [300, 290, 200]]) {
        // A single surface avoids coplanar snow-cap faces fighting in the depth buffer.
        const geometry = new THREE.ConeGeometry(r, h, 5, 13);
        const stoneColor = new THREE.Color('#7f8e82'), snowColor = new THREE.Color('#d3d8c6');
        const colors = [];
        for (let i = 0; i < geometry.attributes.position.count; i++) {
          const color = geometry.attributes.position.getY(i) >= h * .26 ? snowColor : stoneColor;
          colors.push(color.r, color.g, color.b);
        }
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        const mountainMaterial = material('mountain colors', '#ffffff', 1);
        mountainMaterial.vertexColors = true;
        const peak = new THREE.Mesh(geometry, mountainMaterial);
        peak.name = 'Mountain with colored summit';
        peak.position.set(x, h / 2 - 30, -300); peak.rotation.y = x * .013; group.add(peak);
      }
      label(group, 'MOUNTAIN PASS', 145);
    } else if (point.id === 'view') {
      box(group, 'Viewing deck', [190, 9, 135], [0, 24, 0], wood);
      for (const x of [-86, 86]) for (const z of [-56, 56]) bar(group, [x, 0, z], [x, 65, z], 3, wood);
      bar(group, [-86, 65, -56], [86, 65, -56], 3, wood);
      bar(group, [-86, 65, -56], [-86, 65, 56], 3, wood); bar(group, [86, 65, -56], [86, 65, 56], 3, wood);
      bar(group, [0, 28, 0], [0, 74, 0], 4, signMat);
      bar(group, [0, 73, 13], [0, 87, -24], 8, material('telescope', '#43594e', .4, .5));
      label(group, 'VIEWPOINT', 145);
    } else if (point.id === 'work') {
      box(group, 'Kochi workplace', [160, 140, 115], [0, 70, 0], cream);
      box(group, 'Flat roof', [184, 9, 135], [0, 144, 0], frameMaterial());
      for (const x of [-50, 0, 50]) for (const y of [45, 100]) box(group, 'Office window', [32, 38, 4], [x, y, 60], glass);
      label(group, 'KOCHI', 195);
    } else {
      for (const x of [-100, 100]) {
        bar(group, [x, 0, -30], [x + 15, 145, -35], 6, wood);
        for (let j = 0; j < 6; j++) {
          const a = j / 6 * Math.PI * 2;
          const leaf = ellipsoid(group, 'Palm frond', [105, 7, 24], [x + 15 + Math.cos(a) * 35, 145, -35 + Math.sin(a) * 35], material('palm', '#527350'));
          leaf.rotation.y = -a; leaf.rotation.z = .15;
        }
      }
      box(group, 'Beach bench', [100, 8, 35], [0, 18, 25], wood);
      label(group, 'BEACH', 185);
    }
  }
  function frameMaterial() { return material('office roof', '#3b544b'); }
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1900, 6800), new THREE.MeshStandardMaterial({ color: '#649d9a', roughness: .4, metalness: .15 }));
  water.rotation.x = -Math.PI / 2; water.position.set(-2850, 4, -500); scene.add(water);
  // Fine pale bands at the shore read as surf without a costly water simulation.
  for (let i = 0; i < 7; i++) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(3 + i, 6100), new THREE.MeshBasicMaterial({ color: '#c0d6bc', transparent: true, opacity: .35 - i * .035 }));
    line.rotation.x = -Math.PI / 2; line.position.set(-1920 - i * 39, 4.4, -500); scene.add(line);
  }
  return { dispose() { textures.forEach(texture => texture.dispose()); } };
}
