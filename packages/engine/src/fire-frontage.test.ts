import { describe, expect, it } from 'vitest';
import type { MultiPolygon, Ring, SiteInput } from '@bangkok/domain';
import { toGeographic } from '@bangkok/geometry';
import { screenFireFrontage } from './fire-frontage';
const input = (): SiteInput => ({
  revision: 1,
  use: 'office',
  geographicPlot: (
    [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ] as Ring
  ).map(toGeographic),
  assumptions: { setbackM: 3, floors: 4, floorHeightM: 3.2 },
  frontage: [{ edgeIndex: 0, roadId: 'r' }],
  roads: [
    {
      id: 'r',
      name: 'Synthetic road',
      geometry: [],
      widthM: 8,
      widthProvenance: 'user',
      confirmed: true,
    },
  ],
});
const shape = (width = 13, depth = 37, y = 10): MultiPolygon => [
  {
    outer: [
      [10, y],
      [10 + width, y],
      [10 + width, y + depth],
      [10, y + depth],
    ],
    holes: [],
  },
];
describe('source-specific building frontage proxy', () => {
  it('does not substitute a long plot frontage for the building facade', () => {
    const result = screenFireFrontage(input(), shape(12.5, 37.5), 4);
    expect(result.actual).toBeCloseTo(12.5, 5);
    expect(result.required).toBe(12.5);
    expect(result.status).toBe('unknown');
    expect(result.explanation).toContain('12 m clear space');
  });
  it('uses strictly greater than P/8 but permits distance20m equality', () => {
    const result = screenFireFrontage(input(), shape(13, 37, 20), 4);
    expect(result.status).toBe('pass');
    expect(result.scope).toBe('assumption');
    expect(screenFireFrontage(input(), shape(13, 37, 20.01), 4).status).toBe('unknown');
  });
  it('never establishes the frontage proxy from an unconfirmed road', () => {
    const site = input();
    site.roads![0].confirmed = false;
    expect(screenFireFrontage(site, shape(), 4).status).toBe('unknown');
  });
  it('keeps the residential low-floor exception scoped to this particular clause', () => {
    const site = input();
    site.use = 'condominium';
    site.frontage = [];
    expect(screenFireFrontage(site, shape(), 3).status).toBe('not-applicable');
    expect(screenFireFrontage(site, shape(), 4).status).toBe('unknown');
    expect(screenFireFrontage(site, shape(), 4).explanation).toContain('12 m clear space');
  });
  it('reports the six-metre non-fronting branch for applicable lower offices', () => {
    const site = input();
    site.frontage = [];
    expect(screenFireFrontage(site, shape(), 3).explanation).toContain('6 m clear space');
  });
});
