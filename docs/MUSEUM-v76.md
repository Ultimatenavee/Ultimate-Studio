# v76 — Open stepped optics display and coherent museum zones

- Removed transparent covers and partitions from the optics counter. Museum glazing remains unchanged.
- Raised the rear shelf by 0.36 m. Shared layout data places both the physical risers and specimens at the same elevations. Front labels sit on the counter fascia; rear labels sit on the taller riser. Hover lift still works.
- Replaced compressed single-line sign text with measured wrapping. Full device names, optical SKUs, speed, connector, reach and media are preserved. Family headings use larger type; clicking the heading, picture or hint opens the corresponding optical catalog filter.
- Removed duplicate accessory exhibits. Each library model has one physical location. Power equipment forms a compact 2×2 group in the Power zone. Tools is a directory kiosk that takes users to each accessory's proper zone.
- Floor inlays and boundary strips derive from the actual display footprints. They include the counter and kiosk, avoid crossing equipment, and share their plan with the minimap. The former arbitrary long crossing strips are removed.
- Zone entry directions face the southern lounge/learning/tools exhibits correctly.

Validation: regression suite; source build; unique device locations; power grouping; equipment inside floor boundaries; nonoverlapping floor zones; actual eye-height sightline to a raised specimen; no case glazing; readable complete wrapping; 122 sign textures measured with the bundled Noto Sans Thai font; 89 loaded models and 84 image loads with finite geometry and bounded image textures.

Verification limit: canvas font textures and Three geometry were checked locally. Browser/WebGL appearance and hardware FPS were not measured.
