"""Additions of 12 Nov 2026 (version 2.4): mouse lemur atlas, and recordings for the rat, starling,
Micklem's mole-rat and mouse lemur. Downloads the originals into data/raw/ when they are missing.

Sources (all CC BY 4.0 unless stated):
  Mouse lemur MRI template and atlas   doi:10.5281/zenodo.8403785
  USCMed rat ultrasonic vocalizations  doi:10.5281/zenodo.15029872 (one recording, read from the remote archive)
  European starling song library       doi:10.5281/zenodo.3237218  (three files of bird b1125, read from the remote archive)
  Fukomys micklemi call recordings     doi:10.6084/m9.figshare.825719.v2
  Mouse lemur photograph and calls     Wikimedia Commons (licences recorded per file)
Run: python -I scripts/build_phase4.py
"""
import gzip, hashlib, json, re, subprocess, sys, tarfile, time, urllib.request, urllib.error
from pathlib import Path
import numpy as np, soundfile as sf, matplotlib, nibabel as nib, certifi, ssl
from PIL import Image
from scipy import signal
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_atlases import to_u8, write_gz, mesh_from_mask, pack_mesh

ROOT = Path(__file__).resolve().parents[1]; RAW = ROOT / "data/raw"; D = ROOT / "website/dist"
CTX = ssl.create_default_context(cafile=certifi.where()); UA = {"User-Agent": "acn-site-builder/1.0 (static research site build script)"}
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
MAN = []
def get(url, dest):
    dest = Path(dest); dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        for attempt in range(5):
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers=UA), context=CTX) as r: dest.write_bytes(r.read())
                break
            except urllib.error.HTTPError as e:
                if e.code != 429 or attempt == 4: raise
                time.sleep(20 * (attempt + 1))
    MAN.append(dict(path=str(dest.relative_to(ROOT)), url=url, bytes=dest.stat().st_size, sha256=sha(dest)))
    return dest
def api(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), context=CTX) as r: return json.load(r)
def spec_png(x, fs, out, fmax, nperseg=1024, db=70):
    hop = nperseg // 4; f, t, S = signal.spectrogram(x, fs, window="hann", nperseg=nperseg, noverlap=nperseg - hop); keep = f <= fmax
    L = 10 * np.log10(S[keep] + 1e-20); top = np.percentile(L, 99.8); Z = np.clip((L - (top - db)) / db, 0, 1)[::-1]
    Image.fromarray((matplotlib.colormaps["magma"](Z)[..., :3] * 255).astype(np.uint8)).resize((900, 260), Image.BILINEAR).save(out, optimize=True)
    return dict(file=str(Path(out).relative_to(D)), t1=round(len(x) / fs, 4), f0=0.0, f1=round(float(f[keep][-1]), 1), db_range=db, nperseg=nperseg, hop=hop, window="hann")
def wav16(path, x, fs):
    x = np.asarray(x, np.float32); sf.write(path, x / (np.abs(x).max() or 1) * 0.89, int(fs), subtype="PCM_16")
mono = lambda x: x if x.ndim == 1 else x[:, 0]
sounds = []

# ------------------------------------------------------------------ mouse lemur atlas
def lemur():
    src = get("https://zenodo.org/api/records/8403785/files/MIRCen-MouseLemurAtlas_V0.01.tar.gz/content", RAW / "mouse-lemur/MIRCen-MouseLemurAtlas_V0.01.tar.gz")
    x = RAW / "mouse-lemur/x"
    if not x.exists(): tarfile.open(src).extractall(x, filter="data")
    base = next(x.iterdir())
    timg = nib.as_closest_canonical(nib.load(base / "MouseLemurHeadTemplate_91mu_V0.01.nii.gz")); limg = nib.as_closest_canonical(nib.load(base / "MouseLemurLabels_V0.01.nii.gz"))
    assert nib.aff2axcodes(timg.affine) == ("R", "A", "S") and timg.shape == limg.shape
    T = np.asarray(timg.dataobj).astype(np.float32); seg = np.asarray(limg.dataobj).astype(np.int32); sp = float(timg.header.get_zooms()[0])
    names = {}
    for line in (base / "MouseLemurLabelNames.txt").read_text().splitlines():
        m = re.match(r'\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+\S+\s+\d\s+\d\s+"(.*)"', line)
        if m: names[int(m[1])] = (m[5].strip(), "#%02x%02x%02x" % (int(m[2]), int(m[3]), int(m[4])))
    ids = [int(i) for i in np.unique(seg) if i]; index = {s: k + 1 for k, s in enumerate(ids)}
    lut = np.zeros(seg.max() + 1, np.uint16)
    for s, k in index.items(): lut[s] = k
    lab = lut[seg]; counts = dict(zip(*np.unique(seg, return_counts=True)))
    regions = []
    for s, k in index.items():
        nm, col = names.get(s, (f"Label {s}", "#999999")); hemi = ""
        m = re.match(r"(.*) ([LR])$", nm)
        if m: nm, hemi = m[1], {"L": "left", "R": "right"}[m[2]]
        regions.append(dict(index=k, source_id=s, acronym="", name=nm, hemisphere=hemi, color=col, voxels=int(counts[s]), volume_mm3=round(int(counts[s]) * sp ** 3, 4)))
    # check of the left-right axis against the label names
    chk = [r for r in regions if r["name"] == "hippocampal formation"]
    xs = {r["hemisphere"]: float(np.nonzero(seg == r["source_id"])[0].mean()) for r in chk}
    print("lemur dims", T.shape, "spacing", sp, "regions", len(regions), "hippocampus mean x left/right", xs)
    assert xs["left"] < xs["right"], "left-labelled structure is not on the low-x side of the RAS volume"
    brain = (seg > 0) & (seg != next((s for s, (n, _) in names.items() if n == "CSF"), -1))
    img, win = to_u8(T, mask=brain)
    out = D / "data/atlas/grey-mouse-lemur"; out.mkdir(parents=True, exist_ok=True)
    order = lambda a: np.ascontiguousarray(a.transpose(2, 1, 0))   # x fastest on disk
    sizes = {"image-t2.u8.gz": write_gz(out / "image-t2.u8.gz", img), "labels.u16.gz": write_gz(out / "labels.u16.gz", lab)}
    meshes = []
    v, f = mesh_from_mask(brain, (sp,) * 3, step=2, target_faces=24000)
    meshes.append(pack_mesh(dict(id=0, acronym="brain", name="Labelled brain (union of all regions except CSF)", color="#bdbdb4"), v, f))
    want = ["auditory", "inferior collicul", "medial geniculate", "cochlear", "superior oliv", "lateral lemnisc", "hippocampal", "amygdala", "caudate", "putamen", "thalamus", "superior collicul", "cerebell", "olfactory bulb"]
    for r in regions:
        if any(w in r["name"].lower() for w in want) and r["voxels"] > 1500 and len(meshes) < 27:
            vf = mesh_from_mask(lab == r["index"], (sp,) * 3, step=1, target_faces=5000)
            if vf: meshes.append(pack_mesh(dict(id=r["source_id"], acronym="", name=r["name"] + (f" ({r['hemisphere']})" if r["hemisphere"] else ""), color=r["color"]), *vf))
    json.dump(meshes, open(out / "meshes.json", "w"), separators=(",", ":"))
    meta = dict(species="grey-mouse-lemur", title="MIRCen mouse lemur MRI template and atlas (v0.01)", dims=list(img.shape), spacing_mm=[round(sp, 4)] * 3,
        view=dict(up="+z", names=dict(x="Sagittal", y="Coronal", z="Axial"), ends=dict(x=["L", "R"], y=["P", "A"], z=["I", "S"])), flip_display={"y": True, "z": True},
        images=[dict(file="image-t2.u8.gz", name="T2-weighted MRI template of the head, mean of 34 animals", window_source_units=win, kind="measured average")],
        labels=dict(file="labels.u16.gz", dtype="uint16", count=len(regions)), regions=regions, meshes="meshes.json", mesh_units="mm",
        mesh_note="Marching-cubes surfaces of the atlas labels, decimated for display.",
        provenance=dict(dataset="https://doi.org/10.5281/zenodo.8403785 (MIRCen-MouseLemurAtlas_V0.01)",
            citation="Nadkarni NA, Bougacha S, Garin C, Dhenain M, Picq J-L (2019) A 3D population-based brain atlas of the mouse lemur primate with examples of applications in aging studies and comparative anatomy. NeuroImage 185:85–95. doi:10.1016/j.neuroimage.2018.10.010",
            licence="CC BY 4.0", sha256={src.name: sha(src)}),
        processing=["The 91 µm template and label volumes are shown on their source grid; axes were reordered to right–anterior–superior using the orientation stored in the file header, without resampling.",
                    "Left and right were checked against the label names: structures labelled L lie on the low-x side of the volume.",
                    "The display window is the 0.5th–99.7th percentile of labelled-brain voxels.",
                    "The label CSF is listed as a region; it is excluded from the whole-brain surface."],
        sizes_bytes=sizes)
    json.dump(meta, open(out / "meta.json", "w"), indent=1, ensure_ascii=False)
    # preview: coronal section with region colours
    k = int(img.shape[1] * .5); g = img[:, k, :].T.astype(float); l = lab[:, k, :].T; rgb = np.stack([g] * 3, -1)
    pal = np.zeros((len(regions) + 1, 3))
    for r in regions: pal[r["index"]] = [int(r["color"][i:i + 2], 16) for i in (1, 3, 5)]
    m = l > 0; rgb[m] = rgb[m] * .6 + pal[l[m]] * .4; im = Image.fromarray(rgb[::-1].clip(0, 255).astype(np.uint8))
    W, H = 360, 260; sc = min((W - 20) / im.width, (H - 20) / im.height); im = im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS)
    cv = Image.new("RGB", (W, H), (12, 14, 16)); cv.paste(im, ((W - im.width) // 2, (H - im.height) // 2)); cv.save(D / "assets/atlas-thumbs/grey-mouse-lemur.jpg", quality=85)
    print("lemur meshes", len(meshes), sizes)

# ------------------------------------------------------------------ Commons: lemur photograph and calls
def commons():
    titles = ["File:Microcebus murinus 452184379.jpg", "File:Microcebus murinus vocalization 001.ogg", "File:Microcebus murinus vocalization 002.ogg"]
    q = api("https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata|url&format=json&titles=" + urllib.request.quote("|".join(titles)))
    strip = lambda s: re.sub(r"<[^>]+>", "", s or "").strip()
    out = []
    for p in q["query"]["pages"].values():
        ii = p["imageinfo"][0]; e = ii["extmetadata"]; t = p["title"]
        f = get(ii["url"], RAW / "commons" / t.replace("File:", "").replace(" ", "_"))
        info = dict(title=t, page=ii["descriptionurl"], artist=strip(e.get("Artist", {}).get("value")), licence=e.get("LicenseShortName", {}).get("value"), description=strip(e.get("ImageDescription", {}).get("value")), sha256=sha(f))
        MAN[-1].update(info); out.append((f, info))
    for f, info in out:
        if f.suffix == ".jpg":
            im = Image.open(f).convert("RGB"); im.thumbnail((1200, 1200)); im.save(D / "assets/photos/grey-mouse-lemur.jpg", quality=86); print("photo", info)
        else:
            n = re.search(r"(\d{3})", f.name)[1]; d = D / "assets/sound/grey-mouse-lemur"; d.mkdir(parents=True, exist_ok=True); wav = d / f"commons-{n}.wav"
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(f), "-ac", "1", "-t", "20", str(wav)], check=True)
            x, fs = sf.read(wav, dtype="float32")
            sounds.append(dict(id=f"lemur-commons-{n}", species="grey-mouse-lemur", title=f"Vocalization {n}", kind="Call", files={"original": str(wav.relative_to(D))},
                spectrogram=spec_png(x, fs, d / f"commons-{n}.png", min(20000, fs / 2)),
                source=dict(sample_rate=fs, duration_s=round(len(x) / fs, 3), file=info["title"].replace("File:", ""), sha256=info["sha256"], url=info["page"], licence=info["licence"],
                            citation=f"{info['artist']}, Wikimedia Commons ({info['title'].replace('File:', '')})"),
                playback=f"Decoded to mono WAV, at most the first 20 s. No filtering. Uploader's description: “{info['description']}”. The recording conditions are not documented."))

# ------------------------------------------------------------------ Fukomys micklemi
def micklemi():
    art = api("https://api.figshare.com/v2/articles/825719"); d = D / "assets/sound/micklems-mole-rat"; d.mkdir(parents=True, exist_ok=True)
    assert art["license"]["name"] == "CC BY 4.0"
    for fl in sorted(art["files"], key=lambda f: f["name"]):
        if not fl["name"].endswith(".wav"): continue
        src = get(fl["download_url"], RAW / "fukomys-micklemi" / fl["name"]); n = re.search(r"sm(\d+)", fl["name"])[1]
        x, fs = sf.read(src, dtype="float32"); x = mono(x); wav16(d / f"sm{n}.wav", x, fs)
        sounds.append(dict(id=f"micklemi-sm{n}", species="micklems-mole-rat", title=f"Call recording {n}", kind="Call", files={"original": f"assets/sound/micklems-mole-rat/sm{n}.wav"},
            spectrogram=spec_png(x, fs, d / f"sm{n}.png", min(16000, fs / 2), nperseg=512),
            source=dict(sample_rate=fs, duration_s=round(len(x) / fs, 3), file=fl["name"], sha256=sha(src), doi="10.6084/m9.figshare.825719.v2", url="https://doi.org/10.6084/m9.figshare.825719.v2", licence="CC BY 4.0",
                        citation="Vanden Hole C, Van Daele PAAG, Desmet N, Devos P, Adriaens D (2014) Does sociality imply a complex vocal communication system? A case study for Fukomys micklemi (Bathyergidae, Rodentia). Bioacoustics 23:143–160. doi:10.1080/09524622.2013.841085"),
            playback="Supplementary file, first channel, scaled to a common peak level. The deposit does not state the call type of each file."))
    print("micklemi", sum(s["species"] == "micklems-mole-rat" for s in sounds))

# ------------------------------------------------------------------ rat USVs and starling song (members of remote archives)
def remote():
    from remotezip import RemoteZip
    url = "https://zenodo.org/api/records/15029872/files/USCMed.zip/content"; dst = RAW / "rat-usv/PTSD16_Context01.wav"; ann = RAW / "rat-usv/annotations/PTSD16_Context01.csv"
    if not dst.exists() or not ann.exists():
        with RemoteZip(url) as z:
            ann.parent.mkdir(parents=True, exist_ok=True); ann.write_bytes(z.read("USCMed_Context/annotations/PTSD16_Context01.csv")); dst.write_bytes(z.read("USCMed_Context/audio_files/PTSD16_Context01.wav"))
    for p, member in [(dst, "USCMed_Context/audio_files/PTSD16_Context01.wav"), (ann, "USCMed_Context/annotations/PTSD16_Context01.csv")]:
        MAN.append(dict(path=str(p.relative_to(ROOT)), url=url, archive_member=member, bytes=p.stat().st_size, sha256=sha(p)))
    rows = [l.split("\t") for l in ann.read_text().splitlines()[1:] if l.strip()]
    calls = [(float(r[1]), float(r[2]), r[5].strip() if len(r) > 5 else "") for r in rows]; types = sorted({c[2] for c in calls})
    info = sf.info(dst); fs = info.samplerate; print("rat wav", fs, "Hz", round(info.duration, 1), "s; annotated calls", len(calls), "types", types)
    t0 = 158.6; dur = 8.0; x, _ = sf.read(dst, start=int(t0 * fs), frames=int(dur * fs), dtype="float32"); x = mono(x)
    inwin = [c for c in calls if c[0] >= t0 and c[1] <= t0 + dur]
    d = D / "assets/sound/norway-rat"; d.mkdir(parents=True, exist_ok=True); wav16(d / "usv-22khz-te10.wav", x, fs / 10)
    md = api("https://zenodo.org/api/records/15029872")["metadata"]
    sounds.append(dict(id="rat-usv-22khz", species="norway-rat", title="22-kHz ultrasonic calls", kind="Ultrasonic call series", files={"expanded": "assets/sound/norway-rat/usv-22khz-te10.wav"},
        spectrogram=spec_png(x, fs, d / "usv-22khz.png", min(100000, fs / 2)),
        source=dict(sample_rate=fs, duration_s=dur, file="USCMed_Context/audio_files/PTSD16_Context01.wav", sha256=sha(dst), doi="10.5281/zenodo.15029872", url="https://doi.org/10.5281/zenodo.15029872", licence="CC BY 4.0",
                    citation="; ".join(c["name"] for c in md["creators"]) + f" ({md['publication_date'][:4]}) {md['title']}. Zenodo. doi:10.5281/zenodo.15029872"),
        playback=f"Excerpt from {t0:.1f} s to {t0 + dur:.1f} s of the source file, played at 1/10 speed; all frequencies are divided by 10. The deposited annotation file marks {len(inwin)} calls in this excerpt, labelled {', '.join(sorted({c[2] or 'unlabelled' for c in inwin}))}, between 18 and 30 kHz."))
    surl = "https://zenodo.org/api/records/3237218/files/b1125.zip/content"; d = D / "assets/sound/european-starling"; d.mkdir(parents=True, exist_ok=True)
    picks = ["2018-03-05_18-36-51-290000", "2018-03-06_06-40-51-990000", "2018-03-06_12-04-07-110000"]
    if not all((RAW / "starling-song" / f"{p}.wav").exists() for p in picks):
        with RemoteZip(surl) as z:
            for p in picks: (RAW / "starling-song").mkdir(parents=True, exist_ok=True); (RAW / "starling-song" / f"{p}.wav").write_bytes(z.read(f"b1125/wavs/{p}.wav"))
    for i, p in enumerate(picks):
        src = RAW / "starling-song" / f"{p}.wav"; MAN.append(dict(path=str(src.relative_to(ROOT)), url=surl, archive_member=f"b1125/wavs/{p}.wav", bytes=src.stat().st_size, sha256=sha(src)))
        x, fs = sf.read(src, dtype="float32"); x = mono(x)[: int(30 * fs)]; wav16(d / f"b1125-{i + 1}.wav", x, fs)
        sounds.append(dict(id=f"starling-b1125-{i + 1}", species="european-starling", title=f"Song of male b1125, recording {i + 1}", kind="Song", files={"original": f"assets/sound/european-starling/b1125-{i + 1}.wav"},
            spectrogram=spec_png(x, fs, d / f"b1125-{i + 1}.png", min(12000, fs / 2)),
            source=dict(sample_rate=fs, duration_s=round(len(x) / fs, 3), file=f"b1125/wavs/{p}.wav", sha256=sha(src), doi="10.5281/zenodo.3237218", url="https://doi.org/10.5281/zenodo.3237218", licence="CC BY 4.0",
                        citation="Arneodo Z, Sainburg T, Jeanne J, Gentner T (2019) An acoustically isolated European starling song library. Zenodo. doi:10.5281/zenodo.3237218"),
            playback="First channel, at most the first 30 s, scaled to a common peak level. Recorded from a single bird in an acoustically isolated chamber."))

if __name__ == "__main__":
    lemur(); commons(); micklemi(); remote()
    path = D / "data/sounds.json"; old = [s for s in json.load(open(path)) if not re.match(r"(lemur-commons|micklemi|rat-usv|starling-b1125)-", s["id"])]
    json.dump(old + sounds, open(path, "w"), indent=1, ensure_ascii=False)
    json.dump(MAN, open(ROOT / "research/sources-2026-11-phase4.json", "w"), indent=1, ensure_ascii=False)
    print("sounds added", len(sounds), "total", len(old) + len(sounds))
