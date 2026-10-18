# Museum v80 — pointer targeting and 45° rear SFP shelves

## Cause and behavior

v79 enabled cable animation but still selected the focused device by horizontal proximity with hysteresis. Standing near another column could therefore keep that neighbor focused even with the mouse/crosshair over a DAC/AOC specimen.

A shared Museum aim ray now tests lightweight exhibit envelopes. In walk mode its exact hit takes priority over proximity. Unlocked mouse movement supplies canvas-normalized pointer coordinates; pointer lock, Drag Look and touch use the center crosshair. Fixed envelopes cover coil gaps and stay in place while the model rises, preventing hover flicker. Click and E use the same aim method before the existing click targets. No extra animation loop or model-geometry raycasting is added per frame.

## Rear shelf geometry

- Rear tray and all rear specimens tilt 45° toward the aisle; front trays remain horizontal.
- Wedge supports meet the tilted cap underside, preserving the v78 separation of dark and ivory surfaces. A shallow retaining lip completes the display edge.
- Models, animation displacement, target envelopes and focus rings share the tray normal.
- Rear labels sit below the front edge so they do not obscure module heads.
- Catalog specifications, interface mappings, model dimensions and cable geometry remain unchanged.

## Verification

- Full regression suite passed after the main implementation; targeted Museum geometry/aim and complete scene behavior tests passed after the final lip/label adjustment.
- New `verify-museum-aim.mjs` covers all six DAC/AOC variants, including a nearer neighboring device for each of the four page-zero specimens. Tests pointer priority, one rotation, stable targets while raised, Animation off and settling.
- All seven rear slots are ray-targetable from a walking eye at 1.65 m. Rays to the real module head meshes are not blocked by labels, tray, lip or foreground objects.
- `verify-simulator-scene.mjs` drives actual canvas pointermove/down/up and KeyE through production handlers using real Three camera math and a mocked renderer.
- Existing 126 surface probes now follow the inclined tray normals, maintaining no coplanar dark/ivory conflict.
- Browser/WebGL rendering is unverified in this environment. These checks verify actual geometry and event wiring, not GPU screenshots or frame rate.
