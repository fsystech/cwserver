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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bundler = exports.__moduleName = void 0;
// 4:48 PM 5/3/2020
// by rajib chy
const _fs = __importStar(require("node:fs"));
const _path = __importStar(require("node:path"));
const _zlib = __importStar(require("node:zlib"));
const encryption_1 = require("./encryption");
const http_cache_1 = require("./http-cache");
const app_util_1 = require("./app-util");
const app_static_1 = require("./app-static");
const file_info_1 = require("./file-info");
const _fileInfo = new file_info_1.FileInfoCacheHandler();
var ContentType;
(function (ContentType) {
    ContentType[ContentType["JS"] = 0] = "JS";
    ContentType[ContentType["CSS"] = 1] = "CSS";
    ContentType[ContentType["UNKNOWN"] = -1] = "UNKNOWN";
})(ContentType || (ContentType = {}));
const _mamCache = {};
const responseWriteGzip = (ctx, buff, cte) => {
    ctx.res.status(200, {
        'Content-Type': Bundlew.getResContentType(cte),
        'Content-Encoding': 'gzip'
    });
    const compressor = _zlib.createGzip({ level: _zlib.constants.Z_BEST_COMPRESSION });
    compressor.pipe(ctx.res);
    compressor.end(buff.data);
    buff.dispose();
    return compressor.on("end", () => {
        compressor.unpipe(ctx.res);
        ctx.next(200);
    }), void 0;
};
class Bundlew {
    static getResContentType(ctEnum) {
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
        // const dir = ctx.server.mapPath( `/web/temp/` );
        let fileName = `${cacheKey.replace(/[/\\?%*:|"<>]/g, "")}_${encryption_1.Encryption.toMd5(str)}`;
        // let path: string = _path.join(server.config.bundler.tempPath, `${cacheKey.replace(/[/\\?%*:|"<>]/g, "")}_${Encryption.toMd5(str)}`);
        // let path: string = `${ctx.server.config.bundler.tempPath}\\${cacheKey.replace(/[/\\?%*:|"<>]/g, "")}_${Encryption.toMd5(str)}`;
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
    static getBundleInfo(server, str, lastChangeTime, hasCacheFile, next) {
        const result = [];
        if (hasCacheFile && !server.config.bundler.reValidate) {
            return process.nextTick(() => next(result, null));
        }
        const lchangeTime = typeof (lastChangeTime) === "number" ? lastChangeTime : 0;
        const files = str.split(",");
        const forword = () => {
            try {
                const _name = files.shift();
                if (!_name)
                    return next(result, null);
                let fname = _name;
                let isOwn = false;
                if (fname.indexOf("|") > 0) {
                    const spl = fname.split("|");
                    fname = spl[0];
                    if (spl[1] === "__owner__")
                        isOwn = true;
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
                return _fileInfo.stat(absolute, (desc) => {
                    if (!desc.exists || !desc.stats)
                        return next([], new Error(`No file found\r\nPath:${absolute}\r\nName:${fname}`));
                    const changeTime = desc.stats.mtime.getTime();
                    fname = fname.replace(/\$.+?\//gi, "");
                    if (fname.charAt(0) !== '/') {
                        fname = `/${fname}`;
                    }
                    result.push({
                        name: fname,
                        absolute,
                        changeTime,
                        isChange: lchangeTime === 0 ? true : changeTime > lchangeTime,
                        isOwn
                    });
                    return forword();
                });
            }
            catch (e) {
                return next([], e);
            }
        };
        return forword();
    }
    static readBuffer(ctx, files, copyright, next) {
        const out = new app_static_1.BufferArray();
        let istr = _getInfo();
        files.forEach((inf, index) => {
            istr += `// ${index + 1}==>${inf.name}\r\n`;
        });
        istr += "// Generated on- " + new Date().toString() + "\r\n";
        out.push(Buffer.from(istr));
        const copyBuff = Buffer.from(copyright);
        const forward = () => {
            const inf = files.shift();
            if (!inf) {
                return process.nextTick(() => next(out));
            }
            out.push(Buffer.from(`\r\n// ${inf.name}\r\n`));
            if (inf.isOwn === true) {
                out.push(copyBuff);
                if (inf.name.indexOf(".min.") < 0) {
                    return _fs.readFile(inf.absolute, "utf8", (err, data) => {
                        return ctx.handleError(err, () => {
                            out.push(Buffer.from(data.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "").replace(/^\s*$(?:\r\n?|\n)/gm, ""))); /** Replace Comment and empty line */
                            return forward();
                        });
                    });
                }
            }
            return _fs.readFile(inf.absolute, (err, buffer) => {
                return ctx.handleError(err, () => {
                    out.push(buffer);
                    return forward();
                });
            });
        };
        return forward();
    }
    static decryptFilePath(server, ctx, str) {
        str = server.encryption.decryptUri(str);
        if (str.length === 0) {
            return ctx.next(404), void 0;
        }
        str = str.replace(/\r\n/gi, "").replace(/\s+/g, "");
        return str;
    }
    static createMemmory(server, ctx, isGzip) {
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
        return this.getBundleInfo(server, desc.toString(), cngHander.sinceModify, false, (files, err) => {
            return ctx.handleError(err, () => {
                let hasChanged = true;
                if (cngHander.sinceModify) {
                    hasChanged = files.some(a => a.isChange === true);
                }
                http_cache_1.HttpCache.writeCacheHeader(ctx.res, {
                    lastChangeTime: Date.now()
                }, server.config.cacheHeader);
                if (!hasChanged) {
                    ctx.res.status(304, { 'Content-Type': this.getResContentType(cte) });
                    return ctx.res.end(), ctx.next(304);
                }
                return this.readBuffer(ctx, files, server.copyright(), (buffer) => {
                    ctx.req.setSocketNoDelay(true);
                    if (isGzip === false || !server.config.bundler.compress) {
                        ctx.res.status(200, {
                            'Content-Type': this.getResContentType(cte),
                            'Content-Length': buffer.length
                        });
                        return ctx.res.end(buffer.data), buffer.dispose(), ctx.next(200);
                    }
                    return responseWriteGzip(ctx, buffer, cte);
                });
            });
        });
    }
    static _sendFromMemCache(ctx, cte, dataInfo) {
        const etag = dataInfo.cfileSize !== 0 ? http_cache_1.HttpCache.getEtag(dataInfo.lastChangeTime, dataInfo.cfileSize) : void 0;
        const cngHander = http_cache_1.HttpCache.getChangedHeader(ctx.req.headers);
        ctx.res.setHeader('x-served-from', 'mem-cache');
        if (cngHander.etag || cngHander.sinceModify) {
            let exit = false;
            if (etag && cngHander.etag) {
                if (cngHander.etag === etag) {
                    http_cache_1.HttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                    ctx.res.status(304, { 'Content-Type': this.getResContentType(cte) }).send();
                    return ctx.next(304);
                }
                exit = true;
            }
            if (cngHander.sinceModify && !exit) {
                http_cache_1.HttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                ctx.res.status(304, { 'Content-Type': this.getResContentType(cte) }).send();
                return ctx.next(304);
            }
        }
        http_cache_1.HttpCache.writeCacheHeader(ctx.res, {
            lastChangeTime: dataInfo.lastChangeTime,
            etag: http_cache_1.HttpCache.getEtag(dataInfo.lastChangeTime, dataInfo.cfileSize)
        }, ctx.server.config.cacheHeader);
        ctx.res.status(200, {
            'Content-Type': this.getResContentType(cte),
            'Content-Length': dataInfo.cfileSize
        });
        if (ctx.server.config.bundler.compress) {
            ctx.res.setHeader('Content-Encoding', 'gzip');
        }
        return ctx.res.end(dataInfo.bundleData), ctx.next(200);
    }
    // private static _getCacheMape(str: string): string {
    //     return str.replace(/\\/gi, "_").replace(/-/gi, "_");
    // }
    static _holdCache(cacheKey, cachePath, lastChangeTime, size) {
        if (_mamCache[cacheKey])
            return;
        setImmediate(() => {
            _mamCache[cacheKey] = {
                lastChangeTime,
                cfileSize: size,
                bundleData: _fs.readFileSync(cachePath)
            };
        });
    }
    static createServerFileCache(server, ctx) {
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
        // const memCacheKey: string = this._getCacheMape(fileName);
        if (useFullOptimization && _mamCache[memCacheKey]) {
            return this._sendFromMemCache(ctx, cte, _mamCache[memCacheKey]);
        }
        const cngHander = http_cache_1.HttpCache.getChangedHeader(ctx.req.headers);
        return _fileInfo.stat(cachpath, (fdesc) => {
            const existsCachFile = fdesc.exists;
            return ctx.handleError(null, () => {
                let lastChangeTime = 0;
                let cfileSize = 0;
                if (existsCachFile && fdesc.stats) {
                    cfileSize = fdesc.stats.size;
                    lastChangeTime = fdesc.stats.mtime.getTime();
                }
                return this.getBundleInfo(server, desc.toString(), lastChangeTime, existsCachFile, (files, ierr) => {
                    return ctx.handleError(ierr, () => {
                        let hasChanged = true;
                        if (existsCachFile) {
                            hasChanged = files.some(a => a.isChange === true);
                        }
                        const etag = cfileSize !== 0 ? http_cache_1.HttpCache.getEtag(lastChangeTime, cfileSize) : void 0;
                        if (!hasChanged && existsCachFile && (cngHander.etag || cngHander.sinceModify)) {
                            let exit = false;
                            if (etag && cngHander.etag) {
                                if (cngHander.etag === etag) {
                                    http_cache_1.HttpCache.writeCacheHeader(ctx.res, {}, server.config.cacheHeader);
                                    ctx.res.status(304, { 'Content-Type': this.getResContentType(cte) }).send();
                                    return ctx.next(304);
                                }
                                exit = true;
                            }
                            if (cngHander.sinceModify && !exit) {
                                http_cache_1.HttpCache.writeCacheHeader(ctx.res, {}, server.config.cacheHeader);
                                ctx.res.status(304, { 'Content-Type': this.getResContentType(cte) }).send();
                                return ctx.next(304);
                            }
                        }
                        if (!hasChanged && existsCachFile) {
                            http_cache_1.HttpCache.writeCacheHeader(ctx.res, {
                                lastChangeTime,
                                etag: http_cache_1.HttpCache.getEtag(lastChangeTime, cfileSize)
                            }, server.config.cacheHeader);
                            ctx.res.status(200, {
                                'Content-Type': this.getResContentType(cte),
                                'Content-Length': cfileSize,
                                'x-served-from': 'file-cache'
                            });
                            if (server.config.bundler.compress) {
                                ctx.res.setHeader('Content-Encoding', 'gzip');
                            }
                            if (useFullOptimization) {
                                this._holdCache(memCacheKey, cachpath, lastChangeTime, cfileSize);
                            }
                            return app_util_1.Util.pipeOutputStream(cachpath, ctx);
                        }
                        return this.readBuffer(ctx, files, server.copyright(), (buffer) => {
                            if (!server.config.bundler.compress) {
                                return _fs.writeFile(cachpath, buffer.data, (werr) => {
                                    return ctx.handleError(werr, () => {
                                        return _fileInfo.stat(cachpath, (edesc) => {
                                            return ctx.handleError(null, () => {
                                                if (!edesc.stats)
                                                    return ctx.next(404);
                                                lastChangeTime = edesc.stats.mtime.getTime();
                                                http_cache_1.HttpCache.writeCacheHeader(ctx.res, {
                                                    lastChangeTime,
                                                    etag: http_cache_1.HttpCache.getEtag(lastChangeTime, edesc.stats.size)
                                                }, server.config.cacheHeader);
                                                ctx.res.status(200, {
                                                    'Content-Type': this.getResContentType(cte),
                                                    'Content-Length': buffer.length
                                                });
                                                if (useFullOptimization) {
                                                    _mamCache[memCacheKey] = {
                                                        lastChangeTime,
                                                        cfileSize: edesc.stats.size,
                                                        bundleData: buffer.data
                                                    };
                                                }
                                                ctx.res.end(buffer.data);
                                                buffer.dispose();
                                                return ctx.next(200);
                                            });
                                        }, true);
                                    });
                                });
                            }
                            return _zlib.gzip(buffer.data, (error, buff) => {
                                buffer.dispose();
                                return ctx.handleError(error, () => {
                                    return _fs.writeFile(cachpath, buff, (err) => {
                                        return ctx.handleError(err, () => {
                                            return _fileInfo.stat(cachpath, (edesc) => {
                                                return ctx.handleError(null, () => {
                                                    if (!edesc.stats)
                                                        return ctx.next(404);
                                                    lastChangeTime = edesc.stats.mtime.getTime();
                                                    http_cache_1.HttpCache.writeCacheHeader(ctx.res, {
                                                        lastChangeTime,
                                                        etag: http_cache_1.HttpCache.getEtag(lastChangeTime, edesc.stats.size)
                                                    }, server.config.cacheHeader);
                                                    ctx.res.status(200, {
                                                        'Content-Type': this.getResContentType(cte),
                                                        'Content-Encoding': 'gzip',
                                                        'Content-Length': buff.length
                                                    });
                                                    if (useFullOptimization) {
                                                        _mamCache[memCacheKey] = {
                                                            lastChangeTime,
                                                            cfileSize: edesc.stats.size,
                                                            bundleData: buff
                                                        };
                                                    }
                                                    ctx.res.end(buff);
                                                    ctx.next(200);
                                                });
                                            }, true);
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }
}
// tslint:disable-next-line: variable-name
exports.__moduleName = "Bundler";
class Bundler {
    static Init(app, controller, server) {
        controller.get(server.config.bundler.route, (ctx) => {
            const isGzip = http_cache_1.HttpCache.isAcceptedEncoding(ctx.req.headers, "gzip");
            if (!isGzip || server.config.bundler.fileCache === false)
                return Bundlew.createMemmory(server, ctx, isGzip);
            return Bundlew.createServerFileCache(server, ctx);
        });
    }
}
exports.Bundler = Bundler;
function _getInfo() {
    return '// Sow "Combiner"\r\n// Copyright (c) 2022 Safe Online World Ltd.\r\n// Email: mssclang@outlook.com\r\n\r\n// This "Combiner" contains the following files:\r\n';
}
//# sourceMappingURL=app-bundler.js.map