"use strict";
// Copyright (c) 2022 Safe Online World Ltd.
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
exports.Controller = void 0;
// 11:16 PM 5/2/2020
// by rajib chy
const http_mime_1 = require("./http-mime");
const http_status_1 = require("./http-status");
const app_static_1 = require("./app-static");
const app_router_1 = require("./app-router");
const file_info_1 = require("./file-info");
const routeTable = {
    any: {},
    get: {},
    post: {},
    router: []
};
// 1:16 AM 6/7/2020
const fireHandler = (ctx) => {
    if (routeTable.router.length === 0)
        return false;
    const routeInfo = (0, app_router_1.getRouteInfo)(ctx.path, routeTable.router, ctx.req.method || "GET");
    if (!routeInfo) {
        return false;
    }
    return routeInfo.layer.handler(ctx, routeInfo.requestParam), true;
};
const getFileName = (path) => {
    const index = path.lastIndexOf("/");
    if (index < 0)
        return void 0;
    return path.substring(index + 1);
};
const _deleteRouter = (skip, router) => {
    for (const prop in router) {
        if (skip.some(a => prop.indexOf(a) > -1))
            continue;
        delete router[prop];
    }
};
/**
 * Create duplicate `route` error message
 * @param method `route` group
 * @param route `route` path
 * @returns {string} duplicate `route` error message
 */
const _createDRM = (method, route) => {
    return `This given "${method}" route ${route} already exists in route table`;
};
class Controller {
    get httpMimeHandler() {
        return this._httpMimeHandler;
    }
    constructor(hasDefaultExt) {
        this._fileInfo = new file_info_1.FileInfoCacheHandler();
        this._httpMimeHandler = new http_mime_1.HttpMimeHandler();
        this._hasDefaultExt = hasDefaultExt;
    }
    reset() {
        // @ts-ignore
        delete routeTable.get;
        delete routeTable.post;
        // @ts-ignore
        delete routeTable.any;
        delete routeTable.router;
        routeTable.get = {};
        routeTable.post = {};
        routeTable.any = {};
        routeTable.router = [];
    }
    delete(...args) {
        if (args.length === 0)
            return this.reset();
        _deleteRouter(args, routeTable.get);
        _deleteRouter(args, routeTable.post);
        _deleteRouter(args, routeTable.any);
        return routeTable.router = routeTable.router.filter((a) => {
            if (args.some(skp => a.route.indexOf(skp) > -1))
                return true;
            return false;
        }), void 0;
    }
    get(route, next) {
        if (routeTable.get[route])
            throw new Error(_createDRM('get', route));
        if (routeTable.any[route])
            throw new Error(_createDRM('get', route));
        if (route !== "/" && (route.indexOf(":") > -1 || route.indexOf("*") > -1)) {
            routeTable.router.push({
                method: "GET",
                handler: next,
                route,
                pathArray: route.split("/"),
                routeMatcher: (0, app_router_1.getRouteMatcher)(route)
            });
        }
        return routeTable.get[route] = next, this;
    }
    post(route, next) {
        if (routeTable.post[route])
            throw new Error(_createDRM('post', route));
        if (routeTable.any[route])
            throw new Error(_createDRM('post', route));
        if (route !== "/" && (route.indexOf(":") > -1 || route.indexOf("*") > -1)) {
            routeTable.router.push({
                method: "POST",
                handler: next,
                route,
                pathArray: route.split("/"),
                routeMatcher: (0, app_router_1.getRouteMatcher)(route)
            });
        }
        return routeTable.post[route] = next, this;
    }
    any(route, next) {
        if (routeTable.post[route])
            throw new Error(_createDRM('post', route));
        if (routeTable.get[route])
            throw new Error(_createDRM('get', route));
        if (routeTable.any[route])
            throw new Error(_createDRM('any', route));
        if (route !== "/" && (route.indexOf(":") > -1 || route.indexOf("*") > -1)) {
            routeTable.router.push({
                method: "ANY",
                handler: next,
                route,
                pathArray: route.split("/"),
                routeMatcher: (0, app_router_1.getRouteMatcher)(route)
            });
        }
        return routeTable.any[route] = next, this;
    }
    passDefaultDoc(ctx) {
        let index = -1;
        const forword = () => {
            index++;
            const name = ctx.server.config.defaultDoc[index];
            if (!name)
                return ctx.next(404);
            const path = ctx.server.mapPath(`/${ctx.req.path}${name}${ctx.server.config.defaultExt}`);
            return this._fileInfo.exists(path, (exists, url) => {
                return ctx.handleError(null, () => {
                    if (exists)
                        return ctx.res.render(ctx, url);
                    return forword();
                });
            });
        };
        return forword();
    }
    sendDefaultDoc(ctx) {
        if (this._hasDefaultExt) {
            if (ctx.req.path.charAt(ctx.req.path.length - 1) === "/") {
                return this.passDefaultDoc(ctx);
            }
            const fileName = getFileName(ctx.req.path);
            if (!fileName)
                return ctx.next(404);
            if (ctx.server.config.defaultDoc.indexOf(fileName) > -1)
                return ctx.next(404);
            if (http_status_1.HttpStatus.isErrorFileName(fileName /*401*/)) {
                return ctx.transferRequest((0, app_static_1.ToNumber)(fileName));
            }
            const path = ctx.server.mapPath(`/${ctx.req.path}${ctx.server.config.defaultExt}`);
            return this._fileInfo.exists(path, (exists, url) => {
                return ctx.handleError(null, () => {
                    if (exists)
                        return ctx.res.render(ctx, url);
                    return ctx.next(404);
                });
            });
        }
        if (ctx.req.path.charAt(ctx.req.path.length - 1) === "/") {
            return this.passDefaultDoc(ctx);
        }
        return ctx.next(404);
    }
    processGet(ctx) {
        if (routeTable.get[ctx.req.path]) {
            return routeTable.get[ctx.req.path](ctx);
        }
        if (fireHandler(ctx))
            return void 0;
        if (ctx.extension) {
            if (this._hasDefaultExt
                && ctx.server.config.defaultExt === `.${ctx.extension}`) {
                return ctx.next(404);
            }
            if (ctx.server.config.template.ext.indexOf(ctx.extension) > -1) {
                return ctx.res.render(ctx, ctx.server.mapPath(ctx.req.path));
            }
            if (ctx.server.config.mimeType.indexOf(ctx.extension) > -1) {
                return this.httpMimeHandler.render(ctx, void 0);
            }
            return ctx.next(404, true);
        }
        return this.sendDefaultDoc(ctx);
    }
    processPost(ctx) {
        if (routeTable.post[ctx.req.path]) {
            return routeTable.post[ctx.req.path](ctx);
        }
        if (fireHandler(ctx))
            return void 0;
        return ctx.next(404);
    }
    processAny(ctx) {
        if (routeTable.any[ctx.path])
            return routeTable.any[ctx.req.path](ctx);
        if (ctx.req.method === "POST")
            return this.processPost(ctx);
        if (ctx.req.method === "GET")
            return this.processGet(ctx);
        return ctx.next(404);
    }
    remove(path) {
        let found = false;
        if (routeTable.any[path]) {
            delete routeTable.any[path];
            found = true;
        }
        else if (routeTable.post[path]) {
            delete routeTable.post[path];
            found = true;
        }
        else if (routeTable.get[path]) {
            delete routeTable.get[path];
            found = true;
        }
        if (!found)
            return false;
        const index = routeTable.router.findIndex(r => r.route === path);
        if (index > -1) {
            routeTable.router.splice(index, 1);
        }
        return true;
    }
    sort() {
        return routeTable.router = routeTable.router.sort((a, b) => {
            return a.route.length - b.route.length;
        }), void 0;
    }
}
exports.Controller = Controller;
//# sourceMappingURL=app-controller.js.map