/**
 * FMT CRM - Acquired Cases List
 * Tracks acquisitions by corporation and by site with separate counts.
 */
const AcquiredListView = (() => {
    function render(container) {
        const user = Auth.currentUser();
        let requests = Store.query('requests', r => r.status === 'completed' || r.status === 'et');

        // Sales: filter by agency
        if (user.role === 'sales' && user.agency_id) {
            requests = requests.filter(r => r.agency_id === user.agency_id);
        }

        requests.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

        // Aggregate by corporation
        const corpMap = {};
        requests.forEach(r => {
            const cid = r.corporation_id;
            if (!corpMap[cid]) {
                corpMap[cid] = { corp: Store.getById('corporations', cid), requests: [], sites: [], agencies: new Set() };
            }
            corpMap[cid].requests.push(r);
            const completedSites = Store.query('sites', s => s.request_id === r.id && (s.status === 'completed' || s.status === 'et'));
            corpMap[cid].sites.push(...completedSites);
            if (r.agency_id) {
                const agency = Store.getById('agencies', r.agency_id);
                if (agency) corpMap[cid].agencies.add(agency.name);
            }
        });

        const corpEntries = Object.values(corpMap);
        const totalCorps = corpEntries.length;
        const etCorps = corpEntries.filter(e => e.requests.every(r => r.status === 'et')).length;

        const totalSites = corpEntries.reduce((sum, e) => sum + e.sites.length, 0);
        const etSites = corpEntries.reduce((sum, e) => sum + e.sites.filter(s => s.status === 'et').length, 0);
        const totalElectric = corpEntries.reduce((sum, e) => sum + e.sites.filter(s => s.service_type === 'electric').length, 0);
        const totalGas = corpEntries.reduce((sum, e) => sum + e.sites.filter(s => s.service_type === 'gas').length, 0);

        container.innerHTML = `
            <div class="page-container">
                <div class="page-header">
                    <h1><i class="fas fa-trophy" style="color:var(--status-completed)"></i> 獲得案件一覧</h1>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div><div class="stat-value" style="color:var(--status-completed)">${totalCorps}</div><div class="stat-label">全獲得法人</div></div>
                        <div class="stat-icon green"><i class="fas fa-building"></i></div>
                    </div>
                    <div class="stat-card">
                        <div><div class="stat-value" style="color:var(--status-et)">${etCorps}</div><div class="stat-label">うちET(確定)</div></div>
                        <div class="stat-icon" style="background:var(--status-et-bg);color:var(--status-et)"><i class="fas fa-trophy"></i></div>
                    </div>
                    <div class="stat-card">
                        <div><div class="stat-value" style="color:var(--status-et)">${etCorps}</div><div class="stat-label">うちET(確定)</div></div>
                        <div class="stat-icon" style="background:var(--status-et-bg);color:var(--status-et)"><i class="fas fa-trophy"></i></div>
                    </div>
                    <div class="stat-card">
                        <div><div class="stat-value" style="color:var(--status-et)">${etSites}</div><div class="stat-label">ET地点数</div></div>
                        <div class="stat-icon" style="background:var(--status-et-bg);color:var(--status-et)"><i class="fas fa-map-marker-alt"></i></div>
                    </div>
                    <div class="stat-card">
                        <div><div class="stat-value" style="color:var(--primary-600)">${totalSites}</div><div class="stat-label">全獲得地点数</div></div>
                        <div class="stat-icon blue"><i class="fas fa-map-marker-alt"></i></div>
                    </div>
                    <div class="stat-card">
                        <div><div class="stat-value" style="color:var(--warning)">${totalElectric}</div><div class="stat-label">電気</div></div>
                        <div class="stat-icon yellow"><i class="fas fa-bolt"></i></div>
                    </div>
                    <div class="stat-card">
                        <div><div class="stat-value" style="color:#6366f1">${totalGas}</div><div class="stat-label">ガス</div></div>
                        <div class="stat-icon purple"><i class="fas fa-fire"></i></div>
                    </div>
                </div>

                ${totalCorps === 0 ? `
                    <div class="empty-state"><i class="fas fa-trophy"></i><h3>獲得案件はまだありません</h3></div>
                ` : `
                    <!-- Summary Table -->
                    <div class="card mb-16">
                        <div class="card-header"><h3><i class="fas fa-table"></i> 法人別サマリ</h3></div>
                        <div class="card-body">
                            <div class="table-container">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>法人名</th>
                                            <th>代理店</th>
                                            <th>地点数</th>
                                            <th>電気</th>
                                            <th>ガス</th>
                                            <th>投入完了日</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${corpEntries.map(e => {
            const corpName = e.corp ? `${e.corp.last_name} ${e.corp.first_name || ''}` : '不明';
            const electricCount = e.sites.filter(s => s.service_type === 'electric').length;
            const gasCount = e.sites.filter(s => s.service_type === 'gas').length;
            const latestDate = e.requests.reduce((latest, r) => {
                const d = new Date(r.updated_at);
                return d > latest ? d : latest;
            }, new Date(0));
            const isEt = e.requests.some(r => r.status === 'et');
            return `
                                                <tr class="clickable" onclick="AcquiredListView.showCorpDetail('${e.corp ? e.corp.id : ''}')">
                                                    <td>
                                                        <strong>${corpName}</strong>
                                                        ${isEt ? `<span class="status-badge status-et" style="margin-left:4px;font-size:0.7em;"><i class="fas fa-trophy"></i> ET</span>` : ''}
                                                    </td>
                                                    <td class="text-sm">${[...e.agencies].join(', ') || '-'}</td>
                                                    <td><strong>${e.sites.length}</strong></td>
                                                    <td>${electricCount > 0 ? `<span style="color:var(--warning)"><i class="fas fa-bolt"></i> ${electricCount}</span>` : '-'}</td>
                                                    <td>${gasCount > 0 ? `<span style="color:#6366f1"><i class="fas fa-fire"></i> ${gasCount}</span>` : '-'}</td>
                                                    <td class="text-sm text-secondary">${latestDate.toLocaleDateString('ja-JP')}</td>
                                                </tr>
                                            `;
        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Detailed Cards -->
                    ${corpEntries.map(e => {
            const corpName = e.corp ? `${e.corp.last_name} ${e.corp.first_name || ''}` : '不明';
            return `
                            <div class="expandable-group">
                                <div class="expandable-header" onclick="this.classList.toggle('expanded');this.nextElementSibling.classList.toggle('show');">
                                    <div class="flex items-center gap-12">
                                        <input type="checkbox" ${e.requests.some(r => r.status === 'et') ? 'checked disabled' : 'disabled'} title="ET状況">
                                        <strong>${corpName}</strong>
                                        ${e.requests.some(r => r.status === 'et') ? '<span class="status-badge status-et"><i class="fas fa-trophy"></i> ET</span>' : '<span class="status-badge status-completed"><i class="fas fa-check"></i> 投入済</span>'}
                                        <span class="text-sm text-secondary">${e.sites.length}地点</span>
                                        <span class="text-xs text-secondary">${[...e.agencies].join(', ')}</span>
                                    </div>
                                    <i class="fas fa-chevron-down chevron"></i>
                                </div>
                                <div class="expandable-body">
                                    <div style="padding:16px;">
                                        ${e.corp ? `<p class="text-sm mb-8"><i class="fas fa-map-marker-alt" style="color:var(--gray-400)"></i> ${e.corp.prefecture || ''}${e.corp.city || ''}${e.corp.town || ''} <i class="fas fa-phone" style="color:var(--gray-400);margin-left:12px;"></i> ${e.corp.phone1 || '-'}</p>` : ''}
                                        ${e.sites.length > 0 ? `
                                            <table class="data-table" style="font-size:0.8rem;">
                                                <thead><tr><th>供給地点番号</th><th>PPS</th><th>プラン</th><th>種別</th><th>容量</th></tr></thead>
                                                <tbody>
                                                    ${e.sites.map(s => `<tr>
                                                        <td class="font-mono">${s.supply_point_id || '-'}</td>
                                                        <td>${s.pps_name || '-'}</td>
                                                        <td>${s.plan_name || '-'}</td>
                                                        <td>${s.service_type === 'gas' ? '<i class="fas fa-fire" style="color:#6366f1"></i> ガス' : '<i class="fas fa-bolt" style="color:var(--warning)"></i> 電気'}</td>
                                                        <td>${s.contract_capacity || '-'}</td>
                                                    </tr>`).join('')}
                                                </tbody>
                                            </table>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        `;
        }).join('')}
                `}
            </div>
        `;
    }

    function showCorpDetail(corpId) {
        if (!corpId) return;
        const corp = Store.getById('corporations', corpId);
        if (!corp) return;
        const corpName = `${corp.last_name} ${corp.first_name || ''}`;

        const allSites = Store.query('sites', s => s.corporation_id === corpId && (s.status === 'completed' || s.status === 'et'));

        Modal.show(`法人詳細 - ${corpName}`, `
            <div style="max-height:60vh;overflow-y:auto;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
                    <div><span class="text-sm text-secondary">契約者名:</span><br><strong>${corpName}</strong></div>
                    <div><span class="text-sm text-secondary">区分:</span><br>${corp.customer_type === '1' ? '個人' : corp.customer_type === '2' ? '法人' : '屋号'}</div>
                    <div><span class="text-sm text-secondary">住所:</span><br>${corp.prefecture || ''}${corp.city || ''}${corp.town || ''}${corp.street || ''}</div>
                    <div><span class="text-sm text-secondary">TEL:</span><br>${corp.phone1 || '-'}</div>
                    <div><span class="text-sm text-secondary">メール:</span><br>${corp.mail_address || '-'}</div>
                    <div><span class="text-sm text-secondary">獲得地点数:</span><br><strong style="color:var(--status-completed)">${allSites.length}</strong></div>
                </div>
                ${allSites.length > 0 ? `
                    <h4 style="margin:8px 0;"><i class="fas fa-map-marker-alt"></i> 獲得地点</h4>
                    <table class="data-table" style="font-size:0.8rem;">
                        <thead><tr><th>地点番号</th><th>PPS</th><th>プラン</th><th>種別</th></tr></thead>
                        <tbody>${allSites.map(s => `<tr>
                            <td class="font-mono">${s.supply_point_id || '-'}</td>
                            <td>${s.pps_name || '-'}</td>
                            <td>${s.plan_name || '-'}</td>
                            <td>${s.service_type === 'gas' ? 'ガス' : '電気'}</td>
                        </tr>`).join('')}</tbody>
                    </table>
                ` : ''}
            </div>
        `, `<button class="btn btn-secondary" onclick="Modal.hide()">閉じる</button>`);
    }

    return { render, showCorpDetail };
})();
