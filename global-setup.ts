import { chromium, type FullConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import { authConfig } from './smoke-tests.config';

dotenv.config();

async function globalSetup(config: FullConfig) {
  const baseURL = process.env.BASE_URL;
  const username = process.env.SMOKE_USER;
  const password = process.env.SMOKE_PASS;

  if (!baseURL || !username || !password) {
    throw new Error(
      'Missing BASE_URL, SMOKE_USER, or SMOKE_PASS. Copy .env.example to .env and fill in real values.'
    );
  }

  // Follow the same --headed flag the test runner resolved for the chromium
  // project, so this login browser is visible whenever `npm run test:headed` is used.
  const headless = config.projects[0]?.use?.headless ?? true;
  const browser = await chromium.launch({ headless });
  const page = await browser.newPage({ ignoreHTTPSErrors: true });
  // This page is created manually (outside the test runner's fixtures), so
  // it doesn't inherit playwright.config.ts's actionTimeout/navigationTimeout
  // — set the same generous defaults here for this legacy, slow-to-load app.
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);

  await page.goto(`${baseURL}${authConfig.loginPath}`);

  const usernameField = page.locator(authConfig.usernameSelector);
  const passwordField = page.locator(authConfig.passwordSelector);
  const submitButton = page.locator(authConfig.submitSelector);

  await usernameField.waitFor({ state: 'attached' });
  await usernameField.fill(username);
  await passwordField.waitFor({ state: 'attached' });
  await passwordField.fill(password);
  await submitButton.waitFor({ state: 'attached' });
  await submitButton.click();

  const errorLocator = page.locator(authConfig.errorSelector);
  await Promise.race([
    page.waitForURL(`${baseURL}${authConfig.successUrl}`, { timeout: 60000 }),
    errorLocator.waitFor({ state: 'visible', timeout: 60000 }).then(async () => {
      const message = await errorLocator.textContent();
      throw new Error(`Login failed: ${message?.trim() ?? 'unknown error'}`);
    }),
  ]);

  await page.context().storageState({ path: 'auth.json' });
  await browser.close();
}

export default globalSetup;
