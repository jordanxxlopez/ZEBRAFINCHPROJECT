import {SPECIES as BASE_SPECIES, REFS as BASE_REFS, ATLASES as BASE_ATLASES, REVIEWS, VERDICTS} from './content.js?v=20261117a';
import {NEWREFS, FINCH_PARTS, FINCH_GROUPS} from './chapters.js?v=20261117a';
import {MORE_REFS, MORE_SPECIES, MORE_ATLASES, FINCH_SECTIONS, FINCH_FACTS, CHAPTER_PLAN} from './species.js?v=20261117a';
import * as charts from './charts.js?v=20261117a';
import * as M from './models.js?v=20261117a';
import {renderHome, teardown as homeTeardown} from './home.js?v=20261113c';
import {ARTICLES, articleCards, renderIndex as explainedIndex, renderArticle, teardown as exTeardown} from './explained.js?v=20261113c';

const V = '20261117a';
const SPECIES = [...BASE_SPECIES, ...MORE_SPECIES];
const ATLASES = {...BASE_ATLASES, ...MORE_ATLASES};
const REFS = {...BASE_REFS, ...NEWREFS, ...MORE_REFS};
const SP = Object.fromEntries(SPECIES.map(s => [s.id, s]));
const hasAtlas = id => ATLASES[id]?.status === 'available';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const cache = new Map();
const getJSON = p => { if (!cache.has(p)) cache.set(p, fetch(`${p}?v=${V}`).then(r => { if (!r.ok) throw Error(`Could not load ${p} (${r.status})`); return r.json(); })); return cache.get(p); };
const fmt = n => Number(n).toLocaleString('en-US');
const chip = (v, label) => `<span class="chip ${esc(v)}">${esc(label ?? VERDICTS[v]?.label ?? (v === 'model' ? 'Model' : v))}</span>`;
const main = $('#main');
{ const top = $('.top'), set = () => document.documentElement.style.setProperty('--top-h', top.offsetHeight + 'px'); new ResizeObserver(set).observe(top); set(); }
const TITLE = 'Animal Communication & Neuroscience';
const setTitle = t => document.title = t ? `${t} · ${TITLE}` : TITLE;
const atlasMeta = id => getJSON(`data/atlas/${id}/meta.json`);
const GH = 'https://github.com/jordanxxlopez/animal-communication-neuroscience';

// ---------------------------------------------------------------- citations
function cited(text, list) {
  return esc(text).replace(/\s*\[\[(\w+)\]\]/g, (_, k) => { if (!REFS[k]) return ''; if (!list.includes(k)) list.push(k); const n = list.indexOf(k) + 1; return `<sup class="cite"><a href="#" data-ref="${k}" aria-label="Reference ${n}">${n}</a></sup>`; });
}
const refItem = k => { const r = REFS[k]; return `${esc(r.cite)} ${r.doi ? `<a href="https://doi.org/${esc(r.doi)}">doi:${esc(r.doi)}</a>` : r.url ? `<a href="${esc(r.url)}">${esc(r.url)}</a>` : ''}`; };
let pop = null;
document.addEventListener('click', e => {
  const a = e.target.closest('[data-ref]'); pop?.remove(); pop = null; if (!a) return; e.preventDefault();
  pop = document.createElement('div'); pop.className = 'cite-pop'; pop.innerHTML = refItem(a.dataset.ref); document.body.appendChild(pop);
  const r = a.getBoundingClientRect(); pop.style.top = (scrollY + r.bottom + 6) + 'px'; pop.style.left = Math.max(10, Math.min(innerWidth - 400, r.left - 20)) + 'px';
});

// ---------------------------------------------------------------- display settings and search
{
  const KEYS = ['theme', 'size', 'contrast', 'motion'], dlg = $('#settings'), form = $('#settings-form');
  let s = {}; try { s = JSON.parse(localStorage.getItem('acn-display') || '{}'); } catch {}
  for (const k of KEYS) { const r = form.querySelector(`input[name="${k}"][value="${s[k] || ''}"]`); if (r) r.checked = true; }
  form.addEventListener('change', () => { const n = {}; for (const k of KEYS) { n[k] = form.querySelector(`input[name="${k}"]:checked`)?.value || ''; if (n[k]) document.documentElement.dataset[k] = n[k]; else delete document.documentElement.dataset[k]; } try { localStorage.setItem('acn-display', JSON.stringify(n)); } catch {} });
  $('#open-settings').onclick = () => dlg.showModal(); $('#close-settings').onclick = () => dlg.close();
}
let SOUNDS = null;
async function loadSounds() {
  if (SOUNDS) return SOUNDS;
  const [finch, specs, extra, songs] = await Promise.all([getJSON('data/recordings.json'), getJSON('data/spectrograms.json'), getJSON('data/sounds.json'), getJSON('data/finch-songs.json')]);
  const ls = n => { const s = specs[n]; return s ? {file: s.url, t1: s.time_end_seconds, f1: s.frequency_max_hz, db_range: 80} : null; };
  const order = id => SPECIES.findIndex(s => s.id === id);
  SOUNDS = [...[...songs, ...extra].sort((a, b) => order(a.species) - order(b.species)),
    ...finch.map(r => ({id: r.name, species: 'zebra-finch', title: `Syllable ${r.name}`, kind: 'Song syllable', files: {original: r.url}, spectrogram: ls(r.name), source: {sample_rate: r.sample_rate, duration_s: r.duration_seconds, file: r.archive_member, sha256: r.sha256, url: 'https://doi.org/10.5281/zenodo.5545872', licence: 'CC BY 4.0', citation: 'ML4BL dataset; Zandberg et al. (2024). doi:10.1371/journal.pcbi.1012329'}, playback: 'Original file.'}))];
  return SOUNDS;
}
const EXTRA_ANALYSES = [
  {id: 'finch-restoration', species: 'zebra-finch', kind: 'Reanalysis', verdict: 'partial', title: 'Responses to occluded song syllables in zebra finch auditory forebrain', summary: 'Population responses in the gap window compared across song with noise, gap with noise, and noise alone.'},
  {id: 'finch-strf', species: 'zebra-finch', kind: 'Receptive-field model', verdict: 'model', title: 'Spectro-temporal receptive fields of 531 zebra finch auditory neurons', summary: 'Prediction of firing on held-out songs, by forebrain area.'}];
const ANALYSES = [...EXTRA_ANALYSES, ...REVIEWS];
const aHref = r => '#' + (r.legacy ? r.id : 'research/' + r.id);
let INDEX = null;
async function buildIndex() {
  if (INDEX) return INDEX; const it = [];
  SPECIES.forEach(s => it.push({t: s.common, s: `${s.latin} · species`, h: '#species/' + s.id}));
  ARTICLES.forEach(a => it.push({t: a.title, s: `Study explained · ${SP[a.species].common}`, h: '#explained/' + a.id}));
  ANALYSES.forEach(r => it.push({t: r.title, s: `Research · ${SP[r.species].common}`, h: aHref(r)}));
  const metas = (await Promise.all(SPECIES.filter(s => hasAtlas(s.id)).map(s => atlasMeta(s.id).then(m => [s.id, m]).catch(() => null)))).filter(Boolean);
  for (const [k, m] of metas) for (const r of m.regions || []) it.push({t: r.name + (r.hemisphere ? ` (${r.hemisphere.replace(':', '')})` : ''), s: `Brain region · ${SP[k].common}${r.acronym && r.acronym !== r.name ? ' · ' + r.acronym : ''}`, h: `#atlas/${k}?r=${r.index}`});
  (await loadSounds()).filter(s => s.kind !== 'Song syllable').forEach(s => it.push({t: s.title, s: `Recording · ${SP[s.species].common}`, h: '#recordings/' + s.id}));
  INDEX = it.map(i => ({...i, k: (i.t + ' ' + i.s).toLowerCase()})); return INDEX;
}
{
  const box = $('#search'), input = $('#q'), res = $('#search-res'); let hits = [], sel = -1;
  const draw = () => { input.setAttribute('aria-expanded', String(hits.length > 0)); if (sel >= 0) input.setAttribute('aria-activedescendant', 'sr-' + sel); else input.removeAttribute('aria-activedescendant'); res.innerHTML = hits.map((h, i) => `<a href="${esc(h.h)}" id="sr-${i}" role="option" aria-selected="${i === sel}">${esc(h.t)}<small>${esc(h.s)}</small></a>`).join('') || (input.value.length > 1 ? '<p class="small faint" style="padding:.4rem .5rem;margin:0">No matches</p>' : ''); };
  $('#open-search').onclick = () => { box.hidden = !box.hidden; if (!box.hidden) { input.focus(); buildIndex(); } };
  input.oninput = async () => { const q = input.value.trim().toLowerCase(); if (q.length < 2) { hits = []; return draw(); } const ix = await buildIndex(), w = q.split(/\s+/); hits = ix.filter(i => w.every(x => i.k.includes(x))).sort((a, b) => b.t.toLowerCase().startsWith(q) - a.t.toLowerCase().startsWith(q)).slice(0, 12); sel = -1; draw(); };
  input.onkeydown = e => { if (e.key === 'ArrowDown') { sel = Math.min(hits.length - 1, sel + 1); draw(); e.preventDefault(); } else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); draw(); e.preventDefault(); } else if (e.key === 'Enter' && hits.length) { location.hash = hits[Math.max(0, sel)].h; box.hidden = true; } else if (e.key === 'Escape') box.hidden = true; };
  res.onclick = () => { box.hidden = true; };
  document.addEventListener('click', e => { if (!e.target.closest('#search,#open-search')) box.hidden = true; });
}

// ---------------------------------------------------------------- router
const ALIAS = {animals: 'species', lab: 'atlas', listen: 'recordings', sounds: 'recordings', review: 'research', studies: 'literature', methods: 'data', films: 'recordings/video', 'zebra-finch': 'species/zebra-finch', 'sperm-whale': 'species', 'paper-sperm-whale': 'species',
  'data-registry': 'data', 'scale-audit': 'data', 'acoustic-method': 'data', 'quality-note': 'data'};
async function route() {
  const h = decodeURIComponent(location.hash.slice(1)); if (h === 'main' && main.children.length) return;
  let parts = h.split('?')[0].split('/').filter(Boolean);
  if (parts[0] && ALIAS[parts[0]]) parts = [...ALIAS[parts[0]].split('/'), ...parts.slice(1)];
  if (parts[0] === 'research' && parts[1] === 'literature') parts = ['literature'];
  if (parts[0] === 'research' && parts[1] === 'data') parts = ['data'];
  const [page, a, b] = parts;
  const navKey = ['paper-hamaguchi', 'perception-model', 'literature'].includes(page) ? 'research' : page || 'home';
  $$('#nav a').forEach(x => x.hash === '#' + navKey ? x.setAttribute('aria-current', 'page') : x.removeAttribute('aria-current'));
  $$('audio,video').forEach(m => m.pause());
  homeTeardown(); exTeardown(); main.classList.remove('h-static'); document.body.classList.toggle('is-home', !page || page === 'home' || page === 'main');
  try {
    if (!page || page === 'home') await home();
    else if (page === 'atlas') await (a ? atlasPage(a) : atlasIndex());
    else if (page === 'species') await (a ? speciesPage(a, b) : speciesIndex());
    else if (page === 'recordings') await recordings(a);
    else if (page === 'research') await research(a);
    else if (page === 'explained') await explained(a);
    else if (page === 'data') await dataPage();
    else if (page === 'literature') await literature();
    else if (page === 'about') about();
    else if (['paper-hamaguchi', 'perception-model'].includes(page)) legacy(page);
    else if (page === 'main') await home();
    else notFound();
  } catch (e) { console.error(e); main.innerHTML = `<div class="wrap" style="padding:3rem 0"><p class="notice">${esc(e.message)}</p></div>`; }
  if (!(page === 'species' && b) && !(page === 'recordings' && a && a !== 'video')) window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
$('.skip').addEventListener('click', e => { e.preventDefault(); main.focus(); main.scrollIntoView(); });
function notFound() {
  setTitle('Page not found');
  main.innerHTML = `<div class="wrap"><header class="page-head"><h1>Page not found</h1><p class="lede">No page exists at this address.</p><p><a href="#home">Overview</a> · <a href="#atlas">Brain atlases</a> · <a href="#species">Species</a> · <a href="#recordings">Recordings</a> · <a href="#research">Research</a></p></header></div>`;
}
const reduced = () => document.documentElement.dataset.motion === 'reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches;
const LOADING3D = '<p class="loading" role="status">Loading 3D surfaces…</p>';

// ---------------------------------------------------------------- shared pieces
const atlasTile = (s, m) => `<a class="atlas-tile" href="#atlas/${s.id}"><img src="assets/atlas-thumbs/${s.id}.jpg?v=${V}" alt="" loading="lazy"><b>${esc(s.common)}</b><span>${m?.regions?.length ? fmt(m.regions.length) + ' regions' : m?.dims ? 'MRI, unlabelled' : 'Surface atlas'}</span></a>`;
const analysisRows = list => list.map(r => `<tr><td><a href="${aHref(r)}">${esc(r.title)}</a><div class="small muted">${esc(r.summary)}</div></td><td>${esc(SP[r.species].common)}</td><td class="hide-sm">${esc(r.kind)}</td><td>${chip(r.verdict)}</td></tr>`).join('');
const analysisTable = list => `<div class="tbl"><table><thead><tr><th>Analysis</th><th>Species</th><th class="hide-sm">Type</th><th>Outcome</th></tr></thead><tbody>${analysisRows(list)}</tbody></table></div>`;
function speciesTable(sounds) {
  const n = id => sounds.filter(x => x.species === id).length;
  return `<div class="tbl"><table><thead><tr><th></th><th>Species</th><th class="hide-sm">Signals studied</th><th>Brain atlas</th><th class="num">Recordings</th></tr></thead><tbody>${SPECIES.map(s => `<tr><td style="width:64px">${s.photo ? `<img class="sp-thumb" src="${esc(s.photo.src)}" alt="" loading="lazy">` : ''}</td><td><a href="#species/${s.id}">${esc(s.common)}</a><br><i>${esc(s.latin)}</i></td><td class="hide-sm">${esc(s.signal)}</td><td>${hasAtlas(s.id) ? `<a href="#atlas/${s.id}">3D atlas</a>` : '<span class="faint">None available</span>'}</td><td class="num">${n(s.id) || '<span class="faint">0</span>'}</td></tr>`).join('')}</tbody></table></div>`;
}
const UP = {'house-mouse': '-z', 'common-marmoset': '+z', 'zebra-finch': '+z', 'honeybee': '-y'};
async function specimen(el, id, onSelect) {
  el.innerHTML = LOADING3D;
  const {createSpecimen} = await import('./viewer3d.js?v=20261117a');
  if (id === 'zebra-finch') return createSpecimen(el, {meshes: await getJSON('data/models/finch-hero.json'), up: '+z', shell: 'Whole brain', parts: FINCH_PARTS, groups: FINCH_GROUPS, onSelect});
  const [meta, meshes] = await Promise.all([atlasMeta(id), getJSON(`data/atlas/${id}/meshes.json`)]);
  return createSpecimen(el, {meshes, up: UP[id] || meta.view?.up || '+z', auto: true, scale: meta.unit !== 'voxel' && id !== 'honeybee'});
}
const specAxes = (inner, id = '') => `<div class="axbox"><div class="yax"><span data-f1></span><em data-fu></em><span data-f0></span></div><div class="spec-box"${id ? ` id="${id}"` : ''}>${inner}</div></div><div data-x></div><div class="cbar"><span data-db></span><i class="magma"></i><span>0</span><em>dB relative to the loudest point</em></div>`;
function setSpecAxes(el, sg, dur) {
  const k = v => String(+(v / 1000).toFixed(v < 1000 ? 2 : 1));
  $('[data-f1]', el).textContent = sg ? k(sg.f1) : ''; $('[data-f0]', el).textContent = sg ? k(sg.f0 || 0) : ''; $('[data-fu]', el).textContent = sg ? (sg.scale === 'log' ? 'kHz, log' : 'kHz') : '';
  $('[data-x]', el).innerHTML = sg ? M.xAxis(+sg.t1 || +dur) : ''; $('[data-db]', el).textContent = sg ? '−' + (sg.db_range || 70) : ''; $('.cbar', el).hidden = !sg;
}
async function player(el, list, {title = 'Recordings', all} = {}) {
  el.innerHTML = `<div class="inst"><div class="inst-bar"><span class="title">${esc(title)}</span><span class="ctl"><span class="pb"></span>${all ? `<a class="btn sm" href="${all}">All recordings</a>` : ''}</span></div><div class="inst-body">${specAxes('<img alt="" data-img><div class="ph"></div>')}
    <p class="small muted" data-cap style="margin:.4rem 0 .6rem"></p><div class="seg" role="group" aria-label="Recording">${list.map((s, i) => `<button type="button" data-i="${i}" aria-pressed="${i === 0}">${esc(s.short || s.title)}</button>`).join('')}</div></div><div class="inst-foot"><span data-src></span></div></div>`;
  const {makePlayer, PLAY_ICON, PAUSE_ICON} = await import('./dsp.js?v=20261117a'); const audio = new Audio(), phd = $('.ph', el); makePlayer(audio, f => phd.style.left = (f * 100) + '%');
  const b = document.createElement('button'); b.className = 'play'; const setB = () => b.innerHTML = audio.paused ? PLAY_ICON + 'Play' : PAUSE_ICON + 'Pause'; ['play', 'pause', 'ended'].forEach(ev => audio.addEventListener(ev, setB)); setB(); b.onclick = () => audio.paused ? audio.play() : audio.pause(); $('.pb', el).appendChild(b);
  const pick = i => { const s = list[i]; audio.src = s.files.realtime || s.files.expanded || s.files.original; $('[data-img]', el).src = s.spectrogram?.file || ''; $('[data-img]', el).alt = `Spectrogram of ${s.title}`;
    $('[data-cap]', el).textContent = `${s.kind}, ${(+s.source.duration_s).toFixed(2)} s${s.files.expanded && !s.files.realtime ? '. Played at reduced speed; axes show the recording as made' : ''}.`; setSpecAxes(el, s.spectrogram, s.source.duration_s);
    $('[data-src]', el).textContent = `${s.source.citation.split('. doi')[0]}. ${s.source.licence}`; $$('[data-i]', el).forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.i === i))); };
  $$('[data-i]', el).forEach(x => x.onclick = () => { pick(+x.dataset.i); audio.play().catch(() => {}); });
  $('.spec-box', el).onclick = e => { const r = e.currentTarget.getBoundingClientRect(); if (audio.duration) { audio.currentTime = (e.clientX - r.left) / r.width * audio.duration; audio.play(); } };
  pick(0);
}

// ---------------------------------------------------------------- overview
async function home() {
  setTitle('');
  const sounds = await loadSounds();
  renderHome(main, {SPECIES, SP, sounds, hasAtlas, cited, refList: refItem, esc, fmt, reduced, V, explainedCards: () => articleCards(ARTICLES.slice(0, 3), {SP, esc}), explainedCount: ARTICLES.length});
}
async function explained(id) {
  const sounds = await loadSounds(), ctx = {SP, sounds, cited, refList: refItem, esc, REFS, reduced};
  if (id) { const a = renderArticle(main, id, ctx); if (a) return setTitle(a.title); }
  setTitle('Studies explained'); explainedIndex(main, ctx);
}

// ---------------------------------------------------------------- atlases
async function atlasIndex() {
  setTitle('Brain atlases');
  const list = SPECIES.filter(s => hasAtlas(s.id)), metas = await Promise.all(list.map(s => atlasMeta(s.id).catch(() => null)));
  const res = m => !m?.dims ? 'Surfaces only' : m.unit === 'voxel' ? `${m.dims.join(' × ')} voxels` : `${m.spacing_mm[0]} mm`;
  main.innerHTML = `<div class="wrap"><header class="page-head"><h1>Brain atlases</h1><p class="lede">${list.length} atlases from their original sources. Each can be viewed as orthogonal sections and as three-dimensional surfaces, with delineated regions searchable by name.</p></header>
    <div class="atlas-grid-s" style="margin-bottom:2.4rem">${list.map((s, i) => atlasTile(s, metas[i])).join('')}</div>
    <div class="tbl" style="margin-bottom:3rem"><table><thead><tr><th>Species</th><th>Atlas</th><th class="num">Regions</th><th class="hide-sm">Display grid</th><th class="hide-sm">Licence</th></tr></thead><tbody>
      ${list.map((s, i) => { const m = metas[i]; return `<tr><td><a href="#atlas/${s.id}">${esc(s.common)}</a><br><i>${esc(s.latin)}</i></td><td>${esc(m?.title || '')}<div class="small muted">${esc((m?.provenance?.citation || '').split('. doi')[0])}</div></td><td class="num">${m?.regions?.length || '–'}</td><td class="hide-sm">${res(m)}</td><td class="hide-sm small">${esc(m?.provenance?.licence || '')}</td></tr>`; }).join('')}</tbody></table></div></div>`;
}
const ATLAS_MARKUP = `<div id="atlas-viewer"><div class="atlas-grid"><aside class="atlas-side" aria-label="Atlas controls">
    <section id="av-regions-sec"><h2>Regions</h2><label class="vh" for="av-rsearch">Search regions</label><input id="av-rsearch" type="search" placeholder="Name or acronym"><ul class="region-list" id="av-regions"></ul><p class="small faint" id="av-rcount" style="margin:.4rem 0 0"></p></section>
    <section><h2>Image</h2><label class="vh" for="av-image">Image</label><select id="av-image"></select>
      <label style="display:flex;gap:.4rem;align-items:center;margin-top:.5rem;font-size:.88rem"><input type="checkbox" id="av-overlay" checked> Region colours</label>
      <label style="display:flex;gap:.4rem;align-items:center;margin-top:.3rem;font-size:.88rem"><input type="checkbox" id="av-outline"> Outline selected region</label></section></aside>
  <div><div class="view-tabs" role="tablist" aria-label="Atlas view" id="av-tabs"><button role="tab" id="tab-slices" aria-selected="true" aria-controls="panel-slices">Anatomy</button><button role="tab" id="tab-diff" aria-selected="false" aria-controls="panel-diff" hidden>Diffusion</button></div>
    <div id="panel-3d" hidden><div class="three-bar"><span class="seg" id="av-views" role="group" aria-label="View direction"></span></div>
      <div class="three-wrap" id="av-three"><div class="sp-scale" id="av-scale" aria-hidden="true" hidden><span></span><b></b></div><span class="three-help">Drag to rotate. Pinch, or hold Ctrl and scroll, to zoom.</span></div><p class="small faint" id="av-mesh-note"></p></div>
    <div id="panel-slices" role="tabpanel"><div class="readout" id="av-readout" aria-live="polite"></div><div class="planes" id="av-planes"></div><p class="small faint" id="av-note"></p></div>
    <div id="panel-diff" role="tabpanel" hidden><p class="notice" id="av-diff-note"></p><label class="field" for="av-diff-image">Map<select id="av-diff-image"></select></label><div class="planes" id="av-diff-planes" style="margin-top:.6rem"></div><div class="readout" id="av-diff-readout"></div></div>
    <details class="data-table" style="margin-top:1rem"><summary>Data preparation</summary><ul class="provenance" id="av-processing"></ul></details></div></div>
  <section class="cite-block" aria-label="Source, citation and files"><div><h2>Source and licence</h2><div class="provenance" id="av-prov"></div></div><div><h2>Citation</h2><div class="provenance" id="av-cite"></div></div><div><h2>Files</h2><ul class="provenance" id="av-files"></ul></div></section></div>`;
async function atlasPage(id) {
  const s = SP[id]; if (!s || !hasAtlas(id)) return atlasIndex();
  setTitle(`${s.common} brain atlas`);
  main.innerHTML = `<div class="wrap"><header class="page-head" style="padding-bottom:.6rem"><p class="crumb"><a href="#atlas">Brain atlases</a> / <a href="#species/${id}">${esc(s.common)}</a></p><h1 id="av-title"></h1><p class="muted" id="av-sub" style="margin:0 0 .9rem"></p><dl class="meta" id="av-facts"></dl><p style="margin:.9rem 0 0"><button class="btn sm" type="button" id="av-copy">Copy link to this view</button> <span class="small muted" id="av-copied" role="status"></span></p></header>${ATLAS_MARKUP}</div>`;
  const {openAtlas} = await import('./atlas.js?v=20261117a');
  await openAtlas(id, {status: t => { const r = $('#av-readout'); if (r) r.textContent = t || ''; }, esc, getJSON, sp: s});
}

// ---------------------------------------------------------------- species
async function speciesIndex() {
  setTitle('Species'); const sounds = await loadSounds();
  main.innerHTML = `<div class="wrap"><header class="page-head"><h1>Species</h1><p class="lede">${SPECIES.length} species with open data on communication, the brain, or both.</p></header><div style="margin-bottom:3rem">${speciesTable(sounds)}</div></div>`;
}
async function speciesPage(id, secId) {
  const s = SP[id]; if (!s) return speciesIndex();
  setTitle(s.common);
  const used = [], sounds = (await loadSounds()).filter(x => x.species === id), meta = hasAtlas(id) ? await atlasMeta(id).catch(() => null) : null;
  const analyses = ANALYSES.filter(r => r.species === id);
  const secs = [];
  if (id === 'zebra-finch') FINCH_SECTIONS.forEach(f => secs.push({id: f.id, title: f.title, inst: f.inst, wide: f.wide, html: f.text.map(p => `<p>${cited(p, used)}</p>`).join('') + (f.inst === 'pathway' ? `<ol class="pathway">${Object.entries(FINCH_PARTS).map(([k, p]) => `<li><button type="button" data-part="${esc(k)}" aria-pressed="false">${esc(p.title.split(' · ')[0])} <span>${esc(p.title.split(' · ')[1] || '')}</span><small>${esc(p.text)}</small></button></li>`).join('')}</ol><p style="margin-top:.8rem"><a href="#atlas/zebra-finch">Open the atlas viewer</a></p>` : '')}));
  else {
    const plan = CHAPTER_PLAN[id] || {titles: [], inst: [], facts: []};
    const bird = s.group === 'Songbird', seen = new Set();
    const AUD = /auditory|cochlear|inferior collicul|medial geniculate|superior oliv|lateral lemnisc|trapezoid body|field l\b|ovoidalis|nidopallium caudomedial|caudomedial nidopallium|caudal mesopallium|caudomedial mesopallium|high vocal|robust nucleus of the arcopallium|area x\b|cluster n\b/i, AUDA = new Set(['HVC', 'RA', 'LMAN', 'MAN', 'MLd', 'Ov', 'NCM', 'CMM', 'CM']);
    const aud = (meta?.regions || []).filter(r => (AUD.test(r.name) || (bird && AUDA.has(r.acronym))) && !/, layer /i.test(r.name) && !seen.has(r.name) && seen.add(r.name));
    const brain = () => `<dl class="meta" style="margin-top:.9rem"><dt>Atlas</dt><dd>${esc(meta.title)}</dd><dt>Regions</dt><dd>${meta.regions?.length ? fmt(meta.regions.length) : 'Not delineated'}</dd>${meta.dims ? `<dt>Grid</dt><dd>${meta.dims.join(' × ')}${meta.unit === 'voxel' ? ' voxels' : ` at ${meta.spacing_mm[0]} mm`}</dd>` : ''}<dt>Source</dt><dd>${esc((meta.provenance.citation || '').split('. doi')[0])}</dd><dt>Licence</dt><dd>${esc(meta.provenance.licence)}</dd></dl>
      ${aud.length ? `<h3 class="sub">${bird ? 'Auditory and song-system' : 'Auditory'} regions named in this atlas</h3><ul class="reg-links">${aud.slice(0, 16).map(r => `<li><a href="#atlas/${id}?r=${r.index}">${esc(r.name)}</a></li>`).join('')}</ul>${aud.length > 16 ? `<p class="small faint">${aud.length - 16} more in the atlas viewer.</p>` : ''}` : ''}
      <p style="margin-top:.9rem"><a href="#atlas/${id}">Open the atlas viewer</a></p>`;
    let brainDone = false;
    s.body.forEach((b, i) => { let inst = plan.inst[i] || ''; if (inst === 'sounds' && !sounds.length) inst = ''; if (inst === 'atlas3d' && !meta) inst = ''; const isBrain = inst === 'atlas3d'; brainDone ||= isBrain;
      secs.push({id: isBrain ? 'atlas' : 's' + i, title: plan.titles[i] || b[0], inst, textOnly: !inst, html: `<p>${cited(b[1] + ' ' + b[2].map(k => `[[${k}]]`).join(' '), used)}</p>${plan.extra?.[i] ? `<p>${cited(plan.extra[i], used)}</p>` : ''}${isBrain ? brain() : ''}`}); });
    if (meta && !brainDone) secs.push({id: 'atlas', title: 'The brain', inst: 'atlas3d', html: brain()});
    else if (s.atlasNote) secs.push({id: 'atlas', title: 'The brain', html: `<p>${esc(s.atlasNote)}${s.related ? ` <a href="#atlas/${s.related[0]}">${esc(s.related[1])}</a>` : ''}</p>`, textOnly: true});
    if (id === 'house-mouse') secs.push({id: 'cells', title: 'The cells themselves', inst: 'neurons', html: '<p>Stellate neurons of the inferior colliculus, the auditory midbrain, reconstructed from microscope images and distributed by NeuroMorpho.org.</p>'});
  }
  if (sounds.length && (id === 'zebra-finch' || !secs.some(x => x.inst === 'sounds'))) secs.push({id: 'recordings', title: 'Recordings', inst: 'sounds', html: `<p>${fmt(sounds.length)} recording${sounds.length > 1 ? 's' : ''}: ${[...new Set(sounds.map(x => x.kind.toLowerCase()))].slice(0, 6).join(', ')}.</p>`});
  const ex = ARTICLES.filter(x => x.species === id);
  if (ex.length) secs.splice(Math.min(1, secs.length), 0, {id: 'explained', title: 'Studies explained', full: articleCards(ex, {SP, esc})});
  if (analyses.length) secs.push({id: 'analyses', title: 'Analyses', full: analysisTable(analyses)});
  const atlasFig = meta && !secs.some(x => x.inst === 'atlas3d' || x.inst === 'pathway');
  main.innerHTML = `<div class="wrap"><div class="sp-head"><div><p class="crumb"><a href="#species">Species</a> / ${esc(s.group)}</p><h1>${esc(s.common)}</h1><p class="latin">${esc(s.latin)}</p><p class="lede">${esc(s.plain)}</p>${(() => { const F = id === 'zebra-finch' ? FINCH_FACTS : [...(CHAPTER_PLAN[id]?.facts || []), ...(meta?.regions?.length ? [[fmt(meta.regions.length), 'regions in the brain atlas']] : []), ...(sounds.length ? [[fmt(sounds.length), sounds.length > 1 ? 'recordings' : 'recording']] : [])]; return F.length ? `<ul class="facts-row">${F.map(f => `<li><b>${esc(f[0])}</b> ${cited(f[1], used)}</li>`).join('')}</ul>` : ''; })()}
      <dl class="meta" style="margin-top:1.2rem"><dt>Signals</dt><dd>${esc(s.signal)}</dd><dt>Brain atlas</dt><dd>${meta ? `<a href="#atlas/${id}">${esc(meta.title)}</a>` : 'None available'}</dd><dt>Recordings</dt><dd>${sounds.length ? fmt(sounds.length) : 'None'}</dd></dl></div>
    ${s.photo ? `<figure><img src="${esc(s.photo.src)}" alt="${esc(s.common)}"><p class="credit">Photograph: <a href="${esc(s.photo.url)}">${esc(s.photo.credit)}</a>, ${esc(s.photo.licence)}.${s.photo.note ? ' ' + esc(s.photo.note) : ''}</p></figure>` : '<div></div>'}</div></div>
  <nav class="subnav" aria-label="Sections"><ol>${secs.map(x => `<li><a href="#species/${id}/${x.id}" data-sec="${x.id}"><span class="sec-n">${secs.indexOf(x) + 1}</span>${esc(x.title)}</a></li>`).join('')}<li><a href="#species/${id}/refs" data-sec="refs">References</a></li></ol></nav>
  <div class="wrap">${secs.map(x => `<section class="sec" id="sec-${x.id}"><h2><span class="sec-n">${secs.indexOf(x) + 1}</span>${esc(x.title)}</h2>${x.full || (x.textOnly ? `<div class="prose text">${x.html}</div>` : `<div class="sec-grid${x.wide ? ' wide' : ''}"><div class="prose">${x.html}</div><div data-inst="${x.inst || ''}"></div></div>`)}</section>`).join('')}
    <section class="sec" id="sec-refs"><h2>References</h2><ol class="refs">${used.map(k => `<li>${refItem(k)}</li>`).join('') || '<li class="muted">See the atlas source above.</li>'}</ol></section></div>`;
  const mounts = {
    song: async el => { const d = await getJSON('data/models/zebra-finch/strf.json'); return player(el, Object.entries(d.songs).map(([k, v], i) => ({title: `Song ${i + 1}`, short: String(i + 1), kind: `Song of male ${k}`, files: {original: v.audio}, spectrogram: {file: v.spec, t1: v.dur, f0: 500, f1: 8000, scale: 'log', db_range: 70}, source: {duration_s: v.dur, citation: 'Le, Bjoring & Meliza (2025), figshare 10.6084/m9.figshare.29203457', licence: 'CC BY 4.0'}})), {title: 'Songs of eight males'}); },
    pathway: async el => { el.innerHTML = '<figure><div class="plate-view" style="height:440px"></div></figure>'; const v = await specimen($('.plate-view', el), 'zebra-finch', nm => $$('[data-part]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.part === nm)))); $$('[data-part]').forEach(b => b.onclick = () => { const on = b.getAttribute('aria-pressed') !== 'true'; v.select(on ? b.dataset.part : null); }); },
    atlas3d: async el => { if (!meta.meshes) { el.innerHTML = `<figure><a href="#atlas/${id}"><img src="assets/atlas-thumbs/${id}.jpg?v=${V}" alt="Section through the ${esc(s.common)} brain scan" style="max-width:420px;width:100%"></a><figcaption>Section from the scan. No surfaces or region labels exist for this specimen.</figcaption></figure>`; return; } el.innerHTML = '<figure><div class="plate-view" style="height:420px"></div></figure>'; await specimen($('.plate-view', el), id); },
    ear: el => M.mountEar(el, {initial: 'finch'}), strf: el => M.mountSTRF(el), ra: el => M.mountRA(el), neurons: el => M.mountNeurons(el, {species: id === 'house-mouse' ? 'house-mouse' : 'zebra-finch'}),
    sounds: el => player(el, sounds.slice(0, 8).map(x => ({...x, short: x.title.replace(/ — example /, ' ').replace(/Ultrasonic vocalizations, /, '').replace(/ of the source file/, '').slice(0, 26)})), {all: `#recordings/${sounds[0].id}`}),
  };
  const mount = el => { if (el.dataset.mounted) return; el.dataset.mounted = '1'; io.unobserve(el); Promise.resolve(mounts[el.dataset.inst]?.(el)).catch(err => { el.innerHTML = `<p class="notice">${esc(err.message)}</p>`; }); };
  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && mount(e.target)), {rootMargin: '300px'});
  const insts = $$('[data-inst]', main); insts.forEach(el => el.dataset.inst && io.observe(el));
  setTimeout(() => insts.filter(el => el.dataset.inst && !el.dataset.mounted && el.isConnected).forEach((el, i) => setTimeout(() => el.isConnected && mount(el), i * 400)), 2500);
  const links = $$('.subnav a');
  links.forEach(a => a.onclick = e => { e.preventDefault(); history.replaceState(null, '', a.getAttribute('href')); document.getElementById('sec-' + a.dataset.sec)?.scrollIntoView({behavior: reduced() ? 'auto' : 'smooth'}); });
  const so = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', 'sec-' + a.dataset.sec === e.target.id)); }), {rootMargin: '-40% 0px -55% 0px'});
  $$('.sec').forEach(x => so.observe(x));
  if (secId) { const go = () => document.getElementById('sec-' + secId)?.scrollIntoView(); requestAnimationFrame(go); setTimeout(go, 500); setTimeout(go, 1700); }
}

// ---------------------------------------------------------------- recordings
const lib = {page: 0, cur: null, mode: null, audio: null};
const PER = 25;
async function recordings(arg) {
  if (arg === 'video') return video();
  setTitle('Recordings'); const all = await loadSounds();
  if (!$('#lib')) {
    main.innerHTML = `<div class="wrap"><header class="page-head"><h1>Recordings</h1><p class="lede">${fmt(all.length)} recordings with spectrograms, each with its source, licence and original file name. Ultrasonic calls are also provided at reduced playback speed.</p><p><a href="#recordings/video">Research video</a></p></header>
      <div id="lib"><div class="inst" id="pl" style="max-width:720px"><div class="inst-bar"><span class="title" id="pl-t">No recording selected</span><span class="pb"></span></div>
        <div class="inst-body">${specAxes('<img id="pl-img" alt=""><div class="ph"></div><div class="hover-read" hidden id="pl-hov"></div>', 'pl-box')}
          <div style="margin:.6rem 0" class="seg" id="pl-mode" role="group" aria-label="Playback version"></div><div id="pl-meta" class="small muted"></div></div></div>
      <div class="filters" style="margin-top:1.6rem"><label class="field" for="f-sp">Species<select id="f-sp"><option value="">All</option>${SPECIES.filter(s => all.some(x => x.species === s.id)).map(s => `<option value="${s.id}">${esc(s.common)}</option>`).join('')}</select></label>
        <label class="field" for="f-k">Type<select id="f-k"><option value="">All</option></select></label><label class="field" for="f-q">Name<input id="f-q" type="search"></label></div>
      <div class="tbl"><table><thead><tr><th>Recording</th><th>Species</th><th class="hide-sm">Type</th><th class="num">Duration</th><th class="hide-sm">Recordist or source</th><th class="hide-sm">Licence</th></tr></thead><tbody id="lib-list"></tbody></table></div>
      <div class="pager" id="lib-pager" style="margin-bottom:3rem"></div></div></div>`;
    const kinds = () => { const sp = $('#f-sp').value; $('#f-k').innerHTML = '<option value="">All</option>' + [...new Set(all.filter(s => !sp || s.species === sp).map(s => s.kind))].sort().map(k => `<option>${esc(k)}</option>`).join(''); };
    kinds(); $('#f-sp').onchange = () => { kinds(); lib.page = 0; libList(all); }; $('#f-k').onchange = $('#f-q').oninput = () => { lib.page = 0; libList(all); };
    const {makePlayer, PLAY_ICON, PAUSE_ICON} = await import('./dsp.js?v=20261117a');
    lib.audio = new Audio(); const phd = $('#pl-box .ph'); makePlayer(lib.audio, f => phd.style.left = (f * 100) + '%');
    const b = document.createElement('button'); b.className = 'play'; const setB = () => b.innerHTML = lib.audio.paused ? PLAY_ICON + 'Play' : PAUSE_ICON + 'Pause'; ['play', 'pause', 'ended'].forEach(ev => lib.audio.addEventListener(ev, setB)); setB(); b.onclick = () => lib.audio.paused ? lib.audio.play() : lib.audio.pause(); $('#pl .pb').appendChild(b);
    const box = $('#pl-box'), hov = $('#pl-hov');
    box.onpointermove = e => { const s = all.find(x => x.id === lib.cur), sg = s?.spectrogram; if (!sg) return; const r = box.getBoundingClientRect(), t = (e.clientX - r.left) / r.width * sg.t1, fr = 1 - (e.clientY - r.top) / r.height, f = sg.scale === 'log' ? sg.f0 * (sg.f1 / sg.f0) ** fr : (sg.f0 || 0) + fr * (sg.f1 - (sg.f0 || 0)); hov.hidden = false; hov.style.left = (e.clientX - r.left) + 'px'; hov.style.top = (e.clientY - r.top) + 'px'; hov.textContent = `${t < 1 ? (t * 1000).toFixed(0) + ' ms' : t.toFixed(2) + ' s'}, ${f >= 1000 ? (f / 1000).toFixed(1) + ' kHz' : f.toFixed(0) + ' Hz'}`; };
    box.onpointerleave = () => hov.hidden = true; box.onclick = e => { const r = box.getBoundingClientRect(); if (lib.audio.duration) { lib.audio.currentTime = (e.clientX - r.left) / r.width * lib.audio.duration; lib.audio.play(); } };
  }
  if (arg) { const s = all.find(x => x.id === arg); if (s) { if ($('#f-sp').value && $('#f-sp').value !== s.species) { $('#f-sp').value = s.species; $('#f-sp').onchange(); } lib.page = Math.max(0, Math.floor(libFiltered(all).findIndex(x => x.id === arg) / PER)); lib.cur = arg; libLoad(s); } }
  if (!lib.cur) { const f = libFiltered(all)[0]; if (f) { lib.cur = f.id; libLoad(f); } }
  libList(all);
}
function libFiltered(all) { const sp = $('#f-sp').value, k = $('#f-k').value, q = $('#f-q').value.trim().toLowerCase(); return all.filter(s => (!sp || s.species === sp) && (!k || s.kind === k) && (!q || (s.title + ' ' + s.id + ' ' + s.kind).toLowerCase().includes(q))); }
const srcShort = c => { const m = (c || '').match(/^(.*?\(\d{4}\))/); return m ? m[1] : (c || '').split('. doi')[0].slice(0, 80); };
function libList(all) {
  const L = libFiltered(all), pages = Math.max(1, Math.ceil(L.length / PER)); lib.page = Math.min(lib.page, pages - 1);
  $('#lib-list').innerHTML = L.slice(lib.page * PER, lib.page * PER + PER).map(s => `<tr aria-current="${s.id === lib.cur}"><td><button type="button" class="row-btn" data-id="${esc(s.id)}">${esc(s.title)}</button></td><td>${esc(SP[s.species].common)}</td><td class="hide-sm">${esc(s.kind)}</td><td class="num">${(+s.source.duration_s) < 1 ? Math.round(s.source.duration_s * 1000) + ' ms' : (+s.source.duration_s).toFixed(2) + ' s'}</td><td class="hide-sm small">${esc(srcShort(s.source.citation))}</td><td class="hide-sm small">${esc(s.source.licence)}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">No recordings match.</td></tr>';
  $('#lib-pager').innerHTML = `<span>${fmt(L.length)} recordings</span><span><button class="btn sm" ${lib.page ? '' : 'disabled'} data-p="-1">Previous</button> ${lib.page + 1} / ${pages} <button class="btn sm" ${lib.page < pages - 1 ? '' : 'disabled'} data-p="1">Next</button></span>`;
  $$('#lib-pager [data-p]').forEach(b => b.onclick = () => { lib.page += +b.dataset.p; libList(all); });
  $$('#lib-list .row-btn').forEach(b => b.onclick = () => { history.replaceState(null, '', '#recordings/' + b.dataset.id); lib.cur = b.dataset.id; libLoad(all.find(x => x.id === b.dataset.id)); $$('#lib-list tr').forEach(r => r.setAttribute('aria-current', String(r.contains(b)))); lib.audio.play().catch(() => {}); });
}
function libLoad(s) {
  $('#pl-t').textContent = `${SP[s.species].common}: ${s.title}`;
  const modes = Object.keys(s.files), lab = {original: 'Original', realtime: 'Real time', expanded: s.species === 'house-mouse' ? '1/16 speed' : '1/10 speed'};
  lib.mode = modes.includes('realtime') ? 'realtime' : modes[0]; lib.audio.src = s.files[lib.mode];
  $('#pl-mode').innerHTML = modes.length > 1 ? modes.map(m => `<button type="button" data-m="${m}" aria-pressed="${m === lib.mode}">${lab[m]}</button>`).join('') : ''; $('#pl-mode').hidden = modes.length < 2;
  $$('#pl-mode button').forEach(b => b.onclick = () => { lib.mode = b.dataset.m; lib.audio.src = s.files[lib.mode]; lib.audio.play(); $$('#pl-mode button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
  const sg = s.spectrogram; $('#pl-img').src = sg?.file || ''; $('#pl-img').alt = sg ? `Spectrogram, ${((sg.f0 || 0) / 1000)} to ${(sg.f1 / 1000).toFixed(0)} kHz, ${(+sg.t1).toFixed(2)} s` : '';
  setSpecAxes($('#pl'), sg, s.source.duration_s);
  const src = s.source;
  $('#pl-meta').innerHTML = `<p style="margin:0 0 .4rem">${esc(s.playback)}</p><dl class="meta"><dt>Source</dt><dd>${esc(src.citation)} ${src.url ? `<a href="${esc(src.url)}">record</a>` : ''}</dd><dt>Licence</dt><dd>${esc(src.licence)}</dd><dt>File</dt><dd class="mono">${esc(src.file)}</dd><dt>Sample rate</dt><dd>${src.sample_rate ? fmt(src.sample_rate) + ' Hz' : '–'}</dd></dl>`;
}
async function video() {
  setTitle('Research video');
  const [old, bat] = await Promise.all([getJSON('data/videos.json'), getJSON('data/videos-bat.json')]);
  const items = [...old.map(v => ({sp: 'zebra-finch', title: /01833/.test(v.path) ? 'Intracellular recording from an HVC neuron during singing' : 'Group-housed zebra finches with individual microphones', src: 'assets/' + v.path.split('/').pop(), credit: `${v.credit}. ${v.license}`, link: v.source_url})),
    ...bat.map(v => ({sp: 'egyptian-fruit-bat', title: v.title.replace(/^Example video of /, '').replace(/^./, c => c.toUpperCase()), text: v.description, src: v.web_file, credit: `Prat, Taub, Pratt & Yovel (2017). ${v.licence}`, link: v.url}))];
  main.innerHTML = `<div class="wrap"><header class="page-head"><p class="crumb"><a href="#recordings">Recordings</a></p><h1>Research video</h1><p class="lede">Supplementary video from published studies and open datasets.</p></header>
    ${['zebra-finch', 'egyptian-fruit-bat'].map(sp => `<h2 style="margin-top:1.4rem">${esc(SP[sp].common)}</h2><div class="film-grid">${items.filter(i => i.sp === sp).map(v => `<article class="film"><video controls preload="metadata" src="${esc(v.src)}"></video><h3>${esc(v.title)}</h3>${v.text ? `<p>${esc(v.text)}</p>` : ''}<p class="small faint">${esc(v.credit)} <a href="${esc(v.link)}">Source</a></p></article>`).join('')}</div>`).join('')}<div style="height:3rem"></div></div>`;
}

// ---------------------------------------------------------------- research
async function research(id) {
  if (id === 'finch-strf') return strfReport();
  if (id === 'finch-restoration') return restorationReport();
  if (id) return analysisDetail(id);
  setTitle('Research');
  main.innerHTML = `<div class="wrap"><header class="page-head"><h1>Research</h1><p class="lede">Reanalyses of published results from deposited data, models fitted to open recordings, and guides to primary studies.</p><p><a href="#literature">Literature</a> · <a href="#data">Data sources and methods</a></p></header>
    <div style="margin-bottom:3rem">${analysisTable(ANALYSES)}</div></div>`;
}
const statusClass = s => s.startsWith('reproduced') ? 'reproduced' : s.startsWith('consistent') ? (s.includes('partly') ? 'partial' : 'consistent') : s.includes('discrep') ? 'discrepancy' : s.startsWith('not') ? 'uncheckable' : 'partial';
async function analysisDetail(id) {
  const r = REVIEWS.find(x => x.id === id); if (!r) return research(); if (r.legacy) { location.replace('#' + id); return; }
  setTitle(r.title); const d = await getJSON(`data/checks/${id}.json`);
  main.innerHTML = `<div class="wrap"><article class="paper-article"><p class="crumb"><a href="#research">Research</a> / <a href="#species/${r.species}">${esc(SP[r.species].common)}</a></p>
    <h1 class="paper-title">${esc(d.title)}</h1><p>${chip(r.verdict)} <span class="muted small">${esc(r.kind)}</span></p><p class="lede">${esc(r.summary)}</p>
    <p class="paper-citation">${esc(d.paper.citation)}</p>
    <h2>Claims examined</h2>${d.claims.map(c => `<div class="claim"><header><q>${esc(c.claim)}</q>${chip(statusClass(c.status), c.status)}</header><p class="small faint">${esc(c.source)}</p><p>${esc(c.result)}</p>${c.scope ? `<p class="small muted">${esc(c.scope)}</p>` : ''}</div>`).join('')}
    <h2 style="margin-top:1.6rem">Figures</h2><div id="rv-figs"></div>
    <div class="method-box"><h3>Method</h3><p>${esc(d.method)}</p><h3>Limitations</h3><p>${esc(d.limits)}</p><p class="small">Data licence: ${esc(d.data.licence)}. <a href="data/checks/${esc(id)}.json" download>Results (JSON)</a> · <a href="${GH}/blob/main/scripts/build_collections.py">Analysis script</a></p></div></article></div>`;
  charts.forReview(id, d, $('#rv-figs'));
}
async function strfReport() {
  setTitle('Spectro-temporal receptive fields');
  const d = await getJSON('data/models/zebra-finch/strf.json'), areas = ['FL', 'CM', 'NCM', 'unassigned'].filter(a => d.summary[a]), nm = {FL: 'Field L', CM: 'CM', NCM: 'NCM', unassigned: 'Area not assigned'};
  main.innerHTML = `<div class="wrap"><article class="paper-article"><p class="crumb"><a href="#research">Research</a> / <a href="#species/zebra-finch">Zebra finch</a></p>
    <h1 class="paper-title">Spectro-temporal receptive fields of zebra finch auditory neurons</h1><p>${chip('model', 'Model')}</p>
    <p class="lede">A linear receptive field was fitted to each neuron’s responses, holding out each of eight songs in turn. Of ${d.units_total} recorded units, ${d.units_fitted} with a mean rate of at least 1 spike/s were modelled.</p>
    <p class="paper-citation">Data: ${esc(d.data.paper)} Dataset ${esc(d.data.record)}, ${esc(d.data.licence)}.</p>
    <div class="tbl"><table><thead><tr><th>Area</th><th class="num">Neurons</th><th class="num">Median r, held-out song</th><th class="num">Interquartile range</th><th class="num">Median reliability</th></tr></thead><tbody>${areas.map(a => `<tr><td>${nm[a]}</td><td class="num">${d.summary[a].n}</td><td class="num">${d.summary[a].r_median}</td><td class="num">${d.summary[a].r_q.join(' – ')}</td><td class="num">${d.summary[a].rel_median}</td></tr>`).join('')}</tbody></table></div>
    <div id="strf-hist"></div>
    <div class="method-box"><h3>Method</h3><p>Spectrogram: ${esc(d.method.spectrogram)}.</p><p>Model: ${esc(d.method.model)}.</p><p>Validation: ${esc(d.method.validation)}</p><p>Reliability: ${esc(d.method.reliability)}</p>
    <h3>Limitations</h3><p>Recordings were made under anaesthesia. Linear receptive fields do not capture non-linear selectivity. “Area not assigned” denotes recording sites not attributed to a single region by the authors. Median r is highest in the unassigned units, which also have the highest response reliability; because reliability differs between areas, the area medians are not a direct comparison of linearity. The ridge penalty was selected on the held-out songs, which inflates r.</p>
    <p class="small"><a href="data/models/zebra-finch/strf.json" download>Model file (JSON)</a> · <a href="${GH}/blob/main/scripts/build_finch_models.py">Analysis script</a></p></div></article></div>`;
  charts.hist($('#strf-hist'), {title: 'Prediction accuracy on held-out songs', xlabel: 'Correlation between predicted and measured firing rate (r)', ylabel: 'Neurons', edges: d.hist_edges, series: areas.filter(a => a !== 'unassigned').map(a => ({label: nm[a], counts: d.summary[a].hist})), note: 'One value per neuron: r averaged over eight leave-one-song-out tests.'});
}
async function restorationReport() {
  setTitle('Responses to occluded song syllables');
  const d = await getJSON('data/models/zebra-finch/strf.json'), R = d.restoration, areas = ['FL', 'CM', 'NCM'].filter(a => R[a]);
  main.innerHTML = `<div class="wrap"><article class="paper-article"><p class="crumb"><a href="#research">Research</a> / <a href="#species/zebra-finch">Zebra finch</a></p>
    <h1 class="paper-title">Responses to occluded song syllables in zebra finch auditory forebrain</h1><p>${chip('partial')} <span class="muted small">Reanalysis</span></p>
    <p class="lede">In auditory restoration, a sound replaced by noise is perceived as continuing through the noise. Le, Bjoring and Meliza report a neural correlate in the zebra finch auditory forebrain.</p>
    <p class="paper-citation">${esc(REFS.le2025.cite)} <a href="https://doi.org/${REFS.le2025.doi}">doi:${REFS.le2025.doi}</a></p>
    <h2>Claim examined</h2>
    <div class="claim"><header><q>Populations of single units respond to songs in which the original audio of an element is completely replaced by noise as if the missing element were present alongside the noise.</q>${chip('partial', 'consistent, partly checked')}</header>
      <p>Population responses within each gap window were compared across three stimulus versions: syllable plus noise (CN), syllable replaced by noise (GN), and the same noise without song (N). Data: ${areas.map(a => `${R[a].units} ${a}`).join(', ')} units; 16 gap windows.</p>
      <p>In every area the response to GN correlated more strongly with CN than with N. No inferential test was performed.</p></div>
    <div class="tbl"><table><thead><tr><th>Area</th><th class="num">Units</th><th class="num">r(GN, CN)</th><th class="num">r(GN, N)</th><th class="num">r(GN, silent gap)</th><th class="num">CN split-half</th><th class="num">Windows with r(GN,CN) &gt; r(GN,N)</th></tr></thead><tbody>${areas.map(a => `<tr><td>${a}</td><td class="num">${R[a].units}</td><td class="num">${R[a].gn_cn}</td><td class="num">${R[a].gn_n}</td><td class="num">${R[a].gn_g}</td><td class="num">${R[a].cn_split}</td><td class="num">${Math.round(R[a].frac_gn_closer_to_cn * 100)}%</td></tr>`).join('')}</tbody></table></div>
    <div class="method-box"><h3>Interpretation</h3><p>GN and CN share the song preceding the gap, whereas N contains no song. Part of their similarity may therefore reflect shared context rather than restoration of the missing element. Gap windows recorded from the same units are not independent, and correlating responses concatenated across units inflates r, because differences in mean firing rate between units contribute to the correlation. The decoding analyses and additional controls of the original study are not reproduced here.</p>
    <h3>Method</h3><p>Trial-averaged firing rates in 5 ms bins from gap onset to 50 ms after gap offset, concatenated across all units of an area and correlated between conditions. CN split-half is the correlation between odd and even trials.</p>
    <p class="small"><a href="data/models/zebra-finch/strf.json" download>Results (JSON, field “restoration”)</a> · <a href="${GH}/blob/main/scripts/build_finch_models.py">Analysis script</a></p></div></article></div>`;
}
function legacy(id) {
  setTitle({'paper-hamaguchi': 'Auditory feedback to HVC neurons', 'perception-model': 'Perceptual-choice baseline'}[id]);
  main.innerHTML = `<div class="wrap" style="padding:1.6rem 0 3rem"><p class="crumb"><a href="#research">Research</a></p></div>`;
  $('.wrap', main).appendChild(document.getElementById('tpl-' + id).content.cloneNode(true));
  const notes = {a: 'Panel A: schematic of the preparation. Red, song motor pathway; blue, anterior forebrain pathway. The electrode records an HVC neuron projecting to Area X.', b: 'Panel B: spike-collision test identifying an HVC neuron that projects to Area X.', c: 'Panel C: feedback manipulation. Hit trials trigger playback; catch trials withhold it.', d: 'Panel D: song spectrogram with intracellular voltage. The orange interval marks feedback playback. Figure 2 gives the population analysis.'};
  $$('[data-paper-panel]').forEach(b => b.onclick = () => { $$('[data-paper-panel]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); $('#figure-panel-note').textContent = notes[b.dataset.paperPanel]; });
  $$('[data-enlarge]').forEach(b => b.onclick = () => { const o = document.getElementById(b.dataset.enlarge); $('#big-img').src = o.src; $('#big-img').alt = o.alt; $('#fig-dlg').showModal(); });
}
async function literature() {
  setTitle('Literature');
  const old = await getJSON('data/sources.json'), known = new Set(Object.values(REFS).map(r => (r.doi || '').toLowerCase()));
  const rows = [...Object.values(REFS).map(r => ({c: r.cite, d: r.doi, u: r.url})), ...old.filter(o => !o.doi || !known.has(o.doi.toLowerCase())).map(o => ({c: o.title, d: o.doi, u: o.source_url}))];
  main.innerHTML = `<div class="wrap"><header class="page-head"><p class="crumb"><a href="#research">Research</a></p><h1>Literature</h1><p class="lede">${rows.length} publications and datasets cited or catalogued.</p><label class="field" for="lq">Search<input id="lq" type="search"></label></header><ol class="refs" id="lt" style="margin-bottom:3rem"></ol></div>`;
  const draw = () => { const q = $('#lq').value.toLowerCase(); $('#lt').innerHTML = rows.filter(r => !q || r.c.toLowerCase().includes(q)).map(r => `<li>${esc(r.c)} ${r.d ? `<a href="https://doi.org/${esc(r.d)}">doi:${esc(r.d)}</a>` : r.u ? `<a href="${esc(r.u)}">link</a>` : ''}</li>`).join(''); };
  $('#lq').oninput = draw; draw();
}

// ---------------------------------------------------------------- data, about
async function dataPage() {
  setTitle('Data and methods');
  const [reg, src] = await Promise.all([getJSON('data/registry.json'), getJSON('data/sources-extra.json').catch(() => [])]);
  const rows = [...src, ...reg];
  main.innerHTML = `<div class="wrap"><header class="page-head"><h1>Data and methods</h1><p class="lede">Sources, licences and processing for every dataset in the collection.</p></header>
    <h2>Sources</h2><div class="tbl" style="margin-bottom:2.4rem"><table><thead><tr><th>Species</th><th>Resource</th><th>Licence</th><th class="hide-sm">Use</th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(SP[r.species]?.common || 'Several')}</td><td><a href="${esc(r.url)}">${esc(r.name)}</a></td><td class="small">${esc(r.licence)}</td><td class="small hide-sm">${esc(r.use)}</td></tr>`).join('')}</tbody></table></div>
    <div class="split" style="margin-bottom:2.4rem"><div><h2>Methods</h2>
      <p><b>Atlases.</b> Volumes keep their source spacing or are resampled as stated on each atlas page; labels are resampled by nearest neighbour. Atlases are not registered to one another. Where source files give no physical unit, coordinates are reported in voxels.</p>
      <p><b>Spectrograms.</b> Short-time Fourier transforms of the original samples (Hann window), in decibels relative to the loudest part of each recording. Levels are not calibrated.</p>
      <p><b>Reduced-speed playback.</b> The original samples played at 1/16 speed (mouse) or 1/10 speed (bat, rat); all frequencies are divided by the same factor.</p>
      <p><b>Cochlear filterbank.</b> Gammatone filters with equivalent rectangular bandwidths after Glasberg and Moore (1990), computed in the browser.</p>
      <p><b>Receptive-field models.</b> Linear spectro-temporal receptive fields fitted by ridge regression and evaluated on held-out songs.</p></div>
    <div><h2>Outcome categories</h2><dl class="meta">${Object.entries(VERDICTS).map(([k, v]) => `<dt>${chip(k)}</dt><dd>${esc(v.text)}</dd>`).join('')}<dt>${chip('model', 'Model')}</dt><dd>A model fitted to open data and reported with its validation.</dd></dl>
      <h2 style="margin-top:1.6rem">Reproducibility</h2><p>Derived files are generated from the original downloads by scripts in the <a href="${GH}">repository</a>. Source URLs and SHA-256 checksums are listed in <a href="${GH}/blob/main/research/sources-2026-11.json">sources-2026-11.json</a>.</p></div></div></div>`;
}
const RELEASES = [
  ['3.1', '13 November 2026', 'Studies explained: plain-language summaries of five published studies (zebra finch, house mouse, Egyptian fruit bat, Norway rat, honeybee), each written from the full text of the paper, with its limits and a glossary.'],
  ['3.0', '13 November 2026', 'New overview page: recordings drawn as live spectrograms while they play, a scroll-linked introduction and a wall of the animals. New typeface (Geist) and a neutral charcoal palette. The sperm whale was removed because no openly licensed brain imaging of the species exists.'],
  ['2.4', '12 November 2026', 'Mouse lemur brain atlas (120 structures). Recordings added: rat 22-kHz ultrasonic calls, three starling song recordings, eighteen call recordings of Micklem’s mole-rat, two mouse lemur calls.'],
  ['2.3', '12 November 2026', 'Axes, units and colour scales on all figures; one colour map for all spectrograms; recordings listed in a table with source and licence; whole zebra finch songs added to the recordings.'],
  ['2.2', '12 November 2026', 'Atlas viewer shows the three-dimensional view and sections together; a surface for every labelled region; view links; source, citation and file listing on each atlas page.'],
  ['2.1', '12 November 2026', 'Chapter pages for all twelve species; corrections from an accuracy review of the texts and analyses; six references added; accessibility fixes.'],
  ['2.0', '12 November 2026', 'Rebuilt as a multi-species collection: eleven brain atlases, receptive-field models of zebra finch auditory neurons, reanalyses of deposited data.'],
  ['1.0', '9 November 2026', 'Zebra finch and sperm whale collections.']];
function about() {
  setTitle('About');
  main.innerHTML = `<div class="wrap"><header class="page-head"><h1>About</h1><p class="lede">An independent, non-commercial collection of open data on animal communication and its neural basis, with an emphasis on three-dimensional brain atlases and the auditory and vocal systems.</p></header>
  <div class="split" style="margin-bottom:3rem"><div class="text"><h2>Scope and sources</h2><p>All recordings, images, atlases, neuron reconstructions and videos come from published studies or public repositories and retain their original licences. Derived figures and models are generated from those data by published scripts. The collection is not affiliated with the institutions whose data it presents. Some resources, including the Allen mouse atlas and InsectBrainDB surfaces, permit non-commercial use only.</p>
    <h2>Citing</h2><p>Animal Communication &amp; Neuroscience (2026). https://jordanxxlopez.github.io/animal-communication-neuroscience/. Original data sources should be cited as listed on each page.</p></div>
  <div><h2>Accessibility</h2><p>Text size, contrast, colour theme and motion can be set under Display. Section views and the three-dimensional specimen views respond to the arrow keys, and every region shown in three dimensions is also listed as text. Charts are accompanied by data tables, and spectrograms carry text descriptions.</p><h2>Source code</h2><p><a href="${GH}">${GH.replace('https://', '')}</a></p>
    <h2>Corrections and contact</h2><p>Corrections, missing attributions and suggestions for datasets are received through the <a href="${GH}/issues">issue tracker</a> of the repository.</p></div></div>
  <section style="margin-bottom:3rem"><h2>Version</h2><p>Version ${RELEASES[0][0]}, updated ${RELEASES[0][1]}.</p>
    <div class="tbl"><table><thead><tr><th>Version</th><th>Date</th><th>Changes</th></tr></thead><tbody>${RELEASES.map(r => `<tr><td>${r[0]}</td><td style="white-space:nowrap">${r[1]}</td><td>${esc(r[2])}</td></tr>`).join('')}</tbody></table></div></section></div>`;
}

route();
