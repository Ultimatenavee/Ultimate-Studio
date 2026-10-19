# SIRIN research quarter

Three original Blender building meshes replace five buildings around SIRIN's central square:

- **A — Naga Courtyard**, west: layered jade roofs and a public courtyard.
- **B — Lotus Nexus**, Datacenter parcel at (73, -51): a blue lotus roof above an octagonal atrium. The original central energy tower is retained.
- **C — Monsoon Terraces**, east: terracotta roofs, garden terraces and an elevated bridge.

Geometry was authored for this project from the approved concepts. Surface artwork is extracted from **Ragnarok Online / Gravity**, including Ayothaya, Dewata, Lighthalzen, Verus and Prontera. It is not original project artwork. `texture-provenance.json` records original archive paths, crop rectangles and SHA-256 hashes. Source crops preserve RGB pixels; the runtime GLB uses WebP compression. Project signage is authored separately.

`sirin-original-research-quarter.blend` contains the editable scene with packed textures. The browser loads the self-contained `web/assets/sirin/labs/research-quarter.glb`; visitors do not need Ragnarok or local game files.

## Rebuild

1. Configure a local Ragnarok client and ragx in the ignored `scripts/ayothaya-local.json` (keys `client` and `ragx`). Run `python scripts/build-sirin-lab-textures.py` with Pillow installed. The committed textures can also be used directly without extraction.
2. In Blender, execute `scripts/build-sirin-labs-blender.py` with `__file__` set to its absolute path. It replaces only its previously owned authoring scene, saves the blend file, exports `artifacts/sirin-labs/research-quarter-raw.glb`, and generates the runtime layout.
3. Optimize from the repository root:

```powershell
npx --yes @gltf-transform/cli@4.5.1 optimize artifacts/sirin-labs/research-quarter-raw.glb web/assets/sirin/labs/research-quarter.glb --compress meshopt --flatten false --join false --palette false --simplify false --texture-compress webp --texture-size 1024
npm run build:pages
node scripts/verify-sirin-research-quarter.mjs
node scripts/verify-sirin-research-quarter-browser.cjs
```

Repeated material UVs intentionally extend beyond 0–1; the optimizer preserves them. Geometry is batched by material (45 batches across the quarter), with wall footprints separate from roof extents. Courtyards and the space beneath the elevated bridge remain walkable. Existing Library/Datacenter portals and interiors are retained; the new buildings are exterior assets.

The browser check uses a local server on port 8080 by default, or `UTS_TEST_URL` for another deployment. It checks day/night, phone/tablet viewport layouts, bridge movement and access to the existing interiors. Viewport emulation does not measure physical mobile hardware performance.
