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
export const FINCH_GROUPS = {aud: {label: 'Auditory pathway', color: '#2a7f86'}, motor: {label: 'Song motor pathway', color: '#b03a48'}, loop: {label: 'Basal-ganglia loop', color: '#c9a227'}};
export const FINCH_PARTS = {
  'MLd': {label: 'MLd', title: 'MLd · auditory midbrain', group: 'aud', text: 'Counterpart of the mammalian inferior colliculus. Sound information from the brainstem converges here.'},
  'Ovoidalis': {label: 'Ov', title: 'Ovoidalis · auditory thalamus', group: 'aud', text: 'Relays sound from the midbrain to the forebrain.'},
  'Field L': {label: 'Field L', title: 'Field L · primary auditory forebrain', group: 'aud', text: 'Receives the thalamic input and passes it to the secondary areas NCM and CM, which this atlas does not delineate.'},
  'HVC': {label: 'HVC', title: 'HVC · song timing', group: 'motor', text: 'Neurons that project to RA fire at most one brief burst per motif, each at a fixed time in the song.'},
  'RA': {label: 'RA', title: 'RA · song motor output', group: 'motor', text: 'Receives HVC input and drives the brainstem motor neurons of the vocal organ.'},
  'nXIIts': {label: 'nXIIts', title: 'nXIIts · vocal motor nucleus', group: 'motor', text: 'Brainstem motor nucleus for the syrinx, the bird’s vocal organ.'},
  'Area X': {label: 'Area X', title: 'Area X · basal ganglia', group: 'loop', text: 'First station of the loop needed for learning and adjusting song.'},
  'DLM': {label: 'DLM', title: 'DLM · thalamic relay', group: 'loop', text: 'Passes the output of Area X on to LMAN.'},
  'LMAN': {label: 'LMAN', title: 'LMAN · loop output', group: 'loop', text: 'Sends the loop’s output to RA and contributes to variability in song.'},
};
