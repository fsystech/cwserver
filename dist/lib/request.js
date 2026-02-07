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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Request = void 0;
// 4:03 PM 2/7/2026
// by rajib chy
const node_http_1 = require("node:http");
const app_static_1 = require("./app-static");
const app_util_1 = require("./app-util");
const help_1 = require("./help");
const MOBILE_RE = /mobile/i;
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
        if (this._id !== undefined)
            return this._id;
        this._id = app_util_1.Util.guid();
        return this._id;
    }
    get query() {
        return this.q.query;
    }
    get(name) {
        const val = this.headers[name];
        if (val !== undefined) {
            return String(val);
        }
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