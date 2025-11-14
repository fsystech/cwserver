import { ISession, IResInfo } from "./app-static";
import { IRequestParam } from './app-router';
import { NextFunction, IApplication, IRequest, IResponse } from './server-core';
import { ICwDatabaseType } from './db-type';
import { IController } from './app-controller';
import { ICryptoInfo } from "./encryption";
import { ILogger } from "./logger";
import { IncomingHttpHeaders } from "node:http";
export type CtxNext = (code?: number | undefined, transfer?: boolean) => void;
export type AppHandler = (ctx: IContext, requestParam?: IRequestParam) => void;
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
    write(chunk: Buffer | string | number | boolean | {
        [key: string]: any;
    }): void;
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
    readonly errorPage: {
        [x: string]: string;
    };
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
    parseSession(headers: IncomingHttpHeaders, cook: undefined | string[] | string | {
        [x: string]: any;
    }): ISession;
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
    virtualInfo(route: string): {
        route: string;
        root: string;
    } | void;
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
export declare const disposeContext: (ctx: IContext) => void, removeContext: (id: string) => void, getContext: (server: ICwServer, req: IRequest, res: IResponse) => IContext, getMyContext: (id: string) => IContext | undefined;
export declare class ServerEncryption implements IServerEncryption {
    private cryptoInfo;
    constructor(inf: ICryptoInfo);
    encrypt(plainText: string): string;
    decrypt(encryptedText: string): string;
    encryptToHex(plainText: string): string;
    decryptFromHex(encryptedText: string): string;
    encryptUri(plainText: string): string;
    decryptUri(encryptedText: string): string;
}
export declare class Context implements IContext {
    private _isDisposed;
    get isDisposed(): boolean;
    error?: string;
    errorPage: string;
    errorCode: number;
    private _res;
    private _req;
    get res(): IResponse;
    get req(): IRequest;
    path: string;
    extension: string;
    root: string;
    get session(): ISession;
    servedFrom?: string;
    private _server;
    get server(): ICwServer;
    private _next?;
    get next(): CtxNext;
    set next(val: CtxNext);
    constructor(server: ICwServer, req: IRequest, res: IResponse);
    addError(err: NodeJS.ErrnoException | Error): void;
    transferError(err: NodeJS.ErrnoException | Error): void;
    handleError(err: NodeJS.ErrnoException | Error | null | undefined, next: () => void): void;
    redirect(url: string, force?: boolean): IContext;
    write(chunk: Buffer | string | number | boolean | {
        [key: string]: any;
    }): void;
    transferRequest(path: string | number): void;
    signOut(): IContext;
    setSession(loginId: string, roleId: string, userData: any): IContext;
    dispose(): string | void;
}
export declare class ServerConfig implements IServerConfig {
    [key: string]: any;
    Author: string;
    appName: string;
    version: string;
    packageVersion: string;
    isDebug: boolean;
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
    constructor();
}
export declare class SessionSecurity {
    constructor();
    static getRemoteAddress(ip: string): string;
    static createSession(req: IRequest, sessionObj: NodeJS.Dict<any>): string;
    static isValidSession(req: IRequest): void;
}
export declare class CwServer implements ICwServer {
    private _public;
    private _log;
    private _root;
    private _rootregx;
    private _publicregx;
    private _config;
    private _port;
    private _nodeModuleregx;
    private _userInteractive;
    private _encryption;
    private _isInitilized;
    private _db;
    private _errorPage;
    get version(): string;
    get isInitilized(): boolean;
    get config(): IServerConfig;
    get public(): string;
    get log(): ILogger;
    get port(): string | number;
    get db(): NodeJS.Dict<ICwDatabaseType>;
    get encryption(): IServerEncryption;
    get errorPage(): {
        [x: string]: string;
    };
    constructor(appRoot: string, wwwName?: string);
    createVimContext(): NodeJS.Dict<any>;
    updateEncryption(serverEnc?: IServerEncryption): void;
    on: (ev: "shutdown", handler: () => void) => void;
    addVirtualDir: (route: string, root: string, evt?: (ctx: IContext) => void) => void;
    virtualInfo: (route: string) => {
        route: string;
        root: string;
    } | void;
    getAppConfigName(): string;
    isValidContext(ctx: IContext): boolean;
    getRoot(): string;
    parseMaxAge(maxAge: any): number;
    getPublic(): string;
    getPublicDirName(): string;
    init(): void;
    implimentConfig(config: NodeJS.Dict<any>): void;
    createLogger(): void;
    initilize(): void;
    copyright(): string;
    createContext(req: IRequest, res: IResponse, next: NextFunction): IContext;
    setDefaultProtectionHeader(res: IResponse): void;
    parseSession(headers: IncomingHttpHeaders, cook: undefined | string[] | string | {
        [x: string]: any;
    }): ISession;
    setSession(ctx: IContext, loginId: string, roleId: string, userData: any): boolean;
    passError(ctx: IContext): boolean;
    getErrorPath(statusCode: number, tryServer?: boolean): string | void;
    transferRequest(ctx: IContext, path: string | number, status?: IResInfo): void;
    mapPath(path: string): string;
    pathToUrl(path: string): string;
    addError(ctx: IContext, ex: string | Error): IContext;
    escape(unsafe?: string | null): string;
    formatPath(path: string, noCheck?: boolean): string;
    createBundle(str: string): string;
    addMimeType(extension: string, val: string): void;
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
export declare function initilizeServer(appRoot: string, wwwName?: string): IAppUtility;
