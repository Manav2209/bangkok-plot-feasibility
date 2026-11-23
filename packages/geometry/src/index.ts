import ClipperLib from 'clipper-lib';
import proj4 from 'proj4';
import type { MultiPolygon, Point, Ring } from '@bangkok/domain';
export { roadSection, frontageClearance, mappedRoadOffset, type RoadSection } from './road-section';

// WGS84 / UTM zone 47N. Metres, with a translated origin to keep arithmetic local.
export const ORIGIN: Point = [100.6103, 13.6979];
const UTM47 = '+proj=utm +zone=47 +datum=WGS84 +units=m +no_defs';
const projection = proj4('EPSG:4326', UTM47);
const originMetric = projection.forward(ORIGIN);
const SCALE = 1000; // Clipper integer grid: one millimetre. UI rounding is separate.
const EPS = 1e-8;

export function toMetric(point: Point): Point {
  const [east, north] = projection.forward(point);
  return [east - originMetric[0], north - originMetric[1]];
}
export function toGeographic(point: Point): Point {
  return projection.inverse([point[0] + originMetric[0], point[1] + originMetric[1]]) as Point;
}
export function signedArea(ring: Ring): number {
  return (
    ring.reduce((sum, p, i) => {
      const q = ring[(i + 1) % ring.length];
      return sum + p[0] * q[1] - q[0] * p[1];
    }, 0) / 2
  );
}
export function area(polygons: MultiPolygon): number {
  return polygons.reduce(
    (sum, p) =>
      sum +
      Math.abs(signedArea(p.outer)) -
      p.holes.reduce((holes, ring) => holes + Math.abs(signedArea(ring)), 0),
    0,
  );
}
function same(a: Point, b: Point): boolean {
  return Math.hypot(a[0] - b[0], a[1] - b[1]) < EPS;
}
function cross(a: Point, b: Point, c: Point): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}
function onSegment(a: Point, b: Point, p: Point): boolean {
  return (
    Math.abs(cross(a, b, p)) < EPS &&
    p[0] >= Math.min(a[0], b[0]) - EPS &&
    p[0] <= Math.max(a[0], b[0]) + EPS &&
    p[1] >= Math.min(a[1], b[1]) - EPS &&
    p[1] <= Math.max(a[1], b[1]) + EPS
  );
}
function intersects(a: Point, b: Point, c: Point, d: Point): boolean {
  const c1 = cross(a, b, c),
    c2 = cross(a, b, d),
    c3 = cross(c, d, a),
    c4 = cross(c, d, b);
  return (
    (((c1 > EPS && c2 < -EPS) || (c1 < -EPS && c2 > EPS)) &&
      ((c3 > EPS && c4 < -EPS) || (c3 < -EPS && c4 > EPS))) ||
    onSegment(a, b, c) ||
    onSegment(a, b, d) ||
    onSegment(c, d, a) ||
    onSegment(c, d, b)
  );
}
export function validateRing(input: Ring): { ring: Ring; errors: string[] } {
  let ring = input.map((p) => [...p] as Point);
  if (ring.length > 1 && same(ring[0], ring[ring.length - 1])) ring = ring.slice(0, -1);
  const errors: string[] = [];
  if (ring.some((p) => p.length !== 2 || !p.every(Number.isFinite)))
    return { ring, errors: ['Every vertex needs two finite coordinates.'] };
  if (ring.length < 3) return { ring, errors: ['Draw at least three vertices.'] };
  // Input complexity is bounded at the UI/import boundary, not inside the geometric kernel.
  for (let i = 0; i < ring.length; i++) {
    for (let j = i + 1; j < ring.length; j++) {
      if (same(ring[i], ring[j])) return { ring, errors: ['Remove repeated vertices.'] };
      if (j === i + 1 || (i === 0 && j === ring.length - 1)) continue;
      if (intersects(ring[i], ring[(i + 1) % ring.length], ring[j], ring[(j + 1) % ring.length])) {
        return {
          ring,
          errors: ['The plot crosses or touches itself. Move the crossing vertices.'],
        };
      }
    }
    const prev = ring[(i + ring.length - 1) % ring.length],
      next = ring[(i + 1) % ring.length];
    if (
      Math.abs(cross(prev, ring[i], next)) < EPS &&
      (ring[i][0] - prev[0]) * (next[0] - ring[i][0]) +
        (ring[i][1] - prev[1]) * (next[1] - ring[i][1]) <
        0
    ) {
      return {
        ring,
        errors: ['A boundary edge doubles back on itself. Remove the overlapping edge.'],
      };
    }
  }
  if (Math.abs(signedArea(ring)) < 1) errors.push('The plot must cover at least 1 m².');
  if (signedArea(ring) < 0) ring.reverse();
  return { ring, errors };
}
function paths(polygons: MultiPolygon): ClipperLib.Paths {
  return polygons.flatMap((p) =>
    [p.outer, ...p.holes].map((ring, i) => {
      const oriented = signedArea(ring) > 0 === (i === 0) ? ring : [...ring].reverse();
      return oriented.map(([X, Y]) => ({ X: Math.round(X * SCALE), Y: Math.round(Y * SCALE) }));
    }),
  );
}
function fromTree(tree: ClipperLib.PolyTree): MultiPolygon {
  const result: MultiPolygon = [];
  function visit(node: ClipperLib.PolyNode) {
    const ring = node.Contour().map(({ X, Y }) => [X / SCALE, Y / SCALE] as Point);
    if (ring.length && !node.IsHole())
      result.push({
        outer: ring,
        holes: node
          .Childs()
          .filter((child) => child.IsHole())
          .map((child) => child.Contour().map(({ X, Y }) => [X / SCALE, Y / SCALE] as Point)),
      });
    node.Childs().forEach(visit);
  }
  visit(tree);
  return result;
}
export function inset(polygons: MultiPolygon, distanceM: number): MultiPolygon {
  if (!Number.isFinite(distanceM) || distanceM < 0)
    throw new Error('Inset must be a nonnegative finite distance.');
  if (!polygons.length) return [];
  const offset = new ClipperLib.ClipperOffset(2, 0.25 * SCALE);
  offset.AddPaths(paths(polygons), ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etClosedPolygon);
  const tree = new ClipperLib.PolyTree();
  offset.Execute(tree, -distanceM * SCALE);
  return fromTree(tree);
}
export function difference(subject: MultiPolygon, clip: MultiPolygon): MultiPolygon {
  const engine = new ClipperLib.Clipper();
  engine.AddPaths(paths(subject), ClipperLib.PolyType.ptSubject, true);
  engine.AddPaths(paths(clip), ClipperLib.PolyType.ptClip, true);
  const tree = new ClipperLib.PolyTree();
  engine.Execute(
    ClipperLib.ClipType.ctDifference,
    tree,
    ClipperLib.PolyFillType.pftNonZero,
    ClipperLib.PolyFillType.pftNonZero,
  );
  return fromTree(tree);
}
export function intersection(subject: MultiPolygon, clip: MultiPolygon): MultiPolygon {
  const engine = new ClipperLib.Clipper();
  engine.AddPaths(paths(subject), ClipperLib.PolyType.ptSubject, true);
  engine.AddPaths(paths(clip), ClipperLib.PolyType.ptClip, true);
  const tree = new ClipperLib.PolyTree();
  engine.Execute(
    ClipperLib.ClipType.ctIntersection,
    tree,
    ClipperLib.PolyFillType.pftNonZero,
    ClipperLib.PolyFillType.pftNonZero,
  );
  return fromTree(tree);
}
export function union(polygons: MultiPolygon): MultiPolygon {
  if (!polygons.length) return [];
  const engine = new ClipperLib.Clipper();
  engine.AddPaths(paths(polygons), ClipperLib.PolyType.ptSubject, true);
  const tree = new ClipperLib.PolyTree();
  engine.Execute(
    ClipperLib.ClipType.ctUnion,
    tree,
    ClipperLib.PolyFillType.pftNonZero,
    ClipperLib.PolyFillType.pftNonZero,
  );
  return fromTree(tree);
}
/** Conservative segment-distance exclusion. Circumscribed 64-gons plus 2 mm grid guard. */
export function capsule(a: Point, b: Point, distanceM: number): MultiPolygon {
  if (!Number.isFinite(distanceM) || distanceM < 0) throw new Error('Invalid edge distance.');
  if (!distanceM) return [];
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (length < EPS) throw new Error('Zero-length boundary edge.');
  const d = distanceM + 0.002;
  const n: Point = [(-(b[1] - a[1]) / length) * d, ((b[0] - a[0]) / length) * d];
  const circle = (p: Point): PolygonShape => ({
    outer: Array.from({ length: 64 }, (_, i) => {
      const angle = (i * Math.PI) / 32;
      const radius = d / Math.cos(Math.PI / 64);
      return [p[0] + Math.cos(angle) * radius, p[1] + Math.sin(angle) * radius] as Point;
    }),
    holes: [],
  });
  return [
    {
      outer: [
        [a[0] + n[0], a[1] + n[1]],
        [a[0] - n[0], a[1] - n[1]],
        [b[0] - n[0], b[1] - n[1]],
        [b[0] + n[0], b[1] + n[1]],
      ],
      holes: [],
    },
    circle(a),
    circle(b),
  ];
}
type PolygonShape = MultiPolygon[number];
export function edgeInset(ring: Ring, distances: number[]): MultiPolygon {
  if (distances.length !== ring.length) throw new Error('One setback is required per edge.');
  return difference(
    [{ outer: ring, holes: [] }],
    ring.flatMap((a, i) => capsule(a, ring[(i + 1) % ring.length], distances[i])),
  );
}
export function clipRoadPlane(
  polygons: MultiPolygon,
  a: Point,
  b: Point,
  minimumDistanceM: number,
  winding: number,
): MultiPolygon {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (length < EPS) return [];
  const t: Point = [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
  const n: Point = [-t[1] * Math.sign(winding), t[0] * Math.sign(winding)];
  const reach =
    Math.max(
      1,
      ...polygons.flatMap((p) => p.outer.map((v) => Math.hypot(v[0] - a[0], v[1] - a[1]))),
    ) +
    Math.abs(minimumDistanceM) +
    1;
  const point = (along: number, normal: number): Point => [
    a[0] + t[0] * along + n[0] * normal,
    a[1] + t[1] * along + n[1] * normal,
  ];
  return intersection(polygons, [
    {
      outer: [
        point(-reach, minimumDistanceM),
        point(reach, minimumDistanceM),
        point(reach, reach),
        point(-reach, reach),
      ],
      holes: [],
    },
  ]);
}
export function rotatePoint(point: Point, angle: number): Point {
  return [
    point[0] * Math.cos(angle) - point[1] * Math.sin(angle),
    point[0] * Math.sin(angle) + point[1] * Math.cos(angle),
  ];
}
export function pointInside(point: Point, polygons: MultiPolygon): boolean {
  const inRing = (ring: Ring) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i],
        b = ring[j];
      if (onSegment(a, b, point)) return true;
      if (
        a[1] > point[1] !== b[1] > point[1] &&
        point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
      )
        inside = !inside;
    }
    return inside;
  };
  return polygons.some((p) => inRing(p.outer) && !p.holes.some(inRing));
}
export function bounds(polygons: MultiPolygon) {
  const vertices = polygons.flatMap((p) => p.outer);
  return {
    minX: Math.min(...vertices.map((p) => p[0])),
    maxX: Math.max(...vertices.map((p) => p[0])),
    minY: Math.min(...vertices.map((p) => p[1])),
    maxY: Math.max(...vertices.map((p) => p[1])),
  };
}

/** Exact topological containment for an axis-aligned rectangle, including holes.
 * Corners alone miss a notch crossing the rectangle. No polygon boundary may
 * cross its open interior; touching the rectangle boundary is permitted.
 */
export function axisAlignedRectangleInside(
  centre: Point,
  width: number,
  depth: number,
  polygons: MultiPolygon,
): boolean {
  if (!(width > 0 && depth > 0)) return false;
  const lo: Point = [centre[0] - width / 2, centre[1] - depth / 2];
  const hi: Point = [centre[0] + width / 2, centre[1] + depth / 2];
  const corners: Point[] = [lo, [hi[0], lo[1]], hi, [lo[0], hi[1]]];
  return polygons.some((component) => {
    if (!corners.every((corner) => pointInside(corner, [component]))) return false;
    for (const ring of [component.outer, ...component.holes])
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i],
          b = ring[(i + 1) % ring.length];
        let enter = 0,
          exit = 1;
        for (const axis of [0, 1] as const) {
          const delta = b[axis] - a[axis];
          if (Math.abs(delta) < 1e-12) {
            if (a[axis] <= lo[axis] + EPS || a[axis] >= hi[axis] - EPS) {
              enter = 1;
              exit = 0;
              break;
            }
          } else {
            const t0 = (lo[axis] + EPS - a[axis]) / delta;
            const t1 = (hi[axis] - EPS - a[axis]) / delta;
            enter = Math.max(enter, Math.min(t0, t1));
            exit = Math.min(exit, Math.max(t0, t1));
          }
        }
        if (enter < exit) return false;
      }
    return true;
  });
}
export function toGeoJSON(polygons: MultiPolygon) {
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'MultiPolygon' as const,
      coordinates: polygons.map((p) =>
        [p.outer, ...p.holes].map((ring) => {
          const points = ring.map(toGeographic);
          return [...points, points[0]];
        }),
      ),
    },
  };
}
export const SAMPLE_METRIC: Ring = [
  [0, 0],
  [60, 0],
  [60, 30],
  [35, 30],
  [35, 50],
  [0, 50],
];
// Translated illustrative outline, wholly inside the sourced 2013 Y.7-21 GIS polygon.
// This establishes historic zone geometry membership, not vacancy or a cadastral parcel.
export const SAMPLE_PLOT = SAMPLE_METRIC.map(([x, y]) => toGeographic([x - 80, y - 30]));
