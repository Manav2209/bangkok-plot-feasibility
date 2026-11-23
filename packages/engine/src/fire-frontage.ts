import type { CheckResult, MultiPolygon, Point, SiteInput } from '@bangkok/domain';
import { signedArea, toMetric } from '@bangkok/geometry';
import { referenceValue as v } from '@bangkok/rules';

/** Clause53 geometry proxy only: a plot edge alone is not a building facade. */
export function screenFireFrontage(
  input: SiteInput,
  covered: MultiPolygon,
  levels: number,
): CheckResult {
  const perimeter = covered.reduce(
    (sum, p) =>
      sum +
      p.outer.reduce((s, a, i) => {
        const b = p.outer[(i + 1) % p.outer.length];
        return s + Math.hypot(b[0] - a[0], b[1] - a[1]);
      }, 0),
    0,
  );
  const minimum = perimeter * v('publicFrontPerimeterFraction');
  let longest = 0,
    hasStudyRoad = false;
  for (const frontage of input.frontage ?? []) {
    const road = input.roads?.find((r) => r.id === frontage.roadId);
    const geographicA = input.geographicPlot[frontage.edgeIndex],
      geographicB = input.geographicPlot[(frontage.edgeIndex + 1) % input.geographicPlot.length];
    if (!road?.confirmed || !road.widthM || !geographicA || !geographicB) continue;
    hasStudyRoad = true;
    const a = toMetric(geographicA),
      b = toMetric(geographicB),
      length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!length) continue;
    const along: Point = [(b[0] - a[0]) / length, (b[1] - a[1]) / length];
    const projection = (p: Point) => (p[0] - a[0]) * along[0] + (p[1] - a[1]) * along[1];
    const distance = (p: Point) => Math.abs((p[0] - a[0]) * along[1] - (p[1] - a[1]) * along[0]);
    const intervals: [number, number][] = [];
    for (const polygon of covered) {
      const sign = Math.sign(signedArea(polygon.outer));
      polygon.outer.forEach((p, i) => {
        const q = polygon.outer[(i + 1) % polygon.outer.length],
          dx = q[0] - p[0],
          dy = q[1] - p[1],
          edgeLength = Math.hypot(dx, dy);
        if (!edgeLength || Math.abs(dx * along[1] - dy * along[0]) > 1e-6 * edgeLength) return;
        const middle: Point = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        const nearest = Math.max(0, Math.min(length, projection(middle)));
        const toward: Point = [
          a[0] + nearest * along[0] - middle[0],
          a[1] + nearest * along[1] - middle[1],
        ];
        if ((dy * toward[0] - dx * toward[1]) * sign <= 0) return;
        if (Math.max(distance(p), distance(q)) > v('publicFrontDistance') + 1e-7) return;
        const start = Math.max(0, Math.min(projection(p), projection(q))),
          end = Math.min(length, Math.max(projection(p), projection(q)));
        if (end > start) intervals.push([start, end]);
      });
    }
    intervals.sort((x, y) => x[0] - y[0]);
    let start = 0,
      end = -1;
    for (const interval of intervals) {
      if (interval[0] > end + 0.001) {
        start = interval[0];
        end = interval[1];
      } else end = Math.max(end, interval[1]);
      longest = Math.max(longest, end - start);
    }
  }
  const exempt = input.use === 'condominium' && levels <= v('nonFrontFloorTier');
  const matches = longest > minimum + 1e-7;
  const width =
    levels > v('nonFrontFloorTier') ? v('nonFrontHighOpenWidth') : v('nonFrontLowOpenWidth');
  return {
    id: 'model-fire-frontage',
    title: 'Reference public-front geometry',
    scope: 'assumption',
    status: exempt ? 'not-applicable' : hasStudyRoad && matches ? 'pass' : 'unknown',
    actual: hasStudyRoad ? longest : undefined,
    required: minimum,
    unit: 'm, strictly greater than',
    sourceIds: ['bma-building-2544'],
    explanation: exempt
      ? 'The residential-at-most-three-floors exception applies to this specific reference clause52(6) screen only; it does not waive other fire requirements.'
      : `Reference clauses52(6)/53: continuous building facade must exceed one eighth of the external BUILDING perimeter (${perimeter.toFixed(2)} m) and lie within ${v('publicFrontDistance')} m of the assumed public way. Selected plot frontage is not counted as building facade. ${matches && hasStudyRoad ? 'This geometric proxy fits the assumed road; public-way status and lawful access are unverified.' : `The public-front proxy is not established. The non-fronting alternative needs ${width} m clear space over at least ${(perimeter * v('nonFrontOpenLengthFraction')).toFixed(2)} m continuous length, a ${v('nonFrontAccessWidth')} m internal access route and, for an under-building passage, ${v('nonFrontPassageHeight')} m clear height. Those paths are not verified.`}`,
  };
}
