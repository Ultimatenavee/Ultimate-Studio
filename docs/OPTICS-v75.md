# v 75 — Inspection and manufacturer-referenced optics showcase

Inspection uses Ultimate Studio's Inter / Noto Sans Thai / Tahoma font stack, with darker bold headings. The accuracy banner is removed from the primary details. Existing evidence and dimension status stay in the catalog; physical notes and reference imagery are available under the collapsed source section. Automatic rotation starts when inspection opens, unless the operating system requests reduced motion. A fixed view stops rotation; the checkbox resumes it. Pointer interaction temporarily pauses rotation.

The Datacenter simulated LED controls, added device lamps and periodic LED updates are removed. Original manufacturer face images retain their photographed details. Topology engineering LED/status behavior is unchanged.

## Optical data and display

`src/datacenter/optics-catalog.json` is the authored manufacturer research catalog. The build copies it into `museum-optics.json`; it never rewrites the Topology editor's compatibility matrix. All nine former optical IDs remain valid. There are49 researched entries across1G,10G,40G,100G, plus a400G QSFP-DD example and10/40/100G cable assemblies. This is a sourced selection of product variants, not every SKU on the market.

One glass showcase has seven family compartments: SFP, SFP+, QSFP+, QSFP 28, QSFP-DD, DAC and AOC. Two specimens per family are displayed on each page. The other variants are reachable through the catalog and Locate action. Optical paging is separate from neighboring ODF equipment. The end kiosk opens filters for speed, family, media, active strands and published maximum reach. Model presentation is magnified; cable coils are a display arrangement, not a rendering of the full 1 m/10 m cable length.

The model factory requires a manufacturer URL and documented envelope. It distinguishes simplex LC, duplex LC, MPO-12, RJ 45 and captive two-ended assemblies. SFP/SFP+/QSFP 28 often share their respective mechanical envelopes despite different optical functions; speed alone is not a reason to invent a different shell. Repeated contacts/ferrules are instanced to reduce draw calls while retaining detail. Form geometry follows the cited drawings and visible physical features; these are application models, not imported factory CAD.

Important distinctions retained:

- SMF BiDi can use a single strand and needs a complementary wavelength pair.
-40 G/100 G MMF BiDi with duplex LC uses two strands; BiDi does not always mean single fiber.
- SR 4 MPO-12 uses eight active fibers (four Tx, four Rx), not two LC fibers.
-100 G ER 4 L/4 WDM extended reach can depend on host FEC; ZR reach depends on link loss.
- Cisco GLC-ZX nominal reach is about 70 km; the displayed 80 km duplex 1 G variant is the FS documented product, not a relabeled Cisco ZX.
-20/40/80 km selections exist only where a vendor documents them. The UI does not synthesize a Cartesian product of all media/rate/reach combinations.

## Primary references checked 2026-10-15

- Cisco1G optics: https://www.cisco.com/c/en/us/products/collateral/interfaces-modules/gigabit-ethernet-gbic-sfp-modules/datasheet-c78-366584.html
- Cisco10G SFP+: https://www.cisco.com/c/en/us/products/collateral/interfaces-modules/transceiver-modules/data_sheet_c78-455693.html
- Cisco40G QSFP+: https://www.cisco.com/c/en/us/products/collateral/interfaces-modules/transceiver-modules/data_sheet_c78-660083.html
- Cisco100G QSFP28: https://www.cisco.com/c/en/us/products/collateral/interfaces-modules/transceiver-modules/datasheet-c78-736282.html
- FS1G20km mechanical outline, p8 and ordering table: https://resource.fs.com/mall/resource/sfp1g-elx-31-datasheet.pdf
- FS10G20km BiDi: https://img-en.fs.com/file/datasheet/bidi-sfp%2B-1330tx1270rx-20km-transceiver-datasheet.pdf
- FS10G80km BiDi cover and mechanical outline, p11: https://img-en.fs.com/file/datasheet/bidi-sfp-plus-1270tx1330rx-80km-transceiver-datasheet.pdf
- FS100G range and mechanical envelope with pull tab, p29: https://resource.fs.com/mall/doc/20230403154821f3r427.pdf
- FS QSFP-DD FR4 cover and mechanical drawing, p14: https://resource.fs.com/mall/resource/qdd-fr4-400g-data-sheet-2.pdf
- BlueOptics QSFP28 photo and mechanical drawing, p1/p6 (family reference on the backboard, not a Cisco product photograph): https://files.cbo-it.de/blueoptics/datasheet/en/transceiver/qsfp28/duplex/BO28L859S1D_100GBASE-SR4_QSFP28_Transceiver_850nm_100M_Multimode_MPO_103.125_Gigabit.pdf
- ProLabs10G passive cable outer-diameter reference: https://prolabs.com/Datasheets/DAC-SFP-10G-1-5M-C_datasheets_EN.pdf
- Optcore10G AOC physical assembly / bend-radius reference: https://www.optcore.net/product/sfp-10g-aoc10m-csc/

Public manufacturer picture extracts only are bundled in `web/assets/optics`. The complete PDFs and user/customer documents are not published.

## Verification

The regression suite covers existing Topology, Bayface, interfaces, licenses, power, navigation and export behavior. `verify-optics.mjs` checks evidence requirements, preserved IDs, source envelopes, finite geometry, compartment bounds, filter intersections, impossible combination rejection, optical page picking and unchanged ODF visibility. Scene tests check LED overlay removal. Native browser/GPU appearance and hardware FPS were not measured in this environment.
