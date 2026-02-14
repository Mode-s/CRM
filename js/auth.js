/**
 * FMT CRM - Authentication Module
 * Session management using sessionStorage.
 */
const Auth = (() => {
    const SESSION_KEY = 'fmt_session';

    function login(loginId, password) {
        const users = Store.getAll('users');
        const user = users.find(u => u.login_id === loginId);

        if (!user) {
            return { success: false, error: 'ログインIDが見つかりません' };
        }

        // Phase 1: simple password check (plain comparison of hash)
        if (user.password_hash !== password) {
            return { success: false, error: 'パスワードが正しくありません' };
        }

        // Check agency is active (for sales reps)
        if (user.role === 'sales' && user.agency_id) {
            const agency = Store.getById('agencies', user.agency_id);
            if (agency && !agency.is_active) {
                return { success: false, error: '所属代理店が無効化されています' };
            }
        }

        const session = {
            user_id: user.id,
            login_id: user.login_id,
            name: user.name,
            role: user.role,
            agency_id: user.agency_id || null,
            sales_staff_code: user.sales_staff_code || '',
            l_code: user.l_code || '',
            logged_in_at: Store.now()
        };

        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        Audit.log('login', 'users', user.id, {});
        return { success: true, user: session };
    }

    function logout() {
        const user = currentUser();
        if (user) {
            Audit.log('logout', 'users', user.user_id, {});
        }
        sessionStorage.removeItem(SESSION_KEY);
    }

    function currentUser() {
        try {
            const data = sessionStorage.getItem(SESSION_KEY);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    function isLoggedIn() {
        return currentUser() !== null;
    }

    function hasRole(role) {
        const user = currentUser();
        return user && user.role === role;
    }

    function isSales() { return hasRole('sales'); }
    function isOperator() { return hasRole('operator'); }
    function isAdmin() { return hasRole('admin'); }

    function canAccess(requiredRoles) {
        const user = currentUser();
        if (!user) return false;
        return requiredRoles.includes(user.role);
    }

    // Get agency filter for data isolation
    function getAgencyFilter() {
        const user = currentUser();
        if (!user) return null;
        // Sales reps only see their agency's data
        if (user.role === 'sales') return user.agency_id;
        // Operators & admins see everything
        return null;
    }

    return {
        login,
        logout,
        currentUser,
        isLoggedIn,
        hasRole,
        isSales,
        isOperator,
        isAdmin,
        canAccess,
        getAgencyFilter
    };
})();
