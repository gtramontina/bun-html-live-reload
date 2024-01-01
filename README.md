<h1>
    <img src="https://bun.sh/logo.svg" width="30" alt="Bun Logo"> Bun HTML Live Reload
</h1>

## Getting Started

### Install

```sh
bun add -d @gtramontina.com/bun-html-live-reload
```

### Usage

Using the following as a regular Bun server as a starting point:

```ts
// index.ts

Bun.serve({
    fetch: () => {
        return new Response("<div>hello world!</div>", {
            headers: { "Content-Type": "text/html" },
        });
    },
    port: 8888,
});
```

Import `htmlLiveReload` and wrap your server with it:

```ts
// index.ts

import { htmlLiveReload } from "@gtramontina.com/bun-html-live-reload";

Bun.serve(
    htmlLiveReload({
        fetch: () => {
            return new Response("<div>hello world!</div>", {
                headers: { "Content-Type": "text/html" },
            });
        },
        port: 8888,
    }),
);
```

Running the server with [`bun --hot index.ts`](https://bun.sh/docs/runtime/hot#hot-mode) will now force a reload of the current page whenever Bun `--hot` detects a change.
It will also force a reload of the stylesheets when a change to a `text/css` file is detected.
For an example, take a look at the [example](./example) directory and run `bun run:example`.

## Options

### `watchPath`

Bun HTML Live Reload will always force a reload when running it `--hot`.
In order to have a more fine-grained control over the files not detected by Bun's `--hot` mode, the `watchPath` option can be passed to `htmlLiveReload` as such:

```ts
// index.ts

import { htmlLiveReload } from "@gtramontina.com/bun-html-live-reload";

Bun.serve(
    htmlLiveReload(
        { /* server options */ },
        {
            watchPath: path.resolve(import.meta.dir, "src"),
        }
    ),
);
```

### `buildConfig`

If your setup makes use of [`Bun.build()`](https://bun.sh/docs/bundler), you can forward the settings to `htmlLiveReload` via the `buildConfig` option:

```ts
// index.ts

import { htmlLiveReload } from "@gtramontina.com/bun-html-live-reload";

Bun.serve(
    htmlLiveReload(
        { /* server options */ },
        {
            buildConfig: {
                entrypoints: ['./index.tsx'],
                outdir: './build',
            },
        }
    ),
);
```
