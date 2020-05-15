"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 11:16 PM 5/2/2020
const sow_http_mime_1 = require("./sow-http-mime");
const sow_util_1 = require("./sow-util");
const routeInfo = {
    any: {},
    get: {},
    post: {}
};
class Controller {
    constructor() {
        this.httpMimeHandler = new sow_http_mime_1.HttpMimeHandler();
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
                const path = ctx.server.mapPath(`/${ctx.req.path}${ctx.server.config.defaultExt}`);
                if (!sow_util_1.Util.isExists(path, ctx.next))
                    return;
                return ctx.res.render(ctx, path);
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
