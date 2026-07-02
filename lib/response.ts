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

// 4:08 PM 2/7/2026
// by rajib chy

import {
    OutgoingHttpHeaders, ServerResponse
} from 'node:http';
import { toResponseTime, toString, type IResInfo } from './app-static';
import { HttpStatus } from './http-status';
import type { IContext } from './context';
import { Template } from './app-template';
import { Util } from './app-util';
import * as _zlib from 'node:zlib';
import * as _mimeType from './http-mime-types';

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
}

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
export type CompressionType =
    | "GZIP"
    | "BROTLI"
    | "ZSTD";

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
    compress(
        data: string | Buffer,
        contentType: string,
        compress?: CompressionType,
        next?: (error: Error) => void
    ): void;

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
    asHTML(
        code: number,
        contentLength?: number,
        compress?: CompressionType
    ): IResponse;

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
    asJSON(
        code: number,
        contentLength?: number,
        compress?: CompressionType
    ): IResponse;

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
    send(chunk?: Buffer | string | number | boolean | { [key: string]: any }): void;

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

/**
 * Minimum response size (in bytes) required before HTTP compression is applied.
 * Defaults to 8 KiB if the COMPRESSION_THRESHOLD environment variable is missing
 * or contains an invalid value.
 */
const COMPRESSION_THRESHOLD = (() => {
    const value = Number(process.env.COMPRESSION_THRESHOLD);
    return Number.isFinite(value) ? value : 8 * 1024;
})();

export class Response extends ServerResponse implements IResponse {
    private _isAlive: boolean | undefined;
    private _method: string | undefined;
    private _cleanSocket: boolean | undefined;
    private _statusCode: number | undefined;

    // @ts-ignore
    public get statusCode(): number {
        return this._statusCode === undefined ? 0 : this._statusCode;
    }

    public set statusCode(code: number) {
        if (!HttpStatus.isValidCode(code))
            throw new Error(`Invalid status code ${code}`);
        this._statusCode = code;
    }

    public get cleanSocket(): boolean {
        if (this._cleanSocket === undefined)
            return false;
        return this._cleanSocket;
    }

    public set cleanSocket(val: boolean) {
        this._cleanSocket = val;
    }

    public get isAlive(): boolean {
        if (this._isAlive !== undefined)
            return this._isAlive;

        this._isAlive = true;
        return this._isAlive;
    }

    public set isAlive(val: boolean) {
        this._isAlive = val;
    }

    public get method(): string {
        return toString(this._method);
    }

    public set method(val: string) {
        this._method = val;
    }

    public noCache(): IResponse {
        const header = this.get('cache-control');

        if (header) {

            if (header.includes('must-revalidate')) {
                return this;
            }

            this.removeHeader('cache-control');
        }

        this.setHeader(
            'cache-control', 'no-store, no-cache, must-revalidate, immutable'
        );
        return this;
    }

    public status(code: number, headers?: OutgoingHttpHeaders): IResponse {
        this.statusCode = code;

        if (headers) {
            for (const name in headers) {
                const val = headers[name];
                if (val == null) continue;
                this.setHeader(name, val);
            }
        }

        return this;
    }

    public get(name: string): string | void {
        const val = this.getHeader(name);

        if (val) {

            if (Array.isArray(val)) {
                return JSON.stringify(val);
            }

            return toString(val);
        }
    }

    public set(field: string, value: number | string | string[]): IResponse {
        return this.setHeader(
            field, value
        ), this;
    }

    public type(extension: string): IResponse {
        return this.setHeader(
            'Content-Type', _mimeType.getMimeType(extension)
        ), this;
    }

    public send(chunk?: any): void {

        if (this.headersSent) {
            throw new Error("If you use res.writeHead(), invoke res.end() instead of res.send().");
        }

        if (this.statusCode === 204 || this.statusCode === 304) {
            this.removeHeader("Content-Type");
            this.removeHeader("Content-Length");
            this.removeHeader("Transfer-Encoding");
            this.end();
            return;
        }

        if (this.method === "HEAD") {
            this.end();
            return;
        }

        switch (typeof chunk) {

            case "undefined":
                throw new Error("Response body is required.");

            case "string":
                if (!this.get("Content-Type")) {
                    this.type("html");
                }
                break;

            case "number":
            case "boolean":
                if (!this.get("Content-Type")) {
                    this.type("text");
                }
                chunk = String(chunk);
                break;

            case "object":
                if (Buffer.isBuffer(chunk)) {
                    if (!this.get("Content-Type")) {
                        this.type("bin");
                    }
                } else {
                    if (!this.get("Content-Type")) {
                        this.type("json");
                    }
                    chunk = JSON.stringify(chunk);
                }
                break;

            default:
                throw new TypeError(`Unsupported response body type: ${typeof chunk}.`);
        }

        const buffer = Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(chunk, "utf8");

        this.set("Content-Length", buffer.length);

        this.end(buffer);
    }

    public asHTML(
        code: number, contentLength?: number, compress?: CompressionType
    ): IResponse {
        return this.status(
            code, getCommonHeader(
                _mimeType.getMimeType("html"),
                contentLength, compress
            )
        ), this;
    }

    public asJSON(
        code: number, contentLength?: number, compress?: CompressionType
    ): IResponse {
        return this.status(
            code, getCommonHeader(
                _mimeType.getMimeType('json'),
                contentLength, compress
            )
        ), this;
    }

    public render(ctx: IContext, path: string, status?: IResInfo): void {
        return Template.parse(ctx, path, status);
    }

    public redirect(url: string, force?: boolean): void {

        if (force) {
            this.noCache();
        }

        return this.status(this.statusCode, {
            'Location': url
        }).end(), void 0;
    }

    public cookie(name: string, val: string, options: CookieOptions): IResponse {
        const existing = this.getHeader('Set-Cookie');

        this.setHeader(
            'Set-Cookie',
            [
                ...(Array.isArray(existing) ? existing : []),
                createCookie(name, val, options)
            ]
        );

        return this;
    }

    public sendIfError(err?: any): boolean {
        if (!this.isAlive)
            return true;

        if (!err || !Util.isError(err))
            return false;

        this.status(500, {
            'Content-Type': _mimeType.getMimeType('text')
        }).end(`Runtime Error: ${err.message}`);

        return true;
    }

    public json(
        body: NodeJS.Dict<any>,
        compress?: CompressionType,
        next?: (error: Error) => void
    ): void {

        const buffer = Buffer.from(
            JSON.stringify(body), "utf8"
        );

        return this._compressData(
            buffer, "json", compress, next
        );

    }

    public compress(
        data: string | Buffer,
        contentType: string,
        compress?: CompressionType,
        next?: (error: Error) => void
    ): void {

        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

        return this._compressData(
            buffer, contentType, compress, next
        );
    }

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
    private _compressData(
        buffer: Buffer,
        contentType: string,
        compress?: CompressionType,
        next?: (err: Error) => void
    ): void {

        const shouldCompress = !compress ? false : (
            buffer.length >= COMPRESSION_THRESHOLD
        );

        if (!shouldCompress) {

            this.status(200, getCommonHeader(
                _mimeType.getMimeType(contentType)
            )).end(buffer);

            return;
        }

        if (compress === 'GZIP') {

            return _zlib.gzip(
                buffer, { level: _zlib.constants.Z_DEFAULT_COMPRESSION },
                (error, compressed) => this._onCompress(
                    contentType, compressed, compress, next, error
                )
            );
        }

        if (compress === "BROTLI") {
            return _zlib.brotliCompress(
                buffer,
                {
                    params: {
                        [_zlib.constants.BROTLI_PARAM_QUALITY]:
                            _zlib.constants.BROTLI_DEFAULT_QUALITY
                    }
                },
                (error, compressed) => this._onCompress(
                    contentType, compressed, compress, next, error
                )
            );
        }

        throw new Error(`This compression type "${compress}" not supported.`)

    }

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
    private _onCompress(
        contentType: string,
        compressed: Buffer,
        compress: CompressionType,
        next?: (err: Error) => void,
        error?: Error
    ): void {

        if (!this.isAlive) {
            console.warn(`Connection Disconnected. Compression type: "${compress}"`)
            return;
        }

        if (error) {
            next?.(error);
            this.sendIfError(error);
            return;
        }

        this.status(
            200, getCommonHeader(
                _mimeType.getMimeType(contentType),
                compressed.length, compress
            )
        ).end(compressed);
    }

    public dispose(): void {
        delete this._method;
        if (this.cleanSocket || process.env.TASK_TYPE === 'TEST') {
            this.removeAllListeners();
            this.destroy();
        }
    }
}

/**
 * Creates a common set of HTTP response headers.
 *
 * The returned header collection always includes a `Content-Type` header and
 * optionally includes `Content-Length` and `Content-Encoding` when their
 * corresponding arguments are provided.
 *
 * @param {string} contentType
 * The MIME type to assign to the `Content-Type` header.
 *
 * @param {number} [contentLength]
 * The size of the response body in bytes. When specified, a
 * `Content-Length` header is included.
 *
 * @param {boolean} [isGzip]
 * Indicates whether the response body is gzip-compressed. When `true`,
 * a `Content-Encoding: gzip` header is included.
 *
 * @returns {OutgoingHttpHeaders}
 * A collection of HTTP response headers suitable for use with
 * `ServerResponse.writeHead()` or `ServerResponse.setHeader()`.
 */
function getCommonHeader(
    contentType: string,
    contentLength?: number,
    compress?: CompressionType
): OutgoingHttpHeaders {

    const header: OutgoingHttpHeaders = {
        'Content-Type': contentType
    };

    if (typeof (contentLength) === 'number') {
        header['Content-Length'] = contentLength;
    }

    if (compress) {
        header['Content-Encoding'] = compress.toLowerCase();
    }

    return header;
}

/**
 * Creates the value of a `Set-Cookie` response header.
 *
 * The cookie string is constructed from the supplied name, value, and
 * configuration options. If no path is specified, the cookie defaults to
 * the root path (`/`).
 *
 * When both `expires` and `maxAge` are provided, `expires` takes precedence.
 * If only `maxAge` is specified, an expiration date is calculated relative
 * to the current time.
 *
 * Supported cookie attributes include:
 * - `Domain`
 * - `Path`
 * - `Expires`
 * - `Secure`
 * - `HttpOnly`
 * - `SameSite`
 *
 * @param {string} name
 * The cookie name.
 *
 * @param {string} val
 * The cookie value.
 *
 * @param {CookieOptions} options
 * Options that control the cookie's scope, lifetime, and security attributes.
 *
 * @returns {string}
 * A formatted `Set-Cookie` header value.
 */
function createCookie(
    name: string,
    val: string,
    options: CookieOptions
): string {
    let str = `${name}=${val}`;
    if (options.domain)
        str += `;Domain=${options.domain}`;
    if (options.path) {
        str += `;Path=${options.path}`;
    } else {
        str += ';Path=/';
    }
    if (options.expires && !options.maxAge)
        str += `;Expires=${toResponseTime(options.expires)}`;
    if (options.maxAge && !options.expires)
        str += `;Expires=${toResponseTime(Date.now() + options.maxAge)}`;
    if (options.secure)
        str += '; Secure';
    if (options.httpOnly)
        str += '; HttpOnly';
    if (options.sameSite) {
        switch (options.sameSite) {
            case true: str += ';SameSite=Strict'; break;
            case 'lax': str += ';SameSite=Lax'; break;
            case 'strict': str += ';SameSite=Strict'; break;
            case 'none': str += ';SameSite=None'; break;
        }
    }
    return str;
}