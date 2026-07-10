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

// 6:01 PM 2/7/2026
// by rajib chy

import { Util } from "./app-util";
import type { IResponse } from "./response";
import type { IRequest } from "./request";
import type { ICwServer } from "./server";
import type { ISession } from "./session";

/**
 * Callback used to continue request processing.
 *
 * @param {number} [code]
 * Optional HTTP status code associated with the continuation.
 *
 * @param {boolean} [transfer]
 * Indicates whether request processing should be transferred to another
 * route or handler.
 */
type CtxNext = (code?: number | undefined, transfer?: boolean) => void;


/**
 * Represents the execution context of a single HTTP request.
 *
 * An `IContext` instance encapsulates all information and services associated
 * with processing an incoming request, including the request, response,
 * session, routing information, server instance, and request lifecycle state.
 *
 * The context is created when a request is received and remains valid until
 * request processing completes or the connection is terminated. Once the
 * context is disposed, its associated resources are released and no further
 * operations should be performed using the instance.
 *
 * Typical responsibilities include:
 * - Accessing the current HTTP request and response.
 * - Reading and updating session information.
 * - Performing internal request transfers and redirects.
 * - Writing response data.
 * - Recording and propagating application errors.
 * - Managing request lifecycle and cleanup.
 *
 * An `IContext` instance is intended to represent exactly one HTTP request
 * and must not be shared between concurrent requests.
 */
export interface IContext {
    /**
     * Indicates whether this request context has been disposed.
     *
     * Once `true`, the request has completed and its associated resources have
     * been released. No further operations should be performed using this
     * context, and the underlying request/response connection is considered
     * closed for this request.
     */
    readonly isDisposed: boolean;

    /**
     * Optional error message associated with the current request.
     */
    error?: string;

    /**
     * Path to the error page used when rendering error responses.
     */
    errorPage: string;

    /**
     * HTTP status code associated with the current error.
     */
    errorCode: number;

    /**
     * The HTTP response associated with the current request.
     */
    readonly res: IResponse;

    /**
     * The HTTP request associated with the current context.
     */
    readonly req: IRequest;

    /**
     * The normalized request path.
     */
    path: string;

    /**
     * The file extension extracted from the request path, if present.
     */
    extension: string;

    /**
     * The application's root directory used for resolving resources.
     */
    root: string;

    /**
     * The authenticated session associated with the current request.
     *
     * If no authenticated session exists, this property represents the current
     * session state as provided by the server.
     */
    readonly session: ISession;

    /**
     * Identifies the resource or route from which the request was served.
     */
    servedFrom?: string;

    /**
     * The server instance responsible for processing this request.
     */
    readonly server: ICwServer;

    /**
     * Callback used to continue request processing within the request pipeline.
     */
    next: CtxNext;

    /**
     * Redirects the client to the specified URL.
     *
     * Sends an HTTP 302 (Found) redirect response by setting the `Location`
     * header and ending the response. If the context has already been disposed,
     * no action is performed.
     *
     * When `force` is `true`, cache-control headers are applied to prevent the
     * redirect response from being cached.
     *
     * @param {string} url
     * The destination URL.
     *
     * @param {boolean} [force]
     * If `true`, applies a no-cache policy before issuing the redirect.
     *
     * @returns {void}
     */
    redirect(url: string, force?: boolean): void;

    /**
     * Internally transfers the current request to another route or handler.
     *
     * Unlike an HTTP redirect, this operation is performed entirely on the server
     * and does not instruct the client to issue a new request. The original
     * request context is preserved during the transfer.
     *
     * If the context has already been disposed, no action is performed.
     *
     * @param {string | number} path
     * The destination route, path, or application-defined route identifier.
     *
     * @returns {void}
     */
    transferRequest(toPath: string | number): void;

    /**
     * Writes a chunk of data to the response stream without ending the response.
     *
     * This method forwards the supplied data to the underlying response object.
     * The caller is responsible for invoking `end()` when all response data has
     * been written. If the context has already been disposed, no action is
     * performed.
     *
     * @param {Buffer | string | number | boolean | { [key: string]: any }} chunk
     * The data to write to the response. The supported types are determined by
     * the underlying response implementation.
     *
     * @returns {void}
     */
    write(chunk: Buffer | string | number | boolean | { [key: string]: any }): void;

    /**
     * Records an error for the current request context.
     *
     * The error is forwarded to the server's error handling pipeline for
     * logging, monitoring, or other application-defined processing. If the
     * context has already been disposed, the error is ignored.
     *
     * @param {NodeJS.ErrnoException | Error} err
     * The error to record.
     *
     * @returns {void}
     */
    addError(err: NodeJS.ErrnoException | Error): void;

    /**
     * Transfers the current request to another route or handler.
     *
     * The request is internally rerouted without requiring the client to issue
     * a new HTTP request. If the context has already been disposed, no action is
     * performed.
     *
     * @param {string | number} path
     * The destination route, path, or application-defined route identifier to
     * which the request should be transferred.
     *
     * @returns {void}
     */
    transferError(err: NodeJS.ErrnoException | Error): void;

    /**
     * Handles an error-aware execution flow for the current request context.
     *
     * If a valid error is supplied, it is immediately forwarded to the server's
     * error handling pipeline. Otherwise, the specified callback is executed
     * within a `try...catch` block, and any exception it throws is also forwarded
     * for centralized error handling.
     *
     * No action is taken if the context has already been disposed or the response
     * headers have already been sent.
     *
     * @param {NodeJS.ErrnoException | Error | null | undefined} err
     * An existing error to handle. If `null` or `undefined`, the callback is
     * executed instead.
     *
     * @param {() => void} next
     * The operation to execute when no error is present.
     *
     * @returns {void}
     */
    handleError(err: NodeJS.ErrnoException | Error | null | undefined, next: () => void): void;

    /**
     * Creates or updates the authenticated session associated with the current
     * request context.
     *
     * The session is initialized with the specified login identifier, role
     * identifier, and application-defined user data. If the context has already
     * been disposed, this method has no effect.
     *
     * @param {string} loginId
     * Unique identifier of the authenticated user.
     *
     * @param {string} roleId
     * Identifier of the user's role or permission group.
     *
     * @param {any} userData
     * Application-specific data to associate with the session.
     *
     * @returns {IContext}
     * The current context instance for method chaining.
     */
    setSession(loginId: string, roleId: string, userData: any): IContext;

    /**
     * Signs out the current user and clears the associated session.
     *
     * This method expires the session cookie on the client and invokes the
     * server's session cleanup handler. If the context has already been disposed,
     * no action is performed.
     *
     * @returns {IContext}
     * The current context instance for method chaining.
     */
    signOut(): IContext;

    /**
     * Disposes this request context and releases all associated resources.
     *
     * This method is idempotent; calling it more than once has no effect.
     * During disposal, the associated request and response objects are disposed,
     * internal references are cleared to facilitate garbage collection, and the
     * context is marked as disposed.
     *
     * Before the context is released, the unique request identifier is captured
     * and returned to the caller.
     *
     * @returns {string | void}
     * The unique request identifier if the context was successfully disposed;
     * otherwise, `undefined` if the context had already been disposed.
     */
    dispose(): string | void;
}

export class Context implements IContext {
    private _isDisposed: boolean;
    public get isDisposed(): boolean {
        return this._isDisposed;
    }
    public error?: string;
    public errorPage: string;
    public errorCode: number;
    private _res: IResponse;
    private _req: IRequest;
    public get res(): IResponse {
        return this._res;
    }
    public get req(): IRequest {
        return this._req;
    }
    public path: string;
    public extension: string;
    public root: string;
    public get session(): ISession {
        return this._req.session;
    }
    public servedFrom?: string;
    private _server: ICwServer;
    public get server(): ICwServer {
        return this._server;
    }

    private _next?: CtxNext;

    public get next(): CtxNext {
        if (!this._isDisposed && this._next) return this._next;
        return (code?: number, transfer?: boolean): void => {
            if (this._isDisposed) return;
            // Unreachable....
        };
    }

    public set next(val: CtxNext) {
        this._next = val;
    }

    constructor(
        server: ICwServer,
        req: IRequest,
        res: IResponse
    ) {
        this._isDisposed = false;
        this.error = void 0; this.path = ""; this.root = "";
        this._res = res; this._req = req; this._server = server;
        this.extension = ""; this.errorPage = ""; this.errorCode = 0;
    }

    public addError(err: NodeJS.ErrnoException | Error): void {
        if (!this._isDisposed) {
            this._server.addError(this, err)
        }
    }

    public transferError(err: NodeJS.ErrnoException | Error): void {
        if (!this._isDisposed) {
            this._server.addError(this, err);
            return this._server.transferRequest(this, 500);
        }
    }

    public handleError(err: NodeJS.ErrnoException | Error | null | undefined, next: () => void): void {
        if (!this._isDisposed && !this._res.headersSent) {
            if (Util.isError(err)) {
                return this.transferError(err);
            }
            try {
                return next();
            } catch (e: any) {
                return this.transferError(e);
            }
        }
        // Nothing to do, context destroyed or response header already been sent
    }

    public redirect(url: string, force?: boolean): void {
        if (!this._isDisposed) {
            this._res.status(302).redirect(url, force);
        }
    }

    public write(chunk: Buffer | string | number | boolean | { [key: string]: any }): void {
        if (!this._isDisposed) {
            return this._res.write(chunk), void 0;
        }
    }

    public transferRequest(path: string | number): void {
        if (!this._isDisposed) {
            return this._server.transferRequest(this, path);
        }
    }

    public signOut(): IContext {

        if (!this._isDisposed) {

            this._res.cookie(this._server.config.session.cookie, "", {
                expires: -1
            });

            this._server.onClearSession(this);
        }

        return this;
    }

    public setSession(loginId: string, roleId: string, userData: any): IContext {

        if (!this._isDisposed) {

            this._server.setSession(
                this, loginId, roleId, userData
            );
        }

        return this;
    }

    public dispose(): string | void {
        if (this._isDisposed)
            return;

        this._isDisposed = true;

        delete this._next;

        const id: string = this._req.id;
        this._res.dispose();
        this._req.dispose();
        delete this._server;
        delete this.path;
        delete this._res;
        delete this._req;
        delete this.extension;
        delete this.root;
        delete this.servedFrom;
        delete this.error;

        return id;
    }
}

class ContextManager {
    private _contexts: Map<string, IContext>;

    constructor() {
        this._contexts = new Map();
    }

    public disposeContext(ctx: IContext): void {
        const reqId = ctx.dispose();

        if (reqId) {
            this._contexts.delete(reqId);
        }

    }

    public getMyContext(id: string): IContext | undefined {
        return this._contexts.get(id);
    }

    public removeContext(id: string): void {
        const ctx = this._contexts.get(id);

        if (ctx) {
            this.disposeContext(ctx);
        }
    }

    public getContext(server: ICwServer, req: IRequest, res: IResponse): IContext {
        let ctx: IContext = this._contexts.get(req.id);

        if (!ctx) {
            ctx = new Context(server, req, res);
            this._contexts.set(req.id, ctx);
        }

        return ctx;
    }
}

class ContextManagerStatic {
    private static _instance: ContextManager = null;
    public static getInstance(): ContextManager {
        if (this._instance === null) {
            this._instance = new ContextManager();
        }
        return this._instance;
    }
}

export const _ctxManager = ContextManagerStatic.getInstance();