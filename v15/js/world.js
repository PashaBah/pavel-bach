// 3D-превиз: стоит на месте будущего фильма из Higgsfield.
// Один зал, время остановлено, камера летит по маршруту сцен. Людей здесь нет — они появятся в видео.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Два ключа камеры на сцену (начало, середина) + конец финала. [позиция], [куда смотрит]
const CAM = [
  [[0, 1.5, 4.6], [0, 1.1, 0]],          [[3.6, 1.35, 2.4], [0, 1.1, 0]],        // moment
  [[3.0, 1.25, -1.6], [0, 1.08, 0]],     [[0.95, 1.2, -1.3], [0, 1.06, 0]],      // closeup
  [[-1.4, 1.4, -1.6], [0, 1.1, 0]],      [[0, 4.6, -13], [0, 1.8, -32]],         // stage
  [[1.2, 2.1, -30.6], [0, 1.0, -14]],    [[-5, 1.3, -19], [-9, 1.0, -11]],       // incognito
  [[-8, 1.4, -12.5], [-13, 1.4, -14]],   [[-10.5, 1.6, -12.6], [-17, 2.3, -15]], // bespoke
  [[-12.4, 1.8, -11.2], [-17, 2.4, -13.5]], [[-12.4, 1.9, -17.6], [-17, 2.5, -18.6]], // brands
  [[-4, 2.6, -18], [15, 1.2, -14]],      [[8.6, 1.7, -10.6], [15, 1.3, -14]],    // tv
  [[12.4, 1.45, -10], [14, 1.3, -12.5]], [[9.7, 1.45, -1.8], [9, 1.25, -3]],     // planners
  [[6, 1.6, 2.6], [0, 1.1, 0]],          [[2.3, 1.5, 4.2], [0, 1.1, 0]],         // finale
  [[0, 1.5, 4.6], [0, 1.1, 0]],
];
const SCENE_COUNT = (CAM.length - 1) / 2;

const rnd = (a, b) => a + Math.random() * (b - a);

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.22, 'rgba(255,255,255,.55)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function trailTexture() {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 256;
  const g = c.getContext('2d');
  const v = g.createLinearGradient(0, 0, 0, 256);
  v.addColorStop(0, 'rgba(255,255,255,.9)');
  v.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = v;
  g.fillRect(0, 0, 32, 256);
  const h = g.createLinearGradient(0, 0, 32, 0);
  h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.5, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = h;
  g.fillRect(0, 0, 32, 256);
  return new THREE.CanvasTexture(c);
}

export function createWorld(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x040507);
  scene.fog = new THREE.FogExp2(0x040507, 0.03);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 160);
  const posCurve = new THREE.CatmullRomCurve3(CAM.map(k => new THREE.Vector3(...k[0])), false, 'centripetal');
  const lookCurve = new THREE.CatmullRomCurve3(CAM.map(k => new THREE.Vector3(...k[1])), false, 'centripetal');

  const glow = glowTexture();
  const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
  const dummy = new THREE.Object3D();

  // ── свет и пол ──────────────────────────────────
  scene.add(new THREE.HemisphereLight(0x90a4bb, 0x0b0806, 0.35));
  const key = new THREE.PointLight(0xffc58a, 34, 18); key.position.set(2, 3.2, 2); scene.add(key);
  const rim = new THREE.PointLight(0x6fb6ff, 24, 15); rim.position.set(-2.4, 2.4, -2.2); scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(140, 140),
    new THREE.MeshStandardMaterial({ color: 0x07080a, roughness: 0.28, metalness: 0.7 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // ── пыль в воздухе ──────────────────────────────
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(3200 * 3);
  for (let i = 0; i < 3200; i++) dustPos.set([rnd(-18, 18), rnd(0.1, 6.5), rnd(-38, 7)], i * 3);
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ map: glow, size: 0.035, color: 0xffdcae, opacity: 0.55, ...additive }));
  scene.add(dust);

  // ── МОМЕНТ: телефон, застывший между полом и ладонью ──
  const phone = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.115, 0.235, 0.012),
    new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.16, metalness: 0.9 })
  );
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.104, 0.222), new THREE.MeshBasicMaterial({ color: 0xcfe4ff }));
  screen.position.z = 0.0065;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0x9fd0ff, opacity: 0.5, ...additive }));
  halo.scale.setScalar(0.85);
  phone.add(body, screen, halo);
  const PHONE_REST = new THREE.Vector3(0, 1.05, 0);
  const PHONE_HAND = new THREE.Vector3(0.2, 1.34, 0.1);
  phone.position.copy(PHONE_REST);
  phone.rotation.set(0.5, 0.45, -0.35);
  scene.add(phone);

  const trailMat = new THREE.MeshBasicMaterial({ map: trailTexture(), color: 0xa9d6ff, opacity: 0.5, side: THREE.DoubleSide, ...additive });
  const trail = new THREE.Group();
  for (const ry of [0, Math.PI / 2]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 1.0), trailMat);
    p.rotation.y = ry;
    trail.add(p);
  }
  trail.position.set(0, 0.5, 0);
  scene.add(trail);

  // шампанское, застывшее дугой из выроненного бокала
  const GLASS = new THREE.Vector3(0.95, 1.42, 0.25);
  const DROPS = 460;
  const drops = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xffe0a8, emissive: 0x6b4a18, emissiveIntensity: 0.7, roughness: 0.08, metalness: 0.3 }),
    DROPS
  );
  const dropBase = [], dropVel = [], dropSize = [];
  for (let i = 0; i < DROPS; i++) {
    const s = Math.pow(Math.random(), 0.7);
    const p = new THREE.Vector3(
      GLASS.x - 0.5 * s + rnd(-0.07, 0.07) * s,
      GLASS.y + 0.34 * s - 0.95 * s * s + rnd(-0.06, 0.06) * s,
      GLASS.z + 0.46 * s + rnd(-0.07, 0.07) * s
    );
    dropBase.push(p);
    dropVel.push(new THREE.Vector3(-1.1 + rnd(-0.3, 0.3), 0.7 - 1.9 * s, 1.0 + rnd(-0.3, 0.3)));
    dropSize.push(rnd(0.004, 0.017) * (1 - 0.4 * s));
  }
  const placeDrops = (t) => {
    for (let i = 0; i < DROPS; i++) {
      const b = dropBase[i], v = dropVel[i];
      dummy.position.set(b.x + v.x * t, Math.max(0.006, b.y + v.y * t - 4.9 * t * t), b.z + v.z * t);
      dummy.scale.setScalar(dropSize[i]);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      drops.setMatrixAt(i, dummy.matrix);
    }
    drops.instanceMatrix.needsUpdate = true;
  };
  placeDrops(0);
  scene.add(drops);

  const flute = new THREE.Mesh(
    new THREE.LatheGeometry([[0, 0], [0.036, 0], [0.004, 0.012], [0.004, 0.1], [0.03, 0.14], [0.037, 0.24]].map(p => new THREE.Vector2(...p)), 28),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.05, transparent: true, opacity: 0.38, side: THREE.DoubleSide })
  );
  flute.position.set(GLASS.x + 0.12, GLASS.y - 0.16, GLASS.z - 0.1);
  flute.rotation.set(0.5, 0, 1.25);
  scene.add(flute);

  // карты, застывшие в воздухе
  const cards = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.095, 0.132),
    new THREE.MeshStandardMaterial({ color: 0xf3ede2, roughness: 0.55, side: THREE.DoubleSide }),
    18
  );
  for (let i = 0; i < 18; i++) {
    const u = i / 17;
    dummy.position.set(-1.05 + 0.5 * u, 1.3 - 0.36 * u + Math.sin(Math.PI * u) * 0.2, 0.1 + 0.3 * u);
    dummy.rotation.set(u * 2.6, 0.4 + u, 0.3);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    cards.setMatrixAt(i, dummy.matrix);
  }
  scene.add(cards);

  // ── ЗАЛ: столы со свечами, люстры ───────────────
  const tables = [];
  for (let x = -12; x <= 12; x += 3) for (let z = -8; z >= -27; z -= 3.2) tables.push([x + rnd(-0.3, 0.3), z + rnd(-0.3, 0.3)]);
  const tops = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.95, 0.95, 0.05, 28),
    new THREE.MeshStandardMaterial({ color: 0x1b1712, roughness: 0.35, metalness: 0.4 }),
    tables.length
  );
  const candlePos = [];
  tables.forEach(([x, z], i) => {
    dummy.position.set(x, 0.76, z); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1); dummy.updateMatrix();
    tops.setMatrixAt(i, dummy.matrix);
    for (let k = 0; k < 6; k++) {
      const a = rnd(0, Math.PI * 2), r = rnd(0.1, 0.6);
      candlePos.push(x + Math.cos(a) * r, rnd(0.88, 1.12), z + Math.sin(a) * r);
    }
  });
  scene.add(tops);
  const candleGeo = new THREE.BufferGeometry();
  candleGeo.setAttribute('position', new THREE.Float32BufferAttribute(candlePos, 3));
  scene.add(new THREE.Points(candleGeo, new THREE.PointsMaterial({ map: glow, size: 0.26, color: 0xffc27a, opacity: 0.95, ...additive })));

  const chandPos = [];
  for (const [cx, cz] of [[0, -6], [-7, -15], [7, -15], [0, -23], [0, 2]]) {
    for (let k = 0; k < 90; k++) {
      const a = rnd(0, Math.PI * 2), r = Math.sqrt(Math.random()) * 1.5;
      chandPos.push(cx + Math.cos(a) * r, 6.2 + rnd(0, 1.1) - r * 0.35, cz + Math.sin(a) * r);
    }
  }
  const chandGeo = new THREE.BufferGeometry();
  chandGeo.setAttribute('position', new THREE.Float32BufferAttribute(chandPos, 3));
  scene.add(new THREE.Points(chandGeo, new THREE.PointsMaterial({ map: glow, size: 0.15, color: 0xfff1d6, opacity: 0.9, ...additive })));

  // ── СЦЕНА ───────────────────────────────────────
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(11, 0.6, 4.5),
    new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: 0.22, metalness: 0.75 })
  );
  platform.position.set(0, 0.3, -33.5);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(11, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: 0xffd999 }));
  edge.position.set(0, 0.61, -31.26);
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), new THREE.MeshStandardMaterial({ color: 0x1c0d0b, roughness: 0.9 }));
  curtain.position.set(0, 4.5, -36);
  scene.add(platform, edge, curtain);

  const spot = new THREE.SpotLight(0xfff0d8, 520, 34, 0.24, 0.55);
  spot.position.set(0, 10.5, -29);
  spot.target.position.set(0, 0.6, -33.2);
  scene.add(spot, spot.target);
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(2.3, 10, 40, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff0d8, opacity: 0.055, side: THREE.DoubleSide, ...additive })
  );
  cone.position.set(0, 5.6, -32.4);
  cone.rotation.x = -0.2;
  scene.add(cone);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), new THREE.MeshBasicMaterial({ map: glow, color: 0xffe6bf, opacity: 0.55, ...additive }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 0.615, -33.2);
  scene.add(pool);

  const CONF = 1500;
  const confetti = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.04, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xf2cf8a, emissive: 0x4a3410, metalness: 0.9, roughness: 0.25, side: THREE.DoubleSide }),
    CONF
  );
  for (let i = 0; i < CONF; i++) {
    dummy.position.set(rnd(-8, 8), rnd(0.8, 8), rnd(-35, -21));
    dummy.rotation.set(rnd(0, 6.3), rnd(0, 6.3), rnd(0, 6.3));
    dummy.scale.setScalar(rnd(0.7, 1.6));
    dummy.updateMatrix();
    confetti.setMatrixAt(i, dummy.matrix);
  }
  scene.add(confetti);

  // ── СТЕНА БРЕНДОВ: световые пятна проекторов ────
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(20, 7.5), new THREE.MeshStandardMaterial({ color: 0x0d0e11, roughness: 0.9 }));
  wall.position.set(-17.2, 3.75, -15);
  wall.rotation.y = Math.PI / 2;
  scene.add(wall);
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ map: glow, color: 0xffcf96, opacity: 0.2, ...additive }));
    s.position.set(-17.1, rnd(2, 3.4), -9.5 - i * 2.1);
    s.rotation.y = Math.PI / 2;
    scene.add(s);
  }
  const wallLight = new THREE.PointLight(0xffc98a, 26, 13); wallLight.position.set(-14, 3, -15); scene.add(wallLight);

  // ── ТЕЛЕВИЗОРЫ ──────────────────────────────────
  const noise = document.createElement('canvas');
  noise.width = 64; noise.height = 48;
  const nctx = noise.getContext('2d');
  const noiseTex = new THREE.CanvasTexture(noise);
  const drawNoise = () => {
    const img = nctx.createImageData(64, 48);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 40 + Math.random() * 190;
      img.data[i] = v * 0.8; img.data[i + 1] = v * 0.92; img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    nctx.putImageData(img, 0, 0);
    noiseTex.needsUpdate = true;
  };
  drawNoise();
  const tvs = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color: 0x15120e, roughness: 0.5 });
  const tube = new THREE.MeshBasicMaterial({ map: noiseTex, color: 0xa6c6ea });
  for (const [x, y, w, h, ry] of [
    [-1.0, 0.4, 0.95, 0.8, 0.06], [0, 0.4, 0.95, 0.8, -0.04], [1.0, 0.4, 0.95, 0.8, 0.05],
    [-0.5, 1.2, 0.92, 0.78, -0.07], [0.5, 1.19, 0.9, 0.76, 0.08],
    [-0.35, 1.94, 0.8, 0.68, 0.1], [0.5, 1.9, 0.7, 0.6, -0.12],
  ]) {
    const tv = new THREE.Group();
    tv.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.8), shell));
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.78, h * 0.72), tube);
    scr.position.z = 0.401;
    tv.add(scr);
    tv.position.set(x, y, 0);
    tv.rotation.y = ry;
    tvs.add(tv);
  }
  tvs.position.set(15, 0, -14);
  tvs.rotation.y = Math.atan2(-4, 2);
  scene.add(tvs);
  const tvLight = new THREE.PointLight(0x9fc4ff, 16, 10); tvLight.position.set(13.4, 1.4, -13.2); scene.add(tvLight);

  // ── ПЛАНШЕТ ОРГАНИЗАТОРА ────────────────────────
  const tablet = new THREE.Group();
  tablet.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.21, 0.01), new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.2, metalness: 0.9 })));
  const tscr = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.19), new THREE.MeshBasicMaterial({ color: 0xf2f5ff }));
  tscr.position.z = 0.006;
  const thalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xdfe9ff, opacity: 0.4, ...additive }));
  thalo.scale.setScalar(1.1);
  tablet.add(tscr, thalo);
  tablet.position.set(9, 1.25, -3);
  tablet.rotation.set(-0.2, Math.atan2(0.7, 1.2), 0);
  scene.add(tablet);
  const tabLight = new THREE.PointLight(0xdfe9ff, 5, 4); tabLight.position.set(9.3, 1.4, -2.6); scene.add(tabLight);

  // ── кадр ────────────────────────────────────────
  let releasedAt = -1, frame = 0;
  const pos = new THREE.Vector3(), look = new THREE.Vector3();
  const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 56 : w / h < 1.3 ? 46 : 38;
    camera.updateProjectionMatrix();
  }

  // f — номер сцены с дробной частью (0…SCENE_COUNT), time — секунды, px/py — указатель (−1…1)
  function update(f, time, px, py) {
    const t = Math.min(1, Math.max(0, f / SCENE_COUNT));
    posCurve.getPoint(t, pos);
    lookCurve.getPoint(t, look);
    camera.position.copy(pos);
    camera.lookAt(look);
    camera.translateX(px * 0.12);
    camera.translateY(py * 0.07);
    camera.lookAt(look);

    // время «почти стоит»: едва заметный дрейф
    dust.rotation.y = time * 0.004;
    halo.material.opacity = 0.45 + Math.sin(time * 1.7) * 0.06;

    if (releasedAt < 0) {
      phone.position.y = PHONE_REST.y + Math.sin(time * 0.6) * 0.004;
    } else {
      const rt = time - releasedAt;
      if (rt < 3) placeDrops(rt);
      const k = ease(rt / 0.45);
      phone.position.lerpVectors(PHONE_REST, PHONE_HAND, k);
      phone.rotation.set(0.5 - 0.42 * k, 0.45 - 0.2 * k, -0.35 + 0.3 * k);
      trailMat.opacity = 0.5 * (1 - k);
      key.intensity = 34 + 90 * Math.max(0, 1 - rt / 0.6);
    }

    if (++frame % 3 === 0) {
      drawNoise();
      tvLight.intensity = 13 + Math.random() * 6;
    }
    renderer.render(scene, camera);
  }

  function release(time) { if (releasedAt < 0) releasedAt = time; }

  resize();
  return { update, resize, release, sceneCount: SCENE_COUNT };
}
