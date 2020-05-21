/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 11:16 PM 5/2/2020
import { HttpMimeHandler } from './sow-http-mime';
import { IHttpMimeHandler } from './sow-http-mime';
import { IContext, AppHandler } from './sow-server';
import { Util } from './sow-util';
export interface IController {
    httpMimeHandler: IHttpMimeHandler;
    any( route: string, next: AppHandler ): IController;
    get( route: string, next: AppHandler ): IController;
    post( route: string, next: AppHandler ): IController;
    processAny( ctx: IContext ): void;
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
const getFileName = ( path: string ): string | void => {
    const index = path.lastIndexOf( "/" );
    if ( index < 0 ) return void 0;
    return path.substring( index + 1 );
}
export class Controller implements IController {
    public httpMimeHandler: IHttpMimeHandler;
    constructor( ) {
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
    private processGet( ctx: IContext ): void {
        if ( routeInfo.get[ctx.req.path] ) {
            return routeInfo.get[ctx.req.path]( ctx );
        }
        if ( ctx.extension ) {
            if ( ['htm', 'html'].indexOf( ctx.extension ) > -1 ) {
                if ( ctx.server.config.defaultExt ) {
                    return ctx.next( 404 );
                }
                return ctx.res.render( ctx, ctx.server.mapPath( ctx.req.path ) );
            }
            if ( ctx.server.config.mimeType.indexOf( ctx.extension ) > -1 ) {
                return this.httpMimeHandler.render( ctx, void 0, true );
            }
            return ctx.next( 404, true );
        } else {
            if ( ctx.server.config.defaultExt ) {
                let path: string = "";
                if ( ctx.req.path.charAt( ctx.req.path.length - 1 ) === "/" ) {
                    for ( const name of ctx.server.config.defaultDoc ) {
                        path = ctx.server.mapPath( `/${ctx.req.path}${name}${ctx.server.config.defaultExt}` );
                        if ( Util.isExists( path ) ) break;
                    }
                    if ( !path || path.length === 0 ) return ctx.next( 404 );
                } else {
                    const fileName = getFileName( ctx.req.path );
                    if ( !fileName ) return ctx.next( 404 );
                    if ( ctx.server.config.defaultDoc.indexOf( fileName ) > -1 ) return ctx.next( 404 );
                    path = ctx.server.mapPath( `/${ctx.req.path}${ctx.server.config.defaultExt}` );
                    if ( !Util.isExists( path, ctx.next ) ) return;
                }
                return ctx.res.render( ctx, path );
            } else {
                if ( ctx.req.path.charAt( ctx.req.path.length - 1 ) === "/" ) {
                    let path: string = "";
                    for ( const name of ctx.server.config.defaultDoc ) {
                        path = ctx.server.mapPath( `/${ctx.req.path}${name}` );
                        if ( Util.isExists( path ) ) break;
                    }
                    if ( !path || path.length === 0 ) return ctx.next( 404 );
                    return ctx.res.render( ctx, path );
                }
            }
        }
        return ctx.next( 404 );
    }
    private processPost( ctx: IContext ): void {
        if ( routeInfo.post[ctx.req.path] ) {
            return routeInfo.post[ctx.req.path]( ctx );
        }
        return ctx.next( 404 );
    }
    public processAny( ctx: IContext ): void {
        if ( routeInfo.any[ctx.path] )
            return routeInfo.any[ctx.req.path]( ctx );
        if ( ctx.req.method === "POST" )
            return this.processPost( ctx );
        if ( ctx.req.method === "GET" )
            return this.processGet( ctx );
        return ctx.next( 404 );
    }
}