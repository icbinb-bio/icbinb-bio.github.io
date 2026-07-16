import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/browser',
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:4321',
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4321',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: false,
  },
});
