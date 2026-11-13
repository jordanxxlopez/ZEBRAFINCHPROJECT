// Specimen viewer: a real atlas surface shown like an anatomical plate.
// Image-based lighting, filmic tone mapping, a soft ground shadow, leader-line labels in two
// columns, and a scale bar computed from the camera (the meshes are in millimetres).
let THREEP = null;
export const loadThree = () => (THREEP ||= Promise.all([import('three'), import('../assets/OrbitControls.js')]));

// Procedural studio environment (no image files): a soft box with a large top light and two side strips.
function makeEnvironment(THREE, renderer) {
  const s = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshBasicMaterial({color: 0x8f8f8f, side: THREE.BackSide}));
  s.add(room);
  const panel = (w, h, x, y, z, rx, ry, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color: new THREE.Color(k, k, k), side: THREE.DoubleSide})); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); s.add(m); };
  panel(7, 7, 0, 4.9, 0, Math.PI / 2, 0, 9);        // top soft box
  panel(3, 6, -4.9, 1, 1, 0, Math.PI / 2, 5);       // left strip
  panel(2, 5, 4.9, 0.5, -1.5, 0, -Math.PI / 2, 2.5); // right fill
  panel(6, 2, 0, 0, -4.9, 0, 0, 1.6);               // back rim
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.035).texture; pm.dispose();
  s.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
  return tex;
}

export function dress(THREE, renderer, scene) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  scene.environment = makeEnvironment(THREE, renderer);
}
const isDark = () => { const c = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim(); const m = c.match(/^#(..)(..)(..)/); return m ? (parseInt(m[1], 16) + parseInt(m[2], 16) + parseInt(m[3], 16)) / 3 < 110 : false; };
const niceBar = mm => [0.1, 0.2, 0.5, 1, 2, 5, 10, 20].reduce((a, b) => Math.abs(b - mm) < Math.abs(a - mm) ? b : a);

/**
 * host: element (position: relative; sized by CSS)
 * opts: {meshes: [{id,name,vertices,faces}], up: '+z'|'-z', shell: name, parts: {name: {label, group, text}},
 *        groups: {key: {label, color}}, credit}
 */
export async function createSpecimen(host, opts) {
  const [THREE, {OrbitControls}] = await loadThree();
  const dark = isDark();
  host.classList.add('specimen');
  host.innerHTML = `<svg class="sp-lines" aria-hidden="true"></svg><div class="sp-labels"></div><div class="sp-scale" aria-hidden="true"><span></span><b></b></div><div class="sp-cap" aria-live="polite"></div>`;
  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.prepend(renderer.domElement); renderer.domElement.setAttribute('aria-label', opts.aria || 'Interactive 3D brain. Drag to rotate.'); renderer.domElement.tabIndex = 0;
  const scene = new THREE.Scene(); dress(THREE, renderer, scene);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 2000); scene.add(camera);
  const key = new THREE.DirectionalLight(0xfff4e6, 1.6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 9; key.shadow.bias = -0.0005; scene.add(key);

  const map = opts.up === '-z' ? (x, y, z) => [x, -z, y] : (x, y, z) => [x, z, -y];
  const group = new THREE.Group(); scene.add(group);
  const parts = {}; let shell = null;
  for (const m of opts.meshes) {
    const v = m.vertices, pos = new Float32Array(v.length);
    for (let i = 0; i < v.length; i += 3) { const p = map(v[i], v[i + 1], v[i + 2]); pos[i] = p[0]; pos[i + 1] = p[1]; pos[i + 2] = p[2]; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(m.faces); g.computeVertexNormals();
    if (m.name === opts.shell) {
      const front = new THREE.Mesh(g, new THREE.MeshStandardMaterial({color: dark ? 0xd9d0c2 : 0x9a8f80, roughness: .5, metalness: 0, transparent: true, opacity: dark ? .2 : .24, depthWrite: false}));
      const back = new THREE.Mesh(g, new THREE.MeshStandardMaterial({color: dark ? 0x8f887c : 0x6f665b, roughness: .9, transparent: true, opacity: .13, depthWrite: false, side: THREE.BackSide}));
      front.renderOrder = 3; back.renderOrder = 1; front.castShadow = true; group.add(back, front); shell = front; continue;
    }
    const info = opts.parts[m.name]; if (!info) continue;
    const col = opts.groups[info.group].color;
    const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({color: col, roughness: .42, metalness: 0}));
    mesh.renderOrder = 2; group.add(mesh);
    // label anchor: centroid of the half of the vertices with larger x (one hemisphere)
    let mx = 0; for (let i = 0; i < pos.length; i += 3) mx += pos[i]; mx /= pos.length / 3;
    let ax = 0, ay = 0, az = 0, n = 0; for (let i = 0; i < pos.length; i += 3) if (pos[i] >= mx) { ax += pos[i]; ay += pos[i + 1]; az += pos[i + 2]; n++; }
    parts[m.name] = {mesh, info, base: new THREE.Color(col), anchor: new THREE.Vector3(ax / n, ay / n, az / n)};
  }
  const box = new THREE.Box3().setFromObject(group), c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  group.position.sub(c);
  const R = size.length() / 2;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(R * 8, R * 8), new THREE.ShadowMaterial({opacity: dark ? .45 : .2}));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -size.y / 2 - R * .06; ground.receiveShadow = true; scene.add(ground);
  key.position.set(R * 1.2, R * 3.2, R * 1.6); Object.assign(key.shadow.camera, {left: -R * 1.6, right: R * 1.6, top: R * 1.6, bottom: -R * 1.6, near: .1, far: R * 8}); key.shadow.camera.updateProjectionMatrix();
  const dist = R / Math.sin(camera.fov / 2 * Math.PI / 180) * 1.02;
  camera.position.set(dist * .62, dist * .3, dist * .72);
  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, {enableDamping: true, dampingFactor: .07, enablePan: false, minDistance: dist * .45, maxDistance: dist * 1.6, autoRotate: !matchMedia('(prefers-reduced-motion: reduce)').matches && document.documentElement.dataset.motion !== 'reduce', autoRotateSpeed: .55});
  const stop = () => { controls.autoRotate = false; }; renderer.domElement.addEventListener('pointerdown', stop); renderer.domElement.addEventListener('wheel', stop, {passive: true});

  // ---- labels
  const labHost = host.querySelector('.sp-labels'), svg = host.querySelector('.sp-lines'), cap = host.querySelector('.sp-cap');
  const names = Object.keys(parts);
  const els = names.map(nm => { const b = document.createElement('button'); b.type = 'button'; b.className = 'sp-label'; b.innerHTML = `<i style="background:${opts.groups[parts[nm].info.group].color}"></i>${parts[nm].info.label}`; b.onclick = () => { stop(); select(sel === nm ? null : nm); }; labHost.appendChild(b); return b; });
  svg.innerHTML = names.map(() => '<path/><circle r="2.6"/>').join('');
  const paths = [...svg.querySelectorAll('path')], dots = [...svg.querySelectorAll('circle')];
  let sel = null, W = 1, H = 1, side = names.map(() => 0);
  function select(nm) {
    sel = nm;
    for (const [k, p] of Object.entries(parts)) { const on = !nm || k === nm; p.mesh.material.color.copy(p.base).lerp(new THREE.Color(dark ? 0x3a3f45 : 0xbab3a8), on ? 0 : .78); p.mesh.material.roughness = on ? .42 : .8; }
    els.forEach((e, i) => e.setAttribute('aria-pressed', String(names[i] === nm)));
    const p = nm && parts[nm];
    cap.innerHTML = p ? `<b>${p.info.title || p.info.label}</b> <span class="g">${opts.groups[p.info.group].label}</span><p>${p.info.text}</p>` : (opts.caption || '');
    opts.onSelect?.(nm);
  }
  const v = new THREE.Vector3();
  function layout() {
    const pts = names.map(nm => { v.copy(parts[nm].anchor).add(group.position).project(camera); return {x: (v.x * .5 + .5) * W, y: (-v.y * .5 + .5) * H}; });
    pts.forEach((p, i) => { if (side[i] === 0) side[i] = p.x < W / 2 ? -1 : 1; else if (side[i] === -1 && p.x > W / 2 + 28) side[i] = 1; else if (side[i] === 1 && p.x < W / 2 - 28) side[i] = -1; });
    const narrow = W < 520, colW = narrow ? 78 : 150, gap = narrow ? 24 : 30;
    for (const s of [-1, 1]) {
      const idx = pts.map((p, i) => i).filter(i => side[i] === s).sort((a, b) => pts[a].y - pts[b].y);
      const total = idx.length * gap; let y0 = Math.max(10, Math.min(H - total - 46, (idx.reduce((a, i) => a + pts[i].y, 0) / (idx.length || 1)) - total / 2));
      idx.forEach((i, k) => {
        const y = y0 + k * gap + gap / 2, el = els[i];
        el.style.top = (y - 12) + 'px'; if (s < 0) { el.style.left = '6px'; el.style.right = 'auto'; el.style.textAlign = 'left'; } else { el.style.right = '6px'; el.style.left = 'auto'; el.style.textAlign = 'right'; }
        const ex = s < 0 ? Math.min(colW, el.offsetWidth + 10) : W - Math.min(colW, el.offsetWidth + 10), mid = s < 0 ? ex + 14 : ex - 14;
        paths[i].setAttribute('d', `M${ex} ${y}L${mid} ${y}L${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`); dots[i].setAttribute('cx', pts[i].x); dots[i].setAttribute('cy', pts[i].y);
        const on = !sel || names[i] === sel; paths[i].style.opacity = dots[i].style.opacity = on ? 1 : .25;
      });
    }
    // scale bar: millimetres per pixel at the orbit target
    const d = camera.position.distanceTo(controls.target), mmPerPx = 2 * d * Math.tan(camera.fov / 2 * Math.PI / 180) / H, bar = niceBar(mmPerPx * 90);
    const sb = host.querySelector('.sp-scale'); sb.firstChild.style.width = (bar / mmPerPx) + 'px'; sb.lastChild.textContent = bar + ' mm';
  }
  const resize = () => { W = host.clientWidth; H = host.clientHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); };
  new ResizeObserver(resize).observe(host); resize();
  let visible = true; new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(host);
  (function loop() { if (!host.isConnected) { renderer.dispose(); return; } requestAnimationFrame(loop); if (!visible) return; controls.update(); renderer.render(scene, camera); layout(); })();
  select(null);
  return {select, names};
}
