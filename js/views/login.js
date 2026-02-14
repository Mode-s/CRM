/**
 * FMT CRM - Login View
 */
const LoginView = (() => {
    function render(container) {
        container.innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-logo">
                        <h1><i class="fas fa-bolt"></i> FMT CRM</h1>
                        <p>エネパル投入管理システム</p>
                    </div>
                    <form id="login-form">
                        <div class="form-group">
                            <label class="form-label">ログインID</label>
                            <input type="text" class="form-input" id="login-id" placeholder="ログインIDを入力" required autofocus>
                        </div>
                        <div class="form-group">
                            <label class="form-label">パスワード</label>
                            <input type="password" class="form-input" id="login-password" placeholder="パスワードを入力" required>
                        </div>
                        <div id="login-error" class="form-error" style="display:none;margin-bottom:12px;"></div>
                        <button type="submit" class="btn btn-primary btn-lg" style="width:100%;margin-top:8px;">
                            <i class="fas fa-sign-in-alt"></i> ログイン
                        </button>
                    </form>
                    <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border-color);">
                        <p class="text-sm text-secondary text-center">テストアカウント</p>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
                            <button class="btn btn-ghost btn-sm" onclick="LoginView.quickLogin('admin','admin123')">
                                <i class="fas fa-shield-alt"></i> 管理者
                            </button>
                            <button class="btn btn-ghost btn-sm" onclick="LoginView.quickLogin('operator','ope123')">
                                <i class="fas fa-keyboard"></i> 投入担当
                            </button>
                            <button class="btn btn-ghost btn-sm" onclick="LoginView.quickLogin('sales_a','sales123')">
                                <i class="fas fa-user-tie"></i> 営業A
                            </button>
                            <button class="btn btn-ghost btn-sm" onclick="LoginView.quickLogin('sales_b','sales123')">
                                <i class="fas fa-user-tie"></i> 営業B
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Hide header on login page
        document.getElementById('app-header').innerHTML = '';
        document.getElementById('app-header').className = '';

        document.getElementById('login-form').addEventListener('submit', handleLogin);
    }

    function handleLogin(e) {
        e.preventDefault();
        const loginId = document.getElementById('login-id').value.trim();
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

        if (!loginId || !password) {
            errorEl.textContent = 'ログインIDとパスワードを入力してください';
            errorEl.style.display = 'block';
            return;
        }

        const result = Auth.login(loginId, password);
        if (result.success) {
            Header.render();
            Router.navigateToHome();
            Toast.show(`ようこそ、${result.user.name}さん`, 'success');
        } else {
            errorEl.textContent = result.error;
            errorEl.style.display = 'block';
        }
    }

    function quickLogin(loginId, password) {
        document.getElementById('login-id').value = loginId;
        document.getElementById('login-password').value = password;
        document.getElementById('login-form').dispatchEvent(new Event('submit'));
    }

    return { render, quickLogin };
})();
