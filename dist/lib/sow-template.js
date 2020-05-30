"use strict";
var __createBinding = ( this && this.__createBinding ) || ( Object.create ? ( function ( o, m, k, k2 ) {
    if ( k2 === undefined ) k2 = k;
    Object.defineProperty( o, k2, { enumerable: true, get: function () { return m[k]; } } );
} ) : ( function ( o, m, k, k2 ) {
    if ( k2 === undefined ) k2 = k;
    o[k2] = m[k];
} ) );
var __setModuleDefault = ( this && this.__setModuleDefault ) || ( Object.create ? ( function ( o, v ) {
    Object.defineProperty( o, "default", { enumerable: true, value: v } );
} ) : function ( o, v ) {
    o["default"] = v;
} );
var __importStar = ( this && this.__importStar ) || function ( mod ) {
    if ( mod && mod.__esModule ) return mod;
    var result = {};
    if ( mod != null ) for ( var k in mod ) if ( Object.hasOwnProperty.call( mod, k ) ) __createBinding( result, mod, k );
    __setModuleDefault( result, mod );
    return result;
};
Object.defineProperty( exports, "__esModule", { value: true } );
exports.Template = void 0;
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
const _fs = __importStar( require( "fs" ) );
const _vm = __importStar( require( "vm" ) );
const _zlib = __importStar( require( "zlib" ) );
const _path = __importStar( require( "path" ) );
const sow_util_1 = require( "./sow-util" );
const sow_http_status_1 = require( "./sow-http-status" );
class ParserInfo {
    constructor() {
        this.line = "";
        this.tag = "";
        this.isTagStart = false;
        this.isTagEnd = true;
        this.startTageName = void 0;
        this.isLastTag = false;
    }
}
// tslint:disable-next-line: max-classes-per-file
class ScriptTag {
    constructor( l, lre, r, rre, repre ) {
        this.l = l;
        this.lre = lre;
        this.r = r;
        this.rre = rre;
        this.repre = repre;
    }
}
// tslint:disable-next-line: max-classes-per-file
class Tag {
    constructor() {
        this.script = new ScriptTag( '{%', /{%/g, '%}', /%}/g, /{=(.+?)=}/g );
        this.write = new ScriptTag( '{=', /{=/g, '=}', /=}/g, /{=(.+?)=}/g );
    }
}
// tslint:disable-next-line: max-classes-per-file
class ScriptParser {
    constructor() {
        this.tag = new Tag();
    }
    startTage( parserInfo ) {
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
                            return !match ? '' : match.replace( /'/gi, '\x0f' );
                        } ).replace( this.tag.write.lre, "\x0f; __RSP +=" )
                            .replace( this.tag.write.rre, "; __RSP += \x0f" ) )
                    : parserInfo.isTagEnd = false,
                    parserInfo.line = parserInfo.line.replace( /'/gi, '\x0f' ).replace( this.tag.write.lre, "\x0f; __RSP +=" ) );
                break;
        }
        parserInfo.startTageName = ( !parserInfo.isTagEnd ? parserInfo.tag : void 0 );
        return;
    }
    endTage( parserInfo ) {
        if ( parserInfo.isTagStart === false && parserInfo.isTagEnd === true )
            return;
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
            }
            parserInfo.startTageName = ( !parserInfo.isTagEnd ? parserInfo.startTageName : void 0 );
        }
        return;
    }
}
// tslint:disable-next-line: max-classes-per-file
class TemplateParser {
    static implimentAttachment( appRoot, str ) {
        if ( /#attach/gi.test( str ) === false )
            return str;
        return str.replace( /#attach([\s\S]+?)\r\n/gi, ( match ) => {
            const path = match.replace( /#attach/gi, "" ).replace( /\r\n/gi, "" ).trim();
            const abspath = _path.resolve( `${appRoot}${path}` );
            if ( !_fs.existsSync( abspath ) ) {
                throw new Error( `Attachement ${path} not found...` );
            }
            return _fs.readFileSync( abspath, "utf8" ).replace( /^\uFEFF/, '' );
        } );
    }
    static margeTemplate( match, template, body ) {
        for ( const key of match ) {
            const tmplArr = /<placeholder id=\"(.*)\">/gi.exec( key.trim() );
            if ( !tmplArr ) {
                throw new Error( `Invalid template format... ${key}` );
            }
            const tmplId = tmplArr[1];
            if ( !tmplId ) {
                throw new Error( `Invalid template format... ${key}` );
            }
            let implStr = void 0;
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
    static implimentTemplateExtend( appRoot, str ) {
        if ( /#extends/gi.test( str ) === false )
            return str;
        const templats = [];
        do {
            const match = /#extends([\s\S]+?)\r\n/gi.exec( str );
            if ( !match ) {
                // no more master template extends
                templats.push( str );
                break;
            }
            const found = match[1];
            if ( !found ) {
                throw new Error( "Invalid template format..." );
            }
            const path = found.replace( /#extends/gi, "" ).replace( /\r\n/gi, "" ).trim();
            const abspath = _path.resolve( `${appRoot}${path}` );
            if ( !_fs.existsSync( abspath ) ) {
                throw new Error( `Template ${path} not found...` );
            }
            templats.push( str.replace( match[0], "" ) );
            str = _fs.readFileSync( abspath, "utf8" ).replace( /^\uFEFF/, '' );
        } while ( true );
        let count = 0;
        let body = "";
        let parentTemplate = "";
        const startTag = /<placeholder[^>]*>/gi;
        const rnRegx = /\r\n/gi;
        let len = templats.length;
        do {
            len--;
            if ( count === 0 ) {
                parentTemplate = templats[len].replace( rnRegx, "8_r_n_gx_8" );
                body += parentTemplate;
                count++;
                continue;
            }
            const match = parentTemplate.match( startTag );
            if ( match === null || ( match && match.length === 0 ) ) {
                throw new Error( "Invalid master template... No placeholder tag found...." );
            }
            parentTemplate = templats[len].replace( rnRegx, "8_r_n_gx_8" );
            body = this.margeTemplate( match, parentTemplate, body );
        } while ( len > 0 );
        return body.replace( /8_r_n_gx_8/gi, "\r\n" );
    }
    static parse( appRoot, str ) {
        return this.implimentAttachment( appRoot, this.implimentTemplateExtend( appRoot, str ) ).replace( /^\s*$(?:\r\n?|\n)/gm, "\n" );
    }
}
const _tw = {
    cache: {}
};
// tslint:disable-next-line: max-classes-per-file
class TemplateCore {
    static processResponse( status ) {
        return ( ctx, body, isCompressed ) => {
            ctx.res.set( 'Cache-Control', 'no-store' );
            if ( isCompressed && isCompressed === true ) {
                return _zlib.gzip( Buffer.from( body ), ( error, buff ) => {
                    if ( error ) {
                        ctx.server.addError( ctx, error );
                        return ctx.next( 500, true );
                    }
                    ctx.res.writeHead( status.code, {
                        'Content-Type': 'text/html',
                        'Content-Encoding': 'gzip',
                        'Content-Length': buff.length
                    } );
                    ctx.res.end( buff );
                    ctx.next( status.code, status.isErrorCode === false );
                } ), void 0;
            }
            ctx.res.writeHead( status.code, {
                'Content-Type': 'text/html',
                'Content-Length': Buffer.byteLength( body )
            } );
            return ctx.res.end( body ), ctx.next( status.code, status.isErrorCode === false );
        };
    }
    static compile( str, next ) {
        if ( !str ) {
            throw new Error( "No script found to compile...." );
        }
        const context = {
            thisNext: ( ctx, _next, isCompressed ) => {
                throw new Error( "Method not implemented." );
            }
        };
        const script = new _vm.Script( `thisNext = async function( ctx, next, isCompressed ){\nlet __RSP = "";\nctx.write = function( str ) { __RSP += str; }\ntry{\n ${str}\nreturn next( ctx, __RSP, isCompressed ), __RSP = void 0;\n\n}catch( ex ){\n ctx.server.addError(ctx, ex);\nreturn ctx.next(500);\n}\n};` );
        _vm.createContext( context );
        script.runInContext( context );
        if ( next )
            next( str, true );
        return context.thisNext;
    }
    static parseScript( str ) {
        str = str.replace( /^\s*$(?:\r\n?|\n)/gm, "\n" );
        const script = str.split( '\n' );
        if ( script.length === 0 || script === null )
            return void 0;
        let out = "";
        out = '/*__sow_template_script__*/';
        const scriptParser = new ScriptParser();
        const parserInfo = new ParserInfo();
        for ( parserInfo.line of script ) {
            out += "\n";
            if ( !parserInfo.line ) {
                out += "\r\n__RSP += '';";
                continue;
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
            }
            else {
                parserInfo.line = parserInfo.line.replace( /\x0f/g, "'" );
                out += parserInfo.line;
            }
        }
        out = out.replace( /__RSP \+\= '';/g, '' );
        return out.replace( /^\s*$(?:\r\n?|\n)/gm, "\n" );
    }
    static isScript( str ) {
        if ( /{%/gi.test( str ) === true
            || /{=/gi.test( str ) === true ) {
            return true;
        }
        return false;
    }
    static isTemplate( str ) {
        if ( /#attach/gi.test( str ) === true
            || /#extends/gi.test( str ) === true ) {
            return true;
        }
        return false;
    }
    static isScriptTemplate( str ) {
        const index = str.indexOf( "\n" );
        if ( index < 0 )
            return false;
        return str.substring( 0, index ).indexOf( "__sow_template_script__" ) > -1;
    }
    static run( appRoot, str, next ) {
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
    static tryLive( ctx, path, status ) {
        const url = sow_util_1.Util.isExists( path, ctx.next );
        if ( !url )
            return;
        const result = this.run( ctx.server.getPublic(), _fs.readFileSync( String( url ), "utf8" ).replace( /^\uFEFF/, '' ) );
        if ( typeof ( result ) === "function" ) {
            return result( ctx, this.processResponse( status ), false );
        }
        ctx.res.set( 'Cache-Control', 'no-store' );
        ctx.res.writeHead( status.code, { 'Content-Type': 'text/html' } );
        return ctx.res.end( result ), ctx.next( status.code, status.isErrorCode === false );
    }
    static tryMemCache( ctx, path, status ) {
        const key = path.replace( /\//gi, "_" ).replace( /\./gi, "_" );
        let cache = _tw.cache[key];
        if ( !cache ) {
            const url = sow_util_1.Util.isExists( path, ctx.next );
            if ( !url )
                return;
            cache = this.run( ctx.server.getPublic(), _fs.readFileSync( String( url ), "utf8" ).replace( /^\uFEFF/, '' ) );
            _tw.cache[key] = cache;
        }
        if ( typeof ( cache ) === "function" ) {
            return cache( ctx, this.processResponse( status ) );
        }
        ctx.res.set( 'Cache-Control', 'no-store' );
        ctx.res.writeHead( status.code, { 'Content-Type': 'text/html' } );
        return ctx.res.end( cache ), ctx.next( status.code, status.isErrorCode === false );
    }
    static tryFileCacheOrLive( ctx, path, status ) {
        const fsp = sow_util_1.Util.isExists( path, ctx.next );
        if ( !fsp ) {
            return void 0;
        }
        ;
        const filePath = String( fsp );
        const cachePath = `${filePath}.cach`;
        if ( !filePath )
            return;
        let readCache = false;
        if ( ctx.server.config.template.cache && sow_util_1.Util.isExists( cachePath ) ) {
            readCache = sow_util_1.Util.compairFile( filePath, cachePath ) === false;
            if ( readCache === false ) {
                _fs.unlinkSync( cachePath );
            }
        }
        let cache;
        if ( !readCache ) {
            cache = this.run( ctx.server.getPublic(), _fs.readFileSync( filePath, "utf8" ).replace( /^\uFEFF/, '' ), !ctx.server.config.template.cache ? void 0 : ( str ) => {
                _fs.writeFileSync( cachePath, str );
            } );
        }
        else {
            cache = _fs.readFileSync( cachePath, "utf8" ).replace( /^\uFEFF/, '' );
            if ( this.isScriptTemplate( cache ) ) {
                cache = this.compile( cache );
            }
        }
        if ( typeof ( cache ) === "function" ) {
            return cache( ctx, this.processResponse( status ) );
        }
        ctx.res.set( 'Cache-Control', 'no-store' ); // res.setHeader( 'Cache-Control', 'public, max-age=0' )
        ctx.res.writeHead( status.code, { 'Content-Type': 'text/html' } );
        return ctx.res.end( cache ), ctx.next( status.code, status.isErrorCode === false );
    }
}
// tslint:disable-next-line: max-classes-per-file
// tslint:disable-next-line: no-namespace
( function ( Template ) {
    function parse( ctx, path, status ) {
        if ( !status )
            status = sow_http_status_1.HttpStatus.getResInfo( path, 200 );
        try {
            ctx.servedFrom = ctx.server.pathToUrl( path );
            if ( !ctx.server.config.template.cache ) {
                return TemplateCore.tryLive( ctx, path, status );
            }
            if ( ctx.server.config.template.cache && ctx.server.config.template.cacheType === "MEM" ) {
                return TemplateCore.tryMemCache( ctx, path, status );
            }
            return TemplateCore.tryFileCacheOrLive( ctx, path, status );
        }
        catch ( ex ) {
            ctx.path = path;
            if ( status.code === 500 ) {
                if ( status.tryServer === true ) {
                    ctx.server.addError( ctx, ex );
                    return ctx.server.passError( ctx ), void 0;
                }
                status.tryServer = true;
            }
            ctx.server.log.error( `Send 500 ${ctx.server.pathToUrl( ctx.path )}` ).reset();
            status.code = 500;
            status.isErrorCode = true;
            return parse( ctx.server.addError( ctx, ex ), status.tryServer ? `${ctx.server.errorPage["500"]}` : `${ctx.server.config.errorPage["500"]}`, status );
        }
    }
    Template.parse = parse;
} )( exports.Template || ( exports.Template = {} ) );
//# sourceMappingURL=sow-template.js.map