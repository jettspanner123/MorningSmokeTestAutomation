import {chromium, type FullConfig} from '@playwright/test';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import boxen from 'boxen';
import AuthenticationConfiguration from "./Configurations/AuthenticationConfiguration";
import ENValidator from "./Validators/ENValidator";
import EnvironmentValueNegativeException from "./Exceptions/EnvironmentValueNegativeException";

dotenv.config()

async function globalSetup(config: FullConfig) {
    try {
        const {username, password, baseURL} = ENValidator.current.checkOrThrowRequiredENVariables();

        const headless = config.projects[0]?.use?.headless ?? true;
        const browser = await chromium.launch({headless});
        const page = await browser.newPage({ignoreHTTPSErrors: true});

        page.setDefaultTimeout(60000);
        page.setDefaultNavigationTimeout(60000);

        await page.goto(`${baseURL}${AuthenticationConfiguration.loginPath}`);

        const usernameField = page.locator(AuthenticationConfiguration.usernameSelector);
        const passwordField = page.locator(AuthenticationConfiguration.passwordSelector);
        const submitButton = page.locator(AuthenticationConfiguration.submitSelector);

        await usernameField.waitFor({state: 'attached'});
        await usernameField.fill(username);
        await passwordField.waitFor({state: 'attached'});
        await passwordField.fill(password);
        await submitButton.waitFor({state: 'attached'});
        await submitButton.click();

        const errorLocator = page.locator(AuthenticationConfiguration.errorSelector);
        await Promise.race([
            page.waitForURL(`${baseURL}${AuthenticationConfiguration.successUrl}`, {timeout: 60000}),
            errorLocator.waitFor({state: 'visible', timeout: 60000}).then(async () => {
                const message = await errorLocator.textContent();
                throw new Error(`Login failed: ${message?.trim() ?? 'unknown error'}`);
            }),
        ]);

        await page.context().storageState({path: 'auth.json'});
        await browser.close();
    } catch (error) {
        if (error instanceof EnvironmentValueNegativeException) {
            console.error(boxen(
                `${chalk.white(error.message)}\n\n` +
                `${chalk.cyan('💡 How to fix:')}\n` +
                `${chalk.cyan('   1. Copy .env.example → .env')}\n` +
                `${chalk.cyan('   2. Fill in the required environment variables')}\n` +
                `${chalk.cyan('   3. Run the smoke tests again')}`,
                {
                    title: chalk.red.bold('❌ ENVIRONMENT CONFIGURATION'),
                    titleAlignment: 'center',
                    padding: 1,
                    margin: 1,
                    borderStyle: 'round',
                    borderColor: 'red',
                }
            ));
        } else {
            // Anything else (login failure, timeout, network error, ...) used to
            // be silently swallowed here — global setup would appear to succeed
            // and every real test would then fail confusingly downstream instead
            // of a clear "setup failed" message. Print it clearly and exit instead.
            const actualError = error instanceof Error ? error : new Error(String(error));
            console.error(boxen(
                `${chalk.white(actualError.message)}\n\n` +
                `${chalk.dim(actualError.stack ?? '')}`,
                {
                    title: chalk.red.bold('❌ GLOBAL SETUP FAILED'),
                    titleAlignment: 'center',
                    padding: 1,
                    margin: 1,
                    borderStyle: 'round',
                    borderColor: 'red',
                }
            ));
        }

        process.exit(1);
    }
}

export default globalSetup;
