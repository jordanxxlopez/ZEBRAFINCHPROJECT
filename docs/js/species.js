// Species added with the atlas expansion, extra references, and the zebra finch section texts.
// Every factual sentence carries a [[reference key]]; DOIs were resolved against Crossref.
export const MORE_REFS = {
  degroof2016: {cite: 'De Groof G, George I, Touj S, Stacho M, Jonckers E, Cousillas H, Hausberger M, Güntürkün O, Van der Linden A (2016). A three-dimensional digital atlas of the starling brain. Brain Structure and Function 221:1899–1909.', doi: '10.1007/s00429-015-1011-1'},
  cornez2017: {cite: 'Cornez G, Madison FN, Van der Linden A, Cornil C, et al. (2017). Perineuronal nets and vocal plasticity in songbirds: a proposed mechanism to explain the difference between closed-ended and open-ended learning. Developmental Neurobiology 77:975–994.', doi: '10.1002/dneu.22485'},
  sirmpilatze2026: {cite: 'Sirmpilatze N, Felder A, Abdulazhanova D, Schwigon L, et al. (2026). An open-source three-dimensional digital brain atlas of a migratory bird, the Eurasian blackcap. Current Biology 36:2063–2077.e5.', doi: '10.1016/j.cub.2026.03.034'},
  leberecht2023: {cite: 'Leberecht B, Wong SY, Satish B, Döge S, et al. (2023). Upper bound for broadband radiofrequency field disruption of magnetic compass orientation in night-migratory songbirds. PNAS 120:e2301153120.', doi: '10.1073/pnas.2301153120'},
  kleven2023: {cite: 'Kleven H, Bjerke IE, Clascá F, Groenewegen HJ, Bjaalie JG, Leergaard TB (2023). Waxholm Space atlas of the rat brain: a 3D atlas supporting data analysis and integration. Nature Methods 20:1822–1829.', doi: '10.1038/s41592-023-02034-3'},
  olszynski2024: {cite: 'Olszyński KH, Polowy R, Wardak AD, Łaska IA, et al. (2024). Male rats emit aversive 44-kHz ultrasonic vocalizations during prolonged Pavlovian fear conditioning. eLife 12:RP88810.', doi: '10.7554/eLife.88810'},
  gustison2024: {cite: 'Gustison ML, Muñoz-Castañeda R, Osten P, Phelps SM (2024). Sexual coordination in a whole-brain map of prairie vole pair bonding. eLife 12:RP87029.', doi: '10.7554/eLife.87029'},
  stolzberg2017: {cite: 'Stolzberg D, Wong C, Butler BE, Lomber SG (2017). Catlas: an magnetic resonance imaging-based three-dimensional cortical atlas and tissue probability maps for the domestic cat (Felis catus). Journal of Comparative Neurology 525:3190–3206.', doi: '10.1002/cne.24271'},
  nadkarni2019: {cite: 'Nadkarni NA, Bougacha S, Garin C, Dhenain M, Picq J-L (2019). A 3D population-based brain atlas of the mouse lemur primate with examples of applications in aging studies and comparative anatomy. NeuroImage 185:85–95.', doi: '10.1016/j.neuroimage.2018.10.010'},
  vandenhole2014: {cite: 'Vanden Hole C, Van Daele PAAG, Desmet N, Devos P, Adriaens D (2014). Does sociality imply a complex vocal communication system? A case study for Fukomys micklemi (Bathyergidae, Rodentia). Bioacoustics 23:143–160.', doi: '10.1080/09524622.2013.841085'},
  butler2015: {cite: 'Butler BE, Hall AJ, Lomber SG (2015). High-field functional imaging of pitch processing in auditory cortex of the cat. PLOS ONE 10:e0134362.', doi: '10.1371/journal.pone.0134362'},
};

const ph = (id, credit, licence, page, note = '') => ({src: `assets/photos/${id}.jpg`, credit, licence, url: page, note});
export const MORE_SPECIES = [
  {id: 'european-starling', common: 'European starling', latin: 'Sturnus vulgaris', group: 'Songbird', signal: 'Learned song with an expanding repertoire',
   photo: ph('european-starling', 'Frank Schulenburg, Wikimedia Commons', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Sturnus_vulgaris_(European_starling)_at_Bodega_Head-1209.jpg'),
   plain: 'A songbird that continues to learn new song elements as an adult, and a long-standing model for the neuroethology of song production and perception.',
   body: [['Vocal behaviour', 'European starlings are open-ended learners. Adults incorporate syllables first heard in adulthood, in every phase of the annual cycle, so the repertoire grows with age.', ['cornez2017']],
          ['The atlas', 'The MRI atlas delineates the auditory regions Field L, NCM and CMM, the thalamic nucleus ovoidalis and the midbrain nucleus MLd, together with the song-control nuclei HVC, RA, Area X and MAN.', ['degroof2016']]],
   reviews: []},
  {id: 'eurasian-blackcap', common: 'Eurasian blackcap', latin: 'Sylvia atricapilla', group: 'Songbird', signal: 'Song; night migration guided by a magnetic compass',
   photo: ph('eurasian-blackcap', 'Charles J. Sharp, Wikimedia Commons', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Eurasian_blackcap_(Sylvia_atricapilla)_male_Drenthe.jpg'),
   plain: 'A night-migratory songbird studied for magnetic-compass orientation as well as song.',
   body: [['Magnetic compass and Cluster N', 'Night-migratory songbirds orient with a light-dependent magnetic compass. Compass information from the retina is processed in Cluster N, a part of the visual wulst in the forebrain.', ['leberecht2023']],
          ['The atlas', 'The 25 µm atlas is presented by its authors as an open-source three-dimensional digital atlas of a migratory bird brain. It delineates Cluster N alongside the song nuclei HVC, RA and Area X.', ['sirmpilatze2026']]],
   reviews: []},
  {id: 'norway-rat', common: 'Norway rat', latin: 'Rattus norvegicus', group: 'Rodent', signal: 'Ultrasonic vocalizations (22-kHz and 50-kHz calls)',
   photo: ph('norway-rat', 'Charles J. Sharp, Wikimedia Commons', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Brown_rat_(Rattus_norvegicus)_Drenthe_2.jpg', 'Wild brown rat; the atlas is of the Sprague Dawley laboratory strain.'),
   plain: 'A rodent whose ultrasonic calls differ between aversive and appetitive situations, with one of the most detailed open brain atlases.',
   body: [['Ultrasonic vocalizations', 'Rats emit long, constant-frequency “22-kHz” calls (18–32 kHz, usually longer than 300 ms) in aversive situations, and short, frequency-modulated “50-kHz” calls (about 35–80 kHz) in appetitive ones. The cited study also reports 44-kHz calls during prolonged fear conditioning, which do not fit this two-category scheme.', ['olszynski2024']],
          ['The atlas', 'The Waxholm Space atlas of the Sprague Dawley rat covers the ascending auditory pathway from the cochlear nuclei through the superior olivary complex, inferior colliculus and medial geniculate complex to auditory cortex.', ['kleven2023']]],
   reviews: []},
  {id: 'prairie-vole', common: 'Prairie vole', latin: 'Microtus ochrogaster', group: 'Rodent', signal: 'Social behaviour during pair bonding',
   photo: ph('prairie-vole', 'Nastacia Goodwin, Wikimedia Commons', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Prairie_Vole_Nastacia_Goodwin_CC_BY-SA.png'),
   plain: 'A rodent studied for pair bonding, with a reference brain annotated in the Allen ontology.',
   body: [['Pair bonding', 'The reference brain was built for a whole-brain map of activity during the formation of pair bonds in prairie voles.', ['gustison2024']]],
   reviews: []},
  {id: 'domestic-cat', common: 'Domestic cat', latin: 'Felis catus', group: 'Carnivore', signal: 'Vocalizations; a classical model of auditory cortex',
   photo: ph('domestic-cat', 'Basile Morin, Wikimedia Commons', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Felis_silvestris_catus_lying_on_rice_straw.jpg'),
   plain: 'A long-used model for the organisation of auditory cortex.',
   body: [['Auditory cortex', 'Primary auditory cortex (A1) and the anterior auditory field (AAF) form the core of cat auditory cortex. Further fields lie around the posterior ectosylvian sulcus, including the posterior and ventral auditory fields.', ['butler2015']],
          ['The atlas', 'CATLAS provides an MRI template with a three-dimensional parcellation of cortical areas, among them the auditory fields.', ['stolzberg2017']]],
   reviews: []},
  {id: 'ansells-mole-rat', common: 'Ansell’s mole-rat', latin: 'Fukomys anselli', group: 'Rodent', signal: 'Subterranean, social rodent',
   photo: ph('ansells-mole-rat', 'Ruben Undheim, Wikimedia Commons', 'CC BY-SA 2.0', 'https://commons.wikimedia.org/wiki/File:Fukomys_anselli_(6337862458).jpg'),
   plain: 'A subterranean African mole-rat with a 20 µm digital brain atlas.',
   body: [], reviews: []},
  {id: 'micklems-mole-rat', common: 'Micklem’s mole-rat', latin: 'Fukomys micklemi', group: 'Rodent', signal: 'Audible calls; fifteen adult and four juvenile call types described', photo: null, noAtlas: true,
   atlasNote: 'No brain atlas of this species is in the collection.', related: ['ansells-mole-rat', 'An atlas of a species of the same genus, Ansell’s mole-rat (Fukomys anselli), is available.'],
   plain: 'A social African mole-rat whose vocal repertoire has been described from recordings.',
   body: [['Vocal repertoire', 'Micklem’s mole-rat is a social African mole-rat of the family Bathyergidae. A study of its vocalizations distinguished fifteen call types specific to adults and four specific to juveniles. The recordings here are the supplementary audio files of that study.', ['vandenhole2014']]],
   reviews: []},
  {id: 'grey-mouse-lemur', common: 'Grey mouse lemur', latin: 'Microcebus murinus', group: 'Primate', signal: 'Calls (two undocumented field recordings)',
   photo: ph('grey-mouse-lemur', 'Лариса Артемьева, Wikimedia Commons', 'CC0', 'https://commons.wikimedia.org/wiki/File:Microcebus_murinus_452184379.jpg', 'Photographed in Madagascar; not a subject of the atlas study.'),
   plain: 'A small primate with an MRI brain template and an atlas of 120 structures.',
   body: [['The atlas', 'The template is the mean of 34 animals aged 15 to 58 months, scanned at 7 T with a T2-weighted sequence at 115 × 115 × 230 µm. It was up-sampled to 91 µm for manual segmentation of 120 structures.', ['nadkarni2019']]],
   reviews: []},
];
export const MORE_ATLASES = Object.fromEntries(MORE_SPECIES.filter(s => !s.noAtlas).map(s => [s.id, {status: 'available', refs: []}]));

// Zebra finch sections. `inst` names an interactive figure in models.js.
export const FINCH_FACTS = [['0.2–7 kHz', 'hearing range [[okanoya1987]]'], ['≈25–65 days', 'after hatching: the tutor’s song is memorised [[gobes2019]]'], ['794 neurons', 'recorded during playback of the songs on this page [[le2025]]']];
export const FINCH_SECTIONS = [
  {id: 'song', title: 'The song', inst: 'song', text: [
    'A male zebra finch sings one short song, repeated throughout his life. The song is learned. As a juvenile he listens to an adult tutor and memorises the tutor’s song between roughly 25 and 65 days after hatching. He then practises, at first with variable, babbling-like song, until his own song stabilises (crystallises) at about 90 days. [[gobes2019]]',
    'The behaviour is easy to record, the learning has a defined beginning and end, and the brain areas involved are known. These properties have made the zebra finch the most widely used laboratory model of vocal learning.',
    'The eight songs shown here, from eight males, are the stimuli of a study in which single auditory neurons were recorded in anaesthetised birds. Each song repeats a few distinct syllables in a fixed order. [[le2025]]']},
  {id: 'ear', title: 'The ear', inst: 'ear', text: [
    'The inner ear separates a sound into frequency channels: each hair cell responds to a narrow range of frequencies. Zebra finches are most sensitive between about 1 and 6 kHz and hear from roughly 0.2 to 7 kHz. [[okanoya1987]]',
    'The model shown here performs the same separation with 48 filters spread across that range. Compared with an ordinary spectrogram, its output is coarser in time at low frequencies and finer at high frequencies.',
    'The gammatone filterbank is a standard engineering model of cochlear filtering. Its bandwidths follow measurements made in humans, so it approximates the bird ear and is not a measurement of one. [[glasberg1990]]']},
  {id: 'pathway', title: 'From ear to forebrain', inst: 'pathway', text: [
    'From the ear, signals ascend through the brainstem to the midbrain nucleus MLd, then to the thalamic nucleus ovoidalis (Ov), and reach Field L, the primary auditory region of the forebrain. Field L projects to the secondary areas NCM and CM. [[vates1996]]',
    'Song learning and production use a second set of regions: HVC, RA and a loop through Area X, DLM and LMAN. Each region in the list is highlighted on the MRI atlas of Poirier and colleagues. [[poirier2008]]']},
  {id: 'listen', title: 'Neurons that listen', inst: 'strf', wide: true, text: [
    'Each auditory neuron in the forebrain responds to particular patterns of sound, such as a rising note, a burst at high frequency or a short gap. Its spectro-temporal receptive field (STRF) summarises those preferences as a map of frequency against time. [[theunissen2000]]',
    'An STRF was fitted to each of 531 single units: 120 in Field L, 80 in CM, 124 in NCM and 207 not assigned to an area. Each of the eight songs was held out in turn and predicted from a fit to the other seven. In the figure, the white line is the measured firing rate and the coloured line is the prediction for the held-out song. [[le2025]]',
    'Median correlation between predicted and measured firing was 0.33 in Field L, 0.26 in CM, 0.24 in NCM and 0.41 in the unassigned units. Response reliability differs between areas, so these values do not by themselves rank the areas by linearity.']},
  {id: 'sing', title: 'The singing brain', inst: 'ra', wide: true, text: [
    'During singing, activity flows from the forebrain to the vocal organ. HVC neurons that project to RA fire at most one brief burst per motif, each at a fixed time in the song. [[hahnloser2002]] RA neurons burst several times per motif. [[leonardo2005]]',
    'The figure shows activity recorded in RA with a Neuropixels probe while a bird sang the same motif twice. The comparison is descriptive and rests on one pair of renditions from one bird. [[falcon2024]]']},
  {id: 'cells', title: 'The cells themselves', inst: 'neurons', text: [
    'These neurons were traced in three dimensions from microscope images and are distributed by NeuroMorpho.org. HVC neurons that project to RA and those that project to Area X differ in shape. [[benezra2018]]',
    'In the auditory area CM, cells that fire only at the onset of a sound (phasic) can be compared with cells that fire throughout it (tonic). [[chen2018]]']},
];

// Chapter plan for the other species: chapter titles and the figure shown beside each body paragraph,
// key facts for the page head, and additional cited paragraphs. Indexes follow each species' `body`.
export const CHAPTER_PLAN = {
  'egyptian-fruit-bat': {titles: ['The calls', 'Learning from the colony', 'Echolocation with the tongue', 'The brain'], inst: ['sounds', '', '', 'atlas3d'],
    facts: [['91,080', 'annotated calls in the open dataset [[prat2017data]]'], ['Tongue clicks', 'used for echolocation [[lee2017]]']]},
  'common-marmoset': {titles: ['The phee call', 'Taking turns', 'The brain'], inst: ['sounds', '', 'atlas3d'],
    facts: [['871,045', 'segments in the MarmAudio annotation table [[lamothe2025]]']]},
  'house-mouse': {titles: ['Ultrasonic song', 'Hearing the recordings', 'The brain'], inst: ['sounds', '', 'atlas3d'],
    facts: [['> 30 kHz', 'most vocalizations, above human hearing [[holy2005]]'], ['1/16 speed', 'playback of the examples']]},
  'honeybee': {titles: ['The waggle dance', 'Following the sun', 'The brain'], inst: ['sounds', '', 'atlas3d'],
    facts: [['Angle', 'of the waggle run encodes direction [[riley2005]]'], ['Duration', 'of the run encodes distance [[riley2005]]'], ['793', 'tracked dances reanalysed [[dormagen2023]]']],
    extra: {1: 'In 793 tracked dances the fitted slope of dance angle on solar azimuth was 1.07, 0.53, 0.92 and 1.11 in the four camera–feeder groups, against an expected value of 1. Only the rate of rotation was tested, not the absolute direction.'}},
  'european-starling': {titles: ['The song', 'The brain'], inst: ['sounds', 'atlas3d'], facts: [['Open-ended', 'song learning continues in adulthood [[cornez2017]]']]},
  'eurasian-blackcap': {titles: ['The magnetic compass', 'The brain'], inst: ['', 'atlas3d'], facts: [['25 µm', 'atlas resolution [[sirmpilatze2026]]']]},
  'norway-rat': {titles: ['Ultrasonic calls', 'The brain'], inst: ['sounds', 'atlas3d'], facts: [['22 and 50 kHz', 'the two main call classes [[olszynski2024]]']]},
  'prairie-vole': {titles: ['Pair bonding'], inst: [''], facts: []},
  'domestic-cat': {titles: ['Auditory cortex', 'The brain'], inst: ['', 'atlas3d'], facts: []},
  'ansells-mole-rat': {titles: [], inst: [], facts: []},
  'micklems-mole-rat': {titles: ['The calls'], inst: ['sounds'], facts: [['15 + 4', 'adult and juvenile call types described [[vandenhole2014]]']]},
  'grey-mouse-lemur': {titles: ['The brain'], inst: ['atlas3d'], facts: [['34', 'animals averaged in the MRI template [[nadkarni2019]]']]},
};
