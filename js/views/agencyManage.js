/**
 * FMT CRM - Agency Management (Admin only)
 */
const AgencyManageView = (() => {
    function render(container) {
        const agencies = Store.getAll('agencies');

        container.innerHTML = `
            <div class="page-container">
                <div class="page-header">
                    <h1><i class="fas fa-building" style="color:var(--primary-500)"></i> 代理店管理</h1>
                    <button class="btn btn-primary" onclick="AgencyManageView.showForm()">
                        <i class="fas fa-plus"></i> 新規登録
                    </button>
                </div>

                ${agencies.length === 0 ? `
                    <div class="empty-state"><i class="fas fa-building"></i><h3>代理店が登録されていません</h3></div>
                ` : `
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>代理店名</th>
                                    <th>コード</th>
                                    <th>紹介店コード</th>
                                    <th>担当者</th>
                                    <th>営業担当数</th>
                                    <th>ステータス</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${agencies.map(a => {
            const salesCount = Store.query('users', u => u.agency_id === a.id && u.role === 'sales').length;
            return `
                                        <tr>
                                            <td><strong>${a.name}</strong></td>
                                            <td class="font-mono text-sm">${a.code}</td>
                                            <td class="text-sm">${a.referral_shop_code || '-'}</td>
                                            <td class="text-sm">${a.contact_name || '-'}</td>
                                            <td>${salesCount}</td>
                                            <td>${a.is_active ? '<span class="status-badge status-completed">有効</span>' : '<span class="status-badge status-cancelled">無効</span>'}</td>
                                            <td>
                                                <div class="btn-group">
                                                    <button class="btn btn-sm btn-ghost" onclick="AgencyManageView.showForm('${a.id}')"><i class="fas fa-edit"></i></button>
                                                    ${a.is_active ? `<button class="btn btn-sm btn-ghost" onclick="AgencyManageView.toggleActive('${a.id}',false)"><i class="fas fa-ban"></i></button>` : `<button class="btn btn-sm btn-ghost" onclick="AgencyManageView.toggleActive('${a.id}',true)"><i class="fas fa-check"></i></button>`}
                                                </div>
                                            </td>
                                        </tr>
                                    `;
        }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    }

    function showForm(agencyId) {
        const agency = agencyId ? Store.getById('agencies', agencyId) : null;
        const title = agency ? '代理店編集' : '代理店新規登録';

        Modal.show(title, `
            <div class="form-group"><label class="form-label">代理店名 <span class="required">*</span></label><input type="text" class="form-input" id="ag-name" value="${agency?.name || ''}"></div>
            <div class="form-group"><label class="form-label">代理店コード <span class="required">*</span></label><input type="text" class="form-input" id="ag-code" value="${agency?.code || ''}"></div>
            <div class="form-row">
                <div class="form-group"><label class="form-label">紹介店コード</label><input type="text" class="form-input" id="ag-rscode" value="${agency?.referral_shop_code || ''}"></div>
                <div class="form-group"><label class="form-label">紹介店名</label><input type="text" class="form-input" id="ag-rsname" value="${agency?.referral_shop_name || ''}"></div>
            </div>
            <div class="form-group"><label class="form-label">担当者名</label><input type="text" class="form-input" id="ag-contact" value="${agency?.contact_name || ''}"></div>
            <div class="form-row">
                <div class="form-group"><label class="form-label">電話番号</label><input type="text" class="form-input" id="ag-phone" value="${agency?.phone || ''}"></div>
                <div class="form-group"><label class="form-label">メールアドレス</label><input type="text" class="form-input" id="ag-email" value="${agency?.mail_address || ''}"></div>
            </div>
        `, `
            <button class="btn btn-secondary" onclick="Modal.hide()">キャンセル</button>
            <button class="btn btn-primary" onclick="AgencyManageView.save('${agencyId || ''}')"><i class="fas fa-save"></i> 保存</button>
        `);
    }

    function save(agencyId) {
        const data = {
            name: document.getElementById('ag-name').value,
            code: document.getElementById('ag-code').value,
            referral_shop_code: document.getElementById('ag-rscode').value,
            referral_shop_name: document.getElementById('ag-rsname').value,
            contact_name: document.getElementById('ag-contact').value,
            phone: document.getElementById('ag-phone').value,
            mail_address: document.getElementById('ag-email').value
        };

        if (!data.name || !data.code) { Toast.show('代理店名とコードは必須です', 'error'); return; }

        if (agencyId) {
            Store.update('agencies', agencyId, data);
            Toast.show('代理店を更新しました', 'success');
        } else {
            data.is_active = true;
            Store.create('agencies', data);
            Toast.show('代理店を登録しました', 'success');
        }

        Modal.hide();
        Router.handleRoute();
    }

    function toggleActive(agencyId, active) {
        Store.update('agencies', agencyId, { is_active: active });
        Toast.show(active ? '代理店を有効化しました' : '代理店を無効化しました', 'info');
        Router.handleRoute();
    }

    return { render, showForm, save, toggleActive };
})();
