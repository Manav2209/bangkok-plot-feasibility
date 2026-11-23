import type { Point } from '@bangkok/domain';
import { SAMPLE_METRIC, toGeographic, toMetric } from '@bangkok/geometry';

// Real OSM centreline geometry supplies orientation only, not a legal ROW width.
// Keep the entire 60 m frontage on this straight segment, 25 m before its bend.
export const demoRoad = {
  sourceId: 'way/156501119',
  sourceUrl: 'https://www.openstreetmap.org/way/156501119',
  segment: [
    [100.6077787, 13.6967706],
    [100.6098206, 13.6976619],
  ] as [Point, Point],
  assumedWidthM: 8,
};
const a = toMetric(demoRoad.segment[0]),
  b = toMetric(demoRoad.segment[1]);
const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
const along: Point = [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
const inward: Point = [-along[1], along[0]];
export const DEMO_PLOT = SAMPLE_METRIC.map(([x, y]) =>
  toGeographic([
    b[0] + along[0] * (x - 85) + inward[0] * (y + demoRoad.assumedWidthM / 2),
    b[1] + along[1] * (x - 85) + inward[1] * (y + demoRoad.assumedWidthM / 2),
  ]),
);
