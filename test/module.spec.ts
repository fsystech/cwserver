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
let app: IApps;
const appRoot = process.env.SCRIPT === "TS" ? path.join( path.resolve( __dirname, '..' ), "/dist/test/" ) : __dirname;
const projectRoot = 'test_web';
const logDir = path.resolve( './log/' );
let authCookies: string = "";
type Agent = request.SuperAgentStatic & request.Request;
const agent: Agent = request.agent();
let appIsLestening: boolean = false;
let appUtility: IAppUtility;
const createRequest = ( method: string, url: string, ensure?: string ): request.SuperAgentRequest => {
    expect( appIsLestening ).toEqual( true );
    const client: request.SuperAgentRequest = method === "GET" ? agent.get( url ) : agent.post( url );
    if ( !ensure ) return client;
    const key: string = ensure;
    const end = client.end.bind( client );
    client.end = function ( callback?: ( err: any, res: request.Response ) => void ) {
        expect( this.get( key ).length ).toBeGreaterThan( 0 );
        end( callback );
    };
    return client;
};
const getAgent = (): Agent => {
    expect( appIsLestening ).toEqual( true );
    return agent;
};
const shutdownApp = ( done?: Mocha.Done ): void => {
    try {
        app.shutdown( ( err?: Error ): void => {
            if ( !done ) return;
            return done();
        } );
    } catch ( e ) {
        if ( !done ) return;
        return done( e );
    }
};
const its = ( name: string, func: ( done: Mocha.Done ) => void ): void => {
    it( name, ( done ) => {
        setTimeout( () => {
            func( done );
        }, 100 );
    } );
};
describe( "cwserver-default-project-template", () => {
    it( "create project template", ( done: Mocha.Done ): void => {
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
    it( "initilize server throw error (mismatch between given appRoot and config.hostInfo.root)", ( done: Mocha.Done ): void => {
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
    it( "initilize server throw error (invalid app.config.json)", ( done: Mocha.Done ): void => {
        const root: string = path.resolve( `${appRoot}/ewww` ); // path.resolve( appRoot, "/ewww" );
        Util.mkdirSync( appRoot, "/ewww/config" );
        expect( fs.existsSync( root ) ).toEqual( true );
        const filePath: string = path.resolve( root + "/config/app.config.json" );
        fs.writeFileSync( filePath, "INVALID_FILE" );
        const orginalCfg: string = path.resolve( `${appRoot}/${projectRoot}/config/app.config.json` );
        expect( Util.compairFile( filePath, orginalCfg ) ).toEqual( true );
        expect( shouldBeError( () => {
            cwserver.initilizeServer( appRoot, `ewww` );
        } ) ).toBeInstanceOf( Error );
        Util.rmdirSync( root );
        done();
    } );
    it( "initilize server throw error (projectRoot not provided)", ( done: Mocha.Done ): void => {
        expect( shouldBeError( () => {
            cwserver.initilizeServer( appRoot );
        } ) ).toBeInstanceOf( Error );
        done();
    } );
    it( "initilize server throw error (projectRoot not provided)", ( done: Mocha.Done ): void => {
        expect( shouldBeError( () => {
            cwserver.initilizeServer( appRoot );
        } ) ).toBeInstanceOf( Error );
        done();
    } );
    it( "initilize server throw error (projectRoot not provided while you using IISNODE)", ( done: Mocha.Done ): void => {
        process.env.IISNODE_VERSION = "iisnode";
        expect( shouldBeError( () => {
            cwserver.initilizeServer( appRoot );
        } ) ).toBeInstanceOf( Error );
        process.env.IISNODE_VERSION = "";
        done();
    } );
    it( "initilize server throw error (projectRoot not found)", ( done: Mocha.Done ): void => {
        expect( shouldBeError( () => {
            cwserver.initilizeServer( appRoot, `${projectRoot}_not_found` );
        } ) ).toBeInstanceOf( Error );
        done();
    } );
    it( "initilize server throw error (app.config.json not found)", ( done: Mocha.Done ): void => {
        expect( shouldBeError( () => {
            cwserver.initilizeServer( appRoot, `/` );
        } ) ).toBeInstanceOf( Error );
        done();
    } );
    it( "initilize server", ( done: Mocha.Done ): void => {
        if ( fs.existsSync( logDir ) ) {
            Util.rmdirSync( logDir );
        }
        appUtility = cwserver.initilizeServer( appRoot, projectRoot );
        expect( appUtility.public ).toEqual( projectRoot );
        done();
    } );
    it( "initilize server throw error (Server instance can initilize 1 time)", ( done: Mocha.Done ): void => {
        expect( shouldBeError( () => {
            cwserver.initilizeServer( appRoot, projectRoot );
        } ) ).toBeInstanceOf( Error );
        done();
    } );
    it( "initilize application", ( done: Mocha.Done ): void => {
        app = appUtility.init();
        done();
    } );
    it( "application listen", ( done: Mocha.Done ): void => {
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
    it( "throw application already shutdown", ( done: Mocha.Done ): void => {
        app.shutdown( ( err ) => {
            expect( err ).toBeInstanceOf( Error );
            done();
        } );
    } );
    it( "throw application already listen", ( done: Mocha.Done ): void => {
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
    it( 'register view', ( done: Mocha.Done ): void => {
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
    it( 'should throw error (After initilize view, you should not register new veiw)', ( done: Mocha.Done ): void => {
        expect( shouldBeError( () => {
            // tslint:disable-next-line: no-empty
            global.sow.server.on( "register-view", ( _app, controller, server ) => {} );
        } ) ).toBeInstanceOf( Error );
        done();
    } );
} );
describe( "cwserver-session", () => {
    const loginId = "rajib";
    it( 'authenticate-request', ( done: Mocha.Done ): void => {
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
                authCookies = res.header["set-cookie"];
                expect( authCookies ).toBeInstanceOf( Array );
                done();
            } );
    } );
    it( 'should-be-user-authenticated', ( done: Mocha.Done ): void => {
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
    it( 'authenticated-user-should-be-redirect-to-home', ( done: Mocha.Done ): void => {
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
    it( 'send get request to application', ( done: Mocha.Done ): void => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/` )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "text/html" );
                done();
            } );
    } );
    it( 'test applicaton cookie', ( done: Mocha.Done ): void => {
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
    it( 'try to access config.hiddenDirectory', ( done: Mocha.Done ): void => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/lib/` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'try to access $root', ( done: Mocha.Done ): void => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/$root/` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'get-raw-file', ( done: Mocha.Done ): void => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/get-file` )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                done();
            } );
    } );
    it( 'redirect request to controller', ( done: Mocha.Done ): void => {
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
    it( 'test route target /test-any/*', ( done: Mocha.Done ): void => {
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
    it( 'test route target /task/:id/*', ( done: Mocha.Done ): void => {
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
    it( 'test route target /dist/*', ( done: Mocha.Done ): void => {
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
    it( 'test route target /user/:id/settings', ( done: Mocha.Done ): void => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/user/10/settings/100` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'should be 404 route target /test-c/:id', ( done: Mocha.Done ): void => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/test-c/10/df/a` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'should be 404 target route /test-c/:id not match', ( done: Mocha.Done ): void => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/test-c/` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'target route /*', ( done: Mocha.Done ): void => {
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
    it( 'should served from server mem cache', ( done: Mocha.Done ): void => {
        const old = Util.clone( appUtility.server.config.template );
        appUtility.server.config.template.cacheType = "MEM";
        appUtility.server.config.template.cache = true;
        getAgent()
            .get( `http://localhost:${appUtility.port}/` )
            .end( ( err, res ) => {
                Util.extend( appUtility.server.config.template, old );
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "text/html" );
                done();
            } );
    } );
    it( 'should served from server non-template and no cache', ( done: Mocha.Done ): void => {
        const old = Util.clone( appUtility.server.config.template );
        appUtility.server.config.template.cacheType = "MEM";
        appUtility.server.config.template.cache = false;
        const filePath: string = appUtility.server.mapPath( "/no_template.html" );
        expect( fs.existsSync( filePath ) ).toEqual( false );
        fs.writeFileSync( filePath, "<h1>Hello World</h1>" );
        expect( fs.existsSync( filePath ) ).toEqual( true );
        getAgent()
            .get( `http://localhost:${appUtility.port}/no_template` )
            .end( ( err, res ) => {
                Util.extend( appUtility.server.config.template, old );
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "text/html; charset=UTF-8" );
                done();
            } );
    } );
    it( 'should throw template runtime error', ( done: Mocha.Done ): void => {
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
    it( 'send get request should be 404 response config.defaultExt = .html', ( done: Mocha.Done ): void => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/index.html` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                expect( res.header["content-type"] ).toBe( "text/html" );
                done();
            } );
    } );
    it( 'send get request should be 200 response', ( done: Mocha.Done ): void => {
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
    it( 'route `/` then should use config.defaultDoc and create template cache', ( done: Mocha.Done ): void => {
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
    it( 'should be served from template cache', ( done: Mocha.Done ): void => {
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
    it( 'js file bundler with gizp response (server file cache)', ( done: Mocha.Done ): void => {
        const temp = appUtility.server.mapPath( `/web/temp/` );
        if ( fs.existsSync( temp ) ) {
            Util.rmdirSync( temp );
        }
        getAgent()
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
    it( 'bundler should compair if-modified-since header and send 304 (server file cache)', ( () => {
        const sendReq = ( done: Mocha.Done, tryCount: number ): void => {
            if ( tryCount > 0 ) {
                appUtility.server.log.info( `Try Count: ${tryCount} and if-modified-since: ${lastModified}` );
            }
            createRequest( "GET", `http://localhost:${appUtility.port}/app/api/bundle/`, "if-modified-since" )
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
                    if ( ( !err || !( err instanceof Error ) ) && tryCount === 0 ) {
                        return setTimeout( () => {
                            tryCount++;
                            return sendReq( done, tryCount );
                        }, 100 ), void 0;
                    }
                    expect( err ).toBeInstanceOf( Error );
                    expect( res.status ).toBe( 304 );
                    expect( res.header["x-server-revalidate"] ).toBe( "true" );
                    return done();
                } );
        };
        return ( done: Mocha.Done ): void => {
            expect( lastModified.length ).toBeGreaterThan( 0 );
            return sendReq( done, 0 );
        };
    } )() );
    it( 'bundler should compair if-none-match and send 304 (server file cache)', ( () => {
        const sendReq = ( done: Mocha.Done, tryCount: number ): void => {
            if ( tryCount > 0 ) {
                appUtility.server.log.info( `Try Count: ${tryCount} and if-none-match: ${eTag}` );
            }
            createRequest( "GET", `http://localhost:${appUtility.port}/app/api/bundle/`, "if-none-match" )
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
                    if ( ( !err || !( err instanceof Error ) ) && tryCount === 0 ) {
                        return setTimeout( () => {
                            tryCount++;
                            return sendReq( done, tryCount );
                        }, 100 ), void 0;
                    }
                    expect( err ).toBeInstanceOf( Error );
                    expect( res.status ).toBe( 304 );
                    expect( res.header["x-server-revalidate"] ).toBe( "true" );
                    return done();
                } );
        };
        return ( done: Mocha.Done ): void => {
            expect( eTag.length ).toBeGreaterThan( 0 );
            return sendReq( done, 0 );
        };
    } )() );
    it( 'js file bundler with gizp response (no server cache)', ( done: Mocha.Done ): void => {
        appUtility.server.config.bundler.fileCache = false;
        appUtility.server.config.bundler.compress = true;
        getAgent()
            .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
            .query( {
                g: appUtility.server.createBundle( `
                    $virtual_vtest/socket-client.js,
                    static/script/test-1.js,
                    static/script/test-2.js|__owner__`
                ),
                ck: "bundle_no_cache_js", ct: "text/javascript", rc: "Y"
            } )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toEqual( 200 );
                expect( res.header["content-type"] ).toEqual( "application/x-javascript; charset=utf-8" );
                expect( res.header["content-encoding"] ).toEqual( "gzip" );
                expect( res.header["last-modified"] ).toBeDefined();
                lastModified = res.header['last-modified'];
                done();
            } );
    } );
    its( 'bundler should compair if-modified-since header and send 304 (no server cache)', ( () => {
        const sendReq = ( done: Mocha.Done, tryCount: number ): void => {
            if ( tryCount > 0 ) {
                appUtility.server.log.info( `Try Count: ${tryCount} and if-modified-since: ${lastModified}` );
            }
            createRequest( "GET", `http://localhost:${appUtility.port}/app/api/bundle/`, "if-modified-since" )
                .set( "if-modified-since", lastModified )
                .query( {
                    g: appUtility.server.createBundle( `
						$virtual_vtest/socket-client.js,
						static/script/test-1.js,
						static/script/test-2.js|__owner__`
                    ),
                    ck: "bundle_no_cache_js", ct: "text/javascript", rc: "Y"
                } )
                .end( ( err, res ) => {
                    if ( ( !err || !( err instanceof Error ) ) && tryCount === 0 ) {
                        return setTimeout( () => {
                            tryCount++;
                            return sendReq( done, tryCount );
                        }, 100 ), void 0;
                    }
                    expect( err ).toBeInstanceOf( Error );
                    expect( res.status ).toEqual( 304 );
                    expect( res.header["x-server-revalidate"] ).toEqual( "true" );
                    return done();
                } );
        };
        return ( done: Mocha.Done ): void => {
            expect( lastModified.length ).toBeGreaterThan( 0 );
            appUtility.server.config.bundler.fileCache = false;
            appUtility.server.config.bundler.compress = true;
            return sendReq( done, 0 );
        };
    } )() );
    it( 'js file bundler not gizp response (no server cache)', ( done: Mocha.Done ): void => {
        appUtility.server.config.bundler.compress = false;
        appUtility.server.config.bundler.fileCache = false;
        getAgent()
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
    it( 'css file bundler with gizp response (server file cache)', ( done: Mocha.Done ): void => {
        appUtility.server.config.bundler.fileCache = true;
        appUtility.server.config.bundler.compress = true;
        getAgent()
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
    it( 'js file bundler not gizp response (server cache)', ( done: Mocha.Done ): void => {
        appUtility.server.config.bundler.compress = false;
        appUtility.server.config.bundler.fileCache = true;
        getAgent()
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
    it( 'bundler should be virtual file error', ( done: Mocha.Done ): void => {
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
    it( 'bundler should be virtual error', ( done: Mocha.Done ): void => {
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
    it( 'bundler should be unsupported content type error  (server cache)', ( done: Mocha.Done ): void => {
        appUtility.server.config.bundler.fileCache = true;
        appUtility.server.config.bundler.enable = true;
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
    it( 'bundler should be unsupported content type error  (no server cache)', ( done: Mocha.Done ): void => {
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
    it( 'bundler should be path parse error', ( done: Mocha.Done ): void => {
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
    it( 'bundler should be encryption error', ( done: Mocha.Done ): void => {
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
    it( 'bundler should be error (no param (no cache))', ( done: Mocha.Done ): void => {
        appUtility.server.config.bundler.fileCache = false;
        getAgent()
            .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'bundler should be error (no param (server cache))', ( done: Mocha.Done ): void => {
        appUtility.server.config.bundler.fileCache = true;
        getAgent()
            .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'bundler should be encryption error (server cache)', ( done: Mocha.Done ): void => {
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
    it( 'bundler should be skip invalid if-modified-since header and send 200', ( done: Mocha.Done ): void => {
        request
            .get( `http://localhost:${appUtility.port}/app/api/bundle/` )
            .set( "if-modified-since", `AAAZZZ` )
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
                done();
            } );
    } );
} );
describe( "cwserver-post", () => {
    it( 'send post request content type application/json', ( done: Mocha.Done ): void => {
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
    it( 'send post request unknown content type application/jsons', ( done: Mocha.Done ): void => {
        getAgent()
            .post( `http://localhost:${appUtility.port}/post?task=ERROR` )
            .send( JSON.stringify( { name: 'rajibs', occupation: 'kutukutu' } ) )
            .set( 'Content-Type', 'application/jsons' )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "application/json" );
                expect( res.body.error ).toBe( true );
                done();
            } );
    } );
    it( 'send post request content type urlencoded', ( done: Mocha.Done ): void => {
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
    it( 'send post request to async handler', ( done: Mocha.Done ): void => {
        getAgent()
            .post( `http://localhost:${appUtility.port}/post-async/10` )
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
    it( 'should post request not found', ( done: Mocha.Done ): void => {
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
describe( "cwserver-multipart-paylod-parser", () => {
    const processReq = ( done: Mocha.Done, saveto?: string ): void => {
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
            .query( { saveto } )
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
    }
    it( 'should post multipart post file', ( done: Mocha.Done ): void => {
        processReq( done );
    } );
    it( 'should post multipart post file and save as bulk', ( done: Mocha.Done ): void => {
        processReq( done, "true" );
    } );
    it( 'test multipart post file and clear', ( done: Mocha.Done ): void => {
        processReq( done, "C" );
    } );
} );
describe( "cwserver-gzip-response", () => {
    it( 'should be response type gzip', ( done: Mocha.Done ): void => {
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
    it( 'served static file no cache', ( done: Mocha.Done ): void => {
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
    it( 'should be mime type encoding gzip', ( done: Mocha.Done ): void => {
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
    it( 'should be mime type if-none-match', ( done: Mocha.Done ): void => {
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
    it( 'should be mime type if-modified-since', ( done: Mocha.Done ): void => {
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
    it( 'should be mime type not found', ( done: Mocha.Done ): void => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/logo/logos.png` )
            .set( "if-modified-since", lastModified )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'unsupported mime type', ( done: Mocha.Done ): void => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/logo/logo.zip` )
            .set( "if-modified-since", lastModified )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'should be served from file (no server file cache)', ( done: Mocha.Done ): void => {
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
    it( 'should be gzip response & served from file (no server file cache)', ( done: Mocha.Done ): void => {
        const oldValue = Util.clone( appUtility.server.config.staticFile );
        appUtility.server.config.staticFile.fileCache = false;
        appUtility.server.config.staticFile.compression = true;
        const filePath: string = appUtility.server.mapPath( "/test.pdf" );
        expect( fs.existsSync( filePath ) ).toEqual( false );
        fs.writeFileSync( filePath, "<h1>Hello World</h1>" );
        expect( fs.existsSync( filePath ) ).toEqual( true );
        getAgent()
            .get( `http://localhost:${appUtility.port}/test.pdf` )
            .end( ( err, res ) => {
                Util.extend( appUtility.server.config.staticFile, oldValue );
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "application/pdf" );
                expect( res.header["content-encoding"] ).toBe( "gzip" );
                done();
            } );
    } );
    it( 'should be mime type if-none-match (no server file cache)', ( done: Mocha.Done ): void => {
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
    it( 'should be favicon.ico 200', ( done: Mocha.Done ): void => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/favicon.ico` )
            .end( ( err, res ) => {
                expect( err ).not.toBeInstanceOf( Error );
                expect( res.status ).toBe( 200 );
                expect( res.header["content-type"] ).toBe( "image/x-icon" );
                done();
            } );
    } );
    it( 'catch-HttpMimeHandler-error', ( done: Mocha.Done ): void => {
        const parent: string = path.resolve( __dirname, '..' );
        const absPath = path.resolve( `${parent}/dist/mime-type.json` );
        expect( fs.existsSync( absPath ) ).toBe( true );
        const distPath = path.resolve( `${parent}/mime-types.json` );
        fs.renameSync( absPath, distPath );
        expect( shouldBeError( () => {
            const mime = new cwserver.HttpMimeHandler();
        } ) ).toBeInstanceOf( Error );
        fs.writeFileSync( absPath, "INVALID_JSON" );
        expect( fs.existsSync( absPath ) ).toEqual( true );
        expect( shouldBeError( () => {
            const mime = new cwserver.HttpMimeHandler();
        } ) ).toBeInstanceOf( Error );
        fs.unlinkSync( absPath );
        fs.renameSync( distPath, absPath );
        done();
    } );
} );
describe( "cwserver-virtual-dir", () => {
    it( 'check-virtual-dir-server-manage', ( done: Mocha.Done ): void => {
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
    it( 'check-virtual-dir-mimeType-404', ( done: Mocha.Done ): void => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/test-virtual/socket-client.jsx` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'check-virtual-dir-handler', ( done: Mocha.Done ): void => {
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
describe( "cwserver-socket-io-implementation", () => {
    it( 'get ws-server-event', ( done: Mocha.Done ): void => {
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
    it( 'should be send n receive data over socket-io', ( done: Mocha.Done ): void => {
        const socket = io.connect( `http://localhost:${appUtility.port}`, {
            reconnection: true, transportOptions: {
                polling: {
                    extraHeaders: {
                        'Cookie': authCookies[0].substring( 0, authCookies[0].indexOf(";") )
                    }
                }
            }
        } );
        socket.on( 'connect', () => {
            socket.emit( 'test-msg', { name: 'rajibs', occupation: 'kutukutu' } );
        } );
        socket.on( 'on-test-msg', ( data: { name: any; } ) => {
            socket.close();
            expect( data.name ).toEqual( 'rajibs' );
            done();
        } );
    } );
} );
describe( "cwserver-echo", () => {
    it( 'echo-server', ( done: Mocha.Done ): void => {
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
    it( 'should-be-get-stream-request', ( done: Mocha.Done ): void => {
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
    it( 'should-be-stream', ( done: Mocha.Done ): void => {
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
    it( 'should be throw server error', ( done: Mocha.Done ): void => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/app-error/` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 500 );
                done();
            } );
    } );
    it( 'should be pass server error', ( done: Mocha.Done ): void => {
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
    it( 'config.defaultDoc', ( done: Mocha.Done ): void => {
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
    it( 'should be route not found', ( done: Mocha.Done ): void => {
        getAgent()
            .get( `http://localhost:${appUtility.port}/app-error` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'no controller found for put', ( done: Mocha.Done ): void => {
        getAgent()
            .delete( `http://localhost:${appUtility.port}/app-error` )
            .end( ( err, res ) => {
                expect( err ).toBeInstanceOf( Error );
                expect( res.status ).toBe( 404 );
                done();
            } );
    } );
    it( 'should-be-reset-controller', ( done: Mocha.Done ): void => {
        expect( appUtility.controller.remove( '/authenticate' ) ).toEqual( true );
        expect( appUtility.controller.remove( '/post' ) ).toEqual( true );
        appUtility.controller.reset();
        done();
    } );
    it( 'should-be-controller-error', ( done: Mocha.Done ): void => {
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
    it( "test-app-utility", ( done: Mocha.Done ): void => {
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
        expect( shouldBeError( () => {
            Util.copyFileSync( `${logDir}/temp/`, "./" );
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            Util.copyFileSync( `${logDir}/temp/nofile.lg`, "./" );
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            Util.copyFileSync( `${logDir}/temp/nofile.lg`, `${logDir}/temp/nofile.lgx` );
        } ) ).toBeInstanceOf( Error );
        expect( Util.rmdirSync( `${logDir}/temp/` ) ).not.toBeInstanceOf( Error );
        expect( Util.copySync( `${logDir}/temp/`, `${logDir}/tempx/` ) ).not.toBeInstanceOf( Error );
        expect( Util.mkdirSync( logDir ) ).toEqual( true );
        expect( Util.extend( {}, Session.prototype ) ).toBeInstanceOf( Object );
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
        it( 'database', ( done: Mocha.Done ): void => {
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
        it( 'override', ( done: Mocha.Done ): void => {
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
    it( 'log', ( done: Mocha.Done ): void => {
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
    it( "validate-schema", ( done: Mocha.Done ): void => {
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
        expect( shouldBeError( () => {
            config.$schema = $schema;
            const old = config.appName;
            try {
                config.appName = "";
                Schema.Validate( config );
            } catch ( e ) {
                config.appName = old;
                throw e;
            }
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            config.$schema = $schema;
            const old = config.template;
            try {
                config.template = void 0;
                Schema.Validate( config );
            } catch ( e ) {
                config.template = old;
                throw e;
            }
        } ) ).toBeInstanceOf( Error );
        expect( shouldBeError( () => {
            Schema.Validate( [] );
        } ) ).toBeInstanceOf( Error );
        const parent = path.resolve( __dirname, '..' );
        const absPath = path.resolve( `${parent}/schema.json` );
        expect( fs.existsSync( absPath ) ).toBe( true );
        const distPath = path.resolve( `${parent}/schemas.json` );
        fs.renameSync( absPath, distPath );
        process.env.SCRIPT = "TSX";
        expect( shouldBeError( () => {
            Schema.Validate( config );
        } ) ).toBeInstanceOf( Error );
        process.env.SCRIPT = "TS";
        fs.writeFileSync( absPath, "{}" );
        expect( shouldBeError( () => {
            Schema.Validate( config );
        } ) ).toBeInstanceOf( Error );
        fs.writeFileSync( absPath, "INVALID_JSON" );
        expect( shouldBeError( () => {
            Schema.Validate( config );
        } ) ).toBeInstanceOf( Error );
        fs.unlinkSync( absPath );
        fs.renameSync( distPath, absPath );
        done();
    } );
    it( "shutdown-application", ( done: Mocha.Done ): void => {
        shutdownApp( done );
    } );
} );