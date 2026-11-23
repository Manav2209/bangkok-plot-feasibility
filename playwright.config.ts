import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 5173);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('PLAYWRIGHT_PORT must be a valid TCP port.');
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
      args:
        process.env.PLAYWRIGHT_HARDWARE_GPU === '1'
          ? []
          : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
  ],
  webServer: {
    command:
      process.env.PLAYWRIGHT_PRODUCTION === '1'
        ? `pnpm --filter @bangkok/web preview --outDir ../../dist --port ${port}`
        : `pnpm --filter @bangkok/web dev --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
