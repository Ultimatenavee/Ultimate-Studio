# v65 Manual power and Bayface PDF report

- Manual per-installed-device `powerOverrideW` (W, 0–10000000), optional note. Null/blank reverts to model datasheet. No changes to vendor catalog values, CLI interface or license mappings.
- Studio Inspector exposes manual watts and Serial; Simulator exposes them in the existing double-click device metadata form. Both persist through the Bayface bridge, JSON, U moves and history.
- PDF Report generates local-only multi-page output per rack: full rack/room/site metadata, Studio front view and actual WebGL rack perspective, descending per-U inventory including empty slots, model/label, Serial, known power totals and Manual/Datasheet/unknown provenance. Multi-U power is counted once at its bottom U.
- Snapshot uses a clone of the current project. No report uploads or customer reference files are included in public assets. 3D textures must finish loading before capture; explicit error on unavailable WebGL or texture failure. One temporary viewer is disposed per rack.
- Report button is in Studio Bayface export and embedded Simulator. Standalone room users must open their Bayface project in Studio for the combined report.

Validation: full npm test and Worker build pass. Added manual override/clear/zero/roundtrip assertions, report pagination/long-text/metadata/totals assertions and real Three camera-fit checks for 1/12/42/60 U in portrait and landscape. Synthetic PDF pages rendered with Poppler for visual layout and Thai font checks. Synthetic QA illustrations are not browser WebGL screenshots and are not shipped. Browser PDF download and real GPU capture were not exercised in this environment.

Report pages are rasterized for consistent Thai rendering; text is not selectable. Actual consumption remains a planning value (vendor data or user input), not live telemetry or a facility compliance certificate.
