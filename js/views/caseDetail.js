/**
 * FMT CRM - Case Detail View
 * Full-featured: status change, comprehensive site input, corp editing.
 */
const CaseDetailView = (() => {
    function render(container, requestId) {
        if (!requestId) { Router.navigate('/cases'); return; }
        const request = Store.getById('requests', requestId);
        if (!request) { Toast.show('案件が見つかりません', 'error'); Router.navigate('/cases'); return; }

        const corp = Store.getById('corporations', request.corporation_id);
        const sites = Store.query('sites', s => s.request_id === requestId);
        const images = Store.query('images', img => img.request_id === requestId);
        const comments = Store.query('comments', c => c.request_id === requestId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const requester = Store.getById('users', request.requested_by);
        const agency = request.agency_id ? Store.getById('agencies', request.agency_id) : null;

        // Site stats
        const completedSites = sites.filter(s => s.status === 'completed').length;
        const defSites = sites.filter(s => s.status === 'deficiency').length;
        const inprogSites = sites.filter(s => s.status === 'inprogress').length;
        const pendingSites = sites.filter(s => s.status === 'pending').length;

        // Check lock status
        const user = Auth.currentUser();
        if (Store.isLocked(requestId, user.user_id)) {
            const lockerName = request.locked_by_name || '他の担当者';
            Toast.show(`${lockerName}さんが対応中のため、操作できません`, 'error');
            Router.navigate('/cases');
            return;
        }

        container.innerHTML = `
            <div class="page-container">
                <div class="page-header">
                    <h1><i class="fas fa-folder-open" style="color:var(--primary-500)"></i> 案件詳細</h1>
                    <div class="btn-group">
                        <button class="btn btn-secondary" onclick="Router.navigate('/cases')"><i class="fas fa-arrow-left"></i> 戻る</button>
                    </div>
                </div>

                <!-- Summary -->
                <div class="card mb-16">
                    <div class="card-header">
                        <h3><i class="fas fa-info-circle"></i> 依頼情報</h3>
                        ${getStatusBadge(request.status)}
                    </div>
                    <div class="card-body">
                        <div class="form-row">
                            <div><span class="text-sm text-secondary">依頼ID:</span> <span class="font-mono">${request.id.substring(0, 8)}</span></div>
                            <div><span class="text-sm text-secondary">依頼者:</span> ${requester ? requester.name : '-'}</div>
                            <div><span class="text-sm text-secondary">代理店:</span> ${agency ? agency.name : '-'}</div>
                            <div><span class="text-sm text-secondary">依頼日:</span> ${new Date(request.created_at).toLocaleString('ja-JP')}</div>
                        </div>
                        ${request.remarks ? `<div class="mt-8"><span class="text-sm text-secondary">備考:</span> <span class="text-sm">${request.remarks}</span></div>` : ''}
                    </div>
                </div>

                <!-- Status Actions - prominently placed -->
                ${request.status !== 'cancelled' ? `
                    <div class="card mb-16">
                        <div class="card-header"><h3><i class="fas fa-exchange-alt"></i> ステータス変更</h3></div>
                        <div class="card-body">
                            <div class="btn-group" style="flex-wrap:wrap;gap:8px;">
                                ${request.status !== 'inprogress' ? `
                                    <button class="btn btn-primary" onclick="CaseDetailView.changeRequestStatus('${requestId}','inprogress')">
                                        <i class="fas fa-spinner"></i> 対応中に戻す
                                    </button>
                                ` : ''}
                                ${request.status !== 'completed' ? `
                                    <button class="btn btn-success" onclick="CaseDetailView.changeRequestStatus('${requestId}','completed')">
                                        <i class="fas fa-check-circle"></i> 全て投入済にする
                                    </button>
                                ` : ''}
                                ${request.status !== 'deficiency' ? `
                                    <button class="btn btn-warning" onclick="CaseDetailView.reportDeficiency('${requestId}')">
                                        <i class="fas fa-exclamation-triangle"></i> 不備差し戻し
                                    </button>
                                ` : ''}
                                ${request.status === 'completed' ? `
                                    <button class="btn" style="background:var(--status-et-bg);color:var(--status-et);border:1px solid var(--status-et);" onclick="CaseDetailView.changeRequestStatus('${requestId}','et')">
                                        <i class="fas fa-trophy"></i> ET登録(成約)
                                    </button>
                                ` : ''}
                                ${request.status !== 'cancelled' ? `
                                    <button class="btn btn-danger" onclick="CaseDetailView.changeRequestStatus('${requestId}','cancelled')">
                                        <i class="fas fa-ban"></i> キャンセル
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="card mb-16">
                        <div class="card-header"><h3><i class="fas fa-exchange-alt"></i> ステータス変更</h3></div>
                        <div class="card-body">
                            <div class="btn-group">
                                <button class="btn btn-primary" onclick="CaseDetailView.changeRequestStatus('${requestId}','inprogress')">
                                    <i class="fas fa-play"></i> 対応中にする
                                </button>
                                ${request.status === 'et' ? `
                                    <button class="btn btn-success" onclick="CaseDetailView.changeRequestStatus('${requestId}','completed')">
                                        <i class="fas fa-undo"></i> 投入済(未確定)に戻す
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `}

                <!-- Corporation Info -->
                <div class="card mb-16">
                    <div class="card-header">
                        <h3><i class="fas fa-building"></i> 法人情報</h3>
                        <button class="btn btn-sm btn-ghost" onclick="CaseDetailView.editCorp('${request.corporation_id}')"><i class="fas fa-edit"></i> 編集</button>
                    </div>
                    <div class="card-body">
                        ${corp ? `
                            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">
                                <div><span class="text-sm text-secondary">契約者名:</span><br><strong>${corp.last_name} ${corp.first_name || ''}</strong></div>
                                <div><span class="text-sm text-secondary">カナ:</span><br>${corp.last_name_kana || ''} ${corp.first_name_kana || ''}</div>
                                <div><span class="text-sm text-secondary">区分:</span><br>${corp.customer_type === '1' ? '個人' : corp.customer_type === '2' ? '法人' : '屋号'}</div>
                                <div><span class="text-sm text-secondary">住所:</span><br>${corp.prefecture || ''}${corp.city || ''}${corp.town || ''}${corp.street || ''} ${corp.building_name || ''}</div>
                                <div><span class="text-sm text-secondary">TEL:</span><br>${corp.phone1 || '-'}</div>
                                <div><span class="text-sm text-secondary">支払方法:</span><br>${corp.payment_type === '1' ? 'クレジットカード' : corp.payment_type === '2' ? '口座振替' : corp.payment_type === '3' ? 'コンビニ払い' : '-'}</div>
                                <div><span class="text-sm text-secondary">メール:</span><br>${corp.mail_address || '-'}</div>
                                <div><span class="text-sm text-secondary">生年月日:</span><br>${corp.birthday || '-'}</div>
                            </div>
                        ` : '<p class="text-secondary">法人情報なし</p>'}
                    </div>
                </div>

                <!-- Images -->
                <div class="card mb-16">
                    <div class="card-header"><h3><i class="fas fa-image"></i> 明細画像 (${images.length})</h3></div>
                    <div class="card-body">
                        <div class="file-preview-list">
                            ${images.map(img => `
                                <div class="file-preview-item" style="cursor:pointer;" onclick="Modal.imagePreview('${img.file_data}','${img.file_name}')">
                                    <img src="${img.file_data}" alt="${img.file_name}">
                                </div>
                            `).join('') || '<p class="text-secondary">画像なし</p>'}
                        </div>
                    </div>
                </div>

                <!-- Sites -->
                <div class="card mb-16">
                    <div class="card-header">
                        <h3><i class="fas fa-map-marker-alt"></i> 地点一覧 (${sites.length})</h3>
                        <div class="btn-group">
                            <span class="text-sm text-secondary" style="margin-right:8px;">
                                <i class="fas fa-check-circle" style="color:var(--status-completed)"></i> ${completedSites}
                                <i class="fas fa-spinner" style="color:var(--status-inprogress);margin-left:8px;"></i> ${inprogSites}
                                ${defSites > 0 ? `<i class="fas fa-exclamation-circle" style="color:var(--status-deficiency);margin-left:8px;"></i> ${defSites}` : ''}
                            </span>
                            ${request.status !== 'cancelled' ? `
                                <button class="btn btn-sm btn-primary" onclick="CaseDetailView.addSite('${requestId}')">
                                    <i class="fas fa-plus"></i> 地点追加
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="card-body">
                        ${sites.length === 0 ? `
                            <div class="empty-state" style="padding:24px;">
                                <i class="fas fa-map-marker-alt"></i>
                                <h3>地点が未作成です</h3>
                                <p>明細画像を確認して地点を作成してください</p>
                            </div>
                        ` : sites.map(site => renderSiteCard(site, requestId)).join('')}
                    </div>
                </div>

                <!-- Comments -->
                <div class="card mb-16">
                    <div class="card-header"><h3><i class="fas fa-comments"></i> コメント・履歴</h3></div>
                    <div class="card-body">
                        ${comments.map(c => {
            const author = Store.getById('users', c.author_id);
            return `
                                <div style="padding:10px;margin-bottom:6px;background:${c.type === 'deficiency' ? 'var(--status-deficiency-bg)' : 'var(--gray-50)'};border-radius:var(--border-radius);border-left:3px solid ${c.type === 'deficiency' ? 'var(--status-deficiency)' : 'var(--gray-300)'};">
                                    <div class="flex justify-between items-center">
                                        <strong class="text-sm">${author ? author.name : '不明'}</strong>
                                        <span class="text-xs text-secondary">${new Date(c.created_at).toLocaleString('ja-JP')}</span>
                                    </div>
                                    <p class="text-sm mt-4">${c.message}</p>
                                </div>
                            `;
        }).join('') || '<p class="text-secondary">コメントなし</p>'}
                    </div>
                </div>
            </div>
        `;
    }

    function renderSiteCard(site, requestId) {
        const appTypeMap = { '1': '他社切替', '2': '入居', '4': '移転', '5': '切替(開業)' };
        return `
            <div class="expandable-group">
                <div class="expandable-header" onclick="this.classList.toggle('expanded');this.nextElementSibling.classList.toggle('show');">
                    <div class="flex items-center gap-12">
                        ${getStatusBadge(site.status)}
                        <strong>${site.supply_point_id || '地点番号未設定'}</strong>
                        <span class="text-sm text-secondary">${site.service_type === 'gas' ? 'ガス' : '電気'}</span>
                        <span class="text-sm text-secondary">${site.pps_name || ''}</span>
                    </div>
                    <i class="fas fa-chevron-down chevron"></i>
                </div>
                <div class="expandable-body">
                    <div style="padding:16px;">
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:16px;">
                            <div><span class="text-xs text-secondary">PPS:</span><br><strong class="text-sm">${site.pps_name || '-'}</strong></div>
                            <div><span class="text-xs text-secondary">契約プラン:</span><br><strong class="text-sm">${site.plan_name || '-'}</strong></div>
                            <div><span class="text-xs text-secondary">申込区分:</span><br><strong class="text-sm">${appTypeMap[site.application_type] || '-'}</strong></div>
                            <div><span class="text-xs text-secondary">契約容量:</span><br><strong class="text-sm">${site.contract_capacity || '-'}</strong></div>
                            <div><span class="text-xs text-secondary">名義人:</span><br><strong class="text-sm">${site.power_customer_last_name || ''} ${site.power_customer_first_name || ''}</strong></div>
                            <div><span class="text-xs text-secondary">名義カナ:</span><br><strong class="text-sm">${site.power_customer_last_name_kana || ''} ${site.power_customer_first_name_kana || ''}</strong></div>
                            <div><span class="text-xs text-secondary">住所:</span><br><strong class="text-sm">${site.power_prefecture || ''}${site.power_city || ''}${site.power_town || ''}${site.power_street || ''}</strong></div>
                            <div><span class="text-xs text-secondary">建物名:</span><br><strong class="text-sm">${site.power_building_name || '-'}</strong></div>
                            <div><span class="text-xs text-secondary">最新料金:</span><br><strong class="text-sm">${site.latest_charges ? site.latest_charges + '円' : '-'}</strong></div>
                            <div><span class="text-xs text-secondary">最新使用量:</span><br><strong class="text-sm">${site.latest_usage ? site.latest_usage + 'kWh' : '-'}</strong></div>
                            <div><span class="text-xs text-secondary">最新明細年月:</span><br><strong class="text-sm">${site.latest_date || '-'}</strong></div>
                            <div><span class="text-xs text-secondary">入居日:</span><br><strong class="text-sm">${site.moving_in_date || '-'}</strong></div>
                        </div>
                        ${site.note ? `<div style="margin-bottom:12px;padding:8px;background:var(--gray-50);border-radius:var(--border-radius);"><span class="text-xs text-secondary">メモ:</span> <span class="text-sm">${site.note}</span></div>` : ''}
                        <div class="btn-group" style="gap:8px;">
                            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();CaseDetailView.editSite('${site.id}','${requestId}')"><i class="fas fa-edit"></i> 地点情報入力</button>
                            ${site.status === 'inprogress' ? `<button class="btn btn-sm btn-success" onclick="event.stopPropagation();CaseDetailView.completeSite('${site.id}','${requestId}')"><i class="fas fa-check"></i> 投入済にする</button>` : ''}
                            ${site.status === 'completed' ? `<button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();CaseDetailView.reopenSite('${site.id}','${requestId}')"><i class="fas fa-undo"></i> 対応中に戻す</button>` : ''}
                            ${site.status === 'deficiency' ? `<button class="btn btn-sm btn-warning" onclick="event.stopPropagation();CaseDetailView.reopenSite('${site.id}','${requestId}')"><i class="fas fa-undo"></i> 対応中に戻す</button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // --- Status Change for entire request ---
    function changeRequestStatus(requestId, newStatus) {
        const labels = { inprogress: '対応中', completed: '投入済', deficiency: '不備', cancelled: 'キャンセル', pending: '対応待ち', et: 'ET(成約)' };

        // Lock check when starting work
        if (newStatus === 'inprogress') {
            const user = Auth.currentUser();
            if (!Store.lockRequest(requestId, user.user_id, user.name)) {
                Toast.show('他の担当者が編集中か、ロックできませんでした', 'error');
                return;
            }
        } else {
            // Unlock if moving away from inprogress (to completed, deficiency, cancelled, or back to pending)
            Store.unlockRequest(requestId);
        }

        Modal.confirm(
            'ステータス変更',
            `この案件を「${labels[newStatus]}」に変更しますか？`,
            () => {
                Store.changeStatus('requests', requestId, newStatus);
                // Cascade to sites if completing all
                if (newStatus === 'completed') {
                    const sites = Store.query('sites', s => s.request_id === requestId);
                    sites.forEach(s => {
                        if (s.status !== 'cancelled') Store.changeStatus('sites', s.id, 'completed');
                    });
                }
                if (newStatus === 'cancelled') {
                    const sites = Store.query('sites', s => s.request_id === requestId);
                    sites.forEach(s => {
                        if (s.status !== 'cancelled') Store.changeStatus('sites', s.id, 'cancelled');
                    });
                }
                if (newStatus === 'et') {
                    const sites = Store.query('sites', s => s.request_id === requestId);
                    sites.forEach(s => {
                        if (s.status !== 'cancelled') Store.changeStatus('sites', s.id, 'et');
                    });
                }
                Toast.show(`ステータスを「${labels[newStatus]}」に変更しました`, 'success');
                Router.handleRoute();
            },
            '変更する',
            newStatus === 'cancelled' ? 'btn-danger' : newStatus === 'completed' ? 'btn-success' : 'btn-primary'
        );
    }

    function addSite(requestId) {
        Modal.show('地点作成', `
            <div class="form-group">
                <label class="form-label">供給地点特定番号</label>
                <input type="text" class="form-input" id="new-site-spid" placeholder="例: 0312345678901234567890">
            </div>
            <div class="form-group">
                <label class="form-label">サービス種別</label>
                <select class="form-select" id="new-site-service">
                    <option value="electric">電気</option>
                    <option value="gas">ガス</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">PPS</label>
                <select class="form-select" id="new-site-pps">
                    <option value="A0517" data-name="エネパル">エネパル</option>
                    <option value="A0023" data-name="サイサン(ガス)">サイサン(ガス)</option>
                    <option value="A0086" data-name="エコログガス">エコログガス</option>
                </select>
            </div>
        `, `
            <button class="btn btn-secondary" onclick="Modal.hide()">キャンセル</button>
            <button class="btn btn-primary" onclick="CaseDetailView.saveSite('${requestId}')"><i class="fas fa-plus"></i> 作成</button>
        `);
    }

    function saveSite(requestId) {
        const spid = document.getElementById('new-site-spid').value;
        const serviceType = document.getElementById('new-site-service').value;
        const ppsSelect = document.getElementById('new-site-pps');
        const ppsCode = ppsSelect.value;
        const ppsName = ppsSelect.options[ppsSelect.selectedIndex].dataset.name;

        Store.create('sites', {
            request_id: requestId,
            corporation_id: Store.getById('requests', requestId).corporation_id,
            supply_point_id: spid,
            service_type: serviceType,
            pps_code: ppsCode,
            pps_name: ppsName,
            application_type: '',
            plan_name: '',
            contract_capacity: '',
            power_customer_last_name: '',
            power_customer_first_name: '',
            power_customer_last_name_kana: '',
            power_customer_first_name_kana: '',
            power_zip_code: '',
            power_prefecture: '',
            power_city: '',
            power_town: '',
            power_street: '',
            power_building_name: '',
            latest_charges: '',
            latest_usage: '',
            latest_date: '',
            option_plans: [],
            moving_in_date: '',
            note: '',
            contract_corporation_type: '',
            saisan_gas_yoto: '',
            ecolog_gas_yoto: '',
            power_amounts_form: '',
            status: 'inprogress'
        });

        Modal.hide();
        Toast.show('地点を作成しました', 'success');

        const newStatus = Store.computeRequestStatus(requestId);
        Store.update('requests', requestId, { status: newStatus }, true);

        Router.handleRoute();
    }

    // --- Comprehensive Site Edit ---
    function editSite(siteId, requestId) {
        const site = Store.getById('sites', siteId);
        if (!site) return;

        const request = Store.getById('requests', requestId);
        if (!request) return;
        const corp = Store.getById('corporations', request.corporation_id);

        Modal.show('地点情報入力', `
            <div style="max-height:65vh;overflow-y:auto;padding-right:8px;">
                <h4 style="margin:0 0 12px;color:var(--primary-600);"><i class="fas fa-bolt"></i> 基本情報</h4>
                <div class="form-group">
                    <label class="form-label">供給地点特定番号</label>
                    <input type="text" class="form-input" id="edit-spid" value="${site.supply_point_id || ''}">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">サービス種別</label>
                        <select class="form-select" id="edit-service-type">
                            <option value="electric" ${site.service_type === 'electric' ? 'selected' : ''}>電気</option>
                            <option value="gas" ${site.service_type === 'gas' ? 'selected' : ''}>ガス</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">PPS</label>
                        <select class="form-select" id="edit-pps">
                            <option value="A0517" data-name="エネパル" ${site.pps_code === 'A0517' ? 'selected' : ''}>エネパル</option>
                            <option value="A0023" data-name="サイサン(ガス)" ${site.pps_code === 'A0023' ? 'selected' : ''}>サイサン(ガス)</option>
                            <option value="A0086" data-name="エコログガス" ${site.pps_code === 'A0086' ? 'selected' : ''}>エコログガス</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">申込区分</label>
                        <select class="form-select" id="edit-app-type">
                            <option value="">選択</option>
                            <option value="1" ${site.application_type === '1' ? 'selected' : ''}>他社切替</option>
                            <option value="2" ${site.application_type === '2' ? 'selected' : ''}>入居</option>
                            <option value="4" ${site.application_type === '4' ? 'selected' : ''}>移転</option>
                            <option value="5" ${site.application_type === '5' ? 'selected' : ''}>切替(開業)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">契約プラン</label>
                        <input type="text" class="form-input" id="edit-plan" value="${site.plan_name || ''}" placeholder="例: Eプラン">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">契約容量</label>
                        <input type="text" class="form-input" id="edit-capacity" value="${site.contract_capacity || ''}" placeholder="例: 40A">
                    </div>
                    <div class="form-group">
                        <label class="form-label">契約者法人区分</label>
                        <select class="form-select" id="edit-corp-type">
                            <option value="">選択</option>
                            <option value="1" ${site.contract_corporation_type === '1' ? 'selected' : ''}>個人</option>
                            <option value="2" ${site.contract_corporation_type === '2' ? 'selected' : ''}>法人</option>
                            <option value="3" ${site.contract_corporation_type === '3' ? 'selected' : ''}>屋号</option>
                        </select>
                    </div>
                </div>

                <h4 style="margin:20px 0 12px;color:var(--primary-600);"><i class="fas fa-user"></i> 電力名義人情報</h4>
                <div class="btn-group mb-8">
                    <button type="button" class="btn btn-sm btn-ghost" onclick="CaseDetailView.copyCorp('${requestId}')">
                        <i class="fas fa-copy"></i> 法人情報からコピー
                    </button>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">名義人（姓）</label>
                        <input type="text" class="form-input" id="edit-pclname" value="${site.power_customer_last_name || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">名義人（名）</label>
                        <input type="text" class="form-input" id="edit-pcfname" value="${site.power_customer_first_name || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">名義カナ（セイ）</label>
                        <input type="text" class="form-input" id="edit-pclkana" value="${site.power_customer_last_name_kana || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">名義カナ（メイ）</label>
                        <input type="text" class="form-input" id="edit-pcfkana" value="${site.power_customer_first_name_kana || ''}">
                    </div>
                </div>

                <h4 style="margin:20px 0 12px;color:var(--primary-600);"><i class="fas fa-map-marker-alt"></i> 電力供給先住所</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">郵便番号</label>
                        <input type="text" class="form-input" id="edit-pzip" value="${site.power_zip_code || ''}" maxlength="7">
                    </div>
                    <div class="form-group">
                        <label class="form-label">都道府県</label>
                        <select class="form-select" id="edit-ppref"><option value="">選択</option>${getPrefectureOptions()}</select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">市区町村</label>
                        <input type="text" class="form-input" id="edit-pcity" value="${site.power_city || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">町域</label>
                        <input type="text" class="form-input" id="edit-ptown" value="${site.power_town || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">番地</label>
                        <input type="text" class="form-input" id="edit-pstreet" value="${site.power_street || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">建物名</label>
                        <input type="text" class="form-input" id="edit-pbuilding" value="${site.power_building_name || ''}">
                    </div>
                </div>

                <h4 style="margin:20px 0 12px;color:var(--primary-600);"><i class="fas fa-file-invoice"></i> 明細情報</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">最新明細料金（円）</label>
                        <input type="text" class="form-input" id="edit-charges" value="${site.latest_charges || ''}" placeholder="例: 12500">
                    </div>
                    <div class="form-group">
                        <label class="form-label">最新使用量（kWh/m3）</label>
                        <input type="text" class="form-input" id="edit-usage" value="${site.latest_usage || ''}" placeholder="例: 350">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">最新明細年月</label>
                        <input type="month" class="form-input" id="edit-date" value="${site.latest_date || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">入居予定日</label>
                        <input type="date" class="form-input" id="edit-moving" value="${site.moving_in_date || ''}">
                    </div>
                </div>

                <h4 style="margin:20px 0 12px;color:var(--primary-600);"><i class="fas fa-cog"></i> オプション・その他</h4>
                <div class="form-group">
                    <label class="form-label">オプションプラン</label>
                    <input type="text" class="form-input" id="edit-options" value="${(site.option_plans || []).join(', ')}" placeholder="カンマ区切りで入力">
                </div>
                <div class="form-group">
                    <label class="form-label">メモ</label>
                    <textarea class="form-textarea" id="edit-note">${site.note || ''}</textarea>
                </div>
            </div>
        `, `
            <button class="btn btn-secondary" onclick="Modal.hide()">キャンセル</button>
            <button class="btn btn-primary" onclick="CaseDetailView.updateSite('${siteId}','${requestId}')"><i class="fas fa-save"></i> 保存</button>
        `);

        // Set select values after render
        setTimeout(() => {
            const prefEl = document.getElementById('edit-ppref');
            if (prefEl && site.power_prefecture) prefEl.value = site.power_prefecture;
        }, 50);
    }

    // Copy corporation info to site fields
    function copyCorp(requestId) {
        const request = Store.getById('requests', requestId);
        if (!request) return;
        const corp = Store.getById('corporations', request.corporation_id);
        if (!corp) return;

        const fields = {
            'edit-pclname': corp.last_name,
            'edit-pcfname': corp.first_name,
            'edit-pclkana': corp.last_name_kana,
            'edit-pcfkana': corp.first_name_kana,
            'edit-pzip': corp.zip_code,
            'edit-pcity': corp.city,
            'edit-ptown': corp.town,
            'edit-pstreet': corp.street,
            'edit-pbuilding': corp.building_name
        };
        for (const [id, val] of Object.entries(fields)) {
            const el = document.getElementById(id);
            if (el && val) el.value = val;
        }
        const prefEl = document.getElementById('edit-ppref');
        if (prefEl && corp.prefecture) prefEl.value = corp.prefecture;

        Toast.show('法人情報をコピーしました', 'info');
    }

    function updateSite(siteId, requestId) {
        const ppsSelect = document.getElementById('edit-pps');
        const ppsName = ppsSelect ? ppsSelect.options[ppsSelect.selectedIndex].dataset.name : '';
        const optionsStr = document.getElementById('edit-options').value;

        Store.update('sites', siteId, {
            supply_point_id: document.getElementById('edit-spid').value,
            service_type: document.getElementById('edit-service-type').value,
            pps_code: ppsSelect ? ppsSelect.value : '',
            pps_name: ppsName,
            application_type: document.getElementById('edit-app-type').value,
            plan_name: document.getElementById('edit-plan').value,
            contract_capacity: document.getElementById('edit-capacity').value,
            contract_corporation_type: document.getElementById('edit-corp-type').value,
            power_customer_last_name: document.getElementById('edit-pclname').value,
            power_customer_first_name: document.getElementById('edit-pcfname').value,
            power_customer_last_name_kana: document.getElementById('edit-pclkana').value,
            power_customer_first_name_kana: document.getElementById('edit-pcfkana').value,
            power_zip_code: document.getElementById('edit-pzip').value,
            power_prefecture: document.getElementById('edit-ppref').value,
            power_city: document.getElementById('edit-pcity').value,
            power_town: document.getElementById('edit-ptown').value,
            power_street: document.getElementById('edit-pstreet').value,
            power_building_name: document.getElementById('edit-pbuilding').value,
            latest_charges: document.getElementById('edit-charges').value,
            latest_usage: document.getElementById('edit-usage').value,
            latest_date: document.getElementById('edit-date').value,
            moving_in_date: document.getElementById('edit-moving').value,
            option_plans: optionsStr ? optionsStr.split(',').map(s => s.trim()) : [],
            note: document.getElementById('edit-note').value
        });

        Modal.hide();
        Toast.show('地点情報を保存しました', 'success');
        Router.handleRoute();
    }

    function completeSite(siteId, requestId) {
        Modal.confirm('投入済確認', 'この地点をキャリア管理画面に投入済としてマークしますか？', () => {
            Store.changeStatus('sites', siteId, 'completed');
            const newStatus = Store.computeRequestStatus(requestId);
            Store.update('requests', requestId, { status: newStatus }, true);
            Toast.show('地点を投入済にしました', 'success');
            Router.handleRoute();
        }, '投入済にする', 'btn-success');
    }

    function reopenSite(siteId, requestId) {
        Store.changeStatus('sites', siteId, 'inprogress');
        const newStatus = Store.computeRequestStatus(requestId);
        Store.update('requests', requestId, { status: newStatus }, true);
        Toast.show('地点を対応中に戻しました', 'info');
        Router.handleRoute();
    }

    function reportDeficiency(requestId) {
        Modal.show('不備差し戻し', `
            <div class="form-group">
                <label class="form-label">不備理由 <span class="required">*</span></label>
                <textarea class="form-textarea" id="deficiency-reason" placeholder="具体的な不備の内容を記載してください"></textarea>
            </div>
        `, `
            <button class="btn btn-secondary" onclick="Modal.hide()">キャンセル</button>
            <button class="btn btn-warning" onclick="CaseDetailView.submitDeficiency('${requestId}')"><i class="fas fa-exclamation-triangle"></i> 差し戻し</button>
        `);
    }

    function submitDeficiency(requestId) {
        const reason = document.getElementById('deficiency-reason').value.trim();
        if (!reason) { Toast.show('不備理由を入力してください', 'error'); return; }

        const user = Auth.currentUser();
        Store.create('comments', {
            request_id: requestId,
            site_id: null,
            author_id: user.user_id,
            type: 'deficiency',
            message: reason,
            is_read: false
        });

        Store.changeStatus('requests', requestId, 'deficiency');
        const sites = Store.query('sites', s => s.request_id === requestId && s.status === 'inprogress');
        sites.forEach(s => Store.changeStatus('sites', s.id, 'deficiency'));

        Modal.hide();
        Toast.show('不備として差し戻しました', 'success');
        Router.handleRoute();
    }

    function editCorp(corpId) {
        const corp = Store.getById('corporations', corpId);
        if (!corp) return;

        Modal.show('法人情報編集', `
            <div style="max-height:65vh;overflow-y:auto;padding-right:8px;">
                <div class="form-group">
                    <label class="form-label">契約者区分</label>
                    <select class="form-select" id="ec-type">
                        <option value="1" ${corp.customer_type === '1' ? 'selected' : ''}>個人</option>
                        <option value="2" ${corp.customer_type === '2' ? 'selected' : ''}>法人</option>
                        <option value="3" ${corp.customer_type === '3' ? 'selected' : ''}>屋号</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">姓</label><input type="text" class="form-input" id="ec-last" value="${corp.last_name || ''}"></div>
                    <div class="form-group"><label class="form-label">名</label><input type="text" class="form-input" id="ec-first" value="${corp.first_name || ''}"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">カナ（セイ）</label><input type="text" class="form-input" id="ec-lkana" value="${corp.last_name_kana || ''}"></div>
                    <div class="form-group"><label class="form-label">カナ（メイ）</label><input type="text" class="form-input" id="ec-fkana" value="${corp.first_name_kana || ''}"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">郵便番号</label><input type="text" class="form-input" id="ec-zip" value="${corp.zip_code || ''}"></div>
                    <div class="form-group"><label class="form-label">都道府県</label><select class="form-select" id="ec-pref"><option value="">選択</option>${getPrefectureOptions()}</select></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">市区町村</label><input type="text" class="form-input" id="ec-city" value="${corp.city || ''}"></div>
                    <div class="form-group"><label class="form-label">町域</label><input type="text" class="form-input" id="ec-town" value="${corp.town || ''}"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">番地</label><input type="text" class="form-input" id="ec-street" value="${corp.street || ''}"></div>
                    <div class="form-group"><label class="form-label">建物名</label><input type="text" class="form-input" id="ec-building" value="${corp.building_name || ''}"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">TEL1</label><input type="text" class="form-input" id="ec-phone" value="${corp.phone1 || ''}"></div>
                    <div class="form-group"><label class="form-label">TEL2</label><input type="text" class="form-input" id="ec-phone2" value="${corp.phone2 || ''}"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label class="form-label">メール</label><input type="text" class="form-input" id="ec-email" value="${corp.mail_address || ''}"></div>
                    <div class="form-group"><label class="form-label">生年月日</label><input type="date" class="form-input" id="ec-birthday" value="${corp.birthday || ''}"></div>
                </div>
                <div class="form-group"><label class="form-label">支払方法</label>
                    <select class="form-select" id="ec-payment">
                        <option value="">選択</option>
                        <option value="1" ${corp.payment_type === '1' ? 'selected' : ''}>クレジットカード</option>
                        <option value="2" ${corp.payment_type === '2' ? 'selected' : ''}>口座振替</option>
                        <option value="3" ${corp.payment_type === '3' ? 'selected' : ''}>コンビニ払い</option>
                    </select>
                </div>
            </div>
        `, `
            <button class="btn btn-secondary" onclick="Modal.hide()">キャンセル</button>
            <button class="btn btn-primary" onclick="CaseDetailView.saveCorp('${corpId}')"><i class="fas fa-save"></i> 保存</button>
        `);

        setTimeout(() => {
            const prefEl = document.getElementById('ec-pref');
            if (prefEl && corp.prefecture) prefEl.value = corp.prefecture;
        }, 50);
    }

    function saveCorp(corpId) {
        Store.update('corporations', corpId, {
            customer_type: document.getElementById('ec-type').value,
            last_name: document.getElementById('ec-last').value,
            first_name: document.getElementById('ec-first').value,
            last_name_kana: document.getElementById('ec-lkana').value,
            first_name_kana: document.getElementById('ec-fkana').value,
            zip_code: document.getElementById('ec-zip').value,
            prefecture: document.getElementById('ec-pref').value,
            city: document.getElementById('ec-city').value,
            town: document.getElementById('ec-town').value,
            street: document.getElementById('ec-street').value,
            building_name: document.getElementById('ec-building').value,
            phone1: document.getElementById('ec-phone').value,
            phone2: document.getElementById('ec-phone2').value,
            mail_address: document.getElementById('ec-email').value,
            birthday: document.getElementById('ec-birthday').value,
            payment_type: document.getElementById('ec-payment').value
        });
        Modal.hide();
        Toast.show('法人情報を保存しました', 'success');
        Router.handleRoute();
    }

    function getStatusBadge(status) {
        const map = {
            deficiency: { label: '不備', class: 'status-deficiency', icon: 'fas fa-exclamation-circle' },
            pending: { label: '対応待ち', class: 'status-pending', icon: 'fas fa-clock' },
            inprogress: { label: '対応中', class: 'status-inprogress', icon: 'fas fa-spinner' },
            completed: { label: '投入済', class: 'status-completed', icon: 'fas fa-check-circle' },
            cancelled: { label: 'キャンセル', class: 'status-cancelled', icon: 'fas fa-ban' },
            et: { label: 'ET(成約)', class: 'status-et', icon: 'fas fa-trophy' }
        };
        const s = map[status] || { label: status, class: '', icon: '' };
        return `<span class="status-badge ${s.class}"><i class="${s.icon}"></i> ${s.label}</span>`;
    }

    return {
        render, addSite, saveSite, editSite, updateSite,
        completeSite, reopenSite, changeRequestStatus,
        reportDeficiency, submitDeficiency,
        editCorp, saveCorp, copyCorp
    };
})();
