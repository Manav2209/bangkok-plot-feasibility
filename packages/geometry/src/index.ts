import ClipperLib from 'clipper-lib';
import proj4 from 'proj4';
import type { MultiPolygon, Point, Ring } from '@bangkok/domain';

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
export const SAMPLE_PLOT = SAMPLE_METRIC.map(toGeographic);
