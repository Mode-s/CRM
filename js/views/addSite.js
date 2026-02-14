/**
 * FMT CRM - Add Site View
 * Add a new request to an existing corporation.
 */
const AddSiteView = (() => {
    function render(container) {
        // Redirect to new request for now (same form, pre-search)
        NewRequestView.render(container);
    }

    return { render };
})();
