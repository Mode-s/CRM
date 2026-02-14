/**
 * FMT CRM - App Initialization
 */
const App = (() => {
    function init() {
        // Initialize seed data
        Seed.initialize();

        // Run data migrations
        runMigrations();

        // Auto-save monthly stats
        autoSaveMonthlyStats();

        // Define routes
        defineRoutes();

        // Render header
        Header.render();

        // Start router
        Router.init();
    }

    function runMigrations() {
        const MIGRATION_KEY = 'fmt_migration_v2';
        if (localStorage.getItem(MIGRATION_KEY) === 'done') return;

        // 1. Migrate service_type: 'electric' -> 'metered'
        const sites = Store.getAll('sites');
        sites.forEach(s => {
            if (s.service_type === 'electric') {
                Store.update('sites', s.id, { service_type: 'metered' }, true);
            }
        });

        // 2. Merge street + building_name for corporations
        const corps = Store.getAll('corporations');
        corps.forEach(c => {
            const updates = {};
            if (c.building_name) {
                updates.street = ((c.street || '') + ' ' + c.building_name).trim();
                updates.building_name = '';
            }
            if (c.billing_building) {
                updates.billing_street = ((c.billing_street || '') + ' ' + c.billing_building).trim();
                updates.billing_building = '';
            }
            if (Object.keys(updates).length > 0) {
                Store.update('corporations', c.id, updates, true);
            }
        });

        // 3. Merge power_street + power_building_name for sites
        const allSites = Store.getAll('sites');
        allSites.forEach(s => {
            if (s.power_building_name) {
                Store.update('sites', s.id, {
                    power_street: ((s.power_street || '') + ' ' + s.power_building_name).trim(),
                    power_building_name: ''
                }, true);
            }
        });

        localStorage.setItem(MIGRATION_KEY, 'done');
        console.log('Migration v2 completed.');
    }

    function autoSaveMonthlyStats() {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Check previous month
        const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

        // Check if previous month already saved
        const existingStats = Store.query('monthlyStats', s => s.year_month === prevMonth);
        if (existingStats.length > 0) return;

        // Only save if app has been used (has requests)
        const requests = Store.getAll('requests');
        if (requests.length === 0) return;

        const sites = Store.getAll('sites');
        const totalRequests = requests.length;
        const completed = requests.filter(r => r.status === 'completed').length;
        const etCount = requests.filter(r => r.status === 'et').length;
        const cancelled = requests.filter(r => r.status === 'cancelled').length;
        const acquiredSites = sites.filter(s => (s.status === 'completed' || s.status === 'et') && s.service_type !== 'gas').length;

        // Get target for this month
        const targets = Store.query('monthlyTargets', t => t.year_month === prevMonth);
        const targetEt = targets.length > 0 ? targets[0].target_et : 0;
        const acquisitionRate = targetEt > 0 ? Math.round((etCount / targetEt) * 100) : 0;
        const lossRate = totalRequests > 0 ? Math.round((cancelled / totalRequests) * 100) : 0;

        Store.create('monthlyStats', {
            year_month: prevMonth,
            total_requests: totalRequests,
            completed,
            et_count: etCount,
            cancelled,
            acquired_sites: acquiredSites,
            target_et: targetEt,
            acquisition_rate: acquisitionRate,
            loss_rate: lossRate
        }, true);

        console.log(`Monthly stats saved for ${prevMonth}`);
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
