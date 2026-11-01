# Data quality and reproducibility register

This register records observed discrepancies and testable concerns. No misconduct finding is implied. An unresolved metadata issue is not evidence that an experiment is unreliable.

| ID | Evidence | Status | Consequence / next check |
|---|---|---|---|
| Q01 | Original MRI Analyze headers have pixdim ≈ 0.8 and blank units; Amira bounding box 0–20.4 over 256 samples implies 0.08 spacing | Resolved physical scale | 0.08 mm from original acquisition methods and Amira bounds; exact cross-format voxel equality verified. Corrected derivative headers only; anatomical signs and stereotaxic origin remain unassigned |
| Q02 | Zenodo MRI record says NeuroImage 2026 but links DOI 10.1016/j.neuroimage.2008.01.069 | Metadata discrepancy | Keep deposit date separate from publication year; do not change original metadata |
| Q03 | Clustering record 22657329 describes loss of access to an earlier publication | Provider-documented version issue | Reconcile concept IDs and contents; do not count versions as independent datasets |
| Q04 | EM provider distinguishes v6/v8 cell types and voxel-coordinate synapses from nanometre skeletons | Documented integration hazard | Pin full version and coordinate units before merging tables |
| Q05 | EM sample query returns a filtered random subset | Known sampling restriction | Save query and hash; no population inference from this sample |
| Q06 | Atlas, gene expression, histology and EM originate from different preparations | Known design constraint | Require explicit transform and uncertainty before overlays |
| Q07 | ML4BL includes short filtered/faded syllables and perceptual decisions | Source-documented preprocessing | Keep preprocessing and participant/recording grouping; assess leakage before modeling |
| Q08 | BirdPark annotation files are acquired, full recordings are not | Incomplete acquisition | Do not claim synchronized audiovisual analysis yet |
| Q09 | Physiology resources may contain summaries and executable pickle formats | Pending file-level review | Establish raw-versus-summary status; use safe conversion before analysis |

For each future replication, record source version, environment, parameters, random seed, exclusions, unit of replication, split design, expected published result, reproduced result and sensitivity checks. Label outcomes reproduced, partially reproduced, unresolved, or contradicted under stated conditions. Preserve negative results and explain differences before making stronger claims.
