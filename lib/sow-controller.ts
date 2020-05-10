/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 11:16 PM 5/2/2020
import { getRouteExp } from './sow-server-core';
import { HttpMimeHandler } from './sow-http-mime';
import { IHttpMimeHandler } from './sow-http-mime';
import { ISowServer, IContext, AppHandler } from './sow-server';
import { Util } from './sow-util';
import { Template } from './sow-template';
export interface IController {
    httpMimeHandler: IHttpMimeHandler;
    any( route: string, next: ( ctx: IContext ) => any ): IController;
    get( route: string, next: ( ctx: IContext ) => any ): IController;
    post( route: string, next: ( ctx: IContext ) => any ): IController;
    processAny( ctx: IContext ): any;
}
const routeInfo: {
    any: { [x: string]: AppHandler };
    get: { [x: string]: AppHandler };
    post: { [x: string]: AppHandler };
} = {
    any: {},
    get: {},
    post: {}
}
export class Controller implements IController {
    private _server: ISowServer;
    public httpMimeHandler: IHttpMimeHandler;
    constructor( server: ISowServer ) {
        this._server = server;
        this.httpMimeHandler = new HttpMimeHandler();
    }
    public get( route: string, next: AppHandler ): IController {
        if ( routeInfo.get[route] )
            throw new Error( `Duplicate get route defined ${route}` );
        return routeInfo.get[route] = next, this;
    }
    public post( route: string, next: AppHandler ): IController {
        if ( routeInfo.post[route] )
            throw new Error( `Duplicate post route defined ${route}` );
        return routeInfo.post[route] = next, this;
    }
    public any( route: string, next: AppHandler ): IController {
        if ( routeInfo.post[route] )
            throw new Error( `Duplicate post route defined ${route}` );
        if ( routeInfo.get[route] )
            throw new Error( `Duplicate get route defined ${route}` );
        if ( routeInfo.any[route] )
            throw new Error( `Duplicate any route defined ${route}` );
        return routeInfo.any[route] = next, this;
    }
    private processGet( ctx: IContext ): any {
        if ( routeInfo.get[ctx.req.path] ) {
            return routeInfo.get[ctx.req.path]( ctx );
        }
        if ( ctx.extension ) {
            if ( ['htm', 'html'].indexOf( ctx.extension ) > -1 ) {
                if ( this._server.config.defaultExt ) {
                    return ctx.next( 404 );
                }
                return Template.parse( this._server, ctx, this._server.mapPath( ctx.req.path ) );
            }
            if ( this._server.config.mimeType.indexOf( ctx.extension ) > -1 ) {
                return this.httpMimeHandler.render( ctx, void 0, true );
            }
            return ctx.next( 404, true );
        } else {
            if ( this._server.config.defaultExt ) {
                const path = this._server.mapPath( `/${ctx.req.path}${this._server.config.defaultExt}` );
                if ( !Util.isExists( path, ctx.next ) ) return;
                return Template.parse( this._server, ctx, path );
            }
        }
        return ctx.next( -404 );
    }
    private processPost( ctx: IContext ): any {
        if ( routeInfo.post[ctx.req.path] ) {
            return routeInfo.post[ctx.req.path]( ctx );
        }
        return ctx.next( -404 );
    }
    processAny( ctx: IContext ): any {
        if ( routeInfo.any[ctx.path] )
            return routeInfo.any[ctx.req.path]( ctx );
        if ( ctx.req.method === "POST" )
            return this.processPost( ctx );
        if ( ctx.req.method === "GET" )
            return this.processGet( ctx );
        return ctx.next( 404 );
    }
}