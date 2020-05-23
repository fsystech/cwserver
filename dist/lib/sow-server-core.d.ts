/// <reference types="node" />
import { Server, IncomingMessage, ServerResponse } from 'http';
import { ISession, IResInfo } from './sow-static';
import { IContext } from './sow-server';
import { UrlWithParsedQuery } from 'url';
import { Socket } from 'net';
declare type ParsedUrlQuery = {
    [key: string]: string | string[] | undefined;
};
declare type onError = (req: IRequest, res: IResponse, err?: Error | number) => void;
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
    readonly query: ParsedUrlQuery;
    session: ISession;
    ip: string;
}
export interface IResponse extends ServerResponse {
    json(body: {
        [key: string]: any;
    }, compress?: boolean, next?: (error: Error | null) => void): void;
    status(code: number): IResponse;
    cookie(name: string, val: string, options: CookieOptions): IResponse;
    set(field: string, value: number | string | string[]): IResponse;
    redirect(url: string): void;
    render(ctx: IContext, path: string, status?: IResInfo): void;
}
export interface IApplication {
    server: Server;
    use(...args: any[]): IApplication;
    listen(handle: any, listeningListener?: () => void): IApplication;
    handleRequest(req: IRequest, res: IResponse): void;
    prerequisites(handler: (req: IRequest, res: IResponse, next: NextFunction) => void): IApplication;
    shutdown(): Promise<void>;
    on(ev: 'error', handler: onError): IApplication;
    emit(ev: 'prepare'): boolean;
}
export interface IApps {
    use(handler: HandlerFunc): IApps;
    use(route: string, handler: HandlerFunc): IApps;
    listen(handle: any, listeningListener?: () => void): IApps;
    handleRequest(req: IRequest, res: IResponse): IApps;
    prerequisites(handler: (req: IRequest, res: IResponse, next: NextFunction) => void): IApps;
    getHttpServer(): Server;
    onError(handler: (req: IRequest, res: IResponse, err?: Error | number) => void): void;
    on(ev: 'shutdown', handler: () => void): IApps;
    shutdown(next?: (err?: Error) => void): Promise<void> | void;
}
export declare function parseCookie(cook: undefined | string[] | string | {
    [x: string]: string;
}): {
    [x: string]: string;
};
export declare function App(): IApps;
export {};
