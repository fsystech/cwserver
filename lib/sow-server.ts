/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 10:13 PM 5/2/2020
import {
    ISession, IResInfo
} from "./sow-static";
import { IRequestParam } from './sow-router';
import {
    NextFunction, IApps,
    IRequest, IResponse,
    App as sowAppCore
} from './sow-server-core';
import { Server } from 'http';
import * as _fs from 'fs';
import * as _path from 'path';
import { Util } from './sow-util';
import { Schema } from './sow-schema-validator';
import { Session } from './sow-static';
import { ISowDatabaseType } from './sow-db-type';
import { Controller, IController } from './sow-controller';
import { Encryption, ICryptoInfo } from "./sow-encryption";
import { HttpStatus } from "./sow-http-status";
import { Logger, ILogger } from "./sow-logger"
export type CtxNext = ( code?: number | undefined, transfer?: boolean ) => void;
export type AppHandler = ( ctx: IContext, requestParam?: IRequestParam ) => void;
// -------------------------------------------------------
export interface IContext {
    // [key: string]: any;
    error?: string;
    res: IResponse;
    req: IRequest;
    path: string;
    extension: string;
    root: string;
    session: ISession;
    servedFrom?: string;
    server: ISowServer;
    next: CtxNext;
    redirect( url: string ): void;
    transferRequest( toPath: string ): void;
    write( str: string ): void;
}
export interface IServerEncryption {
    encrypt( plainText: string ): string;
    decrypt( encryptedText: string ): string;
    encryptToHex( plainText: string ): string;
    decryptFromHex( encryptedText: string ): string;
    encryptUri( plainText: string ): string;
    decryptUri( encryptedText: string ):string;
}
export interface IDatabaseConfig {
    module: string;
    path: string;
    dbConn: { database: string, password: string };
}
export interface IServerConfig {
    [key: string]: any;
    Author: string;
    appName: string;
    version: string;
    packageVersion: string;
    isDebug: boolean;
    template: {
        cache: boolean;
        cacheType: string;
    };
    encryptionKey: ICryptoInfo;
    session: {
        cookie: string;
        key: ICryptoInfo;
        maxAge: number;
        isSecure: boolean;
    };
    mimeType: string[];
    defaultDoc: string[];
    defaultExt: string;
    views: string[];
    errorPage: { [x: string]: string; };
    hiddenDirectory: string[];
    hostInfo: {
        origin: string[];
        root: string;
        hostName: string;
        frameAncestors?: string;
        tls: boolean;
        cert: { [x: string]: string; };
        port: string | number
    };
    database?: IDatabaseConfig[];
    staticFile: {
        compression: boolean;
        minCompressionSize: number;
        fileCache: false;
    };
    cacheHeader: {
        maxAge: number;
        serverRevalidate: boolean;
    };
    liveStream: string[];
    noCache: string[];
    socketPath?: string;
    bundler: {
        enable: boolean;
        fileCache: boolean;
        route: string;
        compress: boolean;
    };
}
export interface ISowServer {
    version: string;
    errorPage: { [x: string]: any; };
    copyright(): string;
    log: ILogger;
    createContext( req: IRequest, res: IResponse, next: NextFunction ): IContext;
    config: IServerConfig;
    initilize(): void;
    implimentConfig( config: { [x: string]: any; } ): void;
    setHeader( res: IResponse ): void;
    parseCookie( cook: { [x: string]: string; } | string ): { [x: string]: string; };
    parseSession( cookies: { [x: string]: string; } | string ): ISession;
    setSession( ctx: IContext, loginId: string, roleId: string, userData: any ): boolean;
    passError( ctx: IContext ): boolean;
    transferRequest( ctx: IContext, path: string, status?: IResInfo ): void;
    mapPath( path: string ): string;
    pathToUrl( path: string ): string;
    addError( ctx: IContext, ex: Error | string ): IContext;
    escape( unsafe?: string ): string;
    addVirtualDir(
        route: string, root: string,
        evt?: ( ctx: IContext ) => void
    ): void;
    virtualInfo( route: string ): {
        route: string;
        root: string
    } | void;
    formatPath( name: string ): string;
    createBundle( str: string ): string;
    getHttpServer(): Server;
    getRoot(): string;
    getPublic(): string;
    getPublicDirName(): string;
    encryption: IServerEncryption;
    parseMaxAge( maxAge: any ): number;
    db: { [x: string]: ISowDatabaseType; };
    on( ev: 'shutdown', handler: ()=>void ): void;
}
export type IViewHandler = ( app: IApps, controller: IController, server: ISowServer ) => void;
// -------------------------------------------------------
export const {
    disposeContext, removeContext, getContext,
    getMyContext, appVersion, readAppVersion
} = ( () => {
    const _curContext: { [key: string]: IContext } = {};
        const _readAppVersion = (): string | undefined => {
            try {
                const parent = process.env.SCRIPT === "TS" ? _path.resolve( __dirname, '..' ) : _path.resolve( __dirname, '../..' );
                const absPath = _path.resolve( `${parent}/package.json` );
                const packageConfig: void | { [id: string]: any } = Util.readJsonAsync( absPath );
                if ( packageConfig ) {
                    return packageConfig.version;
                }
                throw new Error("`Invalid package.json` please re-install cwserver.");
            } catch ( e ) {
                throw e;
            }
        }
    const _appVersion: string = ( (): string => {
        return _readAppVersion() || "";
    } )();
    return {
        get appVersion() {
            return _appVersion;
        },
        get readAppVersion() {
            return _readAppVersion;
        },
        disposeContext: ( ctx: IContext ): void => {
            if ( !ctx.server ) return void 0;
            delete ctx.server; delete ctx.path;
            ctx.res.dispose(); delete ctx.res;
            delete ctx.extension; delete ctx.root;
            delete ctx.session; delete ctx.servedFrom;
            delete ctx.error;
            if ( _curContext[ctx.req.id] ) {
                delete _curContext[ctx.req.id];
            }
            ctx.req.dispose(); delete ctx.req;
            return void 0;
        },
        getMyContext: ( id: string ): IContext | undefined => {
            const ctx: IContext = _curContext[id];
            if ( !ctx ) return;
            return ctx;
        },
        removeContext: ( id: string ): void => {
            const ctx: IContext = _curContext[id];
            if ( !ctx ) return;
            disposeContext( ctx );
            return void 0;
        },
        getContext: ( server: ISowServer, req: IRequest, res: IResponse ): IContext => {
            const context: IContext = new Context( server, req, res, req.session );
            _curContext[req.id] = context;
            return context;
        }
    };
} )();
function isDefined<T>( a: T | null | undefined ): a is T {
    return a !== null && a !== undefined;
}
const parseMaxAge = ( maxAge: any ): number => {
    if ( typeof ( maxAge ) !== "string" ) throw new Error( `Invalid maxAage...` );
    let add: number = 0;
    const length: number = maxAge.length;
    const type: string = maxAge.charAt( length - 1 ).toUpperCase();
    add = parseInt( maxAge.substring( 0, length - 1 ) );
    if ( isNaN( add ) ) throw new Error( `Invalid maxAage format ${maxAge}` );
    switch ( type ) {
        case "D": return ( ( 24 * add ) * 60 * 60 * 1000 );
        case "H": return ( add * 60 * 60 * 1000 );
        case "M": return ( add * 60 * 1000 );
        default: throw new Error( `Invalid maxAage format ${maxAge}` );
    }
}
const _formatPath = ( () => {
    const _exportObj = ( server: ISowServer, name: string ): {
        value?: string,
        name?: string
    } => {
        if ( name === "root" ) return { value: server.getRoot() };
        if ( name === "public" ) return { value: server.getPublicDirName() };
        return { value: void 0 };
    }
    return ( server: ISowServer, name: string ): string => {
        if ( /\$/gi.test( name ) === false ) return name;
        const absPath: string = _path.resolve( name.replace( /\$.+?\//gi, ( m ) => {
            m = m.replace( /\$/gi, "" ).replace( /\//gi, "" );
            const rs = _exportObj( server, m.replace( /\$/gi, "" ).replace( /\//gi, "" ) );
            if ( !rs.value ) {
                throw new Error( `Invalid key ${m}` );
            }
            return `${rs.value}/`;
        } ) );
        if ( !_fs.existsSync( absPath ) )
            throw new Error( `No file found\r\nPath:${absPath}\r\nName:${name}` );
        return absPath;
    };
} )();
export class ServerEncryption implements IServerEncryption {
    private cryptoInfo: ICryptoInfo;
    constructor( inf: ICryptoInfo ) {
        this.cryptoInfo = inf;
    }
    encrypt( plainText: string ): string {
        return Encryption.encrypt( plainText, this.cryptoInfo );
    }
    decrypt( encryptedText: string ): string {
        return Encryption.decrypt( encryptedText, this.cryptoInfo );
    }
    encryptToHex( plainText: string ): string {
        return Encryption.encryptToHex( plainText, this.cryptoInfo );
    }
    decryptFromHex( encryptedText: string ): string {
        return Encryption.decryptFromHex( encryptedText, this.cryptoInfo );
    }
    encryptUri( plainText: string ): string {
        return Encryption.encryptUri( plainText, this.cryptoInfo );
    }
    decryptUri( encryptedText: string ): string {
        return Encryption.decryptUri( encryptedText, this.cryptoInfo );
    }
}
export class Context implements IContext {
    // key: string]: any;
    error?: string;
    res: IResponse;
    req: IRequest;
    path: string;
    extension: string;
    root: string;
    session: ISession;
    servedFrom?: string;
    server: ISowServer;
    next: CtxNext;
    constructor(
        _server: ISowServer,
        _req: IRequest,
        _res: IResponse,
        _session: ISession
    ) {
        this.error = void 0; this.path = ""; this.root = "";
        this.res = _res; this.req = _req; this.server = _server;
        this.session = _session; this.extension = "";
        this.next = Object.create( null );
    }
    redirect( url: string ): void {
        return this.res.status( 301 ).redirect( url ), void 0;
    }
    write( str: string ): void {
        return this.res.write( str ), void 0;
    }
    transferRequest( path: string ): void {
        const status = HttpStatus.getResInfo( path, 200 );
        this.server.log[status.isErrorCode ? "error" : "success"]( `Send ${status.code} ${this.req.path}` ).reset();
        return this.server.transferRequest( this, path, status );
    }
}
export class ServerConfig implements IServerConfig {
    [key: string]: any;
    Author: string;
    appName: string;
    version: string;
    packageVersion: string;
    isDebug: boolean;
    encryptionKey: ICryptoInfo;
    session: {
        cookie: string; key: ICryptoInfo; maxAge: number;
        isSecure: boolean;
    };
    mimeType: string[];
    defaultDoc: string[];
    defaultExt: string;
    views: string[];
    errorPage: { [x: string]: any; };
    hiddenDirectory: string[];
    hostInfo: {
        origin: string[];
        root: string;
        hostName: string;
        frameAncestors?: string;
        tls: boolean;
        cert: { [x: string]: string; };
        port: string | number;
    };
    database?: IDatabaseConfig[];
    staticFile: {
        compression: boolean;
        minCompressionSize: number;
        fileCache: false;
    };
    cacheHeader: {
        maxAge: number;
        serverRevalidate: boolean;
    };
    liveStream: string[];
    noCache: string[];
    socketPath?: string;
    bundler: {
        enable: boolean;
        fileCache: boolean;
        route: string;
        compress: boolean;
    };
    template: {
        cache: boolean;
        cacheType: string;
    };
    constructor() {
        this.Author = "Safe Online World Ltd.";
        this.appName = "Sow Server";
        this.version = "0.0.1";
        this.packageVersion = "101";
        this.isDebug = true;
        this.encryptionKey = Object.create( null );
        this.session = {
            "cookie": "_sow_session",
            "key": Object.create( null ),
            "maxAge": 100,
            isSecure: false
        };
        this.defaultDoc = [];
        this.mimeType = [];
        this.defaultExt = "";
        this.views = [];
        this.errorPage = {};
        this.hiddenDirectory = [];
        this.template = {
            cache: true,
            cacheType: "FILE"
        };
        this.hostInfo = {
            "origin": [],
            "root": "www",
            "hostName": "localhost",
            "frameAncestors": void 0,
            "tls": false,
            "cert": {},
            "port": 8080
        };
        this.staticFile = {
            compression: true,
            minCompressionSize: 1024 * 5,
            fileCache: false
        };
        this.cacheHeader = {
            maxAge: 2592000000, // 30Day
            serverRevalidate: true
        };
        this.liveStream = [];
        this.noCache = [];
        this.bundler = {
            enable: true,
            fileCache: true,
            route: "/app/api/bundle/",
            compress: true
        };
    }
}
export class SowServer implements ISowServer {
    get version() {
        return appVersion;
    }
    config: IServerConfig;
    root: string;
    public: string;
    rootregx: RegExp;
    publicregx: RegExp;
    nodeModuleregx: RegExp;
    log: ILogger;
    userInteractive: boolean;
    port: string | number;
    db: { [x: string]: ISowDatabaseType; };
    encryption: IServerEncryption;
    errorPage: { [x: string]: string; };
    constructor( appRoot: string, wwwName?: string ) {
        this.port = 0;
        if ( !wwwName ) {
            if ( process.env.IISNODE_VERSION ) {
                throw new Error( `
web.config error.\r\nInvalid web.config defined.
Behind the <configuration> tag in your web.config add this
  <appSettings>
    <add key="your-iis-app-pool-id" value="your-app-root" />
  </appSettings>
your-app-root | directory name should be exists here
${appRoot}\\www_public
` );
            }
            throw new Error( `Argument missing.\r\ne.g. node server my_app_root.\r\nApp Root like your application root directory name...\r\nWhich should be exists here\r\n${appRoot}\\my_app_root` );
        }
        this.root = appRoot;
        this.public = wwwName.toString();
        this.config = new ServerConfig();
        this.db = {};
        const absPath: string = _path.resolve( `${this.root}/${this.public}/config/app.config.json` );
        if ( !_fs.existsSync( absPath ) ) {
            throw new Error( `No config file found in ${absPath}` );
        }
        const config = Util.readJsonAsync( absPath );
        if ( !config ) {
            throw new Error( `Invalid config file defined.\r\nConfig: ${absPath}` );
        }
        Schema.Validate( config );
        // if ( config.hasOwnProperty( "Author" ) ) throw _Error( "You should not set Author property..." );
        if ( this.public !== config.hostInfo.root ) {
            throw new Error( `Server ready for App Root: ${this.public}.\r\nBut host_info root path is ${config.hostInfo.root}.\r\nApp Root like your application root directory name...` );
        }
        const myParent = process.env.SCRIPT === "TS" ? _path.join( _path.resolve( __dirname, '..' ), "/dist/" ) : _path.resolve( __dirname, '..' );
        this.errorPage = {
            "404": _path.resolve( `${myParent}/error_page/404.html` ),
            "401": _path.resolve( `${myParent}/error_page/401.html` ),
            "500": _path.resolve( `${myParent}/error_page/500.html` )
        };
        Util.extend( this.config, config, true );
        this.implimentConfig( config );
        this.rootregx = new RegExp( this.root.replace( /\\/gi, '/' ), "gi" );
        this.publicregx = new RegExp( `${this.public}/`, "gi" );
        // _path.dirname( "node_modules" );
        this.nodeModuleregx = new RegExp( `${this.root.replace( /\\/gi, '/' ).replace( /\/dist/gi, "" )}/node_modules/express/`, "gi" );
        this.userInteractive = process.env.IISNODE_VERSION || process.env.PORT ? false : true;
        this.initilize();
        this.log = new Logger( `./log/`, this.public, void 0, this.userInteractive, this.config.isDebug );
        this.encryption = new ServerEncryption( this.config.encryptionKey );
        return;
    }
    on(ev: "shutdown", handler: ()=>void): void {
        throw new Error("Method not implemented.");
    }
    getHttpServer(): Server {
        throw new Error( "Method not implemented." );
    }
    getRoot(): string {
        return this.root;
    }
    parseMaxAge( maxAge: any ): number {
        return parseMaxAge( maxAge );
    }
    getPublic(): string {
        return `${this.root}/${this.public}`;
    }
    getPublicDirName(): string {
        return this.public;
    }
    implimentConfig( config: { [x: string]: any; } ): void {
        if ( !config.encryptionKey )
            throw new Error( "Security risk... encryption key required...." );
        if ( !Util.isArrayLike( config.hiddenDirectory ) ) {
            throw new Error( 'hidden_directory should be Array...' );
        }
        if ( process.env.IISNODE_VERSION && process.env.PORT ) {
            this.port = process.env.PORT;
        } else {
            if ( !this.config.hostInfo.port )
                throw new Error( 'Listener port required...' );
            this.port = this.config.hostInfo.port;
        }
        this.config.encryptionKey = Encryption.updateCryptoKeyIV( config.encryptionKey );
        if ( this.config.session ) {
            if ( !this.config.session.key )
                throw new Error( "Security risk... Session encryption key required...." );
            this.config.session.key = Encryption.updateCryptoKeyIV( config.session.key );
            if ( !this.config.session.maxAge )
                config.session.maxAge = "1d";
            if ( typeof ( config.session.maxAge ) !== "string" )
                throw new Error( `Invalid maxAage format ${config.session.maxAge}. maxAge should "1d|1h|1m" formatted...` );
            this.config.session.maxAge = parseMaxAge( config.session.maxAge );
        }
        if ( !this.config.cacheHeader ) {
            throw new Error( "cacheHeader information required..." );
        }
        this.config.cacheHeader.maxAge = parseMaxAge( config.cacheHeader.maxAge );
    }
    initilize(): void {
        if ( isDefined( this.config.database ) ) {
            if ( !Util.isArrayLike( this.config.database ) )
                throw new Error( "database cofig should be Array...." );
            this.config.database.forEach( ( conf: IDatabaseConfig ): void => {
                if ( !conf.module )
                    throw new Error( "database module name requeired." );
                if ( this.db[conf.module] )
                    throw new Error( `database module ${conf.module} already exists.` );
                if ( !conf.path )
                    throw new Error( `No path defined for module ${conf.module}` );
                conf.path = this.formatPath( conf.path );
                this.db[conf.module] = new ( require( conf.path ) )( conf.dbConn )
            } );
        }
        if ( !this.config.errorPage || ( Util.isPlainObject( this.config.errorPage ) && Object.keys( this.config.errorPage ).length === 0 ) ) {
            if ( !this.config.errorPage ) this.config.errorPage = {};
            for ( const property in this.errorPage ) {
                if ( !Object.hasOwnProperty.call( this.config.errorPage, property ) ) {
                    this.config.errorPage[property] = this.errorPage[property];
                }
            }
        } else {
            if ( Util.isPlainObject( this.config.errorPage ) === false )
                throw new Error( "errorPage property should be Object." );
            for ( const property in this.config.errorPage ) {
                if ( Object.hasOwnProperty.call( this.config.errorPage, property ) ) {
                    const path: string = this.config.errorPage[property];
                    const code: number = parseInt( property );
                    const statusCode: number = HttpStatus.fromPath( path, code );
                    if ( !statusCode || statusCode !== code || !HttpStatus.isErrorCode( statusCode ) ) {
                        throw new Error( `Invalid Server/Client error page... ${path} and code ${code}}` );
                    }
                    this.config.errorPage[property] = this.formatPath( path );
                }
            }
            for ( const property in this.errorPage ) {
                if ( !Object.hasOwnProperty.call( this.config.errorPage, property ) ) {
                    this.config.errorPage[property] = this.errorPage[property];
                }
            }
        }
        this.config.views.forEach( ( name: string, index: number ) => {
            this.config.views[index] = this.formatPath( name );
        } );
    }
    copyright(): string {
        return '/*Copyright( c ) 2018, Sow ( https://safeonline.world, https://www.facebook.com/safeonlineworld, mssclang@outlook.com, https://github.com/safeonlineworld/cwserver). All rights reserved*/\r\n';
    }
    createContext( req: IRequest, res: IResponse, next: NextFunction ): IContext {
        const _context = getContext( this, req, res );
        _context.path = decodeURIComponent( req.path ); _context.root = _context.path;
        _context.next = next;
        _context.extension = Util.getExtension( _context.path ) || "";
        return _context;
    }
    setHeader( res: IResponse ): void {
        res.setHeader( 'x-timestamp', Date.now() );
        res.setHeader( 'server', 'SOW Frontend' );
        res.setHeader( 'x-app-version', this.version );
        res.setHeader( 'x-powered-by', 'safeonline.world' );
        res.setHeader( 'strict-transport-security', 'max-age=31536000; includeSubDomains; preload' );
        res.setHeader( 'x-xss-protection', '1; mode=block' );
        res.setHeader( 'x-content-type-options', 'nosniff' );
        res.setHeader( 'x-frame-options', 'sameorigin' );
        if ( this.config.hostInfo.hostName && this.config.hostInfo.hostName.length > 0 ) {
            res.setHeader( 'expect-ct', `max-age=0, report-uri="https://${this.config.hostInfo.hostName}/report/?ct=browser&version=${appVersion}` );
        }
        res.setHeader( 'feature-policy', "magnetometer 'none'" );
        if ( this.config.hostInfo.frameAncestors ) {
            res.setHeader( 'content-security-policy', `frame-ancestors ${this.config.hostInfo.frameAncestors}` );
        }
    }
    parseCookie( cook: string | { [x: string]: string; } ): { [x: string]: string; } {
        if ( typeof ( cook ) !== "string" ) return cook;
        const cookies: { [x: string]: any; } = {};
        cook.split( ";" ).forEach( ( value ) => {
            const index = value.indexOf( "=" );
            if ( index < 0 ) return;
            cookies[value.substring( 0, index ).trim()] = value.substring( index + 1 ).trim();
        } );
        return cookies;
    }
    parseSession( cookies: string | { [x: string]: any; } ): ISession {
        if ( !this.config.session.cookie || this.config.session.cookie.length === 0 )
            throw Error( "You are unable to add session without session config. see your app_config.json" );
        const session = new Session();
        cookies = this.parseCookie( cookies );
        // if ( !cookies ) return session;
        const value = cookies[this.config.session.cookie];
        if ( !value ) return session;
        const str = Encryption.decryptFromHex( value, this.config.session.key );
        if ( !str ) {
            return session;
        }
        Util.extend( session, JSON.parse( str ) );
        session.isAuthenticated = true;
        return session;
    }
    setSession( ctx: IContext, loginId: string, roleId: string, userData: any ): boolean {
        return ctx.res.cookie(
            this.config.session.cookie,
            Encryption.encryptToHex( JSON.stringify( {
                loginId, roleId, userData
            } ), this.config.session.key ), {
            maxAge: this.config.session.maxAge,
            httpOnly: true, sameSite: "strict",
            secure: this.config.session.isSecure
        } ), true;
    }
    passError( ctx: IContext ): boolean {
        if ( !ctx.error ) return false;
        try {
            const msg = `<pre>${this.escape( ctx.error.replace( /<pre[^>]*>/gi, "" ).replace( /\\/gi, '/' ).replace( this.rootregx, "$root" ).replace( this.publicregx, "$public/" ) )}</pre>`;
            return ctx.res.asHTML( 500 ).end( msg ), true;
        } catch ( e ) {
            this.log.error( e.stack );
            return false;
        }
    }
    transferRequest( ctx: IContext, path: string, status?: IResInfo ): void {
        if ( !ctx ) throw new Error( "Invalid argument defined..." );
        if ( !status ) status = HttpStatus.getResInfo( path, 200 );
        if ( status.isErrorCode && status.isInternalErrorCode === false ) {
            this.addError( ctx, `${status.code} ${HttpStatus.getDescription( status.code )}` );
        }
        const _next = ctx.next;
        ctx.next = ( rcode?: number | undefined, transfer?: boolean ): void => {
            if ( typeof ( transfer ) === "boolean" && transfer === false ) {
                return _next( rcode, false );
            }
            if ( !rcode || rcode === 200 ) return void 0;
            if ( rcode < 0 ) {
                this.log.error( `Active connection closed by client. Request path ${ctx.path}` ).reset();
                return disposeContext( ctx );
            }
            if ( !this.passError( ctx ) ) {
                ctx.res.status( rcode ).end( 'Page Not found 404' );
            }
            return _next( rcode, false );
        }
        return ctx.res.render( ctx, path, status );
    }
    mapPath( path: string ): string {
        return _path.resolve( `${this.root}/${this.public}/${path}` );
    }
    pathToUrl( path: string ): string {
        if ( !Util.getExtension( path ) ) return path;
        let index = path.indexOf( this.public );
        if ( index === 0 ) return path;
        if ( index > 0 ) {
            path = path.substring( path.indexOf( this.public ) + this.public.length );
        } else {
            path = path.replace( this.rootregx, "/$root" );
        }
        index = path.lastIndexOf( "." );
        // if ( index < 0 ) return path;
        return path.substring( 0, index ).replace( /\\/gi, "/" );
    }
    addError( ctx: IContext, ex: string | Error ): IContext {
        ctx.path = this.pathToUrl( ctx.path );
        if ( !ctx.error ) {
            ctx.error = `Error occured in ${ctx.path}`;
        } else {
            ctx.error += `\r\n\r\nNext Error occured in ${ctx.path}`;
        }
        ctx.error += `${( typeof ( ex ) === "string" ? " " + ex : "\r\n" + ex.stack?.toString() )}`;
        ctx.error = ctx.error
            .replace( /\\/gi, '/' )
            .replace( this.rootregx, "$root" )
            .replace( this.publicregx, "$public/" )
            .replace( this.nodeModuleregx, "$engine/" );
        return ctx;
    }
    escape( unsafe?: string ): string {
        if ( !unsafe ) return "";
        return unsafe
            .replace( /&/gi, "&amp;" )
            .replace( /</gi, "&lt;" )
            .replace( />/gi, "&gt;" )
            .replace( /\r\n/gi, "<br/>" )
            .replace( /\n/gi, "<br/>" );
    }
    addVirtualDir( route: string, root: string, evt?: ( ctx: IContext ) => void ): void {
        throw new Error( "Method not implemented." );
    }
    virtualInfo( _route: string ): { route: string; root: string; } | void {
        throw new Error( "Method not implemented." );
    }
    formatPath( name: string ): string {
        return _formatPath( this, name );
    }
    createBundle( str: string ): string {
        if ( !str ) throw new Error( "No string found to create bundle..." )
        return Encryption.encryptUri( str, this.config.encryptionKey );
    }
}
type IViewRegister = ( app: IApps, controller: IController, server: ISowServer ) => void;
interface ISowGlobalServer {
    on( ev: "register-view", next: IViewRegister ): void;
    emit( ev: "register-view", app: IApps, controller: IController, server: ISowServer ): void;
}
class SowGlobalServer implements ISowGlobalServer {
    private _evt: IViewRegister[];
    private _isInitilized: boolean;
    constructor() {
        this._evt = [];
        this._isInitilized = false;
    }
    public emit( ev: "register-view", app: IApps, controller: IController, server: ISowServer ): void {
        this._evt.forEach( handler => {
            return handler( app, controller, server );
        } );
        this._evt.length = 0;
        this._isInitilized = true;
    }
    public on( ev: "register-view", next: ( app: IApps, controller: IController, server: ISowServer ) => void ): void {
        if ( this._isInitilized ) {
            throw new Error("After initilize view, you should not register new veiw.");
        }
        this._evt.push( next );
    }
}
interface ISowGlobal {
    isInitilized: boolean;
    server: ISowGlobalServer;
}
class SowGlobal implements ISowGlobal {
    public isInitilized: boolean;
    server: ISowGlobalServer;
    constructor() {
        this.server = new SowGlobalServer();
        this.isInitilized = false;
    }
}
declare global {
    namespace NodeJS {
        interface Global {
            sow: ISowGlobal;
        }
    }
}
export interface IAppUtility {
    init: ( ) => IApps;
    readonly public: string;
    readonly port: string | number;
    readonly socketPath: string;
    readonly log: ILogger;
    readonly server: ISowServer;
    readonly controller: IController;
}
if ( !global.sow || ( global.sow && !global.sow.server ) ) {
    global.sow = new SowGlobal();
}
export function initilizeServer( appRoot: string, wwwName?: string ): IAppUtility {
    if ( global.sow.isInitilized ) throw new Error( "Server instance can initilize 1 time..." );
    const _server: SowServer = new SowServer( appRoot, wwwName );
    const _processNext = {
        render: ( code: number | undefined, ctx: IContext, next: NextFunction, transfer?: boolean ): any => {
            if ( transfer && typeof ( transfer ) !== "boolean" ) {
                throw new Error( "transfer argument should be ?boolean...." );
            }
            if ( !code || code < 0 || code === 200 || code === 304 || ( typeof ( transfer ) === "boolean" && transfer === false ) ) {
                if ( _server.config.isDebug ) {
                    if ( code && code < 0 ) {
                        _server.log.error( `Active connection closed by client. Request path ${ctx.path}` ).reset();
                        code = code * -1;
                    }
                }
                if ( code ) return void 0;
                return next();
            }
            // _server.log.error( `Send ${code} ${ctx.path}` ).reset();
            if ( _server.config.errorPage[code] ) {
                return _server.transferRequest( ctx, _server.config.errorPage[code] );
            }
            if ( code === 404 ) {
                return ctx.res.status( code ).end( 'Page Not found 404' );
            }
            return ctx.res.status( code ).end( `No description found for ${code}` ), next();
        }
    }
    const _controller: IController = new Controller();
    function initilize( ): IApps {
        const _app: IApps = sowAppCore();
        _server.getHttpServer = (): Server => {
            return _app.getHttpServer();
        };
        _server.on = ( ev: "shutdown", handler: ()=>void ): void => {
            _app.on( ev, handler );
        };
        if ( _server.config.isDebug ) {
            _app.on( "request-begain", ( req: IRequest ): void => {
                _server.log.success( `${req.method} ${req.path}` );
            } );
        }
        _app.on( "response-end", ( req: IRequest, res: IResponse ): void => {
            if ( _server.config.isDebug ) {
                let resPath: string = "";
                const ctx: IContext | undefined = getMyContext( req.id );
                if ( ctx ) {
                    resPath = ctx.path;
                } else {
                    resPath = req.path;
                }
                if ( res.statusCode && HttpStatus.isErrorCode( res.statusCode ) ) {
                    _server.log.error( `Send ${res.statusCode} ${resPath}` );
                } else {
                    _server.log.success( `Send ${res.statusCode || 200} ${resPath}` );
                }
            }
            removeContext( req.id );
        } );
        _app.prerequisites( ( req: IRequest, res: IResponse, next: NextFunction ): void => {
            req.session = _server.parseSession( req.cookies );
            _server.setHeader( res );
            return next();
        } );
        const _virtualDir: { [x: string]: string; }[] = [];
        _server.virtualInfo = ( route: string ): { route: string; root: string; } | void => {
            const v = _virtualDir.find( ( a ) => a.route === route );
            if ( !v ) return void 0;
            return {
                route: v.route,
                root: v.root
            };
        };
        _server.addVirtualDir = ( route: string, root: string, evt?: ( ctx: IContext ) => void ): void => {
            if ( route.indexOf( ":" ) > -1 || route.indexOf( "*" ) > -1 )
                throw new Error( `Unsupported symbol defined. ${route}` );
            const neRoute = route;
            if ( _virtualDir.some( ( a ) => a.route === neRoute ) )
                throw new Error( `You already add this virtual route ${route}` );
            route += route.charAt( route.length - 1 ) !== "/" ? "/" : "";
            route += "*";
            const _processHandler = ( req: IRequest, res: IResponse, next: NextFunction, forWord: ( ctx: IContext ) => void ) => {
                const _ctx = _server.createContext( req, res, next );
                const _next = next;
                _ctx.next = ( code?: number | undefined, transfer?: boolean ): any => {
                    if ( !code || code === 200 ) return;
                    return _processNext.render( code, _ctx, _next, transfer );
                }
                if ( !Util.isExists( `${root}/${_ctx.path}`, _ctx.next ) ) return;
                return forWord( _ctx );
            };
            if ( !evt || typeof ( evt ) !== "function" ) {
                _app.use( route, ( req: IRequest, res: IResponse, next: NextFunction ) => {
                    _processHandler( req, res, next, ( ctx: IContext ): void => {
                        if ( _server.config.mimeType.indexOf( ctx.extension ) > -1 ) {
                            return _controller.httpMimeHandler.render( ctx, root, false );
                        }
                        return ctx.next( 404 );
                    } );
                }, true );
            } else {
                _app.use( route, ( req: IRequest, res: IResponse, next: NextFunction ) => {
                    _processHandler( req, res, next, ( ctx: IContext ): void => {
                        _server.log.success( `Send ${200} ${route}${req.path}` ).reset();
                        return evt( ctx );
                    } );
                }, true );
            }
            return _virtualDir.push( {
                route: neRoute,
                root
            } ), void 0;
        };
        if ( _server.config.bundler && _server.config.bundler.enable ) {
            const { Bundler } = require( "./sow-bundler" );
            Bundler.Init( _app, _controller, _server );
        }
        if ( _server.config.views ) {
            _server.config.views.forEach( ( a: string, _index: number, _array: string[] ) => {
                require( a );
            } );
        }
        global.sow.server.emit( "register-view", _app, _controller, _server );
        _controller.sort();
        _app.onError( ( req: IRequest, res: IResponse, err?: number | Error ): void => {
            if ( res.headersSent ) return;
            const _context = _server.createContext( req, res, ( _err?: Error ): void => {
                if ( res.headersSent ) return;
                res.writeHead( 404, { 'Content-Type': 'text/html' } );
                res.end( "Nothing found...." );
            } );
            if ( !err ) {
                return _context.transferRequest( _server.config.errorPage["404"] );
            }
            if ( err instanceof Error ) {
                _server.addError( _context, err );
                return _context.transferRequest( _server.config.errorPage["500"] );
            }
        } );
        _app.use( ( req: IRequest, res: IResponse, next: NextFunction ) => {
            const _context = _server.createContext( req, res, next );
            const _next = _context.next;
            _context.next = ( code?: number | undefined, transfer?: boolean ): any => {
                if ( code && code === -404 ) return next();
                return _processNext.render( code, _context, _next, transfer );
            }
            if ( _server.config.hiddenDirectory.some( ( a ) => req.path.indexOf( a ) > -1 ) ) {
                _server.log.write( `Trying to access Hidden directory. Remote Adress ${req.ip} Send 404 ${req.path}` ).reset();
                return _server.transferRequest( _context, _server.config.errorPage["404"] );
            }
            if ( req.path.indexOf( '$root' ) > -1 || req.path.indexOf( '$public' ) > -1 ) {
                _server.log.write( `Trying to access directly reserved keyword ( $root | $public ). Remote Adress ${req.ip} Send 404 ${req.path}` ).reset();
                return _server.transferRequest( _context, _server.config.errorPage["404"] );
            }
            try {
                return _controller.processAny( _context );
            } catch ( ex ) {
                return _server.transferRequest( _server.addError( _context, ex ), _server.config.errorPage["500"] );
            }
        } );
        return _app;
    };
    global.sow.isInitilized = true;
    return {
        init: initilize,
        get public() { return _server.public; },
        get port() { return _server.port; },
        get log() { return _server.log; },
        get socketPath() { return _server.config.socketPath || ""; },
        get server() { return _server; },
        get controller() { return _controller; }
    }
}