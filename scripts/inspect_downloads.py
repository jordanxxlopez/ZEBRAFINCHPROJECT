"""Verify original assets and inspect real headers without generating images."""
import hashlib
import io
import json
import sqlite3
import struct
import subprocess
import wave
import zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
def digest(path, algorithm='sha256'):
 h=hashlib.new(algorithm)
 with path.open('rb') as f:
  for block in iter(lambda:f.read(1024*1024),b''): h.update(block)
 return h.hexdigest()

assets=[]
mapping={'22107510':{'Zebra finch.zip':'data/raw/zebra-finch-atlas.zip'},'5545872':{'ML4BL_ZF.zip':'data/raw/ML4BL_ZF.zip'},'8187898':{'README.md':'data/raw/kv3-README.md','dryad_raw_data_jun_19_2023.xlsx':'data/raw/kv3-data.xlsx'},'13144875':{'segments.h5':'data/raw/birdpark-segments.h5','README.pdf':'data/raw/birdpark-README.pdf'}}
for record,files in mapping.items():
 meta=json.loads((ROOT/f'research/evidence/zenodo-{record}.json').read_text())
 for source in meta['files']:
  if source['key'] not in files:continue
  path=ROOT/files[source['key']]
  assert path.stat().st_size==source['size'],f'Incomplete {path}'
  algo,expected=source['checksum'].split(':')
  assert digest(path,algo)==expected,f'Checksum mismatch {path}'
  assets.append(dict(path=files[source['key']],source_url=source['links']['self'],record=f'https://zenodo.org/records/{record}',bytes=path.stat().st_size,sha256=digest(path),provider_checksum=source['checksum'],license=meta['metadata']['license']['id'],status='downloaded; provider checksum verified'))

movies=[]
for article,tail,credit,description in [
 ('01833','190/50dc9a740db174cc36bf449fd08fa35f0181fdfb','Hamaguchi et al. (2014)','Sharp intracellular recording from an identified HVC-X neuron in a singing male zebra finch'),
 ('07770','132/495963f23c62af9a0207d32ae77cfcc8b8b2759b','Gill et al. (2015)','Group-housed zebra finches with on-bird recording microphones')]:
 path=ROOT/f'media/original/elife-{article}-media1.mp4'
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(path)]))
 video=next(s for s in probe['streams'] if s['codec_type']=='video')
 movie=dict(path=str(path.relative_to(ROOT)),source_url=f'https://static-movie-usa.glencoesoftware.com/mp4/10.7554/{tail}/elife-{article}-media1.mp4',paper_doi=f'10.7554/eLife.{article}',movie_identifier='Video 1',credit=credit,description=description,sha256=digest(path),bytes=path.stat().st_size,width=video['width'],height=video['height'],codec=video['codec_name'],duration_seconds=float(probe['format']['duration']),audio=any(s['codec_type']=='audio' for s in probe['streams']),license='CC-BY; article license, retain original credit',transformations='none',validation='ffprobe metadata checked; desktop/browser playback not tested; scene description from publisher caption')
 movies.append(movie); assets.append(movie)
for article in ['01833','07770']:
 path=ROOT/f'research/evidence/elife-{article}.pdf'
 if path.exists():
  assert path.read_bytes().startswith(b'%PDF-')
  assets.append(dict(path=str(path.relative_to(ROOT)),source_url=f'https://elifesciences.org/articles/{article}.pdf',paper_doi=f'10.7554/eLife.{article}',sha256=digest(path),bytes=path.stat().st_size,license='CC-BY; see article copyright statement',review_status='Downloaded; file signature checked; selected online sections reviewed, not exhaustive PDF review'))
(ROOT/'media/manifest.json').write_text(json.dumps(movies,indent=2)+'\n')
(ROOT/'research/acquisition-manifest.json').write_text(json.dumps(assets,indent=2)+'\n')

with zipfile.ZipFile(ROOT/'data/raw/zebra-finch-atlas.zip') as z:
 assert z.testzip() is None
 headers=[]
 for name in z.namelist():
  if not name.endswith('.hdr'):continue
  data=z.read(name)
  endian='<' if struct.unpack('<i',data[:4])[0]==348 else '>'
  assert struct.unpack(endian+'i',data[:4])[0]==348
  dims=struct.unpack_from(endian+'8h',data,40);spacing=struct.unpack_from(endian+'8f',data,76)
  headers.append(dict(file=name,dimensions=list(dims[1:1+dims[0]]),pixdim=list(spacing[1:1+dims[0]]),datatype=struct.unpack_from(endian+'h',data,70)[0],bits=struct.unpack_from(endian+'h',data,72)[0],units_field=data[56:60].decode('ascii',errors='replace').strip('\0'),note='Analyze header only; orientation and units must be reconciled with original atlas documentation before anatomical measurements'))
 amira=z.read('Zebra finch/MRI/atlas.am').split(b'# Data section follows')[0].decode()
 (ROOT/'analysis/atlas-inspection.json').write_text(json.dumps(dict(files=z.namelist(),headers=headers,amira_header=amira,interpretation='Storage grid is resampled; grid extents are not brain anatomical dimensions. No tracts reconstructed.'),indent=2)+'\n')

recordings=[]
with zipfile.ZipFile(ROOT/'data/raw/ML4BL_ZF.zip') as z:
 assert z.testzip() is None
 for name in z.namelist():
  if not name.lower().endswith('.wav'):continue
  raw=z.read(name)
  with wave.open(io.BytesIO(raw)) as w:
   recordings.append(dict(archive_member=name,channels=w.getnchannels(),sample_rate=w.getframerate(),frames=w.getnframes(),sample_width_bytes=w.getsampwidth(),duration_seconds=w.getnframes()/w.getframerate(),sha256=hashlib.sha256(raw).hexdigest()))
(ROOT/'analysis/audio-inventory.json').write_text(json.dumps(recordings,indent=2)+'\n')
db=sqlite3.connect(ROOT/'research/catalog/catalog.sqlite')
db.execute('DROP TABLE IF EXISTS recordings')
db.execute('CREATE TABLE recordings (archive_member TEXT PRIMARY KEY, channels INTEGER, sample_rate INTEGER, frames INTEGER, sample_width_bytes INTEGER, duration_seconds REAL, sha256 TEXT, source_id TEXT REFERENCES sources(id))')
db.executemany('INSERT INTO recordings VALUES (?,?,?,?,?,?,?,?)',[list(r.values())+['ml4bl'] for r in recordings]);db.commit();db.close()
summary=dict(verified_assets=len(assets),wav_files=len(recordings),sample_rates=sorted({r['sample_rate'] for r in recordings}),total_audio_seconds=sum(r['duration_seconds'] for r in recordings),atlas_headers=len(headers),movies=len(movies))
(ROOT/'analysis/inspection-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary,indent=2))
