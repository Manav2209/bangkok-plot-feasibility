import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('plot-area')).toHaveText('2,500');
});

test('loads the measured sample, map and unresolved prerequisites without runtime errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.reload();
  await expect(page.getByTestId('gross-area')).toHaveText('11,256');
  await expect(page.getByRole('button', { name: 'Draw a plot', exact: true })).toBeEnabled();
  await expect(page.getByTestId('gross-area')).toHaveText('11,256');
  await expect(page.getByText('No overall compliance verdict')).toBeVisible();
  await expect(page.locator('.map-error')).toHaveCount(0);
  await expect(page.locator('.check-unknown')).toHaveCount(5);
  await page.getByRole('button', { name: '3D', exact: true }).click();
  await expect(page.getByRole('button', { name: '3D', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.screenshot({ path: 'test-results/sample-3d.png' });
  expect(errors).toEqual([]);
});

test('switches to stepped floor accounting and recomputes after rapid input changes', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'OPTION B Stepped' }).click();
  await expect(page.getByTestId('gross-area')).toHaveText('9,064');
  await page.getByLabel('Floors', { exact: true }).fill('8');
  await page.getByLabel('Floors', { exact: true }).fill('4');
  await page.getByLabel('Floors', { exact: true }).fill('3');
  await expect(page.getByTestId('gross-area')).toHaveText('5,252');
  await page.getByLabel('Floors', { exact: true }).fill('2');
  await expect(page.getByRole('button', { name: 'OPTION B Stepped' })).toBeDisabled();
  await expect(page.getByTestId('gross-area')).toHaveText('3,752');
});

test('draws a concave plot, undoes it and resets the sample', async ({ page }) => {
  await page.getByRole('button', { name: 'Draw a plot', exact: true }).click();
  await expect(page.getByText('Click to place vertices.', { exact: false })).toBeVisible();
  const canvas = page.locator('.maplibregl-canvas');
  const box = (await canvas.boundingBox())!;
  const vertices = [
    [0.25, 0.4],
    [0.65, 0.4],
    [0.65, 0.55],
    [0.45, 0.55],
    [0.45, 0.65],
    [0.25, 0.65],
  ];
  for (const [x, y] of [...vertices, vertices[0]])
    await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
  await expect(page.getByText('6 vertices · irregular plots supported')).toBeVisible();
  await expect(page.getByTestId('plot-area')).not.toHaveText('2,500');
  await expect(page.getByTestId('gross-area')).not.toHaveText('—');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await page.getByRole('button', { name: 'Reset example' }).click();
  await expect(page.getByTestId('plot-area')).toHaveText('2,500');
  await expect(page.getByTestId('gross-area')).toHaveText('11,256');
});

test('edits a sample vertex and updates both geometry and area', async ({ page }) => {
  await page.getByRole('button', { name: 'Boundary', exact: true }).click();
  await page.getByRole('button', { name: 'Edit boundary', exact: true }).click();
  const box = (await page.locator('.maplibregl-canvas').boundingBox())!;
  // Initial sample corner (0,0), 25 m west/south of the initial (25,25) camera centre.
  const pixelsPerM = (512 * 2 ** 18.4) / (40_075_016.6856 * Math.cos((13.6979 * Math.PI) / 180));
  const x = box.x + box.width / 2 - 25 * pixelsPerM;
  const y = box.y + box.height / 2 + 25 * pixelsPerM;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 35, y + 20, { steps: 10 });
  await page.mouse.up();
  await expect(page.getByTestId('plot-area')).not.toHaveText('2,500');
  await expect(page.getByTestId('gross-area')).not.toHaveText('—');
  await page.getByRole('button', { name: 'Reset example' }).click();
  await expect(page.getByTestId('plot-area')).toHaveText('2,500');
});

test('saves and restores scenario inputs', async ({ page }) => {
  await page.getByLabel('Floors', { exact: true }).fill('4');
  await page.getByRole('button', { name: 'Save scenario' }).click();
  await expect(page.getByRole('status')).toContainText('Scenario saved');
  await page.reload();
  await expect(page.getByLabel('Floors', { exact: true })).toHaveValue('4');
  await expect(page.getByTestId('gross-area')).toHaveText('7,504');
});

test('shows invalid input instead of stale results, then recovers', async ({ page }) => {
  await page.getByLabel('Floors', { exact: true }).fill('0');
  await expect(page.getByText('Use a setback of 0–100 m', { exact: false })).toBeVisible();
  await expect(page.getByTestId('gross-area')).toHaveText('—');
  await page.getByRole('button', { name: 'Reset example' }).click();
  await expect(page.getByTestId('gross-area')).toHaveText('11,256');
});

test('opens a keyboard accessible source dialog and closes with Escape', async ({ page }) => {
  await page.getByRole('button', { name: 'Research & sources' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Evidence still needed')).toBeVisible();
  await expect(dialog.getByRole('link', { name: /Bangkok comprehensive plan/ })).toHaveAttribute(
    'href',
    /tk10.pdf/,
  );
  await expect(page.getByRole('button', { name: 'Close research' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});

test('fits a mobile viewport and keeps the core controls reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Draw a plot', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: '3D', exact: true }).scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: '3D', exact: true }).click();
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});
