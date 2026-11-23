# Bangkok Plot Feasibility Tool — completion checklist

Reviewed 23 November 2026 against the subsequently supplied four-page Generalist Assignment PDF,
the project draft, `spec-status.md` and the milestone evidence. The issuer's PDF is the assignment
baseline; the Bangkok tool draft contains additional self-imposed research and engineering scope.

**Overall: deployed and technically demonstrated; original-brief completion is not established.**
The main workflows are implemented and tested. The principal remaining product gap is showing
what is allowed from sufficiently verified core regulations for one zone, rather than presenting
most statutory results as unknown. The original PDF expects real execution rather than a prototype.
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

## Remaining requirements from the issuer's brief

- [ ] **Establish and apply the core rules for one zone.** The original PDF asks for applicable
      floor-area ratio, open space, setbacks and height, and a space the building is allowed to
      fill. Current reference calculations and source research do not yet establish that output
      while most statutory checks remain unknown. Verify the selected rule interpretations and
      prerequisites, implement the supported subset faithfully, and state its scope.
- [ ] **Demonstrate two rule-backed fitting designs.** Both existing concepts are independently
      evaluated against model constraints. Recheck them against the established core regulations
      so the checklist supports the assignment's allowed-space claim. The original does not ask
      for professional certification, permit approval or a title survey.
- [ ] **Complete and verify the seven-part submission.** Review the existing local document draft,
      finish personal/authorship fields, verify the required raw early transcripts, check all public
      links signed out, and establish the actual submission service/deadline before submitting.

## Evidence handling and additional project scope

The issuer's PDF requires the real surrounding buildings and roads. It does not specify a vacant
default site, dated vacancy imagery, cadastral boundaries, professional legal certification,
detailed approved vehicle trajectories or an exhaustive legal opinion. Those must not be listed
as independent mandatory hiring-assignment deliverables. Vacancy research and the dated imagery
study remain useful optional work and must retain their stated limitations.

Missing inputs should still remain unknown rather than producing an unsupported pass. That is
our safety/design policy; the original PDF does not explicitly grant blanket acceptance to an
otherwise unverified tool. Equally, a disclosed unknown is not automatically a submission rejection.
The evaluator's core expectation is an accurate, researched implementation for one zone.

Road widths and relevant reference lines must support any calculation that depends on them.
There is no separate requirement to obtain a legal access certificate. Data attribution, reuse
terms and accuracy limitations remain normal distribution/research responsibilities; surveyed
accuracy or a dataset-specific certificate is not an explicit submission artifact in the PDF.

- [x] **Measure the remaining performance targets on the recorded laptop.** After optimizing the
      search, all targets in `performance/acceptance-06.json` passed: three cold loads below 5 s,
      ordinary envelope p95 below 100 ms, 6/100-vertex edit p95 below 500 ms, continuous hardware
      pan/rotation at least 30 frames in every complete measured second and no idle repaint.
      Earlier misses remain documented; this is scoped device evidence, not a universal guarantee.

Passing software tests supports implementation correctness. It does not by itself establish that
the chosen statutory rules and their application are correct.

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
