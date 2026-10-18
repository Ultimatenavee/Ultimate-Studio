# Datacenter Explorer — v54

New root landing page for the existing Ultimate Topology studio. Studio remains at `/studio.html`; no project or customer data is read by the landing page. Demonstration rack contents are isolated in `src/datacenter/data.js`.

## Research before modelling (14 October 2026)

- Schneider Electric, *Impact of Hot and Cold Aisle Containment*, SPD_DBOY-7EDLE8_EN: separating intake and exhaust air. https://www.se.com/us/en/download/document/SPD_DBOY-7EDLE8_EN/
- Schneider Electric, *Planning Effective Power and Data Cable Management in IT Racks*, SPD_VAVR-9G4NDJ_EN: organized routing avoids maintenance and cooling problems. https://www.se.com/us/en/download/document/SPD_VAVR-9G4NDJ_EN/
- Corning, Single EDGE 19 frame: cable managers, slack storage and trunk strain relief are explicit hardware functions. This demo uses a generic LC rack patch panel, not a reproduction or certification of that Corning SKU. https://ecatalog.corning.com/optical-communications/US/en/Fiber-Optic-Hardware/Racks-And-Frames/Optical-Distribution-Frame/p/PF2TDAFG5LCANNNN2PADQ
- Eaton Rack PDU G4/G3 guide: vertical 0U distribution and color identification. Demo orange A / blue B is a project legend, not an industry-mandated color code. https://www.eaton.com/us/en-us/products/backup-power-ups-surge-it-power-distribution/power-distribution-for-it-equipment/power-distribution-units-for-server-racks.html
- Cisco ASR 1001-X overview: 6 built-in 1GE SFP and 2 built-in 10GE SFP+; rear fan and two PSU arrangement; do not mix AC and DC. Demo uses AC pair. https://www.cisco.com/c/en/us/td/docs/routers/asr1000/install/guide/1001-x/asr1hig-book/router_overview.html
- Cisco preparation guide: 1RU / 43.43mm height. https://www.cisco.com/c/en/us/td/docs/routers/asr1000/install/guide/1001-x/asr1hig-book/prep_site_install.html
- Huawei NetEngine 8000 series dimensions and existing audited catalog used for M8 3U. https://e.huawei.com/en/products/routers/ne8000
- Vertiv NetSure 502: -48V telecom rectifier and distribution system. Demo is generic, not an exact NetSure model or an electrical design. https://www.vertiv.com/en-asia/products-catalog/critical-power/dc-power-systems/netsure-502-full-dc-power-system/
- Three.js official WebGLRenderer and OrbitControls documentation informed WebGL2 fallback, touch orbit/pinch/pan and disposal. https://threejs.org/docs/pages/OrbitControls.html

## Implemented

Six 42U cutaway racks in two inward-facing rows; blanking panels; rails and mounting apertures; overhead ladder trays; PSU-side 0U PDU strips; doors; cooling cabinets; front/rear device artwork from the unchanged catalog. Cisco ASR1001-X 1U, Huawei M8 3U and S6730-H24X6C 1U.

Orbit, pinch/scroll zoom, pan, overview and front/rear camera presets; rack/device selection; data layers Equipment/Fiber/Power/Cooling. Service journey through a synthetic network. Illustrative AC A/B failure for verified dual-AC ASR only; independent generic telecom DC branch. No real telemetry, tenant identifiers, customer decks or original attachments.

Three.js 0.186.1 is bundled locally and dynamically imported after user starts 3D. No CDN runtime requests. Static rack information remains available on failure. Device textures load only in 3D. Pixel ratio capped at 1.6, frames drawn only on scene changes/active fiber motion, hidden page stops RAF, reduced-motion supported. Disposes renderer, textures, geometries, materials and controls on exit.

## Files

`web/index.html`, `web/datacenter.css`, `src/datacenter/{entry.js,scene.js,data.js,devices.json}`, generated `web/datacenter-entry.js`, `web/dc-chunks/*`, Three license, build and validation scripts, package/lock, this report. Existing catalog, interface assignments, simulation engine, Studio editor and export logic unchanged.

Run `npm ci`, `npm run build`, `npm test`, `node scripts/verify-datacenter.mjs`, then `npm run local`.

## Accuracy and validation boundaries

This is a detailed visual educational model, not CAD, DCIM, an electrical sizing tool, installation plan, Tier certification or thermal simulation. Cable endpoints are illustrative, not calibrated port hotspots. Rear M8 artwork is not available; the model says rear not verified instead of inventing a rear port layout. Cabinet geometry and generic ODF/power accessories are illustrative. PSU-B survival assumes an adequate healthy B feed; no runtime/load calculation. Fiber bend radii, electrical clearance, service clearance and individual model airflow have not been certified. Customer topology is not synchronized into the public demonstration.

Browser QA is unavailable in the managed environment (control-browser skill absent); no claim of actual WebGL render, mobile GPU performance or zero browser console errors. Node tests validate rack occupancy, catalog heights/image bounds, aisle orientation, route states and build integration; existing Studio regression suite also run.
