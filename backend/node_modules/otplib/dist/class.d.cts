import { b as OTPStrategy } from './types-BBT_82HF.cjs';
import { CryptoPlugin, Base32Plugin, OTPGuardrails, HashAlgorithm, Digits, OTPHooks } from '@otplib/core';
import { VerifyResult as VerifyResult$2 } from '@otplib/hotp';
import { VerifyResult as VerifyResult$1 } from '@otplib/totp';

/**
 * OTP Wrapper Class
 *
 * A unified class that dynamically handles TOTP and HOTP strategies.
 */

/**
 * Combined verify result that works for both TOTP and HOTP
 */
type VerifyResult = VerifyResult$1 | VerifyResult$2;
/**
 * Options for the OTP class
 */
type OTPClassOptions = {
    /**
     * OTP strategy to use
     * - 'totp': Time-based OTP (default)
     * - 'hotp': HMAC-based OTP
     */
    strategy?: OTPStrategy;
    /**
     * Crypto plugin to use (default: NobleCryptoPlugin)
     */
    crypto?: CryptoPlugin;
    /**
     * Base32 plugin to use (default: ScureBase32Plugin)
     */
    base32?: Base32Plugin;
    /**
     * Validation guardrails
     */
    guardrails?: OTPGuardrails;
};
/**
 * Options for generating a token with the OTP class
 */
type OTPGenerateOptions = {
    /**
     * Base32-encoded secret key
     *
     * **Note**: By default, strings are assumed to be Base32 encoded.
     * If you have a raw string/passphrase, you must convert it to Uint8Array first.
     */
    secret: string | Uint8Array;
    /**
     * Hash algorithm (default: 'sha1')
     */
    algorithm?: HashAlgorithm;
    /**
     * Number of digits (default: 6)
     */
    digits?: Digits;
    /**
     * Current Unix epoch timestamp in seconds (default: now)
     * Used by TOTP strategy
     */
    epoch?: number;
    /**
     * Initial Unix time to start counting time steps (default: 0)
     * Used by TOTP strategy
     */
    t0?: number;
    /**
     * Time step in seconds (default: 30)
     * Used by TOTP strategy
     */
    period?: number;
    /**
     * Counter value
     * Used by HOTP strategy (required)
     */
    counter?: number;
    /**
     * Validation guardrails
     */
    guardrails?: OTPGuardrails;
    /**
     * Hooks for customizing token encoding and validation
     */
    hooks?: OTPHooks;
};
/**
 * Options for verifying a token with the OTP class
 */
type OTPVerifyOptions = {
    /**
     * Base32-encoded secret key
     *
     * **Note**: By default, strings are assumed to be Base32 encoded.
     * If you have a raw string/passphrase, you must convert it to Uint8Array first.
     */
    secret: string | Uint8Array;
    /**
     * OTP code to verify
     */
    token: string;
    /**
     * Hash algorithm (default: 'sha1')
     */
    algorithm?: HashAlgorithm;
    /**
     * Number of digits (default: 6)
     */
    digits?: Digits;
    /**
     * Current Unix epoch timestamp in seconds (default: now)
     * Used by TOTP strategy
     */
    epoch?: number;
    /**
     * Initial Unix time to start counting time steps (default: 0)
     * Used by TOTP strategy
     */
    t0?: number;
    /**
     * Time step in seconds (default: 30)
     * Used by TOTP strategy
     */
    period?: number;
    /**
     * Counter value
     * Used by HOTP strategy (required)
     */
    counter?: number;
    /**
     * Time tolerance in seconds for TOTP verification (default: 0)
     * - Number: symmetric tolerance (same for past and future)
     * - Tuple [past, future]: asymmetric tolerance
     *   Use [5, 0] for RFC-compliant past-only verification.
     */
    epochTolerance?: number | [number, number];
    /**
     * Counter tolerance for HOTP verification (default: 0)
     * - Number: creates look-ahead only tolerance [0, n]
     * - Tuple [past, future]: explicit window control
     */
    counterTolerance?: number | [number, number];
    /**
     * Minimum allowed TOTP time step for replay protection (optional)
     *
     * Rejects tokens with timeStep <= afterTimeStep.
     * Only used by TOTP strategy.
     */
    afterTimeStep?: number;
    /**
     * Validation guardrails
     */
    guardrails?: OTPGuardrails;
    /**
     * Hooks for customizing token encoding and validation
     */
    hooks?: OTPHooks;
};
/**
 * Options for generating URI with the OTP class
 */
type OTPURIGenerateOptions = {
    /**
     * Issuer name (e.g., 'ACME Co')
     */
    issuer: string;
    /**
     * Label/Account name (e.g., 'john@example.com')
     */
    label: string;
    /**
     * Base32-encoded secret key
     *
     * **Note**: By default, strings are assumed to be Base32 encoded.
     * If you have a raw string/passphrase, you must convert it to Uint8Array first.
     */
    secret: string;
    /**
     * Hash algorithm (default: 'sha1')
     */
    algorithm?: HashAlgorithm;
    /**
     * Number of digits (default: 6)
     */
    digits?: Digits;
    /**
     * Time step in seconds (default: 30)
     * Used by TOTP strategy
     */
    period?: number;
    /**
     * Counter value (default: 0)
     * Used by HOTP strategy
     */
    counter?: number;
};
/**
 * OTP Class
 *
 * A wrapper class that dynamically handles TOTP and HOTP strategies.
 *
 * @example
 * ```ts
 * import { OTP } from 'otplib';
 *
 * // Create OTP instance with TOTP strategy (default)
 * const otp = new OTP({ strategy: 'totp' });
 *
 * // Generate and verify
 * const secret = otp.generateSecret();
 * const token = await otp.generate({ secret });
 * const result = await otp.verify({ secret, token });
 * ```
 *
 * @example With HOTP strategy
 * ```ts
 * import { OTP } from 'otplib';
 *
 * const otp = new OTP({ strategy: 'hotp' });
 * const token = await otp.generate({ secret: 'ABC123', counter: 0 });
 * ```
 *
 * @example Generating otpauth:// URI for authenticator apps
 * ```ts
 * import { OTP } from 'otplib';
 *
 * const otp = new OTP({ strategy: 'totp' });
 * const uri = otp.generateURI({
 *   issuer: 'MyApp',
 *   label: 'user@example.com',
 *   secret: 'ABC123',
 * });
 * ```
 */
declare class OTP {
    private readonly strategy;
    private readonly crypto;
    private readonly base32;
    private readonly guardrails;
    constructor(options?: OTPClassOptions);
    /**
     * Get the current strategy
     */
    getStrategy(): OTPStrategy;
    /**
     * Generate a random secret key
     *
     * @param length - Number of random bytes (default: 20)
     * @returns Base32-encoded secret key
     */
    generateSecret(length?: number): string;
    /**
     * Generate an OTP token based on the configured strategy
     *
     * @param options - Generation options
     * @returns OTP code
     */
    generate(options: OTPGenerateOptions): Promise<string>;
    /**
     * Generate an OTP token based on the configured strategy synchronously
     *
     * @param options - Generation options
     * @returns OTP code
     * @throws {HMACError} If the crypto plugin doesn't support sync operations
     */
    generateSync(options: OTPGenerateOptions): string;
    /**
     * Verify an OTP token based on the configured strategy
     *
     * @param options - Verification options
     * @returns Verification result with validity and optional delta
     */
    verify(options: OTPVerifyOptions): Promise<VerifyResult>;
    /**
     * Verify an OTP token based on the configured strategy synchronously
     *
     * @param options - Verification options
     * @returns Verification result with validity and optional delta
     * @throws {HMACError} If the crypto plugin doesn't support sync operations
     */
    verifySync(options: OTPVerifyOptions): VerifyResult;
    /**
     * Generate an otpauth:// URI for QR code generation
     *
     * Supports both TOTP and HOTP strategies.
     *
     * @param options - URI generation options
     * @returns otpauth:// URI string
     */
    generateURI(options: OTPURIGenerateOptions): string;
}

export { OTP, type OTPClassOptions, type OTPGenerateOptions, type OTPURIGenerateOptions, type OTPVerifyOptions, type VerifyResult };
