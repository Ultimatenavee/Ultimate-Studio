# Simulator v82 — Rack workspace, Power notices and Studio export

## Changes

- Device Library and Infrastructure Explorer have corner handles for independent width/height changes, keyboard arrows, viewport bounds, cancellation, persisted dimensions and touch targets. The Inspector keeps a separate inner scroll body so its resize control stays available.
- Explicit passive kinds (ODF/fiber distribution, patch, copper panel, cable manager, blank and reserved) use 0 W and are not missing-power issues. Their metadata form hides Power fields. Generic active devices remain unknown until documented/manual values exist.
- Remove the yellow side warning list. Selected Rack devices needing attention have compact badges projected from their actual U centers. Clicking opens an anchored form with the reason, W input, note and advanced card/datasheet action. Enter submits. Save uses existing validation, history and persistence.
- A click on empty scene space clears Rack selection, closes editing/details and notices, and leaves the camera in place. A scene drag does not clear selection; placement uses its existing landing/cancel flow.
- The Rack Inspector adds **Export to Bayface design**. Standalone Simulator converts the chosen Rack and navigates through a short-lived one-shot session handoff; Studio validates it and adds a new rack with remapped IDs in one transaction. Existing Topology/Bayface entries are retained. Embedded Simulator focuses the already-synchronized original Bayface rack instead of duplicating it.
- Export preserves U/height, catalog model/accessory identity, name/room, serial, manual Power, card configuration and Rack budget/basis. Generic passive panels stay generic patch panels; generic active equipment uses the existing generic Studio device without assigning an invented vendor/model. The handoff remains browser-local.

## Files

UI integration: `entry.js`, `simulator-editor.js`, `scene.js`, `web/index.html`, `web/datacenter.css`; new `panel-resize.js` and `power-notices.js`. Power policy: `power.js`. Transfer: new `rack-export.js`, `rack-import.js`, and changes to `studio-viewer.js`, `web/bayface.js`.

## Validation

- Full regression suite passed, including new Rack conversion/merge, viewport sizing, pointer resize/cancel, popup edit/save/advanced action, escaped labels and entry boot smoke checks.
- Embedded bridge tests reject foreign source/origin, stale project/revision and focus the original rack with dialog/listener cleanup.
- Actual Three camera/event tests verify selected device anchors, blank-click exit and retaining selection after a drag.
- Existing Power/report, metadata roundtrip, Simulator placement, Museum, joystick and Topology regressions remain passing.
- Build required before publication. Browser/GPU visual rendering remains unavailable in this environment. Generic export rows have no additional physical/vendor certainty beyond the existing data.
