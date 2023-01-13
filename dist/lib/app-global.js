"use strict";
// Copyright (c) 2022 Safe Online World Ltd.
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
const http_mime_types_1 = require("./http-mime-types");
class SowGlobalServer {
    constructor() {
        this._evt = [];
        this._isInitilized = false;
    }
    emit(ev, app, controller, server) {
        this._isInitilized = true;
        this._evt.forEach(handler => {
            return handler(app, controller, server);
        });
        this._evt.length = 0;
    }
    on(ev, next) {
        if (this._isInitilized) {
            throw new Error('After initialization "views", you could not register new view.');
        }
        this._evt.push(next);
    }
}
class SowGlobal {
    get templateCtx() {
        return this._templateCtx;
    }
    get server() {
        return this._server;
    }
    get HttpMime() {
        return this._HttpMime;
    }
    constructor() {
        this._server = new SowGlobalServer();
        this.isInitilized = false;
        this._HttpMime = (0, http_mime_types_1.loadMimeType)();
        this._templateCtx = {};
    }
}
if (!global.sow) {
    global.sow = new SowGlobal();
}
if (!global._importLocalAssets) {
    global._importLocalAssets = (path) => require(path);
}
//# sourceMappingURL=app-global.js.map