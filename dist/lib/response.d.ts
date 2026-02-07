import { OutgoingHttpHeaders, ServerResponse } from 'node:http';
import { type IResInfo } from './app-static';
import type { IContext } from './context';
type CookieOptions = {
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
};
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
export declare class Response extends ServerResponse implements IResponse {
    private _isAlive;
    private _method;
    private _cleanSocket;
    private _statusCode;
    get statusCode(): number;
    set statusCode(code: number);
    get cleanSocket(): boolean;
    set cleanSocket(val: boolean);
    get isAlive(): boolean;
    set isAlive(val: boolean);
    get method(): string;
    set method(val: string);
    noCache(): IResponse;
    status(code: number, headers?: OutgoingHttpHeaders): IResponse;
    get(name: string): string | void;
    set(field: string, value: number | string | string[]): IResponse;
    type(extension: string): IResponse;
    send(chunk?: any): void;
    asHTML(code: number, contentLength?: number, isGzip?: boolean): IResponse;
    asJSON(code: number, contentLength?: number, isGzip?: boolean): IResponse;
    render(ctx: IContext, path: string, status?: IResInfo): void;
    redirect(url: string, force?: boolean): void;
    cookie(name: string, val: string, options: CookieOptions): IResponse;
    sendIfError(err?: any): boolean;
    json(body: NodeJS.Dict<any>, compress?: boolean, next?: (error: Error | null) => void): void;
    dispose(): void;
}
export {};
