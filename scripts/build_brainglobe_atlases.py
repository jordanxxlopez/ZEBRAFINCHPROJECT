"""Convert BrainGlobe-packaged atlases into the site's atlas format.

Input: data/raw/atlases/<name>_v<ver>.tar.gz from https://gin.g-node.org/brainglobe/atlases
       (each holds reference.tiff, annotation.tiff, structures.json, meshes/<id>.obj, metadata.json).
Output: website/dist/data/atlas/<species-id>/{meta.json, image-reference.u8.gz, labels.u16.gz, meshes.json}

Nothing is invented: the reference image is block-averaged, labels are subsampled by nearest neighbour
(every output label is an original label), region volumes are counted on the ORIGINAL grid, and the
surfaces are the atlas package's own meshes, decimated for the web.

Run: python -I scripts/build_brainglobe_atlases.py [species-id ...]
"""
import gzip, hashlib, json, sys, tarfile
from pathlib import Path

import numpy as np
import tifffile
import fast_simplification

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data/raw/atlases"
OUT = ROOT / "website/dist/data/atlas"

# species-id -> package, target voxel (mm), mesh keywords to prefer (auditory / vocal / social structures)
ATLASES = {
    "eurasian-blackcap": dict(pkg="eurasian_blackcap_25um_v1.5", target=0.05, title="Eurasian blackcap 3D brain atlas (25 µm)", licence="Open source; distributed through BrainGlobe (see the paper for terms)",
                              citation="Sirmpilatze N, Felder A, Abdulazhanova D, et al. (2026). An open-source three-dimensional digital brain atlas of a migratory bird, the Eurasian blackcap. Current Biology 36:2063–2077.e5. doi:10.1016/j.cub.2026.03.034",
                              prefer=["HVC", "RA", "Area X", "lMAN", "mMAN", "DLM", "OV", "CN-H", "CN-HP", "HP", "MC", "N", "M", "A", "H", "St", "OT", "Cb", "OB", "Ento"]),
    "norway-rat": dict(pkg="whs_sd_rat_39um_v1.2", target=0.156, title="Waxholm Space atlas of the Sprague Dawley rat brain (v4)", licence="CC BY-SA 4.0 (Waxholm Space atlas, NITRC)",
                       citation="Kleven H, Bjerke IE, Clascá F, Groenewegen HJ, Bjaalie JG, Leergaard TB (2023). Waxholm Space atlas of the rat brain: a 3D atlas supporting data analysis and integration. Nature Methods 20:1822–1829. doi:10.1038/s41592-023-02034-3",
                       prefer=["Cochlear nucleus, ventral part", "Cochlear nucleus, dorsal part", "Superior olivary complex", "Lateral lemniscus", "Inferior colliculus", "Medial geniculate complex of the dorsal thalamus", "Primary auditory area", "Secondary auditory area", "Periaqueductal gray", "Nucleus accumbens", "Amygdaloid area, unspecified", "Hippocampal formation", "Striatum", "Superior colliculus", "Cerebellum", "Olfactory bulb", "cochlear nerve"]),
    "prairie-vole": dict(pkg="prairie_vole_25um_v1.0", target=0.075, title="Prairie vole reference brain (25 µm, Allen-style annotation)", licence="Article is CC BY 4.0 (eLife); atlas distributed openly through BrainGlobe",
                         prefer=["Auditory areas", "Inferior colliculus", "Medial geniculate complex", "Cochlear nuclei", "Periaqueductal gray", "Nucleus accumbens", "Lateral septal nucleus", "Paraventricular hypothalamic nucleus", "Medial amygdalar nucleus", "Basolateral amygdalar nucleus", "Bed nuclei of the stria terminalis", "Medial preoptic area", "Ventral tegmental area", "Hippocampal formation", "Caudoputamen", "Main olfactory bulb", "Cerebellum", "Thalamus"]),
    "domestic-cat": dict(pkg="csl_cat_500um_v1.0", target=0.5, title="CATLAS: MRI template and cortical atlas of the domestic cat", licence="See CATLAS repository (github.com/CerebralSystemsLab/CATLAS)",
                         citation="Stolzberg D, Wong C, Butler BE, Lomber SG (2017). Catlas: an magnetic resonance imaging-based three-dimensional cortical atlas and tissue probability maps for the domestic cat (Felis catus). Journal of Comparative Neurology 525:3190–3206. doi:10.1002/cne.24271",
                         prefer=["A1", "A2", "AAF", "PAF", "VAF", "vPAF", "DZ", "DP", "iPE", "vPE", "IN", "FAES", "TE", "EPp", "17", "18", "4Gamma", "3b", "CGa", "PFdl", "Cbm"]),
    "mole-rat": dict(pkg="african_molerat_20um_v1.1", target=0.1, prefer=["auditory", "inferior colliculus", "geniculate", "cochlear", "hippocamp", "cerebell", "olfactory"]),
}


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for c in iter(lambda: f.read(1 << 20), b""):
            h.update(c)
    return h.hexdigest()


def read_obj(path):
    v, f = [], []
    for line in open(path):
        if line.startswith("v "):
            v.append([float(t) for t in line.split()[1:4]])
        elif line.startswith("f "):
            f.append([int(t.split("/")[0]) - 1 for t in line.split()[1:4]])
    return np.array(v, np.float32), np.array(f, np.int32)


def write_gz(path, arr):
    with gzip.open(path, "wb", compresslevel=9) as f:
        f.write(np.asfortranarray(arr).tobytes(order="F"))
    return path.stat().st_size


def build(sid):
    cfg = ATLASES[sid]
    tar = RAW / f"{cfg['pkg']}.tar.gz"
    ex = RAW / cfg["pkg"]
    if not ex.exists():
        with tarfile.open(tar) as t:
            t.extractall(RAW, filter="data")
    meta_in = json.load(open(ex / "metadata.json"))
    structs = json.load(open(ex / "structures.json"))
    res_um = [float(r) for r in meta_in["resolution"]]
    orient = meta_in["orientation"]            # e.g. "asr": axis0 anterior->posterior, axis1 superior->inferior, axis2 right->left
    ref = tifffile.imread(ex / "reference.tiff")
    ann = tifffile.imread(ex / "annotation.tiff")
    assert ref.shape == ann.shape, (ref.shape, ann.shape)

    # --- region volumes on the original grid
    ids, counts = np.unique(ann, return_counts=True)
    vox_mm3 = float(np.prod(res_um)) / 1e9
    full = dict(zip(ids.tolist(), counts.tolist()))
    by_id = {s["id"]: s for s in structs}

    # --- downsample: block-mean for reference, strided nearest for labels
    step = [max(1, int(round(cfg["target"] * 1000 / r))) for r in res_um]
    sh = [(n // s) * s for n, s in zip(ref.shape, step)]
    r = ref[:sh[0], :sh[1], :sh[2]].astype(np.float32)
    r = r.reshape(sh[0] // step[0], step[0], sh[1] // step[1], step[1], sh[2] // step[2], step[2]).mean((1, 3, 5))
    a = ann[step[0] // 2:sh[0]:step[0], step[1] // 2:sh[1]:step[1], step[2] // 2:sh[2]:step[2]]
    assert r.shape == a.shape, (r.shape, a.shape)
    spacing = [res_um[i] * step[i] / 1000 for i in range(3)]

    # --- reorder axes to x = left-right, y = anterior-posterior, z = dorsal-ventral
    letters = {"a": "ap", "p": "ap", "s": "dv", "i": "dv", "l": "lr", "r": "lr"}
    axes = [letters[c] for c in orient]
    perm = [axes.index("lr"), axes.index("ap"), axes.index("dv")]
    r = np.transpose(r, perm); a = np.transpose(a, perm)
    spacing = [spacing[p] for p in perm]
    first = [orient[p] for p in perm]          # which end comes first on each output axis
    ends = {"x": ["R", "L"] if first[0] == "r" else ["L", "R"], "y": ["A", "P"] if first[1] == "a" else ["P", "A"], "z": ["D", "V"] if first[2] == "s" else ["V", "D"]}

    brain = a > 0
    lo, hi = np.percentile(r[brain], [0.5, 99.7])
    img = (np.clip((r - lo) / (hi - lo), 0, 1) * 255).round().astype(np.uint8)

    present = [int(i) for i in np.unique(a) if i]
    index = {sid_: k + 1 for k, sid_ in enumerate(present)}
    lut = {0: 0, **index}
    lab = np.vectorize(lut.get, otypes=[np.uint16])(a)
    regions = []
    for sid_, k in index.items():
        s = by_id.get(sid_, dict(acronym=str(sid_), name=f"Structure {sid_}", rgb_triplet=[150, 150, 150], structure_id_path=[]))
        regions.append(dict(index=k, source_id=sid_, acronym=s["acronym"], name=s["name"], color="#%02x%02x%02x" % tuple(s["rgb_triplet"]),
                            path=[by_id[p]["acronym"] for p in s.get("structure_id_path", []) if p in by_id],
                            voxels_source_grid=int(full.get(sid_, 0)), volume_mm3=round(full.get(sid_, 0) * vox_mm3, 4)))

    out = OUT / sid; out.mkdir(parents=True, exist_ok=True)
    sizes = {"image-reference.u8.gz": write_gz(out / "image-reference.u8.gz", img), "labels.u16.gz": write_gz(out / "labels.u16.gz", lab)}

    # --- meshes: whole brain + preferred structures (package meshes, micrometres in the package's axis order)
    mesh_dir = ex / "meshes"
    root = next(s for s in structs if len(s["structure_id_path"]) == 1)
    have = {int(p.stem) for p in mesh_dir.glob("*.obj")}
    cand = [s for s in structs if s["id"] in have and s["id"] != root["id"]]
    def score(s):
        n, ac = s["name"].lower(), s["acronym"].lower()
        hit = next((i for i, w in enumerate(cfg["prefer"]) if w.lower() in (n, ac)), 999)   # exact name or acronym
        return (hit, -full.get(s["id"], 0))
    chosen = [s for s in sorted(cand, key=score) if score(s)[0] < 999][:24]
    if len(chosen) < 10:   # top up with the largest top-level structures
        rest = sorted([s for s in cand if s not in chosen and len(s["structure_id_path"]) <= 3], key=lambda s: -sum(full.get(d["id"], 0) for d in structs if s["id"] in d["structure_id_path"]))
        chosen += rest[:12 - len(chosen)]
    meshes = []
    for s, target in [(root, 30000)] + [(c, 5000) for c in chosen]:
        v, f = read_obj(mesh_dir / f"{s['id']}.obj")
        if len(f) > target:
            v, f = fast_simplification.simplify(v, f, target_reduction=1 - target / len(f)); v = np.asarray(v)
        v = v[:, perm] / 1000.0
        meshes.append(dict(id=0 if s is root else s["id"], acronym=s["acronym"], name="Whole brain" if s is root else s["name"],
                           color="#b9bec4" if s is root else "#%02x%02x%02x" % tuple(s["rgb_triplet"]),
                           vertices=np.round(v, 3).ravel().tolist(), faces=np.asarray(f).ravel().tolist()))
    json.dump(meshes, open(out / "meshes.json", "w"), separators=(",", ":"))

    names = {"x": "Sagittal", "y": "Coronal", "z": "Horizontal"}
    meta = dict(
        species=sid, title=cfg.get("title") or meta_in.get("name", cfg["pkg"]), dims=list(img.shape), spacing_mm=[round(x, 4) for x in spacing],
        view=dict(up="-z" if first[2] == "s" else "+z", names=names, ends=ends), flip_display={"y": False, "z": first[2] != "s"},
        images=[dict(file="image-reference.u8.gz", name="Reference image (atlas template)", window_source_units=[float(lo), float(hi)], kind="measured template")],
        labels=dict(file="labels.u16.gz", dtype="uint16", count=len(regions)), regions=regions, meshes="meshes.json", mesh_units="mm",
        mesh_note="Surfaces are the atlas package's own structure meshes, decimated for display.",
        provenance=dict(dataset=f"BrainGlobe atlas package {cfg['pkg']} (https://gin.g-node.org/brainglobe/atlases); original: {meta_in.get('atlas_link', '')}",
                        citation=cfg.get("citation") or meta_in.get("citation", ""), licence=cfg.get("licence", "See original atlas source"),
                        package_species=meta_in.get("species", ""), sha256={tar.name: sha(tar)}),
        processing=[f"Source grid {' × '.join(str(n) for n in ref.shape)} at {' × '.join(str(x) for x in res_um)} µm (orientation '{orient}').",
                    f"Reference image block-averaged by {step} and labels subsampled by nearest neighbour to {' × '.join(f'{x:.3f}' for x in spacing)} mm for the browser.",
                    "Region volumes are counted on the original grid. Structures smaller than the display grid may not appear in the sections.",
                    f"Display window: 0.5th–99.7th percentile of in-brain voxels. {len(meshes)} of {len(have)} packaged surfaces are shown, chosen for auditory, vocal and social relevance."],
        sizes_bytes=sizes)
    json.dump(meta, open(out / "meta.json", "w"), indent=1)
    print(sid, meta_in.get("species"), ref.shape, "->", img.shape, spacing, len(regions), "regions", len(meshes), "meshes", "| citation:", meta_in.get("citation", "")[:120])


if __name__ == "__main__":
    for s in sys.argv[1:] or [k for k in ATLASES if k != "mole-rat"]:
        if s in ATLASES:
            build(s)


# ------------------------------------------------------------------------------------------ starling
def build_starling():
    """European starling MRI atlas (De Groof et al. 2016), Zenodo 10.5281/zenodo.22107945, CC BY 4.0.
    Same layout as the zebra finch atlas: Analyze volumes plus label volumes with name lists."""
    import nibabel as nib
    from skimage import measure
    B = RAW / "starling/ATLAS_starling"
    out = OUT / "european-starling"; out.mkdir(parents=True, exist_ok=True)
    load = lambda p: np.asarray(nib.load(str(B / p)).dataobj)
    t2 = load("T2.hdr").astype(np.float32)
    nuc = load("delineations/Nuclei.hdr").astype(np.int32)
    reg = load("delineations/Brainregions.hdr").astype(np.int32)
    brain = load("delineations/Brain.hdr") > 0
    names = lambda f: {int(l.split()[0]): " ".join(l.split()[1:]).replace("_", " ") for l in open(B / "delineations" / f) if l.strip() and len(l.split()) > 1}
    nn, rn = names("Nuclei.txt"), names("Brainregions.txt")
    full = {"Field L": "Field L (primary auditory forebrain)", "NCM": "NCM, caudomedial nidopallium", "Ov": "Ov, nucleus ovoidalis (auditory thalamus)", "MLd": "MLd, auditory midbrain", "CMM": "CMM, caudomedial mesopallium",
            "TeO": "TeO, optic tectum", "Rt": "Rt, nucleus rotundus", "HVC": "HVC", "Area X": "Area X", "RA": "RA, robust nucleus of the arcopallium", "DLM": "DLM", "MAN": "MAN, magnocellular nucleus of the anterior nidopallium",
            "POM": "POM, medial preoptic nucleus", "TnA": "TnA, nucleus taeniae of the amygdala", "GCt": "GCt, midbrain central gray", "LS": "LS, lateral septum", "MS": "MS, medial septum",
            "PVN": "PVN, paraventricular nucleus", "VMH": "VMH, ventromedial hypothalamus", "VTA": "VTA, ventral tegmental area"}
    # physical scale: Analyze headers and Amira bounds both say 0.85 with no usable unit; x0.1 gives a 21.8 mm field of view
    SP = 0.085
    rng = np.random.default_rng(7)
    def colour(i, n, s=0.62, v=0.92):
        import colorsys
        r, g, b = colorsys.hsv_to_rgb((i * 0.618034) % 1, s, v); return "#%02x%02x%02x" % (int(r * 255), int(g * 255), int(b * 255))
    lab = np.zeros(t2.shape, np.uint16); regions = []; k = 0
    for src, table, kind in ((reg, rn, "region"), (nuc, nn, "nucleus")):   # nuclei written last so they sit on top of regions
        for i in sorted(table):
            m = src == i
            if not m.any(): continue
            k += 1; lab[m] = k
            nm = table[i]
            regions.append(dict(index=k, source_id=k, acronym=nm.split(",")[0] if kind == "nucleus" else "", name=full.get(nm, nm), kind=kind, color=colour(k, 40, 0.35 if kind == "region" else 0.75),
                                voxels=int(m.sum()), volume_mm3=round(float(m.sum()) * SP ** 3, 4)))
    lo, hi = np.percentile(t2[brain], [0.5, 99.7])
    img = (np.clip((t2 - lo) / (hi - lo), 0, 1) * 255).round().astype(np.uint8)
    sizes = {"image-t2.u8.gz": write_gz(out / "image-t2.u8.gz", img), "labels.u16.gz": write_gz(out / "labels.u16.gz", lab)}
    def mesh(mask, step, target):
        v, f, _, _ = measure.marching_cubes(np.pad(mask.astype(np.uint8), 1), 0.5, spacing=(SP,) * 3, step_size=step); v -= SP
        if len(f) > target:
            v, f = fast_simplification.simplify(v.astype(np.float32), f.astype(np.int32), target_reduction=1 - target / len(f))
        return np.asarray(v), np.asarray(f)
    meshes = []
    v, f = mesh(brain, 2, 30000)
    meshes.append(dict(id=0, acronym="brain", name="Whole brain", color="#b9bec4", vertices=np.round(v, 3).ravel().tolist(), faces=f.ravel().tolist()))
    for r in regions:
        if r["kind"] != "nucleus": continue
        v, f = mesh(lab == r["index"], 1, 5000)
        meshes.append(dict(id=r["index"], acronym=r["acronym"], name=r["name"], color=r["color"], vertices=np.round(v, 3).ravel().tolist(), faces=f.ravel().tolist()))
    json.dump(meshes, open(out / "meshes.json", "w"), separators=(",", ":"))
    zipf = RAW / "starling.zip"
    meta = dict(species="european-starling", title="3D MRI atlas of the European starling brain", dims=list(img.shape), spacing_mm=[SP] * 3,
                view=dict(up="+z", names={"x": "Grid X section", "y": "Grid Y section", "z": "Grid Z section"}, ends=None), flip_display={"y": True, "z": True},
                images=[dict(file="image-t2.u8.gz", name="T2-weighted MRI", window_source_units=[float(lo), float(hi)], kind="measured")],
                labels=dict(file="labels.u16.gz", dtype="uint16", count=len(regions)), regions=regions, meshes="meshes.json", mesh_units="mm",
                mesh_note="Marching-cubes surfaces of the atlas authors' label masks (nuclei at full resolution, whole brain at half), decimated for display.",
                provenance=dict(dataset="Zenodo doi:10.5281/zenodo.22107945 (Starling atlas.zip)", licence="CC BY 4.0",
                                citation="De Groof G, George I, Touj S, Stacho M, Jonckers E, Cousillas H, Hausberger M, Güntürkün O, Van der Linden A (2016). A three-dimensional digital atlas of the starling brain. Brain Structure and Function 221:1899–1909. doi:10.1007/s00429-015-1011-1",
                                sha256={zipf.name: sha(zipf)}),
                processing=["Volumes used: T2.img with delineations/Nuclei.img, Brainregions.img and Brain.img (all 256 x 256 x 256).",
                            "Scale: the Analyze headers and Amira bounding boxes give a spacing of 0.85 without a usable unit, which would make the brain over 20 cm wide. We read it as 0.085 mm (21.8 mm field of view), matching the factor-of-ten issue documented for the zebra finch atlas from the same laboratory. With that scale the whole-brain mask measures about 1,585 mm³, a plausible size for a starling brain. This is an inference and has not been confirmed against the paper's methods.",
                            "Nuclei and broad regions are combined in one label volume; where they overlap the nucleus is shown. The Tracts and Ventricle label volumes are not included.",
                            "Region colours are assigned by this site. Grid axes are the storage axes; anatomical directions are not asserted."],
                sizes_bytes=sizes)
    json.dump(meta, open(out / "meta.json", "w"), indent=1)
    print("starling", img.shape, len(regions), "regions", len(meshes), "meshes", "brain volume mm3", round(float(brain.sum()) * SP ** 3, 1))


if "european-starling" in sys.argv[1:] or (__name__ == "__main__" and len(sys.argv) == 1):
    build_starling()
