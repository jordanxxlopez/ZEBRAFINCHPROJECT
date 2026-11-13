# Project rules

- Keep the public identity **Animal Communication & Neuroscience — An independent research collection**. The Zebra Finch Project is its first species collection.
- Use real, attributable scientific assets. Do not use image generation. Do not invent or draw new scientific schematics or circuit diagrams. Use original published, appropriately licensed figures for the species being discussed; verify the figure, legend, methods and reuse terms.
- Computational plots and models must use legitimate source data and reproducible scientific software. Label measured observations, published figures and independent reanalyses accurately. Never generate missing measurements.
- Explain experiments in natural connected prose. Define exact scientific terminology in context. Evaluate controls, sample hierarchy, exclusions, uncertainty and the scope of the actual result. Do not imply misconduct from an anomaly or an unreproduced result.
- Preserve all original recordings, original timing, source identifiers and scientific provenance. Retain the resolved atlas spacing of 0.08 mm per distributed voxel and the distinction from the 80 × 160 × 160 μm acquisition. Do not assign surgical coordinates or cross-specimen registration without evidence.
- The canonical static source is `website/dist/`. GitHub Pages publishes the copy in `docs/`. Run `python3 scripts/sync_github_pages.py` after edits. Check actual browser behavior and mobile layout before publishing.
- Preserve existing hash routes. The interface uses self-hosted Source Sans 3 under the SIL OFL; avoid serif display typography. Favor specific labels and readable research content over generic marketing sections.

- Site structure (Nov 2026 redesign): Home · Animals (chapters: sound → ear → pathway → neurons → behaviour) · Listen · Brain lab · Research · About. Chapter text lives in `website/dist/js/chapters.js`; interactive models in `js/models.js`. Models must be fitted to or drawn from open data and labelled as models. Do not draw schematics; show anatomy only from real atlas data.
- Six species collections (zebra finch, sperm whale, Egyptian fruit bat, common marmoset, house mouse, western honeybee). Species text and references live in `website/dist/js/content.js`; every factual sentence must cite a DOI verified against Crossref and screened for retractions.
- Brain atlases is a species directory. Never show one species' anatomy as another's, never register atlases to each other, and state when no open atlas exists (currently the sperm whale). The bat scan is an unlabelled fixed head: do not draw regions or assert anatomical axes.
- Research review entries must state the claim, the data used (with checksums), the method, the result and its limits, using the verdict scale in `content.js`. A discrepancy is never presented as misconduct.
- Rebuild derived data with `scripts/build_atlases.py` and `scripts/build_collections.py` from originals in `data/raw/` (see `research/sources-2026-11.json`).
