// Atlas viewer: linked orthogonal sections from the original volumes, plus 3D surfaces.
// Volumes are stored x-fastest (index = x + nx*(y + ny*z)). Nothing is interpolated in the browser.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const V = '20261112';

// display mapping per species: three.js "up" and plane names
const VIEW = {
  'house-mouse': {up: '-z', names: {x: 'Sagittal', y: 'Coronal', z: 'Horizontal'}, ends: {x: ['L', 'R'], y: ['A', 'P'], z: ['D', 'V']}},
  'common-marmoset': {up: '+z', names: {x: 'Sagittal', y: 'Coronal', z: 'Axial'}, ends: {x: ['L', 'R'], y: ['P', 'A'], z: ['I', 'S']}},
  'egyptian-fruit-bat': {up: '+z', names: {x: 'Header x plane', y: 'Header y plane', z: 'Header z plane'}, ends: null},
  'zebra-finch': {up: '+z', names: {x: 'Grid X section', y: 'Grid Y section', z: 'Grid Z section'}, ends: null},
  'honeybee': {up: '-y'},
};
const PLANES = [{axis: 'x', u: 'y', v: 'z'}, {axis: 'y', u: 'x', v: 'z'}, {axis: 'z', u: 'x', v: 'y'}];
const AX = {x: 0, y: 1, z: 2};

let S = null; // current viewer state

async function gunzip(path, type) {
  const r = await fetch(`${path}?v=${V}`);
  if (!r.ok) throw Error(`Could not load ${path} (${r.status})`);
  const buf = await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  return type === 'u16' ? new Uint16Array(buf) : new Uint8Array(buf);
}
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

export async function openAtlas(id, ctx) {
  const {esc, getJSON, status, sp} = ctx;
  if (S?.three) { S.three.renderer.dispose(); S.three.renderer.domElement.remove(); cancelAnimationFrame(S.three.raf); }
  const base = `data/atlas/${id}/`;
  const meta = await getJSON(base + 'meta.json');
  const view = VIEW[id] || meta.view || {};
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  S = {id, meta, base, view, vol: null, lab: null, sel: 0, cur: null, regions: meta.regions || [], byIndex: new Map((meta.regions || []).map(r => [r.index, r])), esc, three: null, diff: null};
  $('#av-title').textContent = `${sp.common} brain atlas`;
  $('#av-sub').innerHTML = `${esc(meta.title)}. <span class="faint">${meta.dims ? `${meta.dims.join(' × ')} voxels at ${meta.spacing_mm[0]} mm.` : ''}</span>`;
  $('#av-prov').innerHTML = `<p>${esc(meta.provenance.citation)}</p><p class="small"><b>Data:</b> ${esc(meta.provenance.dataset || meta.provenance.volumes)}</p><p class="small"><b>Licence:</b> ${esc(meta.provenance.licence)}</p>`;
  $('#av-processing').innerHTML = (meta.processing || []).map(p => `<li>${esc(p)}</li>`).join('') + (meta.notes ? `<li>${esc(meta.notes)}</li>` : '');
  const hasVol = !!meta.dims;
  const tabs = {slices: $('#tab-slices'), '3d': $('#tab-3d'), diff: $('#tab-diff')};
  tabs.slices.hidden = !hasVol; tabs['3d'].hidden = !meta.meshes; tabs.diff.hidden = !meta.diffusion;
  $('#av-regions-sec').hidden = !(meta.regions?.length || meta.meshes);
  const select = name => {
    for (const [k, b] of Object.entries(tabs)) { b.setAttribute('aria-selected', String(k === name)); $('#panel-' + (k === '3d' ? '3d' : k === 'diff' ? 'diff' : 'slices')).hidden = k !== name; }
    if (name === '3d') init3D().catch(e => status(e.message));
    if (name === 'diff') initDiff().catch(e => status(e.message));
  };
  for (const [k, b] of Object.entries(tabs)) b.onclick = () => select(k);
  $('.view-tabs').onkeydown = e => { const vis = Object.entries(tabs).filter(([, b]) => !b.hidden); const i = vis.findIndex(([, b]) => b.getAttribute('aria-selected') === 'true');
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = vis[(i + (e.key === 'ArrowRight' ? 1 : vis.length - 1)) % vis.length]; select(n[0]); n[1].focus(); } };

  // image selector
  $('#av-image').innerHTML = (meta.images || []).map((im, i) => `<option value="${i}">${esc(im.name)}</option>`).join('');
  $('#av-image').closest('section').hidden = !(meta.images || []).length;
  $('#av-overlay').closest('label').hidden = !meta.labels; $('#av-outline').closest('label').hidden = !meta.labels;

  // regions
  buildRegionList();
  $('#av-rsearch').value = '';
  $('#av-rsearch').oninput = buildRegionList;

  if (hasVol) {
    status('Loading atlas volume…');
    const [vol, lab] = await Promise.all([gunzip(base + meta.images[0].file), meta.labels ? gunzip(base + meta.labels.file, 'u16') : null]);
    status('');
    S.vol = vol; S.lab = lab;
    const [nx, ny, nz] = meta.dims;
    if (vol.length !== nx * ny * nz) throw Error('Atlas volume size does not match its metadata');
    S.cur = [nx >> 1, ny >> 1, nz >> 1];
    S.colors = new Uint8Array(((meta.regions?.length || 0) + 2) * 3);
    for (const r of meta.regions || []) S.colors.set(hex(r.color), r.index * 3);
    $('#av-image').onchange = async () => { status('Loading image…'); S.vol = await gunzip(base + meta.images[+$('#av-image').value].file); status(''); drawAll(); };
    $('#av-overlay').onchange = drawAll; $('#av-outline').onchange = drawAll;
    buildPlanes($('#av-planes'), meta.dims, meta.spacing_mm, false);
    $('#av-note').textContent = id === 'zebra-finch' ? 'Grid coordinates in millimetres from the first voxel centre; anatomical axis signs and a surgical origin are not assigned.' :
      id === 'egyptian-fruit-bat' ? 'The specimen is a fixed head: skull, eyes and other tissue are visible around the brain. No region labels exist for this scan. Planes follow the axes in the NIfTI header; for ex vivo specimens these may not match true anatomical directions, so no anatomical labels are asserted.' :
      'Coordinates are millimetres from the first voxel of the volume, not stereotaxic coordinates.';
    select('slices');
    const r0 = +params.get('r'); if (r0 && S.byIndex.has(r0)) selectRegion(r0, true); else drawAll();
  } else {
    select('3d');
  }
}

// ------------------------------------------------------------------ region list
function buildRegionList() {
  const {esc} = S; const q = $('#av-rsearch').value.trim().toLowerCase();
  let items = S.regions.length ? S.regions : [];
  const isMeshOnly = !S.regions.length;
  if (isMeshOnly && !S.meta.meshes) { $('#av-regions').innerHTML = ''; return; }
  if (isMeshOnly) { $('#av-regions').innerHTML = '<li class="small faint" style="padding:.4rem">Loading surfaces…</li>'; loadMeshes().then(m => { S.regionsFromMesh = m.map((x, i) => ({index: x.id, name: x.name, acronym: '', color: x.color})); renderList(); }); return; }
  renderList();
  function renderList() {
    const src = isMeshOnly ? S.regionsFromMesh : items;
    const list = src.filter(r => !q || r.name.toLowerCase().includes(q) || (r.acronym || '').toLowerCase().includes(q)).sort((a, b) => (b.volume_mm3 || 0) - (a.volume_mm3 || 0));
    const shown = list.slice(0, 400);
    $('#av-regions').innerHTML = shown.map(r => `<li><button type="button" data-r="${r.index}" aria-pressed="${r.index === S.sel}"><span class="swatch" style="background:${esc(r.color)}"></span><span>${esc(r.name)}${r.hemisphere ? ` <span class="faint">(${esc(r.hemisphere.replace(':', ''))})</span>` : ''}</span><span class="acr">${r.acronym && r.acronym !== r.name ? esc(r.acronym) : ''}</span></button></li>`).join('') || '<li class="small faint" style="padding:.4rem">No regions match.</li>';
    $('#av-rcount').textContent = S.regions.length ? `${list.length} of ${S.regions.length} labelled regions${list.length > shown.length ? ', first 400 shown (sorted by volume)' : ' (sorted by volume)'}.` : `${src.length} surfaces from the source database.`;
    $$('#av-regions button').forEach(b => b.onclick = () => selectRegion(+b.dataset.r === S.sel ? 0 : +b.dataset.r, true));
  }
}

function selectRegion(idx, jump) {
  S.sel = idx;
  $$('#av-regions button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.r === idx)));
  if (idx && jump && S.lab) {
    const [nx, ny] = S.meta.dims; let sx = 0, sy = 0, sz = 0, n = 0; const L = S.lab;
    for (let i = 0; i < L.length; i++) if (L[i] === idx) { const x = i % nx, t = (i / nx) | 0; sx += x; sy += t % ny; sz += (t / ny) | 0; n++; }
    if (n) S.cur = [Math.round(sx / n), Math.round(sy / n), Math.round(sz / n)];
  }
  if (S.vol) { drawAll(); describe(); }
  if (S.three) highlightMesh();
}

// ------------------------------------------------------------------ section planes
function buildPlanes(host, dims, spacing, diffusion) {
  const names = S.view.names || {x: 'X section', y: 'Y section', z: 'Z section'};
  host.innerHTML = PLANES.map(p => { const nu = dims[AX[p.u]], nv = dims[AX[p.v]];
    return `<div style="flex:${(nu * spacing[AX[p.u]]) / (nv * spacing[AX[p.v]])} 1 0"><div class="plane"><canvas data-axis="${p.axis}" width="${nu}" height="${nv}" tabindex="0" style="aspect-ratio:${nu}/${nv}" aria-label="${names[p.axis]}. Arrow keys move the cursor; Page Up and Page Down change the section."></canvas><span class="plabel">${names[p.axis]}</span>${orientMarks(p)}</div>
      <div class="plane-ctl"><label class="visually-hidden" for="sl-${diffusion ? 'd' : ''}${p.axis}">${names[p.axis]} position</label><input type="range" id="sl-${diffusion ? 'd' : ''}${p.axis}" data-axis="${p.axis}" min="0" max="${dims[AX[p.axis]] - 1}"><span class="mono" data-pos="${p.axis}"></span></div></div>`; }).join('');
  const state = diffusion ? S.diff : S;
  $$('canvas', host).forEach(cv => {
    const p = PLANES.find(q => q.axis === cv.dataset.axis);
    const toVoxel = e => { const r = cv.getBoundingClientRect(); const u = Math.floor((e.clientX - r.left) / r.width * cv.width), vr = Math.floor((e.clientY - r.top) / r.height * cv.height); const v = flipV(p) ? cv.height - 1 - vr : vr; const c = [...state.cur]; c[AX[p.u]] = clamp(u, dims[AX[p.u]]); c[AX[p.v]] = clamp(v, dims[AX[p.v]]); return c; };
    cv.addEventListener('pointerdown', e => { state.cur = toVoxel(e); cv.setPointerCapture(e.pointerId); redraw(); });
    cv.addEventListener('pointermove', e => { if (e.buttons) { state.cur = toVoxel(e); redraw(); } else hover(toVoxel(e)); });
    cv.addEventListener('keydown', e => {
      const c = state.cur, du = {ArrowLeft: -1, ArrowRight: 1}[e.key], dv = {ArrowUp: -1, ArrowDown: 1}[e.key], ds = {PageUp: 1, PageDown: -1, '+': 1, '-': -1}[e.key];
      if (du) c[AX[p.u]] = clamp(c[AX[p.u]] + du * (e.shiftKey ? 10 : 1), dims[AX[p.u]]);
      else if (dv) c[AX[p.v]] = clamp(c[AX[p.v]] + (flipV(p) ? -dv : dv) * (e.shiftKey ? 10 : 1), dims[AX[p.v]]);
      else if (ds) c[AX[p.axis]] = clamp(c[AX[p.axis]] + ds * (e.shiftKey ? 10 : 1), dims[AX[p.axis]]);
      else return;
      e.preventDefault(); redraw();
    });
  });
  $$('input[type=range]', host).forEach(sl => sl.oninput = () => { state.cur[AX[sl.dataset.axis]] = +sl.value; redraw(); });
  function redraw() { if (diffusion) { drawDiff(); } else { drawAll(); describe(); } }
  function hover(c) { if (!diffusion) describe(c, true); }
}
const clamp = (v, n) => Math.max(0, Math.min(n - 1, v));
const flipV = p => !!S.meta.flip_display?.[p.v];
function orientMarks(p) {
  const e = S.view.ends; if (!e) return '';
  const [u0, u1] = e[p.u], [v0, v1] = e[p.v]; const top = flipV(p) ? v1 : v0, bot = flipV(p) ? v0 : v1;
  return `<span class="orient" style="left:4px;top:50%">${u0}</span><span class="orient" style="right:4px;top:50%">${u1}</span><span class="orient" style="left:50%;top:18px">${top}</span><span class="orient" style="left:50%;bottom:2px">${bot}</span>`;
}

function drawAll() { for (const cv of $$('#av-planes canvas')) drawPlane(cv, S, S.meta.dims, S.vol, S.lab); syncSliders('#av-planes', S); }
function syncSliders(host, st) { const sp = (st === S ? S.meta.spacing_mm : S.meta.diffusion.spacing_mm); $$(`${host} input[type=range]`).forEach(sl => { const a = AX[sl.dataset.axis]; sl.value = st.cur[a]; $(`${host} [data-pos="${sl.dataset.axis}"]`).textContent = `${(st.cur[a] * sp[a]).toFixed(2)} mm`; }); }

function drawPlane(cv, st, dims, vol, lab, rgb) {
  const p = PLANES.find(q => q.axis === cv.dataset.axis);
  const [nx, ny] = dims, stride = [1, nx, nx * ny];
  const nu = cv.width, nv = cv.height, su = stride[AX[p.u]], sv = stride[AX[p.v]], base = st.cur[AX[p.axis]] * stride[AX[p.axis]];
  const ctx = cv.getContext('2d'), img = ctx.createImageData(nu, nv), d = img.data;
  const overlay = lab && $('#av-overlay').checked, outline = lab && $('#av-outline').checked, sel = S.sel, C = S.colors, flip = flipV(p);
  for (let r = 0; r < nv; r++) {
    const v = flip ? nv - 1 - r : r;
    for (let u = 0; u < nu; u++) {
      const i = base + u * su + v * sv, o = (r * nu + u) * 4;
      if (rgb) { d[o] = rgb[0][i]; d[o + 1] = rgb[1][i]; d[o + 2] = rgb[2][i]; d[o + 3] = 255; continue; }
      let g = vol[i], R = g, G = g, B = g;
      if (lab) {
        const L = lab[i];
        if (outline) {
          if (sel && L === sel) { const nb = [i - su, i + su, i - sv, i + sv]; if (u === 0 || v === 0 || u === nu - 1 || v === nv - 1 || nb.some(j => lab[j] !== sel)) { R = 255; G = 220; B = 40; } }
        } else if (overlay && L) {
          const a = sel ? (L === sel ? .75 : .12) : .45; R = g * (1 - a) + C[L * 3] * a; G = g * (1 - a) + C[L * 3 + 1] * a; B = g * (1 - a) + C[L * 3 + 2] * a;
        } else if (sel && L === sel) { R = g * .3 + 255 * .7; G = g * .3 + 200 * .7; B = g * .3; }
      }
      d[o] = R; d[o + 1] = G; d[o + 2] = B; d[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // crosshair
  const cu = st.cur[AX[p.u]] + .5, cvv = (flip ? nv - 1 - st.cur[AX[p.v]] : st.cur[AX[p.v]]) + .5;
  ctx.strokeStyle = 'rgba(90,208,255,.85)'; ctx.lineWidth = Math.max(1, nu / 400); ctx.beginPath();
  ctx.moveTo(cu, 0); ctx.lineTo(cu, cvv - 4); ctx.moveTo(cu, cvv + 4); ctx.lineTo(cu, nv); ctx.moveTo(0, cvv); ctx.lineTo(cu - 4, cvv); ctx.moveTo(cu + 4, cvv); ctx.lineTo(nu, cvv); ctx.stroke();
}

function describe(c = S.cur, hovering = false) {
  const {esc, meta} = S; const [nx, ny] = meta.dims; const i = c[0] + nx * (c[1] + ny * c[2]);
  const mm = c.map((v, k) => (v * meta.spacing_mm[k]).toFixed(2));
  const L = S.lab ? S.lab[i] : 0, reg = L ? S.byIndex.get(L) : null;
  const selReg = S.sel ? S.byIndex.get(S.sel) : null;
  const regText = reg ? `<span><b>${esc(reg.name)}</b>${reg.acronym ? ` <span class="mono">${esc(reg.acronym)}</span>` : ''}${reg.hemisphere ? ` (${esc(reg.hemisphere.replace(':', ''))})` : ''}</span>${reg.path ? `<span class="faint small">${esc(reg.path.slice(1, -1).join(' › '))}</span>` : ''}` : (S.lab ? '<span class="faint">No label at this point</span>' : '');
  $('#av-readout').innerHTML = `<span class="mono">${hovering ? 'Pointer' : 'Cursor'} (${mm.join(', ')}) mm</span><span>Intensity ${S.vol[i]}</span>${regText}${selReg ? `<span>Selected: <b>${esc(selReg.name)}</b> · ${selReg.volume_mm3 != null ? (+selReg.volume_mm3).toFixed(3) + ' mm³' : ''}</span>` : ''}`;
}

// ------------------------------------------------------------------ diffusion (bat)
async function initDiff() {
  if (S.diff) return;
  const m = S.meta.diffusion; const {esc} = S;
  $('#av-diff-note').textContent = m.note + ` Median FA inside the sample mask: ${m.fa_in_mask.median} (95th percentile ${m.fa_in_mask.p95}).`;
  $('#av-diff-image').innerHTML = m.images.map((im, i) => `<option value="${i}">${esc(im.name)}</option>`).join('');
  S.diff = {cur: m.dims.map(n => n >> 1), dims: m.dims, cache: {}};
  const load = async i => { const im = m.images[i]; if (S.diff.cache[i]) return S.diff.cache[i];
    const v = im.channels ? await Promise.all(im.channels.map(c => gunzip(S.base + im.file.replace('{c}', c)))) : await gunzip(S.base + im.file); return (S.diff.cache[i] = v); };
  S.diff.img = await load(1);
  $('#av-diff-image').value = 1;
  $('#av-diff-image').onchange = async () => { S.diff.img = await load(+$('#av-diff-image').value); drawDiff(); };
  buildPlanes($('#av-diff-planes'), m.dims, m.spacing_mm, true);
  drawDiff();
}
function drawDiff() {
  const D = S.diff, m = S.meta.diffusion, rgb = Array.isArray(D.img) ? D.img : null;
  const metaSave = S.meta.flip_display; // diffusion volume is also canonical RAS
  for (const cv of $$('#av-diff-planes canvas')) drawPlane(cv, D, m.dims, rgb ? rgb[0] : D.img, null, rgb);
  S.meta.flip_display = metaSave;
  syncSliders('#av-diff-planes', D);
  const [nx, ny] = m.dims, i = D.cur[0] + nx * (D.cur[1] + ny * D.cur[2]);
  const fa = D.cache[1]?.[i];
  $('#av-diff-readout').innerHTML = `<span class="mono">(${D.cur.map((v, k) => (v * m.spacing_mm[k]).toFixed(2)).join(', ')}) mm</span>${fa != null ? `<span>FA ${(fa / 255).toFixed(3)}</span>` : ''}`;
}

// ------------------------------------------------------------------ 3D
async function loadMeshes() { if (!S.meshes) S.meshes = await fetch(`${S.base}${S.meta.meshes}?v=${V}`).then(r => r.json()); return S.meshes; }
async function init3D() {
  if (S.three) { S.three.resize(); return; }
  const host = $('#av-three');
  const [THREE, {OrbitControls}, meshes] = await Promise.all([import('three'), import('../assets/OrbitControls.js'), loadMeshes()]);
  const renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: false});
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  host.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D view of brain surfaces');
  renderer.domElement.tabIndex = 0;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0f1215');
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 1000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.1));
  const dl = new THREE.DirectionalLight(0xffffff, 1.4); dl.position.set(1, 2, 3); camera.add(dl); scene.add(camera);
  const group = new THREE.Group(); scene.add(group);
  const up = S.view.up || '+z';
  const map = (x, y, z) => up === '-z' ? [x, -z, y] : up === '+z' ? [x, z, -y] : up === '-y' ? [x, -y, -z] : [x, y, z];
  const objs = [];
  const box = new THREE.Box3();
  meshes.forEach((m, k) => {
    const v = m.vertices, pos = new Float32Array(v.length);
    for (let i = 0; i < v.length; i += 3) { const p = map(v[i], v[i + 1], v[i + 2]); pos[i] = p[0]; pos[i + 1] = p[1]; pos[i + 2] = p[2]; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(m.faces); g.computeVertexNormals();
    const shell = (S.id === 'house-mouse' && m.id === 997) || m.id === 0 || /whole brain/i.test(m.name);
    const mat = new THREE.MeshStandardMaterial({color: m.color || '#cccccc', roughness: .65, metalness: 0, transparent: shell, opacity: shell ? .16 : 1, depthWrite: !shell, side: THREE.DoubleSide});
    const mesh = new THREE.Mesh(g, mat); mesh.userData = {m, shell}; group.add(mesh); objs.push(mesh);
    g.computeBoundingBox(); box.union(g.boundingBox);
  });
  const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3()).length();
  group.position.sub(c);
  camera.position.set(size * .55, size * .45, size * 1.15);
  const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.target.set(0, 0, 0);
  const resize = () => { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();
  const loop = () => { S.three && (S.three.raf = requestAnimationFrame(loop)); controls.update(); renderer.render(scene, camera); };
  S.three = {renderer, scene, camera, controls, objs, resize, raf: 0, THREE};
  loop();
  // picking
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let down = null;
  renderer.domElement.addEventListener('pointerdown', e => down = [e.clientX, e.clientY]);
  renderer.domElement.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 4) return;
    const r = renderer.domElement.getBoundingClientRect(); ptr.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ptr, camera); const hit = ray.intersectObjects(objs.filter(o => o.visible && !o.userData.shell))[0];
    if (hit) { const m = hit.object.userData.m; const reg = S.regions.find(r => r.source_id === m.id); selectRegion(reg ? reg.index : (S.regions.length ? 0 : m.id), false); }
  });
  // surface checklist
  const note = $('#av-mesh-note');
  note.innerHTML = `<span id="av-mesh-sel">${meshes.length} surfaces. </span>${S.meta.mesh_note ? S.esc(S.meta.mesh_note) : S.id === 'zebra-finch' ? 'Marching-cubes surfaces of the source masks, without smoothing.' : S.id === 'house-mouse' ? 'Allen-provided structure meshes, decimated for display.' : S.id === 'honeybee' ? 'InsectBrainDB display meshes (Honeybee Standard Brain).' : 'Marching-cubes surfaces of the atlas labels, decimated for display.'} Click a surface to identify it.
    <details class="data-table"><summary>Show or hide surfaces</summary><div style="columns:2;font-size:.86rem;margin-top:.4rem">${meshes.map((m, i) => `<label style="display:block"><input type="checkbox" data-mesh="${i}" checked> ${S.esc(m.name)}</label>`).join('')}</div></details>`;
  $$('[data-mesh]', note).forEach(cb => cb.onchange = () => { objs[+cb.dataset.mesh].visible = cb.checked; });
  highlightMesh();
}
function highlightMesh() {
  const T = S.three; if (!T) return;
  const reg = S.regions.length ? S.byIndex.get(S.sel) : null;
  const target = reg ? reg.source_id : (S.regions.length ? null : S.sel || null);
  const any = target != null && T.objs.some(o => o.userData.m.id === target);
  T.objs.forEach(o => { if (o.userData.shell) return; const on = !any || o.userData.m.id === target; o.material.opacity = on ? 1 : .12; o.material.transparent = !on; o.material.depthWrite = on; o.material.emissive?.set(any && on ? 0x332200 : 0x000000); });
  const name = reg?.name || T.objs.find(o => o.userData.m.id === target)?.userData.m.name;
  $('#av-mesh-sel').textContent = target != null ? (any ? `Selected: ${name}. ` : `${name}: no surface is provided for this region; select it in Sections to see its voxels. `) : `${T.objs.length} surfaces. `;
}
