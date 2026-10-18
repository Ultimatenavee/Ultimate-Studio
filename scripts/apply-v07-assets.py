from pathlib import Path
import json,shutil
from PIL import Image
root=Path(__file__).resolve().parents[1];scratch=Path('/workspace/scratch/7360d1d45af5')
s=(root/'web/catalog.js').read_text();catalog=json.loads(s.removeprefix('window.NOAH_CATALOG=').strip().removesuffix(';'))
manifest=[]
for folder in ['assets-v07-huawei','assets-v07-apresia','assets-v07-extra']:
 f=scratch/folder/'manifest.json'
 if not f.exists():continue
 entries=json.loads(f.read_text());entries=entries.get('assets',entries) if isinstance(entries,dict) else entries
 for e in entries:
  model=e['model'].lower();m=next((m for m in catalog if m['model'].lower()==model),None)
  if not m:raise ValueError(model)
  src=Path(e.get('path') or e.get('assetpath') or e.get('asset_path'));original=root/'research/generated-originals-v07'/src.name;original.parent.mkdir(exist_ok=True);shutil.copy2(src,original);old=root/'web'/m['displayImage'];m['displayImage']='assets/'+m['id']+'-illustration-v07.webp';m['thumbnail']=m['displayImage'];dest=root/'web'/m['displayImage'];Image.open(src).save(dest,format='WEBP',lossless=True,method=6,exact=True);assert Image.open(src).convert('RGBA').tobytes()==Image.open(dest).convert('RGBA').tobytes();
  if old.suffix=='.png' and old.exists():old.unlink()
  im=Image.open(dest);assert 'A' in im.getbands() and im.getchannel('A').getextrema()==(0,255)
  alpha=im.getchannel('A');bounds=e.get('alpha_bounds_128') or alpha.point(lambda x:255 if x>=128 else 0).getbbox();x,y,r,b=bounds
  m['displayDimensions']={'width':im.width,'height':im.height};m['displayFrame']=[x,y,r-x,b-y];m['thumbnailDimensions']=m['displayDimensions'];m['thumbnailFrame']=m['displayFrame']
  m['displayIllustrative']=True
  if m['brand']=='Hitachi':
   ref=Path(e['vendorrefpath']);rd=root/'web/assets'/(m['id']+'-reference.jpg');shutil.copy2(ref,rd);m['images']={'front':'assets/'+rd.name};m['photos']=m['images'].copy()
  manifest.append({**e,'selectedAsset':m['displayImage'],'originalAsset':str(original.relative_to(root)),'deliveryEncoding':'lossless WebP, identical RGBA verified','frame':m['displayFrame']})
(root/'web/catalog.js').write_text('window.NOAH_CATALOG='+json.dumps(catalog,ensure_ascii=False,separators=(',',':'))+';\n')
(root/'research/generated-device-art-v07.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Applied',len(manifest),'original generated assets')
