/**
 * FMT CRM - Data Store (LocalStorage Wrapper)
 * All CRUD operations for 8 tables + auto audit logging
 */
const Store = (() => {
    const TABLES = {
        agencies: 'fmt_agencies',
        users: 'fmt_users',
        requests: 'fmt_requests',
        corporations: 'fmt_corporations',
        sites: 'fmt_sites',
        images: 'fmt_images',
        comments: 'fmt_comments',
        auditLogs: 'fmt_audit_logs',
        monthlyStats: 'fmt_monthly_stats',
        monthlyTargets: 'fmt_monthly_targets'
    };

    // --- Utility ---
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    function now() {
        return new Date().toISOString();
    }

    // --- Core CRUD ---
    function getAll(tableName) {
        try {
            const data = localStorage.getItem(TABLES[tableName]);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error(`Store.getAll(${tableName}) error:`, e);
            return [];
        }
    }

    function saveAll(tableName, records) {
        try {
            localStorage.setItem(TABLES[tableName], JSON.stringify(records));
        } catch (e) {
            console.error(`Store.saveAll(${tableName}) error:`, e);
            if (e.name === 'QuotaExceededError') {
                Toast.show('ストレージ容量が不足しています。古いデータを削除してください。', 'error');
            }
        }
    }

    function getById(tableName, id) {
        const records = getAll(tableName);
        return records.find(r => r.id === id) || null;
    }

    function create(tableName, data, skipAudit = false) {
        const records = getAll(tableName);
        const record = {
            id: generateId(),
            ...data,
            created_at: now(),
            updated_at: now()
        };
        records.push(record);
        saveAll(tableName, records);

        if (!skipAudit && tableName !== 'auditLogs') {
            Audit.log('create', tableName, record.id, { after: record });
        }
        return record;
    }

    function update(tableName, id, updates, skipAudit = false) {
        const records = getAll(tableName);
        const index = records.findIndex(r => r.id === id);
        if (index === -1) return null;

        const before = { ...records[index] };
        records[index] = {
            ...records[index],
            ...updates,
            updated_at: now()
        };
        saveAll(tableName, records);

        if (!skipAudit && tableName !== 'auditLogs') {
            const changes = {};
            for (const key of Object.keys(updates)) {
                if (key === 'updated_at') continue;
                if (JSON.stringify(before[key]) !== JSON.stringify(updates[key])) {
                    changes[key] = { before: before[key], after: updates[key] };
                }
            }
            if (Object.keys(changes).length > 0) {
                Audit.log('update', tableName, id, changes);
            }
        }
        return records[index];
    }

    function remove(tableName, id, skipAudit = false) {
        const records = getAll(tableName);
        const record = records.find(r => r.id === id);
        if (!record) return false;

        const filtered = records.filter(r => r.id !== id);
        saveAll(tableName, filtered);

        if (!skipAudit && tableName !== 'auditLogs') {
            Audit.log('delete', tableName, id, { before: record });
        }
        return true;
    }

    function query(tableName, filterFn) {
        return getAll(tableName).filter(filterFn);
    }

    function count(tableName, filterFn) {
        if (filterFn) return query(tableName, filterFn).length;
        return getAll(tableName).length;
    }

    // --- Helper: Status Change ---
    function changeStatus(tableName, id, newStatus) {
        const record = getById(tableName, id);
        if (!record) return null;
        const oldStatus = record.status;
        const updated = update(tableName, id, { status: newStatus }, true);
        Audit.log('status_change', tableName, id, {
            status: { before: oldStatus, after: newStatus }
        });
        return updated;
    }

    // --- Helper: Aggregate Request Status ---
    function computeRequestStatus(requestId) {
        const sites = query('sites', s => s.request_id === requestId);
        if (sites.length === 0) return 'pending';

        const statuses = sites.map(s => s.status);
        if (statuses.every(s => s === 'cancelled')) return 'cancelled';
        if (statuses.some(s => s === 'deficiency')) return 'deficiency';
        if (statuses.every(s => s === 'completed')) return 'completed';
        if (statuses.every(s => s === 'pending')) return 'pending';
        return 'inprogress';
    }

    // --- Helper: Lock Mechanism ---
    function lockRequest(requestId, userId, userName) {
        const request = getById('requests', requestId);
        if (!request) return false;

        // Already locked by someone else?
        if (request.locked_by && request.locked_by !== userId) {
            // Check if lock is expired (e.g. 30 mins) - Optional, but good practice
            const lockTime = new Date(request.locked_at).getTime();
            const nowTime = new Date().getTime();
            if (nowTime - lockTime < 30 * 60 * 1000) {
                return false;
            }
        }

        update('requests', requestId, {
            locked_by: userId,
            locked_by_name: userName,
            locked_at: now()
        }, true); // Skip audit for lock updates to avoid clutter
        return true;
    }

    function unlockRequest(requestId) {
        const request = getById('requests', requestId);
        if (!request) return;

        update('requests', requestId, {
            locked_by: null,
            locked_by_name: null,
            locked_at: null
        }, true);
    }

    function isLocked(requestId, userId) {
        const request = getById('requests', requestId);
        if (!request) return false;

        if (request.locked_by && request.locked_by !== userId) {
            const lockTime = new Date(request.locked_at).getTime();
            const nowTime = new Date().getTime();
            // 30 mins timeout
            if (nowTime - lockTime < 30 * 60 * 1000) {
                return true;
            }
        }
        return false;
    }

    // --- Check if initialized ---
    function isInitialized() {
        return localStorage.getItem('fmt_initialized') === 'true';
    }

    function setInitialized() {
        localStorage.setItem('fmt_initialized', 'true');
    }

    // --- Public API ---
    return {
        TABLES,
        generateId,
        now,
        getAll,
        getById,
        create,
        update,
        remove,
        query,
        count,
        changeStatus,
        computeRequestStatus,
        lockRequest,
        unlockRequest,
        isLocked,
        isInitialized,
        setInitialized
    };
})();
