import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * In-house AI, as an object: a glass room with a stack of model layers standing
 * on its floor and a signal climbing through them, held inside a dashed
 * measurement cage. The boundary is the thing you can see; the intelligence is
 * the thing inside it. One object for the whole site — each route reconfigures
 * it rather than replacing it.
 */

const STATES = {
  home: { cage: 1, scale: 0.72, spin: 0.1, tilt: 0.05, x: 1.62, y: 0, dist: 7.6, frame: 1, glow: 1 },
  "two-weeks": { cage: 0.97, scale: 0.67, spin: 0.07, tilt: 0.13, x: 1.58, y: -0.04, dist: 7.8, frame: 0.55, glow: 0.75 },
  kit: { cage: 0.88, scale: 0.74, spin: 0.05, tilt: -0.09, x: 1.56, y: 0.04, dist: 7.4, frame: 0.85, glow: 1 },
  law: { cage: 0.83, scale: 0.62, spin: 0.035, tilt: 0.14, x: 1.6, y: 0, dist: 7.6, frame: 0.3, glow: 0.5 },
  institutions: { cage: 1.1, scale: 0.68, spin: 0.12, tilt: -0.11, x: 1.5, y: 0.1, dist: 8.2, frame: 1, glow: 0.85 },
  "how-we-work": { cage: 0.95, scale: 0.58, spin: 0.03, tilt: 0.03, x: 1.6, y: 0, dist: 7.7, frame: 0.28, glow: 0.4 },
  about: { cage: 1.05, scale: 0.7, spin: 0.09, tilt: -0.06, x: 1.55, y: 0.02, dist: 7.9, frame: 0.9, glow: 0.9 },
  contact: { cage: 0.9, scale: 0.66, spin: 0.06, tilt: 0.08, x: 1.58, y: 0, dist: 7.6, frame: 0.6, glow: 1 },
  /*
   * The three document pages are read, not looked at. Nearly still, dim, and
   * small — the object is there for continuity across the route change and
   * should not compete with a page of legal text.
   */
  privacy: { cage: 0.8, scale: 0.5, spin: 0.02, tilt: 0.02, x: 1.64, y: 0, dist: 8, frame: 0.2, glow: 0.3 },
  legal: { cage: 0.78, scale: 0.48, spin: 0.015, tilt: 0.01, x: 1.66, y: 0, dist: 8.1, frame: 0.16, glow: 0.25 },
  accessibility: { cage: 0.82, scale: 0.5, spin: 0.02, tilt: 0.03, x: 1.64, y: 0, dist: 8, frame: 0.2, glow: 0.3 },
};

const LERPED = ["cage", "scale", "spin", "tilt", "x", "y", "dist", "frame", "glow"];
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const BLUE = 0x2f6bff;

/**
 * A dark room with a few bright softboxes. Chrome needs high contrast between
 * what it reflects — an evenly lit room just makes it look like grey plastic.
 */
function studio() {
  const s = new THREE.Scene();

  // A graded surround rather than a flat colour: the horizon it puts across
  // each face is what makes the material read as polished metal.
  s.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(40, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: {
          uTop: { value: new THREE.Color(0xeef3fa) },
          uBottom: { value: new THREE.Color(0x3b4552) },
        },
        vertexShader: /* glsl */ `
          varying float vH;
          void main() {
            vH = normalize(position).y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying float vH;
          uniform vec3 uTop;
          uniform vec3 uBottom;
          void main() {
            gl_FragColor = vec4(mix(uBottom, uTop, smoothstep(-0.55, 0.35, vH)), 1.0);
          }
        `,
      }),
    ),
  );

  const panel = (w, h, color, gain, pos) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(gain),
        side: THREE.DoubleSide,
      }),
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    s.add(m);
  };

  panel(13, 8, 0xffffff, 5.5, [0, 9, 1]);
  panel(6, 11, 0xffffff, 3.8, [-8, 1.5, 5]);
  panel(4, 10, 0xdce8ff, 2.6, [8, 0.5, -4]);
  panel(10, 7, 0xf2f6ff, 2.2, [1.5, 1, 11]);
  panel(9, 5, 0x3f78ff, 1.6, [2, -3, 9]);
  panel(3, 3, 0xffffff, 6, [-4, 5, -6]);
  panel(2.5, 6, 0xffffff, 4, [5, 3.5, 3]);

  return s;
}

function dashedBox(half, color, opacity) {
  const [hx, hy, hz] = half;
  const c = [];
  const corners = [
    [-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz],
    [-hx, hy, -hz], [hx, hy, -hz], [hx, hy, hz], [-hx, hy, hz],
  ];
  const pairs = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  for (const [a, b] of pairs) c.push(...corners[a], ...corners[b]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(c, 3));
  const line = new THREE.LineSegments(
    geo,
    new THREE.LineDashedMaterial({
      color,
      transparent: true,
      opacity,
      dashSize: 0.07,
      gapSize: 0.05,
    }),
  );
  line.computeLineDistances();
  return line;
}

export function mountField(canvas) {
  const noop = { setPage() {}, dispose() {} };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return noop;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    return noop;
  }

  const mobile = window.innerWidth < 820;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
  renderer.setClearAlpha(0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(studio(), 0.02);
  scene.environment = envRT.texture;
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 4);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x9ec2ff, 1.1);
  rim.position.set(-4, -1, -3);
  scene.add(rim);

  const rig = new THREE.Group();
  scene.add(rig);

  const room = new THREE.Group();
  rig.add(room);

  const steel = new THREE.MeshPhysicalMaterial({
    color: 0xd2d8e0,
    metalness: 1,
    roughness: 0.09,
    envMapIntensity: 1.7,
  });

  const H = 0.82;

  /*
   * The room. Glass, because the whole argument is that you can see where the
   * intelligence sits. An opaque box was tried first and read as an appliance:
   * a flat metal face reflects one nearly uniform patch of the studio and comes
   * out dead grey. Glass has the opposite problem — no tonal range of its own —
   * and the interior is what supplies it.
   */
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xe8f0ff,
    metalness: 0,
    roughness: 0.03,
    transmission: 1,
    thickness: 0.14,
    ior: 1.18,
    transparent: true,
    // Kept low on purpose: at full strength the panes reflect so much of the
    // studio that the room turns milky and the network inside disappears. The
    // beading, not the panes, is what draws the box.
    envMapIntensity: 0.2,
    clearcoat: 0.35,
    clearcoatRoughness: 0.04,
  });

  const shell = new THREE.Mesh(new RoundedBoxGeometry(H * 2, H * 2, H * 2, 3, 0.05), glass);
  room.add(shell);

  /*
   * Chrome beading along the twelve arrises and a cap at each corner. Glass
   * alone loses its silhouette against a light band; the bevels carry a
   * specular highlight from any angle, so the edges of the room stay drawn.
   */
  const bead = new THREE.CylinderGeometry(0.016, 0.016, 1, 8);
  const cap = new THREE.SphereGeometry(0.019, 12, 8);
  const up = new THREE.Vector3(0, 1, 0);
  const dir = new THREE.Vector3();

  const corners = [];
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) corners.push(new THREE.Vector3(sx * H, sy * H, sz * H));
    }
  }

  for (const c of corners) {
    const knuckle = new THREE.Mesh(cap, steel);
    knuckle.position.copy(c);
    room.add(knuckle);
  }

  for (let i = 0; i < corners.length; i++) {
    for (let j = i + 1; j < corners.length; j++) {
      const a = corners[i];
      const b = corners[j];
      // Two shared coordinates means the pair is an edge, not a diagonal.
      let shared = 0;
      if (a.x === b.x) shared++;
      if (a.y === b.y) shared++;
      if (a.z === b.z) shared++;
      if (shared !== 2) continue;

      dir.subVectors(b, a);
      const arris = new THREE.Mesh(bead, steel);
      arris.position.addVectors(a, b).multiplyScalar(0.5);
      arris.scale.set(1, dir.length(), 1);
      arris.quaternion.setFromUnitVectors(up, dir.normalize());
      room.add(arris);
    }
  }

  const core = new THREE.Group();
  room.add(core);

  const graphite = new THREE.MeshStandardMaterial({
    color: 0x1b2432,
    metalness: 0.9,
    roughness: 0.34,
  });

  /*
   * A floor rather than a plinth. Square, so it belongs to the room, and dark,
   * because in chrome it blazed white and became the subject of the picture.
   */
  const floor = new THREE.Mesh(new RoundedBoxGeometry(1.32, 0.05, 1.32, 2, 0.016), graphite);
  floor.position.y = -H + 0.1;
  core.add(floor);

  /*
   * The machine it runs on, standing on the floor of the room. The model above
   * is wired down to this and to nothing else, which is the whole claim.
   */
  const machine = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.17, 0.36, 2, 0.02), steel);
  machine.position.y = -H + 0.21;
  core.add(machine);

  const port = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.012, 0.012),
    new THREE.MeshBasicMaterial({ color: 0x86b0ff }),
  );
  port.position.set(0, -H + 0.21, 0.181);
  core.add(port);

  /*
   * The intelligence: rings of nodes, narrowing towards the top, wired to the
   * ring above. Flat shelves were tried first and read as a display cabinet —
   * a stack of layers only says "model" once the connections between them are
   * drawn.
   */
  const RINGS = [
    { y: -0.32, r: 0.42, n: 5 },
    { y: -0.02, r: 0.52, n: 7 },
    { y: 0.28, r: 0.5, n: 7 },
    { y: 0.56, r: 0.32, n: 4 },
  ];

  const nodeGeo = new THREE.SphereGeometry(0.052, 16, 12);
  const rings = RINGS.map(({ y, r, n }, i) => {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0c1220,
      metalness: 0.7,
      roughness: 0.28,
      emissive: new THREE.Color(BLUE),
      emissiveIntensity: 0.8,
    });
    const points = [];
    for (let j = 0; j < n; j++) {
      // Offset each ring so the nodes do not stack into vertical columns.
      const angle = (j / n) * Math.PI * 2 + i * 0.42;
      const p = new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);
      const node = new THREE.Mesh(nodeGeo, mat);
      node.position.copy(p);
      core.add(node);
      points.push(p);
    }
    return { mat, points, k: i / (RINGS.length - 1) };
  });

  /*
   * The wires are opaque so they sit in the same pass as the nodes. As
   * transparent lines they were sorted behind the glass shell and blended away
   * to nothing; brightness is animated through the colour instead of opacity.
   */
  const WIRE_DIM = new THREE.Color(0x27406f);
  const WIRE_LIT = new THREE.Color(0xa7c6ff);

  const gaps = [];

  // The feed out of the machine into the first layer. Negative k so the signal
  // leaves the hardware before it reaches anything else.
  const feedFrom = new THREE.Vector3(0, -H + 0.3, 0);
  const feed = [];
  for (const p of rings[0].points) feed.push(feedFrom.x, feedFrom.y, feedFrom.z, p.x, p.y, p.z);
  const feedGeo = new THREE.BufferGeometry();
  feedGeo.setAttribute("position", new THREE.Float32BufferAttribute(feed, 3));
  const feedWires = new THREE.LineSegments(feedGeo, new THREE.LineBasicMaterial({ color: 0x27406f }));
  core.add(feedWires);
  gaps.push({ wires: feedWires, k: -0.16 });

  for (let i = 0; i < rings.length - 1; i++) {
    const next = rings[i + 1].points;
    const segments = [];
    for (const p of rings[i].points) {
      const nearest = [...next].sort((m, n) => p.distanceTo(m) - p.distanceTo(n)).slice(0, 2);
      for (const q of nearest) segments.push(p.x, p.y, p.z, q.x, q.y, q.z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(segments, 3));
    const wires = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x27406f }));
    core.add(wires);
    gaps.push({ wires, k: (i + 0.5) / (rings.length - 1) });
  }

  const signal = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.012, 6, 48),
    new THREE.MeshBasicMaterial({ color: 0xd4e2ff, transparent: true, opacity: 0 }),
  );
  signal.rotation.x = Math.PI / 2;
  core.add(signal);

  const CAGE = [0.75, 0.8, 0.75];
  const cage = dashedBox(CAGE, 0x77a2ff, 0.55);
  rig.add(cage);

  // Solid corner brackets read as measurement marks against the dashed cage.
  const bracket = [];
  const T = 0.24;
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const [x, y, z] = [sx * CAGE[0], sy * CAGE[1], sz * CAGE[2]];
        bracket.push(x, y, z, x - x * T, y, z);
        bracket.push(x, y, z, x, y - y * T, z);
        bracket.push(x, y, z, x, y, z - z * T);
      }
    }
  }
  const bracketGeo = new THREE.BufferGeometry();
  bracketGeo.setAttribute("position", new THREE.Float32BufferAttribute(bracket, 3));
  const brackets = new THREE.LineSegments(
    bracketGeo,
    new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: 0.95 }),
  );
  rig.add(brackets);

  const state = { ...STATES.home };
  const from = { ...STATES.home };
  const to = { ...STATES.home };
  let tweenStart = 0;
  let tweening = false;
  const TWEEN_MS = 1150;

  const pointer = new THREE.Vector2();
  const pointerTarget = new THREE.Vector2();
  const onMove = (e) => {
    pointerTarget.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      (e.clientY / window.innerHeight) * 2 - 1,
    );
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  let scrollSpin = 0;
  const onScroll = () => {
    scrollSpin = window.scrollY * 0.0006;
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  let raf = 0;
  let dead = false;
  let intro = 0;
  const origin = new THREE.Vector3();

  const tick = (ms) => {
    if (dead) return;
    raf = requestAnimationFrame(tick);
    const t = ms * 0.001;

    if (tweening) {
      const k = Math.min(1, (ms - tweenStart) / TWEEN_MS);
      const e = easeOut(k);
      for (const p of LERPED) state[p] = from[p] + (to[p] - from[p]) * e;
      if (k >= 1) tweening = false;
    }

    intro = Math.min(1, intro + 0.014);
    const fade = easeOut(intro);
    pointer.lerp(pointerTarget, 0.05);

    // On a phone there is no right-hand column to give it, so it drops below
    // the copy and becomes background rather than subject.
    rig.position.set(mobile ? 0.15 : state.x, state.y + (mobile ? -0.55 : 0), 0);
    rig.rotation.y = t * state.spin + scrollSpin + pointer.x * 0.24;
    rig.rotation.x = state.tilt + pointer.y * 0.1;

    room.scale.setScalar(state.scale * (mobile ? 0.72 : 1) * (0.9 + 0.1 * fade));
    room.position.y = Math.sin(t * 0.5) * 0.035;

    const cageScale = state.cage * (mobile ? 0.8 : 1);
    cage.scale.setScalar(cageScale);
    brackets.scale.setScalar(cageScale);

    cage.material.opacity = fade * 0.28 * state.frame;
    brackets.material.opacity = fade * 0.5;

    /*
     * One pass up the stack, then a rest before the next. Each layer brightens
     * as the signal reaches it, which is what makes the object read as running
     * rather than sitting there.
     */
    const cycle = (t * 0.3) % 1.55;
    const height = Math.min(1, cycle);
    const tail = cycle > 1 ? Math.max(0, 1 - (cycle - 1) * 3) : 1;

    for (const { mat, k } of rings) {
      const d = k - height;
      mat.emissiveIntensity = (0.65 + Math.exp(-d * d * 26) * tail * 3.6) * state.glow;
    }

    for (const { wires, k } of gaps) {
      const d = k - height;
      wires.material.color.lerpColors(WIRE_DIM, WIRE_LIT, Math.exp(-d * d * 30) * tail);
    }

    signal.position.y = -0.32 + height * 0.88;
    signal.scale.setScalar(0.6 - 0.16 * height);
    signal.material.opacity = fade * 0.45 * tail * state.glow;

    camera.position.set(0, 0.1, state.dist * (mobile ? 1.15 : 1));
    camera.lookAt(origin);
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(tick);

  return {
    setPage(name) {
      Object.assign(from, state);
      Object.assign(to, STATES[name] || STATES.home);
      tweenStart = performance.now();
      tweening = true;
    },
    dispose() {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      envRT.dispose();
      renderer.dispose();
    },
  };
}
