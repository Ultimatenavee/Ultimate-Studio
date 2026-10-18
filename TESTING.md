# Validation · 1.5.0

## 1.5.0 checks

- 82 application/event groups pass, including long title preservation, all 40 Specs entries, 18 uploaded Matrix profiles, combined filters, details/comparison and read-only tab transitions.
- 11 SQLite API groups pass, including shared projects with long names; request-level size limits remain enforced.
- Landing scene switching, pause/resume and legacy Review redirects verified. Actual canvas artwork rendered at 600px/327px and visually inspected; this is not full browser layout QA.
- Local HTML asset references resolve. Bayface SVG/PNG/JPEG/PDF/PPTX generated with the increased caption spacing.
- Native browser layout, pointer gestures and compositor glass appearance remain unverified: this Worker/static project has no compatible managed preview server.

## 1.4.2 checks

- 79 behavior groups: selection on pointer release, blank click deselection, unchanged project state and actual accessory drag payload/preview/drop/Undo.
- Native browser gesture/layout acceptance remains unverified.

## 1.4.1 checks

- 77 application/event groups pass, including Hand-over-equipment pan, Select empty-space pan, pointer identity/cancellation, click suppression and unchanged project state. Existing equipment/Rack movement and zoom checks pass.
- Native browser gesture/layout acceptance remains unverified.

## 1.4.0 checks

- 76 application/event groups and 10 SQLite API groups pass, including all six accessory profiles, invalid identity/kind rejection, Inspector selection and legacy power preservation.
- Four-rack SVG/PNG/JPEG/PDF/PPTX fixture includes six accessory images; native browser interaction remains unverified.

## 1.3.0 checks

- 73 application/event groups: contiguous slot allocation, full/fragmented rack, self exclusion, keyboard movement, Undo, pointer preview/drop equality and cancellation.
- Inspector resize/collapse and presentation edit guard; dark/transparent/viewport SVG exports.
- Actual JPEG/PDF/PPTX generated; PDF parsed, PowerPoint slide/media ZIP inspected. Native browser gesture/layout/download acceptance remains unverified.

## 1.2.1 checks

- 68 application/event groups and 9 API groups pass.
- All 34 visible models carry rack dimensions, source URL, basis and audit date; fractional X4 chassis occupancy is rounded to whole slots.
- Active-tab Delete, text-input exclusion, Undo, immediate device/reserved area color, draft preservation and SVG color persistence verified.
- Three-rack SVG/PNG rendered and visually inspected with corrected M8 height and colored surfaces.
- Native browser keyboard/color-picker/layout acceptance remains unverified.

## 1.1.0 checks

- 62 app/event groups; 9 API groups against SQLite; 9 design logic groups retained.
- Bayface empty start, tab switching, separate Topology data, Rack forms, preserved state on invalid shrink, Undo and JSON round-trip.
- Device assets/Rack Unit, reserved blocks/edit/delete, exact-U cross-rack moves and atomic overlap rejection.
- Bayface-only Shared Templates persist for independent readers; invalid model/overlap/orphan/overflow returns 422.
- Three-rack Bayface SVG/PNG rendered with four embedded images and two reserved blocks; visually inspected.
- Day/Night semantic ink/muted/accent/error against surface/panel/elevated/control/canvas and action text meet 4.5:1. Reserved-block automatic black/white contrast verified.
- Native HTML drag, modal/browser layout, actual PNG canvas download, theme computed styles and full user-assigned annotation palettes remain browser acceptance checks.

## 1.0.1 checks

- Clipboard import success, denied/unavailable and empty preserve canvas and prior input.
- Compare JSON input and Clipboard success, invalid JSON inline errors preserve prior comparison and canvas.
- Native browser Clipboard permission prompts remain a browser acceptance check.

## 1.0.0 checks

- 55 application/event groups (including UI connected to the actual Worker/SQLite), 9 pure design logic groups, 8 API groups against migrations.
- Template edit/delete, tags/favorites, independent copy, optimistic revision conflicts and preserved canvas on failures.
- CID highlighting, presentation steps, failure/reset, comparison errors, Site group/rename/collapse/Undo, CSV formula handling.
- Review snapshot, validated pin targets, idempotent comment retries, shared status and Canvas comment counters.
- Actual SVG/PNG/JPEG/PDF/PPTX exports remain verified for all existing device/Element profiles.
- Native browser fullscreen, modal layout, responsive layout, clipboard/download and presentation display remain browser acceptance checks; VM event tests do not certify layout.

## Completed

- [x] Smart Uplink main/backup propagation, larger uplink preservation, 100G lateral exclusion, native NOAH values retained
- [x] Uploaded JSON HOP1 main/backup becomes 10G matching HOP2/3
- [x] Four-corner Element resize at 2× zoom, opposite anchors, free dimensions, minimum 32px, cancel and Undo
- [x] Removed Snap toolbar/settings and Auto Layout; free dragging verified
- [x] Vendored Lucide SVGs plus original LICENSE, refreshed Element gallery/export inspection

- [x] Native Project dialog state, direct New Project preserving local work, removed Port Mapping/Command Palette
- [x] Eight Elements: click placement, drag, undo/redo, form edits, copy/paste, schema validation and round-trip
- [x] Elements persisted in real SQLite shared templates and identical independent readers
- [x] Elements SVG/PNG/JPEG/PDF and eight native editable PPTX shape types; rendered SVG/PNG inspected

- [x] 11 new vendor-backed profiles; Combo/shared-bank blocking, 40G/100G optics, licensed SKU and mixed PSU rules
- [x] 11 new generated images delivered as lossless WebP with identical RGBA/alpha; original PNG retained
- [x] Exact NE40E-X8A and requested S6730-H24 alias resolve imported Library profiles

- [x] 6 shared-template API behavior groups against real SQLite migrations: independent readers, save/load, immutable records, idempotency, validation and failures
- [x] ACM-shaped fixture and uploaded sample parse into 7 devices / 7 links; raw newline repair, node deduplication, exact interfaces, Backup and Interconnects
- [x] New unsuffixed names, default MTU 9216 and explicit imported MTU 9600
- [x] Library resize pointer/keyboard/cancel/reset/storage
- [x] Link/Label drag, undo/redo/cancel, custom waypoints, reset, two-grid spacing and vertical label sides
- [x] Actual SVG/PNG/PPTX export of imported placeholders and moved routes/labels


- [x] Enter commits editing fields and forms, inline labels, immediate local persistence, invalid VLAN rejection, Shift+Enter and IME exclusions

- [x] Syntax checks: app/editor/geometry/exports
- [x] 47 state/event behavior groups in Node VM and minimal DOM adapter
- [x] Fresh VM startups always empty with no saved project, an empty draft, existing devices or annotation-only work; saved storage unchanged and manual reopening / New Project / undo verified
- [x] Original documented hardware facts and calibrated hotspot coverage preserved
- [x] 23 generated PNG files have genuine alpha; original generated bytes preserved
- [x] PE five image-only profiles have no specifications, physical ports or PSU definitions
- [x] Main/Backup role saves/imports/undoes and exports; legacy role migrates to standard
- [x] Known hardware peer validation stays strict when connecting a manual PE interface
- [x] Multi-selection, move/group/copy internal links, manual alignment, region, inline text and autosave error paths
- [x] Select-mode blank drag pans without a marquee, object changes or undo entry; Shift drag selects and middle-mouse pan remains available
- [x] PE filter returns F1A/M8/M14/X4 and combines with Brand/Search
- [x] Inspector pointer/keyboard resizing, cancel/reset, responsive bounds and stored width
- [x] Frameless Main text stays above/left and Backup text below/right of its path, including role changes and curved/straight/orthogonal cables with reversed endpoints; export bounds include both sides
- [x] Actual JPEG, PNG, SVG, PDF, PPTX exports
- [x] PowerPoint keeps each device as one image plus editable text/lines/frames with crop metadata
- [x] 34 images, Thai text, Backup dash/color, parallel geometry, viewport/transparency and PDF orientation
- [x] Rendered PDF and PowerPoint sample inspection

## Browser acceptance checks remaining

- [ ] Native paste/file import, shared-template dialogs and cross-browser save/load UI
- [ ] Native link/label/waypoint pointer capture and Library resize


- [ ] Liquid Glass desktop/mobile layout, contrast, blur and fallback in native browsers

- [ ] Desktop layout at 1366/1440/1920 and small-screen panel behavior
- [ ] Native double-click, pointer capture, dialogs, focus, keyboard and context menu interaction
- [ ] Browser SVG-to-canvas fonts/alpha and real file downloads for all five formats
- [ ] Plain empty-canvas pan, Shift marquee, trackpad, touch and middle-mouse panning
- [ ] Inspector drag across panel boundaries, pointer capture/cancel, keyboard resizing, collapsed/presentation states and width restore after reload
- [ ] Local recovery after closing/reloading; quota errors and eight-project retention in real storage
- [ ] Dark/Light contrast, reduced motion, pause animation, lazy Library image loading
- [ ] Large projects near limits: 200 devices / 400 links / 200 annotations
- [ ] Native WebMCP registration where supported

Browser checks are pending because this buildless static Site has no compatible managed preview server and the required browser-control skill is unavailable. Passing VM/export checks does not certify browser rendering or production readiness.

Bayface 1.2.0: neutral metal rack interiors and shelf backing, 25–300% zoom (Ctrl/⌘ + wheel), selected-rack/all-rack fit, free horizontal rack dragging with a common ground guide. Rack x positions round-trip through JSON/templates and Undo. Equipment drop U calculation compensates for zoom. Native browser drag/layout acceptance remains pending.


### v107 sculpture review

The actual exported GLBs are checked for author revision, finite geometry,
embedded local normal texture, material compatibility, balanced facial planes,
sloping shoulders, front-culling and palm orientation, draw/triangle/file budgets
and coarse/detail separation. Before/after renders use the same neutral clay.
The runtime loader keeps its existing lazy-load, failure/disposal and LOD tests.
Rack Escape/L shortcuts and temple entry checks are rerun. These are Blender and
Node/Three checks; they do not claim a live-browser/GPU or measured-FPS result.


### v108 carved model

Review the actual exported front, three-quarter and pedestal close-up before
shipping. The detail budget is 750k triangles / 26 MB; the walking budget remains
250k / 10 MB. The new volume-based body must keep the pedestal grounded, avoid
protruding shoulders, preserve both anatomical palm frames and retain embedded
local materials. The authoring recipe contains no paid source model or extracted
Meshy mesh/texture. Asset lifecycle tests remain the same.
