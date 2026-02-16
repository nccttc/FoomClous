/**
 * Options for OTPError construction
 */
type OTPErrorOptions = {
    /**
     * The underlying error that caused this error.
     * Useful for error chaining and debugging.
     */
    cause?: unknown;
};
/**
 * Base error class for all otplib errors
 *
 * Supports ES2022 error chaining via the `cause` property.
 *
 * @example
 * ```typescript
 * try {
 *   // ... operation that throws
 * } catch (error) {
 *   throw new OTPError('Operation failed', { cause: error });
 * }
 * ```
 */
declare class OTPError extends Error {
    constructor(message: string, options?: OTPErrorOptions);
}
/**
 * Error thrown when secret validation fails
 */
declare class SecretError extends OTPError {
    constructor(message: string);
}
/**
 * Error thrown when secret is too short (< 128 bits)
 */
declare class SecretTooShortError extends SecretError {
    constructor(minBytes: number, actualBytes: number);
}
/**
 * Error thrown when secret is unreasonably large (> 64 bytes)
 */
declare class SecretTooLongError extends SecretError {
    constructor(maxBytes: number, actualBytes: number);
}
/**
 * Error thrown when counter is invalid
 */
declare class CounterError extends OTPError {
    constructor(message: string);
}
/**
 * Error thrown when counter is negative
 */
declare class CounterNegativeError extends CounterError {
    constructor();
}
/**
 * Error thrown when counter exceeds maximum value (2^53 - 1 for safe integer)
 */
declare class CounterOverflowError extends CounterError {
    constructor();
}
/**
 * Error thrown when counter is not an integer
 */
declare class CounterNotIntegerError extends CounterError {
    constructor();
}
/**
 * Error thrown when time is invalid
 */
declare class TimeError extends OTPError {
    constructor(message: string);
}
/**
 * Error thrown when time is negative
 */
declare class TimeNegativeError extends TimeError {
    constructor();
}
/**
 * Error thrown when time is not a finite number
 */
declare class TimeNotFiniteError extends TimeError {
    constructor();
}
/**
 * Error thrown when period is invalid
 */
declare class PeriodError extends OTPError {
    constructor(message: string);
}
/**
 * Error thrown when period is too small
 */
declare class PeriodTooSmallError extends PeriodError {
    constructor(minPeriod: number);
}
/**
 * Error thrown when period is too large
 */
declare class PeriodTooLargeError extends PeriodError {
    constructor(maxPeriod: number);
}
/**
 * Error thrown when digits value is invalid
 */
declare class DigitsError extends OTPError {
    constructor(message: string);
}
/**
 * Error thrown when hash algorithm is invalid
 */
declare class AlgorithmError extends OTPError {
    constructor(message: string);
}
/**
 * Error thrown when token is invalid
 */
declare class TokenError extends OTPError {
    constructor(message: string);
}
/**
 * Error thrown when token has incorrect length
 */
declare class TokenLengthError extends TokenError {
    constructor(expected: number, actual: number);
}
/**
 * Error thrown when token contains non-digit characters
 */
declare class TokenFormatError extends TokenError {
    constructor();
}
/**
 * Error thrown when crypto operation fails
 */
declare class CryptoError extends OTPError {
    constructor(message: string, options?: OTPErrorOptions);
}
/**
 * Error thrown when HMAC computation fails
 *
 * The original error from the crypto plugin is available via `cause`.
 *
 * @example
 * ```typescript
 * try {
 *   await cryptoContext.hmac('sha1', key, data);
 * } catch (error) {
 *   if (error instanceof HMACError) {
 *     console.log('HMAC failed:', error.message);
 *     console.log('Original error:', error.cause);
 *   }
 * }
 * ```
 */
declare class HMACError extends CryptoError {
    constructor(message: string, options?: OTPErrorOptions);
}
/**
 * Error thrown when random byte generation fails
 *
 * The original error from the crypto plugin is available via `cause`.
 */
declare class RandomBytesError extends CryptoError {
    constructor(message: string, options?: OTPErrorOptions);
}
/**
 * Error thrown when Base32 operation fails
 */
declare class Base32Error extends OTPError {
    constructor(message: string, options?: OTPErrorOptions);
}
/**
 * Error thrown when Base32 encoding fails
 *
 * The original error from the Base32 plugin is available via `cause`.
 *
 * @example
 * ```typescript
 * try {
 *   base32Context.encode(data);
 * } catch (error) {
 *   if (error instanceof Base32EncodeError) {
 *     console.log('Encoding failed:', error.message);
 *     console.log('Original error:', error.cause);
 *   }
 * }
 * ```
 */
declare class Base32EncodeError extends Base32Error {
    constructor(message: string, options?: OTPErrorOptions);
}
/**
 * Error thrown when Base32 decoding fails
 *
 * The original error from the Base32 plugin is available via `cause`.
 *
 * @example
 * ```typescript
 * try {
 *   base32Context.decode(invalidString);
 * } catch (error) {
 *   if (error instanceof Base32DecodeError) {
 *     console.log('Decoding failed:', error.message);
 *     console.log('Original error:', error.cause);
 *   }
 * }
 * ```
 */
declare class Base32DecodeError extends Base32Error {
    constructor(message: string, options?: OTPErrorOptions);
}
/**
 * Error thrown when counter tolerance is invalid
 */
declare class CounterToleranceError extends OTPError {
    constructor(message: string);
}
/**
 * Error thrown when counter tolerance is too large
 */
declare class CounterToleranceTooLargeError extends CounterToleranceError {
    constructor(maxWindow: number, totalChecks: number);
}
/**
 * Error thrown when counter tolerance contains negative values
 */
declare class CounterToleranceNegativeError extends CounterToleranceError {
    constructor();
}
/**
 * Error thrown when epoch tolerance is invalid
 */
declare class EpochToleranceError extends OTPError {
    constructor(message: string);
}
/**
 * Error thrown when epoch tolerance contains negative values
 */
declare class EpochToleranceNegativeError extends EpochToleranceError {
    constructor();
}
/**
 * Error thrown when epoch tolerance is too large
 */
declare class EpochToleranceTooLargeError extends EpochToleranceError {
    constructor(maxTolerance: number, actualValue: number);
}
/**
 * Error thrown when a required plugin is missing
 */
declare class PluginError extends OTPError {
    constructor(message: string);
}
/**
 * Error thrown when crypto plugin is not configured
 */
declare class CryptoPluginMissingError extends PluginError {
    constructor();
}
/**
 * Error thrown when Base32 plugin is not configured
 */
declare class Base32PluginMissingError extends PluginError {
    constructor();
}
/**
 * Error thrown when required configuration is missing
 */
declare class ConfigurationError extends OTPError {
    constructor(message: string);
}
/**
 * Error thrown when secret is not configured
 */
declare class SecretMissingError extends ConfigurationError {
    constructor();
}
/**
 * Error thrown when label is not configured (required for URI generation)
 */
declare class LabelMissingError extends ConfigurationError {
    constructor();
}
/**
 * Error thrown when issuer is not configured (required for URI generation)
 */
declare class IssuerMissingError extends ConfigurationError {
    constructor();
}
/**
 * Error thrown when secret must be a Base32 string but is provided as bytes
 */
declare class SecretTypeError extends ConfigurationError {
    constructor();
}
/**
 * Error thrown when afterTimeStep parameter is invalid
 */
declare class AfterTimeStepError extends OTPError {
    constructor(message: string);
}
/**
 * Error thrown when afterTimeStep is negative
 */
declare class AfterTimeStepNegativeError extends AfterTimeStepError {
    constructor();
}
/**
 * Error thrown when afterTimeStep is not an integer
 */
declare class AfterTimeStepNotIntegerError extends AfterTimeStepError {
    constructor();
}
/**
 * Error thrown when afterTimeStep exceeds the verification range
 */
declare class AfterTimeStepRangeExceededError extends AfterTimeStepError {
    constructor();
}

export { AfterTimeStepError, AfterTimeStepNegativeError, AfterTimeStepNotIntegerError, AfterTimeStepRangeExceededError, AlgorithmError, Base32DecodeError, Base32EncodeError, Base32Error, Base32PluginMissingError, ConfigurationError, CounterError, CounterNegativeError, CounterNotIntegerError, CounterOverflowError, CounterToleranceError, CounterToleranceNegativeError, CounterToleranceTooLargeError, CryptoError, CryptoPluginMissingError, DigitsError, EpochToleranceError, EpochToleranceNegativeError, EpochToleranceTooLargeError, HMACError, IssuerMissingError, LabelMissingError, OTPError, type OTPErrorOptions, PeriodError, PeriodTooLargeError, PeriodTooSmallError, PluginError, RandomBytesError, SecretError, SecretMissingError, SecretTooLongError, SecretTooShortError, SecretTypeError, TimeError, TimeNegativeError, TimeNotFiniteError, TokenError, TokenFormatError, TokenLengthError };
