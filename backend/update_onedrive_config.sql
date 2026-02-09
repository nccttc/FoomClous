-- 手动更新 OneDrive 配置的 SQL 语句
-- 如果自动脚本无法连接数据库，请在您的数据库管理工具中运行这些语句

INSERT INTO system_settings (key, value, updated_at) VALUES 
('onedrive_client_id', '842f841d-aed5-4372-8259-92f48e30b9f3', NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO system_settings (key, value, updated_at) VALUES 
('onedrive_client_secret', '', NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO system_settings (key, value, updated_at) VALUES 
('onedrive_refresh_token', '1.Ab4Am0vleYmfZky-TW9btFdwOx2EL4TVrnJDglmS9I4wufN-AZ--AA.BQABAwEAAAADAOz_BQD0_0V2b1N0c0FydGlmYWN0cwIAAAAAACsbpnkgRQWdNQkG6eZH_-k_fGAxDUONicfadiTxNNVamxaqSgN_sNTnA-goURf5cyCVuWRTr8ARpeJbTCO6MEk7b0hWObKXDkEqvjnnEyeW_R8aiikimV9nSS0_6iPTvWCok7AxHpi3RNAkXYGtgioApM7cEmXivP6oaskUy3AilMKnyoB2PkY-H45GOiZmPa6Fn3FUTgwGB8D3J4ls1KdCyke9CJa9krwPBQXnkiSkpxzKUMYiPLvrzVvveflRhBLTgXvPw7ZXEdlSXTsHKYZ8oxSuHZsR4vofuMaCVi6J2oN3wDO5xpQVIihbZSsFUzfj7IN9DH8BYOW36wvnvNju11a1N3O-IrhijXb0xIx7uY0XENydtrWGlCZyvwVa4YFmW9CzdgGGY8Edg9LoH7iNeWJ1NEySd0B1Sgu6IPV3Ta_UlZ9YIBSVbRFrMkUdNEVkZXN0m8ACLk6EoIogDyOdmsuAKJUkORumvrWtLU4fMWzjcbqia8XHckOODomXLJRhJOJUQ1opT9qyvZC5oqi2k3jdfjJNIq5yn9xOpMlMl5hT5gktzgy0htI_15VQjP1i3uBvEdZj2V6KTZEhbwLLiGKVCE0lIkdD7gnP-LLJyXb7qMgJ2sHgkv-JbzYxVjR2IWhM9-ZnGUwT-qpE6I206sHxF7n5EGuQ4VhztLKs29zt1OIUvufcwvSpZq3HPJ6x1tybPD3k8_CZIFfY6JWmH-mzKQR4DjhsCiPtPQ_BaWG1KHAJM_2K5S8TW4Ww9l2z-dnRuuMNZQ2_VWuVRNbXiWx8_b18pNujUqJBCHTUutJ_ShcdAg437R00fViLPo3vx1jdNYnOMFwRPXa6XkyYiK6WAesaSbsT1tx4L7JR5SP582S1CiqYKu5YamloXc0jVVJ-9NcWxIj3RYYfG4bwQq2Q-Yb36JtnyCxxTd7XFb2CLiII8UZ7qGDb9mocFdFG8NPUAfzsHobEb2Rr4aCokMXXEhAVRlLxrX3ZCRU_mJqCps0XhjeklYv2WeafXIanfccRtT8bFsN5RXe87Lt-jeVT9DzL2ZYm7rzadFuOiL_1hGOh8edw3GGgLT8e06_HmLgLUCzKX7LXU9rgDdUT6d6Vr3ekcKP_PZtKEI19d_1Ro2xTNnsLoye_h4CZK8NN0lzZ0DVcn7Rd5055U_uD-iJDJ7Ce17VaQva-ix0D9Lj3fS850-hk0S2Ye4DgfSsyCb13kUpNn87NvHSSncgjGmz1I-W9CI-hNoEMsa1J9V8EZeOvuJNpHOv-VaRG7k0vf1qAhFMEkcYCa9Wpogrim_uVF0Qh8LhWLsxwM65akxizSPIObZCrOQ4qnsYBtRJJ_zc', NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO system_settings (key, value, updated_at) VALUES 
('onedrive_tenant_id', '79e54b9b-9f89-4c66-be4d-6f5bb457703b', NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO system_settings (key, value, updated_at) VALUES 
('storage_provider', 'onedrive', NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- 验证更新
SELECT * FROM system_settings WHERE key LIKE 'onedrive_%' OR key = 'storage_provider';
