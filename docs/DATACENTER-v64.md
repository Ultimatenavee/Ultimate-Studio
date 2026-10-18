# Rack power planning v64

## Delivered

An anchored status bar follows the selected/landing rack during placement. It shows known current watts, projected watts, incremental load and budget utilization. Missing consumption values remain explicitly unknown; incomplete totals never produce a safe/headroom conclusion. Same-rack U moves do not add another copy of the device. Over-budget placement warns without blocking the design.

Rack details expose Maximum/Typical selection, an optional usable IT budget in kW, per-device source links, reference configurations and qualifications. Enter submits the form. Budget and basis persist with the standalone design and round-trip to Bayface projects, including undo/redo snapshots.

## Engineering scope

- Uses newly audited consumption records, not legacy originalSpecs or PSU output ratings. Each installed device is counted once regardless of redundant PSU count.
- Maximum and Typical are independent fields. A missing Maximum is not replaced with Typical, PSU rating or an assumed utilization factor.
- Budget means the site-approved usable rack IT allocation. No default 80% circuit derating, power factor, kVA conversion, PUE, UPS efficiency, feed A/B capacity or regulatory/Tier certification is inferred.
- Published test voltage, optics/modules and hardware configuration qualifications remain visible. A datasheet planning total is not measured live consumption or a guaranteed ceiling for unspecified hardware populations.
- UPS/rectifier output ratings and PDU distribution capacities are not counted again as equipment consumption. Their unverified own losses remain unknown. Passive ODF assemblies have zero electrical load.
- The synthetic GPU/CPU/storage fixtures have no exact vendor configuration and remain unknown. Modular PE models remain unknown where the card population is unspecified. C1121's published device-only DC value excludes external adapter losses and is not promoted to AC/PDU input. ALE's traffic test points are retained as metadata, not mislabeled Maximum/Typical. FortiGate 100F conflicting official revisions are unresolved rather than arbitrarily selected.

## Data audit

All 40 named library models/accessories were researched. 25 powered models have at least one usable consumption field, two ODF assemblies are passive, and 13 have no usable Maximum/Typical field under the chosen verification scope. Maximum is available for 18 powered models; Typical for 21. The additional two zero-load ODF records work in both modes.

Sources and exact qualifications are in `research/power-cisco-v64.json`, `research/power-huawei-v64.json` and `research/power-other-v64.json`. General capacity-planning rationale: Schneider Electric, "Why Server Power Supplies Are Like Your Circuit Breaker Panel – Part 1" https://blog.se.com/datacenter/2016/04/28/server-power-supplies-like-circuit-breaker-panel-part-1/ . Device-specific source links are embedded in the generated catalog and inspector.

## Validation

Power tests cover sums, quantities, redundant-PSU de-duplication, before/after preview, no double-count on U move, unknown coverage, no basis substitution, budget/overload, immutable preview, persistence and Bayface round trips. Existing catalog/interface and scene/editor tests run unchanged. Browser/GPU automation is unavailable, so anchored overlay appearance and touch interactions remain unverified in real browsers.

Principal edits: `src/datacenter/power.js`, catalog sync, scene anchor, entry/editor UI, rack placement model, `web/bayface-model.js`, `web/index.html` and `web/datacenter.css`. Existing CLI interface mappings and license data are preserved.
