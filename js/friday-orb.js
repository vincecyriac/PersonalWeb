/**
 * Project FRIDAY — Interactive Holographic Orb Simulator
 * Ambient presence powered by custom GLSL Simplex Noise and Additive Fresnel Shaders.
 */

import * as THREE from "../vendor/three.module.min.js";

const STATE_COLORS = {
  idle:      "#00F2FE", // calm cyan
  listening: "#0077FF", // pulsing blue
  thinking:  "#FFB800", // glowing amber
  speaking:  "#00FF88", // neon emerald
  offline:   "#E5726F", // dim ember
};

const STATE_ENERGY = {
  idle: 0.10,
  listening: 0.36,
  thinking: 0.48,
  speaking: 0.42,
  offline: 0.03,
};

const ACCENT_VIOLET = new THREE.Color("#A18CD1");
const ACCENT_BLUSH  = new THREE.Color("#FBC2EB");

// ---------- GLSL Shaders ----------

const SIMPLEX_3D = /* glsl */ `
vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

const CORE_VERT = /* glsl */ `
uniform float uTime;
uniform float uLevel;
varying vec3 vNormal;
varying vec3 vView;
varying float vNoise;

${SIMPLEX_3D}

void main() {
  vec3 n = normalize(normal);
  float t = uTime * 0.32;

  float n1 = snoise(n * 1.5 + vec3(0.0, t, 0.0));
  float n2 = snoise(n * 3.2 - vec3(t * 1.4, 0.0, t * 0.8));
  float n3 = snoise(n * 6.1 + vec3(t * 0.6, t * 0.4, 0.0));
  float disp = n1 * 0.55 + n2 * 0.32 + n3 * 0.13;
  vNoise = disp;

  float amp = 0.045 + uLevel * 0.26;
  vec3 p = position + n * disp * amp;

  vNormal = normalize(normalMatrix * n);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const CORE_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uAccent;
uniform vec3 uAccent2;
uniform float uLevel;
uniform float uTime;
varying vec3 vNormal;
varying vec3 vView;
varying float vNoise;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  float facing = clamp(dot(N, V), 0.0, 1.0);

  float rim   = pow(1.0 - facing, 2.1);
  float body  = pow(facing, 1.5) * 0.30;
  float veins = smoothstep(0.20, 0.92, abs(vNoise)) * (0.22 + uLevel * 0.5);
  float pulse = 0.06 * sin(uTime * 1.7);

  float e = body + rim * 0.92 + veins + uLevel * 0.22 + pulse;

  vec3 rimTint = mix(uAccent, uAccent2, pow(rim, 1.6));
  vec3 col = uColor * e + rimTint * pow(rim, 2.4) * 0.16;
  float peak = max(col.r, max(col.g, col.b));
  if (peak > 1.0) col /= peak;

  gl_FragColor = vec4(col, 1.0);
}
`;

const GLOW_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const GLOW_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uAccent;
uniform float uAccentMix;
uniform float uLevel;
uniform float uPower;
uniform float uStrength;
varying vec2 vUv;
void main() {
  float r = length(vUv - 0.5) * 2.0;
  float g = pow(max(0.0, 1.0 - r), uPower) * uStrength * (0.72 + uLevel * 0.22);
  gl_FragColor = vec4(mix(uColor, uAccent, uAccentMix) * g, g);
}
`;

const PARTICLE_VERT = /* glsl */ `
attribute float aPhase;
attribute float aSize;
uniform float uTime;
uniform float uLevel;
uniform float uPixelRatio;
varying float vAlpha;
void main() {
  float breathe = 1.0 + sin(uTime * 0.75 + aPhase * 6.2831) * 0.05 + uLevel * 0.20;
  vec4 mv = modelViewMatrix * vec4(position * breathe, 1.0);
  gl_Position = projectionMatrix * mv;

  float twinkle = 0.45 + 0.55 * sin(uTime * 2.1 + aPhase * 12.566);
  vAlpha = twinkle * (0.30 + uLevel * 0.75);
  gl_PointSize = aSize * uPixelRatio * (14.0 / max(0.001, -mv.z));
}
`;

const PARTICLE_FRAG = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
void main() {
  vec2 d = gl_PointCoord - vec2(0.5);
  float r = length(d);
  if (r > 0.5) discard;
  float falloff = pow(1.0 - r * 2.0, 2.0);
  gl_FragColor = vec4(uColor * falloff * vAlpha, falloff * vAlpha);
}
`;

// Each surface owns its state, WebGL context, audio level, and animation lifecycle.
export function createFridayOrb(container, { pauseButton = null, getLevel = null, onStateChange = null, active = true } = {}) {
  if (!container) throw new Error('An orb container is required.');
  const lifetime = new AbortController();
  const listen = (target, type, handler) => target.addEventListener(type, handler, { signal: lifetime.signal });
  let disposed = false, contextLost = false;
  let resizeObserver, intersectionObserver, motionObserver;
  let syncAnimation;
  let renderer = null;
  let scene = null;
  let camera = null;
  let coreMesh = null;
  let haloMesh = null;
  let aureoleMesh = null;
  let particles = null;
  let orbGroup = null;

  const clock = new THREE.Clock();

  const colorCurrent = new THREE.Color(STATE_COLORS.idle);
  const colorTarget = new THREE.Color(STATE_COLORS.idle);

  let rawLevel = 0;
  let smoothLevel = STATE_ENERGY.idle;
  let energyFloor = STATE_ENERGY.idle;

  // Pointer parallax
  let mouseX = 0;
  let mouseY = 0;
  let targetRotX = 0;
  let targetRotY = 0;

  function buildParticles() {
    const COUNT = 700;
    const pos = new Float32Array(COUNT * 3);
    const phase = new Float32Array(COUNT);
    const size = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const r = 1.15 + Math.pow(Math.random(), 1.7) * 0.60;

      pos[i * 3] = s * Math.cos(theta) * r;
      pos[i * 3 + 1] = u * r;
      pos[i * 3 + 2] = s * Math.sin(theta) * r;
      phase[i] = Math.random();
      size[i] = 1.1 + Math.random() * 2.2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uLevel: { value: 0 },
        uColor: { value: colorCurrent },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      },
      vertexShader: PARTICLE_VERT,
      fragmentShader: PARTICLE_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geo, mat);
  }

  function glowSprite(size, power, strength, order, accentMix) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: colorCurrent },
          uAccent: { value: ACCENT_VIOLET },
          uAccentMix: { value: accentMix },
          uLevel: { value: 0 },
          uPower: { value: power },
          uStrength: { value: strength },
        },
        vertexShader: GLOW_VERT,
        fragmentShader: GLOW_FRAG,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
    );
    mesh.renderOrder = order;
    return mesh;
  }

  function initialize() {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.pointerEvents = "none";
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 4.8);

    orbGroup = new THREE.Group();
    scene.add(orbGroup);

    coreMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 12),
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uLevel: { value: 0 },
          uColor: { value: colorCurrent },
          uAccent: { value: ACCENT_VIOLET },
          uAccent2: { value: ACCENT_BLUSH },
        },
        vertexShader: CORE_VERT,
        fragmentShader: CORE_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    coreMesh.renderOrder = 1;
    orbGroup.add(coreMesh);

    haloMesh = glowSprite(3.8, 2.2, 0.85, -1, 0.18);
    aureoleMesh = glowSprite(4.6, 3.2, 0.42, -2, 0.42);
    scene.add(haloMesh, aureoleMesh);

    particles = buildParticles();
    orbGroup.add(particles);

    let lastW = 0;
    let lastH = 0;
    const resize = () => {
      if (!renderer || !container) return;
      const w = Math.round(container.clientWidth);
      const h = Math.round(container.clientHeight);
      if (!w || !h) return;
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = 4.8 / Math.min(1, camera.aspect);
      camera.updateProjectionMatrix();
      if (particles) {
        particles.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2);
      }
      // Resizing clears the canvas; redraw even when reduced motion pauses the loop.
      renderer.render(scene, camera);
    };

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    listen(window, "resize", resize);
    resize();

    // Mouse interaction
    listen(container, "pointermove", (e) => {
      if (paused() || e.pointerType === "touch") return;
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = mouseX * 0.45;
      targetRotX = -mouseY * 0.35;
    });

    listen(container, "pointerleave", () => {
      targetRotX = 0;
      targetRotY = 0;
    });



    container.classList.add("orb-ready");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let manuallyPaused = false;
    const paused = () => manuallyPaused || reducedMotion.matches || document.documentElement.classList.contains("motion-paused");
    let inView = true;
    syncAnimation = () => {
      if (disposed) return;
      const playing = active && !document.hidden && inView && !paused() && !contextLost;
      clock.getDelta(); // Discard time spent closed, offscreen, or in a background tab.
      renderer.setAnimationLoop(playing ? () => tick(true) : null);
      if (active && inView && !document.hidden && !contextLost && !playing) tick(false);
      if (pauseButton) {
        pauseButton.textContent = paused() ? "Resume orb" : "Pause orb";
        pauseButton.setAttribute("aria-pressed", String(paused()));
        pauseButton.disabled = reducedMotion.matches || document.documentElement.classList.contains("motion-paused");
      }
      container.dataset.motion = playing ? "playing" : "paused";
    };
    intersectionObserver = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; syncAnimation(); });
    intersectionObserver.observe(container);
    listen(document, "visibilitychange", syncAnimation);
    listen(reducedMotion, "change", syncAnimation);
    if (pauseButton) listen(pauseButton, "click", () => { manuallyPaused = !manuallyPaused; syncAnimation(); });
    motionObserver = new MutationObserver(syncAnimation);
    motionObserver.observe(document.documentElement, {attributes:true, attributeFilter:["class"]});
    listen(renderer.domElement, "webglcontextlost", event => {
      event.preventDefault(); contextLost = true;
      container.classList.remove("orb-ready"); syncAnimation();
    });
    listen(renderer.domElement, "webglcontextrestored", () => {
      contextLost = false; container.classList.add("orb-ready"); syncAnimation();
    });
    syncAnimation();
  }

  let elapsed = 0;
  function tick(animate = true) {
    const dt = animate ? Math.min(clock.getDelta(), 0.1) : 0;
    elapsed += dt;
    const t = elapsed;
    if (getLevel && animate) rawLevel = Math.max(0, Math.min(1, getLevel() || 0));
    if (!animate) { colorCurrent.copy(colorTarget); smoothLevel = energyFloor; }

    colorCurrent.lerp(colorTarget, 1 - Math.pow(0.003, dt));

    const target = Math.min(1, energyFloor + rawLevel);
    const k = target > smoothLevel ? 1 - Math.pow(0.002, dt) : 1 - Math.pow(0.35, dt);
    smoothLevel += (target - smoothLevel) * k;
    const level = smoothLevel;

    coreMesh.material.uniforms.uTime.value = t;
    coreMesh.material.uniforms.uLevel.value = level;
    haloMesh.material.uniforms.uLevel.value = level;
    aureoleMesh.material.uniforms.uLevel.value = level;
    particles.material.uniforms.uTime.value = t;
    particles.material.uniforms.uLevel.value = level;

    const breath = 1 + Math.sin(t * 0.9) * 0.018 + level * 0.06;
    coreMesh.scale.setScalar(breath);
    haloMesh.scale.setScalar(1 + level * 0.14);
    aureoleMesh.scale.setScalar(1 + level * 0.08);

    if (animate) {
      orbGroup.rotation.y += (targetRotY - orbGroup.rotation.y) * 0.06 + dt * (0.08 + level * 0.2);
      orbGroup.rotation.x += (targetRotX - orbGroup.rotation.x) * 0.06;
    }
    particles.rotation.y -= dt * (0.12 + level * 0.28);
    particles.rotation.z += dt * 0.02;

    renderer.render(scene, camera);
  }

  const controller = {
    setState(name) {
      if (disposed || !STATE_COLORS[name]) return;
      colorTarget.set(STATE_COLORS[name]);
      energyFloor = STATE_ENERGY[name];
      rawLevel = 0;
      container.dataset.state = name;
      const fallback = container.querySelector(".friday-orb-fallback");
      if (fallback) fallback.style.background = `radial-gradient(circle at 40% 35%, ${STATE_COLORS[name]}99, #123d3f 55%, ${STATE_COLORS[name]}77 72%, transparent 74%)`;
      onStateChange?.(name, STATE_COLORS[name]);
      if (active && !document.hidden && !contextLost && container.dataset.motion !== "playing") tick(false);
    },
    setLevel(value) { rawLevel = Math.max(0, Math.min(1, value || 0)); },
    setActive(value) { active = Boolean(value); syncAnimation(); },
    dispose() {
      if (disposed) return;
      disposed = true;
      renderer?.setAnimationLoop(null);
      lifetime.abort();
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      motionObserver?.disconnect();
      scene?.traverse(object => {
        object.geometry?.dispose();
        object.material?.dispose();
      });
      renderer?.dispose();
      renderer?.domElement.remove();
      container.classList.remove("orb-ready");
      container.dataset.motion = "paused";
    },
  };
  try {
    initialize();
    controller.setState("idle");
  } catch (error) {
    controller.dispose();
    throw error;
  }
  return controller;
}

// Showcase controls stay separate from the live voice session.
let showcaseOrb;
export function initOrb() {
  const container = document.getElementById("friday-orb-stage");
  if (!container || showcaseOrb) return showcaseOrb;
  let state = "idle";
  showcaseOrb = createFridayOrb(container, {
    pauseButton: document.getElementById("friday-orb-pause"),
    onStateChange(name, color) {
      state = name;
      const label = document.getElementById("friday-orb-state");
      const dot = document.querySelector(".friday-state-dot");
      if (label) label.textContent = name.toUpperCase();
      if (dot) dot.style.background = color;
      document.querySelectorAll(".friday-state-btn").forEach(button => {
        button.classList.toggle("active", button.dataset.state === name);
        button.setAttribute("aria-pressed", String(button.dataset.state === name));
      });
    },
  });
  container.addEventListener("click", () => {
    const names = Object.keys(STATE_COLORS);
    showcaseOrb.setState(names[(names.indexOf(state) + 1) % names.length]);
  });
  document.querySelectorAll(".friday-state-btn").forEach(button => {
    button.addEventListener("click", () => showcaseOrb.setState(button.dataset.state));
  });
  return showcaseOrb;
}
