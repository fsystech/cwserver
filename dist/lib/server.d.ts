import { ISession, IResInfo } from "./app-static";
import { IRequestParam } from './app-router';
import { NextFunction, IApplication, IRequest, IResponse } from './server-core';
import { ICwDatabaseType } from './db-type';
import { IController } from './app-controller';
import { ICryptoInfo } from "./encryption";
import { ILogger } from "./logger";
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
export interface ICwServer {
    readonly version: string;
    readonly errorPage: {
        [x: string]: string;
    };
    readonly log: ILogger;
    readonly config: IServerConfig;
    readonly encryption: IServerEncryption;
    readonly db: NodeJS.Dict<ICwDatabaseType>;
    readonly port: string | number;
    copyright(): string;
    createLogger(): void;
    createContext(req: IRequest, res: IResponse, next: NextFunction): IContext;
    initilize(): void;
    getAppConfigName(): string;
    implimentConfig(config: NodeJS.Dict<any>): void;
    setDefaultProtectionHeader(res: IResponse): void;
    parseSession(cook: undefined | string[] | string | {
        [x: string]: any;
    }): ISession;
    setSession(ctx: IContext, loginId: string, roleId: string, userData: any): boolean;
    passError(ctx: IContext): boolean;
    getErrorPath(statusCode: number, tryServer?: boolean): string | void;
    transferRequest(ctx: IContext, path: string | number, status?: IResInfo): void;
    mapPath(path: string): string;
    pathToUrl(path: string): string;
    addError(ctx: IContext, ex: Error | string): IContext;
    escape(unsafe?: string | null): string;
    addVirtualDir(route: string, root: string, evt?: (ctx: IContext) => void): void;
    virtualInfo(route: string): {
        route: string;
        root: string;
    } | void;
    formatPath(path: string, noCheck?: boolean): string;
    createBundle(str: string): string;
    addMimeType(extension: string, val: string): void;
    getRoot(): string;
    getPublic(): string;
    getPublicDirName(): string;
    parseMaxAge(maxAge: any): number;
    on(ev: 'shutdown', handler: () => void): void;
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
    parseSession(cook: undefined | string[] | string | {
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
