/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 11:16 PM 5/2/2020
import { HttpMimeHandler } from './sow-http-mime';
import { IHttpMimeHandler } from './sow-http-mime';
import { IContext, AppHandler } from './sow-server';
import * as fsw from './sow-fsw';
import {
    getRouteMatcher, getRouteInfo,
    ILayerInfo, IRouteInfo
} from './sow-router';
export interface IController {
    readonly httpMimeHandler: IHttpMimeHandler;
    any( route: string, next: AppHandler ): IController;
    get( route: string, next: AppHandler ): IController;
    post( route: string, next: AppHandler ): IController;
    processAny( ctx: IContext ): void;
    reset(): void;
    remove( path: string ): boolean;
    sort(): void;
}
const routeTable: {
    any: { [x: string]: AppHandler };
    get: { [x: string]: AppHandler };
    post: { [x: string]: AppHandler };
    router: ILayerInfo<AppHandler>[];
} = {
    any: {},
    get: {},
    post: {},
    router: []
};
// 1:16 AM 6/7/2020
const fireHandler = ( ctx: IContext ): boolean => {
    if ( routeTable.router.length === 0 ) return false;
    const routeInfo: IRouteInfo<AppHandler> | undefined = getRouteInfo( ctx.path, routeTable.router, ctx.req.method || "GET" );
    if ( !routeInfo ) {
        return false;
    }
    return routeInfo.layer.handler( ctx, routeInfo.requestParam ), true;
};
const getFileName = ( path: string ): string | void => {
    const index: number = path.lastIndexOf( "/" );
    if ( index < 0 ) return void 0;
    return path.substring( index + 1 );
};
export class Controller implements IController {
    private _httpMimeHandler: IHttpMimeHandler;
    public get httpMimeHandler() {
        return this._httpMimeHandler;
    }
    constructor( ) {
        this._httpMimeHandler = new HttpMimeHandler();
    }
    reset(): void {
        delete routeTable.get;
        delete routeTable.post;
        delete routeTable.any;
        delete routeTable.router;
        routeTable.get = {};
        routeTable.post = {};
        routeTable.any = {};
        routeTable.router = [];
    }
    public get( route: string, next: AppHandler ): IController {
        if ( routeTable.get[route] )
            throw new Error( `Duplicate get route defined ${route}` );
        if ( routeTable.any[route] )
            throw new Error( `Duplicate get route defined ${route}` );
        if ( route !== "/" && ( route.indexOf( ":" ) > -1 || route.indexOf( "*" ) > -1 ) ) {
            routeTable.router.push( {
                method: "GET",
                handler: next,
                route,
                pathArray: route.split( "/" ),
                routeMatcher: getRouteMatcher( route )
            } );
        }
        return routeTable.get[route] = next, this;
    }
    public post( route: string, next: AppHandler ): IController {
        if ( routeTable.post[route] )
            throw new Error( `Duplicate post route defined ${route}` );
        if ( routeTable.any[route] )
            throw new Error( `Duplicate post route defined ${route}` );
        if ( route !== "/" && ( route.indexOf( ":" ) > -1 || route.indexOf( "*" ) > -1 ) ) {
            routeTable.router.push( {
                method: "POST",
                handler: next,
                route,
                pathArray: route.split( "/" ),
                routeMatcher: getRouteMatcher( route )
            } );
        }
        return routeTable.post[route] = next, this;
    }
    public any( route: string, next: AppHandler ): IController {
        if ( routeTable.post[route] )
            throw new Error( `Duplicate post route defined ${route}` );
        if ( routeTable.get[route] )
            throw new Error( `Duplicate get route defined ${route}` );
        if ( routeTable.any[route] )
            throw new Error( `Duplicate any route defined ${route}` );
        if ( route !== "/" && ( route.indexOf( ":" ) > -1 || route.indexOf( "*" ) > -1 ) ) {
            routeTable.router.push( {
                method: "ANY",
                handler: next,
                route,
                pathArray: route.split( "/" ),
                routeMatcher: getRouteMatcher( route )
            } );
        }
        return routeTable.any[route] = next, this;
    }
    private passDefaultDoc( ctx: IContext ): void {
        let index: number = -1;
        const forword = (): void => {
            index++;
            const name: string | undefined = ctx.server.config.defaultDoc[index];
            if ( !name ) return ctx.next( 404 );
            const path: string = ctx.server.mapPath( `/${ctx.req.path}${name}${ctx.server.config.defaultExt}` );
            return fsw.isExists( path, ( exists: boolean, url: string ): void => {
                if ( exists ) return ctx.res.render( ctx, url );
                return forword();
            } );
        }
        return forword();
    }
    private sendDefaultDoc( ctx: IContext ): void {
        if ( ctx.server.config.defaultExt && ctx.server.config.defaultExt.length > 0 ) {
            if ( ctx.req.path.charAt( ctx.req.path.length - 1 ) === "/" ) {
                return this.passDefaultDoc(ctx);
            }
            const fileName: string | void = getFileName( ctx.req.path );
            if ( !fileName ) return ctx.next( 404 );
            if ( ctx.server.config.defaultDoc.indexOf( fileName ) > -1 ) return ctx.next( 404 );
            const path: string = ctx.server.mapPath( `/${ctx.req.path}${ctx.server.config.defaultExt}` );
            return fsw.isExists( path, ( exists: boolean, url: string ): void => {
                if ( exists ) return ctx.res.render( ctx, url );
                return ctx.next( 404 );
            } );
        }
        if ( ctx.req.path.charAt( ctx.req.path.length - 1 ) === "/" ) {
            return this.passDefaultDoc( ctx );
        }
        return ctx.next( 404 );
    }
    private processGet( ctx: IContext ): void {
        if ( routeTable.get[ctx.req.path] ) {
            return routeTable.get[ctx.req.path]( ctx );
        }
        if ( fireHandler( ctx ) ) return void 0;
        if ( ctx.extension ) {
            if (
                ctx.server.config.defaultExt
                && ctx.server.config.defaultExt === `.${ctx.extension}`
            ) {
                return ctx.next( 404 );
            }
            if ( ctx.server.config.template.ext.indexOf( ctx.extension ) > -1 ) {
                return ctx.res.render( ctx, ctx.server.mapPath( ctx.req.path ) );
            }
            if ( ctx.server.config.mimeType.indexOf( ctx.extension ) > -1 ) {
                return this.httpMimeHandler.render( ctx, void 0, true );
            }
            return ctx.next( 404, true );
        }
        return this.sendDefaultDoc( ctx );
    }
    private processPost( ctx: IContext ): void {
        if ( routeTable.post[ctx.req.path] ) {
            return routeTable.post[ctx.req.path]( ctx );
        }
        if ( fireHandler( ctx ) ) return void 0;
        return ctx.next( 404 );
    }
    public processAny( ctx: IContext ): void {
        if ( routeTable.any[ctx.path] )
            return routeTable.any[ctx.req.path]( ctx );
        if ( ctx.req.method === "POST" )
            return this.processPost( ctx );
        if ( ctx.req.method === "GET" )
            return this.processGet( ctx );
        return ctx.next( 404 );
    }
    public remove( path: string ): boolean {
        let found: boolean = false;
        if ( routeTable.any[path] ) {
            delete routeTable.any[path]; found = true;
        } else if ( routeTable.post[path] ) {
            delete routeTable.post[path]; found = true;
        } else if ( routeTable.get[path] ) {
            delete routeTable.get[path]; found = true;
        }
        if ( !found ) return false;
        const index: number = routeTable.router.findIndex( r => r.route === path );
        if ( index > -1 ) {
            routeTable.router.splice( index, 1 );
        }
        return true;
    }
    public sort(): void {
        return routeTable.router = routeTable.router.sort( ( a, b ) => {
            return a.route.length - b.route.length;
        } ), void 0;
    }
}