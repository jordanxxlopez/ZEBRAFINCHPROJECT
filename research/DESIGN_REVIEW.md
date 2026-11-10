# Research portal redesign

9 November 2026. This pass addresses the visual identity and navigation of the working research resource. The scientific atlas scale, source media, dataset inventories and model results are retained.

## Audit of the previous design

The three-word oversized headline, repeated numbered uppercase labels, large statistics strip, three equal feature columns and slogan headings made the site feel like a general landing-page template. Cream and rust alone did not give it a scientific identity. The initial homepage also began with a brain display before explaining the animal or research context.

The replacement uses a named research masthead, white surfaces, navy text, blue source links, modest serif story titles and ordinary sans-serif interface controls. A credited photograph introduces the first species collection. Narrative material, archive listings, research citations, technical methods and the atlas workspace have different page structures. No generated media is used.

## Reference review

The current accessible page structures and content hierarchy of these ten institutional or scientific resources informed the changes. This is a qualitative reference review, not a numerical study of their visual appearance or an assertion about how their code was authored. No claim is made that their current implementations are entirely free of AI assistance.

| Resource | Observed organization | Decision in this project |
|---|---|---|
| [Allen Brain Map](https://brain-map.org/) | Task navigation for browsing, analyzing, developing and accessing anatomical references | Name destinations by task; keep the atlas a dedicated working view |
| [Macaulay Library](https://www.macaulaylibrary.org/) | Wildlife photography carries species and creator credits; search and resources are prominent | Use an authentic animal photograph with a visible source credit, then offer the recording archive |
| [Animal Diversity Web](https://animaldiversity.org/) | Search and named taxonomic groups structure the site | Introduce Species navigation and a single real collection; do not imply unfinished species collections exist |
| [EBRAINS](https://ebrains.eu/) | Research infrastructure explains its scope alongside access to data and tools | State what the resource contains before presenting individual tools |
| [Jülich Brain Atlas](https://julich-brain-atlas.de/) | Distinct anatomy modalities and an explicit atlas entry | Preserve modality and coordinate limits next to anatomical data |
| [eLife](https://elifesciences.org/) | Research titles, authors, article types and dates form the content hierarchy | Use literal page and experiment titles; keep primary-paper links beside explanations |
| [Nature](https://www.nature.com/) | Lead stories and smaller supporting entries have unequal prominence | Replace three identical feature columns with a lead species story, research-material list and analysis column |
| [Janelia Tools, Data & Resources](https://www.janelia.org/open-science/tools-and-innovations) | Research tools can be browsed by resource type | Keep recordings, atlas, films and data/methods directly accessible |
| [Max Planck Vallentin group](https://www.bi.mpg.de/vallentin) | A specific scientific question is explained with organism and methods | Add a zebra finch introduction explaining vocal learning and the experiments behind the collection |
| [Cornell conservation bioacoustics / BirdNET](https://www.birds.cornell.edu/ccb/birdnet/) | Organism, research question and tool purpose are stated together | Explain what recordings and analyses measure, instead of using generic feature slogans |

Xeno-canto was also attempted as requested, but its current homepage returned an access-denied response. It was not counted as a successfully inspected reference. Janelia's homepage returned 403; the public tools page was accessible. The Max Planck homepage timed out; the public vocal-communication group page was accessible.

Developer discussions also informed the audit. [r/webdesign's discussion of repetitive sites](https://www.reddit.com/r/webdesign/comments/1u1579w/so_many_websites_look_like_this_now/) and [r/webdevelopment's discussion of similar builder output](https://www.reddit.com/r/webdevelopment/comments/1wldhiq/anyone_else_notice_every_aibuilt_site_looks_the/) describe repeated composition, typography, labels and stock copy. Those are subjective design observations, not evidence that a particular visual property proves AI authorship. We used them to identify specific layout problems in this site.

## What changed

- The public identity is now Animal Communication & Neuroscience; Zebra Finch Project remains the first collection and repository name.
- The homepage introduces the research through a real species photograph and a short scientific story.
- A new species introduction connects perception experiments, the sound archive, song circuits, the MRI atlas and primary publications.
- Literal archive, atlas, film, library and methods titles replace slogans. Headings are smaller and technical screens have less introductory whitespace.
- Navigation, mobile wrapping and media pausing were updated for the new page structure. Existing hash links, including `#atlas` and `#perception-model`, remain valid.
- Peripitus's original CC BY-SA 2.5 photograph is stored unchanged with a source manifest, checksum and visible credit. It is not portrayed as a study animal.
- `scripts/sync_github_pages.py` synchronizes the source site into the configured GitHub Pages `/docs` publishing directory.

## Boundaries of this release

This visual redesign does not turn the existing 50-item discovery list into 50 verified primary studies. It does not add new species datasets, figure digitization, tractography or a new simulation. The original 887 WAVs, two MP4s, atlas data and independent regression remain the scientific foundation. The previous physical scale correction remains 0.08 mm per distributed voxel; original MRI acquisition was 80 × 160 × 160 μm.

## Browser checks

Desktop homepage and the new species route were inspected in the in-app browser. The MRI and 3D atlas loaded after navigation, and selecting HVC updated its region statistics. At a 390 × 844 viewport the homepage and recording archive had document width 390 pixels, without horizontal overflow. Search for Grey644 returned nine recordings; Grey644_1 played at the expected 0.165-second duration with no media error. The waveform loaded from decoded source samples. Both original video elements remain in the films view; their loaded media states are recorded in the browser checks for this release. No scientific source arrays were modified by the design changes.
