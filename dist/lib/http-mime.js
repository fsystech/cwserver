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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpMimeHandler = void 0;
// 9:22 PM 5/4/2020
// by rajib chy
const _fs = __importStar(require("node:fs"));
const _path = __importStar(require("node:path"));
const _zlib = __importStar(require("node:zlib"));
const node_stream_1 = require("node:stream");
const node_util_1 = require("node:util");
const destroy_1 = __importDefault(require("destroy"));
const _mimeType = __importStar(require("./http-mime-types"));
const http_cache_1 = require("./http-cache");
const web_streamer_1 = require("./web-streamer");
const encryption_1 = require("./encryption");
const app_util_1 = require("./app-util");
const file_info_1 = require("./file-info");
const _fsp = _fs.promises;
const pipelineAsync = (0, node_util_1.promisify)(node_stream_1.pipeline);
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
    { cache: false, ext: "mp3", gzip: false },
    { cache: false, ext: "html", gzip: false },
    { cache: false, ext: "htm", gzip: false },
    { cache: false, ext: "wjsx", gzip: false }
];
function createGzip() {
    return _zlib.createGzip({ level: _zlib.constants.Z_BEST_COMPRESSION });
}
class MimeHandler {
    static getCachePath(ctx) {
        const path = _path.join(ctx.server.config.staticFile.tempPath, encryption_1.Encryption.toMd5(ctx.path));
        return _path.resolve(`${path}.${ctx.extension}.cache`);
    }
    static _sendFromMemCache(ctx, mimeType, dataInfo) {
        const reqCacheHeader = http_cache_1.HttpCache.getChangedHeader(ctx.req.headers);
        const etag = http_cache_1.HttpCache.getEtag(dataInfo.lastChangeTime, dataInfo.cfileSize);
        ctx.res.setHeader('x-served-from', 'mem-cache');
        if (reqCacheHeader.etag || reqCacheHeader.sinceModify) {
            let exit = false;
            if (reqCacheHeader.etag) {
                if (reqCacheHeader.etag === etag) {
                    http_cache_1.HttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                    ctx.res.status(304, { 'Content-Type': mimeType }).send();
                    return;
                }
                exit = true;
            }
            if (reqCacheHeader.sinceModify && !exit) {
                http_cache_1.HttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                ctx.res.status(304, { 'Content-Type': mimeType }).send();
                return;
            }
        }
        http_cache_1.HttpCache.writeCacheHeader(ctx.res, {
            lastChangeTime: dataInfo.lastChangeTime,
            etag: http_cache_1.HttpCache.getEtag(dataInfo.lastChangeTime, dataInfo.cfileSize)
        }, ctx.server.config.cacheHeader);
        ctx.res.status(200, {
            'Content-Type': mimeType,
            'Content-Encoding': 'gzip'
        });
        return ctx.res.end(dataInfo.gizipData), ctx.next(200);
    }
    static _holdCacheAsync(cachePath, lastChangeTime, size) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._mamCache.has(cachePath))
                return;
            const data = yield _fsp.readFile(cachePath);
            this._mamCache.set(cachePath, {
                lastChangeTime,
                cfileSize: size,
                gizipData: data
            });
        });
    }
    static servedFromServerFileCacheAsync(ctx, absPath, mimeType, fstat, cachePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const useFullOptimization = ctx.server.config.useFullOptimization;
            const reqCacheHeader = http_cache_1.HttpCache.getChangedHeader(ctx.req.headers);
            const desc = yield this._fileInfo.statAsync(cachePath);
            const existsCachFile = desc.exists;
            let lastChangeTime = 0, cfileSize = 0;
            if (existsCachFile && desc.stats) {
                cfileSize = desc.stats.size;
                lastChangeTime = desc.stats.mtime.getTime();
            }
            let hasChanged = true;
            if (existsCachFile) {
                hasChanged = fstat.mtime.getTime() > lastChangeTime;
            }
            const etag = cfileSize !== 0 ? http_cache_1.HttpCache.getEtag(lastChangeTime, cfileSize) : undefined;
            if (!hasChanged && existsCachFile && (reqCacheHeader.etag || reqCacheHeader.sinceModify)) {
                let exit = false;
                if (etag && reqCacheHeader.etag) {
                    if (reqCacheHeader.etag === etag) {
                        http_cache_1.HttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                        ctx.res.status(304, { 'Content-Type': mimeType }).send();
                        if (useFullOptimization && cachePath) {
                            yield this._holdCacheAsync(cachePath, lastChangeTime, cfileSize);
                        }
                        return;
                    }
                    exit = true;
                }
                if (reqCacheHeader.sinceModify && !exit) {
                    http_cache_1.HttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                    ctx.res.status(304, { 'Content-Type': mimeType }).send();
                    if (useFullOptimization && cachePath) {
                        yield this._holdCacheAsync(cachePath, lastChangeTime, cfileSize);
                    }
                    return;
                }
            }
            if (!hasChanged && existsCachFile) {
                http_cache_1.HttpCache.writeCacheHeader(ctx.res, {
                    lastChangeTime,
                    etag: http_cache_1.HttpCache.getEtag(lastChangeTime, cfileSize)
                }, ctx.server.config.cacheHeader);
                ctx.res.status(200, {
                    'Content-Type': mimeType,
                    'Content-Encoding': 'gzip',
                    'x-served-from': 'cache-file'
                });
                yield app_util_1.Util.pipeOutputStreamAsync(cachePath, ctx);
                if (useFullOptimization && cachePath) {
                    yield this._holdCacheAsync(cachePath, lastChangeTime, cfileSize);
                }
                return;
            }
            const rstream = _fs.createReadStream(absPath);
            const wstream = _fs.createWriteStream(cachePath);
            try {
                yield pipelineAsync(rstream, createGzip(), wstream);
                if (ctx.isDisposed)
                    return;
                const cdesc = yield this._fileInfo.statAsync(cachePath, true);
                if (ctx.isDisposed)
                    return;
                if (!cdesc.stats) {
                    ctx.next(404, true);
                    return;
                }
                lastChangeTime = cdesc.stats.mtime.getTime();
                http_cache_1.HttpCache.writeCacheHeader(ctx.res, {
                    lastChangeTime,
                    etag: http_cache_1.HttpCache.getEtag(lastChangeTime, cdesc.stats.size)
                }, ctx.server.config.cacheHeader);
                ctx.res.status(200, { 'Content-Type': mimeType, 'Content-Encoding': 'gzip' });
                yield app_util_1.Util.pipeOutputStreamAsync(cachePath, ctx);
                if (useFullOptimization && cachePath) {
                    yield this._holdCacheAsync(cachePath, lastChangeTime, cdesc.stats.size);
                }
                return;
            }
            catch (ex) {
                ctx.transferError(ex);
            }
            finally {
                (0, destroy_1.default)(rstream);
                (0, destroy_1.default)(wstream);
            }
        });
    }
    static servedNoChacheAsync(ctx, absPath, mimeType, isGzip, size) {
        return __awaiter(this, void 0, void 0, function* () {
            http_cache_1.HttpCache.writeCacheHeader(ctx.res, {
                lastChangeTime: void 0,
                etag: void 0
            }, { maxAge: 0, serverRevalidate: true });
            if (ctx.server.config.staticFile.compression && isGzip) {
                ctx.res.status(200, {
                    'Content-Type': mimeType,
                    'Content-Encoding': 'gzip'
                });
                const rstream = _fs.createReadStream(absPath);
                try {
                    yield pipelineAsync(rstream, createGzip(), ctx.res);
                }
                catch (ex) {
                    ctx.transferError(ex);
                }
                finally {
                    (0, destroy_1.default)(rstream);
                }
                return;
            }
            ctx.res.status(200, {
                'Content-Type': mimeType, 'Content-Length': size
            });
            yield app_util_1.Util.pipeOutputStreamAsync(absPath, ctx);
        });
    }
    static servedFromFileAsync(ctx, absPath, mimeType, isGzip, fstat) {
        return __awaiter(this, void 0, void 0, function* () {
            const reqCachHeader = http_cache_1.HttpCache.getChangedHeader(ctx.req.headers);
            const lastChangeTime = fstat.mtime.getTime();
            const curEtag = http_cache_1.HttpCache.getEtag(lastChangeTime, fstat.size);
            if ((reqCachHeader.etag && reqCachHeader.etag === curEtag) ||
                (reqCachHeader.sinceModify && reqCachHeader.sinceModify === lastChangeTime)) {
                http_cache_1.HttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                ctx.res.status(304, { 'Content-Type': mimeType }).send();
                return;
            }
            http_cache_1.HttpCache.writeCacheHeader(ctx.res, {
                lastChangeTime,
                etag: curEtag
            }, ctx.server.config.cacheHeader);
            if (ctx.server.config.staticFile.compression && isGzip) {
                ctx.res.status(200, { 'Content-Type': mimeType, 'Content-Encoding': 'gzip' });
                const rstream = _fs.createReadStream(absPath);
                try {
                    yield pipelineAsync(rstream, createGzip(), ctx.res);
                }
                catch (ex) {
                    ctx.transferError(ex);
                }
                finally {
                    (0, destroy_1.default)(rstream);
                }
                return;
            }
            ctx.res.status(200, { 'Content-Type': mimeType });
            yield app_util_1.Util.pipeOutputStreamAsync(absPath, ctx);
        });
    }
    static _renderAsync(ctx, mimeType, absPath, stat, cachePath) {
        return __awaiter(this, void 0, void 0, function* () {
            ctx.req.setSocketNoDelay(true);
            if (ctx.path.indexOf('favicon.ico') > -1) {
                http_cache_1.HttpCache.writeCacheHeader(ctx.res, {
                    lastChangeTime: void 0, etag: void 0
                }, {
                    maxAge: ctx.server.config.cacheHeader.maxAge,
                    serverRevalidate: false
                });
                ctx.res.status(200, { 'Content-Type': mimeType });
                return yield app_util_1.Util.pipeOutputStreamAsync(absPath, ctx);
            }
            if (ctx.server.config.liveStream.indexOf(ctx.extension) > -1) {
                return web_streamer_1.Streamer.stream(ctx, absPath, mimeType, stat);
            }
            let noCache = false;
            const taskDeff = TaskDeff.find(a => a.ext === ctx.extension);
            let isGzip = (!ctx.server.config.staticFile.compression ? false : http_cache_1.HttpCache.isAcceptedEncoding(ctx.req.headers, "gzip"));
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
            if (noCache === true || ctx.server.config.noCache.indexOf(ctx.extension) > -1) {
                return yield this.servedNoChacheAsync(ctx, absPath, mimeType, isGzip, stat.size);
            }
            if (!isGzip || (ctx.server.config.staticFile.fileCache === false)) {
                return yield this.servedFromFileAsync(ctx, absPath, mimeType, isGzip, stat);
            }
            return yield this.servedFromServerFileCacheAsync(ctx, absPath, mimeType, stat, cachePath);
        });
    }
    static renderAsync(ctx, mimeType, maybeDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachePath = ctx.server.config.staticFile.fileCache ? this.getCachePath(ctx) : undefined;
            const useFullOptimization = ctx.server.config.useFullOptimization;
            if (cachePath) {
                if (useFullOptimization && this._mamCache.has(cachePath)) {
                    return this._sendFromMemCache(ctx, mimeType, this._mamCache.get(cachePath));
                }
            }
            const absPath = typeof (maybeDir) === "string" && maybeDir ? _path.resolve(`${maybeDir}/${ctx.path}`) : ctx.server.mapPath(ctx.path);
            const desc = yield this._fileInfo.statAsync(absPath);
            if (ctx.isDisposed)
                return;
            if (!desc.stats)
                return ctx.next(404, true);
            yield this._renderAsync(ctx, mimeType, absPath, desc.stats, cachePath || "");
        });
    }
}
MimeHandler._mamCache = new Map();
MimeHandler._fileInfo = new file_info_1.FileInfoCacheHandler();
class HttpMimeHandler {
    getMimeType(extension) {
        return _mimeType.getMimeType(extension);
    }
    isValidExtension(extension) {
        return _mimeType.isValidExtension(extension);
    }
    renderAsync(ctx, maybeDir) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!_mimeType.isValidExtension(ctx.extension)) {
                return ctx.transferRequest(404);
            }
            return yield MimeHandler.renderAsync(ctx, _mimeType.getMimeType(ctx.extension), maybeDir);
        });
    }
}
exports.HttpMimeHandler = HttpMimeHandler;
// 11:38 PM 5/4/2020
//# sourceMappingURL=http-mime.js.map