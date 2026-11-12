import {SPECIES, REFS, ATLASES, REVIEWS, VERDICTS} from './content.js';
import * as charts from './charts.js';

const V = '20261112';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const cache = new Map();
export const getJSON = p => { if (!cache.has(p)) cache.set(p, fetch(`${p}?v=${V}`).then(r => { if (!r.ok) throw Error(`Could not load ${p} (${r.status})`); return r.json(); })); return cache.get(p); };
const status = t => { const b = $('#global-status'); b.textContent = t; b.hidden = !t; };
const spById = Object.fromEntries(SPECIES.map(s => [s.id, s]));
const fmt = n => Number(n).toLocaleString('en-US');
const doiLink = d => `<a href="https://doi.org/${esc(d)}">doi:${esc(d)}</a>`;
const refHTML = k => { const r = REFS[k]; return r ? `${esc(r.cite)} ${doiLink(r.doi)}` : esc(k); };
const chip = (v, label) => `<span class="chip ${esc(v)}">${esc(label ?? VERDICTS[v]?.label ?? v)}</span>`;

// ------------------------------------------------------------------ display settings
const settingsKeys = ['theme', 'size', 'contrast', 'motion', 'plain'];
function loadSettings() { try { return JSON.parse(localStorage.getItem('acn-display') || '{}'); } catch { return {}; } }
function applySettings(s) {
  for (const k of settingsKeys) { if (s[k]) document.documentElement.dataset[k] = s[k]; else delete document.documentElement.dataset[k]; }
  try { localStorage.setItem('acn-display', JSON.stringify(s)); } catch {}
}
{
  const dlg = $('#settings'), form = $('#settings-form'), s = loadSettings();
  for (const k of settingsKeys) { const r = form.querySelector(`input[name="${k}"][value="${s[k] || ''}"]`); if (r) r.checked = true; }
  form.addEventListener('change', () => { const n = {}; for (const k of settingsKeys) n[k] = form.querySelector(`input[name="${k}"]:checked`)?.value || ''; applySettings(n); });
  $('#open-settings').addEventListener('click', () => dlg.showModal());
  $('#close-settings').addEventListener('click', () => dlg.close());
}

// ------------------------------------------------------------------ data
let SOUNDS = null;
async function loadSounds() {
  if (SOUNDS) return SOUNDS;
  const [finch, marine, specs, extra] = await Promise.all([getJSON('data/recordings.json'), getJSON('data/marine-recordings.json'), getJSON('data/spectrograms.json'), getJSON('data/sounds.json')]);
  const legacySpec = (name) => { const s = specs[name]; return s ? {file: s.url, t0: 0, t1: s.time_end_seconds, f0: 0, f1: s.frequency_max_hz, db_range: Math.abs(s.level_range_db[0]), nperseg: s.fft_size, hop: s.hop_samples, window: 'hann'} : null; };
  const f = finch.map(r => ({id: r.name, species: 'zebra-finch', title: r.name, kind: 'Song syllable (prepared stimulus)', files: {original: r.url}, spectrogram: legacySpec(r.name),
    source: {sample_rate: r.sample_rate, duration_s: r.duration_seconds, file: r.archive_member, sha256: r.sha256, doi: '10.5281/zenodo.5545872', url: 'https://doi.org/10.5281/zenodo.5545872', licence: 'See acquisition manifest',
      citation: 'Machine Learning for Bird Song Learning (ML4BL) dataset; Zandberg et al. (2024) PLOS Computational Biology. doi:10.1371/journal.pcbi.1012329'},
    playback: 'Original prepared WAV served unchanged.'}));
  const m = marine.map(r => ({id: r.name, species: 'sperm-whale', title: r.name.replace(/_/g, ' '), kind: r.kind || 'Field recording', files: {original: r.url}, spectrogram: legacySpec(r.name),
    source: {sample_rate: r.sample_rate, duration_s: r.duration_seconds, file: r.archive_member, sha256: r.sha256, url: r.source_url, licence: 'See source record', citation: r.context || ''},
    playback: 'Original supplementary WAV served unchanged.'}));
  SOUNDS = [...extra, ...m, ...f];
  return SOUNDS;
}

// ------------------------------------------------------------------ router
const PAGES = ['home', 'species', 'species-detail', 'sounds', 'atlas', 'review', 'review-detail', 'films', 'studies', 'methods', 'about', 'paper-hamaguchi', 'paper-sperm-whale', 'perception-model'];
const LEGACY = {'zebra-finch': 'species/zebra-finch', 'sperm-whale': 'species/sperm-whale', recordings: 'sounds', 'data-registry': 'methods', 'scale-audit': 'methods', 'acoustic-method': 'methods', 'quality-note': 'methods'};
const TITLES = {home: '', species: 'Species', sounds: 'Sound library', atlas: 'Brain atlases', review: 'Research review', films: 'Video', studies: 'Literature', methods: 'Data & methods', about: 'About, integrity and accessibility',
  'paper-hamaguchi': 'Auditory feedback to HVC neurons', 'paper-sperm-whale': 'Measuring the structure of a sperm whale coda', 'perception-model': 'Perceptual-choice baseline'};

function show(id, title) {
  $$('.page').forEach(p => p.hidden = p.id !== id);
  const navId = {'species-detail': 'species', 'review-detail': 'review', 'paper-hamaguchi': 'review', 'paper-sperm-whale': 'review', 'perception-model': 'review'}[id] || id;
  $$('.primary-nav a').forEach(a => a.hash === '#' + navId ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  $$('audio,video').filter(m => m.closest('.page')?.id !== id).forEach(m => m.pause());
  document.title = (title ? title + ' | ' : '') + 'Animal Communication & Neuroscience';
}

async function route() {
  let hash = decodeURIComponent(location.hash.slice(1)) || 'home';
  if (hash === 'main') return;
  if (LEGACY[hash]) { const target = LEGACY[hash]; if (!target.includes('/') && hash !== target && $('#' + hash)) { show('methods', TITLES.methods); requestAnimationFrame(() => $('#' + hash)?.scrollIntoView()); return; } hash = target; }
  const [page, argRaw] = hash.split('/'); const arg = argRaw?.split('?')[0];
  status('');
  try {
    if (page === 'species' && arg) { show('species-detail', spById[arg]?.common); await renderSpecies(arg); }
    else if (page === 'review' && arg) {
      const legacy = REVIEWS.find(r => r.id === arg && r.legacy);
      if (legacy) { location.replace('#' + arg); return; }
      show('review-detail', REVIEWS.find(r => r.id === arg)?.title); await renderReview(arg);
    }
    else if (page === 'atlas') { show('atlas', arg ? `${spById[arg]?.common} brain atlas` : TITLES.atlas); await renderAtlas(arg); }
    else if (page === 'sounds') { show('sounds', TITLES.sounds); await renderSounds(arg); }
    else if (PAGES.includes(page)) { show(page, TITLES[page]); await (RENDER[page]?.() ?? null); }
    else if (document.getElementById(page)) { const host = document.getElementById(page).closest('.page'); show(host.id, TITLES[host.id]); requestAnimationFrame(() => document.getElementById(page).scrollIntoView()); return; }
    else { show('home'); await renderHome(); }
  } catch (e) { console.error(e); status(e.message); }
  if (!arg || page !== 'sounds') window.scrollTo(0, 0);
  if (location.hash && location.hash !== '#home') $('#main').focus({preventScroll: true});
}
window.addEventListener('hashchange', route);

// ------------------------------------------------------------------ home + species
function availability(sp) {
  const a = ATLASES[sp.id];
  return `<div class="avail">${chip('available', 'Sound')}${a.status === 'available' ? chip('available', 'Brain atlas') : chip('none', 'No atlas')}${sp.reviews.length ? chip('consistent', `${sp.reviews.length} review${sp.reviews.length > 1 ? 's' : ''}`) : ''}</div>`;
}
const speciesRow = (sp, extra = true) => `<tr><td><img src="${esc(sp.photo.src)}" alt="" loading="lazy"></td>
  <td class="name"><a href="#species/${sp.id}">${esc(sp.common)}</a><div class="latin">${esc(sp.latin)}</div></td>
  ${extra ? `<td class="hide-sm">${esc(sp.group)}</td>` : ''}<td class="hide-sm">${esc(sp.signal)}</td><td>${availability(sp)}</td></tr>`;

async function renderHome() {
  $('#home-species tbody').innerHTML = SPECIES.map(s => speciesRow(s, false)).join('');
  $('#home-reviews').innerHTML = REVIEWS.slice(0, 4).map(reviewItem).join('');
  const [sounds, ...metas] = await Promise.all([loadSounds(), ...Object.keys(ATLASES).filter(k => ATLASES[k].status === 'available').map(k => getJSON(`data/atlas/${k}/meta.json`))]);
  const regions = metas.reduce((n, m) => n + (m.regions?.length || 0), 0);
  const refs = Object.keys(REFS).length;
  $('#home-stats').innerHTML = [['Species', SPECIES.length], ['Recordings', fmt(sounds.length)], ['Brain atlases', metas.length], ['Labelled brain regions', fmt(regions)], ['Research reviews', REVIEWS.length], ['Verified references', refs]]
    .map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join('');
}
RENDER_REG('home', renderHome);
RENDER_REG('species', async () => { $('#species-table tbody').innerHTML = SPECIES.map(s => speciesRow(s)).join(''); });

function reviewItem(r) {
  const sp = spById[r.species];
  return `<li><p class="small faint">${esc(sp.common)} · ${esc(r.kind)} ${chip(r.verdict)}</p><h3><a href="#${r.legacy ? r.id : 'review/' + r.id}">${esc(r.title)}</a></h3><p>${esc(r.summary)}</p></li>`;
}

async function renderSpecies(id) {
  const sp = spById[id];
  const body = $('#species-detail-body');
  if (!sp) { body.innerHTML = `<p>Unknown species. <a href="#species">Back to species</a></p>`; return; }
  const atlas = ATLASES[id];
  const usedRefs = [...new Set(sp.body.flatMap(b => b[2]).concat(atlas.refs))];
  const refN = k => usedRefs.indexOf(k) + 1;
  const sounds = (await loadSounds()).filter(s => s.species === id);
  const kinds = [...new Set(sounds.map(s => s.kind))];
  body.innerHTML = `
  <p class="breadcrumb"><a href="#home">Overview</a> / <a href="#species">Species</a> / ${esc(sp.common)}</p>
  <div class="sp-head">
    <div>
      <p class="kicker">${esc(sp.group)}</p>
      <h1>${esc(sp.common)}</h1>
      <p class="latin">${esc(sp.latin)}</p>
      <div class="plain"><strong>In plain language</strong>${esc(sp.plain)}</div>
      <dl class="data-summary">${sp.data.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <div class="link-row"><a class="btn primary" href="#sounds/${esc(sounds[0]?.id || '')}">Listen (${sounds.length})</a>${atlas.status === 'available' ? `<a class="btn" href="#atlas/${id}">Open brain atlas</a>` : ''}${sp.reviews.map(r => `<a class="btn" href="#${REVIEWS.find(x => x.id === r)?.legacy ? r : 'review/' + r}">Review: ${esc(REVIEWS.find(x => x.id === r)?.title.split(':')[0])}</a>`).join('')}</div>
    </div>
    <figure><img src="${esc(sp.photo.src)}" alt="Photograph of a ${esc(sp.common.toLowerCase())}."><figcaption class="credit">Photo: <a href="${esc(sp.photo.url)}">${esc(sp.photo.credit)}</a>, ${esc(sp.photo.licence)}. ${esc(sp.photo.note)}</figcaption></figure>
  </div>
  <div class="sp-layout">
    <nav class="toc" aria-label="On this page"><h2>On this page</h2><ol>${sp.body.map((b, i) => `<li><a href="#species/${id}" data-jump="s${i}">${esc(b[0])}</a></li>`).join('')}<li><a href="#species/${id}" data-jump="listen">Listen</a></li><li><a href="#species/${id}" data-jump="brain">Brain data</a></li><li><a href="#species/${id}" data-jump="refs">References</a></li></ol></nav>
    <div class="sp-body">
      ${sp.body.map((b, i) => `<section id="s${i}"><h2>${esc(b[0])}</h2><p>${esc(b[1])} ${b[2].map(k => `<sup class="ref"><a href="#species/${id}" data-jump="ref-${k}" aria-label="Reference ${refN(k)}">[${refN(k)}]</a></sup>`).join('')}</p></section>`).join('')}
      <section id="listen"><h2>Listen</h2><p class="muted">${sounds.length} recordings: ${kinds.map(esc).join('; ')}.</p>
        <ul class="refs" style="list-style:none;padding:0">${sounds.slice(0, 8).map(s => `<li><a href="#sounds/${esc(s.id)}">${esc(s.title)}</a> <span class="faint small">· ${s.source.duration_s ? (+s.source.duration_s).toFixed(2) + ' s' : ''} · ${s.source.sample_rate ? (s.source.sample_rate / 1000) + ' kHz' : ''}</span></li>`).join('')}</ul>
        ${sounds.length > 8 ? `<p><a href="#sounds/${esc(sounds[0].id)}">All ${sounds.length} recordings in the sound library →</a></p>` : ''}</section>
      <section id="brain"><h2>Brain data</h2>${atlas.status === 'available'
        ? `<p>${esc(atlas.kind)}. ${chip('available', 'Available')}</p><p><a class="btn" href="#atlas/${id}">Open the ${esc(sp.common.toLowerCase())} atlas</a></p>`
        : `<div class="notice warn"><p><b>No brain atlas.</b> ${esc(atlas.kind)}. We searched OpenNeuro, Zenodo, Brain/MINDS, InsectBrainDB and the literature (November 2026). Published MRI studies of related species, such as the dwarf sperm whale, exist but their image data are not openly licensed. We do not substitute another species’ brain.</p></div>`}</section>
      <section id="refs"><h2>References</h2><ol class="refs">${usedRefs.map(k => `<li id="ref-${k}">${refHTML(k)}</li>`).join('')}</ol></section>
    </div>
  </div>`;
  $$('[data-jump]', body).forEach(a => a.addEventListener('click', e => { e.preventDefault(); const t = document.getElementById(a.dataset.jump); t?.scrollIntoView({behavior: 'smooth'}); t?.setAttribute('tabindex', '-1'); t?.focus({preventScroll: true}); }));
}

// ------------------------------------------------------------------ sounds
let sndState = {page: 0, current: null, mode: null};
const PER = 40;
function soundFilters(all) {
  const sel = $('#snd-species');
  if (!sel.options.length) {
    sel.innerHTML = `<option value="">All species</option>` + SPECIES.map(s => `<option value="${s.id}">${esc(s.common)}</option>`).join('');
    sel.addEventListener('change', () => { $('#snd-kind').value = ''; sndState.page = 0; fillKinds(all); listSounds(all); });
    $('#snd-kind').addEventListener('change', () => { sndState.page = 0; listSounds(all); });
    $('#snd-q').addEventListener('input', () => { sndState.page = 0; listSounds(all); });
    fillKinds(all);
  }
}
function fillKinds(all) {
  const sp = $('#snd-species').value;
  const kinds = [...new Set(all.filter(s => !sp || s.species === sp).map(s => s.kind))].sort();
  $('#snd-kind').innerHTML = `<option value="">All</option>` + kinds.map(k => `<option>${esc(k)}</option>`).join('');
}
function filtered(all) {
  const sp = $('#snd-species').value, k = $('#snd-kind').value, q = $('#snd-q').value.trim().toLowerCase();
  return all.filter(s => (!sp || s.species === sp) && (!k || s.kind === k) && (!q || (s.title + ' ' + s.id + ' ' + s.kind).toLowerCase().includes(q)));
}
function listSounds(all) {
  const list = filtered(all), pages = Math.max(1, Math.ceil(list.length / PER));
  sndState.page = Math.min(sndState.page, pages - 1);
  const slice = list.slice(sndState.page * PER, (sndState.page + 1) * PER);
  $('#snd-list').innerHTML = slice.map(s => `<button role="option" data-id="${esc(s.id)}" aria-current="${s.id === sndState.current}"><span>${esc(s.title)}</span><small>${esc(spById[s.species].common)} · ${esc(s.kind)} · ${(+s.source.duration_s).toFixed(2)} s</small></button>`).join('') || `<p style="padding:.8rem">No recordings match.</p>`;
  $('#snd-pager').innerHTML = `<span>${fmt(list.length)} recordings</span><span><button class="btn" ${sndState.page ? '' : 'disabled'} data-p="-1">Previous</button> Page ${sndState.page + 1} of ${pages} <button class="btn" ${sndState.page < pages - 1 ? '' : 'disabled'} data-p="1">Next</button></span>`;
  $$('#snd-pager [data-p]').forEach(b => b.onclick = () => { sndState.page += +b.dataset.p; listSounds(all); });
  $$('#snd-list button').forEach(b => b.onclick = () => { location.hash = '#sounds/' + b.dataset.id; });
}
$('#snd-list').addEventListener('keydown', e => {
  const btns = $$('#snd-list button'); if (!btns.length) return;
  const i = btns.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') { e.preventDefault(); btns[Math.min(btns.length - 1, i + 1)].focus(); }
  if (e.key === 'ArrowUp') { e.preventDefault(); btns[Math.max(0, i - 1)].focus(); }
});

async function renderSounds(id) {
  const all = await loadSounds();
  soundFilters(all);
  if (id) {
    const s = all.find(x => x.id === id);
    if (s) {
      if ($('#snd-species').value && $('#snd-species').value !== s.species) { $('#snd-species').value = s.species; fillKinds(all); }
      const list = filtered(all), idx = list.findIndex(x => x.id === id);
      if (idx < 0) { $('#snd-species').value = s.species; $('#snd-kind').value = ''; $('#snd-q').value = ''; fillKinds(all); }
      const idx2 = filtered(all).findIndex(x => x.id === id);
      sndState.page = Math.floor(idx2 / PER);
      sndState.current = id; playerLoad(s);
    }
  }
  listSounds(all);
}

function playerLoad(s) {
  const sp = spById[s.species];
  $('#pl-species').textContent = `${sp.common} · ${s.kind}`;
  $('#pl-title').textContent = s.title;
  const audio = $('#pl-audio');
  const modes = Object.keys(s.files);
  const labels = {original: 'Original', realtime: 'Real time', expanded: s.species === 'house-mouse' ? 'Slowed 16×' : 'Slowed 10×'};
  sndState.mode = modes.includes('realtime') ? 'realtime' : modes[0];
  $('#pl-mode').innerHTML = modes.length > 1 ? modes.map(m => `<label><input type="radio" name="plmode" value="${m}" ${m === sndState.mode ? 'checked' : ''}> ${labels[m]}</label>`).join('') : `<span class="small muted">${labels[modes[0]]}</span>`;
  $$('#pl-mode input').forEach(r => r.onchange = () => { sndState.mode = r.value; audio.src = s.files[r.value]; audio.play().catch(() => {}); });
  audio.src = s.files[sndState.mode];
  $('#pl-controls').hidden = false;
  const sg = s.spectrogram;
  $('#pl-spec').hidden = !sg;
  if (sg) {
    $('#pl-img').src = sg.file;
    $('#pl-img').alt = `Spectrogram of ${s.title}: time 0 to ${(+sg.t1).toFixed(2)} seconds, frequency 0 to ${(sg.f1 / 1000).toFixed(0)} kHz. Brighter colours are louder.`;
    axes(sg);
  }
  const src = s.source;
  $('#pl-meta').innerHTML = `
    <p><b>Playback:</b> ${esc(s.playback)}</p>
    ${s.selection ? `<p><b>Excerpt:</b> ${esc(s.selection)}</p>` : ''}
    ${s.caution ? `<p class="notice warn" style="margin:.4rem 0">${esc(s.caution)}</p>` : ''}
    <dl class="meta" style="margin-top:.5rem">
      <dt>Source file</dt><dd class="mono">${esc(src.file)}${src.offset_s != null ? ` @ ${src.offset_s} s` : ''}</dd>
      <dt>Sample rate</dt><dd>${src.sample_rate ? fmt(src.sample_rate) + ' Hz' : '—'}</dd>
      <dt>Duration</dt><dd>${(+src.duration_s).toFixed(3)} s</dd>
      ${sg ? `<dt>Spectrogram</dt><dd>${sg.window || 'hann'} window, ${sg.nperseg} samples, hop ${sg.hop}; ${sg.db_range} dB range</dd>` : ''}
      <dt>Licence</dt><dd>${esc(src.licence)}</dd>
      <dt>Source</dt><dd>${src.url ? `<a href="${esc(src.url)}">${esc(src.doi ? 'doi:' + src.doi : 'Source record')}</a>` : '—'}</dd>
      <dt>Cite</dt><dd class="small">${esc(src.citation)}</dd>
      <dt>SHA-256</dt><dd class="mono small" style="word-break:break-all">${esc(src.sha256)}</dd>
    </dl>
    <p style="margin-top:.6rem"><a class="btn" href="${esc(s.files[modes[0]])}" download>Download audio</a> ${sg ? `<a class="btn" href="${esc(sg.file)}" download>Download spectrogram</a>` : ''}</p>`;
}
function niceTicks(max, n = 5) { const raw = max / n, p = 10 ** Math.floor(Math.log10(raw)), step = [1, 2, 2.5, 5, 10].map(m => m * p).find(s => s >= raw); const t = []; for (let v = 0; v <= max + 1e-9; v += step) t.push(+v.toFixed(6)); return t; }
function axes(sg) {
  const kHz = sg.f1 >= 2000;
  const fmax = kHz ? sg.f1 / 1000 : sg.f1;
  $('#pl-yaxis').innerHTML = niceTicks(fmax, 4).map(v => `<span style="top:${100 - v / fmax * 100}%">${v}</span>`).join('') + `<span class="axis-title" style="top:50%;left:0;right:auto;transform:rotate(-90deg) translate(-50%,0);transform-origin:left top">${kHz ? 'kHz' : 'Hz'}</span>`;
  const dur = sg.t1, ms = dur < 0.5;
  const tmax = ms ? dur * 1000 : dur;
  $('#pl-xaxis').innerHTML = niceTicks(tmax, 6).map(v => `<span style="left:${v / tmax * 100}%">${v}</span>`).join('') + `<span class="axis-title" style="right:0;left:auto;transform:none;top:14px">${ms ? 'ms' : 's'}</span>`;
}
{
  const audio = $('#pl-audio'), wrap = $('#pl-imgwrap'), cur = $('#pl-cursor'), hov = $('#pl-hover');
  const current = () => SOUNDS?.find(s => s.id === sndState.current);
  const factor = () => (sndState.mode === 'expanded' ? (current()?.species === 'house-mouse' ? 16 : 10) : 1);
  const tick = () => { const s = current(); if (s?.spectrogram && audio.duration) { cur.style.left = `${Math.min(100, audio.currentTime / audio.duration * 100)}%`; } if (!audio.paused) requestAnimationFrame(tick); };
  audio.addEventListener('play', tick); audio.addEventListener('seeked', tick); audio.addEventListener('loadedmetadata', () => { cur.style.left = '0%'; });
  wrap.addEventListener('pointermove', e => {
    const s = current(); if (!s?.spectrogram) return;
    const r = wrap.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width, fy = 1 - (e.clientY - r.top) / r.height;
    const t = fx * s.spectrogram.t1, f = fy * s.spectrogram.f1;
    hov.hidden = false; hov.style.left = (e.clientX - r.left) + 'px'; hov.style.top = (e.clientY - r.top) + 'px';
    hov.textContent = `${t < 1 ? (t * 1000).toFixed(1) + ' ms' : t.toFixed(3) + ' s'} · ${f >= 1000 ? (f / 1000).toFixed(1) + ' kHz' : f.toFixed(0) + ' Hz'}${factor() > 1 ? ` (heard as ${(f / factor() / 1000).toFixed(2)} kHz)` : ''}`;
  });
  wrap.addEventListener('pointerleave', () => hov.hidden = true);
  wrap.addEventListener('click', e => { const r = wrap.getBoundingClientRect(); if (audio.duration) { audio.currentTime = (e.clientX - r.left) / r.width * audio.duration; audio.play().catch(() => {}); } });
}

// ------------------------------------------------------------------ atlas
async function renderAtlas(id) {
  const {openAtlas} = await import('./atlas.js?v=' + V);
  $('#atlas-directory').hidden = !!id; $('#atlas-viewer').hidden = !id;
  if (!id) {
    $('#atlas-crumb').innerHTML = `<a href="#home">Overview</a> / Brain atlases`;
    const metas = await Promise.all(SPECIES.map(s => ATLASES[s.id].status === 'available' ? getJSON(`data/atlas/${s.id}/meta.json`).catch(() => null) : null));
    $('#atlas-cards').innerHTML = SPECIES.map((s, i) => { const a = ATLASES[s.id], m = metas[i];
      return `<article class="atlas-card"><p class="kicker">${esc(s.group)}</p><h3>${esc(s.common)} <span class="faint" style="font-weight:400;font-style:italic;font-size:.9rem">${esc(s.latin)}</span></h3>
      <p>${esc(m?.title || a.kind)}</p><p>${a.status === 'available' ? chip('available', 'Available') + ' ' + esc(a.kind) : chip('none', 'Not available') + ' ' + esc(a.kind)}</p>
      ${a.status === 'available' ? `<a class="btn primary" href="#atlas/${s.id}">Open atlas</a>` : `<a class="btn" href="#species/${s.id}">Why not?</a>`}</article>`; }).join('');
    return;
  }
  const sp = spById[id];
  $('#atlas-crumb').innerHTML = `<a href="#home">Overview</a> / <a href="#atlas">Brain atlases</a> / ${esc(sp?.common || id)}`;
  if (!sp || ATLASES[id].status !== 'available') { $('#atlas-viewer').innerHTML = `<p>No atlas is available for this species. <a href="#species/${esc(id)}">See the species page.</a></p>`; return; }
  await openAtlas(id, {status, esc, getJSON, sp});
}

// ------------------------------------------------------------------ review
async function renderReviewIndex() {
  const sel = $('#rv-species');
  if (!sel.options.length) {
    sel.innerHTML = `<option value="">All species</option>` + SPECIES.map(s => `<option value="${s.id}">${esc(s.common)}</option>`).join('');
    sel.onchange = renderReviewIndex;
    $('#verdict-key').innerHTML = Object.entries(VERDICTS).map(([k, v]) => `<span>${chip(k)}</span><span>${esc(v.text)}</span>`).join('');
  }
  $('#review-list').innerHTML = REVIEWS.filter(r => !sel.value || r.species === sel.value).map(reviewItem).join('');
}
RENDER_REG('review', renderReviewIndex);

async function renderReview(id) {
  const r = REVIEWS.find(x => x.id === id), host = $('#review-detail-body');
  if (!r) { host.innerHTML = '<p>Review not found. <a href="#review">All reviews</a></p>'; return; }
  const d = await getJSON(`data/checks/${id}.json`);
  const sp = spById[r.species];
  host.innerHTML = `
  <p class="breadcrumb"><a href="#home">Overview</a> / <a href="#review">Research review</a> / ${esc(sp.common)}</p>
  <article class="paper-article">
    <p class="kicker">${esc(r.kind)} · ${esc(sp.common)}</p>
    <h1 class="paper-title">${esc(d.title)}</h1>
    <p>${chip(r.verdict)} <span class="muted small">${esc(VERDICTS[r.verdict].text)}</span></p>
    <div class="plain"><strong>Summary</strong>${esc(r.summary)}</div>
    <p class="paper-citation">${d.paper.doi ? `${esc(d.paper.citation)}` : esc(d.paper.citation)}${d.paper.note ? `<br><span class="small">${esc(d.paper.note)}</span>` : ''}</p>
    <h2>Claims checked</h2>
    ${d.claims.map(c => `<div class="claim"><header><q>${esc(c.claim)}</q><span>${chip(statusClass(c.status), c.status)}</span></header><div class="body"><p class="small faint">Source of claim: ${esc(c.source)}</p><p>${esc(c.result)}</p>${c.scope ? `<p class="small"><b>Scope:</b> ${esc(c.scope)}</p>` : ''}</div></div>`).join('')}
    <h2>Figures</h2><div id="rv-figs"></div>
    <div class="method-box"><h3>Method</h3><p>${esc(d.method)}</p><h3>Limits</h3><p>${esc(d.limits)}</p>
      <h3>Data</h3><ul class="small">${d.data.files.map(f => `<li>${esc(f)}</li>`).join('')}</ul><p class="small">Licence: ${esc(d.data.licence)}${d.data.record ? ' · ' + esc(d.data.record) : ''}</p>
      ${d.data.sha256 ? `<details class="data-table"><summary>SHA-256 checksums of the files analysed</summary><ul class="mono small">${Object.entries(d.data.sha256).map(([k, v]) => `<li>${esc(k)}: ${esc(v)}</li>`).join('')}</ul></details>` : ''}
      <p class="small"><a href="data/checks/${esc(id)}.json" download>Download all results (JSON)</a> · <a href="https://github.com/jordanxxlopez/animal-communication-neuroscience/blob/main/scripts/build_collections.py">Analysis script</a></p></div>
  </article>`;
  charts.forReview(id, d, $('#rv-figs'));
}
const statusClass = s => s.startsWith('reproduced') ? 'reproduced' : s.startsWith('consistent') ? (s.includes('partly') ? 'partial' : 'consistent') : s.includes('discrep') ? 'discrepancy' : s.startsWith('not') ? 'uncheckable' : 'partial';

// ------------------------------------------------------------------ films
RENDER_REG('films', async () => {
  const [old, bat] = await Promise.all([getJSON('data/videos.json'), getJSON('data/videos-bat.json')]);
  const oldInfo = {'elife-01833-media1.mp4': ['zebra-finch', 'Recording an HVC neuron during singing', 'A sharp intracellular recording from an identified HVC-X neuron in a freely behaving male zebra finch.', '#paper-hamaguchi'],
                   'elife-07770-media1.mp4': ['zebra-finch', 'Individual microphones in a social group', 'Group-housed zebra finches recorded with on-bird microphones; the study examines call exchanges across the breeding cycle.', null]};
  const items = [
    ...bat.map(v => ({species: 'egyptian-fruit-bat', title: v.title.replace(/^Example video of /, '').replace(/^./, c => c.toUpperCase()), text: v.description, src: v.web_file, credit: `Prat, Taub, Pratt & Yovel (2017), ${v.licence}`, link: v.url, note: v.transformation, sha: v.source_sha256})),
    ...old.map(v => { const k = v.path.split('/').pop(), o = oldInfo[k] || ['zebra-finch', k, v.description, null];
      return {species: o[0], title: o[1], text: o[2], src: 'assets/' + k, credit: `${v.credit} · ${v.license}`, link: v.source_url, note: 'Unaltered original MP4.', sha: v.sha256, more: o[3]}; }),
  ];
  const by = SPECIES.map(s => [s, items.filter(i => i.species === s.id)]).filter(([, l]) => l.length);
  $('#film-list').innerHTML = by.map(([s, l]) => `<h2>${esc(s.common)}</h2><div class="film-grid">${l.map(v => `<article class="film"><video controls preload="metadata" src="${esc(v.src)}" aria-label="${esc(v.title)}"></video><div><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p><p class="credit">${esc(v.credit)} · <a href="${esc(v.link)}">source</a>${v.more ? ` · <a href="${v.more}">read the experiment</a>` : ''}</p><p class="credit">${esc(v.note)} Original SHA-256 ${esc(v.sha.slice(0, 12))}…</p></div></article>`).join('')}</div>`).join('')
    + `<div class="notice"><p>No openly licensed video was found for the sperm whale, marmoset, mouse or honeybee collections that matches the recordings shown here. We do not use stock footage.</p></div>`;
});

// ------------------------------------------------------------------ literature
let LIT = null;
async function buildLit() {
  if (LIT) return LIT;
  const old = await getJSON('data/sources.json');
  const used = new Map();
  SPECIES.forEach(s => s.body.forEach(b => b[2].forEach(k => used.set(k, s.id))));
  Object.entries(ATLASES).forEach(([sid, a]) => a.refs.forEach(k => used.set(k, sid)));
  REVIEWS.forEach(r => r.paper && used.set(r.paper, r.species));
  const fromRefs = Object.entries(REFS).map(([k, r]) => ({species: used.get(k) || '', cite: r.cite, doi: r.doi, type: 'Article', status: 'DOI verified · no retraction found'}));
  const known = new Set(fromRefs.map(r => r.doi.toLowerCase()));
  const fromOld = old.filter(o => !o.doi || !known.has(o.doi.toLowerCase())).map(o => ({species: o.species, cite: o.title, doi: o.doi, url: o.source_url, type: o.modality || o.sector, status: o.review_status || ''}));
  LIT = [...fromRefs, ...fromOld];
  return LIT;
}
RENDER_REG('studies', async () => {
  const lit = await buildLit();
  const sel = $('#lit-species');
  if (!sel.options.length) {
    sel.innerHTML = `<option value="">All species</option>` + SPECIES.map(s => `<option value="${s.id}">${esc(s.common)}</option>`).join('');
    sel.onchange = RENDER.studies; $('#lit-q').oninput = RENDER.studies;
  }
  const q = $('#lit-q').value.toLowerCase();
  const rows = lit.filter(r => (!sel.value || r.species === sel.value) && (!q || r.cite.toLowerCase().includes(q)));
  $('#lit-table tbody').innerHTML = rows.map(r => `<tr><td>${esc(r.cite)} ${r.doi ? doiLink(r.doi) : r.url ? `<a href="${esc(r.url)}">link</a>` : ''}</td><td>${esc(spById[r.species]?.common || '')}</td><td>${esc(r.type)}</td><td class="small">${esc(r.status)}</td></tr>`).join('');
});

// ------------------------------------------------------------------ methods registry
RENDER_REG('methods', async () => {
  const reg = await getJSON('data/registry.json');
  $('#registry tbody').innerHTML = reg.map(r => `<tr><td>${esc(spById[r.species]?.common || r.species)}</td><td><a href="${esc(r.url)}">${esc(r.name)}</a></td><td>${esc(r.licence)}</td><td>${esc(r.use)}</td></tr>`).join('');
});

// ------------------------------------------------------------------ legacy figure guides (unchanged behaviour)
const paperPanelNotes = {
  a: 'Panel A is the authors’ schematic of the zebra finch preparation. Red marks the song motor pathway; blue marks the anterior forebrain pathway. The electrode records an HVC cell projecting to Area X. This published circuit drawing is not a measured tractogram or a spatial registration to our MRI atlas.',
  b: 'Panel B illustrates a spike-collision test used to identify an HVC neuron projecting to Area X. A stimulus in Area X can evoke a spike traveling back toward HVC. Its collision with a naturally generated spike helps establish the projection identity; the voltage and time scale bars apply to these traces.',
  c: 'Panel C shows the feedback manipulation. The real-time system detects a target in the song sequence and triggers playback on hit trials. On catch trials playback is withheld. This is the authors’ experimental schematic, not a simulation created for this site.',
  d: 'Panel D pairs a song spectrogram with an intracellular voltage recording. Frequency is in kHz, time in milliseconds and voltage in mV. The orange interval marks feedback playback. The bottom traces expand the comparison of hit and catch conditions. These are example observations; Figure 2 provides the population analysis.'};
$$('[data-paper-panel]').forEach(b => b.addEventListener('click', () => { $$('[data-paper-panel]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); $('#figure-panel-note').textContent = paperPanelNotes[b.dataset.paperPanel]; }));
$$('[data-enlarge]').forEach(b => b.addEventListener('click', () => { const o = document.getElementById(b.dataset.enlarge); $('#enlarged-original-figure').src = o.src; $('#enlarged-original-figure').alt = o.alt; $('#figure-dialog').showModal(); }));
RENDER_REG('paper-sperm-whale', async () => {
  const c = await getJSON('data/marine-coda-summary.json'); const sel = $('#coda-clan'); if (!sel) return;
  const draw = () => { const g = c.groups[sel.value]; if (!g) return; $('#coda-summary-count').textContent = `${g.n.toLocaleString()} deposited rows · ${g.type_count} supplied labels · median duration ${g.duration_median_s.toFixed(3)} s`;
    $('#coda-summary').innerHTML = g.types.map(t => `<tr><td>${esc(t.label)}</td><td class="num">${t.count}</td><td class="num">${t.duration_median_s.toFixed(3)}</td><td class="num">${t.duration_q10_s.toFixed(3)}–${t.duration_q90_s.toFixed(3)}</td></tr>`).join(''); };
  sel.onchange = draw; draw();
});

// ------------------------------------------------------------------ search
let INDEX = null;
async function buildIndex() {
  if (INDEX) return INDEX;
  const items = [];
  SPECIES.forEach(s => items.push({t: s.common, s: `${s.latin} · species`, h: '#species/' + s.id, k: `${s.common} ${s.latin} ${s.group} ${s.signal}`}));
  REVIEWS.forEach(r => items.push({t: r.title, s: `Research review · ${spById[r.species].common}`, h: r.legacy ? '#' + r.id : '#review/' + r.id, k: r.title + ' ' + r.summary}));
  const metas = await Promise.all(Object.keys(ATLASES).filter(k => ATLASES[k].status === 'available').map(k => getJSON(`data/atlas/${k}/meta.json`).then(m => [k, m])));
  for (const [k, m] of metas) {
    for (const r of m.regions || []) items.push({t: r.name + (r.hemisphere ? ` (${r.hemisphere.replace(':', '')})` : ''), s: `Brain region · ${spById[k].common}${r.acronym ? ' · ' + r.acronym : ''}`, h: `#atlas/${k}?r=${r.index}`, k: `${r.name} ${r.acronym}`});
    if (!m.regions?.length && m.meshes) { const meshes = await getJSON(`data/atlas/${k}/meshes.json`).catch(() => []); meshes.forEach(x => items.push({t: x.name, s: `Brain region · ${spById[k].common}`, h: `#atlas/${k}`, k: x.name})); }
  }
  (await loadSounds()).filter(s => s.species !== 'zebra-finch').forEach(s => items.push({t: s.title, s: `Sound · ${spById[s.species].common}`, h: '#sounds/' + s.id, k: s.title + ' ' + s.kind}));
  items.push({t: 'Zebra finch syllables (887)', s: 'Sound library', h: '#sounds', k: 'zebra finch syllable grey blue song ML4BL'});
  INDEX = items.map(i => ({...i, k: i.k.toLowerCase()}));
  return INDEX;
}
{
  const input = $('#q'), box = $('#search-results'); let sel = -1, res = [];
  const close = () => { box.hidden = true; input.setAttribute('aria-expanded', 'false'); sel = -1; };
  const draw = () => { box.innerHTML = res.length ? res.map((r, i) => `<a role="option" href="${esc(r.h)}" aria-selected="${i === sel}">${esc(r.t)}<small>${esc(r.s)}</small></a>`).join('') : `<a role="option" aria-disabled="true">No matches</a>`; box.hidden = false; input.setAttribute('aria-expanded', 'true'); };
  input.addEventListener('focus', () => buildIndex().catch(() => {}));
  input.addEventListener('input', async () => {
    const q = input.value.trim().toLowerCase(); if (q.length < 2) return close();
    const idx = await buildIndex(); const words = q.split(/\s+/);
    res = idx.map(i => ({i, score: words.every(w => i.k.includes(w)) ? (i.t.toLowerCase().startsWith(q) ? 3 : i.t.toLowerCase().includes(q) ? 2 : 1) : 0})).filter(x => x.score).sort((a, b) => b.score - a.score).slice(0, 12).map(x => x.i);
    sel = -1; draw();
  });
  input.addEventListener('keydown', e => {
    if (box.hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(res.length - 1, sel + 1); draw(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); }
    else if (e.key === 'Escape') close();
  });
  $('#site-search').addEventListener('submit', e => { e.preventDefault(); const r = res[Math.max(0, sel)]; if (r) { location.hash = r.h; close(); input.blur(); } });
  box.addEventListener('click', () => setTimeout(close, 0));
  document.addEventListener('click', e => { if (!e.target.closest('.site-search')) close(); });
}

// ------------------------------------------------------------------ boot
function RENDER_REG(name, fn) { (globalThis.__R ||= {})[name] = fn; }
const RENDER = globalThis.__R;
route();
