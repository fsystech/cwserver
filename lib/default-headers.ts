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

// 7:25 PM 7/1/2026
// by rajib chy

type HeaderType = Record<string, number | string | readonly string[]>;

class DefaultHttpHeaders {
    private _headers: HeaderType = {
        "x-xss-protection": "1; mode=block",
        "x-content-type-options": "nosniff",
        "x-frame-options": "SAMEORIGIN",

        // Prevent leaking referrer information
        "referrer-policy": "strict-origin-when-cross-origin",

        // Disable unnecessary browser features
        "permissions-policy":
            "camera=(), microphone=(), geolocation=(), payment=()",

        // Modern cross-origin protection
        "cross-origin-opener-policy": "same-origin",
        "cross-origin-resource-policy": "same-origin",
    };

    public addHeader(key: string, value: string | number): void {
        this._headers[key] = value;
    }

    public deleteHeader(key: string): void {
        if (!this._headers[key])
            return;

        delete this._headers[key];
    }

    public getHeaders(): Readonly<HeaderType> {
        return this._headers;
    }
}

class DefaultHttpHeadersStatic {
    private static _instance: DefaultHttpHeaders = null;
    public static getInstance(): DefaultHttpHeaders {
        if (this._instance === null) {
            this._instance = new DefaultHttpHeaders();
        }
        return this._instance;
    }
}

export default DefaultHttpHeadersStatic.getInstance();