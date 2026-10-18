"""Inventory local Ragnarok lighting models, without modifying the game or map."""
import sys,json,re,argparse,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--export',action='store_true');args=p.parse_args()
root=Path(__file__).resolve().parents[2]
settings=json.loads((root/'scripts/ayothaya-local.json').read_text(encoding='utf8'))
sys.path.insert(0,settings['ragx'])
from ragx.client import open_stack
a=open_stack(settings['client']);names=sorted(a.namelist())
models=[s for s in names if s.lower().endswith(('.rsm','.rsm2'))]
pattern=re.compile(r'lantern|lamp|light|torch|candle|candel|chandelier|brazier|bonfire|firepit|fireplace|가로등|등불|전등|조명|촛|횃|화로|모닥|램프|샹들|등|전봇대|전신주|utilitypole|powerpole',re.I)
matches=[s for s in models if pattern.search(s.rsplit('\\',1)[-1])]
out=root/'web/assets/ayothaya/light-catalog';out.mkdir(parents=True,exist_ok=True)
items=[]
for i,s in enumerate(matches,1):items.append({'id':f'L{i:03}','source':s,'name':s.rsplit('\\',1)[-1],'region':s.split('\\')[-2],'file':f'L{i:03}.glb'})
manifest={'scannedModels':len(models),'scannedFiles':len(names),'items':items}
(out/'inventory.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'models':len(models),'files':len(names),'candidates':len(items)},ensure_ascii=False),flush=True)
if args.export:
 from ragx.map_builder import MapBuilder,AssetSource
 class EmbeddedBuilder(MapBuilder):
  def _material_factory(self,builder,sampler,stats,external_textures=False,uri_base=None):return super()._material_factory(builder,sampler,stats,False,uri_base)
  def _write_output(self,builder,out_path,external_textures):return super()._write_output(builder,out_path,False)
 builder=EmbeddedBuilder(AssetSource(a),world_scale=.05)
 for item in items:
  try:
   dest=out/item['file']
   if not dest.exists():
    stats=builder.build_model_gltf(item['source'].removeprefix('data\\model\\'),dest,str(out))
    if stats is None:raise ValueError('Unsupported model')
   item['bytes']=dest.stat().st_size
  except Exception as e:item['error']=str(e)
  print(item['id'],item.get('error','OK'),flush=True)
 (out/'inventory.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
