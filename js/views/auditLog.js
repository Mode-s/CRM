/**
 * FMT CRM - Audit Log View (Admin only)
 */
const AuditLogView = (() => {
    function render(container) {
        const logs = Store.getAll('auditLogs').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const maxDisplay = 200;
        const displayLogs = logs.slice(0, maxDisplay);

        container.innerHTML = `
            <div class="page-container">
                <div class="page-header">
                    <h1><i class="fas fa-history" style="color:var(--primary-500)"></i> 監査ログ</h1>
                    <span class="text-sm text-secondary">${logs.length}件中 最新${Math.min(maxDisplay, logs.length)}件を表示</span>
                </div>

                <!-- Filters -->
                <div class="filters-bar">
                    <select class="form-select" id="log-filter-action" onchange="AuditLogView.applyFilter()">
                        <option value="">全アクション</option>
                        <option value="create">作成</option>
                        <option value="update">更新</option>
                        <option value="delete">削除</option>
                        <option value="status_change">ステータス変更</option>
                        <option value="login">ログイン</option>
                        <option value="logout">ログアウト</option>
                    </select>
                    <select class="form-select" id="log-filter-target" onchange="AuditLogView.applyFilter()">
                        <option value="">全対象</option>
                        <option value="agencies">代理店</option>
                        <option value="users">ユーザー</option>
                        <option value="requests">投入依頼</option>
                        <option value="corporations">法人</option>
                        <option value="sites">地点</option>
                        <option value="images">画像</option>
                        <option value="comments">コメント</option>
                    </select>
                    <span class="filter-count" id="log-count">${displayLogs.length}件</span>
                </div>

                <div class="table-container" id="log-table">
                    <table class="data-table">
                        <thead><tr><th>日時</th><th>ユーザー</th><th>アクション</th><th>対象</th><th>ID</th><th>詳細</th></tr></thead>
                        <tbody>
                            ${displayLogs.map(log => {
            const actionLabel = Audit.getActionLabel(log.action);
            const targetLabel = Audit.getTargetLabel(log.target_type);
            const date = new Date(log.created_at).toLocaleString('ja-JP');
            const changesStr = formatChanges(log.changes);
            return `
                                    <tr data-action="${log.action}" data-target="${log.target_type}">
                                        <td class="text-xs text-secondary">${date}</td>
                                        <td class="text-sm">${log.user_name || 'system'}</td>
                                        <td><span class="text-sm" style="font-weight:600;">${actionLabel}</span></td>
                                        <td class="text-sm">${targetLabel}</td>
                                        <td class="font-mono text-xs">${(log.target_id || '').substring(0, 8)}</td>
                                        <td class="text-xs">${changesStr}</td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function formatChanges(changes) {
        if (!changes || Object.keys(changes).length === 0) return '-';
        const entries = Object.entries(changes);
        return entries.slice(0, 3).map(([key, val]) => {
            if (typeof val === 'object' && val.before !== undefined) {
                return `<span style="color:var(--gray-500)">${key}:</span> ${val.before} → ${val.after}`;
            }
            return `<span style="color:var(--gray-500)">${key}:</span> ${JSON.stringify(val).substring(0, 40)}`;
        }).join('<br>') + (entries.length > 3 ? `<br><span class="text-xs text-secondary">+${entries.length - 3}件</span>` : '');
    }

    function applyFilter() {
        const actionFilter = document.getElementById('log-filter-action').value;
        const targetFilter = document.getElementById('log-filter-target').value;
        const rows = document.querySelectorAll('#log-table tbody tr');
        let count = 0;
        rows.forEach(row => {
            const matchAction = !actionFilter || row.dataset.action === actionFilter;
            const matchTarget = !targetFilter || row.dataset.target === targetFilter;
            if (matchAction && matchTarget) { row.style.display = ''; count++; } else { row.style.display = 'none'; }
        });
        document.getElementById('log-count').textContent = count + '件';
    }

    return { render, applyFilter };
})();
