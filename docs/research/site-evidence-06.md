# Dated unbuilt-ground study and official road-record follow-up

Reviewed 23 November 2026. This pass obtained a visually inspected, dated and geolocated
observation. It does not verify today's vacancy, a legal parcel boundary or road access.

## Observation and reproducible source

At longitude/latitude `[100.61025, 13.69628]`, the Esri World Imagery citation service returns
record 5002983: `SRC_DATE=20260305`, `SRC_DATE2=1772668800000`, WV02, Vivid Advanced / Vantor,
block `DYNAMIC_ESRI_Bangkok_26Q1`, release `Raster Basemaps 2026.R06`. Citation layers 9 and 10
returned the same record; layer 10 corresponds to the inspected export's scale, about 1:2136.54.

- [Capture-date query](https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/10/query?f=pjson&where=1%3D1&geometry=100.61025,13.69628&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=OBJECTID,SRC_DATE,SRC_RES,SRC_ACC,MinMapLevel,MaxMapLevel,BlockName&returnGeometry=false)
- [Inspected image export](https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=100.6095,13.6957,100.6108,13.6970&bboxSR=4326&imageSR=4326&size=256,256&format=jpg&f=image)
- [Provider imagery documentation](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9)

Export metadata confirms 256 × 256 pixels, north-up EPSG:4326 extent
`[100.6095, 13.6957, 100.6108, 13.6970]`. The provider lists source resolution 0.5 m, sampled
resolution 0.3 m and `SRC_ACC=8.47`. The accuracy field is retained as provider metadata, not
converted into cadastral accuracy, an uncertainty guarantee or the zone layer's accuracy.

Both researchers and the primary agent inspected the image. It shows brown unbuilt ground,
buildings and vehicle parking north, excavation west, and trees around the edges. A conservative
inner illustrative outline excludes those edge features. It represents a study area, not a claim
about an entire property or the absence of temporary cultivation/occupation. No building was
removed from the application's context to make it appear empty.

The five outline coordinates are tracked in `apps/web/src/imageryStudy.ts`; they derive from
image pixels `[114,120]`, `[168,108]`, `[181,159]`, `[145,177]`, `[120,165]` using the export extent.
UTM47N polygon accounting gives approximately **1,014.24 m²**. Independent ray/segment checks
found all vertices inside the official zone with no boundary crossings. The engine's full-polygon
intersection and 1 m application guard also return inside. **The whole image extent is not inside
the zone**; its northeast corner and part of its area fall outside. No bounding-box substitution
was used for the study outline.

`pnpm review:designs` now evaluates this third case alongside the existing cases. Two reference
concepts pass its implemented study checks, with gross modelled areas about 2,433.84 and
2,049.84 m². Both retain overall legal status unknown. The main 2,500 m² example is unchanged.

The app offers this outline through **Dated imagery study · 5 March 2026**. Loading it clears
unsubstantiated road frontages and project inputs. The original image is linked at its provider;
downloaded imagery remains in ignored scratch storage and is not redistributed in the bundle.
Provider content can change, so the record retains the inspected date and citation identifiers.

## Official road evidence located

The [BMA road feature service](https://cpudgiapp.bangkok.go.th/arcgis/rest/services/ROAD/ROAD_BMA/FeatureServer)
exposes separate fields `ROAD_WIDTH` (road-corridor width) and `SURFACE_WIDTH` (traffic-surface
width). Layer 0 record 629, Sukhumvit 101, reports 10.5 m and 6 m respectively. Layer 1 returned
records for Sukhumvit 85, 87, 89, 89/1 and 91. These are useful official records; their retrieval
does not certify present corridor geometry, continuing route access or frontage for another site.
No applicable 97/97-1 record was obtained. The 101 width must not be assigned to the current
example or the imagery study.

A follow-up aerial inspection along the in-zone section of Sukhumvit 101 did not establish
a suitable vacant frontage. It showed buildings, vehicle aprons or obscuring trees. A suspected
northern gap near `[100.6108, 13.6905]` was an occupied building/access setting. The point proposed
for a larger eastern opening near `[100.6150, 13.69015]` was outside the supported zone. No new
outline or capture-date claim was accepted from that follow-up; the March date above applies
only to the separately verified imagery study.

[BMA Property layer 7](https://cpudgiapp.bangkok.go.th/arcgis/rest/services/BMA_Property/BMA_Property2566/MapServer/7)
describes public-way boundaries appearing on Department of Lands map sheets. A query around
the imagery study returned canal polygons named Khlong Bang Nang Chin (record 11870) and
Khlong Khwang (record 11907), rather than a verified road frontage. These create a specific
waterway-overlay review requirement. No legal water edge, applicable width or project exception
has been accepted as a statutory input from that query alone.

## Remaining acceptance gates

This closes the narrower task of obtaining a dated observation tied to a geolocated illustrative
study outline. It does not close the stronger vacant-default-site requirement. Current condition,
full occupation status, legal road connection/reference lines, canal controls and applicable
building rules remain unresolved. The app preserves those unknowns and does not replace the
main default or claim that either site is legally buildable.
