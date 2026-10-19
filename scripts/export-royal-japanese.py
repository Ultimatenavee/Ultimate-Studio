"""Extract one complete Amatsu keep, without mixing architectural fragments."""
import sys, json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
cfg = json.loads((root / 'scripts/ayothaya-local.json').read_text(encoding='utf8'))
sys.path.insert(0, cfg['ragx'])
from ragx.client import open_stack
from ragx.map_builder import MapBuilder, AssetSource

class EmbeddedBuilder(MapBuilder):
    def _material_factory(self, builder, sampler, stats, external_textures=False, uri_base=None):
        return super()._material_factory(builder, sampler, stats, False, uri_base)
    def _write_output(self, builder, out_path, external_textures):
        return super()._write_output(builder, out_path, False)

out = root / 'artifacts/royal-temple-candidates'
out.mkdir(parents=True, exist_ok=True)
builder = EmbeddedBuilder(AssetSource(open_stack(cfg['client'])), world_scale=.05)
print(builder.build_model_gltf(r'일본\일본_천수각1.rsm', out / 'japanese-castle1.glb', str(out)))
