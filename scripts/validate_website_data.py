"""Check exported original media, volume sizes, geometry and database integrity."""
import gzip, hashlib, json, math, sqlite3, struct
from pathlib import Path
root=Path(__file__).resolve().parents[1];site=root/'website/dist'
records=json.loads((site/'data/recordings.json').read_text())
assert len(records)==887
for r in records:
 assert hashlib.sha256((site/r['url']).read_bytes()).hexdigest()==r['sha256'],r['name']
for src in (root/'media/original').glob('*.mp4'):
 assert src.read_bytes()==(site/'assets'/src.name).read_bytes()
for name in ['atlas-volume','atlas-labels']:
 assert len(gzip.decompress((site/f'data/{name}.bin.gz').read_bytes()))==256**3
meshes=json.loads((site/'data/atlas-meshes.json').read_text())
assert len(meshes)==14
for m in meshes:
 v=m['vertices'];f=m['faces']
 assert len(v)%3==len(f)%3==0
 assert all(math.isfinite(x) and 0<=x<=20.48 for x in v)
 assert min(f)>=0 and max(f)<len(v)//3
for p in (root/'analysis/corrected-atlas').glob('*.hdr'):
 assert all(abs(x-.08)<1e-7 for x in struct.unpack_from('<3f',p.read_bytes(),80))
with sqlite3.connect(site/'data/catalog.sqlite') as db:
 assert db.execute('pragma integrity_check').fetchone()[0]=='ok'
 assert db.execute('select count(*) from recordings').fetchone()[0]==887
print('PASS: 887 WAV hashes, original MP4 copies, two 256³ volumes, 14 meshes, corrected headers and SQLite')
