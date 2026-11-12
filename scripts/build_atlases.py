"""Build web atlas files for each species from the original downloaded volumes and meshes.

Inputs live in data/raw/<species>/ (see research/sources-2026-11.json for URLs, licences and checksums).
Outputs go to website/dist/data/atlas/<species>/:
  meta.json        dimensions, spacing, orientation, region table, provenance, processing notes
  image-*.u8.gz    8-bit display volumes (x fastest, then y, then z)
  labels.u16.gz    region-index volume (0 = no label), same grid as the image it accompanies
  meshes.json      surface meshes in millimetres (x, y, z flattened; triangle indices)

No values are invented. Intensity windows are percentiles of each source volume; label volumes are
resampled by nearest neighbour so every output label is an original source label. The bat
fractional-anisotropy map is computed here from the deposited diffusion images with an ordinary
least-squares tensor fit and is labelled as a derived product.
"""
import gzip, hashlib, json, re, sys
from pathlib import Path

import nibabel as nib
import nrrd
import numpy as np
from scipy import ndimage
from skimage import measure
import fast_simplification

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "website" / "dist" / "data" / "atlas"


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def to_u8(vol, lo_pct=0.5, hi_pct=99.7, mask=None):
    v = vol.astype(np.float32)
    ref = v[mask] if mask is not None else v[v > 0]
    lo, hi = np.percentile(ref, [lo_pct, hi_pct])
    out = np.clip((v - lo) / (hi - lo), 0, 1)
    return (out * 255).round().astype(np.uint8), [float(lo), float(hi)]


def write_gz(path, arr):
    # Fortran order => x varies fastest, matching the viewer's index x + nx*(y + ny*z)
    data = np.asfortranarray(arr).tobytes(order="F")
    with gzip.open(path, "wb", compresslevel=9) as f:
        f.write(data)
    return path.stat().st_size


def mesh_from_mask(mask, spacing, step=1, target_faces=None):
    if mask.sum() < 8:
        return None
    padded = np.pad(mask.astype(np.uint8), 1)
    verts, faces, _, _ = measure.marching_cubes(padded, 0.5, spacing=spacing, step_size=step)
    verts -= np.array(spacing)  # undo padding offset
    if target_faces and len(faces) > target_faces:
        verts, faces = fast_simplification.simplify(verts.astype(np.float32), faces.astype(np.int32),
                                                    target_reduction=1 - target_faces / len(faces))
    return verts, faces


def pack_mesh(entry, verts, faces):
    entry["vertices"] = np.round(np.asarray(verts, dtype=np.float64), 3).ravel().tolist()
    entry["faces"] = np.asarray(faces, dtype=np.int64).ravel().tolist()
    return entry


def read_obj(path):
    v, f = [], []
    for line in open(path):
        if line.startswith("v "):
            v.append([float(t) for t in line.split()[1:4]])
        elif line.startswith("f "):
            f.append([int(t.split("/")[0]) - 1 for t in line.split()[1:4]])
    return np.array(v), np.array(f)


# --------------------------------------------------------------------------------------------- mouse
def build_mouse():
    out = OUT / "house-mouse"; out.mkdir(parents=True, exist_ok=True)
    tpl, th = nrrd.read(RAW / "mouse/average_template_50.nrrd")       # axes: AP, DV, LR (PIR)
    ann, _ = nrrd.read(RAW / "mouse/annotation_50.nrrd")
    graph = json.load(open(RAW / "mouse/structure_graph_1.json"))["msg"][0]
    nodes = {}
    def walk(n, path):
        nodes[n["id"]] = dict(id=n["id"], acronym=n["acronym"], name=n["name"], color="#" + n["color_hex_triplet"],
                              parent=n.get("parent_structure_id"), path=path + [n["id"]])
        for c in n["children"]:
            walk(c, path + [n["id"]])
    walk(graph, [])
    # reorder to x=LR, y=AP (anterior->posterior as stored), z=DV so the viewer's axes are LR/AP/DV
    tpl = np.transpose(tpl, (2, 0, 1)); ann = np.transpose(ann, (2, 0, 1))
    img, window = to_u8(tpl, mask=ann > 0)
    ids = [int(i) for i in np.unique(ann) if i]
    index = {sid: k + 1 for k, sid in enumerate(ids)}
    lab = np.zeros(ann.shape, np.uint16)
    lut = np.zeros(int(ann.max()) + 1, np.uint16)
    for sid, k in index.items():
        lut[sid] = k
    lab = lut[ann]
    counts = np.bincount(lab.ravel(), minlength=len(ids) + 1)
    regions = []
    for sid, k in index.items():
        n = nodes.get(sid, dict(acronym=str(sid), name=f"Structure {sid}", color="#999999", path=[]))
        regions.append(dict(index=k, source_id=sid, acronym=n["acronym"], name=n["name"], color=n["color"],
                            path=[nodes[p]["acronym"] for p in n["path"] if p in nodes],
                            voxels=int(counts[k]), volume_mm3=round(int(counts[k]) * 0.05 ** 3, 4)))
    sizes = {"image-template.u8.gz": write_gz(out / "image-template.u8.gz", img),
             "labels.u16.gz": write_gz(out / "labels.u16.gz", lab)}
    meshes = []
    for obj in sorted((RAW / "mouse/meshes").glob("*.obj"), key=lambda p: int(p.stem)):
        sid = int(obj.stem); n = nodes[sid]
        v, f = read_obj(obj)  # micrometres, axes AP, DV, LR
        target = 24000 if sid == 997 else 6000
        if len(f) > target:
            v, f = fast_simplification.simplify(v.astype(np.float32), f.astype(np.int32), target_reduction=1 - target / len(f))
        v = np.asarray(v)[:, [2, 0, 1]] / 1000.0  # -> mm, x=LR, y=AP, z=DV (matches volume grid * 0.05)
        meshes.append(pack_mesh(dict(id=sid, acronym=n["acronym"], name=n["name"], color=n["color"],
                                     source=f"Allen CCF 2017 structure mesh {sid}.obj", source_sha256=sha256(obj)), v, f))
    json.dump(meshes, open(out / "meshes.json", "w"), separators=(",", ":"))
    meta = dict(
        species="house-mouse", title="Allen Mouse Brain Common Coordinate Framework v3 (2017 annotation)",
        dims=list(img.shape), spacing_mm=[0.05, 0.05, 0.05],
        axes={"x": "left → right (LR)", "y": "anterior → posterior (AP)", "z": "dorsal → ventral (DV)"},
        flip_display={"y": False, "z": False},
        images=[dict(file="image-template.u8.gz", name="Average template (STPT autofluorescence, 1,675 brains)",
                     window_source_units=window, kind="measured average")],
        labels=dict(file="labels.u16.gz", dtype="uint16", count=len(regions)), regions=regions,
        meshes="meshes.json", mesh_units="mm",
        provenance=dict(
            volumes="https://download.alleninstitute.org/informatics-archive/current-release/mouse_ccf/ (average_template_50.nrrd, annotation/ccf_2017/annotation_50.nrrd)",
            ontology="http://api.brain-map.org/api/v2/structure_graph_download/1.json",
            meshes="annotation/ccf_2017/structure_meshes/<id>.obj",
            citation="Wang Q, Ding S-L, Li Y, et al. (2020) The Allen Mouse Brain Common Coordinate Framework: A 3D Reference Atlas. Cell 181:936–953. doi:10.1016/j.cell.2020.04.007",
            licence="Allen Institute Terms of Use: non-commercial research and educational reuse with citation (alleninstitute.org/terms-of-use)",
            sha256={p: sha256(RAW / "mouse" / p) for p in ["average_template_50.nrrd", "annotation_50.nrrd", "structure_graph_1.json"]}),
        processing=["Axes reordered from PIR storage (AP, DV, LR) to LR, AP, DV; no resampling (native 50 µm release).",
                    f"Template mapped to 8 bits between the 0.5th and 99.7th percentiles of in-brain voxels ({window[0]:.0f}–{window[1]:.0f}).",
                    "Annotation IDs re-indexed to consecutive integers; the original structure ID is kept for every region.",
                    "Region volumes count 50 µm annotation voxels; finer structures are under-resolved at this grid.",
                    "Meshes are the Allen-provided OBJ surfaces, decimated by quadric simplification for web display."],
        sizes_bytes=sizes)
    json.dump(meta, open(out / "meta.json", "w"), indent=1)
    print("mouse", img.shape, len(regions), "regions", len(meshes), "meshes")


# ------------------------------------------------------------------------------------------ marmoset
def parse_clut(path):
    table = {}
    for line in open(path, encoding="utf-8"):
        if line.startswith("#") or not line.strip():
            continue
        parts = line.split()
        idx, name = int(parts[0]), "_".join(parts[1:-4])
        r, g, b = (int(t) for t in parts[-4:-1])
        m = re.search(r"\(([^()]*)\)$", name)
        acr = m.group(1) if m else ""
        clean = name.replace("_", " ")
        clean = re.sub(r"\s*\([^()]*\)$", "", clean).strip()
        hemi = clean[:2] if clean[:3] in ("RH:", "LH:") else ""
        clean = clean[3:].strip() if hemi else clean
        table[idx] = dict(name=clean, acronym=acr, hemisphere=hemi, color="#%02x%02x%02x" % (r, g, b))
    return table


def build_marmoset():
    out = OUT / "common-marmoset"; out.mkdir(parents=True, exist_ok=True)
    mri_img = nib.load(RAW / "marmoset/bma-1-mri.nii.gz")
    seg = np.asarray(nib.load(RAW / "marmoset/bma-1-region_seg.nii.gz").dataobj).astype(np.int32)
    mri = np.asarray(mri_img.dataobj).astype(np.float32)
    nissl = np.asarray(nib.load(RAW / "marmoset/bma-1-nissl.nii.gz").dataobj).astype(np.float32)
    src = np.array(mri_img.header.get_zooms()[:3], float)            # 0.04, 0.04, 0.112 mm (RAS)
    target = 0.12
    zoom = src / target
    mri_r = ndimage.zoom(mri, zoom, order=1)
    nissl_r = ndimage.zoom(nissl, zoom, order=1)
    seg_r = ndimage.zoom(seg, zoom, order=0)
    mask = seg_r > 0
    img1, w1 = to_u8(mri_r, mask=mask)
    img2, w2 = to_u8(nissl_r, mask=mask)
    clut = parse_clut(RAW / "marmoset/bma-1-clut.ctbl")
    ids = [int(i) for i in np.unique(seg_r) if i]
    index = {sid: k + 1 for k, sid in enumerate(ids)}
    lut = np.zeros(seg.max() + 1, np.uint16)
    for sid, k in index.items():
        lut[sid] = k
    lab = lut[seg_r]
    full_counts = dict(zip(*np.unique(seg, return_counts=True)))
    vox_full = float(np.prod(src))
    regions = []
    for sid, k in index.items():
        c = clut.get(sid, dict(name=f"Label {sid}", acronym="", hemisphere="", color="#999999"))
        regions.append(dict(index=k, source_id=sid, acronym=c["acronym"], name=c["name"], hemisphere=c["hemisphere"],
                            color=c["color"], voxels_source_grid=int(full_counts.get(sid, 0)),
                            volume_mm3=round(int(full_counts.get(sid, 0)) * vox_full, 4)))
    sizes = {"image-mri.u8.gz": write_gz(out / "image-mri.u8.gz", img1),
             "image-nissl.u8.gz": write_gz(out / "image-nissl.u8.gz", img2),
             "labels.u16.gz": write_gz(out / "labels.u16.gz", lab)}
    # meshes: whole-brain outline plus selected regions relevant to vocal communication, from the source-resolution labels
    want = ["Auditory core", "auditory", "Area 44", "Area 45", "Area 8", "periaqueductal", "inferior colliculus", "medial geniculate",
            "Amygdala", "anterior cingulate", "Area 6", "Area 4", "Area 32", "Area 24"]
    meshes = []
    whole = ndimage.zoom((seg > 0).astype(np.uint8), zoom, order=0) > 0
    v, f = mesh_from_mask(whole, (target,) * 3, step=2, target_faces=24000)
    meshes.append(pack_mesh(dict(id=0, acronym="brain", name="Labelled brain (union of all regions)", color="#bdbdb4"), v, f))
    chosen = []
    for r in regions:
        n = r["name"].lower()
        if any(w.lower() in n for w in want) and r["voxels_source_grid"] > 2000 and len(chosen) < 28:
            chosen.append(r)
    for r in chosen:
        v_f = mesh_from_mask(lab == r["index"], (target,) * 3, step=1, target_faces=5000)
        if v_f:
            meshes.append(pack_mesh(dict(id=r["source_id"], acronym=r["acronym"], name=f'{r["name"]} ({r["hemisphere"].rstrip(":")})',
                                         color=r["color"]), *v_f))
    json.dump(meshes, open(out / "meshes.json", "w"), separators=(",", ":"))
    meta = dict(
        species="common-marmoset", title="Brain/MINDS 3D Marmoset Reference Brain Atlas 2017 (BMA 2017 ex vivo)",
        dims=list(img1.shape), spacing_mm=[target] * 3,
        axes={"x": "left → right (RAS: +x right)", "y": "posterior → anterior", "z": "inferior → superior"},
        flip_display={"y": True, "z": True},
        images=[dict(file="image-mri.u8.gz", name="T2-weighted ex vivo MRI", window_source_units=w1, kind="measured"),
                dict(file="image-nissl.u8.gz", name="Nissl histology registered to the MRI", window_source_units=w2, kind="measured, registered by the atlas authors")],
        labels=dict(file="labels.u16.gz", dtype="uint16", count=len(regions)), regions=regions,
        meshes="meshes.json", mesh_units="mm",
        provenance=dict(
            dataset="https://doi.org/10.24475/bma.2799 (files from https://datasets.brainminds.jp/brainminds/BMA-2017)",
            citation="Woodward A, Hashikawa T, Maeda M, et al. (2018) The Brain/MINDS 3D digital marmoset brain atlas. Scientific Data 5:180009. doi:10.1038/sdata.2018.9",
            licence="CC BY 4.0",
            sha256={p: sha256(RAW / "marmoset" / p) for p in ["bma-1-mri.nii.gz", "bma-1-nissl.nii.gz", "bma-1-region_seg.nii.gz", "bma-1-clut.ctbl"]}),
        processing=[f"Source grid 678 × 1000 × 210 at 0.04 × 0.04 × 0.112 mm resampled to {target} mm isotropic for the browser (linear for images, nearest-neighbour for labels).",
                    "Region volumes are counted on the original source grid, not the resampled grid.",
                    "Display windows are the 0.5th–99.7th percentiles of labelled-brain voxels.",
                    "Meshes are marching-cubes surfaces of the resampled labels, decimated for display; they are not the atlas authors' surfaces."],
        sizes_bytes=sizes)
    json.dump(meta, open(out / "meta.json", "w"), indent=1)
    print("marmoset", img1.shape, len(regions), "regions", len(meshes), "meshes")


# ----------------------------------------------------------------------------------------------- bat
def tensor_fa(dwi, bvals, bvecs, mask):
    b0 = dwi[..., bvals < 50].mean(-1)
    dw = bvals >= 50
    g = bvecs[:, dw].T
    b = bvals[dw]
    B = np.column_stack([g[:, 0]**2, g[:, 1]**2, g[:, 2]**2, 2*g[:, 0]*g[:, 1], 2*g[:, 0]*g[:, 2], 2*g[:, 1]*g[:, 2]]) * b[:, None]
    S = dwi[..., dw][mask].astype(np.float64)
    S0 = b0[mask].astype(np.float64)
    y = -np.log(np.clip(S, 1, None) / np.clip(S0, 1, None)[:, None])
    D, *_ = np.linalg.lstsq(B, y.T, rcond=None)
    D = D.T
    T = np.zeros((len(D), 3, 3))
    T[:, 0, 0], T[:, 1, 1], T[:, 2, 2] = D[:, 0], D[:, 1], D[:, 2]
    T[:, 0, 1] = T[:, 1, 0] = D[:, 3]; T[:, 0, 2] = T[:, 2, 0] = D[:, 4]; T[:, 1, 2] = T[:, 2, 1] = D[:, 5]
    ev, evec = np.linalg.eigh(T)
    ev = np.clip(ev, 0, None)
    md = ev.mean(1)
    fa = np.sqrt(1.5 * ((ev - md[:, None])**2).sum(1) / np.clip((ev**2).sum(1), 1e-12, None))
    fa_vol = np.zeros(mask.shape, np.float32); fa_vol[mask] = fa
    md_vol = np.zeros(mask.shape, np.float32); md_vol[mask] = md
    v1 = np.zeros(mask.shape + (3,), np.float32); v1[mask] = np.abs(evec[:, :, 2])
    return fa_vol, md_vol, v1


def build_bat():
    out = OUT / "egyptian-fruit-bat"; out.mkdir(parents=True, exist_ok=True)
    t2i = nib.as_closest_canonical(nib.load(RAW / "bat/sub-07_run-01_T2w.nii.gz"))  # -> RAS
    t2 = np.asarray(t2i.dataobj).astype(np.float32)
    src = np.array(t2i.header.get_zooms()[:3], float)
    target = 0.15
    t2r = ndimage.zoom(t2, src / target, order=1)
    # foreground = sample signal above Fluorinert background (Otsu threshold), largest component
    from skimage.filters import threshold_otsu
    thr = threshold_otsu(t2r[t2r > 0])
    fg = ndimage.binary_opening(t2r > thr, iterations=1)
    lbl, n = ndimage.label(fg)
    if n:
        fg = lbl == (np.argmax(np.bincount(lbl.ravel())[1:]) + 1)
    fg = ndimage.binary_fill_holes(ndimage.binary_closing(fg, iterations=2))
    img, w = to_u8(t2r, mask=fg)
    sizes = {"image-t2.u8.gz": write_gz(out / "image-t2.u8.gz", img)}
    # diffusion
    dwi_img = nib.as_closest_canonical(nib.load(RAW / "bat/sub-07_dwi.nii"))
    dwi = np.asarray(dwi_img.dataobj).astype(np.float32)
    bvals = np.loadtxt(RAW / "bat/sub-07_dwi.bval")
    bvecs = np.loadtxt(RAW / "bat/sub-07_dwi.bvec")
    # gradient directions are given in image (voxel) axes; flip signs to match the canonical reorientation
    ornt = nib.orientations.io_orientation(nib.load(RAW / "bat/sub-07_dwi.nii").affine)
    bv = np.zeros_like(bvecs)
    for i, (ax, sign) in enumerate(ornt):
        bv[int(ax)] = bvecs[i] * sign
    b0 = dwi[..., bvals < 50].mean(-1)
    dmask = b0 > threshold_otsu(b0[b0 > 0])
    dmask = ndimage.binary_fill_holes(ndimage.binary_opening(dmask, iterations=1))
    fa, md, v1 = tensor_fa(dwi, bvals, bv, dmask)
    fa_u8 = (np.clip(fa, 0, 1) * 255).round().astype(np.uint8)
    rgb = (v1 * fa[..., None] * 255).clip(0, 255).astype(np.uint8)
    sizes["image-fa.u8.gz"] = write_gz(out / "image-fa.u8.gz", fa_u8)
    sizes["image-b0.u8.gz"] = write_gz(out / "image-b0.u8.gz", to_u8(b0, mask=dmask)[0])
    for c, name in enumerate("rgb"):
        sizes[f"image-dec-{name}.u8.gz"] = write_gz(out / f"image-dec-{name}.u8.gz", rgb[..., c])
    # No 3D surface: the scan is a fixed head, so a thresholded surface would show skull and eyes, not brain.
    fa_in = fa[dmask]
    meta = dict(
        species="egyptian-fruit-bat", title="Egyptian rousette (Rousettus aegyptiacus) ex vivo brain MRI, Animal Brain Collection sub-07",
        dims=list(img.shape), spacing_mm=[target] * 3,
        axes={"x": "left → right", "y": "posterior → anterior", "z": "inferior → superior"},
        flip_display={"y": True, "z": True},
        images=[dict(file="image-t2.u8.gz", name="T2-weighted RARE, fixed brain (run 1)", window_source_units=[float(w[0]), float(w[1])], kind="measured")],
        diffusion=dict(dims=list(fa.shape), spacing_mm=[float(z) for z in dwi_img.header.get_zooms()[:3]],
                       images=[dict(file="image-b0.u8.gz", name="Diffusion b = 0 image (mean of 5)", kind="measured"),
                               dict(file="image-fa.u8.gz", name="Fractional anisotropy (computed here)", kind="derived", scale="0–1 mapped to 0–255"),
                               dict(file="image-dec-{c}.u8.gz", name="Direction-encoded colour FA (computed here)", kind="derived", channels=["r", "g", "b"])],
                       fa_in_mask=dict(median=round(float(np.median(fa_in)), 3), p95=round(float(np.percentile(fa_in, 95)), 3), voxels=int(dmask.sum())),
                       note="Separate acquisition grid (0.25 mm). Not registered to the T2 volume, so the two are shown side by side, never overlaid."),
        labels=None, regions=[],
        meshes=None,
        provenance=dict(
            dataset="OpenNeuro ds005431 (Animal Brain Collection), sub-07ERousetteAdult, doi:10.18112/openneuro.ds005431.v1.3.0",
            citation="Tsurugizawa T, Komaki Y, Aota I, Suematsu M, Ohtaka-Maruyama C, Kumamoto T. (2025) A cross-species brain magnetic resonance imaging and histology database of vertebrates. Scientific Data 12:1206. doi:10.1038/s41597-025-05540-5",
            licence="CC0 (dataset_description.json)",
            sha256={p: sha256(RAW / "bat" / p) for p in ["sub-07_run-01_T2w.nii.gz", "sub-07_dwi.nii", "sub-07_dwi.bval", "sub-07_dwi.bvec"]}),
        processing=[f"T2 volume reoriented to RAS and resampled from 0.1 mm to {target} mm (linear) to keep the download small.",
                    "No anatomical labels exist for this specimen, so no regions are drawn. The scan is of a fixed head (skull, eyes and surrounding tissue are visible), so no 3D brain surface is offered.",
                    "Diffusion tensor fitted by ordinary least squares on log signal (b ≈ 2000 s/mm², 30 directions, 5 b0). FA and principal-direction colour are derived values.",
                    "Gradient vectors were assumed to be in voxel axes and re-signed for the reorientation; the colour map should be read qualitatively."],
        sizes_bytes=sizes)
    json.dump(meta, open(out / "meta.json", "w"), indent=1)
    print("bat", img.shape, "dwi", fa.shape, "median FA", meta["diffusion"]["fa_in_mask"])


# -------------------------------------------------------------------------------------------- honeybee
def build_honeybee():
    out = OUT / "honeybee"; out.mkdir(parents=True, exist_ok=True)
    man = json.load(open(RAW / "honeybee/meshes/manifest.json"))
    names = {"Me": "Medulla", "Lo": "Lobula", "AL": "Antennal lobe", "CB": "Central body", "MB_PED_LOB": "Mushroom body pedunculus and lobes",
             "medial_lip": "Medial calyx lip", "lateral_lip": "Lateral calyx lip", "medial_col": "Medial calyx collar", "medial_COL": "Medial calyx collar",
             "lateral_col": "Lateral calyx collar", "medial_BR": "Medial calyx basal ring", "lateral_BR": "Lateral calyx basal ring",
             "unspecified": "Remaining central neuropil (unspecified in source)"}
    meshes = []
    allv = []
    for k, m in enumerate(man["files"]):
        stem = m["file"].replace("honeybee_STD_", "").rsplit(".", 1)[0]
        side = "left" if "left" in stem.lower() else "right" if "right" in stem.lower() else ""
        key = next((n for n in sorted(names, key=len, reverse=True) if stem.startswith(n)), None)
        v, f = read_obj(RAW / "honeybee/meshes" / m["file"])
        if len(f) > 5000:
            v, f = fast_simplification.simplify(v.astype(np.float32), f.astype(np.int32), target_reduction=1 - 5000 / len(f))
            v = np.asarray(v)
        allv.append(v)
        meshes.append(dict(id=k + 1, acronym=stem, name=(names.get(key, stem) + (f" ({side})" if side else "")),
                           color=m["color"] or "#cccccc", source=m["file"], source_sha256=m["sha256"],
                           database_structure=m["structure"], _v=v, _f=f))
    allv = np.vstack(allv)
    center = (allv.min(0) + allv.max(0)) / 2
    span = (allv.max(0) - allv.min(0))
    # Source units are micrometres (standard brain ~2.3 mm wide); convert to mm about the centre
    scale = 1 / 1000 if span.max() > 100 else 1
    for m in meshes:
        v = (m.pop("_v") - center) * scale; f = m.pop("_f")
        pack_mesh(m, v, f)
    json.dump(meshes, open(out / "meshes.json", "w"), separators=(",", ":"))
    meta = dict(species="honeybee", title="Honeybee Standard Brain (InsectBrainDB reconstruction 3)", dims=None, images=[], labels=None, regions=[],
                meshes="meshes.json", mesh_units="source units / 1000 (database units presumed micrometres; not independently verified)",
                extent_source_units=[round(float(s), 2) for s in span],
                provenance=dict(dataset="https://insectbraindb.org (species: Apis mellifera; reconstruction 3, 22 viewer meshes)",
                                citation="Brandt R, Rohlfing T, Rybak J, et al. (2005) Three-dimensional average-shape atlas of the honeybee brain and its applications. J Comp Neurol 492:1–19. doi:10.1002/cne.20644",
                                licence="CC BY-NC 4.0 (InsectBrainDB terms of use)"),
                processing=["Meshes are the database's display OBJ files, centred, divided by 1000 and decimated to at most 5,000 triangles each for web display.",
                            "Region names are taken from the file names. The database tags the central-body file as 'Nodulus' and the pedunculus/lobe files as 'Medial lobe'; we report the file-name meaning and keep the tag."],
                notes="Surface atlas only: the standard brain is an average shape of 20 immunostained brains; no intensity volume is distributed here.")
    json.dump(meta, open(out / "meta.json", "w"), indent=1)
    print("honeybee", len(meshes), "meshes, span", span)


# ------------------------------------------------------------------------------------------ zebra finch
def build_finch():
    """Re-package the existing, already validated finch atlas into the shared format without changing values."""
    out = OUT / "zebra-finch"; out.mkdir(parents=True, exist_ok=True)
    src = ROOT / "docs" / "data"
    atlas = json.load(open(src / "atlas.json"))
    import shutil
    shutil.copy(src / "atlas-volume.bin.gz", out / "image-mri.u8.gz")
    labels = np.frombuffer(gzip.open(src / "atlas-labels.bin.gz").read(), np.uint8)
    with gzip.open(out / "labels.u16.gz", "wb", compresslevel=9) as f:
        f.write(labels.astype(np.uint16).tobytes())
    old = json.load(open(src / "atlas-meshes.json"))
    regions = [dict(index=r["id"], source_id=r["id"], acronym=r.get("acronym", r["name"]), name=r["name"], color=r["color"],
                    voxels=r.get("voxel_count"), volume_mm3=r.get("volume_mm3")) for r in atlas["regions"] if r["id"] != 0]
    meshes = [dict(id=m["id"], name=next((r["name"] for r in atlas["regions"] if r["id"] == m["id"]), str(m["id"])),
                   color=next((r["color"] for r in atlas["regions"] if r["id"] == m["id"]), "#cccccc"),
                   vertices=m["vertices"], faces=m["faces"]) for m in old]
    json.dump(meshes, open(out / "meshes.json", "w"), separators=(",", ":"))
    meta = dict(species="zebra-finch", title="Zebra finch 3D MRI atlas (Poirier et al. 2008)", dims=atlas["dimensions"],
                spacing_mm=[atlas["spacing_mm"]] * 3,
                axes={"x": "storage grid x", "y": "storage grid y", "z": "storage grid z"},
                flip_display={"y": True, "z": True}, storage_index="legacy",
                images=[dict(file="image-mri.u8.gz", name="MRI (ex vivo, 80 × 160 × 160 µm acquisition, 80 µm grid)", kind="measured")],
                labels=dict(file="labels.u16.gz", dtype="uint16", count=len(regions)), regions=regions, meshes="meshes.json", mesh_units="mm",
                provenance=dict(dataset=atlas["source"], citation="Poirier C, Vellema M, Verhoye M, et al. (2008) A three-dimensional MRI atlas of the zebra finch brain in stereotaxic coordinates. NeuroImage 41:1–6. doi:10.1016/j.neuroimage.2008.01.069",
                                licence="See research/acquisition-manifest.json"),
                processing=[atlas["coordinates"], atlas["label_mapping"], atlas["mesh_method"], atlas["cross_format_validation"]])
    json.dump(meta, open(out / "meta.json", "w"), indent=1)
    print("finch", atlas["dimensions"], len(regions), "regions")


if __name__ == "__main__":
    which = sys.argv[1:] or ["finch", "mouse", "marmoset", "bat", "honeybee"]
    for w in which:
        globals()["build_" + w]()
