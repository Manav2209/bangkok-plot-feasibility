# Specification status and acceptance evidence

Updated 23 November 2026. Functional implementation is substantially expanded; the complete
legal/site/submission acceptance gates are not closed. This file distinguishes implementation
from verified legal applicability. It must not be used to claim the whole assignment complete.

## Implemented product requirements

- **FR-1:** Terra Draw simple/concave outlines, vertex editing, keyboard coordinate fields,
  undo/reset, invalid-shape rejection and explicit complexity bounds. Seeded geometry properties
  exercise orientation invariance, exclusion monotonicity, holes and split components.
- **FR-2:** one or more frontage edges, per-road width/provenance/confirmation and physical-edge
  remapping after winding normalization. Topology edits clear stale frontage references; vertex
  moves invalidate width confirmation. Every selected road constrains the reference model.
- **FR-3:** condominium and office selection, with separately researched Y.7 size/road/station
  conditions in the historical reference study. Legal use permission is not silently passed.
- **FR-4:** versioned JSON ledger and profile, Zod validation, dependency gates, clauses,
  interpretations, Thai excerpts where obtained, direct sources and individual evidence status.
  One narrowly scoped planning-baseline evidence check is verified; unresolved items stay visible.
- **FR-5:** per-edge capsule exclusions, full-building and floor-based conditions, conservative
  road-height slices, preserved multipolygons and separate model budgets. Selected spatial rules
  highlight their actual excluded regions; budget selection highlights capacity separately.
- **FR-6:** bounded deterministic frontage-oriented compact search plus courtyard/stepped option;
  actual floor polygons and independent evaluation. Default reference concepts are distinct.
  They are research candidates, not legally verified feasible designs.
- **FR-7:** per-design pass/fail/unknown/N/A data model. Design-assumption checks are explicitly
  separate from statutory checks; gross-area proxies are labelled. Missing prerequisites cannot
  produce a statutory numeric pass.
  Optional programme inputs support reference parking quantities, driveway/connecting-road
  screening and environmental-review triggers. Parking floors reserve rendered polygons and
  reduce usable capacity; ground parking and landscape compete for available ground. Physical
  building-floor parking plans now include contained stalls, connected aisle strips and service
  reserves, with selectable 2D floor inspection. Building-facade/perimeter public-front geometry
  is screened separately. Ramps, swept paths, access rights, fire routes and current legal
  applicability remain unresolved; schematic geometry does not close these evidence checks.
  Optional straight/curved ramp inputs now screen actual level rise, grade, flight/rest lengths,
  declared headroom/width and entrance separation. A straight-ramp rectangle must fit the common
  service reserve on every parking floor without intersecting stalls or aisles. Its red overlay
  is a reservation, not a verified slab opening, swept path, structure or vertical section.
- **FR-8:** bundled real OSM buildings, roads and waterways; actual BMA 2013 zone polygon;
  source IDs, retrieval dates, attribution, manifests and height estimates. No existing building
  is erased to manufacture vacancy. The UI discloses missing/out-of-coverage surroundings.
- **FR-9:** immediate measured envelope preview; debounced worker search; cancellation of active
  obsolete work; warm-worker reuse after completed work; revision-consistent result commitment.
- **FR-10:** strict v3 URL/local scenario state, v1/v2 migration, physical geometry and reference
  validation, payload bounds, clipboard fallback and safe invalid-link recovery.
- **FR-11:** empty/invalid, outside/straddling zone, boundary guard, calculating, partial,
  insufficient-data, reference collapse, bounded-search failure, map/data failure and retry.
  A verified feasible/infeasible legal verdict is intentionally unavailable while evidence is open.
- **FR-12:** sources, visible limitations, legends, local address/road/coordinate search,
  responsive collapsible panels, focus-managed dialogs, keyboard controls and mesh/listener cleanup.
  First-use instructions are available in the app. Roads are white/cased with clickable names
  and a nearest-road/source list; zoning is purple/dashed and selected frontage is orange.
  Camera/layer/overlay controls wrap together so 2D/3D cannot be covered by the overlay control.

## Important implementation boundaries

The rectangle search is bounded and approximate, not an exact global optimizer. Road-height
regions are conservatively evaluated at slice tops, including each floor interval. The study
uses conservative all-frontage restrictions rather than every legal multi-road exception.

The reference mode is restricted below both23m and10000m² gross modelled area because further
high-rise/extra-large requirements are not fully implemented/verified. A low building can still
be extra-large. Gross modelled area counts all generated floor polygons for the study;
statutory exclusions are not invented. Core/circulation and permeable area are allocations,
not detailed approved plans. Local search covers mapped names/addresses and coordinates,
not a global commercial geocoder.

## Evidence still required for complete acceptance

The user does not need to own or supply a parcel. The original draft expressly permits an
illustrative drawn boundary unless cadastral evidence exists. A demonstration needs an
identifiable, geolocated outline, an attributable dated vacant-condition observation and
honest frontage/road evidence; it must retain its illustrative status. A title survey is
required only for a claim about actual legal property boundaries, not as a prerequisite to
the demo. Earlier handover requests for a title number were too restrictive for that purpose.

1. **A real vacant default parcel:** the translated L shape is inside the authoritative 2013
   GIS polygon with documented clearance, but is illustrative. Dated current vacancy, cadastral
   boundary, legally relevant road reference/width and site overlays are not verified.
2. **Complete current rule coverage:** recognized baseline continuation is supported. Partial
   amendments, overlays, counting definitions, exceptions and project-specific access, parking
   and environmental review need completion. These are substantive legal/engineering gaps,
   not publication or UI polish tasks.
3. **Two legally feasible default designs:** two candidates pass implemented research/design
   constraints; unresolved statutory prerequisites prevent an overall legal feasibility pass.
4. **Data rights/accuracy:** OSM context is ODbL. BMA's catalog does not specify explicit zone
   reuse terms or surveyed positional accuracy; a 1 m study guard is not a source accuracy claim.
5. **Performance acceptance scope:** the final milestone06 repeated audit meets all recorded
   targets on the tested laptop, including continuous hardware pan/rotation. Earlier cold-load
   and dense-edit misses are retained. Reports in `docs/performance` record the actual device,
   conditions and limits; the result does not guarantee every device or scene.
6. **Applicant-owned submission:** the actual assignment service/deadline, personal history,
   six setup answers, applicant-authored one-pager, original early transcripts, resume/project
   links and final receipt are not supplied. Nothing is fabricated or submitted in their place.

## Verification record

Milestone06 adds a dated imagery study, targeted rule/terms findings and a repeated production
performance audit. See `milestone-06.md`, `research/site-evidence-06.md` and
`research/coverage-audit-06.md`. The new observation is not a vacancy-today or access certificate.
Current correctness checks passed: typecheck, production build, **140 unit/property tests**
(28 geometry, 27 rules, 63 engine, 22 web) and **26 production browser flows**. The independent
review also passes for the new dated study's two model concepts.
The repeated audit exposed misses absent from the earlier single sample. After search optimization,
all recorded targets passed; results are in `performance/acceptance-06.json`. Earlier timings below
remain historical evidence rather than a guarantee for other devices or scenes.

Milestone05 recorded typecheck, production build, rule validation and **134 unit/property tests passed** (23 geometry,
27 rules,62 engine and22 scenario/road tests). **All25 production browser flows passed**, including
rapid edits, worker reuse, share/persistence, two concepts, failure recovery, responsive controls,
coverage notices, saved parking inputs, selectable parking geometry, first-use guidance and
clickable 2D/3D controls at1000px/390px, steep-ramp rejection, an aligned declared reservation
and saved nested ramp dimensions. `pnpm review:designs` passed independent review assertions
and records both accepted and rejected candidate attempts in `validation/design-review-05.json`.
Both context and zone manifests pass
provenance/hash checks. Source screening found no recognized credentials/private-file names;
that pattern check is not an exhaustive secret audit. Desktop and mobile screenshots were
visually inspected and saved under `docs/screenshots`.

Milestone04 production measurement: initial usable view3.528s under10Mbps down/5Mbps up and40ms
latency; ordinary parameter edits223–262ms; actual six-vertex boundary edit320ms. At100vertices,
the parameter edit took397ms and actual boundary edit499.8ms, close to the500ms target with
little margin in this sample. Zero idle renders over500ms; short hardware camera transition55.6fps.
These are single-device samples, not sustained performance certification. Reports retain driver
elapsed times separately from input-handler-to-render latency. See `milestone-04.md` and the
raw `performance` reports for scope and limits.

The local app is available at http://127.0.0.1:5173. The public app is deployed at
https://bangkok-plot-feasibility.vercel.app/. The user completed Vercel deployment on
23 November 2026; public HTTPS, rendering and asset checks are recorded in `vercel-deployment.md`.
Source is published at https://github.com/Manav2209/bangkok-plot-feasibility.
Assignment submission remains deferred.
Local functional checks are complete for the implemented reference-study scope; the
substantive legal/site gates above remain open. Follow-up evidence is in
`research/legal-evidence-04.md`, `research/legal-audit-05.md` and `research/site-audit-05.md`.
The latter primary owner/bank inventory search did not produce a qualifying parcel. The demo's
missing evidence is a geolocated illustrative outline tied to dated actual-condition evidence
and attributable frontage/road information. Actual legal boundary/access certification additionally
needs the relevant title and authoritative road-corridor/access-chain records. No generic advertisement or
test can substitute for them. A reviewed parking section and vehicle/fire trajectories are also
still required for a stronger physical/legal feasibility conclusion. `milestone-05.md` records
the completed reference checks and those external gates; its title-record request is not a
mandatory input for choosing a public demonstration site.

The additional EIA and public road-register investigation is recorded in
`research/public-demo-evidence.md`. It did not establish a currently vacant replacement site.
First-use guidance now explicitly says that a personal parcel is unnecessary. The production
build passed after that copy clarification; the calculation logic and prior test results are unchanged.
