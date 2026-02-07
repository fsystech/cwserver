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

// 2:40 PM 5/7/2020
// by rajib chy
import './app-global';
import { resolve } from 'node:path';
import * as _zlib from 'node:zlib';
import { createServer, Server } from 'node:http';
import { EventEmitter } from 'node:events';
import {
    getRouteInfo, getRouteMatcher,
    type IRequestParam, type ILayerInfo, type IRouteInfo
} from './app-router';
import { Util, assert, getAppDir } from './app-util';
import { existsSync, readFileSync } from 'fs';
import * as _mimeType from './http-mime-types';
import { Socket } from 'node:net';
import { Request, type IRequest } from './request';
import { Response, type IResponse } from './response';
import { injectIncomingOutgoing } from './inject';

type onError = (req: IRequest, res: IResponse, err?: Error | number) => void;
export type NextFunction = (err?: any) => void;
export type HandlerFunc = (req: IRequest, res: IResponse, next: NextFunction, requestParam?: IRequestParam) => void;

export interface IApplication {
    readonly version: string;
    readonly httpServer: Server;
    readonly isRunning: boolean;

    /**
     * Clears all registered handlers in the application.
     *
     * This includes:
     * 1. Route-specific handlers.
     * 2. Global middlewares.
     * 3. Prerequisite handlers.
     *
     * After calling this method, the application will have no active routes,
     * middlewares, or prerequisites.
     */
    clearHandler(): void;

    /**
     * Registers a global middleware handler.
     *
     * The middleware function is executed for every incoming request, in the order it was added.
     *
     * @param {HandlerFunc} handler - The middleware function to execute for each request.
     * @returns {IApplication} The application instance for chaining.
     */
    use(handler: HandlerFunc): IApplication;

    /**
     * Registers a route-specific handler.
     *
     * The handler is executed only when the request matches the specified route.
     * Optionally, the route can be marked as "virtual" to alter routing behavior.
     *
     * @param {string} route - The path of the route to handle.
     * @param {HandlerFunc} handler - The function to execute for requests matching the route.
     * @param {boolean} [isVirtual=false] - Optional flag to mark the route as virtual.
     * @returns {IApplication} The application instance for chaining.
     */
    use(route: string, handler: HandlerFunc, isVirtual?: boolean): IApplication;

    /**
     * Registers a prerequisite handler executed before route handlers and middlewares.
     *
     * @param {HandlerFunc} handler - Function to be executed for every request before routing.
     * @returns {IApplication} Returns the application instance for chaining.
     * @throws {Error} Throws if the handler is not a function.
     */
    prerequisites(handler: (req: IRequest, res: IResponse, next: NextFunction) => void): IApplication;

    /**
     * Initiates server shutdown and calls the provided callback when done.
     *
     * Emits the 'shutdown' event immediately, then gracefully shuts down the server.
     * Any errors during shutdown are passed to the callback.
     *
     * @param {(err?: Error) => void} next - Callback invoked when shutdown completes or errors.
     */
    shutdown(next: (err?: Error) => void): Promise<void> | void;

    /**
     * Initiates server shutdown and returns a promise.
     *
     * Emits the 'shutdown' event immediately, then gracefully shuts down the server.
     * The returned promise resolves when shutdown completes, or rejects if an error occurs.
     *
     * @returns {Promise<void>} Resolves when server shutdown completes successfully.
     */
    shutdownAsync(): Promise<void>;
    on(ev: 'request-begain', handler: (req: IRequest) => void): IApplication;
    on(ev: 'response-end', handler: (req: IRequest, res: IResponse) => void): IApplication;
    on(ev: 'error', handler: onError): IApplication;
    on(ev: 'shutdown', handler: () => void): IApplication;
    listen(handle: any, listeningListener?: () => void): IApplication;
}

export const {
    appVersion, readAppVersion
} = (() => {
    let _appVersion: string = '4.1.1';
    const _readAppVersion = (): string => {
        const libRoot: string = getAppDir();
        const absPath: string = resolve(`${libRoot}/package.json`);
        assert(existsSync(absPath), `No package.json found in ${libRoot}\nplease re-install cwserver`);
        const data: string = readFileSync(absPath, "utf-8");
        _appVersion = Util.JSON.parse(data).version;
        return _appVersion;
    }
    return {
        get appVersion() {
            return _appVersion;
        },
        get readAppVersion() {
            return _readAppVersion;
        }
    }
})();

class Application extends EventEmitter implements IApplication {
    private _httpServer: Server;
    private _connectionKey: number;
    private _connectionMap: Map<string, Socket>;
    private _routes: ILayerInfo<HandlerFunc>[];
    private _middlewares: ILayerInfo<HandlerFunc>[];
    private _prerequisites: ILayerInfo<HandlerFunc>[];
    private _isRunning: boolean;

    public get version(): string {
        return appVersion;
    }

    public get httpServer(): Server {
        return this._httpServer;
    }

    public get isRunning(): boolean {
        return this._isRunning;
    }

    constructor(httpServer: Server) {
        super();
        this._httpServer = httpServer;

        this._routes = [];
        this._middlewares = [];
        this._prerequisites = [];

        this._isRunning = false;
        this._connectionMap = new Map();
        this._connectionKey = 0;
    }

    public clearHandler(): void {

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
    private _shutdown(): Promise<void> {

        return new Promise<void>((resolve, reject) => {
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
    private _destroyActiveSocket(): void {

        for (const socket of this._connectionMap.values()) {
            socket.destroy();
        }

        this._connectionMap.clear();
    }

    public shutdown(next: (err?: Error) => void): void {
        this.emit('shutdown');

        this._shutdown()
            .then(() => next())
            .catch((err) => next(err));
    }

    public shutdownAsync(): Promise<void> {
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
    private _handleRequest(
        req: IRequest,
        res: IResponse,
        handlers: ILayerInfo<HandlerFunc>[],
        next: NextFunction,
        isMiddleware: boolean = true
    ): void {

        const len = handlers.length;
        if (len === 0) return next();

        let idx = 0;

        // Resolve route only once (if not prerequisite mode)
        const routeInfo: IRouteInfo<HandlerFunc> | undefined =
            (!isMiddleware)
                ? getRouteInfo(req.path, handlers, 'ANY')
                : undefined;

        if (routeInfo?.layer?.routeMatcher) {
            req.path = routeInfo.layer.routeMatcher.replace(req.path);
        }

        const _next = (err?: number | Error): void => {

            if (err instanceof Error) {
                this.emit("error", req, res, err);
                return;
            }

            while (idx < len) {

                const layer = handlers[idx++];
                if (!layer) break;

                // middleware mode = ignore routing logic
                if (!layer.route || isMiddleware === true) {
                    try {
                        return layer.handler(req, res, _next);
                    } catch (e) {
                        this.emit("error", req, res, e);
                        return;
                    }
                }

                // if routed layer exists, execute it only once
                if (routeInfo && layer === routeInfo.layer) {
                    try {
                        return routeInfo.layer.handler(req, res, _next);
                    } catch (e) {
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
    public handleRequest(req: IRequest, res: IResponse): void {

        /**
         * Emits an error for the current request/response.
         *
         * @param {Error} [err] - Optional error to emit. If undefined, a default "No route matched" error is emitted.
         */
        const onError = (err?: Error): void => {

            if (err) {
                this.emit("error", req, res, err);
                return;
            }
            // no handler matched
            this.emit("error", req, res, new Error("No route matched"));
        };

        // Execute prerequisites first
        this._handleRequest(req, res, this._prerequisites, (err?: Error): void => {
            if (err) return onError(err);

            // Execute route handlers next
            this._handleRequest(req, res, this._routes, (err2?: Error): void => {
                if (err2) return onError(err2);

                // Execute middlewares last
                this._handleRequest(req, res, this._middlewares, (err3?: Error): void => {
                    return onError(err3);
                });

            }, false); // 'false' indicates this is not a middleware

        });
    }


    public prerequisites(handler: HandlerFunc): IApplication {

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
    public use(...args: any[]): IApplication {

        const argtype0 = typeof (args[0]);
        const argtype1 = typeof (args[1]);

        if (argtype0 === 'function') {
            // Global middleware
            this._middlewares.push({ handler: args[0] });
            return this;
        }

        if (argtype0 === 'string' && argtype1 === 'function') {
            // Route-specific handler
            const route: string = args[0];

            if (route.indexOf(':') > -1) {
                throw new Error(`Unsupported symbol defined. ${route}`);
            }

            const isVirtual: boolean = typeof (args[2]) === 'boolean' ? args[2] : false;

            this._routes.push({
                route, handler: args[1],
                routeMatcher: getRouteMatcher(route, isVirtual)
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
    public listen(handle: any, listeningListener?: () => void): IApplication {

        if (this.isRunning) {
            throw new Error('Server already running....');
        }

        this._httpServer.listen(handle, () => {
            this._isRunning = true;
            listeningListener?.();
        });

        // Track active connections for potential management or cleanup
        this._httpServer.on('connection', (socket: Socket) => {
            const connectionKey: string = String(++this._connectionKey);
            this._connectionMap.set(connectionKey, socket);

            socket.once('close', () => {
                this._connectionMap.delete(connectionKey);
            });
        });

        return this;
    }
}

function setAppHeader(res: Response) {
    res.setHeader('server', 'FSys Frontend');
    res.setHeader('x-app-version', appVersion);
    res.setHeader('x-powered-by', 'fsys.tech');
}


/**
 * Creates a Node.js HTTP server with the provided request handler.
 *
 * @param {(req: any, res: any) => void} next - The request handler function called for each incoming request.
 * @returns {Server} Returns an instance of Node.js HTTP Server.
 */
function _createServer(next: (req: any, res: any) => void): Server {
    return createServer(next);
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
export function App(useRequestBegain: boolean = true): IApplication {

    // Ensure Request/Response prototypes are injected
    injectIncomingOutgoing();

    const app: Application = new Application(_createServer((request: Request, response: Response) => {

        try {

            setAppHeader(response);

            if (request.method) {
                response.method = request.method;
            }

            response.once('close', (...args: any[]): void => {
                response.isAlive = false;
                app.emit('response-end', request, response);
            });

            if (useRequestBegain) {
                app.emit('request-begain', request);
            }

            app.handleRequest(request, response);

        } catch (e) {
            // Caught while prerequisites error happens
            app.emit('error', request, response, e);
        }
    }));

    return app;
}