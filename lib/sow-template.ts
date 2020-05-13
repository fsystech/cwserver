/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
import * as _fs from 'fs';
import * as _vm from 'vm';
import { Util } from './sow-util';
import { HttpStatus } from './sow-http-status';
import { IResInfo } from './sow-static';
import { ISowServer, IContext } from './sow-server';
interface IScriptTag {
    l: string;
    lre: RegExp;
    r: string;
    rre: RegExp;
    repre: RegExp;
}
interface IParserInfo {
    line: string;
    tag: string;
    isTagStart: boolean;
    isTagEnd: boolean;
    startTageName?: string;
    isLastTag: boolean;
}
interface ITag {
    script: IScriptTag;
    write: IScriptTag;
}
interface IScriptParser {
    tag: ITag;
    startTage( parserInfo: IParserInfo ): void;
    endTage( parserInfo: IParserInfo ): void;
}
class ParserInfo implements IParserInfo {
    public line: string;
    public tag: string;
    public isTagStart: boolean;
    public isTagEnd: boolean;
    public startTageName?: string;
    public isLastTag: boolean;
    constructor() {
        this.line = ""; this.tag = ""; this.isTagStart = false;
        this.isTagEnd = true; this.startTageName = void 0;
        this.isLastTag = false;
    }
}
// tslint:disable-next-line: max-classes-per-file
class ScriptTag implements IScriptTag {
    public l: string;
    public lre: RegExp;
    public r: string;
    public rre: RegExp;
    public repre: RegExp;
    constructor(
        l: string, lre: RegExp, r: string,
        rre: RegExp, repre: RegExp ) {
        this.l = l; this.lre = lre; this.r = r;
        this.rre = rre; this.repre = repre;
    }
}
// tslint:disable-next-line: max-classes-per-file
class Tag implements ITag {
    public script: IScriptTag;
    public write: IScriptTag;
    constructor() {
        this.script = new ScriptTag( '{%', /{%/g, '%}', /%}/g, /{=(.+?)=}/g );
        this.write = new ScriptTag( '{=', /{=/g, '=}', /=}/g, /{=(.+?)=}/g );
    }
}
// tslint:disable-next-line: max-classes-per-file
class ScriptParser implements IScriptParser {
    tag: ITag;
    constructor() {
        this.tag = new Tag();
    }
    startTage( parserInfo: IParserInfo ): void {
        if ( parserInfo.line.indexOf( parserInfo.tag ) <= -1 ) {
            // tslint:disable-next-line: no-unused-expression
            !parserInfo.isLastTag ? undefined : parserInfo.isTagEnd === true ? parserInfo.line = parserInfo.line + "\x0f; __RSP += \x0f" : '';
            return;
        }
        parserInfo.isTagStart = true;
        switch ( parserInfo.tag ) {
            case this.tag.script.l: /*{%*/
                ( this.tag.script.rre.test( parserInfo.line ) === true
                    ? ( parserInfo.isTagEnd = true, parserInfo.isTagStart = false,
                        parserInfo.line = parserInfo.line.replace( this.tag.script.lre, "\x0f;" )
                            .replace( this.tag.script.rre, " __RSP += \x0f" ) )
                    : parserInfo.isTagEnd = false,
                    parserInfo.line = parserInfo.line.replace( this.tag.script.lre, "\x0f;\r\n" ).replace( /'/g, '\x0f' ) );
                break;
            case this.tag.write.l: /*{=*/
                ( this.tag.write.rre.test( parserInfo.line ) === true ?
                    ( parserInfo.isTagEnd = true, parserInfo.isTagStart = false,
                        parserInfo.line = parserInfo.line.replace( this.tag.write.repre, ( match ) => {
                            return !match ? '' : match.replace( /'/, '\x0f' );
                        } ).replace( this.tag.write.lre, "\x0f; __RSP +=" )
                            .replace( this.tag.write.rre, "; __RSP += \x0f" ) )
                    : parserInfo.isTagEnd = false,
                    parserInfo.line = parserInfo.line.replace( /'/, '\x0f' ).replace( this.tag.write.lre, "\x0f; __RSP +=" ) );
                break;
            default: throw new Error( `Invalid script tag "${parserInfo.tag}" found...` );
        }
        parserInfo.startTageName = ( !parserInfo.isTagEnd ? parserInfo.tag : void 0 );
        return;
    }
    endTage( parserInfo: IParserInfo ): void {
        if ( parserInfo.isTagStart === false && parserInfo.isTagEnd === true ) return;
        if ( parserInfo.isTagStart !== false && parserInfo.isTagEnd !== true ) {
            parserInfo.isTagStart = true;
            switch ( parserInfo.tag ) {
                case this.tag.script.r: /*%}*/
                    ( this.tag.script.rre.test( parserInfo.line ) === true ?
                        ( parserInfo.isTagEnd = true, parserInfo.isTagStart = false,
                            parserInfo.line = parserInfo.line.replace( this.tag.script.rre, " __RSP += \x0f" ) )
                        : parserInfo.isTagEnd = false );
                    break;
                case this.tag.write.r: /*=}*/
                    ( this.tag.write.rre.test( parserInfo.line ) === true ?
                        ( parserInfo.isTagEnd = true, parserInfo.isTagStart = false, parserInfo.line = parserInfo.line.replace( this.tag.write.rre, "; __RSP += \x0f" ) )
                        : parserInfo.isTagEnd = false );
                    break;
                default: break;
            }
            parserInfo.startTageName = ( !parserInfo.isTagEnd ? parserInfo.startTageName : void 0 );
        }
        return;
    }
}
// tslint:disable-next-line: max-classes-per-file
class TemplateParser {
    public static implimentAttachment( appRoot: string, str: string ): string {
        if ( /#attach/gi.test( str ) === false ) return str;
        return str.replace( /#attach([\s\S]+?)\r\n/gi, ( match ) => {
            const path = match.replace( /#attach/gi, "" ).replace( /\r\n/gi, "" ).trim();
            const abspath = `${appRoot}${path}`.replace( /\//gi, "\\" );
            if ( !Util.isExists( abspath ) ) {
                throw new Error( `Attachement ${path} not found...` )
            }
            return _fs.readFileSync( abspath, "utf8" ).replace( /^\uFEFF/, '' );
        } );
    }
    private static margeTemplate( match: string[], template: string, body: string ): string {
        for ( const key of match ) {
            const tmplArr = /<placeholder id=\"(.*)\">/gi.exec( key.trim() );
            if ( !tmplArr ) {
                throw new Error( `Invalid template format... ${key}` );
            }
            const tmplId = tmplArr[1];
            if ( !tmplId ) {
                throw new Error( `Invalid template format... ${key}` );
            }
            let implStr: any = void 0;
            template = template.replace( new RegExp( `<impl-placeholder id="${tmplId}">.+?<\/impl-placeholder>`, "gi" ), ( m ) => {
                implStr = m.replace( /<impl-placeholder[^>]*>/gi, "" ).replace( /<\/impl-placeholder>/gi, "" );
                return implStr;
            } );
            body = body.replace( new RegExp( `<placeholder id="${tmplId}">.+?<\/placeholder>`, "gi" ), () => {
                return implStr;
            } );
        }
        return body;
    }
    public static implimentTemplateExtend( appRoot: string, str: string ): string {
        if ( /#extends/gi.test( str ) === false ) return str;
        const templats = [];
        do {
            const match = /#extends([\s\S]+?)\r\n/gi.exec( str );
            if ( !match || match === null ) {
                templats.push( str ); break;
            }
            const found = match[1];
            if ( !found ) {
                throw new Error( "Invalid template format..." );
            }
            const path = found.replace( /#extends/gi, "" ).replace( /\r\n/gi, "" ).trim();
            const abspath = `${appRoot}${path}`.replace( /\//gi, "\\" );
            if ( !Util.isExists( abspath ) ) {
                throw new Error( `Template ${path} not found...` )
            }
            templats.push( str.replace( match[0], "" ) );
            str = _fs.readFileSync( abspath, "utf8" ).replace( /^\uFEFF/, '' );
        } while ( true );
        // tslint:disable-next-line: one-variable-per-declaration
        let
            len = templats.length, count = 0,
            body = "", parentTemplate: string = "";
        // tslint:disable-next-line: one-variable-per-declaration
        const startTag = /<placeholder[^>]*>/gi,
            rnRegx = /\r\n/gi
            ;
        do {
            len--;
            if ( count === 0 ) {
                parentTemplate = templats[len].replace( rnRegx, "8_r_n_gx_8" );
                body += parentTemplate; count++; continue;
            }
            const match = parentTemplate.match( startTag );
            if ( match === null ) continue;
            parentTemplate = templats[len].replace( rnRegx, "8_r_n_gx_8" );
            body = this.margeTemplate( match, parentTemplate, body );
        } while ( len > 0 );
        return body.replace( /8_r_n_gx_8/gi, "\r\n" );
    }
    public static parse( appRoot: string, str: string ): string {
        return this.implimentAttachment(
            appRoot,
            this.implimentTemplateExtend( appRoot, str )
        ).replace( /^\s*$(?:\r\n?|\n)/gm, "\n" );
    }
}
const _tw: { [x: string]: any } = {
    cache: {}
}
// tslint:disable-next-line: max-classes-per-file
class TemplateCore {
    // private static compair( a: string, b: string ): boolean {
    //    const astat: _fs.Stats = _fs.statSync( a );
    //    const bstat: _fs.Stats = _fs.statSync( b );
    //    if ( astat.mtime.getTime() > bstat.mtime.getTime() ) return true;
    //    return false;
    // }
    private static compile( str: string, next?: ( str: string, isScript?: boolean ) => void ): ( server: ISowServer, ctx: IContext, next?: ( code?: number | undefined, transfer?: boolean ) => void ) => void {
        const context: { [x: string]: any; } = {
            thisNext: void 0
        };
        const script = new _vm.Script( `thisNext = function( _server, ctx, _next ){\n ${str} \n};` );
        _vm.createContext( context );
        script.runInContext( context );
        if( next ) next(str, true);
        return context.thisNext;
    }
    private static parseScript( str: string ): string | any {
        str = str.replace( /^\s*$(?:\r\n?|\n)/gm, "\n" );
        const script = str.split( '\n' );
        if ( script.length === 0 || script === null ) return void 0;
        let out = "";
        out = '/*__sow_template_script__*/\n';
        out += 'let __RSP = "";\r\n';
        out += 'ctx.write = function( str ) { __RSP += str; }';
        const scriptParser: IScriptParser = new ScriptParser();
        const parserInfo: IParserInfo = new ParserInfo();
        for ( parserInfo.line of script ) {
            out += "\n";
            if ( !parserInfo.line ) {
                out += "\r\n__RSP += '';"; continue;
            }
            // parserInfo.line = parserInfo.line.replace( /^\s*|\s*$/g, ' ' );
            parserInfo.line = parserInfo.line.replace(/(?:\r\n|\r|\n)/g, '');
            if ( parserInfo.isTagEnd === true ) {
                parserInfo.line = "__RSP += \x0f" + parserInfo.line;
            }
            parserInfo.tag = scriptParser.tag.script.l;
            scriptParser.startTage( parserInfo );
            parserInfo.tag = scriptParser.tag.script.r;
            scriptParser.endTage( parserInfo );
            parserInfo.tag = scriptParser.tag.write.l;
            scriptParser.startTage( parserInfo );
            parserInfo.tag = scriptParser.tag.write.r;
            scriptParser.endTage( parserInfo );
            if ( parserInfo.isTagEnd === true ) {
                parserInfo.line = parserInfo.line.replace( /'/g, '\\x27' ).replace( /\x0f/g, "'" );
                out += parserInfo.line + "\\n';";
            } else {
                parserInfo.line = parserInfo.line.replace( /\x0f/g, "'" );
                out += parserInfo.line;
            }
        }
        out = out.replace( /__RSP \+\= '';/g, '' );
        out += "\nreturn _next( __RSP ), __RSP = void 0;\n";
        return out.replace( /^\s*$(?:\r\n?|\n)/gm, "\n" );
    }
    private static isScript( str: string ): boolean {
        if ( /{%/gi.test( str ) === true
            || /{=/gi.test( str ) === true ) {
            return true;
        }
        return false;
    }
    private static isTemplate( str: string ): boolean {
        if ( /#attach/gi.test( str ) === true
            || /#extends/gi.test( str ) === true ) {
            return true;
        }
        return false;
    }
    private static isScriptTemplate( str: string ): boolean {
        const index = str.indexOf( "\n" );
        if ( index < 0 ) return false;
        return str.substring( 0, index ).indexOf( "__sow_template_script__" ) > -1;
    }
    private static run( appRoot: string, str: string, next?: ( str: string, isScript?: boolean ) => void ): any {
        const isTemplate = this.isTemplate( str );
        if ( isTemplate ) {
            str = TemplateParser.parse( appRoot, str );
        }
        if ( this.isScript( str ) ) {
            return this.compile( this.parseScript( str ), next );
        }
        // tslint:disable-next-line: no-unused-expression
        return ( isTemplate ? ( next ? next( str, false ) : void 0 ) : void 0 ), str;
    }
    public static tryLive( server: ISowServer, ctx: IContext, path: string, status: IResInfo) {
        const url = Util.isExists( path, ctx.next );
        if ( !url ) return;
        const result = this.run( server.getPublic(), _fs.readFileSync( String( url ), "utf8" ).replace( /^\uFEFF/, '' ) );
        if ( typeof ( result ) === "function" ) {
            return result( server, ctx, ( body: any ) => {
                ctx.res.set( 'Cache-Control', 'no-store' );
                ctx.res.writeHead( status.code, { 'Content-Type': 'text/html' } );
                return ctx.res.end( body ), ctx.next( status.code, status.isErrorCode === false );
            } );
        }
        ctx.res.set( 'Cache-Control', 'no-store' );
        ctx.res.writeHead( status.code, { 'Content-Type': 'text/html' } );
        return ctx.res.end( result ), ctx.next( status.code, status.isErrorCode === false );
    }
    public static tryMemCache( server: ISowServer, ctx: IContext, path: string, status: IResInfo ): any {
        const key = path.replace( /\//gi, "_" ).replace( /\./gi, "_" );
        let cache = _tw.cache[key];
        if ( !cache ) {
            const url = Util.isExists( path, ctx.next );
            if ( !url ) return;
            cache = this.run( server.getPublic(), _fs.readFileSync( String( url ), "utf8" ).replace( /^\uFEFF/, '' ) );
            _tw.cache[key] = cache;
        }
        if ( typeof ( cache ) === "function" ) {
            return cache( server, ctx, ( body: any ) => {
                ctx.res.set( 'Cache-Control', 'no-store' );
                ctx.res.writeHead( status.code, { 'Content-Type': 'text/html' } );
                return ctx.res.end( body ), ctx.next( status.code, status.isErrorCode === false );
            } );
        }
        ctx.res.set( 'Cache-Control', 'no-store' );
        ctx.res.writeHead( status.code, { 'Content-Type': 'text/html' } );
        return ctx.res.end( cache ), ctx.next( status.code, status.isErrorCode === false );
    }
    public static tryFileCacheOrLive( server: ISowServer, ctx: IContext, path: string, status: IResInfo): any {
        const fsp = Util.isExists( path, ctx.next );
        if ( !fsp ) {
            return void 0;
        };
        const filePath = String( fsp );
        const cachePath = `${filePath}.cach`;
        if ( !filePath ) return;
        let readCache = false;
        if ( server.config.templateCache && Util.isExists( cachePath ) ) {
            // readCache = this.compair( filePath, cachePath ) === false;
            readCache = Util.compairFile( filePath, cachePath ) === false;
            if ( readCache === false ) {
                _fs.unlinkSync( cachePath );
            }
        }
        let cache;
        if ( !readCache ) {
            cache = this.run( server.getPublic(), _fs.readFileSync( filePath, "utf8" ).replace( /^\uFEFF/, '' ), !server.config.templateCache ? void 0 : ( str ) => {
                _fs.writeFileSync( cachePath, str );
            } );
        } else {
            cache = _fs.readFileSync( cachePath, "utf8" ).replace( /^\uFEFF/, '' );
            if ( this.isScriptTemplate( cache ) ) {
                cache = this.compile( cache );
            }
        }
        if ( typeof ( cache ) === "function" ) {
            return cache( server, ctx, ( body: any ) => {
                ctx.res.set( 'Cache-Control', 'no-store' );
                ctx.res.writeHead( status.code, { 'Content-Type': 'text/html' } );
                return ctx.res.end( body ), ctx.next( status.code, status.isErrorCode === false );
            } );
        }
        ctx.res.set( 'Cache-Control', 'no-store' );// res.setHeader( 'Cache-Control', 'public, max-age=0' )
        ctx.res.writeHead( status.code, { 'Content-Type': 'text/html' } );
        return ctx.res.end( cache ), ctx.next( status.code, status.isErrorCode === false );
    }
}
// tslint:disable-next-line: max-classes-per-file
// tslint:disable-next-line: no-namespace
export namespace Template {
    export function parse( server: ISowServer, ctx: IContext, path: string, status?: IResInfo ): any {
        if ( !status ) status = HttpStatus.getResInfo( path, 200 );
        try {
            ctx.servedFrom = server.pathToUrl( path );
            if ( !server.config.template.cache ) {
                return TemplateCore.tryLive( server, ctx, path, status );
            }
            if ( server.config.template.cache && server.config.template.cacheType === "MEM" ) {
                return TemplateCore.tryMemCache( server, ctx, path, status );
            }
            return TemplateCore.tryFileCacheOrLive( server, ctx, path, status );
        } catch ( ex ) {
            ctx.path = path;
            if ( status.code === 500 ) {
                if ( status.tryServer === true ) {
                    server.addError( ctx, ex );
                    return server.passError( ctx );
                }
                status.tryServer = true;
            }
            server.log.error( `Send 500 ${server.pathToUrl( ctx.path )}` ).reset();
            status.code = 500; status.isErrorCode = true;
            return parse(
                server, server.addError( ctx, ex ),
                status.tryServer ? `${server.errorPage["500"]}` : `${server.config.errorPage["500"]}`,
                status
            );
        }
    }
}