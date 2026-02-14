/**
 * FMT CRM - Sales Home (My Requests List)
 * Row click navigates to deficiency edit for deficient items, or shows detail.
 */
const SalesHomeView = (() => {
    function render(container) {
        const user = Auth.currentUser();
        const agencyFilter = Auth.getAgencyFilter();

        // Get my requests
        let requests = Store.query('requests', r => r.requested_by === user.user_id);
        // Admin can also see all
        if (user.role === 'admin') {
            requests = Store.getAll('requests');
        }

        // Sort by date desc
        requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Count by status
        const counts = {
            all: requests.length,
            deficiency: requests.filter(r => r.status === 'deficiency').length,
            inprogress: requests.filter(r => r.status === 'inprogress').length,
            pending: requests.filter(r => r.status === 'pending').length,
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
                    <h1><i class="fas fa-list" style="color:var(--primary-500)"></i> マイ依頼一覧</h1>
                    <div class="btn-group">
                        <button class="btn btn-primary" onclick="Router.navigate('/new-request')">
                            <i class="fas fa-plus"></i> 新規投入依頼
                        </button>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div>
                            <div class="stat-value">${counts.all}</div>
                            <div class="stat-label">全依頼</div>
                        </div>
                        <div class="stat-icon blue"><i class="fas fa-file-alt"></i></div>
                    </div>
                    <div class="stat-card">
                        <div>
                            <div class="stat-value" style="color:var(--status-deficiency)">${counts.deficiency}</div>
                            <div class="stat-label">不備</div>
                        </div>
                        <div class="stat-icon red"><i class="fas fa-exclamation-circle"></i></div>
                    </div>
                    <div class="stat-card">
                        <div>
                            <div class="stat-value" style="color:var(--status-inprogress)">${counts.inprogress}</div>
                            <div class="stat-label">対応中</div>
                        </div>
                        <div class="stat-icon yellow"><i class="fas fa-spinner"></i></div>
                    </div>
                    <div class="stat-card">
                        <div>
                            <div class="stat-value" style="color:var(--status-pending)">${counts.pending}</div>
                            <div class="stat-label">対応待ち</div>
                        </div>
                        <div class="stat-icon gray"><i class="fas fa-clock"></i></div>
                    </div>
                    <div class="stat-card">
                        <div>
                            <div class="stat-value" style="color:var(--status-completed)">${counts.completed}</div>
                            <div class="stat-label">投入済</div>
                        </div>
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

                ${requests.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h3>依頼がありません</h3>
                        <p>「新規投入依頼」から最初の依頼を作成してください</p>
                    </div>
                ` : `
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>依頼ID</th>
                                    <th>法人名</th>
                                    <th>地点数</th>
                                    <th>ステータス</th>
                                    <th>依頼日時</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${requests.map(r => renderRow(r, user)).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    }

    function renderRow(request, user) {
        const corp = Store.getById('corporations', request.corporation_id);
        const corpName = corp ? (corp.customer_type === '2' ? corp.last_name : `${corp.last_name} ${corp.first_name}`) : '不明';
        const statusBadge = getStatusBadge(request.status);
        const canCancel = request.status === 'pending' || request.status === 'inprogress' || request.status === 'deficiency';
        const isDeficiency = request.status === 'deficiency';
        const date = new Date(request.created_at).toLocaleDateString('ja-JP');

        // Check unread comments
        const unreadComments = Store.query('comments', c =>
            c.request_id === request.id && c.type === 'deficiency' && !c.is_read && c.author_id !== user.user_id
        );

        // Row click: deficiency -> go to deficiency edit, otherwise show detail modal
        const clickTarget = isDeficiency
            ? `Router.navigate('/deficiency/${request.id}')`
            : `SalesHomeView.showDetail('${request.id}')`;

        return `
            <tr class="clickable" onclick="${clickTarget}" title="クリックして${isDeficiency ? '修正画面へ' : '詳細を表示'}">
                <td class="font-mono text-sm">${request.id.substring(0, 8)}</td>
                <td>
                    <strong>${corpName}</strong>
                    ${unreadComments.length > 0 ? `<span class="status-badge status-deficiency" style="margin-left:6px;"><i class="fas fa-bell"></i> ${unreadComments.length}件</span>` : ''}
                </td>
                <td>${request.site_count || '-'}</td>
                <td>${statusBadge}</td>
                <td class="text-sm text-secondary">${date}</td>
                <td>
                    <div class="btn-group">
                        ${isDeficiency ? `<button class="btn btn-sm btn-warning" onclick="event.stopPropagation();Router.navigate('/deficiency/${request.id}')"><i class="fas fa-edit"></i> 修正</button>` : ''}
                        ${canCancel ? `<button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();SalesHomeView.cancelRequest('${request.id}')"><i class="fas fa-times"></i></button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    function showDetail(requestId) {
        const request = Store.getById('requests', requestId);
        if (!request) return;
        const corp = Store.getById('corporations', request.corporation_id);
        const corpName = corp ? `${corp.last_name} ${corp.first_name || ''}` : '不明';
        const sites = Store.query('sites', s => s.request_id === requestId);
        const images = Store.query('images', img => img.request_id === requestId);
        const comments = Store.query('comments', c => c.request_id === requestId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const requester = Store.getById('users', request.requested_by);

        Modal.show(`依頼詳細 - ${corpName}`, `
            <div style="max-height:65vh;overflow-y:auto;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
                    <div><span class="text-sm text-secondary">依頼ID:</span><br><span class="font-mono">${request.id.substring(0, 8)}</span></div>
                    <div><span class="text-sm text-secondary">ステータス:</span><br>${getStatusBadge(request.status)}</div>
                    <div><span class="text-sm text-secondary">依頼日:</span><br>${new Date(request.created_at).toLocaleString('ja-JP')}</div>
                    <div><span class="text-sm text-secondary">地点数:</span><br>${request.site_count || '-'}</div>
                </div>

                ${corp ? `
                    <h4 style="margin:12px 0 8px;color:var(--primary-600);"><i class="fas fa-building"></i> 法人情報</h4>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
                        <div><span class="text-xs text-secondary">契約者名:</span><br>${corp.last_name} ${corp.first_name || ''}</div>
                        <div><span class="text-xs text-secondary">区分:</span><br>${corp.customer_type === '1' ? '個人' : corp.customer_type === '2' ? '法人' : '屋号'}</div>
                        <div><span class="text-xs text-secondary">住所:</span><br>${corp.prefecture || ''}${corp.city || ''}${corp.town || ''}</div>
                        <div><span class="text-xs text-secondary">TEL:</span><br>${corp.phone1 || '-'}</div>
                    </div>
                ` : ''}

                ${sites.length > 0 ? `
                    <h4 style="margin:12px 0 8px;color:var(--primary-600);"><i class="fas fa-map-marker-alt"></i> 地点 (${sites.length})</h4>
                    <table class="data-table" style="font-size:0.8rem;margin-bottom:16px;">
                        <thead><tr><th>地点番号</th><th>種別</th><th>PPS</th><th>ステータス</th></tr></thead>
                        <tbody>
                            ${sites.map(s => `<tr>
                                <td class="font-mono">${s.supply_point_id || '-'}</td>
                                <td>${s.service_type === 'gas' ? 'ガス' : '電気'}</td>
                                <td>${s.pps_name || '-'}</td>
                                <td>${getStatusBadge(s.status)}</td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                ` : ''}

                ${images.length > 0 ? `
                    <h4 style="margin:12px 0 8px;color:var(--primary-600);"><i class="fas fa-image"></i> 画像 (${images.length})</h4>
                    <div class="file-preview-list" style="margin-bottom:16px;">
                        ${images.map(img => `<div class="file-preview-item" style="width:80px;height:80px;"><img src="${img.file_data}" alt="${img.file_name}"></div>`).join('')}
                    </div>
                ` : ''}

                ${comments.length > 0 ? `
                    <h4 style="margin:12px 0 8px;color:var(--primary-600);"><i class="fas fa-comments"></i> コメント</h4>
                    ${comments.slice(0, 5).map(c => {
            const author = Store.getById('users', c.author_id);
            return `<div style="padding:6px 8px;margin-bottom:4px;background:${c.type === 'deficiency' ? 'var(--status-deficiency-bg)' : 'var(--gray-50)'};border-radius:var(--border-radius);border-left:2px solid ${c.type === 'deficiency' ? 'var(--status-deficiency)' : 'var(--gray-300)'};">
                            <div class="text-xs"><strong>${author ? author.name : '不明'}</strong> <span class="text-secondary">${new Date(c.created_at).toLocaleString('ja-JP')}</span></div>
                            <div class="text-sm">${c.message}</div>
                        </div>`;
        }).join('')}
                ` : ''}
            </div>
        `, `<button class="btn btn-secondary" onclick="Modal.hide()">閉じる</button>`);
    }

    function cancelRequest(requestId) {
        Modal.confirm(
            'キャンセル確認',
            'この投入依頼をキャンセルしますか？',
            () => {
                Store.changeStatus('requests', requestId, 'cancelled');
                // Cancel all associated sites
                const sites = Store.query('sites', s => s.request_id === requestId);
                sites.forEach(site => {
                    if (site.status !== 'completed') {
                        Store.changeStatus('sites', site.id, 'cancelled');
                    }
                });
                Toast.show('依頼をキャンセルしました', 'info');
                Router.handleRoute();
            },
            'キャンセルする',
            'btn-danger'
        );
    }

    return { render, cancelRequest, showDetail };
})();

// --- Shared status badge helper ---
function getStatusBadge(status) {
    const map = {
        deficiency: { label: '不備', class: 'status-deficiency', icon: 'fas fa-exclamation-circle' },
        pending: { label: '対応待ち', class: 'status-pending', icon: 'fas fa-clock' },
        inprogress: { label: '対応中', class: 'status-inprogress', icon: 'fas fa-spinner' },
        completed: { label: '投入済', class: 'status-completed', icon: 'fas fa-check-circle' },
        cancelled: { label: 'キャンセル', class: 'status-cancelled', icon: 'fas fa-ban' },
        et: { label: 'ET(成約)', class: 'status-et', icon: 'fas fa-trophy' }
    };
    const s = map[status] || { label: status, class: '', icon: '' };
    return `<span class="status-badge ${s.class}"><i class="${s.icon}"></i> ${s.label}</span>`;
}
