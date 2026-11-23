# Bangkok Plot Feasibility Tool — completion checklist

Reviewed 23 November 2026 against the supplied draft, `spec-status.md` and the milestone evidence.

**Overall: not everything is complete.** The local application has the main workflows implemented
and tested. Site evidence and parts of statutory applicability remain open. The app is deployed
on Vercel with basic public smoke checks complete.
A checked item below means the stated feature is implemented; it does not certify legal feasibility.

## Implemented and tested

- [x] Draw and edit irregular and concave plots; reject invalid outlines; undo and reset.
- [x] Calculate metric geometry and show plot area in square metres and Thai land units.
- [x] Display the sourced Y.7-21 zone polygon; handle outside-zone and boundary cases.
- [x] Select multiple frontage edges with road-width inputs and provenance.
- [x] Provide condominium and office reference-study options.
- [x] Show a versioned rule ledger, sources, explanations and missing evidence.
- [x] Generate a sliced envelope with setbacks, height constraints and separate capacity budgets.
- [x] Generate two distinct baseline concepts and independently evaluate their actual floor geometry.
- [x] Show floor areas, totals and separate study checks from statutory checks.
- [x] Include schematic parking stalls, aisles, service reserves and selectable parking floors.
- [x] Screen optional ramp dimensions and reserve a straight-ramp area across parking floors.
- [x] Show real mapped surrounding buildings, roads and waterways with attribution and estimated-height labels.
- [x] Keep 2D/3D controls visible and usable at laptop and mobile widths.
- [x] Recalculate live, cancel obsolete work and prevent stale result/input combinations.
- [x] Save scenarios locally and reproduce inputs through versioned share links.
- [x] Provide first-use guidance, legends, source inspection and failure/retry states.
- [x] Pass typecheck, production build, rule validation and 140 unit/property tests.
- [x] Pass all 26 production browser flows and independent design-review assertions.
- [x] Record browser performance samples and inspect desktop/mobile screenshots.
- [x] Add a geolocated study outline tied to a visually inspected capture dated 5 March 2026,
      with two independently evaluated model concepts and visible access/current-condition limits.
- [x] Record BMA corridor-width sources and general portal reuse terms without promoting
      unsupported site-specific widths, licence claims or accuracy numbers.

The two baseline concepts pass implemented study constraints. They are not two legally verified
designs. In the more detailed declared-access case, one concept is accepted by the study and the
other is rejected because its ramp reservation cannot fit. The rejection is preserved.

## Still required for full local specification acceptance

- [ ] **Document a suitable vacant example site.** Tie an illustrative outline inside the supported
      zone to a visually inspected, attributable and dated vacancy observation. The current example
      is illustrative and has no verified vacancy observation. Ownership and a title deed are not
      prerequisites for a demonstration.
      The new dated study establishes visible unbuilt ground on its observation date; it does not
      establish full vacancy/occupation, road access or today's condition for a replacement default.
- [ ] **Establish the example's road evidence.** Identify the relevant frontage, legally relevant
      width/reference lines and any applicable access or widening restrictions. A mapped road,
      pavement measurement or user-confirmed study width does not supply this evidence.
- [ ] **Finish applicable rule coverage.** Resolve the remaining amendments, area-counting definitions,
      exceptions, site overlays and applicable parking/access/environmental conditions. Every item
      must end as implemented with evidence, not applicable with a reason, or explicitly unresolved.
      Unresolved prerequisites continue to prevent the affected legal checks from passing.
- [ ] **Re-evaluate two designs against the evidenced default.** Once the site and decisive rule
      inputs are established, regenerate and independently check both concepts. Change the site or
      design search if needed; do not manufacture a passing second option.
- [ ] **Clarify zone-data reuse and accuracy.** The retrieved BMA catalog does not specify reuse
      terms or surveyed positional accuracy. The application's study guard is not an accuracy claim.
- [x] **Measure the remaining performance targets on the recorded laptop.** After optimizing the
      search, all targets in `performance/acceptance-06.json` passed: three cold loads below 5 s,
      ordinary envelope p95 below 100 ms, 6/100-vertex edit p95 below 500 ms, continuous hardware
      pan/rotation at least 30 frames in every complete measured second and no idle repaint.
      Earlier misses remain documented; this is scoped device evidence, not a universal guarantee.

The app must retain unknown results wherever evidence remains missing. It can be used as a
reference study now, but full specification completion must not be claimed from passing tests alone.

## Source publication and deferred delivery

- [x] Publish the source repository — pushed to `main` on 23 November 2026. GitHub's branch API
      confirmed implementation commit `4b1a3d525d06af0ace197b9202b0a07746bc932a` after the push.
      Application code, tests, bundled context and research documentation are included. Ignored
      scratch downloads, local environment files, dependencies and generated build outputs are excluded.
- [x] Deploy the application on Vercel — https://bangkok-plot-feasibility.vercel.app/.
      The user deployed it; public HTTPS, page rendering, worker scripts and bundled data were
      checked. See `vercel-deployment.md` for the verification scope and remaining metadata limits.
- [ ] Complete any applicant-owned assignment documents and submission, if that delivery is pursued.
      Personal history and applicant-authored material cannot be invented. They do not block local
      development or use of the demonstration.

## Scope boundaries

A permit-ready structural/MEP design, title certification and detailed approved vehicle/fire
trajectories are not prerequisites to completing the original zoning-study tool. Relevant access
and classification screening still belongs in the tool, with limitations visible. The user does
not need to find land, interpret Thai regulations or obtain professional certificates to try it.

## Evidence

- `spec-status.md`: detailed implementation and acceptance status.
- `milestone-06.md`: latest substantive implementation and verification record.
- `validation/design-review-05.json`: independent candidate checks, including rejections.
- `research/public-demo-evidence.md` and `research/site-evidence-04.md`: site research and limits.
- `research/legal-audit-05.md`: bounded statutory source audit and unresolved coverage.
- `performance/`: measured conditions, results and limitations.

Verification results above are the recorded runs; this checklist update did not rerun the test suite.
