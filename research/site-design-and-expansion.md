# Design and research expansion brief

Research pass: 9 November 2026. This is a first source-backed expansion plan, not a claim that 50 papers have all been read and coded. The open scholarly searches returned candidate records from OpenAlex. Each record must be deduplicated, identified as primary study, review, thesis or preprint, and checked against the article and its data/rights statements before it becomes a featured study. Preserve that screening status in the catalog.

## Website references

These research resources give useful design patterns grounded in real scientific material:

| Site | Useful pattern | Apply here |
|---|---|---|
| [Allen Mouse Brain Atlas](https://mouse.brain-map.org/static/atlas) | Anatomical hierarchy paired with a reference atlas and region context | Keep selected structure, section coordinate, units, source specimen and atlas version visible together |
| [Allen Reference Atlas Viewer](https://atlas.brain-map.org/) | Atlas is a navigable research tool linked to underlying datasets | Connect each region to related recordings and papers, with source links |
| [EBRAINS mouse atlas](https://ebrains.eu/data-tools-services/brain-atlases/mouse-brain) | Viewer alongside downloadable atlas files and technical documentation | Make data and methods easy to find next to the interactive view |
| [Jülich Brain Atlas](https://julich-brain-atlas.de/index.php/atlas) | Interactive atlas is paired with programmatic access and services | Treat the browser as one view of a reproducible data package |
| [Macaulay Library](https://www.macaulaylibrary.org/) | Browse natural recordings with creator and archival provenance | Lead with the sound and its recording context; make rights and recordist attribution explicit |
| [BirdNET research platform](https://www.birds.cornell.edu/ccb/birdnet/) | Research use is described alongside sound-identification use | Clearly separate observed recordings, annotations, and any model predictions |
| [Xeno-canto](https://xeno-canto.org/) | Field recording pages foreground species, place, date, recordist and quality | Reuse these as the standard metadata fields for future species and sounds |

Design direction: restrained typography, small color palette, short labels, direct table/list views, source and methods links beside claims, and real data as the visual material. Avoid oversized generated-looking hero graphics, generic “AI dashboard” cards, decorative gradients, and claims that collapse species differences. The present website already uses measured MRI slices and original audio; the next redesign should focus on tighter hierarchy, clearer study provenance, and cross-species navigation.

## Search findings and promising additions

The sources below were surfaced in scholarly and publisher searches. Search-result inclusion is discovery, not a full-paper review. The records marked as primary below have an accessible primary-article page in the cited source; metadata, data links, and reuse terms still need to be recorded individually before redistribution.

### Zebra finch and other songbirds

- Garst-Orozco, Babadi & Ölveczky, “A neural circuit mechanism for regulating vocal variability during song learning in zebra finches,” eLife (2014), [DOI 10.7554/eLife.03697](https://doi.org/10.7554/eLife.03697). Primary intracellular study plus a model; the article describes separate motor and variability pathways converging on RA. Its article page has figures and data tabs.
- “Identification of a motor to auditory pathway important for vocal learning,” primary songbird circuit study, [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/5572074/). Strong candidate for a circuit diagram linked to a playback/learning experiment.
- “Discrete evaluative and premotor circuits enable vocal learning in songbirds,” [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC6842112/). Circuit perturbation and auditory-feedback timing make the experiment explainable as an evidence-linked pathway view.
- “Inhibition protects acquired song segments during vocal learning in zebra finches,” [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC4860291/).
- “Intrinsic neuronal properties represent song and error in zebra finch vocal learning,” [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC7031510/).
- “Thalamus drives vocal onsets in the zebra finch courtship song,” [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC11967199/).
- “Lesions to Caudomedial Nidopallium Impair Individual Vocal Recognition in the Zebra Finch,” OpenAlex record W4322758884; [open full text search](https://pmc.ncbi.nlm.nih.gov/articles/PMC/).
- “High-capacity auditory memory for vocal communication in a social songbird,” OpenAlex W3102387000, [Science Advances DOI 10.1126/sciadv.abe0440](https://doi.org/10.1126/sciadv.abe0440).
- “Juvenile zebra finches learn the underlying structural regularities of their fathers’ song,” [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC4424812/).
- “An automated approach to the quantitation of vocalizations and vocal learning in the songbird,” [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC6136806/), article reports Dryad data DOI [10.5061/dryad.8tn4660](https://doi.org/10.5061/dryad.8tn4660). A strong initial statistical-analysis candidate after the archive and sample hierarchy are checked.
- “Growth and splitting of neural sequences in songbird vocal development,” OpenAlex W2183792474, [Nature DOI 10.1038/nature15741](https://doi.org/10.1038/nature15741).
- “A neural decoder for learned vocal behavior,” OpenAlex W2756580441; verify preprint versus final publication and dataset/code link.
- “In vivo assessment of the neural substrate linked with vocal imitation accuracy,” eLife [article 49941](https://elifesciences.org/articles/49941).
- “A memory-driven auditory program ensures selective and precise vocal imitation in zebra finches,” OpenAlex W3199725634, [Communications Biology DOI 10.1038/s42003-021-02601-4](https://doi.org/10.1038/s42003-021-02601-4).
- “Statistical learning for vocal sequence acquisition in a songbird,” OpenAlex W3005239468, [Scientific Reports DOI 10.1038/s41598-020-58983-8](https://doi.org/10.1038/s41598-020-58983-8).
- “Relationship between the Sequencing and Timing of Vocal Motor Elements in Birdsong,” OpenAlex W2195464054, [PLOS ONE DOI 10.1371/journal.pone.0143203](https://doi.org/10.1371/journal.pone.0143203).
- “Real-Time Contributions of Auditory Feedback to Avian Vocal Motor Control,” OpenAlex W1981795527, [J Neurosci article](https://www.jneurosci.org/content/26/38/9619).
- “Singing-Related Neural Activity in a Dorsal Forebrain–Basal Ganglia Circuit of Adult Zebra Finches,” OpenAlex W1921240213, [J Neurosci article](https://www.jneurosci.org/content/19/23/10461).
- “A Synaptic Basis for Auditory–Vocal Integration in the Songbird,” OpenAlex W1998558428, [J Neurosci DOI 10.1523/JNEUROSCI.2035-07.2008](https://doi.org/10.1523/JNEUROSCI.2035-07.2008).
- “Rapid Interhemispheric Switching during Vocal Production in a Songbird,” OpenAlex W2085408031, [PLOS Biology DOI 10.1371/journal.pbio.0060250](https://doi.org/10.1371/journal.pbio.0060250).
- “Molecular Mapping of Movement-Associated Areas in the Avian Brain,” OpenAlex W1977316848, [PLOS ONE DOI 10.1371/journal.pone.0001768](https://doi.org/10.1371/journal.pone.0001768).
- “Bird Song Metronomics,” OpenAlex W2465814558, [Frontiers DOI 10.3389/fnins.2016.00309](https://doi.org/10.3389/fnins.2016.00309).
- “The songbird syrinx morphome,” OpenAlex W2001860501, [BMC Biology DOI 10.1186/1741-7007-11-1](https://doi.org/10.1186/1741-7007-11-1). Three-dimensional measured organ morphology, suitable for a sourced anatomy feature.
- “One-to-one innervation of vocal muscles allows precise control of birdsong,” OpenAlex W3168690632; [Current Biology DOI 10.1016/j.cub.2021.04.043](https://doi.org/10.1016/j.cub.2021.04.043). Check article and figure reuse terms.
- “Vocal Motor Performance in Birdsong Requires Brain–Body Interaction,” OpenAlex W2952017843, [eNeuro DOI 10.1523/ENEURO.0053-19.2019](https://doi.org/10.1523/ENEURO.0053-19.2019).
- “A Basal Ganglia Circuit Sufficient to Guide Birdsong Learning,” [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC5918681/).
- “A mesocortical dopamine circuit enables the cultural transmission of vocal behavior,” [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC6219627/).
- “Auditory experience-dependent cortical circuit shaping for memory formation in bird song learning,” [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC4919517/).
- “The ecology of zebra finch song and its implications for vocal communication in multi-level societies,” OpenAlex W4398131603; this is review/context, do not count as a primary study.
- “The multi-dimensional nature of vocal learning,” OpenAlex W3198876938; comparative review/context, do not count as a primary study.

### Mammal comparisons and broad sound resources

- “The neurobiology of vocal communication in marmosets,” Grijseels et al. (2023), [PMCID PMC10592205](https://pmc.ncbi.nlm.nih.gov/articles/PMC10592205/). Review/context map of auditory and frontal systems; useful for tracing primary references, but not a primary study.
- “Distinct neuron populations for simple and compound calls in the primary auditory cortex of awake marmosets,” [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC8645005/). Primary calcium-imaging study with call examples; data/reuse status needs inspection.
- “Frontal cortex activity during the production of diverse social communication calls in marmoset monkeys,” [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC10587070/). Primary single-unit and LFP study.
- “Marmoset Anterior Cingulate Area 32 Neurons Exhibit Responses to Presented and Produced Calls during Naturalistic Vocal Communication,” [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC12528829/).
- “Unique Cortical and Subcortical Activation Patterns for Different Conspecific Calls in Marmosets,” [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC11735661/).
- “Circuit and synaptic organization of forebrain-to-midbrain pathways that promote and suppress vocalization,” eLife, [DOI 10.7554/eLife.63493](https://doi.org/10.7554/eLife.63493), primary mouse tracing/manipulation study.
- “Vocalization modulates the mouse auditory cortex even in the absence of hearing,” [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC11720499/).
- “Developmental encoding of natural sounds in the mouse auditory cortex,” [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC11538960/).
- “The Mouse Inferior Colliculus Responds Preferentially to Non-Ultrasonic Vocalizations,” [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC11015948/).
- “Midbrain neurons important for the production of mouse ultrasonic vocalizations are not required for distress calls,” [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC11696906/).
- “Role of auditory feedback for vocal production learning in the Egyptian fruit-bat,” [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC11493346/). Audio, source code, and train/test separation are specifically described; verify actual downloadable release and consent/rights before modeling.
- “Contextual and combinatorial structure in sperm whale vocalisations,” [PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC11076547/). Article describes 8,719 manually annotated codas; check the linked data repository and whale/recording pseudoreplication before modeling.
- [BEANS animal-sound benchmark](https://arxiv.org/abs/2210.12300), 12 datasets across birds, mammals, amphibians and insects; benchmark paper, suitable as a portal to independent datasets, not a single biological cohort.
- [BirdSet dataset paper](https://arxiv.org/abs/2403.10380); broad bird-audio taxonomy/benchmark. Verify dataset version and licensing per constituent source.
- [Vocal Call Locator benchmark](https://proceedings.neurips.cc/paper_files/paper/2024/file/c00d37d6b04d73b870b963a4d70051c1-Paper-Datasets_and_Benchmarks_Track.pdf), rodent calls with source-localization labels; it is a methods benchmark, not a neural circuit data set.
- “Deep machine learning techniques for the detection and classification of sperm whale bioacoustics,” OpenAlex W2970226357, [Scientific Reports DOI 10.1038/s41598-019-48909-4](https://doi.org/10.1038/s41598-019-48909-4); check data provenance before reuse.
- “Towards the Automatic Classification of Avian Flight Calls for Bioacoustic Monitoring,” OpenAlex W2552032035, [PLOS ONE DOI 10.1371/journal.pone.0166866](https://doi.org/10.1371/journal.pone.0166866).
- “A curated bioacoustics dataset of European bat vocalizations,” OpenAlex W7211978479; candidate dataset record, confirm peer-review status, species list and reuse terms.
- “Machine learning and statistical classification of birdsong link vocal acoustic features with phylogeny,” OpenAlex W4367598133, [Scientific Reports DOI 10.1038/s41598-023-33825-5](https://doi.org/10.1038/s41598-023-33825-5).
- “A Framework for Bioacoustic Vocalization Analysis Using Hidden Markov Models,” OpenAlex W2103118270; methods paper, verify exact dataset and licensing.
- “Vocal learning–associated convergent evolution in mammalian proteins and regulatory elements,” OpenAlex W4392282912; assess peer-review status and large consortium data provenance.

This is a 50-item discovery pool including empirical studies, methods papers, benchmarks and explicit review/context entries. It is not yet a 50-primary-paper bibliography. A real 50-paper curated release needs a screening pass for article type, exact DOI and year, animal/specimen, methods, data/code URLs, figure availability, and rights. Do not count the reviews above toward a “50 primary studies” claim.

## Statistical model candidates

1. **Song developmental variability:** the Dryad dataset from the automated songbird quantitation paper. Outcome could be within-bird acoustic variability by developmental age; predictors include age, syllable identity and tutor-similarity measure. Use bird as the grouping unit and a mixed-effects model or bird-level bootstrap. First inspect whether data are sufficiently repeated and whether audio files can be linked back to bird/tutor.
2. **Auditory exposure and imitation accuracy:** compare exposure/tutoring variables to reported song-copy measures only if machine-readable participant-level data are actually deposited. Avoid extracting many points from figures and treating them as independent birds.
3. **Sperm whale coda timing:** predict inter-click interval from coda type/tempo and contextual features using the 8,719-coda public annotations if confirmed. Cluster/bootstrap by whale, social unit and recorder deployment; recordings of one whale are not independent biological replicates.
4. **Bat vocal production learning:** the Egyptian fruit-bat paper gives aligned recordings and published code paths. Use intervention and time as predictors only after checking experimental assignment and animal/day nesting. Neural-circuit outcomes are not available from acoustic data alone.
5. **ML4BL perceptual judgments:** the current repository has 887 short syllable files; determine the exact judgment table and split structure. Model perceptual similarity from preregistered, interpretable acoustic features with bird/listener and stimulus-pair grouping. This is the most immediately accessible local regression candidate, but not a species-general communication model.

Prefer a mixed-effects linear model for continuous outcomes with repeated measures, robust/clustered uncertainty at the animal level, and a held-out animal evaluation. Report model diagnostics, missingness, measurement transformations, confidence intervals, and a simple baseline. Never turn figure pixels into independent observations; if digitizing a figure is necessary, publish the digitized values, axis calibration, figure panel, and uncertainty as such.
