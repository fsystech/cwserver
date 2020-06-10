"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SowHttpCache = void 0;
const sow_static_1 = require("./sow-static");
var SowHttpCache;
(function (SowHttpCache) {
    /** Gets value in millisecond of {If-Modified-Since} from header. */
    function getIfModifiedSinceUTCTime(headers) {
        const ifModifiedSinceHeaderText = headers["If-Modified-Since"] || headers["if-modified-since"];
        if (ifModifiedSinceHeaderText) {
            const date = new Date(ifModifiedSinceHeaderText.toString());
            if (date.toString().indexOf("Invalid") > -1)
                return void 0;
            return date.getTime();
        }
        return void 0;
    }
    SowHttpCache.getIfModifiedSinceUTCTime = getIfModifiedSinceUTCTime;
    /** Gets the {sinceModify, etag} from given header {If-None-Match, If-Modified-Since}. */
    function getChangedHeader(headers) {
        const tag = headers["If-None-Match"] || headers["if-none-match"] || headers.ETag || headers.etag;
        return {
            sinceModify: getIfModifiedSinceUTCTime(headers),
            etag: tag ? tag.toString() : void 0
        };
    }
    SowHttpCache.getChangedHeader = getChangedHeader;
    /**
     * Write cache header
     * e.g. {last-modified, expires, ETag, cache-control, x-server-revalidate}.
     */
    function writeCacheHeader(res, obj, cacheHeader) {
        if (obj.lastChangeTime) {
            res.setHeader('last-modified', sow_static_1.ToResponseTime(obj.lastChangeTime));
            res.setHeader('expires', sow_static_1.ToResponseTime(cacheHeader.maxAge + Date.now()));
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
    SowHttpCache.writeCacheHeader = writeCacheHeader;
    /** Create and Gets {etag} (timestamp ^ fsize). */
    function getEtag(timestamp, fsize) {
        return `W/${(timestamp ^ fsize)}`;
    }
    SowHttpCache.getEtag = getEtag;
})(SowHttpCache = exports.SowHttpCache || (exports.SowHttpCache = {}));
//# sourceMappingURL=sow-http-cache.js.map