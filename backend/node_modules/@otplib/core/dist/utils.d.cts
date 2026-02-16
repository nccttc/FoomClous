import { OTPError } from './errors.cjs';
import { SecretOptions, HashAlgorithm, OTPResult } from './types.cjs';

/**
 * Minimum secret length in bytes (128 bits as per RFC 4226)
 */
declare const MIN_SECRET_BYTES = 16;
/**
 * Maximum secret length in bytes (512 bits)
 *
 * The 64-byte maximum is not part of the RFCs.
 * This is to prevent excessive memory usage in HMAC operations.
 */
declare const MAX_SECRET_BYTES = 64;
/**
 * Recommended secret length in bytes (160 bits as per RFC 4226)
 */
declare const RECOMMENDED_SECRET_BYTES = 20;
/**
 * Minimum period in seconds
 */
declare const MIN_PERIOD = 1;
/**
 * Maximum period in seconds (1 hour)
 */
declare const MAX_PERIOD = 3600;
/**
 * Default period in seconds (30 seconds as per RFC 6238)
 */
declare const DEFAULT_PERIOD = 30;
/**
 * Maximum safe integer for counter (2^53 - 1)
 */
declare const MAX_COUNTER: number;
/**
 * Maximum verification window size
 *
 * Limits the number of HMAC computations during verification to prevent DoS attacks.
 * A window of 99 means up to 99 HMAC computations (total checks including current counter).
 * Odd number to cater for equal distribution of time drift + current.
 *
 * For TOTP: window=1 is typically sufficient (allows +-30 seconds clock drift)
 * For HOTP: window=10-50 handles reasonable counter desynchronization
 */
declare const MAX_WINDOW = 99;
/**
 * Configurable guardrails for OTP validation
 *
 * Allows overriding default safety limits for non-standard production requirements.
 * Use with caution - custom guardrails can weaken security.
 */
type OTPGuardrailsConfig = {
    MIN_SECRET_BYTES: number;
    MAX_SECRET_BYTES: number;
    MIN_PERIOD: number;
    MAX_PERIOD: number;
    MAX_COUNTER: number;
    MAX_WINDOW: number;
};
/**
 * Module-private symbol to track guardrail override status
 *
 * This symbol is used as a property key to store whether guardrails contain custom values.
 * Being module-private and a symbol ensures:
 * - Cannot be accessed outside this module (not exported)
 * - Cannot be recreated (each Symbol() call is unique)
 * - Hidden from normal enumeration (Object.keys, JSON.stringify, for-in)
 * - Minimal memory overhead (~1 byte per object)
 * - No garbage collection concerns
 *
 * @internal
 */
declare const OVERRIDE_SYMBOL: unique symbol;
/**
 * Complete guardrails configuration
 *
 * This represents the final, immutable configuration used by validation functions.
 * Internally tracks whether any values were overridden from RFC recommendations,
 * enabling security auditing and compliance monitoring without exposing implementation
 * details in the public API.
 *
 * The override status is stored using a module-private Symbol that cannot be accessed
 * or recreated outside this module, providing true encapsulation.
 *
 * @see {@link OTPGuardrailsConfig} for the base configuration structure
 * @see {@link createGuardrails} for creating guardrails instances
 * @see {@link hasGuardrailOverrides} to check if guardrails were customized
 */
type OTPGuardrails = Readonly<OTPGuardrailsConfig> & {
    [OVERRIDE_SYMBOL]?: boolean;
};
/**
 * Create guardrails configuration object
 *
 * Factory function that merges custom guardrails with defaults and returns
 * an immutable (frozen) object. Validates custom guardrails to ensure they
 * maintain basic safety invariants.
 *
 * When called without arguments or with `undefined`, returns the default guardrails
 * singleton (optimized to avoid unnecessary allocations). When called with custom
 * values, creates a new frozen object and internally marks it as overridden.
 *
 * @param custom - Optional partial guardrails to override defaults
 * @returns Frozen guardrails object
 * @throws {ConfigurationError} If custom guardrails violate safety invariants
 *
 * @example Basic usage
 * ```ts
 * import { createGuardrails, hasGuardrailOverrides } from '@otplib/core'
 *
 * // Returns default singleton (no overrides)
 * const defaults = createGuardrails();
 * hasGuardrailOverrides(defaults); // false
 *
 * // Creates new object with overrides
 * const custom = createGuardrails({
 *   MIN_SECRET_BYTES: 8,
 *   MAX_WINDOW: 200
 * });
 * hasGuardrailOverrides(custom); // true
 * ```
 *
 * @example Monitoring custom guardrails
 * ```ts
 * import { createGuardrails, hasGuardrailOverrides } from '@otplib/core';
 *
 * const guardrails = createGuardrails({ MAX_WINDOW: 20 });
 *
 * if (hasGuardrailOverrides(guardrails)) {
 *   logger.warn('Non-default guardrails in use', { guardrails });
 * }
 * ```
 *
 * @see {@link hasGuardrailOverrides} to check if guardrails were customized
 */
declare function createGuardrails(custom?: Partial<OTPGuardrailsConfig>): OTPGuardrails;
/**
 * Check if guardrails contain custom overrides
 *
 * Returns `true` if the guardrails object was created with custom values,
 * `false` if using RFC-recommended defaults. Useful for security auditing,
 * compliance monitoring, and development warnings.
 *
 * This function accesses a module-private Symbol property that cannot be
 * accessed or modified outside this module, ensuring reliable detection.
 *
 * @param guardrails - The guardrails object to check
 * @returns `true` if guardrails were customized, `false` if using defaults
 *
 * @example Security monitoring
 * ```ts
 * import { createGuardrails, hasGuardrailOverrides } from '@otplib/core';
 *
 * const guardrails = createGuardrails({ MAX_WINDOW: 20 });
 *
 * if (hasGuardrailOverrides(guardrails)) {
 *   console.warn('Custom guardrails detected:', guardrails);
 *   // Log to security audit system
 * }
 * ```
 *
 * @example Compliance check
 * ```ts
 * function validateGuardrails(guardrails: OTPGuardrails) {
 *   if (hasGuardrailOverrides(guardrails)) {
 *     throw new Error('Custom guardrails not allowed in production');
 *   }
 * }
 * ```
 */
declare function hasGuardrailOverrides(guardrails: OTPGuardrails): boolean;
/**
 * Validate secret key
 *
 * @param secret - The secret to validate
 * @param guardrails - Validation guardrails (defaults to RFC recommendations)
 * @throws {SecretTooShortError} If secret is too short
 * @throws {SecretTooLongError} If secret is too long
 */
declare function validateSecret(secret: Uint8Array, guardrails?: OTPGuardrails): void;
/**
 * Validate counter value
 *
 * @param counter - The counter to validate
 * @param guardrails - Validation guardrails (defaults to RFC recommendations)
 * @throws {CounterNegativeError} If counter is negative
 * @throws {CounterOverflowError} If counter exceeds safe integer
 */
declare function validateCounter(counter: number | bigint, guardrails?: OTPGuardrails): void;
/**
 * Validate time value
 *
 * @param time - The time in seconds to validate
 * @throws {TimeNegativeError} If time is negative
 */
declare function validateTime(time: number): void;
/**
 * Validate period value
 *
 * @param period - The period in seconds to validate
 * @param guardrails - Validation guardrails (defaults to RFC recommendations)
 * @throws {PeriodTooSmallError} If period is too small
 * @throws {PeriodTooLargeError} If period is too large
 */
declare function validatePeriod(period: number, guardrails?: OTPGuardrails): void;
/**
 * Validate token
 *
 * @param token - The token string to validate
 * @param digits - Expected number of digits
 * @throws {TokenLengthError} If token has incorrect length
 * @throws {TokenFormatError} If token contains non-digit characters
 */
declare function validateToken(token: string, digits: number): void;
/**
 * Validate counter tolerance for HOTP verification
 *
 * Prevents DoS attacks by limiting the number of counter values checked.
 *
 * @param counterTolerance - Counter tolerance specification (number or array of offsets)
 * @param guardrails - Validation guardrails (defaults to RFC recommendations)
 * @throws {CounterToleranceTooLargeError} If tolerance size exceeds MAX_WINDOW
 *
 * @example
 * ```ts
 * validateCounterTolerance(1);        // OK: [0, 1] = 2 checks
 * validateCounterTolerance(98);       // OK: [0, 98] = 99 checks
 * validateCounterTolerance(99);       // Throws: exceeds MAX_WINDOW
 * validateCounterTolerance([0, 1]);   // OK: 2 offsets
 * ```
 */
declare function validateCounterTolerance(counterTolerance: number | [number, number], guardrails?: OTPGuardrails): void;
/**
 * Validate epoch tolerance for TOTP verification
 *
 * Prevents DoS attacks by limiting the time range checked.
 * Also validates that tolerance values are non-negative.
 *
 * @param epochTolerance - Epoch tolerance specification (number or tuple [past, future])
 * @param period - The TOTP period in seconds (default: 30). Used to calculate max tolerance.
 * @param guardrails - Validation guardrails (defaults to RFC recommendations)
 * @throws {EpochToleranceNegativeError} If tolerance contains negative values
 * @throws {EpochToleranceTooLargeError} If tolerance exceeds MAX_WINDOW periods
 *
 * @example
 * ```ts
 * validateEpochTolerance(30);            // OK: 30 seconds symmetric
 * validateEpochTolerance([5, 0]);        // OK: 5 seconds past only
 * validateEpochTolerance([-5, 0]);       // Throws: negative values not allowed
 * validateEpochTolerance(1471);          // Throws with default guardrails (30s period)
 * validateEpochTolerance(2940, 60);      // OK with 60s period
 * ```
 */
declare function validateEpochTolerance(epochTolerance: number | [number, number], period?: number, guardrails?: OTPGuardrails): void;
/**
 * Convert counter to 8-byte big-endian array
 *
 * Per RFC 4226 Section 5.1, the counter value is represented as an 8-byte
 * big-endian (network byte order) unsigned integer.
 *
 * @see {@link https://tools.ietf.org/html/rfc4226#section-5.1 | RFC 4226 Section 5.1 - Symbol Descriptions}
 *
 * @param value - The counter value to convert
 * @returns 8-byte big-endian array
 */
declare function counterToBytes(value: number | bigint): Uint8Array;
/**
 * Perform Dynamic Truncation as per RFC 4226 Section 5.3
 *
 * The algorithm:
 * 1. Take the low-order 4 bits of the last byte as offset
 * 2. Extract 4 bytes starting at offset
 * 3. Mask the most significant bit to get a 31-bit unsigned integer
 *
 * This ensures consistent extraction across different HMAC output sizes
 * while producing a value that fits in a signed 32-bit integer.
 *
 * @see {@link https://tools.ietf.org/html/rfc4226#section-5.3 | RFC 4226 Section 5.3 - Generating an HOTP Value}
 *
 * @param hmacResult - HMAC result (at least 20 bytes for SHA-1)
 * @returns Truncated 31-bit unsigned integer
 */
declare function dynamicTruncate(hmacResult: Uint8Array): number;
/**
 * Convert truncated integer to OTP string with specified digits
 *
 * Computes: Snum mod 10^Digit (RFC 4226 Section 5.3)
 *
 * The result is zero-padded to ensure consistent length,
 * as required for proper token comparison.
 *
 * @see {@link https://tools.ietf.org/html/rfc4226#section-5.3 | RFC 4226 Section 5.3 - Generating an HOTP Value}
 *
 * @param value - The truncated integer value (Snum)
 * @param digits - Number of digits for the OTP (Digit, typically 6-8)
 * @returns OTP string with leading zeros if necessary
 */
declare function truncateDigits(value: number, digits: number): string;
/**
 * Validate that two byte arrays have equal length
 *
 * Useful as a preliminary check before performing byte-by-byte comparisons.
 *
 * @param a - First byte array
 * @param b - Second byte array
 * @returns true if arrays have equal length, false otherwise
 */
declare function validateByteLengthEqual(a: Uint8Array, b: Uint8Array): boolean;
/**
 * Constant-time comparison to prevent timing attacks
 *
 * This implements a timing-safe equality check as recommended in
 * RFC 4226 Section 7.2 for token validation to prevent
 * timing side-channel attacks.
 *
 * @see {@link https://tools.ietf.org/html/rfc4226#section-7.2 | RFC 4226 Section 7.2 - Validation and Verification}
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns true if values are equal, false otherwise
 */
declare function constantTimeEqual(a: string | Uint8Array, b: string | Uint8Array): boolean;
/**
 * Get HMAC digest size in bytes for a given algorithm
 *
 * @param algorithm - The hash algorithm
 * @returns Digest size in bytes
 */
declare function getDigestSize(algorithm: HashAlgorithm): number;
/**
 * Convert a string or Uint8Array to Uint8Array
 *
 * This utility function normalizes input to Uint8Array, converting strings
 * using UTF-8 encoding. Uint8Array inputs are returned as-is.
 *
 * Use this to convert raw secret strings (passphrases) to Uint8Array
 * before passing them to generation or verification functions.
 *
 * @param value - The value to convert (string or Uint8Array)
 * @returns The value as a Uint8Array (UTF-8 encoded for strings)
 *
 * @example
 * ```ts
 * import { stringToBytes } from '@otplib/core'
 *
 * const bytes1 = stringToBytes('1234567890123456')
 * // Returns: Uint8Array([49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 49, 50, 51, 52, 53, 54])
 *
 * const bytes2 = stringToBytes(new Uint8Array([1, 2, 3]))
 * // Returns: Uint8Array([1, 2, 3]) - returned as-is
 * ```
 */
declare function stringToBytes(value: string | Uint8Array): Uint8Array;
/**
 * Convert bytes to UTF-8 string
 *
 * Uses TextDecoder for proper UTF-8 handling.
 *
 * @param bytes - Uint8Array to convert
 * @returns UTF-8 string
 *
 * @example
 * ```ts
 * const str = bytesToString(new Uint8Array([104, 101, 108, 108, 111]));
 * // str === "hello"
 * ```
 */
declare function bytesToString(bytes: Uint8Array): string;
/**
 * Normalize secret input to Uint8Array
 *
 * Accepts either a Base32-encoded string or Uint8Array and returns Uint8Array.
 * If a Base32Plugin is provided, string secrets will be automatically decoded.
 *
 * **Note**: By default, strings are assumed to be Base32 encoded.
 * If you have a raw string secret (e.g. a passphrase), you must convert it
 * to a Uint8Array using {@link stringToBytes} before calling this function.
 *
 * @param secret - The secret to normalize (Base32 string or Uint8Array)
 * @param base32 - Optional Base32Plugin to decode string secrets
 * @returns The secret as Uint8Array
 * @throws {Error} If secret is a string but no Base32Plugin is provided
 *
 * @example
 * ```ts
 * import { normalizeSecret } from '@otplib/core'
 * import { ScureBase32Plugin } from '@otplib/plugin-base32-scure'
 *
 * const base32 = new ScureBase32Plugin()
 *
 * // Uint8Array - returned as-is
 * const secret1 = normalizeSecret(new Uint8Array([1, 2, 3]))
 *
 * // Base32 string - automatically decoded
 * const secret2 = normalizeSecret('JBSWY3DPEHPK3PXP', base32)
 * ```
 */
declare function normalizeSecret(secret: string | Uint8Array, base32?: {
    decode: (str: string) => Uint8Array;
}): Uint8Array;
/**
 * Generate a random Base32-encoded secret
 *
 * Creates a cryptographically secure random secret suitable for OTP generation.
 * The default length of 20 bytes (160 bits) matches RFC 4226 recommendations
 * and provides good security margin.
 *
 * @param options - Secret generation options
 * @returns Base32-encoded secret string (without padding for Google Authenticator compatibility)
 *
 * @example
 * ```ts
 * import { generateSecret } from '@otplib/core';
 * import { NodeCryptoPlugin } from '@otplib/plugin-crypto-node';
 * import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';
 *
 * const secret = generateSecret({
 *   crypto: new NodeCryptoPlugin(),
 *   base32: new ScureBase32Plugin(),
 * });
 * // Returns: 'JBSWY3DPEHPK3PXP...' (32 characters)
 * ```
 *
 * @example Custom length
 * ```ts
 * const secret = generateSecret({
 *   crypto: new NodeCryptoPlugin(),
 *   base32: new ScureBase32Plugin(),
 *   length: 32, // 256 bits for SHA-256
 * });
 * ```
 */
declare function generateSecret(options: SecretOptions): string;
/**
 * Normalize counter tolerance to [past, future] tuple
 *
 * Converts a number or tuple counter tolerance specification into a [past, future] tuple
 * - Number: creates look-ahead only tolerance [0, tolerance] (default for security)
 * - Tuple: uses the tuple as-is (past, future)
 *
 * The default behavior (number → look-ahead only) improves security by preventing
 * replay attacks. HOTP counters should only move forward in normal operation.
 *
 * @param counterTolerance - Counter tolerance specification (number or tuple [past, future])
 * @returns Tuple [past, future] representing counters to check
 *
 * @example
 * ```ts
 * normalizeCounterTolerance(0)        // [0, 0]
 * normalizeCounterTolerance(5)        // [0, 5] - look-ahead only (secure default)
 * normalizeCounterTolerance([10, 5])  // [10, 5] - explicit past/future
 * normalizeCounterTolerance([5, 5])   // [5, 5] - explicit symmetric (use with caution)
 * ```
 */
declare function normalizeCounterTolerance(counterTolerance?: number | [number, number]): [number, number];
/**
 * Normalize epoch tolerance to [past, future] tuple
 *
 * Converts a number or tuple epoch tolerance specification into a [past, future] tuple
 * - Number: creates symmetric tolerance [tolerance, tolerance]
 * - Tuple: uses the tuple as-is
 *
 * @param epochTolerance - Epoch tolerance specification (number or tuple [past, future])
 * @returns Tuple [pastTolerance, futureTolerance] in seconds
 *
 * @example
 * ```ts
 * normalizeEpochTolerance(0)        // [0, 0]
 * normalizeEpochTolerance(30)       // [30, 30]
 * normalizeEpochTolerance([5, 0])   // [5, 0]
 * normalizeEpochTolerance([10, 5])  // [10, 5]
 * ```
 */
declare function normalizeEpochTolerance(epochTolerance?: number | [number, number]): [number, number];
/**
 * Require crypto plugin to be configured
 *
 * @param crypto - The crypto plugin
 * @throws {CryptoPluginMissingError} If crypto plugin is not set
 */
declare function requireCryptoPlugin<T>(crypto: T | undefined): asserts crypto is T;
/**
 * Require Base32 plugin to be configured
 *
 * @param base32 - The Base32 plugin
 * @throws {Base32PluginMissingError} If Base32 plugin is not set
 */
declare function requireBase32Plugin<T>(base32: T | undefined): asserts base32 is T;
/**
 * Require secret to be configured
 *
 * @param secret - The secret value
 * @throws {SecretMissingError} If secret is not set
 */
declare function requireSecret<T>(secret: T | undefined): asserts secret is T;
/**
 * Require label to be configured (for URI generation)
 *
 * @param label - The label value
 * @throws {LabelMissingError} If label is not set
 */
declare function requireLabel(label: string | undefined): asserts label is string;
/**
 * Require issuer to be configured (for URI generation)
 *
 * @param issuer - The issuer value
 * @throws {IssuerMissingError} If issuer is not set
 */
declare function requireIssuer(issuer: string | undefined): asserts issuer is string;
/**
 * Require secret to be a Base32 string (for URI generation)
 *
 * @param secret - The secret value
 * @throws {SecretTypeError} If secret is not a string
 */
declare function requireBase32String(secret: string | Uint8Array): asserts secret is string;
/**
 * Wrap a synchronous function to return OTPResult instead of throwing
 *
 * Preserves the original OTPError subclass so users can access
 * specific error information via instanceof checks.
 *
 * @internal
 */
declare function wrapResult<T, Args extends unknown[]>(fn: (...args: Args) => T): (...args: Args) => OTPResult<T, OTPError>;
/**
 * Wrap an async function to return OTPResult instead of throwing
 *
 * Preserves the original OTPError subclass so users can access
 * specific error information via instanceof checks.
 *
 * @internal
 */
declare function wrapResultAsync<T, Args extends unknown[]>(fn: (...args: Args) => Promise<T>): (...args: Args) => Promise<OTPResult<T, OTPError>>;

export { DEFAULT_PERIOD, MAX_COUNTER, MAX_PERIOD, MAX_SECRET_BYTES, MAX_WINDOW, MIN_PERIOD, MIN_SECRET_BYTES, type OTPGuardrails, type OTPGuardrailsConfig, RECOMMENDED_SECRET_BYTES, bytesToString, constantTimeEqual, counterToBytes, createGuardrails, dynamicTruncate, generateSecret, getDigestSize, hasGuardrailOverrides, normalizeCounterTolerance, normalizeEpochTolerance, normalizeSecret, requireBase32Plugin, requireBase32String, requireCryptoPlugin, requireIssuer, requireLabel, requireSecret, stringToBytes, truncateDigits, validateByteLengthEqual, validateCounter, validateCounterTolerance, validateEpochTolerance, validatePeriod, validateSecret, validateTime, validateToken, wrapResult, wrapResultAsync };
