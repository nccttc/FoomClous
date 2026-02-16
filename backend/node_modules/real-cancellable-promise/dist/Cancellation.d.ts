/**
 * If canceled, a [[`CancellablePromise`]] should throw an `Cancellation` object.
 */
export declare class Cancellation extends Error {
    constructor(message?: string);
}
