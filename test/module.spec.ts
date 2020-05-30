/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 4:38 AM 5/22/2020
import expect from 'expect';
import * as fs from 'fs';
import * as path from 'path';
import * as cwserver from '../index';
import { Session, ToNumber } from '../lib/sow-static';
import { IAppUtility, IContext } from '../lib/sow-server';
import { IApps } from '../lib/sow-server-core';
import { Util } from '../lib/sow-util';
import { Schema } from '../lib/sow-schema-validator';
import * as request from 'superagent';
import * as io from 'socket.io-client';
import { shouldBeError } from "./test-view";
import { Logger } from '../lib/sow-logger';
import 'mocha';
let appUtility: IAppUtility;
let app: IApps;
const appRoot = process.env.SCRIPT === "TS" ? path.join( path.resolve( __dirname, '..' ), "/dist/test/" ) : __dirname;
const projectRoot = 'cwserver.safeonline.world';
const logDir = path.resolve( './log/' );
type Agent = request.SuperAgentStatic & request.Request;
const agent: Agent = request.agent();
let appIsLestening: boolean = false;
const getAgent = (): Agent => {
    expect( appIsLestening ).toEqual( true );
    return agent;
};
const shutdownApp = ( done?: Mocha.Done ) => {
    try {
        app.shutdown( () => {
            if ( !done ) return;
            done();
        } );
    } catch ( e ) {
        if ( !done ) return;
        done( e );
    }
}
describe( "cwserver-default-project-template", () => {
    it( "create project template", ( done ) => {
        cwserver.createProjectTemplate( {
            appRoot,
            projectRoot,
            allExample: false,
            force: true, // Delete if projectRoot exists
            isTest: true // add test view
        } );
        done();
    } );
} );
describe( "cwserver-core", () => {
    it( "initilize server throw error (mismatch between given appRoot and config.hostInfo.root)", ( done ) => {
        const root: string = path.resolve( `${appRoot}/ewww` ); // path.resolve( appRoot, "/ewww" );
        Util.mkdirSync( appRoot, "/ewww/config" );
        expect( fs.existsSync( root ) ).toEqual( true );
        const filePath: string = path.resolve( root + "/config/app.config.json" );
        const fromFile: string = path.resolve( `${appRoot}/${projectRoot}/config/app.config.json` );
        expect( fs.existsSync( fromFile ) ).toEqual( true );
        fs.copyFileSync( fromFile, filePath );
        expect( shouldBeError( () => {
            cwserver.initilizeServer( appRoot, `ewww` );
        } ) ).toBeInstanceOf( Error );
        Util.rmdirSync( root );
        done();
    } );
    it( "initilize server throw error (invalid app.config.json)", ( done ) => {
        const root: string = path.resolve( `${appRoot}/ewww` ); // path.resolve( appRoot, "/ewww" );
        Util.mkdirSync( appRoot, "/ewww/config" );
        expect( fs.existsSync( root ) ).toEqual( true );
        const filePath: string = path.resolve( root + "/config/app.config.json" );
        fs.writeFileSync( filePath, "INVALID_FILE" );
        expect( shouldBeError( () => {
            cwserver.initilizeServer( appRoot, `ewww` );
        } ) ).toBeInstanceOf( Error );
        Util.rmdirSync( root );
        done();
    } );
    it( "initilize server throw error (projectRoot not provided)", ( done ) => {
        expect( shouldBeError( () => {
            cwserver.initilizeServer( appRoot );
        } ) ).toBeInstanceOf( Error );
        done();
    } );
    it( "initilize server throw error (projectRoot not provided)", ( done ) => {
        expect( shouldBeError( () => {
            cwserver.initilizeServer( appRoot );
        } ) ).toBeInstanceOf( Error );
        done();
    } );
    it( "initilize server throw error (projectRoot not provided while you using IISNODE)", ( done ) => {
        process.env.IISNODE_VERSION = "iisnode";
        expect( shouldBeError( () => {
            cwserver.initilizeServer( appRoot );
        } ) ).toBeInstanceOf( Error );
        process.env.IISNODE_VERSION = "";
        done();
    } );
    it( "initilize server throw error (projectRoot not found)", ( done ) => {
        expect( shouldBeError( () => {
            cwserver.initilizeServer( appRoot, `${projectRoot}_not_found` );
        } ) ).toBeInstanceOf( Error );
        done();
    } );
    it( "initilize server throw error (app.config.json not found)", ( done ) => {
        expect( shouldBeError( () => {
            cwserver.initilizeServer( appRoot, `/` );
        } ) ).toBeInstanceOf( Error );
        done();
    } );
    it( "initilize server", ( done ) => {
        if ( fs.existsSync( logDir ) ) {
            Util.rmdirSync( logDir );
        }
        appUtility = cwserver.initilizeServer( appRoot, projectRoot );
        expect( appUtility.public ).toEqual( projectRoot );
        done();
    } );
    it( "initilize server throw error (Server instance can initilize 1 time)", ( done ) => {
        expect( shouldBeError( () => {
            cwserver.initilizeServer( appRoot, projectRoot );
        } ) ).toBeInstanceOf( Error );
        done();
    } );
    it( "initilize application", ( done ) => {
        app = appUtility.init();
        done();
    } );
    it( "application listen", ( done ) => {
        app.listen( appUtility.port, () => {
            appUtility.log.write( `
    [+] Maintance      : https://www.safeonline.world
    [+] Server         : http://localhost:${appUtility.port}
    [+] Socket         : ws://localhost:${appUtility.port}${appUtility.socketPath}
    [~] Running appUtility...
            `, cwserver.ConsoleColor.FgMagenta );
            shutdownApp( done );
        } );
    } );
    it( "throw application already shutdown", ( done ) => {
        app.shutdown( ( err ) => {
            expect( err ).toBeInstanceOf( Error );
            done();
        } );
    } );
    it( "throw application already listen", ( done ) => {
        app.listen( appUtility.port, () => {
            expect( shouldBeError( () => {
                app.listen( appUtility.port );
            } ) ).toBeInstanceOf( Error );
            // await app.shutdown();
            appIsLestening = true;
            done();
        } );
    } );
} );
describe( "cwserver-view", () => {
    it( 'register view', ( done ) => {
        const invoke = ( ctx: IContext ) => {
            ctx.res.writeHead( 200, {
                "Content-Type": "text/plain"
            } );
            ctx.res.end( "Hello test-controller" );
            return ctx.next( 200 );
        };
        appUtility.controller.get( "/test-controller", invoke )
            .post( "/test-controller", invoke )
            .any( "/any-controller", invoke );
        expect( shouldBeError( () => {
            appUtility.controller.get( "/test-controller", invoke );
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            appUtility.controller.post( "/test-controller", invoke );
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            appUtility.controller.post( "/any-controller", invoke );
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            appUtility.controller.any( "/test-controller", invoke );
        } ) ).toBeInstanceOf( Error );
        appUtility.controller.get( "/get-test-controller", invoke )
            .post( "/post-test-controller", invoke );
        expect( shouldBeError( () => {
            appUtility.controller.get( "/get-test-controller", invoke );
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            appUtility.controller.post( "/post-test-controller", invoke );
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            appUtility.controller.any( "/get-test-controller", invoke );
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            appUtility.controller.any( "/post-test-controller", invoke );
        } ) ).toBeInstanceOf( Error );
        appUtility.controller.any( "/any-test-controller", invoke );
        expect( shouldBeError( () => {
            appUtility.controller.any( "/any-test-controller", invoke );
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            appUtility.controller.get( "/any-test-controller", invoke );
        } ) ).toBeInstanceOf( Error );
        done();
    } );
    it( 'should throw error (After initilize view, you should not register new veiw)', ( done ) => {
        expect( shouldBeError( () => {
            // tslint:disable-next-line: no-empty
            global.sow.server.on( "register-view", ( _app, controller, server ) => {} );
        } ) ).toBeInstanceOf( Error );
        done();
    } );
} );
describe( "cwserver-session", () => {
    const loginId = "rajib";
    it( 'authenticate-request', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/authenticate` )
            .query( { loginId } )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "application/json" );
                expect( res.header["set-cookie"] ).toBeDefined();
                expect( res.body ).toBeInstanceOf( Object );
                expect( res.body.userInfo ).toBeInstanceOf( Object );
                expect( res.body.userInfo.loginId ).toEqual( loginId );
                expect( res.body.hash ).toEqual( cwserver.Encryption.toMd5( loginId ) );
                done();
            } );
    } );
    it( 'should-be-user-authenticated', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/is-authenticate` )
            .query( { loginId } )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "application/json" );
                expect( res.body ).toBeInstanceOf( Object );
                expect( res.body.loginId ).toEqual( loginId );
                expect( res.body.userData ).toBeDefined();
                done();
            } );
    } );
    it( 'authenticated-user-should-be-redirect-to-home', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/authenticate` )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.redirects.length ).toEqual( 1 ); // should be redirect home page
                expect( res.redirects.indexOf( `http://localhost:${appUtility.port}/` ) ).toBeGreaterThan( -1 );
                done();
            } );
    } );
} );
describe( "cwserver-get", () => {
    it( 'send get request to application', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/` )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "text/html" );
                done();
            } );
    } );
    it( 'test applicaton cookie', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/cookie` )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "application/json" );
                const cook: string[] = res.get( "Set-Cookie" );
                expect( cook.length ).toEqual( 3 );
                done();
            } );
    } );
    it( 'try to access config.hiddenDirectory', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/lib/` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'try to access $root', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/$root/` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'get-raw-file', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/get-file` )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                done();
            } );
    } );
    it( 'redirect request to controller', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/redirect` )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.redirects.length ).toEqual( 1 ); // should be redirect home page
                expect( res.redirects.indexOf( `http://localhost:${appUtility.port}/` ) ).toBeGreaterThan( -1 );
                done();
            } );
    } );
    it( 'test route target /test-any/*', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/test-any/param/go` )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "application/json" );
                expect( res.body ).toBeInstanceOf( Object );
                expect( res.body.servedFrom ).toEqual( '/test-any/*' );
                expect( res.body.q ).toBeInstanceOf( Array );
                expect( res.body.q.indexOf( "param" ) ).toBeGreaterThan( -1 );
                done();
            } );
    } );
    it( 'test route target /task/:id/*', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/task/1/test_request/next` )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "application/json" );
                expect( res.body ).toBeInstanceOf( Object );
                expect( res.body.servedFrom ).toEqual( '/task/:id/*' );
                expect( res.body.q ).toBeInstanceOf( Array );
                expect( res.body.q.indexOf( "1" ) ).toBeGreaterThan( -1 );
                expect( res.body.q.indexOf( "test_request" ) ).toBeGreaterThan( -1 );
                done();
            } );
    } );
    it( 'test route target /dist/*', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/dist` )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "application/json" );
                expect( res.body ).toBeInstanceOf( Object );
                expect( res.body.servedFrom ).toEqual( '/dist/*' );
                done();
            } );
    } );
    it( 'test route target /user/:id/settings', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/user/10/settings/100` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'should be 404 route target /test-c/:id', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/test-c/10/df/a` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'should be 404 target route /test-c/:id not match', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/test-c/` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'target route /*', ( done ) => {
        const route: string = "/*";
        appUtility.controller.any( route, ( ctx: IContext, routeParam?: string[] ) => {
            return ctx.res.json( { reqPath: ctx.path, servedFrom: "/*", q: routeParam } );
        } );
        appUtility.controller.sort();
        getAgent()
            .get( `http://localhost:${appUtility.port}/test-c/zxy` )
            .end( ( err, res ) => {
                expect( appUtility.controller.remove( route ) ).toEqual( true );
                expect( appUtility.controller.remove( "/_NOP_/" ) ).toEqual( false );
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.body.servedFrom ).toEqual( '/*' );
                done();
            } );
    } );
} );
describe( "cwserver-template-engine", () => {
    it( 'should served from server mem cache', ( done ) => {
        const old = appUtility.server.config.template;
        appUtility.server.config.template.cacheType = "MEM";
        appUtility.server.config.template.cache = true;
        getAgent()
            .get( `http://localhost:${appUtility.port}/` )
            .end( ( err, res ) => {
                appUtility.server.config.template = old;
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "text/html" );
                done();
            } );
    } );
    it( 'should throw template runtime error', ( done ) => {
        const filePath: string = appUtility.server.mapPath( "/test.html" );
        expect( fs.existsSync( filePath ) ).toEqual( false );
        fs.writeFileSync( filePath, "{% server.invalid_method() %}" );
        expect( fs.existsSync( filePath ) ).toEqual( true );
        getAgent()
            .get( `http://localhost:${appUtility.port}/test` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 500 );
                expect( res.header["content-type"] ).toBe( "text/html" );
                done();
            } );
    } );
    it( 'send get request should be 404 response config.defaultExt = .html', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/index.html` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                expect( res.header["content-type"] ).toBe( "text/html" );
                done();
            } );
    } );
    it( 'send get request should be 200 response', ( done ) => {
        const defaultExt = appUtility.server.config.defaultExt;
        appUtility.server.config.defaultExt = "";
        getAgent()
            .get( `http://localhost:${appUtility.port}/index.html` )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "text/html" );
                appUtility.server.config.defaultExt = defaultExt;
                done();
            } );
    } );
    let templateConf: { [x: string]: any; } | void;
    it( 'route `/` then should use config.defaultDoc and create template cache', ( done ) => {
        templateConf = Util.clone( appUtility.server.config.template );
        appUtility.server.config.template.cache = true;
        appUtility.server.config.template.cacheType = "FILE";
        getAgent()
            .get( `http://localhost:${appUtility.port}/` )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "text/html" );
                done();
            } );
    } );
    it( 'should be serve from template cache', ( done ) => {
        expect( Util.isPlainObject( templateConf ) ).toBe( true );
        getAgent()
            .get( `http://localhost:${appUtility.port}/` )
            .end( ( err, res ) => {
                if ( templateConf ) {
                    Util.extend( appUtility.server.config.template, templateConf );
                }
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "text/html" );
                done();
            } );
    } );
} );
describe( "cwserver-bundler", () => {
    let eTag: string = "";
    let lastModified: string = "";
    it( 'js file bundler with gizp response (server file cache)', ( done ) => {
        const temp = appUtility.server.mapPath( `/web/temp/` );
        if ( fs.existsSync( temp ) ) {
            Util.rmdirSync( temp );
        }
        request
            .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
            .query( {
                g: appUtility.server.createBundle( `
                        $virtual_vtest/socket-client.js,
                        static/script/test-1.js,
                        static/script/test-2.js|__owner__`
                ),
                ck: "bundle_test_js", ct: "text/javascript", rc: "Y"
            } )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "application/x-javascript; charset=utf-8" );
                expect( res.header["content-encoding"] ).toBe( "gzip" );
                expect( res.header.etag ).not.toBeUndefined();
                expect( res.header["last-modified"] ).toBeDefined();
                lastModified = res.header['last-modified'];
                eTag = res.header.etag;
                done();
            } );
    } );
    it( 'bundler should compair if-modified-since header and send 304', ( done ) => {
        request
            .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
            .set( "if-modified-since", lastModified )
            .query( {
                g: appUtility.server.createBundle( `
                        $virtual_vtest/socket-client.js,
                        static/script/test-1.js,
                        static/script/test-2.js|__owner__`
                ),
                ck: "bundle_test_js", ct: "text/javascript", rc: "Y"
            } )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 304 );
                expect( res.header["x-server-revalidate"] ).toBe( "true" );
                done();
            } );
    } );
    it( 'bundler should be skip invalid if-modified-since header and send 200', ( done ) => {
        request
            .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
            .set( "if-modified-since", `AAA${lastModified}ZZZ` )
            .query( {
                g: appUtility.server.createBundle( `
                        $virtual_vtest/socket-client.js,
                        static/script/test-1.js,
                        static/script/test-2.js|__owner__`
                ),
                ck: "bundle_test_js", ct: "text/javascript", rc: "Y"
            } )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "application/x-javascript; charset=utf-8" );
                expect( res.header["content-encoding"] ).toBe( "gzip" );
                done();
            } );
    } );
    it( 'bundler should compair if-none-match and send 304', ( done ) => {
        request
            .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
            .set( "if-none-match", eTag )
            .query( {
                g: appUtility.server.createBundle( `
                        $virtual_vtest/socket-client.js,
                        static/script/test-1.js,
                        static/script/test-2.js|__owner__`
                ),
                ck: "bundle_test_js", ct: "text/javascript", rc: "Y"
            } )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 304 );
                expect( res.header["x-server-revalidate"] ).toBe( "true" );
                done();
            } );
    } );
    it( 'js file bundler not gizp response (no server cache)', ( done ) => {
        appUtility.server.config.bundler.compress = false;
        appUtility.server.config.bundler.fileCache = false;
        request
            .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
            .query( {
                g: appUtility.server.createBundle( `
                        $virtual_vtest/socket-client.js,
                        static/script/test-1.js,
                        static/script/test-2.js|__owner__`
                ),
                ck: "bundle_test_js", ct: "text/javascript", rc: "Y"
            } )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "application/x-javascript; charset=utf-8" );
                expect( res.header["content-encoding"] ).toBeUndefined();
                done();
            } );
    } );
    it( 'js file bundler with gizp response (no server cache)', ( done ) => {
        appUtility.server.config.bundler.fileCache = false;
        appUtility.server.config.bundler.compress = true;
        request
            .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
            .query( {
                g: appUtility.server.createBundle( `
                        $virtual_vtest/socket-client.js,
                        static/script/test-1.js,
                        static/script/test-2.js|__owner__`
                ),
                ck: "bundle_test_js", ct: "text/javascript", rc: "Y"
            } )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "application/x-javascript; charset=utf-8" );
                expect( res.header["content-encoding"] ).toBe( "gzip" );
                expect( res.header["last-modified"] ).toBeDefined();
                lastModified = res.header['last-modified'];
                done();
            } );
    } );
    it( 'bundler should compair if-modified-since header and send 304 (no server cache)', ( done ) => {
        appUtility.server.config.bundler.fileCache = false;
        request
            .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
            .set( "if-modified-since", lastModified )
            .query( {
                g: appUtility.server.createBundle( `
                        $virtual_vtest/socket-client.js,
                        static/script/test-1.js,
                        static/script/test-2.js|__owner__`
                ),
                ck: "bundle_test_js", ct: "text/javascript", rc: "Y"
            } )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 304 );
                expect( res.header["x-server-revalidate"] ).toBe( "true" );
                done();
            } );
    } );
    it( 'css file bundler with gizp response (server file cache)', ( done ) => {
        appUtility.server.config.bundler.fileCache = true;
        request
            .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
            .query( {
                g: appUtility.server.createBundle( `
                       static/css/test-1.css,
                       static/css/test-2.css|__owner__`
                ),
                ck: "bundle_test_css", ct: "text/css", rc: "Y"
            } )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "text/css" );
                expect( res.header["content-encoding"] ).toBe( "gzip" );
                expect( res.header.etag ).not.toBeUndefined();
                expect( res.header["last-modified"] ).not.toBeUndefined();
                done();
            } );
    } );
    it( 'js file bundler not gizp response (server cache)', ( done ) => {
        appUtility.server.config.bundler.compress = false;
        appUtility.server.config.bundler.fileCache = true;
        request
            .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
            .query( {
                g: appUtility.server.createBundle( `
                        $virtual_vtest/socket-client.js,
                        static/script/test-1.js`
                ),
                ck: "bundle_no_zip", ct: "text/javascript", rc: "Y"
            } )
            .end( async ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "application/x-javascript; charset=utf-8" );
                expect( res.header["content-encoding"] ).toBeUndefined();
                done();
            } );
    } );
} );
describe( "cwserver-bundler-error", () => {
    it( 'bundler should be virtual file error', ( done ) => {
        appUtility.server.config.bundler.fileCache = false;
        getAgent()
            .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
            .query( {
                g: appUtility.server.createBundle( `
                        $virtual_vtest/xsocket-client.js,
                        $root/$public/static/script/test-1.js,
                        $root/$public/static/script/test-2.js|__owner__`
                ),
                ck: "bundle_test_jsx", ct: "text/javascript", rc: "Y"
            } )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 500 );
                done();
            } );
    } );
    it( 'bundler should be virtual error', ( done ) => {
        appUtility.server.config.bundler.fileCache = false;
        getAgent()
            .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
            .query( {
                g: appUtility.server.createBundle( `
                        $virtual_xvtest/socket-client.js,
                        $root/$public/static/script/test-1.js,
                        $root/$public/static/script/test-2.js|__owner__`
                ),
                ck: "bundle_test_jsx", ct: "text/javascript", rc: "Y"
            } )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 500 );
                done();
            } );
    } );
    it( 'bundler should be unsupported content type error', ( done ) => {
        appUtility.server.config.bundler.fileCache = false;
        getAgent()
            .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
            .query( {
                g: appUtility.server.createBundle( `
                        $virtual_vtest/socket-client.js,
                        $root/$public/static/script/test-1.js,
                        $root/$public/static/script/test-2.js|__owner__`
                ),
                ck: "bundle_test_jsx", ct: "text/plain", rc: "Y"
            } )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'bundler should be path parse error', ( done ) => {
        appUtility.server.config.bundler.fileCache = false;
        getAgent()
            .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
            .query( {
                g: appUtility.server.createBundle( `
                        $virtual_vtest/socket-client.js,
                        $rootx/$public/static/script/test-1.js,
                        $root/$public/static/script/test-2.js|__owner__`
                ),
                ck: "bundle_test_jsx", ct: "text/javascript", rc: "Y"
            } )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 500 );
                done();
            } );
    } );
    it( 'bundler should be encryption error', ( done ) => {
        appUtility.server.config.bundler.fileCache = false;
        getAgent()
            .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
            .query( {
                g: `$virtual_vtest/socket-client.js`,
                ck: "bundle_test_jsx", ct: "text/javascript", rc: "Y"
            } )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'bundler should be error (no param (no cache))', ( done ) => {
        appUtility.server.config.bundler.fileCache = false;
        getAgent()
            .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'bundler should be error (no param (server cache))', ( done ) => {
        appUtility.server.config.bundler.fileCache = true;
        getAgent()
            .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'bundler should be encryption error (server cache)', ( done ) => {
        appUtility.server.config.bundler.fileCache = true;
        getAgent()
            .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
            .query( {
                g: `$virtual_vtest/socket-client.js`,
                ck: "bundle_test_jsx", ct: "text/javascript", rc: "Y"
            } )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
} );
describe( "cwserver-post", () => {
    it( 'send post request content type application/json', ( done ) => {
        getAgent()
            .post( `http://localhost:${appUtility.port}/post` )
            .send( JSON.stringify( { name: 'rajibs', occupation: 'kutukutu' } ) )
            .set( 'Content-Type', 'application/json' )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "application/json" );
                expect( res.body.name ).toBe( 'rajibs' );
                done();
            } );
    } );
    it( 'send post request content type urlencoded', ( done ) => {
        getAgent()
            .post( `http://localhost:${appUtility.port}/post` )
            .type( 'form' )
            .send( { name: 'rajibs', occupation: 'kutukutu' } )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "application/json" );
                expect( res.body.name ).toBe( 'rajibs' );
                done();
            } );
    } );
    it( 'send post request to async handler', ( done ) => {
        getAgent()
            .post( `http://localhost:${appUtility.port}/post-async` )
            .type( 'form' )
            .send( { name: 'rajibs', occupation: 'kutukutu' } )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "application/json" );
                expect( res.body.name ).toBe( 'rajibs' );
                done();
            } );
    } );
    it( 'should post request not found', ( done ) => {
        getAgent()
            .post( `http://localhost:${appUtility.port}/post/invalid-route` )
            .send( JSON.stringify( { name: 'rajibs', occupation: 'kutukutu' } ) )
            .set( 'Content-Type', 'application/json' )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
} );
describe( "cwserver-gzip-response", () => {
    it( 'should be response type gzip', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/response` )
            .query( { task: "gzip", data: JSON.stringify( { name: 'rajibs', occupation: 'kutukutu' } ) } )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-encoding"] ).toBe( "gzip" );
                done();
            } );
    } );
} );
describe( "cwserver-mime-type", () => {
    it( 'served static file no cache', ( done ) => {
        const old = appUtility.server.config.liveStream;
        appUtility.server.config.liveStream = [];
        getAgent()
            .get( `http://localhost:${appUtility.port}/static-file/test.mp3` )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "audio/mpeg" );
                expect( res.header["content-length"] ).toBeDefined();
                appUtility.server.config.liveStream = old;
                done();
            } );
    } );
    let eTag: string = "";
    let lastModified: string = "";
    it( 'should be mime type encoding gzip', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/logo/logo.png` )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header.etag ).toBeDefined();
                expect( res.header['last-modified'] ).toBeDefined();
                lastModified = res.header['last-modified'];
                eTag = res.header.etag;
                expect( res.header["content-type"] ).toBe( "image/png" );
                expect( res.header["content-encoding"] ).toBe( "gzip" );
                done();
            } );
    } );
    it( 'should be mime type if-none-match', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/logo/logo.png` )
            .set( "if-none-match", eTag )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 304 );
                expect( res.header["x-server-revalidate"] ).toBe( "true" );
                done();
            } );
    } );
    it( 'should be mime type if-modified-since', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/logo/logo.png` )
            .set( "if-modified-since", lastModified )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 304 );
                expect( res.header["x-server-revalidate"] ).toBe( "true" );
                done();
            } );
    } );
    it( 'should be mime type not found', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/logo/logos.png` )
            .set( "if-modified-since", lastModified )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'unsupported mime type', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/logo/logo.zip` )
            .set( "if-modified-since", lastModified )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'should be served from file (no server file cache)', ( done ) => {
        const oldfileCache = appUtility.server.config.staticFile.fileCache;
        appUtility.server.config.staticFile.fileCache = false;
        getAgent()
            .get( `http://localhost:${appUtility.port}/logo/logo.png` )
            .end( ( err, res ) => {
                appUtility.server.config.staticFile.fileCache = oldfileCache;
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header.etag ).toBeDefined();
                expect( res.header['last-modified'] ).toBeDefined();
                lastModified = res.header['last-modified'];
                eTag = res.header.etag;
                expect( res.header["content-type"] ).toBe( "image/png" );
                expect( res.header["content-encoding"] ).toBe( "gzip" );
                done();
            } );
    } );
    it( 'should be mime type if-none-match (no server file cache)', ( done ) => {
        const oldfileCache = appUtility.server.config.staticFile.fileCache;
        appUtility.server.config.staticFile.fileCache = false;
        getAgent()
            .get( `http://localhost:${appUtility.port}/logo/logo.png` )
            .set( "if-none-match", eTag )
            .end( ( err, res ) => {
                appUtility.server.config.staticFile.fileCache = oldfileCache;
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 304 );
                expect( res.header["x-server-revalidate"] ).toBe( "true" );
                done();
            } );
    } );
    it( 'should be favicon.ico 200', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/favicon.ico` )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "image/x-icon" );
                done();
            } );
    } );
} );
describe( "cwserver-virtual-dir", () => {
    it( 'check-virtual-dir-server-manage', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/test-virtual/socket-client.js` )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "application/javascript" );
                expect( res.header["content-encoding"] ).toBe( "gzip" );
                done();
            } );
    } );
    it( 'check-virtual-dir-mimeType-404', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/test-virtual/socket-client.jsx` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'check-virtual-dir-handler', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/vtest/socket-client.js` )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "application/javascript" );
                expect( res.header["content-encoding"] ).toBe( "gzip" );
                done();
            } );
    } );
} );
describe( "cwserver-multipart-paylod-parser", () => {
    it( 'should post multipart post file', ( done ) => {
        let fileName = "";
        let filePath = "";
        let contentType = "";
        if ( process.env.SCRIPT === "TS" ) {
            fileName = "schema.json";
            contentType = "application/json";
            filePath = path.resolve( `./${fileName}` );
        } else {
            fileName = "module.spec.js";
            contentType = "application/javascript";
            filePath = path.resolve( `./dist/test/${fileName}` );
        }
        const readStream = fs.createReadStream( filePath );
        getAgent()
            .post( `http://localhost:${appUtility.port}/upload` )
            .field( 'post-file', readStream )
            .end( ( err, res ) => {
                readStream.close();
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "application/json" );
                expect( res.body ).toBeInstanceOf( Object );
                expect( res.body.content_type ).toBe( contentType );
                expect( res.body.file_name ).toBe( fileName );
                expect( res.body.name ).toBe( "post-file" );
                done();
            } );
    } );
    it( 'should post multipart post file and save as bulk', ( done ) => {
        let fileName = "";
        let filePath = "";
        let contentType = "";
        if ( process.env.SCRIPT === "TS" ) {
            fileName = "schema.json";
            contentType = "application/json";
            filePath = path.resolve( `./${fileName}` );
        } else {
            fileName = "module.spec.js";
            contentType = "application/javascript";
            filePath = path.resolve( `./dist/test/${fileName}` );
        }
        const readStream = fs.createReadStream( filePath );
        getAgent()
            .post( `http://localhost:${appUtility.port}/upload` )
            .query( { saveto: "Y" } )
            .field( 'post-file', readStream )
            .end( ( err, res ) => {
                readStream.close();
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "application/json" );
                expect( res.body ).toBeInstanceOf( Object );
                expect( res.body.content_type ).toBe( contentType );
                expect( res.body.file_name ).toBe( fileName );
                expect( res.body.name ).toBe( "post-file" );
                done();
            } );
    } );
} );
describe( "cwserver-socket-io-implementation", () => {
    it( 'get ws-server-event', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/ws-server-event` )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "application/json" );
                expect( res.body ).toBeInstanceOf( Object );
                expect( res.body.server ).toBeInstanceOf( Array );
                expect( res.body.server.indexOf( "test-msg" ) ).toBeGreaterThan( -1 );
                done();
            } );
    } );
    it( 'should be send n receive data over socket-io', ( done ) => {
        const socket = io.connect( `http://localhost:${appUtility.port}`, { reconnection: true } );
        socket.on( 'connect', () => {
            socket.emit( 'test-msg', { name: 'rajibs', occupation: 'kutukutu' } );
        } );
        socket.on( 'on-test-msg', ( data: { name: any; } ) => {
            socket.close();
            expect( data.name ).toBe( 'rajibs' );
            done();
        } );
    } );
} );
describe( "cwserver-echo", () => {
    it( 'echo-server', ( done ) => {
        const reqMd5 = cwserver.md5( "Test" );
        const hex = cwserver.Encryption.utf8ToHex( reqMd5 );
        getAgent()
            .post( `http://localhost:${appUtility.port}/echo` )
            .send( JSON.stringify( { hex } ) )
            .set( 'Content-Type', 'application/json' )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "application/json" );
                expect( res.body.hex ).toBeDefined();
                expect( res.body.hex ).toEqual( hex );
                const resMd5 = cwserver.Encryption.hexToUtf8( res.body.hex );
                expect( resMd5 ).toEqual( reqMd5 );
                done();
            } );
    } );
} );
describe( "cwserver-web-stream", () => {
    it( 'should-be-get-stream-request', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/web-stream/test.mp3` )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "audio/mpeg" );
                expect( res.header["content-length"] ).toBeDefined();
                done();
            } );
    } );
    it( 'should-be-stream', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/web-stream/test.mp3` )
            .set( "range", "bytes=0-" )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 206 );// Partial Content
                expect( res.header["content-type"] ).toBe( "audio/mpeg" );
                expect( res.header["content-range"] ).toBeDefined();
                done();
            } );
    } );
} );
describe( "cwserver-error", () => {
    it( 'should be throw server error', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/app-error/` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 500 );
                done();
            } );
    } );
    it( 'should be pass server error', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/pass-error` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 500 );
                done();
            } );
    } );
} );
describe( "cwserver-controller-reset", () => {
    it( 'config.defaultDoc', ( done ) => {
        const defaultExt = appUtility.server.config.defaultExt;
        const defaultDoc = appUtility.server.config.defaultDoc;
        appUtility.server.config.defaultDoc = ["index.html", "default.html"];
        appUtility.server.config.defaultExt = "";
        getAgent()
            .get( `http://localhost:${appUtility.port}/` )
            .end( ( err, res ) => {
                appUtility.server.config.defaultExt = defaultExt;
                appUtility.server.config.defaultDoc = defaultDoc;
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                done();
            } );
    } );
    it( 'should be route not found', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/app-error` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'no controller found for put', ( done ) => {
        getAgent()
            .delete( `http://localhost:${appUtility.port}/app-error` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'should-be-reset-controller', ( done ) => {
        expect( appUtility.controller.remove( '/authenticate' ) ).toEqual( true );
        expect( appUtility.controller.remove( '/post' ) ).toEqual( true );
        appUtility.controller.reset();
        done();
    } );
    it( 'should-be-controller-error', ( done ) => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/response` )
            .query( { task: "gzip", data: JSON.stringify( { name: 'rajibs', occupation: 'kutukutu' } ) } )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
} );
describe( "cwserver-utility", () => {
    it( "test-app-utility", ( done ): void => {
        expect( shouldBeError( () => {
            cwserver.HttpStatus.isErrorCode( "adz" );
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            cwserver.HttpStatus.getDescription( 45510 );
        } ) ).toBeInstanceOf( Error );
        expect( cwserver.HttpStatus.fromPath( "result", 200 ) ).toEqual( 200 );
        expect( cwserver.HttpStatus.fromPath( "/result", 200 ) ).toEqual( 200 );
        expect( cwserver.HttpStatus.getResInfo( "/result", 0 ).isValid ).toEqual( false );
        expect( cwserver.HttpStatus.isValidCode( 45510 ) ).toEqual( false );
        expect( cwserver.HttpStatus.statusCode ).toBeInstanceOf( Object );
        expect( ToNumber( null ) ).toEqual( 0 );
        expect( shouldBeError( () => {
            cwserver.Encryption.encrypt( "nothing", {
                oldKey: "",
                key: void 0,
                iv: void 0
            } );
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            cwserver.Encryption.decrypt( "nothing", {
                oldKey: "",
                key: void 0,
                iv: void 0
            } );
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            Util.mkdirSync( logDir, "./" );
        } ) ).toBeInstanceOf( Error );
        expect( Util.mkdirSync( logDir ) ).toEqual( true );
        expect( Util.extend( {}, new Session() ) ).toBeInstanceOf( Object );
        expect( Util.extend( {}, () => {
            return new Session();
        }, true ) ).toBeInstanceOf( Object );
        expect( shouldBeError( () => {
            Util.extend( "", {} );
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            Util.extend( "", {}, true );
        } ) ).toBeInstanceOf( Error );
        expect( cwserver.Encryption.decrypt( "", appUtility.server.config.encryptionKey ) ).toEqual( "" );
        const str = "TEST";
        const hex = cwserver.Encryption.utf8ToHex( str );
        expect( cwserver.Encryption.hexToUtf8( hex ) ).toEqual( str );
        const plainText = "rajib";
        let enc: string = appUtility.server.encryption.encrypt( plainText );
        expect( plainText ).toEqual( appUtility.server.encryption.decrypt( enc ) );
        enc = appUtility.server.encryption.encryptToHex( plainText );
        expect( plainText ).toEqual( appUtility.server.encryption.decryptFromHex( enc ) );
        enc = appUtility.server.encryption.encryptUri( plainText );
        expect( plainText ).toEqual( appUtility.server.encryption.decryptUri( enc ) );
        done();
    } );
    describe( 'config', () => {
        let untouchedConfig: { [x: string]: any; } = {};
        it( 'database', ( done ) => {
            untouchedConfig = cwserver.Util.clone( appUtility.server.config );
            expect( shouldBeError( () => {
                try {
                    const newConfig: { [x: string]: any; } = appUtility.server.config;
                    newConfig.database = {};
                    appUtility.server.initilize();
                } catch ( e ) {
                    appUtility.server.config.database = [];
                    throw e;
                }
            } ) ).toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                try {
                    appUtility.server.config.database = [{
                        module: "", path: "", dbConn: {
                            database: "", password: ""
                        }
                    }];
                    appUtility.server.initilize();
                } catch ( e ) {
                    appUtility.server.config.database = [];
                    throw e;
                }
            } ) ).toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                try {
                    appUtility.server.config.database = [{
                        module: "pgsql", path: "", dbConn: {
                            database: "", password: ""
                        }
                    }];
                    appUtility.server.initilize();
                } catch ( e ) {
                    appUtility.server.config.database = [];
                    throw e;
                }
            } ) ).toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                try {
                    appUtility.server.config.database = [{
                        module: "pgsql", path: "$rotex/$public/lib/pgslq.js", dbConn: {
                            database: "", password: ""
                        }
                    }];
                    appUtility.server.initilize();
                } catch ( e ) {
                    appUtility.server.config.database = [];
                    throw e;
                }
            } ) ).toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                try {
                    appUtility.server.config.database = [{
                        module: "pgsql", path: "$rote/$public/lib/pgslq.js", dbConn: {
                            database: "sysdb", password: ""
                        }
                    }];
                    appUtility.server.initilize();
                } catch ( e ) {
                    appUtility.server.config.database = [];
                    throw e;
                }
            } ) ).toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                try {
                    appUtility.server.config.database = [{
                        module: "pgsql", path: "$rote/$public/lib/pgslq.js", dbConn: {
                            database: "sysdb", password: "xyz"
                        }
                    }];
                    appUtility.server.initilize();
                } catch ( e ) {
                    appUtility.server.config.database = [];
                    throw e;
                }
            } ) ).toBeInstanceOf( Error );
            done();
        } );
        it( 'override', ( done ) => {
            expect( shouldBeError( () => {
                const oldKey = appUtility.server.config.encryptionKey;
                try {
                    const newConfig: { [x: string]: any; } = appUtility.server.config;
                    newConfig.encryptionKey = void 0;
                    appUtility.server.implimentConfig( newConfig );
                } catch ( e ) {
                    appUtility.server.config.encryptionKey = oldKey;
                    throw e;
                }
            } ) ).toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                const oldKey = appUtility.server.config.hiddenDirectory;
                try {
                    const newConfig: { [x: string]: any; } = appUtility.server.config;
                    newConfig.hiddenDirectory = void 0;
                    newConfig.encryptionKey = "NEW_KEY";
                    appUtility.server.implimentConfig( newConfig );
                } catch ( e ) {
                    appUtility.server.config.hiddenDirectory = oldKey;
                    throw e;
                }
            } ) ).toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                const oldkey = appUtility.server.config.session;
                try {
                    const newConfig: { [x: string]: any; } = appUtility.server.config;
                    newConfig.session = {};
                    appUtility.server.implimentConfig( newConfig );
                } catch ( e ) {
                    appUtility.server.config.session = oldkey;
                    throw e;
                }
            } ) ).toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                const oldkey = appUtility.server.config.errorPage;
                try {
                    const newConfig: { [x: string]: any; } = appUtility.server.config;
                    newConfig.errorPage = {};
                    appUtility.server.implimentConfig( newConfig );
                    appUtility.server.initilize();
                } catch ( e ) {
                    appUtility.server.config.errorPage = oldkey;
                    throw e;
                }
            } ) ).toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                const oldkey = appUtility.server.config.errorPage;
                const newConfig: { [x: string]: any; } = appUtility.server.config;
                newConfig.errorPage = void 0;
                appUtility.server.initilize();
                appUtility.server.config.errorPage = oldkey;
            } ) ).not.toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                const oldkey = appUtility.server.config.errorPage;
                try {
                    const newConfig: { [x: string]: any; } = appUtility.server.config;
                    newConfig.errorPage = [];
                    appUtility.server.initilize();
                } catch ( e ) {
                    appUtility.server.config.errorPage = oldkey;
                    throw e;
                }
            } ) ).toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                const oldkey = appUtility.server.config.errorPage;
                try {
                    const newConfig: { [x: string]: any; } = appUtility.server.config;
                    newConfig.errorPage = {
                        "405": "g/nopx/404.html"
                    };
                    appUtility.server.initilize();
                } catch ( e ) {
                    appUtility.server.config.errorPage = oldkey;
                    throw e;
                }
            } ) ).toBeInstanceOf( Error );
            expect( appUtility.server.parseSession( "test=1;no-parse" ) ).toBeInstanceOf( Session );
            cwserver.Util.extend( appUtility.server.config, untouchedConfig );
            expect( appUtility.server.parseSession( "_session=error" ) ).toBeInstanceOf( Session );
            expect( shouldBeError( () => {
                const oldkey = appUtility.server.config.session;
                const enckey = appUtility.server.config.encryptionKey;
                try {
                    const newConfig: { [x: string]: any; } = appUtility.server.config;
                    newConfig.encryptionKey = "NEW_KEY";
                    newConfig.session = {
                        key: "session",
                        maxAge: {}
                    };
                    appUtility.server.implimentConfig( newConfig );
                } catch ( e ) {
                    appUtility.server.config.session = oldkey;
                    appUtility.server.config.encryptionKey = enckey;
                    throw e;
                }
            } ) ).toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                const oldkey = appUtility.server.config.cacheHeader;
                const enckey = appUtility.server.config.encryptionKey;
                const oldSession = appUtility.server.config.session;
                try {
                    const newConfig: { [x: string]: any; } = appUtility.server.config;
                    newConfig.encryptionKey = "NEW_KEY";
                    newConfig.cacheHeader = void 0;
                    newConfig.session = {
                        key: "session",
                        maxAge: void 0
                    };
                    appUtility.server.implimentConfig( newConfig );
                } catch ( e ) {
                    appUtility.server.config.session = oldSession;
                    appUtility.server.config.cacheHeader = oldkey;
                    appUtility.server.config.encryptionKey = enckey;
                    throw e;
                }
            } ) ).toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                appUtility.server.parseMaxAge( "10N" );
            } ) ).toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                appUtility.server.parseMaxAge( "AD" );
            } ) ).toBeInstanceOf( Error );
            expect( appUtility.server.parseMaxAge( "1H" ) ).not.toBeInstanceOf( Error );
            expect( appUtility.server.parseMaxAge( "1M" ) ).not.toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                appUtility.server.parseMaxAge( {} );
            } ) ).toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                appUtility.server.formatPath( "$root/$public/lib.js" );
            } ) ).toBeInstanceOf( Error );
            expect( appUtility.server.formatPath( "root/public/lib.js" ) ).not.toBeInstanceOf( Error );
            done();
        } );
    } );
    it( 'log', ( done ) => {
        appUtility.server.log.log( "log-test" );
        appUtility.server.log.info( "log-info-test" );
        appUtility.server.log.dispose();
        let logger = new Logger();
        logger.log( "log-test" );
        logger.info( "log-test" );
        logger.success( "log-test" );
        logger.error( "log-test" );
        expect( shouldBeError( () => {
            logger.flush();
        } ) ).toBeInstanceOf( Error );
        logger.reset( );
        logger.dispose(); logger.dispose();
        logger = new Logger( logDir, void 0, "+6", void 0, false );
        logger.write( "test" );
        logger.dispose();
        appUtility.server.log.dispose();
        logger = new Logger( logDir, projectRoot, "+6", true, true, 100 );
        expect( logger.flush() ).toEqual( true );
        expect( logger.flush() ).toEqual( false );
        logger.log( {} );
        logger.writeToStream( "log-test" );
        logger.writeToStream( "log-test" );
        logger.writeToStream( "log-test log-test log-test log-test log-test log-test log-test log-test log-test log-test" );
        logger.writeToStream( "log-test log-test log-test log-test log-test log-test log-test log-test log-test log-test log-test log-test log-test ");
        logger.writeToStream( "log-test" );
        logger.reset();
        logger.dispose();
        done();
    } );
} );
describe( "cwserver-schema-validator", () => {
    it( "validate-schema", ( done ) => {
        const config = Util.readJsonAsync( appUtility.server.mapPath( "/config/app.config.json" ) );
        expect( config ).toBeInstanceOf( Object );
        if ( !config ) throw new Error( "unreachable..." );
        const $schema = config.$schema;
        expect( shouldBeError( () => {
            config.$schema = void 0;
            Schema.Validate( config );
        } ) ).toBeInstanceOf( Error );
        config.$schema = $schema;
        expect( ( () => {
            config.$comment = "this config";
            Schema.Validate( config );
        } )() ).not.toBeInstanceOf( Error );
        config.$schema = $schema;
        expect( shouldBeError( () => {
            const oldVal = config.staticFile;
            try {
                config.noCache = void 0;
                config.staticFile = void 0;
                Schema.Validate( config );
            } catch ( e ) {
                config.staticFile = oldVal;
                config.noCache = [];
                throw e;
            }
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            config.$schema = $schema;
            try {
                config.template.cacheType = "MEMS";
                Schema.Validate( config );
            } catch ( e ) {
                config.template.cacheType = "MEM";
                throw e;
            }
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            config.$schema = $schema;
            try {
                config.template.cache = "MEMS";
                Schema.Validate( config );
            } catch ( e ) {
                config.template.cache = false;
                throw e;
            }
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            config.$schema = $schema;
            const template = Util.clone( config.template );
            try {
                delete config.template;
                Schema.Validate( config );
            } catch ( e ) {
                config.template = template;
                throw e;
            }
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            config.$schema = $schema;
            const template = Util.clone( config.template );
            try {
                config.template.addvalue = "";
                Schema.Validate( config );
            } catch ( e ) {
                config.template = template;
                throw e;
            }
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            config.$schema = $schema;
            const template = Util.clone( config.template );
            try {
                config.template = "";
                Schema.Validate( config );
            } catch ( e ) {
                config.template = template;
                throw e;
            }
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            config.$schema = $schema;
            try {
                config.liveStream = [1];
                Schema.Validate( config );
            } catch ( e ) {
                config.liveStream = [];
                throw e;
            }
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            config.$schema = $schema;
            try {
                config.liveStream = {};
                Schema.Validate( config );
            } catch ( e ) {
                config.liveStream = [];
                throw e;
            }
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            config.$schema = $schema;
            try {
                config.isDebug = {};
                Schema.Validate( config );
            } catch ( e ) {
                config.isDebug = false;
                throw e;
            }
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            config.$schema = $schema;
            const old = config.Author;
            try {
                config.Author = "ME";
                Schema.Validate( config );
            } catch ( e ) {
                config.Author = old;
                throw e;
            }
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            config.$schema = $schema;
            const old = config.defaultDoc;
            try {
                config.defaultDoc = [];
                Schema.Validate( config );
            } catch ( e ) {
                config.defaultDoc = old;
                throw e;
            }
        } ) ).toBeInstanceOf( Error );
        done();
    } );
    it( "shutdown-application", ( done ) => {
        shutdownApp( done );
    } );
} );