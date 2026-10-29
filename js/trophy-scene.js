import * as THREE from '../vendor/three.module.min.js';

// Local stand-in for the Spline draft until its corrected glass model can be exported.
export function createTrophyScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  const resources = new Set();
  const keep = resource => { resources.add(resource); return resource; };
  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true;
    resources.forEach(resource => resource.dispose());
    renderer.dispose();
  }
  try {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, .1, 40);
    camera.position.set(0, .25, 8.6);
    camera.lookAt(0, 0, 0);
    const trophy = new THREE.Group();
    const body = new THREE.Group();
    body.position.y = -1.94;
    trophy.add(body); scene.add(trophy);

    // Neutral softboxes create reflections in the glass without a visible backdrop.
    const studio = new THREE.Scene();
    studio.background = new THREE.Color('#323b3c');
    for (const [x, y, z, width, height, intensity] of [[-3, 2, 4, 1.2, 7, 3], [4, 1, 1, .7, 6, 2], [0, 5, -2, 5, 1.5, 1.5]]) {
      const panel = new THREE.Mesh(keep(new THREE.PlaneGeometry(width, height)), keep(new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(intensity), side: THREE.DoubleSide })));
      panel.position.set(x, y, z); panel.lookAt(0, 1, 0); studio.add(panel);
    }
    const pmrem = new THREE.PMREMGenerator(renderer);
    try { scene.environment = keep(pmrem.fromScene(studio, .05)).texture; }
    finally { pmrem.dispose(); }
    scene.add(new THREE.HemisphereLight('#e5efee', '#25302d', 2));
    const key = new THREE.DirectionalLight('#f4f7ff', 3);
    key.position.set(-3, 5, 5); scene.add(key);
    const rim = new THREE.DirectionalLight('#b7d4ce', 2);
    rim.position.set(3, 3, -2); scene.add(rim);

    const black = keep(new THREE.MeshPhysicalMaterial({ color: '#14191b', roughness: .24, metalness: .18, clearcoat: .8 }));
    const blue = keep(new THREE.MeshStandardMaterial({ color: '#293565', roughness: .76, metalness: .04 }));
    const glass = keep(new THREE.MeshPhysicalMaterial({
      color: '#a2afab', metalness: 0, roughness: .075,
      transmission: .86, thickness: .09, ior: 1.5,
      attenuationColor: new THREE.Color('#36413e'), attenuationDistance: .28,
      transparent: true, opacity: .88, clearcoat: 1, envMapIntensity: 1.5,
    }));
    function box(width, height, depth, x, y, z, material) {
      const mesh = new THREE.Mesh(keep(new THREE.BoxGeometry(width, height, depth)), material);
      mesh.position.set(x, y, z); body.add(mesh); return mesh;
    }
    box(1.8, .18, .78, 0, .09, 0, black);
    box(1.64, .06, .63, 0, .21, 0, black);
    function shape(points) {
      const outline = new THREE.Shape();
      points.forEach(([x, y], i) => i ? outline.lineTo(x, y) : outline.moveTo(x, y));
      outline.closePath(); return outline;
    }
    const backOutline = shape([[-.66, .24], [.66, .24], [.66, 3.88], [-.66, 3.5]]);
    const backGeometry = keep(new THREE.ExtrudeGeometry(backOutline, { depth: .08, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 2, steps: 1 }));
    const back = new THREE.Mesh(backGeometry, glass);
    back.position.z = -.06; body.add(back);
    const edges = new THREE.LineSegments(keep(new THREE.EdgesGeometry(backGeometry, 25)), keep(new THREE.LineBasicMaterial({ color: '#bad0c9', transparent: true, opacity: .28 })));
    edges.position.copy(back.position); body.add(edges);
    const faceOutline = shape([[-.66, .24], [.28, .24], [.28, 2.62], [-.66, 3.5]]);
    const face = new THREE.Mesh(keep(new THREE.ExtrudeGeometry(faceOutline, { depth: .105, bevelEnabled: true, bevelThickness: .004, bevelSize: .004, bevelSegments: 1, steps: 1 })), blue);
    face.position.z = .026; body.add(face);

    // Typeset on a single texture so the fine lettering stays flush and cannot flicker.
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 768; labelCanvas.height = 2048;
    const ctx = labelCanvas.getContext('2d');
    if (!ctx) throw new Error('Award lettering canvas is unavailable');
    const cy = y => (3.5 - y) / 3.26 * labelCanvas.height;
    const cx = x => (x + .66) / .94 * labelCanvas.width;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    function text(value, y, size, style = '', color = '#f1ead7') {
      ctx.fillStyle = color; ctx.font = `${style} ${size}px Georgia`.trim();
      ctx.fillText(value, cx(-.19), cy(y), 690);
    }
    text('★', 2.46, 65, '', '#d4c17f');
    text('CODE ARTISAN', 2.25, 61, 'bold');
    text('2026', 2.07, 63, 'bold');
    text('AWARDED TO', 1.88, 32, 'italic');
    text('Vince Cyriac', 1.67, 62, 'bold');
    ['For crafting clean, maintainable,', 'and elegant code that', 'strengthens our foundations and', 'supports long-term success.'].forEach((line, i) => text(line, 1.32 - i * .095, 32, 'italic'));
    text('David Claesson', .67, 34);
    text('Managing Director', .57, 31, 'italic');
    ctx.strokeStyle = '#cbbb7c'; ctx.lineWidth = 2;
    for (const [a, b, y] of [[-.59, -.3, 2.46], [-.08, .21, 2.46], [-.59, -.35, 2.07], [-.03, .21, 2.07], [-.4, .02, 1.49]]) {
      ctx.beginPath(); ctx.moveTo(cx(a), cy(y)); ctx.lineTo(cx(b), cy(y)); ctx.stroke();
    }
    const labelMap = keep(new THREE.CanvasTexture(labelCanvas));
    labelMap.colorSpace = THREE.SRGBColorSpace;
    labelMap.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const labelGeo = keep(new THREE.ShapeGeometry(faceOutline));
    const uv = labelGeo.attributes.uv, positions = labelGeo.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (positions.getX(i) + .66) / .94, (positions.getY(i) - .24) / 3.26);
    const label = new THREE.Mesh(labelGeo, keep(new THREE.MeshBasicMaterial({ map: labelMap, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 })));
    label.position.z = .138; body.add(label);
    const logoCanvas = document.createElement('canvas'); logoCanvas.width = 512; logoCanvas.height = 100;
    const logoCtx = logoCanvas.getContext('2d');
    if (!logoCtx) throw new Error('Award logo canvas is unavailable');
    logoCtx.fillStyle = '#d2dfda'; logoCtx.textAlign = 'center'; logoCtx.textBaseline = 'middle';
    logoCtx.font = 'italic bold 68px Georgia'; logoCtx.fillText('LiteBreeze', 256, 50);
    const logoMap = keep(new THREE.CanvasTexture(logoCanvas)); logoMap.colorSpace = THREE.SRGBColorSpace;
    const logo = new THREE.Mesh(keep(new THREE.PlaneGeometry(.98, .19)), keep(new THREE.MeshBasicMaterial({ map: logoMap, transparent: true, depthWrite: false })));
    logo.position.set(.04, 3.35, .031); body.add(logo);

    function resize() {
      if (disposed) return;
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = Math.max(8.3, 4 / camera.aspect);
      camera.updateProjectionMatrix();
    }
    function render(angle, rise) {
      if (disposed) return;
      trophy.rotation.y = angle;
      trophy.rotation.x = .045;
      trophy.position.y = -rise / 110;
      renderer.render(scene, camera);
    }
    return { render, resize, dispose };
  } catch (error) { dispose(); throw error; }
}
