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

// 4:29 PM 2/7/2026
// by rajib chy

import { IncomingMessage, ServerResponse } from "http";
import { injectPrototype } from "./help";
import { Request } from "./request";
import { Response } from "./response";

/**
 * Ensures Node.js HTTP core objects (`IncomingMessage` and `ServerResponse`)
 * are patched only once with custom framework extensions (`Request` and `Response`).
 *
 * This class provides a static injection mechanism to avoid running prototype
 * modifications repeatedly per request (which may degrade performance under load).
 *
 * Internally it copies all prototype members (methods/getters/setters) from:
 * - `Request.prototype`  → `IncomingMessage.prototype`
 * - `Response.prototype` → `ServerResponse.prototype`
 *
 * ⚠️ Warning:
 * Prototype patching affects the entire Node.js process globally.
 * Use carefully and avoid overwriting critical Node internal methods.
 */
class InjectStatic {

    /** Indicates whether injection has already been applied. */
    private static _isInjected: boolean = false;

    /**
     * Injects framework request/response features into Node.js built-in HTTP objects.
     *
     * This method is safe to call multiple times; injection will only happen once.
     *
     * @throws Any error thrown during prototype injection will be re-thrown.
     */
    public static inject(): void {
        if (this._isInjected) return;

        try {
            injectPrototype(Request, IncomingMessage, true);
            injectPrototype(Response, ServerResponse, true);

            this._isInjected = true;

        } catch (ex) {
            throw ex;
        }
    }
}

/**
 * Injects custom `Request` and `Response` functionality into Node.js HTTP core
 * objects (`IncomingMessage` and `ServerResponse`) globally.
 *
 * This should be called once during server startup (before creating the HTTP server).
 *
 * @example
 * injectIncomingOutgoing();
 * const server = createServer(...);
 */
export function injectIncomingOutgoing(): void {
    return InjectStatic.inject();
}