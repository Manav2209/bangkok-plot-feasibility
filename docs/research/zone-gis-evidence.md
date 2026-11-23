# Official Y.7-21 geometry and vacancy-evidence follow-up

Checked 22 November 2026. Geometry was obtained from an official public BMA service; vacancy,
parcel title, legal road width and complete current applicability remain unverified.

## Exact source and bundled artifacts

- Service: https://cpudgiapp.bangkok.go.th/arcgis/rest/services/GI_Platform/BMAGI_Planing/MapServer
- Layer1: แผนผังข้อกำหนดการใช้ประโยชน์ที่ดิน; metadata explicitly identifies the 2013 plan.
- Queried `LUP_ZONE = 'ย.๗'` attributes to identify `OBJECTID=104`, `LUP_ID=201`,
  `LUP_SUBZON='ย.๗-๒๑'`.
- Exact geometry query:
  https://cpudgiapp.bangkok.go.th/arcgis/rest/services/GI_Platform/BMAGI_Planing/MapServer/1/query?f=geojson&objectIds=104&outFields=*&returnGeometry=true&outSR=4326
- Bundled `apps/web/public/data/zone.geojson` preserves the returned polygon and properties,
  without simplification. One polygon, one outer ring of213 positions including closure, no holes.
- `apps/web/public/data/zone-manifest.json` records the query, retrieval date, IDs, source and
  output CRSs, attribution, file hash/length and raw-response hash. Its file hash applies to the
  final pretty-formatted GeoJSON, not the differently formatted raw response.
- Raw geometry and service/layer schemas are retained under `docs/research/`.

The official [LUP_POLYGON catalog](https://data.go.th/th/dataset/lup_polygon?is_fullscreen=1)
identifies BMA, public access, 2013 plan origin, release/update date16 May2013 and original
WGS84/UTM47N coordinates. It explicitly says **License not specified**. Do not invent CC/ODbL
terms. Attribute BMA and resolve reuse terms for a distribution claim. Source0.001 m XY tolerance
is storage/topology precision, not surveyed position accuracy; actual positional uncertainty
is not published in the retrieved metadata.

GIS attributes FAR5 and OSR6 corroborate the clause candidates, but do not settle site/legal
applicability or regulated-area definitions. Zeros in setback, minimum-lot and height fields
mean unspecified in this GIS record, not absence of other legal restrictions.

## Existing illustrative sample: outside

All six original sample vertices around anchor `[100.6103,13.6979]` lie outside the exact zone.
An independent Clipper intersection in EPSG:32647, using a1 mm integer grid, gives0 m² overlap
for the2,500 m² L-shape. Therefore full containment is false; it must not receive a Y.7-21 label.

A nearest accepted candidate on a5 m translation grid shifts the shape by`[-80,-30]` metres
in the existing metric frame. Geographic anchor:`[100.6095586006744,13.697633653677455]`.
All vertices lie inside and minimum segment-to-segment boundary clearance is10.744114493 m.
The85.44 m translation remains within the existing neighbourhood extract. Full coordinates and
method are in `illustrative-inside-zone-candidate.json`. **This is geometry only; it is not a
verified vacant site, parcel, road-fronting boundary or ownership claim.** No app default was
changed by this research task.

## Routes attempted for dated vacancy evidence

1. The legacy`3d-cpd.bangkok.go.th` service timed out in web access and failed TLS in host
   access. `cityplangis.bangkok.go.th` likewise failed TLS. These failures do not imply that the
   underlying public data does not exist.
2. Current`cpudgiapp.bangkok.go.th` service metadata worked through host networking. The
   GI Platform and Basemap_Service folders expose building, road-edge, centreline, water and
   administrative layers. Basemap editions include2562,2564 and2568, but an edition name is not
   an image acquisition date and absence of footprints is not vacancy evidence.
3. The [BMA GIS service page](https://webportal.bangkok.go.th/public/cpdonestopservice/page/sub/8107)
   describes its1:4,000 GIS service. The [BMA planning FAQ](https://gov.bangkok.go.th/OrganizationInfo/efb96a02-e038-4172-8de2-004754f5e479?categoryId=e339c29a-ee36-41ac-803c-80d8ce46d5cf)
   confirms that multiple-year aerial/satellite imagery is among its data groups. Neither page
   itself supplies a parcel-level dated observation.
4. BMA's [Imagery service/workflow page](https://webportal.bangkok.go.th/cpud/page/sub/27736/)
   is an official acquisition route. Request an extract for the candidate coordinates with its
   actual acquisition date, accuracy and reuse conditions. A catalog entry or today's access
   date is not the imagery observation date.
5. The public OpenAerialMap metadata URL for the local bounding box could not be accessed
   through the web tool. No image or dated observation was obtained from that attempt.

The [Royal Thai Survey Department aerial-photo catalog](https://data.go.th/dataset/aerial-photo-database)
links to https://aerialphoto.rtsd.mi.th/login as another official imagery-acquisition path. Its
metadata update date is not a photograph date. Do not relabel these acquisition routes as a
vacancy determination. No contact request was sent, account created or credentials used.
