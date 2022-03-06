/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 9:22 PM 5/4/2020
import * as _fs from 'fs';
import * as _path from 'path';
import * as _zlib from 'zlib';
import { pipeline } from 'stream';
import destroy = require('destroy');
import * as _mimeType from './sow-http-mime-types';
import { IContext } from './sow-server';
import { SowHttpCache, IChangeHeader } from './sow-http-cache';
import { Streamer } from './sow-web-streamer';
import { Encryption } from './sow-encryption';
import { Util } from './sow-util';
export interface IHttpMimeHandler {
    render(ctx: IContext, maybeDir?: string, checkFile?: boolean): void;
    getMimeType(extension: string): string;
    isValidExtension(extension: string): boolean;
}
type MemCacheInfo = {
    readonly cfileSize: number;
    readonly gizipData: Buffer;
    readonly lastChangeTime: number;
};
const _mamCache: { [x: string]: MemCacheInfo; } = {};
interface ITaskDeff {
    cache: boolean; ext: string; gzip: boolean
}
// "exe", "zip", "doc", "docx", "pdf", "ppt", "pptx", "gz"
const TaskDeff: ITaskDeff[] = [
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
function createGzip(): _zlib.Gzip {
    return _zlib.createGzip({ level: _zlib.constants.Z_BEST_COMPRESSION });
}
class MimeHandler {
    static getCachePath(ctx: IContext): string {
        const path: string = `${ctx.server.config.staticFile.tempPath}\\${Encryption.toMd5(ctx.path)}`;
        return _path.resolve(`${path}.${ctx.extension}.cache`);
    }
    static _sendFromMemCache(ctx: IContext, mimeType: string, dataInfo: MemCacheInfo): void {
        const reqCacheHeader: IChangeHeader = SowHttpCache.getChangedHeader(ctx.req.headers);
        const etag: string = SowHttpCache.getEtag(dataInfo.lastChangeTime, dataInfo.cfileSize);
        ctx.res.setHeader('x-served-from', 'mem-cache');
        if (reqCacheHeader.etag || reqCacheHeader.sinceModify) {
            let exit: boolean = false;
            if (reqCacheHeader.etag) {
                if (reqCacheHeader.etag === etag) {
                    SowHttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                    ctx.res.status(304, { 'Content-Type': mimeType }).send();
                    return ctx.next(304);
                }
                exit = true;
            }
            if (reqCacheHeader.sinceModify && !exit) {
                SowHttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                ctx.res.status(304, { 'Content-Type': mimeType }).send();
                return ctx.next(304);
            }
        }
        SowHttpCache.writeCacheHeader(ctx.res, {
            lastChangeTime: dataInfo.lastChangeTime,
            etag: SowHttpCache.getEtag(dataInfo.lastChangeTime, dataInfo.cfileSize)
        }, ctx.server.config.cacheHeader);
        ctx.res.status(200, {
            'Content-Type': mimeType,
            'Content-Encoding': 'gzip'
        });
        return ctx.res.end(dataInfo.gizipData), ctx.next(200);
    }
    static _holdCache(cachePath: string, lastChangeTime: number, size: number): void {
        if (_mamCache[cachePath]) return;
        setImmediate(() => {
            _mamCache[cachePath] = {
                lastChangeTime,
                cfileSize: size,
                gizipData: _fs.readFileSync(cachePath)
            };
        });
    }
    static servedFromServerFileCache(
        ctx: IContext, absPath: string, mimeType: string,
        fstat: _fs.Stats, cachePath: string
    ): void {
        const useFullOptimization: boolean = ctx.server.config.useFullOptimization;
        const reqCacheHeader: IChangeHeader = SowHttpCache.getChangedHeader(ctx.req.headers);
        return _fs.stat(cachePath, (serr?: NodeJS.ErrnoException | null, stat?: _fs.Stats): void => {
            const existsCachFile: boolean = serr ? false : true;
            return ctx.handleError(null, () => {
                let lastChangeTime: number = 0, cfileSize: number = 0;
                if (existsCachFile && stat) {
                    cfileSize = stat.size;
                    lastChangeTime = stat.mtime.getTime();
                }
                let hasChanged: boolean = true;
                if (existsCachFile) {
                    hasChanged = fstat.mtime.getTime() > lastChangeTime;
                }
                const etag: string | undefined = cfileSize !== 0 ? SowHttpCache.getEtag(lastChangeTime, cfileSize) : void 0;
                if (!hasChanged && existsCachFile && (reqCacheHeader.etag || reqCacheHeader.sinceModify)) {
                    let exit: boolean = false;
                    if (etag && reqCacheHeader.etag) {
                        if (reqCacheHeader.etag === etag) {
                            SowHttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                            ctx.res.status(304, { 'Content-Type': mimeType }).send();
                            if (useFullOptimization && cachePath) {
                                this._holdCache(cachePath, lastChangeTime, cfileSize);
                            }
                            return ctx.next(304);
                        }
                        exit = true;
                    }
                    if (reqCacheHeader.sinceModify && !exit) {
                        SowHttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                        ctx.res.status(304, { 'Content-Type': mimeType }).send();
                        if (useFullOptimization && cachePath) {
                            this._holdCache(cachePath, lastChangeTime, cfileSize);
                        }
                        return ctx.next(304);
                    }
                }
                if (!hasChanged && existsCachFile) {
                    SowHttpCache.writeCacheHeader(ctx.res, {
                        lastChangeTime,
                        etag: SowHttpCache.getEtag(lastChangeTime, cfileSize)
                    }, ctx.server.config.cacheHeader);
                    ctx.res.status(200, {
                        'Content-Type': mimeType,
                        'Content-Encoding': 'gzip',
                        'x-served-from': 'cache-file'
                    });
                    if (useFullOptimization && cachePath) {
                        this._holdCache(cachePath, lastChangeTime, cfileSize);
                    }
                    return Util.pipeOutputStream(cachePath, ctx);
                }
                const rstream: _fs.ReadStream = _fs.createReadStream(absPath);
                const wstream: _fs.WriteStream = _fs.createWriteStream(cachePath);
                return pipeline(rstream, createGzip(), wstream, (gzipErr: NodeJS.ErrnoException | null) => {
                    destroy(rstream); destroy(wstream);
                    return ctx.handleError(gzipErr, (): void => {
                        return _fs.stat(cachePath, (cserr: NodeJS.ErrnoException | null, cstat: _fs.Stats) => {
                            return ctx.handleError(cserr, (): void => {
                                lastChangeTime = cstat.mtime.getTime();
                                SowHttpCache.writeCacheHeader(ctx.res, {
                                    lastChangeTime,
                                    etag: SowHttpCache.getEtag(lastChangeTime, cstat.size)
                                }, ctx.server.config.cacheHeader);
                                ctx.res.status(200, { 'Content-Type': mimeType, 'Content-Encoding': 'gzip' });
                                if (useFullOptimization && cachePath) {
                                    this._holdCache(cachePath, lastChangeTime, cstat.size);
                                }
                                return Util.pipeOutputStream(cachePath, ctx);
                            });
                        });
                    });
                });
            });
        });
    }
    static servedNoChache(
        ctx: IContext, absPath: string,
        mimeType: string, isGzip: boolean,
        size: number
    ): void {
        SowHttpCache.writeCacheHeader(ctx.res, {
            lastChangeTime: void 0,
            etag: void 0
        }, { maxAge: 0, serverRevalidate: true });
        if (ctx.server.config.staticFile.compression && isGzip) {
            ctx.res.status(200, {
                'Content-Type': mimeType,
                'Content-Encoding': 'gzip'
            });
            const rstream: _fs.ReadStream = _fs.createReadStream(absPath);
            return pipeline(rstream, createGzip(), ctx.res, (gzipErr: NodeJS.ErrnoException | null) => {
                destroy(rstream);
            }), void 0;
        }
        ctx.res.status(200, {
            'Content-Type': mimeType, 'Content-Length': size
        });
        return Util.pipeOutputStream(absPath, ctx);
    }
    static servedFromFile(
        ctx: IContext, absPath: string,
        mimeType: string, isGzip: boolean,
        fstat: _fs.Stats
    ): void {
        const reqCachHeader: IChangeHeader = SowHttpCache.getChangedHeader(ctx.req.headers);
        const lastChangeTime: number = fstat.mtime.getTime();
        const curEtag: string = SowHttpCache.getEtag(lastChangeTime, fstat.size);
        if (
            (reqCachHeader.etag && reqCachHeader.etag === curEtag) ||
            (reqCachHeader.sinceModify && reqCachHeader.sinceModify === lastChangeTime)
        ) {
            SowHttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
            ctx.res.status(304, { 'Content-Type': mimeType }).send();
            return ctx.next(304);
        }
        SowHttpCache.writeCacheHeader(ctx.res, {
            lastChangeTime,
            etag: curEtag
        }, ctx.server.config.cacheHeader);
        if (ctx.server.config.staticFile.compression && isGzip) {
            ctx.res.status(200, { 'Content-Type': mimeType, 'Content-Encoding': 'gzip' });
            const rstream: _fs.ReadStream = _fs.createReadStream(absPath);
            return pipeline(rstream, createGzip(), ctx.res, (gzipErr: NodeJS.ErrnoException | null) => {
                destroy(rstream);
            }), void 0;
        }
        ctx.res.status(200, { 'Content-Type': mimeType });
        return Util.pipeOutputStream(absPath, ctx);
    }
    static _render(
        ctx: IContext, mimeType: string, absPath: string,
        stat: _fs.Stats, cachePath: string
    ): void {
        ctx.req.setSocketNoDelay(true);
        if (ctx.path.indexOf('favicon.ico') > -1) {
            SowHttpCache.writeCacheHeader(ctx.res, {
                lastChangeTime: void 0, etag: void 0
            }, {
                maxAge: ctx.server.config.cacheHeader.maxAge,
                serverRevalidate: false
            });
            ctx.res.status(200, { 'Content-Type': mimeType });
            return Util.pipeOutputStream(absPath, ctx);
        }
        if (ctx.server.config.liveStream.indexOf(ctx.extension) > -1) {
            return Streamer.stream(ctx, absPath, mimeType, stat);
        }
        let noCache: boolean = false;
        const taskDeff: ITaskDeff | undefined = TaskDeff.find(a => a.ext === ctx.extension);
        let isGzip: boolean = (!ctx.server.config.staticFile.compression ? false : SowHttpCache.isAcceptedEncoding(ctx.req.headers, "gzip"));
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
            return this.servedNoChache(ctx, absPath, mimeType, isGzip, stat.size);
        }
        if (!isGzip || (ctx.server.config.staticFile.fileCache === false)) {
            return this.servedFromFile(ctx, absPath, mimeType, isGzip, stat);
        }
        return this.servedFromServerFileCache(ctx, absPath, mimeType, stat, cachePath);
    }
    static render(
        ctx: IContext, mimeType: string,
        maybeDir?: string
    ): void {
        const cachePath: string | void = ctx.server.config.staticFile.fileCache ? this.getCachePath(ctx) : undefined;
        const useFullOptimization: boolean = ctx.server.config.useFullOptimization;
        if (cachePath) {
            if (useFullOptimization && _mamCache[cachePath]) {
                return this._sendFromMemCache(ctx, mimeType, _mamCache[cachePath]);
            }
        }
        const absPath: string = typeof (maybeDir) === "string" && maybeDir ? _path.resolve(`${maybeDir}/${ctx.path}`) : ctx.server.mapPath(ctx.path);
        return _fs.stat(absPath, (err: NodeJS.ErrnoException | null, stats: _fs.Stats): void => {
            return ctx.handleError(null, () => {
                if (err) return ctx.next(404, true);
                return this._render(ctx, mimeType, absPath, stats, cachePath || "");
            });
        });
    }
}
export class HttpMimeHandler implements IHttpMimeHandler {
    getMimeType(extension: string): string {
        return _mimeType.getMimeType(extension);
    }
    isValidExtension(extension: string): boolean {
        return _mimeType.isValidExtension(extension);
    }
    render(ctx: IContext, maybeDir?: string): void {
        if (!_mimeType.isValidExtension(ctx.extension)) {
            return ctx.transferRequest(404);
        }
        return MimeHandler.render(ctx, _mimeType.getMimeType(ctx.extension), maybeDir);
    }
}
// 11:38 PM 5/4/2020