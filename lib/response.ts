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
import { Readable } from "node:stream";
import { pipeline } from "node:stream";
import * as _zlib from 'node:zlib';
import { promisify } from 'node:util';
import { toResponseTime, toString, type IResInfo } from './app-static';
import { HttpStatus } from './http-status';
import type { IContext } from './context';
import { Template } from './app-template';
import { Util } from './app-util';
import * as _mimeType from './http-mime-types';
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

/**
 * Maximum payload size (in bytes) eligible for in-memory compression.
 *
 * Responses whose payload size is less than or equal to this limit are
 * compressed entirely in memory, allowing an accurate `Content-Length`
 * header to be sent. Larger responses are compressed using a streaming
 * pipeline to reduce peak memory usage.
 *
 * The value can be configured using the
 * `DEFAULT_MAX_MEMORY_COMPRESS_SIZE` environment variable.
 *
 * Default: `64 * 1024` (64 KiB)
 */
const DEFAULT_MAX_MEMORY_COMPRESS_SIZE = (() => {
    const value = Number(process.env.DEFAULT_MAX_MEMORY_COMPRESS_SIZE);
    return Number.isFinite(value) ? value : 64 * 1024;
})();

const GZIP_OPTIONS = {
    level: _zlib.constants.Z_DEFAULT_COMPRESSION
};

/**
 * Brotli quality used for responses that are compressed on the fly.
 *
 * Quality 11 (the zlib default) is meant for assets that are compressed once
 * and served many times; on a request path it is more than an order of
 * magnitude slower than quality 4-5 for a small gain in size.
 *
 * The value can be configured (0-11) using the `DEFAULT_BROTLI_QUALITY`
 * environment variable.
 *
 * Default: `4`
 */
const BROTLI_QUALITY = (() => {
    const value = Number(process.env.DEFAULT_BROTLI_QUALITY);
    return Number.isInteger(value) && value >= 0 && value <= 11 ? value : 4;
})();

const BROTLI_OPTIONS = {
    params: {
        [_zlib.constants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY
    }
};

const _gzipAsync = promisify(_zlib.gzip);
const _brotliAsync = promisify(_zlib.brotliCompress);

export class Response extends ServerResponse implements IResponse {
    private _isAlive: boolean | undefined;
    private _method: string | undefined;
    private _cleanSocket: boolean | undefined;
    private _statusCode: number | undefined;

    /**
     * Gets the HTTP status code set on this response.
     *
     * @returns The status code, or 0 if none has been set.
     */
    // @ts-ignore
    public get statusCode(): number {
        return this._statusCode === undefined ? 0 : this._statusCode;
    }

    /**
     * Sets the HTTP status code after validating it; throws an Error if the code is not a valid HTTP
     * status.
     *
     * @param code HTTP status code to assign.
     */
    public set statusCode(code: number) {
        if (!HttpStatus.isValidCode(code))
            throw new Error(`Invalid status code ${code}`);
        this._statusCode = code;
    }

    /**
     * Indicates whether the underlying socket should be destroyed when this response is disposed.
     *
     * @returns True if socket cleanup is enabled, otherwise false (default).
     */
    public get cleanSocket(): boolean {
        if (this._cleanSocket === undefined)
            return false;
        return this._cleanSocket;
    }

    /**
     * Sets whether the socket should be cleaned up (listeners removed and destroyed) on dispose.
     *
     * @param val True to destroy the socket on dispose.
     */
    public set cleanSocket(val: boolean) {
        this._cleanSocket = val;
    }

    /**
     * Indicates whether the response is still considered alive (usable) for further processing.
     *
     * @returns True unless it has been explicitly marked as not alive; defaults to true.
     */
    public get isAlive(): boolean {
        if (this._isAlive !== undefined)
            return this._isAlive;

        this._isAlive = true;
        return this._isAlive;
    }

    /**
     * Marks the response as alive or no longer alive.
     *
     * @param val The alive flag to store.
     */
    public set isAlive(val: boolean) {
        this._isAlive = val;
    }

    /**
     * Gets the HTTP method of the originating request recorded on this response.
     *
     * @returns The method string, or an empty string if not set.
     */
    public get method(): string {
        return toString(this._method);
    }

    /**
     * Records the HTTP method of the originating request on this response.
     *
     * @param val HTTP method name, such as GET or HEAD.
     */
    public set method(val: string) {
        this._method = val;
    }

    /**
     * Sets the cache-control header to no-store, max-age=0 so clients do not cache the response; an
     * existing header containing must-revalidate is left untouched.
     *
     * @returns This response, for chaining.
     */
    public noCache(): IResponse {
        const header = this.get('cache-control');

        if (header) {

            if (header.includes('must-revalidate')) {
                return this;
            }

            this.removeHeader('cache-control');
        }

        this.setHeader(
            'cache-control', 'no-store, max-age=0'
        );
        return this;
    }

    /**
     * Sets the status code and optionally applies a set of headers, skipping headers whose value is null
     * or undefined.
     *
     * @param code HTTP status code to set.
     * @param headers Optional headers to set on the response.
     * @returns This response, for chaining.
     */
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

    /**
     * Reads a response header value that has been set. Array values are returned JSON-stringified.
     *
     * @param name Name of the header to read.
     * @returns The header value as a string, or undefined if the header is not set.
     */
    public get(name: string): string | void {
        const val = this.getHeader(name);

        if (val) {

            if (Array.isArray(val)) {
                return JSON.stringify(val);
            }

            return toString(val);
        }
    }

    /**
     * Sets a response header.
     *
     * @param field Header name.
     * @param value Header value (number, string or string array).
     * @returns This response, for chaining.
     */
    public set(field: string, value: number | string | string[]): IResponse {
        return this.setHeader(
            field, value
        ), this;
    }

    /**
     * Sets the Content-Type header from a file extension using the MIME type lookup.
     *
     * @param extension File extension or type key (for example html, json) to resolve to a MIME type.
     * @returns This response, for chaining.
     */
    public type(extension: string): IResponse {
        return this.setHeader(
            'Content-Type', _mimeType.getMimeType(extension)
        ), this;
    }

    /**
     * Ends the response with the given body, inferring Content-Type when not set (html for strings, text
     * for numbers/booleans, bin for Buffers, json for objects) and setting Content-Length. For 204/304
     * statuses or HEAD requests the body is omitted; throws if headers were already sent, the body is
     * undefined, or the type is unsupported.
     *
     * @param chunk Response body: string, number, boolean, Buffer or JSON-serializable object.
     */
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

        // pipeline(
        //     Readable.from([buffer]), this,
        //     (error) => this._onCompressionError(error)
        // );
    }

    /**
     * Sets the status code and HTML content headers (Content-Type, plus optional Content-Length and
     * Content-Encoding) without sending a body.
     *
     * @param code HTTP status code.
     * @param contentLength Optional body length in bytes for the Content-Length header.
     * @param compress Optional compression type used for the Content-Encoding header.
     * @returns This response, for chaining.
     */
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

    /**
     * Sets the status code and JSON content headers (Content-Type, plus optional Content-Length and
     * Content-Encoding) without sending a body.
     *
     * @param code HTTP status code.
     * @param contentLength Optional body length in bytes for the Content-Length header.
     * @param compress Optional compression type used for the Content-Encoding header.
     * @returns This response, for chaining.
     */
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

    /**
     * Renders the template file at the given path for the context by delegating to the template parser.
     *
     * @param ctx Request context to render into.
     * @param path Path of the template to render.
     * @param status Optional response status information.
     * @returns A Promise that resolves when rendering has completed.
     */
    public render(ctx: IContext, path: string, status?: IResInfo): Promise<void> {
        return Template.parse(ctx, path, status);
    }

    /**
     * Ends the response with a 302 redirect to the given URL; when forced, cache headers are first set to
     * prevent caching.
     *
     * @param url Target URL for the Location header.
     * @param force If true, disables caching of the redirect response.
     */
    public redirect(url: string, force?: boolean): void {

        if (force) {
            this.noCache();
        }

        this.statusCode = 302;

        return this.status(this.statusCode, {
            'Location': url
        }).end(), void 0;
    }

    /**
     * Appends a Set-Cookie header built from the name, value and options, preserving previously set
     * cookies.
     *
     * @param name Cookie name.
     * @param val Cookie value.
     * @param options Cookie attributes such as expiry, path and flags.
     * @returns This response, for chaining.
     */
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

    /**
     * Ends the response with a 500 plain-text 'Runtime Error' message if the argument is an Error. Also
     * reports true when the response is no longer alive.
     *
     * @param err Value to check; treated as an error only if it is an Error instance.
     * @returns True if the response is not alive or an error response was sent; false otherwise.
     */
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

    /**
     * Serializes the body to JSON and sends it as a JSON response, compressing it if requested.
     *
     * @param body Object to serialize as the JSON payload.
     * @param compress Optional compression type to apply.
     * @param next Optional callback invoked with an error if compression fails.
     */
    public json(
        body: Record<string, any>,
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

    /**
     * Compresses the given data with the requested compression type and sends it with the given content
     * type.
     *
     * @param data String or Buffer to send.
     * @param contentType Content type key or MIME type of the data.
     * @param compress Optional compression type to apply.
     * @param next Optional callback invoked with an error if compression fails.
     */
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

        if (this.headersSent) {
            throw new Error("Header already flushed.");
        }

        const contentLength = buffer.length;

        const shouldCompress = !compress ? false : (
            contentLength >= COMPRESSION_THRESHOLD
        );

        const statusCode = this._statusCode > 0 ? this._statusCode : 200;

        if (!shouldCompress) {

            this.status(statusCode, getCommonHeader(
                _mimeType.getMimeType(contentType), contentLength
            )).end(buffer);

            return;
        }

        if (!(compress === 'gzip' || compress === "br")) {
            throw new Error(`This compression type "${compress}" not supported.`);
        }

        if (contentLength <= DEFAULT_MAX_MEMORY_COMPRESS_SIZE) {

            return void this._memoryCompress(
                buffer, contentType, compress, statusCode, next
            );

        }

        this.status(statusCode, getCommonHeader(
            _mimeType.getMimeType(contentType), null, compress
        ));

        const compressor
            = compress === "gzip"
                ? _zlib.createGzip(GZIP_OPTIONS)
                : _zlib.createBrotliCompress(BROTLI_OPTIONS)
            ;

        pipeline(
            Readable.from([buffer]), compressor, this,
            (error) => this._onCompressionError(error, next)
        );

    }

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
    private _onCompressionError(
        error: NodeJS.ErrnoException | null | undefined,
        next?: (err?: Error) => void
    ): void {

        if (!error) {
            return;
        }

        const clientAborted =
            !this.isAlive ||
            error.code === "ERR_STREAM_PREMATURE_CLOSE" ||
            this.destroyed ||
            this.writableEnded;

        if (clientAborted) {
            return;
        }

        console.error('Pipeline error:', error);

        this.sendIfError(error);

        next?.(error);
    }

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
    private async _memoryCompress(
        buffer: Buffer,
        contentType: string,
        compress: CompressionType,
        statusCode: number,
        next?: (err: Error) => void
    ): Promise<void> {

        let compressed: Buffer | undefined;
        let error: Error | undefined;

        try {
            compressed = compress === 'gzip'
                ? await _gzipAsync(buffer, GZIP_OPTIONS)
                : await _brotliAsync(buffer, BROTLI_OPTIONS);
        } catch (ex: any) {
            error = ex;
        }

        this._onCompress(
            contentType, compressed, compress, statusCode, next, error
        );
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
     * @param {number} statusCode - The status code the response was prepared with.
     * @param {(err: Error) => void} [next] - Invoked if compression fails.
     * @param {Error} [error] - The compression error, if any.
     * @returns {void}
     */
    private _onCompress(
        contentType: string,
        compressed: Buffer | undefined,
        compress: CompressionType,
        statusCode: number,
        next?: (err: Error) => void,
        error?: Error
    ): void {

        if (!this.isAlive) {
            console.warn(`Connection Disconnected. Compression type: "${compress}"`);
            return;
        }

        if (error) {
            next?.(error);
            this.sendIfError(error);
            return;
        }

        this.status(
            statusCode, getCommonHeader(
                _mimeType.getMimeType(contentType),
                compressed.length, compress
            )
        ).end(compressed);
    }

    /**
     * Releases per-request state by clearing the stored method; when cleanSocket is set (or in test mode)
     * it also removes all listeners and destroys the socket.
     */
    public dispose(): void {
        this._method = null;
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
        header['Content-Encoding'] = compress;
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