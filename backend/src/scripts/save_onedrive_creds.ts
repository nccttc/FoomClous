
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// ============================================
// 在此填入您的 OneDrive 国际版凭证
// ============================================
const CREDENTIALS = {
    onedrive_client_id: '842f841d-aed5-4372-8259-92f48e30b9f3',
    onedrive_client_secret: '', // Public client has no secret
    onedrive_refresh_token: '1.Ab4Am0vleYmfZky-TW9btFdwOx2EL4TVrnJDglmS9I4wufN-AZ--AA.BQABAwEAAAADAOz_BQD0_0V2b1N0c0FydGlmYWN0cwIAAAAAACsbpnkgRQWdNQkG6eZH_-k_fGAxDUONicfadiTxNNVamxaqSgN_sNTnA-goURf5cyCVuWRTr8ARpeJbTCO6MEk7b0hWObKXDkEqvjnnEyeW_R8aiikimV9nSS0_6iPTvWCok7AxHpi3RNAkXYGtgioApM7cEmXivP6oaskUy3AilMKnyoB2PkY-H45GOiZmPa6Fn3FUTgwGB8D3J4ls1KdCyke9CJa9krwPBQXnkiSkpxzKUMYiPLvrzVvveflRhBLTgXvPw7ZXEdlSXTsHKYZ8oxSuHZsR4vofuMaCVi6J2oN3wDO5xpQVIihbZSsFUzfj7IN9DH8BYOW36wvnvNju11a1N3O-IrhijXb0xIx7uY0XENydtrWGlCZyvwVa4YFmW9CzdgGGY8Edg9LoH7iNeWJ1NEySd0B1Sgu6IPV3Ta_UlZ9YIBSVbRFrMkUdNEVkZXN0m8ACLk6EoIogDyOdmsuAKJUkORumvrWtLU4fMWzjcbqia8XHckOODomXLJRhJOJUQ1opT9qyvZC5oqi2k3jdfjJNIq5yn9xOpMlMl5hT5gktzgy0htI_15VQjP1i3uBvEdZj2V6KTZEhbwLLiGKVCE0lIkdD7gnP-LLJyXb7qMgJ2sHgkv-JbzYxVjR2IWhM9-ZnGUwT-qpE6I206sHxF7n5EGuQ4VhztLKs29zt1OIUvufcwvSpZq3HPJ6x1tybPD3k8_CZIFfY6JWmH-mzKQR4DjhsCiPtPQ_BaWG1KHAJM_2K5S8TW4Ww9l2z-dnRuuMNZQ2_VWuVRNbXiWx8_b18pNujUqJBCHTUutJ_ShcdAg437R00fViLPo3vx1jdNYnOMFwRPXa6XkyYiK6WAesaSbsT1tx4L7JR5SP582S1CiqYKu5YamloXc0jVVJ-9NcWxIj3RYYfG4bwQq2Q-Yb36JtnyCxxTd7XFb2CLiII8UZ7qGDb9mocFdFG8NPUAfzsHobEb2Rr4aCokMXXEhAVRlLxrX3ZCRU_mJqCps0XhjeklYv2WeafXIanfccRtT8bFsN5RXe87Lt-jeVT9DzL2ZYm7rzadFuOiL_1hGOh8edw3GGgLT8e06_HmLgLUCzKX7LXU9rgDdUT6d6Vr3ekcKP_PZtKEI19d_1Ro2xTNnsLoye_h4CZK8NN0lzZ0DVcn7Rd5055U_uD-iJDJ7Ce17VaQva-ix0D9Lj3fS850-hk0S2Ye4DgfSsyCb13kUpNn87NvHSSncgjGmz1I-W9CI-hNoEMsa1J9V8EZeOvuJNpHOv-VaRG7k0vf1qAhFMEkcYCa9Wpogrim_uVF0Qh8LhWLsxwM65akxizSPIObZCrOQ4qnsYBtRJJ_zc',
    onedrive_tenant_id: '79e54b9b-9f89-4c66-be4d-6f5bb457703b',
    storage_provider: 'onedrive'
};
// ============================================

const updateSetting = async (key: string, value: string) => {
    await pool.query(
        `INSERT INTO system_settings (key, value, updated_at) 
         VALUES ($1, $2, NOW()) 
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, value]
    );
    console.log(`✓ Updated setting: ${key}`);
};

async function main() {
    try {
        console.log('==========================================');
        console.log('OneDrive 国际版凭证保存工具');
        console.log('==========================================\n');

        console.log('1. 连接数据库...');

        // 确保表存在
        await pool.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                key VARCHAR(255) PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✓ 确认 system_settings 表存在\n');

        console.log('2. 保存 OneDrive 凭证...');
        await updateSetting('onedrive_client_id', CREDENTIALS.onedrive_client_id);
        await updateSetting('onedrive_client_secret', CREDENTIALS.onedrive_client_secret);
        await updateSetting('onedrive_refresh_token', CREDENTIALS.onedrive_refresh_token);
        await updateSetting('onedrive_tenant_id', CREDENTIALS.onedrive_tenant_id);
        await updateSetting('storage_provider', CREDENTIALS.storage_provider);

        console.log('\n==========================================');
        console.log('✓ OneDrive 凭证保存成功！');
        console.log('✓ 存储提供商已切换为 OneDrive');
        console.log('==========================================\n');

        console.log('下一步：重启后端服务使配置生效');
        console.log('  cd backend && npm run dev\n');

    } catch (err: any) {
        console.error('\n✗ 自动保存凭证失败 (可能是因为本地没有运行数据库)');
        console.error('  错误信息:', err.message);

        console.log('\n请手动在您的数据库管理工具中运行以下 SQL 语句：\n');
        console.log('---------------------------------------------------');
        console.log(`INSERT INTO system_settings (key, value, updated_at) VALUES ('onedrive_client_id', '${CREDENTIALS.onedrive_client_id}', NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`);
        console.log(`INSERT INTO system_settings (key, value, updated_at) VALUES ('onedrive_client_secret', '${CREDENTIALS.onedrive_client_secret}', NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`);
        console.log(`INSERT INTO system_settings (key, value, updated_at) VALUES ('onedrive_refresh_token', '${CREDENTIALS.onedrive_refresh_token}', NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`);
        console.log(`INSERT INTO system_settings (key, value, updated_at) VALUES ('onedrive_tenant_id', '${CREDENTIALS.onedrive_tenant_id}', NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`);
        console.log(`INSERT INTO system_settings (key, value, updated_at) VALUES ('storage_provider', '${CREDENTIALS.storage_provider}', NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`);
        console.log('---------------------------------------------------\n');

        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
