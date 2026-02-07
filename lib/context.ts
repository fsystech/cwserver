
// Copyright (c) 2022 FSys Tech Ltd.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// 6:01 PM 2/7/2026
// by rajib chy

import { Util } from "./app-util";
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
    write(chunk: Buffer | string | number | boolean | { [key: string]: any }): void;
    addError(err: NodeJS.ErrnoException | Error): void;
    transferError(err: NodeJS.ErrnoException | Error): void;
    handleError(err: NodeJS.ErrnoException | Error | null | undefined, next: () => void): void;
    setSession(loginId: string, roleId: string, userData: any): IContext;
    signOut(): IContext;
    dispose(): string | void;
}

export class Context implements IContext {
    private _isDisposed: boolean;
    public get isDisposed(): boolean {
        return this._isDisposed;
    }
    public error?: string;
    public errorPage: string;
    public errorCode: number;
    private _res: IResponse;
    private _req: IRequest;
    public get res(): IResponse {
        return this._res;
    }
    public get req(): IRequest {
        return this._req;
    }
    public path: string;
    public extension: string;
    public root: string;
    public get session(): ISession {
        return this._req.session;
    }
    public servedFrom?: string;
    private _server: ICwServer;
    public get server(): ICwServer {
        return this._server;
    }

    private _next?: CtxNext;

    public get next(): CtxNext {
        if (!this._isDisposed && this._next) return this._next;
        return (code?: number, transfer?: boolean): void => {
            if (this._isDisposed) return;
            // Unreachable....
        };
    }

    public set next(val: CtxNext) {
        this._next = val;
    }

    constructor(
        server: ICwServer,
        req: IRequest,
        res: IResponse
    ) {
        this._isDisposed = false;
        this.error = void 0; this.path = ""; this.root = "";
        this._res = res; this._req = req; this._server = server;
        this.extension = ""; this.errorPage = ""; this.errorCode = 0;
    }

    public addError(err: NodeJS.ErrnoException | Error): void {
        if (!this._isDisposed) {
            this._server.addError(this, err)
        }
    }

    public transferError(err: NodeJS.ErrnoException | Error): void {
        if (!this._isDisposed) {
            this._server.addError(this, err);
            return this._server.transferRequest(this, 500);
        }
    }

    public handleError(err: NodeJS.ErrnoException | Error | null | undefined, next: () => void): void {
        if (!this._isDisposed && !this._res.headersSent) {
            if (Util.isError(err)) {
                return this.transferError(err);
            }
            try {
                return next();
            } catch (e: any) {
                return this.transferError(e);
            }
        }
        // Nothing to do, context destroyed or response header already been sent
    }

    public redirect(url: string, force?: boolean): IContext {
        if (!this._isDisposed) {
            this._res.status(302).redirect(url, force);
        }
        return this;
    }

    public write(chunk: Buffer | string | number | boolean | { [key: string]: any }): void {
        if (!this._isDisposed) {
            return this._res.write(chunk), void 0;
        }
    }

    public transferRequest(path: string | number): void {
        if (!this._isDisposed) {
            return this._server.transferRequest(this, path);
        }
    }

    public signOut(): IContext {
        if (!this._isDisposed) {
            this._res.cookie(this._server.config.session.cookie, "", {
                expires: -1
            });
        }
        return this;
    }

    public setSession(loginId: string, roleId: string, userData: any): IContext {
        if (!this._isDisposed) {
            this._server.setSession(this, loginId, roleId, userData);
        }
        return this;
    }

    public dispose(): string | void {
        if (this._isDisposed) return void 0;
        this._isDisposed = true;

        delete this._next;

        const id: string = this._req.id;
        // @ts-ignore
        delete this._server; delete this.path;
        // @ts-ignore
        this._res.dispose(); delete this._res;
        // @ts-ignore
        this._req.dispose(); delete this._req;
        // @ts-ignore
        delete this.extension; delete this.root;
        delete this.servedFrom; delete this.error;

        return id;
    }
}

class ContextManager {
    private _contexts: Map<string, IContext>;

    constructor() {
        this._contexts = new Map();
    }

    public disposeContext(ctx: IContext): void {
        const reqId: string | void = ctx.dispose();

        if (reqId) {
            this._contexts.delete(reqId);
        }

    }

    public getMyContext(id: string): IContext | undefined {
        return this._contexts.get(id);
    }

    public removeContext(id: string): void {
        const ctx: IContext = this._contexts.get(id);

        if (ctx) {
            this.disposeContext(ctx);
        }
    }

    public getContext(server: ICwServer, req: IRequest, res: IResponse): IContext {
        let ctx: IContext = this._contexts.get(req.id);

        if (!ctx) {
            ctx = new Context(server, req, res);
            this._contexts.set(req.id, ctx);
        }

        return ctx;
    }
}

class ContextManagerStatic {
    private static _instance: ContextManager = null;
    public static getInstance(): ContextManager {
        if (this._instance === null) {
            this._instance = new ContextManager();
        }
        return this._instance;
    }
}

export const _ctxManager = ContextManagerStatic.getInstance();