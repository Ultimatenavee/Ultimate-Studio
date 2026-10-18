# Museum v78 — remove striped optics tray surfaces

## Report and reproduced cause

The user's v77 screenshot showed ivory/dark triangular regions and fine alternating lines across SFP display trays. This was geometry depth conflict (z-fighting): for each of 14 shelves the dark support box ended at `top`, and the ivory 18 mm cap also ended at exactly `top`. Their visible top faces were coplanar. Changes to cable poses, color values or tone mapping cannot remove that conflict.

Before editing the geometry, the new regression raycast reproduced two competing material surfaces at the very first tray sample: dark `#28323a` and ivory `#d8d1c1` at the same height.

## Correction

- Deduct the cap's 18 mm thickness from the support height so the support meets its underside.
- Inset the support footprint by 10 mm per edge so its side faces do not coincide with cap edges.
- Keep both shelf heights (1.12 m / 1.48 m), device landing positions, materials, lighting and rendering resolution unchanged.

## Validation

`verify-museum-layout.mjs` probes 9 surface locations on each of the 14 real shelves after static instancing. All 126 samples must expose only the ivory cap at the expected height, with no differently colored face competing within 1 mm. This assertion failed on v77 and passed with the correction. The complete regression suite and build are run before packaging. Browser/WebGL image verification is unavailable in this environment; the raycasts establish separation of actual Three geometry, not a claim of rendered GPU verification.
