# Datacenter and Customer Site v62

- Removed all generated name/function placards from device faces. Manufacturer markings in the actual reference image remain intact. Rack titles, placement U guides and inspector metadata are retained.
- Removed Follow a Service markup and its timer/controller, including the obsolete embedded-project hook.
- Startup closes the Library drawer and fits the room around the viewport center. Overview camera distance uses the room bounding sphere and both horizontal/vertical field of view, with aspect-aware resize handling. A slow orbit (0.018 rad/s, about six minutes per revolution) starts when Animation is enabled. Pointer, wheel, keyboard, selection, placement, layout and walking stop the automatic orbit. Overview/rotate controls can restart it. Reduced-motion preference and Animation pause are honored.
- Replaced the Customer Site element with a generated transparent office building. Updated image dimensions shared by canvas and PowerPoint exports. Existing element shape IDs remain compatible. The original tiny asset remains available for older references.

## Image provenance

Built-in imagegen generated `web/assets/elements/customer-site-v62.png` (1374 × 1145 RGBA). Alpha was preserved when copying the generated output; no background was added. This is a fictional customer-office illustration, not a real customer site or vendor reference.

Prompt: One elegant contemporary enterprise customer office building, instantly readable at small size. A single modest six-storey corporate office block in a subtle near-frontal three-quarter view, clean architectural proportions, pearl-silver structural frame, navy glass curtain walls with restrained cyan reflections, clear glass main entrance and small dark canopy, minimal architectural plinth. Premium 3D architectural illustration, crisp silhouette, soft studio illumination. Centered entire building on a true transparent background. No people, cars, trees, street, sky, network symbols, wires, text, logo, watermark or border.

## Validation

Automated scene checks cover centered projection, room bounds fitting in portrait view, slow camera motion, Animation pause/manual stop, no generated device-name overlay, existing walking/rack placement and incremental rendering. Existing export checks exercise the replacement image in SVG/PNG/PowerPoint. Build and source whitespace checks are run before publication.

Browser automation is unavailable in this environment; live WebGL appearance, pointer/touch behavior and FPS remain unverified on actual browsers. This release does not add the proposed future cable-trace, power-path or inventory-search features.
