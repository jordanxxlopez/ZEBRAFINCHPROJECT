# Zebra Finch Project website

Buildless static site in `dist/`; all runtime assets are local. No generated illustrations, stock biological substitutes, or fabricated connectivity. Three.js is vendored with its MIT license.

## Reproduce

From the repository root, acquire originals using `scripts/download_assets.py`, install `requirements-science.txt` in a virtual environment, then run:

```sh
python scripts/build_catalog.py
python scripts/inspect_downloads.py
python scripts/prepare_website_data.py
python scripts/validate_website_data.py
python -m http.server 8765 --directory website/dist
```

`ffprobe` is needed for source movie inspection. Scientific exports use NumPy and scikit-image. Source archives are immutable. Corrected Analyze headers are in `analysis/corrected-atlas/` and accompany the unchanged corresponding source `.img` files; they are not standalone volumes.

## Scale and interpretation

The paper specifies a 20.48 mm field of view and 256³ interpolated grid (80 μm voxels). Amira bounds independently give 20.4 / 255 = 0.08 mm. Analyze headers instead store approximately 0.8 with blank units. All three intensity/label volumes match exactly between formats after reversing Amira x/y storage axes. Only derivative headers are corrected. Native acquisition was 80 × 160 × 160 μm; isotropic interpolation does not improve measured resolution.

3D surfaces come from source masks using marching cubes, without smoothing. Volumes count original mask voxels. Coordinates are storage-grid millimetres; anatomical axis signs and a stereotaxic surgical origin are not established. This is an anatomical viewer, not tractography or a neural simulation.

## Validation performed

- Exact cross-format equality of all intensity, whole-brain and nuclei voxels before reconstruction.
- All 887 exported WAV hashes verified against the archive inventory; original MP4 copies compared byte-for-byte.
- Desktop MRI slices, region selection and HVC 3D display inspected; no browser console errors during these interactions.
- Audio search and playback tested with Grey644_1; source duration 0.165 s, browser readyState 4, no media error. Waveform drawn from decoded samples.
- Both videos loaded with valid durations and no media errors; first video playback exercised. Both source files passed complete FFmpeg decoding.
- Literature search for “connectome” returned the two matching records.
- Mobile 390 × 844 layout inspected; document width 390 px with no horizontal overflow. Navigation and atlas controls remain available.

Hosting starts owner-private. GitHub holds the website source and original-source manifests. Third-party materials retain their stated licenses and credits.
