# Animal Communication & Neuroscience

An independent research collection covering six species: zebra finch, sperm whale, Egyptian fruit bat, common marmoset, house mouse and western honeybee. It has real recordings, a brain atlas for every species where open data exist, and a Research review that checks published claims against deposited data. [November 2026 rebuild notes](research/REBUILD_2026-11.md) · [redesign and models](research/REDESIGN_2026-11.md) · [website analysis](research/WEBSITE_ANALYSIS.md). Zebra Finch Project was the first collection. [Design review and implemented changes](research/DESIGN_REVIEW.md).

A research foundation for a public zebra finch resource: measured anatomy, original recordings, evidence-linked connectivity, and reproducible computational work. No AI-generated images or invented biological data.

## Website

[Public GitHub Pages site](https://jordanxxlopez.github.io/animal-communication-neuroscience/) · [Research expansion and 50-paper discovery pool](research/site-design-and-expansion.md) · [Reproducible perceptual-choice model](analysis/perceptual-choice-regression.json)


[Open the public GitHub Pages website](https://jordanxxlopez.github.io/animal-communication-neuroscience/). [Expansion research and the 50-item discovery pool](research/site-design-and-expansion.md). [Reproducible perceptual-choice model](analysis/perceptual-choice-regression.json). Source and static assets are in `website/`. Includes MRI slices, measured 3D anatomy, 892 original WAVs across zebra finch and sperm whale collections, source-derived SciPy spectrograms, two original supplementary films and 32 research records. See [build and validation notes](website/README.md).

## First research collection

- [Research assessment and next experiments](research/ASSESSMENT.md)
- [32-source annotated catalog](research/catalog/CATALOG.md), [JSON](research/catalog/sources.json), and [SQLite database](research/catalog/catalog.sqlite)
- [Verified acquisition manifest](research/acquisition-manifest.json)
- [Resolved atlas scale and measurements](analysis/atlas-scale-resolution.json)
- [Original atlas header inspection](analysis/atlas-inspection.json)
- [887-recording audio inventory](analysis/audio-inventory.json)
- [Original research video credits and technical metadata](media/manifest.json)
- [Repository workflow audit](research/repository-audit/REPORT.md)
- [Data-quality and reproducibility register](research/QUALITY.md)

The website is a research interface, not a validated brain simulation. Source pages and selected methods/data statements were reviewed; the catalog states the depth of review for each resource. Full-paper replication remains future work.

## Download the original datasets

[Research collection v0.1](https://github.com/jordanxxlopez/animal-communication-neuroscience/releases/tag/research-v0.1) contains the original MRI atlas archive, the ML4BL audio/perception archive, neuronal physiology tables, and selected source documentation. Large archives are release assets rather than ordinary Git objects. The original providers remain the authoritative sources. See the manifest for source URLs, licenses and checksums.

The two original supplementary MP4s are in `media/original/`. They have not been altered. Video 1 from Hamaguchi et al. (2014), DOI [10.7554/eLife.01833](https://doi.org/10.7554/eLife.01833), shows intracellular recording during singing. Video 1 from Gill et al. (2015), DOI [10.7554/eLife.07770](https://doi.org/10.7554/eLife.07770), accompanies group call recordings. Both films loaded successfully in the browser; playback was exercised on the first. Both also passed full FFmpeg decoding.

## Reproduce the catalog and inspection

Download release data files into `data/raw/`, retaining filenames. Python uses the standard library; movie inspection also requires `ffprobe`.

```sh
python3 scripts/build_catalog.py
python3 scripts/inspect_downloads.py
```

The first command builds source records; the second verifies provider checksums, tests ZIP integrity, inventories every WAV, reads original atlas headers and adds a `recordings` table to SQLite. Neither command executes downloaded model code or pickle objects. Example database query:

```sql
SELECT archive_member, sample_rate, duration_seconds
FROM recordings ORDER BY duration_seconds DESC LIMIT 10;
```

Third-party datasets, articles and recordings retain their original licenses. This repository does not relicense them. Citation, creator and rights metadata accompany each acquired resource. Not every discovered resource has redistribution clearance; those resources remain links or local exploratory samples.
