"""Inspect original marine recordings and derive a clearly scoped coda summary."""
import csv,hashlib,json,shutil,wave,zipfile
from collections import Counter
from pathlib import Path
import numpy as np
from scipy.io import wavfile
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'website/dist';records=[]
zip_path=ROOT/'data/raw/sperm-whale-arctic-supplements.zip'
with zipfile.ZipFile(zip_path) as z:
 for member in z.namelist():
  if not member.endswith('.wav'):continue
  name=Path(member).name;target=OUT/'assets/audio/marine'/name;target.parent.mkdir(exist_ok=True)
  raw=z.read(member);target.write_bytes(raw)
  rate,samples=wavfile.read(target);frames=len(samples);channels=1 if samples.ndim==1 else samples.shape[1];width=samples.dtype.itemsize
  assert np.isfinite(samples).all(),name
  kind='Foraging buzz' if 'buzz' in name else 'Slow clicks' if 'slow' in name else 'Usual echolocation clicks'
  records.append({'name':name[:-4],'url':str(target.relative_to(OUT)),'species':'sperm-whale','species_name':'Sperm whale','sample_rate':rate,'frames':frames,'channels':channels,'sample_width_bytes':width,'duration_seconds':frames/rate,'sha256':hashlib.sha256(raw).hexdigest(),'archive_member':member,'kind':kind,'context':'Unchanged supplementary recording from the Svalbard passive-acoustic monitoring study. These examples are not the Dominica social coda dataset.','source_url':'https://doi.org/10.1038/s41598-024-56287-9','license':'CC-BY-4.0','supplement_url':'https://static-content.springer.com/esm/art%3A10.1038%2Fs41598-024-56287-9/MediaObjects/41598_2024_56287_MOESM1_ESM.zip'})
(OUT/'data/marine-recordings.json').write_text(json.dumps(records,indent=2)+'\n')
rows=list(csv.DictReader((ROOT/'data/raw/DominicaCodas.csv').open(encoding='utf-8-sig')))
def summarize(r):
 durations=np.array([float(a['Duration']) for a in r]);types=Counter(a['CodaType'] for a in r)
 per_type=[]
 for typ,count in types.most_common():
  vals=np.array([float(a['Duration']) for a in r if a['CodaType']==typ]);per_type.append({'label':typ,'count':count,'duration_q10_s':float(np.quantile(vals,.1)),'duration_median_s':float(np.median(vals)),'duration_q90_s':float(np.quantile(vals,.9))})
 return {'n':len(r),'duration_median_s':float(np.median(durations)),'duration_q10_s':float(np.quantile(durations,.1)),'duration_q90_s':float(np.quantile(durations,.9)),'type_count':len(types),'types':per_type,'click_counts':dict(sorted(Counter(int(a['nClicks']) for a in r).items()))}
summary={'source_file':'DominicaCodas.csv','source_url':'https://github.com/pratyushasharma/sw-combinatoriality/blob/main/data/DominicaCodas.csv','paper_doi':'10.1038/s41467-024-47221-8','sha256':hashlib.sha256((ROOT/'data/raw/DominicaCodas.csv').read_bytes()).hexdigest(),'method':'Python CSV parsing and NumPy quantiles; original CodaType and Clan columns; no inferred labels or new language model.','scope':'Descriptive statistics of the deposited file; not a reproduction of rhythm/tempo clustering or a test of coda meaning.','rights':'The paper is CC BY 4.0. No standalone license file was found in the linked code/data repository. Original CSV is kept local and linked to the provider; the website exports only derived summary statistics.','groups':{g:summarize(rows if g=='all' else [r for r in rows if r['Clan']==g]) for g in ['all','EC1','EC2']},'quality_note':'The deposited CSV has 8,719 rows: 7,770 labeled EC1 and 949 labeled EC2. The article describes 8,719 codas from EC1. This pass has not reconciled that difference. These summaries describe the deposited CSV and are not presented as the exact published analysis cohort.','limitations':['Rows are codas, not independent whales.','Coda labels include NOISE categories; they are retained as supplied.','No p-value or biological effect is inferred from these descriptive counts.','Unknown or repeated caller identifiers must be resolved before individual-level inference.']}
(ROOT/'analysis/marine-coda-summary.json').write_text(json.dumps(summary,indent=2)+'\n');(OUT/'data/marine-coda-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps({'recordings':len(records),'durations_s':[round(r['duration_seconds'],3) for r in records],'coda_counts':{g:summary['groups'][g]['n'] for g in summary['groups']},'quality_note':summary['quality_note']},indent=2))
