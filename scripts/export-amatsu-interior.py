"""Extract original Amatsu furniture and interior surfaces for the Buddha hall."""
import sys,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
cfg=json.loads((root/'scripts/ayothaya-local.json').read_text(encoding='utf8'))
sys.path.insert(0,cfg['ragx'])
from ragx.client import open_stack
from ragx.map_builder import MapBuilder,AssetSource
from ragx.textures import convert_texture
from ragx.formats.gnd import parse
class EmbeddedBuilder(MapBuilder):
 def _material_factory(self,builder,sampler,stats,external_textures=False,uri_base=None):return super()._material_factory(builder,sampler,stats,False,uri_base)
 def _write_output(self,builder,out_path,external_textures):return super()._write_output(builder,out_path,False)
out=root/'artifacts/royal-temple-candidates';out.mkdir(parents=True,exist_ok=True)
textures=root/'assets-source/royal-temple/amatsu-textures';textures.mkdir(parents=True,exist_ok=True)
stack=open_stack(cfg['client']);builder=EmbeddedBuilder(AssetSource(stack),world_scale=.05)
models={
 'amatsu-column':r'일본\일본_내부기둥.rsm','amatsu-teacup':r'일본\일본_내부찻잔.rsm',
 'amatsu-shoji1':r'일본\일본_다다미문1.rsm','amatsu-shoji2':r'일본\일본_다다미문2.rsm','amatsu-shoji3':r'일본\일본_다다미문3.rsm',
 'amatsu-vase':r'일본\일본_도자기1.rsm','amatsu-bonsai':r'일본\일본_분재.rsm','amatsu-table':r'일본\일본_술상.rsm',
 'amatsu-jar':r'일본\일본_항아리.rsm','japanese-screen':r'히나마쯔리\일본병풍.rsm',
 'japanese-lantern':r'히나마쯔리\일본등.rsm','japanese-cushion':r'히나마쯔리\일본방석.rsm'
}
for key,name in models.items():
 stats=builder.build_model_gltf(name,out/(key+'.glb'),str(out))
 if stats.missing_textures or stats.model_errors:raise RuntimeError(str(stats))
 print(key,stats,flush=True)
surfaces={name:fr'data\texture\기타마을내부\{name}.bmp' for name in ['japan_bottom01','japan_bottom02','japan_door01','japan_door02','japan_door03','japan_in01','japan_in02','japan_in03','japan_in04']}
for name,source in surfaces.items():(textures/(name+'.png')).write_bytes(convert_texture(stack.read(source),source).png)
provenance={'models':models,'textures':surfaces,'mapTextures':{name:parse(stack.read('data\\'+name+'.gnd')).textures for name in ['ama_in01','ama_in02']},'note':'Amatsu original furniture/surfaces, supplemented by Japanese Hinamatsuri screen, lantern and cushion. No Thai interior props.'}
(root/'assets-source/royal-temple/amatsu-interior-sources.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2),encoding='utf8')
print('Extracted surfaces and map provenance',flush=True)
