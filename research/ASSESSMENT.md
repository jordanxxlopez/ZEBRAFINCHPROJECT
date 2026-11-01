# Research assessment — 2026-10-31

## Best starting project

Build a documented atlas-and-recordings resource with reproducible measurements. The most defensible first public contribution is a searchable catalog, reliable original-media playback, explicit coordinate handling, and data-quality reports. An improved interface is immediately feasible; improved anatomical accuracy must be demonstrated against independent landmarks or expert annotations.

### 1. Anatomical atlas

The [Poirier atlas deposit](https://zenodo.org/records/22107510) supplies actual MRI volumes, brain and nuclei delineations, skull data and reference sections. Its associated article is [Poirier et al., 2008](https://doi.org/10.1016/j.neuroimage.2008.01.069). The downloaded archive contains 69 entries and eight Analyze headers. The core image is stored on a 256 × 256 × 256 grid. This is a storage-grid dimension, not the physical dimensions of a brain.

Our direct file inspection finds Analyze spacing near 0.8 with an empty units field. The Amira image header instead spans 0–20.4 across 256 samples, implying 0.08 per sample interval. Resolve this tenfold coordinate discrepancy using the atlas documentation and known landmarks before reporting millimetres, volumes or stereotaxic coordinates. Do not silently choose a scale or estimate the brain as an ellipsoid.

Proposed implementation: Python reads the original formats, preserves an immutable source copy, converts only with a documented affine and units, then exports intensity volumes and label-derived meshes. A browser can show orthogonal slices and measured surfaces, including scale bars and source provenance. Validate orientation, handedness, origin, mask boundaries and region names. Derived surfaces must be labeled computational reconstructions from measured data. No image synthesis is necessary.

Use [Karten et al. histology](https://doi.org/10.1002/cne.23443) for boundary/landmark comparison and [ZEBrA](https://doi.org/10.1002/cne.24879) for gene-marker context. They are different preparations; overlays require registration evidence. A single adult male atlas does not represent variation across sex, age or individuals.

### 2. Connectivity at two real scales

[OSCINE-NET](https://doi.org/10.1186/s12868-024-00919-3) offers regional connections compiled from literature. Preserve paper, tracer method, direction and species for every edge. The paper links its dataset and code through Google Drive; these files have not yet been acquired. An initial reproduction can compare the zebra-finch-only subgraph with the mixed-songbird graph, reporting how evidence coverage changes network statistics.

The [Area X EM resource](https://syconn.esc.mpcdf.mpg.de/data.html) supplies genuine local synaptic data and neuronal geometry. Its API has explicit version strings; cell-type IDs change between versions. A locally saved query sampled 100 MSN-to-GPi synapses. That filtered random sample is only an API feasibility check, not an estimate of whole-network connectivity. Redistribution terms remain to be checked before publishing the payload. The full dataset includes fragments as well as reconstructed neurons; counts must retain the provider's definitions.

These sources could support a browser with a regional graph and a separate local EM explorer. Registering the EM subvolume into the MRI atlas remains an additional, unvalidated operation. Do not make a seamless spatial overlay until an appropriate transform exists.

### 3. Tractography remains conditional

[Hamaide et al., 2017](https://doi.org/10.1016/j.neuroimage.2016.09.067) demonstrates zebra finch diffusion imaging and track-density reconstruction. The institutional record reports 78 μm isotropic diffusion acquisition, 90 directions and a 40 μm TDI output grid. The latter is a reconstructed display grid, not independent measurement at that resolution. A raw diffusion download with gradients was not located in this pass.

Required before implementation: diffusion images, b-values, b-vectors, acquisition metadata, masks, orientation and reuse terms. Then assess preprocessing, tensor/orientation fitting, seed density, stopping thresholds and sensitivity to parameters. DIPY or MRtrix are candidate implementations, subject to checking their current documentation at implementation time. Streamline density is not synapse count, and a structural atlas cannot itself supply missing diffusion measurements.

### 4. Recording database and acoustic models

[ML4BL](https://zenodo.org/records/5545872) provides real syllables plus bird perceptual decisions. Direct inspection verified 887 WAV files, all at 48 kHz, totaling approximately 126.26 seconds. These are short prepared syllables, not hours of continuous spontaneous song. SQLite now indexes filenames, audio properties, durations and SHA-256 hashes.

First analysis: reproduce the supplied perceptual-similarity task with a transparent acoustic baseline, then compare any learned representation against held-out bird judgments. Maintain bird, recording and experimental-cycle grouping; inspect supplied train/validation/test splits. Do not load archived pickle files without a separate security review/conversion path. Preserve source preprocessing in metadata.

[CRCNS aa-1](https://crcns.org/data-sets/aa/aa-1/about) and [am-2](https://crcns.org/data-sets/aa/am-2/about) are useful neural-recording leads. Account-dependent files have not been downloaded. Auditory receptive-field fitting and HVC/song temporal alignment are practical replication tasks once access and documentation are available.

### 5. Physiology and developmental models

[Medina and Margoliash](https://elifesciences.org/articles/99611) provides a direct path from HVC intrinsic properties to a network model, with a Dryad Python notebook and MATLAB code. Begin by reproducing the published feature extraction and parameter settings; record numerical tolerances and discrepancies before changing the model.

[Mackevicius et al.](https://elifesciences.org/articles/77262) offers a second project around sequence organization and tutor exposure. Calcium-derived sequence structure should remain separate from anatomical connections. The [Kv3 data](https://zenodo.org/records/8187898) are already downloaded as an original workbook and README; they have not yet been analyzed.

### 6. Social behavior and source movies

[BirdPark](https://zenodo.org/records/13144875) combines group audio, video and accelerometry. We acquired its annotation HDF5 and README, while the 12.3 GB recording archive remains at the provider. Annotation ingestion must preserve channel identities and synchronization metadata.

Two original eLife movies and their paper PDFs were acquired. The media manifest records exact URLs, identifiers, credits, hashes, dimensions, codecs, duration and audio presence. Preserve the scientific scene and timing, supply user-operated playback, and link each movie to its paper. Full visual/audio review and browser playback tests must precede public website claims about observed details.

## Website design brief for the next phase

Use a restrained research-library layout: clear navigation, readable typography, compact searchable tables, long-form study pages, and an atlas workspace. Suggested sections: Atlas; Connectivity; Recordings; Studies; Reproducible Models; Data Quality. Use real microscopy, original recordings and source-derived geometry only. Avoid decorative brain renders, invented statistics, stock hero imagery, excessive cards, animated backgrounds or promotional claims.

Study pages should connect the question, actual preparation, data, analysis code, original media and interpretation. Downloads should show format, size, version, license and provenance. Data status must distinguish discovered, downloaded, inspected and reproduced. Model outputs must remain visibly distinct from observations. This pass has not built or deployed the website.

## Next implementation milestones

1. Resolve atlas scale and coordinate conventions; inspect original reference documentation and test anatomical landmarks.
2. Build a read-only catalog/recording browser from the committed database and manifests.
3. Reproduce one audio-perception analysis with original splits and an explicit baseline.
4. Acquire and validate OSCINE data; inspect EM reuse terms and a bounded neuronal reconstruction.
5. Add source-derived atlas meshes only after coordinate QA; assess diffusion data availability separately.

The current search is a substantial first-pass discovery and feasibility review, not an exhaustive systematic review. No new biological finding, completed tractogram, full connectome reconstruction or reproduction of the selected papers is claimed.
