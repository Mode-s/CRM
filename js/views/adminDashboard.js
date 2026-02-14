/**
 * FMT CRM - Admin Dashboard
 */
const AdminDashboardView = (() => {
    function render(container) {
        const requests = Store.getAll('requests');
        const sites = Store.getAll('sites');
        const agencies = Store.getAll('agencies');
        const users = Store.getAll('users');

        // Count stats
        const totalRequests = requests.length;
        const deficiency = requests.filter(r => r.status === 'deficiency').length;
        const inprogress = requests.filter(r => r.status === 'inprogress').length;
        const completed = requests.filter(r => r.status === 'completed').length;
        const cancelled = requests.filter(r => r.status === 'cancelled').length;
        const totalSites = sites.filter(s => s.status === 'completed').length;
        const activeAgencies = agencies.filter(a => a.is_active).length;
        const totalUsers = users.length;

        // Deficiency rate
        const denominator = totalRequests - cancelled;
        const defRate = denominator > 0 ? Math.round((deficiency / denominator) * 100) : 0;
        const completionRate = denominator > 0 ? Math.round((completed / denominator) * 100) : 0;

        // Recent activity (last 10 logs)
        const recentLogs = Store.getAll('auditLogs')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 10);

        // Status distribution for simple bar chart
        const statusData = [
            { label: '対応中', value: inprogress, color: 'var(--status-inprogress)' },
            { label: '不備', value: deficiency, color: 'var(--status-deficiency)' },
            { label: '投入済', value: completed, color: 'var(--status-completed)' },
            { label: 'キャンセル', value: cancelled, color: 'var(--status-cancelled)' }
        ];
        const maxVal = Math.max(...statusData.map(d => d.value), 1);

        container.innerHTML = `
            <div class="page-container">
                <div class="page-header">
                    <h1><i class="fas fa-tachometer-alt" style="color:var(--primary-500)"></i> ダッシュボード</h1>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div><div class="stat-value">${totalRequests}</div><div class="stat-label">全依頼数</div></div>
                        <div class="stat-icon blue"><i class="fas fa-file-alt"></i></div>
                    </div>
                    <div class="stat-card">
                        <div><div class="stat-value" style="color:var(--status-completed)">${completed}</div><div class="stat-label">投入済</div></div>
                        <div class="stat-icon green"><i class="fas fa-check-circle"></i></div>
                    </div>
                    <div class="stat-card">
                        <div><div class="stat-value" style="color:var(--primary-600)">${totalSites}</div><div class="stat-label">獲得地点数</div></div>
                        <div class="stat-icon purple"><i class="fas fa-map-marker-alt"></i></div>
                    </div>
                    <div class="stat-card">
                        <div><div class="stat-value">${activeAgencies}</div><div class="stat-label">有効代理店</div></div>
                        <div class="stat-icon gray"><i class="fas fa-building"></i></div>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                    <!-- KPI Cards -->
                    <div class="card">
                        <div class="card-header"><h3><i class="fas fa-chart-pie"></i> KPI</h3></div>
                        <div class="card-body">
                            <div style="display:grid;gap:16px;">
                                <div>
                                    <div class="flex justify-between items-center mb-4">
                                        <span class="text-sm text-secondary">完了率</span>
                                        <strong style="color:var(--status-completed)">${completionRate}%</strong>
                                    </div>
                                    <div style="background:var(--gray-100);border-radius:999px;height:8px;overflow:hidden;">
                                        <div style="background:var(--status-completed);height:100%;width:${completionRate}%;border-radius:999px;transition:width 1s ease;"></div>
                                    </div>
                                </div>
                                <div>
                                    <div class="flex justify-between items-center mb-4">
                                        <span class="text-sm text-secondary">不備率</span>
                                        <strong style="color:${defRate > 20 ? 'var(--error)' : defRate > 10 ? 'var(--warning)' : 'var(--success)'}">${defRate}%</strong>
                                    </div>
                                    <div style="background:var(--gray-100);border-radius:999px;height:8px;overflow:hidden;">
                                        <div style="background:${defRate > 20 ? 'var(--error)' : defRate > 10 ? 'var(--warning)' : 'var(--success)'};height:100%;width:${defRate}%;border-radius:999px;transition:width 1s ease;"></div>
                                    </div>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-sm text-secondary">ユーザー数</span>
                                    <strong>${totalUsers}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Status Distribution -->
                    <div class="card">
                        <div class="card-header"><h3><i class="fas fa-chart-bar"></i> ステータス分布</h3></div>
                        <div class="card-body">
                            <div style="display:flex;flex-direction:column;gap:12px;">
                                ${statusData.map(d => `
                                    <div>
                                        <div class="flex justify-between items-center mb-4">
                                            <span class="text-sm">${d.label}</span>
                                            <strong class="text-sm">${d.value}</strong>
                                        </div>
                                        <div style="background:var(--gray-100);border-radius:999px;height:24px;overflow:hidden;">
                                            <div style="background:${d.color};height:100%;width:${Math.max((d.value / maxVal) * 100, 2)}%;border-radius:999px;transition:width 1s ease;display:flex;align-items:center;justify-content:flex-end;padding-right:8px;">
                                                <span style="color:white;font-size:0.7rem;font-weight:700;">${d.value}</span>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="card mt-16">
                    <div class="card-header">
                        <h3><i class="fas fa-history"></i> 最近のアクティビティ</h3>
                        <button class="btn btn-sm btn-ghost" onclick="Router.navigate('/audit-log')"><i class="fas fa-external-link-alt"></i> 全て見る</button>
                    </div>
                    <div class="card-body">
                        ${recentLogs.length === 0 ? '<p class="text-secondary">アクティビティなし</p>' : `
                            <div style="display:flex;flex-direction:column;gap:8px;">
                                ${recentLogs.map(log => `
                                    <div class="flex justify-between items-center" style="padding:8px 0;border-bottom:1px solid var(--gray-100);">
                                        <div class="flex items-center gap-8">
                                            <i class="fas fa-${log.action === 'create' ? 'plus-circle' : log.action === 'update' ? 'edit' : log.action === 'status_change' ? 'exchange-alt' : log.action === 'login' ? 'sign-in-alt' : 'circle'}" style="color:var(--gray-400);"></i>
                                            <span class="text-sm"><strong>${log.user_name || 'system'}</strong> が ${Audit.getTargetLabel(log.target_type)}を${Audit.getActionLabel(log.action)}</span>
                                        </div>
                                        <span class="text-xs text-secondary">${new Date(log.created_at).toLocaleString('ja-JP')}</span>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    return { render };
})();
