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

// 10:13 PM 5/2/2020
// by rajib chy
import {
    ISession, IResInfo, toString
} from "./app-static";
import { IRequestParam } from './app-router';
import {
    NextFunction, IApplication,
    IRequest, IResponse,
    App as CwAppCore, parseCookie as cookieParser,
    appVersion
} from './server-core';
import * as _fs from 'node:fs';
import * as _path from 'node:path';
import * as fsw from './fsw';
import { Util, getAppDir } from './app-util';
import { Schema } from './schema-validator';
import { Session } from './app-static';
import { ICwDatabaseType } from './db-type';
import { Controller, IController } from './app-controller';
import { Encryption, ICryptoInfo } from "./encryption";
import { HttpStatus } from "./http-status";
import { Logger, ILogger, ShadowLogger } from "./logger";
import { IncomingHttpHeaders } from "node:http";
import { _mimeType } from "./http-mime-types";
import { AppView } from "./app-view";
export type CtxNext = (code?: number | undefined, transfer?: boolean) => void;
export type AppHandler = (ctx: IContext, requestParam?: IRequestParam) => void;
// ----------------------------------------------------------
export interface IContext {
    readonly isDisposed: boolean;
    error?: string;
    errorPage: string;
    errorCode: number;
    readonly res: IResponse;
    readonly req: IRequest;
    path: string;
    extension: string;
    root: string;
    readonly session: ISession;
    servedFrom?: string;
    readonly server: ICwServer;
    next: CtxNext;
    redirect(url: string, force?: boolean): IContext;
    transferRequest(toPath: string | number): void;
    write(chunk: Buffer | string | number | boolean | { [key: string]: any }): void;
    addError(err: NodeJS.ErrnoException | Error): void;
    transferError(err: NodeJS.ErrnoException | Error): void;
    handleError(err: NodeJS.ErrnoException | Error | null | undefined, next: () => void): void;
    setSession(loginId: string, roleId: string, userData: any): IContext;
    signOut(): IContext;
    dispose(): string | void;
}
export interface IServerEncryption {
    encrypt(plainText: string): string;
    decrypt(encryptedText: string): string;
    encryptToHex(plainText: string): string;
    decryptFromHex(encryptedText: string): string;
    encryptUri(plainText: string): string;
    decryptUri(encryptedText: string): string;
}
export interface IDatabaseConfig {
    module: string;
    path: string;
    dbConn: {
        database: string;
        password: string;
        host?: string;
        port?: number;
        user?: string;
    };
}
export interface IServerConfig {
    [key: string]: any;
    Author: string;
    appName: string;
    version: string;
    packageVersion: string;
    isDebug: boolean;
    template: {
        cache: boolean;
        cacheType: string;
        ext: string[];
    };
    encryptionKey: ICryptoInfo;
    session: {
        cookie: string;
        key: ICryptoInfo;
        maxAge: number;
        isSecure: boolean;
    };
    mimeType: string[];
    defaultDoc: string[];
    defaultExt: string;
    views: string[];
    errorPage: NodeJS.Dict<string>;
    hiddenDirectory: string[];
    hostInfo: {
        origin: string[];
        root: string;
        hostName: string;
        frameAncestors?: string;
        tls: boolean;
        cert: NodeJS.Dict<string>;
        port: string | number
    };
    database?: IDatabaseConfig[];
    staticFile: {
        compression: boolean;
        minCompressionSize: number;
        fileCache: false;
        tempPath: string;
    };
    cacheHeader: {
        maxAge: number;
        serverRevalidate: boolean;
    };
    liveStream: string[];
    noCache: string[];
    socketPath?: string;
    bundler: {
        enable: boolean;
        fileCache: boolean;
        route: string;
        compress: boolean;
        tempPath: string;
        reValidate?: boolean;
    };
    /** If `useFullOptimization` true we will set highest priority to memory */
    useFullOptimization: boolean;
}
/**
 * Interface representing a web server.
 */
export interface ICwServer {
    /** The version of the server. */
    readonly version: string;

    /** Mapping of error pages based on status codes. */
    readonly errorPage: { [x: string]: string };

    /** Logger instance for logging server activities. */
    readonly log: ILogger;

    /** Configuration settings of the server. */
    readonly config: IServerConfig;

    /** Encryption utilities used by the server. */
    readonly encryption: IServerEncryption;

    /** Database connections managed by the server. */
    readonly db: NodeJS.Dict<ICwDatabaseType>;

    /** The port number on which the server runs. */
    readonly port: string | number;

    /**
     * Returns the copyright information.
     * @returns {string} The copyright text.
     */
    copyright(): string;

    /** Initializes the server logger. */
    createLogger(): void;

    /**
     * Updates the current server-side encryption settings.
     *
     * If an existing encryption instance is present, it is removed first.
     * When a new `serverEnc` object is provided, it will be assigned as the active encryption.
     * Otherwise, a new {@link ServerEncryption} instance is created using the configured encryption key.
     *
     * @public
     * @param {IServerEncryption} [serverEnc] - Optional custom encryption instance to apply.
     * @returns {void}
     */
    updateEncryption(serverEnc?: IServerEncryption): void;

    /**
     * Validates if the provided context is valid.
     * @param {IContext} ctx - The context to validate.
     * @returns {boolean} `true` if valid, otherwise `false`.
     */
    isValidContext(ctx: IContext): boolean;

    /**
     * Creates a new context for a request.
     * @param {IRequest} req - The incoming request object.
     * @param {IResponse} res - The response object.
     * @param {NextFunction} next - The next middleware function.
     * @returns {IContext} The created request context.
     */
    createContext(req: IRequest, res: IResponse, next: NextFunction): IContext;

    /** Initializes the server and its dependencies. */
    initilize(): void;

    /**
     * Gets the application configuration name.
     * @returns {string} The name of the application configuration.
     */
    getAppConfigName(): string;

    /**
     * Applies the provided configuration settings.
     * @param {NodeJS.Dict<any>} config - Configuration object.
     */
    implimentConfig(config: NodeJS.Dict<any>): void;

    /**
     * Sets default security-related HTTP headers.
     * @param {IResponse} res - The response object.
     */
    setDefaultProtectionHeader(res: IResponse): void;

    /**
     * Parses session data from request headers and cookies.
     * @param {IncomingHttpHeaders} headers - Request headers.
     * @param {undefined | string[] | string | { [x: string]: any }} cook - Cookies from the request.
     * @returns {ISession} The parsed session object.
     */
    parseSession(headers: IncomingHttpHeaders, cook: undefined | string[] | string | { [x: string]: any }): ISession;

    /**
     * Sets a session for a user.
     * @param {IContext} ctx - The request context.
     * @param {string} loginId - The login ID of the user.
     * @param {string} roleId - The role ID of the user.
     * @param {any} userData - Additional user data.
     * @returns {boolean} `true` if session was set successfully.
     */
    setSession(ctx: IContext, loginId: string, roleId: string, userData: any): boolean;

    /**
     * Determines whether the request should propagate an error.
     * @param {IContext} ctx - The request context.
     * @returns {boolean} `true` if the error should be passed.
     */
    passError(ctx: IContext): boolean;

    /**
     * Retrieves the error page path for a given status code.
     * @param {number} statusCode - The HTTP status code.
     * @param {boolean} [tryServer] - Whether to try the server's default error page.
     * @returns {string | void} The path of the error page.
     */
    getErrorPath(statusCode: number, tryServer?: boolean): string | void;

    /**
     * Transfers a request to another path or resource.
     * @param {IContext} ctx - The request context.
     * @param {string | number} path - The target path.
     * @param {IResInfo} [status] - The response status information.
     */
    transferRequest(ctx: IContext, path: string | number, status?: IResInfo): void;

    /**
     * Maps a virtual or relative path to an absolute system path.
     * @param {string} path - The relative path.
     * @returns {string} The mapped absolute path.
     */
    mapPath(path: string): string;

    /**
     * Converts a file system path to a URL path.
     * @param {string} path - The system file path.
     * @returns {string} The corresponding URL path.
     */
    pathToUrl(path: string): string;

    /**
     * Adds an error message to the request context.
     * @param {IContext} ctx - The request context.
     * @param {Error | string} ex - The error object or message.
     * @returns {IContext} The modified request context.
     */
    addError(ctx: IContext, ex: Error | string): IContext;

    /**
     * Escapes a string to prevent XSS vulnerabilities.
     * @param {string | null} [unsafe] - The unsafe input string.
     * @returns {string} The escaped string.
     */
    escape(unsafe?: string | null): string;

    /**
     * Adds a virtual directory mapping.
     * @param {string} route - The route path.
     * @param {string} root - The root directory path.
     * @param {(ctx: IContext) => void} [evt] - Optional event handler for the directory.
     */
    addVirtualDir(route: string, root: string, evt?: (ctx: IContext) => void): void;

    /**
     * Retrieves information about a virtual directory.
     * @param {string} route - The virtual directory route.
     * @returns {{ route: string; root: string } | void} The virtual directory details.
     */
    virtualInfo(route: string): { route: string; root: string } | void;

    /**
     * Formats a file system path for consistency.
     * @param {string} path - The path to format.
     * @param {boolean} [noCheck] - Whether to skip validation checks.
     * @returns {string} The formatted path.
     */
    formatPath(path: string, noCheck?: boolean): string;

    /**
     * Creates a resource bundle from a given string.
     * @param {string} str - The input string.
     * @returns {string} The generated bundle.
     */
    createBundle(str: string): string;

    /**
     * Adds a new MIME type mapping.
     * @param {string} extension - The file extension (e.g., `.json`).
     * @param {string} val - The corresponding MIME type (e.g., `application/json`).
     */
    addMimeType(extension: string, val: string): void;

    /**
     * Retrieves the root directory of the server.
     * @returns {string} The root directory path.
     */
    getRoot(): string;

    /**
     * Retrieves the public directory of the server.
     * @returns {string} The public directory path.
     */
    getPublic(): string;

    /**
     * Retrieves the name of the public directory.
     * @returns {string} The public directory name.
     */
    getPublicDirName(): string;

    /**
     * Parses and normalizes the max-age value for caching.
     * @param {any} maxAge - The max-age input.
     * @returns {number} The normalized max-age in seconds.
     */
    parseMaxAge(maxAge: any): number;

    /**
     * Creates and returns a new Vim context object.
     *
     * @returns {NodeJS.Dict<any>} A newly created Vim context as a dictionary-like object.
     */
    createVimContext(): NodeJS.Dict<any>;

    /**
     * Registers an event listener for server events.
     * @param {'shutdown'} ev - The event name.
     * @param {() => void} handler - The event handler function.
     */
    on(ev: "shutdown", handler: () => void): void;
}

export type IViewHandler = (app: IApplication, controller: IController, server: ICwServer) => void;
// -------------------------------------------------------
export const {
    disposeContext, removeContext,
    getContext, getMyContext
} = (() => {
    const _curContext: { [key: string]: IContext } = {};
    return {
        disposeContext(ctx: IContext): void {
            const reqId: string | void = ctx.dispose();
            if (reqId) {
                if (_curContext[reqId]) {
                    delete _curContext[reqId];
                }
            }
            return void 0;
        },
        getMyContext(id: string): IContext | undefined {
            const ctx: IContext = _curContext[id];
            if (!ctx) return undefined;
            return ctx;
        },
        removeContext(id: string): void {
            const ctx: IContext = _curContext[id];
            if (!ctx) return;
            disposeContext(ctx);
            return void 0;
        },
        getContext(server: ICwServer, req: IRequest, res: IResponse): IContext {
            if (_curContext[req.id]) return _curContext[req.id];
            const context: IContext = new Context(server, req, res);
            _curContext[req.id] = context;
            return context;
        }
    };
})();

function isDefined<T>(a: T | null | undefined): a is T {
    return a !== null && a !== undefined;
}

function getEpoch(type: string, add: number, maxAge: string): number {
    switch (type) {
        case "M": return (add * 60 * 1000); // Minute
        case "H": return getEpoch("M", 60, maxAge) * add; // Hour
        case "D": return getEpoch("H", 24, maxAge) * add; // Day
        case "MM": return getEpoch("D", 30, maxAge) * add; // Month
        default: throw new Error(`Invalid maxAage format ${maxAge}`);
    }
}

function parseMaxAge(maxAge: any): number {
    if (typeof (maxAge) !== "string") throw new Error(`Invalid maxAage...`);
    let add: string = "", type: string = "";
    for (const part of maxAge) {
        if (/^\d$/.test(part)) {
            if (type.length > 0) throw new Error(`Invalid maxAage format ${maxAge}`);
            add += part; continue;
        }
        type += part;
    }
    if (type.length === 0 || add.length === 0)
        throw new Error(`Invalid maxAage format ${maxAge}`);
    return getEpoch(type.toUpperCase(), parseInt(add), maxAge);
}

const _formatPath = (() => {
    const _exportPath = (server: ICwServer, path: string): string | void => {
        if (path === "root") return server.getRoot();
        if (path === "public") return server.getPublicDirName();
        return undefined;
    }
    return (server: ICwServer, path: string, noCheck?: boolean): string => {
        if (/\$/gi.test(path) === false) return path;
        const absPath: string = _path.resolve(path.replace(/\$.+?\//gi, (m) => {
            m = m.replace(/\$/gi, "").replace(/\//gi, "");
            const epath: string | void = _exportPath(server, m.replace(/\$/gi, "").replace(/\//gi, ""));
            if (!epath) {
                throw new Error(`Invalid key ${m}`);
            }
            return `${epath}/`;
        }));
        if (noCheck === true) return absPath;
        if (!_fs.existsSync(absPath))
            throw new Error(`No file found\r\nPath:${absPath}\r\Request Path:${path}`);
        return absPath;
    };
})();

export class ServerEncryption implements IServerEncryption {
    private cryptoInfo: ICryptoInfo;
    constructor(inf: ICryptoInfo) {
        this.cryptoInfo = inf;
    }
    encrypt(plainText: string): string {
        return Encryption.encrypt(plainText, this.cryptoInfo);
    }
    decrypt(encryptedText: string): string {
        return Encryption.decrypt(encryptedText, this.cryptoInfo);
    }
    encryptToHex(plainText: string): string {
        return Encryption.encryptToHex(plainText, this.cryptoInfo);
    }
    decryptFromHex(encryptedText: string): string {
        return Encryption.decryptFromHex(encryptedText, this.cryptoInfo);
    }
    encryptUri(plainText: string): string {
        return Encryption.encryptUri(plainText, this.cryptoInfo);
    }
    decryptUri(encryptedText: string): string {
        return Encryption.decryptUri(encryptedText, this.cryptoInfo);
    }
}
export class Context implements IContext {
    private _isDisposed: boolean;
    public get isDisposed(): boolean {
        return this._isDisposed;
    }
    public error?: string;
    public errorPage: string;
    public errorCode: number;
    private _res: IResponse;
    private _req: IRequest;
    public get res(): IResponse {
        return this._res;
    }
    public get req(): IRequest {
        return this._req;
    }
    public path: string;
    public extension: string;
    public root: string;
    public get session(): ISession {
        return this._req.session;
    }
    public servedFrom?: string;
    private _server: ICwServer;
    public get server(): ICwServer {
        return this._server;
    }
    private _next?: CtxNext;
    public get next(): CtxNext {
        if (!this._isDisposed && this._next) return this._next;
        return (code?: number, transfer?: boolean): void => {
            if (this._isDisposed) return;
            // Unreachable....
            console.warn('Warning: `context already disposed or "next" function doesn\'t set yet`');
        };
    }
    public set next(val: CtxNext) {
        this._next = val;
    }
    constructor(
        server: ICwServer,
        req: IRequest,
        res: IResponse
    ) {
        this._isDisposed = false;
        this.error = void 0; this.path = ""; this.root = "";
        this._res = res; this._req = req; this._server = server;
        this.extension = ""; this.errorPage = ""; this.errorCode = 0;
    }
    addError(err: NodeJS.ErrnoException | Error): void {
        if (!this._isDisposed) {
            this._server.addError(this, err)
        }
    }
    transferError(err: NodeJS.ErrnoException | Error): void {
        if (!this._isDisposed) {
            this._server.addError(this, err);
            return this._server.transferRequest(this, 500);
        }
    }
    handleError(err: NodeJS.ErrnoException | Error | null | undefined, next: () => void): void {
        if (!this._isDisposed && !this._res.headersSent) {
            if (Util.isError(err)) {
                return this.transferError(err);
            }
            try {
                return next();
            } catch (e: any) {
                return this.transferError(e);
            }
        }
        // Nothing to do, context destroyed or response header already been sent
    }
    redirect(url: string, force?: boolean): IContext {
        if (!this._isDisposed) {
            this._res.status(302).redirect(url, force);
        }
        return this;
    }
    write(chunk: Buffer | string | number | boolean | { [key: string]: any }): void {
        if (!this._isDisposed) {
            return this._res.write(chunk), void 0;
        }
    }
    transferRequest(path: string | number): void {
        if (!this._isDisposed) {
            return this._server.transferRequest(this, path);
        }
    }
    signOut(): IContext {
        if (!this._isDisposed) {
            this._res.cookie(this._server.config.session.cookie, "", {
                expires: -1
            });
        }
        return this;
    }
    setSession(loginId: string, roleId: string, userData: any): IContext {
        if (!this._isDisposed) {
            this._server.setSession(this, loginId, roleId, userData);
        }
        return this;
    }
    dispose(): string | void {
        if (this._isDisposed) return void 0;
        this._isDisposed = true;
        delete this._next;
        const id: string = this._req.id;
        // @ts-ignore
        delete this._server; delete this.path;
        // @ts-ignore
        this._res.dispose(); delete this._res;
        // @ts-ignore
        this._req.dispose(); delete this._req;
        // @ts-ignore
        delete this.extension; delete this.root;
        delete this.servedFrom; delete this.error;
        return id;
    }
}

export class ServerConfig implements IServerConfig {
    [key: string]: any;
    Author: string;
    appName: string;
    version: string;
    packageVersion: string;
    isDebug: boolean;
    encryptionKey: ICryptoInfo;
    session: {
        cookie: string; key: ICryptoInfo; maxAge: number;
        isSecure: boolean;
    };
    mimeType: string[];
    defaultDoc: string[];
    defaultExt: string;
    views: string[];
    errorPage: NodeJS.Dict<string>;
    hiddenDirectory: string[];
    hostInfo: {
        origin: string[];
        root: string;
        hostName: string;
        frameAncestors?: string;
        tls: boolean;
        cert: NodeJS.Dict<string>;
        port: string | number;
    };
    database?: IDatabaseConfig[];
    staticFile: {
        compression: boolean;
        minCompressionSize: number;
        fileCache: false;
        tempPath: string;
    };
    cacheHeader: {
        maxAge: number;
        serverRevalidate: boolean;
    };
    liveStream: string[];
    noCache: string[];
    socketPath?: string;
    bundler: {
        enable: boolean;
        fileCache: boolean;
        route: string;
        compress: boolean;
        tempPath: string;
        reValidate?: boolean;
    };
    template: {
        cache: boolean;
        cacheType: string;
        ext: string[];
    };
    useFullOptimization: boolean;
    constructor() {
        this.Author = "FSys Tech Ltd.";
        this.appName = "Cw Server";
        this.version = "0.0.1";
        this.packageVersion = "101";
        this.isDebug = true;
        this.encryptionKey = Object.create(null);
        this.session = {
            "cookie": "_Cw_session",
            "key": Object.create(null),
            "maxAge": 100,
            isSecure: false
        };
        this.defaultDoc = [];
        this.mimeType = [];
        this.defaultExt = "";
        this.views = [];
        this.errorPage = {};
        this.hiddenDirectory = [];
        this.template = {
            cache: true,
            cacheType: "FILE",
            ext: []
        };
        this.hostInfo = {
            "origin": [],
            "root": "www",
            "hostName": "localhost",
            "frameAncestors": void 0,
            "tls": false,
            "cert": {},
            "port": 8080
        };
        this.staticFile = {
            compression: true,
            minCompressionSize: 1024 * 5,
            fileCache: false,
            tempPath: "/web/temp/cache/"
        };
        this.cacheHeader = {
            maxAge: parseMaxAge("30D"), // 30Day
            serverRevalidate: true
        };
        this.liveStream = [];
        this.noCache = [];
        this.bundler = {
            enable: true,
            fileCache: true,
            route: "/app/api/bundle/",
            compress: true,
            reValidate: true,
            tempPath: "/web/temp/"
        };
        this.useFullOptimization = true;
    }
}
// prevent session hijacking
export class SessionSecurity {
    constructor() {
        throw new Error("Invalid initilization...");
    }
    public static getRemoteAddress(ip: string): string {
        let ipPart: string = ip.substring(0, ip.lastIndexOf('.'));
        if (!ipPart) {
            // assume local machine
            ipPart = "127.0.0";
        }
        return ipPart;
    }
    public static createSession(req: IRequest, sessionObj: NodeJS.Dict<any>): string {
        sessionObj.ipPart = this.getRemoteAddress(req.ip);
        return Util.JSON.stringify(sessionObj);
    }
    public static isValidSession(req: IRequest): void {
        if (!req.session.isAuthenticated) return;
        if (!req.session.ipPart || req.session.ipPart !== this.getRemoteAddress(req.ip)) {
            // prevent session hijack
            req.session.isAuthenticated = false;
        }
        return;
    }
}
export class CwServer implements ICwServer {
    private _public: string;
    private _log: ILogger;
    private _root: string;
    // private preRegx: RegExp;
    private _rootregx: RegExp;
    private _publicregx: RegExp;
    private _config: IServerConfig;
    private _port: string | number;
    private _nodeModuleregx: RegExp;
    private _userInteractive: boolean;
    private _encryption: IServerEncryption;
    private _isInitilized: boolean = false;
    private _db: NodeJS.Dict<ICwDatabaseType>;
    private _errorPage: { [x: string]: string; };
    public get version() {
        return appVersion;
    }
    public get isInitilized() {
        return this._isInitilized;
    }
    public get config(): IServerConfig {
        return this._config;
    }
    public get public(): string {
        return this._public;
    }
    public get log(): ILogger {
        return this._log;
    }
    public get port(): string | number {
        return this._port;
    }
    public get db(): NodeJS.Dict<ICwDatabaseType> {
        return this._db;
    }
    public get encryption(): IServerEncryption {
        return this._encryption;
    }

    public get errorPage(): { [x: string]: string; } {
        return this._errorPage;
    }

    constructor(appRoot: string, wwwName?: string) {
        this._port = 0; this._log = Object.create(null);
        if (!wwwName) {
            if (process.env.IISNODE_VERSION) {
                throw new Error(`
web.config error.\r\nInvalid web.config defined.
Behind the <configuration> tag in your web.config add this
  <appSettings>
    <add key="your-iis-app-pool-id" value="your-app-root" />
  </appSettings>
your-app-root | directory name should be exists here
${appRoot}\\www_public
` );
            }
            throw new Error(`Argument missing.\r\ne.g. node server my_app_root.\r\nApp Root like your application root directory name...\r\nWhich should be exists here\r\n${appRoot}\\my_app_root`);
        }
        this._root = appRoot;
        this._public = wwwName.toString().trim();
        this._config = new ServerConfig();
        this._db = Object.create(null);
        const absPath: string = _path.resolve(`${this._root}/${this._public}/config/${this.getAppConfigName()}`);
        if (!_fs.existsSync(absPath)) throw new Error(`No config file found in ${absPath}`);
        const config: NodeJS.Dict<any> | void = fsw.readJsonSync<IServerConfig>(absPath);
        if (!config) throw new Error(`Invalid config file defined.\r\nConfig: ${absPath}`);
        Schema.Validate(config);
        if (this._public !== config.hostInfo.root) {
            throw new Error(`Server ready for App Root: ${this._public}.\r\nBut host_info root path is ${config.hostInfo.root}.\r\nApp Root like your application root directory name...`);
        }
        const libRoot: string = getAppDir();
        this._errorPage = {
            "404": _path.resolve(`${libRoot}/dist/error_page/404.html`),
            "401": _path.resolve(`${libRoot}/dist/error_page/401.html`),
            "500": _path.resolve(`${libRoot}/dist/error_page/500.html`)
        };
        Util.extend(this._config, config, true);
        this.implimentConfig(config);
        this._publicregx = new RegExp(`${this._public}/`, "gi");
        this._rootregx = new RegExp(this._root.replace(/\\/gi, '/'), "gi");
        // this.preRegx = new RegExp("<pre[^>]*>", "gi"); // /<pre[^>]*>/gi
        this._nodeModuleregx = new RegExp(`${this._root.replace(/\\/gi, '/').replace(/\/dist/gi, "")}/node_modules/`, "gi");
        this._userInteractive = false;
        this.initilize();
        this._encryption = new ServerEncryption(this._config.encryptionKey);
        fsw.mkdirSync(this.getPublic(), "/web/temp/cache/");
        this.on = Object.create(null);
        this.addVirtualDir = Object.create(null);
        this.virtualInfo = Object.create(null);
        this._config.bundler.tempPath = this.mapPath(this._config.bundler.tempPath);
        this._config.staticFile.tempPath = this.mapPath(this._config.staticFile.tempPath);
        this._log = new ShadowLogger();
        return;
    }

    public createVimContext(): NodeJS.Dict<any> {
        return {};
    }
    
    public updateEncryption(serverEnc?: IServerEncryption): void {
        if (this._encryption) {
            delete this._encryption;
        }

        if (serverEnc) {
            this._encryption = serverEnc;
        } else {
            this._encryption = new ServerEncryption(this._config.encryptionKey);
        }
    }

    public on: (ev: "shutdown", handler: () => void) => void;
    public addVirtualDir: (route: string, root: string, evt?: (ctx: IContext) => void) => void;
    public virtualInfo: (route: string) => { route: string; root: string; } | void;
    public getAppConfigName(): string {
        if (process.env.APP_CONFIG_NAME) {
            return process.env.APP_CONFIG_NAME;
        }
        return "app.config.json";
    }

    public isValidContext(ctx: IContext): boolean {
        return true;
    }

    public getRoot(): string {
        return this._root;
    }

    public parseMaxAge(maxAge: any): number {
        return parseMaxAge(maxAge);
    }

    public getPublic(): string {
        return `${this._root}/${this._public}`;
    }

    public getPublicDirName(): string {
        return this._public;
    }

    public init() {
        this._isInitilized = true;
    }

    public implimentConfig(config: NodeJS.Dict<any>): void {
        if (typeof (this._config.bundler.reValidate) !== "boolean") {
            this._config.bundler.reValidate = true;
        }
        if (!config.encryptionKey)
            throw new Error("Security risk... encryption key required....");
        if (!Util.isArrayLike<string>(config.hiddenDirectory)) {
            throw new Error('hidden_directory should be Array...');
        }
        if (process.env.IISNODE_VERSION && process.env.PORT) {
            this._port = process.env.PORT;
        } else {
            if (!this._config.hostInfo.port)
                throw new Error('Listener port required...');
            this._port = this._config.hostInfo.port;
        }
        this._config.encryptionKey = Encryption.updateCryptoKeyIV(config.encryptionKey);
        if (this._config.session) {
            if (!this._config.session.key)
                throw new Error("Security risk... Session encryption key required....");
            this._config.session.key = Encryption.updateCryptoKeyIV(config.session.key);
            if (!this._config.session.maxAge)
                config.session.maxAge = "1d";
            if (typeof (config.session.maxAge) !== "string")
                throw new Error(`Invalid maxAage format ${config.session.maxAge}. maxAge should "1d|1h|1m" formatted...`);
            this._config.session.maxAge = parseMaxAge(config.session.maxAge);
        }
        if (!this._config.cacheHeader) {
            throw new Error("cacheHeader information required...");
        }
        this._config.cacheHeader.maxAge = parseMaxAge(config.cacheHeader.maxAge);
    }

    public createLogger() {
        this._userInteractive = process.env.IISNODE_VERSION || process.env.PORT ? false : true;
        if (typeof (this._log.dispose) === "function") {
            this._log.dispose();
        }
        if (!this._config.isDebug) {
            this._log = new ShadowLogger();
        } else {
            this._log = new Logger(`./log/`, this._public, void 0, this._userInteractive, this._config.isDebug);
        }
    }

    public initilize(): void {
        if (isDefined(this._config.database)) {
            if (!Util.isArrayLike<IDatabaseConfig>(this._config.database))
                throw new Error("database cofig should be Array....");
            this._config.database.forEach((conf: IDatabaseConfig): void => {
                if (!conf.module) throw new Error("database module name requeired.");
                if (this._db[conf.module]) throw new Error(`database module ${conf.module} already exists.`);
                if (!conf.path) throw new Error(`No path defined for module ${conf.module}`);
                conf.path = this.formatPath(conf.path);
                this._db[conf.module] = new (_importLocalAssets(conf.path))(conf.dbConn);
            });
        }
        if (!this._config.errorPage || (Util.isPlainObject(this._config.errorPage) && Object.keys(this._config.errorPage).length === 0)) {
            if (!this._config.errorPage) this._config.errorPage = {};
            for (const property in this._errorPage) {
                if (!Object.hasOwnProperty.call(this._config.errorPage, property)) {
                    this._config.errorPage[property] = this._errorPage[property];
                }
            }
        } else {
            if (Util.isPlainObject(this._config.errorPage) === false)
                throw new Error("errorPage property should be Object.");
            for (const property in this._config.errorPage) {
                if (Object.hasOwnProperty.call(this._config.errorPage, property)) {
                    const path: string | undefined = this._config.errorPage[property];
                    if (path) {
                        const code: number = parseInt(property);
                        const statusCode: number = HttpStatus.fromPath(path, code);
                        if (!statusCode || statusCode !== code || !HttpStatus.isErrorCode(statusCode)) {
                            throw new Error(`Invalid Server/Client error page... ${path} and code ${code}}`);
                        }
                        this._config.errorPage[property] = this.formatPath(path);
                    }
                }
            }
            for (const property in this._errorPage) {
                if (!Object.hasOwnProperty.call(this._config.errorPage, property)) {
                    this._config.errorPage[property] = this._errorPage[property];
                }
            }
        }
        this._config.views.forEach((path: string, index: number) => {
            this._config.views[index] = this.formatPath(path);
        });
    }

    public copyright(): string {
        return '//\tCopyright (c) 2022 FSys Tech Ltd.\r\n';
    }

    public createContext(req: IRequest, res: IResponse, next: NextFunction): IContext {
        const context = getContext(this, req, res);
        context.path = req.path; context.root = context.path;
        context.next = next;
        context.extension = Util.getExtension(context.path) || "";
        return context;
    }

    public setDefaultProtectionHeader(res: IResponse): void {
        res.setHeader('x-timestamp', Date.now());
        res.setHeader('x-xss-protection', '1; mode=block');
        res.setHeader('x-content-type-options', 'nosniff');
        res.setHeader('x-frame-options', 'sameorigin');
        if (this._config.hostInfo.frameAncestors) {
            res.setHeader('content-security-policy', `frame-ancestors ${this._config.hostInfo.frameAncestors}`);
        }
        if (this._config.session.isSecure) {
            res.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains; preload');
            if (this._config.hostInfo.hostName && this._config.hostInfo.hostName.length > 0) {
                res.setHeader('expect-ct', `max-age=0, report-uri="https://${this._config.hostInfo.hostName}/report/?ct=browser&version=${appVersion}`);
            }
        }
    }

    public parseSession(headers: IncomingHttpHeaders, cook: undefined | string[] | string | { [x: string]: any; }): ISession {
        if (!this._config.session.cookie || this._config.session.cookie.length === 0)
            throw Error("You are unable to add session without session config. see your app_config.json");
        const session = new Session();
        const cookies: NodeJS.Dict<string> = cookieParser(cook);
        const value: string | undefined = cookies[this._config.session.cookie];
        if (!value) return session;
        const str: string = Encryption.decryptFromHex(value, this._config.session.key);
        if (!str) {
            return session;
        }
        // Util.extend(session, Util.JSON.parse(str));
        // session.isAuthenticated = true;
        // return session;
        return session.parse(str);
    }

    public setSession(ctx: IContext, loginId: string, roleId: string, userData: any): boolean {
        return ctx.res.cookie(
            this._config.session.cookie,
            Encryption.encryptToHex(SessionSecurity.createSession(ctx.req, {
                loginId, roleId, userData
            }), this._config.session.key), {
            maxAge: this._config.session.maxAge,
            httpOnly: true,
            secure: this._config.session.isSecure
        }), true;
    }

    public passError(ctx: IContext): boolean {
        if (!ctx.error) return false;
        if (!this._config.isDebug) {
            return ctx.res.status(500).send("Internal error occured. Please try again."), true;
        }
        // ctx.error.replace(this.preRegx, "")
        const msg: string = this.escape(ctx.error.replace(/\\/gi, "/").replace(this._rootregx, "$root").replace(this._publicregx, "$public/"));
        return ctx.res.status(500).send(`<pre>${msg}</pre>`), true;
    }

    public getErrorPath(statusCode: number, tryServer?: boolean): string | void {
        if (!HttpStatus.isErrorCode(statusCode)) {
            throw new Error(`Invalid http error status code ${statusCode}`);
        }
        const cstatusCode: string = String(statusCode);
        if (tryServer) {
            if (this._errorPage[cstatusCode]) {
                return this._errorPage[cstatusCode];
            }
            return void 0;
        }
        if (this._config.errorPage[cstatusCode]) {
            return this._config.errorPage[cstatusCode];
        }
        if (this._errorPage[cstatusCode]) {
            return this._errorPage[cstatusCode];
        }
        throw new Error(`No error page found in app.config.json->errorPage[${cstatusCode}]`);
    }

    public transferRequest(ctx: IContext, path: string | number, status?: IResInfo): void {
        if (!ctx) throw new Error("Invalid argument defined...");
        if (!ctx.isDisposed) {
            if (!status) status = HttpStatus.getResInfo(path, 200);
            if (!status.isErrorCode && typeof (path) !== "string") {
                throw new Error("Path should be string...");
            }
            if (status.isErrorCode) {
                if (ctx.req.get('x-requested-with') === 'XMLHttpRequest') {
                    return ctx.res.status(status.code).type("text").noCache().send(`${ctx.req.method} : ${ctx.req.path} ${status.description}\n${ctx.error}`);
                }
            }
            let nextPath: string | void;
            let tryServer: boolean = false;
            if (status.isErrorCode) {
                ctx.res.noCache();
                if (status.isInternalErrorCode && ctx.errorPage.indexOf("\\dist\\error_page\\500") > -1) {
                    return this.passError(ctx), void 0;
                }
                if (status.code === ctx.errorCode) {
                    tryServer = true;
                } else {
                    ctx.errorCode = status.code;
                }
            }
            nextPath = typeof (path) === "string" ? path : this.getErrorPath(path, tryServer);
            if (!nextPath) {
                return this.passError(ctx), void 0;
            }
            if (status.isErrorCode && status.isInternalErrorCode === false) {
                this.addError(ctx, `${status.code} ${status.description}`);
            }
            if (status.isErrorCode) {
                ctx.errorPage = _path.resolve(nextPath);
                if (ctx.errorPage.indexOf("\\dist\\error_page\\") > -1) {
                    ctx.path = `/cwserver/error_page/${status.code}`;
                } else {
                    ctx.path = `/error/${status.code}`;
                }
            }
            return ctx.res.render(ctx, nextPath, status);
        }
    }

    public mapPath(path: string): string {
        return _path.resolve(`${this._root}/${this._public}/${path}`);
    }

    public pathToUrl(path: string): string {
        if (!Util.getExtension(path)) return path;
        let index: number = path.indexOf(this._public);
        if (index === 0) return path;
        if (index > 0) {
            path = path.substring(path.indexOf(this._public) + this._public.length);
        } else {
            path = path.replace(this._rootregx, "/$root");
        }
        index = path.lastIndexOf(".");
        return path.substring(0, index).replace(/\\/gi, "/");
    }

    public addError(ctx: IContext, ex: string | Error): IContext {
        ctx.path = this.pathToUrl(ctx.path);
        if (!ctx.error) {
            ctx.error = `Error occured in ${ctx.path}`;
        } else {
            ctx.error += `\r\n\r\nNext Error occured in ${ctx.path}`;
        }
        if (!ctx.server.config.isDebug) return ctx;
        if (typeof (ex) === "string") {
            ctx.error += " " + ex;
        } else {
            ctx.error += "\r\n" + ex.message;
            ctx.error += "\r\n" + ex.stack;
        }
        ctx.error = ctx.error
            .replace(/\\/gi, '/')
            .replace(this._rootregx, "$root")
            .replace(this._publicregx, "$public/")
            .replace(this._nodeModuleregx, "$engine/");
        return ctx;
    }

    public escape(unsafe?: string | null): string {
        if (!unsafe) return "";
        return unsafe
            .replace(/&/gi, "&amp;")
            .replace(/</gi, "&lt;")
            .replace(/>/gi, "&gt;")
            .replace(/\r\n/gi, "<br/>")
            .replace(/\n/gi, "<br/>");
    }

    public formatPath(path: string, noCheck?: boolean): string {
        return _formatPath(this, path, noCheck);
    }

    public createBundle(str: string): string {
        if (!str) throw new Error("No string found to create bundle...")
        return Encryption.encryptUri(str, this._config.encryptionKey);
    }
    public addMimeType(extension: string, val: string): void {
        return _mimeType.add(extension, val);
    }
}
export interface IAppUtility {
    readonly init: () => IApplication;
    readonly public: string;
    readonly port: string | number;
    readonly socketPath: string;
    readonly log: ILogger;
    readonly server: ICwServer;
    readonly controller: IController;
}
export function initilizeServer(appRoot: string, wwwName?: string): IAppUtility {
    if (AppView.isInitilized) {
        throw new Error("Server instance can initilize 1 time...");
    }

    const _server: CwServer = new CwServer(appRoot, wwwName);
    const _process = {
        render: (code: number | undefined, ctx: IContext, next: NextFunction, transfer?: boolean): any => {
            if (transfer && typeof (transfer) !== "boolean") {
                throw new Error("transfer argument should be ?boolean....");
            }
            if (!code) {
                return next();
            }
            if (code < 0
                || (typeof (transfer) === "boolean" && transfer === false)
                || !HttpStatus.isErrorCode(code)
            ) {
                return void 0;
            }
            return _server.transferRequest(ctx, code);
        },
        createContext: (req: IRequest, res: IResponse, next: NextFunction): IContext => {
            const _context = _server.createContext(req, res, next);
            const _next = _context.next;
            _context.next = (code?: number | undefined, transfer?: boolean): any => {
                if (_context.isDisposed) {
                    console.warn('Warning: `context already disposed`. Cannot access disposed object.');
                    return;
                }
                return _process.render(code, _context, _next, transfer);
            }
            return _context;
        }
    }
    const _controller: IController = new Controller(
        _server.config.defaultExt && _server.config.defaultExt.length > 0 ? true : false
    );
    function initilize(): IApplication {
        if (_server.isInitilized) {
            throw new Error("Server already initilized");
        }
        const _app: IApplication = CwAppCore();
        _server.on = (ev: "shutdown", handler: () => void): void => {
            _app.on(ev, handler);
        };
        if (_server.config.isDebug) {
            _app.on("request-begain", (req: IRequest): void => {
                _server.log.success(`${req.method} ${req.path}`);
            }).on("response-end", (req: IRequest, res: IResponse): void => {
                const ctx: IContext | undefined = getMyContext(req.id);
                if (ctx && !ctx.isDisposed) {
                    if (res.statusCode && HttpStatus.isErrorCode(res.statusCode)) {
                        _server.log.error(`Send ${res.statusCode} ${ctx.path}`);
                    } else {
                        _server.log.success(`Send ${res.statusCode} ${ctx.path}`);
                    }
                }
                return removeContext(req.id);
            });
        } else {
            _app.on("response-end", (req: IRequest, res: IResponse): void => {
                return removeContext(req.id);
            });
        }
        const _virtualDir: { [x: string]: string; }[] = [];
        _server.virtualInfo = (route: string): { route: string; root: string; } | void => {
            const v = _virtualDir.find((a) => a.route === route);
            if (!v) return void 0;
            return {
                route: v.route,
                root: v.root
            };
        };
        _server.addVirtualDir = (route: string, root: string, evt?: (ctx: IContext) => void): void => {
            if (route.indexOf(":") > -1 || route.indexOf("*") > -1)
                throw new Error(`Unsupported symbol defined. ${route}`);
            const neRoute = route;
            if (_virtualDir.some((a) => a.route === neRoute))
                throw new Error(`You already add this virtual route ${route}`);
            route += route.charAt(route.length - 1) !== "/" ? "/" : "";
            route += "*";
            const _processHandler = (req: IRequest, res: IResponse, next: NextFunction, forWord: (ctx: IContext) => void): void => {
                const _ctx: IContext = _server.createContext(req, res, next);
                const _next: NextFunction = next;
                _ctx.next = (code?: number | undefined, transfer?: boolean): any => {
                    if (!code || code === 200) return;
                    return _process.render(code, _ctx, _next, transfer);
                }
                if (!_server.isValidContext(_ctx)) {
                    return;
                }
                return fsw.isExists(`${root}/${_ctx.path}`, (exists: boolean, url: string): void => {
                    if (!exists) return _ctx.next(404);
                    return forWord(_ctx);
                });
            };
            if (!evt || typeof (evt) !== "function") {
                _app.use(route, (req: IRequest, res: IResponse, next: NextFunction) => {
                    _processHandler(req, res, next, (ctx: IContext): void => {
                        if (_server.config.mimeType.indexOf(ctx.extension) > -1) {
                            return _controller.httpMimeHandler.render(ctx, root);
                        }
                        return ctx.next(404);
                    });
                }, true);
            } else {
                _app.use(route, (req: IRequest, res: IResponse, next: NextFunction) => {
                    _processHandler(req, res, next, (ctx: IContext): void => {
                        _server.log.success(`Send ${200} ${route}${req.path}`);
                        return evt(ctx);
                    });
                }, true);
            }
            return _virtualDir.push({
                route: neRoute,
                root
            }), void 0;
        };
        if (_server.config.bundler && _server.config.bundler.enable) {
            const { Bundler } = require("./app-bundler");
            Bundler.Init(_app, _controller, _server);
        }
        if (Util.isArrayLike(_server.config.views)) {
            _server.config.views.forEach(path => _importLocalAssets(path));
        }

        AppView.init(_app, _controller, _server);

        _controller.sort();
        _app.on("error", (req: IRequest, res: IResponse, err?: number | Error): void => {
            if (res.isAlive) {
                const context: IContext = _process.createContext(req, res, res.sendIfError.bind(res));
                if (!err) {
                    return context.transferRequest(404);
                }
                if (err instanceof Error) {
                    return context.transferError(err);
                }
            }
        });
        _app.prerequisites((req: IRequest, res: IResponse, next: NextFunction): void => {
            req.session = _server.parseSession(req.headers, req.cookies);
            SessionSecurity.isValidSession(req);
            return process.nextTick(() => next());
        });
        _app.use((req: IRequest, res: IResponse, next: NextFunction) => {
            const context: IContext = _process.createContext(req, res, next);
            const reqPath: string = req.path;
            if (_server.config.hiddenDirectory.some((a) => {
                return reqPath.substring(0, a.length) === a;
            })) {
                _server.log.write(`Trying to access Hidden directory. Remote Adress ${req.ip} Send 404 ${req.path}`);
                return _server.transferRequest(context, 404);
            }
            if (reqPath.indexOf('$root') > -1 || reqPath.indexOf('$public') > -1) {
                _server.log.write(`Trying to access directly reserved keyword ( $root | $public ). Remote Adress ${req.ip} Send 404 ${req.path}`);
                return _server.transferRequest(context, 404);
            }
            try {
                if (_server.isValidContext(context)) {
                    return _controller.processAny(context);
                }
            } catch (ex: any) {
                return _server.transferRequest(_server.addError(context, ex), 500);
            }
        });
        _server.init();
        return _app;
    };

    AppView.isInitilized = true;

    return {
        init: initilize,
        get public() { return _server.public; },
        get port() { return _server.port; },
        get log() { return _server.log; },
        get socketPath() { return toString(_server.config.socketPath); },
        get server() { return _server; },
        get controller() { return _controller; }
    }
}