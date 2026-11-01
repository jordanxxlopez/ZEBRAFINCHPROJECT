"""Download pinned public assets and verify hashes; does not run source code."""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
for asset in json.loads((ROOT/'research/acquisition-manifest.json').read_text()):
 path=ROOT/asset['path']
 path.parent.mkdir(parents=True,exist_ok=True)
 if path.exists() and hashlib.sha256(path.read_bytes()).hexdigest()==asset['sha256']:
  print('Verified existing',asset['path']);continue
 temporary=path.with_suffix(path.suffix+'.part')
 subprocess.run(['curl','--http1.1','--location','--fail','--retry','2','--max-time','900',asset['source_url'],'--output',str(temporary)],check=True)
 checksum=hashlib.sha256(temporary.read_bytes()).hexdigest()
 if checksum!=asset['sha256']:
  raise ValueError(f'Source changed or download damaged: {asset["path"]}; retained .part for inspection')
 temporary.replace(path)
 print('Downloaded and verified',asset['path'])
