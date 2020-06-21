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
exports.Bundler = exports.__moduleName = void 0;
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 4:48 PM 5/3/2020
const _fs = __importStar(require("fs"));
const _path = __importStar(require("path"));
const _zlib = __importStar(require("zlib"));
const sow_encryption_1 = require("./sow-encryption");
const sow_http_cache_1 = require("./sow-http-cache");
const sow_util_1 = require("./sow-util");
const fsw = __importStar(require("./sow-fsw"));
var ContentType;
(function (ContentType) {
    ContentType[ContentType["JS"] = 0] = "JS";
    ContentType[ContentType["CSS"] = 1] = "CSS";
    ContentType[ContentType["UNKNOWN"] = -1] = "UNKNOWN";
})(ContentType || (ContentType = {}));
const responseWriteGzip = (ctx, buff, cte) => {
    ctx.res.status(200, {
        'Content-Type': Bundlew.getResContentType(cte),
        'Content-Encoding': 'gzip'
    });
    const compressor = _zlib.createGzip({ level: _zlib.constants.Z_BEST_COMPRESSION });
    compressor.pipe(ctx.res);
    compressor.end(buff);
    return compressor.on("end", () => {
        compressor.unpipe(ctx.res);
        ctx.next(200);
    }), void 0;
};
class Bundlew {
    static getInfo() {
        return `/*
||####################################################################################################################################||
||#  Sow 'Combiner'                                                                                                                  #||
||#  Version: 1.0.0.1; Build Date : Fri May 01, 2020 1:33:49 GMT+0600 (BDT)                                                          #||
||#  Sow( https://www.facebook.com/safeonlineworld, mssclang@outlook.com, https://github.com/safeonlineworld/cwserver)). All rights reserved          #||
||#  Email: mssclang@outlook.com;                                                                                                    #||
||####################################################################################################################################||
---------------------------------------------------------------------------------------------------------------------------------------
This 'Combiner' contains the following files:\n`;
    }
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
    static getCachePath(ctx, str, ctEnum, cacheKey) {
        const dir = ctx.server.mapPath(`/web/temp/`);
        let path = `${dir}\\${cacheKey.replace(/[/\\?%*:|"<>]/g, "")}_${sow_encryption_1.Encryption.toMd5(str)}`;
        if (ctEnum === ContentType.JS) {
            path = `${path}.js.cache`;
        }
        else {
            path = `${path}.css.cache`;
        }
        return path;
    }
    static getBundleInfo(server, str, lastChangeTime, next) {
        const result = [];
        const lchangeTime = typeof (lastChangeTime) === "number" ? lastChangeTime : 0;
        const files = str.split(",");
        const forword = () => {
            try {
                const _name = files.shift();
                if (!_name)
                    return next(result, null);
                let name = _name;
                let isOwn = false;
                if (name.indexOf("|") > 0) {
                    const spl = name.split("|");
                    name = spl[0];
                    if (spl[1] === "__owner__")
                        isOwn = true;
                    spl.length = 0;
                }
                if (/\$/gi.test(name) === false) {
                    name = `$root/$public/${name}`;
                }
                let absolute = "";
                if (/\$virtual/gi.test(name)) {
                    absolute = _path.resolve(name.replace(/\$.+?\//gi, (m) => {
                        const vinfo = server.virtualInfo(`/${m.split("_")[1].replace("/", "")}`);
                        if (!vinfo)
                            throw new Error(`No virtual info found for ${name}`);
                        return `${vinfo.root}/`;
                    }));
                }
                else {
                    absolute = server.formatPath(name, true);
                }
                return _fs.exists(absolute, (exists) => {
                    if (!exists)
                        return next([], new Error(`No file found\r\nPath:${absolute}\r\nName:${name}`));
                    return _fs.stat(absolute, (err, stat) => {
                        sow_util_1.Util.throwIfError(err);
                        const changeTime = stat.mtime.getTime();
                        result.push({
                            name: name.replace(/\$.+?\//gi, "/"),
                            absolute,
                            changeTime,
                            isChange: lchangeTime === 0 ? true : changeTime > lchangeTime,
                            isOwn
                        });
                        return forword();
                    });
                });
            }
            catch (e) {
                return next([], e);
            }
        };
        return forword();
    }
    static readBuffer(ctx, files, copyright, next) {
        const out = [];
        let istr = this.getInfo();
        files.forEach((inf, index) => {
            istr += `${index + 1}==>${inf.name}\r\n`;
        });
        istr += "Generated on- " + new Date().toString() + "\r\n";
        istr += "---------------------------------------------------------------------------------------------------------------------------------------*/";
        out.push(Buffer.from(istr));
        const copyBuff = Buffer.from(copyright);
        const forward = () => {
            const inf = files.shift();
            if (!inf) {
                return next(Buffer.concat(out));
            }
            out.push(Buffer.from(`\r\n/*${inf.name}*/\r\n`));
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
        const cngHander = sow_http_cache_1.SowHttpCache.getChangedHeader(ctx.req.headers);
        return this.getBundleInfo(server, desc.toString(), cngHander.sinceModify, (files, err) => {
            return ctx.handleError(err, () => {
                let hasChanged = true;
                if (cngHander.sinceModify) {
                    hasChanged = files.some(a => a.isChange === true);
                }
                sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {
                    lastChangeTime: Date.now()
                }, server.config.cacheHeader);
                if (!hasChanged) {
                    ctx.res.status(304, { 'Content-Type': this.getResContentType(cte) });
                    return ctx.res.end(), ctx.next(304);
                }
                return this.readBuffer(ctx, files, server.copyright(), (buffer) => {
                    ctx.req.socket.setNoDelay(true);
                    if (isGzip === false || !server.config.bundler.compress) {
                        ctx.res.status(200, {
                            'Content-Type': this.getResContentType(cte),
                            'Content-Length': buffer.length
                        });
                        return ctx.res.end(buffer), ctx.next(200);
                    }
                    return responseWriteGzip(ctx, buffer, cte);
                });
            });
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
        const cachpath = this.getCachePath(ctx, desc.toString(), cte, cacheKey.toString());
        const cngHander = sow_http_cache_1.SowHttpCache.getChangedHeader(ctx.req.headers);
        return fsw.stat(cachpath, (serr, stat) => {
            const existsCachFile = stat ? true : false;
            return ctx.handleError(serr, () => {
                let lastChangeTime = 0;
                let cfileSize = 0;
                if (existsCachFile && stat) {
                    cfileSize = stat.size;
                    lastChangeTime = stat.mtime.getTime();
                }
                return this.getBundleInfo(server, desc.toString(), lastChangeTime, (files, ierr) => {
                    return ctx.handleError(ierr, () => {
                        let hasChanged = true;
                        if (existsCachFile) {
                            hasChanged = files.some(a => a.isChange === true);
                        }
                        const etag = cfileSize !== 0 ? sow_http_cache_1.SowHttpCache.getEtag(lastChangeTime, cfileSize) : void 0;
                        if (!hasChanged && existsCachFile && (cngHander.etag || cngHander.sinceModify)) {
                            let exit = false;
                            if (etag && cngHander.etag) {
                                if (cngHander.etag === etag) {
                                    sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {}, server.config.cacheHeader);
                                    ctx.res.status(304, { 'Content-Type': this.getResContentType(cte) }).send();
                                    return ctx.next(304);
                                }
                                exit = true;
                            }
                            if (cngHander.sinceModify && !exit) {
                                sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {}, server.config.cacheHeader);
                                ctx.res.status(304, { 'Content-Type': this.getResContentType(cte) }).send();
                                return ctx.next(304);
                            }
                        }
                        if (!hasChanged && existsCachFile) {
                            sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {
                                lastChangeTime,
                                etag: sow_http_cache_1.SowHttpCache.getEtag(lastChangeTime, cfileSize)
                            }, server.config.cacheHeader);
                            ctx.res.status(200, {
                                'Content-Type': this.getResContentType(cte),
                                'Content-Length': cfileSize,
                                'x-served-from': 'cach-file'
                            });
                            if (server.config.bundler.compress) {
                                ctx.res.setHeader('Content-Encoding', 'gzip');
                            }
                            return sow_util_1.Util.pipeOutputStream(cachpath, ctx);
                        }
                        return this.readBuffer(ctx, files, server.copyright(), (buffer) => {
                            if (!server.config.bundler.compress) {
                                return _fs.writeFile(cachpath, buffer, (werr) => {
                                    return ctx.handleError(werr, () => {
                                        return _fs.stat(cachpath, (cserr, cstat) => {
                                            return ctx.handleError(cserr, () => {
                                                lastChangeTime = cstat.mtime.getTime();
                                                sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {
                                                    lastChangeTime,
                                                    etag: sow_http_cache_1.SowHttpCache.getEtag(lastChangeTime, cstat.size)
                                                }, server.config.cacheHeader);
                                                ctx.res.status(200, {
                                                    'Content-Type': this.getResContentType(cte),
                                                    'Content-Length': buffer.length
                                                });
                                                ctx.res.end(buffer);
                                                return ctx.next(200);
                                            });
                                        });
                                    });
                                });
                            }
                            return _zlib.gzip(buffer, (error, buff) => {
                                return ctx.handleError(error, () => {
                                    return _fs.writeFile(cachpath, buff, (err) => {
                                        return ctx.handleError(err, () => {
                                            return _fs.stat(cachpath, (cserr, cstat) => {
                                                return ctx.handleError(cserr, () => {
                                                    lastChangeTime = cstat.mtime.getTime();
                                                    sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {
                                                        lastChangeTime,
                                                        etag: sow_http_cache_1.SowHttpCache.getEtag(lastChangeTime, cstat.size)
                                                    }, server.config.cacheHeader);
                                                    ctx.res.status(200, {
                                                        'Content-Type': this.getResContentType(cte),
                                                        'Content-Encoding': 'gzip',
                                                        'Content-Length': buff.length
                                                    });
                                                    ctx.res.end(buff);
                                                    ctx.next(200);
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        }, ctx.handleError.bind(ctx));
    }
}
// tslint:disable-next-line: variable-name
exports.__moduleName = "Bundler";
class Bundler {
    static Init(app, controller, server) {
        controller.get(server.config.bundler.route, (ctx) => {
            const isGzip = sow_http_cache_1.SowHttpCache.isAcceptedEncoding(ctx.req.headers, "gzip");
            if (!isGzip || server.config.bundler.fileCache === false)
                return Bundlew.createMemmory(server, ctx, isGzip);
            return Bundlew.createServerFileCache(server, ctx);
        });
    }
}
exports.Bundler = Bundler;
//# sourceMappingURL=sow-bundler.js.map