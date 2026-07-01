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
    IResInfo, toString
} from "./app-static";
import { type IRequestParam } from './app-router';
import {
    NextFunction, type IApplication, App as CwAppCore, appVersion
} from './server-core';
import type { IRequest } from "./request";
import type { IResponse } from "./response";
import { parseCookie as cookieParser } from "./help";
import * as _fs from 'node:fs';
import * as _path from 'node:path';
import * as fsw from './fsw';
import { Util, getAppDir } from './app-util';
import { Schema } from './schema-validator';
import type { ICwDatabaseType } from './db-type';
import { Controller, type IController } from './app-controller';
import { Encryption, type ICryptoInfo } from "./encryption";
import { HttpStatus } from "./http-status";
import { Logger, ILogger, ShadowLogger } from "./logger";
import { IncomingHttpHeaders } from "node:http";
import { _mimeType } from "./http-mime-types";
import { AppView } from "./app-view";
import { _ctxManager, type IContext } from "./context";
import { Session, type ISession } from "./session";
import defaultHeaders from "./default-headers";

export type AppHandler = (ctx: IContext, requestParam?: IRequestParam) => void;

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
     * Called when the current session is cleared or invalidated.
     *
     * Allows implementations to perform cleanup operations such as removing
     * cached session state, resetting authentication context, or notifying
     * dependent services.
     *
     * @param {IContext} ctx
     * Request context associated with the cleared session.
     *
     * @returns {void}
     */
    onClearSession(ctx: IContext): void;

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

function parseMaxAge(maxAge: unknown): number {
    if (typeof maxAge !== "string") {
        throw new Error("Invalid maxAge...");
    }

    const match = /^(\d+)([a-zA-Z]+)$/.exec(maxAge);

    if (!match) {
        throw new Error(
            `Invalid maxAge format ${maxAge}`
        );
    }

    const [, value, type] = match;

    return getEpoch(
        type.toUpperCase(),
        Number(value),
        maxAge
    );
}

const _formatPath = (() => {

    const exportPath = (
        server: ICwServer,
        key: string
    ): string => {

        switch (key) {
            case "root":
                return server.getRoot();

            case "public":
                return server.getPublicDirName();

            default:
                throw new Error(
                    `Invalid key ${key}`
                );
        }
    };


    return (
        server: ICwServer,
        path: string,
        noCheck = false
    ): string => {

        if (!path.includes("$")) {
            return path;
        }

        const resolved = _path.resolve(
            path.replace(
                /\$([^/]+)\//g,
                (_, key) => `${exportPath(server, key)}/`
            )
        );

        if (noCheck) {
            return resolved;
        }

        if (!_fs.existsSync(resolved)) {
            throw new Error(
                `No file found\r\nPath: ${resolved}\r\nRequest Path: ${path}`
            );
        }

        return resolved;
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
        this._port = 0;
        this._log = Object.create(null);

        if (!wwwName) {
            if (process.env.IISNODE_VERSION) {
                throw new Error(
                    `web.config error.
    
    Invalid web.config defined.
    Behind the <configuration> tag in your web.config add this
    
    <appSettings>
        <add key="your-iis-app-pool-id" value="your-app-root" />
    </appSettings>
    
    your-app-root | directory name should be exists here:
    ${appRoot}\\www_public`
                );
            }

            throw new Error(
                `Argument missing.
    
    Example:
    node server my_app_root.
    
    App Root should exist here:
    ${appRoot}\\my_app_root`
            );
        }

        this._root = appRoot;
        this._public = wwwName.trim();

        this._config = new ServerConfig();
        this._db = Object.create(null);

        const configPath = _path.resolve(
            this._root,
            this._public,
            "config",
            this.getAppConfigName()
        );

        if (!_fs.existsSync(configPath)) {
            throw new Error(
                `No config file found in ${configPath}`
            );
        }

        const config =
            fsw.readJsonSync<IServerConfig>(configPath);

        if (!config) {
            throw new Error(
                `Invalid config file defined.\r\nConfig: ${configPath}`
            );
        }

        Schema.Validate(config);

        if (this._public !== config.hostInfo.root) {
            throw new Error(
                `Server ready for App Root: ${this._public}.
    But host_info root path is ${config.hostInfo.root}.`
            );
        }


        const libRoot = getAppDir();

        this._errorPage = {
            "404": _path.resolve(
                libRoot,
                "dist/error_page/404.html"
            ),
            "401": _path.resolve(
                libRoot,
                "dist/error_page/401.html"
            ),
            "500": _path.resolve(
                libRoot,
                "dist/error_page/500.html"
            )
        };


        Util.extend(
            this._config,
            config,
            true
        );

        this.implimentConfig(config);


        const normalizedRoot = this._root.replace(/\\/g, "/");

        this._publicregx =
            new RegExp(`${this._public}/`, "i");

        this._rootregx =
            new RegExp(normalizedRoot, "i");

        this._nodeModuleregx =
            new RegExp(
                `${normalizedRoot.replace(/\/dist/i, "")}/node_modules/`,
                "i"
            );


        this._userInteractive = false;

        this.initilize();

        this._encryption =
            new ServerEncryption(
                this._config.encryptionKey
            );

        fsw.mkdirSync(
            this.getPublic(),
            "/web/temp/cache/"
        );


        this.on = Object.create(null);
        this.addVirtualDir = Object.create(null);
        this.virtualInfo = Object.create(null);


        this._config.bundler.tempPath =
            this.mapPath(
                this._config.bundler.tempPath
            );

        this._config.staticFile.tempPath =
            this.mapPath(
                this._config.staticFile.tempPath
            );


        this._log = new ShadowLogger();
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

        if (typeof this._config.bundler.reValidate !== "boolean") {
            this._config.bundler.reValidate = true;
        }

        if (!config.encryptionKey) {
            throw new Error(
                "Security risk... encryption key required...."
            );
        }

        if (!Util.isArrayLike<string>(config.hiddenDirectory)) {
            throw new Error(
                "hidden_directory should be Array..."
            );
        }

        const port =
            process.env.IISNODE_VERSION && process.env.PORT
                ? process.env.PORT
                : this._config.hostInfo.port;

        if (!port) {
            throw new Error(
                "Listener port required..."
            );
        }

        this._port = port;

        this._config.encryptionKey =
            Encryption.updateCryptoKeyIV(config.encryptionKey);


        const session = this._config.session;

        if (session) {

            if (!session.key) {
                throw new Error(
                    "Security risk... Session encryption key required...."
                );
            }

            session.key =
                Encryption.updateCryptoKeyIV(config.session.key);

            const maxAge = config.session.maxAge ?? "1d";

            if (typeof maxAge !== "string") {
                throw new Error(
                    `Invalid maxAge format ${maxAge}. maxAge should "1d|1h|1m" formatted...`
                );
            }

            session.maxAge = parseMaxAge(maxAge);
        }


        const cacheHeader = this._config.cacheHeader;

        if (!cacheHeader) {
            throw new Error(
                "cacheHeader information required..."
            );
        }

        cacheHeader.maxAge =
            parseMaxAge(config.cacheHeader.maxAge);
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
        const database = this._config.database;

        if (isDefined(database)) {

            if (!Util.isArrayLike<IDatabaseConfig>(database)) {
                throw new Error("database config should be Array....");
            }

            database.forEach((conf: IDatabaseConfig): void => {
                if (!conf.module) {
                    throw new Error("database module name required.");
                }

                if (this._db[conf.module]) {
                    throw new Error(
                        `database module ${conf.module} already exists.`
                    );
                }

                if (!conf.path) {
                    throw new Error(
                        `No path defined for module ${conf.module}`
                    );
                }

                const path = this.formatPath(conf.path);

                this._db[conf.module] =
                    new (_importLocalAssets(path))(conf.dbConn);
            });
        }

        if (!this._config.errorPage)
            this._config.errorPage = {};

        if (Util.isPlainObject(this._config.errorPage) === false)
            throw new Error("errorPage property should be Object.");

        if (Object.keys(this._config.errorPage).length === 0) {

            Object.assign(
                this._config.errorPage,
                this._errorPage
            );

        } else {

            for (const [property, value] of Object.entries(this._config.errorPage)) {

                if (!value) {
                    continue;
                }

                const code = Number(property);
                const statusCode = HttpStatus.fromPath(
                    value,
                    code
                );

                if (
                    statusCode !== code ||
                    !HttpStatus.isErrorCode(statusCode)
                ) {
                    throw new Error(
                        `Invalid Server/Client error page... ${value} and code ${code}`
                    );
                }

                this._config.errorPage[property] =
                    this.formatPath(value);
            }

            Object.assign(
                this._config.errorPage,
                Object.fromEntries(
                    Object.entries(this._errorPage)
                        .filter(([key]) =>
                            !this._config.errorPage[key]
                        )
                )
            );
        }


        this._config.views = this._config.views.map(
            path => this.formatPath(path)
        );
    }

    public copyright(): string {
        return '//\tCopyright (c) 2022 FSys Tech Ltd.\r\n';
    }

    public createContext(
        req: IRequest,
        res: IResponse,
        next: NextFunction
    ): IContext {

        const context = _ctxManager.getContext(
            this, req, res
        );

        context.path = req.path; context.root = context.path;
        context.next = next;

        context.extension = Util.getExtension(context.path) || "";

        return context;
    }


    public setDefaultProtectionHeader(res: IResponse): void {

        res.setHeader("x-timestamp", Date.now());

        const headers = defaultHeaders.getHeaders();

        for (const [key, value] of Object.entries(headers)) {
            res.setHeader(key, value);
        }

        if (this._config.hostInfo.frameAncestors) {
            res.setHeader(
                "content-security-policy",
                `frame-ancestors ${this._config.hostInfo.frameAncestors}`
            );
        }

        if (this._config.session.isSecure) {
            res.setHeader(
                "strict-transport-security",
                "max-age=31536000; includeSubDomains; preload"
            );

            const host = this._config.hostInfo.hostName;

            if (host) {
                res.setHeader(
                    "expect-ct",
                    `max-age=0, report-uri="https://${host}/report/?ct=browser&version=${appVersion}`
                );
            }
        }
    }

    public parseSession(headers: IncomingHttpHeaders, cook: undefined | string[] | string | { [x: string]: any; }): ISession {
        if (
            !this._config.session.cookie ||
            this._config.session.cookie.length === 0
        ) {
            throw Error(
                "You are unable to add session without session config. see your app_config.json"
            );
        }

        const session = new Session();

        const cookies = cookieParser(cook);
        const value = cookies[this._config.session.cookie];

        if (!value)
            return session;

        const str: string = Encryption.decryptFromHex(
            value, this._config.session.key
        );

        if (!str) {
            return session;
        }

        return session.parse(str);
    }

    public onClearSession(ctx: IContext): void {
        // nothing to do
    }

    public setSession(
        ctx: IContext,
        loginId: string,
        roleId: string,
        userData: any
    ): boolean {

        const token = Encryption.encryptToHex(SessionSecurity.createSession(ctx.req, {
            loginId, roleId, userData
        }), this._config.session.key);

        ctx.res.cookie(
            this._config.session.cookie, token, {
            maxAge: this._config.session.maxAge,
            httpOnly: true,
            secure: this._config.session.isSecure
        });

        return true;
    }

    public passError(ctx: IContext): boolean {
        if (!ctx.error) {
            return false;
        }

        if (!this._config.isDebug) {
            ctx.res
                .status(500)
                .send("Internal error occurred. Please try again.");

            return true;
        }

        const message = this.escape(
            ctx.error
                .replace(/\\/g, "/")
                .replace(this._rootregx, "$root")
                .replace(this._publicregx, "$public/")
        );

        ctx.res
            .status(500)
            .send(`<pre>${message}</pre>`);

        return true;
    }

    public getErrorPath(
        statusCode: number,
        tryServer: boolean = false
    ): string | undefined {

        if (!HttpStatus.isErrorCode(statusCode)) {
            throw new Error(
                `Invalid http error status code ${statusCode}`
            );
        }

        const code = String(statusCode);

        if (tryServer) {
            return this._errorPage[code];
        }

        if (this._config.errorPage[code]) {
            return this._config.errorPage[code];
        }

        if (this._errorPage[code]) {
            return this._errorPage[code];
        }

        throw new Error(
            `No error page found in app.config.json->errorPage[${code}]`
        );
    }

    public transferRequest(
        ctx: IContext,
        path: string | number,
        status?: IResInfo
    ): void {

        if (!ctx) {
            throw new Error("Invalid argument defined...");
        }

        if (ctx.isDisposed) {
            return;
        }

        status ??= HttpStatus.getResInfo(path, 200);

        if (!status.isErrorCode && typeof path !== "string") {
            throw new Error("Path should be string...");
        }

        if (
            status.isErrorCode &&
            ctx.req.get("x-requested-with") === "XMLHttpRequest"
        ) {
            return ctx.res
                .status(status.code)
                .type("text")
                .noCache()
                .send(
                    `${ctx.req.method} : ${ctx.req.path} ${status.description}\n${ctx.error}`
                );
        }

        let tryServer = false;

        if (status.isErrorCode) {
            ctx.res.noCache();

            if (
                status.isInternalErrorCode &&
                ctx.errorPage.includes("\\dist\\error_page\\500")
            ) {
                this.passError(ctx);
                return;
            }

            tryServer = status.code === ctx.errorCode;

            if (!tryServer) {
                ctx.errorCode = status.code;
            }
        }

        const nextPath =
            typeof path === "string"
                ? path
                : this.getErrorPath(path, tryServer);

        if (!nextPath) {
            this.passError(ctx);
            return;
        }

        if (status.isErrorCode && !status.isInternalErrorCode) {
            this.addError(
                ctx,
                `${status.code} ${status.description}`
            );
        }

        if (status.isErrorCode) {
            ctx.errorPage = _path.resolve(nextPath);

            ctx.path = ctx.errorPage.includes("\\dist\\error_page\\")
                ? `/cwserver/error_page/${status.code}`
                : `/error/${status.code}`;
        }

        ctx.res.render(ctx, nextPath, status);
    }

    public mapPath(path: string): string {
        return _path.resolve(`${this._root}/${this._public}/${path}`);
    }

    public pathToUrl(path: string): string {

        if (!Util.getExtension(path))
            return path;

        let index: number = path.indexOf(this._public);

        if (index === 0)
            return path;

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

        ctx.error = ctx.error
            ? `${ctx.error}\r\n\r\nNext error occurred in ${ctx.path}`
            : `Error occurred in ${ctx.path}`;

        if (!this._config.isDebug) {
            return ctx;
        }

        ctx.error += typeof ex === "string"
            ? ` ${ex}`
            : `\r\n${ex.message}\r\n${ex.stack ?? ""}`;

        ctx.error = ctx.error
            .replace(/\\/g, "/")
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
        if (!str)
            throw new Error("No string found to create bundle...")

        return Encryption.encryptUri(
            str, this._config.encryptionKey
        );
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

        const _app: IApplication = CwAppCore(_server.config.isDebug);

        _server.on = (ev: "shutdown", handler: () => void): void => {
            _app.on(ev, handler);
        };

        if (_server.config.isDebug) {

            _app.on("request-begain", (req: IRequest): void => {
                _server.log.success(`${req.method} ${req.path}`);
            }).on("response-end", (req: IRequest, res: IResponse): void => {

                const ctx = _ctxManager.getMyContext(req.id);
                if (ctx && !ctx.isDisposed) {

                    if (res.statusCode && HttpStatus.isErrorCode(res.statusCode)) {
                        _server.log.error(`Send ${res.statusCode} ${ctx.path}`);
                    } else {
                        _server.log.success(`Send ${res.statusCode} ${ctx.path}`);
                    }

                }

                return _ctxManager.removeContext(req.id);
            });

        } else {

            _app.on("response-end", (req: IRequest, res: IResponse): void => {
                return _ctxManager.removeContext(req.id);
            });

        }

        const _virtualDir: { [x: string]: string; }[] = [];

        _server.virtualInfo = (route: string): { route: string; root: string; } | void => {
            const v = _virtualDir.find(
                a => a.route === route
            );

            if (!v)
                return;

            return {
                route: v.route,
                root: v.root
            };
        };

        _server.addVirtualDir = (
            route: string,
            root: string,
            evt?: (ctx: IContext) => void
        ): void => {

            if (route.includes(":") || route.includes("*")) {
                throw new Error(`Unsupported symbol defined. ${route}`);
            }

            const originalRoute = route;

            if (_virtualDir.some(item => item.route === originalRoute)) {
                throw new Error(`You already added this virtual route ${route}`);
            }

            const virtualRoute = `${route.replace(/\/?$/, "/")}*`;

            const processHandler = (
                req: IRequest,
                res: IResponse,
                next: NextFunction,
                handler: (ctx: IContext) => void
            ): void => {

                const ctx = _server.createContext(req, res, next);

                ctx.next = (
                    code?: number,
                    transfer?: boolean
                ): any => {
                    if (!code || code === 200) {
                        return;
                    }

                    return _process.render(
                        code,
                        ctx,
                        next,
                        transfer
                    );
                };

                if (!_server.isValidContext(ctx)) {
                    return;
                }

                fsw.isExists(
                    `${root}/${ctx.path}`,
                    (exists: boolean): void => {
                        if (!exists) {
                            return ctx.next(404);
                        }

                        return handler(ctx);
                    }
                );
            };

            if (typeof evt !== "function") {

                _app.use(
                    virtualRoute,
                    (req, res, next) => {
                        processHandler(
                            req,
                            res,
                            next,
                            ctx => {
                                if (_server.config.mimeType.includes(ctx.extension)) {
                                    return _controller.httpMimeHandler.renderAsync(
                                        ctx, root
                                    );
                                }

                                return ctx.next(404);
                            }
                        );
                    },
                    true
                );

            } else {

                _app.use(
                    virtualRoute,
                    (req, res, next) => {
                        processHandler(
                            req,
                            res,
                            next,
                            ctx => {
                                _server.log.success(
                                    `Send 200 ${virtualRoute}${req.path}`
                                );

                                return evt(ctx);
                            }
                        );
                    },
                    true
                );
            }

            _virtualDir.push({
                route: originalRoute,
                root
            });
        };

        if (_server.config.bundler && _server.config.bundler.enable) {
            const { Bundler } = require("./app-bundler");
            Bundler.Init(_app, _controller, _server);
        }

        if (Util.isArrayLike(_server.config.views)) {
            _server.config.views.forEach(
                path => _importLocalAssets(path)
            );
        }

        _app.prerequisites((req: IRequest, res: IResponse, next: NextFunction): void => {
            req.session = _server.parseSession(req.headers, req.cookies);
            return next();
        });

        _app.on("error", (req: IRequest, res: IResponse, err?: number | Error): void => {

            if (res.isAlive) {

                const context: IContext = _process.createContext(
                    req, res, res.sendIfError.bind(res)
                );

                if (!err) {
                    return context.transferRequest(404);
                }

                if (err instanceof Error) {
                    return context.transferError(err);
                }
            }
        });

        AppView.init(_app, _controller, _server);

        _controller.sort();


        _app.use(async (req: IRequest, res: IResponse, next: NextFunction) => {
            const context = _process.createContext(
                req, res, next
            );

            const reqPath = req.path;

            const isHidden = _server.config.hiddenDirectory.some(
                dir => reqPath.startsWith(dir)
            );

            if (isHidden) {
                _server.log.write(
                    `Trying to access Hidden directory. Remote Address ${req.ip} Send 404 ${req.path}`
                );

                return _server.transferRequest(context, 404);
            }

            if (reqPath.includes("$root") || reqPath.includes("$public")) {

                _server.log.write(
                    `Trying to access directly reserved keyword ($root | $public). Remote Address ${req.ip} Send 404 ${req.path}`
                );

                return _server.transferRequest(context, 404);
            }

            try {
                if (!_server.isValidContext(context)) {
                    return;
                }

                return await _controller.processAny(context);

            } catch (ex: any) {
                return _server.transferRequest(
                    _server.addError(context, ex),
                    500
                );
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