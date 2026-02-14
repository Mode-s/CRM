/**
 * FMT CRM - Header Component
 * Role-based navigation menu.
 */
const Header = (() => {
    function render() {
        const headerEl = document.getElementById('app-header');
        if (!headerEl) return;

        const user = Auth.currentUser();
        if (!user) {
            headerEl.innerHTML = '';
            headerEl.className = '';
            return;
        }

        const nav = getNavItems(user.role);
        const roleBadge = getRoleBadge(user.role);

        headerEl.className = 'app-header';
        headerEl.innerHTML = `
            <div class="header-left">
                <div class="header-logo">
                    <i class="fas fa-bolt"></i> FMT CRM
                </div>
                <nav class="header-nav">
                    ${nav.map(item => `
                        <a href="#${item.path}" class="${Router.getCurrentRoute() === item.path ? 'active' : ''}">
                            ${item.badge ? `<span class="notification-badge"><i class="${item.icon}"></i>${item.badge > 0 ? `<span class="badge-count">${item.badge}</span>` : ''}</span>` : `<i class="${item.icon}"></i>`}
                            ${item.label}
                        </a>
                    `).join('')}
                </nav>
            </div>
            <div class="header-right">
                <div class="header-user">
                    <i class="fas fa-user-circle"></i>
                    <span>${user.name}</span>
                    <span class="role-badge role-badge-${user.role}">${roleBadge}</span>
                </div>
                <button class="btn btn-ghost btn-sm" onclick="Header.logout()" title="ログアウト">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        `;
    }

    function getNavItems(role) {
        const unread = Notification.getUnreadCount();

        switch (role) {
            case 'sales':
                return [
                    { path: '/my-requests', label: 'マイ依頼', icon: 'fas fa-list', badge: unread },
                    { path: '/new-request', label: '新規依頼', icon: 'fas fa-plus-circle' },
                    { path: '/acquired', label: '獲得案件', icon: 'fas fa-trophy' }
                ];
            case 'operator':
                return [
                    { path: '/cases', label: '投入案件', icon: 'fas fa-inbox' },
                    { path: '/acquired', label: '獲得案件', icon: 'fas fa-trophy' },
                    { path: '/agency-stats', label: '代理店数値', icon: 'fas fa-chart-bar' }
                ];
            case 'admin':
                return [
                    { path: '/dashboard', label: 'ダッシュボード', icon: 'fas fa-tachometer-alt' },
                    { path: '/cases', label: '投入案件', icon: 'fas fa-inbox' },
                    { path: '/acquired', label: '獲得案件', icon: 'fas fa-trophy' },
                    { path: '/agencies', label: '代理店', icon: 'fas fa-building' },
                    { path: '/users', label: 'ユーザー', icon: 'fas fa-users' }
                ];
            default:
                return [];
        }
    }

    function getRoleBadge(role) {
        switch (role) {
            case 'sales': return '営業';
            case 'operator': return '投入担当';
            case 'admin': return '管理者';
            default: return '';
        }
    }

    function logout() {
        Auth.logout();
        Header.render();
        Router.navigate('/login');
        Toast.show('ログアウトしました', 'info');
    }

    return { render, logout };
})();
