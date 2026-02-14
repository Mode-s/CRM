/**
 * FMT CRM - Notification Component
 * Counts unread deficiency comments for current user.
 */
const Notification = (() => {
    function getUnreadCount() {
        const user = Auth.currentUser();
        if (!user) return 0;

        if (user.role === 'sales') {
            // Count unread deficiency comments on my requests
            const myRequests = Store.query('requests', r => r.requested_by === user.user_id);
            const myRequestIds = myRequests.map(r => r.id);

            return Store.query('comments', c =>
                c.type === 'deficiency' &&
                !c.is_read &&
                myRequestIds.includes(c.request_id) &&
                c.author_id !== user.user_id
            ).length;
        }

        return 0;
    }

    function markAsRead(commentIds) {
        commentIds.forEach(id => {
            Store.update('comments', id, { is_read: true }, true);
        });
        Header.render(); // refresh badge
    }

    function markRequestCommentsAsRead(requestId) {
        const user = Auth.currentUser();
        if (!user) return;

        const unreadComments = Store.query('comments', c =>
            c.request_id === requestId &&
            c.type === 'deficiency' &&
            !c.is_read &&
            c.author_id !== user.user_id
        );

        markAsRead(unreadComments.map(c => c.id));
    }

    return { getUnreadCount, markAsRead, markRequestCommentsAsRead };
})();
