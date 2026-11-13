// Small DSP toolkit used by the interactive models. Everything runs on decoded samples of real recordings.
const V = '20261116a';
const audioCache = new Map();

export async function decode(url, sampleRate) {
  const key = url + '@' + (sampleRate || 'native');
  if (!audioCache.has(key)) audioCache.set(key, (async () => {
    const buf = await (await fetch(`${url}?v=${V}`)).arrayBuffer();
    const Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const ctx = new Ctx(1, 1, sampleRate || 44100);
    const ab = await ctx.decodeAudioData(buf);
    const x = ab.getChannelData(0).slice();
    return {x, sr: ab.sampleRate, dur: ab.duration};
  })());
  return audioCache.get(key);
}

// in-place radix-2 FFT
export function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) { const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti; const ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr; } }
  }
}

// STFT power (scipy.signal.spectrogram 'psd' scaling, constant detrend), returns {P: Float32Array[frames][bins], freqs, hop}
export function stftPower(x, sr, {win, hop, nfft}) {
  const w = new Float32Array(win); let wss = 0;
  for (let i = 0; i < win; i++) { w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / win); wss += w[i] * w[i]; } // periodic Hann (scipy default)
  const frames = Math.max(0, Math.floor((x.length - win) / hop) + 1), nb = nfft / 2 + 1, scale = 1 / (sr * wss);
  const P = []; const re = new Float64Array(nfft), im = new Float64Array(nfft);
  for (let f = 0; f < frames; f++) {
    re.fill(0); im.fill(0); let m = 0; const o = f * hop;
    for (let i = 0; i < win; i++) m += x[o + i]; m /= win;
    for (let i = 0; i < win; i++) re[i] = (x[o + i] - m) * w[i];
    fft(re, im);
    const row = new Float32Array(nb);
    for (let k = 0; k < nb; k++) { let p = (re[k] * re[k] + im[k] * im[k]) * scale; if (k > 0 && k < nb - 1) p *= 2; row[k] = p; }
    P.push(row);
  }
  return {P, freqs: Array.from({length: nb}, (_, k) => k * sr / nfft), hop, frames};
}

// colour maps
const MAGMA = [[0,0,4],[28,16,68],[79,18,123],[129,37,129],[181,54,122],[229,80,100],[251,135,97],[254,194,135],[252,253,191]];
export function magma(t) { t = Math.max(0, Math.min(1, t)) * (MAGMA.length - 1); const i = Math.min(MAGMA.length - 2, Math.floor(t)), f = t - i; return MAGMA[i].map((c, k) => c + (MAGMA[i + 1][k] - c) * f); }
export function diverging(t) { // t in [-1,1]: blue - near-black - red (dark backgrounds)
  t = Math.max(-1, Math.min(1, t)); const a = Math.abs(t);
  return t >= 0 ? [30 + 225 * a, 30 + 70 * a, 36 + 20 * a] : [30 + 20 * a, 36 + 120 * a, 40 + 215 * a];
}

// draw a [rows=freq low->high][cols=time] matrix of 0..1 values into a canvas (low frequencies at the bottom)
export function paintMatrix(canvas, M, cmap = magma) {
  const rows = M.length, cols = M[0].length; canvas.width = cols; canvas.height = rows;
  const ctx = canvas.getContext('2d'), img = ctx.createImageData(cols, rows);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const [R, G, B] = cmap(M[r][c]); const o = ((rows - 1 - r) * cols + c) * 4; img.data[o] = R; img.data[o + 1] = G; img.data[o + 2] = B; img.data[o + 3] = 255; }
  ctx.putImageData(img, 0, 0);
}

export function dbNormalise(M, range = 70) {
  let mx = -Infinity; for (const r of M) for (const v of r) if (v > mx) mx = v;
  return M.map(r => Array.from(r, v => (v - (mx - range)) / range));
}

// ordinary spectrogram on log-spaced bands for display
export function bandSpectrogram(x, sr, {fmin, fmax, nbands, hopS = 0.004, winS = 0.008}) {
  const win = Math.round(winS * sr), hop = Math.round(hopS * sr); let nfft = 1; while (nfft < win * 2) nfft <<= 1;
  const {P, freqs} = stftPower(x, sr, {win, hop, nfft});
  const edges = Array.from({length: nbands + 1}, (_, i) => fmin * (fmax / fmin) ** (i / nbands));
  const M = Array.from({length: nbands}, () => new Float32Array(P.length));
  for (let b = 0; b < nbands; b++) {
    let k0 = freqs.findIndex(f => f >= edges[b]), k1 = freqs.findIndex(f => f >= edges[b + 1]); if (k1 < 0) k1 = freqs.length; if (k1 <= k0) k1 = k0 + 1;
    for (let t = 0; t < P.length; t++) { let s = 0; for (let k = k0; k < k1; k++) s += P[t][k]; M[b][t] = 10 * Math.log10(s / (k1 - k0) + 1e-12); }
  }
  return {M, edges, dt: hop / sr};
}

// Gammatone filterbank envelopes (Holdsworth et al. 1988 implementation: complex demodulation + 4 cascaded one-pole low-pass filters)
// ERB(f) = 24.7 (4.37 f/1000 + 1) (Glasberg & Moore 1990), b = 1.019 ERB. Output: envelope per channel, cube-root compressed, binned.
export function erbSpace(fmin, fmax, n) { const e = f => 21.4 * Math.log10(4.37e-3 * f + 1), ie = v => (10 ** (v / 21.4) - 1) / 4.37e-3; const a = e(fmin), b = e(fmax); return Array.from({length: n}, (_, i) => ie(a + (b - a) * i / (n - 1))); }
export function gammatone(x, sr, {fmin, fmax, n = 48, binS = 0.004}) {
  const cfs = erbSpace(fmin, fmax, n), bin = Math.max(1, Math.round(binS * sr)), nb = Math.floor(x.length / bin);
  const out = [];
  for (const cf of cfs) {
    const erb = 24.7 * (4.37 * cf / 1000 + 1), b = 1.019 * erb, a = Math.exp(-2 * Math.PI * b / sr), g = (1 - a) ** 4;
    const dw = 2 * Math.PI * cf / sr; let cr = 1, ci = 0; const cw = Math.cos(dw), sw = Math.sin(dw);
    let r1 = 0, i1 = 0, r2 = 0, i2 = 0, r3 = 0, i3 = 0, r4 = 0, i4 = 0;
    const env = new Float32Array(nb); let acc = 0, cnt = 0, j = 0;
    for (let t = 0; t < x.length; t++) {
      const xr = x[t] * cr, xi = -x[t] * ci; // demodulate
      r1 = xr + a * (r1 - xr); i1 = xi + a * (i1 - xi);
      r2 = r1 + a * (r2 - r1); i2 = i1 + a * (i2 - i1);
      r3 = r2 + a * (r3 - r2); i3 = i2 + a * (i3 - i2);
      r4 = r3 + a * (r4 - r3); i4 = i3 + a * (i4 - i3);
      acc += Math.hypot(r4, i4); cnt++;
      if (cnt === bin) { if (j < nb) env[j++] = Math.cbrt(acc / cnt); acc = 0; cnt = 0; }
      const ncr = cr * cw - ci * sw; ci = cr * sw + ci * cw; cr = ncr;
      if ((t & 1023) === 0) { const m = Math.hypot(cr, ci); cr /= m; ci /= m; }
    }
    out.push(env);
  }
  void 0;
  return {M: out, cfs, dt: bin / sr};
}

export function normaliseMax(M) { let mx = 0; for (const r of M) for (const v of r) if (v > mx) mx = v; return M.map(r => Array.from(r, v => v / (mx || 1))); }

// playback with a requestAnimationFrame callback reporting progress 0..1
export function makePlayer(audio, onFrame) {
  let raf = 0;
  const tick = () => { onFrame(audio.duration ? audio.currentTime / audio.duration : 0); if (!audio.paused) raf = requestAnimationFrame(tick); };
  audio.addEventListener('play', () => { cancelAnimationFrame(raf); tick(); });
  audio.addEventListener('pause', tick); audio.addEventListener('seeked', tick); audio.addEventListener('ended', () => onFrame(0));
  return {toggle() { audio.paused ? audio.play().catch(() => {}) : audio.pause(); }, seek(f) { if (audio.duration) audio.currentTime = f * audio.duration; }};
}
export const PLAY_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>';
export const PAUSE_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor"/></svg>';
