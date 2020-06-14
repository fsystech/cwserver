"use strict";
Object.defineProperty( exports, "__esModule", { value: true } );
exports.Controller = void 0;
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 11:16 PM 5/2/2020
const sow_http_mime_1 = require( "./sow-http-mime" );
const sow_router_1 = require( "./sow-router" );
const sow_util_1 = require( "./sow-util" );
const routeTable = {
    any: {},
    get: {},
    post: {},
    router: []
};
// 1:16 AM 6/7/2020
const fireHandler = ( ctx ) => {
    if ( routeTable.router.length === 0 )
        return false;
    const routeInfo = sow_router_1.getRouteInfo( ctx.path, routeTable.router, ctx.req.method || "GET" );
    if ( !routeInfo ) {
        return false;
    }
    return routeInfo.layer.handler( ctx, routeInfo.requestParam ), true;
};
const getFileName = ( path ) => {
    const index = path.lastIndexOf( "/" );
    if ( index < 0 )
        return void 0;
    return path.substring( index + 1 );
};
class Controller {
    constructor() {
        this.httpMimeHandler = new sow_http_mime_1.HttpMimeHandler();
    }
    reset() {
        delete routeTable.get;
        delete routeTable.post;
        delete routeTable.any;
        delete routeTable.router;
        routeTable.get = {};
        routeTable.post = {};
        routeTable.any = {};
        routeTable.router = [];
    }
    get( route, next ) {
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
                routeMatcher: sow_router_1.getRouteMatcher( route )
            } );
        }
        return routeTable.get[route] = next, this;
    }
    post( route, next ) {
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
                routeMatcher: sow_router_1.getRouteMatcher( route )
            } );
        }
        return routeTable.post[route] = next, this;
    }
    any( route, next ) {
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
                routeMatcher: sow_router_1.getRouteMatcher( route )
            } );
        }
        return routeTable.any[route] = next, this;
    }
    processGet( ctx ) {
        if ( routeTable.get[ctx.req.path] ) {
            return routeTable.get[ctx.req.path]( ctx );
        }
        if ( fireHandler( ctx ) )
            return void 0;
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
        }
        else {
            if ( ctx.server.config.defaultExt && ctx.server.config.defaultExt.length > 0 ) {
                let path = "";
                if ( ctx.req.path.charAt( ctx.req.path.length - 1 ) === "/" ) {
                    for ( const name of ctx.server.config.defaultDoc ) {
                        path = ctx.server.mapPath( `/${ctx.req.path}${name}${ctx.server.config.defaultExt}` );
                        if ( sow_util_1.Util.isExists( path ) )
                            break;
                    }
                    if ( !path || path.length === 0 )
                        return ctx.next( 404 );
                }
                else {
                    const fileName = getFileName( ctx.req.path );
                    if ( !fileName )
                        return ctx.next( 404 );
                    if ( ctx.server.config.defaultDoc.indexOf( fileName ) > -1 )
                        return ctx.next( 404 );
                    path = ctx.server.mapPath( `/${ctx.req.path}${ctx.server.config.defaultExt}` );
                    if ( !sow_util_1.Util.isExists( path, ctx.next ) )
                        return;
                }
                return ctx.res.render( ctx, path );
            }
            else {
                if ( ctx.req.path.charAt( ctx.req.path.length - 1 ) === "/" ) {
                    let path = "";
                    for ( const name of ctx.server.config.defaultDoc ) {
                        path = ctx.server.mapPath( `/${ctx.req.path}${name}` );
                        if ( sow_util_1.Util.isExists( path ) )
                            break;
                    }
                    if ( !path || path.length === 0 )
                        return ctx.next( 404 );
                    return ctx.res.render( ctx, path );
                }
            }
        }
        return ctx.next( 404 );
    }
    processPost( ctx ) {
        if ( routeTable.post[ctx.req.path] ) {
            return routeTable.post[ctx.req.path]( ctx );
        }
        if ( fireHandler( ctx ) )
            return void 0;
        return ctx.next( 404 );
    }
    processAny( ctx ) {
        if ( routeTable.any[ctx.path] )
            return routeTable.any[ctx.req.path]( ctx );
        if ( ctx.req.method === "POST" )
            return this.processPost( ctx );
        if ( ctx.req.method === "GET" )
            return this.processGet( ctx );
        return fireHandler( ctx ) ? void 0 : ctx.next( 404 );
    }
    remove( path ) {
        let found = false;
        if ( routeTable.any[path] ) {
            delete routeTable.any[path];
            found = true;
        }
        else if ( routeTable.post[path] ) {
            delete routeTable.post[path];
            found = true;
        }
        else if ( routeTable.get[path] ) {
            delete routeTable.get[path];
            found = true;
        }
        if ( !found )
            return false;
        const index = routeTable.router.findIndex( r => r.route === path );
        if ( index > -1 ) {
            routeTable.router.splice( index, 1 );
        }
        return true;
    }
    sort() {
        routeTable.router = routeTable.router.sort( ( a, b ) => {
            return a.route.length - b.route.length;
        } );
    }
}
exports.Controller = Controller;
//# sourceMappingURL=sow-controller.js.map