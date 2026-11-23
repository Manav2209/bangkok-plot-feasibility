# Bundled real neighbourhood context

The committed extract was retrieved from OpenStreetMap through Overpass on
**22 November 2026 at 10:37:12 UTC**, using an OSM database timestamp of 10:36:05 UTC.
It covers approximately a 1 km square around longitude 100.6103, latitude 13.6979.

- 1,049 actual mapped building features.
- 178 clipped road segments and 4 waterway segments.
- 6,170 coordinate vertices; 1,231 total features; approximately 760 KB of compact GeoJSON.
- No missing/incomplete source geometries were skipped in this extract.

Files: `apps/web/public/data/context.geojson`, `context-manifest.json`, and
`context-LICENSE.md`. Every feature retains its OpenStreetMap source ID, public feature URL,
original tags, source edit timestamp and version. The manifest records the query, bounding box,
processing steps, assumptions, data hash and licence. Data is ODbL 1.0 and requires visible
© OpenStreetMap contributors attribution with the licence/copyright link.

There are no mapped height tags in this extract. Three building heights are estimated from
mapped storey counts at 3.2 m per level; 1,046 use an explicitly labelled 9.6 m fallback.
All heights remain unverified context estimates and must never feed compliance calculations.
Mapped tags are not a survey, and these fallback figures are design/display assumptions.

Only two road segments have numeric width tags. A nearby named road is
[Soi Sukhumvit 97/1 Yaek 2, OSM way 156496197](https://www.openstreetmap.org/way/156496197);
its width is not tagged. None of these tags establishes legally relevant right-of-way width.
No widths were inferred from lanes or road class.

This data neither verifies the illustrative parcel nor proves vacancy. Keep all existing mapped
buildings visible and preserve the site's unverified status until dated site evidence exists.

## Reproduce and validate

From the workspace root, run `node scripts/extract-context.mjs` for a one-time network refresh.
Run `node scripts/validate-context.mjs` to check the committed dataset hash, feature/source IDs,
ring closure, coordinates, counts, line extent and provenance. The initial validation passed.

The runtime should load the bundled GeoJSON, not call Overpass while editing a plot. The generated
data files are excluded from Prettier because reformatting them changes the content hash.

Source licensing: [OpenStreetMap copyright](https://www.openstreetmap.org/copyright),
[ODbL legal text](https://opendatacommons.org/licenses/odbl/1-0/).
