# Milestone 06 — dated site study and measured search performance

23 November 2026. The existing Vercel app and GitHub source remain the delivery destinations.
This increment improves evidence, source explanations and performance. It does not certify a
vacant default parcel, legal road access or complete current-law applicability.

## Product and evidence changes

- Added a selectable **Dated imagery study · 5 March 2026** with provider image and capture-date
  metadata links. Its five-vertex inner outline covers about 1,014.24 m² of observed unbuilt ground.
  It is separate from the main example and clears unsubstantiated frontages/project inputs.
- Independently reviewed two model concepts on that outline: approximately 2,433.84 and
  2,049.84 m² gross floor area. Both retain unknown legal status. Existing mapped buildings remain.
- Located official BMA road-corridor and road-width fields, distinguishing paved surface width.
  No record was incorrectly assigned to the example. Nearby canal evidence remains a review gate.
- Clarified that the model applies base reference ratios with no FAR incentive bonus or generic
  parking deduction. Recorded instrument-specific uncovered-space denominators.
- Added general DGA portal terms and their coverage limitations to the zone manifest/source drawer.
  The dataset-specific licence and surveyed positional accuracy remain unspecified.

## Geometry and performance work

The repeated benchmark exposed misses hidden by a single favorable sample. Dense-plot parameter
edits exceeded 500 ms at p95; one cold initial view exceeded 5 seconds. The reports retain those
observations rather than claiming that recording a benchmark means all targets passed.

Rectangle search now uses precomputed half-plane support for convex components and an analytic
boundary-intersection test for general axis-aligned rectangles. Concave notches and holes are
checked; a rectangle cannot bridge disconnected components. Final candidate polygons are still
clipped and every generated floor independently checked against all relevant envelope slices.
The new geometry property test compares containment against polygon subtraction for 100 seeded
concave/holed cases and reversed winding. A dense convex engine regression also checks containment
and winding stability. The search remains bounded; no exact global-optimum claim is introduced.

`performance-acceptance.spec.ts` records three cold browser contexts under 10 Mbps down/5 Mbps up
and 40 ms latency, 20 parameter and 20 boundary edits for each of 6/100 vertices, continuous
hardware camera pan/rotation and a 2-second idle interval. Median/p95/max and target outcomes are
recorded in `performance/acceptance-06.json`; `acceptance-06-before.json` preserves the initial
audit. Results concern the recorded device and conditions, not every laptop or scene.

The Playwright configuration now accepts `PLAYWRIGHT_BASE_URL` for repeatable checks against an
existing deployment, without starting a local server. Optional performance audits remain skipped
in ordinary CI; a successful recording test is not a performance-target certification.

## Research and review evidence

The final local production audit passed all recorded targets on the Ryzen 3 5300U / integrated
AMD GPU, Chrome 151, 1440 × 1000 device. Cold loads: 4.387, 2.542 and 2.656 seconds. Ordinary
parameter/boundary p95: 207.8/264.7 ms. At 100 vertices: 435.9/438.7 ms. Continuous pan/rotation
averaged 50.5/53.3 actual MapLibre render events per second; every complete measured second
had at least 46/51 respectively. Idle produced zero events over 2 seconds. The earlier failed
measurements are not erased by this pass.

An intermediate run after the convex-only optimization still recorded a 6.711-second cold load
and 100-vertex parameter/boundary p95 of 686.3/513.8 ms. That intermediate summary is retained
here; its full raw arrays were overwritten by the final audit. The initial pre-optimization raw
report remains in `acceptance-06-before.json`.

Typecheck, production build, 140 unit/property tests (28 geometry, 27 rules, 63 engine, 22 web),
all 26 production browser flows and both provenance validators passed. A selector collision in
the new disclosure was corrected; the final complete 26-flow run passed. The optional performance
recording reports its targets separately from behavioral test success.

- `research/site-evidence-06.md` and `research/imagery-citation-06.json` preserve the observation,
  exact source identifiers, outline derivation, image hash and unresolved access/canal conditions.
- `research/coverage-audit-06.md` records the rule/terms clarification and remaining evidence limits.
- `validation/design-review-05.json` now includes the dated study as a third independently
  evaluated case. This historical filename is retained; its generation date and cases are current.

The stronger vacant-default, road/canal applicability, exhaustive current-rule and dataset-rights
gates remain open. The user does not need to own land or interpret the regulations to use the tool.

## Publication verification

Implementation commit `6542c5904162d3cf2128ace90990be7a6afb37dd` was pushed to GitHub. Vercel
reported successful deployment, and the live entry asset matches the local production build.
The new dated-study and main map/design browser flows both passed against the public origin;
see `vercel-deployment.md` and `screenshots/dated-imagery-study-06.png`. This is deployment and
behavior evidence, not a legal/site evidence promotion.
