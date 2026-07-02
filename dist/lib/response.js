"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Response = void 0;
// 4:08 PM 2/7/2026
// by rajib chy
const node_http_1 = require("node:http");
const app_static_1 = require("./app-static");
const http_status_1 = require("./http-status");
const app_template_1 = require("./app-template");
const app_util_1 = require("./app-util");
const _zlib = __importStar(require("node:zlib"));
const _mimeType = __importStar(require("./http-mime-types"));
/**
 * Minimum response size (in bytes) required before HTTP compression is applied.
 * Defaults to 8 KiB if the COMPRESSION_THRESHOLD environment variable is missing
 * or contains an invalid value.
 */
const COMPRESSION_THRESHOLD = (() => {
    const value = Number(process.env.COMPRESSION_THRESHOLD);
    return Number.isFinite(value) ? value : 8 * 1024;
})();
class Response extends node_http_1.ServerResponse {
    // @ts-ignore
    get statusCode() {
        return this._statusCode === undefined ? 0 : this._statusCode;
    }
    set statusCode(code) {
        if (!http_status_1.HttpStatus.isValidCode(code))
            throw new Error(`Invalid status code ${code}`);
        this._statusCode = code;
    }
    get cleanSocket() {
        if (this._cleanSocket === undefined)
            return false;
        return this._cleanSocket;
    }
    set cleanSocket(val) {
        this._cleanSocket = val;
    }
    get isAlive() {
        if (this._isAlive !== undefined)
            return this._isAlive;
        this._isAlive = true;
        return this._isAlive;
    }
    set isAlive(val) {
        this._isAlive = val;
    }
    get method() {
        return (0, app_static_1.toString)(this._method);
    }
    set method(val) {
        this._method = val;
    }
    noCache() {
        const header = this.get('cache-control');
        if (header) {
            if (header.includes('must-revalidate')) {
                return this;
            }
            this.removeHeader('cache-control');
        }
        this.setHeader('cache-control', 'no-store, no-cache, must-revalidate, immutable');
        return this;
    }
    status(code, headers) {
        this.statusCode = code;
        if (headers) {
            for (const name in headers) {
                const val = headers[name];
                if (val == null)
                    continue;
                this.setHeader(name, val);
            }
        }
        return this;
    }
    get(name) {
        const val = this.getHeader(name);
        if (val) {
            if (Array.isArray(val)) {
                return JSON.stringify(val);
            }
            return (0, app_static_1.toString)(val);
        }
    }
    set(field, value) {
        return this.setHeader(field, value), this;
    }
    type(extension) {
        return this.setHeader('Content-Type', _mimeType.getMimeType(extension)), this;
    }
    send(chunk) {
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
                }
                else {
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
    asHTML(code, contentLength, compress) {
        return this.status(code, getCommonHeader(_mimeType.getMimeType("html"), contentLength, compress)), this;
    }
    asJSON(code, contentLength, compress) {
        return this.status(code, getCommonHeader(_mimeType.getMimeType('json'), contentLength, compress)), this;
    }
    render(ctx, path, status) {
        return app_template_1.Template.parse(ctx, path, status);
    }
    redirect(url, force) {
        if (force) {
            this.noCache();
        }
        return this.status(this.statusCode, {
            'Location': url
        }).end(), void 0;
    }
    cookie(name, val, options) {
        const existing = this.getHeader('Set-Cookie');
        this.setHeader('Set-Cookie', [
            ...(Array.isArray(existing) ? existing : []),
            createCookie(name, val, options)
        ]);
        return this;
    }
    sendIfError(err) {
        if (!this.isAlive)
            return true;
        if (!err || !app_util_1.Util.isError(err))
            return false;
        this.status(500, {
            'Content-Type': _mimeType.getMimeType('text')
        }).end(`Runtime Error: ${err.message}`);
        return true;
    }
    json(body, compress, next) {
        const buffer = Buffer.from(JSON.stringify(body), "utf8");
        return this._compressData(buffer, "json", compress, next);
    }
    compress(data, contentType, compress, next) {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
        return this._compressData(buffer, contentType, compress, next);
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
    _compressData(buffer, contentType, compress, next) {
        const shouldCompress = !compress ? false : (buffer.length >= COMPRESSION_THRESHOLD);
        if (!shouldCompress) {
            this.status(200, getCommonHeader(_mimeType.getMimeType(contentType))).end(buffer);
            return;
        }
        if (compress === 'GZIP') {
            return _zlib.gzip(buffer, { level: _zlib.constants.Z_DEFAULT_COMPRESSION }, (error, compressed) => this._onCompress(contentType, compressed, compress, next, error));
        }
        if (compress === "BROTLI") {
            return _zlib.brotliCompress(buffer, {
                params: {
                    [_zlib.constants.BROTLI_PARAM_QUALITY]: _zlib.constants.BROTLI_DEFAULT_QUALITY
                }
            }, (error, compressed) => this._onCompress(contentType, compressed, compress, next, error));
        }
        throw new Error(`This compression type "${compress}" not supported.`);
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
    _onCompress(contentType, compressed, compress, next, error) {
        if (!this.isAlive) {
            console.warn(`Connection Disconnected. Compression type: "${compress}"`);
            return;
        }
        if (error) {
            next === null || next === void 0 ? void 0 : next(error);
            this.sendIfError(error);
            return;
        }
        this.status(200, getCommonHeader(_mimeType.getMimeType(contentType), compressed.length, compress)).end(compressed);
    }
    dispose() {
        delete this._method;
        if (this.cleanSocket || process.env.TASK_TYPE === 'TEST') {
            this.removeAllListeners();
            this.destroy();
        }
    }
}
exports.Response = Response;
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
function getCommonHeader(contentType, contentLength, compress) {
    const header = {
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
function createCookie(name, val, options) {
    let str = `${name}=${val}`;
    if (options.domain)
        str += `;Domain=${options.domain}`;
    if (options.path) {
        str += `;Path=${options.path}`;
    }
    else {
        str += ';Path=/';
    }
    if (options.expires && !options.maxAge)
        str += `;Expires=${(0, app_static_1.toResponseTime)(options.expires)}`;
    if (options.maxAge && !options.expires)
        str += `;Expires=${(0, app_static_1.toResponseTime)(Date.now() + options.maxAge)}`;
    if (options.secure)
        str += '; Secure';
    if (options.httpOnly)
        str += '; HttpOnly';
    if (options.sameSite) {
        switch (options.sameSite) {
            case true:
                str += ';SameSite=Strict';
                break;
            case 'lax':
                str += ';SameSite=Lax';
                break;
            case 'strict':
                str += ';SameSite=Strict';
                break;
            case 'none':
                str += ';SameSite=None';
                break;
        }
    }
    return str;
}
//# sourceMappingURL=response.js.map