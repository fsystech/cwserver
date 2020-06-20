/// <reference types="node" />
import { ISession, IResInfo } from "./sow-static";
import { IRequestParam } from './sow-router';
import { NextFunction, IApplication, IRequest, IResponse } from './sow-server-core';
import { Server } from 'http';
import { ISowDatabaseType } from './sow-db-type';
import { IController } from './sow-controller';
import { ICryptoInfo } from "./sow-encryption";
import { ILogger } from "./sow-logger";
export declare type CtxNext = (code?: number | undefined, transfer?: boolean) => void;
export declare type AppHandler = (ctx: IContext, requestParam?: IRequestParam) => void;
export interface IContext {
    isDisposed: boolean;
    error?: string;
    errorPage: string;
    errorCode: number;
    res: IResponse;
    req: IRequest;
    path: string;
    extension: string;
    root: string;
    session: ISession;
    servedFrom?: string;
    server: ISowServer;
    next: CtxNext;
    redirect(url: string): void;
    transferRequest(toPath: string | number): void;
    write(str: string): void;
    transferError(err: NodeJS.ErrnoException | Error): void;
    handleError(err: NodeJS.ErrnoException | Error | null | undefined, next: () => void): void;
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
    errorPage: {
        [x: string]: string;
    };
    hiddenDirectory: string[];
    hostInfo: {
        origin: string[];
        root: string;
        hostName: string;
        frameAncestors?: string;
        tls: boolean;
        cert: {
            [x: string]: string;
        };
        port: string | number;
    };
    database?: IDatabaseConfig[];
    staticFile: {
        compression: boolean;
        minCompressionSize: number;
        fileCache: false;
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
    };
}
export interface ISowServer {
    version: string;
    errorPage: {
        [x: string]: any;
    };
    copyright(): string;
    log: ILogger;
    createContext(req: IRequest, res: IResponse, next: NextFunction): IContext;
    config: IServerConfig;
    initilize(): void;
    implimentConfig(config: {
        [x: string]: any;
    }): void;
    setDefaultProtectionHeader(res: IResponse): void;
    setHeader(res: IResponse): void;
    parseCookie(cook: {
        [x: string]: string;
    } | string): {
        [x: string]: string;
    };
    parseSession(cookies: {
        [x: string]: string;
    } | string): ISession;
    setSession(ctx: IContext, loginId: string, roleId: string, userData: any): boolean;
    passError(ctx: IContext): boolean;
    getErrorPath(statusCode: number, tryServer?: boolean): string | void;
    transferRequest(ctx: IContext, path: string | number, status?: IResInfo): void;
    mapPath(path: string): string;
    pathToUrl(path: string): string;
    addError(ctx: IContext, ex: Error | string): IContext;
    escape(unsafe?: string): string;
    addVirtualDir(route: string, root: string, evt?: (ctx: IContext) => void): void;
    virtualInfo(route: string): {
        route: string;
        root: string;
    } | void;
    formatPath(name: string, noCheck?: boolean): string;
    createBundle(str: string): string;
    getHttpServer(): Server;
    getRoot(): string;
    getPublic(): string;
    getPublicDirName(): string;
    encryption: IServerEncryption;
    parseMaxAge(maxAge: any): number;
    db: {
        [x: string]: ISowDatabaseType;
    };
    on(ev: 'shutdown', handler: () => void): void;
}
export declare type IViewHandler = (app: IApplication, controller: IController, server: ISowServer) => void;
export declare const disposeContext: (ctx: IContext) => void, removeContext: (id: string) => void, getContext: (server: ISowServer, req: IRequest, res: IResponse) => IContext, getMyContext: (id: string) => IContext | undefined, appVersion: string, readAppVersion: () => string;
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
    isDisposed: boolean;
    error?: string;
    errorPage: string;
    errorCode: number;
    res: IResponse;
    req: IRequest;
    path: string;
    extension: string;
    root: string;
    session: ISession;
    servedFrom?: string;
    server: ISowServer;
    next: CtxNext;
    constructor(_server: ISowServer, _req: IRequest, _res: IResponse, _session: ISession);
    transferError(err: NodeJS.ErrnoException | Error): void;
    handleError(err: NodeJS.ErrnoException | Error | null | undefined, next: () => void): void;
    redirect(url: string): void;
    write(str: string): void;
    transferRequest(path: string | number): void;
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
    errorPage: {
        [x: string]: any;
    };
    hiddenDirectory: string[];
    hostInfo: {
        origin: string[];
        root: string;
        hostName: string;
        frameAncestors?: string;
        tls: boolean;
        cert: {
            [x: string]: string;
        };
        port: string | number;
    };
    database?: IDatabaseConfig[];
    staticFile: {
        compression: boolean;
        minCompressionSize: number;
        fileCache: false;
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
    };
    template: {
        cache: boolean;
        cacheType: string;
    };
    constructor();
}
export declare class SowServer implements ISowServer {
    get version(): string;
    config: IServerConfig;
    root: string;
    public: string;
    rootregx: RegExp;
    publicregx: RegExp;
    nodeModuleregx: RegExp;
    log: ILogger;
    userInteractive: boolean;
    port: string | number;
    db: {
        [x: string]: ISowDatabaseType;
    };
    encryption: IServerEncryption;
    errorPage: {
        [x: string]: string;
    };
    constructor(appRoot: string, wwwName?: string);
    on(ev: "shutdown", handler: () => void): void;
    getHttpServer(): Server;
    getRoot(): string;
    parseMaxAge(maxAge: any): number;
    getPublic(): string;
    getPublicDirName(): string;
    implimentConfig(config: {
        [x: string]: any;
    }): void;
    initilize(): void;
    copyright(): string;
    createContext(req: IRequest, res: IResponse, next: NextFunction): IContext;
    setDefaultProtectionHeader(res: IResponse): void;
    setHeader(res: IResponse): void;
    parseCookie(cook: string | {
        [x: string]: string;
    }): {
        [x: string]: string;
    };
    parseSession(cookies: string | {
        [x: string]: any;
    }): ISession;
    setSession(ctx: IContext, loginId: string, roleId: string, userData: any): boolean;
    passError(ctx: IContext): boolean;
    getErrorPath(statusCode: number, tryServer?: boolean): string | void;
    transferRequest(ctx: IContext, path: string | number, status?: IResInfo): void;
    mapPath(path: string): string;
    pathToUrl(path: string): string;
    addError(ctx: IContext, ex: string | Error): IContext;
    escape(unsafe?: string): string;
    addVirtualDir(route: string, root: string, evt?: (ctx: IContext) => void): void;
    virtualInfo(_route: string): {
        route: string;
        root: string;
    } | void;
    formatPath(name: string, noCheck?: boolean): string;
    createBundle(str: string): string;
}
declare type IViewRegister = (app: IApplication, controller: IController, server: ISowServer) => void;
interface ISowGlobalServer {
    on(ev: "register-view", next: IViewRegister): void;
    emit(ev: "register-view", app: IApplication, controller: IController, server: ISowServer): void;
}
interface ISowGlobal {
    isInitilized: boolean;
    HttpMime: {
        readonly type: (extension: string) => string | undefined;
    };
    server: ISowGlobalServer;
}
declare global {
    namespace NodeJS {
        interface Global {
            sow: ISowGlobal;
        }
    }
}
export interface IAppUtility {
    init: () => IApplication;
    readonly public: string;
    readonly port: string | number;
    readonly socketPath: string;
    readonly log: ILogger;
    readonly server: ISowServer;
    readonly controller: IController;
}
export declare function initilizeServer(appRoot: string, wwwName?: string): IAppUtility;
export {};
