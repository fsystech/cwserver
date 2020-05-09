"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sow_http_mime_1 = require("./sow-http-mime");
const sow_util_1 = require("./sow-util");
const sow_template_1 = require("./sow-template");
const routeInfo = {
    any: {},
    get: {},
    post: {}
};
class Controller {
    constructor(server) {
        this._server = server;
        this.httpMimeHandler = new sow_http_mime_1.HttpMimeHandler(server.getRoot());
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
                if (this._server.config.defaultExt) {
                    return ctx.next(404);
                }
                return sow_template_1.Template.parse(this._server, ctx, this._server.mapPath(ctx.req.path));
            }
            if (this._server.config.mimeType.indexOf(ctx.extension) > -1) {
                return this.httpMimeHandler.render(ctx, void 0, true);
            }
            return ctx.next(404, true);
        }
        else {
            if (this._server.config.defaultExt) {
                const path = this._server.mapPath(`/${ctx.req.path}${this._server.config.defaultExt}`);
                if (!sow_util_1.Util.isExists(path, ctx.next))
                    return;
                return sow_template_1.Template.parse(this._server, ctx, path);
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
//# sourceMappingURL=sow-controller.js.map