import { OutgoingHttpHeaders, ServerResponse } from 'node:http';
import { type IResInfo } from './app-static';
import type { IContext } from './context';
import type { CompressionType } from './app-global';
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
     * @param {Record<string, any>} body - The object to serialize as JSON.
     * @param {CompressionType} [compress] - The compression algorithm to use.
     * @param {(error: Error) => void} [next] - Invoked if a compression error occurs.
     * @returns {void}
     */
    json(body: Record<string, any>, compress?: CompressionType, next?: (error: Error) => void): void;
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
     * @returns {Promise<void>} Resolves when the response has been handled.
     */
    render(ctx: IContext, path: string, status?: IResInfo): Promise<void>;
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
     * `no-store, max-age=0`
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
    /**
     * Gets the HTTP status code set on this response.
     *
     * @returns The status code, or 0 if none has been set.
     */
    get statusCode(): number;
    /**
     * Sets the HTTP status code after validating it; throws an Error if the code is not a valid HTTP
     * status.
     *
     * @param code HTTP status code to assign.
     */
    set statusCode(code: number);
    /**
     * Indicates whether the underlying socket should be destroyed when this response is disposed.
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
     * Indicates whether the response is still considered alive (usable) for further processing.
     *
     * @returns True unless it has been explicitly marked as not alive; defaults to true.
     */
    get isAlive(): boolean;
    /**
     * Marks the response as alive or no longer alive.
     *
     * @param val The alive flag to store.
     */
    set isAlive(val: boolean);
    /**
     * Gets the HTTP method of the originating request recorded on this response.
     *
     * @returns The method string, or an empty string if not set.
     */
    get method(): string;
    /**
     * Records the HTTP method of the originating request on this response.
     *
     * @param val HTTP method name, such as GET or HEAD.
     */
    set method(val: string);
    /**
     * Sets the cache-control header to no-store, max-age=0 so clients do not cache the response; an
     * existing header containing must-revalidate is left untouched.
     *
     * @returns This response, for chaining.
     */
    noCache(): IResponse;
    /**
     * Sets the status code and optionally applies a set of headers, skipping headers whose value is null
     * or undefined.
     *
     * @param code HTTP status code to set.
     * @param headers Optional headers to set on the response.
     * @returns This response, for chaining.
     */
    status(code: number, headers?: OutgoingHttpHeaders): IResponse;
    /**
     * Reads a response header value that has been set. Array values are returned JSON-stringified.
     *
     * @param name Name of the header to read.
     * @returns The header value as a string, or undefined if the header is not set.
     */
    get(name: string): string | void;
    /**
     * Sets a response header.
     *
     * @param field Header name.
     * @param value Header value (number, string or string array).
     * @returns This response, for chaining.
     */
    set(field: string, value: number | string | string[]): IResponse;
    /**
     * Sets the Content-Type header from a file extension using the MIME type lookup.
     *
     * @param extension File extension or type key (for example html, json) to resolve to a MIME type.
     * @returns This response, for chaining.
     */
    type(extension: string): IResponse;
    /**
     * Ends the response with the given body, inferring Content-Type when not set (html for strings, text
     * for numbers/booleans, bin for Buffers, json for objects) and setting Content-Length. For 204/304
     * statuses or HEAD requests the body is omitted; throws if headers were already sent, the body is
     * undefined, or the type is unsupported.
     *
     * @param chunk Response body: string, number, boolean, Buffer or JSON-serializable object.
     */
    send(chunk?: any): void;
    /**
     * Sets the status code and HTML content headers (Content-Type, plus optional Content-Length and
     * Content-Encoding) without sending a body.
     *
     * @param code HTTP status code.
     * @param contentLength Optional body length in bytes for the Content-Length header.
     * @param compress Optional compression type used for the Content-Encoding header.
     * @returns This response, for chaining.
     */
    asHTML(code: number, contentLength?: number, compress?: CompressionType): IResponse;
    /**
     * Sets the status code and JSON content headers (Content-Type, plus optional Content-Length and
     * Content-Encoding) without sending a body.
     *
     * @param code HTTP status code.
     * @param contentLength Optional body length in bytes for the Content-Length header.
     * @param compress Optional compression type used for the Content-Encoding header.
     * @returns This response, for chaining.
     */
    asJSON(code: number, contentLength?: number, compress?: CompressionType): IResponse;
    /**
     * Renders the template file at the given path for the context by delegating to the template parser.
     *
     * @param ctx Request context to render into.
     * @param path Path of the template to render.
     * @param status Optional response status information.
     * @returns A Promise that resolves when rendering has completed.
     */
    render(ctx: IContext, path: string, status?: IResInfo): Promise<void>;
    /**
     * Ends the response with a 302 redirect to the given URL; when forced, cache headers are first set to
     * prevent caching.
     *
     * @param url Target URL for the Location header.
     * @param force If true, disables caching of the redirect response.
     */
    redirect(url: string, force?: boolean): void;
    /**
     * Appends a Set-Cookie header built from the name, value and options, preserving previously set
     * cookies.
     *
     * @param name Cookie name.
     * @param val Cookie value.
     * @param options Cookie attributes such as expiry, path and flags.
     * @returns This response, for chaining.
     */
    cookie(name: string, val: string, options: CookieOptions): IResponse;
    /**
     * Ends the response with a 500 plain-text 'Runtime Error' message if the argument is an Error. Also
     * reports true when the response is no longer alive.
     *
     * @param err Value to check; treated as an error only if it is an Error instance.
     * @returns True if the response is not alive or an error response was sent; false otherwise.
     */
    sendIfError(err?: any): boolean;
    /**
     * Serializes the body to JSON and sends it as a JSON response, compressing it if requested.
     *
     * @param body Object to serialize as the JSON payload.
     * @param compress Optional compression type to apply.
     * @param next Optional callback invoked with an error if compression fails.
     */
    json(body: Record<string, any>, compress?: CompressionType, next?: (error: Error) => void): void;
    /**
     * Compresses the given data with the requested compression type and sends it with the given content
     * type.
     *
     * @param data String or Buffer to send.
     * @param contentType Content type key or MIME type of the data.
     * @param compress Optional compression type to apply.
     * @param next Optional callback invoked with an error if compression fails.
     */
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
     * Handles errors that occur during the response compression pipeline.
     *
     * Client disconnects and premature stream closures are treated as expected
     * conditions and are silently ignored. Only unexpected compression or I/O
     * errors are reported and propagated.
     *
     * @param error The error returned by the compression pipeline, or `null` if
     *              the pipeline completed successfully.
     * @param next Optional callback invoked with the error for additional
     *             application-level handling.
     */
    private _onCompressionError;
    /**
     * Compresses the response payload entirely in memory.
     *
     * This method is intended for relatively small payloads, allowing the
     * compressed size to be determined before sending the response so that
     * an accurate `Content-Length` header can be included.
     *
     * Supported compression algorithms:
     * - GZIP
     * - BROTLI
     *
     * @private
     * @param {Buffer} buffer - The response payload to compress.
     * @param {string} contentType - The MIME type or file extension used to determine the response `Content-Type`.
     * @param {CompressionType} [compress] - The compression algorithm to apply.
     * @param {(err: Error) => void} [next] - Optional callback invoked if compression fails.
     * @returns {void}
     */
    private _memoryCompress;
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
     * @param {number} statusCode - The status code the response was prepared with.
     * @param {(err: Error) => void} [next] - Invoked if compression fails.
     * @param {Error} [error] - The compression error, if any.
     * @returns {void}
     */
    private _onCompress;
    /**
     * Releases per-request state by clearing the stored method; when cleanSocket is set (or in test mode)
     * it also removes all listeners and destroys the socket.
     */
    dispose(): void;
}
export {};
