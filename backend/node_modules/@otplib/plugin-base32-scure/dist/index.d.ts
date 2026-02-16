import { Base32Plugin, Base32EncodeOptions } from '@otplib/core';

/**
 * @otplib/plugin-base32-scure
 *
 * Base32 plugin for otplib using @scure/base.
 * Works universally across all JavaScript runtimes.
 */

/**
 * Scure Base32 plugin
 *
 * This implementation uses @scure/base for Base32 encoding/decoding.
 * @scure/base is a modern, audited cryptography library with zero dependencies.
 *
 * @example
 * ```ts
 * import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';
 *
 * const plugin = new ScureBase32Plugin();
 * const encoded = plugin.encode(data);
 * const decoded = plugin.decode(encoded);
 * ```
 */
declare class ScureBase32Plugin implements Base32Plugin {
    readonly name = "scure";
    /**
     * Encode binary data to Base32 string
     *
     * @param data - Uint8Array to encode
     * @param options - Encoding options
     * @returns Base32 encoded string
     */
    encode(data: Uint8Array, options?: Base32EncodeOptions): string;
    /**
     * Decode Base32 string to binary data
     *
     * @param str - Base32 string to decode
     * @returns Decoded Uint8Array
     * @throws {Error} If string contains invalid characters
     */
    decode(str: string): Uint8Array;
}
/**
 * Default singleton instance for convenience
 *
 * @example
 * ```ts
 * import { base32 } from '@otplib/plugin-base32-scure';
 *
 * const encoded = base32.encode(data);
 * ```
 */
declare const base32: Base32Plugin;

export { ScureBase32Plugin, base32, ScureBase32Plugin as default };
