# Plot — Bangkok feasibility lab

A browser-based Bangkok plot research tool built with React, TypeScript, MapLibre and Three.js
in a pnpm/Turborepo workspace. Draw irregular plots, mark multiple road frontages, compare
measured concepts and inspect the rule/source evidence that constrains the study.

**This is a reference study, not a permit determination.** The app distinguishes passed design
assumptions from unresolved statutory checks. No concept receives an overall legal feasibility
pass while parcel, vacancy, legal road/access and other applicable prerequisites are unresolved.

## Run locally

Requires Node.js 22.12+ and pnpm 10.28.2.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open <http://127.0.0.1:5173>. WebGL2 is required for the map. The default basemap is a bundled
licensed OpenStreetMap extract, with no API key or remote geographic service needed while
editing. A licensed external MapLibre style can optionally be configured through
`apps/web/.env.example`; Vite environment variables are public configuration, never secrets.

## Features and supported scope

- Arbitrary simple polygons, concave editing, keyboard coordinate editing, undo and reset.
- WGS84 storage; EPSG:32647 metre calculation; a 1 mm clipping grid; capsule exclusions preserve
  concavities, holes and disconnected components.
- Exact BMA 2013 Y.7-21 GIS polygon. Entire-plot membership disables outside/straddling inputs;
  a 1 m study boundary guard is an assumption, not surveyed positional accuracy.
- Real context: 1,049 buildings, 178 road segments and four waterways, with ODbL attribution,
  source IDs, dates, original tags and explicit height estimates.
- Contrasting road centrelines, clickable local road labels, nearby-road distances/source links
  and a purple dashed zone boundary. Map display width is never a legal road-width measurement.
- Multiple frontage edges, road-width provenance and study confirmation, plus optional station
  distance. User confirmation is not independent legal evidence.
- Sourced historical-reference road/boundary setbacks, whole-building and floor conditions,
  conservative height slices, FAR/open-space targets and use-dependent area restrictions.
- Deterministic bounded compact rectangle and courtyard/stepped searches, with actual floor
  polygons, independent checks, coverage union and floor-by-floor accounting.
- Separate gross area, estimated usable capacity, unknown statutory regulated area, uncovered
  ground and assumed permeable allocation. No unsourced equality between those quantities.
- Optional residential/office programme, parking count, driveway and connecting-road screens.
  Building parking reserves actual floor polygons and reduces usable capacity; uncovered parking
  competes with landscaping for ground area. Reserved building floors have selectable 2D
  schematic plans with individual stalls, connected aisle strips and a service reserve. Packing
  is bounded to 200 stalls per floor; ramps, turning and lawful connections remain unverified.
- Optional straight/curved ramp dimensions screen the actual parking-level rise, gradient,
  flight/landing lengths, headroom, approach distance and an aligned straight-run reservation
  across all parking levels. A curved-ramp radius is never treated as a vehicle turning radius.
  Failed alternatives retain their study checks and reasons; no legal verdict is inferred.
- Building-facade/perimeter public-front geometry screening, with distinct non-fronting access
  review conditions. The length of a selected plot edge cannot substitute for a building facade.
- Rules, sources, interpretations, model-proxy values and evidence status per selected design.
  Geometric rules highlight affected regions; aggregate rules expose separate budgets.
- Immediate envelope preview, debounced search in a cancellable worker and revision-consistent
  geometry/metrics. Three.js loads on demand for 3D; the map owns the camera/context.
- Validated v3 share links include plot, use, roads, frontages, project inputs and assumptions. v1/v2 local saves
  migrate. Invalid links restore the example with feedback; clipboard failure offers manual copy.
- Local address/road and coordinate search, real-building source inspection, responsive
  collapsible panels, legends, source dialogs, explicit data failures and retry.
  Coverage notices distinguish missing surroundings, including partially uncovered map views.
- First-use instructions explain the research workflow. Map controls wrap together; 2D/3D
  buttons remain exposed at laptop/mobile widths. Saving includes all project/parking inputs.
- A separate dated imagery study links a visually inspected 5 March 2026 capture to an
  illustrative inner outline and two model concepts. Loading it clears unsupported road inputs;
  road access, current occupation and canal restrictions stay unresolved.

## Evidence and limitations

The default is an illustrative 2,500 m² outline translated into the sourced 2013 zone. It is
**not a verified cadastral or vacant parcel**. Existing mapped buildings are retained. The GIS
publisher does not specify an explicit reuse licence or positional accuracy; the app does not
relabel those facts as ODbL or survey evidence.

Official continuation provisions and BMA corroboration establish a narrowly scoped recognized
2013 planning baseline. Partial amendments, site overlays, statutory counting definitions,
exceptions, parking provision, fire access and environmental review remain independent gates.
The historical reference profile is explicitly a hypothesis, not a verified current allowance.

The reference search is restricted below both 23 m and 10,000 m² gross modelled area while
additional high-rise/extra-large requirements remain unresolved. Height alone does not exempt
a low but very large building. It uses conservative all-frontage clipping rather than claiming every multi-road
exception. Search is bounded and approximate; finding zero/one candidates does not prove full
statutory infeasibility. Core/circulation and landscaping are assumptions, not detailed plans.

Sources and provenance:

- [Legal evidence and continuation chain](docs/research/legal-evidence-03.md)
- [Parking, fire-access and amendment follow-up](docs/research/legal-evidence-04.md)
- [Vacant-site evidence follow-up](docs/research/site-evidence-04.md)
- [Finite amendment and ramp audit](docs/research/legal-audit-05.md)
- [Primary owner/bank site audit](docs/research/site-audit-05.md)
- [Dated imagery study and official road-record follow-up](docs/research/site-evidence-06.md)
- [Conditional FAR, denominator and portal-terms clarification](docs/research/coverage-audit-06.md)
- [Authoritative zone and sample correction](docs/research/zone-gis-evidence.md)
- [Context extraction notes](docs/research/context-data.md)
- [Context attribution and licence](apps/web/public/data/context-LICENSE.md)
- [Rule ledger](packages/rules/src/ledger.v2.json) and [reference profile](packages/rules/src/reference-profile.json)
- [Detailed implementation specification](docs/remaining-work-spec.md)

## Verification and production build

```sh
pnpm data:validate
pnpm check
pnpm format:check
pnpm test:e2e
pnpm benchmark
pnpm review:designs
```

`pnpm check` runs type checking, unit/property tests, rule-ledger validation and the production
build. It prepares the deployable output at `dist/`. Data validation checks real-feature
provenance, geometry, counts and SHA-256 manifests. Property tests use reproducible seeds.

Playwright uses one Chromium worker. Install its matching browser with
`pnpm exec playwright install chromium`, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to an installed
compatible Chrome. `PLAYWRIGHT_PORT` chooses an unoccupied port; `PLAYWRIGHT_PRODUCTION=1` tests
the actual `dist/` output. The normal behavior suite uses software graphics for reproducibility.
That does not certify the integrated-GPU frame-rate target.

`pnpm benchmark` writes a reproducible engine-only report under `docs/performance`. An explicit
production browser measurement run uses `PLAYWRIGHT_MEASURE=1` and the `records production`
test; `PLAYWRIGHT_HARDWARE_GPU=1` removes the software-rendering flags. Reports record actual
device/browser/renderer, network conditions, scope and limits. Large-bundle warnings and any
unmet target remain visible rather than being described as passes.

The repeated milestone-06 audit uses `PLAYWRIGHT_ACCEPTANCE_MEASURE=1` with
`tests/browser/performance-acceptance.spec.ts`; use `PLAYWRIGHT_HARDWARE_GPU=1` for hardware
camera evidence. The final local report meets its recorded targets, with earlier misses retained.
Set `PLAYWRIGHT_BASE_URL` to verify an existing public deployment without starting a local server.

## Workspace and delivery

- `apps/web`: map, drawing, scene, browser UI, state and calculation worker.
- `packages/domain`: typed inputs, outputs, units and scenario validation.
- `packages/geometry`: projection, validation, clipping, capsules and accounting operations.
- `packages/rules`: JSON evidence ledger, reference parameters and pure dependency-safe checks.
- `packages/engine`: envelope preview, height slices, bounded design search and evaluation.
- `scripts`: reproducible data extraction/validation, performance and deployment-output preparation.
- `tests/browser`: behavior and optional production performance flows.
- `docs`: research, implementation/spec status, performance and delivery evidence.

Applicant history, one-pager, personal setup answers and original early transcripts must come
from the applicant. No project history, submission receipt or compliance approval is invented.
Source repository: [Manav2209/bangkok-plot-feasibility](https://github.com/Manav2209/bangkok-plot-feasibility).
Live app: [bangkok-plot-feasibility.vercel.app](https://bangkok-plot-feasibility.vercel.app/).
The user deployed it on 23 November 2026; basic public checks are recorded in
[Vercel deployment](docs/vercel-deployment.md). Current completion and remaining evidence gates
are recorded in [spec status](docs/spec-status.md). Assignment submission remains deferred.
