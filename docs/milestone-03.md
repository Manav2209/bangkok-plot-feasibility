# Milestone 03 — local product implementation and verification

22 November 2026. Deployment, remote source publication and submission are deferred by the user.
The app runs locally at http://127.0.0.1:5173. This milestone completes the implemented research
workflow; it does not close the legal/site acceptance gates listed in `spec-status.md`.

## Implemented

- Exact official 2013 Y.7-21 zone polygon, whole-plot membership and boundary guard; the original
  outside-zone sample was translated inside without changing its illustrative 2,500 m² shape.
- Bundled real OSM buildings, roads and waterways, manifests/hash validation, attributable
  height estimates, data retry and notices for full or partial missing map coverage.
- Multiple physical frontage edges with width/provenance, condominium/office reference models,
  versioned validated rule/profile data, dependency-safe checks and source inspection.
- Per-edge capsule exclusions, whole-building and floor conditions, conservative height slices,
  actual affected-region highlights and aggregate budgets separate from spatial limits.
- Deterministic bounded compact and courtyard/stepped searches; floor-polygon accounting,
  coverage union, explicit assumed usability/landscape allocations and no statutory-area proxy pass.
- Optional programme, parking, driveway/access and review screening. Building parking reserves
  actual rendered levels and reduces usable area; uncovered parking shares the ground budget.
  Layout and fire-access geometry remain unknown and cannot produce an approval.
- Immediate envelope preview, exact-input prepared-envelope reuse, 32 ms edit coalescing,
  cancellation of obsolete active searches, warm-worker reuse and revision-consistent rendering.
- Strict v3 shared/persisted scenarios including project inputs, older-version migration,
  clipboard recovery, local names/coordinate search, keyboard controls and responsive panels.

## Verification

`pnpm check` passed type checking, production build, ledger/profile validation and 105 tests:
23 geometry/property, 27 rule, 39 engine and 16 scenario tests. The ledger contains 16 rules and
seven sources. One narrow baseline check is verified; other legal checks retain their real status.

All **20 production Chromium behavior flows passed** with the following PowerShell setup:

```powershell
$env:PLAYWRIGHT_PORT='5193'
$env:PLAYWRIGHT_PRODUCTION='1'
$env:PLAYWRIGHT_CHROMIUM_EXECUTABLE='C:\Users\Manav\AppData\Local\ms-playwright\chromium-1234\chrome-win64\chrome.exe'
pnpm test:e2e --grep-invert 'records production'
```

Coverage includes actual 3D startup, concept changes, concave drawing, vertex editing, rapid
revisions, both uses, multiple frontages, fresh-browser sharing, local persistence, clipboard,
malformed inputs, floor totals, outside-zone edits, recovery, source-dialog focus, mobile panels,
context/boundary failures, context coverage, worker reuse and parking allocation/failure.
Desktop/mobile captures were visually inspected and preserved in `docs/screenshots`.

`pnpm data:validate` passed both manifests. The context has 1,231 features (1,049 buildings,
178 road segments, four waterways). `pnpm source:check` found no recognized credential patterns
or private-file names; it is a bounded pattern scan, not proof of absence of every secret.
Formatting and whitespace checks are part of the final handover checks.

## Measured performance

Reports: `performance/engine-benchmark.json` and `performance/browser-benchmark.json`.
AMD Ryzen 3 5300U/Radeon graphics; Chromium 151; browser viewport 1440×1000. Production browser
measurement used actual AMD/Direct3D hardware rendering with cold context, 10 Mbps down,
5 Mbps up and 40 ms latency. The final coverage-notice change followed that measurement;
it does not change the calculation/search/render pipeline.

- Initial usable view: 3.545 s.
- Four ordinary edits: 174–262 ms from input handler to a rendered frame carrying matching
  proposal revision. Driver/action/polling elapsed times are recorded separately.
- 100-vertex edit: 399 ms; scenario reload 1.780 s.
- Short camera-fit transition: 60.5 rendered fps; zero idle renders in 500 ms.
- Engine-only p95 over 20 samples after three warmups: 60.5 ms ordinary, 303.4 ms at 100 vertices.

These samples meet the recorded targets. Engine timings exclude browser/network/worker costs;
the short camera transition is not sustained GPU certification. Large production chunk warnings
remain visible, with Three.js loaded only on demand for 3D.

## Remaining acceptance gates

The default parcel is illustrative, not verified vacant or cadastral. Legal right-of-way, overlays,
full current amendments/definitions, statutory area accounting, parking/fire layout and review
requirements need competent evidence. Therefore two research concepts are available, but two
legally verified feasible default designs are not claimed. BMA GIS reuse terms and survey accuracy
remain unspecified. Applicant-authored personal material and submission receipt remain absent.

No hosting, source push or submission was performed after the user deferred deployment.
