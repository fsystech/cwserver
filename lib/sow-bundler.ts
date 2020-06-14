/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 4:48 PM 5/3/2020
import * as _fs from 'fs';
import * as _path from 'path';
import * as _zlib from 'zlib';
import { Encryption } from './sow-encryption';
import { SowHttpCache, IChangeHeader } from './sow-http-cache';
import { IApplication } from './sow-server-core';
import { ISowServer, IContext } from './sow-server';
import { IController } from './sow-controller';
import { Util } from './sow-util';
enum ContentType {
    JS = 0,
    CSS= 1,
    UNKNOWN= -1
}
type BundlerFiles = { name: string, absolute: string, changeTime: number, isChange: boolean, isOwn: boolean };
interface IBundleInfo {
    error: boolean;
    files: BundlerFiles[];
    msg: string | Error;
}
const responseWriteGzip = (
    ctx: IContext, buff: Buffer,
    cte: ContentType
): void => {
    ctx.res.writeHead( 200, {
        'Content-Type': Bundlew.getResContentType( cte ),
        'Content-Encoding': 'gzip'
    } );
    const compressor = _zlib.createGzip( { level: _zlib.constants.Z_BEST_COMPRESSION } );
    compressor.pipe( ctx.res );
    compressor.end( buff );
    return compressor.on( "end", () => {
        compressor.unpipe( ctx.res );
        ctx.next( 200 );
    } ), void 0;
}
class BundleInfo implements IBundleInfo {
    error: boolean;
    files: BundlerFiles[];
    msg: string | Error;
    constructor() {
        this.error = false;
        this.files = [];
        this.msg = "";
    }
}
class Bundlew {
    static getInfo(): string {
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
    static getResContentType( ctEnum: ContentType ): string {
        if ( ctEnum === ContentType.JS )
            return "application/x-javascript; charset=utf-8";
        return "text/css";
    }
    static getContentType( ct: string ): ContentType {
        switch ( ct.toLowerCase() ) {
            case "text/javascript": return ContentType.JS;
            case "text/css": return ContentType.CSS;
        }
        return ContentType.UNKNOWN;
    }
    static getCachePath( server: ISowServer, str: string, ctEnum: ContentType, cacheKey: string ) {
        const dir = server.mapPath( `/web/temp/` );
        if ( !_fs.existsSync( dir ) ) {
            Util.mkdirSync( server.getPublic(), "/web/temp/" );
        }
        let path = `${dir}\\${cacheKey.replace( /[/\\?%*:|"<>]/g, "" )}_${Encryption.toMd5( str )}`;
        if ( ctEnum === ContentType.JS ) {
            path = `${path}.js.cache`
        } else {
            path = `${path}.css.cache`
        }
        return _path.resolve( path );
    }
    static getBundleInfo(
        server: ISowServer, str: string,
        lastChangeTime?: number | void
    ): IBundleInfo {
        const result: IBundleInfo = new BundleInfo();
        const lchangeTime: number = typeof ( lastChangeTime ) === "number" ? lastChangeTime : 0;
        try {
            const files: string[] = str.split( "," );
            for ( let name of files ) {
                let isOwn: boolean = false;
                if ( name.indexOf( "|" ) > 0 ) {
                    const spl: string[] = name.split( "|" );
                    name = spl[0];
                    if ( spl[1] === "__owner__" ) isOwn = true;
                    spl.length = 0;
                }
                if ( /\$/gi.test( name ) === false ) {
                    name = `$root/$public/${name}`;
                }
                let absolute: string = "";
                if ( /\$virtual/gi.test( name ) ) {
                    absolute = _path.resolve( name.replace( /\$.+?\//gi, ( m ) => {
                        const vinfo = server.virtualInfo( `/${m.split( "_" )[1].replace( "/", "" )}` );
                        if ( !vinfo ) throw new Error( `No virtual info found for ${name}` );
                        return `${vinfo.root}/`;
                    } ) );
                    if ( !_fs.existsSync( absolute ) )
                        throw new Error( `No file found\r\nPath:${absolute}\r\nName:${name}` );
                } else {
                    absolute = server.formatPath( name );
                }
                const stat = _fs.statSync( absolute );
                const changeTime = stat.mtime.getTime();
                result.files.push( {
                    name: name.replace( /\$.+?\//gi, "/" ),
                    absolute,
                    changeTime,
                    isChange: lchangeTime === 0 ? true : changeTime > lchangeTime,
                    isOwn
                } );
            }
            files.length = 0;
            result.error = false;
            return result;
        } catch ( e ) {
            result.error = true;
            result.msg = e;
            return result;
        }
    }
    static readBuffer( bundleInfo: IBundleInfo, copyright: string ): Buffer {
        const out: Buffer[] = [];
        let istr: string = this.getInfo();
        bundleInfo.files.forEach( ( inf, index ) => {
            istr += `${index + 1}==>${inf.name}\r\n`;
        } );
        istr += "Generated on- " + new Date().toString() + "\r\n";
        istr += "---------------------------------------------------------------------------------------------------------------------------------------*/";
        out.push( Buffer.from( istr ) );
        const copyBuff = Buffer.from( copyright );
        bundleInfo.files.forEach( ( inf ) => {
            out.push( Buffer.from( `\r\n/*${inf.name}*/\r\n` ) );
            if ( inf.isOwn === true ) {
                out.push( Buffer.from( copyBuff ) )
                if ( inf.name.indexOf( ".min." ) < 0 ) {
                    out.push( Buffer.from( _fs.readFileSync( inf.absolute, "utf8" ).replace( /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "" ).replace( /^\s*$(?:\r\n?|\n)/gm, "" ) ) );/** Replace Comment and empty line */
                    return;
                }
            }
            out.push( _fs.readFileSync( inf.absolute ) );
        } );
        return Buffer.concat( out );
    }
    private static decryptFilePath( server: ISowServer, ctx: IContext, str: string ): string | void {
        str = server.encryption.decryptUri( str );
        if ( str.length === 0 ) {
            return ctx.next( 404 ), void 0;
        }
        str = str.replace( /\r\n/gi, "" ).replace( /\s+/g, "" );
        return str;
    }
    static createMemmory( server: ISowServer, ctx: IContext, isGzip: boolean ): any {
        const ct = ctx.req.query.ct;
        const str = ctx.req.query.g;
        if ( !str || !ct ) {
            return ctx.next( 404 );
        }
        const cte: ContentType = this.getContentType( ct.toString() );
        if ( cte === ContentType.UNKNOWN ) return ctx.next( 404 );
        const desc: string | void = this.decryptFilePath( server, ctx, str.toString() );
        if ( !desc ) return;
        const cngHander: IChangeHeader = SowHttpCache.getChangedHeader( ctx.req.headers );
        const bundleInfo: IBundleInfo = this.getBundleInfo( server, desc.toString(), cngHander.sinceModify );
        if ( bundleInfo.error === true ) {
            server.addError( ctx, bundleInfo.msg );
            return ctx.next( 500 );
        }
        let hasChanged: boolean = true;
        if ( cngHander.sinceModify ) {
            hasChanged = bundleInfo.files.some( a => a.isChange === true );
        }
        SowHttpCache.writeCacheHeader( ctx.res, {
            lastChangeTime: Date.now()
        }, server.config.cacheHeader );
        if ( !hasChanged ) {
            ctx.res.writeHead( 304, { 'Content-Type': this.getResContentType( cte ) } );
            return ctx.res.end(), ctx.next( 304 );
        }
        ctx.req.socket.setNoDelay( true );
        const buffer: Buffer = this.readBuffer( bundleInfo, server.copyright() );
        if ( isGzip === false || !server.config.bundler.compress ) {
            ctx.res.writeHead( 200, {
                'Content-Type': this.getResContentType( cte ),
                'Content-Length': buffer.length
            } );
            return ctx.res.end( buffer ), ctx.next( 200 );
        }
        return responseWriteGzip( ctx, buffer, cte );
    }
    static createServerFileCache( server: ISowServer, ctx: IContext ): void {
        const cacheKey = ctx.req.query.ck;
        const ct = ctx.req.query.ct;
        const str = ctx.req.query.g;
        if ( !str || !cacheKey || !ct ) {
            return ctx.next( 404 );
        }
        const cte: ContentType = this.getContentType( ct.toString() );
        if ( cte === ContentType.UNKNOWN ) return ctx.next( 404 );
        const desc: string | void = this.decryptFilePath( server, ctx, str.toString() );
        if ( !desc ) return;
        const cachpath: string = this.getCachePath( server, desc.toString(), cte, cacheKey.toString() );
        const cngHander: IChangeHeader = SowHttpCache.getChangedHeader( ctx.req.headers );
        const existsCachFile: boolean = _fs.existsSync( cachpath );
        let lastChangeTime: number = 0;
        let cfileSize: number = 0;
        if ( existsCachFile ) {
            const stat: _fs.Stats = _fs.statSync( cachpath );
            cfileSize = stat.size;
            lastChangeTime = stat.mtime.getTime();
        }
        const bundleInfo: IBundleInfo = this.getBundleInfo( server, desc.toString(), lastChangeTime );
        if ( bundleInfo.error === true ) {
            server.addError( ctx, bundleInfo.msg );
            return ctx.next( 500 );
        }
        let hasChanged: boolean = true;
        if ( existsCachFile ) {
            hasChanged = bundleInfo.files.some( a => a.isChange === true );
        }
        const etag: string | undefined = cfileSize !== 0 ? SowHttpCache.getEtag( lastChangeTime, cfileSize ) : void 0;
        if ( !hasChanged && existsCachFile && ( cngHander.etag || cngHander.sinceModify ) ) {
            let exit: boolean = false;
            if ( etag && cngHander.etag ) {
                if ( cngHander.etag === etag ) {
                    SowHttpCache.writeCacheHeader( ctx.res, {}, server.config.cacheHeader );
                    ctx.res.writeHead( 304, { 'Content-Type': this.getResContentType( cte ) } );
                    return ctx.res.end(), ctx.next( 304 );
                }
                exit = true;
            }
            if ( cngHander.sinceModify && !exit ) {
                SowHttpCache.writeCacheHeader( ctx.res, {}, server.config.cacheHeader );
                ctx.res.writeHead( 304, { 'Content-Type': this.getResContentType( cte ) } );
                return ctx.res.end(), ctx.next( 304 );
            }
        }
        ctx.req.socket.setNoDelay( true );
        if ( !hasChanged && existsCachFile ) {
            SowHttpCache.writeCacheHeader( ctx.res, {
                lastChangeTime,
                etag: SowHttpCache.getEtag( lastChangeTime, cfileSize )
            }, server.config.cacheHeader );
            ctx.res.setHeader( 'x-served-from', 'cach-file' );
            if ( !server.config.bundler.compress ) {
                ctx.res.writeHead( 200, {
                    'Content-Type': this.getResContentType( cte ),
                    'Content-Length': cfileSize
                } );
            } else {
                ctx.res.writeHead( 200, {
                    'Content-Type': this.getResContentType( cte ),
                    'Content-Encoding': 'gzip',
                    'Content-Length': cfileSize
                } );
            }
            return Util.pipeOutputStream( cachpath, ctx );
        }
        if ( !server.config.bundler.compress ) {
            const buff: Buffer = this.readBuffer( bundleInfo, server.copyright() );
            _fs.writeFileSync( cachpath, buff );
            const stat: _fs.Stats = _fs.statSync( cachpath );
            lastChangeTime = stat.mtime.getTime();
            SowHttpCache.writeCacheHeader( ctx.res, {
                lastChangeTime,
                etag: SowHttpCache.getEtag( lastChangeTime, stat.size )
            }, server.config.cacheHeader );
            ctx.res.writeHead( 200, {
                'Content-Type': this.getResContentType( cte ),
                'Content-Length': buff.length
            } );
            ctx.res.end( buff );
            return ctx.next( 200 ), void 0;
        }
        return _zlib.gzip( this.readBuffer( bundleInfo, server.copyright() ), ( error, buff ) => {
            if ( error ) {
                server.addError( ctx, error );
                return ctx.next( 500 );
            }
            _fs.writeFileSync( cachpath, buff );
            const stat: _fs.Stats = _fs.statSync( cachpath );
            lastChangeTime = stat.mtime.getTime();
            SowHttpCache.writeCacheHeader( ctx.res, {
                lastChangeTime,
                etag: SowHttpCache.getEtag( lastChangeTime, stat.size )
            }, server.config.cacheHeader );
            ctx.res.writeHead( 200, {
                'Content-Type': this.getResContentType( cte ),
                'Content-Encoding': 'gzip',
                'Content-Length': buff.length
            } );
            ctx.res.end( buff );
            ctx.next( 200 );
        } ), void 0;
    }
}
// tslint:disable-next-line: variable-name
export const __moduleName: string = "Bundler";
export class Bundler {
    public static Init( app: IApplication, controller: IController, server: ISowServer ): void {
        controller.get( server.config.bundler.route, ( ctx: IContext ): void => {
            const isGzip: boolean = SowHttpCache.isAcceptedEncoding( ctx.req.headers, "gzip" );
            if ( !isGzip || server.config.bundler.fileCache === false ) return Bundlew.createMemmory( server, ctx, isGzip );
            return Bundlew.createServerFileCache( server, ctx );
        } );
    }
}