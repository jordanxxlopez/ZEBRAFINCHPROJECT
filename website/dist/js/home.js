// Overview page: live listening hero, scroll-linked explainer, the animal wall.
// Every recording, photo and scan comes from the collection's own data files.
import {LiveSpectrogram} from './livespec.js?v=20261113a';

const PLAY = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1 0l9 5-9 5z" fill="currentColor"/></svg>';
const STOP = '<svg viewBox="0 0 10 10" aria-hidden="true"><rect width="10" height="10" fill="currentColor"/></svg>';
// The recording that represents each species on this page; species not listed use their first recording.
const FEATURE = {'zebra-finch': 'finch-song-B189', 'common-marmoset': 'marmoset-phee_223119', 'egyptian-fruit-bat': 'bat-social6', 'european-starling': 'starling-b1125-1'};
const ORDER = ['zebra-finch', 'common-marmoset', 'house-mouse', 'egyptian-fruit-bat', 'european-starling', 'norway-rat', 'eurasian-blackcap', 'grey-mouse-lemur', 'domestic-cat', 'micklems-mole-rat', 'honeybee'];

let cleanup = [];
export function teardown() { cleanup.forEach(f => { try { f(); } catch {} }); cleanup = []; }

const short = c => { const m = (c || '').match(/^(.*?\(\d{4}\))/); return m ? m[1] : (c || '').split(' (')[0]; };

export function renderHome(main, {SPECIES, SP, sounds, hasAtlas, cited, refList, esc, fmt, reduced, V}) {
  teardown();
  // Only species with their own photograph appear here; another species' photo is never substituted.
  const feat = ORDER.filter(id => SP[id]?.photo).map(id => {
    const s = sounds.find(x => x.id === FEATURE[id]) || sounds.find(x => x.species === id && x.kind !== 'Song syllable');
    if (!s) return null;
    const f = s.files, url = f.realtime || f.original || f.expanded, speed = !f.realtime && !f.original && f.expanded ? +(f.expanded.match(/te(\d+)/)?.[1] || 1) : 1;
    return {sp: SP[id], s, url, speed, credit: `${short(s.source.citation)} · ${s.source.licence}`};
  }).filter(Boolean);
  const byId = Object.fromEntries(feat.map(a => [a.sp.id, a]));
  const atlasIds = SPECIES.filter(s => hasAtlas(s.id)).map(s => s.id);
  const refs = [];
  const c = t => cited(t, refs);
  const label = a => `<b>${esc(a.sp.common)}</b> · ${esc(a.s.kind)}${a.speed > 1 ? ` · played ${a.speed}× slower, so every pitch is ${a.speed}× lower` : ''} <span class="src">${esc(a.credit)}</span>`;
  const scale = '<div class="scale" aria-hidden="true"><span>12 kHz</span><span>6</span><span>0</span></div>';

  main.innerHTML = `
  <section class="h-hero"><div class="wrap">
    <h1>How animals talk, and how their brains listen</h1>
    <p class="h-lede">Birds, bats, rodents and primates communicate with sound. Their calls can be heard here, drawn as they play, beside real scans of the brains that produce and decode them.</p>
    <div class="h-picker" role="group" aria-label="Play an animal">${feat.map(a => `<button type="button" class="h-chip" data-id="${a.sp.id}" aria-pressed="false"><img src="${esc(a.sp.photo.src)}" alt="">${esc(a.sp.common)}</button>`).join('')}</div>
  </div>
  <div class="h-band" id="h-band"><div class="h-marquee" id="h-marquee" aria-hidden="true"></div><canvas id="h-spec" aria-hidden="true"></canvas>
    <p class="now" id="h-now" aria-live="polite">Choose an animal above. Its call is drawn here as it plays: time runs left to right, pitch from low to high.</p>${scale}</div>
  </section>

  <section class="h-facts"><div class="wrap">
    <div><b data-n="${SPECIES.length}">${SPECIES.length}</b><small>species</small></div>
    <div><b data-n="${atlasIds.length}">${atlasIds.length}</b><small>brain atlases in 3D</small></div>
    <div><b data-n="${sounds.length}">${fmt(sounds.length)}</b><small>recordings</small></div>
    <div><b>All</b><small>from published, credited sources</small></div>
  </div></section>

  <section class="wrap h-intro"><p class="eyebrow">The basics</p><h2>From a sound in the air to a signal in the brain</h2></section>
  <section class="wrap h-scrolly">
    <div class="h-steps">
      <article class="h-step" data-panel="0"><span class="n">01 · Sound</span><h3>A call is a pattern of pitch over time</h3>
        <p>${c('When marmosets cannot see each other they exchange long “phee” contact calls. [[miller2010]]')} On a spectrogram a phee is a long, nearly level line: one pitch, held.</p>
        ${byId['common-marmoset'] ? `<button type="button" class="h-play" data-a="common-marmoset">${PLAY}Play the marmoset</button>` : ''}</article>
      <article class="h-step" data-panel="0"><span class="n">02 · Hearing</span><h3>Some animals call too high for human ears</h3>
        <p>${c('Male mice produce ultrasonic vocalizations, mostly above 30 kHz, when they meet females. [[holy2005]] [[kikusui2011]]')} Played 16 times slower, every frequency is divided by 16 and the song comes into range.</p>
        ${byId['house-mouse'] ? `<button type="button" class="h-play" data-a="house-mouse">${PLAY}Play the mouse, 16× slower</button>` : ''}</article>
      <article class="h-step" data-panel="1"><span class="n">03 · Learning</span><h3>A few animals learn their calls, as people learn words</h3>
        <p>${c('Juvenile male zebra finches memorise the song of an adult tutor between roughly 25 and 65 days after hatching, and practise until their own song stabilises at about 90 days. [[gobes2019]]')}</p>
        <p><a href="#species/zebra-finch">The zebra finch in depth</a></p></article>
      <article class="h-step" data-panel="2"><span class="n">04 · The brain</span><h3>Real scans show where it happens</h3>
        <p>${atlasIds.length} species here have a brain atlas from a published study, with regions outlined by the scientists who made it. Each atlas can be turned in 3D and examined region by region.</p>
        <p><a href="#atlas">Open the brain atlases</a></p></article>
    </div>
    <div class="h-stage">
      <figure class="h-panel on" data-i="0"><div class="h-spec"><canvas id="h-step-spec" aria-hidden="true"></canvas>${scale}</div><figcaption class="small faint" id="h-step-now" aria-live="polite">Press a play button to draw the call here.</figcaption></figure>
      <figure class="h-panel" data-i="1"><div class="h-photo"><img src="${esc(SP['zebra-finch'].photo.src)}" alt="Zebra finch" loading="lazy"></div><figcaption class="small faint">Zebra finch. Photo: ${esc(SP['zebra-finch'].photo.credit)}, ${esc(SP['zebra-finch'].photo.licence)}</figcaption></figure>
      <figure class="h-panel" data-i="2"><div class="h-scans">${atlasIds.slice(0, 6).map(id => `<a href="#atlas/${id}"><img src="assets/atlas-thumbs/${id}.jpg?v=${V}" alt="Brain atlas section, ${esc(SP[id].common)}" loading="lazy"><span>${esc(SP[id].common)}</span></a>`).join('')}</div><figcaption class="small faint">Sections from the published atlases. Sources are given on each atlas page.</figcaption></figure>
    </div>
  </section>

  <section class="h-wall-sec"><div class="wrap">
    <div class="h-wall-head"><h2>Meet the animals</h2><a href="#species">All species</a></div>
    <div class="h-band h-wall-band" id="h-wall-band"><canvas id="h-wall-spec" aria-hidden="true"></canvas><p class="now" id="h-wall-now" aria-live="polite">Press a picture to hear that animal. Press again to stop.</p>${scale}</div>
    <div class="h-wall">${feat.map(a => `<div class="h-tile" data-id="${a.sp.id}">
      <img src="${esc(a.sp.photo.src)}" alt="" loading="lazy">
      <button type="button" class="hit" aria-label="Play: ${esc(a.sp.common)}, ${esc(a.s.kind.toLowerCase())}" aria-pressed="false"></button>
      ${a.speed > 1 ? `<span class="badge">${a.speed}× slower</span>` : ''}<span class="ring" aria-hidden="true">${PLAY}</span>
      <span class="meta"><b>${esc(a.sp.common)}</b><small>${esc(a.s.kind)}</small><span class="hook">${esc(a.sp.plain)}</span><a href="#species/${a.sp.id}">About the ${esc(a.sp.common.toLowerCase())}</a></span><span class="bar"></span></div>`).join('')}</div>
    <p class="h-credits">Photos and recordings: ${feat.map(a => `${esc(a.sp.common)}, ${esc(a.sp.photo.credit)} (${esc(a.sp.photo.licence)}) and ${esc(a.credit)}`).join('; ')}.</p>
  </div></section>

  <section class="wrap h-doors-sec"><h2>Go deeper</h2><div class="h-doors">
    <a class="h-door" href="#recordings"><b>Listen</b><p>Every recording in the collection, with its spectrogram, source and licence.</p><span>Recordings</span></a>
    <a class="h-door" href="#atlas"><b>Brain atlases</b><p>Real brain scans in 3D, with regions that can be switched on and off.</p><span>Atlases</span></a>
    <a class="h-door" href="#research"><b>How it is checked</b><p>Published claims tested against the authors’ own deposited data.</p><span>Research</span></a>
  </div></section>
  ${refs.length ? `<section class="wrap h-refs"><h2>References</h2><ol>${refs.map(k => `<li>${refList(k)}</li>`).join('')}</ol></section>` : ''}`;

  // ---------- sound: one player at a time
  const $ = s => main.querySelector(s), $$ = s => [...main.querySelectorAll(s)];
  const magma = {cmap: 'magma', bg: [0, 0, 4]};
  const hero = new LiveSpectrogram($('#h-spec'), magma), step = new LiveSpectrogram($('#h-step-spec'), {ink: [37, 78, 160]}), wallP = new LiveSpectrogram($('#h-wall-spec'), magma);
  const players = [hero, step, wallP];
  let liveTimer = 0;
  const idle = () => {
    clearTimeout(liveTimer); liveTimer = setTimeout(() => $('#h-band')?.classList.remove('live'), 6000);
    $$('[aria-pressed=true]').forEach(b => b.setAttribute('aria-pressed', 'false'));
    $$('.h-tile.playing').forEach(t => { t.classList.remove('playing'); t.querySelector('.ring').innerHTML = PLAY; t.querySelector('.bar').style.width = 0; });
  };
  players.forEach(p => p.onend = idle);
  const stopAll = () => { players.forEach(p => p.stop()); idle(); };
  cleanup.push(() => { players.forEach(p => { p.stop(); p.ctx?.close(); }); clearTimeout(liveTimer); });
  const play = (p, a, btn, tile) => {
    stopAll();
    btn?.setAttribute('aria-pressed', 'true');
    if (tile) { tile.classList.add('playing'); tile.querySelector('.ring').innerHTML = STOP; }
    p.progress = f => { if (tile) tile.querySelector('.bar').style.width = f * 100 + '%'; };
    if (p === hero) { clearTimeout(liveTimer); $('#h-band').classList.add('live'); }
    p.play(a.url, {maxSeconds: 10}).catch(() => { idle(); });
  };
  $('.h-picker').onclick = e => { const b = e.target.closest('.h-chip'); if (!b) return; if (b.getAttribute('aria-pressed') === 'true') return stopAll(); const a = byId[b.dataset.id]; $('#h-now').innerHTML = label(a); play(hero, a, b); };
  $$('.h-play').forEach(b => b.onclick = () => { if (b.getAttribute('aria-pressed') === 'true') return stopAll(); const a = byId[b.dataset.a]; $('#h-step-now').innerHTML = label(a); play(step, a, b); });
  $('.h-wall').onclick = e => { const b = e.target.closest('.hit'); if (!b) return; const t = b.closest('.h-tile'); if (t.classList.contains('playing')) return stopAll(); const a = byId[t.dataset.id]; $('#h-wall-now').innerHTML = label(a); play(wallP, a, b, t); };

  // ---------- idle hero: the collection's own pre-rendered spectrograms drift past, silently
  const strip = feat.filter(a => a.s.spectrogram?.file).map(a => `<figure><img src="${esc(a.s.spectrogram.file)}" alt=""><figcaption>${esc(a.sp.common)} · ${esc(a.s.kind)}</figcaption></figure>`).join('');
  const mq = $('#h-marquee'); mq.innerHTML = strip + strip;

  // ---------- scroll-linked explainer
  const steps = $$('.h-step'), panels = $$('.h-panel'), stage = $('.h-stage');
  let ticking = false;
  const pick = () => {
    ticking = false; if (!stage.isConnected) return;
    const sb = innerWidth <= 820 ? stage.getBoundingClientRect().bottom : 0, mid = sb + (innerHeight - sb) / 2;
    const best = steps.reduce((b, s) => { const r = s.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - mid); return d < b.d ? {s, d} : b; }, {d: Infinity}).s;
    steps.forEach(s => s.classList.toggle('on', s === best));
    panels.forEach(p => p.classList.toggle('on', p.dataset.i === best.dataset.panel));
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(pick); } };
  addEventListener('scroll', onScroll, {passive: true}); cleanup.push(() => removeEventListener('scroll', onScroll)); pick();

  // ---------- motion (skipped entirely when reduced motion is requested)
  const G = window.gsap;
  if (reduced() || !G) { main.classList.add('h-static'); return; }
  const {ScrollTrigger, SplitText, Lenis} = window;
  G.registerPlugin(ScrollTrigger, SplitText);
  const ctx = G.context(() => {});
  cleanup.push(() => ctx.revert());
  if (Lenis) {
    const lenis = new Lenis({lerp: 0.1}), tick = t => lenis.raf(t * 1000);
    lenis.on('scroll', ScrollTrigger.update); G.ticker.add(tick); G.ticker.lagSmoothing(0);
    cleanup.push(() => { G.ticker.remove(tick); lenis.destroy(); });
  }
  ctx.add(() => {
    Promise.all([...mq.querySelectorAll('img')].map(i => i.decode().catch(() => {}))).then(() => { if (mq.isConnected) ctx.add(() => G.to(mq, {xPercent: -50, ease: 'none', duration: 90, repeat: -1})); });
    // counters
    $$('.h-facts b[data-n]').forEach(b => { const end = +b.dataset.n, o = {v: 0}; b.textContent = '0';
      G.to(o, {v: end, duration: 1.6, ease: 'power2.out', scrollTrigger: {trigger: b, start: 'top bottom'}, onUpdate: () => b.textContent = fmt(Math.round(o.v))}); });
    // brain-scan previews pop in when their panel shows
    const scanPanel = $('.h-panel[data-i="2"]'), figs = $$('.h-scans a');
    G.set(figs, {opacity: 0, scale: .92});
    const mo = new MutationObserver(() => G.to(figs, scanPanel.classList.contains('on') ? {opacity: 1, scale: 1, stagger: .06, duration: .5, ease: 'back.out(1.6)', overwrite: true} : {opacity: 0, scale: .92, duration: .2, overwrite: true}));
    mo.observe(scanPanel, {attributes: true, attributeFilter: ['class']}); cleanup.push(() => mo.disconnect());
    // animal wall: staggered rise and a slight parallax inside each photo
    G.set('.h-tile', {opacity: 0, y: 48});
    ScrollTrigger.batch('.h-tile', {start: 'top 92%', onEnter: els => G.to(els, {opacity: 1, y: 0, duration: .8, stagger: .07, ease: 'power3.out'})});
    $$('.h-tile img').forEach(img => G.fromTo(img, {yPercent: -5}, {yPercent: 5, ease: 'none', scrollTrigger: {trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true}}));
    G.from('.h-door', {opacity: 0, y: 36, duration: .8, stagger: .1, ease: 'power3.out', scrollTrigger: {trigger: '.h-doors', start: 'top 90%'}});
  });
  document.fonts.ready.then(() => { if (!main.contains(mq)) return; ctx.add(() => {
    const h = SplitText.create('.h-hero h1', {type: 'words', mask: 'words'});
    G.timeline({defaults: {ease: 'power4.out'}})
      .from(h.words, {yPercent: 110, duration: 1, stagger: .05})
      .from('.h-lede', {opacity: 0, y: 24, duration: .9}, '-=.6')
      .from('.h-chip', {opacity: 0, y: 18, duration: .6, stagger: .03}, '-=.6')
      .from('#h-band', {clipPath: 'inset(0 100% 0 0)', duration: 1.4, ease: 'power3.inOut'}, '-=.8');
    G.utils.toArray('.h-intro h2, .h-wall-head h2, .h-doors-sec h2, .h-step h3').forEach(el => {
      const st = SplitText.create(el, {type: 'words', mask: 'words'});
      G.from(st.words, {yPercent: 100, duration: .8, stagger: .035, ease: 'power3.out', scrollTrigger: {trigger: el, start: 'top 85%'}});
    });
    ScrollTrigger.refresh();
  }); });
}
