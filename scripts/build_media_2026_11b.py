"""Photos, Commons recordings and atlas preview images added on 13 Nov 2026.
Inputs: data/raw/commons/ (see manifest.json there for pages, authors and licences)."""
import gzip, json, subprocess, hashlib
from pathlib import Path
import numpy as np, soundfile as sf, matplotlib
from PIL import Image
from scipy import signal
ROOT = Path(__file__).resolve().parents[1]; D = ROOT / "website/dist"; RAW = ROOT / "data/raw/commons"
man = json.load(open(RAW / "manifest.json"))
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()

# ---- photos
out = []
for m in [x for x in man if x["kind"] == "photo"]:
    im = Image.open(ROOT / m["file"]).convert("RGB"); im.thumbnail((1200, 1200))
    fn = f"assets/photos/{m['species']}.jpg"; im.save(D / fn, quality=86)
    out.append(dict(species=m["species"], asset=fn, title=m["title"], page=m["page"], artist=m["artist"], licence=m["licence"], source_sha256=m["sha256"], transformation="Resized to at most 1200 px; no other edits"))
json.dump(out, open(D / "data/photography-2026-11b.json", "w"), indent=1, ensure_ascii=False)

# ---- recordings
names = {"european-starling": ("Song", "European starling song"), "eurasian-blackcap": ("Song", "Eurasian blackcap song"), "domestic-cat": ("Meow", "Domestic cat meows")}
sounds = json.load(open(D / "data/sounds.json")); sounds = [s for s in sounds if not s["id"].startswith("commons-")]
for m in [x for x in man if x["kind"] == "audio"]:
    sp = m["species"]; d = D / "assets/sound" / sp; d.mkdir(parents=True, exist_ok=True)
    wav = d / "commons.wav"
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(ROOT / m["file"]), "-ac", "1", "-t", "20", str(wav)], check=True)
    x, fs = sf.read(wav, dtype="float32")
    f, t, S = signal.spectrogram(x, fs, window="hann", nperseg=1024, noverlap=768); keep = f <= 12000
    L = 10 * np.log10(S[keep] + 1e-20); top = np.percentile(L, 99.8); Z = np.clip((L - (top - 70)) / 70, 0, 1)[::-1]
    Image.fromarray((matplotlib.colormaps["magma"](Z)[..., :3] * 255).astype(np.uint8)).resize((900, 260), Image.BILINEAR).save(d / "commons.png", optimize=True)
    kind, title = names[sp]
    sounds.append(dict(id=f"commons-{sp}", species=sp, title=title, kind=kind, files={"original": f"assets/sound/{sp}/commons.wav"},
        spectrogram=dict(file=f"assets/sound/{sp}/commons.png", t1=round(len(x) / fs, 3), f1=12000.0, db_range=70, nperseg=1024, hop=256, window="hann"),
        source=dict(sample_rate=fs, duration_s=round(len(x) / fs, 3), file=m["title"].replace("File:", ""), sha256=m["sha256"], url=m["page"], licence=m["licence"],
                    citation=f"{m['artist']}, Wikimedia Commons ({m['title'].replace('File:', '')})"),
        playback="Decoded to mono WAV and limited to the first 20 s. No filtering."))
json.dump(sounds, open(D / "data/sounds.json", "w"), indent=1, ensure_ascii=False)

# ---- atlas preview images (mid-coronal section with region colours; honeybee: vertex projection of the surfaces)
(D / "assets/atlas-thumbs").mkdir(exist_ok=True)
for a in sorted((D / "data/atlas").iterdir()):
    meta = json.load(open(a / "meta.json")); W, H = 360, 260; canvas = Image.new("RGB", (W, H), (12, 14, 16))
    if meta.get("dims"):
        d = meta["dims"]; v = np.frombuffer(gzip.open(a / meta["images"][0]["file"]).read(), np.uint8).reshape(d[::-1]).transpose(2, 1, 0)
        ax = 2 if a.name in ("zebra-finch", "european-starling") else 1
        k = int(d[ax] * (0.55 if ax == 1 else 0.5)); g = np.take(v, k, axis=ax).T.astype(float)
        rgb = np.stack([g] * 3, -1)
        if meta.get("labels"):
            l = np.take(np.frombuffer(gzip.open(a / meta["labels"]["file"]).read(), np.uint16).reshape(d[::-1]).transpose(2, 1, 0), k, axis=ax).T
            pal = np.zeros((max(r["index"] for r in meta["regions"]) + 1, 3))
            for r in meta["regions"]: pal[r["index"]] = [int(r["color"][i:i + 2], 16) for i in (1, 3, 5)]
            m = l > 0; rgb[m] = rgb[m] * .6 + pal[l[m]] * .4
        flipv = meta.get("flip_display", {}).get("y" if ax == 2 else "z")
        if flipv: rgb = rgb[::-1]
        im = Image.fromarray(rgb.clip(0, 255).astype(np.uint8))
        sx, sy = meta["spacing_mm"][0], meta["spacing_mm"][1 if ax == 2 else 2]
        w, h = im.width * sx, im.height * sy; sc = min((W - 20) / w, (H - 20) / h); im = im.resize((int(w * sc), int(h * sc)), Image.LANCZOS)
    else:
        ms = json.load(open(a / "meshes.json")); buf = np.zeros((H, W, 3)); zb = np.full((H, W), -1e9)
        allv = np.concatenate([np.array(m["vertices"]).reshape(-1, 3) for m in ms]); c = (allv.min(0) + allv.max(0)) / 2; sc = (W - 30) / np.ptp(allv[:, 0])
        for m in ms:
            vv = np.array(m["vertices"]).reshape(-1, 3); col = [int(m["color"][i:i + 2], 16) for i in (1, 3, 5)]
            xs = ((vv[:, 0] - c[0]) * sc + W / 2).astype(int).clip(0, W - 1); ys = ((vv[:, 1] - c[1]) * sc + H / 2).astype(int).clip(0, H - 1)
            for x, y, z in zip(xs, ys, -vv[:, 2]):
                if z > zb[y, x]: zb[y, x] = z; buf[max(0, y - 1):y + 2, max(0, x - 1):x + 2] = col
        im = Image.fromarray(buf.astype(np.uint8)); canvas = Image.new("RGB", (W, H), (12, 14, 16)); 
    canvas.paste(im, ((W - im.width) // 2, (H - im.height) // 2)); canvas.save(D / f"assets/atlas-thumbs/{a.name}.jpg", quality=85)
print("photos", len(out), "sounds", len(sounds), "thumbs", len(list((D / "assets/atlas-thumbs").glob("*.jpg"))))
