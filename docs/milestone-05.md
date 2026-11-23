# Milestone 05 — ramp checks and evidence-dependent design review

23 November 2026. Work remains local; deployment and publication are deferred.

## Completed engineering work

Project inputs now accept optional straight/curved ramp dimensions. Rise is derived from the
actual reserved parking-level elevations, rather than trusting a user-entered nominal rise.
Reference checks cover gradient, flight rise, intermediate rests, curved-ramp inner radius,
clear width, declared clear height and ground entrance separation. Missing dimensions remain
unknown. Headroom declarations exceeding the actual storey height fail the screen.

For a declared straight ramp, a bounded rectangle search reserves the full inclined run plus
intermediate landing lengths inside the common service reserve on every parking level. Actual
floor containment and exclusion from stalls/aisles are checked. Floor packing uses a consistent
full-capacity orientation before truncating the requested stall count. A red overlay exposes
the ramp reservation in the selectable 2D parking plan.

This is a plan-space reservation, not an approved vertical section. It does not construct slab
openings, prove available stair/lift space, validate crest/sag transitions or vehicle swept paths.
Curved-ramp radius and vehicle turning radius remain distinct. No unsupported universal turning
radius is introduced. All of these checks are scoped to design assumptions; statutory evidence
and the overall legal verdict are not promoted.

Rejected candidates now retain their individual check results and explain which implemented
study controls failed. Finding one surviving concept does not prove the rejected approach is
impossible under every alternative design.

Ruleset: research-preview.5; reference profile1.2;16 rules and9 sources. Saved/shared scenarios
retain ramp fields; old ruleset versions remain readable and are canonicalized to the current
one. Strict schemas reject zero runs and injected approval flags.

## Actual re-evaluation of both design approaches

Run `pnpm review:designs` to regenerate `validation/design-review-05.json`, including inputs,
source references, floor totals, individual checks, accepted concepts and rejected attempts.
It asserts polygon-derived floor totals, plan containment, exclusion of ramp reserves from
stalls/aisles and the absence of failed implemented study checks on retained concepts.

- The illustrative default retains Compact and Courtyard, approximately5802m² and5418m² gross.
  Parking quantities and legal/site prerequisites remain unknown.
- A second explicitly declared study has50 parking spaces, two-way circulation,20% service/core
  allocation,21.4m inclined straight run,6m ramp width,2.4m declared clearance and6m asserted
  entrance separation. Compact survives with50 schematic stalls and128.4m² ramp reserve.
  An alternative is rejected because its common service reserve cannot fit the same ramp.
- Both cases retain overall legal status unknown. The declared case is an assumption-based
  fixture, not evidence about a real property. It must not be presented as two legally feasible
  designs or as independently surveyed access/headroom.

## Research completed and exact external dependencies

`research/legal-audit-05.md` records a finite eight-entry official-source audit, including
previously missing MR55 amendments66/68, the inspected MR71/MR72 families, BMA2023 repeal,
and sourced ramp/headroom/turning provisions. The audit establishes specific located wording;
it does not establish an exhaustive current supersession chain or complete FAR exclusions.

`research/site-audit-05.md` documents a new primary owner/bank/AMC inventory route. The concrete
BAM pin lies outside the supported zone and has unsuitable pedestrian-access/existing-use
information. SAM hits were existing condominium units; other inventories did not yield a usable
in-zone parcel with dated condition and legal ROW records. No site was fabricated or relabelled.

Full completion requires these actual artifacts:

1. An identifiable parcel/title plan, geolocated boundary and construction-site aggregation.
2. Attributable dated actual-condition images or inspection tied to that boundary.
3. Competent road/land-authority ROW, public-way and legal-access-chain records; waterway banks
   and parcel overlays where relevant.
4. A complete current applicable-instrument/counting review and a physical parking/access design
   with vehicle trajectories, ramp sections, structure/services soffits and emergency routes.

Without those facts, current code cannot turn unknowns into truthful legal passes. The parcel
identifier/official record URL has been requested; this is missing input, not a deployment task.

Subsequent scope correction: that request concerns a stronger parcel-specific legal conclusion.
The original draft permits an illustrative boundary; it does not require the user to own a plot
or furnish a title survey for the demo. A public dated-condition observation and geolocated
illustrative outline are an acceptable demonstration route. Do not block choosing a public
example solely because a cadastral/title record is unavailable.

## Verification

Type checking, production build and134 unit/property tests passed:23 geometry,27 rules,
62 engine and22 scenario/road tests. The reproducible design-review assertions passed.
The production browser suite includes a steep-ramp failure, a fitting declared reservation,
red plan overlay, nested ramp persistence and the unchanged no-approval outcome.
Its final result is recorded in `spec-status.md` after the run completes.
All25 production browser flows passed. The new flow rejects a steep run, accepts a fitting
declared plan-space reservation, keeps swept-path/legal checks unknown, shows the red overlay
and restores nested ramp dimensions after saving/reloading. Context/zone manifest checks,
source-pattern screening, formatting and whitespace checks passed. Source screening is not
an exhaustive secret audit. Screenshot: `screenshots/ramp-plan-05.png`.

Existing GPU performance evidence describes milestone04's ordinary/stress interaction scope;
no new physical-access performance certification is inferred from that earlier measurement.
