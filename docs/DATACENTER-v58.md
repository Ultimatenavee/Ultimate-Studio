# Datacenter Simulator v58

Updated 15 October 2026. Continues the existing Ultimate Topology studio codebase.

## Delivered

- Device Library is a collapsible panel inside the Datacenter scene. Search and filters cover PE, router, switch, firewall and rack accessories.
- Drag a library device onto a cabinet face; raycasting maps the world position to U. A translucent green/red landing block previews occupancy. Nearest free contiguous U is optional. Touch users can inspect/select a model, tap the cabinet, or enter U.
- Installed devices can be inspected in a floating 360° viewer, moved between racks, focused, or deleted. Undo/redo covers placement changes.
- Standalone Simulator changes persist in this browser under `ultimate-datacenter-design-v1`; no design data is uploaded by this feature.
- Bayface's separate “3D Rack Designer” modal/menu was replaced by “เปิดใน Simulator”. This opens the same simulator with the current Bayface project. Validated changes flow back through the existing project transaction/save APIs. Existing item IDs, notes, colors, models, rack phases and 2D rack positions are preserved. Message bridge checks both origin and source and uses revisions.
- Held Ctrl smoothly lowers first-person eye height; releasing or losing focus returns to standing. Touch has a hold-to-crouch control. Walking zoom uses bounded FOV; overview zoom uses bounded camera distance.
- WASD works in overview as well as first-person. Overview moves the camera and orbit target together.
- Rack doors removed. Remaining cabinet frame/rails, U blanks and side PDUs remain.
- Airflow uses animated instanced particles instead of static arrows. It is explicitly conceptual, not CFD or telemetry. Per-rack front-to-back airflow is restricted to generic compute/storage references; no claim that all vendor equipment shares that direction.
- Lower exposure, graphite ceiling, blue-grey walls, grey raised flooring and warmer luminaire surfaces distinguish room materials.
- Compact Ultimate Studio light/glass panels, large canvas, help, collapsed contextual inspector, mobile/tablet overlays and fullscreen panel controls. Decorative “Demo / 24 rack” copy removed while simulation provenance remains visible.

## Source files

- `src/datacenter/entry.js`: scene orchestration, inspector, help and responsive controls.
- `src/datacenter/simulator-editor.js`: in-scene library, placement, history, persistence and Bayface bridge client.
- `src/datacenter/rack-placement.js`: pure occupancy validation and Bayface conversion.
- `src/datacenter/scene.js`: navigation, raycasting, variable cabinet U, ghost, door removal, lighting/materials and instanced airflow.
- `src/datacenter/studio-viewer.js`: Simulator launch and validated Bayface bridge host.
- `src/datacenter/viewer-ui.js`: inspection sources and fullscreen-compatible modal placement.
- `src/datacenter/data.js`: clear simulation wording.
- `scripts/sync-datacenter-catalog.mjs`: face-audit metadata alongside original engineering data.
- `web/index.html`, `web/datacenter.css`, `web/device-viewer.css`: UI and breakpoints.
- `research/huawei-face-audit-v58.json`, `research/other-face-audit-v58.json`: model-by-model research evidence and gaps.
- Generated browser bundles and `src/datacenter/devices.json` rebuilt from source.

## Image research: incomplete requirement

Audited all 40 current entries (34 named devices and 6 accessories), prioritizing vendor installation manuals and product galleries, then external references. **21 entries still lack at least one face asset** (5 Huawei and 16 non-Huawei/accessory entries). Existing illustrations were retained; no new images were obtained that could be reliably validated and incorporated in this pass. Research records distinguish confirmed documentation from unavailable images and inferred configuration matches.

Missing Huawei backs: NE8000 M8, M14, X4, NE40E-X8A, S5335-S32ST4X. Other gaps include Cisco chassis bezel/rear views, T-Marc rear views, and accessory backs. The report contains exact per-model details. Cisco pages document several missing views, but image downloads failed; APC returned a placeholder; some Huawei support endpoints denied access. External candidates were not validated sufficiently to substitute. NetSure 211 shelf configuration needs exact identification before a rear model can be considered accurate.

This release therefore does **not** satisfy full front/rear imagery for every device. Unknown faces remain unmodeled; no opposite-face substitution or invented ports. Current models remain dimensioned chassis with illustrated faces, not calibrated vendor CAD. No Blender or third-party CAD assets were produced.

## Verification

- Existing 111 behavior groups, responsive behavior groups and visual engine stress checks passed.
- Catalog interface arrays and PE presets unchanged, including all 109 X8A interface names.
- Multi-U placement, collision/full-rack rejection, nearest free U, cross-rack identity preservation, accessory/empty-project roundtrip passed.
- Real Three geometry/camera math with mocked DOM/GPU renderer exercised full scene construction, overview WASD, Ctrl crouch/release, blur reset, FOV bounds, world-to-U raycasting, 60U cabinet and empty-room behavior, ghost and disposal.
- JPEG/PDF/PPTX export regressions passed.
- Worker build passed.
- Browser rendering, actual drag gestures, touch device layout, screenshots, console state and real FPS were **not** tested because supported browser-control capability was unavailable. Mocked-renderer checks do not establish visual correctness or GPU performance.

## Remaining limits

- In-scene edits reconstruct scene geometry while preserving camera pose; large rooms may briefly pause during placement. Animation uses instancing, but no measured browser FPS is claimed.
- Standalone room supports up to 24 racks; project Bayface retains its existing 20-rack limit. 3D rows use a fixed room arrangement, while the existing 2D rack x positions are preserved on roundtrip.
- The standalone room and an opened Bayface project are distinct workspaces; no automatic merge of demonstration contents into user projects.
- Storage is browser-local. Private customer designs and source PowerPoint files are not added to public assets.
