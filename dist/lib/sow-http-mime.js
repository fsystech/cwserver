"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _fs = __importStar(require("fs"));
const _path = __importStar(require("path"));
const _zlib = require("zlib");
const sow_http_cache_1 = require("./sow-http-cache");
const sow_web_streamer_1 = require("./sow-web-streamer");
const sow_encryption_1 = require("./sow-encryption");
const isAcceptedEncoding = (req, name) => {
    const acceptEncoding = req.headers['accept-encoding'];
    if (!acceptEncoding)
        return false;
    return acceptEncoding.indexOf(name) > -1;
};
let HttpMimeType = {};
const TaskDeff = [
    { cache: false, ext: "exe", gzip: false },
    { cache: false, ext: "zip", gzip: false },
    { cache: false, ext: "doc", gzip: true },
    { cache: false, ext: "docx", gzip: true },
    { cache: false, ext: "pdf", gzip: true },
    { cache: false, ext: "ppt", gzip: true },
    { cache: false, ext: "pptx", gzip: true },
    { cache: false, ext: "gz", gzip: false }
];
class MimeHandler {
    static getCachePath(ctx) {
        const dir = ctx.server.mapPath(`/web/temp/cache/`);
        if (!_fs.existsSync(dir)) {
            _fs.mkdirSync(dir, 1);
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
            return ctx.res.end(_fs.readFileSync(cachePath)), ctx.next(200);
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
        let openenedFile = _fs.createReadStream(absPath);
        openenedFile.pipe(ctx.res);
        return ctx.res.on('close', () => {
            if (openenedFile) {
                openenedFile.unpipe(ctx.res);
                openenedFile.close();
                openenedFile = Object.create(null);
            }
            ctx.next(200);
        }), void 0;
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
        return ctx.res.end(_fs.readFileSync(absPath)), ctx.next(200);
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
            ctx.res.end(_fs.readFileSync(absPath));
            return ctx.next(200);
        }
        const stat = _fs.statSync(absPath);
        if (ctx.server.config.liveStream.indexOf(ctx.extension) > -1) {
            return sow_web_streamer_1.Streamer.stream(ctx, absPath, mimeType, stat);
        }
        let noCache = false;
        const taskDeff = TaskDeff.find(a => a.ext === ctx.extension);
        let isGzip = (!ctx.server.config.staticFile.compression ? false : isAcceptedEncoding(ctx.req, "gzip"));
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
    constructor(appRoot) {
        const absPath = _path.resolve(`${appRoot}/mime-type.json`);
        if (!_fs.existsSync(absPath))
            throw new Error(`Unable to load mime-type from ${absPath}`);
        const types = _fs.readFileSync(absPath, "utf8").replace(/^\uFEFF/, '');
        if (!types)
            throw new Error("Invalid mime-type.json file...");
        try {
            HttpMimeType = JSON.parse(types);
        }
        catch (e) {
            throw new Error("Invalid mime-type.json file...");
        }
    }
    getMimeType(extension) {
        const mimeType = HttpMimeType[extension];
        if (!mimeType)
            throw new Error("Method not implemented.");
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
//# sourceMappingURL=sow-http-mime.js.map