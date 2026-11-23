import { expect, test } from '@playwright/test';
import { defaultScenario, scenarioUrl } from '../../apps/web/src/scenario';
import { SAMPLE_PLOT } from '../../packages/geometry/src/index';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('zone-status')).toContainText('inside');
  await expect(page.getByTestId('plot-area')).toHaveText('2,500');
  await expect(page.locator('.results-panel')).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByTestId('gross-area')).not.toHaveText('—');
});
const numeric = (text: string) => Number(text.replaceAll(',', ''));

test('aligns the example road and measures both designs from the same assumed boundary', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Load simple example', exact: true }).click();
  await expect(page.getByTestId('core-model-status')).toHaveText('Pass · conditional model');
  await expect(page.getByText('4 vertices · irregular plots supported')).toBeVisible();
  await expect(page.getByTestId('floor-count')).toHaveText('4');
  await expect(page.getByTestId('road-edge-gap')).toHaveText('5 m');
  await expect(page.getByTestId('road-centreline-gap')).toHaveText('9 m');
  await expect(page.getByTestId('road-clearance')).toContainText(
    'Model-to-mapped centreline offset: 0 m',
  );
  await expect(page.locator('.road-reference-warning')).toHaveCount(0);
  await page.getByTestId('road-clearance').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/simple-example-2d.png' });
  await page.getByRole('button', { name: /OPTION B/ }).click();
  await expect(page.getByTestId('road-edge-gap')).toHaveText('5 m');
  await expect(page.getByTestId('road-centreline-gap')).toHaveText('9 m');
  await expect(page.getByTestId('core-model-status')).toHaveText('Pass · conditional model');
  await page.getByRole('button', { name: '3D', exact: true }).click();
  await page.getByTestId('road-clearance').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/road-aligned-example.png' });
});

test('warns about old shared plot-to-road misalignment without silently moving a saved site', async ({
  page,
}) => {
  const old = { ...defaultScenario(), plot: SAMPLE_PLOT };
  old.roads = old.roads.map((road) => ({ ...road, geometry: [SAMPLE_PLOT[0], SAMPLE_PLOT[1]] }));
  await page.goto(scenarioUrl(old, page.url()));
  await expect(page.getByTestId('road-clearance')).toContainText(
    'does not align with the mapped road',
  );
  await expect(page.getByTestId('plot-area')).toHaveText('2,500');
  await page.getByRole('button', { name: 'Reset example', exact: true }).click();
  await expect(page.locator('.road-reference-warning')).toHaveCount(0);
});

test('puts measurements first while retaining expandable scope notes and visible blocking errors', async ({
  page,
}) => {
  await expect(page.getByTestId('gross-area')).toBeInViewport();
  await expect(page.locator('.study-notes')).not.toHaveAttribute('open');
  await expect(page.locator('.core-overview')).toContainText('10 need more information');
  await page.getByText('Study notes', { exact: false }).first().click();
  await expect(page.locator('.study-notes')).toHaveAttribute('open', '');
  await expect(page.locator('.study-notes')).toContainText('Unconfirmed widths');
  await page.getByText('Study notes', { exact: false }).first().click();
  await page.getByRole('button', { name: 'Load simple example', exact: true }).click();
  await expect(page.locator('.core-overview')).toContainText('10 of 10 passed');
  await page.getByRole('button', { name: '3D', exact: true }).click();
  await page.locator('.results-panel').evaluate((panel) => {
    panel.scrollTop = 0;
  });
  await page.screenshot({ path: 'test-results/ui-polish-desktop.png' });
  await page.getByLabel('Floors', { exact: true }).fill('0');
  await expect(
    page.getByText('Use finite, supported design assumptions', { exact: false }),
  ).toBeVisible();
});

test('navigates narrow layouts without replacing a shared scenario', async ({ page }) => {
  await page.setViewportSize({ width: 775, height: 900 });
  await page.goto(scenarioUrl(defaultScenario(), page.url()));
  await expect(page.getByTestId('gross-area')).not.toHaveText('—');
  const sharedURL = page.url();
  await page.getByRole('button', { name: 'Design results', exact: true }).click();
  await expect(page.locator('#design-results')).toBeFocused();
  expect(page.url()).toBe(sharedURL);
  await page.getByRole('button', { name: 'Site inputs', exact: true }).click();
  await expect(page.locator('#site-inputs')).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Map view', exact: true }).click();
  await expect(page.locator('#site-view')).toBeFocused();
  await expect(page.getByRole('button', { name: '3D', exact: true })).toBeInViewport();
  await page.getByRole('button', { name: 'Design results', exact: true }).click();
  await expect(page.locator('#design-results')).toBeFocused();
  expect(page.url()).toBe(sharedURL);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'test-results/ui-polish-mobile.png' });
});

test('checks both declared models and keeps missing road or height facts unknown', async ({
  page,
}) => {
  await expect(page.getByTestId('core-model-status')).toHaveText('Inputs incomplete');
  await page.getByText('Core-rule model inputs', { exact: true }).click();
  await page.getByRole('button', { name: 'Load simple example', exact: true }).click();
  await expect(page.getByTestId('core-model-status')).toHaveText('Pass · conditional model');
  await expect(page.locator('[data-core-rule]')).toHaveCount(10);
  await expect(
    page.locator('[data-core-rule] summary small').filter({ hasText: 'Pass (model)' }),
  ).toHaveCount(10);
  await page.getByRole('button', { name: /OPTION B/ }).click();
  await expect(page.getByTestId('core-model-status')).toHaveText('Pass · conditional model');
  await expect(
    page.locator('[data-core-rule] summary small').filter({ hasText: 'Pass (model)' }),
  ).toHaveCount(10);
  await page.getByRole('button', { name: '3D', exact: true }).click();
  await expect(page.getByRole('button', { name: '3D', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByTestId('core-model-status').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/core-model-3d.png' });
  await page.getByLabel('Core basis: matchingHeightDatum', { exact: true }).uncheck();
  await expect(page.locator('[data-core-rule="core-road-height"] summary')).toContainText(
    'Unknown',
  );
  await expect(page.locator('[data-core-rule="core-far"] summary')).toContainText('Pass (model)');
  await page.getByLabel('Core basis: matchingHeightDatum', { exact: true }).check();
  await page.getByLabel('Confirm width for this study', { exact: true }).uncheck();
  await expect(page.locator('[data-core-rule="core-road-setback"] summary')).toContainText(
    'Unknown',
  );
  await expect(page.getByText('No overall compliance verdict', { exact: true })).toBeVisible();
  await page.getByLabel('Confirm width for this study', { exact: true }).check();
  await expect(page.getByTestId('core-model-status')).toHaveText('Pass · conditional model');
  await page.getByRole('button', { name: 'Frontage edge 1', exact: true }).click();
  await expect(
    page.getByLabel('Core basis: publicRoadReferences', { exact: true }),
  ).not.toBeChecked();
  await expect(page.locator('[data-core-rule="core-road-setback"] summary')).toContainText(
    'Unknown',
  );
});

test('preserves declared core inputs in saves and shares and clears them after boundary edits', async ({
  page,
  browser,
}) => {
  await page.getByText('Core-rule model inputs', { exact: true }).click();
  await page.getByRole('button', { name: 'Load declared 8 m road example', exact: true }).click();
  await expect(page.getByTestId('core-model-status')).toHaveText('Pass · conditional model');
  await page.getByRole('button', { name: 'Save scenario', exact: true }).click();
  await page.reload();
  await expect(page.getByTestId('core-model-status')).toHaveText('Pass · conditional model');
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('denied');
        },
      },
    }),
  );
  await page.getByRole('button', { name: 'Copy link', exact: true }).click();
  const url = await page.getByLabel('Scenario URL').inputValue();
  const fresh = await browser.newContext();
  try {
    const recipient = await fresh.newPage();
    await recipient.goto(url);
    await expect(recipient.getByTestId('core-model-status')).toHaveText('Pass · conditional model');
    await recipient.getByText('Core-rule model inputs', { exact: true }).click();
    await expect(
      recipient.getByLabel('Core basis: wholeSiteAndBuildings', { exact: true }),
    ).toBeChecked();
    await recipient.getByText('Boundary coordinates · keyboard editing', { exact: true }).click();
    // Move this convex corner inward so this test exercises invalidated facts,
    // independently of the separate zone-crossing rejection tests.
    const longitude = recipient.getByLabel('Vertex 2 longitude', { exact: true });
    await longitude.fill(String(Number(await longitude.inputValue()) - 0.00001));
    await expect(recipient.getByTestId('core-model-status')).toHaveText('Inputs incomplete');
    await expect(
      recipient.getByLabel('Core basis: wholeSiteAndBuildings', { exact: true }),
    ).not.toBeChecked();
    await expect(
      recipient.getByLabel('Confirm width for this study', { exact: true }),
    ).not.toBeChecked();
  } finally {
    await fresh.close();
  }
});

test('loads the dated imagery case without inventing access or legal feasibility', async ({
  page,
}) => {
  await page.getByText('Dated imagery study · 5 March 2026', { exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'Capture-date metadata', exact: true }),
  ).toHaveAttribute('href', /World_Imagery/);
  await page.getByRole('button', { name: 'Load imagery study', exact: true }).click();
  await expect(page.getByText(/Dated imagery study loaded:/)).toBeVisible();
  await expect(page.getByTestId('zone-status')).toContainText('inside');
  await expect(page.getByTestId('plot-area')).not.toHaveText('2,500');
  await expect(page.getByTestId('gross-area')).not.toHaveText('—');
  await expect(page.getByRole('button', { name: 'Frontage edge 1', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect(page.getByText('No overall compliance verdict', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /OPTION B/ }).click();
  await expect(page.getByTestId('gross-area')).not.toHaveText('—');
  await page.screenshot({ path: 'test-results/dated-imagery-study-06.png' });
  await page.getByRole('button', { name: 'Reset example', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Frontage edge 1', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('loads real context, zone, two concepts and honest legal status without runtime errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await expect(page.getByRole('button', { name: /OPTION B/ })).toBeEnabled();
  await expect(page.getByText('No overall compliance verdict')).toBeVisible();
  await expect(page.getByText('Bundled OpenStreetMap context')).toBeVisible();
  await expect(page.locator('.check[data-scope="statutory"] .check-unknown')).toHaveCount(15);
  await expect(page.locator('.map-error')).toHaveCount(0);
  await page.getByRole('button', { name: '3D', exact: true }).click();
  await expect(page.getByRole('button', { name: '3D', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'test-results/sample-3d.png' });
  expect(errors).toEqual([]);
});

test('compares distinct concepts and discards obsolete results during rapid edits', async ({
  page,
}) => {
  const first = await page.getByTestId('gross-area').innerText();
  await page.getByRole('button', { name: /OPTION B/ }).click();
  await expect(page.getByTestId('gross-area')).not.toHaveText(first);
  for (const floors of ['8', '4', '3'])
    await page.getByLabel('Floors', { exact: true }).fill(floors);
  await expect(page.locator('.results-panel')).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByTestId('floor-count')).toHaveText('3');
  await expect(
    page.getByText('High-rise requirements are unresolved', { exact: false }),
  ).toHaveCount(0);
  await page.getByLabel('Floors', { exact: true }).fill('2');
  await expect(page.getByTestId('floor-count')).toHaveText('2');
});

test('draws a concave plot, undoes it and resets the sample', async ({ page }) => {
  await page.getByRole('button', { name: 'Draw a plot', exact: true }).click();
  await expect(page.getByText('Click to place vertices.', { exact: false })).toBeVisible();
  const box = (await page.locator('.maplibregl-canvas').boundingBox())!;
  const vertices = [
    [0.32, 0.42],
    [0.62, 0.42],
    [0.62, 0.53],
    [0.46, 0.53],
    [0.46, 0.62],
    [0.32, 0.62],
  ];
  for (const [x, y] of [...vertices, vertices[0]])
    await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
  await expect(page.getByText('6 vertices · irregular plots supported')).toBeVisible();
  await expect(page.getByTestId('plot-area')).not.toHaveText('2,500');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await page.getByRole('button', { name: 'Reset example' }).click();
  await expect(page.getByTestId('plot-area')).toHaveText('2,500');
  await expect(page.getByTestId('gross-area')).not.toHaveText('—');
});

test('edits a sample vertex and updates geometry and area', async ({ page }) => {
  await page.getByRole('button', { name: 'Boundary', exact: true }).click();
  await page.getByRole('button', { name: 'Edit boundary', exact: true }).click();
  const box = (await page.locator('.maplibregl-canvas').boundingBox())!;
  const plot = defaultScenario().plot;
  const centre = plot.reduce(
    (sum, p) => [sum[0] + p[0] / plot.length, sum[1] + p[1] / plot.length],
    [0, 0],
  );
  const world = ([longitude, latitude]: number[]) => {
    const phi = (latitude * Math.PI) / 180,
      scale = 512 * 2 ** 18.4;
    return [
      ((longitude + 180) / 360) * scale,
      ((1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2) * scale,
    ];
  };
  const vertex = world(plot[0]),
    camera = world(centre);
  const x = box.x + box.width / 2 + vertex[0] - camera[0],
    y = box.y + box.height / 2 + vertex[1] - camera[1];
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 20, y + 10, { steps: 10 });
  await page.mouse.up();
  await expect(page.getByTestId('plot-area')).not.toHaveText('2,500');
  await page.getByRole('button', { name: 'Reset example' }).click();
  await expect(page.getByTestId('plot-area')).toHaveText('2,500');
});

test('changes use and confirms multiple road frontages with provenance', async ({ page }) => {
  await page.getByLabel('Building type', { exact: true }).selectOption('office');
  await expect(page.locator('.results-panel')).toHaveAttribute('aria-busy', 'false');
  expect(numeric(await page.getByTestId('gross-area').innerText())).toBeLessThanOrEqual(1001);
  await page.getByLabel('Road width edge 1', { exact: true }).fill('16');
  await page.getByLabel('Confirm width for this study', { exact: true }).check();
  await expect
    .poll(async () => numeric(await page.getByTestId('gross-area').innerText()))
    .toBeGreaterThan(1000);
  await page.getByRole('button', { name: 'Frontage edge 4', exact: true }).click();
  await page.getByLabel('Road width edge 4', { exact: true }).fill('4');
  await page.getByLabel('Confirm width for this study', { exact: true }).nth(1).check();
  await expect(page.getByRole('button', { name: 'Frontage edge 4', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('.results-panel')).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByText('No overall compliance verdict')).toBeVisible();
});

test('saves and restores all scenario inputs', async ({ page }) => {
  await page.getByLabel('Floors', { exact: true }).fill('4');
  await page.getByLabel('Building type', { exact: true }).selectOption('office');
  await page.getByText('Parking, access and review inputs', { exact: true }).click();
  await page.getByLabel('Office working area, m²', { exact: true }).fill('250');
  await page.getByLabel('Parking spaces provided', { exact: true }).fill('5');
  await page.getByLabel('Parking location', { exact: true }).selectOption('within-building');
  await page.getByRole('button', { name: 'Save scenario', exact: true }).click();
  await expect(page.locator('.toast')).toContainText('Scenario saved');
  await page.reload();
  await expect(page.getByLabel('Floors', { exact: true })).toHaveValue('4');
  await expect(page.getByLabel('Building type', { exact: true })).toHaveValue('office');
  await page.getByText('Parking, access and review inputs', { exact: true }).click();
  await expect(page.getByLabel('Office working area, m²', { exact: true })).toHaveValue('250');
  await expect(page.getByLabel('Parking spaces provided', { exact: true })).toHaveValue('5');
  await expect(page.getByLabel('Parking location', { exact: true })).toHaveValue('within-building');
});

test('shares roads, use and plot into a fresh browser without local state', async ({
  page,
  browser,
}) => {
  await page.getByLabel('Floors', { exact: true }).fill('4');
  await page.getByLabel('Building type', { exact: true }).selectOption('office');
  await page.getByLabel('Road width edge 1', { exact: true }).fill('16');
  await page.getByLabel('Confirm width for this study', { exact: true }).check();
  await expect(page.locator('.results-panel')).toHaveAttribute('aria-busy', 'false');
  const original = await page.getByTestId('gross-area').innerText();
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('denied');
        },
      },
    }),
  );
  await page.getByRole('button', { name: 'Copy link', exact: true }).click();
  const url = await page.getByLabel('Scenario URL').inputValue();
  expect(url).toContain('#scenario=');
  const fresh = await browser.newContext();
  try {
    const recipient = await fresh.newPage();
    await recipient.goto(url);
    await expect(recipient.getByLabel('Floors', { exact: true })).toHaveValue('4');
    await expect(recipient.getByLabel('Building type', { exact: true })).toHaveValue('office');
    await expect(recipient.getByLabel('Road width edge 1', { exact: true })).toHaveValue('16');
    await expect(recipient.getByTestId('gross-area')).toHaveText(original);
    await expect(recipient.locator('.toast')).toContainText('Shared scenario loaded.');
  } finally {
    await fresh.close();
  }
});

test('copies a valid scenario when clipboard access succeeds', async ({ page }) => {
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (url: string) => {
          sessionStorage.setItem('copied', url);
        },
      },
    }),
  );
  await page.getByRole('button', { name: 'Copy link', exact: true }).click();
  await expect(page.locator('.toast')).toContainText('Scenario link copied.');
  expect(await page.evaluate(() => sessionStorage.getItem('copied'))).toContain('#scenario=');
});

test('rejects malformed share input instead of using unrelated local state', async ({ page }) => {
  await page.getByLabel('Floors', { exact: true }).fill('3');
  await page.getByRole('button', { name: 'Save scenario', exact: true }).click();
  await page.goto('/#scenario=malformed');
  await page.reload();
  await expect(page.getByLabel('Floors', { exact: true })).toHaveValue('4');
  await expect(page.locator('.toast')).toContainText('This shared scenario is invalid');
});

test('sums the selected design floor table and distinguishes model budgets from legal limits', async ({
  page,
}) => {
  await page.getByText('Floor-by-floor areas', { exact: false }).click();
  await page.getByRole('button', { name: /OPTION B/ }).click();
  const areas = await page.locator('.floor-table tbody tr td:last-child').allTextContents();
  const total = numeric(await page.getByTestId('floor-total').innerText());
  expect(Math.abs(areas.map(numeric).reduce((a, b) => a + b, 0) - total)).toBeLessThan(0.1);
  expect(Math.abs(numeric(await page.getByTestId('gross-area').innerText()) - total)).toBeLessThan(
    0.51,
  );
  await expect(page.locator('.legal-metrics')).toContainText('Unknown');
  await page.getByText('Maximum floor-area ratio', { exact: true }).click();
  await expect(
    page.locator('.check[open]').getByText('Historical candidate only', { exact: false }),
  ).toBeVisible();
});

test('rejects outside-zone edits without leaving stale designs visible', async ({ page }) => {
  await page.getByText('Boundary coordinates · keyboard editing', { exact: true }).click();
  const longitudes = await Promise.all(
    Array.from({ length: defaultScenario().plot.length }, (_, i) =>
      page.getByLabel(`Vertex ${i + 1} longitude`, { exact: true }).inputValue(),
    ),
  );
  for (let i = 0; i < longitudes.length; i++)
    await page
      .getByLabel(`Vertex ${i + 1} longitude`, { exact: true })
      .fill(String(Number(longitudes[i]) + 0.01));
  await expect(page.getByTestId('zone-status')).toContainText('outside');
  await expect(page.getByTestId('gross-area')).toHaveText('—');
  await expect(page.getByRole('button', { name: /OPTION A/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Reset example' }).click();
  await expect(page.getByTestId('zone-status')).toContainText('inside');
  await expect(page.getByTestId('gross-area')).not.toHaveText('—');
  await expect(page.locator('.map-error')).toHaveCount(0);
});

test('shows invalid assumptions and recovers without stale metrics', async ({ page }) => {
  await page.getByLabel('Floors', { exact: true }).fill('0');
  await expect(
    page.getByText('Use finite, supported design assumptions', { exact: false }),
  ).toBeVisible();
  await expect(page.getByTestId('gross-area')).toHaveText('—');
  await page.getByRole('button', { name: 'Reset example' }).click();
  await expect(page.getByTestId('gross-area')).not.toHaveText('—');
});

test('shows a context failure honestly and retries the real extract', async ({ page }) => {
  await page.route('**/data/context.geojson', (route) => route.abort());
  await page.reload();
  await expect(page.locator('.data-error')).toContainText('Neighbourhood data could not load');
  await expect(page.getByTestId('gross-area')).not.toHaveText('—');
  await page.unroute('**/data/context.geojson');
  await page.getByRole('button', { name: 'Retry site data' }).click();
  await expect(page.locator('.data-error')).toHaveCount(0);
  await expect(page.getByText('Bundled OpenStreetMap context')).toBeVisible();
});

test('uses keyboard-accessible sources and responsive collapsible panels', async ({ page }) => {
  await page.getByRole('button', { name: 'Research & sources' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close research' })).toBeFocused();
  await expect(dialog.getByRole('link', { name: /Bangkok comprehensive plan/ })).toHaveAttribute(
    'href',
    /tk10.pdf/,
  );
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Collapse inputs', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Show inputs', exact: true })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  await page.getByRole('button', { name: '3D', exact: true }).scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: '3D', exact: true }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});

test('discloses missing surroundings beyond the bundled context extent', async ({ page }) => {
  await page.getByLabel('Find a local address or road', { exact: true }).fill('100.6200,13.6990');
  await page.getByRole('button', { name: 'Locate', exact: true }).click();
  await expect(page.getByText('Beyond bundled context coverage', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Missing features here do not indicate vacant land', { exact: true }),
  ).toBeVisible();
});

test('keeps zone membership unknown if the authoritative boundary cannot load', async ({
  page,
}) => {
  await page.route('**/data/zone.geojson', (route) => route.abort());
  await page.reload();
  await expect(page.locator('.data-error')).toContainText('Zone data could not load');
  await expect(page.getByTestId('zone-status')).toContainText('unknown');
  await expect(page.getByText('No overall compliance verdict')).toBeVisible();
});

test('warns when zooming out exposes unmapped surroundings around the covered centre', async ({
  page,
}) => {
  for (let i = 0; i < 5; i++)
    await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await expect(page.getByText('Bundled OpenStreetMap context', { exact: true })).toBeVisible();
  await expect(
    page.getByText('View extends beyond coverage · missing features do not indicate vacant land', {
      exact: true,
    }),
  ).toBeVisible();
});

test('reuses an idle calculation worker between completed edits', async ({ page }) => {
  await page.addInitScript(() => {
    const OriginalWorker = window.Worker;
    let count = 0;
    window.Worker = class extends OriginalWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        if (String(url).includes('calculation.worker')) count++;
      }
    };
    Object.defineProperty(window, '__calculationWorkerCount', { get: () => count });
  });
  await page.reload();
  await expect(page.locator('.results-panel')).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByTestId('gross-area')).not.toHaveText('—');
  const count = await page.evaluate(() => Reflect.get(window, '__calculationWorkerCount'));
  expect(count).toBeGreaterThan(0);
  for (const floors of ['3', '4']) {
    await page.getByLabel('Floors', { exact: true }).fill(floors);
    await expect(page.getByTestId('floor-count')).toHaveText(floors);
    await expect(page.locator('.results-panel')).toHaveAttribute('aria-busy', 'false');
  }
  expect(await page.evaluate(() => Reflect.get(window, '__calculationWorkerCount'))).toBe(count);
});

test('reserves rendered parking floors while keeping layout and legal evidence unknown', async ({
  page,
}) => {
  await page.getByText('Parking, access and review inputs', { exact: true }).click();
  await page.getByLabel('Total residential units', { exact: true }).fill('50');
  await page.getByLabel('Residential units at least 60 m²', { exact: true }).fill('0');
  await page.getByLabel('Parking spaces provided', { exact: true }).fill('50');
  await page.getByLabel('Parking location', { exact: true }).selectOption('within-building');
  await expect(page.locator('.results-panel')).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByTestId('gross-area')).not.toHaveText('—');
  await page.getByText('Floor-by-floor areas', { exact: false }).click();
  await expect(page.locator('.floor-table tbody tr').filter({ hasText: 'parking' })).toHaveCount(2);
  await expect(page.locator('.check[data-rule-id="model-parking-layout"]')).toContainText(
    'Unknown',
  );
  await expect(page.getByText('No overall compliance verdict')).toBeVisible();
});

test('shows known parking-programme failures without fabricating a valid candidate', async ({
  page,
}) => {
  await page.getByText('Parking, access and review inputs', { exact: true }).click();
  await page.getByLabel('Total residential units', { exact: true }).fill('50');
  await page.getByLabel('Residential units at least 60 m²', { exact: true }).fill('50');
  await page.getByLabel('Parking spaces provided', { exact: true }).fill('0');
  await expect(page.locator('.results-panel')).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByTestId('gross-area')).toHaveText('—');
  await expect(page.locator('.check[data-rule-id="model-parking-count"]')).toContainText('Failed');
  await expect(
    page.getByText('The bounded search found no usable concept.', { exact: false }),
  ).toBeVisible();
});

test('keeps road names off the map while retaining nearby-road information', async ({ page }) => {
  await page.getByText('Nearby mapped roads · 6', { exact: true }).click();
  await expect(page.locator('.nearby-roads li')).toHaveCount(6);
  await expect(page.locator('.nearby-roads')).toContainText(
    'Proximity does not establish frontage',
  );
  await expect(page.locator('.road-map-label')).toHaveCount(0);
  await expect(page.locator('.nearby-roads a').first()).toHaveAttribute(
    'href',
    /openstreetmap.org\/way\//,
  );
  await page.getByRole('button', { name: '3D', exact: true }).click();
  await expect(page.getByRole('button', { name: '3D', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('.road-map-label')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/map-without-road-labels.png' });
});

test('renders a selectable parking floor plan and keeps legal layout review unknown', async ({
  page,
}) => {
  await page.getByText('Parking, access and review inputs', { exact: true }).click();
  await page.getByLabel('Total residential units', { exact: true }).fill('50');
  await page.getByLabel('Residential units at least 60 m²', { exact: true }).fill('0');
  await page.getByLabel('Parking spaces provided', { exact: true }).fill('50');
  await page.getByLabel('Parking location', { exact: true }).selectOption('within-building');
  await expect(page.locator('.results-panel')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('.parking-summary')).toContainText('Schematic stalls placed: 50');
  await page.getByRole('button', { name: 'Inspect parking plan', exact: true }).click();
  await expect(page.locator('.parking-plan-notice')).toContainText('schematic stalls');
  await expect(page.getByRole('button', { name: '2D', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByLabel('Parking plan level', { exact: true }).selectOption('2');
  await expect(page.locator('.parking-plan-notice')).toContainText('Level 2:');
  await expect(page.locator('.check[data-rule-id="model-parking-layout"]')).toContainText(
    'Unknown',
  );
  await page.screenshot({ path: 'test-results/parking-plan.png' });
  await page.getByRole('button', { name: 'Massing', exact: true }).click();
  await expect(page.locator('.parking-plan-notice')).toHaveCount(0);
});

test('offers first-use guidance without implying search supplies a parcel', async ({ page }) => {
  await page.getByText('First time? Start here', { exact: true }).click();
  await expect(page.locator('.getting-started')).toContainText(
    'Search moves the map; it does not establish a parcel',
  );
  await page.getByRole('button', { name: 'Read research and limitations', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('keeps camera controls exposed and clickable at laptop and narrow widths', async ({
  page,
}) => {
  for (const size of [
    { width: 1000, height: 850 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(size);
    const three = page.getByRole('button', { name: '3D', exact: true }),
      two = page.getByRole('button', { name: '2D', exact: true });
    await three.scrollIntoViewIfNeeded();
    const box = await three.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(size.width);
    await three.click();
    await expect(three).toHaveAttribute('aria-pressed', 'true');
    await two.click();
    await expect(two).toHaveAttribute('aria-pressed', 'true');
    await page.screenshot({ path: `test-results/view-controls-${size.width}.png` });
    const camera = await page.locator('.camera-switch').boundingBox(),
      overlay = await page.locator('.overlay-control').boundingBox();
    expect(camera && overlay).toBeTruthy();
    const overlap =
      Math.min(camera!.x + camera!.width, overlay!.x + overlay!.width) >
        Math.max(camera!.x, overlay!.x) &&
      Math.min(camera!.y + camera!.height, overlay!.y + overlay!.height) >
        Math.max(camera!.y, overlay!.y);
    expect(overlap).toBe(false);
  }
});

test('screens a ramp, rejects a steep run, and preserves a valid declared reservation without legal approval', async ({
  page,
}) => {
  // This covers a long form, failure recovery, plan inspection, save and reload.
  // Calculation latency is measured independently in the performance suite.
  test.setTimeout(60_000);
  await page.getByText('Usability and landscape assumptions', { exact: true }).click();
  await page.getByLabel('Core / circulation fraction', { exact: true }).fill('0.2');
  await page.getByText('Parking, access and review inputs', { exact: true }).click();
  await page.getByLabel('Total residential units', { exact: true }).fill('50');
  await page.getByLabel('Residential units at least 60 m²', { exact: true }).fill('0');
  await page.getByLabel('Parking spaces provided', { exact: true }).fill('50');
  await page.getByLabel('Parking location', { exact: true }).selectOption('within-building');
  await page.getByLabel('Driveway direction', { exact: true }).selectOption('two-way');
  await page.getByText('Ramp dimensions and clearance', { exact: true }).click();
  await page.getByLabel('Ramp type', { exact: true }).selectOption('straight');
  await page.getByLabel('Ramp horizontal inclined run, m', { exact: true }).fill('10');
  await expect(page.getByTestId('gross-area')).toHaveText('—');
  await expect(page.locator('.check[data-rule-id="model-ramp-gradient"]')).toContainText('Failed');
  await page.getByLabel('Ramp horizontal inclined run, m', { exact: true }).fill('21.4');
  await page.getByLabel('Ramp clear width, m', { exact: true }).fill('6');
  await page.getByLabel('Parking and ramp clear height, m', { exact: true }).fill('2.4');
  await page.getByLabel('Ground ramp to entrance mouth, m', { exact: true }).fill('6');
  await expect(page.getByTestId('gross-area')).not.toHaveText('—');
  await expect(page.locator('.check[data-rule-id="model-ramp-reservation"]')).toContainText(
    'Assumption',
  );
  await expect(page.locator('.check[data-rule-id="model-ramp-swept-path"]')).toContainText(
    'Unknown',
  );
  await expect(page.getByTestId('ramp-summary')).toContainText('14.95%');
  await page.getByRole('button', { name: 'Inspect parking plan', exact: true }).click();
  await expect(page.locator('.parking-plan-notice')).toContainText('red: ramp reservation');
  await page.screenshot({ path: 'test-results/ramp-plan-05.png' });
  await page.getByRole('button', { name: 'Save scenario', exact: true }).click();
  await expect(page.locator('.toast')).toContainText('Scenario saved');
  await page.reload();
  await page.getByText('Parking, access and review inputs', { exact: true }).click();
  await page.getByText('Ramp dimensions and clearance', { exact: true }).click();
  await expect(page.getByLabel('Ramp horizontal inclined run, m', { exact: true })).toHaveValue(
    '21.4',
  );
  await expect(page.getByLabel('Ramp clear width, m', { exact: true })).toHaveValue('6');
  await expect(page.getByText('No overall compliance verdict')).toBeVisible();
});
