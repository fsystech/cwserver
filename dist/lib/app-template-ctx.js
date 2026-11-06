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
exports.TemplateCtx = void 0;
class TemplateCtxHandler {
    /**
     * Creates an empty registry for compiled template sandbox functions.
     */
    constructor() {
        this._templateCtx = new Map();
    }
    /**
     * Looks up a compiled template sandbox function by key.
     *
     * @param key Registry key the sandbox was stored under.
     * @returns The stored sandbox function, or undefined when the key is unknown.
     */
    getCtx(key) {
        return this._templateCtx.get(key);
    }
    /**
     * Stores a compiled template sandbox function under the given key, replacing any existing entry.
     *
     * @param key Registry key to store the sandbox under.
     * @param sendBox Compiled sandbox function to store.
     */
    setCtx(key, sendBox) {
        this._templateCtx.set(key, sendBox);
    }
    /**
     * Removes the sandbox function registered under the given key.
     *
     * @param key Registry key of the entry to remove.
     * @returns True if an entry existed and was removed, otherwise false.
     */
    deleteCtx(key) {
        return this._templateCtx.delete(key);
    }
}
class ITemplateCtxStatic {
    /**
     * Returns the shared template context registry, creating it on first use (lazy singleton).
     *
     * @returns The singleton template context handler.
     */
    static getInstance() {
        if (this._instance === null) {
            this._instance = new TemplateCtxHandler();
        }
        return this._instance;
    }
}
ITemplateCtxStatic._instance = null;
exports.TemplateCtx = ITemplateCtxStatic.getInstance();
//# sourceMappingURL=app-template-ctx.js.map