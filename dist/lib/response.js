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
            if (header.indexOf('must-revalidate') > -1) {
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
                if (!val)
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
                return app_util_1.Util.JSON.stringify(val);
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
            throw new Error("If you use res.writeHead(), invoke res.end() instead of res.send()");
        }
        if (204 === this.statusCode || 304 === this.statusCode) {
            this.removeHeader('Content-Type');
            this.removeHeader('Content-Length');
            this.removeHeader('Transfer-Encoding');
            return this.end(), void 0;
        }
        if (this.method === "HEAD") {
            return this.end(), void 0;
        }
        switch (typeof (chunk)) {
            case 'undefined': throw new Error("Body required....");
            case 'string':
                if (!this.get('Content-Type')) {
                    this.type('html');
                }
                break;
            case 'boolean':
            case 'number':
                if (!this.get('Content-Type')) {
                    this.type('text');
                }
                chunk = String(chunk);
            case 'object':
                if (Buffer.isBuffer(chunk)) {
                    if (!this.get('Content-Type')) {
                        this.type('bin');
                    }
                }
                else {
                    this.type("json");
                    chunk = app_util_1.Util.JSON.stringify(chunk);
                }
                break;
        }
        let len = 0;
        if (Buffer.isBuffer(chunk)) {
            // get length of Buffer
            len = chunk.length;
        }
        else {
            // convert chunk to Buffer and calculate
            chunk = Buffer.from(chunk, "utf-8");
            len = chunk.length;
        }
        this.set('Content-Length', len);
        return this.end(chunk), void 0;
    }
    asHTML(code, contentLength, isGzip) {
        return this.status(code, getCommonHeader(_mimeType.getMimeType("html"), contentLength, isGzip)), this;
    }
    asJSON(code, contentLength, isGzip) {
        return this.status(code, getCommonHeader(_mimeType.getMimeType('json'), contentLength, isGzip)), this;
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
        let sCookie = this.getHeader('Set-Cookie');
        if (Array.isArray(sCookie)) {
            this.removeHeader('Set-Cookie');
        }
        else {
            sCookie = [];
        }
        sCookie.push(createCookie(name, val, options));
        return this.setHeader('Set-Cookie', sCookie), this;
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
        const buffer = Buffer.from(app_util_1.Util.JSON.stringify(body), "utf-8");
        if (typeof (compress) === 'boolean' && compress === true) {
            return _zlib.gzip(buffer, (error, buff) => {
                if (!this.sendIfError(error)) {
                    this.asJSON(200, buff.length, true).end(buff);
                }
            }), void 0;
        }
        return this.asJSON(200, buffer.length).end(buffer), void 0;
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
function getCommonHeader(contentType, contentLength, isGzip) {
    const header = {
        'Content-Type': contentType
    };
    if (typeof (contentLength) === 'number') {
        header['Content-Length'] = contentLength;
    }
    if (typeof (isGzip) === 'boolean' && isGzip === true) {
        header['Content-Encoding'] = 'gzip';
    }
    return header;
}
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
        str += `;Expires=${(0, app_static_1.ToResponseTime)(options.expires)}`;
    if (options.maxAge && !options.expires)
        str += `;Expires=${(0, app_static_1.ToResponseTime)(Date.now() + options.maxAge)}`;
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