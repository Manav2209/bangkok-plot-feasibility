# Bangkok Plot Feasibility Tool — remaining implementation specification

Version 1.3 · 23 November 2026 · local implementation expanded through milestone 05; evidence gates open

This is the engineering specification for the work left after milestone 01. It supplements
`PLAN.md` and the supplied draft specification. It is not an applicant submission or a legal
opinion. A task is complete only when its acceptance evidence exists. Publishing and submission
are final delivery tasks; an incomplete research preview must not be described as compliant.

The baseline section below describes the original milestone-01 starting point. Current
implementation and acceptance evidence are tracked in `spec-status.md` and `milestone-03.md`.
Authoritative 2013 zone GIS, real context, reference rule models, height slices, two bounded
concept searches, parking-floor reservations, source inspection and versioned scenarios are
now implemented. Verified vacant-parcel evidence and complete applicable statutory coverage
remain open. Source publication was authorized on 23 November 2026. Deployment and submission
remain deferred by the user.

Milestone04 adds contrasting/clickable roads, first-use guidance, an exposed responsive camera
toolbar, saved project-input fixes, individual schematic parking stalls/aisles/service reserves,
building-facade access screening and an independent extra-large-area study guard. Its current
verification and remaining owner/agency/competent-review evidence are in `milestone-04.md`.

Milestone05 adds actual-level ramp arithmetic, common floor-space reservations, rejected
candidate evidence and a reproducible two-approach review report. The finite amendment audit
and primary owner/bank inventory audit are complete as investigations; they did not establish
an exhaustive current-law certificate or a vacancy/frontage-verified default. Exact required
owner/authority/design artifacts are enumerated in `milestone-05.md` and remain acceptance gates.

Scope correction: the supplied draft allows an illustrative outline unless cadastral evidence
exists. Ownership or a title survey is not mandatory for a public demo; those records are
needed for claims about legal property boundaries and rights. The user need not provide a
personal parcel. Continue selecting a public demonstration site using dated condition evidence,
while keeping stronger legal/site conclusions separate and unknown where unsupported.

## 1. Baseline and delivery boundaries

The existing workspace provides React/Vite, Turborepo, metric projection, simple-polygon drawing
and editing, topology-preserving operations, georeferenced meshes, two massing experiments,
shared polygon accounting, a worker with revision filtering, browser-local saving, source notes,
20 geometry tests and 14 engine tests. These are reusable foundations.

The current sample is illustrative. Its uniform inset and floor settings are assumptions.
No authoritative zone, vacant site, legal road width or complete applicable ruleset is verified.
Both concepts are unverified massings. Gross modelled area is not regulated FAR area.

Scope remains one verified Bangkok zone; condominium and one separately researched office use;
arbitrary simple outlines, including concave plots; multiple road frontages; two compliant
default-site concepts; real surroundings; live recalculation; versioned share links. Interiors,
structural design, permit approval, accounts and server-side calculation remain outside scope.

## 2. Workstream E — legal and site evidence (release blocker)

### E1. Establish the applicable instruments

Deliver `docs/research/legal-baseline.md` and source records. Search official BMA, Royal Gazette
and other competent government sources. Record issuer, instrument title, publication date,
effective date, amendments, repeals, transitional provisions, source URL, page/clause, retrieval
date and interpretation limitations. Separate the 2013 instrument from later draft plans.

A source being downloadable does not prove present applicability. A recent consultation notice
does not itself prove either enactment or absence of a replacement. Preserve conflicting
evidence and the unresolved question; do not resolve it by selecting convenient figures.

Acceptance: every implemented statutory rule refers to an identified applicable instrument;
the legal-version prerequisite has a reviewable evidence chain. Otherwise dependent checks are
unknown. Tests cover expired, draft, unverified and incomplete source records.

### E2. Verify zone, site, frontage and overlays

Deliver a supported-zone GeoJSON and an evidence manifest. Include zone code, authoritative map,
coordinate system, extraction/digitization method, boundary uncertainty and verification date.
Select a real vacant site wholly within the supported zone. Preserve a dated imagery reference,
observation date, illustrative/cadastral boundary status, road frontage evidence and relevant
waterway, railway, road-widening or other overlays.

Do not promote the current geographic research window to a zoning boundary. Do not equate
absence of OSM buildings with vacancy. Historic imagery proves an observation at its date.
If the provisional zone or site fails verification, document the alternative before freezing.

Acceptance: default polygon, actual adjacent roads, source references and vacancy evidence are
inspectable; within/outside/straddling/uncertain membership are distinguished. With an uncertain
boundary, dependent legal checks remain unknown. Fixtures include tangent boundaries, a narrow
crossing and a plot whose centroid is inside but part of its area lies outside.

### E3. Machine-readable rule ledger

Deliver versioned JSON plus a Zod validator and pure evaluation functions in `packages/rules`.
Each row contains ID, title, category, supported uses, predicate ID, required input names,
dependencies, parameters and units, source references, original Thai excerpt, English
interpretation, instrument version, exceptions, evidence and implementation status, geometry
or accounting effect and independently specified boundary cases.

Research separate rows for: permitted use; use/size limitations; FAR; FAR inclusions/exclusions;
OSR denominator; minimum uncovered area; permeability; road, side/rear and waterway setbacks;
absolute and road-relative height; building classification; fire access; parking; environmental
review. Each ends as implemented, justified not applicable, or unresolved.

The validator rejects duplicate IDs, dangling dependencies/sources, dependency cycles,
nonfinite parameters, missing units, and verified entries without complete verified evidence.
Builds/tests validate the actual committed ledger. A numeric pass requires verified applicability,
known inputs, verified prerequisites and a supported evaluator. A definite applicable failure may
be reported alongside unknown checks; the design still cannot receive a feasibility pass.
Not applicable requires a known applicability decision and an explanation.

Acceptance: actual/required/unit/source appear for evaluated numeric rules. Malformed ledgers
fail checks; unresolved items remain visible individually. Applicant/road assertions cannot
promote a statutory source to verified. Tests use synthetic rules explicitly labelled fixtures.

## 3. Workstream G — metric geometry and legal envelope

### G1. Numeric and input contract

Continue WGS84 storage and EPSG:32647 metre computation. Translate to a documented local origin;
the current fixed research origin may remain for compatibility until per-site frames are added.
Specify the clipping grid, containment/area tolerances and height boundary conventions separately.
Use unrounded values for decisions. Document projection distortion for the supported extent.

Normalize redundant closure and harmless consecutive duplicates; preserve vertex/frontage
identity when normalizing. Reject self-crossings, self-touches, zero-length/doubling-back edges,
nonfinite/out-of-range coordinates and area below the documented meaningful minimum. Handle
100 vertices. Any defensive complexity limit must be explicit and tested.

Acceptance: rectangle, triangle, L/U shape, acute corner, narrow neck, holes, split components,
collapse, reverse winding and rotated start index preserve topology and accounting. No convex
hull or bounding rectangle may replace the input plot.

### G2. Frontage and exclusion regions

Extend site input with roads and frontage references. Road records contain stable ID, metric-
convertible geometry, legally relevant width, provenance (tag/measured/user), evidence reference
and confirmation state. Plot edges reference roads; multiple edges and roads are allowed.

Invalidate/remap frontage references after vertex insertion/deletion; never silently attach a
width to another edge. Suggest adjacent roads from bundled data and expose every relevant road.
Road tags and user entry remain distinct from verified right-of-way evidence.

Implement per-edge capsule exclusions using a segment rectangle and conservative polygonal
end caps with at least 16 subdivisions and a documented maximum distance error. Existing miter
offsets remain design experiments until replaced/validated against the chosen statutory reading.
Apply waterway/road restrictions against the sourced reference line, not automatically the plot
boundary. Preserve holes and disconnected buildable areas after subtraction.

Acceptance: independently checked edge-distance cases, unequal setbacks, multiple frontages,
acute/concave corners and road-reference cases. Unknown road width makes dependent checks
unknown; selecting the favorable road alone cannot bypass another applicable frontage.

### G3. Height slices and budgets

Return slices with bottom/top elevations, multipolygons, source/limiting-rule IDs and evidence.
Collect all rule breakpoints. Each occupied floor must fit the envelope over its full vertical
interval, including crossing a threshold. For position-dependent road-height planes, evaluate
the footprint at the conservative top of each interval or provide an error-bounded refinement;
arbitrary coarse slices must not admit a forbidden part of a floor.

Keep FAR, uncovered-space and permeability budgets separate from the geometric upper bound.
Unknown limits are shown as unknown, without a fabricated zero/infinite legal allowance.
An empty research inset is distinct from proven statutory infeasibility.

Acceptance: below/at/above height tiers; changing each geometric rule visibly changes its region;
aggregate rules change budgets/checks; all returned geometry carries the calculation revision.

## 4. Workstream A — accounting, compliance and design search

### A1. Shared accounting

Extend each design with per-floor use, actual polygon area, included/excluded regulated-area
breakdown, covered-projection union, uncovered/permeable allocation and independent checks.
Regulated area stays unknown until inclusions/exclusions are verified. Do not use gross area
as a statutory substitute. Compute a true union when overhangs/multiple masses are introduced.

Display a floor table: level, base/top height, polygon area and total. Generated meshes consume
those polygons directly. Label floor height, core ratio, minimum usable dimensions and
circulation assumptions separately from rules. Permeability is an explicit allocation, not the
same number as uncovered ground.

Acceptance: area of every floor matches its polygon; totals equal the sum; covered plus uncovered
equals plot within tolerance; holes and overhangs are handled; no negative open area from rounding.

### A2. Independent compliance

Checks belong to each design, not only the overall calculation. Include envelope containment
over every floor interval, height, regulated FAR, OSR/permeability, use, classification, parking,
access and review triggers. Geometric experiments may pass an assumption check while legal
checks remain unknown; the UI must distinguish the two scopes.

Acceptance: A can fail a numeric condition that B passes; shared unknown prerequisites remain
unknown on both; source details and actual/required values correspond to the selected design.
The result distinguishes verified feasible, proven infeasible, insufficient data and bounded-search
failure. Triggering an external review is not itself proof that a design is prohibited.

### A3. Generator A and B

A searches frontage-aligned orientations and offsets of ±15 and ±30 degrees for usable compact
rectangles. B searches courtyard configurations with a minimum void dimension and a stepped
fallback. Use deterministic candidate ordering/seed, bounded iterations and cancellation points.
Search each valid component; do not join disconnected components with fictitious floor plates.

Allocate floors under verified spatial and aggregate limits, then construct and independently
evaluate the actual floors. Reject slivers, unusable dimensions, failed constraints and duplicate
concepts. Rank capacity, coherence and distinctness with documented weights/tie-breaks.

Acceptance: two independently evaluated distinct concepts on the verified default; one/zero
results elsewhere have honest reasons. Report proven impossibility separately from search
exhaustion. No attractive template is presumed compliant after clipping.

## 5. Workstream C — real context and map integration

Deliver a bounded approximately 1 km extract under `apps/web/public/data`, with building/road
features and a manifest. Record provider, licence, attribution, retrieved time, extent, source IDs,
processing and edits. Preserve source heights; derive estimates from levels or a documented
fallback and label them. Context heights never become compliance inputs.

Prefer permitted one-time OSM/Overture/official extracts; store converted GeoJSON for runtime.
Validate geometry/properties and coverage. Do not invent buildings or infer that missing features
mean vacant land. Pick a licence-clear keyless basemap suitable for production and keep required
attribution visible. Context fetch failure gets its own notice and retry path.

Render muted context extrusion and roads, zone outline, plot and contrasting proposals. Verify
mesh alignment under zoom, bearing and pitch against actual features; test translucent envelope
depth ordering and holes. Keep existing buildings visible in existing-site mode; identify any
redevelopment assumption. Dispose old meshes/materials/listeners; repaint only on changes.

Acceptance: real source IDs and labels inspectable; bundled data works without a geographic API
while dragging; missing tiles/context never appear to certify an empty neighborhood.

## 6. Workstream U — complete browser workflow

### U1. Inputs and results

Add researched office support without invented rule differences. A research-only option must be
labelled unavailable for legal conclusions until its applicable rules are researched. Add address
search with attribution/provider policy, local pan fallback, frontage interaction and width evidence.
Show m² and rai/ngan/square wah (1 rai = 1,600 m²; 1 ngan = 400 m²; 1 square wah = 4 m²).

Add rule-specific details (meaning, actual, limit, units, version, Thai excerpt and interpretation),
geometric highlighting, separate FAR/open-space budgets, design focus and optional envelope
overlay. Use collapsible responsive panels, keyboard-operable controls, readable legends and
focus management. Preserve reset/undo behavior and visible feasibility/permit limitations.

Acceptance: every documented journey step works without reload on a laptop and narrow window;
use/road/plot changes affect rules and candidates for evidenced reasons.

### U2. Share and persistence

Provide a compact versioned URL-fragment scenario containing plot, use, assumptions and, once
implemented, road/frontage/ruleset identifiers. A shared scenario overrides local saved state;
an invalid link shows actionable feedback and loads a safe default rather than stale private data.
Validate finite/ranged coordinates, polygon validity, field limits and payload size. Never use eval.
Reject unsupported versions and fields; explicitly migrate known older versions. Include no keys.

Copy link through Clipboard API with an accessible manual-copy fallback. Loading the link in a
fresh browser reproduces inputs/results. Local save preserves the same validated contract and
handles disabled storage. A fragment does not require server routing for static hosts.

Acceptance: round trip; unsupported version; malformed/oversized payload; invalid polygon;
shared-state precedence; no local-storage access; copied URL reloads deterministically.

### U3. Explicit states

Represent empty input, invalid input, outside zone, boundary uncertainty, calculating, feasible,
proven infeasible, insufficient data, partial results, search exhausted and context failure.
Distinguish analysis state from map/network state. When input changes, clear or label stale output;
never combine a new boundary with old unlabelled metrics. Show limiting rule or next missing input.

## 7. Workstream P — concurrency and measured performance

Separate envelope and candidate-search timing. Prioritize the envelope; publish only revision-
consistent geometry/metrics. Debounce drag events, coalesce queued revisions and cancel obsolete
search via cooperative yields or worker replacement. Bound input and candidate counts.

Measure ordinary and 100-vertex plots, repeated edits and context size. Record browser, OS, CPU,
GPU/rendering mode, viewport and network profile. Targets: envelope <100 ms; full result <500 ms;
camera >=30 fps on integrated GPU; usable initial view <5 seconds; no idle animation/repaint.
Report median/p95 and failures rather than a single favorable engine duration. Software-rendered
Chromium behavior checks do not prove hardware frame-rate targets.

Acceptance: reproducible benchmark command/report, no stale revision under rapid changes,
bounded work after cancellation, documented loading costs. Address large bundles by measured
lazy loading/code splitting before claiming the initial-view target.

## 8. Workstream V — test and release evidence

Keep existing analytic fixtures; add synthetic rule-boundary cases, property-generated polygons,
equivalent winding/start-index cases, dependency safety, accounting exclusions, multiple roads,
zone ambiguity and full-height containment. Clearly label synthetic rule numbers as test-only.
Use reproducible property-test seeds and preserve minimized regression fixtures.

Browser acceptance covers sample comparison, concave draw/edit, use/road changes, sources, reset,
rapid edits, 2D/3D, shared link in a fresh context, malformed state, storage denial, map/context
failure, selected-design floor totals, keyboard dialog use and narrow-window layout.

Run typecheck, rule validation, unit/property tests, production build and browser tests. Test
production assets separately from the dev server. Verify no credentials and all attributions.
Record checks actually run and their environment; do not convert blocked checks into passes.

## 9. Workstream D — delivery and applicant submission

Configure a public source repository and static hosting after build verification. Document setup,
tested dependency versions, source/evidence manifest, unsupported rules, known inaccuracies,
performance results, deployment procedure and host fallback. Open live/repo/doc/resume links
signed-out; match URLs in every submission field. Deployment must not claim unresolved legal
coverage. Preserve raw early AI sessions; never manufacture missing transcripts.

Prepare technical factual material for the applicant's seven-section document: live link; repo;
applicant-authored one-pager with the four requested headings; 2–3 actual raw AI transcripts and
an accurate miss/correction note; six truthful setup answers; best project and ownership; about
the applicant/resume. Personal history and missing personal inputs require the applicant's words.

Discover the assignment service's actual deadline/status tools when available. Do not infer time
remaining from this document. Keep the access key out of source, public docs and screenshots.
Submit only the completed authorized application, retain the receipt and check its recorded data.

Acceptance: public links verified signed-out, reproducible source, all sections complete, actual
submission record/receipt retained. If access/tools/personal information are missing, record the
specific dependency and continue independent engineering work.

## 10. Implementation sequence and completion tracking

1. **Increment 02 (implemented; see `milestone-02.md`):** write this specification; schema-validated JSON rule ledger;
   dependency-safe evaluation; independent per-design checks; selected-design floor table;
   versioned share links with local persistence migration and invalid-state feedback.
2. **Evidence gate:** current instruments, exact zone, vacant default, road reference evidence;
   source register and the first verified statutory rule. Research progresses alongside code,
   but no coding milestone can waive this gate.
3. **Increment 03:** per-edge exclusions, frontage inputs, height slices, real context, zone tests
   and a first end-to-end sourced envelope on the verified site.
4. **Increment 04:** regulated accounting, legal budget allocation, bounded generators, office
   differences, two independently feasible default concepts and rule-specific UI.
5. **Increment 05:** cancellation/benchmarks, adversarial/browser QA, accessibility, production
   validation, deployment and applicant submission evidence.

Status lives in `docs/milestone-02.md` and later milestone notes. Record completed tasks with
their checks, incomplete tasks with explicit limits, and evidence questions without guessed
answers. This spec is complete as a work definition; the product is complete only when the
acceptance criteria above are evidenced.
