import { HashAlgorithm, Digits, CryptoPlugin, Base32Plugin, OTPGuardrails, OTPHooks } from '@otplib/core';
export { CryptoPlugin, Digits, HashAlgorithm, OTPResult, wrapResult, wrapResultAsync } from '@otplib/core';

/**
 * @otplib/hotp
 *
 * Type definitions for HOTP implementation
 */

/**
 * HOTP configuration options
 *
 * All properties are optional for flexible class-based configuration.
 * Use `HOTPGenerateOptions` or `HOTPVerifyOptions` for function parameters
 * where certain fields are required.
 */
type HOTPOptions = {
    /** The shared secret key (Base32-encoded string or raw bytes) */
    readonly secret?: string | Uint8Array;
    /** The counter value (8-byte unsigned integer) */
    readonly counter?: number | bigint;
    /** Hash algorithm to use (default: 'sha1') */
    readonly algorithm?: HashAlgorithm;
    /** Number of digits in the OTP code (default: 6) */
    readonly digits?: Digits;
    /** Crypto plugin to use for HMAC operations */
    readonly crypto?: CryptoPlugin;
    /** Base32 plugin to decode string secrets (required if secret is a string) */
    readonly base32?: Base32Plugin;
    /** Service provider name (for URI generation) */
    readonly issuer?: string;
    /** User identifier/email/username (for URI generation) */
    readonly label?: string;
    /**
     * Custom guardrails to override validation limits
     * Must be created via createGuardrails() factory
     * Use this carefully - see danger-zone documentation
     */
    readonly guardrails?: OTPGuardrails;
    /**
     * Hooks for customizing token encoding and validation.
     * Allows non-standard OTP variants (e.g., Steam Guard) to replace
     * the default numeric encoding with custom schemes.
     */
    readonly hooks?: OTPHooks;
};
/**
 * Required options for HOTP generation
 *
 * Requires `secret`, `counter`, and `crypto` for OTP generation.
 * Optional `guardrails` must be created via createGuardrails() factory.
 */
type HOTPGenerateOptions = HOTPOptions & {
    readonly secret: string | Uint8Array;
    readonly counter: number | bigint;
    readonly crypto: CryptoPlugin;
};
/**
 * Required options for HOTP verification
 *
 * Requires `secret`, `counter`, `token`, and `crypto` for verification.
 */
type HOTPVerifyOptions = HOTPGenerateOptions & {
    /** The OTP token to verify */
    readonly token: string;
    /**
     * Counter tolerance for verification (default: 0)
     * - Number: creates look-ahead only tolerance [0, n] (secure default per RFC 4226)
     * - Tuple [past, future]: explicit window control
     *   Examples: [0, 5] allows 5 future counters; [5, 5] allows ±5 symmetric
     */
    readonly counterTolerance?: number | [number, number];
};
/**
 * Successful verification result with delta offset
 */
type VerifyResultValid = {
    /** Token is valid */
    readonly valid: true;
    /**
     * The offset from the base counter/time step where the token matched.
     * - For HOTP: Number of counter steps ahead (0 = exact match, 1 = one ahead, etc.)
     * - For TOTP: Number of time periods offset (can be negative for past, positive for future)
     *
     * Use this value to resynchronize the counter (HOTP) or detect clock drift (TOTP).
     */
    readonly delta: number;
};
/**
 * Failed verification result
 */
type VerifyResultInvalid = {
    /** Token is invalid */
    readonly valid: false;
};
/**
 * Result of OTP verification (discriminated union)
 *
 * Use type narrowing to access `delta`:
 * ```ts
 * const result = await verify({ secret, token, counter });
 * if (result.valid) {
 *   // TypeScript knows delta exists here
 *   const nextCounter = counter + result.delta + 1;
 *   await saveCounter(userId, nextCounter);
 * }
 * ```
 */
type VerifyResult = VerifyResultValid | VerifyResultInvalid;

/**
 * @otplib/hotp
 *
 * HOTP class wrapper for convenient API
 */

/**
 * HOTP class for HMAC-based one-time password generation
 *
 * @example
 * ```typescript
 * import { HOTP } from '@otplib/hotp';
 * import { NodeCryptoPlugin } from '@otplib/plugin-crypto-node';
 * import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';
 *
 * const hotp = new HOTP({
 *   issuer: 'MyApp',
 *   label: 'user@example.com',
 *   counter: 0,
 *   crypto: new NodeCryptoPlugin(),
 *   base32: new ScureBase32Plugin(),
 * });
 *
 * const secret = hotp.generateSecret();
 * const token = await hotp.generate(0);
 * const isValid = await hotp.verify({ token, counter: 0 });
 * ```
 */
declare class HOTP {
    private readonly options;
    private readonly guardrails;
    constructor(options?: HOTPOptions);
    /**
     * Generate a random Base32-encoded secret
     *
     * @returns Base32-encoded secret
     */
    generateSecret(): string;
    /**
     * Generate an HOTP code for a specific counter
     *
     * @param counter - The counter value
     * @param options - Optional overrides
     * @returns The HOTP code
     */
    generate(counter: number, options?: Partial<HOTPOptions>): Promise<string>;
    /**
     * Verify an HOTP code
     *
     * @param params - Verification parameters
     * @param options - Optional verification options
     * @returns Verification result with validity and optional delta
     */
    verify(params: {
        token: string;
        counter: number;
    }, options?: Partial<HOTPOptions & {
        counterTolerance?: number | [number, number];
    }>): Promise<VerifyResult>;
    /**
     * Generate an otpauth:// URI for QR codes
     *
     * @param counter - The counter value
     * @returns The otpauth:// URI
     */
    toURI(counter?: number): string;
}

/**
 * @otplib/hotp
 *
 * RFC 4226 HOTP (HMAC-Based One-Time Password) implementation.
 *
 * @see {@link https://tools.ietf.org/html/rfc4226 | RFC 4226}
 */

/**
 * Generate an HMAC-based One-Time Password (HOTP)
 *
 * Implements the HOTP algorithm as specified in RFC 4226 Section 5.3:
 *
 * 1. Convert counter to 8-byte big-endian array (RFC 4226 Section 5.1)
 * 2. Compute HMAC-SHA-1 using the secret key and counter (RFC 4226 Section 5.2)
 * 3. Apply dynamic truncation to extract 4-byte code (RFC 4226 Section 5.3)
 * 4. Reduce modulo 10^digits to get final OTP (RFC 4226 Section 5.3)
 *
 * @see {@link https://tools.ietf.org/html/rfc4226#section-5.3 | RFC 4226 Section 5.3 - Generating an HOTP Value}
 *
 * @param options - HOTP generation options
 * @returns The HOTP code as a string
 *
 * @example
 * ```ts
 * import { generate } from '@otplib/hotp';
 * import { NodeCryptoPlugin } from '@otplib/plugin-crypto-node';
 *
 * const hotp = generate({
 *   secret: new Uint8Array([1, 2, 3, 4, 5]),
 *   counter: 0,
 *   digits: 6,
 *   crypto: new NodeCryptoPlugin(),
 * });
 * // Returns: '123456'
 * ```
 */
declare function generate(options: HOTPGenerateOptions): Promise<string>;
/**
 * Generate an HMAC-based One-Time Password (HOTP) synchronously
 *
 * This is the synchronous version of {@link generate}. It requires a crypto
 * plugin that supports synchronous HMAC operations (e.g., NodeCryptoPlugin
 * or NobleCryptoPlugin). Using this with WebCryptoPlugin will throw an error.
 *
 * @see {@link generate} for the async version
 * @see {@link https://tools.ietf.org/html/rfc4226#section-5.3 | RFC 4226 Section 5.3}
 *
 * @param options - HOTP generation options
 * @returns The HOTP code as a string
 * @throws {HMACError} If the crypto plugin doesn't support sync operations
 *
 * @example
 * ```ts
 * import { generateSync } from '@otplib/hotp';
 * import { NodeCryptoPlugin } from '@otplib/plugin-crypto-node';
 *
 * const hotp = generateSync({
 *   secret: new Uint8Array([1, 2, 3, 4, 5]),
 *   counter: 0,
 *   digits: 6,
 *   crypto: new NodeCryptoPlugin(),
 * });
 * // Returns: '123456'
 * ```
 */
declare function generateSync(options: HOTPGenerateOptions): string;
/**
 * Verify an HOTP code
 *
 * Compares the provided token against the expected HOTP value
 * using constant-time comparison to prevent timing attacks.
 *
 * @see {@link https://tools.ietf.org/html/rfc4226#section-7.2 | RFC 4226 Section 7.2 - Validation and Verification}
 * @see {@link https://tools.ietf.org/html/rfc4226#section-7.4 | RFC 4226 Section 7.4 - Resynchronization}
 *
 * ## Counter Resynchronization (RFC 4226 Section 7.4)
 *
 * When using a verification window, the `delta` value in the result indicates
 * how many counter steps ahead the token was found. After successful verification,
 * you should update the stored counter to prevent replay attacks:
 *
 * ```ts
 * const nextCounter = counter + result.delta + 1;
 * ```
 *
 * This ensures that the same token cannot be reused.
 *
 * @param options - HOTP verification options
 * @returns Verification result with validity and optional delta
 *
 * @example Basic verification
 * ```ts
 * import { verify } from '@otplib/hotp';
 * import { NodeCryptoPlugin } from '@otplib/plugin-crypto-node';
 *
 * const result = await verify({
 *   secret: new Uint8Array([1, 2, 3, 4, 5]),
 *   counter: 0,
 *   token: '123456',
 *   crypto: new NodeCryptoPlugin(),
 * });
 * // Returns: { valid: true, delta: 0 }
 * ```
 *
 * @example Counter resynchronization with counterTolerance
 * ```ts
 * // User's token was generated at counter 5, but server expects counter 3
 * const result = await verify({
 *   secret,
 *   counter: 3,      // Server's stored counter
 *   token: userToken,
 *   counterTolerance: 5,       // Allow up to 5 counters ahead
 *   crypto: new NodeCryptoPlugin(),
 * });
 *
 * if (result.valid) {
 *   // Token matched at counter 3 + delta
 *   // Update stored counter to prevent replay attacks
 *   const nextCounter = 3 + result.delta + 1; // = 6
 *   await saveCounter(userId, nextCounter);
 * }
 * ```
 */
declare function verify(options: HOTPVerifyOptions): Promise<VerifyResult>;
/**
 * Verify an HOTP code synchronously
 *
 * This is the synchronous version of {@link verify}. It requires a crypto
 * plugin that supports synchronous HMAC operations (e.g., NodeCryptoPlugin
 * or NobleCryptoPlugin). Using this with WebCryptoPlugin will throw an error.
 *
 * @see {@link verify} for the async version
 * @see {@link https://tools.ietf.org/html/rfc4226#section-7.2 | RFC 4226 Section 7.2}
 *
 * @param options - HOTP verification options
 * @returns Verification result with validity and optional delta
 * @throws {HMACError} If the crypto plugin doesn't support sync operations
 *
 * @example
 * ```ts
 * import { verifySync } from '@otplib/hotp';
 * import { NodeCryptoPlugin } from '@otplib/plugin-crypto-node';
 *
 * const result = verifySync({
 *   secret: new Uint8Array([1, 2, 3, 4, 5]),
 *   counter: 0,
 *   token: '123456',
 *   crypto: new NodeCryptoPlugin(),
 * });
 * // Returns: { valid: true, delta: 0 }
 * ```
 */
declare function verifySync(options: HOTPVerifyOptions): VerifyResult;

export { HOTP, type HOTPGenerateOptions, type HOTPOptions, type HOTPVerifyOptions, type VerifyResult, type VerifyResultInvalid, type VerifyResultValid, generate, generateSync, verify, verifySync };
