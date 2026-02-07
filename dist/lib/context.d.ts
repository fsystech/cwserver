import type { IResponse } from "./response";
import type { IRequest } from "./request";
import type { ISession } from "./app-static";
import type { ICwServer } from "./server";
type CtxNext = (code?: number | undefined, transfer?: boolean) => void;
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
declare class ContextManager {
    private _contexts;
    constructor();
    disposeContext(ctx: IContext): void;
    getMyContext(id: string): IContext | undefined;
    removeContext(id: string): void;
    getContext(server: ICwServer, req: IRequest, res: IResponse): IContext;
}
export declare const _ctxManager: ContextManager;
export {};
