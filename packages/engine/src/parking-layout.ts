import type { MultiPolygon, ParkingPlan } from '@bangkok/domain';
import { area, bounds, difference, rotatePoint } from '@bangkok/geometry';
import { referenceValue as v } from '@bangkok/rules';

const rectangle = (x: number, y: number, w: number, d: number): MultiPolygon => [
  {
    outer: [
      [x, y],
      [x + w, y],
      [x + w, y + d],
      [x, y + d],
    ],
    holes: [],
  },
];
const rotated = (polygons: MultiPolygon, angle: number): MultiPolygon =>
  polygons.map((p) => ({
    outer: p.outer.map((q) => rotatePoint(q, angle)),
    holes: p.holes.map((r) => r.map((q) => rotatePoint(q, angle))),
  }));

/** Bounded perpendicular-stall packing. It does not solve ramps, swept paths or legal access. */
export function packParking(
  region: MultiPolygon,
  coreFraction: number,
  requested: number,
): Omit<ParkingPlan, 'level'> {
  const width = v('perpendicularStallWidth'),
    length = v('perpendicularStallLength'),
    aisle = v('perpendicularAisleWidth');
  const base = {
    stallWidthM: width,
    stallLengthM: length,
    aisleWidthM: aisle,
    scope: 'schematic' as const,
  };
  const cap = Math.max(0, Math.min(200, Math.floor(requested)));
  let best = {
    ...base,
    stalls: [] as MultiPolygon,
    aisles: [] as MultiPolygon,
    serviceReserve: [] as MultiPolygon,
  };
  if (!cap) return best;
  const angles = new Set<number>([0, Math.PI / 2]);
  for (const p of region) {
    let longest = 0,
      angle = 0;
    p.outer.forEach((a, i) => {
      const b = p.outer[(i + 1) % p.outer.length],
        distance = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (distance > longest) {
        longest = distance;
        angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
      }
    });
    angles.add(angle);
    angles.add(angle + Math.PI / 2);
  }
  for (const angle of [...angles].slice(0, 6)) {
    const local = rotated(region, -angle),
      stalls: MultiPolygon = [],
      aisles: MultiPolygon = [],
      serviceReserve: MultiPolygon = [];
    for (const component of local) {
      const b = bounds([component]),
        depth = b.maxY - b.minY,
        span = b.maxX - b.minX;
      if (depth < length + aisle || span < width + aisle) continue;
      const coreWidth = (area([component]) * coreFraction) / depth;
      const cross = rectangle(b.minX, b.minY, aisle, depth);
      const core = coreWidth > 0 ? rectangle(b.maxX - coreWidth, b.minY, coreWidth, depth) : [];
      const fits = (shape: MultiPolygon) => area(difference(shape, [component])) <= 0.001;
      if (!fits(cross) || (core.length && !fits(core))) continue;
      const columns = Math.floor((span - aisle - coreWidth + 1e-8) / width);
      if (!columns) continue;
      const before = stalls.length;
      for (let y = b.minY; y + length + aisle <= b.maxY + 1e-8 && stalls.length < cap; ) {
        const double = y + 2 * length + aisle <= b.maxY + 1e-8;
        const rowAisle = rectangle(b.minX, y + length, aisle + columns * width, aisle);
        if (fits(rowAisle)) {
          const rowStart = stalls.length;
          for (let c = 0; c < columns && stalls.length < cap; c++) {
            for (const rowY of double ? [y, y + length + aisle] : [y]) {
              const stall = rectangle(b.minX + aisle + c * width, rowY, width, length);
              if (stalls.length < cap && fits(stall)) stalls.push(...stall);
            }
          }
          if (stalls.length > rowStart) aisles.push(...rowAisle);
        }
        y += (double ? 2 * length : length) + aisle;
      }
      if (stalls.length > before) {
        aisles.push(...cross);
        serviceReserve.push(...core);
      }
      if (stalls.length >= cap) break;
    }
    if (stalls.length > best.stalls.length)
      best = {
        ...base,
        stalls: rotated(stalls, angle),
        aisles: rotated(aisles, angle),
        serviceReserve: rotated(serviceReserve, angle),
      };
    if (best.stalls.length === cap) break;
  }
  return best;
}
