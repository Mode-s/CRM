/**
 * FMT CRM - Seed Data (Demo/Test)
 * Creates test users, agencies, sample corporations, requests & sites on first run.
 */
const Seed = (() => {
    function initialize() {
        if (Store.isInitialized()) return;

        // --- Agencies ---
        const agencyA = Store.create('agencies', {
            name: '株式会社AAA代理店',
            code: 'AGN001',
            referral_shop_code: 'RS001',
            referral_shop_name: 'AAA紹介店',
            contact_name: '田中 太郎',
            phone: '03-1234-5678',
            mail_address: 'aaa@example.com',
            is_active: true
        }, true);

        const agencyB = Store.create('agencies', {
            name: '株式会社BBB代理店',
            code: 'AGN002',
            referral_shop_code: 'RS002',
            referral_shop_name: 'BBB紹介店',
            contact_name: '鈴木 花子',
            phone: '06-9876-5432',
            mail_address: 'bbb@example.com',
            is_active: true
        }, true);

        // --- Users ---
        const adminUser = Store.create('users', {
            agency_id: null,
            login_id: 'admin',
            password_hash: 'admin123',
            name: '管理者 太郎',
            sales_staff_code: '',
            l_code: '',
            role: 'admin'
        }, true);

        const operatorUser = Store.create('users', {
            agency_id: null,
            login_id: 'operator',
            password_hash: 'ope123',
            name: '投入 花子',
            sales_staff_code: '',
            l_code: '',
            role: 'operator'
        }, true);

        const salesA = Store.create('users', {
            agency_id: agencyA.id,
            login_id: 'sales_a',
            password_hash: 'sales123',
            name: '営業A 太郎',
            sales_staff_code: 'LCK0A0AY',
            l_code: 'L001',
            role: 'sales'
        }, true);

        const salesB = Store.create('users', {
            agency_id: agencyB.id,
            login_id: 'sales_b',
            password_hash: 'sales123',
            name: '営業B 次郎',
            sales_staff_code: 'LCK0B0BZ',
            l_code: 'L002',
            role: 'sales'
        }, true);

        // --- Sample Corporations ---
        const corp1 = Store.create('corporations', {
            customer_type: '2',
            last_name: '株式会社サンプル',
            first_name: '',
            last_name_kana: 'カブシキカイシャサンプル',
            first_name_kana: '',
            zip_code: '1000001',
            prefecture: '東京都',
            city: '千代田区',
            town: '千代田',
            street: '1-1-1',
            building_name: 'サンプルビル3F',
            phone1: '03-1111-2222',
            phone2: '',
            mail_address: 'sample@example.com',
            birthday: '',
            job_type: 'IT',
            payment_type: '1'
        }, true);

        const corp2 = Store.create('corporations', {
            customer_type: '1',
            last_name: '山田',
            first_name: '太郎',
            last_name_kana: 'ヤマダ',
            first_name_kana: 'タロウ',
            zip_code: '5300001',
            prefecture: '大阪府',
            city: '大阪市北区',
            town: '梅田',
            street: '2-3-4',
            building_name: '',
            phone1: '06-3333-4444',
            phone2: '',
            mail_address: 'yamada@example.com',
            birthday: '1985-05-15',
            job_type: '飲食業',
            payment_type: '2'
        }, true);

        const corp3 = Store.create('corporations', {
            customer_type: '1',
            last_name: '佐藤',
            first_name: '花子',
            last_name_kana: 'サトウ',
            first_name_kana: 'ハナコ',
            zip_code: '4600001',
            prefecture: '愛知県',
            city: '名古屋市中区',
            town: '三の丸',
            street: '3-1-2',
            building_name: 'グランドマンション501',
            phone1: '052-5555-6666',
            phone2: '',
            mail_address: 'sato@example.com',
            birthday: '1990-11-20',
            job_type: '',
            payment_type: '1'
        }, true);

        // --- Sample Requests ---
        // Request 1: completed (agency A)
        const req1 = Store.create('requests', {
            corporation_id: corp1.id,
            requested_by: salesA.id,
            agency_id: agencyA.id,
            status: 'completed',
            remarks: 'サンプル依頼（投入済み）',
            site_count: 3
        }, true);

        // Request 2: inprogress (agency A)
        const req2 = Store.create('requests', {
            corporation_id: corp2.id,
            requested_by: salesA.id,
            agency_id: agencyA.id,
            status: 'inprogress',
            remarks: '対応中の依頼サンプル',
            site_count: 2
        }, true);

        // Request 3: completed (agency B)
        const req3 = Store.create('requests', {
            corporation_id: corp3.id,
            requested_by: salesB.id,
            agency_id: agencyB.id,
            status: 'completed',
            remarks: 'BBB代理店からの完了依頼',
            site_count: 1
        }, true);

        // --- Sample Sites ---
        // Request 1: 3 sites, all completed
        Store.create('sites', {
            request_id: req1.id,
            corporation_id: corp1.id,
            supply_point_id: '0312345678901234567890',
            service_type: 'metered',
            pps_code: 'A0517',
            pps_name: 'エネパル',
            application_type: '1',
            plan_name: 'Eプラン',
            contract_capacity: '40A',
            power_customer_last_name: '株式会社サンプル',
            power_customer_first_name: '',
            power_customer_last_name_kana: 'カブシキカイシャサンプル',
            power_customer_first_name_kana: '',
            power_zip_code: '1000001',
            power_prefecture: '東京都',
            power_city: '千代田区',
            power_town: '千代田',
            power_street: '1-1-1',
            power_building_name: 'サンプルビル3F',
            latest_charges: '15000',
            latest_usage: '450',
            latest_date: '2026-01',
            option_plans: [],
            moving_in_date: '',
            note: '',
            contract_corporation_type: '2',
            status: 'completed'
        }, true);

        Store.create('sites', {
            request_id: req1.id,
            corporation_id: corp1.id,
            supply_point_id: '0312345678901234567891',
            service_type: 'metered',
            pps_code: 'A0517',
            pps_name: 'エネパル',
            application_type: '1',
            plan_name: 'Eプラン',
            contract_capacity: '50A',
            power_customer_last_name: '株式会社サンプル',
            power_customer_first_name: '',
            power_customer_last_name_kana: '',
            power_customer_first_name_kana: '',
            power_zip_code: '1000001',
            power_prefecture: '東京都',
            power_city: '千代田区',
            power_town: '内幸町',
            power_street: '2-2-2',
            power_building_name: '第二ビル',
            latest_charges: '22000',
            latest_usage: '680',
            latest_date: '2026-01',
            option_plans: [],
            moving_in_date: '',
            note: '',
            contract_corporation_type: '2',
            status: 'completed'
        }, true);

        Store.create('sites', {
            request_id: req1.id,
            corporation_id: corp1.id,
            supply_point_id: '0412345678901234567892',
            service_type: 'gas',
            pps_code: 'A0023',
            pps_name: 'サイサン(ガス)',
            application_type: '1',
            plan_name: 'ガスプランA',
            contract_capacity: '',
            power_customer_last_name: '株式会社サンプル',
            power_customer_first_name: '',
            power_customer_last_name_kana: '',
            power_customer_first_name_kana: '',
            power_zip_code: '1000001',
            power_prefecture: '東京都',
            power_city: '千代田区',
            power_town: '千代田',
            power_street: '1-1-1',
            power_building_name: 'サンプルビル3F',
            latest_charges: '8000',
            latest_usage: '35',
            latest_date: '2026-01',
            option_plans: [],
            moving_in_date: '',
            note: '',
            contract_corporation_type: '2',
            status: 'completed'
        }, true);

        // Request 2: 2 sites, inprogress
        Store.create('sites', {
            request_id: req2.id,
            corporation_id: corp2.id,
            supply_point_id: '',
            service_type: 'metered',
            pps_code: 'A0517',
            pps_name: 'エネパル',
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
            status: 'inprogress'
        }, true);

        Store.create('sites', {
            request_id: req2.id,
            corporation_id: corp2.id,
            supply_point_id: '',
            service_type: 'metered',
            pps_code: 'A0517',
            pps_name: 'エネパル',
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
            status: 'inprogress'
        }, true);

        // Request 3: 1 site, completed (agency B)
        Store.create('sites', {
            request_id: req3.id,
            corporation_id: corp3.id,
            supply_point_id: '0512345678901234567893',
            service_type: 'metered',
            pps_code: 'A0517',
            pps_name: 'エネパル',
            application_type: '2',
            plan_name: 'Eプラン',
            contract_capacity: '30A',
            power_customer_last_name: '佐藤',
            power_customer_first_name: '花子',
            power_customer_last_name_kana: 'サトウ',
            power_customer_first_name_kana: 'ハナコ',
            power_zip_code: '4600001',
            power_prefecture: '愛知県',
            power_city: '名古屋市中区',
            power_town: '三の丸',
            power_street: '3-1-2',
            power_building_name: 'グランドマンション501',
            latest_charges: '9500',
            latest_usage: '280',
            latest_date: '2026-01',
            option_plans: [],
            moving_in_date: '',
            note: '',
            contract_corporation_type: '1',
            status: 'completed'
        }, true);

        Store.setInitialized();
        console.log('Seed data initialized with sample corporations, requests & sites.');
    }

    return { initialize };
})();
