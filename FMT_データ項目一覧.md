# FMT CRM 保存データ項目一覧

このアプリでデータベース（現状はLocalStorage）に保存する全データ項目のリストです。

---

## 1. 代理店情報 (Agencies)
管理者が登録する、ユーザーが所属する組織の情報。

| 項目名 | 論理名 | 説明 |
|---|---|---|
| ID | `id` | システム自動採番 |
| 代理店名 | `name` | 例: 株式会社AAA代理店 |
| 代理店コード | `code` | 一意の識別コード |
| 紹介店コード | `referral_shop_code` | キャリア管理画面用 |
| 紹介店名 | `referral_shop_name` | キャリア管理画面用 |
| 担当者名 | `contact_name` | 連絡窓口担当者 |
| 電話番号 | `phone` | |
| メールアドレス | `mail_address` | |
| 有効フラグ | `is_active` | true:有効, false:無効 |

## 2. ユーザー情報 (Users)
本システムを利用する全アカウント情報。

| 項目名 | 論理名 | 説明 |
|---|---|---|
| ID | `id` | システム自動採番 |
| 代理店ID | `agency_id` | 所属代理店へのリンク (営業担当は必須) |
| ログインID | `login_id` | ログイン用ID |
| パスワード | `password_hash` | **[セキュリティ]** ハッシュ化して保存 |
| 氏名 | `name` | ユーザーの表示名 |
| 営業担当者コード | `sales_staff_code` | キャリア管理画面用 |
| Lコード | `l_code` | 販売員コード |
| ロール（権限） | `role` | `sales` (営業) / `operator` (投入) / `admin` (管理) |

## 3. 投入依頼 (Requests)
営業担当が作成する「1つの案件（法人単位）」の管理情報。

| 項目名 | 論理名 | 説明 |
|---|---|---|
| ID | `id` | 自動採番 |
| 法人ID | `corporation_id` | 下記「法人情報」へのリンク |
| 依頼者ID | `requested_by` | 作成した営業担当者 |
| ステータス | `status` | 全体状態 (不備/対応中/投入済/ET[成約確]/キャンセル) |
| 備考 | `remarks` | 営業からの申し送り事項 |
| 地点数 | `site_count` | 申込地点の総数 |
| 作成日時 | `created_at` | |
| 更新日時 | `updated_at` | |

## 4. 法人情報 (Corporations)
契約者（親）となる法人の基本情報。「1page」「2page」に相当。

| 区分 | 項目名 | 論理名 | 説明 |
|---|---|---|---|
| 基本 | 契約者区分 | `customer_type` | 個人/法人/屋号 |
| 基本 | 法人番号 | `corporation_number` | 13桁 |
| 基本 | 契約者名(姓/名) | `last_name`, `first_name` | 法人名 |
| 基本 | 契約者カナ(セイ/メイ) | `last_name_kana`, `first_name_kana` | |
| 代表 | 代表者名(姓/名) | `representative_last_name`, `...` | |
| 代表 | 代表者カナ(セイ/メイ) | `representative_last_name_kana`, `...` | |
| 住所 | 郵便番号 | `zip_code` | |
| 住所 | 都道府県・市区町村・町域 | `prefecture`, `city`, `town` | |
| 住所 | 番地・建物名 | `street`, `building_name` | |
| 連絡 | 電話番号1〜2 | `phone1`, `phone2` | |
| 連絡 | メールアドレス | `mail_address` | |
| 属性 | 生年月日 | `birthday` | |
| 属性 | 代表者生年月日 | `representative_birthday` | |
| 属性 | 業種 | `job_type` | 飲食店, 物販店等 |
| 支払 | 支払方法 | `payment_type` | クレカ/口座/コンビニ |
| 支払 | クレカ情報 | `credit_card_*` | 番号, 有効期限, 名義, セキュアコード |
| 請求 | 請求明細送付 | `invoice` | 要/不要 |
| 請求 | 支払証明書 | `payment_certificate` | 要/不要 |
| 請求 | 請求書送付先 | `billing_*` | 契約者住所と異なる場合のみ保存 |

## 5. 地点情報 (Sites)
契約する店舗・施設ごとの詳細情報。「5page」に相当。
**※これらは主に投入担当者が画像を見て入力します。**

| 区分 | 項目名 | 論理名 | 説明 |
|---|---|---|---|
| 管理 | ID | `id` | 自動採番 |
| 管理 | 依頼ID/法人ID | `request_id`, `corporation_id` | 親データへのリンク |
| 管理 | ステータス | `status` | 地点ごとの状態 (不備/対応中/投入済/ET) |
| 基本 | PPS番号/事業者 | `pps_business_number` | エネパル等 |
| 基本 | 申込区分 | `application_type` | 切替/入居/移転 |
| 契約 | 契約プラン | `power_plan_name` | |
| 契約 | 契約容量 | `contract_capacity` | 40A, 6kVA等 |
| 供給 | 現在の電力会社 | `power_supplier_type` | 東電, 関電等 |
| 供給 | お客様番号 | `power_customer_number` | |
| 供給 | 供給地点特定番号 | `power_customer_location_number` | 22桁 |
| 場所 | 使用場所住所 | `power_zip_code` 〜 `power_building` | |
| 場所 | 店舗名/名義 | `power_branch_name`, `power_customer_name` | |
| 明細 | 最新明細料金 | `latest_charges` | 円 |
| 明細 | 最新使用量 | `latest_power_usage` | kWh |
| 明細 | 最新明細年月 | `latest_date` | YYYY-MM |
| 他 | 入居日 | `moving_in_date` | |
| 他 | オプション | `option_plans` | 選択されたオプション配列 |
| 他 | サービス種別 | `service_type` | 電気/ガス |

## 6. その他 (Images, Comments, Logs)

### 画像データ (Images)
*   **ファイル名**: `file_name`
*   **データ本体**: `file_data` (Base64形式テキスト)
*   **紐付け**: `request_id`, `site_id`

### コメント・不備 (Comments)
*   **メッセージ**: `message` (不備理由など)
*   **タイプ**: `type` (deficiency:不備, comment:一般)
*   **既読フラグ**: `is_read`

### 監査ログ (AuditLogs)
*   **操作者**: `user_id`
*   **操作内容**: `action` (create, update, status_change...)
*   **対象**: `target_type`, `target_id`
*   **変更内容**: `changes` (変更前後の差分JSON)
