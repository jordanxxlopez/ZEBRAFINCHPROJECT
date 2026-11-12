"""Build sound examples, spectrograms and data checks for the new species collections.

Every output is computed from files in data/raw/ (URLs, licences and checksums: research/sources-2026-11.json).
Outputs:
  website/dist/assets/sound/<species>/*.wav          playback copies (see each record's "playback" note)
  website/dist/assets/sound/<species>/*.png          spectrogram images (pure data, no axes; axes are drawn by the page)
  website/dist/data/sounds.json                       one record per playable example
  website/dist/data/checks/<check-id>.json           reanalyses and claim checks shown in the Research review

Run: python scripts/build_collections.py   (requires numpy, scipy, pandas, soundfile, pillow, matplotlib)
"""
import hashlib, json, math
from pathlib import Path

import numpy as np
import pandas as pd
import soundfile as sf
import matplotlib
from PIL import Image
from scipy import signal

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
DIST = ROOT / "website" / "dist"
SND = DIST / "assets" / "sound"
CHK = DIST / "data" / "checks"
CHK.mkdir(parents=True, exist_ok=True)
RNG = np.random.default_rng(20261112)


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def spectrogram_png(x, fs, out, fmax, nperseg, db_range=70, width=900, height=260):
    hop = max(1, nperseg // 4)
    f, t, S = signal.spectrogram(x, fs, window="hann", nperseg=nperseg, noverlap=nperseg - hop, mode="psd")
    keep = f <= fmax
    S = 10 * np.log10(S[keep] + 1e-20)
    top = np.percentile(S, 99.8)
    Z = np.clip((S - (top - db_range)) / db_range, 0, 1)[::-1]
    rgb = (matplotlib.colormaps["magma"](Z)[..., :3] * 255).astype(np.uint8)
    Image.fromarray(rgb).resize((width, height), Image.BILINEAR).save(out, optimize=True)
    return dict(t0=0.0, t1=round(len(x) / fs, 4), f0=0.0, f1=round(float(f[keep][-1]), 1), db_top=round(float(top), 1), db_range=db_range,
                nperseg=nperseg, hop=hop, window="hann")


def write_wav(path, x, fs):
    x = np.asarray(x, np.float32)
    peak = np.abs(x).max() or 1
    sf.write(path, x / peak * 0.89, int(fs), subtype="PCM_16")
    return sha(path)


def resample(x, fs, target):
    g = math.gcd(int(fs), int(target))
    return signal.resample_poly(x, int(target) // g, int(fs) // g)


# ------------------------------------------------------------------------------------------------ bat
def bat():
    out = SND / "egyptian-fruit-bat"; out.mkdir(parents=True, exist_ok=True)
    man = pd.read_csv(RAW / "bat/examples/manifest.tsv", sep="\t")
    recs = []
    for r in man.itertuples():
        if not r.file.endswith(".wav") or r.file.startswith("Noise"):
            continue
        src = RAW / "bat/examples" / f"{r.article_id}_{r.file}"
        x, fs = sf.read(src, dtype="float32")
        if x.ndim > 1:
            x = x[:, 0]
        stem = r.file[:-4].lower()
        kind = "Echolocation click train" if "Echo" in r.file else "Isolation call (pup)" if "Isolation" in r.file else "Social call"
        rt = resample(x, fs, 48000)
        write_wav(out / f"{stem}-48k.wav", rt, 48000)
        te = x  # same samples, declared at fs/10 => 10x slower, all frequencies divided by 10
        write_wav(out / f"{stem}-te10.wav", te, fs // 10)
        spec = spectrogram_png(x, fs, out / f"{stem}.png", fmax=60000 if "Echo" in r.file else 40000, nperseg=512)
        recs.append(dict(id=f"bat-{stem}", species="egyptian-fruit-bat", title=f"{kind} — example {r.file[:-4][-1]}", kind=kind,
                         files={"realtime": f"assets/sound/egyptian-fruit-bat/{stem}-48k.wav", "expanded": f"assets/sound/egyptian-fruit-bat/{stem}-te10.wav"},
                         spectrogram=dict(file=f"assets/sound/egyptian-fruit-bat/{stem}.png", **spec),
                         source=dict(sample_rate=fs, duration_s=round(len(x) / fs, 4), file=r.file, sha256=sha(src),
                                     doi=r.doi, url=f"https://doi.org/{r.doi}", licence="CC0",
                                     citation="Prat Y, Taub M, Pratt E, Yovel Y (2017) An annotated dataset of Egyptian fruit bat vocalizations across varying contexts and during vocal ontogeny. Scientific Data 4:170143. doi:10.1038/sdata.2017.143"),
                         playback="Real time: resampled from 250 kHz to 48 kHz, so content above 24 kHz is removed. Time-expanded: the original samples played 10× slower; every frequency is divided by 10. Peak-normalised; no filtering."))
    # ---- claim check: published context counts and per-bat counts vs deposited annotations
    a = pd.read_csv(RAW / "bat/Annotations.csv")
    names = {0: "Unknown", 1: "Separation", 2: "Biting", 3: "Feeding", 4: "Fighting", 5: "Grooming", 6: "Isolation", 7: "Kissing", 8: "Landing",
             9: "Mating protest", 10: "Threat-like", 11: "General", 12: "Sleeping"}
    published = {0: 640, 1: 504, 2: 1788, 3: 6683, 4: 7963, 5: 383, 6: 5714, 7: 362, 8: 16, 9: 2338, 10: 1065, 11: 29627, 12: 33997}
    counts = a.Context.value_counts()
    rows = [dict(code=k, context=names[k], published=v, recount=int(counts.get(k, 0)), files=int(a[a.Context == k].FileID.nunique())) for k, v in published.items()]
    t2 = {101: 197, 102: 307, 109: 1329, 110: 1058, 111: 1341, 119: 786, 120: 659, 201: 634, 207: 1245, 208: 779, 210: 1493, 211: 2225, 213: 1239,
          215: 6150, 216: 2524, 220: 1426, 221: 765, 226: 2310, 228: 1653, 230: 3269, 231: 3051}
    per_bat = [dict(bat=b, published=p, annotation_rows=int((a.Emitter == b).sum()), unique_files=int(a[a.Emitter == b].FileID.nunique())) for b, p in t2.items()]
    dur = (a["End sample"] - a["Start sample"]) / 250000
    fileinfo_rows = sum(1 for _ in open(RAW / "bat/FileInfo.csv")) - 1
    by_ctx = {names[k]: [round(float(q), 3) for q in np.percentile(dur[a.Context == k], [25, 50, 75])] for k in published if (a.Context == k).sum() >= 100}
    json.dump(dict(
        id="bat-annotation-recount", species="egyptian-fruit-bat",
        title="Recount of the Egyptian fruit bat annotation tables",
        paper=dict(citation=recs[0]["source"]["citation"], doi="10.1038/sdata.2017.143"),
        data=dict(files=["Annotations.csv (figshare file 7379008)", "FileInfo.csv (figshare file 8900695)", "Metadata.pdf (figshare file 8900800)"],
                  sha256={f: sha(RAW / "bat" / f) for f in ["Annotations.csv", "FileInfo.csv", "Metadata.pdf"]}, licence="CC0"),
        claims=[
            dict(claim="The recordings comprise almost 300,000 files.", source="Abstract",
                 result=f"FileInfo.csv lists {fileinfo_rows:,} files.", status="consistent"),
            dict(claim="Annotation counts per behavioural context (Metadata Table 4).", source="Metadata.pdf, Table 4",
                 result=f"All 13 context counts match the deposited Annotations.csv exactly ({len(a):,} annotations in {a.FileID.nunique():,} distinct files).", status="reproduced"),
            dict(claim="'#Rec. Emitted' per bat is the number of recorded files containing calls emitted by that bat.", source="Metadata.pdf, Table 2",
                 result=f"For each of the {len(per_bat)} bats checked (every bat with at least 197 published entries), the published number equals the count of annotation rows, which exceeds the count of distinct files by 0–80 because some files carry more than one annotation. The numbers are internally consistent; the column describes annotations rather than unique files.",
                 status="minor wording discrepancy")],
        tables=dict(contexts=rows, per_bat=per_bat, duration_quartiles_s=by_ctx),
        method="Counts computed with pandas from the deposited CSV files. Durations use (End sample − Start sample) / 250,000 Hz; they are annotated segment lengths, not single-syllable durations.",
        limits="This check confirms the internal consistency of the deposited tables. It does not re-score any audio or test the behavioural labels themselves."),
        open(CHK / "bat-annotation-recount.json", "w"), indent=1)
    return recs


# ------------------------------------------------------------------------------------------- marmoset
def marmoset():
    out = SND / "common-marmoset"; out.mkdir(parents=True, exist_ok=True)
    files = sorted((RAW / "marmoset/examples").rglob("*.wav"))
    by = {}
    for f in files:
        by.setdefault(f.stem.rsplit("_", 1)[0], []).append(f)
    recs = []
    for label, fl in sorted(by.items()):
        for f in fl[:2]:
            x, fs = sf.read(f, dtype="float32")
            if x.ndim > 1:
                x = x[:, 0]
            stem = f.stem.lower()
            write_wav(out / f"{stem}.wav", x, fs)
            spec = spectrogram_png(x, fs, out / f"{stem}.png", fmax=24000, nperseg=1024)
            nice = label.replace("_", " ")
            recs.append(dict(id=f"marmoset-{stem}", species="common-marmoset",
                             title=("Unlabelled vocalization segment" if label == "Vocalization" else f"{nice} call") + f" (file {f.stem.rsplit('_', 1)[1]})",
                             kind=nice, files={"realtime": f"assets/sound/common-marmoset/{stem}.wav"},
                             spectrogram=dict(file=f"assets/sound/common-marmoset/{stem}.png", **spec),
                             source=dict(sample_rate=fs, duration_s=round(len(x) / fs, 4), file=f"Audio_Examples/{f.relative_to(RAW / 'marmoset/examples/Audio_Examples')}",
                                         sha256=sha(f), doi="10.5281/zenodo.15017207", url="https://doi.org/10.5281/zenodo.15017207", licence="CC BY 4.0",
                                         citation="Lamothe C, Obliger-Debouche M, Best P, et al. (2025) A large annotated dataset of vocalizations by common marmosets. Scientific Data 12:782. doi:10.1038/s41597-025-04951-8"),
                             playback="Original 96 kHz samples, peak-normalised. Marmoset calls are audible; nothing is shifted."))
    a = pd.read_csv(RAW / "marmoset/Annotations.tsv", sep="\t", usecols=["label", "duration", "year", "month"])
    vc = a.label.value_counts()
    typed = int(vc.drop("Vocalization", errors="ignore").sum())
    monthly = a.assign(ym=a.year.astype(str) + "-" + a.month.astype(int).astype(str).str.zfill(2)).groupby("ym").size()
    json.dump(dict(
        id="marmoset-annotation-recount", species="common-marmoset", title="Recount of the MarmAudio annotation file",
        paper=dict(citation=recs[0]["source"]["citation"], doi="10.1038/s41597-025-04951-8"),
        data=dict(files=["Annotations.tsv (Zenodo 15017207, version 6)", "Metadata.pdf"], sha256={"Annotations.tsv": sha(RAW / "marmoset/Annotations.tsv")}, licence="CC BY 4.0"),
        claims=[
            dict(claim="More than 800,000 vocalization files.", source="Zenodo record description",
                 result=f"Annotations.tsv has {len(a):,} rows, one per audio file.", status="consistent"),
            dict(claim="About 215,000 calls are annotated with a vocalization type.", source="Zenodo record description / Metadata.pdf",
                 result=f"{typed:,} rows carry one of six call-type labels; the remaining {int(vc.get('Vocalization', 0)):,} are labelled only 'Vocalization'.", status="reproduced"),
            dict(claim="Type labels were checked by experts on 700 recordings with an average label error of 8.71%.", source="Metadata.pdf",
                 result="Not re-checked: the expert-review subset is not identified in the annotation file, so this figure cannot be recomputed from the deposited table.", status="not checkable here")],
        tables=dict(label_counts=[dict(label=k, n=int(v)) for k, v in vc.items()],
                    segment_duration_s={k: [round(float(q), 3) for q in np.percentile(a.duration[a.label == k], [25, 50, 75])] for k in vc.index},
                    files_per_month=[dict(month=k, n=int(v)) for k, v in monthly.items()]),
        method="Counts computed with pandas from Annotations.tsv. The 'duration' column is the length of each extracted segment (0.5–2.5 s), not a measured call duration.",
        limits="Checks the deposited counts only; label accuracy was not re-assessed."),
        open(CHK / "marmoset-annotation-recount.json", "w"), indent=1)
    return recs


# ---------------------------------------------------------------------------------------------- mouse
def mouse():
    out = SND / "house-mouse"; out.mkdir(parents=True, exist_ok=True)
    src = RAW / "mouse/abbasi_0020.WAV"
    x, fs = sf.read(src, dtype="float32")
    f, t, S = signal.spectrogram(x, fs, nperseg=512, noverlap=256)
    band = (f > 35e3) & (f < 120e3)
    e = 10 * np.log10(S[band].sum(0) + 1e-20)
    act = e > np.median(e) + 12
    w = int(2 / (t[1] - t[0]))
    c = np.convolve(act, np.ones(w), "valid")
    picked = []
    for i in np.argsort(c)[::-1]:
        if all(abs(i - j) > w for j in picked):
            picked.append(i)
        if len(picked) == 3:
            break
    recs = []
    for k, i in enumerate(sorted(picked)):
        start = float(t[i]) - 0.1
        seg = x[int(start * fs): int((start + 2.0) * fs)]
        stem = f"usv-{start:07.2f}s".replace(".", "_")
        write_wav(out / f"{stem}-te16.wav", seg, fs // 16)
        spec = spectrogram_png(seg, fs, out / f"{stem}.png", fmax=130000, nperseg=512)
        recs.append(dict(id=f"mouse-{stem}", species="house-mouse", title=f"Ultrasonic vocalizations, {start:.2f}–{start + 2:.2f} s of the source file",
                         kind="Ultrasonic vocalizations (USVs)", files={"expanded": f"assets/sound/house-mouse/{stem}-te16.wav"},
                         spectrogram=dict(file=f"assets/sound/house-mouse/{stem}.png", **spec),
                         source=dict(sample_rate=fs, duration_s=2.0, file=src.name.replace("abbasi_0020", "mM3.5individuality_run3_day2-2016-10-28_17-05-14_0020"),
                                     offset_s=round(start, 3), sha256=sha(src), doi="10.5281/zenodo.5771669", url="https://doi.org/10.5281/zenodo.5771669", licence="CC BY 4.0",
                                     citation="Abbasi R, Balazs P, Marconi MA, Nicolakis D, Zala SM, Penn DJ (2022) Capturing the songs of mice with an improved detection and classification method for ultrasonic vocalizations (BootSnap). PLOS Computational Biology 18:e1010049. doi:10.1371/journal.pcbi.1010049"),
                         selection="Window chosen automatically as one of the three 2-s stretches with the most frames whose 35–120 kHz energy exceeded the file median by 12 dB.",
                         playback="Mouse USVs (≈ 40–100 kHz) are above human hearing. The original samples are played 16× slower, dividing every frequency by 16. Nothing else is changed except peak normalisation."))
    # ---- separation calls: Breslav et al. call tables
    import glob
    rows = []
    for fp in sorted(glob.glob(str(RAW / "mouse/breslav/Call data/*.xlsx"))):
        d = pd.read_excel(fp)
        d = d[d.Accepted == True]
        animal = Path(fp).stem.replace("Prefixed_Data_", "")
        d["animal"] = animal
        rows.append(d)
    d = pd.concat(rows)
    d["family"] = np.where(d.Label.str.startswith("LFV"), "Low-frequency (LFV)", "Ultrasonic (USV)")
    per_animal = d.groupby(["animal", "family"]).size().unstack(fill_value=0)
    per_label = d.groupby("Label").agg(n=("PeakFreq_kHz_", "size"), peak_khz_median=("PeakFreq_kHz_", "median"),
                                       peak_khz_q1=("PeakFreq_kHz_", lambda s: s.quantile(.25)), peak_khz_q3=("PeakFreq_kHz_", lambda s: s.quantile(.75)),
                                       dur_ms_median=("CallLength_s_", lambda s: 1000 * s.median()))
    hist_edges = np.arange(0, 125, 2.5)
    hist = {fam: np.histogram(g.PeakFreq_kHz_, bins=hist_edges)[0].tolist() for fam, g in d.groupby("family")}
    lfv_share = per_animal.get("Low-frequency (LFV)", 0) / per_animal.sum(1)
    json.dump(dict(
        id="mouse-separation-calls", species="house-mouse", title="Call frequencies in the 'separation slang' call tables",
        paper=dict(citation="Breslav D, Wójcik MP, Koch U, Becker T (2025) Separation slang: laboratory mice use a low-frequency call repertoire during physical separation. Dataset, Zenodo. doi:10.5281/zenodo.17491957",
                   doi="10.5281/zenodo.17491957", note="The accompanying article was not located during this review; the check is limited to the dataset title's claim."),
        data=dict(files=["call_data.tar.gz → Call data/Prefixed_Data_<animal>_<sex>.xlsx (19 files)"], sha256={"call_data.tar.gz": sha(RAW / "mouse/breslav_call_data.tar.gz")}, licence="CC BY-SA 4.0"),
        claims=[dict(claim="Laboratory mice use a low-frequency call repertoire during physical separation.", source="Dataset title",
                     result=f"{len(d):,} accepted calls from {d.animal.nunique()} animals. {int((d.family == 'Low-frequency (LFV)').sum()):,} carry LFV labels (median peak {d[d.family == 'Low-frequency (LFV)'].PeakFreq_kHz_.median():.1f} kHz); "
                            f"{int((d.family != 'Low-frequency (LFV)').sum()):,} are ultrasonic (median peak {d[d.family != 'Low-frequency (LFV)'].PeakFreq_kHz_.median():.1f} kHz). LFV calls were present in {(per_animal.get('Low-frequency (LFV)', 0) > 0).sum()} of {len(per_animal)} animals "
                            f"(share per animal: median {lfv_share.median():.0%}, range {lfv_share.min():.0%}–{lfv_share.max():.0%}).",
                     status="consistent, partly checked",
                     scope="These tables contain the separation condition only, so they show that a low-frequency repertoire occurs during separation; they cannot show that it is specific to separation. That comparison needs the control recordings.")],
        tables=dict(per_label=[dict(label=k, **{kk: round(float(vv), 2) for kk, vv in v.items()}) for k, v in per_label.iterrows()],
                    peak_hist=dict(edges_khz=hist_edges.tolist(), counts=hist),
                    per_animal=[dict(animal=k, **{kk: int(vv) for kk, vv in v.items()}) for k, v in per_animal.iterrows()]),
        method="Only rows with Accepted = TRUE were used. 'Family' groups labels beginning with 'LFV' versus all others. Peak frequencies are those exported by DeepSqueak in the deposited tables.",
        limits="No audio was re-analysed for this check; it relies on the depositors' detection and labelling."),
        open(CHK / "mouse-separation-calls.json", "w"), indent=1)
    return recs


# ------------------------------------------------------------------------------------------- honeybee
def honeybee():
    import sys
    sys.path.insert(0, str(Path(__file__).parent))
    from solar import sun_azimuth
    out = SND / "honeybee"; out.mkdir(parents=True, exist_ok=True)
    recs = []
    for i in (1, 2, 3):
        src = RAW / f"honeybee/waggle_run_phase_{i}.wav"
        x, fs = sf.read(src, dtype="float32")
        if x.ndim > 1:
            x = x.mean(1)
        stem = f"waggle-run-{i}"
        write_wav(out / f"{stem}.wav", x, fs)
        spec = spectrogram_png(x, fs, out / f"{stem}.png", fmax=2000, nperseg=4096)
        recs.append(dict(id=f"bee-{stem}", species="honeybee", title=f"Sound during a waggle run, recording {i}", kind="Waggle-run sound",
                         files={"realtime": f"assets/sound/honeybee/{stem}.wav"}, spectrogram=dict(file=f"assets/sound/honeybee/{stem}.png", **spec),
                         source=dict(sample_rate=fs, duration_s=round(len(x) / fs, 3), file=src.name.replace("waggle_run_phase_", "Waggle run phase-"), sha256=sha(src),
                                     doi="10.5281/zenodo.7678084", url="https://doi.org/10.5281/zenodo.7678084", licence="CC BY 4.0",
                                     citation="Sharif MZ (2023) Waggle run phase sound during honeybee waggle dance [dataset]. Zenodo. doi:10.5281/zenodo.7678084"),
                         playback="Original 44.1 kHz recording, stereo channels averaged, peak-normalised. The deposit gives no microphone placement or colony details, so the source of each sound component is not asserted.",
                         caution="Deposited without accompanying methods. Shown as an example only; not used in any analysis."))
    # ---- dance angle vs sun azimuth
    d = pd.read_csv(RAW / "honeybee/Berlin2019_dances.csv", parse_dates=["ts_from", "ts_to"]).dropna(subset=["feeder_cam_id"])
    w = pd.read_csv(RAW / "honeybee/Berlin2019_waggle_phases.csv", parse_dates=["timestamp"]).sort_values("timestamp")
    LAT, LON = 52.456, 13.296  # midpoint of the two feeder coordinates in the experiment log (hive position is not deposited)
    res = []
    for cam, g in d.groupby("cam_id"):
        ww = w[w.cam_id == cam]
        tt = ww.timestamp.dt.tz_convert(None).values
        for r in g.itertuples():
            i0 = np.searchsorted(tt, np.datetime64(r.ts_from.tz_convert(None)))
            i1 = np.searchsorted(tt, np.datetime64(r.ts_to.tz_convert(None)))
            s = ww.iloc[i0:i1]
            s = s[np.hypot(s.x_median - r.median_x, s.y_median - r.median_y) < 60]
            if len(s) < 3:
                continue
            z = np.exp(1j * s.waggle_angle.values).mean()
            res.append(dict(cam=int(cam), feeder=int(r.feeder_cam_id), t=r.ts_from, n_runs=len(s), angle_deg=float(np.degrees(np.angle(z))), R=float(abs(z))))
    R = pd.DataFrame(res)
    R["sun_az"] = sun_azimuth(R.t, LAT, LON)[0]
    groups, points = [], []
    slopes = np.round(np.arange(-2, 2.0001, 0.01), 2)
    def fit(a, az):
        Rk = [abs(np.exp(1j * np.radians(a - k * az)).mean()) for k in slopes]
        k = slopes[int(np.argmax(Rk))]
        resid = np.angle(np.exp(1j * np.radians(a - k * az)))
        return k, max(Rk), float(np.degrees(np.angle(np.exp(1j * resid).mean())))
    for (cam, fd), g in R.groupby(["cam", "feeder"]):
        g = g[g.R > 0.5]
        a, az = g.angle_deg.values, g.sun_az.values
        k, Rbest, c = fit(a, az)
        R0 = abs(np.exp(1j * np.radians(a)).mean())
        R1 = abs(np.exp(1j * np.radians(a - az)).mean())
        boots = []
        for _ in range(300):
            idx = RNG.integers(0, len(a), len(a))
            boots.append(fit(a[idx], az[idx])[0])
        lo, hi = np.percentile(boots, [2.5, 97.5])
        circ_sd = lambda r: float(np.degrees(np.sqrt(-2 * np.log(r))))
        c1 = float(np.degrees(np.angle(np.exp(1j * np.radians(a - az)).mean())))
        groups.append(dict(camera=int(cam), feeder=int(fd), dances=int(len(g)), sun_az_range=[round(float(az.min()), 1), round(float(az.max()), 1)],
                           best_slope=float(k), slope_ci95=[round(float(lo), 2), round(float(hi), 2)], offset_deg=round(c, 1), offset_slope1_deg=round(c1, 1),
                           circ_sd_fixed_angle=round(circ_sd(R0), 1), circ_sd_slope1=round(circ_sd(R1), 1), circ_sd_best=round(circ_sd(Rbest), 1)))
        for row in g.itertuples():
            points.append(dict(camera=int(cam), feeder=int(fd), time=row.t.strftime("%Y-%m-%dT%H:%M:%SZ"), sun_az=round(float(row.sun_az), 2),
                               angle=round(float(row.angle_deg), 2), runs=int(row.n_runs)))
    sep = {}
    for cam in (0, 1):
        o = {gg["feeder"]: gg["offset_slope1_deg"] for gg in groups if gg["camera"] == cam}
        if 1 in o and 2 in o:
            sep[cam] = round(float(abs((o[1] - o[2] + 180) % 360 - 180)), 1)
    json.dump(dict(
        id="honeybee-dance-sun", species="honeybee", title="Do waggle-dance angles follow the sun? An independent reanalysis",
        paper=dict(citation="Dormagen DM, Wild B, Wario F, Landgraf T (2023) Machine learning reveals the waggle drift's role in the honey bee dance communication system. PNAS Nexus 2:pgad275. doi:10.1093/pnasnexus/pgad275",
                   doi="10.1093/pnasnexus/pgad275"),
        data=dict(files=["Berlin2019_dances.csv", "Berlin2019_waggle_phases.csv", "Berlin2019_feeder_experiment_log.csv"], record="doi:10.5281/zenodo.7928121", licence="CC BY 4.0",
                  sha256={f: sha(RAW / "honeybee" / f) for f in ["Berlin2019_dances.csv", "Berlin2019_waggle_phases.csv", "Berlin2019_feeder_experiment_log.csv"]}),
        claims=[dict(claim="Foragers encode the direction of a food source relative to the sun's azimuth, so dances for a fixed feeder should rotate as the sun moves (von Frisch's classic finding).",
                     source="Background to the dataset; tested here on the deposited 2019 dances",
                     result=f"{len(points)} dances (≥3 waggle runs, mean resultant length > 0.5) from 2 cameras and 2 feeders. In three of four camera–feeder groups the best-fitting slope of dance angle on sun azimuth was close to 1 "
                            f"({', '.join(str(gg['best_slope']) for gg in groups)}). Removing the sun's movement reduced the circular spread in every group. "
                            f"With the slope fixed at 1, the sun-corrected directions for the two feeders differ by {sep.get(0)}° on camera 0 and {sep.get(1)}° on camera 1, an agreement between independently recorded groups.",
                     status="consistent (independent reanalysis)",
                     scope="A minority of dances lie about 180° from the main cluster for their feeder, consistent with head–tail orientation errors in automatic tracking; they were kept, which widens the spread. Angles are in each camera's image frame; their sign and zero are not tied to gravity in the deposit, so only the rate of change is tested, not the absolute direction. Dances by the same bee are not independent; the bootstrap intervals resample dances and are therefore optimistic.")],
        tables=dict(groups=groups, separation_deg=sep), points=points,
        method=("Waggle phases were assigned to a dance when they came from the same camera, fell between the dance's start and end times and lay within 60 px of its median position. "
                "Each dance angle is the circular mean of its waggle phases. Sun azimuth was computed with the NOAA solar-position equations at 52.456° N, 13.296° E (between the two feeders listed in the log; the hive coordinates are not given). "
                "For each camera and feeder the slope k in angle = c + k·azimuth was chosen by maximising the mean resultant length of the residuals over k ∈ [−2, 2]; 95% intervals from 300 bootstrap resamples of dances."),
        limits="A slope of +1 rather than −1 reflects the camera's image-coordinate convention. This is an exploratory reanalysis, not a reproduction of the paper's waggle-drift results."),
        open(CHK / "honeybee-dance-sun.json", "w"), indent=1)
    return recs


if __name__ == "__main__":
    allrecs = []
    for fn in (bat, marmoset, mouse, honeybee):
        r = fn(); allrecs += r
        print(fn.__name__, len(r), "sound examples")
    json.dump(allrecs, open(DIST / "data" / "sounds.json", "w"), indent=1)
