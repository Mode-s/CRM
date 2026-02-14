/**
 * FMT CRM - Admin Dashboard
 */
const AdminDashboardView = (() => {
    function render(container) {
        const requests = Store.getAll('requests');
        const sites = Store.getAll('sites');
        const agencies = Store.getAll('agencies');

        // --- Request stats ---
        const totalRequests = requests.length;
        const pending = requests.filter(r => r.status === 'pending').length;
        const deficiency = requests.filter(r => r.status === 'deficiency').length;
        const inprogress = requests.filter(r => r.status === 'inprogress').length;
        const completed = requests.filter(r => r.status === 'completed').length;
        const etRequests = requests.filter(r => r.status === 'et').length;
        const cancelled = requests.filter(r => r.status === 'cancelled').length;
        const activeAgencies = agencies.filter(a => a.is_active).length;

        // --- Rates ---
        const denominator = totalRequests - cancelled;
        const defRate = denominator > 0 ? Math.round((deficiency / denominator) * 100) : 0;
        const completionRate = denominator > 0 ? Math.round((completed / denominator) * 100) : 0;
        const lossRate = totalRequests > 0 ? Math.round((cancelled / totalRequests) * 100) : 0;

        // --- Acquired stats (completed + et) ---
        const acquiredRequests = requests.filter(r => r.status === 'completed' || r.status === 'et');
        const corpIds = [...new Set(acquiredRequests.map(r => r.corporation_id))];
        const totalCorps = corpIds.length;
        const etCorps = [...new Set(requests.filter(r => r.status === 'et').map(r => r.corporation_id))].length;

        const acquiredSites = sites.filter(s => s.status === 'completed' || s.status === 'et');
        const totalAcquiredSites = acquiredSites.filter(s => s.service_type !== 'gas').length;
        const etSites = acquiredSites.filter(s => s.status === 'et').length;
        const meteredSites = acquiredSites.filter(s => s.service_type === 'metered').length;
        const powerSites = acquiredSites.filter(s => s.service_type === 'power').length;
        const gasSites = acquiredSites.filter(s => s.service_type === 'gas').length;

        // --- KPI: Monthly target ---
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const targets = Store.query('monthlyTargets', t => t.year_month === currentMonth);
        const targetEt = targets.length > 0 ? targets[0].target_et : 0;
        const acquisitionRate = targetEt > 0 ? Math.round((etRequests / targetEt) * 100) : 0;

        // --- Agency stats ---
        const agencyStats = agencies.map(a => {
            const ar = requests.filter(r => r.agency_id === a.id);
            const aSites = ar.reduce((sum, r) => sum + Store.query('sites', s => s.request_id === r.id && (s.status === 'completed' || s.status === 'et') && s.service_type !== 'gas').length, 0);
            return {
                name: a.name,
                total: ar.length,
                deficiency: ar.filter(r => r.status === 'deficiency').length,
                completed: ar.filter(r => r.status === 'completed').length,
                et: ar.filter(r => r.status === 'et').length,
                sites: aSites
            };
        });

        // --- Recent activity ---
        const recentLogs = Store.getAll('auditLogs')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 10);

        // --- Status distribution ---
        const statusData = [
            { label: '対応待ち', value: pending, color: 'var(--status-pending, #9ca3af)' },
            { label: '対応中', value: inprogress, color: 'var(--status-inprogress)' },
            { label: '不備', value: deficiency, color: 'var(--status-deficiency)' },
            { label: '投入済', value: completed, color: 'var(--status-completed)' },
            { label: 'ET(成約)', value: etRequests, color: 'var(--status-et, #f59e0b)' },
            { label: 'キャンセル', value: cancelled, color: 'var(--status-cancelled)' }
        ];
        const maxVal = Math.max(...statusData.map(d => d.value), 1);

        container.innerHTML = `
            <div class="page-container">
                <div class="page-header">
                    <h1><i class="fas fa-tachometer-alt" style="color:var(--primary-500)"></i> ダッシュボード</h1>
                </div>

                <!-- Request Overview -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div><div class="stat-value">${totalRequests}</div><div class="stat-label">全依頼数</div></div>
                        <div class="stat-icon blue"><i class="fas fa-file-alt"></i></div>
                    </div>
                    <div class="stat-card">
                        <div><div class="stat-value" style="color:var(--status-inprogress)">${inprogress}</div><div class="stat-label">対応中</div></div>
                        <div class="stat-icon" style="background:#dbeafe;color:var(--status-inprogress)"><i class="fas fa-spinner"></i></div>
                    </div>
                    <div class="stat-card">
                        <div><div class="stat-value" style="color:var(--status-deficiency)">${deficiency}</div><div class="stat-label">不備</div></div>
                        <div class="stat-icon" style="background:#fee2e2;color:var(--status-deficiency)"><i class="fas fa-exclamation-circle"></i></div>
                    </div>
                    <div class="stat-card">
                        <div><div class="stat-value" style="color:var(--status-completed)">${completed}</div><div class="stat-label">投入済</div></div>
                        <div class="stat-icon green"><i class="fas fa-check-circle"></i></div>
                    </div>
                    <div class="stat-card">
                        <div><div class="stat-value" style="color:var(--status-et, #f59e0b)">${etRequests}</div><div class="stat-label">ET(成約)</div></div>
                        <div class="stat-icon" style="background:var(--status-et-bg, #fef3c7);color:var(--status-et, #f59e0b)"><i class="fas fa-trophy"></i></div>
                    </div>
                    <div class="stat-card">
                        <div><div class="stat-value">${activeAgencies}</div><div class="stat-label">有効代理店</div></div>
                        <div class="stat-icon gray"><i class="fas fa-building"></i></div>
                    </div>
                </div>

                <!-- Acquired Stats -->
                <div class="card mb-16">
                    <div class="card-header"><h3><i class="fas fa-trophy"></i> 獲得実績</h3></div>
                    <div class="card-body">
                        <div class="stats-grid" style="margin-bottom:0;">
                            <div class="stat-card">
                                <div><div class="stat-value" style="color:var(--status-completed)">${totalCorps}</div><div class="stat-label">全獲得法人</div></div>
                                <div class="stat-icon green"><i class="fas fa-building"></i></div>
                            </div>
                            <div class="stat-card">
                                <div><div class="stat-value" style="color:var(--status-et, #f59e0b)">${etCorps}</div><div class="stat-label">ET法人</div></div>
                                <div class="stat-icon" style="background:var(--status-et-bg, #fef3c7);color:var(--status-et, #f59e0b)"><i class="fas fa-trophy"></i></div>
                            </div>
                            <div class="stat-card">
                                <div><div class="stat-value" style="color:var(--status-et, #f59e0b)">${etSites}</div><div class="stat-label">ET地点数</div></div>
                                <div class="stat-icon" style="background:var(--status-et-bg, #fef3c7);color:var(--status-et, #f59e0b)"><i class="fas fa-map-marker-alt"></i></div>
                            </div>
                            <div class="stat-card">
                                <div><div class="stat-value" style="color:var(--primary-600)">${totalAcquiredSites}</div><div class="stat-label">全獲得地点数</div></div>
                                <div class="stat-icon blue"><i class="fas fa-map-marker-alt"></i></div>
                            </div>
                            <div class="stat-card">
                                <div><div class="stat-value" style="color:var(--warning)">${meteredSites}</div><div class="stat-label">従量</div></div>
                                <div class="stat-icon yellow"><i class="fas fa-bolt"></i></div>
                            </div>
                            <div class="stat-card">
                                <div><div class="stat-value" style="color:#e67e22">${powerSites}</div><div class="stat-label">動力</div></div>
                                <div class="stat-icon" style="background:#fef3e2;color:#e67e22"><i class="fas fa-industry"></i></div>
                            </div>
                            <div class="stat-card">
                                <div><div class="stat-value" style="color:#6366f1">${gasSites}</div><div class="stat-label">ガス</div></div>
                                <div class="stat-icon purple"><i class="fas fa-fire"></i></div>
                            </div>
                        </div>
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
                                <div>
                                    <div class="flex justify-between items-center mb-4">
                                        <span class="text-sm text-secondary">獲得率（ET / 目標）</span>
                                        <strong style="color:var(--status-et, #f59e0b)">${targetEt > 0 ? acquisitionRate + '%' : '目標未設定'}</strong>
                                    </div>
                                    ${targetEt > 0 ? `
                                        <div style="background:var(--gray-100);border-radius:999px;height:8px;overflow:hidden;">
                                            <div style="background:var(--status-et, #f59e0b);height:100%;width:${Math.min(acquisitionRate, 100)}%;border-radius:999px;transition:width 1s ease;"></div>
                                        </div>
                                        <div class="text-xs text-secondary mt-4">${etRequests} / ${targetEt} ET</div>
                                    ` : ''}
                                </div>
                                <div>
                                    <div class="flex justify-between items-center mb-4">
                                        <span class="text-sm text-secondary">失注率</span>
                                        <strong style="color:var(--status-cancelled)">${lossRate}%</strong>
                                    </div>
                                    <div style="background:var(--gray-100);border-radius:999px;height:8px;overflow:hidden;">
                                        <div style="background:var(--status-cancelled);height:100%;width:${lossRate}%;border-radius:999px;transition:width 1s ease;"></div>
                                    </div>
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
                                            ${d.value > 0 ? `
                                                <div style="background:${d.color};height:100%;width:${(d.value / maxVal) * 100}%;border-radius:999px;transition:width 1s ease;display:flex;align-items:center;justify-content:flex-end;padding-right:8px;">
                                                    <span style="color:white;font-size:0.7rem;font-weight:700;">${d.value}</span>
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Monthly Target Setting -->
                <div class="card mt-16">
                    <div class="card-header">
                        <h3><i class="fas fa-bullseye"></i> 月次目標設定（${currentMonth}）</h3>
                    </div>
                    <div class="card-body">
                        <div class="form-row" style="align-items:center;">
                            <div class="form-group" style="margin-bottom:0;">
                                <label class="form-label text-sm text-secondary">目標ET数</label>
                                <input type="number" class="form-input" id="target-et" value="${targetEt}" min="0" style="max-width:150px;">
                            </div>
                            <div style="padding-top:20px;">
                                <button class="btn btn-primary" onclick="AdminDashboardView.saveTarget()"><i class="fas fa-save"></i> 保存</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Agency Performance -->
                <div class="card mt-16">
                    <div class="card-header"><h3><i class="fas fa-chart-bar"></i> 代理店別実績</h3></div>
                    <div class="card-body">
                        <div class="table-container">
                            <table class="data-table">
                                <thead>
                                    <tr><th>代理店名</th><th>依頼件数</th><th>不備</th><th>投入済</th><th>ET</th><th>獲得地点</th></tr>
                                </thead>
                                <tbody>
                                    ${agencyStats.map(s => `
                                        <tr>
                                            <td><strong>${s.name}</strong></td>
                                            <td>${s.total}</td>
                                            <td style="color:var(--status-deficiency)">${s.deficiency}</td>
                                            <td style="color:var(--status-completed)">${s.completed}</td>
                                            <td style="color:var(--status-et, #f59e0b)">${s.et}</td>
                                            <td><strong>${s.sites}</strong></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
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

    function saveTarget() {
        const targetEt = parseInt(document.getElementById('target-et').value) || 0;
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const existing = Store.query('monthlyTargets', t => t.year_month === currentMonth);
        if (existing.length > 0) {
            Store.update('monthlyTargets', existing[0].id, { target_et: targetEt });
        } else {
            Store.create('monthlyTargets', { year_month: currentMonth, target_et: targetEt }, true);
        }
        Toast.show('月次目標を保存しました', 'success');
        Router.handleRoute();
    }

    return { render, saveTarget };
})();
