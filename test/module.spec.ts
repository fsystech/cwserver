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
import { IAppUtility, IContext } from '../lib/sow-server';
import { IApps } from '../lib/sow-server-core';
import { Util } from '../lib/sow-util';
import * as request from 'superagent';
import * as io from 'socket.io-client';
import { shouldBeError } from "./test-view";
import 'mocha';
let appUtility: IAppUtility = Object.create( null );
let app: IApps = Object.create( null );
const appRoot = process.env.SCRIPT === "TS" ? path.join( path.resolve( __dirname, '..' ), "/dist/test/" ) : __dirname;
const projectRoot = 'cwserver.safeonline.world';
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
        done();
    } );
    it( "initilize server", ( done ) => {
        appUtility = cwserver.initilizeServer( appRoot, projectRoot );
        expect( appUtility.public ).toEqual( projectRoot );
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
            app.shutdown( ( err ) => {
                done();
            } );
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
            .post( "/test-controller", invoke );
        expect( shouldBeError( () => {
            appUtility.controller.get( "/test-controller", invoke );
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            appUtility.controller.post( "/test-controller", invoke );
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
} );
describe( "cwserver-session", () => {
    const loginId = "rajib";
    const agent = request.agent();
    it( 'authenticate-request', ( done ) => {
        app.listen( appUtility.port, () => {
            agent
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
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'should-be-user-authenticated', ( done ) => {
        app.listen( appUtility.port, () => {
            agent
                .get( `http://localhost:${appUtility.port}/is-authenticate` )
                .query( { loginId } )
                .end( ( err, res ) => {
                    expect( err ).not.toBeInstanceOf( Error );
                    expect( res.status ).toBe( 200 );
                    expect( res.header["content-type"] ).toBe( "application/json" );
                    expect( res.body ).toBeInstanceOf( Object );
                    expect( res.body.loginId ).toEqual( loginId );
                    expect( res.body.userData ).toBeDefined();
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'authenticated-user-should-be-redirect-to-home', ( done ) => {
        app.listen( appUtility.port, () => {
            agent
                .get( `http://localhost:${appUtility.port}/authenticate` )
                .end( ( err, res ) => {
                    expect( err ).not.toBeInstanceOf( Error );
                    expect( res.status ).toBe( 200 );
                    expect( res.redirects.length ).toEqual( 1 ); // should be redirect home page
                    expect( res.redirects.indexOf( `http://localhost:${appUtility.port}/` ) ).toBeGreaterThan( -1 );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
} );
describe( "cwserver-get", () => {
    it( 'send get request to application', ( done ) => {
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/` )
                .end( ( err, res ) => {
                    expect( err ).not.toBeInstanceOf( Error );
                    expect( res.status ).toBe( 200 );
                    expect( res.header["content-type"] ).toBe( "text/html" );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'get-raw-file', ( done ) => {
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/get-file` )
                .end( ( err, res ) => {
                    expect( err ).not.toBeInstanceOf( Error );
                    expect( res.status ).toBe( 200 );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'redirect request to controller', ( done ) => {
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/redirect` )
                .end( ( err, res ) => {
                    expect( err ).not.toBeInstanceOf( Error );
                    expect( res.status ).toBe( 200 );
                    expect( res.redirects.length ).toEqual( 1 ); // should be redirect home page
                    expect( res.redirects.indexOf( `http://localhost:${appUtility.port}/` ) ).toBeGreaterThan( -1 );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
} );
describe( "cwserver-template-engine", () => {
    it( 'send get request should be 404 response config.defaultExt = .html', ( done ) => {
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/index.html` )
                .end( ( err, res ) => {
                    expect( err ).toBeInstanceOf( Error );
                    expect( res.status ).toBe( 404 );
                    expect( res.header["content-type"] ).toBe( "text/html" );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'send get request should be 200 response', ( done ) => {
        const defaultExt = appUtility.server.config.defaultExt;
        appUtility.server.config.defaultExt = "";
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/index.html` )
                .end( ( err, res ) => {
                    expect( err ).not.toBeInstanceOf( Error );
                    expect( res.status ).toBe( 200 );
                    expect( res.header["content-type"] ).toBe( "text/html" );
                    appUtility.server.config.defaultExt = defaultExt;
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    let templateConf: {
        cache: boolean;
        cacheType: string;
    } | void;
    it( 'route `/` then should use config.defaultDoc and create template cache', ( done ) => {
        templateConf = appUtility.server.config.template;
        appUtility.server.config.template.cache = true;
        appUtility.server.config.template.cacheType = "FILE";
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/` )
                .end( ( err, res ) => {
                    expect( err ).not.toBeInstanceOf( Error );
                    expect( res.status ).toBe( 200 );
                    expect( res.header["content-type"] ).toBe( "text/html" );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'should be serve from template cache', ( done ) => {
        expect( Util.isPlainObject( templateConf ) ).toBe( true );
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/` )
                .end( ( err, res ) => {
                    if ( templateConf ) {
                        appUtility.server.config.template = templateConf;
                    }
                    expect( err ).not.toBeInstanceOf( Error );
                    expect( res.status ).toBe( 200 );
                    expect( res.header["content-type"] ).toBe( "text/html" );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
} );
describe( "cwserver-bundler", () => {
    it( 'js file bundler with gizp response (server file cache)', ( done ) => {
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
                .query( {
                    g: appUtility.server.createBundle( `
                        $root/$public/static/script/test-1.js,
                        $root/$public/static/script/test-2.js|__owner__`
                    ),
                    ck: "bundle_test_js", ct: "text/javascript", rc: "Y"
                } )
                .end( ( err, res ) => {
                    expect( err ).not.toBeInstanceOf( Error );
                    expect( res.status ).toBe( 200 );
                    expect( res.header["content-type"] ).toBe( "application/x-javascript; charset=utf-8" );
                    expect( res.header["content-encoding"] ).toBe( "gzip" );
                    expect( res.header.etag ).not.toBeUndefined();
                    expect( res.header["last-modified"] ).not.toBeUndefined();
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'js file bundler with gizp response (no server cache)', ( done ) => {
        appUtility.server.config.bundler.fileCache = false;
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
                .query( {
                    g: appUtility.server.createBundle( `
                        $virtual_vtest/socket-client.js,
                        $root/$public/static/script/test-1.js,
                        $root/$public/static/script/test-2.js|__owner__`
                    ),
                    ck: "bundle_test_js", ct: "text/javascript", rc: "Y"
                } )
                .end( ( err, res ) => {
                    expect( err ).not.toBeInstanceOf( Error );
                    expect( res.status ).toBe( 200 );
                    expect( res.header["content-type"] ).toBe( "application/x-javascript; charset=utf-8" );
                    expect( res.header["content-encoding"] ).toBe( "gzip" );
                    expect( res.header["last-modified"] ).not.toBeUndefined();
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'css file bundler with gizp response (server file cache)', ( done ) => {
        appUtility.server.config.bundler.fileCache = true;
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
                .query( {
                    g: appUtility.server.createBundle( `
                        $root/$public/static/css/test-1.css,
                        $root/$public/static/css/test-2.css|__owner__`
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
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
} );
describe( "cwserver-bundler-error", () => {
    it( 'bundler should be virtual file error', ( done ) => {
        appUtility.server.config.bundler.fileCache = false;
        app.listen( appUtility.port, () => {
            request
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
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'bundler should be virtual error', ( done ) => {
        appUtility.server.config.bundler.fileCache = false;
        app.listen( appUtility.port, () => {
            request
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
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'bundler should be unsupported content type error', ( done ) => {
        appUtility.server.config.bundler.fileCache = false;
        app.listen( appUtility.port, () => {
            request
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
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'bundler should be path parse error', ( done ) => {
        appUtility.server.config.bundler.fileCache = false;
        app.listen( appUtility.port, () => {
            request
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
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'bundler should be encryption error', ( done ) => {
        appUtility.server.config.bundler.fileCache = false;
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
                .query( {
                    g: `$virtual_vtest/socket-client.js`,
                    ck: "bundle_test_jsx", ct: "text/plain", rc: "Y"
                } )
                .end( ( err, res ) => {
                    expect( err ).toBeInstanceOf( Error );
                    expect( res.status ).toBe( 404 );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
} );
describe( "cwserver-post", () => {
    it( 'send post request to application', ( done ) => {
        app.listen( appUtility.port, () => {
            request
                .post( `http://localhost:${appUtility.port}/post` )
                .send( JSON.stringify( { name: 'rajibs', occupation: 'kutukutu' } ) )
                .set( 'Content-Type', 'application/json' )
                .end( ( err, res ) => {
                    expect( err ).not.toBeInstanceOf( Error );
                    expect( res.status ).toBe( 200 );
                    expect( res.header["content-type"] ).toBe( "application/json" );
                    expect( res.body.name ).toBe( 'rajibs' );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'should post request not found', ( done ) => {
        app.listen( appUtility.port, () => {
            request
                .post( `http://localhost:${appUtility.port}/post/invalid-route` )
                .send( JSON.stringify( { name: 'rajibs', occupation: 'kutukutu' } ) )
                .set( 'Content-Type', 'application/json' )
                .end( ( err, res ) => {
                    expect( err ).toBeInstanceOf( Error );
                    expect( res.status ).toBe( 404 );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
} );
describe( "cwserver-gzip-response", () => {
    it( 'should be response type gzip', ( done ) => {
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/response` )
                .query( { task: "gzip", data: JSON.stringify( { name: 'rajibs', occupation: 'kutukutu' } ) } )
                .end( ( err, res ) => {
                    expect( err ).not.toBeInstanceOf( Error );
                    expect( res.status ).toBe( 200 );
                    expect( res.header["content-encoding"] ).toBe( "gzip" );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
} );
describe( "cwserver-mime-type", () => {
    let eTag: string = "";
    let lastModified: string = "";
    it( 'should be mime type encoding gzip', ( done ) => {
        app.listen( appUtility.port, () => {
            request
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
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'should be mime type if-none-match', ( done ) => {
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/logo/logo.png` )
                .set( "if-none-match", eTag )
                .end( ( err, res ) => {
                    expect( err ).toBeInstanceOf( Error );
                    expect( res.status ).toBe( 304 );
                    expect( res.header["x-server-revalidate"] ).toBe( "true" );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'should be mime type if-modified-since', ( done ) => {
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/logo/logo.png` )
                .set( "if-modified-since", lastModified )
                .end( ( err, res ) => {
                    expect( err ).toBeInstanceOf( Error );
                    expect( res.status ).toBe( 304 );
                    expect( res.header["x-server-revalidate"] ).toBe( "true" );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'should be mime type not found', ( done ) => {
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/logo/logos.png` )
                .set( "if-modified-since", lastModified )
                .end( ( err, res ) => {
                    expect( err ).toBeInstanceOf( Error );
                    expect( res.status ).toBe( 404 );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'unsupported mime type', ( done ) => {
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/logo/logo.zip` )
                .set( "if-modified-since", lastModified )
                .end( ( err, res ) => {
                    expect( err ).toBeInstanceOf( Error );
                    expect( res.status ).toBe( 404 );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'should be served from file (no server file cache)', ( done ) => {
        const oldfileCache = appUtility.server.config.staticFile.fileCache;
        appUtility.server.config.staticFile.fileCache = false;
        app.listen( appUtility.port, () => {
            request
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
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'should be mime type if-none-match (no server file cache)', ( done ) => {
        const oldfileCache = appUtility.server.config.staticFile.fileCache;
        appUtility.server.config.staticFile.fileCache = false;
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/logo/logo.png` )
                .set( "if-none-match", eTag )
                .end( ( err, res ) => {
                    appUtility.server.config.staticFile.fileCache = oldfileCache;
                    expect( err ).toBeInstanceOf( Error );
                    expect( res.status ).toBe( 304 );
                    expect( res.header["x-server-revalidate"] ).toBe( "true" );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'should be favicon.ico 200', ( done ) => {
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/favicon.ico` )
                .end( ( err, res ) => {
                    expect( err ).not.toBeInstanceOf( Error );
                    expect( res.status ).toBe( 200 );
                    expect( res.header["content-type"] ).toBe( "image/x-icon" );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
} );
describe( "cwserver-virtual-dir", () => {
    it( 'check-virtual-dir-handler', ( done ) => {
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/vtest/socket-client.js` )
                .end( ( err, res ) => {
                    expect( err ).not.toBeInstanceOf( Error );
                    expect( res.status ).toBe( 200 );
                    expect( res.header["content-type"] ).toBe( "application/javascript" );
                    expect( res.header["content-encoding"] ).toBe( "gzip" );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
} );
describe( "cwserver-multipart-paylod-parser", () => {
    it( 'should post multipart post file', ( done ) => {
        app.listen( appUtility.port, () => {
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
            request
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
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
} );
describe( "cwserver-socket-io-implementation", () => {
    it( 'get ws-server-event', ( done ) => {
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/ws-server-event` )
                .end( ( err, res ) => {
                    expect( err ).not.toBeInstanceOf( Error );
                    expect( res.status ).toBe( 200 );
                    expect( res.header["content-type"] ).toBe( "application/json" );
                    expect( res.body ).toBeInstanceOf( Object );
                    expect( res.body.server ).toBeInstanceOf( Array );
                    expect( res.body.server.indexOf( "test-msg" ) ).toBeGreaterThan( -1 );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'should be send n receive data over socket-io', ( done ) => {
        app.listen( appUtility.port, () => {
            const socket = io.connect( `http://localhost:${appUtility.port}`, { reconnection: true } );
            socket.on( 'connect', () => {
                socket.emit( 'test-msg', { name: 'rajibs', occupation: 'kutukutu' } );
            } );
            socket.on( 'on-test-msg', ( data: { name: any; } ) => {
                socket.close();
                expect( data.name ).toBe( 'rajibs' );
                app.shutdown( ( err ) => {
                    done();
                } );
            } );
        } );
    } );
} );
describe( "cwserver-echo", () => {
    it( 'echo-server', ( done ) => {
        const reqMd5 = cwserver.md5( "Test" );
        const hex = cwserver.Encryption.utf8ToHex( reqMd5 );
        app.listen( appUtility.port, () => {
            request
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
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
} );
describe( "cwserver-web-stream", () => {
    it( 'should-be-get-stream-request', ( done ) => {
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/web-stream/test.mp3` )
                .end( ( err, res ) => {
                    expect( err ).not.toBeInstanceOf( Error );
                    expect( res.status ).toBe( 200 );
                    expect( res.header["content-type"] ).toBe( "audio/mpeg" );
                    expect( res.header["content-length"] ).toBeDefined();
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'should-be-stream', ( done ) => {
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/web-stream/test.mp3` )
                .set( "range", "bytes=0-" )
                .end( ( err, res ) => {
                    expect( err ).not.toBeInstanceOf( Error );
                    expect( res.status ).toBe( 206 );// Partial Content
                    expect( res.header["content-type"] ).toBe( "audio/mpeg" );
                    expect( res.header["content-range"] ).toBeDefined();
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
} );
describe( "cwserver-error", () => {
    it( 'should be throw server error', ( done ) => {
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/app-error/` )
                .end( ( err, res ) => {
                    expect( err ).toBeInstanceOf( Error );
                    expect( res.status ).toBe( 500 );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'should be pass server error', ( done ) => {
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/pass-error` )
                .end( ( err, res ) => {
                    expect( err ).toBeInstanceOf( Error );
                    expect( res.status ).toBe( 500 );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
} );
describe( "cwserver-controller-reset", () => {
    it( 'config.defaultDoc', ( done ) => {
        const defaultExt = appUtility.server.config.defaultExt;
        const defaultDoc = appUtility.server.config.defaultDoc;
        appUtility.server.config.defaultDoc = ["index.html", "default.html"];
        appUtility.server.config.defaultExt = "";
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/` )
                .end( ( err, res ) => {
                    appUtility.server.config.defaultExt = defaultExt;
                    appUtility.server.config.defaultDoc = defaultDoc;
                    // console.log( err );
                    expect( err ).not.toBeInstanceOf( Error );
                    expect( res.status ).toBe( 200 );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'should be route not found', ( done ) => {
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/app-error` )
                .end( ( err, res ) => {
                    expect( err ).toBeInstanceOf( Error );
                    expect( res.status ).toBe( 404 );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'no controller found for put', ( done ) => {
        app.listen( appUtility.port, () => {
            request
                .delete( `http://localhost:${appUtility.port}/app-error` )
                .end( ( err, res ) => {
                    expect( err ).toBeInstanceOf( Error );
                    expect( res.status ).toBe( 404 );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
    it( 'should-be-reset-controller', ( done ) => {
        appUtility.controller.reset();
        done();
    } );
    it( 'should-be-controller-error', ( done ) => {
        app.listen( appUtility.port, () => {
            request
                .get( `http://localhost:${appUtility.port}/response` )
                .query( { task: "gzip", data: JSON.stringify( { name: 'rajibs', occupation: 'kutukutu' } ) } )
                .end( ( err, res ) => {
                    expect( err ).toBeInstanceOf( Error );
                    expect( res.status ).toBe( 404 );
                    app.shutdown( ( _err ) => {
                        done();
                    } );
                } );
        } );
    } );
} );
describe( "cwserver-utility", () => {
    it( "Encryption", ( done ): void => {
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
                appUtility.server.config.database = [{
                    module: "", path: "", dbConn: {
                        database: "", password: ""
                    }
                }];
                appUtility.server.initilize();
            } ) ).toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                appUtility.server.config.database = [{
                    module: "pgsql", path: "", dbConn: {
                        database: "", password: ""
                    }
                }];
                appUtility.server.initilize();
            } ) ).toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                appUtility.server.config.database = [{
                    module: "pgsql", path: "$rotex/$public/lib/pgslq.js", dbConn: {
                        database: "", password: ""
                    }
                }];
                appUtility.server.initilize();
            } ) ).toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                appUtility.server.config.database = [{
                    module: "pgsql", path: "$rote/$public/lib/pgslq.js", dbConn: {
                        database: "sysdb", password: ""
                    }
                }];
                appUtility.server.initilize();
            } ) ).toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                appUtility.server.config.database = [{
                    module: "pgsql", path: "$rote/$public/lib/pgslq.js", dbConn: {
                        database: "sysdb", password: "xyz"
                    }
                }];
                appUtility.server.initilize();
            } ) ).toBeInstanceOf( Error );
            done();
        } );
        it( 'override', ( done ) => {
            expect( shouldBeError( () => {
                const newConfig: { [x: string]: any; } = appUtility.server.config;
                newConfig.encryptionKey = void 0;
                appUtility.server.implimentConfig( newConfig );
            } ) ).toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                const newConfig: { [x: string]: any; } = appUtility.server.config;
                newConfig.hiddenDirectory = void 0;
                appUtility.server.implimentConfig( newConfig );
                appUtility.server.initilize();
            } ) ).toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                const newConfig: { [x: string]: any; } = appUtility.server.config;
                newConfig.session = {};
                appUtility.server.implimentConfig( newConfig );
            } ) ).toBeInstanceOf( Error );
            expect( shouldBeError( () => {
                const newConfig: { [x: string]: any; } = appUtility.server.config;
                newConfig.session = {
                    key: "session",
                    maxAge: "14DD"
                };
                appUtility.server.implimentConfig( newConfig );
            } ) ).toBeInstanceOf( Error );
            cwserver.Util.extend( appUtility.server.config, untouchedConfig );
            done();
        } );
    } );
    it( 'log', ( done ) => {
        appUtility.server.log.log( "log-test" );
        appUtility.server.log.info( "log-info-test" );
        appUtility.server.log.dispose();
        done();
    } );
} );