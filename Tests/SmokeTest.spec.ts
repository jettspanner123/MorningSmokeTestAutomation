import { test, expect } from '@playwright/test';
import SmokePageConfiguration from "../Configurations/SmokePageConfiguration";
import ApplicationDateTimeHelper from "../Helpers/ApplicationDateTimeHelper";
import ApplicationDatabaseService from "../Services/DatabaseServices/ApplicationDatabaseService";
import TestRunIdHelper from "../Helpers/TestRunIdHelper";

const MAX_INDEXING_STALENESS_MINUTES = 30;

for (const pageConfig of SmokePageConfiguration) {
  test(`Smoke: ${pageConfig.name}`, async ({ page }) => {
    // Open the page we're testing. If configured, also record whether it
    // loaded (success or failure) to the shared PageLoadCheck table.
    if (pageConfig.recordPageLoadCheck) {
      const testRunId = TestRunIdHelper.current.read();

      try {
        const response = await page.goto(pageConfig.url);
        const statusCode = response?.status() ?? null;
        const success = response?.ok() ?? true;
        const message = success
          ? `Page loaded successfully${statusCode ? ` (HTTP ${statusCode}).` : '.'}`
          : `Page responded with HTTP ${statusCode}.`;

        await ApplicationDatabaseService.current.recordPageLoadCheck({
          testRunId,
          pageName: pageConfig.name,
          success,
          message,
          statusCode,
        });
      } catch (gotoError) {
        const message = gotoError instanceof Error ? gotoError.message : String(gotoError);
        await ApplicationDatabaseService.current.recordPageLoadCheck({
          testRunId,
          pageName: pageConfig.name,
          success: false,
          message,
          statusCode: null,
        });
        throw gotoError;
      }
    } else {
      await page.goto(pageConfig.url);
    }

    // If a button is configured, wait for it to show up and click it.
    if (pageConfig.buttonSelector) {
      const button = page.locator(pageConfig.buttonSelector);
      await button.waitFor({ state: 'attached' });
      await button.click();
    }

    // If a search box is configured, type the search term in and submit it.
    if (pageConfig.searchInputSelector && pageConfig.searchTerm) {
      const searchInput = page.locator(pageConfig.searchInputSelector);
      await searchInput.waitFor({ state: 'visible', timeout: 60000 });
      await searchInput.fill(pageConfig.searchTerm);
      if (pageConfig.searchButtonSelector) {
        const searchButton = page.locator(pageConfig.searchButtonSelector);
        await searchButton.waitFor({ state: 'attached' });
        await searchButton.click();
      } else {
        await searchInput.press('Enter');
      }
    }

    // Check that the page actually produced the expected outcome — either a
    // specific number of matching items, or one visible element (optionally
    // with a minimum number shown inside it).
    const resultLocator = page.locator(pageConfig.expectedResultSelector);
    let resultCount = 0;

    if (pageConfig.expectedCount !== undefined) {
      await expect(resultLocator).toHaveCount(pageConfig.expectedCount, { timeout: 60000 });
      resultCount = pageConfig.expectedCount;
    } else {
      await resultLocator.waitFor({ state: 'visible', timeout: 60000 });

      if (pageConfig.minResultCount !== undefined) {
        await expect
          .poll(async () => Number((await resultLocator.textContent())?.trim() ?? '0'), {
            timeout: 60000,
          })
          .toBeGreaterThan(pageConfig.minResultCount);
      }

      resultCount = Number((await resultLocator.textContent())?.trim() ?? '0');
    }

    // If an info icon is configured, hover it, read its tooltip out loud
    // (in the console), and flag whether the indexing time it reports is
    // recent or stale — just informational, doesn't fail the test.
    if (pageConfig.hoverInfoSelector && pageConfig.hoverTooltipSelector) {
      const infoIcon = page.locator(pageConfig.hoverInfoSelector).first();
      await infoIcon.waitFor({ state: 'attached' });
      await infoIcon.hover();

      const tooltip = page.locator(pageConfig.hoverTooltipSelector);
      await tooltip.waitFor({ state: 'visible' });
      const tooltipText = (await tooltip.textContent())?.trim() ?? '';
      console.log(`[${pageConfig.name}] Info tooltip contents:`, tooltipText);

      const indexingTime = ApplicationDateTimeHelper.current.parseTimeOfDay(tooltipText);
      if (indexingTime) {
        const machineTime = new Date();
        const diffMinutes = ApplicationDateTimeHelper.current.minutesOfDayDiff(indexingTime, machineTime);
        const isFresh = diffMinutes <= MAX_INDEXING_STALENESS_MINUTES;
        const formattedIndexingTime = indexingTime.toLocaleTimeString();
        const freshnessMessage = isFresh
          ? `Indexing time ${formattedIndexingTime} is fresh (${diffMinutes.toFixed(1)}m from now, threshold ${MAX_INDEXING_STALENESS_MINUTES}m).`
          : `Indexing time ${formattedIndexingTime} is stale (${diffMinutes.toFixed(1)}m from now, threshold ${MAX_INDEXING_STALENESS_MINUTES}m).`;

        console.log(`${isFresh ? '✅' : '❌'} [${pageConfig.name}] ${freshnessMessage}`);

        if (pageConfig.recordIndexingFreshnessCheck) {
          await ApplicationDatabaseService.current.recordIndexingFreshnessCheck({
            testRunId: TestRunIdHelper.current.read(),
            resultCount,
            indexTime: indexingTime,
            machineTime,
            timeDifference: diffMinutes,
            isFresh,
            message: freshnessMessage,
          });
        }
      }
    }

    // If configured, click the button that opens a menu once results are in
    // (e.g. the compass nav icon).
    if (pageConfig.postResultsClickSelector) {
      const postResultsButton = page.locator(pageConfig.postResultsClickSelector);
      await postResultsButton.waitFor({ state: 'attached' });
      await postResultsButton.click();
    }

    // Go through each menu item we're told to check, one at a time.
    for (const popupCheck of pageConfig.popupChecks ?? []) {
      // If this item needs the menu's own search box filled in first, reveal
      // it (if needed) and type the filter term into it.
      if (popupCheck.compassSearchInputSelector && popupCheck.compassSearchTerm) {
        if (popupCheck.compassSearchIconSelector) {
          const searchIcon = page.locator(popupCheck.compassSearchIconSelector);
          await searchIcon.waitFor({ state: 'attached' });
          await searchIcon.click();
        }

        const compassSearchInput = page.locator(popupCheck.compassSearchInputSelector);
        await compassSearchInput.waitFor({ state: 'attached' });
        await compassSearchInput.fill(popupCheck.compassSearchTerm, { force: true });
      }

      // Click the menu item and grab the new browser tab it opens.
      const menuItem = page.locator(popupCheck.menuItemSelector).first();
      await menuItem.waitFor({ state: 'attached' });

      const [popup] = await Promise.all([
        page.context().waitForEvent('page'),
        menuItem.click(),
      ]);
      await popup.waitForLoadState('load');

      // Confirm the new tab actually shows the expected content, or at
      // least that it navigated somewhere real.
      if (popupCheck.expectedElementSelector) {
        await popup.locator(popupCheck.expectedElementSelector).first().waitFor({ state: 'attached' });
      } else {
        expect(popup.url()).not.toBe('about:blank');
      }

      // Close the new tab if we're told we're done with it.
      if (popupCheck.closePopupAfterCheck) {
        await popup.close();
      }
    }
  });
}
