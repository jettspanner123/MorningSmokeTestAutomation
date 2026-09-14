// Login flow used once by global-setup.ts to establish the shared session.
export const authConfig = {
  loginPath: '/3dpassport/admin-tools/v2/login',
  usernameSelector: '#username',
  passwordSelector: '#password',
  submitSelector: 'input[data-dsp-i18n="commons.action.logIn"]',
  // Reached only after a real authenticated redirect — visiting this path
  // while logged out just bounces back to loginPath, so landing here for
  // real is a reliable signal that login succeeded.
  successUrl: '/3dpassport/admin-tools/v2',
  // Shown on the login page itself when credentials are rejected.
  errorSelector: '.error-messages',
};

export interface SmokePage {
  // Shown in the test report/title.
  name: string;
  // Absolute URL — pages can live on a different subdomain than the login
  // (e.g. air3dxspace vs air3dxpassport), so this is not appended to BASE_URL.
  url: string;
  // Optional: a button to click after navigating (e.g. to open a panel).
  buttonSelector?: string;
  // Optional: a search box to type into.
  searchInputSelector?: string;
  // Optional: the term to type into searchInputSelector.
  searchTerm?: string;
  // Optional: element that triggers the search when clicked. If omitted (but
  // searchTerm/searchInputSelector are set), Enter is pressed instead.
  searchButtonSelector?: string;
  // Required: element that must become visible for the page to count as "working".
  expectedResultSelector: string;
  // Optional: expectedResultSelector's text must parse as a number greater
  // than this (e.g. 0 to require "more than 0 results").
  minResultCount?: number;
  // Optional: clicked after the result-count check passes (e.g. a nav icon).
  postResultsClickSelector?: string;
  // Optional: waited for (then clicked) after postResultsClickSelector opens
  // a menu. Clicking it is expected to open a new browser tab, which is then
  // checked to make sure it actually loads.
  popupMenuItemSelector?: string;
}

// One entry per URL to smoke-test (checked after the shared login from
// global-setup.ts). Add one object per real page/flow as they're provided.
export const smokePages: SmokePage[] = [
  {
    name: '3DSpace search',
    url: 'https://air3dxspace.atlascopco.group/3dspace',
    searchInputSelector: 'input.sn-search-field',
    searchTerm: 'prd',
    searchButtonSelector: '[data-rec-id="run_btn_search"]',
    // The results-count element inside the "Results" panel that appears
    // once the search succeeds.
    expectedResultSelector: '#search-nb-result',
    // Must find more than 0 results for "prd".
    minResultCount: 0,
    // The compass nav icon, clicked after results are confirmed.
    postResultsClickSelector: '#compass_ctn',
    // The 3DDashboard entry in the compass menu — clicking it opens a new tab.
    popupMenuItemSelector: '[data-search="3DDashboard"]',
  },
];
