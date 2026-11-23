import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const raw = await readFile('apps/web/public/data/zone.geojson');
const data = JSON.parse(raw.toString('utf8'));
const manifest = JSON.parse(await readFile('apps/web/public/data/zone-manifest.json', 'utf8'));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
assert(
  createHash('sha256').update(raw).digest('hex') === manifest.file.sha256,
  'Zone hash differs from provenance.',
);
assert(raw.length === manifest.file.byteLength, 'Zone byte count differs from provenance.');
assert(
  data.type === 'FeatureCollection' && data.features.length === 1,
  'Expected one sourced zone.',
);
assert(
  data.features[0].geometry.type === 'Polygon',
  'Expected the original polygon, not a bounding box.',
);
const rings = data.features[0].geometry.coordinates;
for (const ring of rings) {
  assert(ring.length >= 4, 'Invalid zone ring.');
  for (const p of ring)
    assert(
      p.length === 2 && p.every(Number.isFinite) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90,
      'Invalid geographic coordinate.',
    );
  assert(ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1], 'Unclosed zone ring.');
}
assert(
  rings[0].length === manifest.file.outerRingVertices,
  'Zone geometry was simplified without updating provenance.',
);
assert(manifest.licence.status === 'not-specified', 'Do not invent a zone redistribution licence.');
assert(manifest.accuracy.positionalAccuracyM === null, 'Do not invent survey accuracy.');
console.log(
  `Validated official Y.7-21: ${rings[0].length} ring coordinates including closure; provenance hash and byte count agree. Licence and survey accuracy remain unspecified.`,
);
