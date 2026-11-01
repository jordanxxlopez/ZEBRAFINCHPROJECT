# Research source catalog

Discovery and feasibility review, 2026-10-31. Download status is established by the acquisition manifest. These are not 25 completed replications.

## 3D MRI atlas of the zebra finch brain
- ID / sector: `atlas-mri` / Atlas
- Source: https://zenodo.org/records/22107510
- DOI: 10.1016/j.neuroimage.2008.01.069
- Data: Structural MRI
- Possible work: Scale-resolved MRI sections and label-derived surfaces at 0.08 mm per voxel
- Rights: CC-BY-4.0; Zenodo API
- Review: Downloaded; see acquisition manifest
- Qualification: Male reference brain; voxel spacing is not whole-brain size; 2026 deposit describes a 2008 paper

## Digital atlas of the zebra finch brain: a high-resolution photo atlas
- ID / sector: `atlas-histology` / Atlas
- Source: https://repository.cshl.edu/id/eprint/29497/
- DOI: 10.1002/cne.23443
- Data: Nissl and myelin sections
- Possible work: Compare regional boundaries and anatomical landmarks
- Rights: Not yet verified
- Review: Primary repository abstract reviewed
- Qualification: Nonstereotaxic histology; tissue deformation and cross-specimen registration require assessment

## ZEBrA: Zebra finch Expression Brain Atlas
- ID / sector: `atlas-expression` / Atlas
- Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC8219259/
- DOI: 10.1002/cne.24879
- Data: In situ hybridization
- Possible work: Link regional gene markers to anatomical evidence
- Rights: Check individual image terms
- Review: Article text reviewed
- Qualification: Different brains; reference drawings are approximate guides, not exact registration

## Exploring sex differences in the adult zebra finch brain
- ID / sector: `diffusion-hamaide` / Connectivity
- Source: https://orbi.uliege.be/handle/2268/205398
- DOI: 10.1016/j.neuroimage.2016.09.067
- Data: DTI and track-density imaging
- Possible work: Potential reproducible tractography if raw diffusion volumes and gradients become available
- Rights: Repository user license
- Review: Abstract and acquisition summary reviewed; raw data not located
- Qualification: 78 micrometre acquisition and 40 micrometre TDI grid are distinct; streamlines are not axon counts

## The songbird connectome (OSCINE-NET.ORG)
- ID / sector: `oscine` / Connectivity
- Source: https://link.springer.com/article/10.1186/s12868-024-00919-3
- DOI: 10.1186/s12868-024-00919-3
- Data: Literature-derived regional edges
- Possible work: Build evidence-linked graph; retain species and tracer provenance
- Rights: Check dataset rights separately
- Review: Methods and data-availability sections reviewed
- Qualification: Mixed songbird evidence; filter zebra finch records before species-specific claims

## The songbird basal ganglia connectome
- ID / sector: `area-x-em` / Connectivity
- Source: https://syconn.esc.mpcdf.mpg.de/data.html
- DOI: 10.1101/2025.10.25.684569
- Data: EM synapses, skeletons, meshes
- Possible work: Analyze real local connectivity and render measured neuronal geometry
- Rights: Not verified for redistribution; link to provider
- Review: Provider documentation reviewed; small API sample acquired locally
- Qualification: Area X subvolume, not a whole-brain connectome; automated labels and fragments require QC

## Morphological characterization of HVC projection neurons in the zebra finch
- ID / sector: `hvc-morphology` / Connectivity
- Source: https://longlab.med.nyu.edu/wp-content/uploads/2018/06/Benezra2018.pdf
- DOI: Not yet verified
- Data: Single-cell reconstructions
- Possible work: Seek original tracing files before neuron compartment modeling
- Rights: Not yet verified
- Review: Primary paper search lead
- Qualification: Confirm tracing access and cell identity; do not infer morphology from a stylized figure

## Machine Learning for Bird Song Learning dataset
- ID / sector: `ml4bl` / Recordings
- Source: https://zenodo.org/records/5545872
- DOI: 10.5281/zenodo.5545872
- Data: Audio and perceptual decisions
- Possible work: Compare acoustic similarity against bird judgments
- Rights: CC-BY-4.0
- Review: Downloaded; see acquisition manifest
- Qualification: Respect supplied splits; check individual-bird leakage before evaluating new models

## Recordings of zebra finch group behaviors with manually annotated vocal segments
- ID / sector: `birdpark` / Behavior
- Source: https://zenodo.org/records/13144875
- DOI: 10.5281/zenodo.13144875
- Data: Audio, video, accelerometer and HDF5 annotations
- Possible work: Vocal attribution and synchronized social behavior
- Rights: GPL-2.0-or-later in record; inspect embedded rights
- Review: Annotations and README acquired; 12.3 GB recordings deferred
- Qualification: Annotations alone are not the full audiovisual recording set

## Dataset for Bird Song Metronomics
- ID / sector: `metronomics` / Recordings
- Source: https://www.dare.uva.nl/id/749a0f04-8ee0-4782-be03-2588cfc4fa64
- DOI: 10.5281/zenodo.17842766
- Data: Song timing annotations
- Possible work: Test rhythmic regularity against explicit null models
- Rights: Not yet verified
- Review: Institutional dataset description reviewed
- Qualification: 2025 deposit relates to Norton and Scharff 2016; do not confuse deposit and article dates

## Zebra Finch Vocalization Dataset for Semi-Automated Clustering
- ID / sector: `clustering` / Recordings
- Source: https://zenodo.org/records/22657329
- DOI: 10.5281/zenodo.22657329
- Data: Processed audio and annotations
- Possible work: Benchmark annotation agreement
- Rights: Not yet verified
- Review: Version notes reviewed
- Qualification: Resolve v1, v2 and separate earlier concept record; prevent duplicate counting

## Single-unit recordings from two auditory areas in male zebra finches
- ID / sector: `crcns-aa1` / Recordings
- Source: https://crcns.org/data-sets/aa/aa-1/about
- DOI: 10.6080/K0F769GP
- Data: Auditory spikes and stimuli
- Possible work: Fit receptive-field baseline and assess held-out responses
- Rights: Provider conditions; account required
- Review: Provider documentation reviewed; not downloaded
- Qualification: Account access is required; split by recording and animal

## Neural population spiking activity during singing
- ID / sector: `crcns-am2` / Recordings
- Source: https://crcns.org/data-sets/aa/am-2/about
- DOI: Not yet verified
- Data: HVC electrophysiology and simultaneous song
- Possible work: Developmental timing and song alignment
- Rights: Provider conditions to verify
- Review: Provider description reviewed; not downloaded
- Qualification: Nine animals; preserve bird-level hierarchy and juvenile/adult identity

## Self-organization of songbird neural sequences during social isolation
- ID / sector: `hvc-isolation` / Models
- Source: https://elifesciences.org/articles/77262
- DOI: 10.7554/eLife.77262
- Data: Calcium imaging and song; Dryad j0zpc86km
- Possible work: Reproduce sequence extraction before extending a plasticity model
- Rights: Verify Dryad file terms
- Review: Article and data statement reviewed
- Qualification: Sequence correlation is not anatomical connectivity; preserve tutor exposure and age

## Intrinsic properties link a network model to zebra finch song
- ID / sector: `hvc-intrinsic` / Models
- Source: https://elifesciences.org/articles/99611
- DOI: 10.7554/eLife.99611
- Data: Patch-clamp data, MATLAB model, Python notebook; Dryad wdbrv162x
- Possible work: Reproduce published neuron features and network behavior
- Rights: Verify Dryad record and code terms
- Review: Data statement reviewed; 9.81 GB deposit not downloaded
- Qualification: Do not load untrusted pickle files directly; distinguish measured traces from simulated output

## Motor cortex analogue neurons in songbirds utilize Kv3 subunits to generate ultranarrow spikes
- ID / sector: `kv3` / Models
- Source: https://zenodo.org/records/8187898
- DOI: 10.5281/zenodo.8187898
- Data: Electrophysiological summary workbook
- Possible work: Constrain spike-width and excitability comparisons
- Rights: CC0-1.0
- Review: Workbook and README acquired
- Qualification: Summary workbook is not necessarily raw voltage traces

## Auditory synapses to song premotor neurons are gated off during vocalization in zebra finches
- ID / sector: `gating` / Movies
- Source: https://elifesciences.org/articles/01833/figures
- DOI: 10.7554/eLife.01833
- Data: Original Video 1 and intracellular recording study
- Possible work: Embed source movie beside explanation of measured preparation
- Rights: CC-BY article; retain source attribution
- Review: PDF and movie acquisition tracked in manifest
- Qualification: Movie is an illustration; it is not the complete raw electrophysiology dataset

## Patterns of call communication between group-housed zebra finches change during the breeding cycle
- ID / sector: `group-calls` / Movies
- Source: https://elifesciences.org/articles/07770
- DOI: 10.7554/eLife.07770
- Data: Original Video 1 and behavioral study
- Possible work: Embed group-recording preparation and explain call attribution
- Rights: CC-BY article; retain source attribution
- Review: PDF and original movie acquired
- Qualification: Keep exact experimental context; do not represent this as a different study

## Low-dimensional learned feature spaces quantify individual and group differences in vocal repertoires
- ID / sector: `latent-vocal` / Models
- Source: https://elifesciences.org/articles/67855
- DOI: 10.7554/eLife.67855
- Data: Vocal feature learning
- Possible work: Compare representation stability and individual-level generalization
- Rights: Verify code and dataset licenses
- Review: Primary article identified
- Qualification: Learned distance is not automatically perceptual similarity; no generated imagery is needed

## Environmental and genetic control of brain and song structure in the zebra finch
- ID / sector: `brain-song` / Behavior
- Source: https://datadryad.org/dataset/doi%3A10.5061/dryad.3d7t5
- DOI: 10.1111/evo.12261
- Data: Neuroanatomical and song workbook
- Possible work: Reanalyze brain/song associations with family and environment retained
- Rights: Verify repository terms
- Review: Dataset file list reviewed
- Qualification: Regional volumes do not uniquely determine 3D brain shape

## Physiological constraints and cognitive chunking in Zebra Finch songs
- ID / sector: `chunking` / Behavior
- Source: https://datadryad.org/dataset/doi%3A10.5061/dryad.rbnzs7hh4
- DOI: 10.5061/dryad.rbnzs7hh4
- Data: CSV and R analysis
- Possible work: Reproduce original analysis and compare a Python implementation
- Rights: Verify repository terms
- Review: Dataset file list reviewed
- Qualification: Use current version; keep songs and birds as separate units

## The social role of song in wild zebra finches
- ID / sector: `wild-song` / Behavior
- Source: https://datadryad.org/dataset/doi%3A10.5061/dryad.stqjq2c6s
- DOI: 10.5061/dryad.stqjq2c6s
- Data: Wild ecology and playback data
- Possible work: Compare field context with laboratory song datasets
- Rights: Verify repository terms
- Review: Primary paper and dataset leads reviewed
- Qualification: Observational and experimental components need separate interpretation

## Delta opioid receptors affect acoustic features of song during vocal learning in zebra finches
- ID / sector: `opioid-learning` / Behavior
- Source: https://datadryad.org/dataset/doi%3A10.5061/dryad.x69p8czsh
- DOI: 10.5061/dryad.x69p8czsh
- Data: Song and regional measurement tables
- Possible work: Check developmental acoustic changes and regional volumes
- Rights: Verify repository terms
- Review: Dataset file list reviewed
- Qualification: Inspect zero-byte placeholder versus zipped data; no allegation follows from an empty entry

## Individual recognition of opposite sex vocalizations in the zebra finch
- ID / sector: `recognition` / Behavior
- Source: https://www.nature.com/articles/s41598-017-05982-x
- DOI: 10.1038/s41598-017-05982-x
- Data: Behavior and vocalization recognition
- Possible work: Model recognition with held-out individuals
- Rights: Not yet verified
- Review: Primary-paper data availability lead
- Qualification: Identify exact Dryad files before implementation

## Controlling for activity-dependent genes and behavioral states is critical for determining brain relationships within and across species
- ID / sector: `state-expression` / Quality
- Source: https://pubmed.ncbi.nlm.nih.gov/33855704/
- DOI: Not yet verified
- Data: Gene expression under different behavioral states
- Possible work: Design atlas metadata that retain singing, light and stimulation state
- Rights: Not yet verified
- Review: Primary abstract indexed
- Qualification: Behavioral state can confound apparent regional or cross-species expression differences
