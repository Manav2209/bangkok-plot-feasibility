import { describe, expect, it } from 'vitest';
import { area } from './index';
import { frontageClearance, mappedRoadOffset, roadSection } from './road-section';

describe('explicit near-boundary road corridor geometry', () => {
  it('places an 8 m corridor outside the plot with its centreline 4 m away', () => {
    const section = roadSection([0, 0], [60, 0], 8, 1)!;
    expect(section.centreline).toEqual([
      [0, -4],
      [60, -4],
    ]);
    expect(section.farEdge).toEqual([
      [0, -8],
      [60, -8],
    ]);
    expect(area(section.corridor)).toBe(480);
    expect(
      frontageClearance(
        [
          {
            outer: [
              [3, 3],
              [57, 3],
              [57, 20],
              [3, 20],
            ],
            holes: [],
          },
        ],
        section,
      ),
    ).toBe(3);
  });
  it('preserves the road side when winding and edge direction reverse together', () => {
    const reversed = roadSection([60, 0], [0, 0], 8, -1)!;
    expect(reversed.centreline).toEqual([
      [60, -4],
      [0, -4],
    ]);
    expect(
      frontageClearance(
        [
          {
            outer: [
              [3, 3],
              [57, 3],
              [57, 20],
            ],
            holes: [],
          },
        ],
        reversed,
      ),
    ).toBe(3);
  });
  it('reports a signed encroachment rather than an absolute positive gap', () => {
    expect(
      frontageClearance(
        [
          {
            outer: [
              [3, -1],
              [10, -1],
              [10, 4],
            ],
            holes: [],
          },
        ],
        roadSection([0, 0], [60, 0], 8, 1)!,
      ),
    ).toBe(-1);
  });
  it('detects offset and short mapped segments without claiming road accuracy', () => {
    const section = roadSection([0, 0], [60, 0], 8, 1)!;
    expect(
      mappedRoadOffset(section, [
        [
          [0, -4],
          [60, -4],
        ],
      ]),
    ).toBe(0);
    expect(
      mappedRoadOffset(section, [
        [
          [0, 0],
          [60, 0],
        ],
      ]),
    ).toBe(4);
    expect(
      mappedRoadOffset(section, [
        [
          [20, -4],
          [40, -4],
        ],
      ]),
    ).toBe(20);
    expect(mappedRoadOffset(section, [])).toBeUndefined();
  });
  it('refuses zero-length and invalid-width references', () => {
    expect(roadSection([0, 0], [0, 0], 8, 1)).toBeNull();
    expect(roadSection([0, 0], [10, 0], 0, 1)).toBeNull();
    expect(roadSection([0, 0], [10, 0], Infinity, 1)).toBeNull();
  });
});
