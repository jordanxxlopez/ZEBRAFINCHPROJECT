# Website analysis and design brief (12 November 2026)

Goal: an educational neuroethology site, centred on auditory and vocal systems, that people of any age actually use, while remaining credible to researchers. The previous build was organised like a data portal. This review looks at sites people return to and extracts patterns to reuse.

## Sites reviewed (visited in the in-app browser, 12 Nov 2026)

| Site | What it does well | What we take |
|---|---|---|
| **Bartosz Ciechanowski, “Sound”** (ciechanow.ski/sound) | Long single-topic explainer; every paragraph is followed by a small interactive you can drag or play. Plain white page, one accent colour, no navigation clutter. Starts with something you can hear before any theory. | One idea → one interactive. Start each chapter with sound you can play. Generous measure (~65 ch) with full-bleed figures. |
| **Cornell Lab, All About Birds** (species “Sounds” tab) | Species pages split into tabs: Overview · ID info · Life history · Maps · Sounds. Full-width video hero; sound list with big play buttons and named recordists; prose beside the recordings. | Species chapter tabs. Credit every recording visibly but compactly. Big play buttons. |
| **HHMI BioInteractive** (home) | Bold one-line promise, then “Explore resources” by type; serves teachers and students with the same material. | Clear audience entry points (Explore / Learn / Research). |
| **BrainFacts 3D Brain** (SfN) | Whole-screen 3D brain; pick a structure from a list; short description panel per structure. | Atlas as a full-screen tool with a structure picker and a short “what it does” card. |
| **Seeing Theory** (Brown) | Chapters as cards; each chapter is a set of manipulable visualisations with minimal text. | Chapter cards with an icon-like preview of the interactive. |
| **The Pudding** | Visual essays; strong typographic covers; each story has a single hook image. | Every chapter gets a strong cover image (real photo or real spectrogram). |
| **Distill** | Research-grade explanations: hero figure first, author/affiliation/date block, footnotes and citations that pop up in place. | Hover/inline citations instead of reference walls; figure-first openings. |
| **Our World in Data** | Search front and centre; every chart downloadable with sources one click away. | “Data & sources” drawer on every figure rather than inline provenance blocks. |
| **Quanta Magazine** | Editorial typography (serif headlines + clean sans body), illustration-led cards, calm whitespace. | Calm editorial hierarchy (kept in sans); card grid for “Research” stories. |
| **Exploratorium** | Dark, high-contrast museum identity; activities, exhibits and videos as parallel paths. | Dark immersive mode for the lab tools (atlas, neuron models). |
| **Smithsonian Ocean** (sperm whale page) | Breadcrumb → title → huge photograph; reading-level friendly text. | Species overview opens with a large photo and three quick facts. |
| **Google Arts & Culture “Bird Sounds”** | Sound map: thousands of calls laid out by similarity; hover to play. | A “sound map” interaction for comparing calls across species. |
| **EyeWire** | Neuroscience as a game; dark visual space with 3D neurons. | Real reconstructed neurons shown large and rotatable; light game mechanics (“which neuron fires?”). |
| (from earlier review) Allen Brain Map, Macaulay Library, eLife, Janelia, EBRAINS | Task-based navigation, credited media, primary-paper links. | Kept for the Research layer. |

Some sites showed cookie or promotional pop-ups; these were dismissed or ignored and no consent was given.

## What the current build gets wrong

1. Organised by data type (sounds, atlases, reviews) rather than by a question a visitor has.
2. Provenance, checksums and caveats are shown inline everywhere, so the first impression is a database.
3. No narrative: nothing tells a visitor where to start or why a finch matters.
4. Interactives exist but are tools, not explanations; nothing connects the sound to the brain.
5. Visually flat: tables first, small images, no strong covers.

## Design brief

**Structure: three layers, one storyline.**

- **Explore** (any age): home with six animal covers; per-animal “Listen” with big play buttons; a sound-comparison map; 3D brains; small games (guess the caller, follow the dance).
- **Learn** (chapters): every animal follows the same auditory storyline: *the sound → the ear → the brainstem and midbrain → thalamus → auditory forebrain/cortex → the behaviour.* Each step is one short section with one interactive built from real data.
- **Research** (scientists, students): paper guides, claim checks, models with methods, downloadable data. Provenance lives here and in a “Sources” drawer under each figure.

**Models from real data (labelled as models).**

1. *The ear*: a gammatone filterbank run in the browser on real recordings, shown beside the ordinary spectrogram.
2. *Auditory neurons*: spectro-temporal receptive fields (STRFs) fitted to real zebra finch auditory-forebrain spikes (Le, Bjoring & Meliza, CC BY 4.0). Play a song, see real spikes against the model’s prediction, and how well it does on held-out songs.
3. *Song motor system*: Neuropixels activity in RA during singing (FALCON B1, DANDI 001046, CC BY 4.0) aligned to the song.
4. *Neurons*: reconstructed morphologies from NeuroMorpho.org (zebra finch HVC and CM; mouse inferior colliculus).
5. *Anatomy*: existing species atlases, opened at the auditory pathway.

**Visual language.** Large, tightly set Source Sans 3 headlines (the project rules exclude serif display type); warm off-white reading pages; a dark “lab” theme for tools; one accent per animal taken from its photograph; full-bleed real photographs and real spectrograms as covers; no gradients, emoji or stock icons; motion only when it explains something. Citations appear inline as numbered pop-ups. Text written for a curious 12-year-old at the top of each section, getting more technical further down (no separate “plain language” boxes).

**Accessibility.** Keyboard operation for every interactive, captions and text alternatives, reduced-motion respect, AA contrast in both themes, no horizontal scroll at 375 px.
