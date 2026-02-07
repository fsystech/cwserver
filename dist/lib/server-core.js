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
exports.readAppVersion = exports.appVersion = void 0;
exports.App = App;
// 2:40 PM 5/7/2020
// by rajib chy
require("./app-global");
const node_http_1 = require("node:http");
const node_events_1 = require("node:events");
const app_router_1 = require("./app-router");
const app_util_1 = require("./app-util");
const fs_1 = require("fs");
const node_path_1 = require("node:path");
const inject_1 = require("./inject");
_a = (() => {
    let _appVersion = '4.1.1';
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
        this._connectionMap = new Map();
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
        for (const socket of this._connectionMap.values()) {
            socket.destroy();
        }
        this._connectionMap.clear();
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
            if (!inf) {
                return next();
            }
            if (!inf.route || isPrerequisites === true) {
                return inf.handler(req, res, _next);
            }
            if (isRouted) {
                return process.nextTick(() => _next());
            }
            const routeInfo = (0, app_router_1.getRouteInfo)(req.path, handlers, 'ANY');
            isRouted = true;
            if (routeInfo) {
                if (routeInfo.layer.routeMatcher) {
                    req.path = routeInfo.layer.routeMatcher.replace(req.path);
                }
                try {
                    return routeInfo.layer.handler(req, res, _next);
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
            if (listeningListener) {
                return listeningListener();
            }
        });
        this._httpServer.on('connection', (socket) => {
            const connectionKey = String(++this._connectionKey);
            this._connectionMap.set(connectionKey, socket);
            socket.on('close', () => {
                this._connectionMap.delete(connectionKey);
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
    (0, inject_1.injectIncomingOutgoing)();
    const app = new Application((0, node_http_1.createServer)((request, response) => {
        const req = request; //Object.setPrototypeOf(request, Request.prototype);
        const res = response; //Object.setPrototypeOf(response, Response.prototype);
        try {
            setAppHeader(res);
            if (req.method) {
                res.method = req.method;
            }
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