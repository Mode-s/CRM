/**
 * FMT CRM - Operator Home (Cases List)
 * Row click navigates to case detail. Filters by status/agency/search.
 */
const OperatorHomeView = (() => {
    function render(container) {
        let requests = Store.getAll('requests');
        requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        const counts = {
            all: requests.length,
            deficiency: requests.filter(r => r.status === 'deficiency').length,
            pending: requests.filter(r => r.status === 'pending').length,
            inprogress: requests.filter(r => r.status === 'inprogress').length,
            completed: requests.filter(r => r.status === 'completed').length,
            et: requests.filter(r => r.status === 'et').length,

            cancelled: requests.filter(r => r.status === 'cancelled').length
        };

        const etSites = requests
            .filter(r => r.status === 'et')
            .reduce((sum, r) => sum + (Store.query('sites', s => s.request_id === r.id).length || 0), 0);

        container.innerHTML = `
            <div class="page-container">
                <div class="page-header">
                    <h1><i class="fas fa-inbox" style="color:var(--primary-500)"></i> 投入案件一覧</h1>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div><div class="stat-value">${counts.all}</div><div class="stat-label">全案件</div></div>
                        <div class="stat-icon blue"><i class="fas fa-folder-open"></i></div>
                    </div>
                    <div class="stat-card">
                        <div><div class="stat-value" style="color:var(--status-deficiency)">${counts.deficiency}</div><div class="stat-label">不備</div></div>
                        <div class="stat-icon red"><i class="fas fa-exclamation-circle"></i></div>
                    </div>
                    <div class="stat-card">
                        <div><div class="stat-value" style="color:var(--status-pending)">${counts.pending}</div><div class="stat-label">対応待ち</div></div>
                        <div class="stat-icon gray"><i class="fas fa-clock"></i></div>
                    </div>
                    <div class="stat-card">
                        <div><div class="stat-value" style="color:var(--status-inprogress)">${counts.inprogress}</div><div class="stat-label">対応中</div></div>
                        <div class="stat-icon yellow"><i class="fas fa-spinner"></i></div>
                    </div>
                    <div class="stat-card">
                        <div><div class="stat-value" style="color:var(--status-completed)">${counts.completed}</div><div class="stat-label">投入済(未)</div></div>
                        <div class="stat-icon green"><i class="fas fa-check-circle"></i></div>
                    </div>
                    <div class="stat-card">
                        <div>
                            <div class="stat-value" style="color:var(--status-et)">${etSites}<span style="font-size:0.5em;color:var(--gray-500);margin-left:4px;">(${counts.et}件)</span></div>
                            <div class="stat-label">ET(成約)地点数</div>
                        </div>
                        <div class="stat-icon" style="background:var(--status-et-bg);color:var(--status-et)"><i class="fas fa-trophy"></i></div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="filters-bar">
                    <input type="text" class="form-input" id="filter-search" placeholder="法人名で検索..." oninput="OperatorHomeView.applyFilters()">
                    <select class="form-select" id="filter-status" onchange="OperatorHomeView.applyFilters()">
                        <option value="">全ステータス</option>
                        <option value="pending">対応待ち</option>
                        <option value="inprogress">対応中</option>
                        <option value="deficiency">不備</option>
                        <option value="completed">投入済</option>
                        <option value="et">ET(成約)</option>
                        <option value="cancelled">キャンセル</option>
                    </select>
                    <select class="form-select" id="filter-agency" onchange="OperatorHomeView.applyFilters()">
                        <option value="">全代理店</option>
                        ${Store.getAll('agencies').map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                    </select>
                    <span class="filter-count" id="filter-count">${requests.length}件</span>
                </div>

                <div id="cases-table-container">
                    ${renderTable(requests)}
                </div>
            </div>
        `;
    }

    function renderTable(requests) {
        if (requests.length === 0) {
            return `<div class="empty-state"><i class="fas fa-inbox"></i><h3>案件がありません</h3></div>`;
        }

        return `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>法人名</th>
                            <th>代理店</th>
                            <th>依頼者</th>
                            <th>地点数</th>
                            <th>ステータス</th>
                            <th>依頼日</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${requests.map(r => {
            const corp = Store.getById('corporations', r.corporation_id);
            const corpName = corp ? (corp.customer_type === '2' ? corp.last_name : `${corp.last_name} ${corp.first_name || ''}`) : '不明';
            const requester = Store.getById('users', r.requested_by);
            const agency = r.agency_id ? Store.getById('agencies', r.agency_id) : null;
            const date = new Date(r.created_at).toLocaleDateString('ja-JP');
            const images = Store.query('images', img => img.request_id === r.id);
            const siteCount = Store.query('sites', s => s.request_id === r.id).length;

            return `
                                <tr class="clickable" onclick="Router.navigate('/case/${r.id}')" data-status="${r.status}" data-agency="${r.agency_id || ''}" data-name="${corpName}" title="クリックして詳細を表示">
                                    <td class="font-mono text-sm">${r.id.substring(0, 8)}</td>
                                    <td>
                                        <strong>${corpName}</strong>
                                        ${images.length > 0 ? `<span class="text-xs text-secondary" style="margin-left:4px;"><i class="fas fa-image"></i> ${images.length}</span>` : ''}
                                        ${r.locked_by ? `<span class="status-badge" style="background:#fee2e2;color:#ef4444;margin-left:4px;" title="担当中: ${r.locked_by_name}"><i class="fas fa-lock"></i> ${r.locked_by_name}</span>` : ''}
                                    </td>
                                    <td class="text-sm">${agency ? agency.name : '-'}</td>
                                    <td class="text-sm">${requester ? requester.name : '-'}</td>
                                    <td>${siteCount > 0 ? siteCount : (r.site_count || '-')}</td>
                                    <td>${getStatusBadge(r.status)}</td>
                                    <td class="text-sm text-secondary">${date}</td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function applyFilters() {
        const search = document.getElementById('filter-search').value.toLowerCase();
        const status = document.getElementById('filter-status').value;
        const agency = document.getElementById('filter-agency').value;

        const rows = document.querySelectorAll('#cases-table-container tbody tr');
        let count = 0;
        rows.forEach(row => {
            const name = (row.dataset.name || '').toLowerCase();
            const rowStatus = row.dataset.status;
            const rowAgency = row.dataset.agency;

            const matchSearch = !search || name.includes(search);
            const matchStatus = !status || rowStatus === status;
            const matchAgency = !agency || rowAgency === agency;

            if (matchSearch && matchStatus && matchAgency) {
                row.style.display = '';
                count++;
            } else {
                row.style.display = 'none';
            }
        });
        document.getElementById('filter-count').textContent = count + '件';
    }

    return { render, applyFilters };
})();
