/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
import * as _fs from 'fs';
import * as _vm from 'vm';
import * as _zlib from 'zlib';
import * as _path from 'path';
import { HttpStatus } from './sow-http-status';
import { IResInfo, IDispose } from './sow-static';
import { IContext } from './sow-server';
import * as fsw from './sow-fsw';
import { generateRandomString } from './sow-util';
type SendBoxNext = ( ctx: IContext, body: string, isCompressed?: boolean ) => void;
export type SendBox = ( ctx: IContext, next: SendBoxNext, isCompressed?: boolean ) => void;
interface IScriptTag {
    readonly lre: RegExp;
    readonly rre: RegExp;
    readonly repre: RegExp;
    l: string;
    r: string;
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
interface IScriptParser extends IDispose {
    tag: ITag;
    startTage( parserInfo: IParserInfo ): void;
    endTage( parserInfo: IParserInfo ): void;
}
export type CompilerResult = {
    str: string; isScript?: boolean; isTemplate?: boolean;
    sendBox?: SendBox,
    err?: NodeJS.ErrnoException | Error | null
};
type TemplateNextFunc = ( params: CompilerResult ) => void;
export function templateNext(
    ctx: IContext, next: SendBoxNext, isCompressed?: boolean
): void {
    throw new Error( "Method not implemented." );
}
const _tw: { [x: string]: any } = {
    cache: {}
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
class ScriptTag implements IScriptTag {
    public l: string;
    public get lre(): RegExp {
        return /{%/gi;
    }
    public r: string;
    public get rre(): RegExp {
        return /%}/gi;
    }
    public repre: RegExp;
    constructor() {
        this.l = '{%'; this.r = '%}';
        this.repre = /NO_NEED/gi;
    }
}
class WriteTag implements IScriptTag {
    public l: string;
    public get lre() {
        return /{=/gi;
    };
    public r: string;
    public get rre(): RegExp {
        return /=}/gi;
    }
    public get repre(): RegExp {
        return /{=(.+?)=}/gi;
    }
    constructor() {
        this.l = '{='; this.r = '=}';
    }
}
class Tag implements ITag {
    public script: IScriptTag;
    public write: IScriptTag;
    constructor() {
        this.script = new ScriptTag();
        this.write = new WriteTag();
    }
}
class CommentTag {
    public get jsStart() {
        return /\/\*{%\*\//gi;
    }
    public get jsEnd() {
        return /\/\*%}\*\//gi;
    }
    public get htmlStart() {
        return /<\!--{%-->/gi;
    }
    public get htmlEnd() {
        return /<\!--%}-->/gi;
    }
}
class ScriptParser implements IScriptParser {
    public tag: ITag;
    private _cmnt: CommentTag;
    constructor() {
        this.tag = new Tag();
        this._cmnt = new CommentTag();
    }
    public startTage( parserInfo: IParserInfo ): void {
        if ( parserInfo.line.indexOf( parserInfo.tag ) <= -1 ) {
            if ( parserInfo.isLastTag && parserInfo.isTagEnd ) {
                parserInfo.line = parserInfo.line + "\x0f; __RSP += \x0f";
            }
            return;
        }
        parserInfo.isTagStart = true;
        switch ( parserInfo.tag ) {
            case this.tag.script.l: /*{%*/
                if ( this.tag.script.rre.test( parserInfo.line ) === true ) {
                    parserInfo.isTagEnd = true; parserInfo.isTagStart = false;
                    const index: number = parserInfo.line.indexOf( "{" );
                    let startPart: string | undefined;
                    if ( this._cmnt.jsStart.test( parserInfo.line )/** hasJsCmnt */ ) {
                        if ( index > 2 ) {
                            startPart = parserInfo.line.substring( 0, index - 2 ) + "\x0f;";
                            parserInfo.line = parserInfo.line.substring( index + 4 );
                        }
                        parserInfo.line = parserInfo.line.replace( this._cmnt.jsEnd, "" );
                        parserInfo.line += " __RSP += \x0f";
                    } else if ( this._cmnt.htmlStart.test( parserInfo.line ) /* hasHtmlCmnt*/ ) {
                        if ( index > 4 ) {
                            startPart = parserInfo.line.substring( 0, index - 4 ) + "\x0f;";
                            parserInfo.line = parserInfo.line.substring( index + 5 );
                        }
                        parserInfo.line = parserInfo.line.replace( this._cmnt.htmlEnd, "" );
                        parserInfo.line += " __RSP += \x0f";
                    } else {
                        if ( index > 0 ) {
                            startPart = parserInfo.line.substring( 0, index ) + "\x0f;";
                        }
                        parserInfo.line = parserInfo.line.substring( index + 2, parserInfo.line.length );
                        parserInfo.line = parserInfo.line.substring( 0, parserInfo.line.indexOf( "%" ) );
                        parserInfo.line += " __RSP += \x0f";
                    }
                    if ( startPart ) {
                        parserInfo.line = startPart + parserInfo.line;
                    }
                    break;
                }
                parserInfo.isTagEnd = false;
                if ( this._cmnt.jsStart.test( parserInfo.line )/** hasJsCmnt */ ) {
                    parserInfo.line = parserInfo.line.replace( this._cmnt.jsStart, "\x0f;" ).replace( /'/g, '\x0f' );
                    break;
                }
                if ( this._cmnt.htmlStart.test( parserInfo.line ) /* hasHtmlCmnt*/ ) {
                    parserInfo.line = parserInfo.line.replace( this._cmnt.htmlStart, "\x0f;" ).replace( /'/g, '\x0f' );
                    break;
                }
                parserInfo.line = parserInfo.line.replace( this.tag.script.lre, "\x0f;\r\n" ).replace( /'/g, '\x0f' );
                break;
            case this.tag.write.l: /*{=*/
                ( this.tag.write.rre.test( parserInfo.line ) === true ?
                    ( parserInfo.isTagEnd = true, parserInfo.isTagStart = false,
                        parserInfo.line = parserInfo.line.replace( this.tag.write.repre, ( match: string ): string => {
                            return match.replace( /'/gi, '\x0f' );
                        } ).replace( this.tag.write.lre, "\x0f; __RSP +=" )
                            .replace( this.tag.write.rre, "; __RSP += \x0f" ) )
                    : parserInfo.isTagEnd = false,
                    parserInfo.line = parserInfo.line.replace( /'/gi, '\x0f' ).replace( this.tag.write.lre, "\x0f; __RSP +=" ) );
                break;
        }
        parserInfo.startTageName = ( !parserInfo.isTagEnd ? parserInfo.tag : void 0 );
        return;
    }
    public endTage( parserInfo: IParserInfo ): void {
        if ( parserInfo.isTagStart === false && parserInfo.isTagEnd === true ) return;
        if ( parserInfo.isTagStart !== false && parserInfo.isTagEnd !== true ) {
            parserInfo.isTagStart = true;
            switch ( parserInfo.tag ) {
                case this.tag.script.r: /*%}*/
                    if ( this.tag.script.rre.test( parserInfo.line ) === true ) {
                        parserInfo.isTagEnd = true; parserInfo.isTagStart = false;
                        if ( this._cmnt.jsEnd.test( parserInfo.line ) ) {
                            parserInfo.line = parserInfo.line.replace( this._cmnt.jsEnd, "__RSP += \x0f" );
                            break;
                        }
                        if ( this._cmnt.htmlEnd.test( parserInfo.line ) ) {
                            parserInfo.line = parserInfo.line.replace( this._cmnt.htmlEnd, "__RSP += \x0f" );
                            break;
                        }
                        parserInfo.line = parserInfo.line.replace( this.tag.script.rre, " __RSP += \x0f" );
                        break;
                    }
                    parserInfo.isTagEnd = false;
                    break;
                case this.tag.write.r: /*=}*/
                    ( this.tag.write.rre.test( parserInfo.line ) === true ?
                        ( parserInfo.isTagEnd = true, parserInfo.isTagStart = false, parserInfo.line = parserInfo.line.replace( this.tag.write.rre, "; __RSP += \x0f" ) )
                        : parserInfo.isTagEnd = false );
                    break;
            }
            parserInfo.startTageName = ( !parserInfo.isTagEnd ? parserInfo.startTageName : void 0 );
        }
        return;
    }
    public dispose() {
        delete this.tag;
        delete this._cmnt;
    }
}
class TemplateParser {
    private static implimentAttachment(
        ctx: IContext, appRoot: string, str: string,
        next: ( str: string ) => void
    ): void {
        if ( /#attach/gi.test( str ) === false ) return next( str );
        const match: RegExpMatchArray | null = str.match( /#attach([\s\S]+?)\r\n/gi );
        if ( match ) {
            const forword = (): void => {
                const orgMatch: string | undefined = match.shift();
                if ( !orgMatch ) return next( str );
                const path = orgMatch.replace( /#attach/gi, "" ).replace( /\r\n/gi, "" ).trim();
                const abspath = _path.resolve( `${appRoot}${path}` );
                return fsw.isExists( abspath, ( exists: boolean, url: string ): void => {
                    if ( !exists ) {
                        return ctx.transferError( new Error( `Attachement ${path} not found...` ) );
                    }
                    return _fs.readFile( url, "utf8", ( err: NodeJS.ErrnoException | null, data: string ): void => {
                        return ctx.handleError( err, () => {
                            str = str.replace( orgMatch, data );
                            return forword();
                        } );
                    } );
                } );
            }
            return forword();
        }
    }
    private static margeTemplate(
        match: string[],
        template: string,
        body: string
    ): string {
        for ( const key of match ) {
            const tmplArr = /<placeholder id=\"(.*)\">/gi.exec( key.trim() );
            if ( !tmplArr ) {
                throw new Error( `Invalid template format... ${key}` );
            }
            const tmplId = tmplArr[1];
            if ( !tmplId || ( tmplId && tmplId.trim().length === 0 ) ) {
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
    private static prepareTemplate(
        ctx: IContext,
        appRoot: string, str: string,
        next: ( templats: string[] ) => void
    ): void {
        const templats: string[] = [];
        const forword = (): void => {
            const match: RegExpExecArray | null = /#extends([\s\S]+?)\r\n/gi.exec( str );
            if ( !match ) {
                templats.push( str );
                return next( templats );
            }
            const found: string | undefined = match[1];
            if ( !found || ( found && found.trim().length === 0 ) ) {
                return ctx.transferError( new Error( "Invalid template format..." ) );
            }
            const path = found.replace( /#extends/gi, "" ).replace( /\r\n/gi, "" ).trim();
            const abspath = _path.resolve( `${appRoot}${path}` );
            return _fs.exists( abspath, ( exists: boolean ): void => {
                if ( !exists ) {
                    return ctx.transferError( new Error( `Template ${path} not found...` ) );
                }
                templats.push( str.replace( match[0], "" ) );
                return _fs.readFile( abspath, "utf8", ( err: NodeJS.ErrnoException | null, data: string ): void => {
                    return ctx.handleError( err, () => {
                        str = data.replace( /^\uFEFF/, '' );
                        return forword();
                    } );
                } );
            } );
        }
        return forword();
    }
    private static implimentTemplateExtend(
        ctx: IContext,
        appRoot: string, str: string,
        next: ( str: string ) => void
    ): void {
        if ( /#extends/gi.test( str ) === false ) return next( str );
        return this.prepareTemplate( ctx, appRoot, str, ( templats: string[] ): void => {
            let count: number = 0;
            let body: string = "";
            let parentTemplate: string = "";
            const startTag: RegExp = /<placeholder[^>]*>/gi;
            const rnRegx: RegExp = /\r\n/gi;
            let len: number = templats.length;
            try {
                do {
                    len--;
                    if ( count === 0 ) {
                        parentTemplate = templats[len].replace( rnRegx, "8_r_n_gx_8" );
                        body += parentTemplate; count++; continue;
                    }
                    const match: RegExpMatchArray | null = parentTemplate.match( startTag );
                    if ( match === null || ( match && match.length === 0 ) ) {
                        throw new Error( "Invalid master template... No placeholder tag found...." );
                    }
                    parentTemplate = templats[len].replace( rnRegx, "8_r_n_gx_8" );
                    body = this.margeTemplate( match, parentTemplate, body );
                } while ( len > 0 );
                return next( body.replace( /8_r_n_gx_8/gi, "\r\n" ) );
            } catch ( e ) {
                return ctx.transferError( e );
            }
        } );
    }
    public static parse(
        ctx: IContext,
        appRoot: string, str: string,
        next: ( str: string ) => void
    ): void {
        return this.implimentTemplateExtend( ctx, appRoot, str, ( istr: string ): void => {
            return this.implimentAttachment( ctx, appRoot, istr, ( astr: string ) => {
                return next( astr.replace( /^\s*$(?:\r\n?|\n)/gm, "\n" ) );
            } );
        } );
    }
}
export class TemplateCore {
    public static compile(
        str: string | undefined, next: TemplateNextFunc
    ): void {
        if ( !str ) {
            return next( { str: "", err: new Error( "No script found to compile...." ) } );
        }
        try {
            const sendbox: string = `${generateRandomString( 30 )}_thisNext`;
            global.sow.templateCtx[sendbox] = templateNext;
            const script: _vm.Script = new _vm.Script( `sow.templateCtx.${sendbox} = async function( ctx, next, isCompressed ){\nlet __RSP = "";\nctx.write = function( str ) { __RSP += str; }\ntry{\n ${str}\nreturn next( ctx, __RSP, isCompressed ), __RSP = void 0;\n\n}catch( ex ){\n ctx.server.addError(ctx, ex);\nreturn ctx.next(500);\n}\n};` );
            script.runInContext( _vm.createContext( global ) );
            const func: SendBox | undefined = global.sow.templateCtx[sendbox];
            delete global.sow.templateCtx[sendbox];
            return next( {
                str,
                isScript: true,
                sendBox: func
            } );
        } catch ( e ) {
            return next( { str, err: e } );
        }
    }
    private static parseScript( str: string ): string | undefined {
        str = str.replace( /^\s*$(?:\r\n?|\n)/gm, "\n" );
        const script = str.split( '\n' );
        let out = "";
        out = '/*__sow_template_script__*/';
        const scriptParser: IScriptParser = new ScriptParser();
        const parserInfo: IParserInfo = new ParserInfo();
        for ( parserInfo.line of script ) {
            out += "\n";
            if ( !parserInfo.line || ( parserInfo.line && parserInfo.line.trim().length === 0 ) ) {
                out += "\r\n__RSP += '';"; continue;
            }
            // parserInfo.line = parserInfo.line.replace( /^\s*|\s*$/g, ' ' );
            parserInfo.line = parserInfo.line.replace( /(?:\r\n|\r|\n)/g, '' );
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
        scriptParser.dispose();
        out = out.replace( /__RSP \+\= '';/g, '' );
        return out.replace( /^\s*$(?:\r\n?|\n)/gm, "\n" );
    }
    private static isScript( str: string ): boolean {
        if ( /{%/gi.test( str ) === true
            || /{=/gi.test( str ) === true
            || /<script runat="template-engine">/gi.test( str ) ) {
            return true;
        }
        return false;
    }
    public static isTemplate( str: string ): boolean {
        if ( /#attach/gi.test( str ) === true
            || /#extends/gi.test( str ) === true ) {
            return true;
        }
        return false;
    }
    public static isScriptTemplate( str: string ): boolean {
        const index = str.indexOf( "\n" );
        if ( index < 0 ) return false;
        return str.substring( 0, index ).indexOf( "__sow_template_script__" ) > -1;
    }
    private static _run(
        ctx: IContext,
        appRoot: string,
        str: string,
        fnext: ( str: string, isTemplate: boolean ) => void
    ): void {
        const isTemplate = this.isTemplate( str );
        if ( isTemplate ) {
            return TemplateParser.parse( ctx, appRoot, str, ( tstr: string ): void => {
                return fnext( tstr, true );
            } );
        }
        return fnext( str, false );
    }
    public static run(
        ctx: IContext,
        appRoot: string,
        str: string,
        next: TemplateNextFunc
    ): void {
        return this._run( ctx, appRoot, str, ( fstr: string, isTemplate: boolean ): void => {
            if ( this.isScript( fstr ) ) {
                return this.compile( this.parseScript( fstr.replace( /<script runat="template-engine">([\s\S]+?)<\/script>/gi, ( match: string ): string => {
                    return match.replace( /<script runat="template-engine">/gi, "{%" ).replace( /<\/script>/gi, "%}" );
                } ) ), next );
            }
            return next( {
                str: fstr,
                isScript: false,
                isTemplate
            } );
        } );
    }
}
function canReadFileCache( ctx: IContext, filePath: string, cachePath: string, next: ( readCache: boolean ) => void ): void {
    return fsw.isExists( cachePath, ( exists: boolean ): void => {
        if ( !exists ) return next( false );
        return fsw.compairFile( filePath, cachePath, ( err: NodeJS.ErrnoException | null, changed: boolean ) => {
            return ctx.handleError( err, () => {
                if ( changed ) {
                    return _fs.unlink( cachePath, ( uerr: NodeJS.ErrnoException | null ): void => {
                        return ctx.handleError( uerr, () => {
                            return next( false );
                        } );
                    } );
                }
                return next( true );
            } );
        }, ctx.handleError.bind( ctx ) );
    } );
}
class TemplateLink {
    private static processResponse( status: IResInfo ): SendBoxNext {
        return ( ctx: IContext, body: string, isCompressed?: boolean ): void => {
            if ( isCompressed && isCompressed === true ) {
                return _zlib.gzip( Buffer.from( body ), ( error: Error | null, buff: Buffer ) => {
                    return ctx.handleError( error, () => {
                        return ctx.res.type( "html" ).noCache().status( status.code, {
                            'Content-Encoding': 'gzip',
                            'Content-Length': buff.length
                        } ).end( buff );
                    } );
                } );
            }
            return ctx.handleError( null, () => {
                return ctx.res.type( "html" ).noCache().status( status.code, {
                    'Content-Length': Buffer.byteLength( body )
                } ).end( body );
            } );
        }
    }
    public static tryLive( ctx: IContext, path: string, status: IResInfo ): void {
        return fsw.isExists( path, ( exists: boolean, url: string ): void => {
            if ( !exists ) return ctx.next( 404 );
            return _fs.readFile( url, "utf8", ( err: NodeJS.ErrnoException | null, data: string ) => {
                return ctx.handleError( err, (): void => {
                    return TemplateCore.run( ctx, ctx.server.getPublic(), data.replace( /^\uFEFF/, '' ), ( result: CompilerResult ): void => {
                        return ctx.handleError( result.err, () => {
                            if ( result.sendBox ) {
                                try {
                                    result.sendBox( ctx, this.processResponse( status ), false );
                                    delete result.sendBox;
                                    return void 0;
                                } catch ( e ) {
                                    return ctx.transferError( e );
                                }
                            }
                            return ctx.res.type( "html" ).status( 200 ).noCache().send( result.str );
                        } );
                    } );
                } );
            } );
        } );
    }
    private static _tryMemCache(
        ctx: IContext,
        path: string,
        status: IResInfo,
        next: ( func: SendBox | string ) => void
    ): void {
        const key = path.replace( /\//gi, "_" ).replace( /\./gi, "_" );
        const cache = _tw.cache[key];
        if ( cache ) return next( cache );
        return fsw.isExists( path, ( exists: boolean, url: string ): void => {
            if ( !exists ) return ctx.next( 404 );
            return _fs.readFile( url, "utf8", ( err: NodeJS.ErrnoException | null, data: string ) => {
                return ctx.handleError( err, (): void => {
                    return TemplateCore.run( ctx, ctx.server.getPublic(), data.replace( /^\uFEFF/, '' ), ( result: CompilerResult ): void => {
                        return ctx.handleError( result.err, () => {
                            _tw.cache[key] = result.sendBox || result.str;
                            return next( result.sendBox || result.str );
                        } );
                    } );
                } )
            } );
        } );
    }
    public static tryMemCache( ctx: IContext, path: string, status: IResInfo ): void {
        return this._tryMemCache( ctx, path, status, ( func: SendBox | string ): void => {
            if ( typeof ( func ) === "function" ) {
                return func( ctx, this.processResponse( status ) );
            }
            return ctx.res.type( "html" ).noCache().status( status.code ).end( func );
        } );
    }
    private static _tryFileCacheOrLive(
        ctx: IContext,
        filePath: string,
        next: ( func: SendBox | string ) => void
    ): void {
        const cachePath = `${filePath}.cach`;
        return canReadFileCache( ctx, filePath, cachePath, ( readCache: boolean ): void => {
            if ( !readCache ) {
                return _fs.readFile( filePath, "utf8", ( err: NodeJS.ErrnoException | null, data: string ) => {
                    return ctx.handleError( err, (): void => {
                        return TemplateCore.run( ctx, ctx.server.getPublic(), data.replace( /^\uFEFF/, '' ), ( result: CompilerResult ): void => {
                            return ctx.handleError( result.err, () => {
                                return _fs.writeFile( cachePath, result.str, ( werr: NodeJS.ErrnoException | null ) => {
                                    return ctx.handleError( werr, () => {
                                        return next( result.sendBox || result.str );
                                    } );
                                } );
                            } );
                        } );
                    } );
                } );
            }
            return _fs.readFile( cachePath, "utf8", ( err: NodeJS.ErrnoException | null, data: string ) => {
                return ctx.handleError( err, (): void => {
                    if ( TemplateCore.isScriptTemplate( data ) ) {
                        return TemplateCore.compile( data, ( result: CompilerResult ): void => {
                            return ctx.handleError( result.err, () => {
                                return next( result.sendBox || result.str );
                            } );
                        } );
                    }
                    return next( data );
                } );
            } );
        } );
    }
    public static tryFileCacheOrLive(
        ctx: IContext, path: string, status: IResInfo
    ): void {
        return fsw.isExists( path, ( exists: boolean, filePath: string ) => {
            if ( !exists ) return ctx.next( 404 );
            return this._tryFileCacheOrLive( ctx, filePath, ( func: string | SendBox ) => {
                if ( typeof ( func ) === "function" ) {
                    try {
                        return func( ctx, this.processResponse( status ) );
                    } catch ( e ) {
                        return ctx.transferError( e );
                    }
                }
                return ctx.res.type( "html" ).noCache().status( status.code ).end( func );
            } );
        } );
    }
}
export class Template {
    public static parse( ctx: IContext, path: string, status?: IResInfo ): void {
        if ( !status ) status = HttpStatus.getResInfo( path, 200 );
        ctx.servedFrom = ctx.server.pathToUrl( path );
        if ( !ctx.server.config.template.cache ) {
            return TemplateLink.tryLive( ctx, path, status );
        }
        if ( ctx.server.config.template.cache && ctx.server.config.template.cacheType === "MEM" ) {
            return TemplateLink.tryMemCache( ctx, path, status );
        }
        return TemplateLink.tryFileCacheOrLive( ctx, path, status );
    }
}