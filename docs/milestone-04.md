# Milestone 04 — road clarity, parking geometry and access research

23 November 2026. Local implementation only; deployment and publication remain deferred.
This record distinguishes completed changes from evidence-dependent acceptance requirements.

## Changes

- Roads use a visible cased white line, while zoning is purple/dashed and selected frontages
  remain orange. Clickable labels and a nearest-six road list expose real OSM names, IDs and
  source links. Distance is measured against mapped centrelines, not legally relevant road edges.
  Unknown names/widths are not invented; clipped pieces are deduplicated by source ID.
- The 2D/3D, layer and overlay controls share a wrapping toolbar. A resize observer moves the
  location/detail panels below its actual height. The former laptop CSS placed the camera
  switch at75px and the overlay at72px, causing the reported overlap. Controls now remain
  independently clickable at1000px and390px widths.
- First-use guidance explains location versus parcel boundaries, road/frontage colours,
  concept comparison, floor accounting, unknown evidence, save/share and the stored-rule workflow.
- Fixed save ordering: spreading defaults after project data previously discarded parking and
  programme inputs. The save regression now checks those fields after reload.
- Added bounded perpendicular parking packing on real floor polygons: individual2.4×5m stalls,
  6m aisle strips and an independent service/core reserve. Holes, orientation and containment
  are respected. More floors are reserved when a pure area allowance overstates packing capacity.
  Each floor plan can be inspected in2D, while parking floors remain blue in3D.
- Parking geometry is a schematic study, capped at200 stalls per floor. Connected aisle strips
  are not vehicle swept paths. Ramps, columns, vertical clearance, intersection entrance location,
  gradients and lawful public-road connection remain independent unknowns.
- The public-front geometry proxy measures the actual building facade and external building
  perimeter. It never substitutes a long plot frontage for a short building alignment. It reports
  the separate non-fronting6/12m opening, perimeter/6 length and connected-route review conditions.
- Added an independent extra-large study guard: every reference concept must be below10000m²
  gross modelled area as well as below23m. A low but large building cannot silently bypass the
  enhanced regime. These are supported-study bounds, not claims of legal maximum capacity.
- Rules/profile revision is research-preview.4 /1.1, with16 rules and8 sources. Older shared
  scenarios still parse and are canonicalized to the current ruleset. Evidence statuses were not
  promoted merely because source text or schematic geometry became available.

## Research and acceptance limits

`research/legal-evidence-04.md` records primary-source text for BMA52(6),53,83–90; the original
MR33 and replacing MR50/MR69 provisions; distinct area definitions; emergency operating bays;
and waterway-bank setbacks. An amendment bundle is not an integrated current consolidation.
Parking-specific exclusions are not automatically FAR exclusions. A map water centreline is
not a legal bank boundary and cannot be offset as though it were one.

`research/site-evidence-04.md` records the public search for a real vacant site. The exact-zone
OpenAerialMap query returned no images; dated KartaView camera metadata did not establish a
visually inspected parcel; broker leads lacked usable parcel/capture evidence or advertised
different zoning. Consequently the default remains explicitly illustrative, not vacancy-verified.

Complete acceptance still requires a surveyed/titled parcel, attributable dated vacancy evidence,
legal road/bank/overlay records and a complete applicability/counting/amendment review. Physical
access must then be checked against those inputs. Two legally verified default designs cannot
be certified from the currently available evidence. This is a material unclosed requirement,
not a pending deployment step. Applicant personal material and submission are separate work.

## Verification

- Type checking, production build and120 unit/property tests passed:23 geometry,27 rules,
  50 engine and20 browser-domain/scenario/road tests.
- All24 production Chromium behavior flows passed, including saved parking inputs, road
  inspection, selectable parking floor geometry, first-use guidance and exposed 2D/3D controls
  at laptop/mobile widths. The original parking browser assertion was corrected to match
  the actual label; geometry/count assertions were retained.
- Context/zone manifests and source-pattern scan passed. The scan is not exhaustive proof of
  no secrets. Production bundle-size warnings remain visible.
- Saved captures: `screenshots/sample-3d-04.png`, `screenshots/mobile-04.png`,
  `screenshots/parking-plan-04.png`, `screenshots/view-controls-laptop-04.png` and
  `screenshots/view-controls-mobile-04.png`. These show the actual tested production build.
- CUA also loaded the current example and switched to3D. Its screenshot backend was unavailable;
  the successful production test captures supply visual evidence. The user's original tab and
  unsaved outline were retained; refresh is needed if that tab still displays older UI.

Performance reports under `performance/` describe the measured build, environment and scope.
Boundary edits are measured separately from floor-count changes. A short camera transition is
not sustained GPU certification. Local app: http://127.0.0.1:5173.

The production GPU run measured initial usability3.528s under10Mbps down/5Mbps up/40ms latency,
ordinary parameter edits223–262ms and a six-vertex boundary edit320ms. The100-vertex parameter
edit took397ms; its actual boundary edit took499.8ms, meeting the500ms target in this sample
with little headroom. Short camera transition55.6fps; idle0frames/500ms. Driver/action/polling
elapsed times remain separate in the raw report and are longer than application latency.
