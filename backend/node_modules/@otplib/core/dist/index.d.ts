import { CryptoPlugin, HashAlgorithm, Base32Plugin, Base32EncodeOptions } from './types.js';
export { Digits, OTPHooks, OTPResult, OTPResultError, OTPResultOk, SecretOptions } from './types.js';
export { DEFAULT_PERIOD, MAX_COUNTER, MAX_PERIOD, MAX_SECRET_BYTES, MAX_WINDOW, MIN_PERIOD, MIN_SECRET_BYTES, OTPGuardrails, OTPGuardrailsConfig, RECOMMENDED_SECRET_BYTES, bytesToString, constantTimeEqual, counterToBytes, createGuardrails, dynamicTruncate, generateSecret, getDigestSize, hasGuardrailOverrides, normalizeCounterTolerance, normalizeEpochTolerance, normalizeSecret, requireBase32Plugin, requireBase32String, requireCryptoPlugin, requireIssuer, requireLabel, requireSecret, stringToBytes, truncateDigits, validateByteLengthEqual, validateCounter, validateCounterTolerance, validateEpochTolerance, validatePeriod, validateSecret, validateTime, validateToken, wrapResult, wrapResultAsync } from './utils.js';
export { AfterTimeStepError, AfterTimeStepNegativeError, AfterTimeStepNotIntegerError, AfterTimeStepRangeExceededError, AlgorithmError, Base32DecodeError, Base32EncodeError, Base32Error, Base32PluginMissingError, ConfigurationError, CounterError, CounterNegativeError, CounterNotIntegerError, CounterOverflowError, CounterToleranceError, CounterToleranceNegativeError, CounterToleranceTooLargeError, CryptoError, CryptoPluginMissingError, DigitsError, EpochToleranceError, EpochToleranceNegativeError, EpochToleranceTooLargeError, HMACError, IssuerMissingError, LabelMissingError, OTPError, OTPErrorOptions, PeriodError, PeriodTooLargeError, PeriodTooSmallError, PluginError, RandomBytesError, SecretError, SecretMissingError, SecretTooLongError, SecretTooShortError, SecretTypeError, TimeError, TimeNegativeError, TimeNotFiniteError, TokenError, TokenFormatError, TokenLengthError } from './errors.js';

/**
 * CryptoContext provides a unified interface for crypto operations
 * using a pluggable crypto backend
 */
declare class CryptoContext {
    private readonly crypto;
    /**
     * Create a new CryptoContext with the given crypto plugin
     *
     * @param crypto - The crypto plugin to use
     */
    constructor(crypto: CryptoPlugin);
    /**
     * Get the underlying crypto plugin
     */
    get plugin(): CryptoPlugin;
    /**
     * Compute HMAC using the configured crypto plugin
     *
     * @param algorithm - The hash algorithm to use
     * @param key - The secret key as a byte array
     * @param data - The data to authenticate as a byte array
     * @returns HMAC digest as a byte array
     * @throws {HMACError} If HMAC computation fails
     */
    hmac(algorithm: HashAlgorithm, key: Uint8Array, data: Uint8Array): Promise<Uint8Array>;
    /**
     * Synchronous HMAC computation
     *
     * @param algorithm - The hash algorithm to use
     * @param key - The secret key as a byte array
     * @param data - The data to authenticate as a byte array
     * @returns HMAC digest as a byte array
     * @throws {HMACError} If HMAC computation fails or if crypto plugin doesn't support sync operations
     */
    hmacSync(algorithm: HashAlgorithm, key: Uint8Array, data: Uint8Array): Uint8Array;
    /**
     * Generate cryptographically secure random bytes
     *
     * @param length - Number of random bytes to generate
     * @returns Random bytes
     * @throws {RandomBytesError} If random byte generation fails
     */
    randomBytes(length: number): Uint8Array;
}
/**
 * Create a CryptoContext from a crypto plugin
 *
 * @param crypto - The crypto plugin to use
 * @returns A new CryptoContext instance
 */
declare function createCryptoContext(crypto: CryptoPlugin): CryptoContext;

/**
 * Base32Context provides a unified interface for Base32 operations
 * using a pluggable Base32 backend.
 *
 * All errors from the underlying plugin are wrapped in otplib error types
 * with the original error preserved via the `cause` property.
 */
declare class Base32Context {
    private readonly base32;
    /**
     * Create a new Base32Context with the given Base32 plugin
     *
     * @param base32 - The Base32 plugin to use
     */
    constructor(base32: Base32Plugin);
    /**
     * Get the underlying Base32 plugin
     */
    get plugin(): Base32Plugin;
    /**
     * Encode binary data to Base32 string using the configured plugin
     *
     * @param data - Uint8Array to encode
     * @param options - Encoding options
     * @returns Base32 encoded string
     * @throws {Base32EncodeError} If encoding fails
     */
    encode(data: Uint8Array, options?: Base32EncodeOptions): string;
    /**
     * Decode Base32 string to binary data using the configured plugin
     *
     * @param str - Base32 string to decode
     * @returns Decoded Uint8Array
     * @throws {Base32DecodeError} If string contains invalid characters or decoding fails
     */
    decode(str: string): Uint8Array;
}
/**
 * Create a Base32Context from a Base32 plugin
 *
 * @param base32 - The Base32 plugin to use
 * @returns A new Base32Context instance
 */
declare function createBase32Context(base32: Base32Plugin): Base32Context;

/**
 * Options for creating a custom Base32 plugin
 */
type CreateBase32PluginOptions = {
    /**
     * Plugin name for identification (default: "custom")
     */
    name?: string;
    /**
     * Encode binary data to string
     */
    encode: (data: Uint8Array) => string;
    /**
     * Decode string to binary data
     */
    decode: (str: string) => Uint8Array;
};
/**
 * Options for creating a custom Crypto plugin
 */
type CreateCryptoPluginOptions = {
    /**
     * Plugin name for identification (default: "custom")
     */
    name?: string;
    /**
     * Compute HMAC using the specified hash algorithm
     */
    hmac: (algorithm: HashAlgorithm, key: Uint8Array, data: Uint8Array) => Promise<Uint8Array> | Uint8Array;
    /**
     * Generate cryptographically secure random bytes
     */
    randomBytes: (length: number) => Uint8Array;
    /**
     * Constant-time comparison (optional, falls back to core utility)
     */
    constantTimeEqual?: (a: string | Uint8Array, b: string | Uint8Array) => boolean;
};
/**
 * Create a custom Base32 plugin from encode/decode functions
 *
 * Use this factory to create plugins that bypass Base32 encoding
 * or implement custom secret transformations.
 *
 * @example
 * ```ts
 * import { createBase32Plugin, stringToBytes, bytesToString } from '@otplib/core';
 *
 * // UTF-8 string bypass (no Base32)
 * const bypassAsString = createBase32Plugin({
 *   name: 'bypass-as-string',
 *   encode: bytesToString,
 *   decode: stringToBytes,
 * });
 *
 * // Base64 bypass
 * const base64Bypass = createBase32Plugin({
 *   name: 'base64-bypass',
 *   encode: (data) => btoa(String.fromCharCode(...data)),
 *   decode: (str) => new Uint8Array([...atob(str)].map(c => c.charCodeAt(0))),
 * });
 * ```
 */
declare function createBase32Plugin(options: CreateBase32PluginOptions): Base32Plugin;
/**
 * Create a custom Crypto plugin from crypto operation functions
 *
 * Use this factory when you need a custom cryptographic implementation
 * that doesn't fit the existing plugins (node, web, noble).
 *
 * @example
 * ```ts
 * import { createCryptoPlugin } from '@otplib/core';
 *
 * const customCrypto = createCryptoPlugin({
 *   name: 'my-crypto',
 *   hmac: async (algorithm, key, data) => {
 *     // Custom HMAC implementation
 *   },
 *   randomBytes: (length) => {
 *     // Custom random bytes implementation
 *   },
 * });
 * ```
 */
declare function createCryptoPlugin(options: CreateCryptoPluginOptions): CryptoPlugin;

/**
 * TypeScript Utility Types for otplib
 *
 * These types enhance developer experience by providing:
 * - Branded types for type-safe string handling
 * - Type guards for discriminated unions
 * - Helper types for option extraction
 */

/**
 * Brand type for creating nominal types from primitives
 *
 * @example
 * ```ts
 * type UserId = Brand<string, 'UserId'>;
 * const id: UserId = 'abc' as UserId;
 * ```
 */
type Brand<T, B extends string> = T & {
    readonly __brand: B;
};
/**
 * Branded string type for Base32-encoded secrets
 *
 * Use this type to distinguish Base32-encoded secrets from regular strings
 * at compile time, preventing accidental misuse.
 *
 * @example
 * ```ts
 * import type { Base32Secret } from '@otplib/core';
 *
 * function processSecret(secret: Base32Secret): void {
 *   // TypeScript ensures only Base32Secret values are passed
 * }
 *
 * const secret = generateSecret() as Base32Secret;
 * processSecret(secret); // OK
 * processSecret('random-string'); // Type error
 * ```
 */
type Base32Secret = Brand<string, "Base32Secret">;
/**
 * Branded string type for OTP tokens
 *
 * Use this type to distinguish OTP tokens from regular strings
 * at compile time, preventing accidental misuse.
 *
 * @example
 * ```ts
 * import type { OTPToken } from '@otplib/core';
 *
 * function validateToken(token: OTPToken): boolean {
 *   // TypeScript ensures only OTPToken values are passed
 * }
 *
 * const token = await generate() as OTPToken;
 * validateToken(token); // OK
 * validateToken('123456'); // Type error
 * ```
 */
type OTPToken = Brand<string, "OTPToken">;
/**
 * Helper type to make all properties of T required except those in K
 *
 * @example
 * ```ts
 * type Options = { a?: string; b?: number; c?: boolean };
 * type RequiredAB = RequireKeys<Options, 'a' | 'b'>;
 * // { a: string; b: number; c?: boolean }
 * ```
 */
type RequireKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
/**
 * Helper type to make all properties of T optional except those in K
 *
 * @example
 * ```ts
 * type Options = { a: string; b: number; c: boolean };
 * type OptionalBC = OptionalKeys<Options, 'b' | 'c'>;
 * // { a: string; b?: number; c?: boolean }
 * ```
 */
type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
/**
 * Extract the plugin configuration from an options type
 *
 * @example
 * ```ts
 * type Plugins = PluginConfig<TOTPOptions>;
 * // { crypto: CryptoPlugin; base32?: Base32Plugin }
 * ```
 */
type PluginConfig<T> = T extends {
    crypto?: CryptoPlugin;
    base32?: Base32Plugin;
} ? Pick<T, "crypto" | "base32"> : never;
/**
 * Ensure an options type has plugins defined
 *
 * @example
 * ```ts
 * type ConfiguredOptions = WithRequiredPlugins<TOTPOptions>;
 * // TOTPOptions with crypto and base32 required
 * ```
 */
type WithRequiredPlugins<T extends {
    crypto?: CryptoPlugin;
    base32?: Base32Plugin;
}> = T & {
    crypto: CryptoPlugin;
    base32: Base32Plugin;
};
/**
 * Options type for OTP generation (crypto required)
 *
 * @example
 * ```ts
 * type MyGenerateOptions = GenerationReady<HOTPOptions>;
 * // HOTPOptions with crypto required
 * ```
 */
type GenerationReady<T extends {
    crypto?: CryptoPlugin;
}> = T & {
    crypto: CryptoPlugin;
};
/**
 * Type predicate to check if an object has the required plugins
 *
 * @example
 * ```ts
 * const options = getOptions();
 * if (hasPlugins(options)) {
 *   // TypeScript knows plugins are defined
 *   options.crypto.hmac(...);
 * }
 * ```
 */
declare function hasPlugins<T extends {
    crypto?: CryptoPlugin;
    base32?: Base32Plugin;
}>(options: T): options is T & {
    crypto: CryptoPlugin;
    base32: Base32Plugin;
};
/**
 * Type predicate to check if an object has a crypto plugin
 *
 * @example
 * ```ts
 * if (hasCrypto(options)) {
 *   await options.crypto.hmac('sha1', key, data);
 * }
 * ```
 */
declare function hasCrypto<T extends {
    crypto?: CryptoPlugin;
}>(options: T): options is T & {
    crypto: CryptoPlugin;
};
/**
 * Type predicate to check if an object has a base32 plugin
 *
 * @example
 * ```ts
 * if (hasBase32(options)) {
 *   const decoded = options.base32.decode(secret);
 * }
 * ```
 */
declare function hasBase32<T extends {
    base32?: Base32Plugin;
}>(options: T): options is T & {
    base32: Base32Plugin;
};
/**
 * Narrow union type by a specific property value
 *
 * @example
 * ```ts
 * type Result = VerifyResultValid | VerifyResultInvalid;
 * type ValidOnly = NarrowBy<Result, 'valid', true>;
 * // VerifyResultValid
 * ```
 */
type NarrowBy<T, K extends keyof T, V extends T[K]> = T extends {
    [key in K]: V;
} ? T : never;

export { Base32Context, Base32EncodeOptions, Base32Plugin, type Base32Secret, type Brand, type CreateBase32PluginOptions, type CreateCryptoPluginOptions, CryptoContext, CryptoPlugin, type GenerationReady, HashAlgorithm, type NarrowBy, type OTPToken, type OptionalKeys, type PluginConfig, type RequireKeys, type WithRequiredPlugins, createBase32Context, createBase32Plugin, createCryptoContext, createCryptoPlugin, hasBase32, hasCrypto, hasPlugins };
