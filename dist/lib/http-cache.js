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
exports.HttpCache = void 0;
const app_static_1 = require("./app-static");
class HttpCache {
    /** Gets value in millisecond of {If-Modified-Since} from header. */
    static getIfModifiedSinceUTCTime(headers) {
        const ifModifiedSinceHeaderText = headers["If-Modified-Since"] || headers["if-modified-since"];
        if (ifModifiedSinceHeaderText) {
            const date = new Date(ifModifiedSinceHeaderText.toString());
            if (date.toString().indexOf("Invalid") > -1)
                return void 0;
            return date.getTime();
        }
        return void 0;
    }
    /** Gets the {sinceModify, etag} from given header {If-None-Match, If-Modified-Since}. */
    static getChangedHeader(headers) {
        const tag = headers["If-None-Match"] || headers["if-none-match"] || headers.ETag || headers.etag;
        return {
            sinceModify: this.getIfModifiedSinceUTCTime(headers),
            etag: tag ? tag.toString() : void 0
        };
    }
    /**
     * Write cache header
     * e.g. {last-modified, expires, ETag, cache-control, x-server-revalidate}.
     */
    static writeCacheHeader(res, obj, cacheHeader) {
        if (obj.lastChangeTime) {
            res.setHeader('last-modified', (0, app_static_1.ToResponseTime)(obj.lastChangeTime));
            res.setHeader('expires', (0, app_static_1.ToResponseTime)(cacheHeader.maxAge + Date.now()));
        }
        if (obj.etag) {
            res.setHeader('ETag', obj.etag);
        }
        if (cacheHeader.serverRevalidate) {
            res.setHeader('cache-control', 'no-cache, must-revalidate, immutable');
            res.setHeader('x-server-revalidate', 'true');
        }
        else {
            res.setHeader('cache-control', `max-age=${cacheHeader.maxAge + Date.now()}, public, immutable`);
        }
    }
    /** Create and Gets {etag} (timestamp ^ fsize). */
    static getEtag(timestamp, fsize) {
        return `W/${(timestamp ^ fsize)}`;
    }
    static isAcceptedEncoding(headers, name) {
        const acceptEncoding = headers['accept-encoding'];
        if (!acceptEncoding)
            return false;
        return acceptEncoding.indexOf(name) > -1;
    }
}
exports.HttpCache = HttpCache;
//# sourceMappingURL=http-cache.js.map