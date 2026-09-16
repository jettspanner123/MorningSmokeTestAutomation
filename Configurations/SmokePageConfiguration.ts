import SmokePageTypeInterface from "../Types/SmokePageTypeInterface";

const SmokePageConfiguration: Array<SmokePageTypeInterface> = [
    {
        name: '3DSpace search',
        url: 'https://air3dxspace.atlascopco.group/3dspace',
        recordPageLoadCheck: true,
        searchInputSelector: 'input.sn-search-field',
        searchTerm: 'prd',
        searchButtonSelector: '[data-rec-id="run_btn_search"]',
        expectedResultSelector: '#search-nb-result',
        minResultCount: 0,
        hoverInfoSelector: '[data-rec-id="SNResultMgt_wux-ui-3ds_wux-ui-3ds-1x_wux-ui-3ds-help"]',
        hoverTooltipSelector: '.maximumResultsTooltip',
        recordIndexingFreshnessCheck: true,
        postResultsClickSelector: '#compass_ctn',
        popupChecks: [
            { menuItemSelector: '[data-search="3DDashboard"]' },
            { menuItemSelector: '[data-search="3DSwym"]', expectedElementSelector: '#communities-tab' },
            {
                compassSearchIconSelector: '.compass-nav-search-icon',
                compassSearchInputSelector: '.input-group input.compass-search-text',
                compassSearchTerm: 'atlas',
                menuItemSelector: '[data-id="MAP-BWQLMZTMX"]',
                expectedElementSelector: '.close-icon.fonticon-cancel',
            },
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
        name: 'XPDMGW Queue Status',
        url: 'http://air3dxgw1srv.atlascopco.group:8050/XPDMGW/',
        expectedResultSelector: '#q_table td.left_align',
        expectedCount: 7,
    },
    {
        name: '3DEXPERIENCE Platform GW Queue Status',
        url: 'http://air3dxxpdmgw1srv.atlascopco.group:8040/3DEXPERIENCEPlatformGW',
        expectedResultSelector: '#q_table td.left_align',
        expectedCount: 5,
    },
];

export default SmokePageConfiguration;