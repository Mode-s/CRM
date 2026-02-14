/**
 * FMT CRM - Agency Stats View
 */
const AgencyStatsView = (() => {
    function render(container) {
        const agencies = Store.getAll('agencies');
        const requests = Store.getAll('requests');

        const stats = agencies.map(a => {
            const agencyRequests = requests.filter(r => r.agency_id === a.id);
            const deficiency = agencyRequests.filter(r => r.status === 'deficiency').length;
            const inprogress = agencyRequests.filter(r => r.status === 'inprogress').length;
            const completed = agencyRequests.filter(r => r.status === 'completed').length;
            const cancelled = agencyRequests.filter(r => r.status === 'cancelled').length;
            const totalSites = agencyRequests.reduce((sum, r) => sum + Store.query('sites', s => s.request_id === r.id && (s.status === 'completed' || s.status === 'et') && s.service_type !== 'gas').length, 0);
            const defRate = agencyRequests.length > 0 ? Math.round((deficiency / agencyRequests.length) * 100) : 0;

            return { agency: a, total: agencyRequests.length, deficiency, inprogress, completed, cancelled, totalSites, defRate };
        });

        const totalRequests = requests.length;
        const totalCompleted = requests.filter(r => r.status === 'completed').length;
        const totalSites = stats.reduce((s, st) => s + st.totalSites, 0);

        container.innerHTML = `
            <div class="page-container">
                <div class="page-header">
                    <h1><i class="fas fa-chart-bar" style="color:var(--primary-500)"></i> 代理店別数値</h1>
                </div>

                <div class="stats-grid">
                    <div class="stat-card"><div><div class="stat-value">${totalRequests}</div><div class="stat-label">全依頼数</div></div><div class="stat-icon blue"><i class="fas fa-file-alt"></i></div></div>
                    <div class="stat-card"><div><div class="stat-value" style="color:var(--status-completed)">${totalCompleted}</div><div class="stat-label">投入済</div></div><div class="stat-icon green"><i class="fas fa-check-circle"></i></div></div>
                    <div class="stat-card"><div><div class="stat-value" style="color:var(--primary-600)">${totalSites}</div><div class="stat-label">獲得地点数</div></div><div class="stat-icon purple"><i class="fas fa-map-marker-alt"></i></div></div>
                    <div class="stat-card"><div><div class="stat-value">${agencies.length}</div><div class="stat-label">代理店数</div></div><div class="stat-icon gray"><i class="fas fa-building"></i></div></div>
                </div>

                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr><th>代理店名</th><th>依頼件数</th><th>不備</th><th>対応中</th><th>投入済</th><th>獲得地点</th><th>不備率</th></tr>
                        </thead>
                        <tbody>
                            ${stats.map(s => `
                                <tr>
                                    <td><strong>${s.agency.name}</strong></td>
                                    <td>${s.total}</td>
                                    <td style="color:var(--status-deficiency)">${s.deficiency}</td>
                                    <td style="color:var(--status-inprogress)">${s.inprogress}</td>
                                    <td style="color:var(--status-completed)">${s.completed}</td>
                                    <td><strong>${s.totalSites}</strong></td>
                                    <td>
                                        <span style="color:${s.defRate > 20 ? 'var(--error)' : s.defRate > 10 ? 'var(--warning)' : 'var(--success)'}">
                                            ${s.defRate}%
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    return { render };
})();
