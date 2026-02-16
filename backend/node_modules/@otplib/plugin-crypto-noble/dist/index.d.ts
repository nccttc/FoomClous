import { CryptoPlugin } from '@otplib/core';

/**
 * Pure JavaScript implementation of CryptoPlugin
 *
 * This plugin uses @noble/hashes which provides:
 * - Pure JavaScript implementations of hash functions
 * - Zero dependencies and audited code
 * - Cross-platform compatibility (Node.js, browser, edge)
 * - Fallback for environments without native crypto APIs
 *
 * @example
 * ```ts
 * import { NobleCryptoPlugin } from '@otplib/plugin-crypto-noble';
 *
 * const crypto = new NobleCryptoPlugin();
 * const hmac = crypto.hmac('sha1', key, data);
 * const random = crypto.randomBytes(20);
 * ```
 */
declare class NobleCryptoPlugin implements CryptoPlugin {
    /**
     * Plugin name for identification
     */
    readonly name = "noble";
    /**
     * Compute HMAC using @noble/hashes
     *
     * Synchronous implementation using pure JS.
     *
     * @param algorithm - Hash algorithm to use
     * @param key - Secret key
     * @param data - Data to authenticate
     * @returns HMAC digest
     */
    hmac(algorithm: "sha1" | "sha256" | "sha512", key: Uint8Array, data: Uint8Array): Uint8Array;
    /**
     * Generate cryptographically secure random bytes
     *
     * Uses @noble/hashes' randomBytes which is backed by:
     * - Node.js crypto.randomBytes in Node.js
     * - crypto.getRandomValues in browsers
     * - A PRNG as fallback
     *
     * @param length - Number of bytes to generate
     * @returns Random bytes
     */
    randomBytes(length: number): Uint8Array;
    /**
     * Constant-time comparison to prevent timing side-channel attacks
     *
     * @noble/hashes doesn't provide a constant-time comparison,
     * so we Use the core utility implementation.
     *
     * @param a - First value to compare
     * @param b - Second value to compare
     * @returns true if values are equal, false otherwise
     */
    constantTimeEqual(a: string | Uint8Array, b: string | Uint8Array): boolean;
}
/**
 * Default singleton instance for convenience
 *
 * @example
 * ```ts
 * import { crypto } from '@otplib/plugin-crypto-noble';
 *
 * const hmac = crypto.hmac('sha1', key, data);
 * ```
 */
declare const crypto: CryptoPlugin;

export { NobleCryptoPlugin, crypto, NobleCryptoPlugin as default };
