import { test, expect } from '@playwright/test';
import { smokePages } from '../smoke-tests.config';

for (const pageConfig of smokePages) {
  test(`Smoke: ${pageConfig.name}`, async ({ page }) => {
    await page.goto(pageConfig.url);

    if (pageConfig.buttonSelector) {
      const button = page.locator(pageConfig.buttonSelector);
      await button.waitFor({ state: 'attached' });
      await button.click();
    }

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

    const resultLocator = page.locator(pageConfig.expectedResultSelector);

    if (pageConfig.expectedCount !== undefined) {
      await expect(resultLocator).toHaveCount(pageConfig.expectedCount, { timeout: 60000 });
    } else {
      await resultLocator.waitFor({ state: 'visible', timeout: 60000 });

      if (pageConfig.minResultCount !== undefined) {
        // The count can still read "0" for a moment right as the panel
        // becomes visible (it fills in asynchronously) — poll instead of a
        // single read.
        await expect
          .poll(async () => Number((await resultLocator.textContent())?.trim() ?? '0'), {
            timeout: 60000,
          })
          .toBeGreaterThan(pageConfig.minResultCount);
      }
    }

    if (pageConfig.postResultsClickSelector) {
      const postResultsButton = page.locator(pageConfig.postResultsClickSelector);
      await postResultsButton.waitFor({ state: 'attached' });
      await postResultsButton.click();
    }

    // The compass menu stays open between clicks, so these run in order
    // against the same open menu without reopening postResultsClickSelector.
    for (const popupCheck of pageConfig.popupChecks ?? []) {
      if (popupCheck.compassSearchInputSelector && popupCheck.compassSearchTerm) {
        // The input isn't in the DOM at all until the icon is clicked — a
        // same-selector element already exists elsewhere on the page (the
        // main search bar), so a "does it already exist" pre-check falsely
        // matched that instead and skipped clicking the icon. Always click it.
        if (popupCheck.compassSearchIconSelector) {
          const searchIcon = page.locator(popupCheck.compassSearchIconSelector);
          await searchIcon.waitFor({ state: 'attached' });
          await searchIcon.click();
        }

        const compassSearchInput = page.locator(popupCheck.compassSearchInputSelector);
        await compassSearchInput.waitFor({ state: 'attached' });
        // This input may stay CSS-invisible even once attached — force
        // bypasses Playwright's visibility check for this deliberate case only.
        await compassSearchInput.fill(popupCheck.compassSearchTerm, { force: true });
      }

      // .first(): the compass menu can render the same item twice (e.g. a
      // "favorites" duplicate with data-favorite-order set) — either is fine
      // to click, so take the first match instead of erroring on ambiguity.
      const menuItem = page.locator(popupCheck.menuItemSelector).first();
      // 'attached' (DOM presence) rather than 'visible' (CSS-visible) — this
      // only needs to exist on the page, not be within the viewport; .click()
      // below still auto-scrolls it into view and re-checks real clickability.
      await menuItem.waitFor({ state: 'attached' });

      const [popup] = await Promise.all([
        page.context().waitForEvent('page'),
        menuItem.click(),
      ]);
      await popup.waitForLoadState('load');

      if (popupCheck.expectedElementSelector) {
        await popup.locator(popupCheck.expectedElementSelector).first().waitFor({ state: 'attached' });
      } else {
        expect(popup.url()).not.toBe('about:blank');
      }

      if (popupCheck.closePopupAfterCheck) {
        await popup.close();
      }
    }
  });
}
