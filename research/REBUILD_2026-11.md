# Multi-species rebuild, 12 November 2026

This release rebuilds the site around six species with openly licensed data for both communication and the brain, adds a per-species atlas viewer, and introduces a Research review in which published statements are checked against deposited data.

## Species and sources

| Species | Sound | Brain | Licence of new material |
|---|---|---|---|
| Zebra finch | 887 ML4BL syllables (unchanged) | Poirier 2008 MRI atlas (unchanged values, repackaged) | as before |
| Sperm whale | 5 supplementary recordings (unchanged) | **None.** No openly licensed *Physeter* brain imaging located | as before |
| Egyptian fruit bat | 13 examples, Prat et al. 2017 figshare collection | OpenNeuro ds005431 sub-07: T2 MRI + DWI (FA computed here) | CC0 |
| Common marmoset | 14 examples, MarmAudio (Zenodo 15017207) | Brain/MINDS BMA 2017: MRI, Nissl, 558 regions | CC BY 4.0 |
| House mouse | 3 USV excerpts, BootSnap evaluation set (Zenodo 5771669) | Allen CCFv3 50 µm template + annotation, 19 meshes | CC BY 4.0; Allen Terms of Use |
| Western honeybee | 3 waggle-run sounds (Zenodo 7678084) | Honeybee Standard Brain, 22 InsectBrainDB meshes | CC BY 4.0; CC BY-NC 4.0 |

URLs, sizes and SHA-256 checksums of every downloaded original: `research/sources-2026-11.json`. Photographs: `media/photography-manifest-2026-11.json`.

Searches that found nothing usable are recorded so they are not repeated: no open Egyptian fruit bat atlas with labels (the Eilam-Altstadter stereotaxic atlas is a commercial book); no open sperm whale brain imaging (dwarf sperm whale and killer whale MRI papers exist without open image data). The Brain/MINDS data-portal download links returned an HTML page; the identical files were taken from the Brain/MINDS dataset repository (`datasets.brainminds.jp/brainminds/BMA-2017`).

## Claim checks (Research review)

All computed by `scripts/build_collections.py` from the deposited files.

- **Bat annotations, Prat et al. 2017.** All 13 published context counts match `Annotations.csv` exactly (91,080 annotations, 87,986 distinct files; FileInfo lists 293,238 files). Table 2 “#Rec. Emitted” equals annotation rows, not unique files (differences 0–80 per bat). Rated *Reproduced*, with a wording note.
- **MarmAudio, Lamothe et al. 2025.** 871,045 rows; 215,223 typed labels, matching “about 215,000”. The 8.71% expert error rate cannot be recomputed from the deposit. *Reproduced* (partially checkable).
- **Mouse separation calls, Breslav et al. dataset.** 3,147 accepted calls from 19 animals; LFV calls in all 19 (median 31% per animal). No control condition is deposited, so specificity to separation is untestable. *Partly checked.*
- **Honeybee dance angle vs. sun, Dormagen et al. 2023 data.** 793 dances; best-fit slopes 1.07, 0.53, 0.92 and 1.11 against NOAA sun azimuth; sun-corrected feeder directions differ by 133.9° and 137.9° on the two cameras. A minority of dances sit about 180° off, consistent with head–tail tracking flips. *Consistent* (independent reanalysis). The camera-0/feeder-2 slope interval (0.31–0.73) excludes 1 and is reported as such.

## Citation verification

All 22 DOIs in `website/dist/js/content.js` were resolved against Crossref for authors, volume and pages, and checked with scite for retractions, notices and contrasting citations (none retracted). Two papers have a flagged contrasting citation: Takahashi et al. 2013 (later preprint reports rare overlapping calls; stated on the marmoset page) and Holy & Guo 2005 (syllable-category proportions differ between studies; does not affect the claim used). A proposed statement that mice emit audible squeaks in distress contexts returned mixed supporting and contrasting evidence and was left out.

## Interface

Buildless static site; `index.html` + `css/site.css` + `js/{app,content,charts,atlas}.js`. The previous ten-site reference review (`DESIGN_REVIEW.md`) still governs the visual direction; this release also took cues from the Allen Brain Atlas viewer (linked orthogonal sections with a crosshair and region tree), InsectBrainDB (surface checklist) and the Brain/MINDS portal (provenance next to the data). No generated imagery, gradients or marketing-style sections.

Accessibility: display settings (text size, theme, high contrast, reduced motion, plain-language summaries), keyboard-operable atlas sections and sound list, data tables under every chart, text alternatives for spectrograms, visible focus, no horizontal overflow at 375 px.

Preserved routes: `#home`, `#species`, `#zebra-finch`, `#sperm-whale`, `#recordings`, `#atlas`, `#films`, `#studies`, `#methods`, `#paper-hamaguchi`, `#paper-sperm-whale`, `#perception-model` and the methods sub-anchors.

## Browser checks performed

Desktop and 375 × 812: every page and legacy route loaded with no console errors and document width ≤ viewport. Bat social call (48 kHz copy) and mouse USV (16× expanded) played with no media error; playback cursor tracked. Mouse PAG selection highlighted the region in all three planes and in 3D (4.289 mm³ at 50 µm). Marmoset, bat (sections + diffusion), honeybee (3D) and finch atlases rendered. All eight videos reached readyState 4. Site search returned regions, sounds and reviews.
