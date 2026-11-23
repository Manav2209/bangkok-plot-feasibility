import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import type { MultiPolygon, Point } from '@bangkok/domain';
import { area, axisAlignedRectangleInside, difference } from './index';

const uShape: MultiPolygon = [
  {
    outer: [
      [0, 0],
      [30, 0],
      [30, 30],
      [20, 30],
      [20, 10],
      [10, 10],
      [10, 30],
      [0, 30],
    ],
    holes: [],
  },
];
const rectangle = (x: number, y: number, w: number, h: number): MultiPolygon => [
  {
    outer: [
      [x - w / 2, y - h / 2],
      [x + w / 2, y - h / 2],
      [x + w / 2, y + h / 2],
      [x - w / 2, y + h / 2],
    ],
    holes: [],
  },
];

describe('rectangle boundary containment', () => {
  it('rejects a notch crossing a rectangle whose four corners are inside', () => {
    expect(axisAlignedRectangleInside([15, 20], 24, 4, uShape)).toBe(false);
  });
  it('permits shared boundary edges and corners', () => {
    expect(axisAlignedRectangleInside([15, 5], 30, 10, uShape)).toBe(true);
  });
  it('rejects a hole wholly inside the rectangle', () => {
    const withHole = rectangle(15, 15, 30, 30);
    withHole[0].holes.push([
      [13, 13],
      [17, 13],
      [17, 17],
      [13, 17],
    ]);
    expect(axisAlignedRectangleInside([15, 15], 20, 20, withHole)).toBe(false);
    expect(axisAlignedRectangleInside([5, 5], 4, 4, withHole)).toBe(true);
  });
  it('does not bridge disconnected components', () => {
    expect(
      axisAlignedRectangleInside([15, 5], 24, 4, [
        ...rectangle(5, 5, 10, 10),
        ...rectangle(25, 5, 10, 10),
      ]),
    ).toBe(false);
  });
  it('matches independent polygon subtraction on integer-grid concave and holed cases', () => {
    const holed = rectangle(15, 15, 30, 30);
    holed[0].holes.push([
      [12, 12],
      [18, 12],
      [18, 18],
      [12, 18],
    ]);
    fc.assert(
      fc.property(
        fc.integer({ min: -5, max: 35 }),
        fc.integer({ min: -5, max: 35 }),
        fc.integer({ min: 1, max: 30 }),
        fc.integer({ min: 1, max: 30 }),
        (x, y, w, h) => {
          for (const region of [uShape, holed]) {
            const fits = area(difference(rectangle(x, y, w, h), region)) < 1e-6;
            expect(axisAlignedRectangleInside([x, y] as Point, w, h, region)).toBe(fits);
            const reversed = region.map((p) => ({
              outer: [...p.outer].reverse(),
              holes: p.holes.map((h) => [...h].reverse()),
            }));
            expect(axisAlignedRectangleInside([x, y], w, h, reversed)).toBe(fits);
          }
        },
      ),
      { seed: 260623, numRuns: 100 },
    );
  });
});
