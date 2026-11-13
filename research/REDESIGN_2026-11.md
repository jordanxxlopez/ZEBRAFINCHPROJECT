# Redesign from scratch, 12 November 2026

Design brief and the 13-site review behind it: `research/WEBSITE_ANALYSIS.md`.

## Structure

- **Home**: dark hero with a playable real song, six animal covers each framed as a question, a Brain-lab row of live models, research stories.
- **Animals → chapters**: every animal follows *sound → ear → pathway → neurons → behaviour*. The zebra finch chapter is complete (6 sections, each with a live instrument); the other five use the same template with the data available for them.
- **Listen**: the full sound library (925 recordings) and research video.
- **Brain lab**: the five atlases in a dark lab theme.
- **Research**: claim checks, model reports, paper guides, literature, data & methods.
- Old hash routes (`#zebra-finch`, `#recordings`, `#atlas`, `#studies`, `#methods`, `#films`, `#paper-hamaguchi`, `#paper-sperm-whale`, `#perception-model`, `#species/…`, `#review/…`, `#sounds/…`) redirect to their new homes.

Files: `index.html`, `css/app.css`, `js/main.js` (router + pages), `js/chapters.js` (chapter text), `js/models.js` (instruments), `js/dsp.js` (FFT, gammatone, colour maps), plus the existing `content.js`, `charts.js`, `atlas.js`.

## New models built from open data (`scripts/build_finch_models.py`)

| Model | Data | Result |
|---|---|---|
| Ear (gammatone filterbank, browser) | Any recording on the site | Computed live; bandwidths from Glasberg & Moore (1990), human; stated as an approximation |
| STRFs of auditory-forebrain neurons | Le, Bjoring & Meliza, figshare 29203457, CC BY 4.0 (794 units in nat8a sets; 531 with ≥ 1 spike/s modelled) | Held-out-song median r: Field L 0.33, CM 0.26, NCM 0.24; best units 0.6–0.79 against reliability ≈ 0.9 |
| Restoration check | Same dataset, gap windows | r(GN,CN) > r(GN,N) in 100% of windows for FL, CM, NCM; rated *partly checked* because shared song context is not controlled here |
| RA during singing | FALCON B1, DANDI 001046, CC BY 4.0 | Population activity repeats across two motifs (r = 0.49 at 20 ms) vs. 95th percentile of 1,000 circular shifts 0.33 |
| Neuron morphologies | NeuroMorpho.org: 40 HVC (Benezra et al. 2018), 21 CM (Chen & Meliza 2018), 12 mouse IC (Roberts archive) | Rendered as 3D line models |

Honest corrections made along the way: an RA consistency figure of r = 0.06 at 5 ms resolution was not presented as "precise firing"; the analysis was redone at 20 ms with a shuffle control. The paper behind the auditory dataset has three authors (Le, Bjoring, Meliza); an early draft listed two. A DOI for the FALCON dandiset was not verified and was removed (URL kept).

## Facts verified for the finch chapter (scite + Crossref)

Hearing range 0.2–7 kHz (Woolley & Portfors 2013); MLd → Ov → Field L → NCM pathway (Parishar et al. 2021; Mello et al. 1992); sensitive period ≈ 25–90 days (Gobes et al. 2019); HVC→RA single bursts (Fee et al. 2004); RA bursts per motif (Yip et al. 2012); STRFs in songbird forebrain (Kozlov & Gentner 2016). No retractions found.

## Checked in the browser

Desktop and 375 px: every page and legacy route loads with no console errors and no horizontal overflow. Zebra finch chapter: all six instruments mount (including after deep links), song and ear audio play, the pathway highlights Field L on the MRI atlas, the STRF view shows real rasters with predicted vs. measured rates, the RA heatmap renders, neurons rotate.

## Five more 3D atlases in the Brain lab (12 Nov 2026)

Built by `scripts/build_brainglobe_atlases.py`. All have a template image, labelled regions and 3D surfaces.

| Species | Source | Display grid | Regions | Notes |
|---|---|---|---|---|
| Eurasian blackcap | BrainGlobe `eurasian_blackcap_25um` v1.5; Sirmpilatze et al. 2026, Curr Biol | 0.05 mm | 44 | Song nuclei HVC, RA, Area X, lMAN, DLM, Ov |
| European starling | Zenodo 10.5281/zenodo.22107945 (CC BY 4.0); De Groof et al. 2016 | 0.085 mm (inferred) | 33 | Auditory (Field L, NCM, CMM, Ov, MLd) and song nuclei; header unit ambiguous, x0.1 applied, brain volume 1,585 mm³ supports it |
| Norway rat | BrainGlobe `whs_sd_rat_39um` v1.2; Waxholm Space v4, CC BY-SA 4.0 | 0.156 mm | 224 | Full auditory pathway from cochlear nuclei to auditory cortex |
| Prairie vole | BrainGlobe `prairie_vole_25um` v1.0; Gustison et al. 2024, eLife | 0.075 mm | 628 | Allen-style ontology |
| Domestic cat | BrainGlobe `csl_cat_500um` v1.0; CATLAS, Stolzberg et al. 2017 | 0.5 mm (native) | 74 | 13 auditory cortical fields |

These are atlas-only entries (`LAB_EXTRA` in `js/main.js`); they have no chapter, photo or recordings yet. Also downloaded but not used: African mole-rat (`african_molerat_20um`). Searched and not found as open labelled 3D data: fruit bat, dolphin or whale, cricket.
