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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    fireHandlerAsync(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._routeTable.router.length === 0)
                return false;
            const routeInfo = (0, app_router_1.getRouteInfo)(ctx.path, this._routeTable.router, ctx.req.method || "GET");
            if (!routeInfo) {
                return false;
            }
            const asyncHandler = routeInfo.layer.handler;
            return yield asyncHandler(ctx, routeInfo.requestParam), true;
        });
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
    passDefaultDocAsync(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const rpath = ctx.req.path;
            const { defaultDoc, defaultExt } = ctx.server.config;
            for (const name of defaultDoc) {
                const path = ctx.server.mapPath(`/${rpath}${name}${defaultExt}`);
                const status = yield this._fileInfo.existsAsync(path);
                if (ctx.isDisposed)
                    return;
                if (!status.exists)
                    continue;
                return ctx.res.render(ctx, status.url);
            }
            if (ctx.isDisposed)
                return;
            return ctx.next(404);
        });
    }
    sendDefaultDocAsync(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const rpath = ctx.req.path;
            if (!this._hasDefaultExt) {
                if (rpath.charAt(rpath.length - 1) === "/") {
                    return yield this.passDefaultDocAsync(ctx);
                }
                return ctx.next(404);
            }
            if (rpath.charAt(rpath.length - 1) === "/") {
                return yield this.passDefaultDocAsync(ctx);
            }
            const fileName = getFileName(rpath);
            if (!fileName)
                return ctx.next(404);
            if (ctx.server.config.defaultDoc.includes(fileName))
                return ctx.next(404);
            if (http_status_1.HttpStatus.isErrorFileName(fileName /*401*/)) {
                return ctx.transferRequest((0, app_static_1.toNumber)(fileName));
            }
            const path = ctx.server.mapPath(`/${ctx.req.path}${ctx.server.config.defaultExt}`);
            const status = yield this._fileInfo.existsAsync(path);
            if (ctx.isDisposed)
                return;
            if (status.exists)
                return ctx.res.render(ctx, status.url);
            return ctx.next(404);
        });
    }
    processGetAsync(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const handlerAsync = this._routeTable.get.get(ctx.path);
            if (handlerAsync) {
                return yield handlerAsync(ctx);
            }
            if (yield this.fireHandlerAsync(ctx))
                return;
            if (ctx.extension) {
                if (this._hasDefaultExt
                    && ctx.server.config.defaultExt === `.${ctx.extension}`) {
                    return ctx.next(404);
                }
                if (ctx.server.config.template.ext.indexOf(ctx.extension) > -1) {
                    return ctx.res.render(ctx, ctx.server.mapPath(ctx.req.path));
                }
                if (ctx.server.config.mimeType.indexOf(ctx.extension) > -1) {
                    this.httpMimeHandler.renderAsync(ctx);
                    return;
                }
                return ctx.next(404, true);
            }
            return yield this.sendDefaultDocAsync(ctx);
        });
    }
    processPostAsync(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const handlerAsync = this._routeTable.post.get(ctx.path);
            if (handlerAsync) {
                return yield handlerAsync(ctx);
            }
            if (yield this.fireHandlerAsync(ctx))
                return;
            return ctx.next(404);
        });
    }
    processAny(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const handlerAsync = this._routeTable.any.get(ctx.path);
            if (handlerAsync) {
                return yield handlerAsync(ctx);
            }
            if (ctx.req.method === "POST")
                return yield this.processPostAsync(ctx);
            if (ctx.req.method === "GET")
                return yield this.processGetAsync(ctx);
            return ctx.next(404);
        });
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