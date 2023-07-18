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

// 2:40 PM 5/7/2020
// by rajib chy
import './app-global';
import {
    createServer, OutgoingHttpHeaders,
    Server, IncomingMessage, ServerResponse
} from 'node:http';
import { EventEmitter } from 'node:events';
import { IRequestParam, ILayerInfo, IRouteInfo, getRouteInfo, getRouteMatcher } from './app-router';
import { ToResponseTime, toString, ISession, IResInfo } from './app-static';
import { HttpStatus } from './http-status';
import { IContext } from './server';
import { Template } from './app-template';
import { Util, assert, getAppDir } from './app-util';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'node:path';
import urlHelpers, { UrlWithParsedQuery } from 'node:url';
import * as _zlib from 'node:zlib';
import * as _mimeType from './http-mime-types';
import { Socket } from 'node:net';
type ParsedUrlQuery = { [key: string]: string | string[] | undefined; };
type onError = (req: IRequest, res: IResponse, err?: Error | number) => void;
export type NextFunction = (err?: any) => void;
export type HandlerFunc = (req: IRequest, res: IResponse, next: NextFunction, requestParam?: IRequestParam) => void;
export interface CookieOptions {
    maxAge?: number;
    signed?: boolean;
    /** Date | timestamp */
    expires?: Date | number;
    httpOnly?: boolean;
    path?: string;
    domain?: string;
    secure?: boolean;
    encode?: (val: string) => string;
    sameSite?: boolean | 'lax' | 'strict' | 'none';
}
export interface IRequest extends IncomingMessage {
    readonly q: UrlWithParsedQuery;
    readonly id: string;
    readonly cookies: NodeJS.Dict<string>;
    readonly query: ParsedUrlQuery;
    readonly ip: string;
    readonly isMobile: boolean;
    readonly isLocal: boolean;
    cleanSocket: boolean;
    path: string;
    session: ISession;
    get(name: string): string | void;
    setSocketNoDelay(noDelay?: boolean): void;
    dispose(): void;
}
export interface IResponse extends ServerResponse {
    readonly isAlive: boolean;
    readonly statusCode: number;
    cleanSocket: boolean;
    json(body: NodeJS.Dict<any>, compress?: boolean, next?: (error: Error | null) => void): void;
    status(code: number, headers?: OutgoingHttpHeaders): IResponse;
    asHTML(code: number, contentLength?: number, isGzip?: boolean): IResponse;
    asJSON(code: number, contentLength?: number, isGzip?: boolean): IResponse;
    cookie(name: string, val: string, options: CookieOptions): IResponse;
    get(name: string): string | void;
    set(field: string, value: number | string | string[]): IResponse;
    redirect(url: string, force?: boolean): void;
    render(ctx: IContext, path: string, status?: IResInfo): void;
    type(extension: string): IResponse;
    noCache(): IResponse;
    sendIfError(err?: any): boolean;
    send(chunk?: Buffer | string | number | boolean | { [key: string]: any }): void;
    dispose(): void;
}
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
    let _appVersion: string = '3.1.5';
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

const getCook = (cooks: string[]): NodeJS.Dict<string> => {
    const cookies: { [x: string]: any; } = {};
    cooks.forEach((value) => {
        const index = value.indexOf('=');
        if (index < 0) return;
        cookies[value.substring(0, index).trim()] = value.substring(index + 1).trim();
    });
    return cookies;
}
export function parseCookie(
    cook: undefined | string[] | string | { [x: string]: any; }
): NodeJS.Dict<string> {
    if (!cook) return {};
    if (Array.isArray(cook)) return getCook(cook);
    if (cook instanceof Object) return cook;
    return getCook(cook.split(';'));
}
export function escapePath(unsafe?: string | null): string {
    if (!unsafe) return "";
    return unsafe
        .replace(/%/gi, "")
        .replace(/=/gi, "")
        .replace(/</gi, "")
        .replace(/>/gi, "")
        .replace(/&/gi, "")
        .trim()
        ;
}
function createCookie(name: string, val: string, options: CookieOptions): string {
    let str = `${name}=${val}`;
    if (options.domain)
        str += `;Domain=${options.domain}`;
    if (options.path) {
        str += `;Path=${options.path}`;
    } else {
        str += ';Path=/';
    }
    if (options.expires && !options.maxAge)
        str += `;Expires=${ToResponseTime(options.expires)}`;
    if (options.maxAge && !options.expires)
        str += `;Expires=${ToResponseTime(Date.now() + options.maxAge)}`;
    if (options.secure)
        str += '; Secure';
    if (options.httpOnly)
        str += '; HttpOnly';
    if (options.sameSite) {
        switch (options.sameSite) {
            case true: str += ';SameSite=Strict'; break;
            case 'lax': str += ';SameSite=Lax'; break;
            case 'strict': str += ';SameSite=Strict'; break;
            case 'none': str += ';SameSite=None'; break;
        }
    }
    if (options.secure) {
        str += ';Secure';
    }
    return str;
}
function getCommonHeader(contentType: string, contentLength?: number, isGzip?: boolean): OutgoingHttpHeaders {
    const header: OutgoingHttpHeaders = {
        'Content-Type': contentType
    };
    if (typeof (contentLength) === 'number') {
        header['Content-Length'] = contentLength;
    }
    if (typeof (isGzip) === 'boolean' && isGzip === true) {
        header['Content-Encoding'] = 'gzip';
    }
    return header;
}
function parseIp(ip: string): string | void {
    if (ip.includes("::ffff:")) {
        ip = ip.split(':').reverse()[0];
    }
    return ip;
}
export function getClientIp(req: IRequest): string {
    const res = req.headers['x-forwarded-for'];
    let ip: string | void;
    if (res && typeof (res) === 'string') {
        ip = parseIp(res.split(',')[0]);
        if (ip) return ip;
    }
    ip = parseIp(toString(req.socket.remoteAddress));
    return toString(ip);
}
export function parseUrl(url?: string): UrlWithParsedQuery {
    if (url) {
        return urlHelpers.parse(url, true);
    }
    return Object.create({
        pathname: null, query: {}
    });
}
class Request extends IncomingMessage implements IRequest {
    private _q: UrlWithParsedQuery | undefined;
    private _cookies: NodeJS.Dict<string> | undefined;
    private _path: string | undefined;
    private _session: ISession | undefined;
    private _ip: string | undefined;
    private _id: string | undefined;
    private _cleanSocket: boolean | undefined;
    private _isMobile: boolean | undefined;
    private _isLocal: boolean | undefined;
    public get isMobile() {
        if (this._isMobile !== undefined) return this._isMobile;
        const userAgent: string = toString(this.get('user-agent'));
        this._isMobile = /mobile/gi.test(userAgent);
        return this._isMobile;
    }
    public get cleanSocket() {
        if (this._cleanSocket === undefined) return false;
        return this._cleanSocket;
    }
    public set cleanSocket(val: boolean) {
        this._cleanSocket = val;
    }
    public get q(): UrlWithParsedQuery {
        if (this._q !== undefined) return this._q;
        this._q = parseUrl(this.url);
        return this._q;
    }
    public get cookies(): NodeJS.Dict<string> {
        if (this._cookies !== undefined) return this._cookies;
        this._cookies = parseCookie(this.headers.cookie);
        return this._cookies;
    }
    public get session(): ISession {
        return this._session || Object.create({});
    }
    public set session(val: ISession) {
        this._session = val;
    }
    public get isLocal() {
        if (this._isLocal !== undefined) return this._isLocal;
        this._isLocal = this.ip === '::1' || this.ip === '127.0.0.1';
        return this._isLocal;
    }
    public get path(): string {
        if (this._path !== undefined) return this._path;
        this._path = decodeURIComponent(escapePath(this.q.pathname));
        return this._path;
    }
    public set path(val: string) {
        this._path = val;
    }
    public get ip(): string {
        if (this._ip !== undefined) return this._ip;
        this._ip = getClientIp(this);
        return this._ip;
    }
    public get id(): string {
        if (this._id !== undefined) return this._id;
        this._id = Util.guid();
        return this._id;
    }
    public get query(): ParsedUrlQuery {
        return this.q.query;
    }
    public get(name: string): string | void {
        const val: number | string | string[] | undefined = this.headers[name];
        if (val !== undefined) {
            return String(val);
        }
    }
    public setSocketNoDelay(noDelay?: boolean) {
        if (this.socket) {
            this.socket.setNoDelay(noDelay);
        }
    }
    dispose(): void {
        delete this._id;
        delete this._q;
        delete this._path;
        delete this._ip;
        delete this._cookies;
        delete this._isLocal;
        if (this.cleanSocket || process.env.TASK_TYPE === 'TEST') {
            this.removeAllListeners();
            this.destroy();
        }
    }
}
class Response extends ServerResponse implements IResponse {
    private _isAlive: boolean | undefined;
    private _method: string | undefined;
    private _cleanSocket: boolean | undefined;
    private _statusCode: number | undefined;
    // @ts-ignore
    public get statusCode() {
        return this._statusCode === undefined ? 0 : this._statusCode;
    }
    public set statusCode(code: number) {
        if (!HttpStatus.isValidCode(code))
            throw new Error(`Invalid status code ${code}`);
        this._statusCode = code;
    }
    public get cleanSocket() {
        if (this._cleanSocket === undefined) return false;
        return this._cleanSocket;
    }
    public set cleanSocket(val: boolean) {
        this._cleanSocket = val;
    }
    public get isAlive() {
        if (this._isAlive !== undefined) return this._isAlive;
        this._isAlive = true;
        return this._isAlive;
    }
    public set isAlive(val: boolean) {
        this._isAlive = val;
    }
    public get method() {
        return toString(this._method);
    }
    public set method(val: string) {
        this._method = val;
    }
    public noCache(): IResponse {
        const header: string | void = this.get('cache-control');
        if (header) {
            if (header.indexOf('must-revalidate') > -1) {
                return this;
            }
            this.removeHeader('cache-control');
        }
        this.setHeader('cache-control', 'no-store, no-cache, must-revalidate, immutable');
        return this;
    }
    public status(code: number, headers?: OutgoingHttpHeaders): IResponse {
        this.statusCode = code;
        if (headers) {
            for (const name in headers) {
                const val: number | string | string[] | undefined = headers[name];
                if (!val) continue;
                this.setHeader(name, val);
            }
        }
        return this;
    }
    public get(name: string): string | void {
        const val: number | string | string[] | undefined = this.getHeader(name);
        if (val) {
            if (Array.isArray(val)) {
                return Util.JSON.stringify(val);
            }
            return toString(val);
        }
    }
    public set(field: string, value: number | string | string[]): IResponse {
        return this.setHeader(field, value), this;
    }
    public type(extension: string): IResponse {
        return this.setHeader('Content-Type', _mimeType.getMimeType(extension)), this;
    }
    public send(chunk?: any): void {
        if (this.headersSent) {
            throw new Error("If you use res.writeHead(), invoke res.end() instead of res.send()");
        }
        if (204 === this.statusCode || 304 === this.statusCode) {
            this.removeHeader('Content-Type');
            this.removeHeader('Content-Length');
            this.removeHeader('Transfer-Encoding');
            return this.end(), void 0;
        }
        if (this.method === "HEAD") {
            return this.end(), void 0;
        }
        switch (typeof (chunk)) {
            case 'undefined': throw new Error("Body required....");
            case 'string':
                if (!this.get('Content-Type')) {
                    this.type('html');
                }
                break;
            case 'boolean':
            case 'number':
                if (!this.get('Content-Type')) {
                    this.type('text');
                }
                chunk = String(chunk);
            case 'object':
                if (Buffer.isBuffer(chunk)) {
                    if (!this.get('Content-Type')) {
                        this.type('bin');
                    }
                } else {
                    this.type("json");
                    chunk = Util.JSON.stringify(chunk);
                }
                break;
        }
        let len: number = 0;
        if (Buffer.isBuffer(chunk)) {
            // get length of Buffer
            len = chunk.length;
        } else {
            // convert chunk to Buffer and calculate
            chunk = Buffer.from(chunk, "utf-8");
            len = chunk.length;
        }
        this.set('Content-Length', len);
        return this.end(chunk), void 0;
    }
    public asHTML(code: number, contentLength?: number, isGzip?: boolean): IResponse {
        return this.status(code, getCommonHeader(_mimeType.getMimeType("html"), contentLength, isGzip)), this;
    }
    public asJSON(code: number, contentLength?: number, isGzip?: boolean): IResponse {
        return this.status(code, getCommonHeader(_mimeType.getMimeType('json'), contentLength, isGzip)), this;
    }
    public render(ctx: IContext, path: string, status?: IResInfo): void {
        return Template.parse(ctx, path, status);
    }
    public redirect(url: string, force?: boolean): void {
        if (force) {
            this.noCache();
        }
        return this.status(this.statusCode, {
            'Location': url
        }).end(), void 0;
    }
    public cookie(name: string, val: string, options: CookieOptions): IResponse {
        let sCookie: number | string | string[] | undefined = this.getHeader('Set-Cookie');
        if (Array.isArray(sCookie)) {
            this.removeHeader('Set-Cookie');
        } else {
            sCookie = [];
        }
        sCookie.push(createCookie(name, val, options));
        return this.setHeader('Set-Cookie', sCookie), this;
    }
    public sendIfError(err?: any): boolean {
        if (!this.isAlive) return true;
        if (!err || !Util.isError(err)) return false;
        this.status(500, {
            'Content-Type': _mimeType.getMimeType('text')
        }).end(`Runtime Error: ${err.message}`);
        return true;
    }
    public json(body: NodeJS.Dict<any>, compress?: boolean, next?: (error: Error | null) => void): void {
        const buffer: Buffer = Buffer.from(Util.JSON.stringify(body), "utf-8");
        if (typeof (compress) === 'boolean' && compress === true) {
            return _zlib.gzip(buffer, (error: Error | null, buff: Buffer) => {
                if (!this.sendIfError(error)) {
                    this.asJSON(200, buff.length, true).end(buff);
                }
            }), void 0;
        }
        return this.asJSON(200, buffer.length).end(buffer), void 0;
    }
    public dispose(): void {
        delete this._method;
        if (this.cleanSocket || process.env.TASK_TYPE === 'TEST') {
            this.removeAllListeners();
            this.destroy();
        }
    }
}
class Application extends EventEmitter implements IApplication {
    private _httpServer: Server;
    private _connectionKey: number;
    private _connectionMap: NodeJS.Dict<Socket>;
    public get version() {
        return appVersion;
    }
    public get httpServer() {
        return this._httpServer;
    }
    private _appHandler: ILayerInfo<HandlerFunc>[];
    private _prerequisitesHandler: ILayerInfo<HandlerFunc>[];
    private _isRunning: boolean;
    public get isRunning() {
        return this._isRunning;
    }
    constructor(httpServer: Server) {
        super();
        this._httpServer = httpServer;
        this._appHandler = [];
        this._prerequisitesHandler = [];
        this._isRunning = false;
        this._connectionMap = {};
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
            this._httpServer.close().once('close', () => resolveTerminating());
        }
        this._destroyActiveSocket();
        return promise;
    }
    private _destroyActiveSocket(): void {
        Object.keys(this._connectionMap).forEach((socketKey) => {
            const _socket: Socket | undefined = this._connectionMap[socketKey];
            if (_socket) {
                _socket.destroy();
            }
        });
        this._connectionMap = {};
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
            if (!inf) return process.nextTick(() => next());
            if (!inf.route || isPrerequisites === true)
                return inf.handler.call(this, req, res, _next);
            if (isRouted) return process.nextTick(() => _next());
            const routeInfo: IRouteInfo<HandlerFunc> | undefined = getRouteInfo(req.path, handlers, 'ANY');
            isRouted = true;
            if (routeInfo) {
                if (routeInfo.layer.routeMatcher) {
                    req.path = routeInfo.layer.routeMatcher.replace(req.path);
                }
                try {
                    return routeInfo.layer.handler.call(this, req, res, _next);
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
        if (typeof (handler) !== 'function')
            throw new Error('handler should be function....');
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
            if (listeningListener)
                return listeningListener();
        });
        this._httpServer.on('connection', (socket: Socket) => {
            const connectionKey: string = String(++this._connectionKey);
            this._connectionMap[connectionKey] = socket;
            socket.on('close', () => {
                delete this._connectionMap[connectionKey];
            });
        });
        return this;
    }
}
function setAppHeader(res: Response) {
    res.setHeader('server', 'SOW Frontend');
    res.setHeader('x-app-version', appVersion);
    res.setHeader('x-powered-by', 'safeonline.world');
}
export function App(): IApplication {
    const app: Application = new Application(createServer((request: IncomingMessage, response: ServerResponse) => {
        const req: IRequest = Object.setPrototypeOf(request, Request.prototype);
        const res: Response = Object.setPrototypeOf(response, Response.prototype);
        try {
            setAppHeader(res);
            if (req.method)
                res.method = req.method;
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