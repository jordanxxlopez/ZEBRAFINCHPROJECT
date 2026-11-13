// Interactive instruments built from real data. Each export mounts into a host element.
import {decode, bandSpectrogram, gammatone, paintMatrix, dbNormalise, normaliseMax, magma, diverging, stftPower, makePlayer, PLAY_ICON, PAUSE_ICON} from './dsp.js?v=20261117a';

const V = '20261117a';
const getJSON = (() => { const c = new Map(); return p => { if (!c.has(p)) c.set(p, fetch(`${p}?v=${V}`).then(r => { if (!r.ok) throw Error(`Could not load ${p}`); return r.json(); })); return c.get(p); }; })();
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const $ = (s, el) => el.querySelector(s);

const track = (cls, h, label) => `<div class="track"><div class="tl">${label}</div><div class="yax" data-y="${cls}"><span></span><em></em><span></span></div><div class="plot"><canvas class="${cls}" height="${h}"></canvas><div class="ph"></div></div></div>`;
const setY = (host, cls, top, unit, bottom) => { const y = host.querySelector(`[data-y="${cls}"]`); if (!y) return; y.children[0].textContent = top; y.children[1].textContent = unit; y.children[2].textContent = bottom; };
export function xAxis(dur) {
  const ms = dur < 1, D = ms ? dur * 1000 : dur, raw = D / 5, p = 10 ** Math.floor(Math.log10(raw)), step = [1, 2, 5, 10].find(m => m * p >= raw) * p, ticks = [];
  for (let t = 0; t <= D + 1e-9; t += step) ticks.push(+t.toFixed(6));
  return `<div class="xax"><div>${ticks.map(t => `<span style="left:${(t / D * 100).toFixed(2)}%">${t}</span>`).join('')}</div><em>Time (${ms ? 'ms' : 's'})</em></div>`;
}
const cbar = (lo, hi, label, fn) => `<div class="cbar"><span>${lo}</span><i${fn ? ` style="background:linear-gradient(to right,${Array.from({length: 9}, (_, i) => `rgb(${fn(-1 + i / 4).map(v => v | 0).join(',')})`).join(',')})"` : ' class="magma"'}></i><span>${hi}</span><em>${label}</em></div>`;
const khz = f => String(+(f / 1000).toFixed(f < 1000 ? 2 : 1));
function playButton(audio) {
  const b = document.createElement('button'); b.className = 'play'; b.type = 'button';
  const set = () => { b.innerHTML = (audio.paused ? PLAY_ICON + 'Play' : PAUSE_ICON + 'Pause'); b.setAttribute('aria-label', audio.paused ? 'Play' : 'Pause'); };
  audio.addEventListener('play', set); audio.addEventListener('pause', set); audio.addEventListener('ended', set); set();
  b.onclick = () => audio.paused ? audio.play().catch(() => {}) : audio.pause();
  return b;
}
function bindTrackSeek(tracks, audio) {
  for (const t of tracks) t.addEventListener('click', e => { const r = t.getBoundingClientRect(); if (audio.duration) { audio.currentTime = (e.clientX - r.left) / r.width * audio.duration; audio.play().catch(() => {}); } });
}

// ------------------------------------------------------------------ 1. The ear: spectrogram vs gammatone filterbank
export const EAR_SOUNDS = [
  {id: 'finch', label: 'Zebra finch song', url: 'assets/models/zebra-finch/B189.wav', range: [200, 7000], note: 'Filters span 0.2–7 kHz.'},
  {id: 'marmoset', label: 'Marmoset phee call', url: 'assets/sound/common-marmoset/phee_223119.wav', range: [200, 16000], note: 'Filters span the recording bandwidth.'},
  {id: 'bat', label: 'Fruit bat social call', url: 'assets/sound/egyptian-fruit-bat/social1-48k.wav', range: [200, 20000], note: 'Filters span the recording bandwidth.'},
  {id: 'mouse', label: 'Mouse USVs, 1/16 speed', url: 'assets/sound/house-mouse/usv-0184_85s-te16.wav', range: [500, 9000], note: 'Recording at 1/16 speed; frequencies divided by 16.'},
  {id: 'bee', label: 'Honeybee waggle-run sound', url: 'assets/sound/honeybee/waggle-run-1.wav', range: [50, 4000], note: 'Filters span the recording bandwidth.'},
];
export async function mountEar(host, {initial = 'finch'} = {}) {
  host.innerHTML = `<div class="inst">
    <div class="inst-bar"><span class="title">Cochlear filterbank model</span>
      <div class="ctl"><label class="vh" for="ear-src">Sound</label><select id="ear-src">${EAR_SOUNDS.map(s => `<option value="${s.id}">${s.label}</option>`).join('')}</select></div></div>
    <div class="inst-body">
      ${track('t-spec', 120, 'Spectrogram, 96 log-spaced bands')}${cbar('−70', '0', 'dB relative to the loudest point')}
      ${track('t-coch', 120, 'Gammatone filterbank output, 48 channels')}<div data-x></div>${cbar('0', 'max', 'envelope, cube-root compressed; clipped at the 99.5th percentile')}
      <div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap;margin-top:.6rem"><span class="pb"></span><span class="small" style="color:var(--ink-3)" data-note></span></div>
    </div>
    <div class="inst-foot"><span>Gammatone filterbank (Holdsworth et al. 1988); bandwidths after Glasberg &amp; Moore (1990). Envelopes cube-root compressed. Computed from the original recording.</span></div></div>`;
  const audio = new Audio(); audio.preload = 'auto';
  $('.pb', host).appendChild(playButton(audio));
  const phs = host.querySelectorAll('.ph');
  makePlayer(audio, f => phs.forEach(p => p.style.left = (f * 100) + '%'));
  bindTrackSeek(host.querySelectorAll('.plot'), audio);
  const sel = $('#ear-src', host); sel.value = initial;
  const run = async () => {
    const s = EAR_SOUNDS.find(e => e.id === sel.value); audio.src = s.url + '?v=' + V; $('[data-note]', host).textContent = s.note;
    const {x, sr} = await decode(s.url);
    const top = Math.min(s.range[1], sr / 2 * 0.95);
    setY(host, 't-spec', khz(top), 'kHz, log', khz(s.range[0])); setY(host, 't-coch', khz(top), 'kHz, ERB', khz(s.range[0])); $('[data-x]', host).innerHTML = xAxis(x.length / sr);
    const sp = bandSpectrogram(x, sr, {fmin: s.range[0], fmax: top, nbands: 96});
    paintMatrix($('.t-spec', host), dbNormalise(sp.M, 70));
    const g = gammatone(x, sr, {fmin: s.range[0], fmax: top, n: 48});
    { const flat = g.M.flatMap(r => Array.from(r)).sort((a, b) => a - b), p99 = flat[Math.floor(flat.length * .995)] || 1; paintMatrix($('.t-coch', host), g.M.map(r => Array.from(r, v => Math.min(1, v / p99))), magma); }
  };
  sel.onchange = run; await run();
}

// ------------------------------------------------------------------ 2. Auditory neurons: STRF models fitted to real spikes
export async function mountSTRF(host) {
  const d = await getJSON('data/models/zebra-finch/strf.json');
  const songs = Object.keys(d.songs);
  const areaName = {FL: 'Field L (primary)', CM: 'CM (secondary)', NCM: 'NCM (secondary)'};
  host.innerHTML = `<div class="inst">
    <div class="inst-bar"><span class="title">Single-unit responses and receptive-field predictions</span>
      <div class="ctl">
        <label class="vh" for="sn">Neuron</label><select id="sn">${['FL', 'CM', 'NCM'].map(a => `<optgroup label="${areaName[a]}">${d.examples.filter(e => e.area === a).map(e => `<option value="${e.id}">${a} · neuron ${e.id.split('_').slice(-1)[0].replace('c', '#')} (bird ${e.bird})</option>`).join('')}</optgroup>`).join('')}</select>
        <label class="vh" for="ss">Song</label><select id="ss">${songs.map((s, i) => `<option value="${s}">Song ${i + 1} (bird ${s})</option>`).join('')}</select>
      </div></div>
    <div class="inst-body strf-grid">
      <div>
        ${track('t-spec', 100, 'Song spectrogram')}${cbar('−70', '0', 'dB relative to the loudest point')}
        ${track('t-raster', 90, 'Spikes')}
        ${track('t-rate', 110, 'Firing rate')}<div data-x></div>
        <div class="legend"><span><i style="background:#fff;outline:1px solid var(--ink-3)"></i>Measured, trial average</span><span><i style="background:var(--accent)"></i>STRF prediction, song held out of fitting</span></div>
        <div style="display:flex;gap:1.4rem;align-items:center;flex-wrap:wrap;margin-top:.8rem"><span class="pb"></span>
          <span class="stat"><b data-r>–</b><span>r, this song</span></span>
          <span class="stat"><b data-rall>–</b><span>mean r, 8 held-out songs</span></span>
          <span class="stat"><b data-rel>–</b><span>split-half reliability</span></span></div>
      </div>
      <div class="strf-side">
        <p class="small" style="margin:0 0 .35rem;color:var(--ink-3)">RECEPTIVE FIELD</p>
        <canvas class="t-strf" width="20" height="24" style="aspect-ratio:1/1.1"></canvas>
        <div class="axis"><span>0 ms</span><span>delay</span><span>95</span></div>
        ${cbar('−', '+', 'weight, scaled to the largest absolute value', diverging)}
        <p class="small" style="margin:.5rem 0 0;color:var(--ink-3)">Red, excitatory; blue, suppressive. Vertical axis: frequency, 0.5 kHz (bottom) to 8 kHz (top), log-spaced.</p>
      </div>
    </div>
    <div class="inst-foot"><span>Data: Le, Bjoring &amp; Meliza, anaesthetised zebra finches, single units (<a href="https://doi.org/10.6084/m9.figshare.29203457">figshare, CC BY 4.0</a>). Model: linear spectro-temporal receptive field, ridge regression, leave-one-song-out.</span><a href="#research/finch-strf">Model report, ${d.units_fitted} neurons</a></div></div>`;
  const audio = new Audio(); audio.preload = 'auto';
  $('.pb', host).appendChild(playButton(audio));
  const phs = host.querySelectorAll('.ph');
  makePlayer(audio, f => phs.forEach(p => p.style.left = (f * 100) + '%'));
  bindTrackSeek(host.querySelectorAll('.plot'), audio);
  const draw = () => {
    const e = d.examples.find(x => x.id === $('#sn', host).value), s = $('#ss', host).value, song = d.songs[s];
    audio.src = song.audio + '?v=' + V;
    const img = new Image(); img.onload = () => { const c = $('.t-spec', host); c.width = img.width; c.height = 100; c.getContext('2d').drawImage(img, 0, 0, img.width, 100); }; img.src = song.spec + '?v=' + V;
    const dur = song.dur;
    // raster
    const cr = $('.t-raster', host), W = 800; cr.width = W; cr.height = 90; const g = cr.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, W, 90);
    const trials = e.rasters[s] || []; g.fillStyle = '#e9edf0';
    trials.forEach((tr, i) => tr.forEach(t => { if (t >= 0 && t <= dur) g.fillRect(t / dur * W, 4 + i * 8.4, 1.6, 6.5); }));
    // rates
    const real = e.psth[s] || [], pred = e.pred[s] || [], cv = $('.t-rate', host); cv.width = W; cv.height = 110; const h = cv.getContext('2d'); h.fillStyle = '#000'; h.fillRect(0, 0, W, 110);
    const mx = Math.max(1, ...real, ...pred), n = real.length;
    const line = (arr, col, lw) => { h.strokeStyle = col; h.lineWidth = lw; h.beginPath(); arr.forEach((v, i) => { const X = i / (n - 1) * W, Y = 104 - v / mx * 96; i ? h.lineTo(X, Y) : h.moveTo(X, Y); }); h.stroke(); };
    line(real, '#ffffff', 1.6); line(pred, getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#c4532d', 2);
    setY(host, 't-spec', '8', 'kHz, log', '0.5'); setY(host, 't-raster', '1', 'trial', String(trials.length || '')); setY(host, 't-rate', String(Math.round(mx)), 'spikes/s', '0'); $('[data-x]', host).innerHTML = xAxis(dur);
    const si = songs.indexOf(s);
    $('[data-r]', host).textContent = e.r_songs[si] != null ? e.r_songs[si].toFixed(2) : '–';
    $('[data-rall]', host).textContent = e.r.toFixed(2);
    $('[data-rel]', host).textContent = e.reliability.toFixed(2);
    // STRF
    const S = e.strf, mxs = Math.max(...S.flat().map(Math.abs)) || 1;
    paintMatrix($('.t-strf', host), S.map(row => row.map(v => v / mxs)), diverging);
  };
  $('#sn', host).onchange = draw; $('#ss', host).onchange = draw; draw();
  return d;
}

// ------------------------------------------------------------------ 3. RA during singing
export async function mountRA(host) {
  const d = await getJSON('data/models/zebra-finch/ra.json');
  host.innerHTML = `<div class="inst">
    <div class="inst-bar"><span class="title">RA population activity during song</span><span class="pb"></span></div>
    <div class="inst-body">
      ${track('t-spec', 110, 'Song spectrogram, two motifs')}${cbar('−70', '0', 'dB relative to the loudest point')}
      ${track('t-ras', 260, 'Threshold crossings at 85 recording sites in RA, 20 ms bins')}${cbar('−1', '+2.5', 'activity, z-scored per site')}
      ${track('t-pop', 70, 'Threshold crossings summed over sites')}<div data-x></div>
      <p class="small muted" style="margin:.6rem 0 0">Correlation of summed activity between the two motifs: r = ${d.motif_consistency.population_r} (${d.motif_consistency.bin_s * 1000} ms bins); 95th percentile of ${d.motif_consistency.shuffle_n} circular shifts: ${d.motif_consistency.shuffle_p95}.</p>
    </div>
    <div class="inst-foot"><span>Data: FALCON B1, Neuropixels in RA of a singing zebra finch (<a href="https://dandiarchive.org/dandiset/001046">DANDI 001046</a>, CC BY 4.0). Unsorted threshold crossings, rows ordered by time of peak activity.</span></div></div>`;
  const audio = new Audio(d.audio + '?v=' + V); audio.preload = 'auto';
  $('.pb', host).appendChild(playButton(audio));
  const phs = host.querySelectorAll('.ph'); makePlayer(audio, f => phs.forEach(p => p.style.left = (f * 100) + '%'));
  bindTrackSeek(host.querySelectorAll('.plot'), audio);
  { const im = new Image(); im.onload = () => { const cs = $(".t-spec", host); cs.width = 900; cs.height = 110; cs.getContext("2d").drawImage(im, 0, 0, 900, 110); }; im.src = d.spec + "?v=" + V; }
  const W = 900, c = $('.t-ras', host), NB = 90, bw = d.duration / NB; c.width = NB; c.height = d.spikes.length;
  const g = c.getContext('2d'), img = g.createImageData(NB, d.spikes.length), bins = new Float32Array(W / 4);
  d.spikes.forEach((row, i) => { const hh = new Float32Array(NB); row.forEach(t => { hh[Math.min(NB - 1, Math.floor(t / bw))]++; bins[Math.min(bins.length - 1, Math.floor(t / d.duration * W / 4))]++; });
    const m = hh.reduce((x, y) => x + y, 0) / NB, sd = Math.sqrt(hh.reduce((x, y) => x + (y - m) ** 2, 0) / NB) || 1;
    hh.forEach((v, j) => { const z = Math.max(0, Math.min(1, ((v - m) / sd + 1) / 3.5)), [R, G, B] = magma(z), o = (i * NB + j) * 4; img.data[o] = R; img.data[o + 1] = G; img.data[o + 2] = B; img.data[o + 3] = 255; }); });
  g.putImageData(img, 0, 0); c.style.height = '260px'; c.style.width = '100%'; c.style.imageRendering = 'pixelated';
  const p = $('.t-pop', host); p.width = W; p.height = 70; const h = p.getContext('2d'); h.fillStyle = '#000'; h.fillRect(0, 0, W, 70);
  const sm = Array.from(bins, (_, i) => (bins[i - 1] || 0) * .25 + bins[i] * .5 + (bins[i + 1] || 0) * .25), mx = Math.max(...sm);
  h.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#c4532d';
  sm.forEach((v, i) => { const H = v / mx * 64; h.fillRect(i * 4, 70 - H, 3, H); });
  setY(host, 't-spec', '10', 'kHz', '0'); setY(host, 't-ras', '1', 'site', String(d.spikes.length)); setY(host, 't-pop', String(Math.round(mx)), `per ${Math.round(d.duration / bins.length * 1000)} ms`, '0'); $('[data-x]', host).innerHTML = xAxis(d.duration);
}

// ------------------------------------------------------------------ 4. Reconstructed neurons (NeuroMorpho)
let THREEP = null;
const loadThree = () => (THREEP ||= Promise.all([import('three'), import('../assets/OrbitControls.js')]));
function makeScene(hostEl) {
  return loadThree().then(([THREE, {OrbitControls}]) => {
    const renderer = new THREE.WebGLRenderer({antialias: true}); renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    hostEl.prepend(renderer.domElement); renderer.domElement.tabIndex = 0;
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#05070a');
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100000); scene.add(camera);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.1)); const dl = new THREE.DirectionalLight(0xffffff, 1.3); dl.position.set(1, 2, 3); camera.add(dl);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true;
    const resize = () => { const w = hostEl.clientWidth, h = hostEl.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    new ResizeObserver(resize).observe(hostEl); resize();
    let alive = true; const loop = () => { if (!alive || !hostEl.isConnected) { renderer.dispose(); return; } requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); }; loop();
    return {THREE, renderer, scene, camera, controls, frame(obj, k = 1.25) { const b = new THREE.Box3().setFromObject(obj), c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3()).length(); obj.position.sub(c); camera.position.set(0, 0, s * k); controls.target.set(0, 0, 0); camera.near = s / 1000; camera.far = s * 20; camera.updateProjectionMatrix(); }};
  });
}
export async function mountNeurons(host, {species = 'zebra-finch'} = {}) {
  const d = await getJSON('data/models/neurons.json');
  const list = d.neurons.filter(n => n.species === species);
  const label = n => { const ct = n.cell_type.join(' '); if (/arcopallium- and area X-projecting/.test(ct)) return 'HVC neuron projecting to RA and Area X'; if (/Area X-projecting/.test(ct) && !/robust/.test(ct)) return 'HVC → Area X neuron'; if (/robust nucleus of the arcopallium projecting/.test(ct)) return 'HVC → RA neuron'; if (/phasic/.test(ct)) return 'CM neuron, phasic firing'; if (/tonic/.test(ct)) return 'CM neuron, tonic firing'; if (/intermediate/.test(ct)) return 'CM neuron, intermediate firing'; if (/Fast-spiking/.test(ct)) return 'CM interneuron, fast-spiking'; if (/stellate/.test(ct)) return 'Inferior colliculus stellate neuron'; if (n.archive === 'Meliza') return 'CM principal cell (firing type not reported)'; return n.cell_type[0]; };
  const ORDER = ['HVC → RA neuron', 'HVC → Area X neuron', 'HVC neuron projecting to RA and Area X', 'CM neuron, phasic firing', 'CM neuron, tonic firing', 'CM neuron, intermediate firing', 'CM interneuron, fast-spiking'];
  const groups = {}; [...list].sort((a, b) => ((ORDER.indexOf(label(a)) + 99) % 99) - ((ORDER.indexOf(label(b)) + 99) % 99)).forEach(n => (groups[label(n)] ||= []).push(n));
  host.innerHTML = `<div class="inst">
    <div class="inst-bar"><span class="title">Reconstructed neurons</span>
      <div class="ctl"><label class="vh" for="nn">Neuron</label><select id="nn">${Object.entries(groups).map(([k, v]) => `<optgroup label="${esc(k)} (${v.length})">${v.map((n, i) => `<option value="${esc(n.name)}">${esc(k)} ${i + 1}</option>`).join('')}</optgroup>`).join('')}</select></div></div>
    <div class="three-host"><span class="hint">Drag to rotate; scroll or pinch to zoom</span><div class="hud" data-hud></div></div>
    <div class="inst-foot"><span>Reconstructions from <a href="https://neuromorpho.org">NeuroMorpho.org</a> (standardised CNG versions). <span style="color:#e9edf0">■</span> dendrites · <span style="color:#f08a5d">■</span> axon · <span style="color:#7fc8ff">■</span> soma</span></div></div>`;
  const S = await makeScene($('.three-host', host));
  let obj = null;
  const show = async () => {
    const meta = list.find(x => x.name === $('#nn', host).value); const n = {...meta, ...(await getJSON(meta.file))};
    if (obj) { S.scene.remove(obj); obj.geometry.dispose(); }
    const pos = new Float32Array(n.segments), col = new Float32Array(n.segments.length);
    const C = {1: [.5, .78, 1], 2: [.94, .54, .36], 3: [.91, .93, .94], 4: [.8, .85, .95]};
    n.types.forEach((t, i) => { const c = C[t] || C[3]; for (let k = 0; k < 2; k++) col.set(c, i * 6 + k * 3); });
    const g = new S.THREE.BufferGeometry(); g.setAttribute('position', new S.THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new S.THREE.BufferAttribute(col, 3));
    let len = 0; for (let i = 0; i < n.segments.length; i += 6) len += Math.hypot(n.segments[i + 3] - n.segments[i], n.segments[i + 4] - n.segments[i + 1], n.segments[i + 5] - n.segments[i + 2]);
    obj = new S.THREE.LineSegments(g, new S.THREE.LineBasicMaterial({vertexColors: true})); S.scene.add(obj); S.frame(obj, 1.1);
    $('[data-hud]', host).innerHTML = `<b>${esc(label(n))}</b><br><span style="color:var(--ink-3)">${esc(n.region.join(' › '))}</span><br>Traced length ≈ ${Math.round(len).toLocaleString()} µm<br><a href="${esc(n.page)}">NeuroMorpho record <span class="mono">${esc(n.name)}</span></a>${n.doi ? ` · <a href="https://doi.org/${esc(n.doi[0] || n.doi)}">original paper</a>` : ''}`;
  };
  $('#nn', host).onchange = show; show();
}

// ------------------------------------------------------------------ 5. The pathway on real anatomy (finch MRI atlas surfaces)
export async function mountPathway(host, steps) {
  const [{createSpecimen}, {FINCH_PARTS, FINCH_GROUPS}, meshes] = await Promise.all([import('./viewer3d.js?v=20261117a'), import('./chapters.js?v=20261117a'), getJSON('data/models/finch-hero.json')]);
  host.innerHTML = `<figure class="plate"><div class="plate-view" style="height:min(64vh,540px)"></div><figcaption>Zebra finch brain from the 3D MRI atlas of Poirier et al. (2008). Surfaces are marching-cubes meshes of the authors' masks. The ear, brainstem auditory nuclei, CM and NCM are not delineated in this atlas. <a href="#lab/zebra-finch">Open the full atlas</a></figcaption></figure>`;
  const v = await createSpecimen(host.querySelector('.plate-view'), {meshes, up: '+z', shell: 'Whole brain', parts: FINCH_PARTS, groups: FINCH_GROUPS, caption: 'Choose a step on the left, or a label.'});
  return name => v.select(name);
}
