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

// 11:16 PM 5/2/2020
// by rajib chy
import { HttpMimeHandler } from './http-mime';
import type { IHttpMimeHandler } from './http-mime';
import { AppHandler } from './server';
import type { IContext } from './context';
import { HttpStatus } from './http-status';
import { toNumber } from './app-static';
import {
    getRouteMatcher, getRouteInfo,
    type ILayerInfo, type IRouteInfo
} from './app-router';
import { FileInfoCacheHandler, type IFileInfoCacheHandler } from './file-info';

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

function getFileName(path: string): string | void {
    const index: number = path.lastIndexOf("/");
    if (index < 0) return void 0;
    return path.substring(index + 1);
}

function _deleteRouter(skip: string[], router: Map<string, AppHandler>) {
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
const _createDRM = (method: string, route: string): string => {
    return `This given "${method}" route ${route} already exists in route table`;
};
export class Controller implements IController {
    private _httpMimeHandler: IHttpMimeHandler;
    private _fileInfo: IFileInfoCacheHandler;
    private _hasDefaultExt: boolean;
    public get httpMimeHandler() {
        return this._httpMimeHandler;
    }
    private _routeTable: {
        any: Map<string, AppHandler>;
        get: Map<string, AppHandler>;
        post: Map<string, AppHandler>;
        router: ILayerInfo<AppHandler>[];
    } = { any: new Map(), get: new Map(), post: new Map(), router: [] };

    constructor(hasDefaultExt: boolean) {
        this._fileInfo = new FileInfoCacheHandler();
        this._httpMimeHandler = new HttpMimeHandler();
        this._hasDefaultExt = hasDefaultExt;
    }

    public reset(): void {
        this._routeTable.get.clear();
        this._routeTable.post.clear();
        this._routeTable.any.clear();
        this._routeTable.router.length = 0;
    }
    private fireHandler(ctx: IContext): boolean {

        if (this._routeTable.router.length === 0) return false;

        const routeInfo: IRouteInfo<AppHandler> | undefined = getRouteInfo(
            ctx.path, this._routeTable.router, ctx.req.method || "GET"
        );

        if (!routeInfo) {
            return false;
        }

        return routeInfo.layer.handler(ctx, routeInfo.requestParam), true;
    }

    public delete(...args: string[]): void {
        if (args.length === 0) return this.reset();

        _deleteRouter(args, this._routeTable.get);
        _deleteRouter(args, this._routeTable.post);
        _deleteRouter(args, this._routeTable.any);

        this._routeTable.router = this._routeTable.router.filter((a) => {
            if (args.some(skp => a.route.indexOf(skp) > -1)) return true;
            return false;
        });
    }
    public get(route: string, next: AppHandler): IController {
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
                routeMatcher: getRouteMatcher(route)
            });
        }

        this._routeTable.get.set(route, next);

        return this;
    }

    public post(route: string, next: AppHandler): IController {
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
                routeMatcher: getRouteMatcher(route)
            });
        }

        this._routeTable.post.set(route, next);

        return this;
    }

    public any(route: string, next: AppHandler): IController {
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
                routeMatcher: getRouteMatcher(route)
            });
        }

        this._routeTable.any.set(route, next);
        return this;
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
                return ctx.transferRequest(toNumber(fileName));
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
        const handler = this._routeTable.get.get(ctx.path);

        if (handler) {
            return handler(ctx);
        }

        if (this.fireHandler(ctx)) return void 0;

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
        const handler = this._routeTable.post.get(ctx.path);

        if (handler) {
            return handler(ctx);
        }

        if (this.fireHandler(ctx)) return void 0;

        return ctx.next(404);
    }

    public processAny(ctx: IContext): void {
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

    public remove(path: string): boolean {
        let found: number = 0;

        if (this._routeTable.any.delete(path)) {
            found++;
        } else if (this._routeTable.post.delete(path)) {
            found++;
        } else if (this._routeTable.get.delete(path)) {
            found++;
        }

        if (found === 0) return false;

        const index: number = this._routeTable.router.findIndex(r => r.route === path);

        if (index > -1) {
            this._routeTable.router.splice(index, 1);
        }

        return true;
    }
    public sort(): void {
        return this._routeTable.router = this._routeTable.router.sort((a, b) => {
            return a.route.length - b.route.length;
        }), void 0;
    }
}