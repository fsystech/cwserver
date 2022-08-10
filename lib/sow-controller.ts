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

// 11:16 PM 5/2/2020
// by rajib chy
import { HttpMimeHandler } from './sow-http-mime';
import { IHttpMimeHandler } from './sow-http-mime';
import { IContext, AppHandler } from './sow-server';
import { HttpStatus } from './sow-http-status';
import { ToNumber } from './sow-static';
import {
    getRouteMatcher, getRouteInfo,
    ILayerInfo, IRouteInfo
} from './sow-router';
import { FileInfoCacheHandler, IFileInfoCacheHandler } from './file-info';
export interface IController {
    readonly httpMimeHandler: IHttpMimeHandler;
    any(route: string, next: AppHandler): IController;
    get(route: string, next: AppHandler): IController;
    post(route: string, next: AppHandler): IController;
    processAny(ctx: IContext): void;
    reset(): void;
    /** The given `arguments` will be skip */
    delete(...args: string[]): void;
    remove(path: string): boolean;
    sort(): void;
}
const routeTable: {
    any: { [x: string]: AppHandler };
    get: { [x: string]: AppHandler };
    post: { [x: string]: AppHandler };
    router: ILayerInfo<AppHandler>[];
} = {
    any: {},
    get: {},
    post: {},
    router: []
};
// 1:16 AM 6/7/2020
const fireHandler = (ctx: IContext): boolean => {
    if (routeTable.router.length === 0) return false;
    const routeInfo: IRouteInfo<AppHandler> | undefined = getRouteInfo(ctx.path, routeTable.router, ctx.req.method || "GET");
    if (!routeInfo) {
        return false;
    }
    return routeInfo.layer.handler(ctx, routeInfo.requestParam), true;
};
const getFileName = (path: string): string | void => {
    const index: number = path.lastIndexOf("/");
    if (index < 0) return void 0;
    return path.substring(index + 1);
};
const _deleteRouter = (skip: string[], router: { [x: string]: AppHandler }) => {
    for (const prop in router) {
        if (skip.some(a => prop.indexOf(a) > -1)) continue;
        delete router[prop];
    }
}
export class Controller implements IController {
    private _httpMimeHandler: IHttpMimeHandler;
    private _fileInfo: IFileInfoCacheHandler;
    private _hasDefaultExt: boolean;
    public get httpMimeHandler() {
        return this._httpMimeHandler;
    }
    constructor(hasDefaultExt: boolean) {
        this._fileInfo = new FileInfoCacheHandler();
        this._httpMimeHandler = new HttpMimeHandler();
        this._hasDefaultExt = hasDefaultExt;
    }
    reset(): void {
        // @ts-ignore
        delete routeTable.get; delete routeTable.post;
        // @ts-ignore
        delete routeTable.any; delete routeTable.router;
        routeTable.get = {};
        routeTable.post = {};
        routeTable.any = {};
        routeTable.router = [];
    }
    public delete(...args: string[]): void {
        if (args.length === 0) return this.reset();
        _deleteRouter(args, routeTable.get);
        _deleteRouter(args, routeTable.post);
        _deleteRouter(args, routeTable.any);
        return routeTable.router = routeTable.router.filter((a) => {
            if (args.some(skp => a.route.indexOf(skp) > -1)) return true;
            return false;
        }), void 0;
    }
    public get(route: string, next: AppHandler): IController {
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
                routeMatcher: getRouteMatcher(route)
            });
        }
        return routeTable.get[route] = next, this;
    }
    public post(route: string, next: AppHandler): IController {
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
                routeMatcher: getRouteMatcher(route)
            });
        }
        return routeTable.post[route] = next, this;
    }
    public any(route: string, next: AppHandler): IController {
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
                routeMatcher: getRouteMatcher(route)
            });
        }
        return routeTable.any[route] = next, this;
    }
    private passDefaultDoc(ctx: IContext): void {
        let index: number = -1;
        const forword = (): void => {
            index++;
            const name: string | undefined = ctx.server.config.defaultDoc[index];
            if (!name) return ctx.next(404);
            const path: string = ctx.server.mapPath(`/${ctx.req.path}${name}${ctx.server.config.defaultExt}`);
            return this._fileInfo.exists(path, (exists: boolean, url: string): void => {
                return ctx.handleError(null, () => {
                    if (exists) return ctx.res.render(ctx, url);
                    return forword();
                });
            });
        }
        return forword();
    }
    private sendDefaultDoc(ctx: IContext): void {
        if (this._hasDefaultExt) {
            if (ctx.req.path.charAt(ctx.req.path.length - 1) === "/") {
                return this.passDefaultDoc(ctx);
            }
            const fileName: string | void = getFileName(ctx.req.path);
            if (!fileName) return ctx.next(404);
            if (ctx.server.config.defaultDoc.indexOf(fileName) > -1) return ctx.next(404);
            if (HttpStatus.isErrorFileName(fileName /*401*/)) {
                return ctx.transferRequest(ToNumber(fileName));
            }
            const path: string = ctx.server.mapPath(`/${ctx.req.path}${ctx.server.config.defaultExt}`);
            return this._fileInfo.exists(path, (exists: boolean, url: string): void => {
                return ctx.handleError(null, () => {
                    if (exists) return ctx.res.render(ctx, url);
                    return ctx.next(404);
                });
            });
        }
        if (ctx.req.path.charAt(ctx.req.path.length - 1) === "/") {
            return this.passDefaultDoc(ctx);
        }
        return ctx.next(404);
    }
    private processGet(ctx: IContext): void {
        if (routeTable.get[ctx.req.path]) {
            return routeTable.get[ctx.req.path](ctx);
        }
        if (fireHandler(ctx)) return void 0;
        if (ctx.extension) {
            if (
                this._hasDefaultExt
                && ctx.server.config.defaultExt === `.${ctx.extension}`
            ) {
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
    private processPost(ctx: IContext): void {
        if (routeTable.post[ctx.req.path]) {
            return routeTable.post[ctx.req.path](ctx);
        }
        if (fireHandler(ctx)) return void 0;
        return ctx.next(404);
    }
    public processAny(ctx: IContext): void {
        if (routeTable.any[ctx.path])
            return routeTable.any[ctx.req.path](ctx);
        if (ctx.req.method === "POST")
            return this.processPost(ctx);
        if (ctx.req.method === "GET")
            return this.processGet(ctx);
        return ctx.next(404);
    }
    public remove(path: string): boolean {
        let found: boolean = false;
        if (routeTable.any[path]) {
            delete routeTable.any[path]; found = true;
        } else if (routeTable.post[path]) {
            delete routeTable.post[path]; found = true;
        } else if (routeTable.get[path]) {
            delete routeTable.get[path]; found = true;
        }
        if (!found) return false;
        const index: number = routeTable.router.findIndex(r => r.route === path);
        if (index > -1) {
            routeTable.router.splice(index, 1);
        }
        return true;
    }
    public sort(): void {
        return routeTable.router = routeTable.router.sort((a, b) => {
            return a.route.length - b.route.length;
        }), void 0;
    }
}