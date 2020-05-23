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
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
var ContentType;
(function (ContentType) {
    ContentType[ContentType["JS"] = 0] = "JS";
    ContentType[ContentType["CSS"] = 1] = "CSS";
    ContentType[ContentType["UNKNOWN"] = -1] = "UNKNOWN";
})(ContentType || (ContentType = {}));
class BundleInfo {
    constructor() {
        this.error = false;
        this.files = [];
        this.msg = "";
        this.blocked = false;
    }
}
// tslint:disable-next-line: max-classes-per-file
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
    static getCachePath(server, str, ctEnum, cacheKey) {
        const dir = server.mapPath(`/web/temp/`);
        if (!_fs.existsSync(dir)) {
            sow_util_1.Util.mkdirSync(server.getPublic(), "/web/temp/");
        }
        let path = `${dir}\\${cacheKey.replace(/[/\\?%*:|"<>]/g, "")}_${sow_encryption_1.Encryption.toMd5(str)}`;
        if (ctEnum === ContentType.JS) {
            path = `${path}.js.cache`;
        }
        else {
            path = `${path}.css.cache`;
        }
        return _path.resolve(path);
    }
    static getFiles(server, str, lastChangeTime) {
        const result = new BundleInfo();
        str = server.encryption.decryptUri(str);
        if (!str) {
            result.error = true;
            result.blocked = true;
            result.msg = "Invalid key";
            return result;
        }
        if (typeof (lastChangeTime) !== "number")
            lastChangeTime = 0;
        str = str.replace(/\r\n/gi, "").replace(/\s+/g, "");
        try {
            // let files: Array<{ name: string, absolute: string, change_time: number, is_change: boolean, is_own: boolean }> = [];
            str.split(",").forEach(name => {
                // tslint:disable-next-line: one-variable-per-declaration
                let absolute = void 0, isOwn = false;
                const partIndex = name.indexOf("|");
                if (partIndex > 0) {
                    const spl = name.split("|");
                    name = spl[0];
                    if (spl[1] === "__owner__")
                        isOwn = true;
                    spl.length = 0;
                }
                if (/\$/gi.test(name) === false) {
                    absolute = _path.resolve(name);
                }
                else {
                    if (/\$virtual/gi.test(name)) {
                        absolute = _path.resolve(name.replace(/\$.+?\//gi, (m) => {
                            const vinfo = server.virtualInfo(`/${m.split("_")[1].replace("/", "")}`);
                            if (!vinfo)
                                throw new Error(`No virtual info found for ${name}`);
                            return `${vinfo.root}/`;
                        }));
                        if (!_fs.existsSync(absolute))
                            throw new Error(`No file found\r\nPath:${absolute}\r\nName:${name}`);
                    }
                    else {
                        absolute = server.formatPath(name);
                    }
                }
                const stat = _fs.statSync(absolute);
                const changeTime = stat.mtime.getTime();
                result.files.push({
                    name: name.replace(/\$root\//gi, "").replace(/\$.+?\//gi, (m) => {
                        if (m.indexOf("virtual") > -1)
                            return "/";
                        if (m.indexOf("root") > -1)
                            return "/";
                        if (m.indexOf("public") > -1)
                            return "/";
                        return "";
                    }),
                    absolute,
                    changeTime,
                    isChange: lastChangeTime && lastChangeTime === 0 ? true : (lastChangeTime && lastChangeTime > 0 && changeTime > lastChangeTime ? true : false),
                    isOwn
                });
            });
            result.error = false;
            return result;
        }
        catch (e) {
            result.error = true;
            result.msg = e;
            return result;
        }
    }
    static readBuffer(bundleInfo, copyright) {
        const out = [];
        let istr = this.getInfo();
        bundleInfo.files.forEach((inf, index) => {
            istr += `${index + 1}==>${inf.name}\r\n`;
        });
        istr += "Generated on- " + new Date().toString() + "\r\n";
        istr += "---------------------------------------------------------------------------------------------------------------------------------------*/";
        out.push(Buffer.from(istr));
        const copyBuff = Buffer.from(copyright);
        bundleInfo.files.forEach((inf) => {
            out.push(Buffer.from(`\r\n/*${inf.name}*/\r\n`));
            if (inf.isOwn === true) {
                out.push(Buffer.from(copyBuff));
                if (inf.name.indexOf(".min.") < 0) {
                    out.push(Buffer.from(_fs.readFileSync(inf.absolute, "utf8").replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "").replace(/^\s*$(?:\r\n?|\n)/gm, ""))); /** Replace Comment and empty line */
                    return;
                }
            }
            out.push(_fs.readFileSync(inf.absolute));
        });
        return Buffer.concat(out);
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
        const cngHander = sow_http_cache_1.SowHttpCache.getChangedHeader(ctx.req.headers);
        const bundleInfo = this.getFiles(server, str.toString(), cngHander.sinceModify);
        if (bundleInfo.error === true) {
            if (bundleInfo.blocked) {
                return ctx.next(404);
            }
            server.addError(ctx, bundleInfo.msg);
            return ctx.next(500);
        }
        let hasChanged = true;
        if (cngHander.sinceModify) {
            hasChanged = bundleInfo.files.some(a => a.isChange === true);
        }
        if (!hasChanged) {
            sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {
                lastChangeTime: Date.now()
            }, server.config.cacheHeader);
            ctx.res.writeHead(304, { 'Content-Type': this.getResContentType(cte) });
            return ctx.res.end(), ctx.next(304);
        }
        sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {
            lastChangeTime: Date.now()
        }, server.config.cacheHeader);
        ctx.req.socket.setNoDelay(true);
        const buffer = this.readBuffer(bundleInfo, server.copyright());
        if (isGzip === false || !server.config.bundler.compress) {
            ctx.res.writeHead(200, {
                'Content-Type': this.getResContentType(cte),
                'Content-Length': buffer.length
            });
            return ctx.res.end(buffer), ctx.next(200);
        }
        return _zlib.gzip(buffer, (error, buff) => {
            if (error) {
                server.addError(ctx, error);
                return ctx.next(500);
            }
            ctx.res.writeHead(200, {
                'Content-Type': this.getResContentType(cte),
                'Content-Encoding': 'gzip',
                'Content-Length': buff.length
            });
            ctx.res.end(buff);
            ctx.next(200);
        }), void 0;
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
        const cachpath = this.getCachePath(server, str.toString(), cte, cacheKey.toString());
        // if ( !cachpath ) return ctx.next( 404 );
        const cngHander = sow_http_cache_1.SowHttpCache.getChangedHeader(ctx.req.headers);
        const existsCachFile = _fs.existsSync(cachpath);
        // tslint:disable-next-line: one-variable-per-declaration
        let lastChangeTime = 0, cfileSize = 0;
        if (existsCachFile) {
            const stat = _fs.statSync(cachpath);
            cfileSize = stat.size;
            lastChangeTime = stat.mtime.getTime();
        }
        const bundleInfo = this.getFiles(server, str.toString(), lastChangeTime);
        if (bundleInfo.error === true) {
            if (bundleInfo.blocked) {
                return ctx.next(404);
            }
            server.addError(ctx, bundleInfo.msg);
            return ctx.next(500);
        }
        let hasChanged = true;
        if (existsCachFile) {
            hasChanged = bundleInfo.files.some(a => a.isChange === true);
        }
        const etag = cfileSize !== 0 ? sow_http_cache_1.SowHttpCache.getEtag(lastChangeTime, cfileSize) : void 0;
        if (!hasChanged && existsCachFile && (cngHander.etag || cngHander.sinceModify)) {
            let exit = false;
            if (etag && cngHander.etag) {
                if (cngHander.etag === etag) {
                    sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {}, server.config.cacheHeader);
                    ctx.res.writeHead(304, { 'Content-Type': this.getResContentType(cte) });
                    return ctx.res.end(), ctx.next(304);
                }
                exit = true;
            }
            if (cngHander.sinceModify && !exit) {
                sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {}, server.config.cacheHeader);
                ctx.res.writeHead(304, { 'Content-Type': this.getResContentType(cte) });
                return ctx.res.end(), ctx.next(304);
            }
        }
        ctx.req.socket.setNoDelay(true);
        if (!hasChanged && existsCachFile) {
            sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {
                lastChangeTime,
                etag: sow_http_cache_1.SowHttpCache.getEtag(lastChangeTime, cfileSize)
            }, server.config.cacheHeader);
            ctx.res.setHeader('x-served-from', 'cach-file');
            if (!server.config.bundler.compress) {
                ctx.res.writeHead(200, {
                    'Content-Type': this.getResContentType(cte),
                    'Content-Length': cfileSize
                });
            }
            else {
                ctx.res.writeHead(200, {
                    'Content-Type': this.getResContentType(cte),
                    'Content-Encoding': 'gzip',
                    'Content-Length': cfileSize
                });
            }
            return sow_util_1.Util.pipeOutputStream(cachpath, ctx);
        }
        if (!server.config.bundler.compress) {
            ctx.res.writeHead(200, {
                'Content-Type': this.getResContentType(cte),
                'Content-Length': cfileSize
            });
            const buff = this.readBuffer(bundleInfo, server.copyright());
            _fs.writeFileSync(cachpath, buff);
            const stat = _fs.statSync(cachpath);
            lastChangeTime = stat.mtime.getTime();
            sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {
                lastChangeTime,
                etag: sow_http_cache_1.SowHttpCache.getEtag(lastChangeTime, stat.size)
            }, server.config.cacheHeader);
            ctx.res.writeHead(200, {
                'Content-Type': this.getResContentType(cte),
                'Content-Encoding': 'gzip',
                'Content-Length': buff.length
            });
            ctx.res.end(buff);
            return ctx.next(200), void 0;
        }
        return _zlib.gzip(this.readBuffer(bundleInfo, server.copyright()), (error, buff) => {
            if (error) {
                server.addError(ctx, error);
                return ctx.next(500);
            }
            _fs.writeFileSync(cachpath, buff);
            const stat = _fs.statSync(cachpath);
            lastChangeTime = stat.mtime.getTime();
            sow_http_cache_1.SowHttpCache.writeCacheHeader(ctx.res, {
                lastChangeTime,
                etag: sow_http_cache_1.SowHttpCache.getEtag(lastChangeTime, stat.size)
            }, server.config.cacheHeader);
            ctx.res.writeHead(200, {
                'Content-Type': this.getResContentType(cte),
                'Content-Encoding': 'gzip',
                'Content-Length': buff.length
            });
            ctx.res.end(buff);
            ctx.next(200);
        }), void 0;
    }
}
const isAcceptedEncoding = (req, name) => {
    const acceptEncoding = req.headers['accept-encoding'];
    if (!acceptEncoding)
        return false;
    return acceptEncoding.indexOf(name) > -1;
};
// tslint:disable-next-line: variable-name
exports.__moduleName = "Bundler";
// tslint:disable-next-line: max-classes-per-file
class Bundler {
    static Init(app, controller, server) {
        controller.get(server.config.bundler.route, (ctx) => {
            const isGzip = isAcceptedEncoding(ctx.req, "gzip");
            if (!isGzip || server.config.bundler.fileCache === false)
                return Bundlew.createMemmory(server, ctx, isGzip);
            return Bundlew.createServerFileCache(server, ctx);
        });
    }
}
exports.Bundler = Bundler;
