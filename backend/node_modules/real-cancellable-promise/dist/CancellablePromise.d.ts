/**
 * The most abstract thing we can cancel — a thenable with a cancel method.
 */
export type PromiseWithCancel<T> = PromiseLike<T> & {
    cancel(): void;
};
/**
 * Determines if an arbitrary value is a thenable with a cancel method.
 */
export declare function isPromiseWithCancel<T>(value: unknown): value is PromiseWithCancel<T>;
/**
 * A promise with a `cancel` method.
 *
 * If canceled, the `CancellablePromise` will reject with a [[`Cancellation`]]
 * object.
 *
 * @typeParam T what the `CancellablePromise` resolves to
 */
export declare class CancellablePromise<T> {
    /**
     * As a consumer of the library, you shouldn't ever need to access
     * `CancellablePromise.promise` directly.
     *
     * If you are subclassing `CancellablePromise` for some reason, you
     * can access this property.
     */
    protected readonly promise: Promise<T>;
    /**
     * Cancel the `CancellablePromise`.
     */
    readonly cancel: (reason?: string) => void;
    /**
     * @param promise a normal promise or thenable
     * @param cancel a function that cancels `promise`. **Calling `cancel` after
     * `promise` has resolved must be a no-op.**
     */
    constructor(promise: PromiseLike<T>, cancel: (reason?: string) => void);
    /**
     * Analogous to `Promise.then`.
     *
     * `onFulfilled` on `onRejected` can return a value, a normal promise, or a
     * `CancellablePromise`. So you can make a chain a `CancellablePromise`s
     * like this:
     *
     * ```
     * const overallPromise = cancellableAsyncFunction1()
     *     .then(cancellableAsyncFunction2)
     *     .then(cancellableAsyncFunction3)
     *     .then(cancellableAsyncFunction4)
     * ```
     *
     * Then if you call `overallPromise.cancel`, `cancel` is called on all
     * `CancellablePromise`s in the chain! In practice, this means that
     * whichever async operation is in progress will be canceled.
     *
     * @returns a new CancellablePromise
     */
    then<TResult1 = T, TResult2 = never>(onFulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): CancellablePromise<TResult1 | TResult2>;
    /**
     * Analogous to `Promise.catch`.
     */
    catch<TResult = never>(onRejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): CancellablePromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled
     * (fulfilled or rejected). The resolved value cannot be modified from the
     * callback.
     * @param onFinally The callback to execute when the Promise is settled
     * (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onFinally?: (() => void) | undefined | null): CancellablePromise<T>;
    /**
     * This is necessary to make `CancellablePromise` assignable to `Promise`.
     */
    get [Symbol.toStringTag](): string;
    /**
     * Analogous to `Promise.resolve`.
     *
     * The returned promise should resolve even if it is canceled. The idea is
     * that the promise is resolved instantaneously, so by the time the promise
     * is canceled, it has already resolved.
     */
    static resolve(): CancellablePromise<void>;
    static resolve<T>(value: T): CancellablePromise<T>;
    /**
     * Analogous to `Promise.reject`.
     *
     * Like `CancellablePromise.resolve`, canceling the returned
     * `CancellablePromise` is a no-op.
     *
     * @param reason this should probably be an `Error` object
     */
    static reject<T>(reason?: unknown): CancellablePromise<T>;
    /**
     * Analogous to `Promise.all`.
     *
     * @param values an array that may contain `CancellablePromise`s, promises,
     * thenables, and resolved values
     * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each
     * of the promises passed in to `CancellablePromise.all`.
     */
    static all<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(values: readonly [
        T1 | PromiseLike<T1>,
        T2 | PromiseLike<T2>,
        T3 | PromiseLike<T3>,
        T4 | PromiseLike<T4>,
        T5 | PromiseLike<T5>,
        T6 | PromiseLike<T6>,
        T7 | PromiseLike<T7>,
        T8 | PromiseLike<T8>,
        T9 | PromiseLike<T9>,
        T10 | PromiseLike<T10>
    ]): CancellablePromise<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;
    /**
     * Analogous to `Promise.all`.
     *
     * @param values an array that may contain `CancellablePromise`s, promises,
     * thenables, and resolved values
     * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each
     * of the promises passed in to `CancellablePromise.all`.
     */
    static all<T1, T2, T3, T4, T5, T6, T7, T8, T9>(values: readonly [
        T1 | PromiseLike<T1>,
        T2 | PromiseLike<T2>,
        T3 | PromiseLike<T3>,
        T4 | PromiseLike<T4>,
        T5 | PromiseLike<T5>,
        T6 | PromiseLike<T6>,
        T7 | PromiseLike<T7>,
        T8 | PromiseLike<T8>,
        T9 | PromiseLike<T9>
    ]): CancellablePromise<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;
    /**
     * Analogous to `Promise.all`.
     *
     * @param values an array that may contain `CancellablePromise`s, promises,
     * thenables, and resolved values
     * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each
     * of the promises passed in to `CancellablePromise.all`.
     */
    static all<T1, T2, T3, T4, T5, T6, T7, T8>(values: readonly [
        T1 | PromiseLike<T1>,
        T2 | PromiseLike<T2>,
        T3 | PromiseLike<T3>,
        T4 | PromiseLike<T4>,
        T5 | PromiseLike<T5>,
        T6 | PromiseLike<T6>,
        T7 | PromiseLike<T7>,
        T8 | PromiseLike<T8>
    ]): CancellablePromise<[T1, T2, T3, T4, T5, T6, T7, T8]>;
    /**
     * Analogous to `Promise.all`.
     *
     * @param values an array that may contain `CancellablePromise`s, promises,
     * thenables, and resolved values
     * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each
     * of the promises passed in to `CancellablePromise.all`.
     */
    static all<T1, T2, T3, T4, T5, T6, T7>(values: readonly [
        T1 | PromiseLike<T1>,
        T2 | PromiseLike<T2>,
        T3 | PromiseLike<T3>,
        T4 | PromiseLike<T4>,
        T5 | PromiseLike<T5>,
        T6 | PromiseLike<T6>,
        T7 | PromiseLike<T7>
    ]): CancellablePromise<[T1, T2, T3, T4, T5, T6, T7]>;
    /**
     * Analogous to `Promise.all`.
     *
     * @param values an array that may contain `CancellablePromise`s, promises,
     * thenables, and resolved values
     * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each
     * of the promises passed in to `CancellablePromise.all`.
     */
    static all<T1, T2, T3, T4, T5, T6>(values: readonly [
        T1 | PromiseLike<T1>,
        T2 | PromiseLike<T2>,
        T3 | PromiseLike<T3>,
        T4 | PromiseLike<T4>,
        T5 | PromiseLike<T5>,
        T6 | PromiseLike<T6>
    ]): CancellablePromise<[T1, T2, T3, T4, T5, T6]>;
    /**
     * Analogous to `Promise.all`.
     *
     * @param values an array that may contain `CancellablePromise`s, promises,
     * thenables, and resolved values
     * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each
     * of the promises passed in to `CancellablePromise.all`.
     */
    static all<T1, T2, T3, T4, T5>(values: readonly [
        T1 | PromiseLike<T1>,
        T2 | PromiseLike<T2>,
        T3 | PromiseLike<T3>,
        T4 | PromiseLike<T4>,
        T5 | PromiseLike<T5>
    ]): CancellablePromise<[T1, T2, T3, T4, T5]>;
    /**
     * Analogous to `Promise.all`.
     *
     * @param values an array that may contain `CancellablePromise`s, promises,
     * thenables, and resolved values
     * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each
     * of the promises passed in to `CancellablePromise.all`.
     */
    static all<T1, T2, T3, T4>(values: readonly [
        T1 | PromiseLike<T1>,
        T2 | PromiseLike<T2>,
        T3 | PromiseLike<T3>,
        T4 | PromiseLike<T4>
    ]): CancellablePromise<[T1, T2, T3, T4]>;
    /**
     * Analogous to `Promise.all`.
     *
     * @param values an array that may contain `CancellablePromise`s, promises,
     * thenables, and resolved values
     * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each
     * of the promises passed in to `CancellablePromise.all`.
     */
    static all<T1, T2, T3>(values: readonly [
        T1 | PromiseLike<T1>,
        T2 | PromiseLike<T2>,
        T3 | PromiseLike<T3>
    ]): CancellablePromise<[T1, T2, T3]>;
    /**
     * Analogous to `Promise.all`.
     *
     * @param values an array that may contain `CancellablePromise`s, promises,
     * thenables, and resolved values
     * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each
     * of the promises passed in to `CancellablePromise.all`.
     */
    static all<T1, T2>(values: readonly [T1 | PromiseLike<T1>, T2 | PromiseLike<T2>]): CancellablePromise<[T1, T2]>;
    /**
     * Analogous to `Promise.all`.
     *
     * @param values an array that may contain `CancellablePromise`s, promises,
     * thenables, and resolved values
     * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each
     * of the promises passed in to `CancellablePromise.all`.
     */
    static all<T>(values: readonly (T | PromiseLike<T>)[]): CancellablePromise<T[]>;
    /**
     * Creates a `CancellablePromise` that is resolved with an array of results
     * when all of the provided `Promises` resolve or reject.
     * @param values An array of `Promises`.
     * @returns A new `CancellablePromise`.
     */
    static allSettled<T extends readonly unknown[] | readonly [unknown]>(values: T): CancellablePromise<{
        -readonly [P in keyof T]: PromiseSettledResult<T[P] extends PromiseLike<infer U> ? U : T[P]>;
    }>;
    /**
     * Creates a `CancellablePromise` that is resolved with an array of results
     * when all of the provided `Promise`s resolve or reject.
     *
     * @param values An array of `Promise`s.
     * @returns A new `CancellablePromise`. Canceling it cancels all of the input
     * promises.
     */
    static allSettled<T>(values: Iterable<T>): CancellablePromise<PromiseSettledResult<T extends PromiseLike<infer U> ? U : T>[]>;
    /**
     * Creates a `CancellablePromise` that is resolved or rejected when any of
     * the provided `Promises` are resolved or rejected.
     * @param values An array of `Promises`.
     * @returns A new `CancellablePromise`. Canceling it cancels all of the input
     * promises.
     */
    static race<T extends readonly unknown[] | []>(values: T): CancellablePromise<Awaited<T[number]>>;
    /**
     * @returns a `CancellablePromise` that resolves after `ms` milliseconds.
     */
    static delay(ms: number): CancellablePromise<void>;
}
