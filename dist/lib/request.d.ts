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
     * A GUID is generated lazily on first access using `Util.guid()` and
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
    get isMobile(): boolean;
    get cleanSocket(): boolean;
    set cleanSocket(val: boolean);
    get q(): UrlWithParsedQuery;
    get cookies(): Record<string, string>;
    get session(): ISession;
    set session(val: ISession);
    get isLocal(): boolean;
    get path(): string;
    set path(val: string);
    get ip(): string;
    get id(): string;
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
    setSocketNoDelay(noDelay?: boolean): void;
    dispose(): void;
}
export {};
