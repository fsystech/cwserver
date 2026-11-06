import { IncomingMessage } from 'node:http';
import { UrlWithParsedQuery } from 'node:url';
import type { ISession } from './session';
import type { CompressionType } from './app-global';
type ParsedUrlQuery = {
    [key: string]: string | string[] | undefined;
};
export interface IRequest extends IncomingMessage {
    /**
     * Gets the parsed request URL.
     *
     * @remarks
     * The URL is parsed only once using `parseUrl()` and the result is cached
     * for subsequent accesses.
     *
     * @returns The parsed URL, including its pathname and query parameters.
     */
    readonly q: UrlWithParsedQuery;
    /**
     * Gets the unique identifier for this request.
     *
     * @remarks
     * A GUID is generated lazily on first access using `Util.UUID()` and
     * reused for the lifetime of the request.
     *
     * @returns The request identifier.
     */
    readonly id: string;
    /**
     * Gets the parsed HTTP cookies.
     *
     * @remarks
     * The `Cookie` request header is parsed only once and the resulting
     * key-value map is cached for subsequent accesses.
     *
     * @returns A dictionary containing the parsed cookie names and values.
     */
    readonly cookies: Record<string, string>;
    /**
     * Gets the parsed URL query parameters.
     *
     * @remarks
     * This property returns the `query` component of the parsed request URL.
     *
     * @returns The parsed query parameters.
     */
    readonly query: ParsedUrlQuery;
    /**
     * Gets the client's IP address.
     *
     * @remarks
     * The IP address is resolved using `getClientIp()` on first access and
     * cached for subsequent accesses.
     *
     * @returns The client's IP address.
     */
    readonly ip: string;
    readonly isMobile: boolean;
    readonly isLocal: boolean;
    cleanSocket: boolean;
    /**
     * Gets the normalized request path.
     *
     * @remarks
     * The path is URL-decoded and sanitized using `escapePath()`. The computed
     * value is cached after the first access.
     *
     * @returns The normalized request path.
     */
    path: string;
    session: ISession;
    /**
     * Retrieves the value of an HTTP request header.
     *
     * @param name - The header name. Header names are matched using Node.js'
     * normalized lowercase keys (for example, `"content-type"` or
     * `"accept-encoding"`).
     * @returns The header value as a string, or `undefined` if the header is not present.
     */
    get(name: string): string | void;
    setSocketNoDelay(noDelay?: boolean): void;
    dispose(): void;
    /**
     * Returns the most suitable compression algorithm supported by the client.
     *
     * @remarks
     * The client's `Accept-Encoding` header is evaluated in the following order:
     *
     * 1. The server's preferred compression algorithm (`_DEFAULT_CONTENT_COMPRESSION`), if accepted.
     * 2. Brotli (`br`).
     * 3. Gzip (`gzip`).
     *
     * If none of the supported algorithms are accepted, or the
     * `Accept-Encoding` header is not present, `null` is returned.
     *
     * @returns The selected compression algorithm, or `null` if no supported
     * compression algorithm is accepted by the client.
     */
    acceptEncoding(): CompressionType;
}
export declare class Request extends IncomingMessage implements IRequest {
    private _q;
    private _cookies;
    private _path;
    private _session;
    private _ip;
    private _id;
    private _cleanSocket;
    private _isMobile;
    private _isLocal;
    /**
     * Detects whether the request comes from a mobile device by testing the User-Agent header; the result
     * is cached.
     *
     * @returns True if the user agent matches a mobile pattern, otherwise false.
     */
    get isMobile(): boolean;
    /**
     * Indicates whether the underlying socket should be destroyed when this request is disposed.
     *
     * @returns True if socket cleanup is enabled, otherwise false (default).
     */
    get cleanSocket(): boolean;
    /**
     * Sets whether the socket should be cleaned up (listeners removed and destroyed) on dispose.
     *
     * @param val True to destroy the socket on dispose.
     */
    set cleanSocket(val: boolean);
    /**
     * Lazily parses the request URL, including the query string, and caches the result.
     *
     * @returns The parsed URL object with parsed query.
     */
    get q(): UrlWithParsedQuery;
    /**
     * Lazily parses the Cookie request header into a name/value map and caches it.
     *
     * @returns Record of cookie names to values.
     */
    get cookies(): Record<string, string>;
    /**
     * Gets the session associated with this request.
     *
     * @returns The current session, or an empty object if none has been assigned.
     */
    get session(): ISession;
    /**
     * Assigns the session for this request.
     *
     * @param val Session object to attach.
     */
    set session(val: ISession);
    /**
     * Determines whether the client address is a loopback address (::1 or 127.0.0.1); the result is
     * cached.
     *
     * @returns True if the request originates from localhost.
     */
    get isLocal(): boolean;
    /**
     * Gets the decoded, sanitized pathname of the request URL; cached after first access.
     *
     * @returns The request path.
     */
    get path(): string;
    /**
     * Overrides the request path, for example when a request is internally transferred.
     *
     * @param val New path to use.
     */
    set path(val: string);
    /**
     * Resolves the client IP address for the request and caches it.
     *
     * @returns The client IP address string.
     */
    get ip(): string;
    /**
     * Gets a unique identifier for this request, generating a guid on first access.
     *
     * @returns The request id.
     */
    get id(): string;
    /**
     * Gets the parsed query string parameters of the request URL.
     *
     * @returns The parsed query object.
     */
    get query(): ParsedUrlQuery;
    /**
     * Retrieves the value of an HTTP request header.
     *
     * @param name - The header name. Header names are matched using Node.js'
     * normalized lowercase keys (for example, `"content-type"` or
     * `"accept-encoding"`).
     * @returns The header value as a string, or `undefined` if the header is not present.
     */
    get(name: string): string | void;
    /**
     * Returns the most suitable compression algorithm supported by the client.
     *
     * @remarks
     * The client's `Accept-Encoding` header is evaluated in the following order:
     *
     * 1. The server's preferred compression algorithm (`_DEFAULT_CONTENT_COMPRESSION`), if accepted.
     * 2. Brotli (`br`).
     * 3. Gzip (`gzip`).
     *
     * If none of the supported algorithms are accepted, or the
     * `Accept-Encoding` header is not present, `null` is returned.
     *
     * @returns The selected compression algorithm, or `null` if no supported
     * compression algorithm is accepted by the client.
     */
    acceptEncoding(): CompressionType;
    /**
     * Enables or disables Nagle's algorithm on the request socket (TCP no-delay) if a socket exists.
     *
     * @param noDelay Whether to disable the delay; passed to the socket's setNoDelay.
     */
    setSocketNoDelay(noDelay?: boolean): void;
    /**
     * Clears cached per-request state (id, URL, ip, path, cookies, locality); when cleanSocket is set (or
     * in test mode) also removes listeners and destroys the socket.
     */
    dispose(): void;
}
export {};
