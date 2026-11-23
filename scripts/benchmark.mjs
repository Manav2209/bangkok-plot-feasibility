import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { createServer } = await import(pathToFileURL(require.resolve('vite')).href);
const server = await createServer({
  root: path.join(root, 'apps/web'),
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});
try {
  const { calculate } = await server.ssrLoadModule(path.join(root, 'packages/engine/src/index.ts'));
  const { SAMPLE_PLOT, toGeographic } = await server.ssrLoadModule(
    path.join(root, 'packages/geometry/src/index.ts'),
  );
  const zoneData = JSON.parse(
    await readFile(path.join(root, 'apps/web/public/data/zone.geojson'), 'utf8'),
  );
  const rings = zoneData.features[0].geometry.coordinates;
  const zone = {
    id: 'y7-21-2013',
    boundaryLonLat: [
      { outer: rings[0].slice(0, -1), holes: rings.slice(1).map((r) => r.slice(0, -1)) },
    ],
    evidence: 'verified',
    sourceUrl: 'https://cpudgiapp.bangkok.go.th',
    uncertaintyM: 1,
  };
  const ordinary = {
    revision: 1,
    geographicPlot: SAMPLE_PLOT,
    use: 'condominium',
    researchConstraints: true,
    assumptions: { setbackM: 3, floors: 6, floorHeightM: 3.2 },
    roads: [
      {
        id: 'study',
        name: 'Study frontage',
        geometry: [SAMPLE_PLOT[0], SAMPLE_PLOT[1]],
        widthM: 8,
        widthProvenance: 'user',
        confirmed: true,
      },
    ],
    frontage: [{ edgeIndex: 0, roadId: 'study' }],
    zone,
  };
  const stress = {
    ...ordinary,
    zone: undefined,
    roads: [],
    frontage: [],
    geographicPlot: Array.from({ length: 100 }, (_, i) =>
      toGeographic([
        -50 + Math.cos((i / 100) * Math.PI * 2) * 50,
        -5 + Math.sin((i / 100) * Math.PI * 2) * 50,
      ]),
    ),
  };
  const summarize = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    return {
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
      max: sorted.at(-1),
    };
  };
  const reports = [];
  for (const [name, input] of [
    ['ordinary-6-vertices', ordinary],
    ['stress-100-vertices', stress],
  ]) {
    for (let i = 0; i < 3; i++) calculate(input);
    const measurements = [];
    let last;
    for (let i = 0; i < 20; i++) {
      const started = performance.now();
      last = calculate(input);
      measurements.push({
        wall: performance.now() - started,
        envelope: last.timingMs.envelope,
        designs: last.timingMs.designs,
      });
    }
    reports.push({
      name,
      vertices: input.geographicPlot.length,
      samples: measurements.length,
      wallMs: summarize(measurements.map((x) => x.wall)),
      envelopeMs: summarize(measurements.map((x) => x.envelope)),
      designMs: summarize(measurements.map((x) => x.designs)),
      searchTrials: last.search.tested,
      designs: last.designs.map((d) => ({
        id: d.id,
        title: d.title,
        gfaM2: d.grossFloorAreaM2,
        floors: d.floors.length,
        legalCompliance: d.compliance,
      })),
    });
  }
  const context = JSON.parse(
    await readFile(path.join(root, 'apps/web/public/data/context-manifest.json'), 'utf8'),
  );
  const report = {
    measuredAt: new Date().toISOString(),
    environment: {
      platform: os.platform(),
      release: os.release(),
      cpu: os.cpus()[0]?.model,
      logicalCpus: os.cpus().length,
      node: process.version,
      mode: 'Node/Vite-loaded pure engine, no browser or GPU',
    },
    contextFeatureCounts: context.counts,
    limits:
      'Engine timings exclude worker startup, main-thread rendering and network. They are not full browser latency, initial-view or frame-rate measurements.',
    reports,
  };
  await mkdir(path.join(root, 'docs/performance'), { recursive: true });
  await writeFile(
    path.join(root, 'docs/performance/engine-benchmark.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await server.close();
}
