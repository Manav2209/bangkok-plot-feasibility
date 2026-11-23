# Implementation research: legal controls and site evidence

Checked 22 November 2026. Source text located below is distinct from verified application to a
particular parcel. Subsequent GIS research established the exact published 2013 zone polygon
(see `zone-gis-evidence.md`); it does not establish surveyed parcel accuracy or current legal
applicability. No dated vacant default parcel or legal right-of-way survey was established.
Keep those prerequisites unknown.

## 1. Continuation of the 2013 plan

The five-year term printed in the original plan is not sufficient evidence of expiry.
[BMA's official planning publication](https://webportal.bangkok.go.th/user_files/354/151870971261e7d0e05ba207.70013141.pdf),
printed page 34, explains continuation under the 2015 Town Planning Act amendment.

The [2015 amendment, section 14](https://hydrolaw.thaiwater.net/%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%A3%E0%B8%B2%E0%B8%8A%E0%B8%9A%E0%B8%B1%E0%B8%8D%E0%B8%8D%E0%B8%B1%E0%B8%95%E0%B8%B4%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%9C%E0%B8%B1%E0%B8%87%E0%B9%80%E0%B8%A1%E0%B8%B7-2/),
preserves existing comprehensive-plan ministerial regulations pending replacement. The
[BMA legal portal's 2019 Act, section 111](https://gov.bangkok.go.th/LegalDetail?id=da385b9a-0a61-4c8e-9efc-9fa303717b20)
continues existing plans until replacement Ministry notification or local ordinance in the same
area, and allows partial amendments/repeal in the meantime. The 2019 Act became effective
25 November 2019 according to that official page.

[BMA's 2026 consultation notice](https://webportal.bangkok.go.th/cpud/page/sub/18974/1/2/info/541078)
describes the fourth revision as a draft in its 10 August–9 November 2026 display/petition period.
That supports distinguishing the draft from enacted rules, but is not an exhaustive replacement
or parcel-overlay search. Do not describe the current baseline merely as an expired historical
plan; equally, do not mark every 2013 clause currently applicable without the remaining audit.

## 2. Y.7 use and budget controls

Source: [official BMA-hosted 2013 Gazette instrument](https://webportal.bangkok.go.th/public/user_files_editor/76/law/tk10.pdf),
clause 14, printed pages 27–29. Text is located; exact zone membership and present parcel
applicability are unverified.

- Collective residential area over 10,000 m²: prohibited unless on public right-of-way at least
  30 m wide or within 500 m around a transit station; clause 14(11).
- Office operation over 1,000 m²: exception only for area over 1,000 and at most 10,000 m² on
  public right-of-way at least 16 m wide or within that station distance; clause 14(13).
- Thus office over 10,000 m² has no exception in that paragraph; do not reuse the residential
  exception. Station-distance reference and area definitions require evidence.
- FAR maximum 5; open-space/floor-area ratio minimum 0.06; permeable planting at least 0.50 of
  qualifying open space. Subdivision history and additional building-control minima apply.

Short original terms: “อัตราส่วนพื้นที่อาคารรวมต่อพื้นที่ดิน” and
“อัตราส่วนของที่ว่างต่อพื้นที่อาคารรวม”. These terms do not substitute for the full clauses.

## 3. National road, height and boundary mechanics

Source: [government-hosted consolidated Ministerial Regulation 55](https://www.padad.go.th/getimage/documents_file/documents_file_553_2024_9_6_781026.pdf),
PDF pages 8–10. Consolidation identifies amendments 58/61; later changes and Bangkok interaction
still require review.

- Clause 41, listed building classes or over two floors/8 m: road width W<10 requires 6 m from
  centreline; 10≤W≤20 requires W/10 from near road boundary; W>20 requires 2 m from boundary.
  For smaller ordinary buildings W<6, centreline distance is 3 m.
- Clause 44: H(x)≤2d(x), with d perpendicular to the opposite boundary of the nearest public
  road. Clauses 45–46 contain conditional wider-road exceptions for flanked/corner buildings.
- Clause 50: openings/balconies require 2 m boundary distance for building height≤9 m and 3 m
  for 9<H<23 m. Blank-wall/consent exceptions exist; ≥23 m needs the high-rise regime.
- Clause 42: waterway width<10 m requires 3 m; width≥10 m requires 6 m; large water bodies 12 m.

Short original reference: “กึ่งกลางถนนสาธารณะ” (road centreline). Conversion of the 6 m rule
to `max(0, 6 - W/2)` is valid only when the plot edge coincides with the near right-of-way edge.
Clause 50 classifies whole-building height; treating it solely as a floor-elevation tier is unsafe.

## 4. Bangkok controls that must be considered together

Source: [official BMA Building Control Ordinance 2544](https://webportal.bangkok.go.th/public/user_files_editor/76/law/tk24.pdf),
printed pages 15–16 and 27–29. Later amendment completeness remains unresolved.

- Clauses 49–50 repeat road-height/setback mechanics, with additional exceptions.
- Clause 52: uncovered space≥30% plot for residential; ≥10% nonresidential; mixed residential30%.
- Clause 54 explicitly uses floor/height tiers: openings on floor2/down or≤9 m need2 m; floor3/up
  or>9 m need3 m. Reconcile with the national whole-building rule rather than ignoring either.
- Clause 55: all-around open space1 m for height≤15 m (small-house exception);2 m above15 m.
- Clauses83–85: office working-room area≥300 m² triggers parking, at1 car/60 m². Condo parking
  applicability refers to units≥60 m², then1 car/unit. Large-building requirements also apply;
  use the greater applicable count, including1 car/120 m², and round fractions up.
- Clauses88/90: driveway6 m two-way or3.5 m one-way;≥15 cars requires connection to public road
  ≥6 m continuing to wider road.

Short original term: “เขตทาง”. Lane count or visible paving is not the required right-of-way width.
Parking provision cannot be passed using a guessed unit count or gross-area allowance alone.

## 5. Classification and environmental review

The BMA ordinance definitions locate high-rise at height≥23 m and extra-large at area≥10,000 m².
Its large-building definition also combines area>2,000 m² or height≥15 m with area>1,000 m².
These trigger additional regimes; absence of implemented access/fire checks is unknown, not pass.
The authoritative [OCS MR33 index](https://www.ocs.go.th/searchlaw/law-index/item/13926) was found
but document retrieval timed out. Do not claim a complete current high-rise access rule from an
old copy; amendment69 and any later changes require inspection.

[ONEP's national 2023 EIA notification](https://www.onep.go.th/wp-content/uploads/2024/01/2567-01-05-p240-mnre-announcement.pdf),
entry31, locates a collective-housing trigger of≥80 rooms or usable area≥4,000 m², submitted at
construction permission/notification. Triggering review is not a statutory prohibition and does
not establish that approval has been granted. The PDF's text extraction is damaged, so verify
the original rendering before copying Thai text or promoting the record.

The [ONEP 2025 local notification](https://www.onep.go.th/wp-content/uploads/2025/11/2568-11-20-p13-mnre-announcement.pdf)
that appears in searches is specific to Samui/Phangan protected areas. Its similar figures must
not be applied to Bangkok as the governing instrument.

## 6. Zone, parcel and vacancy status

The [official district map](https://webportal.bangkok.go.th/public/user_files_editor/354/DISTRICT_CPD/2556/1009.pdf)
locates the Y.7-21 label among neighboring zones, but a label is not machine-readable boundary
geometry. BMA's [services page](https://webportal.bangkok.go.th/cpud/page/sub/19057/)
points to the 2013 GIS at https://3d-cpd.bangkok.go.th; that service timed out during this pass.
No authoritative GeoJSON, parcel survey or dated vacant-site observation was obtained.

Consequences for implementation:

1. A digitized illustration can be shown only with explicit uncertainty and provenance.
2. A research-window polygon cannot be relabelled Y.7-21.
3. Missing building footprints cannot establish vacancy.
4. A site/source evidence gate must remain unknown until the whole plot, overlays and road
   reference geometry are checked. No default concept can honestly receive an overall legal
   feasibility pass while these gates remain unresolved.

## 7. Boundary fixtures to write before enabling statutory passes

- W just below/at/above6,10,20 m; distinguish centreline and right-of-way-edge input.
- Two floors/8 m and three floors/9 m; validate whole-building versus floor-specific predicates.
- H just below/at/above9,15,23 m; extra-large area just below/at/above10,000 m².
- Office area just below/at/above1,000 and10,000 m²; residential10,000 m²; station distance500 m.
- Multiple roads meeting clauses45/46 versus conservative all-road clipping.
- OSR denominator, subdivision history, mixed-use open-space minimum, parking applicability and
  countable-area exclusions. Unknown inputs must survive every dependency gate.

These are research directions and fixtures, not proof that the full legal scope is complete.

## 8. Follow-up: bounded baseline evidence decision

The following narrow conclusion is supportable as of this research date: **BMA continues to
identify the 2013 comprehensive plan as its comprehensive-plan baseline, with statutory
continuation provisions pending replacement.** This does not assert that no partial amendment,
site overlay or additional building-control instrument exists.

Evidence chain:

1. The [2013 Gazette copy](https://webportal.bangkok.go.th/public/user_files_editor/76/law/tk10.pdf)
   identifies the instrument and its 16 May 2013 publication. Keep publication distinct from an
   independently documented commencement field.
2. The [official BMA-hosted 2015 amendment Gazette PDF](https://webportal.bangkok.go.th/upload/user/00000121/File2020/Up%20Law/cityplan-1.pdf)
   has publication date 8 September 2015. Section2 starts it the following day, hence
   `effectiveDate: 2015-09-09`; section14 continues existing comprehensive-plan regulations.
3. The [official BMA 2019 Act record](https://gov.bangkok.go.th/LegalDetail?id=da385b9a-0a61-4c8e-9efc-9fa303717b20)
   explicitly states `effectiveDate: 2019-11-25`. Section111 continues existing plans until
   replacement in the same area, while permitting partial amendments/repeal. Short excerpt:
   “ให้มีผลใช้บังคับได้ต่อไปจนกว่าจะมีประกาศกระทรวงมหาดไทยหรือข้อบัญญัติท้องถิ่น”.
4. The [BMA planning FAQ](https://gov.bangkok.go.th/OrganizationInfo/efb96a02-e038-4172-8de2-004754f5e479?categoryId=e339c29a-ee36-41ac-803c-80d8ce46d5cf)
   calls the 2013 planning-regulation group currently applicable. It is current corroboration,
   not an instrument with a separately invented effective date.
5. The 2026 fourth-revision material remains labelled draft consultation in the official sources
   already cited above.

Implementation recommendation: a narrowly named evidence predicate such as
`comprehensivePlanBaselineEstablished` may be verified with the 2019 continuation source and
this corroborating chain. A broader predicate meaning complete legal coverage must remain
unknown. Do not promote site membership, exemptions, overlays, FAR counting definitions,
parking, EIA approval or any design result merely because baseline continuation is supported.

## 9. Follow-up: authoritative GIS found

The initial legacy-service failure was overcome through BMA's current GI Platform REST service.
See `zone-gis-evidence.md` and the bundled `apps/web/public/data/zone-manifest.json`. The exact
Y.7-21 polygon has now been retrieved. The current illustrative sample is outside it; this
supersedes the earlier statement that no machine-readable geometry had been obtained.
