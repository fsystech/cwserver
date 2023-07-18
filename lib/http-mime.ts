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

// 9:22 PM 5/4/2020
// by rajib chy
import * as _fs from 'node:fs';
import * as _path from 'node:path';
import * as _zlib from 'node:zlib';
import { pipeline } from 'node:stream';
import destroy = require('destroy');
import * as _mimeType from './http-mime-types';
import { IContext } from './server';
import { HttpCache, IChangeHeader } from './http-cache';
import { Streamer } from './web-streamer';
import { Encryption } from './encryption';
import { Util } from './app-util';
import { FileInfoCacheHandler, IFileInfoCacheHandler, IFileDescription } from './file-info';
export interface IHttpMimeHandler {
    render(ctx: IContext, maybeDir?: string): void;
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
    static _fileInfo: IFileInfoCacheHandler = new FileInfoCacheHandler();
    static getCachePath(ctx: IContext): string {
        const path: string = _path.join(ctx.server.config.staticFile.tempPath, Encryption.toMd5(ctx.path));
        // const path: string = `${ctx.server.config.staticFile.tempPath}\\${Encryption.toMd5(ctx.path)}`;
        return _path.resolve(`${path}.${ctx.extension}.cache`);
    }
    static _sendFromMemCache(ctx: IContext, mimeType: string, dataInfo: MemCacheInfo): void {
        const reqCacheHeader: IChangeHeader = HttpCache.getChangedHeader(ctx.req.headers);
        const etag: string = HttpCache.getEtag(dataInfo.lastChangeTime, dataInfo.cfileSize);
        ctx.res.setHeader('x-served-from', 'mem-cache');
        if (reqCacheHeader.etag || reqCacheHeader.sinceModify) {
            let exit: boolean = false;
            if (reqCacheHeader.etag) {
                if (reqCacheHeader.etag === etag) {
                    HttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                    ctx.res.status(304, { 'Content-Type': mimeType }).send();
                    return process.nextTick(() => ctx.next(304));
                }
                exit = true;
            }
            if (reqCacheHeader.sinceModify && !exit) {
                HttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                ctx.res.status(304, { 'Content-Type': mimeType }).send();
                return process.nextTick(() => ctx.next(304));
            }
        }
        HttpCache.writeCacheHeader(ctx.res, {
            lastChangeTime: dataInfo.lastChangeTime,
            etag: HttpCache.getEtag(dataInfo.lastChangeTime, dataInfo.cfileSize)
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
        const reqCacheHeader: IChangeHeader = HttpCache.getChangedHeader(ctx.req.headers);
        return this._fileInfo.stat(cachePath, (desc: IFileDescription): void => {
            const existsCachFile: boolean = desc.exists;
            return ctx.handleError(null, () => {
                let lastChangeTime: number = 0, cfileSize: number = 0;
                if (existsCachFile && desc.stats) {
                    cfileSize = desc.stats.size;
                    lastChangeTime = desc.stats.mtime.getTime();
                }
                let hasChanged: boolean = true;
                if (existsCachFile) {
                    hasChanged = fstat.mtime.getTime() > lastChangeTime;
                }
                const etag: string | undefined = cfileSize !== 0 ? HttpCache.getEtag(lastChangeTime, cfileSize) : void 0;
                if (!hasChanged && existsCachFile && (reqCacheHeader.etag || reqCacheHeader.sinceModify)) {
                    let exit: boolean = false;
                    if (etag && reqCacheHeader.etag) {
                        if (reqCacheHeader.etag === etag) {
                            HttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                            ctx.res.status(304, { 'Content-Type': mimeType }).send();
                            if (useFullOptimization && cachePath) {
                                this._holdCache(cachePath, lastChangeTime, cfileSize);
                            }
                            return ctx.next(304);
                        }
                        exit = true;
                    }
                    if (reqCacheHeader.sinceModify && !exit) {
                        HttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                        ctx.res.status(304, { 'Content-Type': mimeType }).send();
                        if (useFullOptimization && cachePath) {
                            this._holdCache(cachePath, lastChangeTime, cfileSize);
                        }
                        return ctx.next(304);
                    }
                }
                if (!hasChanged && existsCachFile) {
                    HttpCache.writeCacheHeader(ctx.res, {
                        lastChangeTime,
                        etag: HttpCache.getEtag(lastChangeTime, cfileSize)
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
                        return this._fileInfo.stat(cachePath, (cdesc: IFileDescription) => {
                            return ctx.handleError(null, (): void => {
                                if (!cdesc.stats) {
                                    ctx.next(404, true);
                                    return;
                                }
                                lastChangeTime = cdesc.stats.mtime.getTime();
                                HttpCache.writeCacheHeader(ctx.res, {
                                    lastChangeTime,
                                    etag: HttpCache.getEtag(lastChangeTime, cdesc.stats.size)
                                }, ctx.server.config.cacheHeader);
                                ctx.res.status(200, { 'Content-Type': mimeType, 'Content-Encoding': 'gzip' });
                                if (useFullOptimization && cachePath) {
                                    this._holdCache(cachePath, lastChangeTime, cdesc.stats.size);
                                }
                                return Util.pipeOutputStream(cachePath, ctx);
                            });
                        }, true);
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
        HttpCache.writeCacheHeader(ctx.res, {
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
        const reqCachHeader: IChangeHeader = HttpCache.getChangedHeader(ctx.req.headers);
        const lastChangeTime: number = fstat.mtime.getTime();
        const curEtag: string = HttpCache.getEtag(lastChangeTime, fstat.size);
        if (
            (reqCachHeader.etag && reqCachHeader.etag === curEtag) ||
            (reqCachHeader.sinceModify && reqCachHeader.sinceModify === lastChangeTime)
        ) {
            HttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
            ctx.res.status(304, { 'Content-Type': mimeType }).send();
            return process.nextTick(() => ctx.next(304));
        }
        HttpCache.writeCacheHeader(ctx.res, {
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
            HttpCache.writeCacheHeader(ctx.res, {
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
        let isGzip: boolean = (!ctx.server.config.staticFile.compression ? false : HttpCache.isAcceptedEncoding(ctx.req.headers, "gzip"));
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
        return this._fileInfo.stat(absPath, (desc: IFileDescription): void => {
            return ctx.handleError(null, () => {
                if (!desc.stats) return ctx.next(404, true);
                return this._render(ctx, mimeType, absPath, desc.stats, cachePath || "");
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