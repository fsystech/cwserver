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
import { Bundler } from "./app-bundler";

export type AppHandler = (
    ctx: IContext, requestParam?: IRequestParam
) => Promise<void>;

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
    errorPage: Record<string, string>;
    hiddenDirectory: string[];
    hostInfo: {
        origin: string[];
        root: string;
        hostName: string;
        frameAncestors?: string;
        tls: boolean;
        cert: Record<string, string>;
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
    readonly db: Record<string, ICwDatabaseType>;

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
     * @param {Record<string, any>} config - Configuration object.
     */
    implimentConfig(config: Record<string, any>): void;

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
     * @returns {Record<string, any>} A newly created Vim context as a dictionary-like object.
     */
    createVimContext(): Record<string, any>;

    /**
     * Registers an event listener for server events.
     * @param {'shutdown'} ev - The event name.
     * @param {() => void} handler - The event handler function.
     */
    on(ev: "shutdown", handler: () => void): void;
}

export type IViewHandler = (app: IApplication, controller: IController, server: ICwServer) => void;

/**
 * Type guard that checks a value is neither null nor undefined.
 *
 * @param a Value to test.
 * @returns True when the value is defined, narrowing its type to T.
 */
function isDefined<T>(a: T | null | undefined): a is T {
    return a !== null && a !== undefined;
}

/**
 * Converts a maxAge unit code and amount into milliseconds, recursing from minutes up to hours, days
 * and 30-day months. Throws an Error for an unsupported unit.
 *
 * @param type Upper-case unit code: M (minute), H (hour), D (day) or MM (month).
 * @param add Number of units to convert.
 * @param maxAge Original maxAge string, used only in the error message.
 * @returns Duration in milliseconds.
 */
function getEpoch(type: string, add: number, maxAge: string): number {
    switch (type) {
        case "M": return (add * 60 * 1000); // Minute
        case "H": return getEpoch("M", 60, maxAge) * add; // Hour
        case "D": return getEpoch("H", 24, maxAge) * add; // Day
        case "MM": return getEpoch("D", 30, maxAge) * add; // Month
        default: throw new Error(`Invalid maxAage format ${maxAge}`);
    }
}

/**
 * Parses a maxAge string such as 30D, 1H or 5M into milliseconds. Throws an Error when the value is
 * not a string or does not match the digits-plus-unit format.
 *
 * @param maxAge Max-age text made of a number followed by a unit (M, H, D or MM).
 * @returns Duration in milliseconds.
 */
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

    /**
     * Resolves a reserved path key used in $key/ path placeholders to a server directory. Throws an Error
     * for unknown keys.
     *
     * @param server Server instance providing the root and public directory values.
     * @param key Placeholder key, either root or public.
     * @returns The server root path for root, or the public directory name for public.
     */
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
    /**
     * Creates an encryption helper bound to the given key and IV information.
     *
     * @param inf Crypto key and IV information used for all operations.
     */
    constructor(inf: ICryptoInfo) {
        this.cryptoInfo = inf;
    }
    /**
     * Encrypts plain text using the configured crypto info.
     *
     * @param plainText Text to encrypt.
     * @returns The encrypted text.
     */
    encrypt(plainText: string): string {
        return Encryption.encrypt(plainText, this.cryptoInfo);
    }
    /**
     * Decrypts text previously produced by encrypt using the configured crypto info.
     *
     * @param encryptedText Encrypted text to decrypt.
     * @returns The decrypted plain text.
     */
    decrypt(encryptedText: string): string {
        return Encryption.decrypt(encryptedText, this.cryptoInfo);
    }
    /**
     * Encrypts plain text and returns the result hex encoded.
     *
     * @param plainText Text to encrypt.
     * @returns The encrypted value as a hex string.
     */
    encryptToHex(plainText: string): string {
        return Encryption.encryptToHex(plainText, this.cryptoInfo);
    }
    /**
     * Decrypts a hex encoded encrypted value back to plain text.
     *
     * @param encryptedText Hex encoded encrypted text.
     * @returns The decrypted plain text.
     */
    decryptFromHex(encryptedText: string): string {
        return Encryption.decryptFromHex(encryptedText, this.cryptoInfo);
    }
    /**
     * Encrypts plain text into a URI-safe encrypted string.
     *
     * @param plainText Text to encrypt.
     * @returns The encrypted URI-safe string.
     */
    encryptUri(plainText: string): string {
        return Encryption.encryptUri(plainText, this.cryptoInfo);
    }
    /**
     * Decrypts a URI-safe encrypted string produced by encryptUri.
     *
     * @param encryptedText URI-safe encrypted text.
     * @returns The decrypted plain text.
     */
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
    errorPage: Record<string, string>;
    hiddenDirectory: string[];
    hostInfo: {
        origin: string[];
        root: string;
        hostName: string;
        frameAncestors?: string;
        tls: boolean;
        cert: Record<string, string>;
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
    /**
     * Creates a server configuration populated with defaults such as app name, session cookie, host info
     * on port 8080, static file and bundler settings and a 30 day cache max age.
     */
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

    /**
     * Returns the first part of an IP address (everything before the last dot), used to bind a session to
     * a client network. Falls back to 127.0.0 when no part can be derived.
     *
     * @param ip Remote IP address of the request.
     * @returns The IP address without its last octet.
     */
    public static getRemoteAddress(ip: string): string {
        let ipPart: string = ip.substring(0, ip.lastIndexOf('.'));
        if (!ipPart) {
            // assume local machine
            ipPart = "127.0.0";
        }
        return ipPart;
    }

    /**
     * Stamps the session object with the client's IP part and serializes it to JSON.
     *
     * @param req Current request, whose IP is recorded in the session.
     * @param sessionObj Session data object; its ipPart property is set by this call.
     * @returns JSON string of the session object.
     */
    public static createSession(req: IRequest, sessionObj: Record<string, any>): string {
        sessionObj.ipPart = this.getRemoteAddress(req.ip);
        return Util.JSON.stringify(sessionObj);
    }

    /**
     * Checks that an authenticated session belongs to the same client network and clears its authenticated
     * flag if the stored IP part is missing or differs, to prevent session hijacking.
     *
     * @param req Request whose session is validated and possibly modified.
     */
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
    private _isInitialized: boolean = false;
    private _db: Record<string, ICwDatabaseType>;
    private _errorPage: { [x: string]: string; };
    /**
     * Gets the framework version.
     *
     * @returns The application version string.
     */
    public get version() {
        return appVersion;
    }
    /**
     * Gets whether the server has finished initialization.
     *
     * @returns True once init has been called.
     */
    public get isInitialized() {
        return this._isInitialized;
    }
    /**
     * Gets the loaded server configuration.
     *
     * @returns The server configuration object.
     */
    public get config(): IServerConfig {
        return this._config;
    }
    /**
     * Gets the public (www) directory name.
     *
     * @returns The public directory name.
     */
    public get public(): string {
        return this._public;
    }
    /**
     * Gets the server logger.
     *
     * @returns The logger instance.
     */
    public get log(): ILogger {
        return this._log;
    }
    /**
     * Gets the port the server listens on.
     *
     * @returns The listener port number or string.
     */
    public get port(): string | number {
        return this._port;
    }
    /**
     * Gets the database modules loaded from configuration, keyed by module name.
     *
     * @returns Record of database instances by module name.
     */
    public get db(): Record<string, ICwDatabaseType> {
        return this._db;
    }
    /**
     * Gets the server encryption helper.
     *
     * @returns The current server encryption instance.
     */
    public get encryption(): IServerEncryption {
        return this._encryption;
    }

    /**
     * Gets the built-in default error page paths keyed by status code.
     *
     * @returns Record mapping status codes to error page file paths.
     */
    public get errorPage(): { [x: string]: string; } {
        return this._errorPage;
    }

    /**
     * Creates the server: validates the app root and public directory name, loads and validates the app
     * config file, applies configuration, initializes databases and error pages, and prepares temp
     * directories. Throws an Error if arguments are missing, the config file is absent or invalid, or host
     * root does not match.
     *
     * @param appRoot Application root directory path.
     * @param wwwName Name of the public directory under the app root; required.
     */
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

        let config: IServerConfig = null;

        try {

            config = fsw.readJsonSyncUnsafe<IServerConfig>(configPath);

        } catch (ex: any) {

            console.warn(
                `Invalid config file defined.\r\nConfig: ${configPath}`
            );

            throw ex;
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

    /**
     * Creates the context object made available to view templates; the base implementation returns an
     * empty object.
     *
     * @returns A new empty object.
     */
    public createVimContext(): Record<string, any> {
        return {};
    }

    /**
     * Replaces the server encryption helper with the supplied one, or with a new one built from the
     * configured encryption key when none is given.
     *
     * @param serverEnc Optional custom encryption implementation.
     */
    public updateEncryption(serverEnc?: IServerEncryption): void {
        this._encryption = null;

        if (serverEnc) {
            this._encryption = serverEnc;
        } else {
            this._encryption = new ServerEncryption(this._config.encryptionKey);
        }
    }

    public on: (ev: "shutdown", handler: () => void) => void;
    public addVirtualDir: (route: string, root: string, evt?: (ctx: IContext) => void) => void;
    public virtualInfo: (route: string) => { route: string; root: string; } | void;
    /**
     * Gets the config file name, taken from the APP_CONFIG_NAME environment variable or defaulting to
     * app.config.json.
     *
     * @returns The config file name.
     */
    public getAppConfigName(): string {
        if (process.env.APP_CONFIG_NAME) {
            return process.env.APP_CONFIG_NAME;
        }
        return "app.config.json";
    }

    /**
     * Hook that decides whether a request context may be processed; the base implementation accepts every
     * context.
     *
     * @param ctx Request context to check.
     * @returns True when the context is valid.
     */
    public isValidContext(ctx: IContext): boolean {
        return true;
    }

    /**
     * Gets the application root directory.
     *
     * @returns The root path.
     */
    public getRoot(): string {
        return this._root;
    }

    /**
     * Parses a maxAge string such as 1d or 30D into milliseconds.
     *
     * @param maxAge Max-age text made of a number and a unit.
     * @returns Duration in milliseconds.
     */
    public parseMaxAge(maxAge: any): number {
        return parseMaxAge(maxAge);
    }

    /**
     * Gets the full path of the public directory (root plus public name).
     *
     * @returns The public directory path.
     */
    public getPublic(): string {
        return `${this._root}/${this._public}`;
    }

    /**
     * Gets the name of the public directory.
     *
     * @returns The public directory name.
     */
    public getPublicDirName(): string {
        return this._public;
    }

    /**
     * Marks the server as initialized.
     */
    public init() {
        this._isInitialized = true;
    }

    /**
     * Validates and applies loaded configuration: checks encryption key, hidden directory list, listener
     * port, session key and max age, and cache header, converting keys and max ages to their runtime
     * forms. Throws an Error when a required setting is missing or invalid.
     *
     * @param config Raw configuration values loaded from the config file.
     */
    public implimentConfig(config: Record<string, any>): void {

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

    /**
     * Creates the server logger, disposing any previous one. Uses a file/console Logger in debug mode and
     * a no-op ShadowLogger otherwise.
     */
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

    /**
     * Initializes configured database modules, validates and normalizes the errorPage settings (merging
     * defaults for missing codes) and resolves view paths. Throws an Error on invalid database, module or
     * error page configuration.
     */
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

    /**
     * Gets the copyright header line for generated output.
     *
     * @returns Copyright comment text.
     */
    public copyright(): string {
        return '//\tCopyright (c) 2022 FSys Tech Ltd.\r\n';
    }

    /**
     * Creates the request context for a request/response pair and sets its path, root, next callback and
     * file extension.
     *
     * @param req Incoming request.
     * @param res Outgoing response.
     * @param next Next handler callback.
     * @returns The new request context.
     */
    public createContext(
        req: IRequest,
        res: IResponse,
        next: NextFunction
    ): IContext {

        const context = _ctxManager.create(
            this, req, res
        );

        context.path = req.path; context.root = context.path;
        context.next = next;

        context.extension = Util.getExtension(context.path) || "";

        return context;
    }

    /**
     * Sets default security headers on the response, including a timestamp, configured default headers,
     * frame-ancestors policy and, when the session is secure, strict transport security and expect-ct.
     *
     * @param res Response to add headers to.
     */
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

    /**
     * Reads the session cookie, decrypts it and parses it into a session object. Returns an empty session
     * when the cookie is missing or cannot be decrypted; throws if no session cookie name is configured.
     *
     * @param headers Incoming HTTP headers of the request.
     * @param cook Raw cookie value or already parsed cookie collection.
     * @returns The parsed session, or a new empty session.
     */
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

    /**
     * Hook called when a session is cleared; the base implementation does nothing.
     *
     * @param ctx Request context whose session is being cleared.
     */
    public onClearSession(ctx: IContext): void {
        // nothing to do
    }

    /**
     * Creates an encrypted session token containing login id, role id and user data and sets it as an
     * httpOnly cookie on the response.
     *
     * @param ctx Request context providing request and response.
     * @param loginId Login identifier of the user.
     * @param roleId Role identifier of the user.
     * @param userData Additional user data stored in the session.
     * @returns Always true.
     */
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

    /**
     * Sends the context's error as a 500 response, showing sanitized error details in debug mode and a
     * generic message otherwise.
     *
     * @param ctx Request context that may hold an error.
     * @returns True if an error was sent, false when the context has no error.
     */
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

    /**
     * Finds the error page path for an HTTP error status code from configuration or the built-in defaults.
     * Throws an Error for non-error codes or when no page is found.
     *
     * @param statusCode HTTP error status code.
     * @param tryServer When true, only the built-in server error page is looked up.
     * @returns The error page path, or undefined when tryServer is true and no built-in page exists.
     */
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

    /**
     * Transfers processing to another path or to an error page for a status code, rendering the result.
     * Responds with plain text for error codes on XMLHttpRequest requests, records errors, and falls back
     * to passError when no page is available.
     *
     * @param ctx Request context to transfer.
     * @param path Target path, or an HTTP status code to resolve an error page for.
     * @param status Optional response info; derived from path when omitted.
     */
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

    /**
     * Maps a path relative to the public directory to an absolute file system path.
     *
     * @param path Path relative to the public directory.
     * @returns The resolved absolute path.
     */
    public mapPath(path: string): string {
        return _path.resolve(`${this._root}/${this._public}/${path}`);
    }

    /**
     * Converts a file system path to a URL-style path without extension, trimming the public directory
     * prefix or replacing the root with $root. Paths without an extension are returned unchanged.
     *
     * @param path File system path to convert.
     * @returns The URL-style path.
     */
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

    /**
     * Appends error information to the context's error text with sanitized paths; detailed message and
     * stack are added only in debug mode. Does nothing for disposed contexts.
     *
     * @param ctx Request context to record the error on.
     * @param ex Error message or Error object.
     * @returns The same context.
     */
    public addError(ctx: IContext, ex: string | Error): IContext {
        if (ctx.isDisposed)
            return ctx;

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

    /**
     * Escapes HTML special characters and converts line breaks to br tags.
     *
     * @param unsafe Text to escape; may be empty.
     * @returns The escaped string, or an empty string for empty input.
     */
    public escape(unsafe?: string | null): string {
        if (!unsafe) return "";
        return unsafe
            .replace(/&/gi, "&amp;")
            .replace(/</gi, "&lt;")
            .replace(/>/gi, "&gt;")
            .replace(/\r\n/gi, "<br/>")
            .replace(/\n/gi, "<br/>");
    }

    /**
     * Resolves $root/ and $public/ placeholders in a path and optionally checks that the resulting file
     * exists. Throws an Error when it does not exist.
     *
     * @param path Path possibly containing placeholders.
     * @param noCheck When true, skip the existence check.
     * @returns The resolved path, or the original path if it has no placeholder.
     */
    public formatPath(path: string, noCheck?: boolean): string {
        return _formatPath(this, path, noCheck);
    }

    /**
     * Encrypts a string into a URI-safe bundle token using the server encryption key. Throws an Error for
     * an empty string.
     *
     * @param str String to encode into a bundle.
     * @returns The encrypted URI-safe bundle string.
     */
    public createBundle(str: string): string {
        if (!str)
            throw new Error("No string found to create bundle...");

        return Encryption.encryptUri(
            str, this._config.encryptionKey
        );
    }

    /**
     * Registers a MIME type for a file extension.
     *
     * @param extension File extension.
     * @param val MIME type value.
     */
    public addMimeType(extension: string, val: string): void {
        return _mimeType.add(extension, val);
    }
}

export interface IAppUtility {
    readonly public: string;
    readonly port: string | number;
    readonly socketPath: string;
    readonly log: ILogger;
    readonly server: ICwServer;
    readonly controller: IController;
    readonly initAsync: () => Promise<IApplication>;
}

/**
 * Creates the single server instance and controller and returns a utility object to start the
 * application. Throws an Error if the server was already initialized.
 *
 * @param appRoot Application root directory path.
 * @param wwwName Name of the public directory under the app root.
 * @returns Utility exposing the server, controller, logger, port, public name, socket path and the async init
 *   function.
 */
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
            };

            return _context;
        }
    };

    const _controller: IController = new Controller(
        _server.config.defaultExt && _server.config.defaultExt.length > 0 ? true : false
    );

    /**
     * Builds and configures the application: registers logging and context cleanup events, virtual
     * directory support, bundler, views, error handling and the main request handler, then marks the
     * server initialized. Throws if already initialized.
     *
     * @returns Promise resolving to the configured application.
     */
    async function initializeAsync(): Promise<IApplication> {

        if (_server.isInitialized) {
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

            /**
             * Creates a context for a virtual directory request, checks the context is valid and the target file
             * exists (404 otherwise), then runs the given handler.
             *
             * @param req Incoming request.
             * @param res Outgoing response.
             * @param next Next handler callback.
             * @param handler Function invoked with the context when the file exists.
             * @returns Promise that resolves when handling completes.
             */
            const processHandler = async (
                req: IRequest,
                res: IResponse,
                next: NextFunction,
                handler: (ctx: IContext) => void | Promise<void>
            ): Promise<void> => {

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

                const { exists } = await fsw.isExistsAsync(
                    `${root}/${ctx.path}`
                );

                if (!exists) {
                    return ctx.next(404);
                }

                return await handler(ctx);
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
                        ).catch(next);
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
                        ).catch(next);
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
            Bundler.Init(_app, _controller, _server);
        }

        if (Util.isArrayLike(_server.config.views)) {
            _server.config.views.forEach(
                path => _importLocalAssets(path)
            );
        }

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

        await AppView.initAsync(_app, _controller, _server);

        _controller.sort();

        const hasHiddenDirectory = _server.config.hiddenDirectory.length > 0;

        _app.use(async (req: IRequest, res: IResponse, next: NextFunction) => {
            const context = _process.createContext(
                req, res, next
            );

            const reqPath = req.path;

            if (hasHiddenDirectory) {

                const isHidden = _server.config.hiddenDirectory.some(
                    dir => reqPath.startsWith(dir)
                );

                if (isHidden) {
                    _server.log.write(
                        `Trying to access Hidden directory. Remote Address ${req.ip} Send 404 ${req.path}`
                    );

                    return _server.transferRequest(context, 404);
                }

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
    }

    AppView.isInitilized = true;

    return {
        initAsync: initializeAsync,
        /**
         * Gets the public directory name of the server.
         *
         * @returns The public directory name.
         */
        get public() { return _server.public; },
        /**
         * Gets the listener port of the server.
         *
         * @returns The port number or string.
         */
        get port() { return _server.port; },
        /**
         * Gets the server logger.
         *
         * @returns The logger instance.
         */
        get log() { return _server.log; },
        /**
         * Gets the configured socket path as a string.
         *
         * @returns The socket path string.
         */
        get socketPath() { return toString(_server.config.socketPath); },
        /**
         * Gets the server instance.
         *
         * @returns The server instance.
         */
        get server() { return _server; },
        /**
         * Gets the request controller.
         *
         * @returns The controller instance.
         */
        get controller() { return _controller; }
    };
}