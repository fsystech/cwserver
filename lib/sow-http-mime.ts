/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 9:22 PM 5/4/2020
import * as _fs from 'fs';
import * as _path from 'path';
import _zlib = require( 'zlib' );
import { IRequest } from './sow-server-core';
import { IContext } from './sow-server';
import { SowHttpCache } from './sow-http-cache';
import { Streamer } from './sow-web-streamer';
import { Encryption } from './sow-encryption';
export interface IHttpMimeHandler {
    render( ctx: IContext, maybeDir?: string, checkFile?: boolean ): void;
    getMimeType( extension: string ): string;
    isValidExtension( extension: string ): boolean;
}
const isAcceptedEncoding = ( req: IRequest, name: string ): boolean => {
    const acceptEncoding = req.headers['accept-encoding'];
    if ( !acceptEncoding ) return false;
    return acceptEncoding.indexOf( name ) > -1;
}
interface ITaskDeff {
    cache: boolean; ext: string; gzip: boolean
}
let HttpMimeType: { [x: string]: string; } = {};
//"exe", "zip", "doc", "docx", "pdf", "ppt", "pptx", "gz"
const TaskDeff: ITaskDeff[] = [
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
    static getCachePath( ctx: IContext ) {
        const dir = ctx.server.mapPath( `/web/temp/cache/` );
        if ( !_fs.existsSync( dir ) ) {
            _fs.mkdirSync( dir, 1 );
        }
        const path = `${dir}\\${Encryption.toMd5( ctx.path )}`;
        return _path.resolve( `${path}.${ctx.extension}.cache` );
    }
    static servedFromServerFileCache(
        ctx: IContext, absPath: string, mimeType: string,
        fstat: _fs.Stats
    ): void {
        const reqCacheHeader: { sinceModify?: number | void, etag?: string } = SowHttpCache.getChangedHeader( ctx.req.headers );
        const cachePath = this.getCachePath( ctx );
        const existsCachFile = _fs.existsSync( cachePath );
        // tslint:disable-next-line: one-variable-per-declaration
        let lastChangeTime = 0, cfileSize = 0;
        if ( existsCachFile ) {
            const stat = _fs.statSync( cachePath );
            cfileSize = stat.size;
            lastChangeTime = stat.mtime.getTime();
        }
        let hasChanged = true;
        if ( existsCachFile ) {
            hasChanged = fstat.mtime.getTime() > lastChangeTime;
        }
        const etag = cfileSize !== 0 ? SowHttpCache.getEtag( lastChangeTime, cfileSize ) : void 0;
        if ( !hasChanged && existsCachFile && ( reqCacheHeader.etag || reqCacheHeader.sinceModify ) ) {
            let exit = false;
            if ( etag && reqCacheHeader.etag ) {
                if ( reqCacheHeader.etag === etag ) {
                    SowHttpCache.writeCacheHeader( ctx.res, {}, ctx.server.config.cacheHeader );
                    ctx.res.writeHead( 304, { 'Content-Type': mimeType } );
                    return ctx.res.end(), ctx.next( 304 );
                }
                exit = true;
            }
            if ( reqCacheHeader.sinceModify && !exit ) {
                SowHttpCache.writeCacheHeader( ctx.res, {}, ctx.server.config.cacheHeader );
                ctx.res.writeHead( 304, { 'Content-Type': mimeType } );
                return ctx.res.end(), ctx.next( 304 );
            }
        }
        if ( !hasChanged && existsCachFile ) {
            SowHttpCache.writeCacheHeader( ctx.res, {
                lastChangeTime,
                etag: SowHttpCache.getEtag( lastChangeTime, cfileSize )
            }, ctx.server.config.cacheHeader );
            ctx.res.setHeader( 'x-served-from', 'cach-file' );
            ctx.res.writeHead( 200, { 'Content-Type': mimeType, 'Content-Encoding': 'gzip' } );
            return ctx.res.end( _fs.readFileSync( cachePath ) ), ctx.next( 200 );
        }
        return _zlib.gzip( _fs.readFileSync( absPath ), ( error, buff ) => {
            if ( error ) {
                ctx.server.addError( ctx, error );
                return ctx.next( 500 );
            }
            _fs.writeFileSync( cachePath, buff );
            const stat = _fs.statSync( cachePath );
            lastChangeTime = stat.mtime.getTime();
            SowHttpCache.writeCacheHeader( ctx.res, {
                lastChangeTime,
                etag: SowHttpCache.getEtag( lastChangeTime, stat.size )
            }, ctx.server.config.cacheHeader );
            ctx.res.writeHead( 200, { 'Content-Type': mimeType, 'Content-Encoding': 'gzip' } );
            ctx.res.end( buff ); ctx.next( 200 );
        } ), void 0;
    }
    static servedNoChache(
        ctx: IContext, absPath: string,
        mimeType: string, isGzip: boolean,
        size: number
    ): void {
        SowHttpCache.writeCacheHeader( ctx.res, {
            lastChangeTime: void 0,
            etag: void 0
        }, { maxAge: 0, serverRevalidate: true } );
        if ( ctx.server.config.staticFile.compression && isGzip ) {
            return _zlib.gzip( _fs.readFileSync( absPath ), ( error, buff ) => {
                if ( error ) {
                    ctx.server.addError( ctx, error );
                    return ctx.next( 500 );
                }
                ctx.res.writeHead( 200, {
                    'Content-Type': mimeType,
                    'Content-Encoding': 'gzip',
                    'Content-Length': buff.length
                } );
                ctx.res.end( buff ); ctx.next( 200 );
            } ), void 0;
        }
        ctx.res.writeHead( 200, {
            'Content-Type': mimeType, 'Content-Length': size
        } );
        let openenedFile: _fs.ReadStream = _fs.createReadStream( absPath );
        openenedFile.pipe( ctx.res );
        return ctx.res.on( 'close', () => {
            if ( openenedFile ) {
                openenedFile.unpipe( ctx.res );
                openenedFile.close();
                openenedFile = Object.create( null );
            }
            ctx.next( 200 );
        } ), void 0;
        //return ctx.res.end( _fs.readFileSync( absPath ) ), ctx.next( 200 );
    }
    static servedFromFile(
        ctx: IContext, absPath: string,
        mimeType: string, isGzip: boolean,
        fstat: _fs.Stats
    ): void {
        const reqCachHeader: { sinceModify?: number | void, etag?: string } = SowHttpCache.getChangedHeader( ctx.req.headers );
        const lastChangeTime = fstat.mtime.getTime();
        const curEtag = SowHttpCache.getEtag( lastChangeTime, fstat.size );
        if (
            ( reqCachHeader.etag && reqCachHeader.etag === curEtag ) ||
            ( reqCachHeader.sinceModify && reqCachHeader.sinceModify === lastChangeTime )
        ) {
            SowHttpCache.writeCacheHeader( ctx.res, {}, ctx.server.config.cacheHeader );
            ctx.res.writeHead( 304, { 'Content-Type': mimeType } );
            return ctx.res.end(), ctx.next( 304 );
        }
        SowHttpCache.writeCacheHeader( ctx.res, {
            lastChangeTime,
            etag: curEtag
        }, ctx.server.config.cacheHeader );
        if ( ctx.server.config.staticFile.compression && isGzip ) {
            return _zlib.gzip( _fs.readFileSync( absPath ), ( error, buff ) => {
                if ( error ) {
                    ctx.server.addError( ctx, error );
                    return ctx.next( 500 );
                }
                ctx.res.writeHead( 200, { 'Content-Type': mimeType, 'Content-Encoding': 'gzip' } );
                ctx.res.end( buff ); ctx.next( 200 );
            } ), void 0;
        }
        ctx.res.writeHead( 200, { 'Content-Type': mimeType } );
        return ctx.res.end( _fs.readFileSync( absPath ) ), ctx.next( 200 );
    }
    static render(
        ctx: IContext,
        mimeType: string,
        maybeDir?: string,
        checkFile?: boolean
    ): void {
        const absPath = typeof ( maybeDir ) === "string" && maybeDir ? _path.resolve( `${maybeDir}/${ctx.path}` ) : ctx.server.mapPath( ctx.path );
        if ( typeof ( checkFile ) === "boolean" && checkFile === true ) {
            if ( !_fs.existsSync( absPath ) ) return ctx.next( 404, true );
        }
        ctx.req.socket.setNoDelay( true );
        if ( ctx.path.indexOf( 'favicon.ico' ) > -1 ) {
            SowHttpCache.writeCacheHeader( ctx.res, {
                lastChangeTime: void 0, etag: void 0
            }, {
                maxAge: ctx.server.config.cacheHeader.maxAge,
                serverRevalidate: false
            } );
            ctx.res.writeHead( 200, { 'Content-Type': mimeType } );
            ctx.res.end( _fs.readFileSync( absPath ) );
            return ctx.next( 200 );
        }
        const stat = _fs.statSync( absPath );
        if ( ctx.server.config.liveStream.indexOf( ctx.extension ) > -1 ) {
            return Streamer.stream( ctx, absPath, mimeType, stat );
        }
        let noCache: boolean = false;
        const taskDeff: ITaskDeff | undefined = TaskDeff.find( a => a.ext === ctx.extension );
        let isGzip = ( !ctx.server.config.staticFile.compression ? false : isAcceptedEncoding( ctx.req, "gzip" ) );
        if ( isGzip ) {
            if ( ctx.server.config.staticFile.minCompressionSize > 0 && stat.size < ctx.server.config.staticFile.minCompressionSize ) {
                isGzip = false;
            }
        }
        if ( taskDeff ) {
            noCache = taskDeff.cache === false;
            if ( isGzip ) {
                isGzip = taskDeff.gzip;
            }
        }
        if ( noCache === true ) {
            return this.servedNoChache( ctx, absPath, mimeType, isGzip, stat.size );
        }
        if ( ctx.server.config.noCache.indexOf( ctx.extension ) > -1 ) {
            return this.servedNoChache( ctx, absPath, mimeType, isGzip, stat.size );
        }
        if ( !isGzip || ( ctx.server.config.staticFile.fileCache === false ) ) {
            return this.servedFromFile( ctx, absPath, mimeType, isGzip, stat );
        }
        return this.servedFromServerFileCache( ctx, absPath, mimeType, stat );
    }
}
// tslint:disable-next-line: max-classes-per-file
export class HttpMimeHandler implements IHttpMimeHandler {
    constructor( appRoot: string ) {
        const absPath = _path.resolve( `${appRoot}/mime-type.json` );
        if ( !_fs.existsSync( absPath ) )
            throw new Error( `Unable to load mime-type from ${absPath}` );
        const types = _fs.readFileSync( absPath, "utf8" ).replace( /^\uFEFF/, '' );
        if ( !types ) throw new Error( "Invalid mime-type.json file..." );
        try {
            HttpMimeType = JSON.parse( types );
        } catch ( e ) {
            throw new Error( "Invalid mime-type.json file..." );
        }
    }
    getMimeType( extension: string ): string {
        const mimeType = HttpMimeType[extension];
        if ( !mimeType )
            throw new Error( "Method not implemented." );
        return mimeType;
    }
    isValidExtension( extension: string ): boolean {
        return HttpMimeType[extension] ? true : false;
    }
    render( ctx: IContext, maybeDir?: string, checkFile?: boolean ): void {
        const mimeType = HttpMimeType[ctx.extension];
        if ( !mimeType ) {
            return ctx.transferRequest( ctx.server.config.errorPage["404"] );
        }
        return MimeHandler.render( ctx, mimeType, maybeDir, checkFile );
    }
}
// 11:38 PM 5/4/2020