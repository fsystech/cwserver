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
    /**
     * Indicates whether this context has been disposed.
     *
     * @returns True if dispose has been called.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Gets the response object for this context.
     *
     * @returns The response.
     */
    get res() {
        return this._res;
    }
    /**
     * Gets the request object for this context.
     *
     * @returns The request.
     */
    get req() {
        return this._req;
    }
    /**
     * Gets the session of the underlying request.
     *
     * @returns The current session.
     */
    get session() {
        return this._req.session;
    }
    /**
     * Gets the server instance that owns this context.
     *
     * @returns The server.
     */
    get server() {
        return this._server;
    }
    /**
     * Gets the callback that continues request processing; returns a no-op function if the context is
     * disposed or no callback was set.
     *
     * @returns The next handler function.
     */
    get next() {
        if (!this._isDisposed && this._next)
            return this._next;
        return (code, transfer) => {
            if (this._isDisposed)
                return;
            // Unreachable....
        };
    }
    /**
     * Sets the callback that continues request processing.
     *
     * @param val The next handler.
     */
    set next(val) {
        this._next = val;
    }
    /**
     * Creates a context bound to a server, request and response, with empty path, root, extension and
     * error state.
     *
     * @param server Owning server instance.
     * @param req Incoming request.
     * @param res Outgoing response.
     */
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
    /**
     * Records an error for this context on the server; does nothing if the context is disposed.
     *
     * @param err The error to record.
     */
    addError(err) {
        if (!this._isDisposed) {
            this._server.addError(this, err);
        }
    }
    /**
     * Records the error on the server and transfers the request to the 500 error handling; does nothing if
     * disposed.
     *
     * @param err The error to record and handle.
     */
    transferError(err) {
        if (!this._isDisposed) {
            this._server.addError(this, err);
            return this._server.transferRequest(this, 500);
        }
    }
    /**
     * If the context is live and headers have not been sent, transfers the request on error, otherwise
     * calls next, transferring any error it throws.
     *
     * @param err Error from a previous operation, if any.
     * @param next Callback to run when there is no error.
     */
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
    /**
     * Sends the body as a JSON response, compressed with the encoding the client accepts; does nothing if
     * disposed.
     *
     * @param body Object to serialize as JSON.
     */
    json(body) {
        if (this._isDisposed)
            return;
        this._res.json(body, this._req.acceptEncoding());
    }
    /**
     * Sends a 302 redirect to the given URL; does nothing if disposed.
     *
     * @param url Target URL.
     * @param force If true, prevents caching of the redirect.
     */
    redirect(url, force) {
        if (!this._isDisposed) {
            this._res.status(302).redirect(url, force);
        }
    }
    /**
     * Writes a chunk to the response stream without ending it; does nothing if disposed.
     *
     * @param chunk Data to write.
     */
    write(chunk) {
        if (!this._isDisposed) {
            return this._res.write(chunk), void 0;
        }
    }
    /**
     * Transfers the request to another path or error status handled by the server; does nothing if
     * disposed.
     *
     * @param path Target path, or numeric status code.
     */
    transferRequest(path) {
        if (!this._isDisposed) {
            return this._server.transferRequest(this, path);
        }
    }
    /**
     * Expires the session cookie and clears the session on the server; does nothing if disposed.
     *
     * @returns This context, for chaining.
     */
    signOut() {
        if (!this._isDisposed) {
            this._res.cookie(this._server.config.session.cookie, "", {
                expires: -1
            });
            this._server.onClearSession(this);
        }
        return this;
    }
    /**
     * Creates a session for the user on the server; does nothing if disposed.
     *
     * @param loginId User login identifier.
     * @param roleId User role identifier.
     * @param userData Additional data to store in the session.
     * @returns This context, for chaining.
     */
    setSession(loginId, roleId, userData) {
        if (!this._isDisposed) {
            this._server.setSession(this, loginId, roleId, userData);
        }
        return this;
    }
    /**
     * Disposes the context: marks it disposed, disposes the response and request and clears all
     * references. Safe to call repeatedly.
     *
     * @returns The request id if disposed now, or undefined if it was already disposed.
     */
    dispose() {
        if (this._isDisposed)
            return;
        this._isDisposed = true;
        this._next = null;
        const id = this._req.id;
        this._res.dispose();
        this._req.dispose();
        this._server = null;
        this.path = null;
        this._res = null;
        this._req = null;
        this.extension = null;
        this.root = null;
        this.servedFrom = null;
        this.error = null;
        return id;
    }
}
exports.Context = Context;
class ContextManager {
    /**
     * Creates the manager with an empty context map.
     */
    constructor() {
        this._contexts = new Map();
    }
    /**
     * Disposes the context and removes it from the registry by its request id.
     *
     * @param ctx The context to dispose.
     */
    disposeContext(ctx) {
        const reqId = ctx.dispose();
        if (reqId) {
            this._contexts.delete(reqId);
        }
    }
    /**
     * Looks up a registered context by request id.
     *
     * @param id Request id.
     * @returns The matching context, or undefined if none.
     */
    getMyContext(id) {
        return this._contexts.get(id);
    }
    /**
     * Disposes and unregisters the context for the given request id, if present.
     *
     * @param id Request id.
     */
    removeContext(id) {
        const ctx = this._contexts.get(id);
        if (ctx) {
            this.disposeContext(ctx);
        }
    }
    /**
     * Gets the context for the request id, creating and registering a new one if none exists.
     *
     * @param server Owning server.
     * @param req Incoming request.
     * @param res Outgoing response.
     * @returns The existing or newly created context.
     */
    getContext(server, req, res) {
        let ctx = this._contexts.get(req.id);
        if (!ctx) {
            ctx = new Context(server, req, res);
            this._contexts.set(req.id, ctx);
        }
        return ctx;
    }
    /**
     * Instantiates a new request context, registers it in the context map by request ID,
     * and returns the newly created instance.
     *
     * @param server Owning server instance handling the request.
     * @param req Incoming HTTP request.
     * @param res Outgoing HTTP response.
     * @returns The newly created request context.
     */
    create(server, req, res) {
        const ctx = new Context(server, req, res);
        this._contexts.set(req.id, ctx);
        return ctx;
    }
}
class ContextManagerStatic {
    /**
     * Returns the singleton ContextManager, creating it on first call.
     *
     * @returns The shared ContextManager.
     */
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