// Species texts. Every factual sentence is tied to a reference in `refs` (DOIs verified on 12 Nov 2026).
// `plain` is a short summary in everyday language; `body` is the technical text.

export const REFS = {
  poirier2008: {cite: 'Poirier C, Vellema M, Verhoye M, et al. (2008). A three-dimensional MRI atlas of the zebra finch brain in stereotaxic coordinates. NeuroImage 41:1–6.', doi: '10.1016/j.neuroimage.2008.01.069'},
  gobes2019: {cite: 'Gobes SMH, Jennings RB, Maeda RK (2019). The sensitive period for auditory-vocal learning in the zebra finch. Behavioural Processes 163:5–12.', doi: '10.1016/j.beproc.2017.07.007'},
  hamaguchi2014: {cite: 'Hamaguchi K, Tschida KA, Yoon I, Donald BR, Mooney R (2014). Auditory synapses to song premotor neurons are gated off during vocalization in zebra finches. eLife 3:e01833.', doi: '10.7554/eLife.01833'},
  zandberg2024: {cite: 'Zandberg L, Morfi V, George JM, Clayton DF, Stowell D, Lachlan RF (2024). Bird song comparison using deep learning trained from avian perceptual judgments. PLOS Computational Biology 20:e1012329.', doi: '10.1371/journal.pcbi.1012329'},
  sharma2024: {cite: 'Sharma P, Gero S, Payne R, Gruber DF, Rus D, Torralba A, Andreas J (2024). Contextual and combinatorial structure in sperm whale vocalisations. Nature Communications 15:3617.', doi: '10.1038/s41467-024-47221-8'},
  prat2016: {cite: 'Prat Y, Taub M, Yovel Y (2016). Everyday bat vocalizations contain information about emitter, addressee, context, and behavior. Scientific Reports 6:39419.', doi: '10.1038/srep39419'},
  prat2017data: {cite: 'Prat Y, Taub M, Pratt E, Yovel Y (2017). An annotated dataset of Egyptian fruit bat vocalizations across varying contexts and during vocal ontogeny. Scientific Data 4:170143.', doi: '10.1038/sdata.2017.143'},
  prat2017dialect: {cite: 'Prat Y, Azoulay L, Dor R, Yovel Y (2017). Crowd vocal learning induces vocal dialects in bats: playback of conspecifics shapes fundamental frequency usage by pups. PLOS Biology 15:e2002556.', doi: '10.1371/journal.pbio.2002556'},
  lee2017: {cite: 'Lee W-J, Falk B, Chiu C, Krishnan A, Arbour JH, Moss CF (2017). Tongue-driven sonar beam steering by a lingual-echolocating fruit bat. PLOS Biology 15:e2003148.', doi: '10.1371/journal.pbio.2003148'},
  tsurugizawa2025: {cite: 'Tsurugizawa T, Komaki Y, Aota I, Suematsu M, Ohtaka-Maruyama C, Kumamoto T (2025). A cross-species brain magnetic resonance imaging and histology database of vertebrates. Scientific Data 12:1206.', doi: '10.1038/s41597-025-05540-5'},
  miller2010: {cite: 'Miller CT, Mandel K, Wang X (2010). The communicative content of the common marmoset phee call during antiphonal calling. American Journal of Primatology 72:974–980.', doi: '10.1002/ajp.20854'},
  takahashi2013: {cite: 'Takahashi DY, Narayanan DZ, Ghazanfar AA (2013). Coupled oscillator dynamics of vocal turn-taking in monkeys. Current Biology 23:2162–2168.', doi: '10.1016/j.cub.2013.09.005'},
  lamothe2025: {cite: 'Lamothe C, Obliger-Debouche M, Best P, et al. (2025). A large annotated dataset of vocalizations by common marmosets. Scientific Data 12:782.', doi: '10.1038/s41597-025-04951-8'},
  woodward2018: {cite: 'Woodward A, Hashikawa T, Maeda M, et al. (2018). The Brain/MINDS 3D digital marmoset brain atlas. Scientific Data 5:180009.', doi: '10.1038/sdata.2018.9'},
  holy2005: {cite: 'Holy TE, Guo Z (2005). Ultrasonic songs of male mice. PLOS Biology 3:e386.', doi: '10.1371/journal.pbio.0030386'},
  kikusui2011: {cite: 'Kikusui T, Nakanishi K, Nakagawa R, et al. (2011). Cross fostering experiments suggest that mice songs are innate. PLOS ONE 6:e17721.', doi: '10.1371/journal.pone.0017721'},
  abbasi2022: {cite: 'Abbasi R, Balazs P, Marconi MA, Nicolakis D, Zala SM, Penn DJ (2022). Capturing the songs of mice with an improved detection and classification method for ultrasonic vocalizations (BootSnap). PLOS Computational Biology 18:e1010049.', doi: '10.1371/journal.pcbi.1010049'},
  wang2020: {cite: 'Wang Q, Ding S-L, Li Y, et al. (2020). The Allen Mouse Brain Common Coordinate Framework: a 3D reference atlas. Cell 181:936–953.e20.', doi: '10.1016/j.cell.2020.04.007'},
  su2008: {cite: 'Su S, Cai F, Si A, Zhang S, Tautz J, Chen S (2008). East learns from West: Asiatic honeybees can understand dance language of European honeybees. PLOS ONE 3:e2365.', doi: '10.1371/journal.pone.0002365'},
  dormagen2023: {cite: 'Dormagen DM, Wild B, Wario F, Landgraf T (2023). Machine learning reveals the waggle drift’s role in the honey bee dance communication system. PNAS Nexus 2:pgad275.', doi: '10.1093/pnasnexus/pgad275'},
  brandt2005: {cite: 'Brandt R, Rohlfing T, Rybak J, et al. (2005). Three-dimensional average-shape atlas of the honeybee brain and its applications. Journal of Comparative Neurology 492:1–19.', doi: '10.1002/cne.20644'},
  hahnloser2002: {cite: 'Hahnloser RHR, Kozhevnikov AA, Fee MS (2002). An ultra-sparse code underlies the generation of neural sequences in a songbird. Nature 419:65–70.', doi: '10.1038/nature00974'},
  leonardo2005: {cite: 'Leonardo A, Fee MS (2005). Ensemble coding of vocal control in birdsong. Journal of Neuroscience 25:652–661.', doi: '10.1523/JNEUROSCI.3036-04.2005'},
  vates1996: {cite: 'Vates GE, Broome BM, Mello CV, Nottebohm F (1996). Auditory pathways of caudal telencephalon and their relation to the song system of adult male zebra finches (Taenopygia guttata). Journal of Comparative Neurology 366:613–642.', doi: '10.1002/(SICI)1096-9861(19960318)366:4<613::AID-CNE5>3.0.CO;2-7'},
  theunissen2000: {cite: 'Theunissen FE, Sen K, Doupe AJ (2000). Spectral-temporal receptive fields of nonlinear auditory neurons obtained using natural sounds. Journal of Neuroscience 20:2315–2331.', doi: '10.1523/JNEUROSCI.20-06-02315.2000'},
  okanoya1987: {cite: 'Okanoya K, Dooling RJ (1987). Hearing in passerine and psittacine birds: a comparative study of absolute and masked auditory thresholds. Journal of Comparative Psychology 101:7–15.', doi: '10.1037/0735-7036.101.1.7'},
  riley2005: {cite: 'Riley JR, Greggers U, Smith AD, Reynolds DR, Menzel R (2005). The flight paths of honeybees recruited by the waggle dance. Nature 435:205–207.', doi: '10.1038/nature03526'},
  heinze2021: {cite: 'Heinze S, el Jundi B, Berg BG, et al. (2021). A unified platform to manage, share, and archive morphological and functional data in insect neuroscience. eLife 10:e65376.', doi: '10.7554/eLife.65376'},
};

export const SPECIES = [
  {
    id: 'zebra-finch', common: 'Zebra finch', latin: 'Taeniopygia guttata', group: 'Songbird',
    photo: {src: 'assets/zebra-finch-peripitus.jpg', credit: 'Peripitus, Wikimedia Commons', licence: 'CC BY-SA 2.5', url: 'https://commons.wikimedia.org/wiki/File:Taeniopygia_guttata_-Australia-8.jpg', note: 'Captive bird; not a subject of the studies below.'},
    signal: 'Learned song; contact calls',
    plain: 'The most widely used laboratory model of vocal learning: juvenile males learn a song from an adult tutor during a sensitive period.',
    body: [
      ['Song learning', 'Zebra finch song is learned. Juvenile males memorise the song of an adult tutor between roughly 25 and 65 days after hatching and practise until their own song stabilises (crystallises) at about 90 days.', ['gobes2019']],
      ['Song system', 'Song depends on forebrain nuclei such as HVC and RA, with a second pathway through the basal ganglia that contributes to learning. Hamaguchi and colleagues recorded intracellularly from HVC neurons that project to Area X in singing birds and detected no response to altered auditory feedback during singing; the authors interpret this as a gating-off of auditory input.', ['hamaguchi2014']],
      ['Data in the collection', 'The archive holds 887 syllables prepared for a perceptual-judgement study, in which birds chose between sounds; an independent logistic baseline fitted to those choices is described under Research. The brain atlas is the Poirier MRI reference brain, distributed on a 0.08 mm grid from an 80 × 160 × 160 µm acquisition.', ['zandberg2024', 'poirier2008']],
    ],
    data: [['Sound', '887 prepared syllables (48 kHz)'], ['Brain', 'MRI atlas, 13 labelled regions + 3D surfaces'], ['Video', '2 published supplementary films'], ['Reviews', 'HVC feedback experiment; perceptual-choice baseline']],
    reviews: ['paper-hamaguchi', 'perception-model'], soundsLink: 'zebra-finch',
  },
  {
    id: 'sperm-whale', common: 'Sperm whale', latin: 'Physeter macrocephalus', group: 'Toothed whale',
    photo: {src: 'assets/sperm-whale-barathieu.jpg', credit: 'Gabriel Barathieu, Wikimedia Commons', licence: 'CC BY-SA 2.0', url: 'https://commons.wikimedia.org/wiki/File:Mother_and_baby_sperm_whale.jpg', note: 'Photographed off Mauritius; not a subject of the Caribbean studies.'},
    signal: 'Codas (patterned click sequences); echolocation clicks',
    plain: 'A toothed whale that exchanges codas, short patterned click sequences, in social contexts.',
    body: [
      ['Codas', 'Sperm whales produce regular echolocation clicks and fast foraging buzzes as well as codas, short stereotyped click sequences exchanged in social settings. Sharma and colleagues analysed codas recorded off Dominica and described their structure using rhythm and tempo plus two context-dependent features they call rubato and ornamentation.', ['sharma2024']],
      ['Scope of the evidence', 'Timing regularities are behavioural evidence. They do not translate a coda into words and they do not identify a neural circuit. No openly licensed brain imaging of Physeter macrocephalus was located for this collection.', []],
    ],
    data: [['Sound', '5 supplementary field recordings'], ['Brain', 'No open atlas located'], ['Figure', 'Published Figure 1 (CC BY 4.0)'], ['Reviews', 'Coda structure study with deposited-table check']],
    reviews: ['paper-sperm-whale'], soundsLink: 'sperm-whale',
  },
  {
    id: 'egyptian-fruit-bat', common: 'Egyptian fruit bat', latin: 'Rousettus aegyptiacus', group: 'Bat',
    photo: {src: 'assets/photos/egyptian-fruit-bat.jpg', credit: 'MinoZig, Wikimedia Commons', licence: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Rousettus_aegyptiacus_7_-_Israel.jpg', note: 'Roosting colony in Israel; not the recorded colony.'},
    signal: 'Social calls; pup isolation calls; tongue-click echolocation',
    plain: 'A colonial bat whose social calls carry information about caller, addressee and context, and whose pups show vocal learning.',
    body: [
      ['Social calls', 'In a long-term recording study of captive colonies, everyday social calls carried information about the caller, the addressee, the context and the outcome of the interaction.', ['prat2016']],
      ['Vocal learning in pups', 'The fundamental frequency of pup isolation calls is high at birth (about 8–15 kHz) and falls to roughly 0.2–1.2 kHz in adults. Pups raised with playback of different colony recordings shifted their calls towards what they heard, producing group-specific “dialects”.', ['prat2017dialect']],
      ['Tongue-click echolocation', 'Unlike most echolocating bats, which use the larynx, Egyptian fruit bats produce brief broadband clicks with the tongue, emitted in pairs that point in different directions.', ['lee2017']],
      ['Data in the collection', 'Example social, isolation and echolocation recordings and six behaviour videos from the open (CC0) dataset of Prat and colleagues, a recount of its annotation tables, and an ex vivo MRI with diffusion data from the Animal Brain Collection. That scan has no anatomical labels, so none are drawn.', ['prat2017data', 'tsurugizawa2025']],
    ],
    data: [['Sound', '13 example recordings (250 kHz)'], ['Brain', 'Ex vivo T2 MRI + diffusion (FA computed here), unlabelled'], ['Video', '6 behaviour clips (CC0)'], ['Reviews', 'Annotation-table recount']],
    reviews: ['bat-annotation-recount'], soundsLink: 'egyptian-fruit-bat',
  },
  {
    id: 'common-marmoset', common: 'Common marmoset', latin: 'Callithrix jacchus', group: 'Primate',
    photo: {src: 'assets/photos/common-marmoset.jpg', credit: 'Wilfredor, Wikimedia Commons', licence: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Callithrix_jacchus_in_Parque_Bondinho_P%C3%A3o_de_A%C3%A7%C3%BAcar,_Rio_de_Janeiro.jpg', note: 'Free-living marmoset in Rio de Janeiro.'},
    signal: 'Phee, twitter, trill, tsik and other calls; turn-taking',
    plain: 'A New World primate that exchanges phee calls antiphonally, with turn-taking.',
    body: [
      ['Antiphonal calling', 'When marmosets cannot see each other they exchange long “phee” contact calls. Phee calls carry acoustic cues to the caller’s identity and social group; the evidence for cues to sex is weaker.', ['miller2010']],
      ['Turn-taking', 'Takahashi and colleagues modelled these exchanges as coupled oscillators: each animal’s call timing depends on the timing of its partner’s calls, consistent with turn-taking.', ['takahashi2013']],
      ['Data in the collection', 'Call examples and a recount of the 871,045-row annotation table from the MarmAudio dataset, and the Brain/MINDS 2017 reference atlas: ex vivo MRI, registered Nissl histology and 558 labelled regions.', ['lamothe2025', 'woodward2018']],
    ],
    data: [['Sound', '14 examples, 7 call labels (96 kHz)'], ['Brain', 'MRI + Nissl, 558 labelled regions, 3D surfaces'], ['Reviews', 'Annotation-table recount']],
    reviews: ['marmoset-annotation-recount'], soundsLink: 'common-marmoset',
  },
  {
    id: 'house-mouse', common: 'House mouse', latin: 'Mus musculus', group: 'Rodent',
    photo: {src: 'assets/photos/house-mouse.jpg', credit: 'Ahunt, Wikimedia Commons', licence: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:House_mouse_(Mus_musculus)_2732.jpg', note: 'Wild house mouse; laboratory strains are recorded in the studies.'},
    signal: 'Ultrasonic vocalizations (USVs); low-frequency calls',
    plain: 'A rodent that produces ultrasonic vocalizations with song-like structure, and the species with the most widely used reference brain.',
    body: [
      ['Ultrasonic song', 'Male mice produce ultrasonic vocalizations, mostly above 30 kHz, when they meet females or smell female urine. Holy and Guo showed that these sequences have song-like structure, with distinct syllable types arranged in repeated phrases.', ['holy2005', 'kikusui2011']],
      ['Time-expanded playback', 'USVs lie above the range of human hearing. The examples are provided 16 times slower than recorded, which divides every frequency by 16. The recording is from the open evaluation set of the BootSnap detection study.', ['abbasi2022']],
      ['Reference brain', 'The Allen Common Coordinate Framework (CCFv3) is an average of 1,675 mouse brains with a region-by-region annotation; it is the shared spatial reference for much of mouse neuroscience. The viewer uses the 50 µm release with 670 annotated structures present at that resolution.', ['wang2020']],
    ],
    data: [['Sound', '3 USV excerpts (300 kHz, time-expanded)'], ['Brain', 'Allen CCFv3 template, 670 structures, 19 surfaces'], ['Reviews', 'Separation-call tables check']],
    reviews: ['mouse-separation-calls'], soundsLink: 'house-mouse',
  },
  {
    id: 'honeybee', common: 'Western honeybee', latin: 'Apis mellifera', group: 'Insect',
    photo: {src: 'assets/photos/honeybee.jpg', credit: 'Richard Bartz, Wikimedia Commons', licence: 'CC BY-SA 2.5', url: 'https://commons.wikimedia.org/wiki/File:Apis_mellifera_carnica_worker_hive_entrance_2.jpg', note: 'Carniolan honeybee worker at a hive entrance.'},
    signal: 'Waggle dance (direction and distance)',
    plain: 'An insect that communicates the direction and distance of food sources through the waggle dance.',
    body: [
      ['Waggle dance', 'In each waggle run the dancer’s angle relative to gravity encodes the direction of the food relative to the sun’s azimuth, and the duration of the run encodes distance. Radar tracking showed that recruits fly in the direction and to the distance indicated by the dance.', ['riley2005', 'su2008']],
      ['Test with deposited data', 'Because the sun moves across the sky, dances to a fixed feeder should rotate during the day. This prediction was tested on the automatically tracked dances deposited by Dormagen and colleagues.', ['dormagen2023']],
      ['Standard brain', 'The Honeybee Standard Brain is an average shape built from 20 immunostained worker brains. The viewer shows its 22 surface models from InsectBrainDB, including the mushroom bodies, central body, antennal lobes and optic lobes.', ['brandt2005', 'heinze2021']],
    ],
    data: [['Sound', '3 waggle-run sound examples'], ['Brain', 'Standard brain, 22 neuropil surfaces'], ['Reviews', 'Dance angle vs. sun azimuth reanalysis']],
    reviews: ['honeybee-dance-sun'], soundsLink: 'honeybee',
  },
];

export const ATLASES = {
  'zebra-finch': {status: 'available', kind: 'MRI volume, labelled regions, 3D surfaces', refs: ['poirier2008']},
  'house-mouse': {status: 'available', kind: 'Average template, 670 annotated structures, 3D surfaces', refs: ['wang2020']},
  'common-marmoset': {status: 'available', kind: 'MRI + Nissl, 558 labelled regions, 3D surfaces', refs: ['woodward2018']},
  'egyptian-fruit-bat': {status: 'available', kind: 'Single-specimen MRI + diffusion; no labels', refs: ['tsurugizawa2025']},
  'honeybee': {status: 'available', kind: 'Standard-brain surfaces (22)', refs: ['brandt2005', 'heinze2021']},
  'sperm-whale': {status: 'none', kind: 'No openly licensed brain imaging located', refs: []},
};

// Research review registry. `kind`: reanalysis | recount | guide | baseline
export const REVIEWS = [
  {id: 'honeybee-dance-sun', species: 'honeybee', kind: 'Independent reanalysis', verdict: 'consistent', title: 'Waggle-dance angle and solar azimuth', paper: 'dormagen2023',
   summary: 'In 793 automatically tracked dances, the slope of dance angle on solar azimuth was 1.07, 0.53, 0.92 and 1.11 in the four camera–feeder groups (expected 1). Three intervals include 1; one of those is wide (0.26–1.36) and the 0.53 group excludes 1. Only the rate of rotation is tested, not absolute direction.'},
  {id: 'bat-annotation-recount', species: 'egyptian-fruit-bat', kind: 'Data recount', verdict: 'reproduced', title: 'Recount of the Egyptian fruit bat annotation tables', paper: 'prat2017data',
   summary: 'All 13 published context counts match the deposited file exactly (91,080 annotations). One column labelled as files counts annotations instead.'},
  {id: 'marmoset-annotation-recount', species: 'common-marmoset', kind: 'Data recount', verdict: 'reproduced', title: 'Recount of the MarmAudio annotation file', paper: 'lamothe2025',
   summary: '871,045 segments, of which 215,223 carry a call-type label, matching the “about 215,000” stated by the authors. The expert error rate could not be rechecked.'},
  {id: 'mouse-separation-calls', species: 'house-mouse', kind: 'Data check', verdict: 'partial', title: 'Low-frequency calls of mice during separation', paper: null,
   summary: 'Low-frequency calls are present in all 19 separated mice (median 31% of calls). The tables contain no control condition, so specificity to separation cannot be tested.'},
  {id: 'paper-sperm-whale', species: 'sperm-whale', kind: 'Reading guide + table check', verdict: 'partial', title: 'Structure of sperm whale codas', paper: 'sharma2024',
   summary: 'The published exchange plot explained, with a descriptive summary of the deposited coda table. The paper’s clustering and tests were not reproduced.', legacy: true},
  {id: 'paper-hamaguchi', species: 'zebra-finch', kind: 'Methods review', verdict: 'guide', title: 'Auditory feedback to HVC neurons during singing', paper: 'hamaguchi2014',
   summary: 'How the hit/catch feedback experiment was designed, what its controls rule out, and what the population analysis can and cannot show.', legacy: true},
  {id: 'perception-model', species: 'zebra-finch', kind: 'Independent baseline', verdict: 'partial', title: 'Baseline model of zebra finch perceptual choices', paper: 'zandberg2024',
   summary: 'A logistic model of birds’ choices from published acoustic distances reached 56.3% held-out accuracy (AUC 0.568). The bird-level interval for accuracy, 41.8–70.5%, includes chance.', legacy: true},
];

export const VERDICTS = {
  reproduced: {label: 'Reproduced', text: 'The stated numbers were recomputed from the deposited data and match.'},
  consistent: {label: 'Consistent', text: 'An independent analysis of the deposited data agrees with the claim, within stated limits.'},
  partial: {label: 'Partly checked', text: 'Some of the claim was checked; the rest could not be tested with the available data.'},
  discrepancy: {label: 'Discrepancy noted', text: 'A difference between the publication and the data was found. A discrepancy is not evidence of misconduct.'},
  guide: {label: 'Reading guide', text: 'An explanation of the methods and figures; no numbers were recomputed.'},
  uncheckable: {label: 'Not checkable', text: 'The data needed to test the claim are not available.'},
};
