import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './Tests',
  fullyParallel: true,
  reporter: 'html',
  // This app is legacy 3DEXPERIENCE software — pages and elements can be
  // slow to appear, so the overall test budget needs real room for several
  // slow steps back to back (login, navigate, search, results, popup, ...).
  timeout: 180000,
  globalSetup: require.resolve('./GlobalAuthenticationSetup'),
  use: {
    baseURL: process.env.BASE_URL,
    storageState: 'auth.json',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // air3dxpassport.atlascopco.group's cert chain isn't trusted by the OS
    // store (internal/corporate CA) — see note to the user about this.
    ignoreHTTPSErrors: true,
    // Give every click/fill/etc. and every navigation 60s instead of
    // Playwright's 30s default, since this app is slow to respond.
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
