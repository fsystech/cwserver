"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sow_static_1 = require("./sow-static");
var SowHttpCache;
(function (SowHttpCache) {
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
    function getChangedHeader(headers) {
        const tag = headers["If-None-Match"] || headers["if-none-match"] || headers.ETag || headers.etag;
        return {
            sinceModify: getIfModifiedSinceUTCTime(headers),
            etag: tag ? tag.toString() : void 0
        };
    }
    SowHttpCache.getChangedHeader = getChangedHeader;
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
            res.setHeader('x-server-revalidate', "true");
        }
        else {
            res.setHeader('cache-control', `max-age=${cacheHeader.maxAge + Date.now()}, public, immutable`);
        }
    }
    SowHttpCache.writeCacheHeader = writeCacheHeader;
    function getEtag(timestamp, fsize) {
        if (typeof (timestamp) !== "number")
            throw new Error("Invalid argument defined. timestamp should be Number...");
        return `W/${(timestamp ^ fsize)}`;
    }
    SowHttpCache.getEtag = getEtag;
})(SowHttpCache = exports.SowHttpCache || (exports.SowHttpCache = {}));
//# sourceMappingURL=sow-http-cache.js.map