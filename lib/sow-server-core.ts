/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 2:40 PM 5/7/2020
import {
    createServer, OutgoingHttpHeaders,
    Server, IncomingMessage, ServerResponse
} from 'http';
import { EventEmitter } from 'events';
import { IRequestParam, ILayerInfo, IRouteInfo, getRouteInfo, getRouteMatcher } from './sow-router';
import { ToResponseTime, ISession, IResInfo } from './sow-static';
import { IContext } from './sow-server';
import { Template } from './sow-template';
import { Util } from './sow-util';
import urlHelpers, { UrlWithParsedQuery } from 'url';
import { Socket } from 'net';
import * as _zlib from 'zlib';
type ParsedUrlQuery = { [key: string]: string | string[] | undefined; };
type onError = ( req: IRequest, res: IResponse, err?: Error | number ) => void;
export type NextFunction = ( err?: any ) => void;
export type HandlerFunc = ( req: IRequest, res: IResponse, next: NextFunction, requestParam?: IRequestParam ) => void;
export interface CookieOptions {
    maxAge?: number;
    signed?: boolean;
    expires?: Date;
    httpOnly?: boolean;
    path?: string;
    domain?: string;
    secure?: boolean;
    encode?: ( val: string ) => string;
    sameSite?: boolean | 'lax' | 'strict' | 'none';
}
export interface IRequest extends IncomingMessage {
    socket: Socket;
    q: UrlWithParsedQuery;
    id: string;
    init(): IRequest;
    path: string;
    cookies: { [key: string]: string; };
    readonly query: ParsedUrlQuery;
    session: ISession;
    ip: string;
    dispose(): void;
}
export interface IResponse extends ServerResponse {
    json( body: { [key: string]: any }, compress?: boolean, next?: ( error: Error | null ) => void ): void;
    status( code: number ): IResponse;
    asHTML( code: number, contentLength?: number, isGzip?: boolean ): IResponse;
    asJSON( code: number, contentLength?: number, isGzip?: boolean ): IResponse;
    // isEnd: boolean;
    cookie( name: string, val: string, options: CookieOptions ): IResponse;
    set( field: string, value: number | string | string[] ): IResponse;
    redirect( url: string ): void;
    render( ctx: IContext, path: string, status?: IResInfo ): void;
    dispose(): void;
}
export interface IApplication {
    server: Server;
    use( ...args: any[] ): IApplication;
    listen( handle: any, listeningListener?: () => void ): IApplication;
    handleRequest( req: IRequest, res: IResponse ): void;
    prerequisites( handler: ( req: IRequest, res: IResponse, next: NextFunction ) => void ): IApplication;
    shutdown(): Promise<void>;
    on( ev: 'error', handler: onError ): IApplication;
    emit( ev: 'prepare' ): boolean;
}
export interface IApps {
    use( handler: HandlerFunc ): IApps;
    use( route: string, handler: HandlerFunc, isVirtual?: boolean ): IApps;
    listen( handle: any, listeningListener?: () => void ): IApps;
    prerequisites( handler: HandlerFunc ): IApps;
    getHttpServer(): Server;
    onError( handler: ( req: IRequest, res: IResponse, err?: Error | number ) => void ): void;
    on( ev: 'shutdown', handler: () => void ): IApps;
    on( ev: 'response-end', handler: ( req: IRequest, res: IResponse ) => void ): IApps;
    on( ev: 'request-begain', handler: ( req: IRequest ) => void ): IApps;
    shutdown( next?: ( err?: Error ) => void ): Promise<void> | void;
}
const getCook = ( cooks: string[] ): { [x: string]: string; } => {
    const cookies: { [x: string]: any; } = {};
    cooks.forEach( ( value ) => {
        const index = value.indexOf( "=" );
        if ( index < 0 ) return;
        cookies[value.substring( 0, index ).trim()] = value.substring( index + 1 ).trim();
    } );
    return cookies;
}
export function parseCookie(
    cook: undefined | string[] | string | { [x: string]: string; }
): { [x: string]: string; } {
    if ( !cook ) return {};
    if ( cook instanceof Array ) return getCook( cook );
    if ( cook instanceof Object ) return cook;
    return getCook( cook.split( ";" ) );
}
const createCookie = ( name: string, val: string, options: CookieOptions ): string => {
    let str = `${name}=${val}`;
    if ( options.domain )
        str += `;Domain=${options.domain}`;
    if ( options.path ) {
        str += `;Path=${options.path}`;
    } else {
        str += `;Path=/`;
    }
    if ( options.expires && !options.maxAge )
        str += `;Expires=${ToResponseTime( options.expires.getTime() )}`;
    if ( options.maxAge && !options.expires )
        str += `;Expires=${ToResponseTime( Date.now() + options.maxAge )}`;
    if ( options.secure )
        str += '; Secure';
    if ( options.httpOnly )
        str += '; HttpOnly';
    if ( options.sameSite ) {
        switch ( options.sameSite ) {
            case true: str += ';SameSite=Strict'; break;
            case 'lax': str += ';SameSite=Lax'; break;
            case 'strict': str += ';SameSite=Strict'; break;
            case 'none': str += ';SameSite=None'; break;
        }
    }
    if ( options.secure ) {
        str += ";Secure";
    }
    return str;
}
const getCommonHeader = ( contentType: string, contentLength?: number, isGzip?: boolean ): OutgoingHttpHeaders => {
    const header: OutgoingHttpHeaders = {
        'Content-Type': contentType
    };
    if ( typeof ( contentLength ) === "number" ) {
        header['Content-Length'] = contentLength;
    }
    if ( typeof ( isGzip ) === "boolean" && isGzip === true ) {
        header['Content-Encoding'] = "gzip";
    }
    return header;
}
export function getClientIp( req: IRequest ): string | undefined {
    if ( req.socket.remoteAddress ) {
        return req.socket.remoteAddress;
    } else {
        const remoteAddress = ( req.headers['x-forwarded-for'] || req.connection.remoteAddress )?.toString();
        if ( remoteAddress )
            return remoteAddress;
    }
    return undefined;
}
class Request extends IncomingMessage implements IRequest {
    public q: UrlWithParsedQuery = Object.create( null );
    private _cookies: { [key: string]: string; } = {};
    public get cookies() {
        return this._cookies;
    }
    public session: ISession = Object.create( null );
    public path: string = "";
    public ip: string = "";
    private _id: string = "";
    public get id() {
        return this._id;
    }
    public get query(): ParsedUrlQuery {
        return this.q.query;
    }
    init(): Request {
        this._id = Util.guid();
        this.q = urlHelpers.parse( this.url || "", true );
        this.path = this.q.pathname ? decodeURIComponent( this.q.pathname ) : "";
        this.ip = getClientIp( this ) || "";
        this._cookies = parseCookie( this.headers.cookie );
        return this;
    }
    dispose(): void {
        delete this._id;
        delete this.q;
        delete this.path;
        delete this.ip;
        delete this._cookies;
        this.removeAllListeners();
        this.destroy();
    }
}
class Response extends ServerResponse implements IResponse {
    asHTML( code: number, contentLength?: number, isGzip?: boolean ): IResponse {
        return this.writeHead( code, getCommonHeader( 'text/html; charset=UTF-8', contentLength, isGzip ) ), this;
    }
    asJSON( code: number, contentLength?: number, isGzip?: boolean ): IResponse {
        return this.writeHead( code, getCommonHeader( 'application/json', contentLength, isGzip ) ), this;
    }
    render( ctx: IContext, path: string, status?: IResInfo ): void {
        return Template.parse( ctx, path, status );
    }
    redirect( url: string ): void {
        return this.writeHead( this.statusCode, {
            'Location': url
        } ).end();
    }
    set( field: string, value: number | string | string[] ): IResponse {
        return this.setHeader( field, value ), this;
    }
    cookie( name: string, val: string, options: CookieOptions ): IResponse {
        let sCookie: number | string | string[] | undefined = this.getHeader( "Set-Cookie" );
        if ( sCookie instanceof Array ) {
            this.removeHeader( "Set-Cookie" );
        } else {
            sCookie = [];
        }
        sCookie.push( createCookie( name, val, options ) );
        return this.setHeader( "Set-Cookie", sCookie ), this;
    }
    dispose(): void {
        this.removeAllListeners();
        this.destroy();
        return;
    }
    json( body: { [key: string]: any }, compress?: boolean, next?: ( error: Error | null ) => void ): void {
        const json = JSON.stringify( body );
        if ( compress && compress === true ) {
            return _zlib.gzip( Buffer.from(json), ( error: Error | null, buff: Buffer ) => {
                if ( error ) {
                    if ( next ) return next( error );
                    this.writeHead( 500, {
                        'Content-Type': 'text/plain'
                    } ).end( `Runtime Error: ${error.message}` );
                    return void 0;
                }
                this.asJSON( 200, buff.length, true ).end( buff );
                return void 0;
            } );
        }
        return this.asJSON( 200, Buffer.byteLength( json ) ).end( json );
    }
    status( code: number ): IResponse {
        this.statusCode = code;
        return this;
    }
}
class Application extends EventEmitter implements IApplication {
    public server: Server;
    private _appHandler: ILayerInfo<HandlerFunc>[] = [];
    private _prerequisitesHandler: ILayerInfo<HandlerFunc>[] = [];
    private _hasErrorEvnt: boolean = false;
    private _isRunning: boolean = false;
    constructor( server: Server ) {
        super();
        this.server = server;
    }
    shutdown(): Promise<void> {
        let resolveTerminating: (value?: void | PromiseLike<void> | undefined)=> void;
        let rejectTerminating: ( reason?: any ) => void;
        const promise = new Promise<void>( ( resolve, reject ) => {
            resolveTerminating = resolve;
            rejectTerminating = reject;
        } );
        if ( !this._isRunning ) {
            setImmediate( () => {
                rejectTerminating( new Error("Server not running....") );
            }, 0 );
        } else {
            this._isRunning = false;
            this.server.close().once( 'close', () => resolveTerminating() );
        }
        return promise;
    }
    _handleRequest(
        req: IRequest, res: IResponse,
        handlers: ILayerInfo<HandlerFunc>[],
        next: NextFunction,
        isPrerequisites: boolean
    ): void {
        if ( handlers.length === 0 ) return next();
        let isRouted: boolean = false;
        let count: number = 0;
        const Loop = (): void => {
            const inf = handlers[count];
            if ( !inf ) return next();
            if ( !inf.route || isPrerequisites === true )
                return inf.handler.call( this, req, res, _next );
            if ( isRouted ) return _next();
            const routeInfo: IRouteInfo<HandlerFunc> | undefined = getRouteInfo( req.path, handlers, "ANY" );
            isRouted = true;
            if ( routeInfo ) {
                if ( routeInfo.layer.routeMatcher ) {
                    const repRegx: RegExp | undefined = routeInfo.layer.routeMatcher.repRegExp;
                    if ( repRegx)
                        req.path = req.path.replace( repRegx, "" );
                }
                try {
                    return routeInfo.layer.handler.call( this, req, res, _next );
                } catch ( e ) {
                    return next( e );
                }
            }
            return _next();
        }
        function _next( statusCode?: number | Error ): any {
            if ( statusCode instanceof Error ) {
                return next( statusCode );
            }
            count++;
            return Loop();
        }
        return Loop();
    }
    handleRequest( req: IRequest, res: IResponse ): void {
        this._handleRequest( req, res, this._prerequisitesHandler, ( err?: Error ): void => {
            if ( err ) {
                if ( res.headersSent ) return;
                if ( this._hasErrorEvnt ) {
                    return this.emit( "error", req, res, err ), void 0;
                }
                return res.asHTML( 500 ).end( "Error found...." + err.message );
            }
            this._handleRequest( req, res, this._appHandler, ( _err?: Error ): void => {
                if ( res.headersSent ) return;
                if ( this._hasErrorEvnt ) {
                    return this.emit( "error", req, res, _err ), void 0;
                }
                return res.asHTML( 200 ).end( `Can not ${req.method} ${req.path}....` );
            }, false );
        }, true );
    }
    prerequisites( handler: HandlerFunc ): IApplication {
        if ( typeof ( handler ) !== "function" )
            throw new Error( "handler should be function...." );
        return this._prerequisitesHandler.push( {
            handler, routeMatcher: void 0, pathArray: [], method: "ANY", route: ""
        } ), this;
    }
    use( ...args: any[] ): IApplication {
        const argtype0 = typeof ( args[0] );
        const argtype1 = typeof ( args[1] );
        if ( argtype0 === "function" ) {
            return this._appHandler.push( {
                handler: args[0], routeMatcher: void 0,
                pathArray: [], method: "ANY", route: ""
            } ), this;
        }
        if ( argtype0 === "string" && argtype1 === "function" ) {
            const route: string = args[0];
            if ( route.indexOf( ":" ) > -1 ) {
                throw new Error( `Unsupported symbol defined. ${route}` );
            }
            const isVirtual: boolean = typeof ( args[2] ) === "boolean" ? args[2] : false;
            return this._appHandler.push( {
                route,
                handler: args[1],
                routeMatcher: getRouteMatcher( route, isVirtual ),
                pathArray: [], method: "ANY"
            } ), this;
        }
        throw new Error( "Invalid arguments..." );
    }
    listen( handle: any, listeningListener?: () => void ): IApplication {
        if ( this._isRunning ) {
            throw new Error( "Server already running...." );
        }
        if ( this._hasErrorEvnt === false && this.listenerCount( "error" ) > 0 ) {
            this._hasErrorEvnt = true;
        }
        return this.server.listen( handle, () => {
            this._isRunning = true;
            if ( listeningListener )
                return listeningListener();
        } ), this;
    }

}
class Apps extends EventEmitter implements IApps {
    _app: IApplication;
    constructor( ) {
        super();
        this._app = new Application( createServer( ( request: IncomingMessage, response: ServerResponse ) => {
            const req: IRequest = Object.setPrototypeOf( request, Request.prototype );
            const res: IResponse = Object.setPrototypeOf( response, Response.prototype );
            req.init();
            res.on( "close", ( ...args: any[] ): void => {
                this.emit( "response-end", req, res );
            } );
            this.emit( "request-begain", req );
            this._app.handleRequest( req, res );
        } ) );
    }
    shutdown(next?: (err?: Error | undefined) => void): void | Promise<void> {
        this.emit( "shutdown" );
        if ( typeof ( next ) !== "function" ) return this._app.shutdown();
        return this._app.shutdown().then( () => next() ).catch( ( err ) => next( err ) ), void 0;
    }
    onError( handler: ( req: IRequest, res: IResponse, err?: number | Error | undefined ) => void ): void {
        return this._app.on( "error", handler ), void 0;
    }
    use( ...args: any[] ): IApps {
        return this._app.use.apply( this._app, Array.prototype.slice.call( args ) ), this;
    }
    getHttpServer(): Server {
        return this._app.server;
    }
    listen( handle: any, listeningListener?: () => void ): IApps {
        return this._app.listen( handle, listeningListener ), this;
    }
    prerequisites( handler: HandlerFunc ): IApps {
        return this._app.prerequisites( handler ), this;
    }
}
export function App(): IApps {
    return new Apps();
}