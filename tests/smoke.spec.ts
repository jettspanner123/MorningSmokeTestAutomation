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
      // The search box can take a long time to load/hydrate on this app —
      // wait for it to actually be visible before typing into it.
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
    // The results panel can take a while to appear too — same generous
    // timeout as the search box above.
    await resultLocator.waitFor({ state: 'visible', timeout: 60000 });

    if (pageConfig.minResultCount !== undefined) {
      // The count can still read "0" for a moment right as the panel becomes
      // visible (it fills in asynchronously) — poll instead of a single read.
      await expect
        .poll(async () => Number((await resultLocator.textContent())?.trim() ?? '0'), {
          timeout: 60000,
        })
        .toBeGreaterThan(pageConfig.minResultCount);
    }

    if (pageConfig.postResultsClickSelector) {
      const postResultsButton = page.locator(pageConfig.postResultsClickSelector);
      await postResultsButton.waitFor({ state: 'attached' });
      await postResultsButton.click();
    }

    if (pageConfig.popupMenuItemSelector) {
      // .first(): the compass menu can render the same item twice (e.g. a
      // "favorites" duplicate with data-favorite-order set) — either is fine
      // to click, so take the first match instead of erroring on ambiguity.
      const menuItem = page.locator(pageConfig.popupMenuItemSelector).first();
      // 'attached' (DOM presence) rather than 'visible' (CSS-visible) — this
      // only needs to exist on the page, not be within the viewport; .click()
      // below still auto-scrolls it into view and re-checks real clickability.
      await menuItem.waitFor({ state: 'attached', timeout: 60000 });

      const [popup] = await Promise.all([
        page.context().waitForEvent('page'),
        menuItem.click(),
      ]);
      await popup.waitForLoadState('load');
      expect(popup.url()).not.toBe('about:blank');
    }
  });
}
