/**
 * FMT CRM - Hash-based Router
 * Role-based access control with route guards.
 */
const Router = (() => {
    const routes = {};
    let currentRoute = null;

    // Route definitions with access control
    function define(path, handler, allowedRoles = ['sales', 'operator', 'admin']) {
        routes[path] = { handler, allowedRoles };
    }

    function navigate(path) {
        window.location.hash = path;
    }

    function handleRoute() {
        const hash = window.location.hash.slice(1) || '/login';
        const [path, ...paramParts] = hash.split('/').filter(Boolean);
        const routePath = '/' + path;

        // If not logged in, redirect to login
        if (routePath !== '/login' && !Auth.isLoggedIn()) {
            navigate('/login');
            return;
        }

        // If logged in and on login page, redirect to home
        if (routePath === '/login' && Auth.isLoggedIn()) {
            navigateToHome();
            return;
        }

        const route = routes[routePath];

        if (!route) {
            navigateToHome();
            return;
        }

        // Check role-based access
        const user = Auth.currentUser();
        if (user && !route.allowedRoles.includes(user.role)) {
            navigateToHome();
            Toast.show('アクセス権限がありません', 'error');
            return;
        }

        currentRoute = routePath;

        // Extract parameters (e.g., /case/abc123 → params = ['abc123'])
        const params = paramParts.length > 0 ? paramParts.join('/') : null;

        // Update active nav
        updateActiveNav(routePath);

        // Render the view
        const mainEl = document.getElementById('app-main');
        if (mainEl) {
            mainEl.innerHTML = '<div class="loading-screen"><div class="loading-spinner"></div><p>読み込み中...</p></div>';
            // Small delay for visual feedback
            setTimeout(() => {
                try {
                    route.handler(mainEl, params);
                } catch (e) {
                    console.error('Route handler error:', e);
                    mainEl.innerHTML = `<div class="page-container"><div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>エラーが発生しました</h3><p>${e.message}</p></div></div>`;
                }
            }, 50);
        }
    }

    function navigateToHome() {
        const user = Auth.currentUser();
        if (!user) { navigate('/login'); return; }

        switch (user.role) {
            case 'sales': navigate('/my-requests'); break;
            case 'operator': navigate('/cases'); break;
            case 'admin': navigate('/dashboard'); break;
            default: navigate('/login');
        }
    }

    function updateActiveNav(path) {
        document.querySelectorAll('.header-nav a').forEach(a => {
            const href = a.getAttribute('href');
            if (href === '#' + path) {
                a.classList.add('active');
            } else {
                a.classList.remove('active');
            }
        });
    }

    function getCurrentRoute() {
        return currentRoute;
    }

    function init() {
        window.addEventListener('hashchange', handleRoute);
        handleRoute();
    }

    return { define, navigate, navigateToHome, init, getCurrentRoute, handleRoute };
})();

/**
 * Toast notification utility
 */
const Toast = (() => {
    function show(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${getIcon(type)}"></i>
            <span>${message}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    function getIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }

    return { show };
})();
