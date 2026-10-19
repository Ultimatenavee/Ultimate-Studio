SIRIN Royal Ubosot — 2026-10-19

Exterior: original Ragnarok Online data/model/아요타야/던전입구.rsm (Ayothaya sanctuary entrance), exported from the local client with ragx. This is distinct from data/model/아요타야/사원.rsm used for the original Device Library temple. It replaces only the royal-axis INN placement A02_Inn_016 at world (0, -137). The original geometry is uniformly enlarged to 52 m depth (~40.9 m wide, ~32.5 m tall); the old INN was 37 m wide. This is an enlarged existing game asset, not a newly discovered larger native model. Door trim, signage and the interior arrangement are authored in code.

altar.glb: data/model/아요타야/사원단상.rsm.
buddha.glb: web-optimized copy of the user's supplied Buddha.glb. Original 78,127,092 bytes, 1,500,000 triangles; exported version 4,766,888 bytes, 90,000 triangles with embedded <=2048px textures. The original Desktop file is not modified. Original artwork ownership is not asserted by this project.

Interior reuses bundled RO temple-wood, temple-mural and temple-carpet textures, Ayothaya urn/plant/brazier props, and L241 Ayothaya chandeliers. Six L047 stone lanterns supplement the exterior's fixed night illumination. These game assets retain their original provenance; no claim of original Ragnarok artwork ownership is made.

Implementation: src/datacenter/royal-temple.js, royal-temple-layout.js and royal-prayer.js. Interior assets are fetched on entry, not during startup. Fully static-hostable; visitors need neither a Ragnarok installation nor a local API.

Rebuild candidate extraction: configure ignored scripts/ayothaya-local.json with client/ragx paths, then run scripts/export-royal-temple.py with NumPy/Pillow available. The script copies the two selected models into this folder. Build the supplied Buddha separately using Blender --background --python scripts/prepare-royal-buddha.py. No existing live Blender document is edited.

Prayer: approach the rug in front of the altar, press E or tap the prayer button. Existing sitting posture is used during a short prayer dialog; this does not add a new hand/arm animation. A cryptographic, rejection-sampled six-digit string is shown, including leading zeroes. No lottery prediction, payment or rewards are involved. Escape/close restores posture and cancels an unfinished draw.

Checks: node scripts/verify-royal-temple.mjs; node scripts/verify-royal-temple-browser.cjs; npm test. Responsive screenshots exercise phone and tablet portrait/landscape viewports in Edge, not physical iOS hardware.
