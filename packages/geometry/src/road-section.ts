import type { MultiPolygon, Point, Ring } from '@bangkok/domain';

export interface RoadSection {
  nearEdge: [Point, Point];
  centreline: [Point, Point];
  farEdge: [Point, Point];
  inward: Point;
  corridor: MultiPolygon;
}

/** Metric cross-section outside a declared near-ROW plot edge. No surveyed-width claim. */
export function roadSection(
  a: Point,
  b: Point,
  widthM: number,
  winding: number,
): RoadSection | null {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (
    ![...a, ...b, widthM, winding].every(Number.isFinite) ||
    length < 1e-6 ||
    widthM <= 0 ||
    winding === 0
  )
    return null;
  const inward: Point = [
    (-(b[1] - a[1]) / length) * Math.sign(winding),
    ((b[0] - a[0]) / length) * Math.sign(winding),
  ];
  const offset = (p: Point, distance: number): Point => [
    p[0] - inward[0] * distance,
    p[1] - inward[1] * distance,
  ];
  const farEdge: [Point, Point] = [offset(a, widthM), offset(b, widthM)];
  return {
    nearEdge: [a, b],
    centreline: [offset(a, widthM / 2), offset(b, widthM / 2)],
    farEdge,
    inward,
    corridor: [{ outer: [a, b, farEdge[1], farEdge[0]], holes: [] }],
  };
}

export function frontageClearance(
  polygons: MultiPolygon,
  section: RoadSection,
): number | undefined {
  const distances = polygons.flatMap((p) =>
    p.outer.map(
      (point) =>
        section.inward[0] * (point[0] - section.nearEdge[0][0]) +
        section.inward[1] * (point[1] - section.nearEdge[0][1]),
    ),
  );
  return distances.length ? Math.min(...distances) : undefined;
}

const pointDistance = (p: Point, a: Point, b: Point) => {
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  const t = Math.max(
    0,
    Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)),
  );
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
};

/** Maximum sampled offset to actual mapped line segments, not road-edge accuracy. */
export function mappedRoadOffset(section: RoadSection, lines: Ring[]): number | undefined {
  if (!lines.some((line) => line.length > 1)) return undefined;
  const [a, b] = section.centreline;
  const samples: Point[] = [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b];
  return Math.max(
    ...samples.map((p) =>
      Math.min(
        ...lines.flatMap((line) => line.slice(1).map((q, i) => pointDistance(p, line[i], q))),
      ),
    ),
  );
}
