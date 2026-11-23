import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { defaultScenario } from '../../apps/web/src/scenario';
import { toGeographic } from '../../packages/geometry/src/index';

test('records production network, interaction, stress, camera and idle evidence', async ({
  page,
}) => {
  test.skip(
    process.env.PLAYWRIGHT_MEASURE !== '1',
    'Run explicitly against a production build for performance evidence.',
  );
  test.setTimeout(120000);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: 10000000 / 8,
    uploadThroughput: 5000000 / 8,
    latency: 40,
  });
  const started = performance.now();
  await page.goto('/?measure=1');
  await expect(page.getByRole('button', { name: 'Draw a plot', exact: true })).toBeEnabled();
  await expect(page.getByTestId('zone-status')).toContainText('inside');
  await expect(page.getByTestId('gross-area')).not.toHaveText('—');
  await expect(page.locator('.results-panel')).toHaveAttribute('aria-busy', 'false');
  const initialUsableMs = performance.now() - started;
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: -1,
    uploadThroughput: -1,
    latency: 0,
  });
  const edits = [];
  const driverEdits = [];
  for (const floors of [3, 4, 5, 6]) {
    const previous = await page.evaluate(
      () => performance.getEntriesByName('plot-edit-to-render').length,
    );
    const start = performance.now();
    await page.getByLabel('Floors', { exact: true }).fill(String(floors));
    await expect(page.locator('.results-panel')).toHaveAttribute('aria-busy', 'false');
    await expect(page.getByTestId('floor-count')).toHaveText(String(floors));
    await expect
      .poll(() => page.evaluate(() => performance.getEntriesByName('plot-edit-to-render').length))
      .toBeGreaterThan(previous);
    edits.push(
      await page.evaluate(
        () => performance.getEntriesByName('plot-edit-to-render').at(-1)!.duration,
      ),
    );
    driverEdits.push(performance.now() - start);
  }
  await page.getByText('Boundary coordinates · keyboard editing', { exact: true }).click();
  const vertex = page.getByLabel('Vertex 1 longitude', { exact: true });
  const originalLongitude = Number(await vertex.inputValue());
  const previousBoundary = await page.evaluate(
    () => performance.getEntriesByName('plot-edit-to-render').length,
  );
  const boundaryDriverStart = performance.now();
  await vertex.fill(String(originalLongitude + 0.000001));
  await expect
    .poll(() => page.evaluate(() => performance.getEntriesByName('plot-edit-to-render').length))
    .toBeGreaterThan(previousBoundary);
  const boundaryDriverMs = performance.now() - boundaryDriverStart;
  const boundaryEditMs = await page.evaluate(
    () => performance.getEntriesByName('plot-edit-to-render').at(-1)!.duration,
  );
  await page.getByRole('button', { name: '3D', exact: true }).click();
  await page.waitForTimeout(1000);
  const renderer = await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('.maplibregl-canvas');
    const gl = canvas?.getContext('webgl2');
    if (!gl) return 'unavailable';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext
      ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
      : String(gl.getParameter(gl.RENDERER));
  });
  const frameStart = await page.evaluate(() => performance.now());
  await page.getByRole('button', { name: 'Fit plot in view', exact: true }).click();
  await page.waitForTimeout(800);
  const frames = await page.evaluate(
    (start) =>
      performance
        .getEntriesByName('plot-map-render')
        .filter((e) => e.startTime >= start)
        .map((e) => e.startTime),
    frameStart,
  );
  const frameRate =
    frames.length > 1 ? ((frames.length - 1) * 1000) / (frames.at(-1)! - frames[0]) : 0;
  await page.waitForTimeout(700);
  const idleBefore = await page.evaluate(
    () => performance.getEntriesByName('plot-map-render').length,
  );
  await page.waitForTimeout(500);
  const idleFrames =
    (await page.evaluate(() => performance.getEntriesByName('plot-map-render').length)) -
    idleBefore;
  const stress = defaultScenario();
  stress.plot = Array.from({ length: 100 }, (_, i) =>
    toGeographic([
      -60 + Math.cos((i / 100) * Math.PI * 2) * 20,
      -5 + Math.sin((i / 100) * Math.PI * 2) * 20,
    ]),
  );
  stress.roads = [];
  stress.frontage = [];
  const url = new URL(page.url());
  url.hash = new URLSearchParams({ scenario: JSON.stringify(stress) }).toString();
  await page.goto(url.toString());
  const stressStart = performance.now();
  await page.reload();
  await expect(page.getByTestId('zone-status')).toContainText('inside');
  await expect(page.getByTestId('gross-area')).not.toHaveText('—');
  await expect(page.locator('.results-panel')).toHaveAttribute('aria-busy', 'false');
  const stressReloadMs = performance.now() - stressStart;
  const stressEditStart = performance.now();
  const previousStress = await page.evaluate(
    () => performance.getEntriesByName('plot-edit-to-render').length,
  );
  await page.getByLabel('Floors', { exact: true }).fill('4');
  await expect(page.getByTestId('floor-count')).toHaveText('4');
  await expect(page.locator('.results-panel')).toHaveAttribute('aria-busy', 'false');
  await expect
    .poll(() => page.evaluate(() => performance.getEntriesByName('plot-edit-to-render').length))
    .toBeGreaterThan(previousStress);
  const stressEditDriverMs = performance.now() - stressEditStart;
  const stressEditMs = await page.evaluate(
    () => performance.getEntriesByName('plot-edit-to-render').at(-1)!.duration,
  );
  await page.getByText('Boundary coordinates · keyboard editing', { exact: true }).click();
  const stressVertex = page.getByLabel('Vertex 31 longitude', { exact: true });
  const stressLongitude = Number(await stressVertex.inputValue());
  const previousStressBoundary = await page.evaluate(
    () => performance.getEntriesByName('plot-edit-to-render').length,
  );
  const stressBoundaryDriverStart = performance.now();
  await stressVertex.fill(String(stressLongitude + 0.000001));
  await expect
    .poll(() => page.evaluate(() => performance.getEntriesByName('plot-edit-to-render').length))
    .toBeGreaterThan(previousStressBoundary);
  const stressBoundaryDriverMs = performance.now() - stressBoundaryDriverStart;
  const stressBoundaryEditMs = await page.evaluate(
    () => performance.getEntriesByName('plot-edit-to-render').at(-1)!.duration,
  );
  const software = /swiftshader|llvmpipe|software|basic render/i.test(renderer);
  const report = {
    measuredAt: new Date().toISOString(),
    viewport: page.viewportSize(),
    browser: await page.context().browser()?.version(),
    renderer,
    softwareRendering: software,
    network: { downloadMbps: 10, uploadMbps: 5, latencyMs: 40, coldBrowserContext: true },
    initialUsableMs,
    completedEditMs: edits,
    completedEditDriverMs: driverEdits,
    boundaryEdit: {
      vertices: 6,
      completedEditMs: boundaryEditMs,
      driverElapsedMs: boundaryDriverMs,
    },
    stress: {
      vertices: 100,
      reloadMs: stressReloadMs,
      completedEditMs: stressEditMs,
      driverElapsedMs: stressEditDriverMs,
      boundaryEditMs: stressBoundaryEditMs,
      boundaryEditDriverMs: stressBoundaryDriverMs,
    },
    cameraFit: {
      renderedFrames: frames.length,
      spanMs: frames.length > 1 ? frames.at(-1)! - frames[0] : 0,
      fps: frameRate,
      scope:
        'One 500 ms camera-fit transition, actual MapLibre render events; not a sustained hardware certification.',
    },
    idle: { windowMs: 500, renderedFrames: idleFrames },
    targets: {
      initialUnder5s: initialUsableMs < 5000,
      ordinaryEditUnder500ms: edits.every((ms) => ms < 500),
      stressEditUnder500ms: stressEditMs < 500,
      ordinaryBoundaryEditUnder500ms: boundaryEditMs < 500,
      stressBoundaryEditUnder500ms: stressBoundaryEditMs < 500,
      cameraHardware30fps: software ? 'unverified (software renderer)' : frameRate >= 30,
      idleNoRepaint: idleFrames === 0,
    },
    limits:
      'completedEditMs measures the input handler to a MapLibre rendered frame whose proposal geometry carries the current calculation revision. Driver/action/polling elapsed times are retained separately. The stress reload includes document/assets/data. Camera evidence is a short transition; hardware target remains unverified for a software renderer.',
  };
  await mkdir('docs/performance', { recursive: true });
  await writeFile(
    'docs/performance/browser-benchmark.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report, null, 2));
});
