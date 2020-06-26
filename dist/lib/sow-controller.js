"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Controller = void 0;
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 11:16 PM 5/2/2020
const sow_http_mime_1 = require("./sow-http-mime");
const fsw = __importStar(require("./sow-fsw"));
const sow_router_1 = require("./sow-router");
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
    const routeInfo = sow_router_1.getRouteInfo(ctx.path, routeTable.router, ctx.req.method || "GET");
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
class Controller {
    constructor() {
        this._httpMimeHandler = new sow_http_mime_1.HttpMimeHandler();
    }
    get httpMimeHandler() {
        return this._httpMimeHandler;
    }
    reset() {
        delete routeTable.get;
        delete routeTable.post;
        delete routeTable.any;
        delete routeTable.router;
        routeTable.get = {};
        routeTable.post = {};
        routeTable.any = {};
        routeTable.router = [];
    }
    get(route, next) {
        if (routeTable.get[route])
            throw new Error(`Duplicate get route defined ${route}`);
        if (routeTable.any[route])
            throw new Error(`Duplicate get route defined ${route}`);
        if (route !== "/" && (route.indexOf(":") > -1 || route.indexOf("*") > -1)) {
            routeTable.router.push({
                method: "GET",
                handler: next,
                route,
                pathArray: route.split("/"),
                routeMatcher: sow_router_1.getRouteMatcher(route)
            });
        }
        return routeTable.get[route] = next, this;
    }
    post(route, next) {
        if (routeTable.post[route])
            throw new Error(`Duplicate post route defined ${route}`);
        if (routeTable.any[route])
            throw new Error(`Duplicate post route defined ${route}`);
        if (route !== "/" && (route.indexOf(":") > -1 || route.indexOf("*") > -1)) {
            routeTable.router.push({
                method: "POST",
                handler: next,
                route,
                pathArray: route.split("/"),
                routeMatcher: sow_router_1.getRouteMatcher(route)
            });
        }
        return routeTable.post[route] = next, this;
    }
    any(route, next) {
        if (routeTable.post[route])
            throw new Error(`Duplicate post route defined ${route}`);
        if (routeTable.get[route])
            throw new Error(`Duplicate get route defined ${route}`);
        if (routeTable.any[route])
            throw new Error(`Duplicate any route defined ${route}`);
        if (route !== "/" && (route.indexOf(":") > -1 || route.indexOf("*") > -1)) {
            routeTable.router.push({
                method: "ANY",
                handler: next,
                route,
                pathArray: route.split("/"),
                routeMatcher: sow_router_1.getRouteMatcher(route)
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
            return fsw.isExists(path, (exists, url) => {
                if (exists)
                    return ctx.res.render(ctx, url);
                return forword();
            });
        };
        return forword();
    }
    sendDefaultDoc(ctx) {
        if (ctx.server.config.defaultExt && ctx.server.config.defaultExt.length > 0) {
            if (ctx.req.path.charAt(ctx.req.path.length - 1) === "/") {
                return this.passDefaultDoc(ctx);
            }
            const fileName = getFileName(ctx.req.path);
            if (!fileName)
                return ctx.next(404);
            if (ctx.server.config.defaultDoc.indexOf(fileName) > -1)
                return ctx.next(404);
            const path = ctx.server.mapPath(`/${ctx.req.path}${ctx.server.config.defaultExt}`);
            return fsw.isExists(path, (exists, url) => {
                if (exists)
                    return ctx.res.render(ctx, url);
                return ctx.next(404);
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
            if (ctx.server.config.defaultExt
                && ctx.server.config.defaultExt === `.${ctx.extension}`) {
                return ctx.next(404);
            }
            if (ctx.server.config.template.ext.indexOf(ctx.extension) > -1) {
                return ctx.res.render(ctx, ctx.server.mapPath(ctx.req.path));
            }
            if (ctx.server.config.mimeType.indexOf(ctx.extension) > -1) {
                return this.httpMimeHandler.render(ctx, void 0, true);
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
//# sourceMappingURL=sow-controller.js.map