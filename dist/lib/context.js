"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports._ctxManager = exports.Context = void 0;
// 6:01 PM 2/7/2026
// by rajib chy
const app_util_1 = require("./app-util");
class Context {
    get isDisposed() {
        return this._isDisposed;
    }
    get res() {
        return this._res;
    }
    get req() {
        return this._req;
    }
    get session() {
        return this._req.session;
    }
    get server() {
        return this._server;
    }
    get next() {
        if (!this._isDisposed && this._next)
            return this._next;
        return (code, transfer) => {
            if (this._isDisposed)
                return;
            // Unreachable....
        };
    }
    set next(val) {
        this._next = val;
    }
    constructor(server, req, res) {
        this._isDisposed = false;
        this.error = void 0;
        this.path = "";
        this.root = "";
        this._res = res;
        this._req = req;
        this._server = server;
        this.extension = "";
        this.errorPage = "";
        this.errorCode = 0;
    }
    addError(err) {
        if (!this._isDisposed) {
            this._server.addError(this, err);
        }
    }
    transferError(err) {
        if (!this._isDisposed) {
            this._server.addError(this, err);
            return this._server.transferRequest(this, 500);
        }
    }
    handleError(err, next) {
        if (!this._isDisposed && !this._res.headersSent) {
            if (app_util_1.Util.isError(err)) {
                return this.transferError(err);
            }
            try {
                return next();
            }
            catch (e) {
                return this.transferError(e);
            }
        }
        // Nothing to do, context destroyed or response header already been sent
    }
    redirect(url, force) {
        if (!this._isDisposed) {
            this._res.status(302).redirect(url, force);
        }
        return this;
    }
    write(chunk) {
        if (!this._isDisposed) {
            return this._res.write(chunk), void 0;
        }
    }
    transferRequest(path) {
        if (!this._isDisposed) {
            return this._server.transferRequest(this, path);
        }
    }
    signOut() {
        if (!this._isDisposed) {
            this._res.cookie(this._server.config.session.cookie, "", {
                expires: -1
            });
        }
        return this;
    }
    setSession(loginId, roleId, userData) {
        if (!this._isDisposed) {
            this._server.setSession(this, loginId, roleId, userData);
        }
        return this;
    }
    dispose() {
        if (this._isDisposed)
            return void 0;
        this._isDisposed = true;
        delete this._next;
        const id = this._req.id;
        // @ts-ignore
        delete this._server;
        delete this.path;
        // @ts-ignore
        this._res.dispose();
        delete this._res;
        // @ts-ignore
        this._req.dispose();
        delete this._req;
        // @ts-ignore
        delete this.extension;
        delete this.root;
        delete this.servedFrom;
        delete this.error;
        return id;
    }
}
exports.Context = Context;
class ContextManager {
    constructor() {
        this._contexts = new Map();
    }
    disposeContext(ctx) {
        const reqId = ctx.dispose();
        if (reqId) {
            this._contexts.delete(reqId);
        }
    }
    getMyContext(id) {
        return this._contexts.get(id);
    }
    removeContext(id) {
        const ctx = this._contexts.get(id);
        if (ctx) {
            this.disposeContext(ctx);
        }
    }
    getContext(server, req, res) {
        let ctx = this._contexts.get(req.id);
        if (!ctx) {
            ctx = new Context(server, req, res);
            this._contexts.set(req.id, ctx);
        }
        return ctx;
    }
}
class ContextManagerStatic {
    static getInstance() {
        if (this._instance === null) {
            this._instance = new ContextManager();
        }
        return this._instance;
    }
}
ContextManagerStatic._instance = null;
exports._ctxManager = ContextManagerStatic.getInstance();
//# sourceMappingURL=context.js.map