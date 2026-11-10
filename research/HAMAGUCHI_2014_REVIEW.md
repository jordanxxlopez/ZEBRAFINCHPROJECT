# Hamaguchi et al. (2014): focused electrophysiology review

Source: Kosuke Hamaguchi, Katherine A. Tschida, Inho Yoon, Bruce R. Donald and Richard Mooney. *Auditory synapses to song premotor neurons are gated off during vocalization in zebra finches*. eLife 3:e01833. https://doi.org/10.7554/eLife.01833

## Scope and source verification

The accessible full text, discussion, methods, Figure 1 and Figure 2 were inspected. The website guide focuses on the intracellular-recording experiment. It is not a complete reanalysis of the paper's separate lesion and longitudinal spine-imaging experiments. The publisher HTML was read directly; the figure images were visually inspected at their supplied resolution.

The article copyright section links **CC BY 3.0**. This is more specific than the current site-wide footer's CC BY 4.0 statement. The two figure assets use the article-specific license. Source URLs, hashes, dimensions, authors, figure DOI and license are recorded in `media/published-figures.json`.

Original Figure 1 includes the authors' zebra finch circuit schematic, cell-identification experiment, feedback manipulation and intracellular recordings. Original Figure 2 includes the analyzed voltage differences and postsynaptic-potential timing. Images are the publisher's 1500-pixel JPEG renditions. No panel was redrawn, recolored or overlaid with an invented anatomical path. The interface enlarges the original image and supplies separate explanatory text.

## Sample hierarchy and analysis details inspected

- The source reports 14 adult male zebra finches in all experiments: 11 in recording experiments and three in imaging combined with LMAN lesion/deafening.
- Seventy-two HVC-X cells were recorded overall; the main altered-feedback analysis included 34 cells. These counts must not be treated as interchangeable animal counts.
- The timing plot in Figure 2D contains 45 postsynaptic-potential onsets from 18 cells. It is not 45 independent animals.
- The methods describe randomly interleaved catch trials, removal of trials with song truncation or timing changes for the main analysis, a 5 ms median filter, voltage grouping, baseline subtraction and fast/slow test windows at 20–60 ms and 60–200 ms.
- The source specifies at least 14 motifs per voltage group for feedback sensitivity. Depolarizing postsynaptic-potential detection emphasizes sharp-rising events and excludes overlapping events that cannot be identified reliably across conditions.

## Interpretation and methodological evaluation

Within-cell hit/catch comparisons and auditory responses outside singing address important alternative explanations. Responses in HVC shelf neurons also show that the recording method can detect an altered-feedback response in the singing animal.

The exclusion of song-truncation and timing-change trials reduces a motor confound, but limits the result to the analyzed, behaviorally comparable singing conditions. Absence of a statistically detected response is not an equivalence bound for every possible feedback signal. Window choice, detection thresholds, sample selection and somatic recording sensitivity constrain the inference.

Cells are nested within animals. A new quantitative evaluation should recover the trial-to-cell-to-bird mapping, estimate effect sizes and uncertainty, and account for that hierarchy. Those raw files were not acquired in this pass, so no hierarchical refit or independent numerical replication is reported. The source acquisition/control repository, https://github.com/hamaguchikosuke/RealSong_control, is linked but has not been executed.

The guide's reading notes and critical evaluation are the project's interpretation. They remain distinguishable from the original published figures. There is no data-falsification finding or forensic image-integrity audit.

## Implemented interface

Route: `#paper-hamaguchi`. Linked from the zebra finch introduction and research library. Includes original Figures 1 and 2, A–D reading notes for Figure 1, an enlarged-image dialog, source captions, the original Video 1, methodological limitations and provenance downloads. It is a first focused illustrated reading guide, not a claim that the entire 50-source discovery pool has been reviewed to this depth.
