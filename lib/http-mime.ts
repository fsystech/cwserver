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

// 9:22 PM 5/4/2020
// by rajib chy
import * as _fs from 'node:fs';
import * as _path from 'node:path';
import * as _zlib from 'node:zlib';
import { pipeline } from 'node:stream';
import { promisify } from "node:util";
import destroy from 'destroy';
import * as _mimeType from './http-mime-types';
import type { IContext } from './context';
import { HttpCache } from './http-cache';
import { Streamer } from './web-streamer';
import { Encryption } from './encryption';
import { Util } from './app-util';
import { FileInfoCacheHandler, type IFileInfoCacheHandler } from './file-info';
const _fsp = _fs.promises;

const pipelineAsync = promisify(pipeline);

export interface IHttpMimeHandler {
    renderAsync(
        ctx: IContext, maybeDir?: string
    ): Promise<void>;
    getMimeType(extension: string): string;
    isValidExtension(extension: string): boolean;
}

type MemCacheInfo = {
    readonly cfileSize: number;
    readonly gizipData: Buffer;
    readonly lastChangeTime: number;
};

interface ITaskDeff {
    cache: boolean; ext: string; gzip: boolean;
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

/** Raw (not compressed) static files, held in memory when `useFullOptimization` is on. */
type RawCacheInfo = {
    readonly size: number;
    readonly mtime: number;
    readonly data: Buffer;
};

/** Files larger than this are always streamed from disk. */
const RAW_CACHE_MAX_FILE_SIZE = 512 * 1024;
/** Maximum number of files held in the raw cache. */
const RAW_CACHE_MAX_ENTRIES = 512;

class MimeHandler {
    private static _mamCache: Map<string, MemCacheInfo> = new Map();
    private static _rawCache: Map<string, RawCacheInfo> = new Map();
    private static _fileInfo: IFileInfoCacheHandler = new FileInfoCacheHandler();

    /**
     * Builds the absolute path of the on-disk gzip cache file for the requested resource, from the temp
     * path and an MD5 of the request path plus its extension.
     *
     * @param ctx Request context providing the server config, request path and extension.
     * @returns Absolute path of the .cache file.
     */
    private static getCachePath(ctx: IContext): string {

        const path = _path.join(
            ctx.server.config.staticFile.tempPath, Encryption.toMd5(ctx.path)
        );

        return _path.resolve(`${path}.${ctx.extension}.cache`);
    }

    /**
     * Serves a gzip-compressed response from the in-memory cache, replying 304 when the client's ETag or
     * modified-since validators match. Sets the x-served-from header to mem-cache.
     *
     * @param ctx Request context used to read validators and write the response.
     * @param mimeType Content-Type value to send.
     * @param dataInfo Cached entry holding the gzip data, size and last change time.
     */
    private static _sendFromMemCache(
        ctx: IContext, mimeType: string, dataInfo: MemCacheInfo
    ): void {

        const reqCacheHeader = HttpCache.getChangedHeader(ctx.req.headers);
        const etag = HttpCache.getEtag(dataInfo.lastChangeTime, dataInfo.cfileSize);

        ctx.res.setHeader(
            'x-served-from', 'mem-cache'
        );

        if (reqCacheHeader.etag || reqCacheHeader.sinceModify) {

            let exit = false;

            if (reqCacheHeader.etag) {

                if (reqCacheHeader.etag === etag) {
                    HttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                    ctx.res.status(304, { 'Content-Type': mimeType }).send();
                    return;
                }

                exit = true;
            }

            if (reqCacheHeader.sinceModify && !exit) {
                HttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                ctx.res.status(304, { 'Content-Type': mimeType }).send();
                return;
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

    /**
     * Loads a gzip cache file into the in-memory cache unless it is already held there.
     *
     * @param cachePath Path of the cache file, also used as the cache key.
     * @param lastChangeTime Modification time of the cache file in milliseconds.
     * @param size Size of the cache file in bytes.
     * @returns Promise that resolves once the entry is stored (or already present).
     */
    private static async _holdCacheAsync(
        cachePath: string,
        lastChangeTime: number, size: number
    ): Promise<void> {
        if (this._mamCache.has(cachePath))
            return;

        const data = await _fsp.readFile(cachePath);

        this._mamCache.set(cachePath, {
            lastChangeTime,
            cfileSize: size,
            gizipData: data
        });
    }

    /**
     * Serves a gzip response using an on-disk cache file, honouring ETag and modified-since validators
     * with 304 replies. Regenerates the cache file when the source is newer or missing, and optionally
     * promotes it to the memory cache.
     *
     * @param ctx Request context used to read headers and write the response.
     * @param absPath Absolute path of the source file.
     * @param mimeType Content-Type value to send.
     * @param fstat File stats of the source file, used to detect changes.
     * @param cachePath Path of the gzip cache file.
     * @returns Promise that resolves when the response has been sent or an error has been transferred.
     */
    private static async servedFromServerFileCacheAsync(
        ctx: IContext, absPath: string, mimeType: string,
        fstat: _fs.Stats, cachePath: string
    ): Promise<void> {

        const useFullOptimization = ctx.server.config.useFullOptimization;
        const reqCacheHeader = HttpCache.getChangedHeader(ctx.req.headers);

        const desc = await this._fileInfo.statAsync(cachePath);
        const existsCachFile: boolean = desc.exists;

        let lastChangeTime = 0, cfileSize = 0;

        if (existsCachFile && desc.stats) {
            cfileSize = desc.stats.size;
            lastChangeTime = desc.stats.mtime.getTime();
        }

        let hasChanged = true;
        if (existsCachFile) {
            hasChanged = fstat.mtime.getTime() > lastChangeTime;
        }

        const etag = cfileSize !== 0 ? HttpCache.getEtag(lastChangeTime, cfileSize) : undefined;

        if (!hasChanged && existsCachFile && (reqCacheHeader.etag || reqCacheHeader.sinceModify)) {

            let exit: boolean = false;

            if (etag && reqCacheHeader.etag) {

                if (reqCacheHeader.etag === etag) {

                    HttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
                    ctx.res.status(304, { 'Content-Type': mimeType }).send();

                    if (useFullOptimization && cachePath) {
                        await this._holdCacheAsync(cachePath, lastChangeTime, cfileSize);
                    }

                    return;
                }

                exit = true;
            }

            if (reqCacheHeader.sinceModify && !exit) {

                HttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);

                ctx.res.status(304, { 'Content-Type': mimeType }).send();

                if (useFullOptimization && cachePath) {
                    await this._holdCacheAsync(cachePath, lastChangeTime, cfileSize);
                }

                return;
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

            await Util.pipeOutputStreamAsync(cachePath, ctx);

            if (useFullOptimization && cachePath) {
                await this._holdCacheAsync(cachePath, lastChangeTime, cfileSize);
            }

            return;
        }

        const rstream: _fs.ReadStream = _fs.createReadStream(absPath);
        const wstream: _fs.WriteStream = _fs.createWriteStream(cachePath);

        try {

            await pipelineAsync(
                rstream, Util.createGzip(), wstream
            );

            if (ctx.isDisposed)
                return;

            const cdesc = await this._fileInfo.statAsync(cachePath, true);

            if (ctx.isDisposed)
                return;

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

            await Util.pipeOutputStreamAsync(
                cachePath, ctx
            );

            if (useFullOptimization && cachePath) {
                await this._holdCacheAsync(cachePath, lastChangeTime, cdesc.stats.size);
            }

            return;

        } catch (ex: any) {
            ctx.transferError(ex);
        } finally {
            destroy(rstream);
            destroy(wstream);
        }
    }

    /**
     * Serves a file with caching disabled (max-age 0, server revalidate), gzip-compressing it on the fly
     * when compression is enabled and allowed, otherwise streaming it raw with its length.
     *
     * @param ctx Request context used to write the response.
     * @param absPath Absolute path of the file to send.
     * @param mimeType Content-Type value to send.
     * @param isGzip Whether the response should be gzip-compressed.
     * @param size File size in bytes, used as Content-Length for uncompressed output.
     * @returns Promise that resolves when the file has been streamed.
     */
    private static async servedNoChacheAsync(
        ctx: IContext, absPath: string,
        mimeType: string, isGzip: boolean,
        size: number
    ): Promise<void> {

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

            try {

                await pipelineAsync(
                    rstream, Util.createGzip(Util.GZIP_STREAM_LEVEL), ctx.res
                );

            } catch (ex: any) {
                ctx.transferError(ex);
            } finally {
                destroy(rstream);
            }

            return;
        }

        ctx.res.status(200, {
            'Content-Type': mimeType, 'Content-Length': size
        });

        await Util.pipeOutputStreamAsync(
            absPath, ctx
        );
    }

    /**
     * Serves a file directly with cache headers, replying 304 when validators match. Streams gzip when
     * enabled, serves small files from the raw memory cache under full optimization, or streams the file
     * as-is.
     *
     * @param ctx Request context used to read headers and write the response.
     * @param absPath Absolute path of the file to send.
     * @param mimeType Content-Type value to send.
     * @param isGzip Whether the response should be gzip-compressed.
     * @param fstat File stats used to compute the ETag and modification time.
     * @returns Promise that resolves when the response has been sent.
     */
    private static async servedFromFileAsync(
        ctx: IContext, absPath: string,
        mimeType: string, isGzip: boolean,
        fstat: _fs.Stats
    ): Promise<void> {

        const reqCachHeader = HttpCache.getChangedHeader(ctx.req.headers);
        const lastChangeTime = fstat.mtime.getTime();
        const curEtag = HttpCache.getEtag(lastChangeTime, fstat.size);

        if (
            (reqCachHeader.etag && reqCachHeader.etag === curEtag) ||
            (reqCachHeader.sinceModify && reqCachHeader.sinceModify === lastChangeTime)
        ) {
            HttpCache.writeCacheHeader(ctx.res, {}, ctx.server.config.cacheHeader);
            ctx.res.status(304, { 'Content-Type': mimeType }).send();
            return;
        }

        HttpCache.writeCacheHeader(ctx.res, {
            lastChangeTime,
            etag: curEtag
        }, ctx.server.config.cacheHeader);

        if (ctx.server.config.staticFile.compression && isGzip) {

            ctx.res.status(200, { 'Content-Type': mimeType, 'Content-Encoding': 'gzip' });
            const rstream: _fs.ReadStream = _fs.createReadStream(absPath);

            try {

                await pipelineAsync(
                    rstream, Util.createGzip(Util.GZIP_STREAM_LEVEL), ctx.res
                );

            } catch (ex: any) {
                ctx.transferError(ex);
            } finally {
                destroy(rstream);
            }

            return;
        }

        if (
            ctx.server.config.useFullOptimization
            && fstat.size <= RAW_CACHE_MAX_FILE_SIZE
        ) {
            return await this._sendRaw(ctx, absPath, mimeType, fstat);
        }

        ctx.res.status(200, { 'Content-Type': mimeType });
        await Util.pipeOutputStreamAsync(absPath, ctx);
    }

    /**
     * Serve a small, uncompressed file from memory.
     * The cache entry is validated against the `stat` of the file.
     */
    private static async _sendRaw(
        ctx: IContext, absPath: string, mimeType: string, fstat: _fs.Stats
    ): Promise<void> {

        const mtime = fstat.mtime.getTime();
        let info = this._rawCache.get(absPath);

        if (!info || info.mtime !== mtime || info.size !== fstat.size) {

            let data: Buffer;

            try {
                data = await _fsp.readFile(absPath);
            } catch (ex: any) {
                if (ctx.isDisposed)
                    return;
                return ctx.transferError(ex);
            }

            if (this._rawCache.size >= RAW_CACHE_MAX_ENTRIES) {
                // Map keeps insertion order; drop the oldest entry
                this._rawCache.delete(this._rawCache.keys().next().value);
            }

            info = { size: fstat.size, mtime, data };
            this._rawCache.set(absPath, info);
        }

        if (ctx.isDisposed)
            return;

        ctx.res.status(200, {
            'Content-Type': mimeType, 'Content-Length': info.data.length
        }).end(info.data);
    }

    /**
     * Chooses the delivery strategy for a static file (favicon, live streaming, no-cache, plain file or
     * server file cache) based on config, extension rules and the client's accepted encoding.
     *
     * @param ctx Request context for the current request.
     * @param mimeType Content-Type value to send.
     * @param absPath Absolute path of the file to serve.
     * @param stat File stats of the file.
     * @param cachePath Path of the gzip cache file, or empty when file caching is off.
     * @returns Promise that resolves when the response has been handled.
     */
    private static async _renderAsync(
        ctx: IContext, mimeType: string, absPath: string,
        stat: _fs.Stats, cachePath: string
    ): Promise<void> {

        ctx.req.setSocketNoDelay(true);

        if (ctx.path.indexOf('favicon.ico') > -1) {

            HttpCache.writeCacheHeader(ctx.res, {
                lastChangeTime: void 0, etag: void 0
            }, {
                maxAge: ctx.server.config.cacheHeader.maxAge,
                serverRevalidate: false
            });

            ctx.res.status(200, { 'Content-Type': mimeType });

            return await Util.pipeOutputStreamAsync(absPath, ctx);
        }

        if (ctx.server.config.liveStream.indexOf(ctx.extension) > -1) {
            return Streamer.stream(ctx, absPath, mimeType, stat);
        }

        let noCache = false;

        const taskDeff = TaskDeff.find(a => a.ext === ctx.extension);

        let isGzip: boolean = (
            !ctx.server.config.staticFile.compression ? false : HttpCache.isAcceptedEncoding(ctx.req.headers, "gzip")
        );

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
            return await this.servedNoChacheAsync(
                ctx, absPath, mimeType, isGzip, stat.size
            );
        }

        if (!isGzip || (ctx.server.config.staticFile.fileCache === false)) {
            return await this.servedFromFileAsync(
                ctx, absPath, mimeType, isGzip, stat
            );
        }

        return await this.servedFromServerFileCacheAsync(
            ctx, absPath, mimeType, stat, cachePath
        );
    }

    /**
     * Resolves and serves a static file for the request, using the memory cache when available. Responds
     * with 404 when the file does not exist.
     *
     * @param ctx Request context for the current request.
     * @param mimeType Content-Type value to send.
     * @param maybeDir Optional base directory to resolve the request path against instead of the server's mapped path.
     * @returns Promise that resolves when the response has been handled.
     */
    public static async renderAsync(
        ctx: IContext, mimeType: string,
        maybeDir?: string
    ): Promise<void> {

        const cachePath = ctx.server.config.staticFile.fileCache ? this.getCachePath(ctx) : undefined;
        const useFullOptimization = ctx.server.config.useFullOptimization;

        if (cachePath) {
            if (useFullOptimization && this._mamCache.has(cachePath)) {
                return this._sendFromMemCache(
                    ctx, mimeType, this._mamCache.get(cachePath)
                );
            }
        }

        const absPath: string = typeof (maybeDir) === "string" && maybeDir ? _path.resolve(`${maybeDir}/${ctx.path}`) : ctx.server.mapPath(ctx.path);

        const desc = await this._fileInfo.statAsync(absPath);

        if (ctx.isDisposed)
            return;

        if (!desc.stats)
            return ctx.next(404, true);

        await this._renderAsync(
            ctx, mimeType, absPath, desc.stats, cachePath || ""
        );
    }
}

export class HttpMimeHandler implements IHttpMimeHandler {
    /**
     * Looks up the MIME type for a file extension, adding a UTF-8 charset for text and JS/JSON types.
     * Throws when the extension is unsupported.
     *
     * @param extension File extension or file name to look up.
     * @returns The MIME type string.
     */
    public getMimeType(extension: string): string {
        return _mimeType.getMimeType(extension);
    }

    /**
     * Checks whether a MIME type is registered for the given extension.
     *
     * @param extension Extension to check (without a leading dot).
     * @returns True if the extension is supported, otherwise false.
     */
    public isValidExtension(extension: string): boolean {
        return _mimeType.isValidExtension(extension);
    }

    /**
     * Serves the static file for the current request with the MIME type matching its extension. Transfers
     * a 404 when the extension is not supported.
     *
     * @param ctx Request context for the current request.
     * @param maybeDir Optional base directory to resolve the request path against.
     * @returns Promise that resolves when the response has been handled.
     */
    public async renderAsync(ctx: IContext, maybeDir?: string): Promise<void> {

        if (!_mimeType.isValidExtension(ctx.extension)) {
            return ctx.transferRequest(404);
        }

        return await MimeHandler.renderAsync(
            ctx, _mimeType.getMimeType(ctx.extension), maybeDir
        );
    }
}
// 11:38 PM 5/4/2020