# Repository audit

Reviewed 2026-10-31 using the connected account and current default branches. `repositories.json` records all eleven repositories returned. This is a workflow/source-catalog audit, not a line-by-line audit of every repository.

| Repository | Inspected | Application to this project |
|---|---|---|
| NEUROETHOLOGY | README, AGENTS, recursive file inventory, available PAPERS.md and media_sources.json catalogs | Original article figures/movies, precise DOI/movie provenance, technical media validation |
| BEHAVNEUR-392- | README, AGENTS, recursive inventory and available media catalogs | Exact subject-to-recording alignment, hashes, audio/timing/aspect ratio preservation |
| NeuralNetwork | README and documented architecture/limitations | Reusable modular Python approach; mammalian models need new avian validation |
| COGNITIVEPROCESSES | README | Stable source IDs, persistent notes, original visual provenance and explicit version history |
| Neuroethology-Course | README | Simple accessible publishing, source-driven content and clear download behavior |
| PSYC100 | Recursive inventory; README not present | Course scheduling/syllabus materials; no finch dataset identified from inventory |
| caruthersfair-CSBC | Recursive inventory; README not present | Planning-model scripts and reports; not a zebra finch research source |
| MARCHINGBANDSTUDY | Repository metadata reports size 0 | No existing material to reuse |
| MARHCHINGBANDNEURO | Repository metadata reports size 0 | No existing material to reuse |
| brain-tumor-mri-classifier | Repository metadata reports size 0 | No existing material to reuse |
| ZEBRAFINCHPROJECT | Empty initial repository | Target for this research collection |

The Neuroethology default branch was `claude/neuroethology-fa2026-schedule-2lgmmr`; Behavioral Neuroscience used `main`. Downloaded source catalogs are retained locally rather than copying all course content into the new public project. Some metadata downloads encountered transport errors; the audit covers successfully acquired files only. It does not establish that every course citation has been searched.

## Rules carried forward

Use primary articles and exact supplementary movie identifiers. Match every recording to the actual preparation and claim. Preserve scientific content, audio, timing and resolution; record any necessary compatibility conversion. Keep source URL, DOI, author credit, license, dimensions, duration, codec and SHA-256. Links are not embedded files. Report untested playback accurately. Do not copy the courses' slide counts, theme quotas or movie quotas into a research website.

The user's current request explicitly authorizes modeling from real data. The older slide-specific ban on replotted figures does not prohibit measured-data analyses or anatomical reconstructions in this project. No generated imagery is authorized.

## Existing finch-related sources

`finch-matches.json` preserves five keyword matches from the acquired catalogs: Kearney et al. vocal-learning circuits; Fernández-Vargas et al. auditory scene analysis; Lu and Vicario statistical learning; Heston and White FoxP2; Yeganegi and Ondracek sleep. These are leads from the user's repositories, not independently verified replications in this pass. Keyword absence is not proof that a paper was never used.
