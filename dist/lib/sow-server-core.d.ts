/// <reference types="node" />
import { Server, IncomingMessage, ServerResponse } from 'http';
import { ISession } from './sow-static';
import { UrlWithParsedQuery } from 'url';
import { Socket } from 'net';
declare type ParsedUrlQuery = {
    [key: string]: string | string[] | undefined;
};
export declare type NextFunction = (err?: any) => void;
export declare type HandlerFunc = (req: IRequest, res: IResponse, next: NextFunction) => void;
export interface CookieOptions {
    maxAge?: number;
    signed?: boolean;
    expires?: Date;
    httpOnly?: boolean;
    path?: string;
    domain?: string;
    secure?: boolean;
    encode?: (val: string) => string;
    sameSite?: boolean | 'lax' | 'strict' | 'none';
}
export interface IHandlers {
    route?: string;
    handler: HandlerFunc;
    regexp: RegExp | undefined;
}
export interface IRequest extends IncomingMessage {
    socket: Socket;
    q: UrlWithParsedQuery;
    init(): IRequest;
    path: string;
    cookies: {
        [key: string]: string;
    };
    query: ParsedUrlQuery;
    session: ISession;
    ip: string;
}
export interface IResponse extends ServerResponse {
    json(body: {
        [key: string]: any;
    }): void;
    status(code: number): IResponse;
    cookie(name: string, val: string, options: CookieOptions): IResponse;
    set(field: string, value: number | string | string[]): IResponse;
    redirect(url: string): void;
}
export interface IApplication {
    server: Server;
    use(...args: any[]): IApplication;
    listen(handle: any, listeningListener?: () => void): IApplication;
    handleRequest(req: IRequest, res: IResponse): void;
    prerequisites(handler: (req: IRequest, res: IResponse, next: NextFunction) => void): IApplication;
    onError(handler: (req: IRequest, res: IResponse, err?: Error | number) => void): void;
}
export interface IApps {
    use(...args: any[]): IApps;
    listen(handle: any, listeningListener?: () => void): IApps;
    handleRequest(req: IRequest, res: IResponse): IApps;
    prerequisites(handler: (req: IRequest, res: IResponse, next: NextFunction) => void): IApps;
    getHttpServer(): Server;
    onError(handler: (req: IRequest, res: IResponse, err?: Error | number) => void): void;
}
export declare function parseCookie(cook: undefined | string[] | string | {
    [x: string]: string;
}): {
    [x: string]: string;
};
export declare class Request extends IncomingMessage implements IRequest {
    q: UrlWithParsedQuery;
    cookies: {
        [key: string]: string;
    };
    session: ISession;
    path: string;
    ip: string;
    get query(): ParsedUrlQuery;
    init(): Request;
}
export declare class Response extends ServerResponse implements IResponse {
    redirect(url: string): void;
    set(field: string, value: number | string | string[]): IResponse;
    cookie(name: string, val: string, options: CookieOptions): IResponse;
    json(body: {
        [key: string]: any;
    }): void;
    status(code: number): IResponse;
}
export declare function getRouteExp(route: string): RegExp;
export declare class Application implements IApplication {
    server: Server;
    private _appHandler;
    private _prerequisitesHandler;
    private _onError?;
    constructor(server: Server);
    onError(handler: (req: IRequest, res: IResponse, err?: Error | number) => void): void;
    _handleRequest(req: IRequest, res: IResponse, handlers: IHandlers[], next: NextFunction, isPrerequisites: boolean): void;
    handleRequest(req: IRequest, res: IResponse): void;
    prerequisites(handler: HandlerFunc): IApplication;
    use(...args: any[]): IApplication;
    listen(handle: any, listeningListener?: () => void): IApplication;
}
export declare class Apps implements IApps {
    onError(handler: (req: IRequest, res: IResponse, err?: number | Error | undefined) => void): void;
    use(..._args: any[]): IApps;
    getHttpServer(): Server;
    listen(_handle: any, listeningListener?: () => void): IApps;
    handleRequest(req: IRequest, res: IResponse): IApps;
    prerequisites(handler: (req: IRequest, res: IResponse, next: NextFunction) => void): IApps;
}
export declare function App(): IApps;
export {};