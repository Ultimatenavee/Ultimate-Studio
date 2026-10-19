SIRIN Kamakura Buddha Hall — 2026-10-19

Active exterior: japanese-keep.glb. A single complete Ragnarok Online Amatsu keep, data/model/일본/일본_천수각1.rsm. No roof swapping, annex kitbashing, temple spires or independently stretched building parts. Original stone base, lateral stairs, timber/plaster facade, tiled roof tiers and ridge ornaments remain together. The previous Chinese/Ayothaya palace composition is no longer instantiated. The Device Library Hall is unchanged.

Design: a Japanese castle-form building housing the existing Buddha hall through a warp. This is explicitly a castle exterior, not a historically reconstructed Buddhist temple. Reference for the real-world architectural type: https://www.himejicastle.jp/en/guide/history/ (timber keep on stone foundation). The RO artwork is stylized, not a measured replica or structurally certified model. Original game surface artwork remains attributed to Ragnarok Online / Gravity.

One uniform transform produces 38.432 x 44 x 40.724 metres (width/height/depth). Original stair-front Z=-111. The warp sits at the right-hand stair foot (14.6,-113.2); exit returns visitors to (14.6,-107.4). Collision follows the stone base and raised stair podium; paths at X=20 and behind Z=-156 remain accessible. A small grounded timber information board replaces the previous suspended facade plaque. Six L266 Amatsu lanterns use the existing fixed night-light field.

Editable authoring: assets-source/royal-temple/sirin-japanese-keep.blend. Extraction: scripts/export-royal-japanese.py, configured by ignored scripts/ayothaya-local.json. Preparation: Blender --background --python scripts/prepare-royal-japanese.py. The script creates an empty scene in a separate Blender process and applies only uniform scaling, ground/centre alignment and texture packing. It does not edit the user's live Blender document.

Optimize artifacts/royal-temple-candidates/japanese-keep-raw.glb into web/assets/sirin/royal-temple/japanese-keep.glb with @gltf-transform/cli@4.5.1 optimize --compress meshopt --flatten false --join false --palette false --simplify false --texture-compress webp --texture-size 1024. Shipped: 241,096 bytes, 978 triangles, 10 material draws, embedded textures. Dimensions/provenance are in japanese-keep-build.json.

kamakura-buddha.glb: optimized copy of the user's supplied Kamakura Buddha.glb. Original 89,782,832 bytes / 1,500,000 triangles; shipped 4,910,000 bytes / 89,999 triangles with embedded <=2048px textures. User source unchanged. scripts/prepare-royal-buddha.py reproduces the export. Original artwork ownership is not asserted by this project.

Interior and activities are retained: RO temple wood/mural/carpet, altar (data/model/아요타야/사원단상.rsm), Ayothaya decorations and L241 chandeliers. Prayer uses the existing seated posture; it does not introduce a hand/arm animation. Press E near the altar or tap the prayer button for a six-digit random string (including leading zeroes); Escape/close restores posture. No lottery prediction, payment or rewards. Interior remains lazy-loaded and works without a local Ragnarok client.

Legacy exterior.glb, royal-palace.glb and buddha.glb are retained for older cached clients only. The current scene never loads these retired exteriors. Previous Blender authoring files remain as historical source, not active scene objects.

Checks: node scripts/verify-royal-temple.mjs; node scripts/verify-royal-temple-browser.cjs. Browser screenshots exercise walking warp in/out, night/day, Kamakura/prayer and phone/iPad portrait/landscape viewport layouts in Edge (not physical iOS hardware).
