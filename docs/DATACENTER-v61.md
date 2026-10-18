# Datacenter v61

- Equipment placement, deletion, movement and metadata updates refresh only contents of changed racks. The room, renderer, camera and shared image textures remain alive. Structural rack additions/removals still rebuild the room.
- Front-panel-only framing removes perspective chassis tops baked into device textures. See research/face-overlays-v61.json and accompanying audit; source image bytes and engineering interface inventories remain intact.
- Wall text moved inside the glazing plane and spaced vertically. Device names appear only near the selected rack and shrink vertically for 1U; detailed serial/room information remains in the inspector.
- Illustrative green normal/system indicators for powered catalog equipment, with an explicit LED simulation toggle. System pulse follows Animation; no live telemetry, traffic or per-port link inference is claimed.
- Front-on placement view locks orbit rotation and can restore the previous camera/walking pose. Quality selector adjusts resolution, shadows and animation update rate.
- Serial editor is hidden by default. Double-click a device row to open its inline serial field, then Enter/Save to persist. Close discards unsaved input. Selecting another device or rack closes the editor.

Validation: automated editor/catalog/navigation tests, incremental add/remove scene identity and camera preservation, front-view return, room/serial persistence and interface preservation. Browser QA unavailable; no measured FPS or cross-device pointer/touch guarantee. Source-backed dimensions and face images are illustrative, not full vendor CAD.
