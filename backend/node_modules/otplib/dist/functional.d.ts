import { a as OTPGenerateOptions, b as OTPStrategy, c as OTPVerifyOptions } from './types-BBT_82HF.js';
import { CryptoPlugin, Base32Plugin, HashAlgorithm, Digits } from '@otplib/core';
import { VerifyResult as VerifyResult$2 } from '@otplib/hotp';
import { VerifyResult as VerifyResult$1 } from '@otplib/totp';

type VerifyResult = VerifyResult$1 | VerifyResult$2;
/**
 * Generate a random secret key for use with OTP
 *
 * The secret is encoded in Base32 format for compatibility with
 * Google Authenticator and other authenticator apps.
 *
 * @param options - Secret generation options
 * @returns Base32-encoded secret key
 *
 * @example
 * ```ts
 * import { generateSecret } from 'otplib';
 *
 * const secret = generateSecret();
 * // Returns: 'JBSWY3DPEHPK3PXP'
 * ```
 *
 * @example With custom plugins
 * ```ts
 * import { generateSecret, NodeCryptoPlugin } from 'otplib';
 *
 * const secret = generateSecret({
 *   crypto: new NodeCryptoPlugin(),
 * });
 * ```
 */
declare function generateSecret(options?: {
    /**
     * Number of random bytes to generate (default: 20)
     * 20 bytes = 160 bits, which provides a good security margin
     */
    length?: number;
    /**
     * Crypto plugin to use (default: NobleCryptoPlugin)
     */
    crypto?: CryptoPlugin;
    /**
     * Base32 plugin to use (default: ScureBase32Plugin)
     */
    base32?: Base32Plugin;
}): string;
/**
 * Generate an otpauth:// URI for QR code generation
 *
 * This URI can be used to generate a QR code that can be scanned
 * by Google Authenticator and other authenticator apps.
 *
 * @param options - URI generation options
 * @returns otpauth:// URI string
 *
 * @example TOTP
 * ```ts
 * import { generateURI } from 'otplib';
 *
 * const uri = generateURI({
 *   issuer: 'ACME Co',
 *   label: 'john@example.com',
 *   secret: 'JBSWY3DPEHPK3PXP',
 * });
 * // Returns: 'otpauth://totp/ACME%20Co:john%40example.com?secret=...'
 * ```
 *
 * @example HOTP
 * ```ts
 * import { generateURI } from 'otplib';
 *
 * const uri = generateURI({
 *   strategy: 'hotp',
 *   issuer: 'ACME Co',
 *   label: 'john@example.com',
 *   secret: 'JBSWY3DPEHPK3PXP',
 *   counter: 5,
 * });
 * // Returns: 'otpauth://hotp/ACME%20Co:john%40example.com?secret=...&counter=5'
 * ```
 */
declare function generateURI(options: {
    /**
     * OTP strategy to use (default: 'totp')
     */
    strategy?: OTPStrategy;
    issuer: string;
    label: string;
    /**
     * Base32-encoded secret key
     *
     * **Note**: By default, strings are assumed to be Base32 encoded.
     * If you have a raw string/passphrase, you must convert it to Uint8Array first.
     */
    secret: string;
    algorithm?: HashAlgorithm;
    digits?: Digits;
    period?: number;
    counter?: number;
}): string;
/**
 * Generate an OTP code
 *
 * Generates a one-time password based on the specified strategy.
 * - 'totp': Time-based OTP (default)
 * - 'hotp': HMAC-based OTP
 *
 * @param options - OTP generation options
 * @returns OTP code
 *
 * @example TOTP
 * ```ts
 * import { generate } from 'otplib';
 *
 * const token = await generate({
 *   secret: 'JBSWY3DPEHPK3PXP',
 * });
 * // Returns: '123456'
 * ```
 *
 * @example HOTP
 * ```ts
 * import { generate } from 'otplib';
 *
 * const token = await generate({
 *   secret: 'JBSWY3DPEHPK3PXP',
 *   strategy: 'hotp',
 *   counter: 0,
 * });
 * ```
 *
 * @example With custom plugins
 * ```ts
 * import { generate, NodeCryptoPlugin } from 'otplib';
 *
 * const token = await generate({
 *   secret: 'JBSWY3DPEHPK3PXP',
 *   crypto: new NodeCryptoPlugin(),
 * });
 * ```
 */
declare function generate(options: OTPGenerateOptions): Promise<string>;
/**
 * Generate an OTP code synchronously
 *
 * This is the synchronous version of {@link generate}. It requires a crypto
 * plugin that supports synchronous HMAC operations.
 *
 * @param options - OTP generation options
 * @returns OTP code
 * @throws {HMACError} If the crypto plugin doesn't support sync operations
 *
 * @example
 * ```ts
 * import { generateSync } from 'otplib';
 *
 * const token = generateSync({
 *   secret: 'JBSWY3DPEHPK3PXP',
 * });
 * ```
 */
declare function generateSync(options: OTPGenerateOptions): string;
/**
 * Verify an OTP code
 *
 * Verifies a provided OTP code against the expected value based on the strategy.
 * - 'totp': Time-based OTP (default, Google Authenticator compatible)
 * - 'hotp': HMAC-based OTP
 *
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param options - OTP verification options
 * @returns Verification result with validity and optional delta
 *
 * @example TOTP
 * ```ts
 * import { verify } from 'otplib';
 *
 * const result = await verify({
 *   secret: 'JBSWY3DPEHPK3PXP',
 *   token: '123456',
 * });
 * // Returns: { valid: true, delta: 0 }
 * ```
 *
 * @example HOTP
 * ```ts
 * import { verify } from 'otplib';
 *
 * const result = await verify({
 *   secret: 'JBSWY3DPEHPK3PXP',
 *   token: '123456',
 *   strategy: 'hotp',
 *   counter: 0,
 * });
 * ```
 *
 * @example With epochTolerance for TOTP
 * ```ts
 * import { verify, NodeCryptoPlugin } from 'otplib';
 *
 * const result = await verify({
 *   secret: 'JBSWY3DPEHPK3PXP',
 *   token: '123456',
 *   epochTolerance: 30,
 *   crypto: new NodeCryptoPlugin(),
 * });
 * ```
 */
declare function verify(options: OTPVerifyOptions): Promise<VerifyResult>;
/**
 * Verify an OTP code synchronously
 *
 * This is the synchronous version of {@link verify}. It requires a crypto
 * plugin that supports synchronous HMAC operations.
 *
 * @param options - OTP verification options
 * @returns Verification result with validity and optional delta
 * @throws {HMACError} If the crypto plugin doesn't support sync operations
 *
 * @example
 * ```ts
 * import { verifySync } from 'otplib';
 *
 * const result = verifySync({
 *   secret: 'JBSWY3DPEHPK3PXP',
 *   token: '123456',
 * });
 * ```
 */
declare function verifySync(options: OTPVerifyOptions): VerifyResult;

export { OTPStrategy, type VerifyResult, generate, generateSecret, generateSync, generateURI, verify, verifySync };
