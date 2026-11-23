# Owner and bank inventory audit for a vacant default site

Checked 23 November 2026 (Asia/Calcutta). This bounded pass investigated primary bank/asset-manager
inventories rather than repeating general listing portals, OpenAerialMap or KartaView searches.
**No supported-zone parcel with both defensible vacancy evidence and legal frontage evidence
was obtained.** No replacement parcel is accepted and no vacancy/road-width evidence flag should
be promoted from this pass.

This is a record of the sources reached and the missing artifacts, not a statement that no
appropriate bank-owned land exists. Search indexing, inaccessible inventory applications and
the absence of an identifiable in-zone parcel limit that conclusion.

## 1. BAM: a concrete primary listing was rejected geometrically

Source: [BAM asset 136106, market code CBKKVL0445001](https://www.bam.co.th/th/npa/property/136106).
The page identifies land between Phatthanakan 32 and 44 and provides a public map link with
coordinate `[100.6276, 13.716622]`. It also marks the asset as being used and describes an
approximately 1 m concrete pedestrian access path. Advertising imagery is expressly not a
substitute for viewing the actual condition. No acquisition date or authoritative road corridor
was obtained.

The map link actually exposed by the owner page is:
https://maps.google.com/?q=13.716622%2C100.6276

The bundled official Y.7-21 geometry has bounding box:

```text
west 100.59151177889449
south 13.680786686434486
east 100.61630839406683
north 13.706488990016458
```

A local coordinate check confirms the owner's pin lies east and north of that box. A point
outside a polygon's bounding box cannot belong to that polygon. This listing therefore cannot
become the supported Y.7-21 default, independently of its other deficiencies. Its old district
label must not override that geometric result. No parcel outline was invented from the pin.

Other surfaced BAM inventory records used former Phra Khanong names for Phatthanakan or
Prawet locations. Those names alone do not identify today's supported zone. They were not
accepted as inside-zone sites.

## 2. SAM: identifiable local assets were existing condominiums

Primary pages inspected included:

- [SAM CL0084, record 21778](https://www.sam.or.th/site/npa/detail.php?id=21778): an existing
  Waterford Sukhumvit 50/3 condominium unit, with a condominium ownership document.
- [SAM 3A1087, record 19443](https://www.sam.or.th/site/npa/detail.php?id=19443): an existing
  Elio Del Ray unit in Sukhumvit 64, with a condominium ownership document.

These are not vacant-land candidates. Nearby-road directions, land-map links and the word
Phra Khanong in surrounding text cannot turn a unit in an existing building into a vacant plot.
Other search results for Bang Chak referred to petrol stations in other provinces or condominium
sale schedules. No in-zone vacant parcel title/outline or dated site-inspection report was
obtained from SAM in this pass.

## 3. Krungthai: document route confirmed, no specific accepted parcel

The primary [Krungthai NPA inventory](https://npa.krungthai.com/) is reachable. Its
[public FAQ](https://npa.krungthai.com/faq) describes asset-specific photographs, map pins,
drawn maps and additional-document sections. That confirms a possible acquisition route for
an identified asset; it is not itself evidence about a particular plot.

No specific supported-zone vacant parcel with an inspected boundary, capture date and legal
right-of-way document was obtained. Search hits for Bang Chak in Phra Pradaeng/Samut Prakan
were rejected as a different locality. No bidding, document request or contact form was sent.

## 4. SCB and Kasikorn: bounded public-access limitations

SCB's [official NPA explanation](https://www.scb.co.th/th/personal-banking/stories/home-car/non-performing-assets-houses)
points to [asset.home.scb/home](https://asset.home.scb/home). Both that route and
[asset.home.scb/project](https://asset.home.scb/project) returned HTTP 403 through the available
read-only fetcher. No access-control bypass, account or broker application was attempted.
No parcel-level evidence can be claimed from the bank's general explanation page.

The [Kasikorn property inventory](https://www.kasikornbank.com/th/propertyforsale) returned its
public search interface, but the retrieved result did not provide an identifiable in-zone parcel.
An indexed historical 2018 promotion PDF could not be inspected by the fetcher because of its
size. The promotion's date would not establish a photograph capture date in any case. These
limitations were recorded rather than being treated as confirmation of vacancy.

## 5. Exact indispensable artifacts

For one actual candidate, the following is the minimum useful owner/agency evidence bundle.
It is a request specification for a future authorized acquisition, not a request sent by us.

### A. Identify and geolocate the same parcel

- Owner/AMC asset reference and the complete title/deed identifier, land number, survey sheet,
  subdistrict and district, so multiple similarly named locations cannot be confused.
- A title plan or competent survey/boundary sketch with the source CRS, orientation, scale and
  boundary control points, or georeferenced coordinates tied to that document. A marketing pin
  alone is insufficient to recover an outline.
- Enough extent information to test the whole outline against the official Y.7-21 polygon and
  its uncertainty. A centroid-only test cannot establish full containment.

The [Phra Khanong Land Office's official service page](https://www.dol.go.th/bkk-phrakhanong/home/)
provides the Landsmaps and survey-service acquisition routes. The existence of that page is not
evidence of a particular title, a survey, ownership or legal access.

### B. Record the observed vacant condition and its date

- Original geolocated site photographs or provider imagery with actual capture/acquisition
  date, observer/provider identity and enough surrounding landmarks to align the observation
  to that exact parcel. A dated competent inspection report with attached site photographs
  can supply the observation link; an inventory update timestamp cannot.
- Views covering the proposed site, including any existing structures, occupation, temporary
  uses and obstructions. A land-sale label is not proof of an unoccupied cleared site.
- Permission/reuse terms for any imagery redistributed with the tool. Retain an observation
  date separately from the retrieval date; label historic evidence as historic.

### C. Establish legal frontage and the applicable reference lines

- The responsible road/land authority's road register, dedication/right-of-way plan or competent
  survey tied to the parcel. It must identify the road, public/private status, corridor boundaries
  and the legally relevant width at every relevant frontage.
- Near and opposite right-of-way boundaries, and a centreline where the applicable rule uses
  it, in a known CRS or tied to survey control. Paving width, lane count, a satellite ruler,
  OSM width tags and marketing claims must remain distinct from this evidence.
- Any planned widening/dedication, access easement or corridor limitation that affects the
  plot, plus evidence for the continuing access route where the applicable requirement uses
  its narrowest width. A footpath description alone does not establish compliant fire access.
- All relevant roads must be recorded; evidence for one favorable frontage cannot erase another.

### D. Resolve remaining parcel-specific applicability separately

The bundle should identify known subdivision history, adjoining waterways and the relevant
road/rail or other overlays. The competent agency's dated planning response or reviewed official
instruments must connect those restrictions to the parcel. Vacancy and frontage verification
do not independently settle FAR inclusions, classification, parking, environmental review or
all applicable legal controls.

## 6. Implementation consequence and stop condition

Keep the current default labelled illustrative and its vacancy/ROW evidence unknown. The exact
zone geometry and a geometric containment result may be displayed separately. Retain real mapped
buildings and do not infer vacant land from absent footprints.

The missing indispensable input is now specific: **one identifiable in-zone parcel with a
geolocated outline, dated actual-condition evidence and an authoritative legal road-corridor
record tied to it**. Another generic land list or an unlabeled image will not close these gates.
This bounded inventory pass stops here. No person was contacted, account created, acquisition
agreement accepted, code changed or site published.
