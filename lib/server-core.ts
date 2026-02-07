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

// 2:40 PM 5/7/2020
// by rajib chy
import './app-global';
import { resolve } from 'node:path';
import * as _zlib from 'node:zlib';
import {
    createServer,
    Server, IncomingMessage, ServerResponse
} from 'node:http';
import { EventEmitter } from 'node:events';
import {
    getRouteInfo, getRouteMatcher,
    type IRequestParam, type ILayerInfo, type IRouteInfo
} from './app-router';
import { Util, assert, getAppDir } from './app-util';
import { existsSync, readFileSync } from 'fs';
import * as _mimeType from './http-mime-types';
import { Socket } from 'node:net';
import { Request, type IRequest } from './request';
import { Response, type IResponse } from './response';
import { injectIncomingOutgoing } from './inject';

type onError = (req: IRequest, res: IResponse, err?: Error | number) => void;
export type NextFunction = (err?: any) => void;
export type HandlerFunc = (req: IRequest, res: IResponse, next: NextFunction, requestParam?: IRequestParam) => void;

export interface IApplication {
    readonly version: string;
    readonly httpServer: Server;
    readonly isRunning: boolean;
    clearHandler(): void;
    use(handler: HandlerFunc): IApplication;
    use(route: string, handler: HandlerFunc, isVirtual?: boolean): IApplication;
    prerequisites(handler: (req: IRequest, res: IResponse, next: NextFunction) => void): IApplication;
    shutdown(next: (err?: Error) => void): Promise<void> | void;
    shutdownAsync(): Promise<void>;
    on(ev: 'request-begain', handler: (req: IRequest) => void): IApplication;
    on(ev: 'response-end', handler: (req: IRequest, res: IResponse) => void): IApplication;
    on(ev: 'error', handler: onError): IApplication;
    on(ev: 'shutdown', handler: () => void): IApplication;
    listen(handle: any, listeningListener?: () => void): IApplication;
}

export const {
    appVersion, readAppVersion
} = (() => {
    let _appVersion: string = '4.1.1';
    const _readAppVersion = (): string => {
        const libRoot: string = getAppDir();
        const absPath: string = resolve(`${libRoot}/package.json`);
        assert(existsSync(absPath), `No package.json found in ${libRoot}\nplease re-install cwserver`);
        const data: string = readFileSync(absPath, "utf-8");
        _appVersion = Util.JSON.parse(data).version;
        return _appVersion;
    }
    return {
        get appVersion() {
            return _appVersion;
        },
        get readAppVersion() {
            return _readAppVersion;
        }
    }
})();

class Application extends EventEmitter implements IApplication {
    private _httpServer: Server;
    private _connectionKey: number;
    private _connectionMap: Map<string, Socket>;
    private _appHandler: ILayerInfo<HandlerFunc>[];
    private _prerequisitesHandler: ILayerInfo<HandlerFunc>[];
    private _isRunning: boolean;

    public get version(): string {
        return appVersion;
    }

    public get httpServer(): Server {
        return this._httpServer;
    }

    public get isRunning(): boolean {
        return this._isRunning;
    }

    constructor(httpServer: Server) {
        super();
        this._httpServer = httpServer;
        this._appHandler = [];
        this._prerequisitesHandler = [];
        this._isRunning = false;
        this._connectionMap = new Map();
        this._connectionKey = 0;
    }

    public clearHandler(): void {
        if (this._appHandler.length > 0) {
            this._appHandler.length = 0;
        }
        if (this._prerequisitesHandler.length > 0) {
            this._prerequisitesHandler.length = 0;
        }
    }

    private _shutdown(): Promise<void> {

        let resolveTerminating: (value?: void | PromiseLike<void> | undefined) => void;
        let rejectTerminating: (reason?: any) => void;

        const promise = new Promise<void>((presolve, reject) => {
            resolveTerminating = presolve;
            rejectTerminating = reject;
        });

        if (!this._isRunning) {
            setImmediate(() => {
                rejectTerminating(new Error('Server not running....'));
            });
        } else {
            this._isRunning = false;
            this._httpServer.once('close', () => resolveTerminating());
            this._httpServer.close();
            // bug solved at 6:00 PM 12/13/2024
            // this._httpServer.close().once('close', () => resolveTerminating());
        }

        this._destroyActiveSocket();

        return promise;
    }

    private _destroyActiveSocket(): void {

        for (const socket of this._connectionMap.values()) {
            socket.destroy();
        }

        this._connectionMap.clear();
    }

    public shutdown(next: (err?: Error | undefined) => void): void {
        this.emit('shutdown');
        return this._shutdown().then(() => next()).catch((err) => next(err)), void 0;
    }

    public shutdownAsync(): Promise<void> {
        this.emit('shutdown');
        return this._shutdown();
    }

    private _handleRequest(
        req: IRequest, res: IResponse,
        handlers: ILayerInfo<HandlerFunc>[],
        next: NextFunction,
        isPrerequisites: boolean
    ): void {

        if (handlers.length === 0) return next();

        let isRouted: boolean = false;
        let count: number = 0;

        const Loop = (): void => {

            const inf: ILayerInfo<HandlerFunc> | undefined = handlers[count];

            if (!inf) {
                return next();
            }

            if (!inf.route || isPrerequisites === true) {
                return inf.handler(req, res, _next);
            }

            if (isRouted) {
                return process.nextTick(() => _next());
            }

            const routeInfo: IRouteInfo<HandlerFunc> | undefined = getRouteInfo(req.path, handlers, 'ANY');
            isRouted = true;

            if (routeInfo) {

                if (routeInfo.layer.routeMatcher) {
                    req.path = routeInfo.layer.routeMatcher.replace(req.path);
                }

                try {
                    return routeInfo.layer.handler(req, res, _next);
                } catch (e) {
                    return this.emit('error', req, res, e), void 0;
                }
            }

            return process.nextTick(() => _next());
        }

        const _next = (statusCode?: number | Error): any => {
            if (statusCode instanceof Error) {
                return this.emit('error', req, res, statusCode), void 0;
            }
            count++;
            return Loop();
        }

        return Loop();
    }

    public handleRequest(req: IRequest, res: IResponse): void {
        return this._handleRequest(req, res, this._prerequisitesHandler, (err?: Error): void => {
            return this._handleRequest(req, res, this._appHandler, (_err?: Error): void => {
                return this.emit('error', req, res, _err), void 0;
            }, false);
        }, true);
    }

    public prerequisites(handler: HandlerFunc): IApplication {
        
        if (typeof (handler) !== 'function') {
            throw new Error('handler should be function');
        }

        return this._prerequisitesHandler.push({
            handler, routeMatcher: void 0, pathArray: [], method: 'ANY', route: ''
        }), this;
    }

    public use(...args: any[]): IApplication {

        const argtype0 = typeof (args[0]);
        const argtype1 = typeof (args[1]);

        if (argtype0 === 'function') {

            return this._appHandler.push({
                handler: args[0], routeMatcher: void 0,
                pathArray: [], method: 'ANY', route: ''
            }), this;

        }

        if (argtype0 === 'string' && argtype1 === 'function') {

            const route: string = args[0];

            if (route.indexOf(':') > -1) {
                throw new Error(`Unsupported symbol defined. ${route}`);
            }

            const isVirtual: boolean = typeof (args[2]) === 'boolean' ? args[2] : false;

            return this._appHandler.push({
                route,
                handler: args[1],
                routeMatcher: getRouteMatcher(route, isVirtual),
                pathArray: [], method: 'ANY'
            }), this;
        }

        throw new Error('Invalid arguments...');
    }

    public listen(handle: any, listeningListener?: () => void): IApplication {

        if (this.isRunning) {
            throw new Error('Server already running....');
        }

        this._httpServer.listen(handle, () => {
            this._isRunning = true;
            if (listeningListener) {
                return listeningListener();
            }
        });

        this._httpServer.on('connection', (socket: Socket) => {
            const connectionKey: string = String(++this._connectionKey);
            this._connectionMap.set(connectionKey, socket);

            socket.on('close', () => {
                this._connectionMap.delete(connectionKey);
            });
        });

        return this;
    }
}

function setAppHeader(res: Response) {
    res.setHeader('server', 'FSys Frontend');
    res.setHeader('x-app-version', appVersion);
    res.setHeader('x-powered-by', 'fsys.tech');
}

export function App(): IApplication {

    injectIncomingOutgoing();

    const app: Application = new Application(createServer((request: IncomingMessage, response: ServerResponse) => {

        const req: Request = request as Request; //Object.setPrototypeOf(request, Request.prototype);
        const res: Response = response as Response; //Object.setPrototypeOf(response, Response.prototype);

        try {

            setAppHeader(res);

            if (req.method) {
                res.method = req.method;
            }

            res.on('close', (...args: any[]): void => {
                res.isAlive = false;
                app.emit('response-end', req, res);
            });

            app.emit('request-begain', req);
            app.handleRequest(req, res);

        } catch (e) {
            // Caught while prerequisites error happens
            app.emit('error', req, res, e);
        }
    }));

    return app;
}