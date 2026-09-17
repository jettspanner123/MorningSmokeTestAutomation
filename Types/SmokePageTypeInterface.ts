import PopupCheckTypeInterface from "./PopupCheckTypeInterface";

export default interface SmokePageTypeInterface {
    name: string;
    url: string;
    // Opt-in: records a PageLoadCheck (MD_PageLoadCheckTBL) right after this
    // page's initial goto(), using `name` as the pageName column.
    recordPageLoadCheck?: boolean;
    buttonSelector?: string;
    searchInputSelector?: string;
    searchTerm?: string;
    searchButtonSelector?: string;
    expectedResultSelector: string;
    minResultCount?: number;
    expectedCount?: number;
    hoverInfoSelector?: string;
    hoverTooltipSelector?: string;
    // Opt-in: records an IndexingFreshnessCheck (MD_IndexingFreshnessCheckTBL)
    // combining the result count and the tooltip's indexing time/freshness.
    // Requires hoverInfoSelector/hoverTooltipSelector and minResultCount to
    // also be set, since it reuses their computed values.
    recordIndexingFreshnessCheck?: boolean;
    // Opt-in: parses every row of the table at queueStatusTableSelector
    // (one row per state, e.g. Blocking/Finished/...) and writes them all to
    // the shared QueueStatusCheck table (MD_QueueStatusCheckTBL), using
    // `name` as the pageName column. Requires queueStatusTableSelector.
    recordQueueStatusCheck?: boolean;
    queueStatusTableSelector?: string;
    postResultsClickSelector?: string;
    popupChecks?: Array<PopupCheckTypeInterface>;
}