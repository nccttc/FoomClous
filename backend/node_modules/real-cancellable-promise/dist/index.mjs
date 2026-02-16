/**
 * If canceled, a [[`CancellablePromise`]] should throw an `Cancellation` object.
 */
class Cancellation extends Error {
    constructor(message = 'Promise canceled.') {
        super(message);
    }
}

/** @internal */
const noop = () => { };

/**
 * Determines if an arbitrary value is a thenable with a cancel method.
 */
function isPromiseWithCancel(value) {
    return (
    // typeof null === "object"
    value != null &&
        typeof value === 'object' &&
        typeof value.then === 'function' &&
        typeof value.cancel === 'function');
}
/**
 * A promise with a `cancel` method.
 *
 * If canceled, the `CancellablePromise` will reject with a [[`Cancellation`]]
 * object.
 *
 * @typeParam T what the `CancellablePromise` resolves to
 */
class CancellablePromise {
    /**
     * @param promise a normal promise or thenable
     * @param cancel a function that cancels `promise`. **Calling `cancel` after
     * `promise` has resolved must be a no-op.**
     */
    constructor(promise, cancel) {
        this.promise = Promise.resolve(promise);
        this.cancel = cancel;
    }
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
    then(onFulfilled, onRejected) {
        let fulfill;
        let reject;
        let callbackPromiseWithCancel;
        let canceled = false;
        if (onFulfilled) {
            fulfill = (value) => {
                const nextValue = onFulfilled(value);
                if (isPromiseWithCancel(nextValue)) {
                    callbackPromiseWithCancel = nextValue;
                    if (canceled) {
                        // so we don't throw away the original result, only cancel the resulting promise
                        nextValue.cancel();
                    }
                }
                return nextValue;
            };
        }
        if (onRejected) {
            reject = (reason) => {
                const nextValue = onRejected(reason);
                if (isPromiseWithCancel(nextValue)) {
                    callbackPromiseWithCancel = nextValue;
                    if (canceled) {
                        // so we don't throw away the original error, only cancel the resulting promise
                        nextValue.cancel();
                    }
                }
                return nextValue;
            };
        }
        const newPromise = this.promise.then(fulfill, reject);
        const newCancel = () => {
            this.cancel();
            canceled = true;
            callbackPromiseWithCancel === null || callbackPromiseWithCancel === void 0 ? void 0 : callbackPromiseWithCancel.cancel();
        };
        return new CancellablePromise(newPromise, newCancel);
    }
    /* eslint-disable @typescript-eslint/no-explicit-any -- to match the types used for Promise in the official lib.d.ts */
    /**
     * Analogous to `Promise.catch`.
     */
    catch(onRejected) {
        return this.then(undefined, onRejected);
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
    /**
     * Attaches a callback that is invoked when the Promise is settled
     * (fulfilled or rejected). The resolved value cannot be modified from the
     * callback.
     * @param onFinally The callback to execute when the Promise is settled
     * (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onFinally) {
        return new CancellablePromise(this.promise.finally(onFinally), this.cancel);
    }
    /**
     * This is necessary to make `CancellablePromise` assignable to `Promise`.
     */
    // eslint-disable-next-line class-methods-use-this
    get [Symbol.toStringTag]() {
        return 'CancellablePromise';
    }
    static resolve(value) {
        return new CancellablePromise(Promise.resolve(value), noop);
    }
    /**
     * Analogous to `Promise.reject`.
     *
     * Like `CancellablePromise.resolve`, canceling the returned
     * `CancellablePromise` is a no-op.
     *
     * @param reason this should probably be an `Error` object
     */
    static reject(reason) {
        return new CancellablePromise(Promise.reject(reason), noop);
    }
    /**
     * Analogous to `Promise.all`.
     *
     * @param values an array that may contain `CancellablePromise`s, promises,
     * thenables, and resolved values
     * @returns a [[`CancellablePromise`]], which, if canceled, will cancel each
     * of the promises passed in to `CancellablePromise.all`.
     */
    static all(values) {
        return new CancellablePromise(Promise.all(values), () => {
            for (const value of values) {
                if (isPromiseWithCancel(value))
                    value.cancel();
            }
        });
    }
    static allSettled(values) {
        const cancel = () => {
            for (const value of values) {
                if (isPromiseWithCancel(value)) {
                    value.cancel();
                }
            }
        };
        return new CancellablePromise(Promise.allSettled(values), cancel);
    }
    /**
     * Creates a `CancellablePromise` that is resolved or rejected when any of
     * the provided `Promises` are resolved or rejected.
     * @param values An array of `Promises`.
     * @returns A new `CancellablePromise`. Canceling it cancels all of the input
     * promises.
     */
    static race(values) {
        const cancel = () => {
            for (const value of values) {
                if (isPromiseWithCancel(value)) {
                    value.cancel();
                }
            }
        };
        return new CancellablePromise(Promise.race(values), cancel);
    }
    // Promise.any is an ES2021 feature. Not yet implemented.
    // /**
    //  * The any function returns a `CancellablePromise` that is fulfilled by the
    //  * first given promise to be fulfilled, or rejected with an `AggregateError`
    //  * containing an array of rejection reasons if all of the given promises are
    //  * rejected. It resolves all elements of the passed iterable to promises as
    //  * it runs this algorithm.
    //  * @param values An array or iterable of Promises.
    //  * @returns A new `CancellablePromise`.
    //  */
    // any<T>(values: (T | PromiseLike<T>)[] | Iterable<T | PromiseLike<T>>): CancellablePromise<T> {
    //     return new CancellablePromise(Promise.any(values), cancel))
    // }
    /**
     * @returns a `CancellablePromise` that resolves after `ms` milliseconds.
     */
    static delay(ms) {
        let timer;
        let rejectFn = noop;
        const promise = new Promise((resolve, reject) => {
            timer = setTimeout(() => {
                resolve();
                rejectFn = noop;
            }, ms);
            rejectFn = reject;
        });
        return new CancellablePromise(promise, () => {
            if (timer)
                clearTimeout(timer);
            rejectFn(new Cancellation());
        });
    }
}

/**
 * Takes in a regular `Promise` and returns a `CancellablePromise`. If canceled,
 * the `CancellablePromise` will immediately reject with a `Cancellation`, but the asynchronous
 * operation will not truly be aborted.
 *
 * Analogous to
 * [make-cancellable-promise](https://www.npmjs.com/package/make-cancellable-promise).
 */
function pseudoCancellable(promise) {
    let canceled = false;
    let rejectFn = noop;
    const newPromise = new Promise((resolve, reject) => {
        rejectFn = reject;
        // eslint-disable-next-line promise/catch-or-return -- no catch method on PromiseLike
        promise.then((result) => {
            if (!canceled) {
                resolve(result);
                rejectFn = noop;
            }
            return undefined;
        }, (e) => {
            if (!canceled)
                reject(e);
        });
    });
    function cancel() {
        canceled = true;
        rejectFn(new Cancellation());
    }
    return new CancellablePromise(newPromise, cancel);
}
/**
 * Used to build a single [[`CancellablePromise`]] from a multi-step asynchronous
 * flow.
 *
 * When the overall promise is canceled, each captured promise is canceled. In practice,
 * this means the active asynchronous operation is canceled.
 *
 * ```
 * function query(id: number): CancellablePromise<QueryResult> {
 *     return buildCancellablePromise(async capture => {
 *         const result1 = await capture(api.method1(id))
 *
 *         // do some stuff
 *
 *         const result2 = await capture(api.method2(result1.id))
 *
 *         return { result1, result2 }
 *     })
 * }
 * ```
 *
 * @param innerFunc an async function that takes in a `capture` function and returns
 * a regular `Promise`
 */
function buildCancellablePromise(innerFunc) {
    const capturedPromises = new Set();
    const capture = (promise) => {
        capturedPromises.add(promise);
        promise.finally(() => capturedPromises.delete(promise)).catch(() => { });
        return promise;
    };
    function cancel() {
        capturedPromises.forEach((p) => p.cancel());
    }
    return new CancellablePromise(innerFunc(capture), cancel);
}

export { CancellablePromise, Cancellation, buildCancellablePromise, isPromiseWithCancel, pseudoCancellable };
