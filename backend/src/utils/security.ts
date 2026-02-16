import { TOTP, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib';
import QRCode from 'qrcode';

// 初始化 TOTP 实例
const authenticator = new TOTP({
    crypto: new NobleCryptoPlugin(),
    base32: new ScureBase32Plugin(),
});

// 从环境变量获取 TOTP 密钥
const TOTP_SECRET = process.env.TOTP_SECRET || '';

/**
 * 检查是否启用了 2FA
 */
export function is2FAEnabled(): boolean {
    return !!TOTP_SECRET;
}

/**
 * 验证 TOTP 令牌
 */
export async function verifyTOTP(token: string): Promise<boolean> {
    if (!TOTP_SECRET) return true;
    try {
        const result = await authenticator.verify(token, {
            secret: TOTP_SECRET
        });
        return result.valid;
    } catch (e) {
        console.error('TOTP 验证失败:', e);
        return false;
    }
}

/**
 * 生成 TOTP 设置用的二维码
 */
export async function generateOTPAuthUrl(user: string = 'Admin'): Promise<string> {
    if (!TOTP_SECRET) return '';
    const otpauth = authenticator.toURI({
        label: user,
        issuer: 'FoomClous',
        secret: TOTP_SECRET
    });
    return await QRCode.toDataURL(otpauth);
}
