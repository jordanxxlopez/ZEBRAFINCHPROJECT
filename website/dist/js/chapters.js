// Chapter content. [[key]] marks a citation to REFS (content.js) or NEWREFS below; all DOIs checked against Crossref and scite.
export const NEWREFS = {
  woolley2013: {cite: 'Woolley SMN, Portfors CV (2013). Conserved mechanisms of vocalization coding in mammalian and songbird auditory midbrain. Hearing Research 305:45–56.', doi: '10.1016/j.heares.2013.05.005'},
  parishar2021: {cite: 'Parishar P, Sehgal N, Iyengar S (2021). The expression of delta opioid receptor mRNA in adult male zebra finches. PLOS ONE 16:e0256599.', doi: '10.1371/journal.pone.0256599'},
  mello1992: {cite: 'Mello CV, Vicario DS, Clayton DF (1992). Song presentation induces gene expression in the songbird forebrain. PNAS 89:6818–6822.', doi: '10.1073/pnas.89.15.6818'},
  fee2004: {cite: 'Fee MS, Kozhevnikov AA, Hahnloser RHR (2004). Neural mechanisms of vocal sequence generation in the songbird. Annals of the New York Academy of Sciences 1016:153–170.', doi: '10.1196/annals.1298.022'},
  yip2012: {cite: 'Yip ZC, Miller-Sims VC, Bottjer SW (2012). Morphology of axonal projections from the high vocal center to vocal motor cortex in songbirds. Journal of Comparative Neurology 520:2742–2756.', doi: '10.1002/cne.23084'},
  le2025: {cite: 'Le B, Bjoring MC, Meliza CD (2025). The zebra finch auditory cortex reconstructs occluded syllables in conspecific song. Nature Communications 16:8452.', doi: '10.1038/s41467-025-63182-y'},
  kozlov2016: {cite: 'Kozlov AS, Gentner TQ (2016). Central auditory neurons have composite receptive fields. PNAS 113:1441–1446.', doi: '10.1073/pnas.1506903113'},
  glasberg1990: {cite: 'Glasberg BR, Moore BCJ (1990). Derivation of auditory filter shapes from notched-noise data. Hearing Research 47:103–138.', doi: '10.1016/0378-5955(90)90170-T'},
  benezra2018: {cite: 'Benezra SE, Narayanan RT, Egger R, Oberlaender M, Long MA (2018). Morphological characterization of HVC projection neurons in the zebra finch. Journal of Comparative Neurology 526:1673–1689.', doi: '10.1002/cne.24437'},
  chen2018: {cite: 'Chen AN, Meliza CD (2018). Phasic and tonic cell types in the zebra finch auditory caudal mesopallium. Journal of Neurophysiology 119:1127–1139.', doi: '10.1152/jn.00694.2017'},
  falcon2024: {cite: 'Tostado-Marcos P, Arneodo EM, Gentner TQ, Gilja V (2024). FALCON Benchmark B1: zebra finch RA Neuropixels recordings during birdsong. DANDI Archive, dandiset 001046.', doi: null, url: 'https://dandiarchive.org/dandiset/001046'},
};

// Hook question shown on covers
export const HOOKS = {
  'zebra-finch': 'How does a young bird learn to sing?',
  'sperm-whale': 'What is in a pattern of clicks?',
  'egyptian-fruit-bat': 'Who is arguing in the dark?',
  'common-marmoset': 'Do monkeys take turns to talk?',
  'house-mouse': 'What songs are too high for us to hear?',
  'honeybee': 'How does a dance give directions?',
};
export const ACCENT = {'zebra-finch': '#c4532d', 'sperm-whale': '#2f6aa0', 'egyptian-fruit-bat': '#9a6b3c', 'common-marmoset': '#5f7a2f', 'house-mouse': '#8b5d8f', 'honeybee': '#c08a12'};

export const FINCH = {
  facts: [['0.2–7 kHz', 'hearing range [[woolley2013]]'], ['≈25–90 days', 'after hatching: the window for learning song [[gobes2019]]'], ['794 neurons', 'recorded while birds heard the songs below [[le2025]]']],
  steps: [
    {id: 'song', n: 1, title: 'The song', instrument: 'song', body: [
      'A male zebra finch sings one short song, again and again, for the rest of his life. He is not born knowing it. As a youngster he listens to an adult “tutor”, memorises the song, and then practises, babbling at first, until his version matches the memory. The window for this learning runs from roughly 25 to 90 days after hatching. [[gobes2019]]',
      'That makes the zebra finch one of the best animals for asking how a brain learns a sound: the behaviour is easy to record, the learning has a clear beginning and end, and the brain areas involved are known.'],
      deeper: 'The songs on this page are the stimuli from Le, Bjoring & Meliza (2025): eight songs from eight different males, played to anaesthetised birds while single neurons were recorded. [[le2025]]'},
    {id: 'ear', n: 2, title: 'The ear', instrument: 'ear', body: [
      'Before the brain can do anything, the inner ear splits a sound into many pitch channels, like a piano keyboard played in reverse. Each hair cell responds to its own small range of frequencies. Zebra finches hear roughly 0.2 to 7 kHz. [[woolley2013]]',
      'The model below does the same job with 48 filters spread across that range. Compare its output with an ordinary spectrogram: the ear blurs fine time detail at low pitches and keeps it at high pitches.'],
      deeper: 'The gammatone filter is a standard engineering model of cochlear filtering. Its bandwidths here come from human measurements (Glasberg & Moore), so treat it as a sketch of a bird ear, not a measurement of one. [[glasberg1990]]'},
    {id: 'pathway', n: 3, title: 'From ear to forebrain', instrument: 'pathway', body: [
      'From the ear, signals climb through the brainstem to the midbrain nucleus MLd, then to the thalamic nucleus Ovoidalis (Ov), and arrive at Field L, the bird’s primary auditory region. [[parishar2021]] [[mello1992]]',
      'Field L feeds secondary auditory areas such as NCM and CM. Song learning and production use a second set of regions: HVC, RA and a loop through Area X, DLM and LMAN. Click each step to light it up on a real MRI of a finch brain.'],
      pathway: [
        {region: 'MLd', title: 'MLd · auditory midbrain', where: 'Counterpart of the mammalian inferior colliculus.', text: 'Midbrain: first strong convergence of auditory signals.'},
        {region: 'Ovoidalis', title: 'Ovoidalis · auditory thalamus', where: 'Relays sound to the forebrain.', text: 'Thalamus: the relay to the forebrain.'},
        {region: 'Field L', title: 'Field L · primary auditory forebrain', where: 'Receives the thalamic input; projects onward to NCM and CM (not segmented in this atlas).', text: 'Primary auditory region; NCM and CM lie next to it.'},
        {region: 'HVC', title: 'HVC · song timing', where: 'Neurons here fire at precise moments of the song.', text: 'Song control: neurons fire at precise moments.'},
        {region: 'RA', title: 'RA · song motor output', where: 'Drives the brainstem motor nucleus for the vocal organ.', text: 'Motor output for song.', also: ['nXIIts']},
        {region: 'Area X', title: 'Area X → DLM → LMAN · learning loop', where: 'Basal ganglia–thalamus–forebrain loop needed for learning and adjusting song.', text: 'Basal-ganglia loop for learning.', also: ['DLM', 'LMAN']},
      ]},
    {id: 'listen', n: 4, title: 'Neurons that listen', instrument: 'strf', body: [
      'Each auditory neuron in the forebrain responds to particular patterns: a rising note, a burst of high pitch, a short gap. Its spectro-temporal receptive field, or STRF, summarises those preferences as a map of pitch against time. [[kozlov2016]]',
      'We fitted an STRF to every neuron with enough spikes to model (531 of 794 recorded in an open dataset), using seven songs, then asked it to predict the neuron’s firing to the eighth song, one it had never been fitted on. Pick a neuron and a song: the white line is what the neuron actually did; the coloured line is the model’s guess.'],
      deeper: 'Across all fitted neurons the median match on unseen songs was highest in Field L and lower in the secondary areas CM and NCM. A linear model captures much of what primary neurons do and less of what higher-order neurons do, as expected if those areas combine features non-linearly. See the full results in the Research section.'},
    {id: 'sing', n: 5, title: 'The singing brain', instrument: 'ra', body: [
      'When the bird sings, the process runs in reverse. Neurons in HVC each fire a single brief burst at one particular moment in the song, and together they act like a clock. [[fee2004]]',
      'They drive RA, whose neurons burst several times per song and connect to the motor neurons of the vocal organ. [[yip2012]] Below is real activity recorded in RA with a Neuropixels probe while a bird sang the same song twice. [[falcon2024]]'] },
    {id: 'cells', n: 6, title: 'The cells themselves', instrument: 'neurons', body: [
      'These are real neurons, traced in three dimensions from microscope images. The HVC neurons that project to RA and those that project to Area X have different shapes. [[benezra2018]] In the auditory area CM, cells that fire only at the start of a sound (phasic) and cells that keep firing (tonic) can be compared side by side. [[chen2018]]'] },
  ],
};

// Generic chapter outline for the other species (uses existing data)
export const OTHER = {
  'sperm-whale': {facts: [['Codas', 'short patterned click sequences [[sharma2024]]'], ['5', 'field recordings in the library'], ['No open', 'brain imaging found']]},
  'egyptian-fruit-bat': {facts: [['91,080', 'annotated calls in the open dataset [[prat2017data]]'], ['8–15 → 0.2–1.2 kHz', 'pup to adult call pitch [[prat2017dialect]]'], ['Tongue clicks', 'used for echolocation [[lee2017]]']]},
  'common-marmoset': {facts: [['871,045', 'audio files in MarmAudio [[lamothe2025]]'], ['558', 'labelled brain regions in the atlas [[woodward2018]]'], ['Turn-taking', 'in phee-call exchanges [[takahashi2013]]']]},
  'house-mouse': {facts: [['> 30 kHz', 'most song energy, above human hearing [[kikusui2011]]'], ['670', 'annotated structures in the Allen atlas [[wang2020]]'], ['×16', 'slower playback so you can hear it']]},
  'honeybee': {facts: [['Angle', 'of the waggle encodes direction [[su2008]]'], ['Duration', 'encodes distance [[su2008]]'], ['793', 'tracked dances we reanalysed [[dormagen2023]]']]},
};

// Labels for the zebra finch 3D specimen. Colours mark functional systems, not arbitrary regions.
export const FINCH_GROUPS = {aud: {label: 'Hearing pathway', color: '#2f8f8a'}, motor: {label: 'Song motor pathway', color: '#c4532d'}, loop: {label: 'Learning loop', color: '#c79a2b'}};
export const FINCH_PARTS = {
  'MLd': {label: 'MLd', title: 'MLd · auditory midbrain', group: 'aud', text: 'Counterpart of the mammalian inferior colliculus. Sound information from the brainstem converges here.'},
  'Ovoidalis': {label: 'Ov', title: 'Ovoidalis · auditory thalamus', group: 'aud', text: 'Relays sound from the midbrain to the forebrain.'},
  'Field L': {label: 'Field L', title: 'Field L · primary auditory forebrain', group: 'aud', text: 'Receives the thalamic input and passes it to the secondary areas NCM and CM, which this atlas does not delineate.'},
  'HVC': {label: 'HVC', title: 'HVC · song timing', group: 'motor', text: 'Neurons that project to RA each fire one brief burst at a particular moment of the song.'},
  'RA': {label: 'RA', title: 'RA · song motor output', group: 'motor', text: 'Receives HVC input and drives the brainstem motor neurons of the vocal organ.'},
  'nXIIts': {label: 'nXIIts', title: 'nXIIts · vocal motor nucleus', group: 'motor', text: 'Brainstem motor nucleus for the syrinx, the bird’s vocal organ.'},
  'Area X': {label: 'Area X', title: 'Area X · basal ganglia', group: 'loop', text: 'First station of the loop needed for learning and adjusting song.'},
  'DLM': {label: 'DLM', title: 'DLM · thalamic relay', group: 'loop', text: 'Passes the output of Area X on to LMAN.'},
  'LMAN': {label: 'LMAN', title: 'LMAN · loop output', group: 'loop', text: 'Sends the loop’s output to RA and contributes to variability in song.'},
};
