"use strict";
// Copyright (c) 2022 FSys Tech Ltd.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.readAppVersion = exports.appVersion = void 0;
exports.App = App;
// 2:40 PM 5/7/2020
// by rajib chy
require("./app-global");
const node_path_1 = require("node:path");
const node_http_1 = require("node:http");
const node_events_1 = require("node:events");
const app_router_1 = require("./app-router");
const app_util_1 = require("./app-util");
const fs_1 = require("fs");
const inject_1 = require("./inject");
_a = (() => {
    let _appVersion = '4.1.1';
    const _readAppVersion = () => {
        const libRoot = (0, app_util_1.getAppDir)();
        const absPath = (0, node_path_1.resolve)(`${libRoot}/package.json`);
        (0, app_util_1.assert)((0, fs_1.existsSync)(absPath), `No package.json found in ${libRoot}\nplease re-install cwserver`);
        const data = (0, fs_1.readFileSync)(absPath, "utf-8");
        _appVersion = app_util_1.Util.JSON.parse(data).version;
        return _appVersion;
    };
    return {
        get appVersion() {
            return _appVersion;
        },
        get readAppVersion() {
            return _readAppVersion;
        }
    };
})(), exports.appVersion = _a.appVersion, exports.readAppVersion = _a.readAppVersion;
class Application extends node_events_1.EventEmitter {
    get version() {
        return exports.appVersion;
    }
    get httpServer() {
        return this._httpServer;
    }
    get isRunning() {
        return this._isRunning;
    }
    constructor(useRequestBegain = true) {
        super();
        this._onNewRequest = this._onNewRequest.bind(this);
        this._useRequestBegain = useRequestBegain;
        this._httpServer = _createServer(this._onNewRequest);
        this._routes = [];
        this._middlewares = [];
        this._prerequisites = [];
        this._isRunning = false;
        this._connectionMap = new Map();
        this._connectionKey = 0;
    }
    clearHandler() {
        if (this._routes.length > 0) {
            this._routes.length = 0;
        }
        if (this._middlewares.length > 0) {
            this._middlewares.length = 0;
        }
        if (this._prerequisites.length > 0) {
            this._prerequisites.length = 0;
        }
    }
    /**
     * Gracefully shuts down the HTTP server.
     *
     * This method:
     * 1. Rejects immediately if the server is not running.
     * 2. Stops accepting new connections.
     * 3. Destroys all active sockets to prevent shutdown hang.
     * 4. Resolves once the server emits the 'close' event.
     *
     * @returns {Promise<void>} Resolves when the server has fully shut down.
     */
    _shutdown() {
        return new Promise((resolve, reject) => {
            if (!this._isRunning) {
                // Server already stopped
                return setImmediate(() => reject(new Error('Server not running.')));
            }
            this._isRunning = false;
            // Destroy all active sockets first to prevent shutdown hang
            this._destroyActiveSocket();
            // Listen for server close event
            this._httpServer.once('close', resolve);
            // Stop the server
            this._httpServer.close(err => {
                if (err) {
                    reject(err);
                }
            });
            return void 0;
        });
    }
    /**
     * Destroys all active sockets tracked in `_connectionMap`.
     * This prevents shutdown from hanging due to lingering open connections.
     */
    _destroyActiveSocket() {
        for (const socket of this._connectionMap.values()) {
            socket.destroy();
        }
        this._connectionMap.clear();
    }
    shutdown(next) {
        this.emit('shutdown');
        this._shutdown()
            .then(() => next())
            .catch((err) => next(err));
    }
    shutdownAsync() {
        this.emit('shutdown');
        return this._shutdown();
    }
    /**
     * Executes a list of handler layers sequentially (middleware / prerequisites / routes).
     *
     * This is the core request pipeline runner. It iterates through the provided handler list
     * and invokes each handler in order until:
     *  - a handler completes and calls `next()`
     *  - an error is passed into `next(err)`
     *  - the route handler is matched and executed (when `isMiddleware` is false)
     *  - the handler chain is exhausted
     *
     * Routing behavior:
     * - If `isMiddleware === true`, route resolution is skipped and handlers are executed normally.
     * - If `isMiddleware === false`, the first matching route layer is resolved via `getRouteInfo()`
     *   and executed once. After a route is executed, subsequent layers are skipped unless `next()`
     *   continues the chain.
     *
     * Error handling:
     * - If a handler throws synchronously, the error is emitted through `this.emit("error", ...)`.
     * - If a handler passes an Error into `next(err)`, it is also emitted through `this.emit("error", ...)`.
     *
     * @param req
     * Incoming request object.
     *
     * @param res
     * Outgoing response object.
     *
     * @param handlers
     * Handler layer list to execute.
     *
     * @param next
     * Callback invoked when the chain finishes or no handler matches.
     *
     * @param isMiddleware
     * When `true`, treats all handlers as prerequisites/middlewares and skips route matching logic.
     * When `false`, enables route resolution and executes the matched route handler.
     *
     * @returns
     * This method does not return a meaningful value. It drives the request pipeline execution.
     */
    _handleRequest(req, res, handlers, next, isMiddleware = true) {
        var _a;
        const len = handlers.length;
        if (len === 0)
            return next();
        let idx = 0;
        // Resolve route only once (if not prerequisite mode)
        const routeInfo = (!isMiddleware)
            ? (0, app_router_1.getRouteInfo)(req.path, handlers, 'ANY')
            : undefined;
        if ((_a = routeInfo === null || routeInfo === void 0 ? void 0 : routeInfo.layer) === null || _a === void 0 ? void 0 : _a.routeMatcher) {
            req.path = routeInfo.layer.routeMatcher.replace(req.path);
        }
        const _next = (err) => {
            if (err instanceof Error) {
                this.emit("error", req, res, err);
                return;
            }
            while (idx < len) {
                const layer = handlers[idx++];
                if (!layer)
                    break;
                // middleware mode = ignore routing logic
                if (!layer.route || isMiddleware === true) {
                    try {
                        return layer.handler(req, res, _next);
                    }
                    catch (e) {
                        this.emit("error", req, res, e);
                        return;
                    }
                }
                // if routed layer exists, execute it only once
                if (routeInfo && layer === routeInfo.layer) {
                    try {
                        return routeInfo.layer.handler(req, res, _next);
                    }
                    catch (e) {
                        this.emit("error", req, res, e);
                        return;
                    }
                }
            }
            return next();
        };
        return _next();
    }
    /**
     * Handles an incoming request by processing prerequisites, routes, and middlewares in order.
     *
     * Emits the 'error' event if:
     * 1. Any prerequisite, route, or middleware throws an error.
     * 2. No route matches the request.
     *
     * @param {IRequest} req - The incoming request object.
     * @param {IResponse} res - The response object associated with the request.
     */
    _handleNewRequest(req, res) {
        /**
         * Emits an error for the current request/response.
         *
         * @param {Error} [err] - Optional error to emit. If undefined, a default "No route matched" error is emitted.
         */
        const onError = (err) => {
            if (err) {
                this.emit("error", req, res, err);
                return;
            }
            // no handler matched
            this.emit("error", req, res, new Error("No route matched"));
        };
        // Execute prerequisites first
        this._handleRequest(req, res, this._prerequisites, (err) => {
            if (err)
                return onError(err);
            // Execute route handlers next
            this._handleRequest(req, res, this._routes, (err2) => {
                if (err2)
                    return onError(err2);
                // Execute middlewares last
                this._handleRequest(req, res, this._middlewares, (err3) => {
                    return onError(err3);
                });
            }, false); // 'false' indicates this is not a middleware
        });
    }
    prerequisites(handler) {
        if (typeof (handler) !== 'function') {
            throw new Error('handler should be function');
        }
        this._prerequisites.push({ handler });
        return this;
    }
    /**
     * Registers a middleware or route handler.
     *
     * Overloads:
     * 1. `use(handler)` – Registers a global middleware function executed for every request.
     * 2. `use(route, handler)` – Registers a handler for a specific route.
     * 3. `use(route, handler, isVirtual)` – Registers a handler for a specific route, optionally marking it as virtual.
     *
     * Examples:
     * ```ts
     * app.use((req, res) => { ... }); // middleware
     * app.use('/home', (req, res) => { ... }); // route handler
     * app.use('/api', (req, res) => { ... }, true); // virtual route handler
     * ```
     *
     * @param {HandlerFunc | string} args[0] - Middleware function or route path.
     * @param {HandlerFunc} [args[1]] - Handler function if first argument is a route path.
     * @param {boolean} [args[2]] - Optional flag to mark route as virtual.
     * @returns {IApplication} The application instance for chaining.
     * @throws {Error} Throws if arguments are invalid or route contains unsupported symbols (e.g., `:`).
     */
    use(...args) {
        const argtype0 = typeof (args[0]);
        const argtype1 = typeof (args[1]);
        if (argtype0 === 'function') {
            // Global middleware
            this._middlewares.push({ handler: args[0] });
            return this;
        }
        if (argtype0 === 'string' && argtype1 === 'function') {
            // Route-specific handler
            const route = args[0];
            if (route.indexOf(':') > -1) {
                throw new Error(`Unsupported symbol defined. ${route}`);
            }
            const isVirtual = typeof (args[2]) === 'boolean' ? args[2] : false;
            this._routes.push({
                route, handler: args[1],
                routeMatcher: (0, app_router_1.getRouteMatcher)(route, isVirtual)
            });
            return this;
        }
        throw new Error('Invalid arguments. Expected use(handler) or use(route, handler)');
    }
    /**
     * Starts the HTTP server and begins listening on the provided handle.
     *
     * This method:
     * 1. Throws an error if the server is already running.
     * 2. Starts listening on the provided port, path, or handle.
     * 3. Marks the server as running once the listening event fires.
     * 4. Registers each incoming connection in `_connectionMap` for tracking.
     * 5. Removes connections from `_connectionMap` when they close.
     *
     * @param {number | string | undefined} handle - The port number, path, or handle for the server to listen on.
     * @param {() => void} [listeningListener] - Optional callback invoked once the server starts listening.
     * @returns {IApplication} Returns the application instance for chaining.
     * @throws {Error} Throws if the server is already running.
     */
    listen(handle, listeningListener) {
        if (this.isRunning) {
            throw new Error('Server already running....');
        }
        this._httpServer.listen(handle, () => {
            this._isRunning = true;
            listeningListener === null || listeningListener === void 0 ? void 0 : listeningListener();
        });
        // Track active connections for potential management or cleanup
        this._httpServer.on('connection', (socket) => {
            const connectionKey = String(++this._connectionKey);
            this._connectionMap.set(connectionKey, socket);
            socket.once('close', () => {
                this._connectionMap.delete(connectionKey);
            });
        });
        return this;
    }
    _setAppHeader(res) {
        res.setHeader('server', 'FSys Frontend');
        res.setHeader('x-app-version', exports.appVersion);
        res.setHeader('x-powered-by', 'fsys.tech');
    }
    _onNewRequest(request, response) {
        try {
            this._setAppHeader(response);
            if (request.method) {
                response.method = request.method;
            }
            response.once('close', (...args) => {
                response.isAlive = false;
                this.emit('response-end', request, response);
            });
            if (this._useRequestBegain) {
                this.emit('request-begain', request);
            }
            this._handleNewRequest(request, response);
        }
        catch (e) {
            // Caught while prerequisites error happens
            this.emit('error', request, response, e);
        }
    }
}
/**
 * Initializes and returns the main application instance.
 *
 * This function performs the following steps:
 * 1. Injects custom prototypes for Request and Response objects.
 * 2. Creates an HTTP server and wraps it in the Application class.
 * 3. Sets headers for every response and tracks response lifecycle.
 * 4. Emits application-level events such as:
 *    - 'request-begain' when a request starts (optional)
 *    - 'response-end' when a response closes
 *    - 'error' on any handler error
 *
 * @param {boolean} [useRequestBegain=true] - Whether to emit 'request-begain' for incoming requests.
 * @returns {IApplication} The initialized Application instance.
 */
function App(useRequestBegain = true) {
    // Ensure Request/Response prototypes are injected
    (0, inject_1.injectIncomingOutgoing)();
    return new Application(useRequestBegain);
}
/**
 * Creates a Node.js HTTP server with the provided request handler.
 *
 * @param {(req: any, res: any) => void} next - The request handler function called for each incoming request.
 * @returns {Server} Returns an instance of Node.js HTTP Server.
 */
function _createServer(next) {
    return (0, node_http_1.createServer)(next);
}
//# sourceMappingURL=server-core.js.map