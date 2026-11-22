# Bangkok feasibility tool — execution plan

Status: implementation started; Turborepo foundation and an illustrative geometry preview are in progress. Updated 22 November 2026. See `docs/milestone-01.md`. Legal/site evidence gates remain unresolved.

This is an internal engineering plan and decision record. The applicant must author the assignment one-pager and personal answers.

## 1. Product outcome and scope

Build a public browser tool that lets a developer draw an irregular plot in one verified Bangkok zone, choose a building type, and compare two feasible 3D massing designs in the real neighbourhood. Every displayed area and compliance check must derive from the same geometry used to render the designs.

Decisions already agreed:
- Geographic focus: Phra Khanong district; provisional zone ย.7-21 from the BMA 2013 district map.
- Default experience: a vacant sample site with real surrounding roads and buildings.
- Plot interaction: editable sample boundary plus arbitrary user-drawn simple polygons, including concave outlines. Do not restrict input to rectangles.
- Initial building type: condominium. Target a second researched use, preferably office, to demonstrate meaningful rule changes. Do not invent different rules merely to make the selector appear functional.
- Map: MapLibre GL JS. Proposed designs and envelope: Three.js within the map.
- Design output: measured architectural massing with visible floors, rather than detailed interior plans.
- No account needed to explore the tool.

Unverified items, to resolve before claiming compliance:
- Whether ย.7-21 and the 2013 rules remain applicable under the enacted legal instruments.
- Exact zone boundary and parcel location; no vacant site has yet been verified.
- Available site imagery, building footprints, building heights, road right-of-way and frontage evidence.
- Complete applicable building-control rules and spatial overlays.

## 2. User journey and screen layout

Initial screen: top-down map centred on the vacant sample site; supported zone outlined; a short instruction to draw a plot or use the example. Existing surroundings remain visible.

Left panel: plot controls, area in square metres, zone, building type and frontage confirmation. Automatically suggest the adjacent road where possible. Show the provenance of road width; request confirmation if it is not reliable. Road width means the legally relevant measurement, not a guessed width inferred from the number of lanes.

Map controls: draw, edit, undo, reset sample, zoom, north, top-down/3D. Let the user select frontage segments. Support multiple adjacent roads and evaluate all relevant conditions, rather than letting users bypass constraints by choosing only the most favourable road.

Right panel: Design A/Design B selector, area/height/floor/open-space summary, compliance checklist and expandable rule sources. Use compact collapsible panels on smaller screens.

View modes:
1. Existing site: plot boundary and existing context.
2. Allowed envelope: translucent spatial limits, with FAR/open-space budgets shown separately.
3. Proposed design: selected concept with floor divisions; optional envelope overlay.

A rule click explains its meaning, actual value, limit, units and source. Geometric rules highlight affected regions. Aggregate rules such as FAR highlight consumed capacity; they do not necessarily shrink the geometric envelope.

Handle empty, invalid, outside-zone, calculating, feasible, infeasible, insufficient-data and partial-results states explicitly. If a drawn site contains buildings, keep existing/proposed views distinct and disclose the redevelopment assumption. The default site remains vacant.

## 3. Phase A — evidence and site selection

Deliverables: source register, rule ledger, verified site fixture, context data manifest and one manually worked example.

A1. Confirm the legal baseline.
- Check enacted plan, amendments and commencement dates against official sources. Do not substitute the 2026 draft for enacted law.
- Check national building-control regulations, Bangkok ordinances and site-specific restrictions together.
- Keep each source URL, title, publication/effective date, downloaded version where permitted, page and clause.
- Preserve the Thai text alongside an English interpretation. Translation alone does not settle ambiguous applicability.

A2. Verify a zone and vacant demonstration site.
- Locate the provisional zone on the official district map and seek authoritative GIS boundaries.
- Select a road-fronting vacant site wholly within that zone, away from uncertain boundary lines.
- Verify vacancy using dated imagery or another attributable source. Record the observation date; do not present historical imagery as proof of present vacancy.
- Record site centre, drawn polygon, frontage geometry and surrounding context extent.
- Label a drawn outline as illustrative unless supported by parcel/cadastral evidence. Satellite imagery does not establish ownership boundaries.
- Check canal, railway, road-widening and other relevant overlays before accepting the site.
- If the provisional zone is unsuitable, record the reason and select one verified alternative in Phra Khanong before freezing the ruleset.

A3. Build the rule ledger.
For each rule record: ID, source clause, original wording, interpretation, legal version, affected building types, applicability predicate, input fields, formula/geometry effect, exceptions, evidence status and boundary tests.
Research at least:
- Permitted uses and use/size restrictions.
- FAR and what counts toward regulated floor area.
- Open-space ratio, its denominator, minimum uncovered space and permeability.
- Plot-boundary, road and waterway setbacks where applicable.
- Height measurement, road-dependent limits and other spatial controls.
- High-rise, large-building and other classification thresholds.
- Access/fire-access, parking and environmental-review triggers relevant to the chosen scope.

Mark each item implemented, not applicable with reason, or unresolved. Do not award an overall pass while an applicable prerequisite is unresolved. Do not confuse zoning feasibility with full permit approval.

A4. Assemble site context.
- Prefer attributable official/open data with adequate local coverage. Evaluate OSM-derived roads/footprints as a candidate, not an assumed complete source.
- Record licence, attribution, retrieval date, source IDs and any edits.
- Preserve measured height tags; mark level-derived or fallback heights as estimates.
- Keep context heights separate from compliance inputs.
- Bundle permitted context data for the supported area. Do not query remote geographic services during plot dragging.
- Confirm basemap licensing, credentials, quotas and deployment-origin restrictions; do not use public demo endpoints as the production dependency.

Exit gate: exact supported scope and one sample site documented; rule ledger sufficiently complete for the supported uses; one hand-calculated design with expected checks. If any prerequisite remains unresolved, expose it and treat legal completeness as an open acceptance issue.

## 4. Phase B — architecture and first working slice

Use React, TypeScript and Vite for a static browser application. Use deterministic calculation code with versioned rules; no language-model requests in the live compliance loop. Hosting is selected after checking available deployment access.

Libraries and integration:
- MapLibre GL JS: basemap, geographic layers and camera.
- Three.js: generated floor meshes, stepped envelope, lighting and selection highlighting; integrate through a MapLibre custom 3D layer with a shared coordinate frame.
- Terra Draw with its MapLibre adapter: candidate for drawing and vertex editing; validate editing behaviour in a short spike.
- Polygon booleans/offsets: select a maintained browser-compatible implementation through fixtures. Clipper-style geometry is a candidate; verify the actual JS/WASM package, licence, precision and worker support before committing.
- Vitest for calculation tests and Playwright for browser integration; pin tested dependency versions.

Suggested modules:
- src/domain: typed inputs, results and units.
- src/rules: versioned rules, predicates and source references.
- src/geometry: projection, polygon validation, offsets, clipping and area.
- src/engine: envelope, design search and compliance evaluation.
- src/workers: asynchronous calculation boundary.
- src/map: base layers, drawing and frontage interactions.
- src/scene: Three.js meshes and MapLibre integration.
- src/ui: controls, design comparison, metrics and sources.
- public/data: bounded site context and evidence manifest.
- tests/fixtures: independently specified geometry and rule cases.
- docs: research notes, decisions, limitations and deployment instructions.

Core data contracts:
- SiteInput: geographic plot, verified zone/ruleset ID, road geometries, widths with provenance, frontage segments, use and relevant design assumptions.
- RuleDefinition: applicability, parameter units, source, evaluation and evidence status.
- EnvelopeResult: metric spatial limits/floor slices, aggregate budgets and limiting-rule IDs.
- DesignResult: floor polygons and elevations, covered ground geometry, gross/modelled area, regulated area breakdown and open-space allocations.
- CheckResult: pass/fail/unknown/not-applicable, actual, required, units, explanation and source.
- CalculationResult: input revision, ruleset version, envelope, designs, diagnostics and timing.

First slice: sample plot -> one verified setback calculation -> measured footprint -> georeferenced 3D mesh -> displayed area. Deploy the shell early to test production assets and map access.

Exit gate: a real plot and computed mesh align during zoom/rotation, and the displayed area matches an independent calculation.

## 5. Phase C — geometry and compliance engine

C1. Metric coordinates and validity.
- Retain geographic coordinates for storage and mapping; transform to a documented local metric frame for legal distances and areas.
- Verify distortion at the chosen site and map-to-scene scale. Do not use raw latitude/longitude or uncorrected map-render coordinates for metre-based rules.
- Validate ring closure, winding, duplicate vertices, self-intersections and minimum meaningful area.
- Accept concave plots. Reject ambiguous invalid boundaries with actionable guidance instead of silently reshaping them.
- Preserve holes and disconnected outputs created by geometry operations. Do not replace an irregular plot with its bounding rectangle or convex hull.
- Document numeric precision and test tolerances; rounding the UI must never turn a failure into a pass.

C2. Spatial envelope.
- Classify plot edges/frontages and construct applicable exclusion regions.
- Apply rule-specific setbacks using correct reference features, including road edge/centreline/opposite boundary only where the source requires it.
- Support height-dependent constraints with slices or a continuous clipping representation evaluated at every relevant change in height.
- Preserve multiple buildable components; return empty geometry when offsets consume the site.
- Keep FAR and open-space requirements as aggregate budgets alongside the envelope.
- Explain that the geometric envelope is a spatial upper bound and may not be fully occupiable simultaneously.

C3. Shared accounting.
- Derive floor areas from rendered floor polygons, subtracting actual voids/courtyards.
- Sum each level separately; do not multiply ground footprint by floor count when floors differ.
- Compute ground coverage as the relevant union of covered projections according to the sourced definition.
- Track regulated floor-area inclusions/exclusions explicitly. Do not assume gross modelled area equals legal FAR area without checking definitions.
- Measure uncovered area separately from permeable/landscaped allocation.
- Evaluate applicable use, access, parking, classification and review triggers in addition to geometric limits.

Exit gate: manually specified fixtures pass and all numbers can be reconstructed from model geometry. Source-dependent formulas remain versioned and independently reviewable.

## 6. Phase D — two design generators

Use a bounded deterministic search, with a fixed ordering/seed for reproducibility.

Generator A: compact block. Try a small set of frontage-aligned orientations, footprint proportions and floor counts within the envelope and budgets.

Generator B: courtyard or stepped arrangement. Generate materially different footprints or upper-floor reductions. Use a stepped fallback when the site cannot accommodate a courtyard.

For every candidate:
1. Construct actual floor polygons and elevations.
2. Evaluate containment/setbacks at the relevant elevations, overall height, FAR, uncovered space and other implemented conditions.
3. Check minimum usable dimensions and circulation/core allowances under explicit design assumptions. Distinguish these assumptions from statutory rules.
4. Reject invalid or noncompliant candidates.
5. Rank valid candidates by usable development capacity, coherent shape and meaningful distinction from the other option.

Do not simply clip an attractive template and assume the resulting slivers are usable buildings. Internal apartment layouts are outside the massing deliverable, but cores/access/parking that affect feasibility cannot be silently ignored.

If two valid distinct candidates exist, show both. If only one is found, show it with the search limitation; if none is found, distinguish proven constraint infeasibility from failure of our bounded search to find a solution. Never invent a passing second option.

Exit gate: the default site has two visibly different options, each independently evaluated. Changes to plot/road/use actually influence the results.

## 7. Phase E — rendering and live interaction

- Render real context buildings in muted colours and proposals in a contrasting colour.
- Use native map extrusion for simple context and Three.js for proposal/envelope geometry.
- Synchronize camera and projection through the custom-layer interface. Prefer one map-driven camera over two separately controlled scenes.
- Render envelope transparency and floor edges carefully; test depth ordering against surrounding buildings.
- Dispose old meshes/materials and clean up event listeners during updates/unmounts.
- Recalculate on input revisions. Use a worker when required by profiling; cancel/coalesce work and discard stale results.
- While dragging, update the boundary immediately and show an honest calculating/preview state; commit all metrics and geometry from one completed revision together.
- Display clear missing-data messages. A basemap/network failure must not masquerade as an empty neighbourhood.
- Add reset, sources, readable legends, keyboard-accessible controls and responsive panels.
- Save scenario inputs locally; optionally encode a compact versioned scenario in a shareable URL. Reject invalid imported state.

Performance targets, to measure rather than claim in advance:
- At least 30 fps during ordinary camera interaction on the available integrated-GPU laptop.
- Target under 500 ms from completed ordinary plot edit to updated results; report test vertex count and context size.
- Target usable initial view within 5 seconds under a documented network condition.
- Test a 100-vertex plot and repeated edits; set explicit complexity limits only if profiling requires them.
- Avoid continuous animation/repaint when idle; cache site data and limit unnecessary geometry detail.

## 8. Verification plan

Geometry fixtures: rectangle with analytically known inset, triangle, L-shape, deep concavity, acute corner, narrow neck, repeated points, reversed winding, self-crossing input, tiny plot, setback collapse and split buildable components.

Rule fixtures: values below/at/above each legal threshold; all supported uses; multiple road frontages; unknown road width; boundary-zone ambiguity; relevant height/size classification transitions; open-space denominator; exclusions from floor-area accounting.

Independent invariants: no floor outside permitted geometry; each reported floor area matches polygon area; summed floor areas match totals; uncovered area is nonnegative; no required unknown is shown as a pass; results remain stable under equivalent vertex ordering.

Browser flows: use sample -> compare designs; draw/edit concave plot; change use; change frontage information; view rule source; reset; rapid consecutive edits; switch 2D/3D; refresh shared state; network/context failure.

Visual checks: proposal alignment against roads and plot, consistent scale, courtyard holes preserved, no geometry flicker, legible panels, accurate legend and unobstructed map controls.

Deployment checks: production build/typecheck/tests, clean browser load, asset paths, map-origin permissions, no private credentials in bundle, correct attributions, and public live/repo/document/resume links.

Capture screenshots or a short recording of the real working flows after verification. Record actual device/browser and measured performance.

## 9. 48-hour allocation and milestones

These are relative planning allocations, not remaining time or a promise of 48 fresh hours. Rebase against the assignment server's actual deadline. Include breaks within elapsed time and reduce optional scope when necessary.

Hours 0–2: verify deadline/access, preserve early sessions, locate legal baseline and shortlist vacant sites. Check deployment/data access immediately.
Hours 2–6: verify selected site and zone, create rule ledger, manually calculate one example, inspect data coverage, validate geometry/drawing dependencies and deploy a minimal shell.
Hours 6–10: first complete slice from drawn polygon to measured 3D footprint on real context.
Hours 10–18: complete rule evaluation, geometry handling, accounting and independent fixtures.
Hours 18–26: implement two design generators and meaningful building-type changes; obtain two passing default-site options.
Hours 26–34: complete live map workflow, all views, rule explanations, failure states and scenario persistence.
Hours 34–40: adversarial testing, performance work, visual finish and production verification.
Hours 40–44: fix highest-impact issues, verify evidence and public links, prepare technical handover material; applicant completes their writing.
Hours 44–48: reserved submission/failure buffer; freeze optional features, submit through MCP, retain receipt and confirm record.

Critical path: verified rules and site -> tested geometry/accounting -> valid designs -> integrated live experience -> public verification -> submission.

Protect the buffer. Reduce decorative facades, advanced export, free-text interpretation and extra building types before cutting irregular plots, legal correctness, real context, live updates or the two default-site designs.

## 10. Risks and fallback decisions

- Zone/version uncertain: resolve before claiming support; use an explicitly documented alternative if necessary. Do not relabel a draft as law.
- Vacant site cannot be verified: seek another site in the supported zone; do not erase real buildings and call the land vacant.
- Missing height data: use labelled context estimates; verify footprints and avoid implying surveyed accuracy.
- Missing road width: require the relevant value with provenance and keep dependent checks unknown until supplied.
- Drawing/geometry library fails concave tests: replace it during the early spike, before UI integration spreads the dependency.
- Complex regulatory condition exceeds implementation: narrow supported scenarios explicitly and flag unsupported inputs; this remains a scope limitation, not a passed check.
- Candidate search is slow: bound orientations/floor counts, cache intermediate geometry and move work off the main thread.
- Context data is sparse: use another licensed source or a transparently sourced local extract; never substitute fictional neighbourhood buildings.
- Hosting unavailable: identify another accessible static host early; finish and verify the build before seeking any required publication approval.

## 11. Submission and ownership

Submission document order must remain:
1. Public live link.
2. Repository link.
3. Applicant-authored one-pager with the four required headings.
4. Two or three raw, unedited early AI sessions plus the applicant's note on genuine AI misses and corrections.
5. Six truthful answers about the applicant's setup, tools, usage, experience and methods.
6. Best project link and ownership statement.
7. Introduction, resume, professional links and other projects.

Keep technical research/decision notes during implementation so the applicant can write accurately. Do not manufacture transcripts, project history or usage numbers. Preserve the actual first MCP-start session even if it occurred elsewhere.

Assignment time_left/submit_application/check_submission tools were not exposed when this plan was created. Connecting the assignment server and obtaining the actual deadline is an immediate operational dependency. Keep the access key out of the repository, screenshots and public documents. Use the required credentials only with the intended assignment service.

Before submission: check all links without authentication, match live/repo URLs across the doc and submission fields, submit, retain the receipt, and check the recorded submission.

## 12. Completion criteria

- Verified supported zone and real vacant default site, with boundary/data provenance.
- Editable arbitrary simple plot outlines and clear invalid/outside-scope handling.
- Meaningful supported building-type and road-dependent changes.
- Real surrounding roads/buildings with attributions and height assumptions.
- Source-linked applicable rules and spatial envelope with distinct aggregate budgets.
- Two distinct feasible default-site designs and honest outcomes for other inputs.
- Geometry, floor-area totals and evaluated checks agree.
- Live updates without reload or stale metrics.
- Tested performance and a polished public deployment.
- Public repository with reproducible setup, tests, source notes and limitations.
- All seven submission sections completed by the appropriate author, accessible links and confirmed receipt.

## 13. Source register and implementation references

Legal/site research starting points; these are not a completed legal determination:
- BMA district maps: https://webportal.bangkok.go.th/public/cpud/page/sub/22628
- Phra Khanong map: https://webportal.bangkok.go.th/public/user_files_editor/354/DISTRICT_CPD/2556/1009.pdf
- BMA-hosted 2013 regulation: https://webportal.bangkok.go.th/public/user_files_editor/76/law/tk10.pdf
- BMA revision project: https://policy.bangkok.go.th/watch/pub-project/legacy?id=60017
- Revision consultation site: https://plan4bangkok.com/

Technical references checked during planning:
- MapLibre building extrusion: https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/
- MapLibre and Three.js example: https://maplibre.org/maplibre-gl-js/docs/examples/add-3d-tiles-3d-objects-and-models-using-threejs/
- MapLibre custom layer contract: https://maplibre.org/maplibre-gl-js/docs/API/interfaces/CustomLayerInterface/
- Terra Draw MapLibre integration: https://makewithmaplibre.com/plugins/terra-draw/
- Clipper offset behaviour and input restrictions: https://angusj.com/clipper2/Docs/Units/Clipper.Offset/Classes/ClipperOffset/_Body.htm

Immediate next action: establish remaining server time, verify the zone/version and vacant site, then create the rule ledger and the first independent numeric fixture.
