import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const raw = await readFile('apps/web/public/data/context.geojson', 'utf8');
const data = JSON.parse(raw);
const manifest = JSON.parse(await readFile('apps/web/public/data/context-manifest.json', 'utf8'));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
assert(
  data.type === 'FeatureCollection' && Array.isArray(data.features),
  'Expected a GeoJSON feature collection',
);
assert(
  createHash('sha256').update(raw).digest('hex') === manifest.sha256,
  'Dataset hash differs from manifest',
);
assert(
  manifest.license.name.includes('Open Database License'),
  'Dataset must preserve ODbL notice',
);
const ids = new Set();
const sourceIds = new Set(manifest.sourceIds);
const [west, south, east, north] = manifest.bbox;
const counts = { building: 0, road: 0, waterway: 0 };
let vertices = 0;
function point(p) {
  assert(
    Array.isArray(p) && p.length === 2 && p.every(Number.isFinite),
    'Nonfinite geographic coordinate',
  );
  assert(p[0] >= -180 && p[0] <= 180 && p[1] >= -90 && p[1] <= 90, 'Invalid geographic coordinate');
  vertices++;
}
function ring(r) {
  assert(r.length >= 4, 'Building ring too short');
  r.forEach(point);
  assert(r[0][0] === r.at(-1)[0] && r[0][1] === r.at(-1)[1], 'Building ring is not closed');
  const twiceArea = r.slice(1).reduce((sum, p, i) => sum + r[i][0] * p[1] - p[0] * r[i][1], 0);
  assert(Math.abs(twiceArea) > 1e-14, 'Building ring has zero area');
}
for (const feature of data.features) {
  const p = feature.properties;
  assert(feature.type === 'Feature' && !ids.has(feature.id), 'Invalid or duplicate feature ID');
  ids.add(feature.id);
  assert(
    sourceIds.has(p.sourceId) && p.sourceUrl === `https://www.openstreetmap.org/${p.sourceId}`,
    'Missing original source reference',
  );
  assert(p.osmTags && typeof p.osmTags === 'object', 'Original OSM tags are required');
  assert(Object.hasOwn(counts, p.kind), 'Unexpected feature kind');
  counts[p.kind]++;
  if (p.kind === 'building') {
    assert(Number.isFinite(p.heightM) && p.heightM > 0, 'Invalid context height');
    assert(
      ['tag', 'levels', 'fallback'].includes(p.heightSource) && p.heightLabel,
      'Missing height provenance',
    );
    assert(
      p.surveyedHeightVerified === false && p.heightEstimated === true,
      'Context height must not claim surveying',
    );
    const polygons =
      feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates]
        : feature.geometry.type === 'MultiPolygon'
          ? feature.geometry.coordinates
          : [];
    assert(polygons.length > 0, 'Building needs polygon geometry');
    polygons.forEach((polygon) => polygon.forEach(ring));
  } else {
    assert(
      feature.geometry.type === 'LineString' && feature.geometry.coordinates.length >= 2,
      'Road/waterway needs line geometry',
    );
    feature.geometry.coordinates.forEach((p) => {
      point(p);
      assert(
        p[0] >= west - 1e-10 &&
          p[0] <= east + 1e-10 &&
          p[1] >= south - 1e-10 &&
          p[1] <= north + 1e-10,
        'Context line exceeds extraction extent',
      );
    });
    assert(p.legallyRelevantWidthVerified === false, 'OSM width cannot certify legal right-of-way');
  }
}
assert(counts.building > 0 && counts.road > 0, 'No real buildings/roads in extract');
for (const kind of Object.keys(counts))
  assert(counts[kind] === manifest.counts[kind], `${kind} count mismatch`);
console.log(
  JSON.stringify({
    valid: true,
    features: data.features.length,
    counts,
    vertices,
    sha256: manifest.sha256,
    retrievedAt: manifest.retrievedAt,
  }),
);
