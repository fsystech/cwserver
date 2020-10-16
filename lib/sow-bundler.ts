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
import * as fsw from './sow-fsw';
import { IBufferArray, BufferArray } from './sow-static';
enum ContentType {
    JS = 0,
    CSS= 1,
    UNKNOWN= -1
}
type BundlerFileInfo = { name: string, absolute: string, changeTime: number, isChange: boolean, isOwn: boolean };
const responseWriteGzip = (
    ctx: IContext, buff: IBufferArray,
    cte: ContentType
): void => {
    ctx.res.status( 200, {
        'Content-Type': Bundlew.getResContentType( cte ),
        'Content-Encoding': 'gzip'
    } );
    const compressor = _zlib.createGzip( { level: _zlib.constants.Z_BEST_COMPRESSION } );
    compressor.pipe( ctx.res );
    compressor.end( buff.data ); buff.dispose();
    return compressor.on( "end", () => {
        compressor.unpipe( ctx.res );
        ctx.next( 200 );
    } ), void 0;
}
class Bundlew {
    static getInfo(): string {
        return `/*
||####################################################################################################################################||
||#  Sow "Combiner"                                                                                                                  #||
||#  Version: 1.0.0.1; Build Date : Fri May 01, 2020 1:33:49 GMT+0600 (BDT)                                                          #||
||#  Sow( https://github.com/safeonlineworld/cwserver). All rights reserved                                                          #||
||#  Email: mssclang@outlook.com;                                                                                                    #||
||####################################################################################################################################||
---------------------------------------------------------------------------------------------------------------------------------------
This "Combiner" contains the following files:\n`;
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
    static getCachePath(
        ctx: IContext,
        str: string,
        ctEnum: ContentType,
        cacheKey: string
    ): string {
        // const dir = ctx.server.mapPath( `/web/temp/` );
        let path = `${ctx.server.config.bundler.tempPath}\\${cacheKey.replace( /[/\\?%*:|"<>]/g, "" )}_${Encryption.toMd5( str )}`;
        if ( ctEnum === ContentType.JS ) {
            path = `${path}.js.cache`
        } else {
            path = `${path}.css.cache`
        }
        return path;
    }
    static getBundleInfo(
        server: ISowServer, str: string,
        lastChangeTime: number | void,
        next: ( bundleInfo: BundlerFileInfo[], err: Error | null ) => void
    ): void {
        const result: BundlerFileInfo[] = [];
        const lchangeTime: number = typeof ( lastChangeTime ) === "number" ? lastChangeTime : 0;
        const files: string[] = str.split( "," );
        const forword = (): void => {
            try {
                const _name: string | void = files.shift();
                if ( !_name ) return next( result, null );
                let name = _name;
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
                } else {
                    absolute = server.formatPath( name, true );
                }
                return _fs.stat( absolute, ( err: NodeJS.ErrnoException | null, stat: _fs.Stats ) => {
                    if ( err ) return next( [], new Error( `No file found\r\nPath:${absolute}\r\nName:${name}` ) );
                    const changeTime = stat.mtime.getTime();
                    result.push( {
                        name: name.replace( /\$.+?\//gi, "/" ),
                        absolute,
                        changeTime,
                        isChange: lchangeTime === 0 ? true : changeTime > lchangeTime,
                        isOwn
                    } );
                    return forword();
                } );
            } catch ( e ) {
                return next( [], e );
            }
        };
        return forword();
    }
    static readBuffer(
        ctx: IContext,
        files: BundlerFileInfo[], copyright: string,
        next: ( buffer: IBufferArray ) => void
    ): void {
        const out: IBufferArray = new BufferArray();
        let istr: string = this.getInfo();
        files.forEach( ( inf, index ) => {
            istr += `${index + 1}==>${inf.name}\r\n`;
        } );
        istr += "Generated on- " + new Date().toString() + "\r\n";
        istr += "---------------------------------------------------------------------------------------------------------------------------------------*/";
        out.push( Buffer.from( istr ) );
        const copyBuff = Buffer.from( copyright );
        const forward = (): void => {
            const inf: BundlerFileInfo | undefined = files.shift();
            if ( !inf ) {
                return next( out );
            }
            out.push( Buffer.from( `\r\n/*${inf.name}*/\r\n` ) );
            if ( inf.isOwn === true ) {
                out.push( copyBuff )
                if ( inf.name.indexOf( ".min." ) < 0 ) {
                    return _fs.readFile( inf.absolute, "utf8", ( err: NodeJS.ErrnoException | null, data: string ) => {
                        return ctx.handleError( err, (): void => {
                            out.push( Buffer.from( data.replace( /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "" ).replace( /^\s*$(?:\r\n?|\n)/gm, "" ) ) );/** Replace Comment and empty line */
                            return forward();
                        } );
                    } );
                }
            }
            return _fs.readFile( inf.absolute, ( err: NodeJS.ErrnoException | null, buffer: Buffer ): void => {
                return ctx.handleError( err, (): void => {
                    out.push( buffer );
                    return forward();
                } );
            } );
        }
        return forward();
    }
    private static decryptFilePath( server: ISowServer, ctx: IContext, str: string ): string | void {
        str = server.encryption.decryptUri( str );
        if ( str.length === 0 ) {
            return ctx.next( 404 ), void 0;
        }
        str = str.replace( /\r\n/gi, "" ).replace( /\s+/g, "" );
        return str;
    }
    static createMemmory( server: ISowServer, ctx: IContext, isGzip: boolean ): void {
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
        return this.getBundleInfo( server, desc.toString(), cngHander.sinceModify, ( files: BundlerFileInfo[], err: Error | null ): void => {
            return ctx.handleError( err, () => {
                let hasChanged: boolean = true;
                if ( cngHander.sinceModify ) {
                    hasChanged = files.some( a => a.isChange === true );
                }
                SowHttpCache.writeCacheHeader( ctx.res, {
                    lastChangeTime: Date.now()
                }, server.config.cacheHeader );
                if ( !hasChanged ) {
                    ctx.res.status( 304, { 'Content-Type': this.getResContentType( cte ) } );
                    return ctx.res.end(), ctx.next( 304 );
                }
                return this.readBuffer( ctx, files, server.copyright(), ( buffer: IBufferArray ): void => {
                    ctx.req.socket.setNoDelay( true );
                    if ( isGzip === false || !server.config.bundler.compress ) {
                        ctx.res.status( 200, {
                            'Content-Type': this.getResContentType( cte ),
                            'Content-Length': buffer.length
                        } );
                        return ctx.res.end( buffer.data ), buffer.dispose(), ctx.next( 200 );
                    }
                    return responseWriteGzip( ctx, buffer, cte );
                } );
            } );
        } );
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
        const cachpath: string = this.getCachePath( ctx, desc.toString(), cte, cacheKey.toString() );
        const cngHander: IChangeHeader = SowHttpCache.getChangedHeader( ctx.req.headers );
        return fsw.stat( cachpath, ( serr?: NodeJS.ErrnoException | null, stat?: _fs.Stats ): void => {
            const existsCachFile: boolean = serr ? false : true;
            return ctx.handleError( null, () => {
                let lastChangeTime: number = 0;
                let cfileSize: number = 0;
                if ( existsCachFile && stat ) {
                    cfileSize = stat.size;
                    lastChangeTime = stat.mtime.getTime();
                }
                return this.getBundleInfo( server, desc.toString(), lastChangeTime, ( files: BundlerFileInfo[], ierr: Error | null ): void => {
                    return ctx.handleError( ierr, () => {
                        let hasChanged: boolean = true;
                        if ( existsCachFile ) {
                            hasChanged = files.some( a => a.isChange === true );
                        }
                        const etag: string | undefined = cfileSize !== 0 ? SowHttpCache.getEtag( lastChangeTime, cfileSize ) : void 0;
                        if ( !hasChanged && existsCachFile && ( cngHander.etag || cngHander.sinceModify ) ) {
                            let exit: boolean = false;
                            if ( etag && cngHander.etag ) {
                                if ( cngHander.etag === etag ) {
                                    SowHttpCache.writeCacheHeader( ctx.res, {}, server.config.cacheHeader );
                                    ctx.res.status( 304, { 'Content-Type': this.getResContentType( cte ) } ).send();
                                    return ctx.next( 304 );
                                }
                                exit = true;
                            }
                            if ( cngHander.sinceModify && !exit ) {
                                SowHttpCache.writeCacheHeader( ctx.res, {}, server.config.cacheHeader );
                                ctx.res.status( 304, { 'Content-Type': this.getResContentType( cte ) } ).send();
                                return ctx.next( 304 );
                            }
                        }
                        if ( !hasChanged && existsCachFile ) {
                            SowHttpCache.writeCacheHeader( ctx.res, {
                                lastChangeTime,
                                etag: SowHttpCache.getEtag( lastChangeTime, cfileSize )
                            }, server.config.cacheHeader );
                            ctx.res.status( 200, {
                                'Content-Type': this.getResContentType( cte ),
                                'Content-Length': cfileSize,
                                'x-served-from': 'cach-file'
                            } );
                            if ( server.config.bundler.compress ) {
                                ctx.res.setHeader( 'Content-Encoding', 'gzip' );
                            }
                            return Util.pipeOutputStream( cachpath, ctx );
                        }
                        return this.readBuffer( ctx, files, server.copyright(), ( buffer: IBufferArray ): void => {
                            if ( !server.config.bundler.compress ) {
                                return _fs.writeFile( cachpath, buffer.data, ( werr: NodeJS.ErrnoException | null ): void => {
                                    return ctx.handleError( werr, () => {
                                        return _fs.stat( cachpath, ( cserr: NodeJS.ErrnoException | null, cstat: _fs.Stats ) => {
                                            return ctx.handleError( cserr, () => {
                                                lastChangeTime = cstat.mtime.getTime();
                                                SowHttpCache.writeCacheHeader( ctx.res, {
                                                    lastChangeTime,
                                                    etag: SowHttpCache.getEtag( lastChangeTime, cstat.size )
                                                }, server.config.cacheHeader );
                                                ctx.res.status( 200, {
                                                    'Content-Type': this.getResContentType( cte ),
                                                    'Content-Length': buffer.length
                                                } );
                                                ctx.res.end( buffer.data ); buffer.dispose();
                                                return ctx.next( 200 );
                                            } );
                                        } );
                                    } );
                                } );
                            }
                            return _zlib.gzip( buffer.data, ( error: Error | null, buff: Buffer ): void => {
                                buffer.dispose();
                                return ctx.handleError( error, () => {
                                    return _fs.writeFile( cachpath, buff, ( err: NodeJS.ErrnoException | null ): void => {
                                        return ctx.handleError( err, () => {
                                            return _fs.stat( cachpath, ( cserr: NodeJS.ErrnoException | null, cstat: _fs.Stats ) => {
                                                return ctx.handleError( cserr, () => {
                                                    lastChangeTime = cstat.mtime.getTime();
                                                    SowHttpCache.writeCacheHeader( ctx.res, {
                                                        lastChangeTime,
                                                        etag: SowHttpCache.getEtag( lastChangeTime, cstat.size )
                                                    }, server.config.cacheHeader );
                                                    ctx.res.status( 200, {
                                                        'Content-Type': this.getResContentType( cte ),
                                                        'Content-Encoding': 'gzip',
                                                        'Content-Length': buff.length
                                                    } );
                                                    ctx.res.end( buff );
                                                    ctx.next( 200 );
                                                } );
                                            } );
                                        } );
                                    } );
                                } );
                            } );
                        } );
                    } );
                } );
            } );
        } );
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