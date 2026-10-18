# Ultimate Topology Studio — Control Center v53

## Phase 1 — Audit and gaps

The retained application is buildless JavaScript split into browser modules, with DOM device artwork, SVG links, a shared project/history core in `app.js`, and geometry in `geometry.js`. It is not a React/Three.js application. The backend is a bundled Cloudflare Worker with D1, Drizzle ORM 0.45.2 and esbuild 0.25.12. No production dependencies were added.

Before this change, it already supported Topology, Bayface, Specs, Matrix license filtering, manufacturer artwork, physical/CLI interface presets, copy/paste, undo/redo, import/export, alignment guides, minimap, shared templates and connectivity-based fault analysis. Missing pieces were an always-accessible simulation dashboard, independent visual-load calculations, traffic overlays, and a Specs-to-Topology action. Auto Layout and Snap had previously been removed at the user's request; this request explicitly reinstates them as optional controls.

The reference `https://laemchabang.whisperingweekends.com/` was inspected through its served HTML, stylesheet and JavaScript on 2026-10-14. Its main pattern is a spatial scene with on-demand panels, sliders, lighting/view controls and before/after experiments. Its implementation uses THREE/WebGL and OrbitControls. This update adapts the panel/experiment interaction to a precise 2D network editor; it does not copy its code, imagery, models, music, branding or visual assets. No interactive/browser inspection of the reference was available.

## Phase 2 — UX

- Navy/Charcoal/Cyan enterprise styling in Night mode, with readable Day mode retained and existing user preferences respected.
- Canvas-first floating tools, an initially closed Control Center drawer, compact status ribbon and optional floating editor toolbar.
- Drawer tabs for Overview and Visual Lab, keyboard close with Escape, retained responsive layouts and 44px touch targets.
- Device hover information and selected-device connection highlighting use the existing identity/geometry. External PE identity stays masked.

## Phase 3 — Canvas

Existing zoom, pan, fit, drag/drop, multi-select, duplicate/delete, undo/redo, copy/paste and minimap are retained. Auto Layout uses deterministic BFS columns and handles disconnected components and varying device sizes. Multiple selected devices limit its scope; otherwise it lays out all devices. It changes positions only, keeps link/interface data, and is undoable. Snap is off by default and snaps the movement anchor to the configured grid while preserving group offsets. Alignment guides remain independent.

## Phases 4–5 — Visual simulation

`network-visual-engine.js` is pure calculation code with no DOM, telemetry, project writes or protocol simulation. `control-center.js` is the 2D presentation/control adapter. A future 3D adapter can consume the same `calculate()` outputs and device/link IDs without changing hardware data or history. No 3D renderer/assets are loaded in this version.

The session-only scenario contains offered load, percentage/fixed-bandwidth mode, license selection, animation direction and temporary faults. It is not saved into the engineering project or exported as real traffic. Data model `link.speed` is already in **Mbps**. Matrix text units are converted to Mbps. No throughput number is inferred from port speed or hardware maximum.

- Each link receives independent offered load: link capacity × selected percentage, or a fixed Mbps amount per link.
- Carried = min(offered, capacity) if enabled and its endpoints are available; otherwise 0.
- Utilization = carried / link capacity. Warning starts at 80% or when offered exceeds link capacity.
- Unserved demand is arithmetic demand beyond capacity or a down link. It is not a packet-loss prediction.
- Router warning compares the largest adjacent-link offered load with the selected Matrix license value. This is a preliminary per-link check, **not aggregate interface forwarding capacity**.
- Before is the topology snapshot at Start with scenario faults removed. After uses the current topology and current scenario. Topology edits can therefore explain a change in the comparison; original disabled links and powered-off devices stay disabled in the baseline.
- Studio fault controls and the new drawer share temporary fault state. Reset clears scenario faults, not design settings.
- Overview counts devices, router/PE/switch types, links, design/simulation availability, occupied known sockets, and current validation findings. Unknown-port devices are explicitly counted separately.

All traffic overlays say **SIM** and the drawer/ribbon say **VISUAL SIMULATION / NO LIVE TRAFFIC**. There is no NMS/SNMP/streaming telemetry integration. There is no BGP, VRRP, STP, routing convergence, QoS, latency or packet-loss engine. Existing CID connectivity analysis remains in Studio.

## Specs / license accuracy

Bandwidth-first filtering remains, including IPBase, Data/AppX and Security. Result cards identify which Matrix license column satisfies the requested bandwidth. A device can be added to the visible topology center from a result or detail view.

`catalog.js`, `pe-interfaces.js`, `spec-matrix-data.js`, import rules and interface assignment resources were not changed in this update. In particular, X8A keeps the supplied 109 unique interfaces and shared `50|100GE` socket mapping. Matrix values are retained as supplied data. This update does **not** newly certify all values against vendor software/licensing releases, detect installed licenses, or infer missing values. Vendor licensing recertification is a separate remaining data-validation task.

## Phase 6 — Validation

- App/event/history/import/export regression: 111 behavior groups, including simulation immutability, fault reset, pause/resume, Specs-to-Canvas, snap/group offsets, undoable layout, Thai-keyboard copy/paste and X8A occupancy.
- Responsive event tests: desktop/compact panel restoration and touch interaction contracts.
- Pure engine tests: license selection, unknown values, fault states, offered/carried load, physical socket occupancy, deterministic layout and project-limit stress (200 devices / 400 links).
- JavaScript syntax checks and production Worker build.
- Animation uses CSS dash-offset instead of frame-by-frame project rendering. Scenario updates render links/panel only; range-input updates are coalesced per animation frame. Model/preset definitions are cached and collected with their catalog. Animation pauses for document visibility, Reduce Motion, explicit pause and drag/resize states.

Browser rendering, native clipboard events, real tablet/mobile hardware and browser console inspection are **not verified** in this environment because the required browser-control capability was unavailable. Passing DOM/VM tests does not prove zero browser console errors or browser FPS. SVG/PDF/PPTX regression checks cover the existing exporter paths; simulation overlays are presentation only and do not become live-data claims in exports.

## Run / build

Use Node.js 24 or later (regression tests use `node:sqlite`).

```sh
npm ci
npm test
npm run build
npm run local
```

Local URL: `http://127.0.0.1:8080`. The local server injects the existing offline adapter for browser-local templates. Cloud shared templates and review require the hosted Worker/D1 backend. `UTS_LOCAL_PORT` changes the local port. Run on HTTP instead of opening `studio.html` with file://. This update does not rebuild the Windows EXE installer.

## Changed files

- `web/control-center.css`, `web/control-center.js`, `web/network-visual-engine.js`: new UI, session state and pure calculations.
- `web/app.js`: renderer hooks and a link-only rendering API.
- `web/editor.js`: optional snap and overlay event isolation.
- `web/studio.js`: shared temporary-failure access and update notifications.
- `web/specs.js`: matched Matrix license display and device placement.
- `web/studio.html`: new stylesheet/script references.
- `scripts/verify-project.mjs`, `scripts/verify-visual-engine.mjs`, `scripts/test.mjs`: regression and model tests.
- `desktop/offline.js`: keeps Desktop stop behavior and omits it in browser-local server mode.
- `scripts/local-server.mjs`, `package.json`, `README.md`, this report: runnable handoff and documentation.

The source delivery excludes Git history, credentials, deployment metadata, original customer presentations and research attachments. Public deployment contains only current client/Worker build output.
