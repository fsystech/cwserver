import { OutgoingHttpHeaders, ServerResponse } from 'node:http';
import { type IResInfo } from './app-static';
import type { IContext } from './context';
type CookieOptions = {
    maxAge?: number;
    signed?: boolean;
    /** Date | timestamp */
    expires?: Date | number;
    httpOnly?: boolean;
    path?: string;
    domain?: string;
    secure?: boolean;
    encode?: (val: string) => string;
    sameSite?: boolean | 'lax' | 'strict' | 'none';
};
/**
 * Supported HTTP response compression algorithms.
 *
 * - `"GZIP"` - Widely supported compression format offering an excellent
 *   balance between compression ratio and performance.
 * - `"BROTLI"` - Modern compression algorithm that typically produces
 *   smaller payloads than GZIP, especially for text-based content.
 * - `"ZSTD"` - Zstandard compression algorithm designed to provide high
 *   compression ratios with very fast compression and decompression speeds.
 */
export type CompressionType = "GZIP" | "BROTLI" | "ZSTD";
export interface IResponse extends ServerResponse {
    /**
     * Indicates whether the underlying connection is still active and capable
     * of sending a response.
     *
     * A value of `false` means the connection has been closed or destroyed.
     */
    readonly isAlive: boolean;
    /**
     * Gets the HTTP status code that will be sent with the response.
     *
     * The value may be modified through methods such as `status()`.
     */
    readonly statusCode: number;
    /**
     * Determines whether the underlying socket should be destroyed when the
     * response is disposed.
     *
     * When `true`, all event listeners are removed and the socket is explicitly
     * destroyed during disposal.
     */
    cleanSocket: boolean;
    /**
     * Serializes the specified object to JSON, optionally compresses the
     * resulting payload, and sends it as the HTTP response.
     *
     * Compression is only applied when:
     * - A compression type is specified.
     * - The serialized payload size meets the configured compression threshold.
     *
     * If compression is not applied, the JSON payload is sent uncompressed.
     *
     * @param {NodeJS.Dict<any>} body - The object to serialize as JSON.
     * @param {CompressionType} [compress] - The compression algorithm to use.
     * @param {(error: Error) => void} [next] - Invoked if a compression error occurs.
     * @returns {void}
     */
    json(body: NodeJS.Dict<any>, compress?: CompressionType, next?: (error: Error) => void): void;
    /**
     * Sends arbitrary data as the HTTP response, optionally compressing it
     * before transmission.
     *
     * Compression is only applied when:
     * - A compression type is specified.
     * - The payload size meets the configured compression threshold.
     *
     * If compression is not applied, the original data is sent unchanged.
     *
     * @param {string | Buffer} data - The response payload.
     * @param {string} contentType - The MIME type or file extension used to determine the response Content-Type.
     * @param {CompressionType} [compress] - The compression algorithm to use.
     * @param {(error: Error) => void} [next] - Invoked if a compression error occurs.
     * @returns {void}
     */
    compress(data: string | Buffer, contentType: string, compress?: CompressionType, next?: (error: Error) => void): void;
    /**
     * Sets the HTTP status code and optionally applies one or more response
     * headers.
     *
     * Existing headers with the same name are overwritten. Header entries whose
     * values are `null` or `undefined` are ignored.
     *
     * @param {number} code
     * HTTP status code to send.
     *
     * @param {OutgoingHttpHeaders} [headers]
     * Optional collection of response headers to apply.
     *
     * @returns {IResponse}
     * The current response instance for method chaining.
     */
    status(code: number, headers?: OutgoingHttpHeaders): IResponse;
    /**
     * Sets the response status and headers for an HTML response.
     *
     * This method configures the response with the specified HTTP status code,
     * `Content-Type: text/html`, optional `Content-Length`, and optional
     * `Content-Encoding: gzip`.
     *
     * @param {number} code
     * HTTP status code to send.
     *
     * @param {number} [contentLength]
     * Size of the response body in bytes. If omitted, the `Content-Length`
     * header is not set.
     *
     * @param {boolean} [isGzip]
     * Indicates whether the response body is gzip-compressed. When `true`,
     * the appropriate `Content-Encoding` header is included.
     *
     * @returns {IResponse}
     * The current response instance for method chaining.
     */
    asHTML(code: number, contentLength?: number, compress?: CompressionType): IResponse;
    /**
     * Sets the response status and headers for a JSON response.
     *
     * This method configures the response with the specified HTTP status code,
     * `Content-Type: application/json`, optional `Content-Length`, and optional
     * `Content-Encoding: gzip`.
     *
     * @param {number} code
     * HTTP status code to send.
     *
     * @param {number} [contentLength]
     * Size of the response body in bytes. If omitted, the `Content-Length`
     * header is not set.
     *
     * @param {boolean} [isGzip]
     * Indicates whether the response body is gzip-compressed. When `true`,
     * the appropriate `Content-Encoding` header is included.
     *
     * @returns {IResponse}
     * The current response instance for method chaining.
     */
    asJSON(code: number, contentLength?: number, compress?: CompressionType): IResponse;
    /**
     * Adds a `Set-Cookie` header to the response.
     *
     * If one or more cookies have already been added, the new cookie is
     * appended without replacing the existing values.
     *
     * @param {string} name
     * Cookie name.
     *
     * @param {string} val
     * Cookie value.
     *
     * @param {CookieOptions} options
     * Cookie configuration options.
     *
     * @returns {IResponse}
     * The current response instance for method chaining.
     */
    cookie(name: string, val: string, options: CookieOptions): IResponse;
    /**
     * Retrieves the value of a response header.
     *
     * If the header contains multiple values, they are returned as a JSON string.
     * Returns `undefined` if the header is not present.
     *
     * @param {string} name
     * Name of the response header.
     *
     * @returns {string | void}
     * The header value as a string, or `undefined` if the header does not exist.
     */
    get(name: string): string | void;
    /**
     * Sets a response header.
     *
     * If a header with the same name already exists, its value is replaced.
     *
     * @param {string} field
     * Header name.
     *
     * @param {number | string | string[]} value
     * Header value.
     *
     * @returns {IResponse}
     * The current response instance for method chaining.
     */
    set(field: string, value: number | string | string[]): IResponse;
    /**
     * Redirects the client to another URL.
     *
     * Sets the `Location` response header and ends the response. When
     * `force` is `true`, cache-control headers are applied to prevent
     * clients from caching the redirect.
     *
     * @param {string} url
     * Destination URL.
     *
     * @param {boolean} [force]
     * If `true`, disables caching before issuing the redirect.
     *
     * @returns {void}
     */
    redirect(url: string, force?: boolean): void;
    /**
     * Renders a template and writes the resulting output to the response.
     *
     * The template is resolved from the specified path and rendered using
     * the provided request context. An optional response status object may
     * be supplied to expose additional data to the template.
     *
     * @param {IContext} ctx
     * The current request context.
     *
     * @param {string} path
     * Path of the template to render.
     *
     * @param {IResInfo} [status]
     * Optional data passed to the template during rendering.
     *
     * @returns {void}
     */
    render(ctx: IContext, path: string, status?: IResInfo): void;
    /**
     * Sets the response `Content-Type` header using a file extension or MIME alias.
     *
     * The extension is resolved to its corresponding MIME type using the
     * application's MIME type registry.
     *
     * @param {string} extension
     * File extension or MIME alias (e.g. `"html"`, `"json"`, `"text"`, `"bin"`).
     *
     * @returns {IResponse}
     * The current response instance for method chaining.
     */
    type(extension: string): IResponse;
    /**
     * Configures the response to prevent client and intermediary caching.
     *
     * If a `Cache-Control` header already exists and contains the
     * `must-revalidate` directive, no changes are made. Otherwise, any existing
     * `Cache-Control` header is replaced with a strict no-cache policy.
     *
     * The applied policy is:
     * `no-store, no-cache, must-revalidate, immutable`
     *
     * @returns {IResponse}
     * The current response instance for method chaining.
     */
    noCache(): IResponse;
    /**
     * Sends an HTTP 500 Internal Server Error response when the supplied
     * value is a valid `Error` object.
     *
     * If the response has already been completed or the supplied value is
     * not an `Error`, no response is sent.
     *
     * @param {any} [err]
     * The error to send to the client.
     *
     * @returns {boolean}
     * Returns `true` if the response was already closed or an error response
     * was sent; otherwise, returns `false`.
     */
    sendIfError(err?: any): boolean;
    /**
     * Sends a response body to the client and completes the response.
     *
     * The response `Content-Type` is determined automatically when it has not
     * already been specified:
     *
     * - `string`  → `text/html`
     * - `number` or `boolean` → `text/plain`
     * - `Buffer`  → `application/octet-stream`
     * - `object`  → `application/json` (serialized using `Util.JSON.stringify()`)
     *
     * A `Content-Length` header is calculated and set automatically before the
     * response is ended.
     *
     * For HTTP status codes `204 No Content` and `304 Not Modified`, any
     * `Content-Type`, `Content-Length`, and `Transfer-Encoding` headers are
     * removed as required by the HTTP specification, and the response is sent
     * without a body.
     *
     * For `HEAD` requests, headers are sent but the response body is omitted.
     *
     * @param {any} chunk
     * The response body to send. Supported types are `string`, `number`,
     * `boolean`, `Buffer`, and JSON-serializable objects.
     *
     * @throws {Error}
     * Thrown if response headers have already been sent. In this case,
     * `res.end()` should be used instead of `res.send()`.
     *
     * @throws {Error}
     * Thrown if `chunk` is `undefined`.
     *
     * @returns {void}
     */
    send(chunk?: Buffer | string | number | boolean | {
        [key: string]: any;
    }): void;
    /**
     * Releases resources associated with this response.
     *
     * Clears internal state and, when `cleanSocket` is enabled (or the current
     * process is running in the `TEST` environment), removes all event listeners
     * and destroys the underlying socket.
     *
     * This method should be called when the response instance is no longer needed
     * to help free resources and prevent memory leaks.
     *
     * @returns {void}
     */
    dispose(): void;
}
export declare class Response extends ServerResponse implements IResponse {
    private _isAlive;
    private _method;
    private _cleanSocket;
    private _statusCode;
    get statusCode(): number;
    set statusCode(code: number);
    get cleanSocket(): boolean;
    set cleanSocket(val: boolean);
    get isAlive(): boolean;
    set isAlive(val: boolean);
    get method(): string;
    set method(val: string);
    noCache(): IResponse;
    status(code: number, headers?: OutgoingHttpHeaders): IResponse;
    get(name: string): string | void;
    set(field: string, value: number | string | string[]): IResponse;
    type(extension: string): IResponse;
    send(chunk?: any): void;
    asHTML(code: number, contentLength?: number, compress?: CompressionType): IResponse;
    asJSON(code: number, contentLength?: number, compress?: CompressionType): IResponse;
    render(ctx: IContext, path: string, status?: IResInfo): void;
    redirect(url: string, force?: boolean): void;
    cookie(name: string, val: string, options: CookieOptions): IResponse;
    sendIfError(err?: any): boolean;
    json(body: NodeJS.Dict<any>, compress?: CompressionType, next?: (error: Error) => void): void;
    compress(data: string | Buffer, contentType: string, compress?: CompressionType, next?: (error: Error) => void): void;
    /**
     * Compresses the specified response payload when enabled and the payload
     * size exceeds the configured compression threshold.
     *
     * If compression is disabled or unnecessary, the payload is sent directly.
     *
     * Supported compression algorithms:
     * - GZIP
     * - BROTLI
     *
     * @private
     * @param {Buffer} buffer - The response payload.
     * @param {string} contentType - The MIME type or file extension used to determine the response Content-Type.
     * @param {CompressionType} [compress] - The compression algorithm to apply.
     * @param {(err: Error) => void} [next] - Invoked if compression fails.
     * @returns {void}
     * @throws {Error} Thrown if the specified compression algorithm is not supported.
     */
    private _compressData;
    /**
     * Handles the completion of a compression operation and sends the
     * compressed response to the client.
     *
     * If compression fails, the optional callback is invoked and the error
     * response is sent to the client. If the connection has already been
     * closed, no further action is taken.
     *
     * @private
     * @param {string} contentType - The MIME type or file extension used to determine the response Content-Type.
     * @param {Buffer} compressed - The compressed response payload.
     * @param {CompressionType} compress - The compression algorithm used.
     * @param {(err: Error) => void} [next] - Invoked if compression fails.
     * @param {Error} [error] - The compression error, if any.
     * @returns {void}
     */
    private _onCompress;
    dispose(): void;
}
export {};
