/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 2:40 PM 5/7/2020
import {
    createServer,
    Server, IncomingMessage, ServerResponse
} from 'http';
import { ToResponseTime, ISession } from './sow-static';
import urlHelpers, { UrlWithParsedQuery } from 'url';
import { Socket } from 'net';
type ParsedUrlQuery = { [key: string]: string | string[] | undefined; };
export type NextFunction = ( err?: any ) => void;
export type HandlerFunc = ( req: IRequest, res: IResponse, next: NextFunction ) => void;
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
export interface IHandlers {
    route?: string; handler: HandlerFunc,
    regexp: RegExp | undefined
}
export interface IRequest extends IncomingMessage {
    socket: Socket;
    q: UrlWithParsedQuery;
    init(): IRequest;
    path: string;
    cookies: { [key: string]: string; };
    query: ParsedUrlQuery;
    session: ISession;
    ip: string;
}
export interface IResponse extends ServerResponse {
    json( body: { [key: string]: any } ): void;
    status( code: number ): IResponse;
    // isEnd: boolean;
    cookie( name: string, val: string, options: CookieOptions ): IResponse;
    set( field: string, value: number | string | string[] ): IResponse;
    redirect( url: string ): void;
}
export interface IApplication {
    server: Server;
    use( ...args: any[] ): IApplication;
    listen( handle: any, listeningListener?: () => void ): IApplication;
    handleRequest( req: IRequest, res: IResponse ): void;
    prerequisites( handler: ( req: IRequest, res: IResponse, next: NextFunction ) => void ): IApplication;
    onError( handler: ( req: IRequest, res: IResponse, err?: Error | number ) => void ): void;
}
export interface IApps {
    use( ...args: any[] ): IApps;
    listen( handle: any, listeningListener?: () => void ): IApps;
    handleRequest( req: IRequest, res: IResponse ): IApps;
    prerequisites( handler: ( req: IRequest, res: IResponse, next: NextFunction ) => void ): IApps;
    getHttpServer(): Server;
    onError( handler: ( req: IRequest, res: IResponse, err?: Error | number ) => void ): void;
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
export class Request extends IncomingMessage implements IRequest {
    public q: UrlWithParsedQuery = Object.create( null );
    public cookies: { [key: string]: string; } = {};
    public session: ISession = Object.create( null );
    public path: string = "";
    public ip: string = "";
    public get query(): ParsedUrlQuery {
        return this.q.query;
    }
    init(): Request {
        this.q = urlHelpers.parse( this.url || "", true );
        this.path = this.q.pathname || "";
        if ( this.socket.remoteAddress ) {
            this.ip = this.socket.remoteAddress;
        } else {
            const remoteAddress = ( this.headers['x-forwarded-for'] || this.connection.remoteAddress )?.toString();
            if ( remoteAddress )
                this.ip = remoteAddress;
        }
        this.cookies = parseCookie( this.headers.cookie );
        return this;
    }
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
// tslint:disable-next-line: max-classes-per-file
export class Response extends ServerResponse implements IResponse {
    redirect( url: string ): void {
        return this.writeHead( this.statusCode, {
            'Location': url
        } ), this.end();
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
        this.setHeader( "Set-Cookie", sCookie );
        return this;
    }
    json( body: { [key: string]: any } ): void {
        const json = JSON.stringify( body );
        this.setHeader( 'Content-Type', 'application/json' );
        this.setHeader( 'Content-Length', Buffer.byteLength( json ) );
        return this.end( json );
    }
    status( code: number ): IResponse {
        this.statusCode = code;
        return this;
    }
}
const getRouteHandler = (
    reqPath: string,
    handlers: IHandlers[]
): {
    route?: string; handler: HandlerFunc,
    regexp: RegExp | undefined
} | undefined => {
    const router = handlers.filter( a => {
        if ( a.regexp )
            return a.regexp.test( reqPath );
        return false;
    } );
    if ( router.length === 0 ) return void 0;
    if ( router.length > 1 ) {
        // let handler: HandlerFunc | undefined;
        let higestLen = -1;
        let index = -1;
        for ( const row of router ) {
            index++;
            if ( !row.route ) continue;
            if ( row.route.length > higestLen ) {
                higestLen = row.route.length;
            }
        }
        if ( index < 0 || higestLen < 0 ) return void 0;
        return router[index];
    }
    return router[0];
}
export function getRouteExp( route: string ): RegExp {
    if ( route.charAt( route.length - 1 ) === '/' ) {
        route = route.substring( 0, route.length - 2 );
    }
    return new RegExp( `^${route.replace( /\//gi, "\\/" )}\/?(?=\/|$)`, "i" );
}
// tslint:disable-next-line: max-classes-per-file
export class Application implements IApplication {
    public server: Server;
    private _appHandler: IHandlers[] = [];
    private _prerequisitesHandler: IHandlers[] = [];
    private _onError?: ( req: IRequest, res: IResponse, err?: Error | number ) => void;
    constructor( server: Server ) {
        this.server = server;
    }
    onError( handler: ( req: IRequest, res: IResponse, err?: Error | number ) => void ): void {
        if ( this._onError ) delete this._onError;
        this._onError = handler;
    }
    _handleRequest(
        req: IRequest, res: IResponse,
        handlers: IHandlers[],
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
            const layer: IHandlers | undefined = getRouteHandler( req.path.substring( 0, req.path.lastIndexOf( "/" ) ) || "/", handlers );
            isRouted = true;
            if ( layer ) {
                if ( layer.regexp )
                    req.path = req.path.replace( layer.regexp, "" );
                return layer.handler.call( this, req, res, _next );
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
                if ( this._onError ) {
                    return this._onError( req, res, err );
                }
                res.writeHead( 500, { 'Content-Type': 'text/html' } );
                res.end( "Error found...." + err.message );
                return;
            }
            // tslint:disable-next-line: no-shadowed-variable
            this._handleRequest( req, res, this._appHandler, ( err?: Error ): void => {
                if ( res.headersSent ) return;
                if ( this._onError ) {
                    return this._onError( req, res, err );
                }
                res.writeHead( 200, { 'Content-Type': 'text/html' } );
                res.end( `Can not ${req.method} ${req.path}....` );
            }, false );
        }, true );
    }
    prerequisites( handler: HandlerFunc ): IApplication {
        if ( typeof ( handler ) !== "function" )
            throw new Error( "handler should be function...." );
        return this._prerequisitesHandler.push( { handler, regexp: void 0 } ), this;
    }
    use( ...args: any[] ): IApplication {
        const argtype0 = typeof ( args[0] );
        const argtype1 = typeof ( args[1] );
        if ( argtype0 === "function" ) {
            return this._appHandler.push( { handler: args[0], regexp: void 0 } ), this;
        }
        if ( argtype0 === "string" && argtype1 === "function" ) {
            return this._appHandler.push( { route: args[0], handler: args[1], regexp: getRouteExp( args[0] ) } ), this;
        }
        throw new Error( "Invalid arguments..." );
    }
    // tslint:disable-next-line: ban-types
    listen( handle: any, listeningListener?: () => void ): IApplication {
        this.server.listen( handle, listeningListener );
        return this;
    }

}
// tslint:disable-next-line: max-classes-per-file
export class Apps implements IApps {
    onError( handler: ( req: IRequest, res: IResponse, err?: number | Error | undefined ) => void ): void {
        throw new Error( "Method not implemented." );
    }
    use( ..._args: any[] ): IApps {
        throw new Error( "Method not implemented." );
    }
    getHttpServer(): Server {
        throw new Error( "Method not implemented." );
    }
    // tslint:disable-next-line: ban-types
    listen( _handle: any, listeningListener?: () => void ): IApps {
        throw new Error( "Method not implemented." );
    }
    handleRequest( req: IRequest, res: IResponse ): IApps {
        throw new Error( "Method not implemented." );
    }
    prerequisites( handler: ( req: IRequest, res: IResponse, next: NextFunction ) => void ): IApps {
        throw new Error( "Method not implemented." );
    }
}
export function App(): IApps {
    const _app: IApplication = new Application( createServer( ( request: IncomingMessage, response: ServerResponse ) => {
        const req: IRequest = Object.setPrototypeOf( request, Request.prototype );
        const res: IResponse = Object.setPrototypeOf( response, Response.prototype );
        req.init();
        _app.handleRequest( req, res );
    } ) );
    const _apps: IApps = new Apps();
    _apps.onError = ( handler: ( req: IRequest, res: IResponse, err?: number | Error | undefined ) => void ): void => {
        return _app.onError( handler );
    }
    _apps.prerequisites = ( handler: ( req: IRequest, res: IResponse, next: NextFunction ) => void ): IApps => {
        return _app.prerequisites( handler ), _apps;
    };
    _apps.getHttpServer = (): Server => {
        return _app.server;
    };
    _apps.use = ( ...args: any[] ): IApps => {
        return _app.use.apply( _app, Array.prototype.slice.call( args ) ), _apps;
    };
    // tslint:disable-next-line: ban-types
    _apps.listen = ( handle: any, listeningListener?: () => void ): IApps => {
        return _app.listen( handle, listeningListener ), _apps;
    };
    return _apps;
}