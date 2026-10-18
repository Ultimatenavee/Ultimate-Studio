# Datacenter Simulator v59

Updated 15 October 2026 on the existing Ultimate Topology studio source.

## Changes

- Interface-facing mounting: C1121, 1941, 2911, 3925E, 3945E, ISR4331 and ISR4431 rotate as whole chassis so their actual rear I/O panel faces the aisle. Physical front/rear labels remain accurate. ASR and other front-I/O devices keep their orientation.
- Source-backed front/rear presentation for the 40 named library devices and accessories. Huawei M8/M14 reference backs really are blank metal panels; they are not missing artwork. Selected AC/DC/chassis configurations are disclosed in inspection. Some missing photographs are replaced with original simplified vector illustrations based on inspected vendor manuals or exact-model reference photos; these are not calibrated CAD models.
- Device Library stays available while walking. L or the Library button releases pointer lock for menu use. Placement pauses movement without exiting walking or resetting the camera. Returning to the viewport resumes navigation.
- Transparent perimeter glass with structural mullions; room collision boundaries retained.
- Local Noto Sans Thai with Inter, larger controls, labels and contextual help; responsive panels for narrow screens.

## Engineering preservation

Only visual overlays are merged into the generated 3D catalog. Existing CLI interface names, X8A's 109 unique interface preset entries, port definitions, license matrix and rack occupation values remain unchanged. Image card populations represent the cited reference configuration rather than a claim that every pictured port matches a configured logical preset.

## Evidence and files

- Research manifests: `research/cisco-face-assets-v59.json`, `research/huawei-face-assets-v59.json`, `research/accessory-face-assets-v59.json`.
- Assets: `web/assets/vendor-faces-v59/cisco/`, `web/assets/faces-v59/huawei/`, `web/assets/faces-v59/other/`.
- Core edits: `src/datacenter/device-orientation.js`, `scene.js`, `simulator-editor.js`, `entry.js`, `data.js`, `viewer-scene.js`, `viewer-ui.js`, `device-model.js`, catalog sync and generated bundle.
- Styles: `web/datacenter.css`, `web/device-viewer.css`, `web/index.html`.

## Validation and limits

Automated tests cover unchanged catalog interfaces, both face records and local asset existence, real Three.js world-space orientation of the C1121 I/O face, multi-U rack collision/placement, camera preservation, walking placement and release behavior, existing editor regression and export checks. Scene tests mock DOM and renderer, not the Three.js geometry/math.

Assets were visually inspected independently. Browser automation is unavailable in this environment; live WebGL appearance, pointer lock, touch interaction and frame rate have not been verified on actual browsers/devices. Glass is transparent material rather than ray-traced architectural glazing. Models use physical envelopes with face imagery, not complete vendor CAD internals.

No private customer PowerPoint or topology files are included in public assets. Existing PPTX access denial is preserved.
