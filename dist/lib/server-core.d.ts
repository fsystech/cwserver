import './app-global';
import { OutgoingHttpHeaders, Server, IncomingMessage, ServerResponse } from 'node:http';
import { IRequestParam } from './app-router';
import { ISession, IResInfo } from './app-static';
import { IContext } from './server';
import { UrlWithParsedQuery } from 'node:url';
type ParsedUrlQuery = {
    [key: string]: string | string[] | undefined;
};
type onError = (req: IRequest, res: IResponse, err?: Error | number) => void;
export type NextFunction = (err?: any) => void;
export type HandlerFunc = (req: IRequest, res: IResponse, next: NextFunction, requestParam?: IRequestParam) => void;
export interface CookieOptions {
    maxAge?: number;
    signed?: boolean;
    /** Date | timestamp */
    expires?: Date | number;
    httpOnly?: boolean;
    path?: string;
    domain?: string;
    secure?: boolean;
    encode?: (val: string) => string;
    sameSite?: boolean | 'lax' | 'strict' | 'none';
}
export interface IRequest extends IncomingMessage {
    readonly q: UrlWithParsedQuery;
    readonly id: string;
    readonly cookies: NodeJS.Dict<string>;
    readonly query: ParsedUrlQuery;
    readonly ip: string;
    readonly isMobile: boolean;
    readonly isLocal: boolean;
    cleanSocket: boolean;
    path: string;
    session: ISession;
    get(name: string): string | void;
    setSocketNoDelay(noDelay?: boolean): void;
    dispose(): void;
}
export interface IResponse extends ServerResponse {
    readonly isAlive: boolean;
    readonly statusCode: number;
    cleanSocket: boolean;
    json(body: NodeJS.Dict<any>, compress?: boolean, next?: (error: Error | null) => void): void;
    status(code: number, headers?: OutgoingHttpHeaders): IResponse;
    asHTML(code: number, contentLength?: number, isGzip?: boolean): IResponse;
    asJSON(code: number, contentLength?: number, isGzip?: boolean): IResponse;
    cookie(name: string, val: string, options: CookieOptions): IResponse;
    get(name: string): string | void;
    set(field: string, value: number | string | string[]): IResponse;
    redirect(url: string, force?: boolean): void;
    render(ctx: IContext, path: string, status?: IResInfo): void;
    type(extension: string): IResponse;
    noCache(): IResponse;
    sendIfError(err?: any): boolean;
    send(chunk?: Buffer | string | number | boolean | {
        [key: string]: any;
    }): void;
    dispose(): void;
}
export interface IApplication {
    readonly version: string;
    readonly httpServer: Server;
    readonly isRunning: boolean;
    clearHandler(): void;
    use(handler: HandlerFunc): IApplication;
    use(route: string, handler: HandlerFunc, isVirtual?: boolean): IApplication;
    prerequisites(handler: (req: IRequest, res: IResponse, next: NextFunction) => void): IApplication;
    shutdown(next: (err?: Error) => void): Promise<void> | void;
    shutdownAsync(): Promise<void>;
    on(ev: 'request-begain', handler: (req: IRequest) => void): IApplication;
    on(ev: 'response-end', handler: (req: IRequest, res: IResponse) => void): IApplication;
    on(ev: 'error', handler: onError): IApplication;
    on(ev: 'shutdown', handler: () => void): IApplication;
    listen(handle: any, listeningListener?: () => void): IApplication;
}
export declare const appVersion: string, readAppVersion: () => string;
export declare function parseCookie(cook: undefined | string[] | string | {
    [x: string]: any;
}): NodeJS.Dict<string>;
export declare function escapePath(unsafe?: string | null): string;
export declare function getClientIp(req: IRequest): string;
export declare function parseUrl(url?: string): UrlWithParsedQuery;
export declare function App(): IApplication;
export {};
