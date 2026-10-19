"""Export candidates and original decorations from the configured local RO client."""
import sys,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
cfg=json.loads((root/'scripts/ayothaya-local.json').read_text(encoding='utf8'))
sys.path.insert(0,cfg['ragx'])
from ragx.client import open_stack
from ragx.map_builder import MapBuilder,AssetSource
class EmbeddedBuilder(MapBuilder):
 def _material_factory(self,builder,sampler,stats,external_textures=False,uri_base=None):return super()._material_factory(builder,sampler,stats,False,uri_base)
 def _write_output(self,builder,out_path,external_textures):return super()._write_output(builder,out_path,False)
out=root/'artifacts/royal-temple-candidates';out.mkdir(parents=True,exist_ok=True)
builder=EmbeddedBuilder(AssetSource(open_stack(cfg['client'])),world_scale=.05)
models={'malaya-temple':r'pud\pud_temple.rsm','dewata-borobudur':r'dewata\보르부두01.rsm','dewata-borobudur2':r'dewata\보르부두02.rsm','ayothaya-sanctuary':r'아요타야\던전입구.rsm','ayothaya-sanctuary2':r'아요타야\던전입구02.rsm','ayothaya-sanctuary3':r'아요타야\던전입구03.rsm','altar':r'아요타야\사원단상.rsm','column':r'아요타야\기둥.rsm','offering':r'아요타야\장식품.rsm'}
for key,name in models.items():
 print(key,builder.build_model_gltf(name,out/(key+'.glb'),str(out)),flush=True)
(out/'sources.json').write_text(json.dumps(models,ensure_ascii=False,indent=2),encoding='utf8')
dest=root/'web/assets/sirin/royal-temple';dest.mkdir(parents=True,exist_ok=True)
for source,target in [('ayothaya-sanctuary','exterior'),('altar','altar')]:
 (dest/(target+'.glb')).write_bytes((out/(source+'.glb')).read_bytes())
