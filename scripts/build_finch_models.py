"""Zebra finch auditory and song-system models from open data.

1. STRF models of auditory-forebrain neurons
   Data: Le, Bjoring & Meliza, figshare doi:10.6084/m9.figshare.29203457 (CC BY 4.0);
   paper: Le, Bjoring & Meliza (2025) Nat Commun doi:10.1038/s41467-025-63182-y.
   For every single unit in the nat8a stimulus sets, a linear spectro-temporal receptive field
   (ridge regression, 0-100 ms lags) is fitted to the trial-averaged firing rate and tested on a
   song left out of fitting (leave-one-song-out). Performance is reported against each unit's
   split-half reliability.
2. Restoration check (gap window): population response to song-with-noise-filled-gap (GN) compared
   with song-plus-noise (CN) and noise alone (N).
3. RA during singing: threshold crossings from FALCON B1 (DANDI 001046, CC BY 4.0) aligned to song.
4. Neuron morphologies from NeuroMorpho.org (SWC -> line segments).

Run from the repository root:  python -I scripts/build_finch_models.py
"""
import csv, glob, gzip, hashlib, json, os
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal
from PIL import Image
import matplotlib

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data/raw"
D = RAW / "finch-auditory/zebf-auditory-restoration-1"
OUT = ROOT / "website/dist/data/models/zebra-finch"
AOUT = ROOT / "website/dist/assets/models/zebra-finch"
OUT.mkdir(parents=True, exist_ok=True); AOUT.mkdir(parents=True, exist_ok=True)
DT = 0.005                     # 5 ms bins
NLAG = 20                      # 0-95 ms history
FMIN, FMAX, NF = 500, 8000, 24
CONDS = ["continuous", "continuousnoise1", "continuousnoise2", "gap1", "gap2", "gapnoise1", "gapnoise2", "noise1", "noise2"]
CMAP = matplotlib.colormaps["magma"]


def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()


# ------------------------------------------------------------------ stimuli
def logspec(x, sr):
    f, t, S = signal.spectrogram(x, sr, window="hann", nperseg=int(0.01 * sr), noverlap=int(0.01 * sr) - int(DT * sr), nfft=4096, mode="psd")
    edges = np.geomspace(FMIN, FMAX, NF + 1)
    B = np.stack([S[(f >= edges[i]) & (f < edges[i + 1])].mean(0) for i in range(NF)])
    return 10 * np.log10(B + 1e-12), edges, t


def load_stimuli():
    stims = {}
    for p in sorted((D / "nat8a-stimuli").glob("*.wav")):
        x, sr = sf.read(p)
        if x.ndim > 1: x = x[:, 0]
        S, edges, t = logspec(x, sr)
        stims[p.stem] = dict(S=S, n=S.shape[1], sr=sr, x=x, path=p)
    allS = np.concatenate([s["S"] for s in stims.values()], 1)
    mu, sd = allS.mean(1, keepdims=True), allS.std(1, keepdims=True)
    floor = np.percentile(allS, 5)
    for s in stims.values():
        s["Z"] = (np.maximum(s["S"], floor) - mu) / sd
    global NORM
    NORM = dict(mu=np.round(mu.ravel(), 4).tolist(), sd=np.round(sd.ravel(), 4).tolist(), floor_db=round(float(floor), 4))
    return stims, edges


def lagged(Z):
    n = Z.shape[1]
    X = np.zeros((n, NF * NLAG))
    for k in range(NLAG):
        X[k:, k * NF:(k + 1) * NF] = Z[:, :n - k].T
    return X


# ------------------------------------------------------------------ responses
def load_units():
    site_area = {r["site"]: r["area"] for r in csv.DictReader(open(D / "metadata/recordings.csv"))}
    units = []
    for d in ["nat8a-alpha-responses", "nat8a-beta-responses"]:
        for p in sorted((D / d).glob("*.pprox")):
            j = json.load(open(p))
            area = j.get("location")
            if not area:
                site = j.get("recording", "").rstrip("/").split("/")[-1]
                area = site_area.get(site, "N/A")
            area = {"N/A": "unassigned", "mixed": "unassigned", "NCM/L3": "NCM", "L2a/b": "FL", "CM/L1": "CM", "CMFL": "unassigned"}.get(area, area)
            trials = {}
            for t in j["pprox"]:
                if "condition" in t:
                    key = f'{t["stimulus"]}_{t["condition"]}'
                    ev = np.asarray(t["event"], float) / (1000.0 if t.get("units", "ms") == "ms" else 1.0)
                else:
                    key = t["stimulus"]["name"]
                    ev = np.asarray(t["events"], float)
                trials.setdefault(key, []).append(ev)
            units.append(dict(id=p.stem, set=d.split("-")[1], area=area, bird=j.get("bird"), sex=j.get("bird-sex"), trials=trials, file=f"{d}/{p.name}"))
    return units


def psth(trials, n, smooth=True):
    R = np.zeros((len(trials), n))
    for i, ev in enumerate(trials):
        idx = (ev / DT).astype(int); idx = idx[(idx >= 0) & (idx < n)]
        np.add.at(R[i], idx, 1)
    R /= DT
    if smooth:
        g = signal.windows.gaussian(7, 1.5); g /= g.sum()
        R = np.apply_along_axis(lambda r: np.convolve(r, g, "same"), 1, R)
    return R


def fit_ridge(X, y, lam):
    Xm, ym = X.mean(0), y.mean()
    Xc = X - Xm
    w = np.linalg.solve(Xc.T @ Xc + lam * np.eye(X.shape[1]), Xc.T @ (y - ym))
    return w, ym - Xm @ w


def corr(a, b):
    a = a - a.mean(); b = b - b.mean()
    d = np.sqrt((a * a).sum() * (b * b).sum())
    return float((a * b).sum() / d) if d > 0 else np.nan


def main():
    stims, edges = load_stimuli()
    songs = sorted({k.split("_")[0] for k in stims})
    Xs = {k: lagged(s["Z"]) for k, s in stims.items()}
    units = load_units()
    lams = [1e2, 1e3, 1e4, 1e5]
    results = []
    for u in units:
        keys = [k for k in u["trials"] if k in stims]
        if len(keys) < 60: continue
        Y = {k: psth(u["trials"][k], stims[k]["n"]).mean(0) for k in keys}
        rate = np.mean([y.mean() for y in Y.values()])
        if rate < 1.0: continue
        # split-half reliability on clean songs
        rel = []
        for sng in songs:
            tr = u["trials"].get(f"{sng}_continuous")
            if not tr or len(tr) < 4: continue
            P = psth(tr, stims[f"{sng}_continuous"]["n"])
            rel.append(corr(P[0::2].mean(0), P[1::2].mean(0)))
        rel = np.nanmean(rel)
        rel_sb = 2 * rel / (1 + rel) if rel > 0 else np.nan
        # leave-one-song-out
        best = None
        for lam in lams:
            rs, preds = [], {}
            for sng in songs:
                tr_keys = [k for k in keys if not k.startswith(sng + "_")]
                Xtr = np.vstack([Xs[k] for k in tr_keys]); ytr = np.concatenate([Y[k] for k in tr_keys])
                w, b = fit_ridge(Xtr, ytr, lam)
                k = f"{sng}_continuous"
                if k in Y:
                    p = np.maximum(Xs[k] @ w + b, 0); preds[sng] = p; rs.append(corr(p, Y[k]))
            r = np.nanmean(rs)
            if best is None or r > best[0]: best = (r, lam, preds, rs)
        r, lam, preds, rs = best
        w, b = fit_ridge(np.vstack([Xs[k] for k in keys]), np.concatenate([Y[k] for k in keys]), lam)
        results.append(dict(u=u, r=r, r_songs=rs, lam=lam, rel=rel, rel_sb=rel_sb, rate=rate, preds=preds, w=w, b=b, Y=Y))
    print(len(units), "units;", len(results), "fitted")

    # ---------------- summary per area
    areas = {}
    for x in results:
        areas.setdefault(x["u"]["area"], []).append(x)
    summary = {a: dict(n=len(v), r_median=round(float(np.nanmedian([x["r"] for x in v])), 3),
                       r_q=[round(float(q), 3) for q in np.nanpercentile([x["r"] for x in v], [25, 75])],
                       rel_median=round(float(np.nanmedian([x["rel_sb"] for x in v])), 3),
                       hist=np.histogram([x["r"] for x in v if np.isfinite(x["r"])], bins=np.linspace(-0.2, 1, 25))[0].tolist())
               for a, v in areas.items()}
    hist_edges = np.linspace(-0.2, 1, 25).round(3).tolist()

    # ---------------- example units: best 4 in each labelled area with good reliability
    ex = []
    for a in ["FL", "CM", "NCM"]:
        v = sorted([x for x in areas.get(a, []) if np.isfinite(x["r"]) and x["rel_sb"] > 0.5], key=lambda x: -x["r"])[:4]
        ex += v
    song_files = {}
    for sng in songs:
        s = stims[f"{sng}_continuous"]
        sf.write(AOUT / f"{sng}.wav", s["x"] / np.abs(s["x"]).max() * 0.89, s["sr"], subtype="PCM_16")
        Z = (s["S"] - s["S"].max() + 70) / 70
        Image.fromarray((CMAP(np.clip(Z, 0, 1)[::-1])[..., :3] * 255).astype(np.uint8)).resize((s["n"] * 4, 160), Image.BILINEAR).save(AOUT / f"{sng}.png")
        song_files[sng] = dict(audio=f"assets/models/zebra-finch/{sng}.wav", spec=f"assets/models/zebra-finch/{sng}.png", dur=round(len(s["x"]) / s["sr"], 4), bins=s["n"], source_sha256=sha(s["path"]))
    examples = []
    for x in ex:
        u = x["u"]
        strf = x["w"].reshape(NLAG, NF).T  # freq x lag
        rasters = {sng: [np.round(ev[(ev >= -0.1) & (ev <= song_files[sng]["dur"] + 0.1)], 4).tolist() for ev in u["trials"].get(f"{sng}_continuous", [])] for sng in songs}
        examples.append(dict(id=u["id"], area=u["area"], bird=u["bird"], set=u["set"], r=round(x["r"], 3), r_songs=[round(v, 3) for v in x["r_songs"]],
                             reliability=round(float(x["rel_sb"]), 3), rate=round(float(x["rate"]), 2), ridge=x["lam"],
                             strf=np.round(strf, 4).tolist(), strf_bias=round(float(x["b"]), 3),
                             psth={sng: np.round(x["Y"][f"{sng}_continuous"], 2).tolist() for sng in songs if f"{sng}_continuous" in x["Y"]},
                             pred={sng: np.round(p, 2).tolist() for sng, p in x["preds"].items()},
                             rasters=rasters, source_file=u["file"]))

    # ---------------- restoration check in the gap window
    birds = {(r["bird"], r["gap"]): (float(r["gap_start"]) / 1000, float(r["gap_stop"]) / 1000) for r in csv.DictReader(open(D / "metadata/song-birds.csv"))}
    rest = {}
    for a, v in areas.items():
        sims = []
        for sng in songs:
            for g in ("1", "2"):
                if (sng, g) not in birds: continue
                t0, t1 = birds[(sng, g)]
                i0, i1 = int(t0 / DT), int((t1 + 0.05) / DT)
                def vec(cond, half=None):
                    rows = []
                    for x in v:
                        tr = x["u"]["trials"].get(f"{sng}_{cond}")
                        if not tr: return None
                        P = psth(tr if half is None else tr[half::2], stims[f"{sng}_{cond}"]["n"])
                        rows.append(P.mean(0)[i0:i1])
                    return np.concatenate(rows)
                GN, CN, N, C, G = vec("gapnoise" + g), vec("continuousnoise" + g), vec("noise" + g), vec("continuous"), vec("gap" + g)
                if any(z is None for z in (GN, CN, N, G)): continue
                CNa, CNb = vec("continuousnoise" + g, 0), vec("continuousnoise" + g, 1)
                sims.append(dict(song=sng, gap=g, gn_cn=corr(GN, CN), gn_n=corr(GN, N), gn_g=corr(GN, G), cn_split=corr(CNa, CNb)))
        if sims and len(v) >= 10:
            rest[a] = dict(units=len(v), windows=len(sims),
                           gn_cn=round(float(np.mean([s["gn_cn"] for s in sims])), 3),
                           gn_n=round(float(np.mean([s["gn_n"] for s in sims])), 3),
                           gn_g=round(float(np.mean([s["gn_g"] for s in sims])), 3),
                           cn_split=round(float(np.mean([s["cn_split"] for s in sims])), 3),
                           frac_gn_closer_to_cn=round(float(np.mean([s["gn_cn"] > s["gn_n"] for s in sims])), 3),
                           per_window=[{k: (round(vv, 3) if isinstance(vv, float) else vv) for k, vv in s.items()} for s in sims])

    model = dict(
        title="Spectro-temporal receptive-field models of zebra finch auditory-forebrain neurons",
        data=dict(record="doi:10.6084/m9.figshare.29203457", licence="CC BY 4.0", paper="Le B, Bjoring MC, Meliza CD (2025). The zebra finch auditory cortex reconstructs occluded syllables in conspecific song. Nature Communications 16:8452. doi:10.1038/s41467-025-63182-y",
                  archive_sha256=sha(RAW / "finch-auditory/zebf-auditory-restoration-1.zip")),
        method=dict(spectrogram=f"{NF} log-spaced bands {FMIN}-{FMAX} Hz, 10 ms Hann window, {int(DT*1000)} ms hop, dB, z-scored per band across all stimuli",
                    model=f"Linear STRF, lags 0-{(NLAG-1)*int(DT*1000)} ms, ridge regression on trial-averaged firing rate (5 ms bins, Gaussian smoothing sd 7.5 ms); output rectified at 0",
                    validation="Leave-one-song-out over 8 songs: fit on all 9 conditions of 7 songs, test on the clean version of the held-out song. Ridge penalty chosen from {1e2,1e3,1e4,1e5} by mean held-out correlation (slightly optimistic).",
                    reliability="Split-half correlation of trial-averaged responses to clean songs, Spearman-Brown corrected; the practical ceiling for any model."),
        freq_edges_hz=np.round(edges, 1).tolist(), dt=DT, nlag=NLAG, norm=NORM, spec_window_s=0.01, spec_nfft=4096,
        songs=song_files, examples=examples, summary=summary, hist_edges=hist_edges,
        units_total=len(units), units_fitted=len(results),
        restoration=rest)
    json.dump(model, open(OUT / "strf.json", "w"), separators=(",", ":"))
    print({a: (s["n"], s["r_median"], s["rel_median"]) for a, s in summary.items()})
    print("restoration", {a: {k: r[k] for k in ("units", "windows", "gn_cn", "gn_n", "gn_g", "cn_split", "frac_gn_closer_to_cn")} for a, r in rest.items()})


# ------------------------------------------------------------------ RA during song
def ra():
    import h5py
    p = RAW / "finch-ra/minival_ses-20210626.nwb"
    f = h5py.File(p, "r")
    tx = f["acquisition/tx/data"][:]; tt = f["acquisition/tx/timestamps"][:]
    voc = f["acquisition/vocalizations/data"][:].astype(float); vt = f["acquisition/vocalizations/timestamps"][:]
    sr = int(round(1 / np.diff(vt[:2])[0]))
    starts, stops = f["intervals/trials/start_time"][:], f["intervals/trials/stop_time"][:]
    voc = voc - voc.mean(); voc /= np.abs(voc).max()
    sf.write(AOUT / "ra-song.wav", voc * 0.89, sr, subtype="PCM_16")
    fs, ts, S = signal.spectrogram(voc, sr, nperseg=256, noverlap=256 - 64)
    keep = fs <= 10000
    L = 10 * np.log10(S[keep] + 1e-12); Z = np.clip((L - (L.max() - 70)) / 70, 0, 1)[::-1]
    Image.fromarray((CMAP(Z)[..., :3] * 255).astype(np.uint8)).resize((900, 160), Image.BILINEAR).save(AOUT / "ra-song.png")
    b = 0.005; nb = int(round((tt[-1] + 1 / 30000) / b))
    idx = (tt / b).astype(int)
    counts = np.zeros((nb, tx.shape[1])); np.add.at(counts, np.clip(idx, 0, nb - 1), tx)
    rate = counts / b
    order = np.argsort([np.argmax(np.convolve(rate[:, c], np.ones(4) / 4, "same")) for c in range(tx.shape[1])])
    spikes = [np.round(tt[tx[:, c] > 0], 4).tolist() for c in order]
    # motif-to-motif consistency at 20 ms resolution, with a circular-shift control
    bc = 0.02; nbc = int(round(1.8 / bc)); cc = np.zeros((nbc, tx.shape[1])); np.add.at(cc, np.clip((tt / bc).astype(int), 0, nbc - 1), tx)
    n1 = int(round(0.9 / bc)); m1, m2 = cc[:n1], cc[n1:2 * n1]
    cons = [corr(m1[:, c], m2[:, c]) for c in range(tx.shape[1]) if m1[:, c].std() > 0 and m2[:, c].std() > 0]
    pop = corr(m1.sum(1), m2.sum(1))
    rng = np.random.default_rng(1)
    shuf = [corr(m1.sum(1), np.roll(m2.sum(1), int(rng.integers(5, n1 - 5)))) for _ in range(1000)]
    json.dump(dict(title="RA population activity during singing (Neuropixels threshold crossings)",
                   data=dict(record="DANDI 001046 (FALCON B1), sub-Finch-z-r12r13-21-held-in-minival_ses-20210626.nwb", licence="CC BY 4.0",
                             citation="Tostado-Marcos P, Arneodo EM, Gentner TQ, Gilja V (2024). FALCON Benchmark B1: zebra finch RA Neuropixels recordings during birdsong. DANDI Archive, dandiset 001046.",
                             sha256=sha(p)),
                   duration=round(float(vt[-1]), 4), sr=sr, motifs=[[float(a), float(z)] for a, z in zip(starts, stops)],
                   channels=int(tx.shape[1]), spikes=spikes, total_crossings=int(tx.sum()),
                   motif_consistency=dict(bin_s=0.02, channel_median_r=round(float(np.nanmedian(cons)), 3), channels=len(cons), population_r=round(float(pop), 3), shuffle_p95=round(float(np.percentile(shuf, 95)), 3), shuffle_n=1000),
                   audio="assets/models/zebra-finch/ra-song.wav", spec="assets/models/zebra-finch/ra-song.png",
                   note="Unsorted threshold crossings on 85 channels, ordered by time of peak activity. Two consecutive motifs of the same song."),
              open(OUT / "ra.json", "w"), separators=(",", ":"))
    print("RA", tx.shape, "crossings", int(tx.sum()), "pop r", pop, "shuffle95", np.percentile(shuf, 95))


# ------------------------------------------------------------------ morphologies
def morph():
    man = json.load(open(RAW / "neuromorpho/manifest.json"))
    nd = ROOT / "website/dist/data/models/neurons"; nd.mkdir(parents=True, exist_ok=True)
    index = []
    for m in man:
        rows = [l.split() for l in open(RAW / "neuromorpho" / f"{m['name']}.CNG.swc") if l.strip() and not l.startswith("#")]
        P = {int(r[0]): (int(r[1]), float(r[2]), float(r[3]), float(r[4]), int(r[6])) for r in rows}
        segs, types = [], []
        for i, (t, x, y, z, par) in P.items():
            if par in P:
                _, px, py, pz, _ = P[par]
                segs += [round(px), round(py), round(pz), round(x), round(y), round(z)]; types.append(t)
        sp = "zebra-finch" if m["species"] == "zebra finch" else "house-mouse"
        fn = f"{m['name']}.json"
        json.dump(dict(segments=segs, types=types, units="micrometres, rounded to 1"), open(nd / fn, "w"), separators=(",", ":"))
        index.append(dict(name=m["name"], file=f"data/models/neurons/{fn}", species=sp, archive=m["archive"], region=m["region"], cell_type=m["cell_type"],
                          doi=m["doi"], page=m["page"], length_um=m.get("length"), segments=len(types)))
    json.dump(dict(source="NeuroMorpho.org (CNG versions); cite the original reconstruction paper for each neuron and Ascoli et al. (2007) J Neurosci 27:9247",
                   licence="NeuroMorpho.org terms: free to use with citation of the original publication", neurons=index),
              open(ROOT / "website/dist/data/models/neurons.json", "w"), indent=0)
    print("neurons", len(index))


if __name__ == "__main__":
    import sys
    steps = sys.argv[1:] or ["main", "ra", "morph"]
    for st in steps: globals()[st]()
