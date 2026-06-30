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

// 4:48 PM 5/3/2020
// by rajib chy
import * as _fs from 'node:fs';
import * as _path from 'node:path';
import * as _zlib from 'node:zlib';
import { Encryption } from './encryption';
import { HttpCache } from './http-cache';
import { IApplication } from './server-core';
import type { ICwServer } from './server';
import type { IController } from './app-controller';
import { Util } from './app-util';
import type { IContext } from './context';
import { type IBufferArray, BufferArray } from './app-static';
import { FileInfoCacheHandler, type IFileInfoCacheHandler } from './file-info';
import { promisify } from "node:util";

const _fsp = _fs.promises;
const gzipAsync = promisify(_zlib.gzip);

enum ContentType {
    JS = 0,
    CSS = 1,
    UNKNOWN = -1
}

type BundlerFileInfo = { name: string, absolute: string, changeTime: number, isChange: boolean, iCwn: boolean };

type MemCacheInfo = {
    readonly cfileSize: number;
    readonly bundleData: Buffer;
    readonly lastChangeTime: number;
}

class Bundel {
    public static cache: Map<string, MemCacheInfo> = null;
    public static fi: IFileInfoCacheHandler = null;

    public static init(): void {
        if (this.cache)
            return;

        this.cache = new Map();
        this.fi = new FileInfoCacheHandler();
    }
}

Bundel.init();

class Bundlew {

    public static getResponseContentType(ctEnum: ContentType): string {
        if (ctEnum === ContentType.JS)
            return "application/x-javascript; charset=utf-8";
        return "text/css";
    }

    public static getContentType(ct: string): ContentType {
        switch (ct.toLowerCase()) {
            case "text/javascript": return ContentType.JS;
            case "text/css": return ContentType.CSS;
        }
        return ContentType.UNKNOWN;
    }

    public static getCachePath(
        server: ICwServer, str: string, ctEnum: ContentType, cacheKey: string
    ): {
        readonly memCacheKey: string,
        readonly cachpath: string
    } {

        let fileName: string = `${cacheKey.replace(/[/\\?%*:|"<>]/g, "")}_${Encryption.toMd5(str)}`;
        if (ctEnum === ContentType.JS) {
            fileName = `${fileName}.js.cache`
        } else {
            fileName = `${fileName}.css.cache`
        }

        return {
            memCacheKey: fileName,
            cachpath: _path.join(server.config.bundler.tempPath, fileName)
        };
    }

    private static async getFileInfoAsync(
        server: ICwServer, file: string, lchangeTime?: number
    ): Promise<BundlerFileInfo> {

        let fname: string = file;
        let iCwn: boolean = false;

        if (fname.indexOf("|") > 0) {
            const spl: string[] = fname.split("|");
            fname = spl[0];
            if (spl[1] === "__owner__") iCwn = true;
            spl.length = 0;
        }

        if (/\$/gi.test(fname) === false) {
            fname = `$root/$public/${fname}`;
        }

        let absolute: string = "";

        if (/\$virtual/gi.test(fname)) {

            absolute = _path.resolve(fname.replace(/\$.+?\//gi, (m) => {
                const vinfo = server.virtualInfo(`/${m.split("_")[1].replace("/", "")}`);
                if (!vinfo) throw new Error(`No virtual info found for ${fname}`);
                return `${vinfo.root}/`;
            }));

        } else {

            absolute = server.formatPath(fname, true);

        }

        const desc = await Bundel.fi.statAsync(absolute);

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
        }
    }

    public static async getBundleInfoAsync(
        server: ICwServer, str: string,
        lastChangeTime: number | void,
        hasCacheFile: boolean
    ): Promise<BundlerFileInfo[]> {


        if (hasCacheFile && !server.config.bundler.reValidate) {
            return [];
        }

        const lchangeTime: number = typeof (lastChangeTime) === "number" ? lastChangeTime : 0;
        const files: string[] = str.split(",");

        return await Promise.all(
            files.map(async file => await this.getFileInfoAsync(
                server, file, lchangeTime
            ))
        );
    }

    public static async readBufferAsync(
        ctx: IContext,
        files: BundlerFileInfo[], copyright: string
    ): Promise<IBufferArray> {

        const out: IBufferArray = new BufferArray();

        let istr: string = _getInfo();

        for (let index = 0, l = files.length; index < l; index++) {
            const inf = files[index];
            istr += `// ${index + 1}==>${inf.name}\r\n`;
        }

        istr += "// Generated on- " + new Date().toString() + "\r\n";

        out.push(Buffer.from(istr));
        const copyBuff = Buffer.from(copyright);

        for (const inf of files) {

            if (ctx.isDisposed)
                return null;

            out.push(`\r\n// ${inf.name}\r\n`);

            if (inf.iCwn === true) {

                out.push(copyBuff);

                if (!inf.name.includes(".min.")) {

                    const data = await _fsp.readFile(inf.absolute, "utf8");
                    out.push(Buffer.from(data.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "").replace(/^\s*$(?:\r\n?|\n)/gm, "")));/** Replace Comment and empty line */
                    continue;
                }
            }

            out.push(await _fsp.readFile(inf.absolute));
        }

        return out;
    }

    private static decryptFilePath(
        server: ICwServer, ctx: IContext, str: string
    ): string | void {

        str = server.encryption.decryptUri(str);

        if (str.length === 0) {
            return ctx.next(404), void 0;
        }

        return str.replace(/\r\n/gi, "").replace(/\s+/g, "");
    }

    public static async createMemmoryAsync(
        server: ICwServer, ctx: IContext, isGzip: boolean
    ): Promise<void> {

        const ct = ctx.req.query.ct;
        const str = ctx.req.query.g;

        if (!str || !ct) {
            return ctx.next(404);
        }

        const cte = this.getContentType(ct.toString());

        if (cte === ContentType.UNKNOWN)
            return ctx.next(404);

        const desc = this.decryptFilePath(
            server, ctx, str.toString()
        );
        if (!desc)
            return;

        const cngHander = HttpCache.getChangedHeader(
            ctx.req.headers
        );

        try {

            const files = await this.getBundleInfoAsync(
                server, desc.toString(), cngHander.sinceModify, false
            );

            if (ctx.isDisposed)
                return;

            let hasChanged: boolean = true;

            if (cngHander.sinceModify) {
                hasChanged = files.some(a => a.isChange === true);
            }

            HttpCache.writeCacheHeader(ctx.res, {
                lastChangeTime: Date.now()
            }, server.config.cacheHeader);

            if (!hasChanged) {

                ctx.res.status(
                    304, { 'Content-Type': this.getResponseContentType(cte) }
                );

                return ctx.res.end(), void 0;
            }

            const buffer = await this.readBufferAsync(ctx, files, server.copyright());

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

            return _responseWriteGzip(
                ctx, buffer, cte
            );

        } catch (ex: any) {
            ctx.transferError(ex);
        }
    }

    private static _sendFromMemCache(
        ctx: IContext, cte: ContentType, dataInfo: MemCacheInfo
    ): void {

        const etag = dataInfo.cfileSize !== 0 ? HttpCache.getEtag(
            dataInfo.lastChangeTime, dataInfo.cfileSize
        ) : undefined;

        const cngHander = HttpCache.getChangedHeader(
            ctx.req.headers
        );

        ctx.res.setHeader('x-served-from', 'mem-cache');

        if (cngHander.etag || cngHander.sinceModify) {

            let exit: boolean = false;

            if (etag && cngHander.etag) {

                if (cngHander.etag === etag) {

                    HttpCache.writeCacheHeader(
                        ctx.res, {}, ctx.server.config.cacheHeader
                    );

                    ctx.res.status(
                        304, { 'Content-Type': this.getResponseContentType(cte) }
                    ).send();

                    return;
                }

                exit = true;
            }

            if (cngHander.sinceModify && !exit) {

                HttpCache.writeCacheHeader(
                    ctx.res, {}, ctx.server.config.cacheHeader
                );

                ctx.res.status(
                    304, { 'Content-Type': this.getResponseContentType(cte) }
                ).send();

                return;
            }
        }

        HttpCache.writeCacheHeader(ctx.res, {
            lastChangeTime: dataInfo.lastChangeTime,
            etag: HttpCache.getEtag(dataInfo.lastChangeTime, dataInfo.cfileSize)
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

    private static async _holdCacheAsync(
        cacheKey: string, cachePath: string,
        lastChangeTime: number, size: number
    ): Promise<void> {

        if (Bundel.cache.has(cacheKey))
            return;

        const data = await _fsp.readFile(cachePath);

        Bundel.cache.set(cacheKey, {
            lastChangeTime,
            cfileSize: size,
            bundleData: data
        });
    }

    public static async createServerFileCacheAsync(
        server: ICwServer, ctx: IContext
    ): Promise<void> {

        const cacheKey = ctx.req.query.ck;
        const ct = ctx.req.query.ct;
        const str = ctx.req.query.g;

        if (!str || !cacheKey || !ct) {
            return ctx.next(404);
        }

        const cte = this.getContentType(ct.toString());

        if (cte === ContentType.UNKNOWN)
            return ctx.next(404);

        const desc = this.decryptFilePath(
            server, ctx, str.toString()
        );

        if (!desc)
            return;

        const useFullOptimization = server.config.useFullOptimization;

        const { cachpath, memCacheKey } = this.getCachePath(
            server, desc.toString(), cte, cacheKey.toString()
        );

        if (useFullOptimization && Bundel.cache.has(memCacheKey)) {
            return this._sendFromMemCache(
                ctx, cte, Bundel.cache.get(memCacheKey)
            );
        }

        const cngHander = HttpCache.getChangedHeader(ctx.req.headers);

        try {

            const fdesc = await Bundel.fi.statAsync(cachpath);
            if (ctx.isDisposed)
                return;

            let lastChangeTime: number = 0, cfileSize: number = 0;

            if (fdesc.exists && fdesc.stats) {
                cfileSize = fdesc.stats.size;
                lastChangeTime = fdesc.stats.mtime.getTime();
            }

            const files = await this.getBundleInfoAsync(
                server, desc.toString(), lastChangeTime, fdesc.exists
            );

            if (ctx.isDisposed)
                return;

            let hasChanged: boolean = true;

            if (fdesc.exists) {
                hasChanged = files.some(a => a.isChange === true);
            }

            const etag = cfileSize !== 0 ? HttpCache.getEtag(lastChangeTime, cfileSize) : undefined;

            if (!hasChanged && fdesc.exists && (cngHander.etag || cngHander.sinceModify)) {

                let exit: boolean = false;

                if (etag && cngHander.etag) {

                    if (cngHander.etag === etag) {
                        HttpCache.writeCacheHeader(ctx.res, {}, server.config.cacheHeader);
                        ctx.res.status(304, { 'Content-Type': this.getResponseContentType(cte) }).send();
                        return ctx.next(304);
                    }

                    exit = true;
                }

                if (cngHander.sinceModify && !exit) {
                    HttpCache.writeCacheHeader(ctx.res, {}, server.config.cacheHeader);
                    ctx.res.status(304, { 'Content-Type': this.getResponseContentType(cte) }).send();
                    return ctx.next(304);
                }
            }

            if (!hasChanged && fdesc.exists) {

                HttpCache.writeCacheHeader(ctx.res, {
                    lastChangeTime,
                    etag: HttpCache.getEtag(lastChangeTime, cfileSize)
                }, server.config.cacheHeader);

                ctx.res.status(200, {
                    'Content-Type': this.getResponseContentType(cte),
                    'Content-Length': cfileSize,
                    'x-served-from': 'file-cache'
                });

                if (server.config.bundler.compress) {
                    ctx.res.setHeader('Content-Encoding', 'gzip');
                }

                await Util.pipeOutputStreamAsync(cachpath, ctx);

                if (useFullOptimization) {

                    await this._holdCacheAsync(
                        memCacheKey, cachpath, lastChangeTime, cfileSize
                    );

                }

                return;
            }

            const buffer = await this.readBufferAsync(ctx, files, server.copyright());
            if (ctx.isDisposed)
                return;

            if (!server.config.bundler.compress) {

                await _fsp.writeFile(cachpath, buffer.data);
                if (ctx.isDisposed)
                    return;

                const cdesc = await Bundel.fi.statAsync(cachpath, true);
                if (ctx.isDisposed)
                    return;

                if (!cdesc.stats)
                    return ctx.next(404);

                lastChangeTime = cdesc.stats.mtime.getTime();

                HttpCache.writeCacheHeader(ctx.res, {
                    lastChangeTime,
                    etag: HttpCache.getEtag(lastChangeTime, cdesc.stats.size)
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

            const gbuff = await gzipAsync(buffer.data);
            buffer.dispose();

            if (ctx.isDisposed)
                return;

            await _fsp.writeFile(cachpath, gbuff);

            if (ctx.isDisposed)
                return;

            const edesc = await Bundel.fi.statAsync(cachpath, true);
            if (ctx.isDisposed)
                return;

            if (!edesc.stats)
                return ctx.next(404);

            lastChangeTime = edesc.stats.mtime.getTime();

            HttpCache.writeCacheHeader(ctx.res, {
                lastChangeTime,
                etag: HttpCache.getEtag(lastChangeTime, edesc.stats.size)
            }, server.config.cacheHeader);

            ctx.res.status(200, {
                'Content-Type': this.getResponseContentType(cte),
                'Content-Encoding': 'gzip',
                'Content-Length': gbuff.length
            });

            if (useFullOptimization) {
                Bundel.cache.set(memCacheKey, {
                    lastChangeTime,
                    bundleData: gbuff,
                    cfileSize: edesc.stats.size
                });
            }

            ctx.res.end(gbuff);

        } catch (ex: any) {
            ctx.transferError(ex);
        }
    }
}
// tslint:disable-next-line: variable-name
export const __moduleName: string = "Bundler";

export class Bundler {

    public static Init(
        app: IApplication,
        controller: IController,
        server: ICwServer
    ): void {

        controller.get(server.config.bundler.route, async (ctx: IContext) => {

            const isGzip = HttpCache.isAcceptedEncoding(ctx.req.headers, "gzip");

            if (!isGzip || server.config.bundler.fileCache === false) {
                await Bundlew.createMemmoryAsync(server, ctx, isGzip);
            } else {
                await Bundlew.createServerFileCacheAsync(server, ctx);
            }

        });
    }
}

function _getInfo(): string {
    return '// Cw "Combiner"\r\n// Copyright (c) 2022 FSys Tech Ltd.\r\n// Email: mssclang@outlook.com\r\n\r\n// This "Combiner" contains the following files:\r\n';
}

function _responseWriteGzip(
    ctx: IContext, buff: IBufferArray,
    cte: ContentType
): void {

    ctx.res.status(200, {
        'Content-Type': Bundlew.getResponseContentType(cte),
        'Content-Encoding': 'gzip'
    });

    const compressor = _zlib.createGzip({
        level: _zlib.constants.Z_BEST_COMPRESSION
    });

    compressor.pipe(ctx.res);
    compressor.end(buff.data);
    buff.dispose();

    compressor.on("end", () => {
        if (ctx.isDisposed)
            return;

        compressor.unpipe(ctx.res);
        ctx.next(200);

    });
}