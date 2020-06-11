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
const sow_http_cache_1 = require("./sow-http-cache");
const sow_web_streamer_1 = require("./sow-web-streamer");
const sow_encryption_1 = require("./sow-encryption");
const sow_util_1 = require("./sow-util");
let HttpMimeType = {};
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
        if (!_fs.existsSync(dir)) {
            sow_util_1.Util.mkdirSync(ctx.server.getPublic(), "/web/temp/cache/");
        }
        const path = `${dir}\\${sow_encryption_1.Encryption.toMd5(ctx.path)}`;
        return _path.resolve(`${path}.${ctx.extension}.cache`);
    }
    static servedFromServerFileCache(ctx, absPath, mimeType, fstat) {
        const reqCacheHeader = sow_http_cache_1.SowHttpCache.getChangedHeader(ctx.req.headers);
        const cachePath = this.getCachePath(ctx);
        const existsCachFile = _fs.existsSync(cachePath);
        let lastChangeTime = 0, cfileSize = 0;
        if (existsCachFile) {
            const stat = _fs.statSync(cachePath);
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
                    ctx.res.writeHead(304, { 'Content-Type': mimeType });
                    return ctx.res.end(), ctx.next(304);
                }
                exit = true;
            }
            if (reqCacheHeader.sinceModify && !exit) {
                sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                ctx.res.writeHead(304, { 'Content-Type': mimeType });
                return ctx.res.end(), ctx.next(304);
            }
        }
        if (!hasChanged && existsCachFile) {
            sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {
                lastChangeTime,
                etag: sow_http_cache_1.SowHttpCache.getEtag(lastChangeTime, cfileSize)
            }, ctx.server.config.cacheHeader);
            ctx.res.setHeader('x-served-from', 'cach-file');
            ctx.res.writeHead(200, { 'Content-Type': mimeType, 'Content-Encoding': 'gzip' });
            return sow_util_1.Util.pipeOutputStream(cachePath, ctx);
        }
        return _zlib.gzip(_fs.readFileSync(absPath), (error, buff) => {
            if (error) {
                ctx.server.addError(ctx, error);
                return ctx.next(500);
            }
            _fs.writeFileSync(cachePath, buff);
            const stat = _fs.statSync(cachePath);
            lastChangeTime = stat.mtime.getTime();
            sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {
                lastChangeTime,
                etag: sow_http_cache_1.SowHttpCache.getEtag(lastChangeTime, stat.size)
            }, ctx.server.config.cacheHeader);
            ctx.res.writeHead(200, { 'Content-Type': mimeType, 'Content-Encoding': 'gzip' });
            ctx.res.end(buff);
            ctx.next(200);
        }), void 0;
    }
    static servedNoChache(ctx, absPath, mimeType, isGzip, size) {
        sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {
            lastChangeTime: void 0,
            etag: void 0
        }, { maxAge: 0, serverRevalidate: true });
        if (ctx.server.config.staticFile.compression && isGzip) {
            return _zlib.gzip(_fs.readFileSync(absPath), (error, buff) => {
                if (error) {
                    ctx.server.addError(ctx, error);
                    return ctx.next(500);
                }
                ctx.res.writeHead(200, {
                    'Content-Type': mimeType,
                    'Content-Encoding': 'gzip',
                    'Content-Length': buff.length
                });
                ctx.res.end(buff);
                ctx.next(200);
            }), void 0;
        }
        ctx.res.writeHead(200, {
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
            sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
            ctx.res.writeHead(304, { 'Content-Type': mimeType });
            return ctx.res.end(), ctx.next(304);
        }
        sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {
            lastChangeTime,
            etag: curEtag
        }, ctx.server.config.cacheHeader);
        if (ctx.server.config.staticFile.compression && isGzip) {
            return _zlib.gzip(_fs.readFileSync(absPath), (error, buff) => {
                if (error) {
                    ctx.server.addError(ctx, error);
                    return ctx.next(500);
                }
                ctx.res.writeHead(200, { 'Content-Type': mimeType, 'Content-Encoding': 'gzip' });
                ctx.res.end(buff);
                ctx.next(200);
            }), void 0;
        }
        ctx.res.writeHead(200, { 'Content-Type': mimeType });
        return sow_util_1.Util.pipeOutputStream(absPath, ctx);
    }
    static render(ctx, mimeType, maybeDir, checkFile) {
        const absPath = typeof (maybeDir) === "string" && maybeDir ? _path.resolve(`${maybeDir}/${ctx.path}`) : ctx.server.mapPath(ctx.path);
        if (typeof (checkFile) === "boolean" && checkFile === true) {
            if (!_fs.existsSync(absPath))
                return ctx.next(404, true);
        }
        ctx.req.socket.setNoDelay(true);
        if (ctx.path.indexOf('favicon.ico') > -1) {
            sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {
                lastChangeTime: void 0, etag: void 0
            }, {
                maxAge: ctx.server.config.cacheHeader.maxAge,
                serverRevalidate: false
            });
            ctx.res.writeHead(200, { 'Content-Type': mimeType });
            return sow_util_1.Util.pipeOutputStream(absPath, ctx);
        }
        const stat = _fs.statSync(absPath);
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
    }
}
class HttpMimeHandler {
    constructor() {
        let part = "";
        const parent = _path.resolve(__dirname, '..');
        if (process.env.SCRIPT === "TS") {
            part = "/dist";
        }
        const absPath = _path.resolve(`${parent}${part}/mime-type.json`);
        if (!_fs.existsSync(absPath))
            throw new Error(`Unable to load mime-type from ${absPath}`);
        const types = sow_util_1.Util.readJsonAsync(absPath);
        if (!types)
            throw new Error("Invalid mime-type.json file...");
        HttpMimeType = types;
    }
    getMimeType(extension) {
        const mimeType = HttpMimeType[extension];
        if (!mimeType)
            throw new Error(`Unsupported extension =>${extension}`);
        return mimeType;
    }
    isValidExtension(extension) {
        return HttpMimeType[extension] ? true : false;
    }
    render(ctx, maybeDir, checkFile) {
        const mimeType = HttpMimeType[ctx.extension];
        if (!mimeType) {
            return ctx.transferRequest(ctx.server.config.errorPage["404"]);
        }
        return MimeHandler.render(ctx, mimeType, maybeDir, checkFile);
    }
}
exports.HttpMimeHandler = HttpMimeHandler;
// 11:38 PM 5/4/2020
//# sourceMappingURL=sow-http-mime.js.map