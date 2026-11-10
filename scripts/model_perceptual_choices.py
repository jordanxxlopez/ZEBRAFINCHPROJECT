"""Fit an interpretable baseline to published zebra-finch perceptual choices.

Reads only two documented CSVs from ML4BL_ZF.zip; never unpickles files. Predicts
whether left or right was chosen from each option's relative Luscinia distance
to the probe. Group holdout is by individual bird.
"""
import csv, io, json, zipfile
from pathlib import Path
import numpy as np
from scipy.optimize import minimize
from scipy.special import expit
from scipy.stats import rankdata
ROOT=Path(__file__).resolve().parents[1]
archive=ROOT/'data/raw/ML4BL_ZF.zip'
with zipfile.ZipFile(archive) as z:
 def rows(member):return list(csv.DictReader(io.TextIOWrapper(z.open(member),encoding='utf-8-sig')))
 dist_rows=rows('ML4BL_ZF/files/TunedLusciniaV1e.csv')
 probes=rows('ML4BL_ZF/files/Final_probes_20200816.csv')
dist={}
for r in dist_rows:
 a,b=r['S1'],r['S2']; v=float(r['DistanceScore']);dist[a,b]=v;dist[b,a]=v
probe_rows=[r for r in probes if r['ground_truth']=='probe']
X=[];y=[];groups=[];pairs=[]
for r in probe_rows:
 left,right,probe=r['left'],r['right'],r['sound_id']
 if r['ground_truth']!='probe' or r['decision'] not in ('Left','Right'):continue
 dl=dist.get((left,probe));dr=dist.get((right,probe))
 if dl is None or dr is None:continue
 # Positive x means right is acoustically closer to the probe.
 X.append([dl-dr]);y.append(1 if r['decision']=='Right' else 0);groups.append(r['individual']);pairs.append((left,right,probe))
X=np.asarray(X,float);y=np.asarray(y,float);groups=np.asarray(groups);pairs=np.asarray(pairs)
unique=np.array(sorted(set(groups)))
# Stable deterministic holdout, stratified only at bird level; never split a bird.
rng=np.random.default_rng(392);held=np.sort(rng.choice(unique,size=max(1,round(.25*len(unique))),replace=False))
test=np.isin(groups,held);train=~test

def fit(x,yy):
 def loss(b):
  z=b[0]+x[:,0]*b[1];return np.logaddexp(0,z).mean()-np.mean(yy*z)+1e-8*np.sum(b*b)
 return minimize(loss,np.zeros(2),method='BFGS').x
beta=fit(X[train],y[train]);p=expit(beta[0]+X[:,0]*beta[1]);pred=p>=.5

def auc_score(yy,pp):
 pos=yy==1;npos=pos.sum();nneg=len(yy)-npos
 return float((rankdata(pp)[pos].sum()-npos*(npos+1)/2)/(npos*nneg)) if npos and nneg else None
# Animal-cluster bootstrap of the held-out accuracy and AUC.
test_birds=np.unique(groups[test]);bird_metrics=[]
for bird in test_birds:
 ix=test&(groups==bird);bird_metrics.append((float((pred[ix]==y[ix]).mean()),auc_score(y[ix],p[ix])))
boot=[]
for _ in range(4000):
 draw=rng.integers(0,len(test_birds),len(test_birds));vals=[bird_metrics[i] for i in draw]
 boot.append([np.mean([v[0] for v in vals]),np.nanmean([np.nan if v[1] is None else v[1] for v in vals])])
boot=np.asarray(boot)
result={
 'title':'Can published acoustic distance predict zebra-finch probe choices?',
 'source_paper':{'title':'Bird song comparison using deep learning trained from avian perceptual judgments','doi':'10.1371/journal.pcbi.1012329','url':'https://doi.org/10.1371/journal.pcbi.1012329','data_url':'https://zenodo.org/records/5545872'},
 'model':'Single-predictor logistic regression; response is bird choosing right rather than left; predictor is Luscinia distance(left, probe) minus distance(right, probe).',
 'scope':'Probe trials from documented CSV; repeated trials grouped by bird. This is an explanatory baseline, not a reproduction of the paper deep-learning model.',
 'n_rows':len(y),'n_birds':len(unique),'train_rows':int(train.sum()),'train_birds':int((~np.isin(unique,held)).sum()),'heldout_rows':int(test.sum()),'heldout_birds':len(test_birds),
 'heldout_accuracy':float((pred[test]==y[test]).mean()),'heldout_auc':auc_score(y[test],p[test]),'heldout_log_loss':float(np.mean(np.logaddexp(0,beta[0]+X[test,0]*beta[1])-y[test]*(beta[0]+X[test,0]*beta[1]))),
 'animal_bootstrap_95_ci':{'accuracy':np.quantile(boot[:,0],[.025,.975]).tolist(),'auc':np.quantile(boot[:,1],[.025,.975]).tolist()},
 'coefficients':{'intercept':float(beta[0]),'relative_distance':float(beta[1])},
 'baseline_chance':0.5,
 'limitations':['Split is by bird, but stimuli may overlap between train/test birds.','Repeated choices for the same stimulus are not independent; bootstrap resamples held-out birds.','Luscinia distance is one published acoustic metric, not a direct measure of neural representation or communication meaning.','Missing distance pairs are dropped; coverage and excluded counts are reported.','Behavioral choice is used; no brain recordings are modeled.','The model is a transparent statistical baseline and does not claim to outperform the paper.'],
 'n_probe_rows':len(probe_rows),'n_rows_with_distance_and_response':len(y),'excluded_rows':len(probe_rows)-len(y),'excluded_fraction':(len(probe_rows)-len(y))/len(probe_rows),
 'seed':392,'bootstrap_replicates':4000
}
out=ROOT/'analysis/perceptual-choice-regression.json';out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
