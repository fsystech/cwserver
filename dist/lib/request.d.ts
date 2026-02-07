import { IncomingMessage } from 'node:http';
import { ISession } from './app-static';
import { UrlWithParsedQuery } from 'node:url';
type ParsedUrlQuery = {
    [key: string]: string | string[] | undefined;
};
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
export declare class Request extends IncomingMessage implements IRequest {
    private _q;
    private _cookies;
    private _path;
    private _session;
    private _ip;
    private _id;
    private _cleanSocket;
    private _isMobile;
    private _isLocal;
    get isMobile(): boolean;
    get cleanSocket(): boolean;
    set cleanSocket(val: boolean);
    get q(): UrlWithParsedQuery;
    get cookies(): NodeJS.Dict<string>;
    get session(): ISession;
    set session(val: ISession);
    get isLocal(): boolean;
    get path(): string;
    set path(val: string);
    get ip(): string;
    get id(): string;
    get query(): ParsedUrlQuery;
    get(name: string): string | void;
    setSocketNoDelay(noDelay?: boolean): void;
    dispose(): void;
}
export {};
