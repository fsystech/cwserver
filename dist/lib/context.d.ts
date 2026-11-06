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
    /**
     * Indicates whether this context has been disposed.
     *
     * @returns True if dispose has been called.
     */
    get isDisposed(): boolean;
    error?: string;
    errorPage: string;
    errorCode: number;
    private _res;
    private _req;
    /**
     * Gets the response object for this context.
     *
     * @returns The response.
     */
    get res(): IResponse;
    /**
     * Gets the request object for this context.
     *
     * @returns The request.
     */
    get req(): IRequest;
    path: string;
    extension: string;
    root: string;
    /**
     * Gets the session of the underlying request.
     *
     * @returns The current session.
     */
    get session(): ISession;
    servedFrom?: string;
    private _server;
    /**
     * Gets the server instance that owns this context.
     *
     * @returns The server.
     */
    get server(): ICwServer;
    private _next?;
    /**
     * Gets the callback that continues request processing; returns a no-op function if the context is
     * disposed or no callback was set.
     *
     * @returns The next handler function.
     */
    get next(): CtxNext;
    /**
     * Sets the callback that continues request processing.
     *
     * @param val The next handler.
     */
    set next(val: CtxNext);
    /**
     * Creates a context bound to a server, request and response, with empty path, root, extension and
     * error state.
     *
     * @param server Owning server instance.
     * @param req Incoming request.
     * @param res Outgoing response.
     */
    constructor(server: ICwServer, req: IRequest, res: IResponse);
    /**
     * Records an error for this context on the server; does nothing if the context is disposed.
     *
     * @param err The error to record.
     */
    addError(err: NodeJS.ErrnoException | Error): void;
    /**
     * Records the error on the server and transfers the request to the 500 error handling; does nothing if
     * disposed.
     *
     * @param err The error to record and handle.
     */
    transferError(err: NodeJS.ErrnoException | Error): void;
    /**
     * If the context is live and headers have not been sent, transfers the request on error, otherwise
     * calls next, transferring any error it throws.
     *
     * @param err Error from a previous operation, if any.
     * @param next Callback to run when there is no error.
     */
    handleError(err: NodeJS.ErrnoException | Error | null | undefined, next: () => void): void;
    /**
     * Sends the body as a JSON response, compressed with the encoding the client accepts; does nothing if
     * disposed.
     *
     * @param body Object to serialize as JSON.
     */
    json(body: Record<string, any>): void;
    /**
     * Sends a 302 redirect to the given URL; does nothing if disposed.
     *
     * @param url Target URL.
     * @param force If true, prevents caching of the redirect.
     */
    redirect(url: string, force?: boolean): void;
    /**
     * Writes a chunk to the response stream without ending it; does nothing if disposed.
     *
     * @param chunk Data to write.
     */
    write(chunk: Buffer | string | number | boolean | {
        [key: string]: any;
    }): void;
    /**
     * Transfers the request to another path or error status handled by the server; does nothing if
     * disposed.
     *
     * @param path Target path, or numeric status code.
     */
    transferRequest(path: string | number): void;
    /**
     * Expires the session cookie and clears the session on the server; does nothing if disposed.
     *
     * @returns This context, for chaining.
     */
    signOut(): IContext;
    /**
     * Creates a session for the user on the server; does nothing if disposed.
     *
     * @param loginId User login identifier.
     * @param roleId User role identifier.
     * @param userData Additional data to store in the session.
     * @returns This context, for chaining.
     */
    setSession(loginId: string, roleId: string, userData: any): IContext;
    /**
     * Disposes the context: marks it disposed, disposes the response and request and clears all
     * references. Safe to call repeatedly.
     *
     * @returns The request id if disposed now, or undefined if it was already disposed.
     */
    dispose(): string | void;
}
declare class ContextManager {
    private _contexts;
    /**
     * Creates the manager with an empty context map.
     */
    constructor();
    /**
     * Disposes the context and removes it from the registry by its request id.
     *
     * @param ctx The context to dispose.
     */
    disposeContext(ctx: IContext): void;
    /**
     * Looks up a registered context by request id.
     *
     * @param id Request id.
     * @returns The matching context, or undefined if none.
     */
    getMyContext(id: string): IContext | undefined;
    /**
     * Disposes and unregisters the context for the given request id, if present.
     *
     * @param id Request id.
     */
    removeContext(id: string): void;
    /**
     * Gets the context for the request id, creating and registering a new one if none exists.
     *
     * @param server Owning server.
     * @param req Incoming request.
     * @param res Outgoing response.
     * @returns The existing or newly created context.
     */
    getContext(server: ICwServer, req: IRequest, res: IResponse): IContext;
    /**
     * Instantiates a new request context, registers it in the context map by request ID,
     * and returns the newly created instance.
     *
     * @param server Owning server instance handling the request.
     * @param req Incoming HTTP request.
     * @param res Outgoing HTTP response.
     * @returns The newly created request context.
     */
    create(server: ICwServer, req: IRequest, res: IResponse): Context;
}
export declare const _ctxManager: ContextManager;
export {};
