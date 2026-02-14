/**
 * FMT CRM - Audit Logger
 * Records all data changes to audit log table.
 */
const Audit = (() => {
    function log(action, targetType, targetId, changes = {}) {
        const currentUser = Auth ? Auth.currentUser() : null;
        const entry = {
            id: Store.generateId(),
            user_id: currentUser ? currentUser.id : 'system',
            user_name: currentUser ? currentUser.name : 'システム',
            action: action,
            target_type: targetType,
            target_id: targetId,
            changes: changes,
            ip_address: '',
            created_at: Store.now()
        };

        try {
            const logs = Store.getAll('auditLogs');
            logs.push(entry);
            // Keep max 1000 entries to save space
            if (logs.length > 1000) {
                logs.splice(0, logs.length - 1000);
            }
            localStorage.setItem(Store.TABLES.auditLogs, JSON.stringify(logs));
        } catch (e) {
            console.error('Audit.log error:', e);
        }
    }

    function getActionLabel(action) {
        const labels = {
            create: '作成',
            update: '更新',
            delete: '削除',
            status_change: 'ステータス変更',
            cancel: 'キャンセル',
            login: 'ログイン',
            logout: 'ログアウト'
        };
        return labels[action] || action;
    }

    function getTargetLabel(targetType) {
        const labels = {
            agencies: '代理店',
            users: 'ユーザー',
            requests: '投入依頼',
            corporations: '法人',
            sites: '地点',
            images: '明細画像',
            comments: 'コメント'
        };
        return labels[targetType] || targetType;
    }

    return { log, getActionLabel, getTargetLabel };
})();
