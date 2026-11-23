# Follow-up evidence: area definitions and physical access

Checked 23 November 2026. This research adds located statutory text and implementable
reference checks. It does not change the application ledger or certify current parcel
applicability. Read with `legal-evidence-03.md` and `zone-gis-evidence.md`.

## Bangkok parking and non-fronting access

[BMA ordinance 2544](https://webportal.bangkok.go.th/public/user_files_editor/76/law/tk24.pdf),
printed pages 15–16, 28–29:

- Clause86: perpendicular rectangle ≥2.40×5m; parallel/<30° ≥2.40×6m; other angled ≥2.40×5.50m.
  Clause88 aisles: <30° 3.50m; 30–60° 5.50m; >60° 6m; entrances 6m/two-way, 3.50m/one-way.
- Thus 2.50×5m stalls with 6m perpendicular aisles meet these dimensions. Clause86 additionally
  requires direct circulation/turning connection. Clause89 locates entrance centreline ≥20m
  from intersection curve/corner. Clause90: ≥15 cars requires public road ≥6m continuing wider.
- Clause52(6): specified classes or >2floors/>8m, except residential ≤3floors, when non-fronting:
  front opening ≥6m; >3floors ≥12m. Continuous frontage/connected-side length ≥P/6; internal
  road ≥6m to public way; under-building clearance ≥5m.
- Clause53: qualifying road-adjacent **building alignment** length >P/8, distance ≤20m.
  P means external **building** perimeter: “ความยาวเส้นรอบรูปภายนอกอาคาร”. Plot frontage is insufficient.

Fixtures: P/8 equality fails; 20m equality passes; P/6 equality passes; floor3→4 changes 6→12m
when applicable; 14→15 cars activates connection rule. Classification, frontage title,
turning and amendment completeness remain unresolved. A frontage proxy is not legal proof.

## MR33 amendment chain successfully retrieved

The [Office of the Council of State index](https://www.ocs.go.th/searchlaw/law-index/item/13926)
provides a public PDF download through its `/searchlaw/power_link/download/` link. This was
retrieved using the host network after the browser fetch failed. Its public document viewer is
[OCS document](https://searchlaw.ocs.go.th/council-of-state/#/public/doc/cmNFa1FYSmdTS0Y3TmZOQm1yVjl5dz09).

The file is a **38-page bundle of original and amending Gazette instruments**, not a fully
integrated consolidation. The downloaded filename describes a compilation through four
instruments. Do not treat the filename as the original publication date or proof against
later amendments. Scanned original pages were visually inspected after PDF rendering;
MR69 pages also have extractable text.

Located sequence:

1. Original MR33, BE2535: Gazette 17 February 1992; starts PDF page1.
2. MR50, BE2540: Gazette 11 November 1997; starts PDF page21. Clause1 removes the old
   definition of floor; clause2 replaces building area; clauses3–4 add/replace site, roofdeck
   and open-space definitions; clauses5–7 replace MR33 clauses2–8.
3. MR69, BE2564: Gazette 4 June 2021; starts PDF page30, printed Gazette page9. Clause1
   commences after 180 days from publication. Keep that commencement expression unless a
   separately checked effective-date calculation is required. Signing date13 May2021 is
   distinct from publication. Its appended vehicle diagrams start PDF page34.

The original alone is unsafe: in particular MR50 changes the area definition and requires an
actual traffic surface around the building. The existence of MR69 is now established;
an exhaustive post-2021 amendment audit is still open.

## Enhanced regime, including buildings below 23m

Use the replacement wording in **MR50** in the OCS bundle, PDF pages21–23, together with
MR33's remaining definitions, rather than copying superseded MR33 clauses.

- Original MR33 clause1: high-rise is occupiable/usable height ≥23m; extra-large is floor
  area ≥10,000m² in one building, including one or several uses. Height is measured from
  construction ground to roofdeck, or top-storey wall for pitched/hipped roofs.
- MR50 replacement clause2: for high-rise/extra-large with total area ≤30,000m², a site side
  ≥12m must adjoin public road ROW ≥10m continuously to another public road ROW ≥10m.
  For total area >30,000m², those public-road widths become ≥18m. The road-adjoining
  site corridor must remain ≥12m wide continuously to the building and usable by fire vehicles.
- Replacement clause3: an uncovered road with **traffic-surface width ≥6m around the
  building**, with convenient fire-engine access. It may coincide with prescribed no-build
  roadside space. Where a required future-road alignment exists, measure this road from it.
- Replacement clause4: outermost building extent, above or below ground, ≥6m from another
  owner's property or public road; foundations excepted. This is broader than wall-only distance.
- Replacement clause5: building-area/site-area ratio ≤10; includes other buildings on the
  same construction site. Replacement clause6: open space ≥30% site residential/mixed;
  ≥10% nonresidential. These are additional constraints, not a replacement for Y.7 FAR5.

Implementation gates and fixtures:

- Evaluate height and area independently. A 22m, 10,000m² building is extra-large, so
  checking only `height < 23` cannot establish exemption from this regime.
- Tests: 22.999/23m; 9,999.99/10,000m²; 30,000/30,000.01m². The latter switches road10→18m.
- A clipped buffer is an initial geometry candidate. Passing requires a connected 6m traffic
  surface around the complete outer extent, access to the public-road corridor, unobstructed
  vertical space and vehicle manoeuvring. Area of a buffer alone is insufficient.
- Ground datum, classification-area counting, actual public ROW, future-road lines,
  construction-site aggregation and complete amendments remain independent unknowns.

## MR69 emergency vehicle geometry

[Original Gazette MR69](https://ratchakitcha.soc.go.th/DATA/PDF/2564/A/038/T_0009.PDF)
was obtained as PDF pages30–38 of the official OCS bundle above; direct web-tool opening
of this Gazette URL failed. The following wording is located in MR69 clause4, adding
MR33 clause29/1, printed Gazette page10:

- High-rise **or** extra-large: at least one fire-engine operating space, uncovered,
  ≥3×10m, outside an inter-building walkway, conveniently and quickly accessible, as near
  as possible to the external fire-water inlet.
- At least one ambulance/emergency-vehicle space ≥2.40×7m, clear height ≥2.85m.
  Walking route from fire lift or fire-escape discharge ≤60m.
- Operating areas must remain accessible without obstruction at all times; appended symbols
  and details also apply.

Therefore these rectangle dimensions can be modelled as separate operating-space polygons.
They cannot be counted as ordinary car stalls or inferred from total unused site area.
The special bays, route length, vertical clearance, fire-water inlet and vehicle swept path
are separate checks. A 3×10m polygon alone does not establish emergency access.

MR69 clause9 has transitional exceptions concerning certain pre-existing/submitted buildings
for the amended rescue-route room width and emergency lift. Do not apply a general exemption
to all of clause29/1. Design history and current use remain unknown.

## Regulated area: definitions now located, scope still matters

[2013 planning instrument](https://webportal.bangkok.go.th/public/user_files_editor/76/law/tk10.pdf),
clause4, printed pages1–2: FAR divides total area of all floors of all buildings by the
construction-site land area; OSR divides qualifying uncovered site space by that total floor
area. The operation-area definition includes related activity space inside or outside buildings,
above or below ground. It is not automatically net lettable office area.

The located plan text does not supply a complete exclusion schedule for parking, cores,
service areas or open circulation. Keep separate inputs for geometric gross area,
planning-countable area, parking-countable area and classification area. Do not silently
deduct a percentage for stairs/lifts from all denominators.

**MR50 clause2**, OCS bundle PDF page21, replaces MR33's building-area definition with
usable floor area bounded by the exterior edge of beams/floors/walls, including verandas
and balconies; excluding roofdeck and external roof stairs. The old MR33 definition also
excluded necessary machinery area; the replacement does **not** retain that exclusion.
MR50's construction-site definition permits contiguous title plots included in the permission.

These are located definitions within MR33's regime. Evidence connecting every term to
2013 planning FAR counting remains incomplete; do not promote a complete FAR exclusion
policy merely because this separate definition was found. Retain the exact rule/denominator
provenance per metric. A BMA-hosted study gloss suggesting stair/lift exclusions is not an
enacting instrument and cannot resolve the conflict.

## Waterway reference geometry

[Government-hosted MR55](https://www.padad.go.th/getimage/documents_file/documents_file_553_2024_9_6_781026.pdf),
clause42, PDF page8:

- Public water body width <10m: building line ≥3m from its boundary.
- Width ≥10m: ≥6m. Large public water bodies such as lakes/sea: ≥12m.
- Exceptions include bridges, embankments, fences, drains, piers, signs, docks/slipways and
  uncovered parking; these are not a general exemption for an occupied building.

Reference formula: `waterSetback = largeBody ? 12 : width < 10 ? 3 : 6` metres.
Clip occupied-building candidates against the offset of the **legal water boundary**,
not a water centreline or an imagery edge. Fixtures:9.999m→3m;10m→6m; large-body flag→12m.
Unknown public status, width, legal edge or applicable local instrument means unknown;
absence of a mapped water feature does not prove no waterway constraint.

## Work remaining after this evidence pass

1. Audit the later amendments and Bangkok/national interaction for each proposed control.
2. Establish parcel-specific legal ROW, public-way frontage and canal boundaries from
   attributable survey/title/agency records; validate the entire access chain.
3. Locate the complete operative FAR area-counting/exclusion policy and reconcile metrics.
4. Verify turning templates, loads, clear heights, fire-water equipment and emergency routes
   against a physical design. Generic 6m polygons remain schematic evidence.
5. Keep vacancy, parcel ownership and other overlays unknown pending actual dated evidence.

No files in the app, legal profile or evidence ledger were changed by this research pass.
