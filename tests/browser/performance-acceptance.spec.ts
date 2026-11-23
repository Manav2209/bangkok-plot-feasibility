import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import { defaultScenario } from '../../apps/web/src/scenario';
import { toGeographic } from '../../packages/geometry/src/index';

const summary = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    samples: values.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
    max: sorted.at(-1),
  };
};

test('records repeated production edits and sustained camera interactions', async ({
  page,
  browser,
}) => {
  test.skip(
    process.env.PLAYWRIGHT_ACCEPTANCE_MEASURE !== '1',
    'Explicit production hardware performance measurement only.',
  );
  test.setTimeout(180000);
  const initialLoads: number[] = [];
  for (let index = 0; index < 3; index++) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    try {
      const coldPage = await context.newPage();
      const cdp = await context.newCDPSession(coldPage);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 10000000 / 8,
        uploadThroughput: 5000000 / 8,
        latency: 40,
      });
      const started = performance.now();
      await coldPage.goto('/?measure=1');
      await ready(coldPage);
      initialLoads.push(performance.now() - started);
    } finally {
      await context.close();
    }
  }

  const studies = [];
  for (const vertices of [6, 100]) {
    const scenario = defaultScenario();
    if (vertices === 100) {
      scenario.plot = Array.from({ length: 100 }, (_, i) =>
        toGeographic([
          -60 + Math.cos((i / 100) * Math.PI * 2) * 20,
          -5 + Math.sin((i / 100) * Math.PI * 2) * 20,
        ]),
      );
      scenario.roads = [];
      scenario.frontage = [];
    }
    await page.goto(
      `/?measure=1&study=${vertices}#${new URLSearchParams({ scenario: JSON.stringify(scenario) })}`,
    );
    await ready(page);
    await expect(
      page.getByText(`${vertices} vertices · irregular plots supported`, { exact: true }),
    ).toBeVisible();
    const parameterMs: number[] = [];
    const boundaryMs: number[] = [];
    const envelopeMs: number[] = [];
    for (let index = 0; index < 20; index++) {
      const floors = String(3 + (index % 4));
      parameterMs.push(
        await measuredEdit(page, async () => {
          await page.getByLabel('Floors', { exact: true }).fill(floors);
          await expect(page.getByTestId('floor-count')).toHaveText(floors);
        }),
      );
      const diagnostic = await page.locator('.results-panel').innerText();
      const match = diagnostic.match(/Envelope\s+([\d.]+)\s*ms/);
      if (match) envelopeMs.push(Number(match[1]));
    }
    await page.getByText('Boundary coordinates · keyboard editing', { exact: true }).click();
    const coordinate = page.getByLabel(`Vertex ${vertices === 6 ? 1 : 31} longitude`, {
      exact: true,
    });
    const original = Number(await coordinate.inputValue());
    for (let index = 0; index < 20; index++) {
      boundaryMs.push(
        await measuredEdit(page, () =>
          coordinate.fill(String(original + (index % 2 === 0 ? 0.000001 : 0))),
        ),
      );
    }
    studies.push({
      vertices,
      parameterEditMs: summary(parameterMs),
      boundaryEditMs: summary(boundaryMs),
      envelopeEngineMs: envelopeMs.length ? summary(envelopeMs) : null,
      rawParameterMs: parameterMs,
      rawBoundaryMs: boundaryMs,
    });
  }

  await page.goto('/?measure=1');
  await ready(page);
  await page.getByRole('button', { name: '3D', exact: true }).click();
  await page.waitForTimeout(1000);
  const renderer = await page.evaluate(() => {
    const gl = document
      .querySelector<HTMLCanvasElement>('.maplibregl-canvas')
      ?.getContext('webgl2');
    if (!gl) return 'unavailable';
    const extension = gl.getExtension('WEBGL_debug_renderer_info');
    return String(gl.getParameter(extension ? extension.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
  });
  const camera = [];
  for (const gesture of ['pan', 'rotate'] as const) {
    const box = await page.locator('.maplibregl-canvas').boundingBox();
    if (!box) throw new Error('Map canvas unavailable.');
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    const from = await page.evaluate(() => performance.now());
    await page.mouse.down({ button: gesture === 'pan' ? 'left' : 'right' });
    try {
      const gestureStarted = performance.now();
      while (performance.now() - gestureStarted < 6000) {
        const angle = ((performance.now() - gestureStarted) / 1500) * Math.PI * 2;
        await page.mouse.move(x + Math.cos(angle) * 45, y + Math.sin(angle) * 30);
      }
    } finally {
      await page.mouse.up({ button: gesture === 'pan' ? 'left' : 'right' });
    }
    const to = await page.evaluate(() => performance.now());
    const frames = await page.evaluate(
      ({ from, to }) =>
        performance
          .getEntriesByName('plot-map-render')
          .filter((entry) => entry.startTime >= from && entry.startTime <= to)
          .map((entry) => entry.startTime),
      { from, to },
    );
    const intervals = frames.slice(1).map((time, index) => time - frames[index]);
    const completeSeconds = Math.floor((to - from) / 1000);
    const framesPerSecond = Array.from(
      { length: completeSeconds },
      (_, index) =>
        frames.filter((time) => time >= from + index * 1000 && time < from + (index + 1) * 1000)
          .length,
    );
    camera.push({
      gesture,
      durationMs: to - from,
      renderedFrames: frames.length,
      framesPerSecond,
      meanFps: (frames.length * 1000) / (to - from),
      frameIntervalMs: intervals.length ? summary(intervals) : null,
    });
    await page.getByRole('button', { name: 'Fit plot in view', exact: true }).click();
    await page.waitForTimeout(1000);
  }
  const beforeIdle = await page.evaluate(
    () => performance.getEntriesByName('plot-map-render').length,
  );
  await page.waitForTimeout(2000);
  const idleFrames =
    (await page.evaluate(() => performance.getEntriesByName('plot-map-render').length)) -
    beforeIdle;
  const hardware = !/swiftshader|llvmpipe|software|basic render|unavailable/i.test(renderer);
  const report = {
    measuredAt: new Date().toISOString(),
    source: process.env.PLAYWRIGHT_BASE_URL ?? 'local production build',
    environment: {
      os: `${os.platform()} ${os.release()}`,
      cpu: os.cpus()[0]?.model,
      logicalCpus: os.cpus().length,
      totalMemoryGiB: os.totalmem() / 1024 ** 3,
      browser: browser.version(),
      renderer,
      hardware,
      viewport: page.viewportSize(),
    },
    initialView: {
      network: { downloadMbps: 10, uploadMbps: 5, latencyMs: 40 },
      coldContexts: true,
      timingsMs: initialLoads,
      summaryMs: summary(initialLoads),
    },
    studies,
    camera,
    idle: { durationMs: 2000, renderedFrames: idleFrames },
    targets: {
      allInitialLoadsUnder5s: initialLoads.every((ms) => ms < 5000),
      ordinaryEnvelopeP95Under100ms:
        studies[0].envelopeEngineMs !== null && studies[0].envelopeEngineMs.p95 < 100,
      allEditP95Under500ms: studies.every(
        (study) => study.parameterEditMs.p95 < 500 && study.boundaryEditMs.p95 < 500,
      ),
      everyCompleteCameraSecondAtLeast30fps: hardware
        ? camera.every(
            (study) =>
              study.framesPerSecond.length > 0 && study.framesPerSecond.every((fps) => fps >= 30),
          )
        : 'unverified: hardware renderer required',
      noIdleRepaint: idleFrames === 0,
    },
    limits:
      'One device, 3 cold contexts and 20 samples per edit class. p95 uses nearest rank. ' +
      'Edits measure input-handler to a rendered matching-revision proposal, excluding driver overhead. ' +
      'Camera counts actual MapLibre render events during continuous pointer gestures; not display refreshes. ' +
      'Static example context only; no general device or scene guarantee. Envelope times are engine durations.',
  };
  await mkdir('docs/performance', { recursive: true });
  await writeFile(
    process.env.PLAYWRIGHT_BASE_URL
      ? 'docs/performance/acceptance-06-deployed.json'
      : 'docs/performance/acceptance-06.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report.targets));
  expect(studies.every((study) => study.parameterEditMs.samples === 20)).toBe(true);
  expect(camera.every((study) => study.durationMs >= 5000 && study.renderedFrames > 0)).toBe(true);
});

async function ready(page: Page) {
  await expect(page.getByTestId('zone-status')).toContainText('inside');
  await expect(page.getByTestId('gross-area')).not.toHaveText('—');
  await expect(page.locator('.results-panel')).toHaveAttribute('aria-busy', 'false');
}

async function measuredEdit(page: Page, edit: () => Promise<unknown>) {
  const before = await page.evaluate(
    () => performance.getEntriesByName('plot-edit-to-render').length,
  );
  await edit();
  await expect
    .poll(() => page.evaluate(() => performance.getEntriesByName('plot-edit-to-render').length))
    .toBeGreaterThan(before);
  await expect(page.locator('.results-panel')).toHaveAttribute('aria-busy', 'false');
  return page.evaluate(() => performance.getEntriesByName('plot-edit-to-render').at(-1)!.duration);
}
