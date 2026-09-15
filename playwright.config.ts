import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './Tests',
  fullyParallel: true,
  reporter: 'html',
  timeout: 180000,
  globalSetup: require.resolve('./GlobalAuthenticationSetup'),
  use: {
    baseURL: process.env.BASE_URL,
    storageState: 'auth.json',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
    actionTimeout: 60000,
    navigationTimeout: 60000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
