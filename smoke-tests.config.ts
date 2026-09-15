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

export interface PopupCheck {
  // Optional: the compass has its own built-in item search, but the input
  // isn't in the DOM at all until compassSearchIconSelector is clicked to
  // reveal it — always click it first when these fields are set.
  compassSearchIconSelector?: string;
  compassSearchInputSelector?: string;
  // Term typed into compassSearchInputSelector (no Enter — it filters live).
  compassSearchTerm?: string;
  // Compass-menu item to click — the compass menu stays open between clicks,
  // so these are clicked in order without needing to reopen it each time.
  menuItemSelector: string;
  // Optional: element that must attach in the resulting new tab. If omitted,
  // the check falls back to just confirming the tab navigated somewhere
  // (its URL isn't blank).
  expectedElementSelector?: string;
  // Optional: close the popup tab once its check passes, before moving on
  // to the next popupCheck. Defaults to leaving it open.
  closePopupAfterCheck?: boolean;
}

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
  // than this (e.g. 0 to require "more than 0 results"). Mutually exclusive
  // with expectedCount — expectedResultSelector must match exactly one element.
  minResultCount?: number;
  // Optional: wait until expectedResultSelector matches exactly this many
  // elements (e.g. a fixed number of table rows appearing). Mutually
  // exclusive with minResultCount — use this when expectedResultSelector is
  // meant to match multiple elements rather than one.
  expectedCount?: number;
  // Optional: clicked after the result-count check passes (e.g. a nav icon
  // that opens a menu).
  postResultsClickSelector?: string;
  // Optional: menu items to click in order after postResultsClickSelector
  // opens its menu — each one is expected to open its own new browser tab.
  popupChecks?: PopupCheck[];
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
    popupChecks: [
      // Opens a new tab — just confirm it navigated somewhere.
      { menuItemSelector: '[data-search="3DDashboard"]' },
      // Opens a new tab — confirm the Communities tab actually rendered.
      { menuItemSelector: '[data-search="3DSwym"]', expectedElementSelector: '#communities-tab' },
      // Filters the compass via its own search box for "atlas", then opens
      // the Atlas Change Management widget in a new tab — confirm the
      // widget's own close button rendered (not tied to its dynamic instance id).
      {
        compassSearchIconSelector: '.compass-nav-search-icon',
        // Scoped to .input-group (the wrapper around this specific input +
        // its clear icon) — "compass-search-text"/"form-control" alone also
        // matched the main 3DSpace search bar (still holding "prd"), so
        // "atlas" was appending onto it ("prdatlas") instead of the real
        // compass filter input, which doesn't exist in the DOM at all until
        // compassSearchIconSelector is clicked.
        compassSearchInputSelector: '.input-group input.compass-search-text',
        compassSearchTerm: 'atlas',
        menuItemSelector: '[data-id="MAP-BWQLMZTMX"]',
        expectedElementSelector: '.close-icon.fonticon-cancel',
      },
      // These three reuse the "atlas" filter already applied above — the
      // compass sidebar stays filtered, no need to search again. Each opens
      // its own tab, checked, then closed before moving to the next one.
      {
        menuItemSelector: '[data-id="MAP-HUFLWVWPC"]',
        expectedElementSelector: '.close-icon.fonticon-cancel',
        closePopupAfterCheck: true,
      },
      {
        menuItemSelector: '[data-id="MAP-APEPFZXTT"]',
        expectedElementSelector: '.close-icon.fonticon-cancel',
        closePopupAfterCheck: true,
      },
      {
        menuItemSelector: '[data-id="MAP-EYBLVBWUR"]',
        expectedElementSelector: '.close-icon.fonticon-cancel',
        closePopupAfterCheck: true,
      },
    ],
  },
  {
    // Also authenticates via the shared 3DPassport login — no separate auth
    // needed, the storageState session already covers this host.
    name: 'XPDMGW Queue Status',
    url: 'http://air3dxgw1srv.atlascopco.group:8050/XPDMGW/',
    // The table starts with only the header row (th's, no td's) until the 7
    // category rows (Blocking, Waiting for Processing, In Processing, File
    // Transfer, Queued, Finished, Cancelled) load in — one td.left_align per row.
    expectedResultSelector: '#q_table td.left_align',
    expectedCount: 7,
  },
];
