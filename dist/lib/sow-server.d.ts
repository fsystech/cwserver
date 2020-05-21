/// <reference types="node" />
import { ISession, IResInfo } from "./sow-static";
import { NextFunction, IApps, HandlerFunc, IRequest, IResponse } from './sow-server-core';
import { Server } from 'http';
import { ISowDatabaseType } from './sow-db-type';
import { IController } from './sow-controller';
import { ICryptoInfo } from "./sow-encryption";
import { ILogger } from "./sow-logger";
export declare type CtxNext = (code?: number | undefined, transfer?: boolean) => any;
export declare type AppHandler = (ctx: IContext) => any;
export interface IContext {
    [key: string]: any;
    error?: string;
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
    transferRequest(toPath: string): void;
    write(str: string): void;
}
export interface ICrypto {
    encryptStr(plainText: string): string;
    encryptUri(plainText: string): string;
    decryptStr(plainText: string): string;
    decryptUri(plainText: string): string;
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
    [key: string]: any;
    copyright(): string;
    encryptStr(plainText: string): string;
    decryptStr(encryptedText: string): string;
    log: ILogger;
    createContext(req: IRequest, res: IResponse, next: NextFunction): IContext;
    config: IServerConfig;
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
    transferRequest(ctx: IContext, path: string, status?: IResInfo): void;
    mapPath(path: string): string;
    pathToUrl(path: string): string;
    addError(ctx: IContext, ex: Error | string): IContext;
    escape(unsafe?: string): string;
    addVirtualDir(route: string, root: string, evt?: HandlerFunc): void;
    virtualInfo(route: string): {
        route: string;
        root: string;
    } | void;
    formatPath(name: string): string;
    createBundle(str: string): string;
    getHttpServer(): Server;
    getRoot(): string;
    getPublic(): string;
    encryption: IServerEncryption;
    crypto: ICrypto;
    db: {
        [x: string]: ISowDatabaseType;
    };
    on(ev: 'shutdown', handler: Function): void;
}
export declare type IViewHandler = (app: IApps, controller: IController, server: ISowServer) => void;
export interface ISowView {
    [key: string]: IViewHandler | any;
    __isRunOnly: boolean;
    __esModule: boolean;
    __moduleName: string;
    Init: IViewHandler;
}
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
    [key: string]: any;
    error?: string;
    res: IResponse;
    req: IRequest;
    path: string;
    extension: string;
    root: string;
    session: ISession;
    servedFrom?: string;
    server: ISowServer;
    constructor(_server: ISowServer, _req: IRequest, _res: IResponse, _session: ISession);
    next(code?: number | undefined, transfer?: boolean): void;
    redirect(url: string): void;
    write(str: string): void;
    transferRequest(toPath: string): void;
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
export declare class Crypto implements ICrypto {
    constructor();
    encryptStr(plainText: string): string;
    encryptUri(plainText: string): string;
    decryptStr(plainText: string): string;
    decryptUri(plainText: string): string;
}
export declare class SowServer implements ISowServer {
    [key: string]: any;
    config: IServerConfig;
    root: string;
    public: string;
    rootregx: RegExp;
    publicregx: RegExp;
    nodeModuleregx: RegExp;
    log: ILogger;
    crypto: ICrypto;
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
    on(ev: "shutdown", handler: Function): void;
    getHttpServer(): Server;
    getRoot(): string;
    getPublic(): string;
    implimentConfig(config: {
        [x: string]: any;
    }): void;
    initilize(): void;
    copyright(): string;
    encryptStr(plainText: string): string;
    decryptStr(encryptedText: string): string;
    createContext(req: IRequest, res: IResponse, next: NextFunction): IContext;
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
    transferRequest(ctx: IContext, path: string, status?: IResInfo): void;
    mapPath(path: string): string;
    pathToUrl(path: string): string;
    addError(ctx: IContext, ex: string | Error): IContext;
    escape(unsafe?: string): string;
    addVirtualDir(route: string, root: string, evt?: HandlerFunc): void;
    virtualInfo(_route: string): {
        route: string;
        root: string;
    } | void;
    formatPath(name: string): string;
    createBundle(str: string): string;
}
declare global {
    namespace NodeJS {
        interface Global {
            sow: {
                server: {
                    isInitilized: boolean;
                    registerView: (next: (app: IApps, controller: IController, server: ISowServer) => void) => void;
                };
            };
        }
    }
}
export declare function initilizeServer(appRoot: string, wwwName?: string): {
    init: () => IApps;
    readonly public: string;
    readonly port: string | number;
    readonly socketPath: string;
    log: ILogger;
};
