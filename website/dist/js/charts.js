// Minimal SVG charts drawn from the deposited-data results. Every chart is followed by its data as a table.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', {maximumFractionDigits: d, minimumFractionDigits: d});
const COLORS = ['#3b6e8f', '#c27c2c', '#5a8f4e', '#8a5a9e'];
function ticks(min, max, n = 5) { const span = max - min || 1, raw = span / n, p = 10 ** Math.floor(Math.log10(raw)); const step = [1, 2, 2.5, 5, 10].map(m => m * p).find(s => s >= raw); const out = []; for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(+v.toFixed(8)); return out; }
const tip = document.getElementById('tooltip');
function bindTips(svg) {
  svg.addEventListener('pointermove', e => { const t = e.target.closest('[data-tip]'); if (!t) { tip.hidden = true; return; } tip.textContent = t.dataset.tip; tip.hidden = false; tip.style.left = Math.min(innerWidth - 270, e.clientX + 12) + 'px'; tip.style.top = (e.clientY + 12) + 'px'; });
  svg.addEventListener('pointerleave', () => tip.hidden = true);
}
function frame(host, {title, note, legend}) {
  const el = document.createElement('figure'); el.className = 'chart';
  el.innerHTML = `<div class="chart-head"><h3>${esc(title)}</h3></div>${legend ? `<div class="legend">${legend.map((l, i) => `<span><i style="background:${l.color || COLORS[i]}"></i>${esc(l.label)}</span>`).join('')}</div>` : ''}<div class="svg-host"></div>${note ? `<figcaption>${esc(note)}</figcaption>` : ''}`;
  host.appendChild(el); return el;
}
function table(el, head, rows, label = 'Show data as a table') {
  const d = document.createElement('details'); d.className = 'data-table';
  d.innerHTML = `<summary>${esc(label)}</summary><div class="table-scroll"><table><thead><tr>${head.map(h => `<th scope="col"${/^[#n]|count|value|kHz|%|°|slope|sd|files|rows|recount|published/i.test(h) ? ' class="num"' : ''}>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td${typeof c === 'number' ? ' class="num"' : ''}>${typeof c === 'number' ? fmt(c, Number.isInteger(c) ? 0 : 2) : esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  el.appendChild(d);
}

// Horizontal bars, optional second series
export function hbar(host, {title, note, data, series = ['Count'], xlabel = 'Count', log = false}) {
  const el = frame(host, {title, note, legend: series.length > 1 ? series.map(l => ({label: l})) : null});
  const W = 760, rowH = series.length > 1 ? 26 : 22, L = 150, R = 60, T = 8, B = 34, H = T + B + data.length * rowH;
  const max = Math.max(...data.flatMap(d => d.values));
  const x = v => L + (W - L - R) * (log ? Math.log10(Math.max(v, 1)) / Math.log10(max) : v / max);
  const tk = log ? [1, 10, 100, 1e3, 1e4, 1e5, 1e6].filter(v => v <= max * 1.01) : ticks(0, max, 5);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}"><g class="grid">${tk.map(v => `<line x1="${x(v)}" x2="${x(v)}" y1="${T}" y2="${H - B}"/>`).join('')}</g>`;
  data.forEach((d, i) => {
    const y0 = T + i * rowH;
    s += `<text x="${L - 8}" y="${y0 + rowH / 2 + 4}" text-anchor="end">${esc(d.label)}</text>`;
    d.values.forEach((v, j) => { const bh = (rowH - 6) / d.values.length, y = y0 + 3 + j * bh;
      s += `<rect class="bar" style="fill:${COLORS[j]}" x="${L}" y="${y}" width="${Math.max(1, x(v) - L)}" height="${bh - 1}" data-tip="${esc(d.label)} · ${esc(series[j])}: ${fmt(v)}"/>`; });
    s += `<text x="${x(Math.max(...d.values)) + 5}" y="${y0 + rowH / 2 + 4}">${fmt(d.values[0])}</text>`;
  });
  s += `<g class="axis"><line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/></g>${tk.map(v => `<text x="${x(v)}" y="${H - B + 15}" text-anchor="middle">${fmt(v)}</text>`).join('')}<text x="${(L + W - R) / 2}" y="${H - 4}" text-anchor="middle">${esc(xlabel)}${log ? ' (log scale)' : ''}</text></svg>`;
  el.querySelector('.svg-host').innerHTML = s; bindTips(el.querySelector('svg'));
  table(el, ['Category', ...series], data.map(d => [d.label, ...d.values]));
}

// Overlaid histograms with shared bins
export function hist(host, {title, note, edges, series, xlabel, ylabel = 'Calls'}) {
  const el = frame(host, {title, note, legend: series.map((s, i) => ({label: s.label, color: COLORS[i]}))});
  const W = 760, H = 300, L = 54, R = 16, T = 10, B = 42;
  const max = Math.max(...series.flatMap(s => s.counts));
  const x = v => L + (W - L - R) * (v - edges[0]) / (edges.at(-1) - edges[0]), y = v => H - B - (H - T - B) * v / max;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}"><g class="grid">${ticks(0, max).map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/>`).join('')}</g>`;
  series.forEach((sr, j) => sr.counts.forEach((c, i) => { if (!c) return; s += `<rect class="bar" style="fill:${COLORS[j]};opacity:.78" x="${x(edges[i]) + 0.5}" y="${y(c)}" width="${x(edges[i + 1]) - x(edges[i]) - 1}" height="${H - B - y(c)}" data-tip="${esc(sr.label)} · ${edges[i]}–${edges[i + 1]}: ${fmt(c)}"/>`; }));
  s += `<g class="axis"><line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/><line x1="${L}" x2="${L}" y1="${T}" y2="${H - B}"/></g>`;
  s += ticks(edges[0], edges.at(-1), 8).map(v => `<text x="${x(v)}" y="${H - B + 15}" text-anchor="middle">${v}</text>`).join('') + ticks(0, max).map(v => `<text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`).join('');
  s += `<text x="${(L + W) / 2}" y="${H - 6}" text-anchor="middle">${esc(xlabel)}</text><text transform="translate(14 ${(T + H - B) / 2}) rotate(-90)" text-anchor="middle">${esc(ylabel)}</text></svg>`;
  el.querySelector('.svg-host').innerHTML = s; bindTips(el.querySelector('svg'));
  table(el, ['Bin', ...series.map(s => s.label)], edges.slice(0, -1).map((e, i) => [`${e}–${edges[i + 1]}`, ...series.map(s => s.counts[i])]).filter(r => r.slice(1).some(v => v)));
}

// Scatter panels: points {x,y}; optional line y = c + x (wrapped to ±180)
export function scatterPanels(host, {title, note, panels, xlabel, ylabel}) {
  const el = frame(host, {title, note});
  const W = 360, H = 260, L = 46, R = 10, T = 22, B = 38;
  const wrap = document.createElement('div'); wrap.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px';
  panels.forEach(p => {
    const xs = p.points.map(q => q.x), x0 = Math.floor(Math.min(...xs) / 10) * 10, x1 = Math.ceil(Math.max(...xs) / 10) * 10;
    const x = v => L + (W - L - R) * (v - x0) / (x1 - x0), y = v => T + (H - T - B) * (180 - v) / 360;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(p.title)}"><text x="${L}" y="14" style="font-weight:600;fill:var(--ink)">${esc(p.title)}</text>`;
    s += `<g class="grid">${[-180, -90, 0, 90, 180].map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/>`).join('')}</g>`;
    s += p.points.map(q => `<circle class="pt" cx="${x(q.x).toFixed(1)}" cy="${y(q.y).toFixed(1)}" r="2.4" fill="${COLORS[0]}" data-tip="${esc(q.tip)}"/>`).join('');
    if (p.line != null) { // y = c + slope*x, wrapped
      const seg = []; let prev = null;
      for (let v = x0; v <= x1; v += 1) { let yy = ((p.line + p.slope * v + 180) % 360 + 360) % 360 - 180; if (prev != null && Math.abs(yy - prev) > 180) seg.push(null); seg.push([x(v), y(yy)]); prev = yy; }
      let d = '', pen = false; seg.forEach(pt => { if (!pt) { pen = false; return; } d += (pen ? 'L' : 'M') + pt[0].toFixed(1) + ' ' + pt[1].toFixed(1); pen = true; });
      s += `<path d="${d}" fill="none" stroke="${COLORS[1]}" stroke-width="2"/>`;
    }
    s += `<g class="axis"><line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/><line x1="${L}" x2="${L}" y1="${T}" y2="${H - B}"/></g>`;
    s += ticks(x0, x1, 5).map(v => `<text x="${x(v)}" y="${H - B + 14}" text-anchor="middle">${v}°</text>`).join('') + [-180, -90, 0, 90, 180].map(v => `<text x="${L - 5}" y="${y(v) + 4}" text-anchor="end">${v}°</text>`).join('');
    s += `<text x="${(L + W) / 2}" y="${H - 6}" text-anchor="middle">${esc(xlabel)}</text><text transform="translate(12 ${(T + H - B) / 2}) rotate(-90)" text-anchor="middle">${esc(ylabel)}</text></svg>`;
    const d = document.createElement('div'); d.innerHTML = s; wrap.appendChild(d); bindTips(d.querySelector('svg'));
  });
  el.querySelector('.svg-host').appendChild(wrap);
  return el;
}

// ------------------------------------------------------------------ per-review figures
export function forReview(id, d, host) {
  host.innerHTML = '';
  if (id === 'bat-annotation-recount') {
    const c = d.tables.contexts;
    hbar(host, {title: 'Annotations per behavioural context: published table vs. our recount', series: ['Published (Metadata Table 4)', 'Recount from Annotations.csv'], log: true, xlabel: 'Annotations',
      data: c.map(r => ({label: r.context, values: [r.published, r.recount]})), note: 'The two bars are identical for every context. Logarithmic axis so that small contexts (Landing, 16) remain visible.'});
    const el = host.lastChild;
    table(el, ['Bat', 'Published', 'Annotation rows', 'Unique files'], d.tables.per_bat.map(r => [String(r.bat), r.published, r.annotation_rows, r.unique_files]), 'Per-bat comparison (Metadata Table 2)');
    const q = d.tables.duration_quartiles_s;
    hbar(host, {title: 'Median annotated segment length by context', xlabel: 'Seconds', data: Object.entries(q).map(([k, v]) => ({label: k, values: [v[1]]})), series: ['Median (s)'],
      note: 'Segment length is (end sample − start sample) / 250 kHz. A segment can contain several calls, so this is not a single-call duration.'});
  }
  if (id === 'marmoset-annotation-recount') {
    hbar(host, {title: 'Rows in Annotations.tsv by label', log: true, xlabel: 'Files', data: d.tables.label_counts.map(r => ({label: r.label, values: [r.n]})),
      note: '“Vocalization” marks segments detected as calls but not assigned a type. The six typed labels sum to 215,223.'});
    hbar(host, {title: 'Files per recording month', xlabel: 'Files', data: d.tables.files_per_month.map(r => ({label: r.month, values: [r.n]})), note: 'From the year and month columns of the annotation file.'});
  }
  if (id === 'mouse-separation-calls') {
    const h = d.tables.peak_hist;
    hist(host, {title: 'Peak frequency of accepted calls', xlabel: 'Peak frequency (kHz)', edges: h.edges_khz, series: Object.entries(h.counts).map(([k, v]) => ({label: k, counts: v})),
      note: 'Peak frequencies as exported by DeepSqueak in the deposited tables; 2.5 kHz bins. Human hearing extends to about 20 kHz.'});
    const pa = d.tables.per_animal;
    const keys = Object.keys(pa[0]).filter(k => k !== 'animal');
    hbar(host, {title: 'Calls per animal by family', series: keys, xlabel: 'Calls', data: pa.map(r => ({label: r.animal.replace('_', ' · '), values: keys.map(k => r[k])})), note: 'Animal ID and sex (m/f) from the file names.'});
    const t = document.createElement('div'); host.appendChild(t);
    table(t, ['Label', 'Calls', 'Median peak kHz', 'Q1 kHz', 'Q3 kHz', 'Median duration ms'], d.tables.per_label.map(r => [r.label, r.n, r.peak_khz_median, r.peak_khz_q1, r.peak_khz_q3, r.dur_ms_median]), 'Summary by call label');
  }
  if (id === 'honeybee-dance-sun') {
    const g = d.tables.groups;
    const panels = g.map(gr => ({title: `Camera ${gr.camera}, feeder ${gr.feeder} (n = ${gr.dances})`, line: gr.offset_slope1_deg, slope: 1,
      points: d.points.filter(p => p.camera === gr.camera && p.feeder === gr.feeder).map(p => ({x: p.sun_az, y: p.angle, tip: `${p.time.replace('T', ' ').slice(0, 16)} UTC · sun ${p.sun_az.toFixed(1)}° · dance ${p.angle.toFixed(1)}° · ${p.runs} runs`}))}));
    const el = scatterPanels(host, {title: 'Dance angle against the sun’s azimuth at the time of the dance', panels, xlabel: 'Sun azimuth (° from north)', ylabel: 'Dance angle (image °)',
      note: 'Each point is one dance (circular mean of its waggle runs). The orange line has slope 1: what the dance angle should do if it tracks the sun one-for-one. Angles are in camera image coordinates.'});
    table(el, ['Camera', 'Feeder', 'Dances', 'Best slope', '95% CI', 'Circular SD, fixed angle °', 'Circular SD, slope 1 °'], g.map(r => [String(r.camera), String(r.feeder), r.dances, r.best_slope, `${r.slope_ci95[0]} to ${r.slope_ci95[1]}`, r.circ_sd_fixed_angle, r.circ_sd_slope1]), 'Fit results by group');
  }
}
