"""Derive web assets from verified originals; no synthetic biological data."""
import gzip, hashlib, json, re, shutil, struct, zipfile
from pathlib import Path
import numpy as np
from skimage.measure import marching_cubes

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'website/dist'
DATA=OUT/'data';DATA.mkdir(parents=True,exist_ok=True)
SPACING=.08
def sha(b):return hashlib.sha256(b).hexdigest()
def unpack_amira(data, kind):
 header,raw=data.split(b'\n@1\n',1)
 if kind=='short':return np.frombuffer(raw[:256**3*2],dtype='>i2').reshape(256,256,256)
 decoded=bytearray();i=0
 while len(decoded)<256**3:
  count=raw[i];i+=1
  if count&128:
   count &=127;decoded.extend(raw[i:i+count]);i+=count
  else:decoded.extend(bytes([raw[i]])*count);i+=1
 assert len(decoded)==256**3
 return np.frombuffer(decoded,dtype='u1').reshape(256,256,256)

with zipfile.ZipFile(ROOT/'data/raw/zebra-finch-atlas.zip') as z:
 original=z.read('Zebra finch/MRI/atlas.hdr')
 spacing=struct.unpack_from('<3f',original,80)
 assert all(abs(s-.8)<1e-5 for s in spacing)
 am=z.read('Zebra finch/MRI/atlas.am')
 bounds=[float(x) for x in re.search(rb'BoundingBox ([0-9. ]+)',am).group(1).split()]
 assert all(abs((bounds[2*i+1]-bounds[2*i])/255-SPACING)<1e-10 for i in range(3))
 arrays={}
 for name,kind in [('atlas','short'),('brain_delineations','byte'),('nuclei_delineations','byte')]:
  a=np.frombuffer(z.read(f'Zebra finch/MRI/{name}.img'),dtype='<i2' if kind=='short' else 'u1').reshape(256,256,256)
  b=unpack_amira(z.read(f'Zebra finch/MRI/{name}.am'),kind)
  assert np.array_equal(a,b[:,::-1,::-1]),f'Cross-format mismatch: {name}'
  arrays[name]=a
  # A corrected derivative, never an overwrite. No stereotaxic origin is claimed.
  fixed=bytearray(z.read(f'Zebra finch/MRI/{name}.hdr'))
  struct.pack_into('<3f',fixed,80,SPACING,SPACING,SPACING);fixed[56:60]=b'mm\0\0'
  target=ROOT/'analysis/corrected-atlas';target.mkdir(exist_ok=True)
  (target/f'{name}.hdr').write_bytes(fixed)
  if name=='atlas':(target/'atlas-header-change.json').write_text(json.dumps({'original_sha256':sha(original),'corrected_sha256':sha(fixed),'changed_fields':{'pixdim[1:4]':{'from':list(spacing),'to':[SPACING]*3},'vox_units':{'from':'','to':'mm'}},'unchanged_image_sha256':sha(z.read('Zebra finch/MRI/atlas.img'))},indent=2))
 brain=arrays['brain_delineations']>0
 intensity=arrays['atlas'];labels=arrays['nuclei_delineations']
 lo,hi=np.percentile(intensity[brain],[.5,99.5])
 display=np.clip((intensity.astype(float)-lo)/(hi-lo)*255,0,255).astype('u1');display[~brain]=0
 for name,a in [('atlas-volume',display),('atlas-labels',labels)]:
  with (DATA/(name+'.bin.gz')).open('wb') as f:
   with gzip.GzipFile(fileobj=f,mode='wb',mtime=0) as g:g.write(a.tobytes())
 names=['Exterior','Field L','HVC','Area X','RA','Entopallium','LMAN','MLd','DLM','Ovoidalis','Olfactory bulb','nXIIts','Rotundus','Optic tectum']
 colors=['#000000','#d0a45b','#6aa6b8','#bb775b','#9a819c','#9fa768','#769680','#bb9185','#8297ae','#bead72','#859b96','#b28b6b','#8c969f','#8ba5ae']
 regions=[];meshes=[]
 for label in range(14):
  mask=brain if label==0 else labels==label
  coords=np.argwhere(mask)
  # Coordinates below are grid x,y,z in mm, not surgical coordinates.
  bound=np.stack((coords.min(0),coords.max(0)))[:,::-1]
  region=dict(id=label,name='Whole brain' if label==0 else names[label],color='#c7c6bf' if label==0 else colors[label],voxel_count=int(mask.sum()),volume_mm3=round(float(mask.sum())*SPACING**3,5),bounds_mm=(bound*SPACING).round(4).tolist(),extent_mm=((bound[1]-bound[0]+1)*SPACING).round(4).tolist())
  regions.append(region)
  vertices,faces,_,_=marching_cubes(mask.astype('u1'),level=.5,spacing=(SPACING,)*3,step_size=2 if label==0 else 1,allow_degenerate=False)
  # Axis permutation reverses handedness; reverse face winding too.
  meshes.append(dict(id=label,vertices=vertices[:,::-1].round(4).ravel().tolist(),faces=faces[:,::-1].ravel().tolist()))
 report=dict(status='Physical scale resolved; absolute stereotaxic origin not asserted',source='https://doi.org/10.1016/j.neuroimage.2008.01.069',paper_evidence='MR image acquisition: 20.48 mm field of view, 256 cubed interpolated matrix, 80 micrometre isotropic output voxels',author_fulltext='https://www.researchgate.net/publication/5493147_A_three-dimensional_MRI_atlas_of_the_zebra_finch_brain_in_stereotaxic_coordinates',spacing_mm=SPACING,dimensions=[256]*3,original_acquisition_micrometres=[80,160,160],storage_spacing_micrometres=[80]*3,field_of_view_mm=[20.48]*3,voxel_center_span_mm=[20.4]*3,analyze_original_spacing=list(spacing),correction_factor=.1,units='mm',cross_format_validation='All intensity and label voxels equal after Amira x/y flips; original images unchanged',coordinates='Analyze storage-grid x,y,z, origin at first voxel centre; anatomical axis signs and posterior commissure origin not assigned',label_mapping='Encoded label values follow material order (Exterior=0); header Id attributes are not voxel values',display_window=[float(lo),float(hi)],regions=regions,mesh_method='Marching cubes at level 0.5; whole-brain step 2, nuclei step 1; no smoothing; source-mask volumes computed before meshing')
 (ROOT/'analysis/atlas-scale-resolution.json').write_text(json.dumps(report,indent=2)+'\n')
 (DATA/'atlas.json').write_text(json.dumps(report,separators=(',',':')))
 (DATA/'atlas-meshes.json').write_text(json.dumps(meshes,separators=(',',':')))

with zipfile.ZipFile(ROOT/'data/raw/ML4BL_ZF.zip') as z:
 records=json.loads((ROOT/'analysis/audio-inventory.json').read_text());dest=OUT/'assets/audio';dest.mkdir(exist_ok=True)
 for r in records:
  filename=Path(r['archive_member']).name
  (dest/filename).write_bytes(z.read(r['archive_member']))
  r['url']='assets/audio/'+filename;r['name']=filename[:-4]
 (DATA/'recordings.json').write_text(json.dumps(records,separators=(',',':')))
for src,dest in [('research/catalog/sources.json','data/sources.json'),('research/acquisition-manifest.json','data/acquisition-manifest.json'),('media/manifest.json','data/videos.json'),('research/catalog/catalog.sqlite','data/catalog.sqlite')]:shutil.copyfile(ROOT/src,OUT/dest)
for movie in (ROOT/'media/original').glob('*.mp4'):shutil.copyfile(movie,OUT/'assets'/movie.name)
print(json.dumps({'regions':len(regions),'whole_brain':regions[0],'recordings':len(records),'cross_format_checks':'passed'},indent=2))
