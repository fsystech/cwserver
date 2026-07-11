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
    write(chunk: Buffer | string | number | boolean | {
        [key: string]: any;
    }): void;
    /**
     * Sends a JSON response to the client.
     *
     * @remarks
     * The response is automatically compressed using the best algorithm
     * accepted by the client, as determined by
     * {@link Request.acceptEncoding}. If this context has already been
     * disposed, the call is ignored.
     *
     * @param body - The JSON-serializable object to send in the response.
     */
    json(body: Record<string, any>): void;
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
export declare class Context implements IContext {
    private _isDisposed;
    get isDisposed(): boolean;
    error?: string;
    errorPage: string;
    errorCode: number;
    private _res;
    private _req;
    get res(): IResponse;
    get req(): IRequest;
    path: string;
    extension: string;
    root: string;
    get session(): ISession;
    servedFrom?: string;
    private _server;
    get server(): ICwServer;
    private _next?;
    get next(): CtxNext;
    set next(val: CtxNext);
    constructor(server: ICwServer, req: IRequest, res: IResponse);
    addError(err: NodeJS.ErrnoException | Error): void;
    transferError(err: NodeJS.ErrnoException | Error): void;
    handleError(err: NodeJS.ErrnoException | Error | null | undefined, next: () => void): void;
    json(body: Record<string, any>): void;
    redirect(url: string, force?: boolean): void;
    write(chunk: Buffer | string | number | boolean | {
        [key: string]: any;
    }): void;
    transferRequest(path: string | number): void;
    signOut(): IContext;
    setSession(loginId: string, roleId: string, userData: any): IContext;
    dispose(): string | void;
}
declare class ContextManager {
    private _contexts;
    constructor();
    disposeContext(ctx: IContext): void;
    getMyContext(id: string): IContext | undefined;
    removeContext(id: string): void;
    getContext(server: ICwServer, req: IRequest, res: IResponse): IContext;
}
export declare const _ctxManager: ContextManager;
export {};
