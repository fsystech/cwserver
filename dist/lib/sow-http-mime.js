"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpMimeHandler = void 0;
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 9:22 PM 5/4/2020
const _fs = __importStar(require("fs"));
const _path = __importStar(require("path"));
const _zlib = __importStar(require("zlib"));
const stream_1 = require("stream");
const destroy = require("destroy");
const fsw = __importStar(require("./sow-fsw"));
const _mimeType = __importStar(require("./sow-http-mime-types"));
const sow_http_cache_1 = require("./sow-http-cache");
const sow_web_streamer_1 = require("./sow-web-streamer");
const sow_encryption_1 = require("./sow-encryption");
const sow_util_1 = require("./sow-util");
// "exe", "zip", "doc", "docx", "pdf", "ppt", "pptx", "gz"
const TaskDeff = [
    { cache: false, ext: "exe", gzip: false },
    { cache: false, ext: "zip", gzip: false },
    { cache: false, ext: "doc", gzip: true },
    { cache: false, ext: "docx", gzip: true },
    { cache: false, ext: "pdf", gzip: true },
    { cache: false, ext: "ppt", gzip: true },
    { cache: false, ext: "pptx", gzip: true },
    { cache: false, ext: "gz", gzip: false },
    { cache: false, ext: "mp3", gzip: false }
];
class MimeHandler {
    static getCachePath(ctx) {
        const dir = ctx.server.mapPath(`/web/temp/cache/`);
        const path = `${dir}\\${sow_encryption_1.Encryption.toMd5(ctx.path)}`;
        return _path.resolve(`${path}.${ctx.extension}.cache`);
    }
    static servedFromServerFileCache(ctx, absPath, mimeType, fstat) {
        const reqCacheHeader = sow_http_cache_1.SowHttpCache.getChangedHeader(ctx.req.headers);
        const cachePath = this.getCachePath(ctx);
        return fsw.stat(cachePath, (serr, stat) => {
            const existsCachFile = stat ? true : false;
            return ctx.handleError(serr, () => {
                let lastChangeTime = 0, cfileSize = 0;
                if (existsCachFile && stat) {
                    cfileSize = stat.size;
                    lastChangeTime = stat.mtime.getTime();
                }
                let hasChanged = true;
                if (existsCachFile) {
                    hasChanged = fstat.mtime.getTime() > lastChangeTime;
                }
                const etag = cfileSize !== 0 ? sow_http_cache_1.SowHttpCache.getEtag(lastChangeTime, cfileSize) : void 0;
                if (!hasChanged && existsCachFile && (reqCacheHeader.etag || reqCacheHeader.sinceModify)) {
                    let exit = false;
                    if (etag && reqCacheHeader.etag) {
                        if (reqCacheHeader.etag === etag) {
                            sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                            ctx.res.status(304, { 'Content-Type': mimeType }).send();
                            return ctx.next(304);
                        }
                        exit = true;
                    }
                    if (reqCacheHeader.sinceModify && !exit) {
                        sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                        ctx.res.status(304, { 'Content-Type': mimeType }).send();
                        return ctx.next(304);
                    }
                }
                if (!hasChanged && existsCachFile) {
                    sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {
                        lastChangeTime,
                        etag: sow_http_cache_1.SowHttpCache.getEtag(lastChangeTime, cfileSize)
                    }, ctx.server.config.cacheHeader);
                    ctx.res.status(200, {
                        'Content-Type': mimeType, 'Content-Encoding': 'gzip',
                        'x-served-from': 'cach-file'
                    });
                    return sow_util_1.Util.pipeOutputStream(cachePath, ctx);
                }
                const rstream = _fs.createReadStream(absPath);
                const wstream = _fs.createWriteStream(cachePath);
                return stream_1.pipeline(rstream, _zlib.createGzip(), wstream, (gzipErr) => {
                    destroy(rstream);
                    destroy(wstream);
                    return ctx.handleError(gzipErr, () => {
                        return _fs.stat(cachePath, (cserr, cstat) => {
                            return ctx.handleError(cserr, () => {
                                lastChangeTime = cstat.mtime.getTime();
                                sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {
                                    lastChangeTime,
                                    etag: sow_http_cache_1.SowHttpCache.getEtag(lastChangeTime, cstat.size)
                                }, ctx.server.config.cacheHeader);
                                ctx.res.status(200, { 'Content-Type': mimeType, 'Content-Encoding': 'gzip' });
                                return sow_util_1.Util.pipeOutputStream(cachePath, ctx);
                            });
                        });
                    });
                });
            });
        }, ctx.handleError.bind(ctx));
    }
    static servedNoChache(ctx, absPath, mimeType, isGzip, size) {
        sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {
            lastChangeTime: void 0,
            etag: void 0
        }, { maxAge: 0, serverRevalidate: true });
        if (ctx.server.config.staticFile.compression && isGzip) {
            ctx.res.status(200, {
                'Content-Type': mimeType,
                'Content-Encoding': 'gzip'
            });
            const rstream = _fs.createReadStream(absPath);
            return stream_1.pipeline(rstream, _zlib.createGzip(), ctx.res, (gzipErr) => {
                destroy(rstream);
            }), void 0;
        }
        ctx.res.status(200, {
            'Content-Type': mimeType, 'Content-Length': size
        });
        return sow_util_1.Util.pipeOutputStream(absPath, ctx);
    }
    static servedFromFile(ctx, absPath, mimeType, isGzip, fstat) {
        const reqCachHeader = sow_http_cache_1.SowHttpCache.getChangedHeader(ctx.req.headers);
        const lastChangeTime = fstat.mtime.getTime();
        const curEtag = sow_http_cache_1.SowHttpCache.getEtag(lastChangeTime, fstat.size);
        if ((reqCachHeader.etag && reqCachHeader.etag === curEtag) ||
            (reqCachHeader.sinceModify && reqCachHeader.sinceModify === lastChangeTime)) {
            ctx.req.get("");
            sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
            ctx.res.status(304, { 'Content-Type': mimeType }).send();
            return ctx.next(304);
        }
        sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {
            lastChangeTime,
            etag: curEtag
        }, ctx.server.config.cacheHeader);
        if (ctx.server.config.staticFile.compression && isGzip) {
            ctx.res.status(200, { 'Content-Type': mimeType, 'Content-Encoding': 'gzip' });
            const rstream = _fs.createReadStream(absPath);
            return stream_1.pipeline(rstream, _zlib.createGzip(), ctx.res, (gzipErr) => {
                destroy(rstream);
            }), void 0;
        }
        ctx.res.status(200, { 'Content-Type': mimeType });
        return sow_util_1.Util.pipeOutputStream(absPath, ctx);
    }
    static _render(ctx, mimeType, absPath) {
        ctx.req.socket.setNoDelay(true);
        if (ctx.path.indexOf('favicon.ico') > -1) {
            sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {
                lastChangeTime: void 0, etag: void 0
            }, {
                maxAge: ctx.server.config.cacheHeader.maxAge,
                serverRevalidate: false
            });
            ctx.res.status(200, { 'Content-Type': mimeType });
            return sow_util_1.Util.pipeOutputStream(absPath, ctx);
        }
        return _fs.stat(absPath, (serr, stat) => {
            return ctx.handleError(serr, () => {
                if (ctx.server.config.liveStream.indexOf(ctx.extension) > -1) {
                    return sow_web_streamer_1.Streamer.stream(ctx, absPath, mimeType, stat);
                }
                let noCache = false;
                const taskDeff = TaskDeff.find(a => a.ext === ctx.extension);
                let isGzip = (!ctx.server.config.staticFile.compression ? false : sow_http_cache_1.SowHttpCache.isAcceptedEncoding(ctx.req.headers, "gzip"));
                if (isGzip) {
                    if (ctx.server.config.staticFile.minCompressionSize > 0 && stat.size < ctx.server.config.staticFile.minCompressionSize) {
                        isGzip = false;
                    }
                }
                if (taskDeff) {
                    noCache = taskDeff.cache === false;
                    if (isGzip) {
                        isGzip = taskDeff.gzip;
                    }
                }
                if (noCache === true) {
                    return this.servedNoChache(ctx, absPath, mimeType, isGzip, stat.size);
                }
                if (ctx.server.config.noCache.indexOf(ctx.extension) > -1) {
                    return this.servedNoChache(ctx, absPath, mimeType, isGzip, stat.size);
                }
                if (!isGzip || (ctx.server.config.staticFile.fileCache === false)) {
                    return this.servedFromFile(ctx, absPath, mimeType, isGzip, stat);
                }
                return this.servedFromServerFileCache(ctx, absPath, mimeType, stat);
            });
        });
    }
    static render(ctx, mimeType, maybeDir, checkFile) {
        const absPath = typeof (maybeDir) === "string" && maybeDir ? _path.resolve(`${maybeDir}/${ctx.path}`) : ctx.server.mapPath(ctx.path);
        if (typeof (checkFile) === "boolean" && checkFile === true) {
            return _fs.exists(absPath, (exists) => {
                if (!exists)
                    return ctx.next(404, true);
                return this._render(ctx, mimeType, absPath);
            });
        }
        return this._render(ctx, mimeType, absPath);
    }
}
class HttpMimeHandler {
    getMimeType(extension) {
        return _mimeType.getMimeType(extension);
    }
    isValidExtension(extension) {
        return _mimeType.isValidExtension(extension);
    }
    render(ctx, maybeDir, checkFile) {
        if (!_mimeType.isValidExtension(ctx.extension)) {
            return ctx.transferRequest(404);
        }
        return MimeHandler.render(ctx, _mimeType.getMimeType(ctx.extension), maybeDir, checkFile);
    }
}
exports.HttpMimeHandler = HttpMimeHandler;
// 11:38 PM 5/4/2020
//# sourceMappingURL=sow-http-mime.js.map