# real-cancellable-promise

A simple cancellable promise implementation for JavaScript and TypeScript.

[Read the announcement post for a full explanation.](https://dev.to/srmagura/announcing-real-cancellable-promise-gkd) In particular, see the "Prior art" section for a comparison to existing cancellable promise libraries.

- ⚡ Compatible with [fetch](#fetch), [axios](#axios), and
  [jQuery.ajax](#jQuery)
- 🐦 Lightweight — zero dependencies and less than 1 kB minified and gzipped
- 🏭 Used in production by [Interface
  Technologies](http://www.iticentral.com/)
- 💻 Optimized for TypeScript
- ⚛ Built with React in mind
- 🔎 Compatible with
  [react-query](https://react-query.tanstack.com/guides/query-cancellation)
  query cancellation out of the box

# The Basics

```bash
yarn add real-cancellable-promise
```

```ts
import { CancellablePromise } from 'real-cancellable-promise';

const cancellablePromise = new CancellablePromise(normalPromise, cancel);

cancellablePromise.cancel();

await cancellablePromise; // throws a Cancellation object that subclasses Error
```

### Important

The `CancellablePromise` constructor takes in a `promise` and a `cancel` function.
Your `cancel` function **MUST** cause `promise` to reject with a `Cancellation` object.

This will **NOT** work, your callbacks with still run:

```ts
new CancellablePromise(normalPromise, () => {});
```

# Usage with HTTP Libraries

How do I convert a normal `Promise` to a `CancellablePromise`?

## <a name="fetch" href="https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch">fetch</a>

```ts
export function cancellableFetch(
  input: RequestInfo,
  init: RequestInit = {}
): CancellablePromise<Response> {
  const controller = new AbortController();

  const promise = fetch(input, {
    ...init,
    signal: controller.signal,
  }).catch((e) => {
    if (e.name === 'AbortError') {
      throw new Cancellation();
    }

    // rethrow the original error
    throw e;
  });

  return new CancellablePromise<Response>(promise, () => controller.abort());
}

// Use just like normal fetch:
const cancellablePromise = cancellableFetch(url, {
  /* pass options here */
});
```

<details>
    <summary><code>fetch</code> with response handling</summary>

```ts
export function cancellableFetch<T>(
  input: RequestInfo,
  init: RequestInit = {}
): CancellablePromise<T> {
  const controller = new AbortController();

  const promise = fetch(input, {
    ...init,
    signal: controller.signal,
  })
    .then((response) => {
      // Handle the response object however you want
      if (!response.ok) {
        throw new Error(`Fetch failed with status code ${response.status}.`);
      }

      if (response.headers.get('content-type')?.includes('application/json')) {
        return response.json();
      } else {
        return response.text();
      }
    })
    .catch((e) => {
      if (e.name === 'AbortError') {
        throw new Cancellation();
      }

      // rethrow the original error
      throw e;
    });

  return new CancellablePromise<T>(promise, () => controller.abort());
}
```

</details>

## <a name="axios" href="https://axios-http.com/">axios</a>

```ts
export function cancellableAxios<T>(
  config: AxiosRequestConfig
): CancellablePromise<T> {
  const source = axios.CancelToken.source();
  config = { ...config, cancelToken: source.token };

  const promise = axios(config)
    .then((response) => response.data)
    .catch((e) => {
      if (e instanceof axios.Cancel) {
        throw new Cancellation();
      }

      // rethrow the original error
      throw e;
    });

  return new CancellablePromise<T>(promise, () => source.cancel());
}

// Use just like normal axios:
const cancellablePromise = cancellableAxios({ url });
```

## <a name="jQuery" href="https://api.jquery.com/category/ajax/">jQuery.ajax</a>

```ts
export function cancellableJQueryAjax<T>(
  settings: JQuery.AjaxSettings
): CancellablePromise<T> {
  const xhr = $.ajax(settings);

  const promise = xhr.catch((e) => {
    if (e.statusText === 'abort') throw new Cancellation();

    // rethrow the original error
    throw e;
  });

  return new CancellablePromise<T>(promise, () => xhr.abort());
}

// Use just like normal $.ajax:
const cancellablePromise = cancellableJQueryAjax({ url, dataType: 'json' });
```

[CodeSandbox: HTTP
libraries](https://codesandbox.io/s/real-cancellable-promise-http-libraries-olibp?file=/src/App.tsx)

# [API Reference](https://srmagura.github.io/real-cancellable-promise/modules.html)

`CancellablePromise` supports all the methods that the normal `Promise` object
supports, except `Promise.any` (ES2021). See the [API
Reference](https://srmagura.github.io/real-cancellable-promise/modules.html) for details.

# Examples

## React: Cancel the API call when the component unmounts

If your React component makes an API call, you probably don't care about the result of that API call after the component has unmounted. You can cancel the API in the cleanup function of an effect like this:

```tsx
function listBlogPosts(): CancellablePromise<Post[]> {
  // call the API
}

export function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const cancellablePromise = listBlogPosts()
      .then(setPosts)
      .catch(console.error);

    // The promise will get canceled when the component unmounts
    return cancellablePromise.cancel;
  }, []);

  return (
    <div>
      {posts.map((p) => {
        /* ... */
      })}
    </div>
  );
}
```

Before React 18, this was necessary to prevent the infamous "setState after unmount" warning. This warning was removed from React in React 18 because setting state after the component unmounts is usually not indicative of a real problem.

[CodeSandbox: prevent setState after
unmount](https://codesandbox.io/s/real-cancellable-promise-prevent-setstate-after-unmount-2zqb0?file=/src/App.tsx)

## React: Cancel the in-progress API call when query parameters change

Sometimes API calls have parameters, like a search string entered by the user. If the query parameters change, you should cancel any in-progress API calls.

```tsx
function searchUsers(searchTerm: string): CancellablePromise<User[]> {
  // call the API
}

export function UserList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  // In a real app you should debounce the searchTerm
  useEffect(() => {
    const cancellablePromise = searchUsers(searchTerm)
      .then(setUsers)
      .catch(console.error);

    // The old API call gets canceled whenever searchTerm changes. This prevents
    // setUsers from being called with incorrect results if the API calls complete
    // out of order.
    return cancellablePromise.cancel;
  }, [searchTerm]);

  return (
    <div>
      <SearchInput searchTerm={searchTerm} onChange={setSearchTerm} />
      {users.map((u) => {
        /* ... */
      })}
    </div>
  );
}
```

[CodeSandbox: cancel the in-progress API call when query parameters
change](https://codesandbox.io/s/real-cancellable-promise-changing-query-parameters-g6j4r)

## Combine multiple API calls into a single async flow

The utility function `buildCancellablePromise` lets you `capture` every
cancellable operation in a multi-step process. In this example, if `bigQuery` is
canceled, each of the 3 API calls will be canceled (though some might have
already completed).

```ts
function bigQuery(userId: number): CancellablePromise<QueryResult> {
  return buildCancellablePromise(async (capture) => {
    const userPromise = api.user.get(userId);
    const rolePromise = api.user.listRoles(userId);

    const [user, roles] = await capture(
      CancellablePromise.all([userPromise, rolePromise])
    );

    // User must be loaded before this query can run
    const customer = await capture(api.customer.get(user.customerId));

    return { user, roles, customer };
  });
}
```

## Usage with `react-query`

If your query key changes and there's an API call in progress, `react-query`
will cancel the `CancellablePromise` automatically.

[CodeSandbox: react-query
integration](https://codesandbox.io/s/real-cancellable-promise-react-query-4sxf6?file=/src/App.tsx)

## Handling `Cancellation`

Usually, you'll want to ignore `Cancellation` objects that get thrown:

```ts
try {
  await capture(cancellablePromise);
} catch (e) {
  if (e instanceof Cancellation) {
    // do nothing — the component probably just unmounted.
    // or you could do something here it's up to you 😆
    return;
  }

  // log the error or display it to the user
}
```

## Handling promises that can't truly be canceled

Sometimes you need to call an asynchronous function that doesn't support
cancellation. In this case, you can use `pseudoCancellable`:

```ts
const cancellablePromise = pseudoCancellable(normalPromise);

// Later...
cancellablePromise.cancel();

await cancellablePromise; // throws Cancellation object if promise did not already resolve
```

## `CancellablePromise.delay`

```ts
await CancellablePromise.delay(1000); // wait 1 second
```

# Supported Platforms

**Browser:** anything that's not Internet Explorer.

**React Native / Expo:** should work in any recent release. `AbortController` has been available since 0.60.

**Node.js:** 14+. `AbortController` is only available in Node 15+. Both `require()` (CommonJS) and `import` (ES modules) are supported without use of a transpiler or bundler.

# License

MIT

# Contributing

See `CONTRIBUTING.md`.
