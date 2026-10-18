# v57 — Device inspection and shared rack placement

Adds a lazy-loaded Three.js inspection dialog to Datacenter and Bayface. Devices float on a neutral studio background; OrbitControls supports all-side rotation, zoom, pan, six orthogonal views, reset and optional auto-rotation. Closing a dialog disposes its geometries/textures/listeners and releases the WebGL context.

## Catalog and engineering data

`scripts/sync-datacenter-catalog.mjs` derives the 3D catalog from the existing 34 named device models, six Bayface accessories and PE interface presets. It preserves interface IDs/names, X8A's 109 names, physical occupancy rules and the original License Matrix. The master catalog and license files are unchanged.

`research/datacenter-physical-audit.json` records dimensions and limitations per model. Vendor sources were reviewed on 2026-10-15. Twenty named devices and four accessories have newly checked dimensional references. Huawei hardware-support pages returned 403/unavailable; the official NE8000 overview confirms F1A/M8/M14/X4 chassis dimensions, but does not establish calibrated rear geometry. X8A dimensions are available on Huawei's Austrian product page. Fortinet's direct PDF could not be retrieved; existing Library values remain explicitly identified as such. APC accessory pages did not expose specifications in this retrieval.

Specific dimensional differences are intentionally isolated from the historical engineering catalog: ASR1001-X HIG's 571.5 mm includes handles/brackets; Telco 280 dimensions are 44 x 221 x 140.5 mm and T-Marc300-series dimensions 44 x 221 x 235 mm; ALE6450-10 datasheet gives 44 x 215 x 280 mm. These are stated in viewer metadata and must not be interpreted as a calibrated mechanical CAD model. Unknown width/depth use an explicitly unverified visual envelope. Unknown faces remain plain. No fictional port/fan layout is generated. Existing device-face illustrations remain raster surfaces on dimensional chassis geometry.

## Rack editing

- Bayface toolbar: **3D Rack Designer**. Reads/writes the same project `bayface` through existing transactions, validation and local-save mechanism.
- Device Library click in Bayface: inspection dialog, then choose placement. Existing direct Bayface drag/drop remains.
- Rack Designer: search, click preview, drag/place, U ghost, nearest contiguous slot, collision rejection, cross-rack move, 1U buttons/arrows, delete, add rack, undo/redo and numeric-U fallback.
- Clicking installed devices opens inspection. Dragging the original Bayface does not open a popup.
- Datacenter demo: selected rack can be edited in the same designer. Demo edits last for this page session; they never overwrite Studio project data or publish visitor data. Closing rebuilds the demo room from edited rack contents.

## Wiring

Replaces arbitrary floating cable arcs with illustrative ODF-to-ODF routes through side managers and overhead fiber trays/spine. Generic ODF adapters supply explicit demonstration endpoints. Rounded path corners are visual; they are not a bend-radius engineering validation for a specified cable. Corning SRP003-650 informs the routing/slack-management approach. There is no automatic physical mapping of arbitrary production network links yet.

Power now shows internal rack-side A/B PDU bars and outlet geometry. Upstream overhead power paths and uncalibrated PSU cords are removed. The failure button remains a labelled demonstration; it does not compute circuit loading or power redundancy. The equipment inventory may include 1U PDUs; the side bars are generic 0U infrastructure, not incorrectly labelled AP9565.

## Verification

Existing Studio regression suites plus new device-viewer checks verify catalog/preset parity, finite mesh bounds, frame asset paths, multi-U placement, collision and full-rack rejection, moving between racks, accessory serialization and snapshot isolation. Build bundles all dependencies locally.

Browser/WebGL interaction, visual quality and touch drag behavior could not be exercised because the supported control-browser capability was unavailable in this environment. Neither vendor-calibrated CAD for all devices nor exact port-level physical fiber wiring is claimed complete.
