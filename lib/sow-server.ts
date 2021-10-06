/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 10:13 PM 5/2/2020
import {
    ISession, IResInfo, toString
} from "./sow-static";
import { IRequestParam } from './sow-router';
import {
    NextFunction, IApplication,
    IRequest, IResponse,
    App as sowAppCore, parseCookie as cookieParser,
    appVersion
} from './sow-server-core';
import * as _fs from 'fs';
import * as _path from 'path';
import * as fsw from './sow-fsw';
import { Util, getLibRoot } from './sow-util';
import { Schema } from './sow-schema-validator';
import { Session } from './sow-static';
import { ISowDatabaseType } from './sow-db-type';
import { Controller, IController } from './sow-controller';
import { Encryption, ICryptoInfo } from "./sow-encryption";
import { HttpStatus } from "./sow-http-status";
import { Logger, ILogger } from "./sow-logger";
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
    readonly server: ISowServer;
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
    };
}
export interface ISowServer {
    readonly version: string;
    readonly errorPage: { [x: string]: string; };
    readonly log: ILogger;
    readonly config: IServerConfig;
    readonly encryption: IServerEncryption;
    readonly db: NodeJS.Dict<ISowDatabaseType>;
    readonly port: string | number;
    copyright(): string;
    createContext(req: IRequest, res: IResponse, next: NextFunction): IContext;
    initilize(): void;
    implimentConfig(config: NodeJS.Dict<any>): void;
    setDefaultProtectionHeader(res: IResponse): void;
    parseSession(cook: undefined | string[] | string | { [x: string]: any; }): ISession;
    setSession(ctx: IContext, loginId: string, roleId: string, userData: any): boolean;
    passError(ctx: IContext): boolean;
    getErrorPath(statusCode: number, tryServer?: boolean): string | void;
    transferRequest(ctx: IContext, path: string | number, status?: IResInfo): void;
    mapPath(path: string): string;
    pathToUrl(path: string): string;
    addError(ctx: IContext, ex: Error | string): IContext;
    escape(unsafe?: string | null): string;
    addVirtualDir(
        route: string, root: string,
        evt?: (ctx: IContext) => void
    ): void;
    virtualInfo(route: string): {
        route: string;
        root: string
    } | void;
    formatPath(name: string, noCheck?: boolean): string;
    createBundle(str: string): string;
    addMimeType(extension: string, val: string): void;
    getRoot(): string;
    getPublic(): string;
    getPublicDirName(): string;
    parseMaxAge(maxAge: any): number;
    on(ev: 'shutdown', handler: () => void): void;
}
export type IViewHandler = (app: IApplication, controller: IController, server: ISowServer) => void;
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
            if (!ctx) return;
            return ctx;
        },
        removeContext(id: string): void {
            const ctx: IContext = _curContext[id];
            if (!ctx) return;
            disposeContext(ctx);
            return void 0;
        },
        getContext(server: ISowServer, req: IRequest, res: IResponse): IContext {
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
    const _exportObj = (server: ISowServer, name: string): {
        value?: string,
        name?: string
    } => {
        if (name === "root") return { value: server.getRoot() };
        if (name === "public") return { value: server.getPublicDirName() };
        return { value: void 0 };
    }
    return (server: ISowServer, name: string, noCheck?: boolean): string => {
        if (/\$/gi.test(name) === false) return name;
        const absPath: string = _path.resolve(name.replace(/\$.+?\//gi, (m) => {
            m = m.replace(/\$/gi, "").replace(/\//gi, "");
            const rs = _exportObj(server, m.replace(/\$/gi, "").replace(/\//gi, ""));
            if (!rs.value) {
                throw new Error(`Invalid key ${m}`);
            }
            return `${rs.value}/`;
        }));
        if (noCheck === true) return absPath;
        if (!_fs.existsSync(absPath))
            throw new Error(`No file found\r\nPath:${absPath}\r\nName:${name}`);
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
    private _server: ISowServer;
    public get server(): ISowServer {
        return this._server;
    }
    private _next?: CtxNext;
    public get next(): CtxNext {
        if (!this._isDisposed && this._next) return this._next;
        return (code?: number, transfer?: boolean): void => {
            // Unreachable....
            console.log('Warning: `context already destroyed or "next" function doesn\'t set yet`');
        };
    }
    public set next(val: CtxNext) {
        this._next = val;
    }
    constructor(
        server: ISowServer,
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
    };
    template: {
        cache: boolean;
        cacheType: string;
        ext: string[];
    };
    constructor() {
        this.Author = "Safe Online World Ltd.";
        this.appName = "Sow Server";
        this.version = "0.0.1";
        this.packageVersion = "101";
        this.isDebug = true;
        this.encryptionKey = Object.create(null);
        this.session = {
            "cookie": "_sow_session",
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
            tempPath: "/web/temp/"
        };
    }
}
// prevent session hijacking
export class SessionSecurity {
    constructor() {
        throw new Error("Invalid initilization...");
    }
    private static getRemoteAddress(ip: string): string {
        return ip.substring(0, ip.lastIndexOf('.'));
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
export class SowServer implements ISowServer {
    public get version() {
        return appVersion;
    }
    private _config: IServerConfig;
    private _public: string;
    private _log: ILogger;
    private _port: string | number;
    private _db: NodeJS.Dict<ISowDatabaseType>;
    private _errorPage: { [x: string]: string; };
    private _encryption: IServerEncryption;
    private root: string;
    private rootregx: RegExp;
    private publicregx: RegExp;
    private nodeModuleregx: RegExp;
    private userInteractive: boolean;
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
    public get db(): NodeJS.Dict<ISowDatabaseType> {
        return this._db;
    }
    public get encryption(): IServerEncryption {
        return this._encryption;
    }
    public get errorPage(): { [x: string]: string; } {
        return this._errorPage;
    }
    constructor(appRoot: string, wwwName?: string) {
        this._port = 0;
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
        this.root = appRoot;
        this._public = wwwName.toString();
        this._config = new ServerConfig();
        this._db = {};
        const absPath: string = _path.resolve(`${this.root}/${this.public}/config/app.config.json`);
        if (!_fs.existsSync(absPath)) {
            throw new Error(`No config file found in ${absPath}`);
        }
        const config: NodeJS.Dict<any> | void = fsw.readJsonSync<IServerConfig>(absPath);
        if (!config) {
            throw new Error(`Invalid config file defined.\r\nConfig: ${absPath}`);
        }
        Schema.Validate(config);
        // if ( config.hasOwnProperty( "Author" ) ) throw _Error( "You should not set Author property..." );
        if (this.public !== config.hostInfo.root) {
            throw new Error(`Server ready for App Root: ${this.public}.\r\nBut host_info root path is ${config.hostInfo.root}.\r\nApp Root like your application root directory name...`);
        }
        const libRoot: string = getLibRoot();
        this._errorPage = {
            "404": _path.resolve(`${libRoot}/dist/error_page/404.html`),
            "401": _path.resolve(`${libRoot}/dist/error_page/401.html`),
            "500": _path.resolve(`${libRoot}/dist/error_page/500.html`)
        };
        Util.extend(this.config, config, true);
        this.implimentConfig(config);
        this.rootregx = new RegExp(this.root.replace(/\\/gi, '/'), "gi");
        this.publicregx = new RegExp(`${this.public}/`, "gi");
        this.nodeModuleregx = new RegExp(`${this.root.replace(/\\/gi, '/').replace(/\/dist/gi, "")}/node_modules/express/`, "gi");
        this.userInteractive = process.env.IISNODE_VERSION || process.env.PORT ? false : true;
        this.initilize();
        this._log = new Logger(`./log/`, this.public, void 0, this.userInteractive, this.config.isDebug);
        this._encryption = new ServerEncryption(this.config.encryptionKey);
        fsw.mkdirSync(this.getPublic(), "/web/temp/cache/");
        this.on = Object.create(null);
        this.addVirtualDir = Object.create(null);
        this.virtualInfo = Object.create(null);
        this.config.bundler.tempPath = this.mapPath(this.config.bundler.tempPath);
        this.config.staticFile.tempPath = this.mapPath(this.config.staticFile.tempPath);
        return;
    }
    on: (ev: "shutdown", handler: () => void) => void;
    addVirtualDir: (route: string, root: string, evt?: (ctx: IContext) => void) => void;
    virtualInfo: (route: string) => { route: string; root: string; } | void;
    getRoot(): string {
        return this.root;
    }
    parseMaxAge(maxAge: any): number {
        return parseMaxAge(maxAge);
    }
    getPublic(): string {
        return `${this.root}/${this.public}`;
    }
    getPublicDirName(): string {
        return this.public;
    }
    implimentConfig(config: NodeJS.Dict<any>): void {
        if (!config.encryptionKey)
            throw new Error("Security risk... encryption key required....");
        if (!Util.isArrayLike<string>(config.hiddenDirectory)) {
            throw new Error('hidden_directory should be Array...');
        }
        if (process.env.IISNODE_VERSION && process.env.PORT) {
            this._port = process.env.PORT;
        } else {
            if (!this.config.hostInfo.port)
                throw new Error('Listener port required...');
            this._port = this.config.hostInfo.port;
        }
        this.config.encryptionKey = Encryption.updateCryptoKeyIV(config.encryptionKey);
        if (this.config.session) {
            if (!this.config.session.key)
                throw new Error("Security risk... Session encryption key required....");
            this.config.session.key = Encryption.updateCryptoKeyIV(config.session.key);
            if (!this.config.session.maxAge)
                config.session.maxAge = "1d";
            if (typeof (config.session.maxAge) !== "string")
                throw new Error(`Invalid maxAage format ${config.session.maxAge}. maxAge should "1d|1h|1m" formatted...`);
            this.config.session.maxAge = parseMaxAge(config.session.maxAge);
        }
        if (!this.config.cacheHeader) {
            throw new Error("cacheHeader information required...");
        }
        this.config.cacheHeader.maxAge = parseMaxAge(config.cacheHeader.maxAge);
    }
    initilize(): void {
        if (isDefined(this.config.database)) {
            if (!Util.isArrayLike<IDatabaseConfig>(this.config.database))
                throw new Error("database cofig should be Array....");
            this.config.database.forEach((conf: IDatabaseConfig): void => {
                if (!conf.module)
                    throw new Error("database module name requeired.");
                if (this._db[conf.module])
                    throw new Error(`database module ${conf.module} already exists.`);
                if (!conf.path)
                    throw new Error(`No path defined for module ${conf.module}`);
                conf.path = this.formatPath(conf.path);
                this._db[conf.module] = new (require(conf.path))(conf.dbConn)
            });
        }
        if (!this.config.errorPage || (Util.isPlainObject(this.config.errorPage) && Object.keys(this.config.errorPage).length === 0)) {
            if (!this.config.errorPage) this.config.errorPage = {};
            for (const property in this.errorPage) {
                if (!Object.hasOwnProperty.call(this.config.errorPage, property)) {
                    this.config.errorPage[property] = this.errorPage[property];
                }
            }
        } else {
            if (Util.isPlainObject(this.config.errorPage) === false)
                throw new Error("errorPage property should be Object.");
            for (const property in this.config.errorPage) {
                if (Object.hasOwnProperty.call(this.config.errorPage, property)) {
                    const path: string | undefined = this.config.errorPage[property];
                    if (path) {
                        const code: number = parseInt(property);
                        const statusCode: number = HttpStatus.fromPath(path, code);
                        if (!statusCode || statusCode !== code || !HttpStatus.isErrorCode(statusCode)) {
                            throw new Error(`Invalid Server/Client error page... ${path} and code ${code}}`);
                        }
                        this.config.errorPage[property] = this.formatPath(path);
                    }
                }
            }
            for (const property in this.errorPage) {
                if (!Object.hasOwnProperty.call(this.config.errorPage, property)) {
                    this.config.errorPage[property] = this.errorPage[property];
                }
            }
        }
        this.config.views.forEach((name: string, index: number) => {
            this.config.views[index] = this.formatPath(name);
        });
    }
    copyright(): string {
        return '/*Copyright( c ) 2018, Sow ( https://safeonline.world, https://www.facebook.com/safeonlineworld, mssclang@outlook.com, https://github.com/safeonlineworld/cwserver). All rights reserved*/\r\n';
    }
    createContext(req: IRequest, res: IResponse, next: NextFunction): IContext {
        const context = getContext(this, req, res);
        context.path = req.path; context.root = context.path;
        context.next = next;
        context.extension = Util.getExtension(context.path) || "";
        return context;
    }
    setDefaultProtectionHeader(res: IResponse): void {
        res.setHeader('x-timestamp', Date.now());
        res.setHeader('x-xss-protection', '1; mode=block');
        res.setHeader('x-content-type-options', 'nosniff');
        res.setHeader('x-frame-options', 'sameorigin');
        if (this.config.hostInfo.frameAncestors) {
            res.setHeader('content-security-policy', `frame-ancestors ${this.config.hostInfo.frameAncestors}`);
        }
        if (this.config.session.isSecure) {
            res.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains; preload');
            if (this.config.hostInfo.hostName && this.config.hostInfo.hostName.length > 0) {
                res.setHeader('expect-ct', `max-age=0, report-uri="https://${this.config.hostInfo.hostName}/report/?ct=browser&version=${appVersion}`);
            }
        }
    }
    parseSession(cook: undefined | string[] | string | { [x: string]: any; }): ISession {
        if (!this.config.session.cookie || this.config.session.cookie.length === 0)
            throw Error("You are unable to add session without session config. see your app_config.json");
        const session = new Session();
        const cookies: NodeJS.Dict<string> = cookieParser(cook);
        const value: string | undefined = cookies[this.config.session.cookie];
        if (!value) return session;
        const str: string = Encryption.decryptFromHex(value, this.config.session.key);
        if (!str) {
            return session;
        }
        Util.extend(session, Util.JSON.parse(str));
        session.isAuthenticated = true;
        return session;
    }
    setSession(ctx: IContext, loginId: string, roleId: string, userData: any): boolean {
        return ctx.res.cookie(
            this.config.session.cookie,
            Encryption.encryptToHex(SessionSecurity.createSession(ctx.req, {
                loginId, roleId, userData
            }), this.config.session.key), {
            maxAge: this.config.session.maxAge,
            httpOnly: true,
            secure: this.config.session.isSecure
        }), true;
    }
    passError(ctx: IContext): boolean {
        if (!ctx.error) {
            return false;
        }
        const msg: string = `<pre>${this.escape(ctx.error.replace(/<pre[^>]*>/gi, "").replace(/\\/gi, '/').replace(this.rootregx, "$root").replace(this.publicregx, "$public/"))}</pre>`;
        return ctx.res.status(500).send(msg), true;
    }
    getErrorPath(statusCode: number, tryServer?: boolean): string | void {
        if (!HttpStatus.isErrorCode(statusCode)) {
            throw new Error(`Invalid http error status code ${statusCode}`);
        }
        const cstatusCode: string = String(statusCode);
        if (tryServer) {
            if (this.errorPage[cstatusCode]) {
                return this.errorPage[cstatusCode];
            }
            return void 0;
        }
        if (this.config.errorPage[cstatusCode]) {
            return this.config.errorPage[cstatusCode];
        }
        if (this.errorPage[cstatusCode]) {
            return this.errorPage[cstatusCode];
        }
        throw new Error(`No error page found in app.config.json->errorPage[${cstatusCode}]`);
    }
    transferRequest(ctx: IContext, path: string | number, status?: IResInfo): void {
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
    mapPath(path: string): string {
        return _path.resolve(`${this.root}/${this.public}/${path}`);
    }
    pathToUrl(path: string): string {
        if (!Util.getExtension(path)) return path;
        let index: number = path.indexOf(this.public);
        if (index === 0) return path;
        if (index > 0) {
            path = path.substring(path.indexOf(this.public) + this.public.length);
        } else {
            path = path.replace(this.rootregx, "/$root");
        }
        index = path.lastIndexOf(".");
        return path.substring(0, index).replace(/\\/gi, "/");
    }
    addError(ctx: IContext, ex: string | Error): IContext {
        ctx.path = this.pathToUrl(ctx.path);
        if (!ctx.error) {
            ctx.error = `Error occured in ${ctx.path}`;
        } else {
            ctx.error += `\r\n\r\nNext Error occured in ${ctx.path}`;
        }
        if (typeof (ex) === "string") {
            ctx.error += " " + ex;
        } else {
            ctx.error += "\r\n" + ex.message;
            ctx.error += "\r\n" + ex.stack;
        }
        ctx.error = ctx.error
            .replace(/\\/gi, '/')
            .replace(this.rootregx, "$root")
            .replace(this.publicregx, "$public/")
            .replace(this.nodeModuleregx, "$engine/");
        return ctx;
    }
    escape(unsafe?: string | null): string {
        if (!unsafe) return "";
        return unsafe
            .replace(/&/gi, "&amp;")
            .replace(/</gi, "&lt;")
            .replace(/>/gi, "&gt;")
            .replace(/\r\n/gi, "<br/>")
            .replace(/\n/gi, "<br/>");
    }
    formatPath(name: string, noCheck?: boolean): string {
        return _formatPath(this, name, noCheck);
    }
    createBundle(str: string): string {
        if (!str) throw new Error("No string found to create bundle...")
        return Encryption.encryptUri(str, this.config.encryptionKey);
    }
    addMimeType(extension: string, val: string): void {
        return global.sow.HttpMime.add(extension, val);
    }
}
export interface IAppUtility {
    readonly init: () => IApplication;
    readonly public: string;
    readonly port: string | number;
    readonly socketPath: string;
    readonly log: ILogger;
    readonly server: ISowServer;
    readonly controller: IController;
}
export function initilizeServer(appRoot: string, wwwName?: string): IAppUtility {
    if (global.sow.isInitilized) throw new Error("Server instance can initilize 1 time...");
    const _server: SowServer = new SowServer(appRoot, wwwName);
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
                // if ( code && code === -404 ) return next();
                return _process.render(code, _context, _next, transfer);
            }
            return _context;
        }
    }
    const _controller: IController = new Controller();
    function initilize(): IApplication {
        const _app: IApplication = sowAppCore();
        _server.on = (ev: "shutdown", handler: () => void): void => {
            _app.on(ev, handler);
        };
        if (_server.config.isDebug) {
            _app.on("request-begain", (req: IRequest): void => {
                _server.log.success(`${req.method} ${req.path}`);
            });
        }
        _app.on("response-end", (req: IRequest, res: IResponse): void => {
            if (_server.config.isDebug) {
                const ctx: IContext | undefined = getMyContext(req.id);
                if (ctx && !ctx.isDisposed) {
                    if (res.statusCode && HttpStatus.isErrorCode(res.statusCode)) {
                        _server.log.error(`Send ${res.statusCode} ${ctx.path}`);
                    } else {
                        _server.log.success(`Send ${res.statusCode} ${ctx.path}`);
                    }
                }
            }
            return removeContext(req.id);
        });
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
                const _ctx = _server.createContext(req, res, next);
                const _next = next;
                _ctx.next = (code?: number | undefined, transfer?: boolean): any => {
                    if (!code || code === 200) return;
                    return _process.render(code, _ctx, _next, transfer);
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
                            return _controller.httpMimeHandler.render(ctx, root, false);
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
            const { Bundler } = require("./sow-bundler");
            Bundler.Init(_app, _controller, _server);
        }
        if (_server.config.views) {
            _server.config.views.forEach((a: string, _index: number, _array: string[]) => {
                require(a);
            });
        }
        global.sow.server.emit("register-view", _app, _controller, _server);
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
            req.session = _server.parseSession(req.cookies);
            SessionSecurity.isValidSession(req);
            return next();
        });
        _app.use((req: IRequest, res: IResponse, next: NextFunction) => {
            const context = _process.createContext(req, res, next);
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
                return _controller.processAny(context);
            } catch (ex: any) {
                return _server.transferRequest(_server.addError(context, ex), 500);
            }
        });
        return _app;
    };
    global.sow.isInitilized = true;
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