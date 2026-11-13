// "Studies explained": plain-language summaries of single published studies.
// Each summary was written from the open-access full text of the paper it describes (read via PubMed Central,
// November 2026) and states only what that paper reports. A fact from any other paper carries its own [[reference]].
// DOIs were checked with Crossref/Scite; none of these papers carries a retraction or editorial notice.
import {LiveSpectrogram} from './livespec.js?v=20261113a';

export const ARTICLES = [
  {
    id: 'finch-fills-in-song', species: 'zebra-finch', ref: 'le2025', year: 2025, journal: 'Nature Communications', sound: 'finch-song-B189',
    title: 'A songbird’s brain fills in the notes it cannot hear',
    dek: 'When part of a zebra finch song was cut out and replaced with a burst of noise, neurons in the bird’s auditory brain responded as if the missing syllable were still there.',
    question: [
      'People routinely hear speech sounds that are not there. If a syllable in a sentence is deleted and covered by a cough or a burst of noise, listeners still report hearing the missing sound “behind” the noise. Psychologists call this phonemic restoration, and it depends on context: it is weaker for nonsense words than for real ones.',
      'Zebra finches communicate in noisy flocks with songs built from a fixed sequence of syllables. The question was whether a finch’s brain also restores missing pieces of song, and where in the brain that happens.'],
    method: [
      'The team recorded the activity of 407 individual neurons in the auditory pallium, the bird equivalent of the auditory cortex, in 14 zebra finches under anaesthesia.',
      'The birds heard eight real finch songs in several versions. In the key version, a 50–100 millisecond stretch of song was deleted and replaced by white noise. In the comparison version, the same noise was laid on top of the song without deleting anything. Further versions had the gap alone, or the noise alone. If the brain fills in the missing syllable, the first two versions should produce similar activity.',
      'Half of the birds had lived with four of the eight singers, so some songs were familiar to them and some were not.'],
    found: [
      'Across the population of neurons, activity during the noise-filled gap resembled activity to the intact syllable with noise added, more than it resembled the response to the noise itself. It was also closer to the missing syllable than to any other syllable tested.',
      'This happened under anaesthesia, throughout the auditory pallium, and even for songs the bird had never heard before. Restoration was weaker when the whole song was masked by noise, or when the order of the preceding syllables was scrambled.'],
    matters: [
      'The results point to an internal model of how finch syllables usually follow one another, built into local circuits of the auditory brain rather than stored as memories of particular songs. The authors suggest this helps a bird follow song in noisy social settings, the same problem people solve when following a conversation in a crowded room.'],
    limits: [
      'The birds were anaesthetised, so the study measures neural responses, not what a bird perceives. It shows that the brain’s activity resembles the missing sound; it does not test whether a finch “hears” it. The authors expect attention in awake birds to add further effects.',
      'Familiarity with a specific song was not needed for restoration, which leaves open how much of the internal model is learned and how much is inborn.'],
    terms: [['Syllable', 'One continuous sound in a bird song, separated from the next by a short silence.'], ['Auditory pallium', 'The region of the bird forebrain that processes sound; it corresponds to the auditory cortex of mammals.'], ['Phonemic restoration', 'Hearing a speech sound that has been removed and replaced by noise.'], ['Single neuron recording', 'Measuring the electrical spikes of one nerve cell with a fine electrode.']],
    links: [['#research/finch-restoration', 'This site’s reanalysis of the same data'], ['#atlas/zebra-finch', 'Zebra finch brain atlas']],
  },
  {
    id: 'mice-sing', species: 'house-mouse', ref: 'holy2005', year: 2005, journal: 'PLOS Biology', sound: 'mouse-usv-0184_85s', soundNote: 'Recording from a later study (Abbasi et al. 2022), played 16 times slower.',
    title: 'Male mice sing, far too high for people to hear',
    dek: 'Recordings of male mice investigating the scent of other mice showed that their ultrasonic calls are made of distinct syllable types arranged in repeated phrases: the hallmarks of song.',
    question: [
      'Male mice were known to make ultrasonic calls, above the range of human hearing, when they meet females or smell their urine. Most earlier work counted how many calls were made. Few studies had looked at the sounds themselves.',
      'This study asked whether the calls are just varied squeaks, or whether they have the structure of song: distinct note types, put together in patterned sequences.'],
    method: [
      'Male laboratory mice were given a cotton swab carrying diluted mouse urine, which prompts males to call. A microphone sensitive up to 100 kHz recorded everything in the cage.',
      'A computer program picked out each call and traced its pitch over time. The authors analysed 750 calls from one mouse in a single trial in detail, then repeated the key analysis on trials from 45 different males.'],
    found: [
      'The calls lay between about 30 and 110 kHz, lasted roughly 30 to 200 milliseconds and came about ten per second. Most were fast sweeps in pitch.',
      'Many calls contained sudden jumps in pitch, and these jumps fell into a few fixed kinds, so the calls sorted into distinct syllable types. The syllables were not strung together at random: they formed repeated phrases, which the authors describe as meeting the definition of song.',
      'Even genetically identical males differed slightly, but measurably, in which syllables they used and in the timing of their songs.'],
    matters: [
      'Before this study, song had been documented in only a few mammals. The mouse is one of the most widely used animals in laboratory research, so its song opened the way to studying the genetics and brain circuits of a song-like behaviour. The authors compare the number of common syllable types in mouse song with the 3–7 types in zebra finch song.'],
    limits: [
      'The study describes the structure of the songs, not their meaning, and it used one laboratory strain calling to scent rather than to live females.',
      'Whether mouse song is learned, as bird song is, was not tested here. A later cross-fostering study, in which pups were raised by parents of another strain, suggested that it is innate. [[kikusui2011]]'],
    terms: [['Ultrasonic', 'Above about 20 kHz, the upper limit of human hearing.'], ['Syllable type', 'A category of call that recurs with the same shape.'], ['Phrase', 'A run of syllables repeated as a unit within a song.'], ['kHz', 'Kilohertz: thousands of vibrations per second, a measure of pitch.']],
    links: [['#atlas/house-mouse', 'Mouse brain atlas'], ['#recordings', 'All recordings']],
  },
  {
    id: 'bat-pups-dialects', species: 'egyptian-fruit-bat', ref: 'prat2017dialect', year: 2017, journal: 'PLOS Biology', sound: 'bat-social6', soundNote: 'Adult social call from the same research group’s open dataset.',
    title: 'Bat pups pick up the accent of the crowd',
    dek: 'Egyptian fruit bat pups raised for a year with recordings of different colonies developed three distinct vocal dialects, each shifted towards what they heard.',
    question: [
      'In a dark cave, a fruit bat pup hears thousands of other bats far more than it hears its own mother. Few mammals other than humans are known to learn their calls by listening. The question was whether a pup’s voice is shaped by this background “crowd”, even without interacting with the bats it hears.'],
    method: [
      'Pregnant females were caught in wild roosts in central Israel and placed in three identical soundproof chambers, where 14 pups were born (5, 5 and 4).',
      'From the first day and for a whole year, each chamber played recordings that sounded like a colony of 100–200 adults. The control group heard a typical mix of calls (average pitch 564 Hz). One group heard a mix shifted towards low-pitched calls (303 Hz), and another a mix shifted towards high-pitched calls (1,871 Hz). The mothers were released once the pups were weaned, at about 14 weeks.',
      'The young bats were recorded four times, up to the age of about one year, always in the same separate chamber.'],
    found: [
      'At 12–18 weeks the three groups did not differ significantly. From about 31–35 weeks onward they could be told apart acoustically, and their calls had shifted in the direction of the recordings they had heard: three dialects, formed in the lab.',
      'There were limits. The high-pitch group never took up calls above 2 kHz, even though such calls were common in its playback, and used fewer high calls once it reached adulthood.'],
    matters: [
      'The study shows vocal learning from passive listening to a crowd, rather than from a single tutor as in songbirds. Because many species hear large numbers of others without interacting with them, the authors suggest that this “crowd vocal learning” may explain dialects in other animals too.'],
    limits: [
      'The experiment involved 14 pups in the laboratory. The pups never interacted with the recorded bats, and the authors do not claim they imitated specific calls. The upper limit seen in the high-pitch group suggests that inborn or physical constraints also shape the voice.'],
    terms: [['Vocal learning', 'Changing the sounds one makes as a result of hearing others.'], ['Dialect', 'A group-specific variant of the calls of a species.'], ['Fundamental frequency', 'The lowest and usually strongest pitch in a call; heard as its basic pitch.'], ['Playback', 'Recorded calls played to animals through a loudspeaker.']],
    links: [['#atlas/egyptian-fruit-bat', 'Egyptian fruit bat brain scan'], ['#research/bat-annotation-recount', 'This site’s recount of the bat call tables']],
  },
  {
    id: 'rat-44khz', species: 'norway-rat', ref: 'olszynski2024', year: 2024, journal: 'eLife', sound: 'rat-usv-22khz', soundNote: 'A typical 22-kHz alarm call from a different study, played 10 times slower, for comparison.',
    title: 'A new alarm call in the rat’s repertoire',
    dek: 'Rats are known for low 22-kHz distress calls and high 50-kHz calls in pleasant situations. During long fear training, some male rats produced a third kind: long, flat calls around 44 kHz.',
    question: [
      'Rat ultrasonic calls are usually sorted into two groups. Long, flat “22-kHz” calls (18–32 kHz, usually longer than 0.3 s) are made in distress. Short, warbling “50-kHz” calls (about 35–80 kHz) are made in rewarding situations. Long, flat calls at high pitch had not been described.'],
    method: [
      'Male Wistar rats underwent Pavlovian fear conditioning: a 15-second tone was followed, after a short pause, by a brief mild foot shock, up to ten times in one session. Their ultrasonic calls were recorded throughout and sorted by pitch, length and shape. Freezing, a standard sign of fear in rats, was also measured.'],
    found: [
      'The researchers identified 10,445 long, flat, high-pitched calls, 7.5% of all calls recorded in the fear-conditioning experiments. Their peak pitch was mostly between 32 and 52 kHz, averaging 42 kHz.',
      'The calls usually started only after several shocks, partly replacing the familiar 22-kHz calls, and they were linked to freezing. Late in the session they were as loud as, or louder than, the 22-kHz calls, although higher-pitched calls cost more effort to produce.'],
    matters: [
      'The authors propose that these calls signal a heightened negative state, perhaps from rising arousal during prolonged stress. Sorted by pitch alone, they would fall within the range used for the pleasant 50-kHz calls; they are distinguished by being long and flat.'],
    limits: [
      'Only male rats were studied, and the authors call for replication, including in females. Which feeling the calls express (fear, stress, frustration or something else) cannot yet be determined.'],
    terms: [['Fear conditioning', 'Learning to expect an unpleasant event after a signal, such as a sound.'], ['Freezing', 'Staying completely still: a typical fear response in rodents.'], ['Peak frequency', 'The pitch carrying the most sound energy in a call.']],
    links: [['#atlas/norway-rat', 'Rat brain atlas'], ['#species/norway-rat', 'More about rat calls']],
  },
  {
    id: 'bees-read-dances', species: 'honeybee', ref: 'su2008', year: 2008, journal: 'PLOS ONE', sound: 'bee-waggle-run-1', soundNote: 'Sound recorded during a western honeybee waggle run (Sharif 2023).',
    title: 'Two species of honeybee can read each other’s dances',
    dek: 'In a hive shared by Asiatic and European honeybees, Asiatic bees followed European dances and flew to the food those dances advertised.',
    question: [
      'A honeybee that finds food returns to the hive and performs a waggle dance. The angle of the dance tells other bees the direction of the food relative to the sun, and the length of the waggle tells them the distance.',
      'Different honeybee species dance with different “dialects”. The question was whether bees of one species can still decode the dance of another.'],
    method: [
      'In China, the researchers built a mixed colony of Asiatic honeybees (Apis cerana) and European honeybees (Apis mellifera), which lived and worked together for more than 50 days.',
      'European foragers were trained to feeders, and Asiatic bees seen following their dances were marked with paint. In accuracy tests, the trained feeder stood 500 m from the hive, with unscented decoy feeders at 400 m and 600 m on the same line.'],
    found: [
      'Both species danced at the same angles for the same food, so direction was encoded alike. For a given distance, the waggle lasted a different time in each species: the dialect difference lies in how distance is coded.',
      'Even so, Asiatic bees recruited by European dances found the feeders, and most new recruits of both species turned up at the correct 500 m feeder. Somewhat more went to the nearer decoy than to the farther one, so distance was read less precisely than direction.'],
    matters: [
      'The two species are separated by some six to eight million years of evolution, yet one can still use information in the other’s dance. The authors describe this as the first established mixed-species honeybee colony, and the result shows how conserved the dance code is.'],
    limits: [
      'Mixed colonies did not always work: in two of the five set up, the workers of one species were killed by the other within two to three days. The recruitment tests were run at one site, and they measured where recruits searched, not how they decoded the dance.'],
    terms: [['Waggle dance', 'A figure-of-eight run on the comb whose angle and length encode direction and distance to food.'], ['Forager', 'A worker bee that collects food outside the hive.'], ['Recruit', 'A bee that flies out to a food source after following a dance.']],
    links: [['#atlas/honeybee', 'Honeybee brain atlas'], ['#research/honeybee-dance-sun', 'This site’s test of dance angle and the sun']],
  },
  {
    id: 'marmoset-turn-taking', species: 'common-marmoset', ref: 'takahashi2016', year: 2016, journal: 'Philosophical Transactions of the Royal Society B', sound: 'marmoset-phee_223119', soundNote: 'Adult phee call from a different, later dataset (Lamothe et al. 2025).',
    title: 'Baby marmosets learn to take turns in conversation',
    dek: 'Infant marmosets at first call over their parents. During their first two months they learn to wait their turn, and their calls sound more grown-up straight after a parent answers.',
    question: [
      'Human conversation runs on turn-taking: speakers avoid talking at the same time and keep the gaps between turns short. Babies are not born with this. In their first months they often vocalise over their parents, and adult-like turn-taking appears at around 8–12 months.',
      'Adult marmosets, small South American monkeys, also take turns when they call back and forth. This study asked whether infant marmosets go through the same development as human babies, and what the parents contribute.'],
    method: [
      'The study followed 10 infant marmosets and their parents (three adult pairs) in a captive colony at Princeton University, from the first day after birth until two months of age.',
      'In each session an infant was placed in a small cage in a recording room and one parent in another cage nearby. A curtain kept them from seeing each other, so they could only call. The first ten minutes of each session were analysed: who called when, how often calls overlapped, and how mature each infant call sounded.',
      'Marmosets develop about 12 times faster than humans, so in the authors’ comparison these two months correspond to roughly the first two years of a human life.'],
    found: [
      'Soon after birth, infants overlapped their parents’ calls about 25% of the time, a rate similar to that of three-month-old human babies. By two months this had fallen to about 15%, similar to 18-month-old children. Adult marmosets rarely overlap.',
      'In the first week infants barely responded to their parents, but they engaged more and more over the first month. The parents’ own calling behaviour did not change over that time.',
      'Infant calls made just after a parent called were longer and more tonal, that is, more adult-like. How often parents answered did not predict how quickly an infant’s turn-taking matured.'],
    matters: [
      'Marmosets and humans are not close relatives, yet turn-taking develops along a similar path and at a similar life stage. The authors argue that it evolved independently in both, possibly because both raise their young cooperatively and are highly vocal.'],
    limits: [
      'The study involved 10 captive infants, and the data are a subset of an earlier dataset from the same laboratory. Parents and infants could hear but not see each other.',
      'The link between parent calls and more mature infant calls is a pattern in timing; the authors interpret the early lack of interaction as immature self-monitoring, which was inferred rather than measured directly.'],
    terms: [['Turn-taking', 'Alternating calls or speech so that partners rarely talk at the same time.'], ['Overlap', 'Two individuals calling at the same moment.'], ['Phee call', 'The long, whistle-like contact call of marmosets.'], ['Self-monitoring', 'Telling one’s own voice apart from the voices of others.'], ['Convergent evolution', 'Similar traits evolving separately in unrelated species.']],
    links: [['#atlas/common-marmoset', 'Marmoset brain atlas'], ['#research/marmoset-annotation-recount', 'This site’s recount of a large marmoset call dataset']],
  },
  {
    id: 'lemur-friends-sound-alike', species: 'grey-mouse-lemur', ref: 'langehennig2024', year: 2024, journal: 'Philosophical Transactions of the Royal Society B', sound: 'lemur-commons-001', soundNote: 'Recording from Wikimedia Commons, not from the study.',
    title: 'Female mouse lemurs sound more alike the longer they live together',
    dek: 'In a captive colony of grey mouse lemurs, the trill calls of females converged with those of their companions. Males’ calls instead followed family ties, or grew apart.',
    question: [
      'Many social birds and mammals adjust their calls to sound more like their companions, a form of vocal learning called vocal accommodation. It has mostly been studied in species that live in pairs or groups.',
      'Grey mouse lemurs live differently. Females forage alone at night but gather in sleeping groups at dawn; males live alone. The question was whether this difference in social life changes whether their calls converge.'],
    method: [
      'The researchers analysed 482 trill calls from 36 grey mouse lemurs in their breeding colony at the University of Veterinary Medicine Hannover, Germany.',
      'For every pair of animals they measured how different their trills sounded, and compared that with how closely related the two were, how long they had lived together as cage partners, and how different their body weights were.'],
    found: [
      'Females’ trills became more similar the more time two females had spent together, regardless of whether they were related or similar in size.',
      'For males as a whole, family ties mattered more: related males sounded more alike. Among males that had lived together, more time together went with more different trills.',
      'Every animal had its own recognisable vocal signature, and males’ signatures were more distinctive than females’.'],
    matters: [
      'Female mouse lemurs exchange trills as they come together to form sleeping groups at dawn. The authors suggest that a shared, converged trill could work like a password for group membership, while males may benefit from sounding individually distinct.'],
    limits: [
      'The animals were captive, and the study is based on correlations rather than an experiment. Because the lemurs could not choose their cage partners, the authors argue that the similarity was caused by living together rather than by similar-sounding animals choosing each other.',
      'The recordings came from different situations for each sex: mostly mother–infant reunions for females and male–female encounters for males.'],
    terms: [['Trill', 'A rapid series of repeated notes, used by mouse lemurs in social contact.'], ['Vocal accommodation', 'Adjusting one’s calls to become more or less similar to those of others.'], ['Vocal signature', 'Features of a call that identify the individual making it.'], ['Convergence', 'Calls of two individuals becoming more similar over time.']],
    links: [['#atlas/grey-mouse-lemur', 'Mouse lemur brain atlas']],
  },
  {
    id: 'cat-pitch', species: 'domestic-cat', ref: 'butler2015', year: 2015, journal: 'PLOS ONE', sound: 'commons-domestic-cat', soundNote: 'Recording from Wikimedia Commons, not from the study.',
    title: 'Where a cat’s brain hears pitch',
    dek: 'Brain scans of ten cats listening to sounds with and without a clear pitch pointed to an auditory area beyond the primary auditory cortex.',
    question: [
      'Pitch is what makes a melody, lets a listener tell two voices apart, and helps pick out one sound in a noisy room. Cats have long been known to perceive the pitch of complex sounds, but the part of their cortex that handles pitch had not been identified.',
      'In people and monkeys, evidence points to auditory areas beyond the primary auditory cortex. This study looked for the equivalent area in cats.'],
    method: [
      'Ten adult cats were anaesthetised and scanned in a 7-tesla MRI scanner. Functional MRI tracks changes in blood oxygen, an indirect sign of brain activity.',
      'The cats heard a sound engineered to have a clear pitch (iterated rippled noise, with a pitch of 400 Hz) and a plain noise covering the same frequency band (around 10 kHz) with no pitch. Areas more active for the pitch sound were taken as candidates for pitch processing.'],
    found: [
      'Across the group, the pitch sound produced the most extra activity in the posterior auditory field, an area around the posterior ectosylvian sulcus, and not in the core areas A1 and AAF. In individual cats, active clusters spread over several auditory fields.'],
    matters: [
      'The result fits the idea, from human and monkey studies, that the sense of pitch is built in areas beyond the primary auditory cortex. It gives a specific target for more detailed recordings in cats, a long-standing model of hearing.'],
    limits: [
      'The cats were anaesthetised, and functional MRI is an indirect and coarse measure of activity. A second comparison, against a control sound designed to keep the frequency content of the pitch sound but remove its pitch, showed no significant activity, so the result depends on which control is used. The study included ten animals.'],
    terms: [['Pitch', 'How high or low a sound is heard to be.'], ['Harmonics', 'Frequencies at whole-number multiples of the lowest one; together they produce one perceived pitch.'], ['Functional MRI', 'A scan that detects changes in blood oxygen linked to brain activity.'], ['Primary auditory cortex (A1)', 'The first stage of sound processing in the cortex.']],
    links: [['#atlas/domestic-cat', 'Cat brain atlas, with its auditory fields']],
  },
  {
    id: 'blackcap-compass', species: 'eurasian-blackcap', ref: 'leberecht2023', year: 2023, journal: 'PNAS', sound: 'commons-eurasian-blackcap', soundNote: 'Recording from Wikimedia Commons, not from the study.',
    title: 'Radio noise and the songbird’s magnetic compass',
    dek: 'Migrating blackcaps lose their magnetic sense of direction in some radio noise but not in others. Finding where the effect stops points to the molecule behind the compass.',
    question: [
      'Songbirds that migrate at night steer with a magnetic compass that depends on light. Information from the eyes is processed in Cluster N, a region of the forebrain. The leading explanation is a light-triggered chemical reaction in a protein called cryptochrome, which creates short-lived “radical pairs” that are sensitive to magnetic fields.',
      'An earlier study found that broadband radio noise at 75–85 MHz disoriented blackcaps. Theory predicts that above a certain frequency, estimated at 120–220 MHz for the leading candidate, radio noise should have no effect. This study tested that prediction.'],
    method: [
      'Wild blackcaps were caught during autumn migration near the University of Oldenburg, Germany, and tested during the migration seasons of 2020–2022 in magnetically shielded chambers, where the direction each bird tried to head was recorded.',
      'Birds were exposed to broadband radio noise at either 235–245 MHz or 140–150 MHz, at strengths similar to those that had disoriented birds before. Control birds were tested in the normal magnetic field and in a field turned by 120°. The authors also refined the theoretical prediction to about 116 MHz.'],
    found: [
      'Birds stayed oriented in both radio-noise bands. When the magnetic field was turned, control birds turned with it, showing that they were using their magnetic compass.',
      'Together with earlier studies, the frequencies known to disturb the compass now begin above 100 kHz and end below about 145 MHz, a range that includes the predicted 116 MHz.'],
    matters: [
      'A sharp upper limit close to the predicted value is difficult to explain with other proposed mechanisms, such as tiny magnetic particles. The authors conclude that the result is strong evidence that the compass relies on a radical pair containing a flavin, the light-absorbing part of cryptochrome.'],
    limits: [
      'The study measured behaviour; it did not identify the sensor molecule directly. The cutoff is pinned down only to somewhere between about 80 and 145 MHz, and the overall picture combines studies on two species at somewhat different field strengths.',
      'In the autumn tests, the control group in the normal magnetic field was not significantly oriented on its own; the turned-field control was.'],
    terms: [['Magnetic compass', 'A sense of direction based on the Earth’s magnetic field.'], ['Cryptochrome', 'A light-sensitive protein found in the eye, proposed as the compass sensor.'], ['Radical pair', 'Two molecules with unpaired electrons whose chemistry can be nudged by magnetic fields.'], ['MHz', 'Megahertz: millions of oscillations per second, used here for radio frequencies.']],
    links: [['#atlas/eurasian-blackcap', 'Blackcap brain atlas, including Cluster N']],
  },
  {
    id: 'starling-neurons', species: 'european-starling', ref: 'kozlov2016', year: 2016, journal: 'PNAS', sound: 'starling-b1125-1', soundNote: 'Song from a dataset published by the same laboratory (Arneodo et al. 2019).',
    title: 'One starling neuron, a dozen sounds',
    dek: 'Neurons in a starling’s auditory brain each respond to many different pieces of song, from clicks to tones. A computer network trained on starling song developed the same kind of mix.',
    question: [
      'An auditory neuron is often described by the single sound feature that makes it fire. Starlings, however, have large and unpredictable song repertoires: each adult male has several dozen motifs, most of them unique to that bird.',
      'This study asked how neurons in a higher auditory area of the starling brain represent such complex sounds.'],
    method: [
      'In anaesthetised adult male starlings, the researchers recorded the spikes of single neurons in NCM, a secondary auditory region comparable to auditory cortex. The birds heard six one-minute songs from three unfamiliar males, containing over 200 motifs, each repeated 30 times. A few neurons were held for ten hours or more and played 60 songs.',
      'A statistical model (maximum noise entropy) was used to find every sound feature linked to a neuron’s firing. Separately, a two-layer artificial network was trained on the same 60 songs, following two rules seen in real brains: sparseness (each unit responds rarely) and normalization (units suppress each other).'],
    found: [
      'On average, each of the 37 neurons analysed responded to about six features that excited it and six that suppressed it. The features mixed brief clicks with tone-like and harmonic sounds, and were of similar strength. The authors call these composite receptive fields.',
      'This model predicted responses to new songs better than a standard receptive-field model (average correlation 0.23 compared with 0.16), though both captured only part of the response. Units in the network’s second layer developed similar composite receptive fields.'],
    matters: [
      'A neuron that responds to many features can take part in many different groups of neurons, which may suit a large and unpredictable repertoire of sounds. Similar arrangements have been described in the smell systems of mammals and insects, and the network shows that two simple circuit rules can be enough to produce them.'],
    limits: [
      'The recordings were made under anaesthesia, from 37 neurons in one brain region, and the model’s predictions were modest. The network shows that sparseness and normalization are sufficient to produce composite receptive fields, not that the starling brain actually uses these rules.'],
    terms: [['Receptive field', 'The set of sound features that changes a neuron’s firing.'], ['NCM', 'Caudomedial nidopallium, a secondary auditory area of the songbird forebrain.'], ['Motif', 'A short, recognisable segment of starling song.'], ['Sparseness', 'Each neuron responding to only a few of all possible sounds.']],
    links: [['#atlas/european-starling', 'Starling brain atlas, including NCM'], ['#research/finch-strf', 'This site’s receptive-field models of zebra finch neurons']],
  },
];

// References used only by these summaries (DOIs checked with Scite, November 2026).
export const EX_REFS = {
  takahashi2016: {cite: 'Takahashi DY, Fenley AR, Ghazanfar AA (2016). Early development of turn-taking with parents shapes vocal acoustics in infant marmoset monkeys. Philosophical Transactions of the Royal Society B 371:20150370.', doi: '10.1098/rstb.2015.0370'},
  langehennig2024: {cite: 'Langehennig-Peristenidou A, Scheumann M (2024). Sex differences in the impact of social relationships on individual vocal signatures in grey mouse lemurs (Microcebus murinus). Philosophical Transactions of the Royal Society B 379:20230193.', doi: '10.1098/rstb.2023.0193'},
};

const words = a => [a.dek, ...a.question, ...a.method, ...a.found, ...a.matters, ...a.limits].join(' ').split(/\s+/).length;
const minutes = a => Math.max(2, Math.round(words(a) / 220));
const lc = n => /^(Egyptian|Norway|European|Eurasian|Micklem|Ansell)/.test(n) ? n : n[0].toLowerCase() + n.slice(1);
let cleanup = [];
export function teardown() { cleanup.forEach(f => { try { f(); } catch {} }); cleanup = []; }

export function articleCards(list, {SP, esc}) {
  return `<div class="ex-cards">${list.map(a => { const s = SP[a.species]; return `<a class="ex-card" href="#explained/${a.id}">
    <div class="img">${s.photo ? `<img src="${esc(s.photo.src)}" alt="" loading="lazy">` : ''}</div>
    <span class="k">${esc(s.common)} · ${a.year}</span><b>${esc(a.title)}</b><p>${esc(a.dek)}</p><span class="m">${minutes(a)} min read</span></a>`; }).join('')}</div>`;
}

export function renderIndex(main, ctx) {
  const {esc} = ctx;
  main.innerHTML = `<div class="wrap ex-index"><header class="page-head"><p class="eyebrow">Studies explained</p><h1>The science, in plain language</h1>
    <p class="lede">Each piece summarises one published study: the question, what was done, what was found, and what the result does not show. Every summary links to the original paper, which is free to read.</p></header>
    ${articleCards(ARTICLES, ctx)}
    <p class="small faint ex-note">Summaries are written for this site from the full text of each paper and checked against it. They have not been reviewed by the original authors. ${esc(String(ARTICLES.length))} studies so far.</p></div>`;
}

export function renderArticle(main, id, ctx) {
  teardown();
  const {SP, sounds, cited, refList, esc, REFS, reduced} = ctx;
  const a = ARTICLES.find(x => x.id === id); if (!a) return false;
  const s = SP[a.species], used = [], ref = REFS[a.ref], snd = sounds.find(x => x.id === a.sound);
  const P = list => list.map(p => `<p>${cited(p, used)}</p>`).join('');
  const sec = [['question', 'The question', a.question], ['method', 'What the researchers did', a.method], ['found', 'What they found', a.found], ['matters', 'Why it matters', a.matters], ['limits', 'What it does not show', a.limits]];
  const others = ARTICLES.filter(x => x.id !== a.id).slice(0, 3);
  const f = snd?.files || {}, url = f.realtime || f.original || f.expanded;
  main.innerHTML = `<div class="ex-progress" aria-hidden="true"><i></i></div>
  <article class="ex-art">
    <header class="wrap ex-head">
      <p class="crumb"><a href="#explained">Studies explained</a> / <a href="#species/${s.id}">${esc(s.common)}</a></p>
      <h1>${esc(a.title)}</h1>
      <p class="ex-dek">${esc(a.dek)}</p>
      <p class="ex-meta"><span>${minutes(a)} min read</span><span>${esc(a.journal)}, ${a.year}</span><a href="https://doi.org/${esc(ref.doi)}">Read the original paper</a></p>
    </header>
    <figure class="wrap ex-fig">${s.photo ? `<img src="${esc(s.photo.src)}" alt="${esc(s.common)}">` : ''}<figcaption class="credit">${esc(s.common)} (<i>${esc(s.latin)}</i>). Photograph: ${esc(s.photo?.credit || '')}, ${esc(s.photo?.licence || '')}. Not an animal from the study.</figcaption></figure>
    <div class="wrap ex-body">
      <aside class="ex-side">
        <nav aria-label="In this summary"><ol>${sec.map(([k, t]) => `<li><a href="#explained/${a.id}" data-to="ex-${k}">${t}</a></li>`).join('')}<li><a href="#explained/${a.id}" data-to="ex-terms">Words to know</a></li></ol></nav>
        ${url ? `<div class="ex-listen"><b>Hear the ${esc(lc(s.common))}</b><div class="ex-spec"><canvas aria-hidden="true"></canvas></div><button type="button" class="h-play" aria-pressed="false"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1 0l9 5-9 5z" fill="currentColor"/></svg>Play</button><p class="small faint">${esc(snd.kind)}. ${esc(a.soundNote || '')} ${esc((snd.source.citation || '').split(' (')[0])}, ${esc(snd.source.licence)}.</p></div>` : ''}
      </aside>
      <div class="ex-text">
        <div class="ex-short"><b>In short</b><p>${esc(a.dek)}</p></div>
        ${sec.map(([k, t, list]) => `<section id="ex-${k}"><h2>${t}</h2>${P(list)}</section>`).join('')}
        <section id="ex-terms"><h2>Words to know</h2><dl class="ex-terms">${a.terms.map(([t, d]) => `<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join('')}</dl></section>
        <section class="ex-source"><h2>The study</h2><p>${refList(a.ref)}</p>
          <p class="small faint">This summary was written for this site from the open-access full text of the paper and checked against it. It has not been reviewed by the authors. Numbers are as reported in the paper.</p>
          ${used.filter(k => k !== a.ref).length ? `<h3>Other sources</h3><ol class="refs">${used.map(k => `<li>${refList(k)}</li>`).join('')}</ol>` : ''}</section>
        <section class="ex-explore"><h2>Explore on this site</h2><ul><li><a href="#species/${s.id}">The ${esc(lc(s.common))}: calls, brain and data</a></li>${a.links.map(([h, t]) => `<li><a href="${h}">${esc(t)}</a></li>`).join('')}</ul></section>
      </div>
    </div>
    <section class="wrap ex-more"><h2>More studies explained</h2>${articleCards(others, ctx)}</section>
  </article>`;

  const $ = q => main.querySelector(q);
  // reading progress
  const bar = $('.ex-progress i'), art = $('.ex-text');
  const onScroll = () => { if (!art.isConnected) return; const r = art.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight * .6))); bar.style.transform = `scaleX(${p})`;
    let cur = null; main.querySelectorAll('.ex-text section[id]').forEach(x => { if (x.getBoundingClientRect().top < innerHeight * .35) cur = x.id; });
    main.querySelectorAll('.ex-side a[data-to]').forEach(l => l.classList.toggle('on', l.dataset.to === cur)); };
  addEventListener('scroll', onScroll, {passive: true}); cleanup.push(() => removeEventListener('scroll', onScroll)); onScroll();
  main.querySelectorAll('.ex-side a[data-to]').forEach(l => l.onclick = e => { e.preventDefault(); document.getElementById(l.dataset.to)?.scrollIntoView({behavior: reduced() ? 'auto' : 'smooth', block: 'start'}); });
  // listening
  if (url) {
    const btn = $('.ex-listen .h-play'), sp = new LiveSpectrogram($('.ex-spec canvas'), {cmap: 'magma', bg: [0, 0, 4]});
    const idle = () => { btn.setAttribute('aria-pressed', 'false'); btn.lastChild.textContent = 'Play'; };
    sp.onend = idle; cleanup.push(() => { sp.stop(); sp.ctx?.close(); });
    btn.onclick = () => { if (btn.getAttribute('aria-pressed') === 'true') { sp.stop(); return idle(); } btn.setAttribute('aria-pressed', 'true'); btn.lastChild.textContent = 'Stop'; sp.play(url, {maxSeconds: 10}).catch(idle); };
  }
  // gentle entrance
  const G = window.gsap;
  if (G && !reduced()) {
    const ctx2 = G.context(() => {
      G.from('.ex-head > *', {opacity: 0, y: 24, duration: .8, stagger: .08, ease: 'power3.out'});
      G.from('.ex-fig img', {clipPath: 'inset(0 0 100% 0)', duration: 1.2, ease: 'power3.inOut', delay: .2});
      if (window.ScrollTrigger) { G.registerPlugin(window.ScrollTrigger); main.querySelectorAll('.ex-text section').forEach(x => G.from(x, {opacity: 0, y: 30, duration: .7, ease: 'power2.out', scrollTrigger: {trigger: x, start: 'top 88%'}})); }
    });
    cleanup.push(() => ctx2.revert());
  }
  return a;
}
