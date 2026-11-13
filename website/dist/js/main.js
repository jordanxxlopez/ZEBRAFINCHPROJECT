import {SPECIES, REFS as BASEREFS, ATLASES, REVIEWS, VERDICTS} from './content.js?v=20261113b';
import {NEWREFS, HOOKS, ACCENT, FINCH, OTHER, FINCH_PARTS, FINCH_GROUPS} from './chapters.js?v=20261113b';
import * as charts from './charts.js?v=20261113b';
import * as M from './models.js?v=20261113b';

const V = '20261113b';
const REFS = {...BASEREFS, ...NEWREFS};
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const cache = new Map();
const getJSON = p => { if (!cache.has(p)) cache.set(p, fetch(`${p}?v=${V}`).then(r => { if (!r.ok) throw Error(`Could not load ${p} (${r.status})`); return r.json(); })); return cache.get(p); };
const fmt = n => Number(n).toLocaleString('en-US');
const SP = Object.fromEntries(SPECIES.map(s => [s.id, s]));
// Atlas-only species shown in the Brain lab (no chapter yet)
const LAB_EXTRA = [
  {id: 'eurasian-blackcap', common: 'Eurasian blackcap', latin: 'Sylvia atricapilla', group: 'Songbird', kind: '25 µm template, 44 labelled regions including the song nuclei HVC, RA and Area X'},
  {id: 'european-starling', common: 'European starling', latin: 'Sturnus vulgaris', group: 'Songbird', kind: 'MRI atlas with delineated song-control and auditory nuclei'},
  {id: 'norway-rat', common: 'Norway rat', latin: 'Rattus norvegicus', group: 'Rodent', kind: 'Waxholm Space MRI atlas of the Sprague Dawley rat'},
  {id: 'prairie-vole', common: 'Prairie vole', latin: 'Microtus ochrogaster', group: 'Rodent', kind: '25 µm template with Allen-style annotation, 628 regions at display resolution'},
  {id: 'domestic-cat', common: 'Domestic cat', latin: 'Felis catus', group: 'Carnivore', kind: 'MRI template with cortical and subcortical labels'},
];
const LAB = Object.fromEntries([...SPECIES, ...LAB_EXTRA].map(s => [s.id, s]));
const hasAtlas = id => ATLASES[id] ? ATLASES[id].status === 'available' : !!LAB[id];
const chip = (v, label) => `<span class="chip ${esc(v)}">${esc(label ?? VERDICTS[v]?.label ?? v)}</span>`;
const main = $('#main');

// ------------------------------------------------------------------ citations: [[key]] -> numbered pop-up
function cited(text, list) {
  return esc(text).replace(/\s*\[\[(\w+)\]\]/g, (_, k) => { if (!REFS[k]) return ''; if (!list.includes(k)) list.push(k); const n = list.indexOf(k) + 1; return `<sup class="cite"><a href="#" data-ref="${k}" aria-label="Reference ${n}">${n}</a></sup>`; });
}
const refItem = k => { const r = REFS[k]; return `${esc(r.cite)} ${r.doi ? `<a href="https://doi.org/${esc(r.doi)}">doi:${esc(r.doi)}</a>` : r.url ? `<a href="${esc(r.url)}">${esc(r.url)}</a>` : ''}`; };
let pop = null;
document.addEventListener('click', e => {
  const a = e.target.closest('[data-ref]');
  pop?.remove(); pop = null;
  if (!a) return;
  e.preventDefault();
  pop = document.createElement('div'); pop.className = 'cite-pop'; pop.setAttribute('role', 'dialog'); pop.innerHTML = refItem(a.dataset.ref);
  document.body.appendChild(pop);
  const r = a.getBoundingClientRect(); pop.style.top = (scrollY + r.bottom + 6) + 'px'; pop.style.left = Math.max(10, Math.min(innerWidth - 400, r.left - 20)) + 'px';
});

// ------------------------------------------------------------------ settings, menu, search
const KEYS = ['theme', 'size', 'contrast', 'motion'];
{
  const dlg = $('#settings'), form = $('#settings-form');
  let s = {}; try { s = JSON.parse(localStorage.getItem('acn-display') || '{}'); } catch {}
  for (const k of KEYS) { const r = form.querySelector(`input[name="${k}"][value="${s[k] || ''}"]`); if (r) r.checked = true; }
  form.addEventListener('change', () => { const n = {}; for (const k of KEYS) { n[k] = form.querySelector(`input[name="${k}"]:checked`)?.value || ''; if (n[k]) document.documentElement.dataset[k] = n[k]; else delete document.documentElement.dataset[k]; } try { localStorage.setItem('acn-display', JSON.stringify(n)); } catch {} });
  $('#open-settings').onclick = () => dlg.showModal(); $('#close-settings').onclick = () => dlg.close();
  $('#menu-btn').onclick = () => { const n = $('#nav'); n.classList.toggle('open'); $('#menu-btn').setAttribute('aria-expanded', n.classList.contains('open')); };
}
let INDEX = null;
async function buildIndex() {
  if (INDEX) return INDEX;
  const it = [];
  SPECIES.forEach(s => it.push({t: s.common, s: `${s.latin} · animal`, h: '#animals/' + s.id}));
  FINCH.steps.forEach(st => it.push({t: st.title, s: 'Zebra finch chapter', h: `#animals/zebra-finch/${st.id}`}));
  REVIEWS.forEach(r => it.push({t: r.title, s: `Research · ${SP[r.species].common}`, h: r.legacy ? '#' + r.id : '#research/' + r.id}));
  it.push({t: 'Receptive-field models of 531 finch neurons', s: 'Research · model', h: '#research/finch-strf'}, {t: 'Do finch neurons fill in missing syllables?', s: 'Research · claim check', h: '#research/finch-restoration'});
  const metas = (await Promise.all(Object.keys(LAB).filter(hasAtlas).map(k => getJSON(`data/atlas/${k}/meta.json`).then(m => [k, m]).catch(() => null)))).filter(Boolean);
  for (const [k, m] of metas) for (const r of m.regions || []) it.push({t: r.name + (r.hemisphere ? ` (${r.hemisphere.replace(':', '')})` : ''), s: `Brain region · ${LAB[k].common}${r.acronym && r.acronym !== r.name ? ' · ' + r.acronym : ''}`, h: `#lab/${k}?r=${r.index}`});
  (await loadSounds()).filter(s => s.species !== 'zebra-finch').forEach(s => it.push({t: s.title, s: `Sound · ${SP[s.species].common}`, h: '#listen/' + s.id}));
  INDEX = it.map(i => ({...i, k: (i.t + ' ' + i.s).toLowerCase()})); return INDEX;
}
{
  const box = $('#search'), input = $('#q'), res = $('#search-res'); let hits = [], sel = -1;
  const draw = () => { res.innerHTML = hits.map((h, i) => `<a href="${esc(h.h)}" role="option" aria-selected="${i === sel}">${esc(h.t)}<small>${esc(h.s)}</small></a>`).join('') || (input.value.length > 1 ? '<p class="small faint" style="padding:.4rem .6rem">No matches</p>' : ''); };
  $('#open-search').onclick = () => { box.hidden = !box.hidden; if (!box.hidden) { input.focus(); buildIndex(); } };
  input.oninput = async () => { const q = input.value.trim().toLowerCase(); if (q.length < 2) { hits = []; return draw(); } const ix = await buildIndex(); const w = q.split(/\s+/); hits = ix.filter(i => w.every(x => i.k.includes(x))).sort((a, b) => (b.t.toLowerCase().startsWith(q)) - (a.t.toLowerCase().startsWith(q))).slice(0, 12); sel = -1; draw(); };
  input.onkeydown = e => { if (e.key === 'ArrowDown') { sel = Math.min(hits.length - 1, sel + 1); draw(); e.preventDefault(); } else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); draw(); e.preventDefault(); } else if (e.key === 'Enter' && hits.length) { location.hash = hits[Math.max(0, sel)].h; box.hidden = true; } else if (e.key === 'Escape') box.hidden = true; };
  res.onclick = () => { box.hidden = true; };
  document.addEventListener('click', e => { if (!e.target.closest('#search,#open-search')) box.hidden = true; });
}

// ------------------------------------------------------------------ sounds (shared)
let SOUNDS = null;
async function loadSounds() {
  if (SOUNDS) return SOUNDS;
  const [finch, marine, specs, extra] = await Promise.all([getJSON('data/recordings.json'), getJSON('data/marine-recordings.json'), getJSON('data/spectrograms.json'), getJSON('data/sounds.json')]);
  const ls = n => { const s = specs[n]; return s ? {file: s.url, t1: s.time_end_seconds, f1: s.frequency_max_hz, db_range: Math.abs(s.level_range_db[0]), nperseg: s.fft_size, hop: s.hop_samples} : null; };
  SOUNDS = [...extra,
    ...marine.map(r => ({id: r.name, species: 'sperm-whale', title: r.name.replace(/_/g, ' '), kind: r.kind || 'Field recording', files: {original: r.url}, spectrogram: ls(r.name), source: {sample_rate: r.sample_rate, duration_s: r.duration_seconds, file: r.archive_member, sha256: r.sha256, url: r.source_url, licence: 'See source record', citation: r.context || ''}, playback: 'Original supplementary WAV, unchanged.'})),
    ...finch.map(r => ({id: r.name, species: 'zebra-finch', title: `Syllable ${r.name}`, kind: 'Song syllable', files: {original: r.url}, spectrogram: ls(r.name), source: {sample_rate: r.sample_rate, duration_s: r.duration_seconds, file: r.archive_member, sha256: r.sha256, url: 'https://doi.org/10.5281/zenodo.5545872', doi: '10.5281/zenodo.5545872', licence: 'See acquisition manifest', citation: 'ML4BL dataset; Zandberg et al. (2024) PLOS Computational Biology. doi:10.1371/journal.pcbi.1012329'}, playback: 'Original prepared WAV, unchanged.'}))];
  return SOUNDS;
}

// ------------------------------------------------------------------ router
const TITLE = 'Animal Communication & Neuroscience';
const LEGACY = {'zebra-finch': 'animals/zebra-finch', 'sperm-whale': 'animals/sperm-whale', species: 'animals', recordings: 'listen', sounds: 'listen', atlas: 'lab', review: 'research', studies: 'research/literature', methods: 'research/data', films: 'listen/video', 'data-registry': 'research/data', 'scale-audit': 'research/data', 'acoustic-method': 'research/data', 'quality-note': 'research/data'};
async function route() {
  let h = decodeURIComponent(location.hash.slice(1));
  if (h === 'main') return;
  const [raw] = h.split('?'); let parts = raw.split('/').filter(Boolean);
  if (parts[0] === 'species' && parts[1]) parts = ['animals', parts[1]];
  if (parts[0] === 'atlas' && parts[1]) parts = ['lab', parts[1]];
  if (parts[0] === 'sounds' && parts[1]) parts = ['listen', parts[1]];
  if (parts[0] === 'review' && parts[1]) parts = ['research', parts[1]];
  if (parts.length === 1 && LEGACY[parts[0]]) parts = LEGACY[parts[0]].split('/');
  const [page, a, b] = parts;
  $$('#nav a').forEach(x => x.hash === '#' + (page || 'home') ? x.setAttribute('aria-current', 'page') : x.removeAttribute('aria-current'));
  $('#nav').classList.remove('open');
  $$('audio,video').forEach(m => m.pause());
  document.documentElement.style.setProperty('--accent', page === 'animals' && a ? ACCENT[a] || '#c4532d' : '#c4532d');
  try {
    if (!page || page === 'home') await home();
    else if (page === 'animals' && a) await chapter(a, b);
    else if (page === 'animals') animals();
    else if (page === 'listen') await listen(a);
    else if (page === 'lab') await lab(a);
    else if (page === 'research') await research(a);
    else if (page === 'about') about();
    else if (['paper-hamaguchi', 'paper-sperm-whale', 'perception-model'].includes(page)) legacyReview(page);
    else await home();
  } catch (e) { console.error(e); main.innerHTML = `<div class="wrap" style="padding:3rem 0"><p class="notice">${esc(e.message)}</p></div>`; }
  if (!(page === 'animals' && b) && !(page === 'listen' && a)) window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
const setTitle = t => document.title = t ? `${t} · ${TITLE}` : TITLE;

// ------------------------------------------------------------------ HOME
async function home() {
  setTitle('');
  const sounds = await loadSounds();
  main.innerHTML = `
  <section class="home-top"><div class="wrap home-grid">
    <div class="home-text">
      <h1>How animals hear, call and learn</h1>
      <p class="lede">Recordings, brain atlases and models of real neurons for six species, built from data that researchers have shared openly.</p>
      <ul class="plain-links">
        <li><a href="#animals/zebra-finch">The zebra finch, from song to neurons</a></li>
        <li><a href="#lab">Ten brain atlases in 3D</a></li>
        <li><a href="#listen">${fmt(sounds.length)} recordings</a></li>
      </ul>
    </div>
    <figure class="plate">
      <div class="plate-view" id="home-brain"><p class="faint small" style="padding:1rem">Loading the brain…</p></div>
      <figcaption>Brain of a zebra finch, <i>Taeniopygia guttata</i>, from an MRI atlas (Poirier et al. 2008). Coloured structures process sound or produce song. Drag to turn it; choose a label to read about a structure. <span class="keys" id="home-keys"></span></figcaption>
    </figure>
  </div></section>

  <section class="band"><div class="wrap">
    <h2>A song, as the ear receives it</h2>
    <div class="sono-fig"><div class="hero-spec" id="hero-spec" role="button" tabindex="0" aria-label="Play a zebra finch song"><img src="assets/models/zebra-finch/R56.png?v=${V}" alt="Spectrogram of a zebra finch song: about one second, 0.5 to 8 kilohertz"><div class="ph"></div></div>
    <p class="figcap">One song of a male zebra finch, about one second long. Time runs left to right and pitch from 0.5 kHz at the bottom to 8 kHz at the top. Select the image to play it. Recording from Le, Bjoring &amp; Meliza (2025).</p></div>
  </div></section>

  <section class="band"><div class="wrap">
    <h2>Animals</h2>
    <ol class="sp-index">${SPECIES.map(s => `<li><a href="#animals/${s.id}"><img src="${esc(s.photo.src)}" alt="" loading="lazy"><span class="nm"><b>${esc(s.common)}</b><i>${esc(s.latin)}</i></span><span class="q">${esc(HOOKS[s.id])}</span><span class="has">${esc(s.signal)}</span></a></li>`).join('')}</ol>
  </div></section>

  <section class="band"><div class="wrap two-figs">
    <figure><a href="#animals/zebra-finch/listen"><canvas id="lc-strf" width="600" height="230" aria-hidden="true"></canvas></a><figcaption><b>What one neuron listens for.</b> The receptive field of an auditory neuron in Field L, fitted to its recorded spikes. Red marks pitches and delays that excite it; blue, those that suppress it. <a href="#animals/zebra-finch/listen">Play songs to 12 neurons</a></figcaption></figure>
    <figure><a href="#animals/zebra-finch/ear"><canvas id="lc-ear" width="600" height="230" aria-hidden="true"></canvas></a><figcaption><b>The same song after a model inner ear.</b> Forty filters split the sound into pitch channels, as hair cells do. <a href="#animals/zebra-finch/ear">Try it on other animals</a></figcaption></figure>
  </div></section>

  <section class="band"><div class="wrap">
    <h2>Checked against the data</h2>
    <p class="muted text">We recompute published numbers from the authors’ own files and say what could not be checked.</p>
    <ul class="storylist">${[{id: 'finch-restoration', species: 'zebra-finch', kind: 'Claim check', verdict: 'partial', title: 'Do finch neurons fill in missing syllables?', summary: 'An independent look at the gap responses in the open dataset behind a 2025 Nature Communications paper.'}, ...REVIEWS.slice(0, 5)].map(story).join('')}</ul>
    <p style="margin-top:1.2rem"><a href="#research">All research</a></p>
  </div></section>`;
  const audio = new Audio('assets/models/zebra-finch/R56.wav?v=' + V), hs = $('#hero-spec'), ph = $('.ph', hs);
  const {makePlayer} = await import('./dsp.js?v=20261113b'); const pl = makePlayer(audio, f => ph.style.left = (f * 100) + '%');
  hs.onclick = () => pl.toggle(); hs.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pl.toggle(); } };
  thumbs();
  try {
    const [{createSpecimen}, meshes] = await Promise.all([import('./viewer3d.js?v=20261113b'), getJSON('data/models/finch-hero.json')]);
    const el = $('#home-brain'); if (!el) return;
    $('#home-keys').innerHTML = Object.values(FINCH_GROUPS).map(g => `<span><i style="background:${g.color}"></i>${esc(g.label)}</span>`).join('');
    await createSpecimen(el, {meshes, up: '+z', shell: 'Whole brain', parts: FINCH_PARTS, groups: FINCH_GROUPS, caption: ''});
  } catch (e) { console.warn(e); const el = $('#home-brain'); if (el) el.innerHTML = '<p class="small faint" style="padding:1rem">The 3D view needs WebGL, which this browser has turned off.</p>'; }
}
const cover = s => `<a class="cover" href="#animals/${s.id}"><img src="${esc(s.photo.src)}" alt="" loading="lazy"><span class="tag">${esc(s.group)}</span><div class="meta"><p class="q">${esc(HOOKS[s.id])}</p><p class="nm">${esc(s.common)} <i>${esc(s.latin)}</i></p></div></a>`;
const story = r => `<li><p class="small faint">${esc(SP[r.species].common)} · ${esc(r.kind)} ${chip(r.verdict)}</p><h3><a href="#${r.legacy ? r.id : 'research/' + r.id}">${esc(r.title)}</a></h3><p>${esc(r.summary)}</p></li>`;
async function thumbs() {
  try {
    const d = await getJSON('data/models/zebra-finch/strf.json'); const {paintMatrix, diverging, decode, gammatone, normaliseMax} = await import('./dsp.js?v=20261113b');
    const c = $('#lc-strf'); if (!c) return; const tmp = document.createElement('canvas'); const e = d.examples[0]; const S = e.strf, mx = Math.max(...S.flat().map(Math.abs));
    paintMatrix(tmp, S.map(r => r.map(v => v / mx)), diverging); const g = c.getContext("2d"); g.imageSmoothingEnabled = true; g.drawImage(tmp, 0, 0, 600, 170);
    const {x, sr} = await decode('assets/models/zebra-finch/R56.wav'); const gt = gammatone(x.subarray(0, Math.round(sr * .8)), sr, {fmin: 200, fmax: 7000, n: 40});
    const t2 = document.createElement('canvas'); paintMatrix(t2, normaliseMax(gt.M)); const ce = $('#lc-ear'); if (ce) ce.getContext('2d').drawImage(t2, 0, 0, 600, 170);
  } catch (e) { console.warn(e); }
}

// ------------------------------------------------------------------ ANIMALS index
function animals() {
  setTitle('Animals');
  main.innerHTML = `<div class="wrap"><header class="page-head"><p class="crumb"><a href="#home">Home</a> / Animals</p><h1>Animals</h1><p class="lede">Each animal is a chapter. The zebra finch chapter is the most complete; the others are growing as open data become available.</p></header>
  <div class="covers" style="margin:2rem 0 4rem">${SPECIES.map(cover).join('')}</div></div>`;
}

// ------------------------------------------------------------------ CHAPTER
async function chapter(id, stepId) {
  const s = SP[id]; if (!s) return animals();
  setTitle(s.common);
  const used = [];
  const isFinch = id === 'zebra-finch';
  const facts = (isFinch ? FINCH.facts : OTHER[id]?.facts || []);
  const steps = isFinch ? FINCH.steps : genericSteps(s);
  main.innerHTML = `
  <header class="chapter-cover"><img src="${esc(s.photo.src)}" alt="Photograph: ${esc(s.common.toLowerCase())}"><div class="wrap">
    <p class="eyebrow" style="color:#f0c9b6">${esc(s.group)} · Chapter</p><h1>${esc(s.common)}</h1><p class="latin">${esc(s.latin)}</p>
    <p class="lede">${esc(HOOKS[id])} ${esc(s.plain)}</p>
    <div class="facts">${facts.map(([a, b]) => `<div><b>${esc(a)}</b><span>${cited(b, used)}</span></div>`).join('')}</div>
  </div><span class="credit">Photo: <a href="${esc(s.photo.url)}">${esc(s.photo.credit)}</a>, ${esc(s.photo.licence)}</span></header>
  <nav class="chapnav" aria-label="Chapter sections"><ol>${steps.map(st => `<li><a href="#animals/${id}/${st.id}" data-step="${st.id}"><span>${st.n}</span>${esc(st.title)}</a></li>`).join('')}<li><a href="#animals/${id}/refs" data-step="refs"><span>·</span>References</a></li></ol></nav>
  <div class="wrap">${steps.map(st => `
    <section class="step" id="step-${st.id}">
      <div class="step-head"><span class="step-n">${st.n}</span><h2>${esc(st.title)}</h2></div>
      <div class="split${['strf', 'ra'].includes(st.instrument) ? ' wide' : ''}">
        <div class="prose text">${st.body.map(p => `<p>${cited(p, used)}</p>`).join('')}${st.deeper ? `<p class="deeper">${cited(st.deeper, used)}</p>` : ''}${st.pathway ? `<ol class="pathway">${st.pathway.map(p => `<li><button type="button" data-region="${esc(p.region)}" aria-pressed="false"><span><b>${esc(p.title)}</b><span>${esc(p.text)}</span></span></button></li>`).join('')}</ol>` : ''}${st.html || ''}</div>
        <div data-inst="${st.instrument || ''}" data-step="${st.id}">${st.instrument ? '<p class="faint small">Loading…</p>' : ''}</div>
      </div>
    </section>`).join('')}
    <section class="step" id="step-refs"><h2>References</h2><ol class="refs" id="chap-refs"></ol></section>
  </div>`;
  $('#chap-refs').innerHTML = used.map(k => `<li id="ref-${k}">${refItem(k)}</li>`).join('');
  // mount instruments lazily
  const mounts = {
    ear: el => M.mountEar(el, {initial: {'zebra-finch': 'finch', 'common-marmoset': 'marmoset', 'egyptian-fruit-bat': 'bat', 'house-mouse': 'mouse', 'honeybee': 'bee'}[id] || 'finch'}),
    strf: el => M.mountSTRF(el), ra: el => M.mountRA(el), neurons: el => M.mountNeurons(el, {species: id === 'house-mouse' ? 'house-mouse' : 'zebra-finch'}),
    pathway: async el => { const hl = await M.mountPathway(el, FINCH.steps.find(x => x.id === 'pathway').pathway); $$('.pathway button').forEach(b => b.onclick = () => { $$('.pathway button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); hl(b.dataset.region); }); },
    song: el => songPlayer(el), sounds: el => soundStrip(el, id), atlas: el => atlasTeaser(el, id), review: el => reviewTeaser(el, id),
  };
  const mount = el => { if (el.dataset.mounted) return; el.dataset.mounted = '1'; io.unobserve(el); const f = mounts[el.dataset.inst]; Promise.resolve(f?.(el)).catch(err => { el.innerHTML = `<p class="notice">${esc(err.message)}</p>`; }); };
  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && mount(e.target)), {rootMargin: '400px'});
  $$('[data-inst]').forEach(el => el.dataset.inst && io.observe(el));
  setTimeout(() => $$('[data-inst]').filter(el => el.dataset.inst && !el.dataset.mounted && el.isConnected).forEach((el, i) => setTimeout(() => el.isConnected && mount(el), i * 400)), 2500);
  // chapter nav highlighting + deep link
  const links = $$('.chapnav a');
  links.forEach(a => a.onclick = e => { e.preventDefault(); history.replaceState(null, '', a.getAttribute('href')); document.getElementById('step-' + a.dataset.step)?.scrollIntoView({behavior: 'smooth'}); });
  const so = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', 'step-' + a.dataset.step === e.target.id)); }), {rootMargin: '-45% 0px -50% 0px'});
  $$('.step').forEach(x => so.observe(x));
  if (stepId) { const go = () => document.getElementById('step-' + stepId)?.scrollIntoView(); requestAnimationFrame(go); setTimeout(go, 450); setTimeout(go, 1600); }
}
function genericSteps(s) {
  const id = s.id, out = [];
  out.push({id: 'sound', n: 1, title: 'The sound', instrument: 'sounds', body: s.body.slice(0, 1).map(b => b[1] + ' ' + b[2].map(k => `[[${k}]]`).join(' '))});
  if (id !== 'sperm-whale') out.push({id: 'ear', n: 2, title: 'Through a model ear', instrument: 'ear', body: ['The same model inner ear used in the zebra finch chapter, run on this animal’s recording. The filters cover the range of the recording rather than this species’ measured hearing, so read it as a picture of how pitch channels split the sound, not a species-specific cochlea.']});
  s.body.slice(1).forEach(b => out.push({id: b[0].toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''), n: out.length + 1, title: b[0], body: [b[1] + ' ' + b[2].map(k => `[[${k}]]`).join(' ')]}));
  if (id === 'house-mouse') out.push({id: 'cells', n: out.length + 1, title: 'Neurons of the auditory midbrain', instrument: 'neurons', body: ['Stellate neurons from the mouse inferior colliculus, the auditory midbrain, traced from microscope images and shared on NeuroMorpho.org.']});
  out.push({id: 'brain', n: out.length + 1, title: 'The brain', instrument: 'atlas', body: [ATLASES[id].status === 'available' ? `Explore the ${s.common.toLowerCase()} brain in 3D and in slices. ${ATLASES[id].kind}.` : 'We searched OpenNeuro, Zenodo, Brain/MINDS, InsectBrainDB and the literature and found no openly licensed brain imaging for this species. Rather than show another species’ brain, this section stays empty until such data exist.']});
  out.push({id: 'research', n: out.length + 1, title: 'What we checked', instrument: 'review', body: ['Claims about this animal that we tested against the authors’ deposited data.']});
  return out;
}
async function songPlayer(el) {
  const d = await getJSON('data/models/zebra-finch/strf.json'); const songs = Object.entries(d.songs);
  el.innerHTML = `<div class="inst"><div class="inst-bar"><span class="title">Eight males, eight songs</span><span class="pb"></span></div><div class="inst-body">
    <div class="track"><canvas class="t" height="150"></canvas><div class="ph"></div></div>
    <div class="seg" role="group" aria-label="Choose a song" style="margin-top:.6rem">${songs.map(([k], i) => `<button type="button" data-s="${k}" aria-pressed="${i === 0}">${i + 1}</button>`).join('')}</div>
    <p class="small" style="color:var(--night-ink-2);margin:.6rem 0 0">Each song belongs to a different bird. Notice how each repeats a few distinct syllables in a fixed order.</p></div>
    <div class="inst-foot"><span>Stimuli from Le, Bjoring &amp; Meliza (figshare, CC BY 4.0). Spectrogram 0.5–8 kHz.</span></div></div>`;
  const {makePlayer, PLAY_ICON, PAUSE_ICON} = await import('./dsp.js?v=20261113b');
  const audio = new Audio(); const ph = $('.ph', el); makePlayer(audio, f => ph.style.left = (f * 100) + '%');
  const b = document.createElement('button'); b.className = 'play'; const setB = () => b.innerHTML = audio.paused ? PLAY_ICON + 'Play' : PAUSE_ICON + 'Pause'; ['play', 'pause', 'ended'].forEach(ev => audio.addEventListener(ev, setB)); setB(); b.onclick = () => audio.paused ? audio.play() : audio.pause(); $('.pb', el).appendChild(b);
  const pick = k => { const s = d.songs[k]; audio.src = s.audio + '?v=' + V; const img = new Image(); img.onload = () => { const c = $('.t', el); c.width = img.width; c.height = 150; c.getContext('2d').drawImage(img, 0, 0, img.width, 150); }; img.src = s.spec + '?v=' + V; $$('[data-s]', el).forEach(x => x.setAttribute('aria-pressed', String(x.dataset.s === k))); };
  $$('[data-s]', el).forEach(x => x.onclick = () => { pick(x.dataset.s); audio.play().catch(() => {}); });
  $('.track', el).onclick = e => { const r = e.currentTarget.getBoundingClientRect(); if (audio.duration) { audio.currentTime = (e.clientX - r.left) / r.width * audio.duration; audio.play(); } };
  pick(songs[0][0]);
}
async function soundStrip(el, id) {
  const list = (await loadSounds()).filter(s => s.species === id).slice(0, 8);
  el.innerHTML = `<div class="inst"><div class="inst-bar"><span class="title">Listen</span><a class="btn sm" href="#listen/${esc(list[0]?.id || '')}">All recordings</a></div><div class="inst-body"><div class="spec-box"><img alt="" data-img><div class="ph" style="position:absolute;top:0;bottom:0;width:2px;background:#fff;left:0"></div></div>
    <div style="display:flex;gap:.6rem;align-items:center;margin:.7rem 0;flex-wrap:wrap"><span class="pb"></span><span class="small" data-cap style="color:var(--night-ink-2)"></span></div>
    <div class="seg" role="group" aria-label="Recordings">${list.map((s, i) => `<button type="button" data-i="${i}" aria-pressed="${i === 0}">${esc(s.title.replace(/ — example /, ' ').replace(/Ultrasonic vocalizations, /, 'USVs '))}</button>`).join('')}</div></div>
    <div class="inst-foot"><span data-src></span></div></div>`;
  const {makePlayer, PLAY_ICON, PAUSE_ICON} = await import('./dsp.js?v=20261113b'); const audio = new Audio(); const ph = $('.ph', el); makePlayer(audio, f => ph.style.left = (f * 100) + '%');
  const b = document.createElement('button'); b.className = 'play'; const setB = () => b.innerHTML = audio.paused ? PLAY_ICON + 'Play' : PAUSE_ICON + 'Pause'; ['play', 'pause', 'ended'].forEach(ev => audio.addEventListener(ev, setB)); setB(); b.onclick = () => audio.paused ? audio.play() : audio.pause(); $('.pb', el).appendChild(b);
  const pick = i => { const s = list[i]; const f = s.files.realtime || s.files.expanded || s.files.original; audio.src = f; $('[data-img]', el).src = s.spectrogram?.file || ''; $('[data-cap]', el).textContent = `${s.kind} · ${(+s.source.duration_s).toFixed(2)} s${s.files.expanded && !s.files.realtime ? ' · slowed for human hearing' : ''}`; $('[data-src]', el).innerHTML = `${esc(s.source.citation.split('.')[0])}. ${s.source.licence ? esc(s.source.licence) : ''}`; $$('[data-i]', el).forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.i === i))); };
  $$('[data-i]', el).forEach(x => x.onclick = () => { pick(+x.dataset.i); audio.play().catch(() => {}); }); pick(0);
}
async function atlasTeaser(el, id) {
  if (ATLASES[id].status !== 'available') { el.innerHTML = `<div class="notice">No open brain atlas for this species.</div>`; return; }
  const m = await getJSON(`data/atlas/${id}/meta.json`);
  el.innerHTML = `<div class="inst"><div class="inst-bar"><span class="title">${esc(m.title)}</span><a class="btn sm accent" href="#lab/${id}">Open in the brain lab</a></div><div class="inst-body"><p style="margin:0">${m.dims ? `${m.dims.join(' × ')} voxels · ${m.spacing_mm[0]} mm` : `${(await getJSON(`data/atlas/${id}/meshes.json`)).length} 3D surfaces`}${m.regions?.length ? ` · ${m.regions.length} labelled regions` : ''}</p><p class="small" style="color:var(--night-ink-2);margin:.4rem 0 0">${esc(m.provenance.citation)}</p></div></div>`;
}
function reviewTeaser(el, id) {
  const rs = REVIEWS.filter(r => r.species === id);
  el.innerHTML = rs.length ? `<ul class="storylist" style="grid-template-columns:1fr">${rs.map(story).join('')}</ul>` : '<p class="muted">Nothing checked yet for this species.</p>';
}

// ------------------------------------------------------------------ LISTEN (library + video)
let lib = {page: 0, cur: null, mode: null};
async function listen(arg) {
  if (arg === 'video') return video();
  setTitle('Listen');
  const all = await loadSounds();
  if (!$('#lib')) {
    main.innerHTML = `<div class="wrap"><header class="page-head"><p class="crumb"><a href="#home">Home</a> / Listen</p><h1>Listen</h1><p class="lede">${fmt(all.length)} original recordings. Hover over a spectrogram to read time and pitch. Ultrasonic calls are slowed down, and every record says exactly how.</p>
      <p><a class="btn sm" href="#listen/video">Research video →</a></p></header>
      <div class="filters"><label class="field" for="f-sp">Animal<select id="f-sp"><option value="">All animals</option>${SPECIES.map(s => `<option value="${s.id}">${esc(s.common)}</option>`).join('')}</select></label>
        <label class="field" for="f-k">Type<select id="f-k"><option value="">All</option></select></label><label class="field" for="f-q">Name<input id="f-q" type="search" placeholder="e.g. phee, Grey644"></label></div>
      <div class="lib" id="lib" style="margin-bottom:4rem"><div class="inst" id="pl"><div class="inst-bar"><span class="title" id="pl-t">Choose a recording</span><span class="pb"></span></div>
        <div class="inst-body"><div class="spec-box" id="pl-box"><img id="pl-img" alt=""><div class="ph" style="position:absolute;top:0;bottom:0;width:2px;background:#fff;left:0"></div><div class="hover-read" hidden id="pl-hov"></div></div><div class="spec-axes" id="pl-ax"></div>
          <div style="margin:.7rem 0" class="seg" id="pl-mode" role="group" aria-label="Playback version"></div><div id="pl-meta" class="small" style="color:var(--night-ink-2)"></div></div></div>
        <div><div class="lib-list" id="lib-list" role="listbox" aria-label="Recordings"></div><div class="pager" id="lib-pager"></div></div></div></div>`;
    const kinds = () => { const sp = $('#f-sp').value; $('#f-k').innerHTML = '<option value="">All</option>' + [...new Set(all.filter(s => !sp || s.species === sp).map(s => s.kind))].sort().map(k => `<option>${esc(k)}</option>`).join(''); };
    kinds(); $('#f-sp').onchange = () => { kinds(); lib.page = 0; libList(all); }; $('#f-k').onchange = $('#f-q').oninput = () => { lib.page = 0; libList(all); };
    const {makePlayer, PLAY_ICON, PAUSE_ICON} = await import('./dsp.js?v=20261113b');
    lib.audio = new Audio(); const ph = $('#pl-box .ph'); makePlayer(lib.audio, f => ph.style.left = (f * 100) + '%');
    const b = document.createElement('button'); b.className = 'play'; const setB = () => b.innerHTML = lib.audio.paused ? PLAY_ICON + 'Play' : PAUSE_ICON + 'Pause'; ['play', 'pause', 'ended'].forEach(ev => lib.audio.addEventListener(ev, setB)); setB(); b.onclick = () => lib.audio.paused ? lib.audio.play() : lib.audio.pause(); $('#pl .pb').appendChild(b);
    const box = $('#pl-box'), hov = $('#pl-hov');
    box.onpointermove = e => { const s = all.find(x => x.id === lib.cur); if (!s?.spectrogram) return; const r = box.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width, fy = 1 - (e.clientY - r.top) / r.height; const t = fx * s.spectrogram.t1, f = fy * s.spectrogram.f1, k = lib.mode === 'expanded' ? (s.species === 'house-mouse' ? 16 : 10) : 1; hov.hidden = false; hov.style.left = (e.clientX - r.left) + 'px'; hov.style.top = (e.clientY - r.top) + 'px'; hov.textContent = `${t < 1 ? (t * 1000).toFixed(0) + ' ms' : t.toFixed(2) + ' s'} · ${f >= 1000 ? (f / 1000).toFixed(1) + ' kHz' : f.toFixed(0) + ' Hz'}${k > 1 ? ` (heard as ${(f / k / 1000).toFixed(2)} kHz)` : ''}`; };
    box.onpointerleave = () => hov.hidden = true; box.onclick = e => { const r = box.getBoundingClientRect(); if (lib.audio.duration) { lib.audio.currentTime = (e.clientX - r.left) / r.width * lib.audio.duration; lib.audio.play(); } };
    $('#lib-list').onkeydown = e => { const bs = $$('#lib-list button'), i = bs.indexOf(document.activeElement); if (e.key === 'ArrowDown') { e.preventDefault(); bs[Math.min(bs.length - 1, i + 1)]?.focus(); } if (e.key === 'ArrowUp') { e.preventDefault(); bs[Math.max(0, i - 1)]?.focus(); } };
  }
  if (arg) { const s = all.find(x => x.id === arg); if (s) { if ($('#f-sp').value !== s.species) { $('#f-sp').value = s.species; $('#f-sp').onchange(); } const idx = libFiltered(all).findIndex(x => x.id === arg); lib.page = Math.max(0, Math.floor(idx / 40)); lib.cur = arg; libLoad(s); } }
  libList(all);
}
function libFiltered(all) { const sp = $('#f-sp').value, k = $('#f-k').value, q = $('#f-q').value.trim().toLowerCase(); return all.filter(s => (!sp || s.species === sp) && (!k || s.kind === k) && (!q || (s.title + ' ' + s.id + ' ' + s.kind).toLowerCase().includes(q))); }
function libList(all) {
  const L = libFiltered(all), pages = Math.max(1, Math.ceil(L.length / 40)); lib.page = Math.min(lib.page, pages - 1);
  $('#lib-list').innerHTML = L.slice(lib.page * 40, lib.page * 40 + 40).map(s => `<button role="option" data-id="${esc(s.id)}" aria-current="${s.id === lib.cur}">${esc(s.title)}<small>${esc(SP[s.species].common)} · ${esc(s.kind)} · ${(+s.source.duration_s).toFixed(2)} s</small></button>`).join('') || '<p style="padding:.8rem">No recordings match.</p>';
  $('#lib-pager').innerHTML = `<span>${fmt(L.length)} recordings</span><span><button class="btn sm" ${lib.page ? '' : 'disabled'} data-p="-1">Previous</button> ${lib.page + 1}/${pages} <button class="btn sm" ${lib.page < pages - 1 ? '' : 'disabled'} data-p="1">Next</button></span>`;
  $$('#lib-pager [data-p]').forEach(b => b.onclick = () => { lib.page += +b.dataset.p; libList(all); });
  $$('#lib-list button').forEach(b => b.onclick = () => { history.replaceState(null, '', '#listen/' + b.dataset.id); lib.cur = b.dataset.id; libLoad(all.find(x => x.id === b.dataset.id)); libList(all); lib.audio.play().catch(() => {}); });
}
function libLoad(s) {
  $('#pl-t').textContent = `${SP[s.species].common} · ${s.title}`;
  const modes = Object.keys(s.files), lab = {original: 'Original', realtime: 'Real time', expanded: s.species === 'house-mouse' ? 'Slowed 16×' : 'Slowed 10×'};
  lib.mode = modes.includes('realtime') ? 'realtime' : modes[0]; lib.audio.src = s.files[lib.mode];
  $('#pl-mode').innerHTML = modes.map(m => `<button type="button" data-m="${m}" aria-pressed="${m === lib.mode}">${lab[m]}</button>`).join('');
  $$('#pl-mode button').forEach(b => b.onclick = () => { lib.mode = b.dataset.m; lib.audio.src = s.files[lib.mode]; lib.audio.play(); $$('#pl-mode button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
  const sg = s.spectrogram; $('#pl-img').src = sg?.file || ''; $('#pl-img').alt = sg ? `Spectrogram, 0 to ${(sg.f1 / 1000).toFixed(0)} kHz over ${(+sg.t1).toFixed(2)} s` : '';
  $('#pl-ax').innerHTML = sg ? `<span>0</span><span>time →  ${(+sg.t1 < 1 ? (sg.t1 * 1000).toFixed(0) + ' ms' : (+sg.t1).toFixed(2) + ' s')}</span><span>0–${(sg.f1 / 1000).toFixed(0)} kHz</span>` : '';
  const src = s.source;
  $('#pl-meta').innerHTML = `<p style="margin:0 0 .4rem">${esc(s.playback)}</p><details class="src"><summary>Source and file details</summary><dl class="meta" style="margin-top:.5rem"><dt>File</dt><dd class="mono">${esc(src.file)}</dd><dt>Sample rate</dt><dd>${src.sample_rate ? fmt(src.sample_rate) + ' Hz' : '–'}</dd><dt>Licence</dt><dd>${esc(src.licence)}</dd><dt>Cite</dt><dd>${esc(src.citation)} ${src.url ? `<a href="${esc(src.url)}">source</a>` : ''}</dd><dt>SHA-256</dt><dd class="mono">${esc(src.sha256)}</dd></dl></details>`;
}
async function video() {
  setTitle('Research video');
  const [old, bat] = await Promise.all([getJSON('data/videos.json'), getJSON('data/videos-bat.json')]);
  const items = [...old.map(v => ({sp: 'zebra-finch', title: /01833/.test(v.path) ? 'Recording an HVC neuron during singing' : 'Individual microphones in a social group', text: v.description, src: 'assets/' + v.path.split('/').pop(), credit: `${v.credit} · ${v.license}`, link: v.source_url})),
    ...bat.map(v => ({sp: 'egyptian-fruit-bat', title: v.title.replace(/^Example video of /, '').replace(/^./, c => c.toUpperCase()), text: v.description, src: v.web_file, credit: `Prat, Taub, Pratt & Yovel (2017) · ${v.licence}`, link: v.url}))];
  main.innerHTML = `<div class="wrap"><header class="page-head"><p class="crumb"><a href="#home">Home</a> / <a href="#listen">Listen</a> / Video</p><h1>Research video</h1><p class="lede">Unedited clips from published supplements and open datasets.</p></header>
    ${['zebra-finch', 'egyptian-fruit-bat'].map(sp => `<h2 style="margin-top:2rem">${esc(SP[sp].common)}</h2><div class="film-grid">${items.filter(i => i.sp === sp).map(v => `<article class="film"><video controls preload="metadata" src="${esc(v.src)}"></video><div><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p><p class="small faint">${esc(v.credit)} · <a href="${esc(v.link)}">source</a></p></div></article>`).join('')}</div>`).join('')}<div style="height:4rem"></div></div>`;
}

// ------------------------------------------------------------------ LAB (atlases)
const LAB_MARKUP = `<div id="atlas-viewer"><h1 id="av-title" style="margin-top:.4rem"></h1><p class="lede" id="av-sub" style="font-size:1rem"></p>
  <div class="atlas-grid"><aside class="atlas-side" aria-label="Atlas controls">
    <section><h2>Image</h2><label class="vh" for="av-image">Image</label><select id="av-image"></select>
      <label style="display:flex;gap:.4rem;align-items:center;margin-top:.5rem;font-size:.9rem"><input type="checkbox" id="av-overlay" checked style="width:auto"> Show region colours</label>
      <label style="display:flex;gap:.4rem;align-items:center;margin-top:.3rem;font-size:.9rem"><input type="checkbox" id="av-outline" style="width:auto"> Outline selected region only</label></section>
    <section id="av-regions-sec"><h2>Regions</h2><label class="vh" for="av-rsearch">Search regions</label><input id="av-rsearch" type="search" placeholder="Search name or acronym"><ul class="region-list" id="av-regions"></ul><p class="small faint" id="av-rcount" style="margin:.4rem 0 0"></p></section>
    <section><h2>Source</h2><div class="provenance" id="av-prov"></div></section></aside>
  <div><div class="view-tabs" role="tablist"><button role="tab" id="tab-slices" aria-selected="true" aria-controls="panel-slices">Sections</button><button role="tab" id="tab-3d" aria-selected="false" aria-controls="panel-3d">3D</button><button role="tab" id="tab-diff" aria-selected="false" aria-controls="panel-diff" hidden>Diffusion</button></div>
    <div id="panel-slices" role="tabpanel"><div class="readout" id="av-readout" aria-live="polite">Click a section to move the cursor; the other two follow. Arrow keys work too.</div><div class="planes" id="av-planes"></div><p class="small faint" id="av-note"></p></div>
    <div id="panel-3d" role="tabpanel" hidden><div class="three-wrap" id="av-three"><span class="three-help">Drag to rotate · scroll to zoom · right-drag to pan</span></div><p class="small faint" id="av-mesh-note"></p></div>
    <div id="panel-diff" role="tabpanel" hidden><div class="notice info"><p id="av-diff-note" style="margin:0"></p></div><label class="field" for="av-diff-image">Map<select id="av-diff-image"></select></label><div class="planes" id="av-diff-planes" style="margin-top:.6rem"></div><div class="readout" id="av-diff-readout"></div></div>
    <details class="data-table" style="margin-top:1rem"><summary>How this atlas was prepared</summary><ul class="provenance" id="av-processing"></ul></details></div></div></div>`;
async function lab(id) {
  setTitle(id ? `${LAB[id]?.common} brain` : 'Brain lab');
  if (!id) {
    const all = [...SPECIES, ...LAB_EXTRA];
    const metas = await Promise.all(all.map(s => hasAtlas(s.id) ? getJSON(`data/atlas/${s.id}/meta.json`).catch(() => null) : null));
    const card = (s, i) => { const ok = !!metas[i]; return `<article class="atlas-card"><p class="eyebrow" style="color:#8fa0ae">${esc(s.group)}</p><h3>${esc(s.common)} <span style="font-weight:400;font-style:italic;font-size:.85rem;color:#8fa0ae">${esc(s.latin)}</span></h3><p>${esc(metas[i]?.title || '')}</p><p>${ok ? esc(ATLASES[s.id]?.kind || s.kind) : 'No openly licensed brain imaging found.'}</p>${ok ? `<a class="btn" href="#lab/${s.id}">Open</a>` : ''}</article>`; };
    const n = metas.filter(Boolean).length;
    main.innerHTML = `<div class="lab"><div class="wrap"><header class="page-head"><p class="crumb"><a href="#home">Home</a> / Brain lab</p><h1>Brain lab</h1><p class="lede">${n} real brains you can slice and rotate, each from its original source. Atlases are shown as themselves and never registered to another species.</p></header>
      <h2 style="margin-top:2rem">Animals with a chapter</h2><div class="atlas-cards" style="margin-bottom:1rem">${SPECIES.map((s, i) => card(s, i)).join('')}</div>
      <h2>More 3D atlases</h2><div class="atlas-cards">${LAB_EXTRA.map((s, i) => metas[SPECIES.length + i] ? card(s, SPECIES.length + i) : '').join('')}</div></div></div>`;
    return;
  }
  main.innerHTML = `<div class="lab"><div class="wrap"><p class="crumb" style="padding-top:1.2rem"><a href="#home">Home</a> / <a href="#lab">Brain lab</a> / ${esc(LAB[id]?.common || id)}</p>${LAB_MARKUP}</div></div>`;
  const {openAtlas} = await import('./atlas.js?v=20261113b');
  await openAtlas(id, {status: t => { const r = $('#av-readout'); if (r) r.textContent = t || 'Click a section to move the cursor; the other two follow. Arrow keys work too.'; }, esc, getJSON, sp: LAB[id]});
}

// ------------------------------------------------------------------ RESEARCH
async function research(id) {
  if (id === 'literature') return literature();
  if (id === 'data') return dataPage();
  if (id === 'finch-strf') return strfReport();
  if (id === 'finch-restoration') return restorationReport();
  if (id) return reviewDetail(id);
  setTitle('Research');
  const extra = [{id: 'finch-restoration', species: 'zebra-finch', kind: 'Claim check', verdict: 'partial', title: 'Do finch neurons fill in missing syllables?', summary: 'Population responses in the gap window, compared across song-with-noise, gap-with-noise and noise alone.'},
    {id: 'finch-strf', species: 'zebra-finch', kind: 'Model', verdict: 'model', title: 'Receptive-field models of 531 zebra finch auditory neurons', summary: 'How well a linear model of each neuron predicts its firing to a song it was not fitted on, by brain area.'}];
  main.innerHTML = `<div class="wrap"><header class="page-head"><p class="crumb"><a href="#home">Home</a> / Research</p><h1>Research</h1><p class="lede">Paper guides, models and claim checks. We recompute published numbers from deposited data, fit models to open recordings, and report what could not be checked. A discrepancy is never treated as evidence of misconduct.</p>
    <p style="display:flex;gap:.5rem;flex-wrap:wrap"><a class="btn sm" href="#research/literature">Literature</a><a class="btn sm" href="#research/data">Data sources &amp; methods</a></p></header>
    <div class="split" style="margin:2rem 0 4rem"><div><ul class="storylist" style="grid-template-columns:1fr">${[...extra, ...REVIEWS].map(story).join('')}</ul></div>
    <aside><div class="method-box"><h3>How results are rated</h3><dl class="meta">${Object.entries(VERDICTS).map(([k, v]) => `<dt>${chip(k)}</dt><dd>${esc(v.text)}</dd>`).join('')}<dt>${chip('model', 'Model')}</dt><dd>A model fitted to open data, with its validation.</dd></dl></div>
    <div class="method-box"><h3>Every check</h3><ol style="padding-left:1.1rem;margin:0"><li>States a specific claim.</li><li>Uses the authors’ deposited data, with checksums.</li><li>Publishes the script that recomputes the number.</li><li>Screens citations for retractions and corrections.</li><li>Says what could not be tested.</li></ol></div></aside></div></div>`;
}
async function reviewDetail(id) {
  const r = REVIEWS.find(x => x.id === id); if (!r) return research();
  if (r.legacy) { location.replace('#' + id); return; }
  setTitle(r.title);
  const d = await getJSON(`data/checks/${id}.json`);
  const statusClass = s => s.startsWith('reproduced') ? 'reproduced' : s.startsWith('consistent') ? (s.includes('partly') ? 'partial' : 'consistent') : s.includes('discrep') ? 'discrepancy' : s.startsWith('not') ? 'uncheckable' : 'partial';
  main.innerHTML = `<div class="wrap"><article class="paper-article" style="padding:2.4rem 0 4rem"><p class="crumb"><a href="#home">Home</a> / <a href="#research">Research</a> / ${esc(SP[r.species].common)}</p>
    <p class="eyebrow">${esc(r.kind)}</p><h1 class="paper-title">${esc(d.title)}</h1><p>${chip(r.verdict)} <span class="muted small">${esc(VERDICTS[r.verdict].text)}</span></p><p class="lede">${esc(r.summary)}</p>
    <p class="paper-citation">${esc(d.paper.citation)}${d.paper.note ? `<br><span class="small">${esc(d.paper.note)}</span>` : ''}</p>
    <h2>Claims checked</h2>${d.claims.map(c => `<div class="claim"><header><q>${esc(c.claim)}</q>${chip(statusClass(c.status), c.status)}</header><div class="body"><p class="small faint">Source: ${esc(c.source)}</p><p>${esc(c.result)}</p>${c.scope ? `<p class="small"><b>Scope:</b> ${esc(c.scope)}</p>` : ''}</div></div>`).join('')}
    <h2>Figures</h2><div id="rv-figs"></div>
    <div class="method-box"><h3>Method</h3><p>${esc(d.method)}</p><h3>Limits</h3><p>${esc(d.limits)}</p><p class="small">Licence: ${esc(d.data.licence)} · <a href="data/checks/${esc(id)}.json" download>Results (JSON)</a> · <a href="https://github.com/jordanxxlopez/animal-communication-neuroscience/blob/main/scripts/build_collections.py">Script</a></p></div></article></div>`;
  charts.forReview(id, d, $('#rv-figs'));
}
async function strfReport() {
  setTitle('Receptive-field models');
  const d = await getJSON('data/models/zebra-finch/strf.json');
  const areas = ['FL', 'CM', 'NCM', 'unassigned'].filter(a => d.summary[a]);
  const nm = {FL: 'Field L', CM: 'CM', NCM: 'NCM', unassigned: 'Area not assigned'};
  main.innerHTML = `<div class="wrap"><article class="paper-article" style="padding:2.4rem 0 4rem"><p class="crumb"><a href="#home">Home</a> / <a href="#research">Research</a> / Zebra finch</p>
    <p class="eyebrow">Model</p><h1 class="paper-title">${esc(d.title)}</h1><p class="lede">A linear receptive field was fitted to each neuron’s responses to seven songs and tested on the eighth. Of ${d.units_total} recorded units, ${d.units_fitted} had enough spikes (≥ 1 spike/s across the full stimulus set) to model.</p>
    <p class="paper-citation">Data: ${esc(d.data.paper)} Dataset ${esc(d.data.record)}, ${esc(d.data.licence)}.</p>
    <div class="tbl"><table><thead><tr><th>Area</th><th class="num">Neurons</th><th class="num">Median r (held-out song)</th><th class="num">Interquartile range</th><th class="num">Median reliability</th></tr></thead><tbody>${areas.map(a => `<tr><td>${nm[a]}</td><td class="num">${d.summary[a].n}</td><td class="num">${d.summary[a].r_median}</td><td class="num">${d.summary[a].r_q.join(' – ')}</td><td class="num">${d.summary[a].rel_median}</td></tr>`).join('')}</tbody></table></div>
    <div id="strf-hist"></div>
    <div class="method-box"><h3>Method</h3><p><b>Spectrogram.</b> ${esc(d.method.spectrogram)}.</p><p><b>Model.</b> ${esc(d.method.model)}.</p><p><b>Validation.</b> ${esc(d.method.validation)}</p><p><b>Reliability.</b> ${esc(d.method.reliability)}</p>
    <h3>Limits</h3><p>Birds were anaesthetised, so responses may differ from awake listening. Linear STRFs miss non-linear selectivity, which is expected to matter more in secondary areas. “Area not assigned” covers recording sites the authors did not attribute to one region. Ridge-penalty selection used the same held-out songs, which slightly inflates r.</p>
    <p class="small"><a href="data/models/zebra-finch/strf.json" download>Model file (JSON)</a> · <a href="https://github.com/jordanxxlopez/animal-communication-neuroscience/blob/main/scripts/build_finch_models.py">Script</a></p></div></article></div>`;
  charts.hist($('#strf-hist'), {title: 'Prediction accuracy on held-out songs, all modelled neurons', xlabel: 'Correlation between predicted and measured firing rate (r)', ylabel: 'Neurons', edges: d.hist_edges, series: areas.filter(a => a !== 'unassigned').map(a => ({label: nm[a], counts: d.summary[a].hist})), note: 'Each neuron counted once; r averaged over the 8 leave-one-song-out tests.'});
}
async function restorationReport() {
  setTitle('Do finch neurons fill in missing syllables?');
  const d = await getJSON('data/models/zebra-finch/strf.json'); const R = d.restoration; const areas = ['FL', 'CM', 'NCM'].filter(a => R[a]);
  main.innerHTML = `<div class="wrap"><article class="paper-article" style="padding:2.4rem 0 4rem"><p class="crumb"><a href="#home">Home</a> / <a href="#research">Research</a> / Zebra finch</p>
    <p class="eyebrow">Claim check</p><h1 class="paper-title">Do finch neurons fill in missing syllables?</h1><p>${chip('partial')} <span class="muted small">${esc(VERDICTS.partial.text)}</span></p>
    <p class="lede">When part of a word is replaced by noise, people still “hear” the missing part. Le, Bjoring & Meliza report that zebra finch auditory neurons do something similar for song.</p>
    <p class="paper-citation">${esc(REFS.le2025.cite)} <a href="https://doi.org/${REFS.le2025.doi}">doi:${REFS.le2025.doi}</a></p>
    <div class="claim"><header><q>Populations of single units respond to songs in which the original audio of an element is completely replaced by noise as if the missing element were present alongside the noise.</q>${chip('partial', 'consistent, partly checked')}</header>
      <div class="body"><p>Using the deposited spikes (nat8a stimulus sets, ${areas.map(a => `${R[a].units} ${a}`).join(', ')} neurons; 16 gap windows), we compared the population response inside each gap across three versions of the song: syllable plus noise (CN), syllable replaced by noise (GN), and the same noise with no song at all (N).</p>
      <p>In every area and nearly every window, the response to GN was more similar to CN than to N.</p></div></div>
    <div class="tbl"><table><thead><tr><th>Area</th><th class="num">Neurons</th><th class="num">r(GN, CN)</th><th class="num">r(GN, N)</th><th class="num">r(GN, silent gap)</th><th class="num">CN split-half</th><th class="num">Windows where GN is closer to CN</th></tr></thead><tbody>${areas.map(a => `<tr><td>${a}</td><td class="num">${R[a].units}</td><td class="num">${R[a].gn_cn}</td><td class="num">${R[a].gn_n}</td><td class="num">${R[a].gn_g}</td><td class="num">${R[a].cn_split}</td><td class="num">${Math.round(R[a].frac_gn_closer_to_cn * 100)}%</td></tr>`).join('')}</tbody></table></div>
    <div class="method-box"><h3>Why only “partly checked”</h3><p>GN and CN share the song before the gap, while N has no song at all, so part of their similarity could come from the shared context (for example, adaptation) rather than from restoring the missing syllable. The paper addresses this with decoding analyses and additional controls that this simple comparison does not reproduce. Field L shows the same pattern here as CM and NCM, which is one more reason to read this comparison cautiously.</p>
    <h3>Method</h3><p>Trial-averaged firing rates (5 ms bins) from the gap onset to 50 ms after its end, concatenated across all neurons in an area, correlated between conditions. “CN split-half” correlates odd and even trials of CN and indicates the noise level.</p>
    <p class="small"><a href="data/models/zebra-finch/strf.json" download>Results (JSON, field “restoration”)</a> · <a href="https://github.com/jordanxxlopez/animal-communication-neuroscience/blob/main/scripts/build_finch_models.py">Script</a></p></div></article></div>`;
}
async function literature() {
  setTitle('Literature');
  const old = await getJSON('data/sources.json');
  const known = new Set(Object.values(REFS).map(r => (r.doi || '').toLowerCase()));
  const rows = [...Object.values(REFS).map(r => ({c: r.cite, d: r.doi, u: r.url, s: 'Cited on this site · DOI verified'})), ...old.filter(o => !o.doi || !known.has(o.doi.toLowerCase())).map(o => ({c: o.title, d: o.doi, u: o.source_url, s: o.review_status || 'Catalogued'}))];
  main.innerHTML = `<div class="wrap"><header class="page-head"><p class="crumb"><a href="#home">Home</a> / <a href="#research">Research</a> / Literature</p><h1>Literature</h1><p class="lede">${rows.length} papers and datasets. DOIs cited on this site were resolved against Crossref and screened for retractions and editorial notices (November 2026).</p><label class="field" for="lq">Search<input id="lq" type="search" placeholder="Author, title, year"></label></header>
    <div class="tbl" style="margin:1.4rem 0 4rem"><table><thead><tr><th>Reference</th><th>Status</th></tr></thead><tbody id="lt"></tbody></table></div></div>`;
  const draw = () => { const q = $('#lq').value.toLowerCase(); $('#lt').innerHTML = rows.filter(r => !q || r.c.toLowerCase().includes(q)).map(r => `<tr><td>${esc(r.c)} ${r.d ? `<a href="https://doi.org/${esc(r.d)}">doi:${esc(r.d)}</a>` : r.u ? `<a href="${esc(r.u)}">link</a>` : ''}</td><td class="small muted">${esc(r.s)}</td></tr>`).join(''); };
  $('#lq').oninput = draw; draw();
}
async function dataPage() {
  setTitle('Data sources & methods');
  const reg = await getJSON('data/registry.json');
  const extra = [{species: 'zebra-finch', name: 'Le, Bjoring & Meliza auditory-forebrain single units + stimuli', url: 'https://doi.org/10.6084/m9.figshare.29203457', licence: 'CC BY 4.0', use: 'Receptive-field models; restoration check; song players'},
    {species: 'zebra-finch', name: 'FALCON B1 RA Neuropixels during singing (DANDI 001046)', url: 'https://dandiarchive.org/dandiset/001046', licence: 'CC BY 4.0', use: 'Singing-brain raster'},
    {species: 'all', name: 'NeuroMorpho.org reconstructions (Long/Benezra, Meliza/Chen, Roberts archives)', url: 'https://neuromorpho.org', licence: 'Free to use with citation of the original papers', use: '3D neurons'}];
  main.innerHTML = `<div class="wrap"><header class="page-head"><p class="crumb"><a href="#home">Home</a> / <a href="#research">Research</a> / Data</p><h1>Data sources &amp; methods</h1><p class="lede">Where every file comes from, its licence, and how it was processed. Scripts in the repository rebuild every derived file from the originals.</p></header>
    <div class="tbl" style="margin:1.6rem 0"><table><thead><tr><th>Animal</th><th>Resource</th><th>Licence</th><th>Used for</th></tr></thead><tbody>${[...extra, ...reg].map(r => `<tr><td>${esc(SP[r.species]?.common || 'All')}</td><td><a href="${esc(r.url)}">${esc(r.name)}</a></td><td class="small">${esc(r.licence)}</td><td class="small">${esc(r.use)}</td></tr>`).join('')}</tbody></table></div>
    <div class="split" style="margin-bottom:4rem"><div class="text"><h2>Methods in brief</h2><p><b>Spectrograms</b> are short-time Fourier transforms of the original samples in decibels relative to each recording’s loudest part; they are not calibrated sound levels.</p><p><b>Slowed playback</b> plays the same samples at a lower rate (16× for mouse, 10× for bat), dividing every frequency by that factor.</p><p><b>The ear model</b> is a gammatone filterbank computed in the browser; bandwidths follow human measurements.</p><p><b>Neuron models</b> are linear spectro-temporal receptive fields fitted by ridge regression and validated on held-out songs.</p><p><b>Atlases</b> keep their source spacing or state the resampling; none is registered to another.</p></div>
    <div><pre style="background:var(--paper-2);border:1px solid var(--rule);border-radius:6px;padding:1rem;overflow:auto;font-size:.85rem">python scripts/build_atlases.py
python scripts/build_collections.py
python -I scripts/build_finch_models.py
python scripts/sync_github_pages.py</pre><p class="small muted">Original downloads go to <code>data/raw/</code>; URLs and SHA-256 checksums are in <code>research/sources-2026-11.json</code>.</p></div></div></div>`;
}
function legacyReview(id) {
  setTitle({'paper-hamaguchi': 'Auditory feedback to HVC neurons', 'paper-sperm-whale': 'Measuring a sperm whale coda', 'perception-model': 'Perceptual-choice baseline'}[id]);
  const tpl = document.getElementById('tpl-' + id);
  main.innerHTML = `<div class="wrap" style="padding:2.4rem 0 4rem"><p class="crumb"><a href="#home">Home</a> / <a href="#research">Research</a></p></div>`;
  $('.wrap', main).appendChild(tpl.content.cloneNode(true));
  const notes = {a: 'Panel A is the authors’ schematic of the zebra finch preparation. Red marks the song motor pathway; blue marks the anterior forebrain pathway. The electrode records an HVC cell projecting to Area X. This published circuit drawing is not a measured tractogram or a registration to our MRI atlas.', b: 'Panel B illustrates a spike-collision test used to identify an HVC neuron projecting to Area X.', c: 'Panel C shows the feedback manipulation: hit trials trigger playback, catch trials withhold it. This is the authors’ schematic.', d: 'Panel D pairs a song spectrogram with an intracellular voltage recording; the orange interval marks feedback playback. Figure 2 provides the population analysis.'};
  $$('[data-paper-panel]').forEach(b => b.onclick = () => { $$('[data-paper-panel]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); $('#figure-panel-note').textContent = notes[b.dataset.paperPanel]; });
  $$('[data-enlarge]').forEach(b => b.onclick = () => { const o = document.getElementById(b.dataset.enlarge); $('#big-img').src = o.src; $('#big-img').alt = o.alt; $('#fig-dlg').showModal(); });
  if (id === 'paper-sperm-whale') getJSON('data/marine-coda-summary.json').then(c => { const sel = $('#coda-clan'); if (!sel) return; const draw = () => { const g = c.groups[sel.value]; if (!g) return; $('#coda-summary-count').textContent = `${g.n.toLocaleString()} rows · ${g.type_count} labels · median ${g.duration_median_s.toFixed(3)} s`; $('#coda-summary').innerHTML = g.types.map(t => `<tr><td>${esc(t.label)}</td><td class="num">${t.count}</td><td class="num">${t.duration_median_s.toFixed(3)}</td><td class="num">${t.duration_q10_s.toFixed(3)}–${t.duration_q90_s.toFixed(3)}</td></tr>`).join(''); }; sel.onchange = draw; draw(); });
}

// ------------------------------------------------------------------ ABOUT
function about() {
  setTitle('About');
  main.innerHTML = `<div class="wrap"><header class="page-head"><p class="crumb"><a href="#home">Home</a> / About</p><h1>About this site</h1><p class="lede">An independent, non-commercial resource on animal communication and the nervous systems behind it, with a focus on hearing and vocal behaviour.</p></header>
  <div class="split" style="margin:2rem 0 4rem"><div class="text"><h2>Real data only</h2><p>Every recording, image, brain scan, neuron and video comes from a named source under an open or research licence. Nothing is AI-generated, redrawn or simulated without saying so. Models are labelled as models and link to the data they were fitted to.</p>
    <h2>Checked claims</h2><p>Statements cite papers whose DOIs resolve and that have been screened for retractions, corrections and contrasting evidence. Where we recompute a number, the script is public. When something cannot be checked, we say so. A discrepancy is never presented as misconduct.</p>
    <h2>Not affiliated</h2><p>This site is not affiliated with the institutions whose data it uses. Third-party material keeps its original licence; some (the Allen mouse atlas, InsectBrainDB surfaces) allow non-commercial use only.</p></div>
  <div><h2>Accessibility</h2><p>Use <b>Display</b> (top right) for text size, contrast, dark mode and reduced motion. Every interactive works with a keyboard; atlas sections respond to arrow keys. Charts have data tables and spectrograms have text descriptions.</p><h2>Cite</h2><p class="small">Animal Communication &amp; Neuroscience (2026). https://jordanxxlopez.github.io/animal-communication-neuroscience/ · Please also cite the original data sources.</p><p><a href="https://github.com/jordanxxlopez/animal-communication-neuroscience">Source code on GitHub</a></p></div></div></div>`;
}

route();
