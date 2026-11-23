/** One-time OpenStreetMap extract. Runtime rendering uses committed GeoJSON, never Overpass. */
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const center = [100.6103, 13.6979];
// Approximately 1.0 km east-west by 1.0 km north-south at the research origin.
const bbox = [100.60567, 13.69338, 100.61493, 13.70242]; // W,S,E,N
const output = resolve('apps/web/public/data');
const endpoints = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const query = `[out:json][timeout:60];(way["building"](${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]});relation["building"]["type"="multipolygon"](${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]});way["highway"](${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]});way["waterway"](${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]}););out meta geom;`;

let raw;
let endpoint;
for (const candidate of endpoints) {
  try {
    const response = await fetch(candidate, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'BangkokPlotFeasibilityResearch/1.0 (one-time bounded OSM extract)',
      },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(85_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    raw = await response.json();
    if (raw.remark || !Array.isArray(raw.elements))
      throw new Error(raw.remark ?? 'Missing elements');
    endpoint = candidate;
    break;
  } catch (error) {
    console.error(`${candidate}: ${error.message}`);
  }
}
if (!raw)
  throw new Error(
    'No Overpass endpoint returned a complete extract. Existing data was not modified.',
  );

const same = (a, b) => Math.abs(a[0] - b[0]) < 1e-10 && Math.abs(a[1] - b[1]) < 1e-10;
const coords = (geometry) =>
  (geometry ?? [])
    .filter((p) => Number.isFinite(p?.lon) && Number.isFinite(p?.lat))
    .map((p) => [p.lon, p.lat]);
function numeric(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^[0-9]+(?:\.[0-9]+)?(?:\s*m)?$/.test(trimmed)) return null;
  const number = Number(trimmed.replace(/\s*m$/, ''));
  return Number.isFinite(number) && number > 0 ? number : null;
}
function pointInRing(point, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (
      a[1] > point[1] !== b[1] > point[1] &&
      point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}
function joinRings(parts) {
  const pending = parts.map((part) => [...part]).filter((part) => part.length >= 2);
  const rings = [];
  while (pending.length) {
    const ring = pending.shift();
    for (let found = true; !same(ring[0], ring.at(-1)) && found; ) {
      found = false;
      for (let i = 0; i < pending.length; i++) {
        let part = pending[i];
        if (same(ring.at(-1), part.at(-1))) part = [...part].reverse();
        if (same(ring.at(-1), part[0])) {
          ring.push(...part.slice(1));
          pending.splice(i, 1);
          found = true;
          break;
        }
      }
    }
    if (ring.length >= 4 && same(ring[0], ring.at(-1))) rings.push(ring);
    else
      throw new Error(
        'An incomplete multipolygon ring was returned; refusing to fabricate closure.',
      );
  }
  return rings;
}
function clipSegment(a, b) {
  let from = 0,
    to = 1;
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  for (const [p, q] of [
    [-dx, a[0] - bbox[0]],
    [dx, bbox[2] - a[0]],
    [-dy, a[1] - bbox[1]],
    [dy, bbox[3] - a[1]],
  ]) {
    if (p === 0 && q < 0) return null;
    if (p === 0) continue;
    const r = q / p;
    if (p < 0) from = Math.max(from, r);
    else to = Math.min(to, r);
    if (from > to) return null;
  }
  return [
    [a[0] + from * dx, a[1] + from * dy],
    [a[0] + to * dx, a[1] + to * dy],
  ];
}
function clippedLines(line) {
  const parts = [];
  for (let i = 1; i < line.length; i++) {
    const segment = clipSegment(line[i - 1], line[i]);
    if (!segment || same(segment[0], segment[1])) continue;
    const last = parts.at(-1);
    if (last && same(last.at(-1), segment[0])) last.push(segment[1]);
    else parts.push(segment);
  }
  return parts;
}
const features = [];
const skipped = [];
const sourceIds = new Set();
const relationMembers = new Set(
  raw.elements
    .filter((el) => el.type === 'relation' && el.tags?.building)
    .flatMap(
      (el) =>
        el.members?.filter((member) => member.type === 'way').map((member) => member.ref) ?? [],
    ),
);
for (const element of raw.elements) {
  const tags = element.tags ?? {};
  const sourceId = `${element.type}/${element.id}`;
  const base = {
    source: 'OpenStreetMap',
    sourceId,
    sourceUrl: `https://www.openstreetmap.org/${sourceId}`,
    sourceVersion: element.version ?? null,
    sourceTimestamp: element.timestamp ?? null,
    name: tags['name:en'] ?? tags.name ?? null,
    osmTags: tags,
  };
  if (tags.building && tags.building !== 'no') {
    if (element.type === 'way' && relationMembers.has(element.id)) continue;
    let geometry;
    if (element.type === 'way') {
      const ring = coords(element.geometry);
      if (ring.length < 4 || !same(ring[0], ring.at(-1))) {
        skipped.push({ sourceId, reason: 'Unclosed/incomplete building geometry' });
        continue;
      }
      geometry = { type: 'Polygon', coordinates: [ring] };
    } else {
      try {
        const outer = joinRings(
          element.members
            .filter(
              (member) => member.type === 'way' && (member.role === 'outer' || member.role === ''),
            )
            .map((member) => coords(member.geometry)),
        );
        const inner = joinRings(
          element.members
            .filter((member) => member.type === 'way' && member.role === 'inner')
            .map((member) => coords(member.geometry)),
        );
        if (!outer.length) throw new Error('No complete outer rings');
        geometry = {
          type: 'MultiPolygon',
          coordinates: outer.map((ring) => [
            ring,
            ...inner.filter((hole) => pointInRing(hole[0], ring)),
          ]),
        };
        if (inner.some((hole) => !outer.some((ring) => pointInRing(hole[0], ring))))
          throw new Error('Unassigned inner ring');
      } catch (error) {
        skipped.push({ sourceId, reason: error.message });
        continue;
      }
    }
    const taggedHeight = numeric(tags.height);
    const levels = numeric(tags['building:levels']);
    const heightM = taggedHeight ?? (levels ? levels * 3.2 : 9.6);
    const heightSource = taggedHeight ? 'tag' : levels ? 'levels' : 'fallback';
    const heightLabel = taggedHeight
      ? 'OSM height tag; not surveyed by this tool'
      : levels
        ? 'Estimated from OSM levels at 3.2 m/level'
        : 'Estimated fallback: 9.6 m; height unknown';
    features.push({
      type: 'Feature',
      id: sourceId,
      properties: {
        ...base,
        kind: 'building',
        heightM,
        heightSource,
        heightLabel,
        heightEstimated: true,
        surveyedHeightVerified: false,
      },
      geometry,
    });
    sourceIds.add(sourceId);
  }
  if (element.type === 'way' && (tags.highway || tags.waterway)) {
    const kind = tags.highway ? 'road' : 'waterway';
    for (const [index, line] of clippedLines(coords(element.geometry)).entries()) {
      const widthM = numeric(tags.width);
      features.push({
        type: 'Feature',
        id: `${sourceId}:${kind}:${index}`,
        properties: {
          ...base,
          kind,
          highway: tags.highway ?? null,
          waterway: tags.waterway ?? null,
          widthM,
          widthProvenance: widthM ? 'tag' : 'unknown',
          legallyRelevantWidthVerified: false,
        },
        geometry: { type: 'LineString', coordinates: line },
      });
      sourceIds.add(sourceId);
    }
  }
}
features.sort((a, b) => a.id.localeCompare(b.id));
const counts = Object.fromEntries(
  ['building', 'road', 'waterway'].map((kind) => [
    kind,
    features.filter((feature) => feature.properties.kind === kind).length,
  ]),
);
if (counts.building < 1 || counts.road < 1)
  throw new Error(
    `Insufficient real data: ${JSON.stringify(counts)}. Existing data was not modified.`,
  );
const geojson = `${JSON.stringify({ type: 'FeatureCollection', features })}\n`;
const retrievedAt = new Date().toISOString();
const manifest = {
  version: 1,
  dataset: 'OpenStreetMap bounded context extract',
  center,
  bbox,
  coordinateSystem: 'EPSG:4326; coordinates [longitude, latitude]',
  retrievedAt,
  osmBaseTimestamp: raw.osm3s?.timestamp_osm_base ?? null,
  endpoint,
  query,
  license: {
    name: 'Open Database License 1.0 (ODbL)',
    url: 'https://opendatacommons.org/licenses/odbl/1-0/',
    attribution: '© OpenStreetMap contributors',
    attributionUrl: 'https://www.openstreetmap.org/copyright',
    shareAlike: true,
  },
  counts,
  buildingHeightSources: Object.fromEntries(
    ['tag', 'levels', 'fallback'].map((source) => [
      source,
      features.filter(
        (feature) =>
          feature.properties.kind === 'building' && feature.properties.heightSource === source,
      ).length,
    ]),
  ),
  sourceIds: [...sourceIds].sort(),
  skipped,
  edits: [
    'Converted source WGS84 geometry to GeoJSON.',
    'Retained all original OSM tags, source IDs, source timestamps and versions.',
    'Assembled multipolygon member rings and assigned holes; no invented closure.',
    'Omitted duplicate standalone building ways represented by a building relation.',
    'Clipped road/waterway lines to the requested bounding box; retained complete intersecting building footprints.',
    'Derived context-only heights from height tags, otherwise levels × 3.2 m, otherwise a labelled 9.6 m fallback.',
  ],
  assumptions: {
    floorHeightM: 3.2,
    fallbackHeightM: 9.6,
    taggedHeightMeansSurveyed: false,
    legalRoadWidthInferredFromLanes: false,
  },
  limitations: [
    'This is mapped context, not a cadastral survey or a completeness guarantee.',
    'Missing buildings do not prove vacant land.',
    'Context heights never feed compliance.',
    'OSM width is not verified legal right-of-way.',
    'The illustrative default site has not been verified vacant.',
    'Complete building footprints may extend slightly outside the extraction bbox.',
  ],
  sha256: createHash('sha256').update(geojson).digest('hex'),
  reproduction: 'node scripts/extract-context.mjs (requires network; run from the workspace root)',
};
await mkdir(output, { recursive: true });
await writeFile(resolve(output, 'context.geojson'), geojson);
await writeFile(resolve(output, 'context-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  JSON.stringify({
    output,
    counts,
    skipped: skipped.length,
    retrievedAt,
    osmBaseTimestamp: manifest.osmBaseTimestamp,
    sha256: manifest.sha256,
  }),
);
