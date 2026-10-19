SIRIN Royal Ubosot — 2026-10-19

Active exterior: royal-palace.glb, an original arrangement assembled in Blender from Ragnarok Online data/model/중국/중국-궁전.rsm (gilded palace) and cropped roof geometry from data/model/아요타야/여관.rsm (Ayothaya). New annex walls and trim reuse the original RO plaster/bronze/warm texture crops recorded in assets/sirin/labs/texture-provenance.json. It does not reuse the Hall's data/model/아요타야/사원.rsm. The royal-axis INN A02_Inn_016 at world (0, -137) is replaced only inside its parcel. Footprint is approximately 48 x 52 m, height 35 m. Original game surface artwork remains attributed to Ragnarok Online / Gravity.

Editable authoring: assets-source/royal-temple/sirin-royal-palace.blend. Export is self-contained GLB, WebP textures, Meshopt geometry; about 271 KB. scripts/export-royal-palace-candidates.py extracts source models; scripts/build-royal-palace.py composes the building in a separate Blender background process. Optimize artifacts/royal-temple-candidates/royal-palace-raw.glb using @gltf-transform/cli@4.5.1 optimize with --compress meshopt --flatten false --join false --palette false --simplify false --texture-compress webp --texture-size 1024.

altar.glb: data/model/아요타야/사원단상.rsm.
kamakura-buddha.glb: web-optimized copy of the user's supplied Kamakura Buddha.glb. Original 89,782,832 bytes / 1,500,000 triangles; shipped 4,910,000 bytes / 89,999 triangles with embedded <=2048px textures. The original Desktop file is not modified. Original artwork ownership is not asserted by this project. Scripts/prepare-royal-buddha.py reproduces this export in Blender.

Legacy exterior.glb and buddha.glb remain for previously cached clients, but are no longer loaded by the current scene. The stone sanctuary exterior was replaced because scale alone did not provide the requested ceremonial grandeur.

Interior reuses bundled RO temple-wood, temple-mural and temple-carpet textures, Ayothaya urn/plant/brazier props, and L241 Ayothaya chandeliers. Six L047 stone lanterns supplement the exterior's fixed night illumination. These game assets retain their original provenance; no claim of original Ragnarok artwork ownership is made.

Implementation: src/datacenter/royal-temple.js, royal-temple-layout.js and royal-prayer.js. Interior assets are fetched on entry, not during startup. Fully static-hostable; visitors need neither a Ragnarok installation nor a local API.

Rebuild candidate extraction: configure ignored scripts/ayothaya-local.json with client/ragx paths, then run scripts/export-royal-temple.py with NumPy/Pillow available. The script copies the two selected models into this folder. Build the supplied Buddha separately using Blender --background --python scripts/prepare-royal-buddha.py. No existing live Blender document is edited.

Prayer: approach the rug in front of the altar, press E or tap the prayer button. Existing sitting posture is used during a short prayer dialog; this does not add a new hand/arm animation. A cryptographic, rejection-sampled six-digit string is shown, including leading zeroes. No lottery prediction, payment or rewards are involved. Escape/close restores posture and cancels an unfinished draw.

Checks: node scripts/verify-royal-temple.mjs; node scripts/verify-royal-temple-browser.cjs; npm test. Responsive screenshots exercise phone and tablet portrait/landscape viewports in Edge, not physical iOS hardware.
