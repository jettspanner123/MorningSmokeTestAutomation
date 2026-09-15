import PopupCheckTypeInterface from "./PopupCheckTypeInterface";

export default interface SmokePageTypeInterface {
    name: string;
    url: string;
    buttonSelector?: string;
    searchInputSelector?: string;
    searchTerm?: string;
    searchButtonSelector?: string;
    expectedResultSelector: string;
    minResultCount?: number;
    expectedCount?: number;
    hoverInfoSelector?: string;
    hoverTooltipSelector?: string;
    postResultsClickSelector?: string;
    popupChecks?: Array<PopupCheckTypeInterface>;
}