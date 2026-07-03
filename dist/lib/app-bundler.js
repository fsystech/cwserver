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
exports.Bundler = exports.__moduleName = void 0;
// 4:48 PM 5/3/2020
// by rajib chy
const _fs = __importStar(require("node:fs"));
const _path = __importStar(require("node:path"));
const encryption_1 = require("./encryption");
const http_cache_1 = require("./http-cache");
const app_util_1 = require("./app-util");
const app_static_1 = require("./app-static");
const file_info_1 = require("./file-info");
const node_util_1 = require("node:util");
const node_stream_1 = require("node:stream");
const destroy_1 = __importDefault(require("destroy"));
const _fsp = _fs.promises;
const pipelineAsync = (0, node_util_1.promisify)(node_stream_1.pipeline);
var ContentType;
(function (ContentType) {
    ContentType[ContentType["JS"] = 0] = "JS";
    ContentType[ContentType["CSS"] = 1] = "CSS";
    ContentType[ContentType["UNKNOWN"] = -1] = "UNKNOWN";
})(ContentType || (ContentType = {}));
class Bundel {
    static init() {
        if (this.cache)
            return;
        this.cache = new Map();
        this.fi = new file_info_1.FileInfoCacheHandler();
    }
}
Bundel.cache = null;
Bundel.fi = null;
Bundel.init();
class Bundlew {
    static getResponseContentType(ctEnum) {
        if (ctEnum === ContentType.JS)
            return "application/x-javascript; charset=utf-8";
        return "text/css";
    }
    static getContentType(ct) {
        switch (ct.toLowerCase()) {
            case "text/javascript": return ContentType.JS;
            case "text/css": return ContentType.CSS;
        }
        return ContentType.UNKNOWN;
    }
    static getCachePath(server, str, ctEnum, cacheKey) {
        let fileName = `${cacheKey.replace(/[/\\?%*:|"<>]/g, "")}_${encryption_1.Encryption.toMd5(str)}`;
        if (ctEnum === ContentType.JS) {
            fileName = `${fileName}.js.cache`;
        }
        else {
            fileName = `${fileName}.css.cache`;
        }
        return {
            memCacheKey: fileName,
            cachpath: _path.join(server.config.bundler.tempPath, fileName)
        };
    }
    static getFileInfoAsync(server, file, lchangeTime) {
        return __awaiter(this, void 0, void 0, function* () {
            let fname = file;
            let iCwn = false;
            if (fname.indexOf("|") > 0) {
                const spl = fname.split("|");
                fname = spl[0];
                if (spl[1] === "__owner__")
                    iCwn = true;
                spl.length = 0;
            }
            if (/\$/gi.test(fname) === false) {
                fname = `$root/$public/${fname}`;
            }
            let absolute = "";
            if (/\$virtual/gi.test(fname)) {
                absolute = _path.resolve(fname.replace(/\$.+?\//gi, (m) => {
                    const vinfo = server.virtualInfo(`/${m.split("_")[1].replace("/", "")}`);
                    if (!vinfo)
                        throw new Error(`No virtual info found for ${fname}`);
                    return `${vinfo.root}/`;
                }));
            }
            else {
                absolute = server.formatPath(fname, true);
            }
            const desc = yield Bundel.fi.statAsync(absolute);
            if (!desc.exists || !desc.stats)
                throw new Error(`No file found\r\nPath:${absolute}\r\nName:${fname}`);
            const changeTime = desc.stats.mtime.getTime();
            fname = fname.replace(/\$.+?\//gi, "");
            if (fname.charAt(0) !== '/') {
                fname = `/${fname}`;
            }
            return {
                name: fname,
                absolute,
                changeTime,
                isChange: lchangeTime === 0 ? true : changeTime > lchangeTime,
                iCwn
            };
        });
    }
    static getBundleInfoAsync(server, str, lastChangeTime, hasCacheFile) {
        return __awaiter(this, void 0, void 0, function* () {
            if (hasCacheFile && !server.config.bundler.reValidate) {
                return [];
            }
            const lchangeTime = typeof (lastChangeTime) === "number" ? lastChangeTime : 0;
            const files = str.split(",");
            return yield Promise.all(files.map((file) => __awaiter(this, void 0, void 0, function* () {
                return yield this.getFileInfoAsync(server, file, lchangeTime);
            })));
        });
    }
    static _readFileAsync(ctx, inf, copyBuff) {
        return __awaiter(this, void 0, void 0, function* () {
            if (ctx.isDisposed)
                return null;
            const result = [];
            result.push(Buffer.from(`\r\n// ${inf.name}\r\n`));
            if (inf.iCwn === true) {
                result.push(copyBuff);
                if (!inf.name.includes(".min.")) {
                    const data = yield _fsp.readFile(inf.absolute, "utf8");
                    result.push(Buffer.from(data
                        .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "")
                        .replace(/^\s*$(?:\r\n?|\n)/gm, "")));
                    return result;
                }
            }
            result.push(yield _fsp.readFile(inf.absolute));
            return result;
        });
    }
    static readBufferAsync(ctx, files, copyright) {
        return __awaiter(this, void 0, void 0, function* () {
            const out = new app_static_1.BufferArray();
            let istr = _getInfo();
            for (let index = 0, l = files.length; index < l; index++) {
                const inf = files[index];
                istr += `// ${index + 1}==>${inf.name}\r\n`;
            }
            istr += "// Generated on- " + new Date().toString() + "\r\n";
            out.push(Buffer.from(istr));
            const copyBuff = Buffer.from(copyright);
            const buffers = yield Promise.all(files.map((inf) => this._readFileAsync(ctx, inf, copyBuff)));
            if (ctx.isDisposed)
                return null;
            for (const list of buffers) {
                if (list) {
                    out.push(list);
                }
            }
            return out;
        });
    }
    static decryptFilePath(server, ctx, str) {
        str = server.encryption.decryptUri(str);
        if (str.length === 0) {
            return ctx.next(404), void 0;
        }
        return str.replace(/\r\n/gi, "").replace(/\s+/g, "");
    }
    static createMemmoryAsync(server, ctx, isGzip) {
        return __awaiter(this, void 0, void 0, function* () {
            const ct = ctx.req.query.ct;
            const str = ctx.req.query.g;
            if (!str || !ct) {
                return ctx.next(404);
            }
            const cte = this.getContentType(ct.toString());
            if (cte === ContentType.UNKNOWN)
                return ctx.next(404);
            const desc = this.decryptFilePath(server, ctx, str.toString());
            if (!desc)
                return;
            const cngHander = http_cache_1.HttpCache.getChangedHeader(ctx.req.headers);
            try {
                const files = yield this.getBundleInfoAsync(server, desc.toString(), cngHander.sinceModify, false);
                if (ctx.isDisposed)
                    return;
                let hasChanged = true;
                if (cngHander.sinceModify) {
                    hasChanged = files.some(a => a.isChange === true);
                }
                http_cache_1.HttpCache.writeCacheHeader(ctx.res, {
                    lastChangeTime: Date.now()
                }, server.config.cacheHeader);
                if (!hasChanged) {
                    ctx.res.status(304, { 'Content-Type': this.getResponseContentType(cte) });
                    return ctx.res.end(), void 0;
                }
                const buffer = yield this.readBufferAsync(ctx, files, server.copyright());
                if (buffer == null || ctx.isDisposed)
                    return;
                ctx.req.setSocketNoDelay(true);
                if (isGzip === false || !server.config.bundler.compress) {
                    ctx.res.status(200, {
                        'Content-Type': this.getResponseContentType(cte),
                        'Content-Length': buffer.length
                    });
                    return ctx.res.end(buffer.data), buffer.dispose();
                }
                return ctx.res.compress(buffer.data, cte === ContentType.JS ? "js" : 'css', "GZIP");
            }
            catch (ex) {
                ctx.transferError(ex);
            }
        });
    }
    static _sendFromMemCache(ctx, cte, dataInfo) {
        const etag = dataInfo.cfileSize !== 0 ? http_cache_1.HttpCache.getEtag(dataInfo.lastChangeTime, dataInfo.cfileSize) : undefined;
        const cngHander = http_cache_1.HttpCache.getChangedHeader(ctx.req.headers);
        ctx.res.setHeader('x-served-from', 'mem-cache');
        if (cngHander.etag || cngHander.sinceModify) {
            let exit = false;
            if (etag && cngHander.etag) {
                if (cngHander.etag === etag) {
                    http_cache_1.HttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                    ctx.res.status(304, { 'Content-Type': this.getResponseContentType(cte) }).send();
                    return;
                }
                exit = true;
            }
            if (cngHander.sinceModify && !exit) {
                http_cache_1.HttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                ctx.res.status(304, { 'Content-Type': this.getResponseContentType(cte) }).send();
                return;
            }
        }
        http_cache_1.HttpCache.writeCacheHeader(ctx.res, {
            lastChangeTime: dataInfo.lastChangeTime,
            etag: http_cache_1.HttpCache.getEtag(dataInfo.lastChangeTime, dataInfo.cfileSize)
        }, ctx.server.config.cacheHeader);
        ctx.res.status(200, {
            'Content-Type': this.getResponseContentType(cte),
            'Content-Length': dataInfo.cfileSize
        });
        if (ctx.server.config.bundler.compress) {
            ctx.res.setHeader('Content-Encoding', 'gzip');
        }
        return ctx.res.end(dataInfo.bundleData), ctx.next(200);
    }
    static _holdCacheAsync(cacheKey, cachePath, lastChangeTime, size) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Bundel.cache.has(cacheKey))
                return;
            const data = yield _fsp.readFile(cachePath);
            Bundel.cache.set(cacheKey, {
                lastChangeTime,
                cfileSize: size,
                bundleData: data
            });
        });
    }
    static createServerFileCacheAsync(server, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = ctx.req.query.ck;
            const ct = ctx.req.query.ct;
            const str = ctx.req.query.g;
            if (!str || !cacheKey || !ct) {
                return ctx.next(404);
            }
            const cte = this.getContentType(ct.toString());
            if (cte === ContentType.UNKNOWN)
                return ctx.next(404);
            const desc = this.decryptFilePath(server, ctx, str.toString());
            if (!desc)
                return;
            const useFullOptimization = server.config.useFullOptimization;
            const { cachpath, memCacheKey } = this.getCachePath(server, desc.toString(), cte, cacheKey.toString());
            if (useFullOptimization && Bundel.cache.has(memCacheKey)) {
                return this._sendFromMemCache(ctx, cte, Bundel.cache.get(memCacheKey));
            }
            const cngHander = http_cache_1.HttpCache.getChangedHeader(ctx.req.headers);
            try {
                const fdesc = yield Bundel.fi.statAsync(cachpath);
                if (ctx.isDisposed)
                    return;
                let lastChangeTime = 0, cfileSize = 0;
                if (fdesc.exists && fdesc.stats) {
                    cfileSize = fdesc.stats.size;
                    lastChangeTime = fdesc.stats.mtime.getTime();
                }
                const files = yield this.getBundleInfoAsync(server, desc.toString(), lastChangeTime, fdesc.exists);
                if (ctx.isDisposed)
                    return;
                let hasChanged = true;
                if (fdesc.exists) {
                    hasChanged = files.some(a => a.isChange === true);
                }
                const etag = cfileSize !== 0 ? http_cache_1.HttpCache.getEtag(lastChangeTime, cfileSize) : undefined;
                if (!hasChanged && fdesc.exists && (cngHander.etag || cngHander.sinceModify)) {
                    let exit = false;
                    if (etag && cngHander.etag) {
                        if (cngHander.etag === etag) {
                            http_cache_1.HttpCache.writeCacheHeader(ctx.res, {}, server.config.cacheHeader);
                            ctx.res.status(304, { 'Content-Type': this.getResponseContentType(cte) }).send();
                            return ctx.next(304);
                        }
                        exit = true;
                    }
                    if (cngHander.sinceModify && !exit) {
                        http_cache_1.HttpCache.writeCacheHeader(ctx.res, {}, server.config.cacheHeader);
                        ctx.res.status(304, { 'Content-Type': this.getResponseContentType(cte) }).send();
                        return ctx.next(304);
                    }
                }
                if (!hasChanged && fdesc.exists) {
                    http_cache_1.HttpCache.writeCacheHeader(ctx.res, {
                        lastChangeTime,
                        etag: http_cache_1.HttpCache.getEtag(lastChangeTime, cfileSize)
                    }, server.config.cacheHeader);
                    ctx.res.status(200, {
                        'Content-Type': this.getResponseContentType(cte),
                        'Content-Length': cfileSize,
                        'x-served-from': 'file-cache'
                    });
                    if (server.config.bundler.compress) {
                        ctx.res.setHeader('Content-Encoding', 'gzip');
                    }
                    yield app_util_1.Util.pipeOutputStreamAsync(cachpath, ctx);
                    if (useFullOptimization) {
                        yield this._holdCacheAsync(memCacheKey, cachpath, lastChangeTime, cfileSize);
                    }
                    return;
                }
                const buffer = yield this.readBufferAsync(ctx, files, server.copyright());
                if (buffer === null || ctx.isDisposed)
                    return;
                if (!server.config.bundler.compress) {
                    yield _fsp.writeFile(cachpath, buffer.data);
                    if (ctx.isDisposed)
                        return;
                    const cdesc = yield Bundel.fi.statAsync(cachpath, true);
                    if (ctx.isDisposed)
                        return;
                    if (!cdesc.stats)
                        return ctx.next(404);
                    lastChangeTime = cdesc.stats.mtime.getTime();
                    http_cache_1.HttpCache.writeCacheHeader(ctx.res, {
                        lastChangeTime,
                        etag: http_cache_1.HttpCache.getEtag(lastChangeTime, cdesc.stats.size)
                    }, server.config.cacheHeader);
                    ctx.res.status(200, {
                        'Content-Type': this.getResponseContentType(cte),
                        'Content-Length': buffer.length
                    });
                    if (useFullOptimization) {
                        Bundel.cache.set(memCacheKey, {
                            lastChangeTime,
                            cfileSize: cdesc.stats.size,
                            bundleData: buffer.data
                        });
                    }
                    ctx.res.end(buffer.data);
                    buffer.dispose();
                    return;
                }
                const writeStream = _fs.createWriteStream(cachpath);
                try {
                    yield pipelineAsync(node_stream_1.Readable.from(buffer.data), app_util_1.Util.createGzip(), writeStream);
                }
                catch (ex) {
                    return ctx.transferError(ex);
                }
                finally {
                    (0, destroy_1.default)(writeStream);
                }
                if (ctx.isDisposed)
                    return;
                const edesc = yield Bundel.fi.statAsync(cachpath, true);
                if (ctx.isDisposed)
                    return;
                if (!edesc.stats)
                    return ctx.next(404);
                lastChangeTime = edesc.stats.mtime.getTime();
                http_cache_1.HttpCache.writeCacheHeader(ctx.res, {
                    lastChangeTime,
                    etag: http_cache_1.HttpCache.getEtag(lastChangeTime, edesc.stats.size)
                }, server.config.cacheHeader);
                ctx.res.status(200, {
                    'Content-Type': this.getResponseContentType(cte),
                    'Content-Encoding': 'gzip',
                    'Content-Length': edesc.stats.size
                });
                yield app_util_1.Util.pipeOutputStreamAsync(cachpath, ctx);
                if (useFullOptimization) {
                    yield this._holdCacheAsync(memCacheKey, cachpath, lastChangeTime, edesc.stats.size);
                }
            }
            catch (ex) {
                ctx.transferError(ex);
            }
        });
    }
}
// tslint:disable-next-line: variable-name
exports.__moduleName = "Bundler";
class Bundler {
    static Init(app, controller, server) {
        controller.get(server.config.bundler.route, (ctx) => __awaiter(this, void 0, void 0, function* () {
            const isGzip = http_cache_1.HttpCache.isAcceptedEncoding(ctx.req.headers, "gzip");
            if (!isGzip || server.config.bundler.fileCache === false) {
                yield Bundlew.createMemmoryAsync(server, ctx, isGzip);
            }
            else {
                yield Bundlew.createServerFileCacheAsync(server, ctx);
            }
        }));
    }
}
exports.Bundler = Bundler;
function _getInfo() {
    return '// Cw "Combiner"\r\n// Copyright (c) 2022 FSys Tech Ltd.\r\n// Email: mssclang@outlook.com\r\n\r\n// This "Combiner" contains the following files:\r\n';
}
//# sourceMappingURL=app-bundler.js.map