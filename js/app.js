/**
 * FMT CRM - App Initialization
 */
const App = (() => {
    function init() {
        // Initialize seed data
        Seed.initialize();

        // Define routes
        defineRoutes();

        // Render header
        Header.render();

        // Start router
        Router.init();
    }

    function defineRoutes() {
        Router.define('/login', LoginView.render, ['sales', 'operator', 'admin']);
        Router.define('/my-requests', SalesHomeView.render, ['sales', 'admin']);
        Router.define('/new-request', NewRequestView.render, ['sales', 'admin']);
        Router.define('/add-site', AddSiteView.render, ['sales', 'admin']);
        Router.define('/deficiency', DeficiencyView.render, ['sales', 'admin']);
        Router.define('/cases', OperatorHomeView.render, ['operator', 'admin']);
        Router.define('/case', CaseDetailView.render, ['operator', 'admin']);
        Router.define('/acquired', AcquiredListView.render, ['sales', 'operator', 'admin']);
        Router.define('/agencies', AgencyManageView.render, ['admin']);
        Router.define('/users', UserManageView.render, ['admin']);
        Router.define('/agency-stats', AgencyStatsView.render, ['operator', 'admin']);
        Router.define('/audit-log', AuditLogView.render, ['admin']);
        Router.define('/dashboard', AdminDashboardView.render, ['admin']);
    }

    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { init };
})();
