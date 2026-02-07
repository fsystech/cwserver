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
exports.Controller = void 0;
// 11:16 PM 5/2/2020
// by rajib chy
const http_mime_1 = require("./http-mime");
const http_status_1 = require("./http-status");
const app_static_1 = require("./app-static");
const app_router_1 = require("./app-router");
const file_info_1 = require("./file-info");
function getFileName(path) {
    const index = path.lastIndexOf("/");
    if (index < 0)
        return void 0;
    return path.substring(index + 1);
}
function _deleteRouter(skip, router) {
    const re = new RegExp(skip.join('|'));
    for (const [key] of router) {
        if (!re.test(key)) {
            router.delete(key);
        }
    }
}
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
        this._routeTable = { any: new Map(), get: new Map(), post: new Map(), router: [] };
        this._fileInfo = new file_info_1.FileInfoCacheHandler();
        this._httpMimeHandler = new http_mime_1.HttpMimeHandler();
        this._hasDefaultExt = hasDefaultExt;
    }
    reset() {
        this._routeTable.get.clear();
        this._routeTable.post.clear();
        this._routeTable.any.clear();
        this._routeTable.router.length = 0;
    }
    fireHandler(ctx) {
        if (this._routeTable.router.length === 0)
            return false;
        const routeInfo = (0, app_router_1.getRouteInfo)(ctx.path, this._routeTable.router, ctx.req.method || "GET");
        if (!routeInfo) {
            return false;
        }
        return routeInfo.layer.handler(ctx, routeInfo.requestParam), true;
    }
    delete(...args) {
        if (args.length === 0)
            return this.reset();
        _deleteRouter(args, this._routeTable.get);
        _deleteRouter(args, this._routeTable.post);
        _deleteRouter(args, this._routeTable.any);
        this._routeTable.router = this._routeTable.router.filter((a) => {
            if (args.some(skp => a.route.indexOf(skp) > -1))
                return true;
            return false;
        });
    }
    get(route, next) {
        if (this._routeTable.get.has(route))
            throw new Error(_createDRM('get', route));
        if (this._routeTable.any.has(route))
            throw new Error(_createDRM('get', route));
        if (route !== "/" && (route.indexOf(":") > -1 || route.indexOf("*") > -1)) {
            this._routeTable.router.push({
                method: "GET",
                handler: next,
                route,
                pathArray: route.split("/"),
                routeMatcher: (0, app_router_1.getRouteMatcher)(route)
            });
        }
        this._routeTable.get.set(route, next);
        return this;
    }
    post(route, next) {
        if (this._routeTable.post.has(route))
            throw new Error(_createDRM('post', route));
        if (this._routeTable.any.has(route))
            throw new Error(_createDRM('post', route));
        if (route !== "/" && (route.indexOf(":") > -1 || route.indexOf("*") > -1)) {
            this._routeTable.router.push({
                method: "POST",
                handler: next,
                route,
                pathArray: route.split("/"),
                routeMatcher: (0, app_router_1.getRouteMatcher)(route)
            });
        }
        this._routeTable.post.set(route, next);
        return this;
    }
    any(route, next) {
        if (this._routeTable.post.has(route))
            throw new Error(_createDRM('post', route));
        if (this._routeTable.get.has(route))
            throw new Error(_createDRM('get', route));
        if (this._routeTable.any.has(route))
            throw new Error(_createDRM('any', route));
        if (route !== "/" && (route.indexOf(":") > -1 || route.indexOf("*") > -1)) {
            this._routeTable.router.push({
                method: "ANY",
                handler: next,
                route,
                pathArray: route.split("/"),
                routeMatcher: (0, app_router_1.getRouteMatcher)(route)
            });
        }
        this._routeTable.any.set(route, next);
        return this;
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
                return ctx.transferRequest((0, app_static_1.toNumber)(fileName));
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
        const handler = this._routeTable.get.get(ctx.path);
        if (handler) {
            return handler(ctx);
        }
        if (this.fireHandler(ctx))
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
        const handler = this._routeTable.post.get(ctx.path);
        if (handler) {
            return handler(ctx);
        }
        if (this.fireHandler(ctx))
            return void 0;
        return ctx.next(404);
    }
    processAny(ctx) {
        const handler = this._routeTable.any.get(ctx.path);
        if (handler) {
            return handler(ctx);
        }
        if (ctx.req.method === "POST")
            return this.processPost(ctx);
        if (ctx.req.method === "GET")
            return this.processGet(ctx);
        return ctx.next(404);
    }
    remove(path) {
        let found = 0;
        if (this._routeTable.any.delete(path)) {
            found++;
        }
        else if (this._routeTable.post.delete(path)) {
            found++;
        }
        else if (this._routeTable.get.delete(path)) {
            found++;
        }
        if (found === 0)
            return false;
        const index = this._routeTable.router.findIndex(r => r.route === path);
        if (index > -1) {
            this._routeTable.router.splice(index, 1);
        }
        return true;
    }
    sort() {
        return this._routeTable.router = this._routeTable.router.sort((a, b) => {
            return a.route.length - b.route.length;
        }), void 0;
    }
}
exports.Controller = Controller;
//# sourceMappingURL=app-controller.js.map