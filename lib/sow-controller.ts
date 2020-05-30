/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
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
    reset(): void;
    remove( path: string ): boolean;
    sort(): void;
}
export interface IRouterInfo {
    path: string; handler: AppHandler,
    pathArray: string[];
    method: "GET" | "POST" | "ANY"
}
const routeInfo: {
    any: { [x: string]: AppHandler };
    get: { [x: string]: AppHandler };
    post: { [x: string]: AppHandler };
    router: IRouterInfo[];
} = {
    any: {},
    get: {},
    post: {},
    router: []
};
// 1:21 AM 5/28/2020
const concatArray = ( from: string[], to: string[], index: number ): void => {
    const l = from.length;
    for ( let i = index; i < l; i++ ) {
        to.push( from[i] );
    }
};
// 1:21 AM 5/28/2020
const fireHandler = ( ctx: IContext ): boolean => {
    if ( routeInfo.router.length === 0 ) return false;
    const pathArray: string[] = ctx.path.split( "/" );
    const routeParam: string[] = [];
    const router: IRouterInfo | undefined = routeInfo.router.find( ( info: IRouterInfo ): boolean => {
        if ( routeParam.length > 0 ) routeParam.length = 0;
        if ( info.method !== "ANY" ) {
            if ( info.method !== ctx.req.method ) return false;
        }
        if ( info.pathArray[1] !== "*" && info.pathArray[1].indexOf( ":" ) < 0 && pathArray[1] !== info.pathArray[1] ) return false;
        let reqPath: string = "";
        let path: string = "";
        let index: number = 0;
        for ( const part of info.pathArray ) {
            if ( part ) {
                if ( !pathArray[index] ) {
                    if ( part === "*" ) {
                        concatArray( pathArray, routeParam, index );
                        return true;
                    }
                    return false;
                }
                reqPath += `/${pathArray[index]}`;
                if ( part === "*" ) {
                    if ( index > 1 ) {
                        concatArray( pathArray, routeParam, index );
                        return true;
                    }
                    path += `/${pathArray[index]}`;
                    if ( reqPath !== path ) return false;
                    concatArray( pathArray, routeParam, index );
                    return true;
                }
                if ( part.indexOf( ":" ) > -1 ) {
                    path += `/${pathArray[index]}`;
                    routeParam.push( pathArray[index] );
                } else {
                    if ( pathArray[index] !== part ) return false;
                    path += `/${part}`;
                    if ( reqPath !== path ) return false;
                }
            }
            index++;
        }
        if ( path === reqPath ) {
            if ( info.pathArray.length < pathArray.length ) {
                if ( info.pathArray[index] !== "*" ) return false;
            }
            // if ( pathArray.length > index ) {
            //    concatArray( pathArray, routeParam, index );
            // }
            return true;
        }
        return false;
    } );
    if ( !router ) return false;
    return router.handler( ctx, routeParam ), true;
};
const getFileName = ( path: string ): string | void => {
    const index = path.lastIndexOf( "/" );
    if ( index < 0 ) return void 0;
    return path.substring( index + 1 );
};
export class Controller implements IController {
    public httpMimeHandler: IHttpMimeHandler;
    constructor( ) {
        this.httpMimeHandler = new HttpMimeHandler();
    }
    reset(): void {
        delete routeInfo.get;
        delete routeInfo.post;
        delete routeInfo.any;
        delete routeInfo.router;
        routeInfo.get = {};
        routeInfo.post = {};
        routeInfo.any = {};
        routeInfo.router = [];
    }
    public get( route: string, next: AppHandler ): IController {
        if ( routeInfo.get[route] )
            throw new Error( `Duplicate get route defined ${route}` );
        if ( routeInfo.any[route] )
            throw new Error( `Duplicate get route defined ${route}` );
        if ( route !== "/" && ( route.indexOf( ":" ) > -1 || route.indexOf( "*" ) > -1 ) ) {
            routeInfo.router.push( {
                method: "GET",
                handler: next,
                path: route,
                pathArray: route.split( "/" )
            } );
        }
        return routeInfo.get[route] = next, this;
    }
    public post( route: string, next: AppHandler ): IController {
        if ( routeInfo.post[route] )
            throw new Error( `Duplicate post route defined ${route}` );
        if ( routeInfo.any[route] )
            throw new Error( `Duplicate post route defined ${route}` );
        if ( route !== "/" && ( route.indexOf( ":" ) > -1 || route.indexOf( "*" ) > -1 ) ) {
            routeInfo.router.push( {
                method: "POST",
                handler: next,
                path: route,
                pathArray: route.split( "/" )
            } );
        }
        return routeInfo.post[route] = next, this;
    }
    public any( route: string, next: AppHandler ): IController {
        if ( routeInfo.post[route] )
            throw new Error( `Duplicate post route defined ${route}` );
        if ( routeInfo.get[route] )
            throw new Error( `Duplicate get route defined ${route}` );
        if ( routeInfo.any[route] )
            throw new Error( `Duplicate any route defined ${route}` );
        if ( route !== "/" && ( route.indexOf( ":" ) > -1 || route.indexOf( "*" ) > -1 ) ) {
            routeInfo.router.push( {
                method: "ANY",
                handler: next,
                path: route,
                pathArray: route.split( "/" )
            } );
        }
        return routeInfo.any[route] = next, this;
    }
    private processGet( ctx: IContext ): void {
        if ( routeInfo.get[ctx.req.path] ) {
            return routeInfo.get[ctx.req.path]( ctx );
        }
        if ( fireHandler( ctx ) ) return void 0;
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
            if ( ctx.server.config.defaultExt && ctx.server.config.defaultExt.length > 0 ) {
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
        if ( fireHandler( ctx ) ) return void 0;
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
    public remove( path: string ): boolean {
        let found: boolean = false;
        if ( routeInfo.any[path] ) {
            delete routeInfo.any[path]; found = true;
        } else if ( routeInfo.post[path] ) {
            delete routeInfo.post[path]; found = true;
        } else if ( routeInfo.get[path] ) {
            delete routeInfo.get[path]; found = true;
        }
        if ( !found ) return false;
        const index = routeInfo.router.findIndex( r => r.path === path );
        if ( index > -1 ) {
            routeInfo.router.splice( index, 1 );
        }
        return true;
    }
    public sort(): void {
        routeInfo.router = routeInfo.router.sort( ( a, b ) => {
            return a.path.length - b.path.length;
        } );
    }
}