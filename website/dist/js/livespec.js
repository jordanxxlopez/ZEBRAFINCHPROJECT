// Live spectrogram: plays a recording that ships with the site and draws its short-time spectrum as it plays.
// Colour map matches the pre-rendered spectrogram images (matplotlib "magma").
const MAGMA = [[0, 0, 4], [28, 16, 68], [79, 18, 123], [129, 37, 129], [181, 54, 122], [229, 80, 100], [251, 135, 97], [254, 194, 135], [252, 253, 191]];
function lut(m, a) { const x = Math.min(.999, a) * (m.length - 1), i = Math.floor(x), f = x - i, p = m[i], q = m[i + 1];
  return [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f, p[2] + (q[2] - p[2]) * f]; }

// Live spectrogram: plays a real file and draws its short-time spectrum as it plays.
export class LiveSpectrogram {
  constructor(canvas, { maxHz = 12000, ink = [37, 78, 160], bg = [255, 255, 255], cmap = null } = {}) {
    this.cmap = cmap === 'magma' ? MAGMA : null;
    this.c = canvas; this.g = canvas.getContext('2d', { willReadFrequently: false });
    this.maxHz = maxHz; this.ink = ink; this.bg = bg; this.ctx = null; this.src = null;
    this.cache = new Map(); this.onend = null; this.raf = 0; this.fit();
    new ResizeObserver(() => this.fit()).observe(canvas);
  }
  fit() {
    const r = this.c.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
    if (w === this.c.width && h === this.c.height) return;
    this.c.width = w; this.c.height = h; this.clear();
  }
  clear() { const [r, g, b] = this.bg; this.g.fillStyle = `rgb(${r},${g},${b})`; this.g.fillRect(0, 0, this.c.width, this.c.height); }
  async buffer(url) {
    if (!this.cache.has(url)) this.cache.set(url, fetch(url).then(r => r.arrayBuffer()).then(a => this.ctx.decodeAudioData(a)));
    return this.cache.get(url);
  }
  stop() { if (this.src) { this.src.onended = null; try { this.src.stop(); } catch {} this.src = null; } cancelAnimationFrame(this.raf); }
  async play(url, { maxSeconds = 12 } = {}) {
    this.ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.stop(); this.clear();
    const buf = await this.buffer(url);
    const an = this.ctx.createAnalyser(); an.fftSize = 2048; an.smoothingTimeConstant = 0; an.minDecibels = -100; an.maxDecibels = -25;
    const src = this.ctx.createBufferSource(); src.buffer = buf; src.connect(an); an.connect(this.ctx.destination);
    const bins = new Uint8Array(an.frequencyBinCount), nyq = this.ctx.sampleRate / 2;
    const top = Math.min(bins.length, Math.floor(bins.length * this.maxHz / nyq));
    this.src = src; src.start(0, 0, Math.min(buf.duration, maxSeconds));
    const t0 = this.ctx.currentTime, dur = Math.min(buf.duration, maxSeconds);
    const step = () => {
      an.getByteFrequencyData(bins);
      const W = this.c.width, H = this.c.height, px = 2 * Math.min(devicePixelRatio || 1, 2);
      this.g.drawImage(this.c, -px, 0);
      const col = this.g.createImageData(px, H), [ir, ig, ib] = this.ink, [br, bg, bb] = this.bg;
      for (let y = 0; y < H; y++) {
        const v = bins[Math.floor((1 - y / H) * (top - 1))] / 255, a = Math.pow(v, 1.6);
        for (let x = 0; x < px; x++) {
          const i = (y * px + x) * 4;
          if (this.cmap) { const c = lut(this.cmap, a); col.data[i] = c[0]; col.data[i + 1] = c[1]; col.data[i + 2] = c[2]; }
          else { col.data[i] = br + (ir - br) * a; col.data[i + 1] = bg + (ig - bg) * a; col.data[i + 2] = bb + (ib - bb) * a; }
          col.data[i + 3] = 255;
        }
      }
      this.g.putImageData(col, W - px, 0);
      this.progress?.(Math.min(1, (this.ctx.currentTime - t0) / dur));
      this.raf = requestAnimationFrame(step);
    };
    src.onended = () => { cancelAnimationFrame(this.raf); this.src = null; this.onend?.(); };
    step();
  }
}
