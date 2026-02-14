/**
 * FMT CRM - Deficiency View
 * Sales rep reviews deficiency comments and resubmits.
 */
const DeficiencyView = (() => {
    function render(container, requestId) {
        if (!requestId) {
            Router.navigate('/my-requests');
            return;
        }

        const request = Store.getById('requests', requestId);
        if (!request) {
            Toast.show('依頼が見つかりません', 'error');
            Router.navigate('/my-requests');
            return;
        }

        const corp = Store.getById('corporations', request.corporation_id);
        const comments = Store.query('comments', c => c.request_id === requestId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const images = Store.query('images', img => img.request_id === requestId);

        // Mark comments as read
        Notification.markRequestCommentsAsRead(requestId);

        container.innerHTML = `
            <div class="page-container">
                <div class="page-header">
                    <h1><i class="fas fa-exclamation-triangle" style="color:var(--status-deficiency)"></i> 不備確認・修正</h1>
                    <button class="btn btn-secondary" onclick="Router.navigate('/my-requests')">
                        <i class="fas fa-arrow-left"></i> 戻る
                    </button>
                </div>

                <!-- Deficiency Comments -->
                <div class="card mb-16">
                    <div class="card-header">
                        <h3><i class="fas fa-comments" style="color:var(--status-deficiency)"></i> 不備内容</h3>
                    </div>
                    <div class="card-body">
                        ${comments.length === 0 ? '<p class="text-secondary">コメントはありません</p>' :
                comments.map(c => {
                    const author = Store.getById('users', c.author_id);
                    return `
                                    <div style="padding:12px;margin-bottom:8px;background:${c.type === 'deficiency' ? 'var(--status-deficiency-bg)' : 'var(--gray-50)'};border-radius:var(--border-radius);border-left:3px solid ${c.type === 'deficiency' ? 'var(--status-deficiency)' : 'var(--gray-300)'};">
                                        <div class="flex justify-between items-center mb-8">
                                            <strong class="text-sm">${author ? author.name : '不明'}</strong>
                                            <span class="text-xs text-secondary">${new Date(c.created_at).toLocaleString('ja-JP')}</span>
                                        </div>
                                        <p class="text-sm">${c.message}</p>
                                    </div>
                                `;
                }).join('')
            }
                    </div>
                </div>

                <!-- Corporation Info (Editable) -->
                <div class="card mb-16">
                    <div class="card-header">
                        <h3><i class="fas fa-building"></i> 法人情報</h3>
                    </div>
                    <div class="card-body">
                        ${corp ? `
                            <div class="form-row">
                                <div class="form-group"><label class="form-label">契約者名</label><input type="text" class="form-input" id="def-last-name" value="${corp.last_name || ''}"></div>
                                <div class="form-group"><label class="form-label">名</label><input type="text" class="form-input" id="def-first-name" value="${corp.first_name || ''}"></div>
                            </div>
                            <div class="form-group"><label class="form-label">電話番号</label><input type="text" class="form-input" id="def-phone" value="${corp.phone1 || ''}"></div>
                        ` : '<p class="text-secondary">法人情報が見つかりません</p>'}
                    </div>
                </div>

                <!-- Images -->
                <div class="card mb-16">
                    <div class="card-header">
                        <h3><i class="fas fa-image"></i> 明細画像</h3>
                    </div>
                    <div class="card-body">
                        <div class="file-preview-list">
                            ${images.map(img => `
                                <div class="file-preview-item">
                                    <img src="${img.file_data}" alt="${img.file_name}" onclick="Modal.imagePreview('${img.file_data}','${img.file_name}')">
                                </div>
                            `).join('')}
                        </div>
                        <div class="file-upload-area mt-16" onclick="document.getElementById('def-file-input').click();">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <p class="text-sm">追加画像をアップロード</p>
                            <input type="file" id="def-file-input" multiple accept="image/*" style="display:none;">
                        </div>
                    </div>
                </div>

                <!-- Remarks -->
                <div class="card mb-16">
                    <div class="card-header"><h3><i class="fas fa-comment"></i> 備考</h3></div>
                    <div class="card-body">
                        <textarea class="form-textarea" id="def-remarks">${request.remarks || ''}</textarea>
                    </div>
                </div>

                <div class="flex justify-between">
                    <button class="btn btn-secondary" onclick="Router.navigate('/my-requests')">キャンセル</button>
                    <button class="btn btn-primary btn-lg" onclick="DeficiencyView.resubmit('${requestId}')">
                        <i class="fas fa-paper-plane"></i> 修正して再提出
                    </button>
                </div>
            </div>
        `;

        // File upload handler
        document.getElementById('def-file-input').addEventListener('change', (e) => {
            Array.from(e.target.files).forEach(file => {
                if (!file.type.startsWith('image/')) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    NewRequestView.__resizeImage ? null : null;
                    // Simple save without resize for deficiency fix
                    Store.create('images', {
                        request_id: requestId,
                        site_id: null,
                        file_name: file.name,
                        file_data: ev.target.result,
                        ocr_result: null,
                        uploaded_at: Store.now()
                    });
                    Toast.show('画像を追加しました', 'success');
                    Router.handleRoute(); // refresh
                };
                reader.readAsDataURL(file);
            });
        });
    }

    function resubmit(requestId) {
        const request = Store.getById('requests', requestId);
        if (!request) return;

        // Update corporation if changed
        const corp = Store.getById('corporations', request.corporation_id);
        if (corp) {
            const lastName = document.getElementById('def-last-name');
            const firstName = document.getElementById('def-first-name');
            const phone = document.getElementById('def-phone');

            Store.update('corporations', corp.id, {
                last_name: lastName ? lastName.value : corp.last_name,
                first_name: firstName ? firstName.value : corp.first_name,
                phone1: phone ? phone.value : corp.phone1
            });
        }

        // Update request
        Store.update('requests', requestId, {
            remarks: document.getElementById('def-remarks').value
        });

        // Change status back to inprogress
        Store.changeStatus('requests', requestId, 'inprogress');

        // Also change deficiency sites back to inprogress
        const sites = Store.query('sites', s => s.request_id === requestId && s.status === 'deficiency');
        sites.forEach(s => Store.changeStatus('sites', s.id, 'inprogress'));

        // Add comment about resubmission
        const user = Auth.currentUser();
        Store.create('comments', {
            request_id: requestId,
            site_id: null,
            author_id: user.user_id,
            type: 'comment',
            message: '修正して再提出しました',
            is_read: false
        });

        Toast.show('修正を再提出しました', 'success');
        Header.render();
        Router.navigate('/my-requests');
    }

    return { render, resubmit };
})();
