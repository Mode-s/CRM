/**
 * FMT CRM - New Request View
 * Sales rep creates a new input request with corporation info + images.
 */
const NewRequestView = (() => {
    let uploadedImages = [];

    function render(container) {
        uploadedImages = [];
        const user = Auth.currentUser();
        const backPath = user.role === 'admin' ? '/cases' : '/my-requests';

        container.innerHTML = `
            <div class="page-container">
                <div class="page-header">
                    <h1><i class="fas fa-plus-circle" style="color:var(--primary-500)"></i> 新規投入依頼</h1>
                    <button class="btn btn-secondary" onclick="Router.navigate('${backPath}')">
                        <i class="fas fa-arrow-left"></i> 戻る
                    </button>
                </div>

                <form id="new-request-form">
                    <!-- Corporation Search -->
                    <div class="form-section">
                        <div class="form-section-title"><i class="fas fa-search"></i> 法人検索（既存法人がある場合）</div>
                        <div class="form-row">
                            <div class="form-group">
                                <input type="text" class="form-input" id="corp-search" placeholder="法人名・契約者名で検索...">
                            </div>
                            <div class="form-group">
                                <button type="button" class="btn btn-secondary" onclick="NewRequestView.searchCorp()">
                                    <i class="fas fa-search"></i> 検索
                                </button>
                                <button type="button" class="btn btn-ghost" onclick="NewRequestView.clearSearch()">
                                    クリア
                                </button>
                            </div>
                        </div>
                        <div id="corp-search-results"></div>
                        <input type="hidden" id="selected-corp-id" value="">
                    </div>

                    <!-- Corporation Info -->
                    <div class="form-section" id="corp-form-section">
                        <div class="form-section-title"><i class="fas fa-building"></i> 法人・契約者情報</div>

                        <div class="form-group">
                            <label class="form-label">契約者区分 <span class="required">*</span></label>
                            <select class="form-select" id="customer_type" required>
                                <option value="">選択してください</option>
                                <option value="1">個人</option>
                                <option value="2">法人</option>
                                <option value="3">屋号</option>
                            </select>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">契約者名（姓）<span class="required">*</span></label>
                                <input type="text" class="form-input" id="last_name" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">契約者名（名）<span class="required">*</span></label>
                                <input type="text" class="form-input" id="first_name" required>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">契約者名カナ（セイ）<span class="required">*</span></label>
                                <input type="text" class="form-input" id="last_name_kana" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">契約者名カナ（メイ）<span class="required">*</span></label>
                                <input type="text" class="form-input" id="first_name_kana" required>
                            </div>
                        </div>

                        <div id="corp-fields" style="display:none;">
                            <div class="form-group">
                                <label class="form-label">法人番号（13桁）</label>
                                <input type="text" class="form-input" id="corporation_number" maxlength="13">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">代表者名（姓）</label>
                                    <input type="text" class="form-input" id="representative_last_name">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">代表者名（名）</label>
                                    <input type="text" class="form-input" id="representative_first_name">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">代表者カナ（セイ）</label>
                                    <input type="text" class="form-input" id="representative_last_name_kana">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">代表者カナ（メイ）</label>
                                    <input type="text" class="form-input" id="representative_first_name_kana">
                                </div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">郵便番号 <span class="required">*</span></label>
                                <input type="text" class="form-input" id="zip_code" placeholder="1234567" maxlength="7" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">都道府県 <span class="required">*</span></label>
                                <select class="form-select" id="prefecture" required>
                                    <option value="">選択</option>
                                    ${getPrefectureOptions()}
                                </select>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">市区町村 <span class="required">*</span></label>
                                <input type="text" class="form-input" id="city" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">町域</label>
                                <input type="text" class="form-input" id="town">
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">番地・建物名</label>
                            <input type="text" class="form-input" id="street">
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">連絡先番号1 <span class="required">*</span></label>
                                <input type="tel" class="form-input" id="phone1" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">連絡先番号2</label>
                                <input type="tel" class="form-input" id="phone2">
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">生年月日</label>
                            <input type="date" class="form-input" id="birthday">
                        </div>

                        <div class="form-group">
                            <label class="form-label">業種</label>
                            <input type="text" class="form-input" id="job_type" placeholder="例: 飲食業">
                        </div>
                    </div>

                    <!-- Payment Info -->
                    <div class="form-section" id="payment-section">
                        <div class="form-section-title"><i class="fas fa-credit-card"></i> 支払情報</div>

                        <div class="form-group">
                            <label class="form-label">支払方法 <span class="required">*</span></label>
                            <select class="form-select" id="payment_type" required>
                                <option value="">選択してください</option>
                                <option value="1">クレジットカード</option>
                                <option value="2">口座振替（銀行引落し）</option>
                                <option value="3">コンビニ払い（請求書払い）</option>
                            </select>
                        </div>
                    </div>

                    <!-- Billing Address -->
                    <div class="form-section" id="billing-section">
                        <div class="form-section-title"><i class="fas fa-envelope"></i> 請求書送付先</div>
                        <div class="form-check mb-16">
                            <input type="checkbox" id="billing_address_same" checked>
                            <label for="billing_address_same">契約者住所と同一</label>
                        </div>
                        <div id="billing-fields" style="display:none;">
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">郵便番号</label>
                                    <input type="text" class="form-input" id="billing_zip_code" maxlength="7">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">都道府県</label>
                                    <select class="form-select" id="billing_prefecture">${getPrefectureOptions()}</select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">市区町村</label>
                                    <input type="text" class="form-input" id="billing_city">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">町域</label>
                                    <input type="text" class="form-input" id="billing_town">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">番地・建物名</label>
                                <input type="text" class="form-input" id="billing_street">
                            </div>
                            <div class="form-group">
                                <label class="form-label">宛名</label>
                                <input type="text" class="form-input" id="billing_customer_name">
                            </div>
                        </div>
                    </div>

                    <!-- Images Upload -->
                    <div class="form-section">
                        <div class="form-section-title"><i class="fas fa-image"></i> 明細画像アップロード</div>
                        <div class="file-upload-area" id="image-upload-area">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <p>クリックまたはドラッグ&ドロップで画像をアップロード</p>
                            <p class="text-sm text-secondary">JPEG, PNG（1枚あたり最大5MB）</p>
                            <input type="file" id="image-file-input" multiple accept="image/*" style="display:none;">
                        </div>
                        <div class="file-preview-list" id="image-preview-list"></div>
                    </div>

                    <!-- Request Details -->
                    <div class="form-section">
                        <div class="form-section-title"><i class="fas fa-info-circle"></i> 依頼情報</div>
                        <div class="form-group">
                            <label class="form-label">代理店 <span class="required">*</span></label>
                            <select class="form-select" id="agency_id" required ${user.role !== 'admin' ? 'disabled' : ''}>
                                <option value="">選択してください</option>
                                ${Store.getAll('agencies').map(a => `<option value="${a.id}" ${a.id === user.agency_id ? 'selected' : ''}>${a.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">地点数（見込み）</label>
                                <input type="number" class="form-input" id="site_count" min="1" value="1">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">備考</label>
                            <textarea class="form-textarea" id="remarks" placeholder="支払方法の分割指示、明細画像がない場合の明細情報等"></textarea>
                        </div>
                    </div>

                    <!-- Submit -->
                    <div class="flex justify-between mt-24">
                        <button type="button" class="btn btn-secondary" onclick="Router.navigate('${backPath}')">キャンセル</button>
                        <button type="submit" class="btn btn-primary btn-lg">
                            <i class="fas fa-paper-plane"></i> 投入依頼を送信
                        </button>
                    </div>
                </form>
            </div>
        `;

        setupEventListeners();
    }

    function setupEventListeners() {
        // Customer type toggle
        document.getElementById('customer_type').addEventListener('change', (e) => {
            const corpFields = document.getElementById('corp-fields');
            corpFields.style.display = (e.target.value === '2' || e.target.value === '3') ? 'block' : 'none';
        });

        // Billing address toggle
        document.getElementById('billing_address_same').addEventListener('change', (e) => {
            document.getElementById('billing-fields').style.display = e.target.checked ? 'none' : 'block';
        });

        // Image upload
        const uploadArea = document.getElementById('image-upload-area');
        const fileInput = document.getElementById('image-file-input');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });
        fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

        // Postal code auto-fill
        setupZipAutoFill('zip_code', 'prefecture', 'city', 'town');
        setupZipAutoFill('billing_zip_code', 'billing_prefecture', 'billing_city', 'billing_town');

        // Form submit
        document.getElementById('new-request-form').addEventListener('submit', handleSubmit);
    }

    function setupZipAutoFill(zipId, prefId, cityId, townId) {
        const zipEl = document.getElementById(zipId);
        if (!zipEl) return;
        zipEl.addEventListener('input', () => {
            const zip = zipEl.value.replace(/[^0-9]/g, '');
            if (zip.length === 7) {
                fetchAddress(zip, prefId, cityId, townId);
            }
        });
    }

    function handleFiles(fileList) {
        Array.from(fileList).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                // Resize image
                resizeImage(e.target.result, 1200, 0.7, (resizedData) => {
                    uploadedImages.push({ name: file.name, data: resizedData });
                    renderPreviews();
                });
            };
            reader.readAsDataURL(file);
        });
    }

    function resizeImage(dataUrl, maxSize, quality, callback) {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width, h = img.height;
            if (w > maxSize || h > maxSize) {
                if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
                else { w = Math.round(w * maxSize / h); h = maxSize; }
            }
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            callback(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = dataUrl;
    }

    function renderPreviews() {
        const list = document.getElementById('image-preview-list');
        list.innerHTML = uploadedImages.map((img, i) => `
            <div class="file-preview-item">
                <img src="${img.data}" alt="${img.name}" onclick="Modal.imagePreview('${img.data}','${img.name}')">
                <button class="remove-btn" onclick="NewRequestView.removeImage(${i})"><i class="fas fa-times"></i></button>
            </div>
        `).join('');
    }

    function removeImage(index) {
        uploadedImages.splice(index, 1);
        renderPreviews();
    }

    function searchCorp() {
        const keyword = document.getElementById('corp-search').value.trim();
        if (!keyword) return;

        const user = Auth.currentUser();
        let corps = Store.getAll('corporations');

        // Filter by agency if sales
        if (user.role === 'sales' && user.agency_id) {
            const myRequests = Store.query('requests', r => r.requested_by === user.user_id);
            const myCorpIds = [...new Set(myRequests.map(r => r.corporation_id))];
            corps = corps.filter(c => myCorpIds.includes(c.id));
        }

        const results = corps.filter(c =>
            (c.last_name && c.last_name.includes(keyword)) ||
            (c.first_name && c.first_name.includes(keyword)) ||
            (c.last_name_kana && c.last_name_kana.includes(keyword))
        );

        const resultsEl = document.getElementById('corp-search-results');
        if (results.length === 0) {
            resultsEl.innerHTML = '<p class="text-sm text-secondary mt-8">該当する法人が見つかりません。新規入力してください。</p>';
        } else {
            resultsEl.innerHTML = `
                <div class="table-container mt-8">
                    <table class="data-table">
                        <thead><tr><th>契約者名</th><th>住所</th><th>操作</th></tr></thead>
                        <tbody>
                            ${results.map(c => `
                                <tr>
                                    <td>${c.last_name} ${c.first_name || ''}</td>
                                    <td class="text-sm">${c.prefecture || ''}${c.city || ''}</td>
                                    <td><button class="btn btn-sm btn-primary" onclick="NewRequestView.selectCorp('${c.id}')">選択</button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    }

    function selectCorp(corpId) {
        document.getElementById('selected-corp-id').value = corpId;
        const corp = Store.getById('corporations', corpId);
        if (corp) {
            // Fill form fields
            const fields = ['customer_type', 'last_name', 'first_name', 'last_name_kana', 'first_name_kana',
                'corporation_number', 'representative_last_name', 'representative_first_name',
                'representative_last_name_kana', 'representative_first_name_kana',
                'zip_code', 'prefecture', 'city', 'town', 'street',
                'phone1', 'phone2', 'birthday', 'job_type', 'payment_type'];
            fields.forEach(f => {
                const el = document.getElementById(f);
                if (el && corp[f]) el.value = corp[f];
            });

            // Trigger change events
            document.getElementById('customer_type').dispatchEvent(new Event('change'));

            document.getElementById('corp-search-results').innerHTML =
                `<div class="status-badge status-completed mt-8"><i class="fas fa-check"></i> ${corp.last_name} ${corp.first_name || ''} を選択中</div>`;
            Toast.show('法人情報を読み込みました', 'success');
        }
    }

    function clearSearch() {
        document.getElementById('corp-search').value = '';
        document.getElementById('corp-search-results').innerHTML = '';
        document.getElementById('selected-corp-id').value = '';
    }

    function handleSubmit(e) {
        e.preventDefault();

        const user = Auth.currentUser();
        const existingCorpId = document.getElementById('selected-corp-id').value;

        // Build corporation data
        const corpData = {
            customer_type: document.getElementById('customer_type').value,
            last_name: document.getElementById('last_name').value,
            first_name: document.getElementById('first_name').value,
            last_name_kana: document.getElementById('last_name_kana').value,
            first_name_kana: document.getElementById('first_name_kana').value,
            corporation_number: document.getElementById('corporation_number').value,
            representative_last_name: document.getElementById('representative_last_name').value,
            representative_first_name: document.getElementById('representative_first_name').value,
            representative_last_name_kana: document.getElementById('representative_last_name_kana').value,
            representative_first_name_kana: document.getElementById('representative_first_name_kana').value,
            zip_code: document.getElementById('zip_code').value,
            prefecture: document.getElementById('prefecture').value,
            city: document.getElementById('city').value,
            town: document.getElementById('town').value,
            street: document.getElementById('street').value,
            building_name: '',
            phone1: document.getElementById('phone1').value,
            phone2: document.getElementById('phone2').value,
            mail_address: '',
            birthday: document.getElementById('birthday').value,
            job_type: document.getElementById('job_type').value,
            payment_type: document.getElementById('payment_type').value,
            invoice: '',
            payment_certificate: '',
            billing_address_same: document.getElementById('billing_address_same').checked,
            billing_zip_code: document.getElementById('billing_zip_code').value,
            billing_prefecture: document.getElementById('billing_prefecture').value,
            billing_city: document.getElementById('billing_city').value,
            billing_town: document.getElementById('billing_town').value,
            billing_street: document.getElementById('billing_street').value,
            billing_building: '',
            billing_customer_name: document.getElementById('billing_customer_name').value,
            sales_channel_id: ''
        };

        // Save or update corporation
        let corpId;
        if (existingCorpId) {
            Store.update('corporations', existingCorpId, corpData);
            corpId = existingCorpId;
        } else {
            const corp = Store.create('corporations', corpData);
            corpId = corp.id;
        }

        // Create request
        const siteCount = parseInt(document.getElementById('site_count').value) || 1;
        const agencyEl = document.getElementById('agency_id');
        const agencyId = (user.role !== 'admin') ? user.agency_id : (agencyEl ? agencyEl.value : user.agency_id);
        const request = Store.create('requests', {
            corporation_id: corpId,
            requested_by: user.user_id,
            agency_id: agencyId,
            status: 'pending',
            remarks: document.getElementById('remarks').value,
            site_count: siteCount
        });

        // Save images
        uploadedImages.forEach(img => {
            Store.create('images', {
                request_id: request.id,
                site_id: null,
                file_name: img.name,
                file_data: img.data,
                ocr_result: null,
                uploaded_at: Store.now()
            });
        });

        // Auto-create site records based on site_count
        for (let i = 0; i < siteCount; i++) {
            Store.create('sites', {
                request_id: request.id,
                corporation_id: corpId,
                supply_point_id: '',
                service_type: 'metered',
                customer_number: '',
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
                status: 'pending'
            });
        }

        Toast.show(`投入依頼を送信しました（${siteCount}地点）`, 'success');
        Router.navigate(user.role === 'admin' ? '/cases' : '/my-requests');
    }

    return { render, removeImage, searchCorp, selectCorp, clearSearch };
})();

// --- Prefecture options helper ---
function getPrefectureOptions() {
    const prefs = ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'];
    return prefs.map(p => `<option value="${p}">${p}</option>`).join('');
}

// --- Postal code auto-fill helper (global) ---
function fetchAddress(zipCode, prefId, cityId, townId) {
    fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipCode}`)
        .then(res => res.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                const r = data.results[0];
                const prefEl = document.getElementById(prefId);
                const cityEl = document.getElementById(cityId);
                const townEl = document.getElementById(townId);
                if (prefEl) prefEl.value = r.address1;
                if (cityEl) cityEl.value = r.address2;
                if (townEl) townEl.value = r.address3;
            }
        })
        .catch(err => console.error('Zip code lookup failed:', err));
}
