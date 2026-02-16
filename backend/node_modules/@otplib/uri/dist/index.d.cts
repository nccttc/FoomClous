import { HashAlgorithm, Digits } from '@otplib/core';

/**
 * OTP type (HOTP or TOTP)
 */
type OTPType = "hotp" | "totp";
/**
 * otpauth:// URI parameters
 */
type OTPAuthParams = {
    /**
     * Base32-encoded shared secret (required)
     */
    readonly secret: string;
    /**
     * Service/provider name (recommended)
     */
    readonly issuer?: string;
    /**
     * Hash algorithm (default: sha1)
     * Note: Google Authenticator only supports sha1
     */
    readonly algorithm?: HashAlgorithm;
    /**
     * Number of digits (default: 6)
     * Google Authenticator supports 6 or 8
     */
    readonly digits?: Digits;
    /**
     * Initial counter value for HOTP (default: 0)
     */
    readonly counter?: number;
    /**
     * Time step in seconds for TOTP (default: 30)
     */
    readonly period?: number;
};
/**
 * otpauth:// URI structure
 */
type OTPAuthURI = {
    /**
     * Type of OTP (hotp or totp)
     */
    readonly type: OTPType;
    /**
     * The label (typically: issuer:account or account)
     */
    readonly label: string;
    /**
     * Parameters from the URI
     */
    readonly params: OTPAuthParams;
};
/**
 * Error thrown when URI parsing fails
 */
declare class URIParseError extends Error {
    constructor(message: string);
}
/**
 * Error thrown when URI is invalid
 */
declare class InvalidURIError extends URIParseError {
    constructor(uri: string);
}
/**
 * Error thrown when URI has missing required parameters
 */
declare class MissingParameterError extends URIParseError {
    constructor(param: string);
}
/**
 * Error thrown when URI has invalid parameter value
 */
declare class InvalidParameterError extends URIParseError {
    constructor(param: string, value: string);
}

/**
 * Parse an otpauth:// URI into its components
 *
 * @param uri - The otpauth:// URI to parse
 * @returns Parsed URI components
 * @throws {InvalidURIError} If URI is invalid
 * @throws {MissingParameterError} If required parameters are missing
 * @throws {InvalidParameterError} If parameter values are invalid
 *
 * @example
 * ```ts
 * import { parse } from '@otplib/uri';
 *
 * const uri = 'otpauth://totp/ACME:john@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME';
 * const parsed = parse(uri);
 * // {
 * //   type: 'totp',
 * //   label: 'ACME:john@example.com',
 * //   params: { secret: 'JBSWY3DPEHPK3PXP', issuer: 'ACME' }
 * // }
 * ```
 */
declare function parse(uri: string): OTPAuthURI;

/**
 * Base options for URI generation
 */
type URIOptions = {
    /**
     * Service/provider name (e.g., 'ACME Co', 'GitHub', 'AWS')
     */
    issuer?: string;
    /**
     * Account identifier (e.g., email, username)
     */
    label?: string;
    /**
     * Base32-encoded secret key
     */
    secret: string;
    /**
     * Hash algorithm (default: 'sha1')
     * Note: Google Authenticator only supports sha1
     */
    algorithm?: HashAlgorithm;
    /**
     * Number of digits (default: 6)
     * Google Authenticator supports 6 or 8, RFC also allows 7
     */
    digits?: Digits;
    /**
     * Time step in seconds for TOTP (default: 30)
     */
    period?: number;
    /**
     * Counter value for HOTP
     */
    counter?: number;
};
/**
 * TOTP-specific URI options
 */
type TOTPURIOptions = URIOptions & {
    period?: number;
    counter?: never;
};
/**
 * HOTP-specific URI options
 */
type HOTPURIOptions = URIOptions & {
    period?: never;
    counter?: number;
};
/**
 * Generate an otpauth:// URI
 *
 * @param uri - The URI components
 * @returns The otpauth:// URI string
 *
 * @example
 * ```ts
 * import { generate } from '@otplib/uri';
 * import { base32 } from '@otplib/plugin-base32-scure';
 *
 * const secret = base32.encode(new Uint8Array([1, 2, 3, 4, 5]));
 *
 * const uri = generate({
 *   type: 'totp',
 *   label: 'ACME:john@example.com',
 *   params: {
 *     secret,
 *     issuer: 'ACME',
 *     algorithm: 'sha1',
 *     digits: 6,
 *   },
 * });
 * // Returns: 'otpauth://totp/ACME:john%40example.com?secret=...'
 * ```
 */
declare function generate(uri: OTPAuthURI): string;
/**
 * Generate a TOTP otpauth:// URI with simplified parameters
 *
 * @param options - TOTP URI generation options
 * @returns The otpauth:// URI string
 */
declare function generateTOTP(options: TOTPURIOptions & {
    issuer: string;
    label: string;
}): string;
/**
 * Generate a HOTP otpauth:// URI with simplified parameters
 *
 * @param options - HOTP URI generation options
 * @returns The otpauth:// URI string
 */
declare function generateHOTP(options: HOTPURIOptions & {
    issuer: string;
    label: string;
}): string;

export { type HOTPURIOptions, InvalidParameterError, InvalidURIError, MissingParameterError, type OTPAuthParams, type OTPAuthURI, type OTPType, type TOTPURIOptions, type URIOptions, URIParseError, generate, generateHOTP, generateTOTP, parse, parse as parseURI };
