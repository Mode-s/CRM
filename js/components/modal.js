/**
 * FMT CRM - Modal Component
 */
const Modal = (() => {
    function show(title, bodyHtml, footerHtml = '') {
        const overlay = document.getElementById('modal-overlay');
        const container = document.getElementById('modal-container');
        if (!overlay || !container) return;

        container.innerHTML = `
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="Modal.hide()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">${bodyHtml}</div>
            ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
        `;

        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function hide() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    function confirm(title, message, onConfirm, confirmLabel = '確認', confirmClass = 'btn-primary') {
        show(
            title,
            `<p>${message}</p>`,
            `
                <button class="btn btn-secondary" onclick="Modal.hide()">キャンセル</button>
                <button class="btn ${confirmClass}" id="modal-confirm-btn">${confirmLabel}</button>
            `
        );

        document.getElementById('modal-confirm-btn').addEventListener('click', () => {
            hide();
            onConfirm();
        });
    }

    function imagePreview(src, fileName) {
        show(
            fileName || '画像プレビュー',
            `<img src="${src}" alt="${fileName}" style="width:100%;border-radius:8px;">`,
            `<button class="btn btn-secondary" onclick="Modal.hide()">閉じる</button>`
        );
    }

    return { show, hide, confirm, imagePreview };
})();
