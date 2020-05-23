"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Controller = void 0;
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 11:16 PM 5/2/2020
const sow_http_mime_1 = require("./sow-http-mime");
const sow_util_1 = require("./sow-util");
// interface IHander {
//    appHandler: AppHandler;
//    route: string;
//    query: string[];
// }
const routeInfo = {
    any: {},
    get: {},
    post: {}
};
const getFileName = (path) => {
    const index = path.lastIndexOf("/");
    if (index < 0)
        return void 0;
    return path.substring(index + 1);
};
class Controller {
    constructor() {
        this.httpMimeHandler = new sow_http_mime_1.HttpMimeHandler();
    }
    reset() {
        delete routeInfo.get;
        delete routeInfo.post;
        delete routeInfo.any;
        routeInfo.get = {};
        routeInfo.post = {};
        routeInfo.any = {};
    }
    get(route, next) {
        if (routeInfo.get[route])
            throw new Error(`Duplicate get route defined ${route}`);
        return routeInfo.get[route] = next, this;
    }
    post(route, next) {
        if (routeInfo.post[route])
            throw new Error(`Duplicate post route defined ${route}`);
        return routeInfo.post[route] = next, this;
    }
    any(route, next) {
        if (routeInfo.post[route])
            throw new Error(`Duplicate post route defined ${route}`);
        if (routeInfo.get[route])
            throw new Error(`Duplicate get route defined ${route}`);
        if (routeInfo.any[route])
            throw new Error(`Duplicate any route defined ${route}`);
        return routeInfo.any[route] = next, this;
    }
    processGet(ctx) {
        if (routeInfo.get[ctx.req.path]) {
            return routeInfo.get[ctx.req.path](ctx);
        }
        if (ctx.extension) {
            if (['htm', 'html'].indexOf(ctx.extension) > -1) {
                if (ctx.server.config.defaultExt) {
                    return ctx.next(404);
                }
                return ctx.res.render(ctx, ctx.server.mapPath(ctx.req.path));
            }
            if (ctx.server.config.mimeType.indexOf(ctx.extension) > -1) {
                return this.httpMimeHandler.render(ctx, void 0, true);
            }
            return ctx.next(404, true);
        }
        else {
            if (ctx.server.config.defaultExt) {
                let path = "";
                if (ctx.req.path.charAt(ctx.req.path.length - 1) === "/") {
                    for (const name of ctx.server.config.defaultDoc) {
                        path = ctx.server.mapPath(`/${ctx.req.path}${name}${ctx.server.config.defaultExt}`);
                        if (sow_util_1.Util.isExists(path))
                            break;
                    }
                    if (!path || path.length === 0)
                        return ctx.next(404);
                }
                else {
                    const fileName = getFileName(ctx.req.path);
                    if (!fileName)
                        return ctx.next(404);
                    if (ctx.server.config.defaultDoc.indexOf(fileName) > -1)
                        return ctx.next(404);
                    path = ctx.server.mapPath(`/${ctx.req.path}${ctx.server.config.defaultExt}`);
                    if (!sow_util_1.Util.isExists(path, ctx.next))
                        return;
                }
                return ctx.res.render(ctx, path);
            }
            else {
                if (ctx.req.path.charAt(ctx.req.path.length - 1) === "/") {
                    let path = "";
                    for (const name of ctx.server.config.defaultDoc) {
                        path = ctx.server.mapPath(`/${ctx.req.path}${name}`);
                        if (sow_util_1.Util.isExists(path))
                            break;
                    }
                    if (!path || path.length === 0)
                        return ctx.next(404);
                    return ctx.res.render(ctx, path);
                }
            }
        }
        return ctx.next(404);
    }
    processPost(ctx) {
        if (routeInfo.post[ctx.req.path]) {
            return routeInfo.post[ctx.req.path](ctx);
        }
        return ctx.next(404);
    }
    processAny(ctx) {
        if (routeInfo.any[ctx.path])
            return routeInfo.any[ctx.req.path](ctx);
        if (ctx.req.method === "POST")
            return this.processPost(ctx);
        if (ctx.req.method === "GET")
            return this.processGet(ctx);
        return ctx.next(404);
    }
}
exports.Controller = Controller;
