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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Request = void 0;
// 4:03 PM 2/7/2026
// by rajib chy
const node_http_1 = require("node:http");
const app_static_1 = require("./app-static");
const app_util_1 = require("./app-util");
const help_1 = require("./help");
const MOBILE_RE = /mobile/i;
/**
 * The server's preferred response compression algorithm.
 *
 * This value is read from the `DEFAULT_CONTENT_COMPRESSION` environment
 * variable and defaults to `"gzip"` when not specified.
 */
const _DEFAULT_CONTENT_COMPRESSION = (_a = process.env.DEFAULT_CONTENT_COMPRESSION) !== null && _a !== void 0 ? _a : "gzip";
class Request extends node_http_1.IncomingMessage {
    get isMobile() {
        if (this._isMobile !== undefined)
            return this._isMobile;
        const userAgent = (0, app_static_1.toString)(this.get('user-agent'));
        this._isMobile = MOBILE_RE.test(userAgent);
        return this._isMobile;
    }
    get cleanSocket() {
        if (this._cleanSocket === undefined)
            return false;
        return this._cleanSocket;
    }
    set cleanSocket(val) {
        this._cleanSocket = val;
    }
    get q() {
        if (this._q !== undefined)
            return this._q;
        this._q = (0, help_1.parseUrl)(this.url);
        return this._q;
    }
    get cookies() {
        if (this._cookies !== undefined)
            return this._cookies;
        this._cookies = (0, help_1.parseCookie)(this.headers.cookie);
        return this._cookies;
    }
    get session() {
        return this._session || Object.create({});
    }
    set session(val) {
        this._session = val;
    }
    get isLocal() {
        if (this._isLocal !== undefined)
            return this._isLocal;
        this._isLocal = this.ip === '::1' || this.ip === '127.0.0.1';
        return this._isLocal;
    }
    get path() {
        if (this._path !== undefined)
            return this._path;
        this._path = decodeURIComponent((0, help_1.escapePath)(this.q.pathname));
        return this._path;
    }
    set path(val) {
        this._path = val;
    }
    get ip() {
        if (this._ip !== undefined)
            return this._ip;
        this._ip = (0, help_1.getClientIp)(this);
        return this._ip;
    }
    get id() {
        if (!this._id) {
            this._id = app_util_1.Util.guid();
        }
        return this._id;
    }
    get query() {
        return this.q.query;
    }
    /**
     * Retrieves the value of an HTTP request header.
     *
     * @param name - The header name. Header names are matched using Node.js'
     * normalized lowercase keys (for example, `"content-type"` or
     * `"accept-encoding"`).
     * @returns The header value as a string, or `undefined` if the header is not present.
     */
    get(name) {
        const val = this.headers[name];
        if (val !== undefined) {
            return String(val);
        }
    }
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
    acceptEncoding() {
        const encoding = this.get('accept-encoding');
        if (!encoding)
            return null;
        // Check if the client supports our explicitly preferred server default first
        if (encoding.includes(_DEFAULT_CONTENT_COMPRESSION))
            return _DEFAULT_CONTENT_COMPRESSION;
        if (encoding.includes('br'))
            return 'br';
        // Strict fallback ladder if the server default isn't matched
        if (encoding.includes('gzip'))
            return 'gzip';
        // zstd not supported write now. will be implement
        return null;
    }
    setSocketNoDelay(noDelay) {
        if (this.socket) {
            this.socket.setNoDelay(noDelay);
        }
    }
    dispose() {
        delete this._id;
        delete this._q;
        delete this._ip;
        delete this._path;
        delete this._cookies;
        delete this._isLocal;
        if (this.cleanSocket || process.env.TASK_TYPE === 'TEST') {
            this.removeAllListeners();
            this.destroy();
        }
    }
}
exports.Request = Request;
//# sourceMappingURL=request.js.map