"""Mirror the static website to GitHub Pages' configured /docs publishing folder."""
from pathlib import Path
import shutil
root=Path(__file__).resolve().parents[1]
source=root/'website/dist';target=root/'docs'
shutil.copytree(source,target,dirs_exist_ok=True)
print('Copied website/dist to docs; source assets and metadata preserved.')
