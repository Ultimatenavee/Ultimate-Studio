# v66 Rack power tube, card configuration and Core/PE airflow

## User-visible behavior
- MAX Rack / IT budget is entered in W. Existing projects already store W and remain unchanged.
- The capsule gauge fills proportionally against a fixed green-yellow-red spectrum. 200/800 W =25%;950/800 W =118.8%, fill clamps100% and text explicitly says150W over MAX. UI advisory bands≤60%,≤85%,>85% are not a circuit sizing standard. Unknown device loads remain incomplete, never assumed zero.
- Studio Bayface Inspector and Simulator double-click device metadata expose Power configuration. Manufacturer BOM references and grouped slot calculator are separate choices. Manual whole-device override retains highest priority.
- Card calculator supports card count, occupied slots/card, supply/chassis variant, per-group quotas, fill-all-groups, base watts and Max/Typical basis. Vendor component watts and footprints are used only where verified; missing values require user entry and results are labeled Manual calculation. Base must include control/fabric/fans and relevant conversion loss without re-adding the selected cards. No linear scaling of full chassis watts.
- Cisco groups remain distinct (NIM, SM-X, ISC, etc). Double-wide counts use footprint but don't double device watts. This tool does not certify arbitrary card compatibility, shared-slot adjacency, optics load or thermal compliance. Select exact qualified cards.
- M8/M14 reference BOMs are Typical, not full-population maxima. F1A is fixed and has no card selector. X4/X8A have slot limits but no verified general base; they cannot auto-infer watts for arbitrary slots.
- All Core/PE occupied racks now have animated illustrative airflow. Known M14 direction is left-to-right; unknown directions are illustrative front-to-rear rack paths, not a claim about actual fan variants or CFD. Cooling and motion controls pause/hide the animation. Empty and passive-only racks add no device airflow.
- Metadata-only power saves preserve 3D device and airflow resources instead of reloading device art. Geometry/U changes rebuild the appropriate content and refresh paths.

## Evidence
Research JSON contains original URLs and qualifications. Huawei QA-V2 now has16.2W typical/16.97W maximum from a manufacturer-authored reseller mirror, independently corroborated by exact model. FortiGate conflicting regional publications require explicit document selection. C1121 AC input and T-Marc280 consumption remain unknown: published device-only DC draw or adapter output ceilings are not AC/PDU consumption. Additional sources do not magically establish UPS/PDU/rectifier own losses.

## Validation
Full npm test and Worker build; new numeric tests cover25%, overload watts, mixed cards and footprints, per-group capacity, missing base, basis mismatch, vendor BOM, manufacturer/reseller evidence, manual precedence, Bayface roundtrip and Core/PE path direction. Real Three/math with mocked renderer checks metadata-only saves preserve model and airflow identities. Browser/GPU interaction and download were not tested in this environment.
