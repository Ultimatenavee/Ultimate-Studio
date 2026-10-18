# Buddha authoring (current: original carved v108 sculpt)

Editable master: `assets-source/sculpt/buddha-master.blend`.
Walking/detail runtime assets: `web/assets/sculpt/buddha-{walking,detail}.glb`.

## Current rebuild — new head and body

Use Node with the repo dependencies, and Python 3.11 with `bpy==4.5.3`:

```sh
node tools/sculpt/export-seed.mjs /tmp/buddha-hands.json --hands-only
python tools/sculpt/sculpt-vairocana.py --hands /tmp/buddha-hands.json --out /tmp/buddha-draft --preview /tmp/buddha-draft-review --draft-only
python tools/sculpt/polish-vairocana.py --master /tmp/buddha-draft/buddha-master.blend --out /tmp/buddha-build --preview /tmp/buddha-review
```

Only two watertight anatomical hand surfaces are reused. The new script builds
its own head, facial features, eyes, ears, neck, scalp/curls, torso, sleeves,
forearms, folded legs, robe folds, lotus and aureole. It does not import the old
head or body. The new coordinates deliberately change mass and silhouette, not
just the material. Photograph reference remains an artistic interpretation,
not a surveyed/scan-derived reconstruction; unseen ornament is interpreted.

Inspect front, three-quarter, face, hands and neutral-clay frames before replacing
assets. Both detail and walking versions must pass `verify-buddha-glb.mjs`.
Approved outputs go to the paths above. Reference photography and Blender backups
must not be committed or shipped. `build-buddha.py` retains the v104 workflow for
historical reproducibility; it is not the current authoring path.

## Neutral geometry comparison

```sh
python tools/sculpt/compare-vairocana.py --old /tmp/v104.glb --new /tmp/buddha-build/buddha-detail.glb --out /tmp/geometry-comparison.png
```

## Checks

```sh
node scripts/verify-buddha-glb.mjs
node scripts/verify-buddha-assets.mjs
node scripts/verify-anatomical-hands.mjs
node scripts/verify-temple-visit.mjs
node scripts/verify-simulator-scene.mjs --first-person-only
node scripts/verify-campus-menu.mjs
node scripts/verify-simulator-scene.mjs --campus-only
node scripts/build-worker.mjs
```

Assets load only near the temple, with native fallback on failure. Performance/low
quality uses walking geometry; other qualities request detail below 11 m and
return to walking beyond 13 m. The nearby prayer control reports loading/failure
instead of silently presenting the old fallback as the new sculpt. All textures
and geometry are local; no external 3D service is called by the application.

## v107 refinement

New facial planes taper the jaw and cheek outline; eyes are recessed apertures
under integrated eyelids instead of detached lens plates. The nasal bridge,
closed smile, ear concha, shoulder transitions, robe tension paths and knee
folds are re-sculpted. The original procedural normal texture is embedded in
both GLBs and in the editable Blender master. It contains no source photographs.

The first stage supports `--quick` for draft review or `--draft-only` to skip
draft renders. The finishing stage softens sleeve roots, exports both LODs
and renders front, three-quarter, face, hands, profile and neutral clay.
Comparison labels are selectable with `--old-label v105 --new-label v107`.
This remains an artistic interpretation for the Japanese hall; it is not a
historically exact Todaiji reconstruction or a museum photogrammetry scan.


## v108 original carved garment and pedestal

After generating the v107 master using the two stages above, run:

```sh
python tools/sculpt/carve-drapery.py --master /tmp/buddha-build/buddha-master.blend --out /tmp/buddha-carved --preview /tmp/buddha-carved-review
```

`--quick` renders the front, three-quarter and carved pedestal for initial QA.
The script authors the garment tension folds, hanging/bent sleeves and thick
lotus relief from original vertices. It unions the overlapping sculpture
surfaces, retopologizes them for web use, then exports a separate walking LOD.
The face and anatomical hands remain the v107 meshes. No geometry or textures
from the Meshy quality reference are embedded or downloaded.
