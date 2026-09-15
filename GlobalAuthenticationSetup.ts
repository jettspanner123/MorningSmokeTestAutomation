import { chromium, type FullConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import AuthenticationConfiguration from "./Configurations/AuthenticationConfiguration";

dotenv.config()

async function globalSetup(config: FullConfig) {
  const baseURL = process.env.BASE_URL;
  const username = process.env.SMOKE_USER;
  const password = process.env.SMOKE_PASS;

  if (!baseURL || !username || !password) {
    throw new Error(
      'Missing BASE_URL, SMOKE_USER, or SMOKE_PASS. Copy .env.example to .env and fill in real values.'
    );
  }

  const headless = config.projects[0]?.use?.headless ?? true;
  const browser = await chromium.launch({ headless });
  const page = await browser.newPage({ ignoreHTTPSErrors: true });

  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);

  await page.goto(`${baseURL}${AuthenticationConfiguration.loginPath}`);

  const usernameField = page.locator(AuthenticationConfiguration.usernameSelector);
  const passwordField = page.locator(AuthenticationConfiguration.passwordSelector);
  const submitButton = page.locator(AuthenticationConfiguration.submitSelector);

  await usernameField.waitFor({ state: 'attached' });
  await usernameField.fill(username);
  await passwordField.waitFor({ state: 'attached' });
  await passwordField.fill(password);
  await submitButton.waitFor({ state: 'attached' });
  await submitButton.click();

  const errorLocator = page.locator(AuthenticationConfiguration.errorSelector);
  await Promise.race([
    page.waitForURL(`${baseURL}${AuthenticationConfiguration.successUrl}`, { timeout: 60000 }),
    errorLocator.waitFor({ state: 'visible', timeout: 60000 }).then(async () => {
      const message = await errorLocator.textContent();
      throw new Error(`Login failed: ${message?.trim() ?? 'unknown error'}`);
    }),
  ]);

  await page.context().storageState({ path: 'auth.json' });
  await browser.close();
}

export default globalSetup;
