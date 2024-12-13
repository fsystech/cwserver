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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.readAppVersion = exports.appVersion = void 0;
exports.parseCookie = parseCookie;
exports.escapePath = escapePath;
exports.getClientIp = getClientIp;
exports.parseUrl = parseUrl;
exports.App = App;
// 2:40 PM 5/7/2020
// by rajib chy
require("./app-global");
const node_http_1 = require("node:http");
const node_events_1 = require("node:events");
const app_router_1 = require("./app-router");
const app_static_1 = require("./app-static");
const http_status_1 = require("./http-status");
const app_template_1 = require("./app-template");
const app_util_1 = require("./app-util");
const fs_1 = require("fs");
const node_path_1 = require("node:path");
const node_url_1 = __importDefault(require("node:url"));
const _zlib = __importStar(require("node:zlib"));
const _mimeType = __importStar(require("./http-mime-types"));
_a = (() => {
    let _appVersion = '3.1.5';
    const _readAppVersion = () => {
        const libRoot = (0, app_util_1.getAppDir)();
        const absPath = (0, node_path_1.resolve)(`${libRoot}/package.json`);
        (0, app_util_1.assert)((0, fs_1.existsSync)(absPath), `No package.json found in ${libRoot}\nplease re-install cwserver`);
        const data = (0, fs_1.readFileSync)(absPath, "utf-8");
        _appVersion = app_util_1.Util.JSON.parse(data).version;
        return _appVersion;
    };
    return {
        get appVersion() {
            return _appVersion;
        },
        get readAppVersion() {
            return _readAppVersion;
        }
    };
})(), exports.appVersion = _a.appVersion, exports.readAppVersion = _a.readAppVersion;
const getCook = (cooks) => {
    const cookies = {};
    cooks.forEach((value) => {
        const index = value.indexOf('=');
        if (index < 0)
            return;
        cookies[value.substring(0, index).trim()] = value.substring(index + 1).trim();
    });
    return cookies;
};
function parseCookie(cook) {
    if (!cook)
        return {};
    if (Array.isArray(cook))
        return getCook(cook);
    if (cook instanceof Object)
        return cook;
    return getCook(cook.split(';'));
}
function escapePath(unsafe) {
    if (!unsafe)
        return "";
    return unsafe
        .replace(/%/gi, "")
        .replace(/=/gi, "")
        .replace(/</gi, "")
        .replace(/>/gi, "")
        .replace(/&/gi, "")
        .trim();
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
function parseIp(ip) {
    if (ip.includes("::ffff:")) {
        ip = ip.split(':').reverse()[0];
    }
    return ip;
}
function getClientIp(req) {
    const res = req.headers['x-forwarded-for'];
    let ip;
    if (res && typeof (res) === 'string') {
        ip = parseIp(res.split(',')[0]);
        if (ip)
            return ip;
    }
    ip = parseIp((0, app_static_1.toString)(req.socket.remoteAddress));
    return (0, app_static_1.toString)(ip);
}
function parseUrl(url) {
    if (url) {
        return node_url_1.default.parse(url, true);
    }
    return Object.create({
        pathname: null, query: {}
    });
}
class Request extends node_http_1.IncomingMessage {
    get isMobile() {
        if (this._isMobile !== undefined)
            return this._isMobile;
        const userAgent = (0, app_static_1.toString)(this.get('user-agent'));
        this._isMobile = /mobile/gi.test(userAgent);
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
        this._q = parseUrl(this.url);
        return this._q;
    }
    get cookies() {
        if (this._cookies !== undefined)
            return this._cookies;
        this._cookies = parseCookie(this.headers.cookie);
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
        this._path = decodeURIComponent(escapePath(this.q.pathname));
        return this._path;
    }
    set path(val) {
        this._path = val;
    }
    get ip() {
        if (this._ip !== undefined)
            return this._ip;
        this._ip = getClientIp(this);
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
        delete this._path;
        delete this._ip;
        delete this._cookies;
        delete this._isLocal;
        if (this.cleanSocket || process.env.TASK_TYPE === 'TEST') {
            this.removeAllListeners();
            this.destroy();
        }
    }
}
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
class Application extends node_events_1.EventEmitter {
    get version() {
        return exports.appVersion;
    }
    get httpServer() {
        return this._httpServer;
    }
    get isRunning() {
        return this._isRunning;
    }
    constructor(httpServer) {
        super();
        this._httpServer = httpServer;
        this._appHandler = [];
        this._prerequisitesHandler = [];
        this._isRunning = false;
        this._connectionMap = {};
        this._connectionKey = 0;
    }
    clearHandler() {
        if (this._appHandler.length > 0) {
            this._appHandler.length = 0;
        }
        if (this._prerequisitesHandler.length > 0) {
            this._prerequisitesHandler.length = 0;
        }
    }
    _shutdown() {
        let resolveTerminating;
        let rejectTerminating;
        const promise = new Promise((presolve, reject) => {
            resolveTerminating = presolve;
            rejectTerminating = reject;
        });
        if (!this._isRunning) {
            setImmediate(() => {
                rejectTerminating(new Error('Server not running....'));
            });
        }
        else {
            this._isRunning = false;
            this._httpServer.once('close', () => resolveTerminating());
            this._httpServer.close();
            // bug solved at 6:00 PM 12/13/2024
            // this._httpServer.close().once('close', () => resolveTerminating());
        }
        this._destroyActiveSocket();
        return promise;
    }
    _destroyActiveSocket() {
        Object.keys(this._connectionMap).forEach((socketKey) => {
            const _socket = this._connectionMap[socketKey];
            if (_socket) {
                _socket.destroy();
            }
        });
        this._connectionMap = {};
    }
    shutdown(next) {
        this.emit('shutdown');
        return this._shutdown().then(() => next()).catch((err) => next(err)), void 0;
    }
    shutdownAsync() {
        this.emit('shutdown');
        return this._shutdown();
    }
    _handleRequest(req, res, handlers, next, isPrerequisites) {
        if (handlers.length === 0)
            return next();
        let isRouted = false;
        let count = 0;
        const Loop = () => {
            const inf = handlers[count];
            if (!inf)
                return process.nextTick(() => next());
            if (!inf.route || isPrerequisites === true)
                return inf.handler.call(this, req, res, _next);
            if (isRouted)
                return process.nextTick(() => _next());
            const routeInfo = (0, app_router_1.getRouteInfo)(req.path, handlers, 'ANY');
            isRouted = true;
            if (routeInfo) {
                if (routeInfo.layer.routeMatcher) {
                    req.path = routeInfo.layer.routeMatcher.replace(req.path);
                }
                try {
                    return routeInfo.layer.handler.call(this, req, res, _next);
                }
                catch (e) {
                    return this.emit('error', req, res, e), void 0;
                }
            }
            return process.nextTick(() => _next());
        };
        const _next = (statusCode) => {
            if (statusCode instanceof Error) {
                return this.emit('error', req, res, statusCode), void 0;
            }
            count++;
            return Loop();
        };
        return Loop();
    }
    handleRequest(req, res) {
        return this._handleRequest(req, res, this._prerequisitesHandler, (err) => {
            return this._handleRequest(req, res, this._appHandler, (_err) => {
                return this.emit('error', req, res, _err), void 0;
            }, false);
        }, true);
    }
    prerequisites(handler) {
        if (typeof (handler) !== 'function')
            throw new Error('handler should be function....');
        return this._prerequisitesHandler.push({
            handler, routeMatcher: void 0, pathArray: [], method: 'ANY', route: ''
        }), this;
    }
    use(...args) {
        const argtype0 = typeof (args[0]);
        const argtype1 = typeof (args[1]);
        if (argtype0 === 'function') {
            return this._appHandler.push({
                handler: args[0], routeMatcher: void 0,
                pathArray: [], method: 'ANY', route: ''
            }), this;
        }
        if (argtype0 === 'string' && argtype1 === 'function') {
            const route = args[0];
            if (route.indexOf(':') > -1) {
                throw new Error(`Unsupported symbol defined. ${route}`);
            }
            const isVirtual = typeof (args[2]) === 'boolean' ? args[2] : false;
            return this._appHandler.push({
                route,
                handler: args[1],
                routeMatcher: (0, app_router_1.getRouteMatcher)(route, isVirtual),
                pathArray: [], method: 'ANY'
            }), this;
        }
        throw new Error('Invalid arguments...');
    }
    listen(handle, listeningListener) {
        if (this.isRunning) {
            throw new Error('Server already running....');
        }
        this._httpServer.listen(handle, () => {
            this._isRunning = true;
            if (listeningListener)
                return listeningListener();
        });
        this._httpServer.on('connection', (socket) => {
            const connectionKey = String(++this._connectionKey);
            this._connectionMap[connectionKey] = socket;
            socket.on('close', () => {
                delete this._connectionMap[connectionKey];
            });
        });
        return this;
    }
}
function setAppHeader(res) {
    res.setHeader('server', 'FSys Frontend');
    res.setHeader('x-app-version', exports.appVersion);
    res.setHeader('x-powered-by', 'fsys.tech');
}
function App() {
    const app = new Application((0, node_http_1.createServer)((request, response) => {
        const req = Object.setPrototypeOf(request, Request.prototype);
        const res = Object.setPrototypeOf(response, Response.prototype);
        try {
            setAppHeader(res);
            if (req.method)
                res.method = req.method;
            res.on('close', (...args) => {
                res.isAlive = false;
                app.emit('response-end', req, res);
            });
            app.emit('request-begain', req);
            app.handleRequest(req, res);
        }
        catch (e) {
            // Caught while prerequisites error happens
            app.emit('error', req, res, e);
        }
    }));
    return app;
}
//# sourceMappingURL=server-core.js.map