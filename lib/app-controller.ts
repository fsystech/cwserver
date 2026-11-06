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
    processAny(ctx: IContext): Promise<void>;
    reset(): void;
    /** The given `arguments` will be skip */
    delete(...args: string[]): void;
    remove(path: string): boolean;
    sort(): void;
}

/**
 * Extracts the file name (the part after the last slash) from a path.
 *
 * @param path Path to inspect.
 * @returns The file name, or undefined when the path contains no slash.
 */
function getFileName(path: string): string | void {
    const index: number = path.lastIndexOf("/");
    if (index < 0) return void 0;
    return path.substring(index + 1);
}

/**
 * Deletes from a route map every entry whose key does not match any of the skip patterns.
 *
 * @param skip List of patterns (joined into one regular expression) for routes to keep.
 * @param router Route map that is modified in place.
 */
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
    /**
     * Gets the HTTP mime handler used to serve static mime-typed files.
     *
     * @returns The HttpMimeHandler instance owned by this controller.
     */
    public get httpMimeHandler() {
        return this._httpMimeHandler;
    }
    private _routeTable: {
        any: Map<string, AppHandler>;
        get: Map<string, AppHandler>;
        post: Map<string, AppHandler>;
        router: ILayerInfo<AppHandler>[];
    } = { any: new Map(), get: new Map(), post: new Map(), router: [] };

    /**
     * Creates a controller with fresh file info cache and mime handler.
     *
     * @param hasDefaultExt Whether the server uses a default extension, which enables extension-less url handling.
     */
    constructor(hasDefaultExt: boolean) {
        this._fileInfo = new FileInfoCacheHandler();
        this._httpMimeHandler = new HttpMimeHandler();
        this._hasDefaultExt = hasDefaultExt;
    }

    /**
     * Clears all registered get, post and any routes and the parameterized router list.
     */
    public reset(): void {
        this._routeTable.get.clear();
        this._routeTable.post.clear();
        this._routeTable.any.clear();
        this._routeTable.router.length = 0;
    }

    /**
     * Finds a parameterized route matching the request path and method and invokes its handler with the
     * extracted request parameters.
     *
     * @param ctx Current request context.
     * @returns A promise resolving to true if a route handler was found and invoked, otherwise false.
     */
    private async fireHandlerAsync(ctx: IContext): Promise<boolean> {

        if (this._routeTable.router.length === 0)
            return false;

        const routeInfo: IRouteInfo<AppHandler> | undefined = getRouteInfo(
            ctx.path, this._routeTable.router, ctx.req.method || "GET"
        );

        if (!routeInfo) {
            return false;
        }

        const asyncHandler = routeInfo.layer.handler;

        return await asyncHandler(
            ctx, routeInfo.requestParam
        ), true;
    }

    /**
     * Removes all registered routes except those matching the given patterns. With no arguments, resets
     * the whole route table.
     *
     * @param args Route patterns to keep; every other route is deleted.
     */
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

    /**
     * Registers a handler for GET requests on a route. Routes containing ":" or "*" are also added to the
     * parameterized router. Throws if the route already exists as a get or any route.
     *
     * @param route Route path, optionally with parameters or wildcards.
     * @param next Handler invoked for matching requests.
     * @returns The controller itself, for chaining.
     */
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

    /**
     * Registers a handler for POST requests on a route. Routes containing ":" or "*" are also added to the
     * parameterized router. Throws if the route already exists as a post or any route.
     *
     * @param route Route path, optionally with parameters or wildcards.
     * @param next Handler invoked for matching requests.
     * @returns The controller itself, for chaining.
     */
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

    /**
     * Registers a handler for any HTTP method on a route. Routes containing ":" or "*" are also added to
     * the parameterized router. Throws if the route already exists as a get, post or any route.
     *
     * @param route Route path, optionally with parameters or wildcards.
     * @param next Handler invoked for matching requests.
     * @returns The controller itself, for chaining.
     */
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

    /**
     * Looks for a configured default document in the requested directory and renders the first one that
     * exists; otherwise responds with 404.
     *
     * @param ctx Current request context.
     * @returns A promise that resolves when the response has been rendered or passed on as 404.
     */
    private async passDefaultDocAsync(ctx: IContext): Promise<void> {
        const rpath = ctx.req.path;
        const { defaultDoc, defaultExt } = ctx.server.config;

        for (const name of defaultDoc) {

            const path: string = ctx.server.mapPath(
                `/${rpath}${name}${defaultExt}`
            );

            const status = await this._fileInfo.existsAsync(path);
            if (ctx.isDisposed)
                return;

            if (!status.exists)
                continue;

            return ctx.res.render(
                ctx, status.url
            );

        }

        if (ctx.isDisposed)
            return;

        return ctx.next(404);

    }
    /**
     * Handles extension-less requests: serves a default document for directory paths, or, when a default
     * extension is configured, maps the path to a file with that extension and renders it. Falls back to
     * 404 or transfers error-code file names to the matching error page.
     *
     * @param ctx Current request context.
     * @returns A promise that resolves once the request has been rendered or passed on.
     */
    private async sendDefaultDocAsync(ctx: IContext): Promise<void> {
        const rpath = ctx.req.path;

        if (!this._hasDefaultExt) {

            if (rpath.charAt(rpath.length - 1) === "/") {
                return await this.passDefaultDocAsync(ctx);
            }

            return ctx.next(404);
        }

        if (rpath.charAt(rpath.length - 1) === "/") {
            return await this.passDefaultDocAsync(ctx);
        }

        const fileName = getFileName(rpath);

        if (!fileName)
            return ctx.next(404);

        if (ctx.server.config.defaultDoc.includes(fileName))
            return ctx.next(404);

        if (HttpStatus.isErrorFileName(fileName /*401*/)) {
            return ctx.transferRequest(toNumber(fileName));
        }

        const path: string = ctx.server.mapPath(
            `/${ctx.req.path}${ctx.server.config.defaultExt}`
        );

        const status = await this._fileInfo.existsAsync(path);
        if (ctx.isDisposed)
            return;

        if (status.exists)
            return ctx.res.render(ctx, status.url);

        return ctx.next(404);
    }

    /**
     * Processes a GET request by trying, in order, an exact route handler, a parameterized route, template
     * rendering, mime-type file serving and default documents, responding 404 when none apply.
     *
     * @param ctx Current request context.
     * @returns A promise that resolves when the request has been handled.
     */
    private async processGetAsync(ctx: IContext): Promise<void> {
        const handlerAsync = this._routeTable.get.get(ctx.path);

        if (handlerAsync) {
            return await handlerAsync(ctx);
        }

        if (await this.fireHandlerAsync(ctx))
            return;

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
                this.httpMimeHandler.renderAsync(ctx);
                return;
            }

            return ctx.next(404, true);
        }

        return await this.sendDefaultDocAsync(ctx);
    }

    /**
     * Processes a POST request using an exact route handler or a parameterized route; responds 404 if none
     * matches.
     *
     * @param ctx Current request context.
     * @returns A promise that resolves when the request has been handled.
     */
    private async processPostAsync(ctx: IContext): Promise<void> {
        const handlerAsync = this._routeTable.post.get(ctx.path);

        if (handlerAsync) {
            return await handlerAsync(ctx);
        }

        if (await this.fireHandlerAsync(ctx))
            return;

        return ctx.next(404);
    }

    /**
     * Dispatches a request: uses an exact any-route handler if present, otherwise delegates to GET or POST
     * processing by method, and responds 404 for other methods.
     *
     * @param ctx Current request context.
     * @returns A promise that resolves when the request has been handled.
     */
    public async processAny(ctx: IContext): Promise<void> {
        
        const handlerAsync = this._routeTable.any.get(
            ctx.path
        );

        if (handlerAsync) {
            return await handlerAsync(ctx);
        }

        if (ctx.req.method === "POST")
            return await this.processPostAsync(ctx);

        if (ctx.req.method === "GET")
            return await this.processGetAsync(ctx);

        return ctx.next(404);
    }

    /**
     * Removes the route registered for the given path from the any, post or get table (first match found)
     * and from the parameterized router.
     *
     * @param path Route path to remove.
     * @returns True if a route was removed, false if none was registered.
     */
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

        const index: number = this._routeTable.router.findIndex(
            r => r.route === path
        );

        if (index > -1) {
            this._routeTable.router.splice(index, 1);
        }

        return true;
    }

    /**
     * Sorts the parameterized route list in place by ascending route length.
     */
    public sort(): void {
        return this._routeTable.router = this._routeTable.router.sort((a, b) => {
            return a.route.length - b.route.length;
        }), void 0;
    }
}