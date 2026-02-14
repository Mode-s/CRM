/**
 * FMT CRM - User Management (Admin only)
 */
const UserManageView = (() => {
    function render(container) {
        const users = Store.getAll('users');

        container.innerHTML = `
            <div class="page-container">
                <div class="page-header">
                    <h1><i class="fas fa-users" style="color:var(--primary-500)"></i> ユーザー管理</h1>
                    <button class="btn btn-primary" onclick="UserManageView.showForm()"><i class="fas fa-plus"></i> 新規登録</button>
                </div>

                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr><th>氏名</th><th>ログインID</th><th>ロール</th><th>代理店</th><th>Lコード</th><th>操作</th></tr>
                        </thead>
                        <tbody>
                            ${users.map(u => {
            const agency = u.agency_id ? Store.getById('agencies', u.agency_id) : null;
            const roleLabel = u.role === 'sales' ? '営業' : u.role === 'operator' ? '投入担当' : '管理者';
            const roleBadgeClass = `role-badge-${u.role}`;
            return `
                                    <tr>
                                        <td><strong>${u.name}</strong></td>
                                        <td class="font-mono text-sm">${u.login_id}</td>
                                        <td><span class="role-badge ${roleBadgeClass}" style="padding:2px 8px;border-radius:999px;font-size:0.75rem;">${roleLabel}</span></td>
                                        <td class="text-sm">${agency ? agency.name : '-'}</td>
                                        <td class="font-mono text-sm">${u.l_code || '-'}</td>
                                        <td><button class="btn btn-sm btn-ghost" onclick="UserManageView.showForm('${u.id}')"><i class="fas fa-edit"></i></button></td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function showForm(userId) {
        const user = userId ? Store.getById('users', userId) : null;
        const agencies = Store.getAll('agencies');
        const title = user ? 'ユーザー編集' : 'ユーザー新規登録';

        Modal.show(title, `
            <div class="form-group"><label class="form-label">氏名 <span class="required">*</span></label><input type="text" class="form-input" id="u-name" value="${user?.name || ''}"></div>
            <div class="form-group"><label class="form-label">ログインID <span class="required">*</span></label><input type="text" class="form-input" id="u-login" value="${user?.login_id || ''}" ${user ? 'readonly' : ''}></div>
            ${!user ? `<div class="form-group"><label class="form-label">パスワード <span class="required">*</span></label><input type="password" class="form-input" id="u-pass" value=""></div>` : ''}
            <div class="form-group"><label class="form-label">ロール <span class="required">*</span></label>
                <select class="form-select" id="u-role">
                    <option value="sales" ${user?.role === 'sales' ? 'selected' : ''}>営業担当者</option>
                    <option value="operator" ${user?.role === 'operator' ? 'selected' : ''}>投入担当者</option>
                    <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>管理者</option>
                </select>
            </div>
            <div class="form-group"><label class="form-label">代理店</label>
                <select class="form-select" id="u-agency">
                    <option value="">なし</option>
                    ${agencies.map(a => `<option value="${a.id}" ${user?.agency_id === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-row">
                <div class="form-group"><label class="form-label">営業担当者コード</label><input type="text" class="form-input" id="u-scode" value="${user?.sales_staff_code || ''}"></div>
                <div class="form-group"><label class="form-label">Lコード</label><input type="text" class="form-input" id="u-lcode" value="${user?.l_code || ''}"></div>
            </div>
        `, `
            <button class="btn btn-secondary" onclick="Modal.hide()">キャンセル</button>
            <button class="btn btn-primary" onclick="UserManageView.save('${userId || ''}')"><i class="fas fa-save"></i> 保存</button>
        `);
    }

    function save(userId) {
        const data = {
            name: document.getElementById('u-name').value,
            role: document.getElementById('u-role').value,
            agency_id: document.getElementById('u-agency').value || null,
            sales_staff_code: document.getElementById('u-scode').value,
            l_code: document.getElementById('u-lcode').value
        };

        if (!data.name) { Toast.show('氏名は必須です', 'error'); return; }

        if (userId) {
            Store.update('users', userId, data);
            Toast.show('ユーザーを更新しました', 'success');
        } else {
            const loginId = document.getElementById('u-login').value;
            const pass = document.getElementById('u-pass').value;
            if (!loginId || !pass) { Toast.show('ログインIDとパスワードは必須です', 'error'); return; }
            data.login_id = loginId;
            data.password_hash = pass;
            Store.create('users', data);
            Toast.show('ユーザーを登録しました', 'success');
        }

        Modal.hide();
        Router.handleRoute();
    }

    return { render, showForm, save };
})();
