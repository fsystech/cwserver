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
exports.AppView = void 0;
exports.registerView = registerView;
class AppViewRegister {
    constructor() {
        this._isInit = false;
        this._evt = [];
        this._isInitilized = false;
    }
    get isInitilized() {
        return this._isInitilized;
    }
    set isInitilized(value) {
        this._isInitilized = value;
    }
    init(app, controller, server) {
        if (this._isInit || this._evt.length === 0)
            return;
        this._isInit = true;
        this._evt.forEach(handler => {
            return handler(app, controller, server);
        });
        this._evt.length = 0;
    }
    add(next) {
        if (this._isInit) {
            throw new Error('After initialization "views", you could not register new view.');
        }
        this._evt.push(next);
    }
}
class AppViewStatic {
    static getInstance() {
        if (this._instance === null) {
            this._instance = new AppViewRegister();
        }
        return this._instance;
    }
}
AppViewStatic._instance = null;
exports.AppView = AppViewStatic.getInstance();
function registerView(next) {
    exports.AppView.add(next);
}
//# sourceMappingURL=app-view.js.map