// Atlas viewer: linked orthogonal sections from the original volumes, plus 3D surfaces.
// Volumes are stored x-fastest (index = x + nx*(y + ny*z)). Nothing is interpolated in the browser.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const V = '20261116a';

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
const nice = n => /^root$/i.test(n) ? 'Whole brain' : n;
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

export async function openAtlas(id, ctx) {
  const {esc, getJSON, status, sp} = ctx;
  if (S?.three) { cancelAnimationFrame(S.three.raf); S.three.renderer.dispose(); S.three.renderer.domElement.remove(); }
  const base = `data/atlas/${id}/`;
  const meta = await getJSON(base + 'meta.json');
  const view = VIEW[id] || meta.view || {};
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  S = {id, meta, base, view, vol: null, lab: null, sel: 0, cur: null, regions: meta.regions || [], byIndex: new Map((meta.regions || []).map(r => [r.index, r])), esc, three: null, diff: null};
  $('#av-title').textContent = `${sp.common} brain atlas`;
  $('#av-sub').textContent = meta.title;
  const link = s => esc(s).replace(/(https?:\/\/[^\s<)]+[^\s<).,;])/g, '<a href="$1">$1</a>').replace(/doi:\s*(10\.[^\s<]+[^\s<.,;)])/g, '<a href="https://doi.org/$1">doi:$1</a>');
  const pv = meta.provenance, paper = (pv.citation || '').split(/\.? doi:/)[0];
  $('#av-facts').innerHTML = [
    ['Images', (meta.images || []).map(im => im.name).join('; ') || (meta.meshes ? 'Surface models only' : '')],
    ['Regions', meta.regions?.length ? `${meta.regions.length.toLocaleString('en-US')} labelled` : meta.labels ? '' : 'Not delineated'],
    ['Display grid', meta.dims ? `${meta.dims.join(' × ')} voxels${meta.unit === 'voxel' ? '; the source files state no physical unit' : `, ${meta.spacing_mm[0]} mm`}` : ''],
    ['Source', paper], ['Licence', pv.licence]].filter(f => f[1]).map(f => `<dt>${f[0]}</dt><dd>${esc(f[1])}</dd>`).join('');
  $('#av-prov').innerHTML = `<p>${link(pv.dataset || pv.volumes || '')}</p><p><b>Licence:</b> ${link(pv.licence || '')}</p>`;
  $('#av-cite').innerHTML = `<p>${link(pv.citation || '')}</p><p>Viewer: Animal Communication &amp; Neuroscience (2026). ${esc(sp.common)} brain atlas. ${esc(location.origin + location.pathname)}#atlas/${id}</p>`;
  const files = [['Metadata and region table (JSON)', 'meta.json'], ...(meta.images || []).map(im => [`${im.name} (8-bit volume, gzip)`, im.file]), ...(meta.labels ? [['Region labels (16-bit volume, gzip)', meta.labels.file]] : []), ...(meta.meshes ? [['Surfaces (JSON)', meta.meshes]] : [])];
  $('#av-files').innerHTML = files.map(f => `<li><a href="${base}${esc(f[1])}" download>${esc(f[0])}</a>${meta.sizes_bytes?.[f[1]] ? ` <span class="faint">${(meta.sizes_bytes[f[1]] / 1e6).toFixed(1)} MB</span>` : ''}</li>`).join('') + '<li class="faint">Display copies prepared as described under Data preparation; originals are at the source.</li>';
  $('#av-copy').onclick = () => { syncURL(); setTimeout(() => navigator.clipboard?.writeText(location.href).then(() => { $('#av-copied').textContent = 'Link copied.'; setTimeout(() => { const el = $('#av-copied'); if (el) el.textContent = ''; }, 2500); }, () => { $('#av-copied').textContent = 'Copy the address from the address bar.'; }), 320); };
  $('#av-processing').innerHTML = (meta.processing || []).map(p => `<li>${esc(p)}</li>`).join('') + (meta.notes ? `<li>${esc(meta.notes)}</li>` : '');
  const hasVol = !!meta.dims;
  const tabs = {slices: $('#tab-slices'), diff: $('#tab-diff')}, has3d = !!meta.meshes;
  tabs.diff.hidden = !meta.diffusion; $('#av-tabs').hidden = !meta.diffusion;
  $('#av-regions-sec').hidden = !(meta.regions?.length || meta.meshes);
  const select = name => {
    for (const [k, b] of Object.entries(tabs)) b.setAttribute('aria-selected', String(k === name));
    $('#panel-diff').hidden = name !== 'diff'; $('#panel-3d').hidden = name === 'diff' || !has3d; $('#panel-slices').hidden = name === 'diff' || !hasVol;
    if (name !== 'diff' && has3d) init3D().catch(e => status(e.message));
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
    const c0 = (params.get('c') || '').split(',').map(Number); if (c0.length === 3 && c0.every(Number.isInteger)) S.cur = c0.map((v, k) => clamp(v, meta.dims[k]));
    S.colors = new Uint8Array(((meta.regions?.length || 0) + 2) * 3);
    for (const r of meta.regions || []) S.colors.set(hex(r.color), r.index * 3);
    $('#av-image').onchange = async () => { status('Loading image…'); S.vol = await gunzip(base + meta.images[+$('#av-image').value].file); status(''); drawAll(); };
    $('#av-overlay').onchange = drawAll; $('#av-outline').onchange = drawAll;
    buildPlanes($('#av-planes'), meta.dims, meta.spacing_mm, false);
    $('#av-note').textContent = id === 'zebra-finch' ? 'Grid coordinates in millimetres from the first voxel centre; anatomical axis signs and a surgical origin are not assigned.' :
      id === 'egyptian-fruit-bat' ? 'The specimen is a fixed head: skull, eyes and other tissue are visible around the brain. No region labels exist for this scan. Planes follow the axes in the NIfTI header; for ex vivo specimens these may not match true anatomical directions, so no anatomical labels are asserted.' :
      (meta.unit === 'voxel' ? 'Coordinates are voxel indices of the distributed volume.' : 'Coordinates in millimetres from the first voxel of the volume; not stereotaxic.');
    select('slices');
    const r0 = +params.get('r'); if (r0 && S.byIndex.has(r0)) selectRegion(r0, !params.get('c')); else { drawAll(); describe(); }
  } else {
    select('slices');
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
    $('#av-regions').innerHTML = shown.map(r => `<li><button type="button" data-r="${r.index}" aria-pressed="${r.index === S.sel}"><span class="swatch" style="background:${esc(r.color)}"></span><span>${esc(nice(r.name))}${r.hemisphere ? ` <span class="faint">(${esc(r.hemisphere.replace(':', ''))})</span>` : ''}</span><span class="acr">${r.acronym && r.acronym !== r.name ? esc(r.acronym) : ''}</span></button></li>`).join('') || '<li class="small faint" style="padding:.4rem">No regions match.</li>';
    $('#av-rcount').textContent = S.regions.length ? `${list.length} of ${S.regions.length} labelled regions${list.length > shown.length ? ', first 400 shown (sorted by volume)' : ' (sorted by volume)'}.` : `${src.length} surfaces from the source database.`;
    const bs = $$('#av-regions button'); bs.forEach((b, i) => { b.tabIndex = (S.sel ? +b.dataset.r === S.sel : i === 0) ? 0 : -1; b.onclick = () => { bs.forEach(x => x.tabIndex = x === b ? 0 : -1); selectRegion(+b.dataset.r === S.sel ? 0 : +b.dataset.r, true); }; });
    if (bs.length && !bs.some(b => b.tabIndex === 0)) bs[0].tabIndex = 0;
    $('#av-regions').onkeydown = e => { const i = bs.indexOf(document.activeElement); if (i < 0) return; const j = {ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: bs.length - 1}[e.key]; if (j == null) return; e.preventDefault(); bs[Math.max(0, Math.min(bs.length - 1, j))].focus(); };
  }
}

function selectRegion(idx, jump) {
  S.sel = idx; if (idx) S.pick = null;
  $$('#av-regions button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.r === idx)));
  if (idx && jump && S.lab) {
    const [nx, ny] = S.meta.dims, L = S.lab; let mxs = 0, n = 0;
    for (let i = 0; i < L.length; i++) if (L[i] === idx) { mxs += i % nx; n++; }
    if (n) { const mid = mxs / n; let sx = 0, sy = 0, sz = 0, m = 0;   // centroid of the half with larger x, then the nearest labelled voxel
      for (let i = 0; i < L.length; i++) if (L[i] === idx) { const x = i % nx; if (x < mid) continue; const t = (i / nx) | 0; sx += x; sy += t % ny; sz += (t / ny) | 0; m++; }
      sx /= m; sy /= m; sz /= m; let best = Infinity;
      for (let i = 0; i < L.length; i++) if (L[i] === idx) { const x = i % nx, t = (i / nx) | 0, y = t % ny, z = (t / ny) | 0, d = (x - sx) ** 2 + (y - sy) ** 2 + (z - sz) ** 2; if (d < best) { best = d; S.cur = [x, y, z]; } } }
  }
  if (S.vol) { drawAll(); describe(); }
  if (S.three) highlightMesh();
  syncURL();
}

// ------------------------------------------------------------------ section planes
function buildPlanes(host, dims, spacing, diffusion) {
  const names = S.view.names || {x: 'X section', y: 'Y section', z: 'Z section'};
  host.innerHTML = PLANES.map(p => { const nu = dims[AX[p.u]], nv = dims[AX[p.v]];
    return `<div style="flex:${(nu * spacing[AX[p.u]]) / (nv * spacing[AX[p.v]])} 1 0"><div class="plane"><canvas data-axis="${p.axis}" width="${nu}" height="${nv}" tabindex="0" style="aspect-ratio:${nu}/${nv}" aria-label="${names[p.axis]}. Arrow keys move the cursor; Page Up and Page Down change the section."></canvas><span class="plabel">${names[p.axis]}</span>${orientMarks(p)}</div>
      <div class="plane-ctl"><label class="vh" for="sl-${diffusion ? 'd' : ''}${p.axis}">${names[p.axis]} position</label><input type="range" id="sl-${diffusion ? 'd' : ''}${p.axis}" data-axis="${p.axis}" min="0" max="${dims[AX[p.axis]] - 1}"><span class="mono" data-pos="${p.axis}"></span></div></div>`; }).join('');
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
  function redraw() { if (diffusion) { drawDiff(); } else { drawAll(); describe(); syncURL(); } }
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
function syncSliders(host, st) { const sp = (st === S ? S.meta.spacing_mm : S.meta.diffusion.spacing_mm); $$(`${host} input[type=range]`).forEach(sl => { const a = AX[sl.dataset.axis]; sl.value = st.cur[a]; const txt = S.meta.unit === 'voxel' ? `voxel ${st.cur[a]}` : `${(st.cur[a] * sp[a]).toFixed(2)} mm`; sl.setAttribute('aria-valuetext', txt); $(`${host} [data-pos="${sl.dataset.axis}"]`).textContent = txt.replace('voxel ', ''); }); }

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
  const vox = meta.unit === 'voxel'; const mm = c.map((v, k) => vox ? String(v) : (v * meta.spacing_mm[k]).toFixed(2));
  const L = S.lab ? S.lab[i] : 0, reg = L ? S.byIndex.get(L) : null;
  const selReg = S.sel ? S.byIndex.get(S.sel) : null;
  const regText = reg ? `<span><b>${esc(reg.name)}</b>${reg.acronym ? ` <span class="mono">${esc(reg.acronym)}</span>` : ''}${reg.hemisphere ? ` (${esc(reg.hemisphere.replace(':', ''))})` : ''}</span>${reg.path ? `<span class="faint small">${esc(reg.path.slice(1, -1).join(' › '))}</span>` : ''}` : (S.lab ? '<span class="faint">No label at this point</span>' : '');
  $('#av-readout').innerHTML = `<span class="mono">${hovering ? 'Pointer' : 'Cursor'} (${mm.join(', ')}) ${vox ? 'voxels' : 'mm'}</span><span>Intensity ${S.vol[i]}</span>${regText}${selReg ? `<span>Selected: <b>${esc(selReg.name)}</b> · ${selReg.volume_mm3 != null ? (+selReg.volume_mm3).toFixed(3) + ' mm³' : selReg.voxels ? selReg.voxels.toLocaleString() + ' voxels' : ''}</span>` : ''}`;
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
const mapFor = up => (x, y, z) => up === '-z' ? [x, -z, y] : up === '+z' ? [x, z, -y] : up === '-y' ? [x, -y, -z] : [x, y, z];

// Surface of one labelled region, computed from its voxels (naive surface nets, then two smoothing passes).
// Vertices are in voxel-index units; voxel centres sit at integer coordinates, as in the packaged surfaces.
function regionSurface(idx) {
  const [nx, ny, nz] = S.meta.dims, L = S.lab;
  let x0 = nx, y0 = ny, z0 = nz, x1 = -1, y1 = -1, z1 = -1;
  for (let z = 0, i = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++, i++) if (L[i] === idx) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
  if (x1 < 0) return null;
  const ox = x0 - 1, oy = y0 - 1, oz = z0 - 1, mx = x1 - x0 + 3, my = y1 - y0 + 3, mz = z1 - z0 + 3, M = new Uint8Array(mx * my * mz);
  for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (L[x + nx * (y + ny * z)] === idx) M[(x - ox) + mx * ((y - oy) + my * (z - oz))] = 1;
  const cx = mx - 1, cy = my - 1, cz = mz - 1, vid = new Int32Array(cx * cy * cz).fill(-1), pos = [];
  const CO = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]], ED = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const c = new Uint8Array(8);
  for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
    let s = 0; for (let q = 0; q < 8; q++) s += c[q] = M[(i + CO[q][0]) + mx * ((j + CO[q][1]) + my * (k + CO[q][2]))];
    if (s === 0 || s === 8) continue;
    let px = 0, py = 0, pz = 0, n = 0;
    for (const [a, b] of ED) if (c[a] !== c[b]) { px += (CO[a][0] + CO[b][0]) / 2; py += (CO[a][1] + CO[b][1]) / 2; pz += (CO[a][2] + CO[b][2]) / 2; n++; }
    vid[i + cx * (j + cy * k)] = pos.length / 3; pos.push(i + px / n, j + py / n, k + pz / n);
  }
  const tri = [], E = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let a = 0; a < 3; a++) { const ea = E[a], eb = E[(a + 1) % 3], ec = E[(a + 2) % 3];
    for (let k = 0; k < mz - ea[2]; k++) for (let j = 0; j < my - ea[1]; j++) for (let i = 0; i < mx - ea[0]; i++) {
      const m0 = M[i + mx * (j + my * k)], m1 = M[(i + ea[0]) + mx * ((j + ea[1]) + my * (k + ea[2]))]; if (m0 === m1) continue;
      const cell = (di, dj, dk) => vid[(i + di) + cx * ((j + dj) + cy * (k + dk))];
      const v0 = cell(-eb[0] - ec[0], -eb[1] - ec[1], -eb[2] - ec[2]), v1 = cell(-ec[0], -ec[1], -ec[2]), v2 = cell(0, 0, 0), v3 = cell(-eb[0], -eb[1], -eb[2]);
      if (v0 < 0 || v1 < 0 || v2 < 0 || v3 < 0) continue;
      if (m0) tri.push(v0, v1, v2, v0, v2, v3); else tri.push(v0, v2, v1, v0, v3, v2);
    } }
  const nv = pos.length / 3; let P = Float32Array.from(pos);
  for (let it = 0; it < 2; it++) {
    const acc = new Float32Array(nv * 3), cnt = new Uint16Array(nv);
    for (let t = 0; t < tri.length; t += 3) for (let e = 0; e < 3; e++) { const a = tri[t + e], b = tri[t + (e + 1) % 3]; acc[a * 3] += P[b * 3]; acc[a * 3 + 1] += P[b * 3 + 1]; acc[a * 3 + 2] += P[b * 3 + 2]; cnt[a]++; }
    const Q = new Float32Array(nv * 3); for (let v = 0; v < nv; v++) for (let d = 0; d < 3; d++) Q[v * 3 + d] = cnt[v] ? P[v * 3 + d] * .5 + acc[v * 3 + d] / cnt[v] * .5 : P[v * 3 + d];
    P = Q;
  }
  const sp = S.meta.spacing_mm, off = [ox, oy, oz];
  for (let v = 0; v < nv; v++) for (let d = 0; d < 3; d++) P[v * 3 + d] = (P[v * 3 + d] + off[d]) * sp[d];
  return {vertices: P, faces: tri};
}

async function init3D() {
  if (S.three) { S.three.resize(); return; }
  if (S.threeStarting) return; S.threeStarting = true;
  const host = $('#av-three'), mine = S;
  const wait = document.createElement('p'); wait.className = 'loading'; wait.setAttribute('role', 'status'); wait.textContent = 'Loading 3D surfaces…'; host.append(wait);
  const [THREE, {OrbitControls}, meshes, {dress}] = await Promise.all([import('three'), import('../assets/OrbitControls.js'), loadMeshes(), import('./viewer3d.js?v=20261116a')]);
  if (S !== mine || !host.isConnected) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({antialias: true, alpha: true}); }
  catch (e) { wait.textContent = 'The 3D view could not be started in this browser (WebGL is unavailable). The sections and the region list remain available.'; host.querySelector('.three-help')?.remove(); return; }
  wait.remove();
  renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setClearColor(0x000000, 0);
  host.prepend(renderer.domElement);
  const cvs = renderer.domElement; cvs.setAttribute('role', 'img'); cvs.setAttribute('aria-label', 'Three-dimensional view of the brain surfaces listed under Regions. Drag, or use the arrow keys, to rotate.'); cvs.tabIndex = 0;
  const dark = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim().startsWith('#0');
  const scene = new THREE.Scene(); dress(THREE, renderer, scene);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 4000);
  const dl = new THREE.DirectionalLight(0xffffff, 1.2); dl.position.set(1, 2, 3); camera.add(dl); scene.add(camera);
  const group = new THREE.Group(), dyn = new THREE.Group(); scene.add(group); group.add(dyn);
  const map = mapFor(S.view.up || '+z');
  const geom = (v, faces) => { const pos = new Float32Array(v.length); for (let i = 0; i < v.length; i += 3) { const p = map(v[i], v[i + 1], v[i + 2]); pos[i] = p[0]; pos[i + 1] = p[1]; pos[i + 2] = p[2]; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(faces); g.computeVertexNormals(); return g; };
  const objs = [], box = new THREE.Box3();
  meshes.forEach(m => {
    const g = geom(m.vertices, m.faces), shell = m.id === 0 || m.id === 997 || /^(whole brain|root|labelled brain)/i.test(m.name);
    const mat = shell ? new THREE.MeshStandardMaterial({color: dark ? 0xcfd4d9 : 0x8b9197, roughness: .5, metalness: 0, transparent: true, opacity: dark ? .2 : .24, depthWrite: false})
      : new THREE.MeshStandardMaterial({color: m.color || '#cccccc', roughness: .45, metalness: 0, side: THREE.DoubleSide});
    const mesh = new THREE.Mesh(g, mat); mesh.userData = {m, shell}; mesh.renderOrder = shell ? 3 : 2; group.add(mesh); objs.push(mesh);
    g.computeBoundingBox(); box.union(g.boundingBox);
  });
  const c = box.getCenter(new THREE.Vector3()), R = box.getSize(new THREE.Vector3()).length() / 2;
  group.position.sub(c);
  const dist = R / Math.sin(camera.fov / 2 * Math.PI / 180) * .85;
  const controls = new OrbitControls(camera, cvs); Object.assign(controls, {enableDamping: true, dampingFactor: .08, minDistance: dist * .2, maxDistance: dist * 2.5}); controls.target.set(0, 0, 0);
  // the page keeps the scroll wheel unless Ctrl or the Command key is held
  host.addEventListener('wheel', e => { if (!e.ctrlKey && !e.metaKey) e.stopPropagation(); }, {capture: true});
  cvs.addEventListener('keydown', e => { const k = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[e.key]; if (!k) return; e.preventDefault();
    const sph = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target)); sph.theta += k[0] * .14; sph.phi = Math.max(.05, Math.min(Math.PI - .05, sph.phi + k[1] * .14)); camera.position.setFromSpherical(sph).add(controls.target); syncURL(); });

  // view directions, from the axis labels of the source volume where the source states them
  const unit = (ax, sign) => new THREE.Vector3(...map(...[0, 1, 2].map(k => k === ax ? sign : 0)));
  const toward = letters => { const e = S.view.ends; if (!e) return null; for (const [ax, k] of [['x', 0], ['y', 1], ['z', 2]]) { const i = (e[ax] || []).findIndex(l => letters.includes(l)); if (i >= 0) return unit(k, i === 0 ? -1 : 1); } return null; };
  const up3 = new THREE.Vector3(0, 1, 0), home = new THREE.Vector3(.62, .3, .72).normalize();
  const views = [['Oblique', home]];
  const lat = toward(['L']), ant = toward(['A']), dor = toward(['D', 'S']);
  if (lat && ant && dor) views.push(['Left', lat], ['Anterior', ant], ['Dorsal', dor.clone().multiplyScalar(.999).addScaledVector(ant, -.04)]);
  else views.push(['Along X', unit(0, 1)], ['Along Y', unit(1, 1)], ['Along Z', unit(2, 1).multiplyScalar(.999).add(new THREE.Vector3(.02, 0, .03))]);
  const setView = d => { const v = d.clone().normalize(); if (Math.abs(v.dot(up3)) > .9995) v.add(new THREE.Vector3(0, 0, .03)).normalize(); camera.position.copy(v.multiplyScalar(dist)); controls.target.set(0, 0, 0); controls.update(); syncURL(); };
  $('#av-views').innerHTML = views.map((v, i) => `<button type="button" data-v="${i}">${v[0]}</button>`).join('');
  $$('#av-views button').forEach(b => b.onclick = () => setView(views[+b.dataset.v][1]));
  const cam0 = (new URLSearchParams(location.hash.split('?')[1] || '').get('cam') || '').split(',').map(Number);
  if (cam0.length === 3 && cam0.every(Number.isFinite) && Math.hypot(...cam0) > 0) camera.position.set(...cam0); else camera.position.copy(home.clone().multiplyScalar(dist));
  controls.addEventListener('end', syncURL);

  const scaleEl = $('#av-scale'), showScale = S.meta.unit !== 'voxel' && S.id !== 'honeybee'; scaleEl.hidden = !showScale;
  const nice = mm => [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50].reduce((a, b) => Math.abs(b - mm) < Math.abs(a - mm) ? b : a);
  let H = 1;
  const resize = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; H = h; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(host); resize();
  const loop = () => { if (S !== mine || !host.isConnected) { renderer.dispose(); return; } mine.three.raf = requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera);
    if (showScale) { const mmPerPx = 2 * camera.position.distanceTo(controls.target) * Math.tan(camera.fov / 2 * Math.PI / 180) / H, bar = nice(mmPerPx * 90); scaleEl.firstChild.style.width = (bar / mmPerPx) + 'px'; scaleEl.lastChild.textContent = bar + ' mm'; } };
  S.three = {renderer, scene, camera, controls, objs, dyn, geom, resize, raf: 0, THREE, cache: new Map()};
  loop();
  // picking
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let down = null;
  cvs.addEventListener('pointerdown', e => down = [e.clientX, e.clientY]);
  cvs.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 4) return;
    const r = cvs.getBoundingClientRect(); ptr.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ptr, camera); const hit = ray.intersectObjects(objs.filter(o => o.visible && !o.userData.shell))[0];
    if (!hit) return; const m = hit.object.userData.m, reg = S.regions.find(r => r.source_id === m.id);
    if (reg) selectRegion(reg.index === S.sel ? 0 : reg.index, true); else { S.pick = S.pick === m.id ? null : m.id; selectRegion(0, false); }
  });
  const note = $('#av-mesh-note'), n = meshes.length;
  note.innerHTML = `<span id="av-mesh-sel"></span>${S.meta.mesh_note ? S.esc(S.meta.mesh_note) : S.id === 'zebra-finch' ? 'Marching-cubes surfaces of the source masks, without smoothing.' : S.id === 'house-mouse' ? 'Allen-provided structure meshes, decimated for display.' : S.id === 'honeybee' ? 'InsectBrainDB display meshes (Honeybee Standard Brain).' : 'Marching-cubes surfaces of the atlas labels, decimated for display.'}${S.lab ? ' The surface of any other region is computed in the browser from its label voxels when the region is selected.' : ''}
    <details class="data-table"><summary>Show or hide the ${n} packaged surfaces</summary><div style="columns:2;font-size:.86rem;margin-top:.4rem">${meshes.map((m, i) => `<label style="display:block"><input type="checkbox" data-mesh="${i}" checked> ${S.esc(nice2(m.name))}</label>`).join('')}</div></details>`;
  $$('[data-mesh]', note).forEach(cb => cb.onchange = () => { const o = objs[+cb.dataset.mesh]; o.userData.show = cb.checked; o.visible = cb.checked && o.userData.on !== false; });
  highlightMesh();
}
const nice2 = n => /^root$/i.test(n) ? 'Whole brain' : n;
function highlightMesh() {
  const T = S.three; if (!T) return;
  const reg = S.regions.length ? S.byIndex.get(S.sel) : null;
  let target = reg ? reg.source_id : (S.regions.length ? null : S.sel || null);
  if (target == null && S.pick != null) target = S.pick;
  const packaged = target != null && T.objs.some(o => o.userData.m.id === target && !o.userData.shell);
  T.dyn.clear();
  let built = false, empty = false;
  if (reg && !packaged && S.lab) {
    if (!T.cache.has(reg.index)) T.cache.set(reg.index, regionSurface(reg.index));
    const s = T.cache.get(reg.index);
    if (s && s.faces.length) { const mesh = new T.THREE.Mesh(T.geom(s.vertices, s.faces), new T.THREE.MeshStandardMaterial({color: reg.color || '#cccccc', roughness: .45, metalness: 0, side: T.THREE.DoubleSide})); mesh.renderOrder = 2; T.dyn.add(mesh); built = true; } else empty = true;
  }
  const any = packaged || built;
  T.objs.forEach(o => { if (o.userData.shell) return; const on = !any || (packaged && o.userData.m.id === target); o.userData.on = on; o.visible = on && o.userData.show !== false; });
  const name = reg?.name || T.objs.find(o => o.userData.m.id === target)?.userData.m.name;
  $('#av-mesh-sel').textContent = !name ? '' : built ? `${name}: surface computed from the label voxels. ` : empty ? `${name}: no voxels carry this label at the display resolution. ` : `${nice2(name)}. `;
}

// ------------------------------------------------------------------ shareable state
let urlTimer = 0;
function syncURL() {
  clearTimeout(urlTimer); const mine = S;
  urlTimer = setTimeout(() => { if (S !== mine || !location.hash.startsWith('#atlas/' + S.id)) return; const q = new URLSearchParams();
    if (S.sel) q.set('r', S.sel); if (S.cur) q.set('c', S.cur.join(','));
    if (S.three) q.set('cam', S.three.camera.position.toArray().map(v => +v.toPrecision(4)).join(','));
    const s = q.toString().replace(/%2C/g, ','); history.replaceState(null, '', `#atlas/${S.id}${s ? '?' + s : ''}`); }, 250);
}
