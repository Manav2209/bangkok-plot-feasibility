import type { Point, Ring } from '@bangkok/domain';
import { toGeographic, toMetric } from '@bangkok/geometry';
import type { ContextCollection } from './useSiteData';

export interface MappedRoad {
  id: string;
  name: string;
  kind: string;
  sourceUrl: string;
  point: Point;
  distanceM: number;
  widthM?: number;
}
const distanceToSegment = (p: Point, a: Point, b: Point) => {
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  const t = Math.max(
    0,
    Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)),
  );
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
};
const cross = (a: Point, b: Point, c: Point) =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
function segmentDistance(a: Point, b: Point, c: Point, d: Point) {
  const on = (p: Point, q: Point, r: Point) =>
    Math.abs(cross(q, r, p)) < 1e-8 && distanceToSegment(p, q, r) < 1e-8;
  if (
    (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) ||
    on(a, c, d) ||
    on(b, c, d) ||
    on(c, a, b) ||
    on(d, a, b)
  )
    return 0;
  return Math.min(
    distanceToSegment(a, c, d),
    distanceToSegment(b, c, d),
    distanceToSegment(c, a, b),
    distanceToSegment(d, a, b),
  );
}

/** Distance to mapped centrelines, never a legal boundary/access determination. */
export function nearbyRoads(
  context: ContextCollection | null,
  plot: Ring,
  limit = 6,
): MappedRoad[] {
  if (context?.type !== 'FeatureCollection' || plot.length < 3) return [];
  const metric = plot.map(toMetric);
  const centre: Point = [
    metric.reduce((s, p) => s + p[0], 0) / metric.length,
    metric.reduce((s, p) => s + p[1], 0) / metric.length,
  ];
  const roads = new Map<string, MappedRoad>();
  for (const f of context.features) {
    if (
      f.properties?.kind !== 'road' ||
      f.geometry?.type !== 'LineString' ||
      f.geometry.coordinates.length < 2
    )
      continue;
    const p = f.properties;
    const coordinates = f.geometry.coordinates as Ring;
    const line = coordinates.map(toMetric);
    let anchor = line[0],
      anchorDistance = Infinity;
    for (let j = 1; j < line.length; j++) {
      const a = line[j - 1],
        b = line[j],
        dx = b[0] - a[0],
        dy = b[1] - a[1];
      const t = Math.max(
        0,
        Math.min(1, ((centre[0] - a[0]) * dx + (centre[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)),
      );
      const candidate: Point = [a[0] + t * dx, a[1] + t * dy],
        distance = Math.hypot(candidate[0] - centre[0], candidate[1] - centre[1]);
      if (distance < anchorDistance) {
        anchor = candidate;
        anchorDistance = distance;
      }
    }
    let distanceM = Infinity;
    for (let j = 1; j < line.length; j++)
      for (let i = 0; i < metric.length; i++) {
        distanceM = Math.min(
          distanceM,
          segmentDistance(metric[i], metric[(i + 1) % metric.length], line[j - 1], line[j]),
        );
      }
    const id = String(p.sourceId || f.id);
    const previous = roads.get(id);
    if (previous && previous.distanceM <= distanceM) continue;
    const kind = String(p.highway || 'road').replaceAll('_', ' ');
    roads.set(id, {
      id,
      name: String(p.name || `Unnamed ${kind}`),
      kind,
      sourceUrl: String(p.sourceUrl || 'https://www.openstreetmap.org/copyright'),
      point: toGeographic(anchor),
      distanceM,
      ...(typeof p.widthM === 'number' && Number.isFinite(p.widthM) && p.widthM > 0
        ? { widthM: p.widthM }
        : {}),
    });
  }
  return [...roads.values()]
    .sort((a, b) => a.distanceM - b.distanceM || a.id.localeCompare(b.id))
    .slice(0, limit);
}
