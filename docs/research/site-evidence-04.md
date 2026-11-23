# Default-site vacancy evidence — bounded investigation

Reviewed 23 November 2026 (Asia/Calcutta), including public metadata retrieved on 22 November.
**Outcome: no defensible vacancy-verified demonstration parcel was established.** The supported
Y.7-21 zone geometry exists, but a coordinate inside that zone is not evidence of vacant land.
Do not change the default's vacancy status to verified from this investigation.

## Acceptance evidence required

A replacement default needs a geolocated site outline wholly inside the exact official zone,
a road-fronting relationship, and attributable evidence of the site's vacant condition at an
identified observation/capture date. A drawn outline may remain explicitly illustrative; it must
not become a cadastral claim. Historical observations must remain historical. A listing's creation,
refresh, crawler, imagery publication or access date is not a photograph's acquisition date.

The exact zone source and geometry checks are documented in `zone-gis-evidence.md`. The original
sample at `[100.6103, 13.6979]` is outside that polygon. The translated illustrative candidate
anchored at `[100.6095586006744, 13.697633653677455]` is geometrically inside, but has no verified
vacancy observation, title boundary or legal road-width evidence.

## Route 1 — OpenAerialMap: no coverage returned

The public metadata query for the official zone's bounding box was executed successfully through
host networking on 22 November 2026:

https://api.openaerialmap.org/meta?bbox=100.59151,13.68078,100.61631,13.70649&limit=100

The API returned HTTP 200 with `meta.found: 0` and `results: []`. This is a completed search with
no returned imagery, rather than a vacancy observation. It does not prove that no imagery exists
elsewhere, and no image date or parcel polygon can be derived from an empty result.

## Route 2 — KartaView: dated camera positions, no parcel observation

The public provider's [photo documentation](https://kartaview.org/doc/photos) describes geotagged
photo search. A public API request completed on 22 November and returned `apiCode: 600`:

https://api.kartaview.org/2.0/photo/?lat=13.6976&lng=100.6095&radius=500&zoomLevel=16&join=sequence&itemsPerPage=20&page=1

The returned metadata separates the actual `shotDate` field from upload/processing dates.
One useful, geographically inside-zone camera lead was:

- Photo ID `1329109965`, sequence `3688269`, index `3985`.
- Camera longitude/latitude `[100.607506, 13.698239]`.
- Source `shotDate`: `2019-02-18 03:29:32.000`.
- Source upload `dateAdded`: `2021-07-02 10:59:40`; this must not be used as the image date.
- Provider photo metadata URL: https://api.kartaview.org/2.0/photo/1329109965
- Provider view lead: https://kartaview.org/details/3688269/3985
- Source image URL returned by the metadata:
  https://storage13.openstreetcam.org/files/photo/2021/6/28/lth/3688269_9a438_60def19a36814.jpg

A local point-in-polygon check against the bundled official Y.7-21 outer ring put this camera
position inside. It does **not** establish that any parcel visible from it is inside, vacant,
road-fronting or surveyed. The direct image/provider URLs were inaccessible through the browser
search fetcher, so no vacant condition was visually verified. A photo taken in 2019 could only
support an explicitly historical observation even if subsequently inspected successfully.

Follow-up on 23 November 2026: host networking successfully retrieved the public metadata and
the processed panorama via the metadata's `imageProcUrl`. Both are retained in ignored
`tmp/site-research` for inspection, not bundled for redistribution. The API still identifies the
capture as 18 February 2019. Visual inspection shows a built-up residential street with houses,
walls and gates; it does not establish a geolocated vacant parcel outline. This resolves the
earlier inability to inspect this particular image, but does not verify vacancy, current site
condition, legal frontage or road width. No evidence flags or default geometry were changed.

Two other returned camera leads, `[100.610058, 13.700839]` and `[100.611347, 13.701319]`, failed
that local zone-membership test and were not treated as supported-zone candidates. No parcel
outline was invented around any of these camera locations.

## Route 3 — original seller/broker listing leads

### Sukhumvit 97/1, 106 square wah, reference 00154522

[PropertyHub listing results](https://propertyhub.in.th/en/land-for-sale/sukhumvit-97) identify a
land-sale lead in Phra Khanong, reference `00154522`, described as 106 square wah with approximate
18 by 24 m dimensions. A displayed refresh is 18 November 2026. The result provides no verified
parcel polygon or photography acquisition date. A refresh is not an on-site observation.
Consequently it remains an unverified lead; no in-zone claim or default polygon is defensible.

### Sukhumvit 97/1, 59.5 square wah, broker reference 7309

The [broker advertisement mirrored on BestHomeCondo](https://www.besthomecondo.com/property/215510/%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B8%94%E0%B8%B4%E0%B8%99%E0%B9%80%E0%B8%9B%E0%B8%A5%E0%B9%88%E0%B8%B2-59-5-%E0%B8%95%E0%B8%B2%E0%B8%A3%E0%B8%B2%E0%B8%87%E0%B8%A7%E0%B8%B2-%E0%B8%96%E0%B8%A1%E0%B9%81%E0%B8%A5%E0%B9%89%E0%B8%A7-%E0%B8%AA%E0%B8%B8%E0%B8%82%E0%B8%B8%E0%B8%A1%E0%B8%A7%E0%B8%B4%E0%B8%97-971-%E0%B9%83%E0%B8%81%E0%B8%A5%E0%B9%89-bts-%E0%B8%9A%E0%B8%B2%E0%B8%87%E0%B8%88%E0%B8%B2%E0%B8%81-%E0%B8%97%E0%B8%B3%E0%B9%80%E0%B8%A5%E0%B8%94%E0%B8%B5-%E0%B8%A3%E0%B8%B2%E0%B8%84%E0%B8%B2%E0%B8%96%E0%B8%B9%E0%B8%81%E0%B8%A1%E0%B8%B2%E0%B8%81/)
names Central Home Property and reference `7309`. Its displayed publication/update date is
14 September 2026, without an explicit image capture date. It describes the land as red
commercial zoning, which conflicts with assuming the supported orange Y.7 zone. Its supplied
[map link](https://maps.app.goo.gl/bpHT4Bp6zdZnZCKn7) could not be resolved through the available
web fetcher. Neither a coordinate polygon nor independently dated vacancy evidence was obtained.
This candidate was not accepted for the supported-zone default.

Other indexed listings describe land with buildings, or use only neighbourhood names. Those
cannot satisfy a vacant default simply because the word land appears in the title. Search
result area-wide proximity is not exact plot membership.

## Official acquisition routes still open

- [BMA imagery service/workflow](https://webportal.bangkok.go.th/cpud/page/sub/27736/) and its
  [GIS services](https://webportal.bangkok.go.th/public/cpdonestopservice/page/sub/8107) are
  acquisition leads. They do not themselves contain a dated observation for the sample.
- The [Royal Thai Survey Department aerial-photo catalog](https://data.go.th/dataset/aerial-photo-database)
  leads to an access/login workflow. Catalog-update dates are not photograph dates.
- A competent owner's or surveyor's dated, geolocated site photographs plus a boundary sketch
  tied to the official polygon could resolve this question without pretending the sketch is a
  title survey. Permission and redistribution terms for any reused imagery must also be known.

No person was contacted, account created, licensing terms accepted, remote data published or
credentials used in this research.

## Implementation decision

Keep `vacancyVerified: false` and a missing/unknown vacancy observation date for the current
illustrative default. Preserve all real surrounding buildings. Continue showing the verified
zone and any geometric membership outcome separately from vacancy, legal road widths, ownership
and complete applicability. The precise release blocker is **absence of a visually inspected,
dated, attributable vacancy observation tied to a specific supported-zone plot outline**.

The next useful evidence is an actual dated image/site observation or a provider response that
resolves a specific parcel, not another generic list of land advertisements or another test of
missing OpenStreetMap footprints.
