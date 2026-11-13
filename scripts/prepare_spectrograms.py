"""Render genuine source WAVs as relative-level spectrograms using SciPy STFT.

These are computational displays of measured audio, not generated biological
imagery. First channel; Hann window; 512-point FFT; 128-sample hop; 0–12 kHz
(or Nyquist when lower); boundary zero padding; -80..0 dB relative to clip peak.
The original recordings are not modified. Frame averages limit long recordings
to 640 columns; frequency bins are not resampled.
"""
from pathlib import Path
import json,warnings
import numpy as np
from scipy.io import wavfile
from scipy.signal import stft
from PIL import Image
import matplotlib
CMAP=matplotlib.colormaps['magma']
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'website/dist'
records=json.loads((OUT/'data/recordings.json').read_text())+json.loads((OUT/'data/marine-recordings.json').read_text())
dest=OUT/'assets/spectrograms';dest.mkdir(exist_ok=True);meta={}
for r in records:
 with warnings.catch_warnings():
  warnings.simplefilter('ignore',wavfile.WavFileWarning)
  fs,x=wavfile.read(OUT/r['url'])
 if x.ndim>1:x=x[:,0]
 x=x.astype(np.float64);n=min(512,len(x));hop=min(128,n)
 f,t,z=stft(x,fs=fs,window='hann',nperseg=n,noverlap=n-hop,nfft=512,boundary='zeros',padded=True)
 keep=f<=min(12000,fs/2);a=np.abs(z[keep]);reference=float(a.max())
 db=20*np.log10(np.maximum(a/reference,1e-8)) if reference else np.full_like(a,-80)
 if db.shape[1]>640:
  edges=np.linspace(0,db.shape[1],641).astype(int);db=np.stack([db[:,edges[i]:edges[i+1]].mean(1) for i in range(640)],axis=1)
 pixels=np.round(np.clip((db+80)/80,0,1)*255).astype('uint8')[::-1]
 name=r['name'];path=dest/(name+'.png');Image.fromarray((CMAP(pixels/255.0)[...,:3]*255).astype('uint8')).save(path,optimize=True)
 meta[name]={'url':str(path.relative_to(OUT)),'source_sha256':r['sha256'],'sample_rate':fs,'duration_seconds':r['duration_seconds'],'time_end_seconds':float(t[-1]),'frequency_max_hz':float(f[keep][-1]),'fft_size':512,'window_samples':n,'hop_samples':hop,'channel':0,'level_range_db':[-80,0],'level_reference':'peak STFT magnitude of this recording; not calibrated sound pressure','boundary':'zero padding','display_size':[pixels.shape[1],pixels.shape[0]]}
(OUT/'data/spectrograms.json').write_text(json.dumps(meta,separators=(',',':'))+'\n')
print(f'Rendered {len(meta)} source-based spectrograms; original WAV files untouched.')
