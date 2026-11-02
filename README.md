# cwserver

**A complete, dependency-light web server framework for Node.js — written in TypeScript.**

[![npm version](https://img.shields.io/npm/v/cwserver.svg)](https://www.npmjs.com/package/cwserver)
[![npm downloads](https://img.shields.io/npm/dt/cwserver.svg)](https://www.npmjs.com/package/cwserver)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Types](https://img.shields.io/badge/types-TypeScript-3178c6.svg)](#typescript)

`cwserver` is built on top of Node's native `http` module and gives you, out of the box:
a flexible router, secure sessions, a body/multipart parser, a server-side template engine,
a static-file/MIME handler with HTTP caching, gzip/brotli responses, a resource bundler,
Socket.IO integration, and a project scaffolder — with only two runtime dependencies
(`destroy` and `streamsearch`).

---

## Table of contents

- [Features](#features)
- [Installation](#installation)
- [Quick start](#quick-start)
- [How it fits together](#how-it-fits-together)
- [Routing and controllers](#routing-and-controllers)
- [Context, request and response](#context-request-and-response)
- [Body parsing and file uploads](#body-parsing-and-file-uploads)
- [Sessions](#sessions)
- [Template engine](#template-engine)
- [Bundler](#bundler)
- [Static files, virtual directories and streaming](#static-files-virtual-directories-and-streaming)
- [WebSocket (Socket.IO)](#websocket-socketio)
- [Low-level `App()`](#low-level-app)
- [Configuration (`app.config.json`)](#configuration-appconfigjson)
- [Async API and deprecated callbacks](#async-api-and-deprecated-callbacks)
- [Performance notes](#performance-notes)
- [Public API](#public-api)
- [TypeScript](#typescript)
- [Repository layout](#repository-layout)
- [Development](#development)
- [Test suite](#test-suite)
- [Contributing](#contributing)
- [License](#license)

---

## Features

| Area | What you get |
| --- | --- |
| **Routing** | `get` / `post` / `any` controllers, named params (`/user/:id`), trailing wildcards (`/assets/*`), duplicate-route detection |
| **Views** | Modular route registration with `registerView()` — split your app into as many view modules as you like |
| **Sessions** | Encrypted cookie sessions, role checks, and IP-part binding to help prevent session hijacking |
| **Body parser** | `application/json`, `x-www-form-urlencoded`, `text/plain` and `multipart/form-data` (streaming, with file save/skip/read helpers and a max-buffer limit) |
| **Template engine** | `{% … %}` script blocks, `{= expr =}` output, `#extends` / `#attach` layouts, placeholders, optional in-memory or file caching |
| **Static files** | MIME table, `ETag` / `If-None-Match` / `If-Modified-Since` (304), `Range` streaming, per-extension no-cache list |
| **Compression** | `gzip` and brotli (`br`) for JSON, templates, static files and bundles |
| **Bundler** | Combine many JS/CSS files into one cached response with an encrypted file list in the URL |
| **Virtual directories** | Mount any folder on disk under a URL prefix |
| **Hidden directories** | Block `/lib/`, `/config/`, … from being served |
| **Socket.IO** | Session-aware socket server with owners, groups and lookup by login, hash, role or token |
| **Security helpers** | AES encryption helpers, MD5, URI-safe encryption, default protection headers, HTML escaping |
| **Logging** | Buffered file logger with colored console output |
| **Config validation** | `app.config.json` is validated against the bundled [`schema.json`](schema.json) |
| **Scaffolding** | `createProjectTemplate()` generates a ready-to-run project |

---

## Installation

```bash
npm install cwserver
```

`cwserver` ships its own TypeScript declarations (`dist/index.d.ts`) and a project template
(`dist/project_template`). Socket.IO is **optional** — install `socket.io` yourself only if you
want WebSocket support.

> **Node.js:** the code uses `node:`-prefixed imports, so use a Node.js release that supports
> them (the current LTS is recommended).

---

## Quick start

### 1. Scaffold a project

Create `create-project.js`:

```js
const { createProjectTemplate } = require('cwserver');

createProjectTemplate({
    appRoot: __dirname,       // directory that will contain your site folder
    projectRoot: 'www',       // name of the site folder to create
    // allExample: true,      // also copy the /example and /lib (pgsql, mysql) samples
    // force: true            // delete projectRoot first if it already exists
});
```

```bash
node create-project.js
```

This creates:

```
.
├── server.js            # entry point
├── web.config           # IIS / iisnode configuration
└── www/                 # your site (projectRoot)
    ├── config/app.config.json
    ├── lib/view/main.js # sample view (routes live here)
    ├── template/        # master / header / footer templates
    ├── static/          # css, script
    ├── index.html
    └── web/temp/cache/  # runtime cache (created on first run)
```

### 2. Write the server entry

```js
// server.js
const { initilizeServer, ConsoleColor } = require('cwserver');

// optional: node server www
const wwwName = process.argv[2] || 'www';

const server = initilizeServer(__dirname, wwwName);

server.initAsync().then((app) => {
    process.on('SIGINT', async () => {
        await app.shutdownAsync();
        server.log.dispose();
        process.exit(0);
    });

    app.listen(server.port, () => {
        server.log.write(`
    [+] Server  : http://localhost:${server.port}
    [~] Running...
`, ConsoleColor.FgMagenta);
    });
});
```

> `initilizeServer()` (sic — spelled this way in the API) can be called **once per process**.
> `initAsync()` can also be called only once and resolves with the running `IApplication`.

### 3. Add a view

Views are listed in `config/app.config.json` (`"views": ["$root/$public/lib/view/main.js"]`).
`$root` is your `appRoot`, `$public` is your site folder.

```js
// www/lib/view/main.js
const { registerView } = require('cwserver');

registerView(async (app, controller, server) => {

    // attach the session to every request (needed for ctx.session / ctx.setSession)
    app.prerequisites((req, res, next) => {
        req.session = server.parseSession(req.headers, req.cookies);
        next();
    });

    controller
        .get('/', async (ctx) => {
            ctx.res.render(ctx, server.mapPath('/index.html'));
        })
        .get('/hello/:name', async (ctx, requestParam) => {
            ctx.res.json({ hello: requestParam.query.name });
            ctx.next(200);
        })
        .post('/echo', async (ctx) => {
            const parser = require('cwserver').getBodyParser(ctx.req);
            await parser.parseAsync();
            ctx.res.json(parser.getJson());
            parser.dispose();
        });
});
```

### 4. Run

```bash
node server www
```

---

## How it fits together

```
                     ┌──────────── initilizeServer(appRoot, wwwName) ────────────┐
                     │  reads  <wwwName>/config/app.config.json  (validated)     │
                     └──────────────────────────────┬────────────────────────────┘
                                                    │  initAsync()
                                                    ▼
 HTTP request ─▶ App (server-core)
                   1. prerequisites()  ── global pre-handlers
                   2. use(route, …)    ── raw routes / virtual directories / bundler
                   3. use(handler)     ── final middleware ──▶ Context ──▶ Controller
                                                                          ├─ exact get/post/any
                                                                          ├─ param & wildcard routes
                                                                          ├─ static MIME files
                                                                          ├─ template files (html, jsx…)
                                                                          └─ default document → 404
```

- **`App()`** (`lib/server-core.ts`) is the low-level HTTP application: prerequisites → routes → middlewares, plus the `request-begain`, `response-end`, `error` and `shutdown` events.
- **`CwServer`** (`lib/server.ts`) loads and validates the config, creates the logger, encryption, sessions and per-request `IContext`.
- **`Controller`** (`lib/app-controller.ts`) is the router you use inside views.
- **`registerView()`** (`lib/app-view.ts`) collects view modules; they run once, in `initAsync()`. Registering a view after initialisation throws.

---

## Routing and controllers

Inside a view you receive `(app, controller, server)`.

```js
controller
    .get('/', handler)                  // GET only
    .post('/submit', handler)           // POST only
    .any('/ping', handler)              // any method
    .get('/user/:id/settings', handler) // named parameter
    .get('/files/*', handler);          // trailing wildcard (must be last segment)

// handler signature
async (ctx, requestParam) => { /* … */ }
```

`requestParam` is `{ query: { [param]: string }, match: string[] }`:

| Route | Request | `requestParam` |
| --- | --- | --- |
| `/task/:id/*` | `/task/1/a/b` | `query.id === "1"`, `match` contains `"a"` … |

Rules enforced by the router (and covered by tests):

- Registering the same route twice (even across `get` / `post` / `any`) throws.
- `/*` may only appear at the end of a route; `:param` segments and wildcards can be combined as `/task/:id/*`.
- Exact routes are looked up in a map; param/wildcard routes are matched in order of route length.
- `controller.remove(route)`, `controller.delete(...keep)` and `controller.reset()` manage the route table at runtime.

---

## Context, request and response

Every handler receives an `IContext` — one instance per request.

### `ctx`

| Member | Description |
| --- | --- |
| `ctx.req` / `ctx.res` | Request / response (see below) |
| `ctx.path`, `ctx.extension` | Normalized path and file extension |
| `ctx.session` | The request's `ISession` |
| `ctx.server` | The `ICwServer` instance |
| `ctx.next(code?, transfer?)` | Finish/continue; an error status (e.g. `404`) renders the configured error page |
| `ctx.json(body)` | Send JSON (auto-compressed to the client's best encoding) |
| `ctx.redirect(url, force?)` | `302` redirect (`force` adds no-cache headers) |
| `ctx.transferRequest(path \| code)` | Server-side transfer to another path or error page |
| `ctx.write(chunk)` | Write without ending |
| `ctx.setSession(loginId, roleId, userData)` / `ctx.signOut()` | Create / clear the session (chainable) |
| `ctx.addError(err)` / `ctx.transferError(err)` / `ctx.handleError(err, next)` | Error plumbing |
| `ctx.isDisposed`, `ctx.dispose()` | Lifecycle |

### `ctx.req` (`IRequest extends IncomingMessage`)

`path`, `query`, `cookies`, `ip`, `id`, `session`, `isMobile`, `isLocal`, `get(header)`,
`acceptEncoding()`, `setSocketNoDelay()`.

### `ctx.res` (`IResponse extends ServerResponse`)

| Method | Purpose |
| --- | --- |
| `status(code, headers?)` | Set status; chainable |
| `json(body, compress?, next?)` | JSON response, optional `'gzip'` / `'br'` |
| `send(chunk?)` | Send string / Buffer / number / boolean / object |
| `asHTML(code)` / `asJSON(code)` | Set status + content type, then `.end(…)` yourself |
| `type(ext)` | Set content type from an extension |
| `render(ctx, absPath, status?)` | Render a template / static file. Returns a `Promise<void>` you can `await` |
| `cookie(name, value, options)` | `Set-Cookie` with `sameSite`, `httpOnly`, `secure`, `maxAge`… |
| `redirect(url, force?)`, `noCache()`, `get()`, `set()` | Convenience |
| `compress(data, contentType, 'gzip' \| 'br')` | Explicit compression |
| `sendIfError(err)` | Send a 500 if `err` is an error and return `true` |
| `isAlive` | `false` once the client connection is gone |

---

## Body parsing and file uploads

```js
const { getBodyParser } = require('cwserver');

controller.post('/upload', async (ctx) => {
    const tempDir = server.mapPath('/upload/temp/');
    const saveDir = server.mapPath('/upload/data/');

    const parser = getBodyParser(ctx.req, tempDir);   // tempDir is used for multipart files
    parser.setMaxBuffLength(1024 * 1024 * 20);        // optional limit (> 0)

    try {
        await parser.parseAsync();

        if (parser.isMultipart()) {
            const info = parser.getUploadFileInfo(); // metadata of every posted file
            parser.saveAsSync(saveDir);              // or per file: file.saveAsSync(path)
            ctx.json(info.shift() || {});
        } else {
            ctx.json(parser.getJson());              // json / urlencoded / text
        }
        ctx.next(200);
    } catch (e) {
        ctx.transferError(e);
    } finally {
        parser.dispose();                            // always dispose
    }
});
```

`IBodyParser` highlights:

- Detection: `isAppJson()`, `isUrlEncoded()`, `isMultipart()`, `isRawData()`
- Parsing: `parse(cb)`, `parseAsync()`, `parseSync()` (promise)
- Results: `getJson()`, `getData()` (raw text), `getUploadFileInfo()`
- Files: `getFiles(cb)` (non-blocking), `getFilesSync(cb)`, `getFilesAsync(fn)`, `saveAs(dir, cb, onError)`, `saveAsSync(dir)`
- Control: `skipFile = (file) => boolean` to skip/redirect individual uploads, `setMaxBuffLength(n)`

Posted files (`IPostedFileInfo`) expose `getFileName()`, `read()` / `readSync()`, `saveAsSync(path)`, `changePath(path)` and `dispose()`.

---

## Sessions

Sessions are encrypted cookies. Configure them under `"session"` in the config
(`cookie`, `key`, `maxAge`, `isSecure`).

The session is **not** attached to requests automatically — register one `prerequisites`
handler that parses the cookie (this is exactly what the test views do):

```js
registerView(async (app, controller, server) => {
    app.prerequisites((req, res, next) => {
        req.session = server.parseSession(req.headers, req.cookies);
        next();
    });
    // …routes below
});
```

```js
controller
    .get('/login', async (ctx) => {
        ctx.setSession('alice', 'Admin', { token: 'abc' });   // loginId, roleId, userData
        ctx.res.status(200).send('signed in');
    })
    .get('/me', async (ctx) => {
        if (!ctx.session.isAuthenticated) return ctx.next(401);
        ctx.res.json({ user: ctx.session.loginId, isAdmin: ctx.session.isInRole('Admin') });
    })
    .get('/logout', async (ctx) => {
        ctx.signOut().redirect('/', true);
        ctx.next(302, true);
    });
```

`SessionSecurity` records the first three octets of the client IP in the session and invalidates
the session if it changes (`SessionSecurity.isValidSession(req)`). You can plug in custom
persistence through `server.onClearSession(ctx)`.

---

## Template engine

Files whose extension is in `config.template.ext` (default: `html`, `jsx`) are processed as
templates. Output can be cached in memory or on disk (`template.cache`, `template.cacheType`),
and a changed template file is re-compiled on the next request.

```html
#extends /template/master.html

<impl-placeholder id="body">
    {% const items = ['a', 'b', 'c']; %}
    <ul>
    {% for (const item of items) { %}
        <li>{= item =}</li>
    {% } %}
    </ul>
    Hello, {= ctx.session.isAuthenticated ? ctx.session.loginId : 'guest' =}
</impl-placeholder>
```

| Syntax | Meaning |
| --- | --- |
| `{% … %}` | Run JavaScript |
| `{= expr =}` | Write the value of `expr` (same as `ctx.write(expr)`) |
| `#extends /path` | Use another template as the master; fill its `<placeholder id="…">` with `<impl-placeholder id="…">` |
| `#attach /path` | Inline another template |

Templates run in a sandboxed `vm` context with `ctx` available. A runtime error inside a template
is recorded and answered with `500`.

---

## Bundler

Combine many static files into a single request. Enable it with the `bundler` config block
(default route `/app/api/bundle/`). Build the URL from a template (or anywhere) with
`server.createBundle()`, which encrypts the file list so clients cannot request arbitrary files:

```html
<script src="/app/api/bundle/?g={= ctx.server.createBundle(`
    $root/$public/static/script/test-1.js,
    $root/$public/static/script/test-2.js|__owner__
`) =}&ck=bundle_test&ct=text/javascript&rc=Y"></script>

<link rel="stylesheet" type="text/css" href="/app/api/bundle/?g={= ctx.server.createBundle(`
    $root/$public/static/css/test-1.css,
    $root/$public/static/css/test-2.css|__owner__
`) =}&ck=bundle_test&ct=text/css&rc=Y" />
```

| Query param | Meaning |
| --- | --- |
| `g` | Encrypted file list from `createBundle()` |
| `ck` | Cache key |
| `ct` | Content type (`text/javascript` or `text/css`) |
| `rc` | `Y` to revalidate on each request |

Bundles honour `If-None-Match` / `If-Modified-Since` (304), are gzip-compressed when accepted,
and can be cached on disk (`bundler.fileCache`, `bundler.tempPath`).

---

## Static files, virtual directories and streaming

- Files whose extension is listed in `config.mimeType` are served from your site folder with proper `Content-Type`, `ETag`, `Last-Modified` and compression (`staticFile.*`, `cacheHeader.*`, `noCache`).
- Add or override MIME types with `server.addMimeType('.ext', 'type/subtype')` or `setMimeType` / `getMimeType`.
- Mount extra folders with `server.addVirtualDir(route, absDir, handler?)`. The route cannot contain `:` or `*` and can be registered only once.

```js
registerView(async (app, controller, server) => {
    // serve files straight from disk
    server.addVirtualDir('/downloads', '/srv/files');

    // custom handler: stream media with HTTP Range support
    const { Streamer, HttpMimeHandler } = require('cwserver');
    const mime = new HttpMimeHandler();
    server.addVirtualDir('/media', '/srv/media', (ctx) => {
        const fs = require('fs');
        const file = `/srv/media/${ctx.path}`;
        fs.stat(file, (err, stat) => ctx.handleError(err, () =>
            Streamer.stream(ctx, file, mime.getMimeType(ctx.extension), stat)));
    });
});
```

- `hiddenDirectory` entries (e.g. `/lib/`, `/config/`) always return `404`, as does any request containing `$root` or `$public`.

---

## WebSocket (Socket.IO)

```js
const { registerView, socketInitilizer, wsClient } = require('cwserver');

const client = wsClient();

// events the browser may call; return `{ server: [...names], client: [...] }` when `me` is empty
client.on('getClient', (me, session, wsServer, server) => {
    const handlers = {
        'chat': (data) => {
            wsServer.getClientByExceptToken(me.token)
                    .forEach(c => c.sendMsg('on-chat', data));
        }
    };
    return !me ? { server: Object.keys(handlers), client: [] } : handlers;
});
client.on('connected',    (me, wsServer) => me.sendMsg('on-connected', { token: me.token }));
client.on('disConnected', (me, wsServer) => { /* cleanup */ });
// optional: veto a connection
client.on('beforeInitiateConnection', (session, socket) => session.isAuthenticated);

registerView(async (app, controller, server) => {
    const ws = socketInitilizer(server, client);
    ws.create(require('socket.io'), app.httpServer);   // set "socketPath" in the config
});
```

`ICwSocketServer` offers `clients`, `isActiveSocket`, `exists`, `findByHash|Login|RoleId|Token`,
`getClientByExceptHash|Login|Token`, `getOwners(group?)`, `getSocket`, `removeSocket` and `sendMsg`.
See [`test/socket-client.ts`](test/socket-client.ts) for a complete example.

---

## Low-level `App()`

You can use the HTTP core on its own, without config files or controllers:

```js
const { App } = require('cwserver');

const app = App();

app
    .prerequisites((req, res, next) => {      // runs first, for every request
        console.log(req.method, req.path);
        next();
    })
    .use('/ping', (req, res, next) => {       // exact route (no ':' allowed here)
        res.status(200).type('text').send('pong');
    })
    .use('/static/*', handler, true)          // `true` = virtual (prefix) route
    .use((req, res, next) => next())          // final middleware
    .on('error', (req, res, err) => {
        if (res.isAlive) res.status(500).send(String(err));
    })
    .listen(3000, () => console.log('http://localhost:3000'));

// later
await app.shutdownAsync();                    // or app.shutdown(cb)
```

| Method / event | Description |
| --- | --- |
| `prerequisites(fn)` | Handlers executed before routing |
| `use(fn)` | Global (post-route) middleware |
| `use(route, fn, isVirtual?)` | Route handler; `*` wildcard allowed at the end |
| `on('request-begain' \| 'response-end' \| 'error' \| 'shutdown', fn)` | Lifecycle events |
| `listen(handle, cb?)` | Start (throws if already running) |
| `shutdown(cb)` / `shutdownAsync()` | Destroy open sockets and close |
| `clearHandler()` | Remove all handlers |
| `httpServer`, `isRunning`, `version` | Inspection |

Unmatched requests emit `error` with `"No route matched"`. Every response carries
`server: FSys Frontend` and `x-app-version` headers.

---

## Configuration (`app.config.json`)

Lives in `<site>/config/` and is validated against [`schema.json`](schema.json) — add
`"$schema": "../../node_modules/cwserver/schema.json"` for editor IntelliSense.
Use the `APP_CONFIG_NAME` environment variable to load a different file name.

```jsonc
{
  "$schema": "../../node_modules/cwserver/schema.json",
  "appName": "my-app",
  "version": "0.0.1",
  "isDebug": true,
  "encryptionKey": "change-me",         // required
  "socketPath": "",
  "template":   { "cache": true, "cacheType": "FILE", "ext": ["html", "jsx"] },
  "staticFile": { "fileCache": true, "compression": true, "minCompressionSize": 0, "tempPath": "/web/temp/cache/" },
  "cacheHeader":{ "maxAge": "7d", "serverRevalidate": true },
  "session":    { "cookie": "_session", "maxAge": "1d", "key": "change-me-too", "isSecure": false },
  "mimeType":   ["css", "js", "png", "gif", "ico", "map", "mp4", "pdf", "htm"],
  "defaultExt": ".html",
  "defaultDoc": ["index", "default"],
  "bundler":    { "enable": true, "fileCache": true, "route": "/app/api/bundle/", "compress": true, "tempPath": "/web/temp/", "reValidate": true },
  "views":      ["$root/$public/lib/view/main.js"],
  "hiddenDirectory": ["/lib/", "/config/", "/template/", "/web/"],
  "liveStream": [],
  "noCache":    [],
  "hostInfo":   { "origin": [], "root": "www", "hostName": "", "frameAncestors": "", "tls": false, "cert": {}, "port": 8080 },
  "database":   []
}
```

| Key | Description |
| --- | --- |
| `encryptionKey` | **Required.** Key for `server.encryption` and bundle URLs |
| `isDebug` | Request/response logging to the console |
| `views` | View modules to load. Supports `$root` (app root) and `$public` (site folder) |
| `mimeType` | Extensions served as static files |
| `defaultDoc` + `defaultExt` | Document served for directory requests (e.g. `/` → `index.html`); `defaultExt: ""` disables extension-less URLs |
| `template` | Template extensions and caching |
| `staticFile` | Compression, minimum size, server file cache and temp path |
| `cacheHeader.maxAge` | Browser cache lifetime, `<n>M` minutes, `H` hours, `D` days, `MM` months |
| `session` | Cookie name, key, lifetime, `Secure` flag |
| `bundler` | See [Bundler](#bundler) |
| `hiddenDirectory` | URL prefixes that always return `404` |
| `liveStream` | Extensions that your views stream themselves |
| `noCache` | Extensions served with no-cache headers |
| `hostInfo.port` | Listening port (`PORT` is used under iisnode) |
| `database` | Optional DB modules (`module`, `path`, `dbConn`) loaded into `server.db` — see `dist/project_template/lib/pgsql.js` / `mysql.js` |
| `errorPage` | Map of status code → custom error page |

Environment variables: `APP_CONFIG_NAME`, `IISNODE_VERSION` / `PORT`, `APP_POOL_ID`,
`DEFAULT_CONTENT_COMPRESSION` (`gzip` by default).

---

## Async API and deprecated callbacks

Everything that does I/O has a promise-based form; use these in new code. The old callback forms still work
(they are thin wrappers) but are marked `@deprecated`.

| Use | Instead of (deprecated) |
| --- | --- |
| `await parser.parseAsync()` | `parser.parse(cb)` |
| `await file.readAsync()` / `await file.saveAsAsync(path)` | `file.read(cb)` / `file.saveAs(path, cb)` |
| `await parser.saveAsAsync(dir)` | `parser.saveAs(dir, cb, onError)` |
| `fsw.statAsync`, `fsw.isExistsAsync`, `fsw.readJsonAsync`, `fsw.moveFileAsync`, `fsw.compareFileAsync` | `fsw.stat`, `fsw.isExists`, `fsw.readJson`, `fsw.moveFile`, `fsw.compareFile` |
| `fsw.mkdirAsyncx`, `fsw.rmdirAsync`, `fsw.copyFileAsync`, `fsw.copyDirAsync`, `fsw.unlinkAsync` | `fsw.mkdir`, `fsw.rmdir`, `fsw.copyFile`, `fsw.copyDir`, `fsw.unlink` |
| `await fileInfo.statAsync(path)` / `existsAsync(path)` | `fileInfo.stat(path, cb)` / `exists(path, cb)` |
| `await ctx.res.render(ctx, path)` | (was `void`) |

The callback style `errHandler` argument of the `fsw` wrappers is now optional.

---

## Performance notes

Measured with `autocannon` (64 connections, 2 vCPU container, production config `isDebug: false`),
before → after this release:

| Scenario | Before | After |
| --- | ---: | ---: |
| Template page (`#extends`, `{= =}`) | ~530 req/s | ~8 000 req/s |
| Error page (404) | ~530 req/s | ~8 500 req/s |
| Static file, no gzip | ~2 900 req/s | ~9 000 req/s |
| JSON response, gzip | ~8 300 req/s | ~15 000 req/s |
| `POST` JSON + body parser | ~4 700 req/s | ~8 000 req/s |

What changed:

- **Templates are compiled once.** A cached script template used to be recompiled in a new `vm` context on every request; the compiled function is now kept in memory (`useFullOptimization`) and reused. In `template.cacheType = "FILE"` mode with `useFullOptimization: false` the `.cach` file is now actually picked up instead of being rewritten on every request.
- **Small static files are served from memory** when `useFullOptimization` is on (≤ 512 KiB each, at most 512 files), like the gzip cache already was.
- **On-the-fly compression is cheaper.** Per-request gzip streams use the default level instead of level 9, and dynamic brotli uses quality 4 instead of 11 (override with `DEFAULT_BROTLI_QUALITY`, 0-11). Pre-compressed cache files are still written with maximum compression.
- **`Util.UUID()`** (one per request) uses `crypto.randomUUID()`.
- **The "file not found" stat cache is bounded** (1 024 entries); random 404 URLs can no longer grow it forever.
- **Fix:** compressed JSON responses keep the status code you set (`res.status(404).json(data, 'gzip')` used to be sent as `200`).

---

## Public API

Everything below is exported from the package root (`require('cwserver')` / `import … from 'cwserver'`).

| Export | Kind | Purpose |
| --- | --- | --- |
| `initilizeServer(appRoot, wwwName?)` | function | Load config and create the server (`IAppUtility`) |
| `registerView(fn)` | function | Register a view module |
| `App(useRequestBegain?)` | function | Low-level HTTP application |
| `createProjectTemplate(opts)` | function | Scaffold a new project |
| `getBodyParser(req, tempDir?)` | function | Body / multipart parser |
| `socketInitilizer`, `wsClient` | function | Socket.IO integration |
| `Session`, `SessionSecurity` | class | Session model and IP binding |
| `Encryption`, `ServerEncryption` | class | AES, hex, URI, MD5 helpers |
| `HttpCache`, `HttpMimeHandler`, `Streamer` | class | Caching headers, static rendering, range streaming |
| `FileInfoCacheHandler`, `FileDescription` | class | File existence/stat cache |
| `Util` | class | `guid`, `UUID`, `extend`, `clone`, `isPlainObject`, `sendResponseAsync`, … |
| `fsw` | namespace | Async/sync file-system helpers (`mkdirSync`, `copyDirSync`, `readJsonSync`, …) |
| `Logger`, `ShadowLogger`, `ConsoleColor`, `LogTime` | class | Logging |
| `parseCookie`, `getMimeType`, `setMimeType`, `defaultHeaders` | function / const | Helpers |
| `readAppVersion`, `appVersion` | function / const | Package version |
| `IContext`, `IRequest`, `IResponse`, `IApplication`, `IController`, `ICwServer`, `ISession`, `IBodyParser`, `IPostedFileInfo`, … | types | TypeScript types |

---

## TypeScript

```ts
import { registerView, type IApplication, type IController, type ICwServer, type IContext } from 'cwserver';

registerView(async (app: IApplication, controller: IController, server: ICwServer) => {
    controller.get('/health', async (ctx: IContext) => {
        ctx.res.json({ ok: true });
        ctx.next(200);
    });
});
```

---

## Repository layout

```
cwserver/
├── index.ts              # public exports
├── lib/                  # framework source (TypeScript)
├── test/                 # mocha test suite
├── dist/                 # compiled output + project_template
│   └── project_template/ # files copied by createProjectTemplate()
├── schema.json           # JSON schema for app.config.json
├── mime-types.json       # MIME table
└── clean.js              # build helper (cleans dist before tsc)
```

### `lib/` at a glance

| File | Responsibility |
| --- | --- |
| `server-core.ts` | `App()` — HTTP pipeline, events, shutdown |
| `server.ts` | `initilizeServer`, `CwServer`, config model, sessions, virtual dirs, error pages |
| `app-controller.ts`, `app-router.ts` | Controller route tables and route matching |
| `app-view.ts` | `registerView` |
| `context.ts` | Per-request `IContext` and context manager |
| `request.ts`, `response.ts` | Extended `IncomingMessage` / `ServerResponse` (`inject.ts` patches the prototypes) |
| `body-parser.ts`, `multipart-data-reader.ts`, `dicer.ts`, `posted-file-info.ts`, `data-Parser.ts` | Body and multipart parsing |
| `session.ts`, `encryption.ts` | Sessions and crypto |
| `app-template.ts`, `app-template-ctx.ts` | Template engine |
| `app-bundler.ts` | Resource bundler |
| `http-mime.ts`, `http-mime-types.ts`, `http-cache.ts`, `http-status*.ts`, `default-headers.ts`, `web-streamer.ts`, `file-info.ts` | Static files, caching and HTTP helpers |
| `ws.ts` | Socket.IO integration |
| `logger.ts`, `fsw.ts`, `help.ts`, `app-util.ts`, `app-static.ts`, `app-global.ts` | Logging, file system and shared utilities |
| `schema-validator.ts` | Config validation |
| `project-template.ts` | Project scaffolder |
| `db-type.ts` | Database module types (`IoResult`, `QResult`, `QueryResult`) |

---

## Development

```bash
git clone https://github.com/fsystech/cwserver.git
cd cwserver
npm install

npm run build        # clean dist + tsc
npm run lint         # tslint
npm run test:mocha   # run tests (ts-node)
npm run test:cov     # tests with nyc coverage (text + html)
```

---

## Test suite

Tests live in [`test/`](test) and run with **mocha + ts-node**, using `expect` for assertions,
`superagent` for HTTP calls and `socket.io-client` for sockets.

| File | Role |
| --- | --- |
| `test/env.ts` | Sets `NODE_ENV=test`, `TASK_TYPE=TEST`, `SCRIPT=TS` before the suite starts |
| `test/module.spec.ts` | The main end-to-end suite — creates a project template, boots a real server and exercises it over HTTP |
| `test/test-view.ts` | The views registered during the test run (upload, cookie, session, response, error and context endpoints) plus `shouldBeError` / `shouldNotError` helpers |
| `test/socket-client.ts` | Socket.IO server-side client definitions (valid and deliberately invalid) |

`module.spec.ts` groups its tests as:

`default-project-template` · `core` (initialisation errors, listen/shutdown) · `router` · `view` ·
`session` · `get` · `template-engine` · `bundler` · `bundler-error` · `post` ·
`multipart-body-parser` · `gzip-response` (gzip, brotli, streaming) · `mime-type` · `virtual-dir` ·
`socket-io-implementation` · `echo` · `web-stream` · `error` · `controller-reset` · `utility`
(session, config, logger) · `schema-validator` · `fsw` · `finalization`

---

## Contributing

Issues and pull requests are welcome at <https://github.com/fsystech/cwserver/issues>.
Please run `npm run lint` and `npm run test:mocha` before opening a pull request.

---

## License

[MIT](LICENSE) © FSys Tech Ltd.

Maintained by [FSys Tech Ltd.](https://github.com/fsystech)
