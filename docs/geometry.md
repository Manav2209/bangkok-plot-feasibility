# Geometry and accounting decisions

## Coordinates

Store plot vertices as longitude/latitude on WGS84. Project with PROJ4 to WGS84 / UTM zone 47N
and subtract the projected origin `(100.6103, 13.6979)` to retain small local metre coordinates.
The geographic research window is ±0.02 degrees around that origin. It is not a legal zone.
The engine rejects inputs beyond that window and more than 1,000 vertices before running
quadratic validation. This is an explicit defensive complexity cap, not a measured performance claim.

UTM map scale and convergence have not been independently surveyed for this site. The default
tests check metric round trips and approximate WGS84 distances; survey-grade legal precision
and distortion tolerances remain an acceptance issue for the verified-site phase.

Render by inverse-projecting each actual metric vertex to longitude/latitude and then to
MapLibre Mercator coordinates. Three.js uses a translated/scaled local frame, with a north-axis
flip to match Mercator. This avoids substituting render-space distances for metric measurements.
MapLibre owns the camera and WebGL context. A custom Three.js layer draws on demand and
disposes obsolete geometry/materials.

## Polygon operations

The first adapter uses `clipper-lib` 6.4.2 (Boost Software License 1.0), an established but old
Clipper port. Do not describe it as a newly maintained Clipper2 implementation. The researched
`clipper2-js` readme explicitly reports failing polygon tests, so it was not selected for this slice.
A replacement remains possible behind the geometry package boundary.

Distances use a 1 mm integer grid. The adapter normalizes outer/hole winding and reads PolyTree
hierarchy, preserving holes and disconnected outputs. All rings remain available to the engine
and renderer. Uniform offsets use miter joins. UI rounding never feeds back into calculation.

Input validation accepts concavity, winding reversal, closed or unclosed rings and forward
collinear vertices. It rejects duplicate vertices, nonfinite values, crossings, self-touches,
overlapping reversals and plots under 1 m². Only the redundant final closing vertex is removed.
Holes are supported in operation results; the current drawing UI accepts one simple outer ring.

Fixtures cover analytic rectangle, L-shape and right-triangle offsets; narrow-neck splits;
courtyard holes; acute corners; collapse; winding equivalence; and invalid cases.

## Manually worked example

The illustrative metric outline is:

```text
(0,0), (60,0), (60,30), (35,30), (35,50), (0,50)
```

Plot area: `60 × 30 + 35 × 20 = 2,500 m²`.

For an assumed 3 m inset, the L-shaped footprint has area
`54 × 24 + 29 × 20 = 1,876 m²`.

Six compact floors at an assumed 3.2 m floor height:

- Gross modelled area: `6 × 1,876 = 11,256 m²`.
- Height: `6 × 3.2 = 19.2 m`.
- Uncovered ground: `2,500 − 1,876 = 624 m²`.
- Modelled FAR: `11,256 / 2,500 = 4.5024`.

For the stepped concept, the total inset becomes 3, 3, 5, 5, 7, 7 m. The floor areas are
1,876, 1,876, 1,500, 1,500, 1,156, 1,156 m², summing to **9,064 m²**. The covered ground
remains the ground-floor footprint because these particular generated levels are nested.
This shortcut must not be generalized to overhangs or independently placed masses; those
will need a covered-projection union under a sourced legal definition.

These are geometric quantities under design assumptions. They do not establish a regulatory
FAR, minimum open space, compliant height or practical buildability.
