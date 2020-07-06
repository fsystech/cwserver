// 4:38 AM 5/22/2020
import expect from 'expect';
import * as path from "path";
import * as fs from "fs";
import * as fsw from '../lib/sow-fsw';
import {
	IRequestParam
} from '../lib/sow-router';
import {
	IApplication, IRequest, IResponse, NextFunction,
	parseCookie, parseUrl, getClientIpFromHeader, escapePath
} from '../lib/sow-server-core';
import { IController } from '../lib/sow-controller';
import {
	ISowServer, IContext,
	disposeContext, getMyContext, removeContext
} from '../lib/sow-server';
import { SowHttpCache } from '../lib/sow-http-cache';
import { SocketClient, SocketErr1, SocketErr2 } from './socket-client';
import {
	socketInitilizer, getBodyParser, PayloadParser,
	HttpMimeHandler, Streamer, Encryption
} from '../index';
import { IPostedFileInfo, UploadFileInfo, IBodyParser, decodeBodyBuffer } from '../lib/sow-body-parser';
import { assert, Util } from '../lib/sow-util';
const mimeHandler = new HttpMimeHandler();
export function shouldBeError( next: () => void, printerr?: boolean ): Error | void {
	try {
		next();
	} catch ( e ) {
		if ( printerr === true ) console.log( e );
		return e;
	}
};
global.sow.server.on( "register-view", ( app: IApplication, controller: IController, server: ISowServer ) => {
	expect( parseCookie( ["test"] ) ).toBeInstanceOf( Object );
	expect( parseCookie( {} ) ).toBeInstanceOf( Object );
	app.use( "/app-error", ( req: IRequest, res: IResponse, next: NextFunction ) => {
		expect( req.session ).toBeInstanceOf( Object );
		expect( parseUrl().pathname ).toBeNull();
		expect( getClientIpFromHeader( req.headers ) ).toBeDefined();
		req.headers['x-forwarded-for'] = "127.0.0.1,127.0.0.5";
		expect( getClientIpFromHeader( req.headers ) ).toEqual( '127.0.0.1' );
		throw new Error( "Application should be fire Error event" );
	} ).prerequisites( ( req: IRequest, res: IResponse, next: NextFunction ): void => {
		expect( req.session ).toBeInstanceOf( Object );
		return next();
	} );
	expect( shouldBeError( () => { socketInitilizer( server, SocketErr1() ) } ) ).toBeInstanceOf( Error );
	expect( shouldBeError( () => { socketInitilizer( server, SocketErr2() ) } ) ).toBeInstanceOf( Error );
	const ws = socketInitilizer( server, SocketClient() );
	const io = require( "socket.io" );
	ws.create( io, app.httpServer );
	expect( ws.create( io, app.httpServer ) ).toEqual( false );
	expect( ws.isConnectd ).toEqual( true );
	controller.get( '/ws-server-event', ( ctx: IContext, requestParam?: IRequestParam ): void => {
		const event = ws.wsEvent;
		expect( event ).toBeInstanceOf( Object );
		ctx.res.json( ws.wsEvent || {} ); ctx.next( 200 );
		return void 0;
	} );
	controller.any( "/test-head", ( ctx: IContext, requestParam?: IRequestParam ): void => {
		return ctx.res.status( 200 ).send();
	} );
} );
global.sow.server.on( "register-view", ( app: IApplication, controller: IController, server: ISowServer ) => {
	expect( shouldBeError( () => { mimeHandler.getMimeType( "NO_EXT" ); } ) ).toBeInstanceOf( Error );
	const vDir: string = path.join( path.resolve( server.getRoot(), '..' ), "/project_template/test/" );
	server.addVirtualDir( "/vtest", vDir, ( ctx: IContext ): void => {
		if ( !mimeHandler.isValidExtension( ctx.extension ) ) return ctx.next( 404 );
		mimeHandler.getMimeType( ctx.extension );
		return mimeHandler.render( ctx, vDir, true );
	} );
	expect( shouldBeError( () => {
		server.addVirtualDir( "/vtest", vDir );
	} ) ).toBeInstanceOf( Error );
	server.addVirtualDir( "/test-virtual", vDir );
	server.addVirtualDir( "/vtest/virtual", vDir );
	expect( shouldBeError( () => {
		app.use( "/:error", ( req: IRequest, res: IResponse, next: NextFunction, requestParam?: IRequestParam ) => {
			//
		} );
	} ) ).toBeInstanceOf( Error );
} );
global.sow.server.on( "register-view", ( app: IApplication, controller: IController, server: ISowServer ) => {
	const streamDir = path.join( path.resolve( server.getRoot(), '..' ), "/project_template/test/" );
	server.addVirtualDir( "/web-stream", streamDir, ( ctx: IContext, requestParam?: IRequestParam ): void => {
		if ( ctx.server.config.liveStream.indexOf( ctx.extension ) > -1 ) {
			return fsw.isExists( `${streamDir}/${ctx.path}`, ( exists: boolean, url: string ): void => {
				if ( !exists ) return ctx.next( 404 );
				const mimeType = mimeHandler.getMimeType( ctx.extension );
				return fs.stat( url, ( err: NodeJS.ErrnoException | null, stats: fs.Stats ) => {
					return ctx.handleError( err, () => {
						return Streamer.stream( ctx, url, mimeType, stats );
					} );
				} );
			} );
		}
		return ctx.next( 404 );
	} );
	server.addVirtualDir( "/static-file", streamDir, ( ctx: IContext, requestParam?: IRequestParam ): void => {
		return mimeHandler.render( ctx, streamDir, true );
	} );
	expect( shouldBeError( () => {
		server.addVirtualDir( "/static-file/*", streamDir );
	} ) ).toBeInstanceOf( Error );
	expect( shouldBeError( () => {
		server.addVirtualDir( "/:static-file", streamDir );
	} ) ).toBeInstanceOf( Error );
} );
global.sow.server.on( "register-view", ( app: IApplication, controller: IController, server: ISowServer ) => {
	const downloadDir = server.mapPath( "/upload/data/" );
	if ( !fs.existsSync( downloadDir ) ) {
		fsw.mkdirSync( server.mapPath( "/" ), "/upload/data/" );
	}
	const tempDir: string = server.mapPath( "/upload/temp/" );
	fsw.mkdirSync( tempDir );
	controller.post( '/post-test-data', ( ctx: IContext ) => {
		const parser: IBodyParser = getBodyParser( ctx.req, tempDir );
		try {
			parser.parse( ( err ) => {
				ctx.res.json( parser.getJson() );
				parser.dispose();
			} );
		} catch ( e ) {
			console.log( e );
			ctx.res.json( {} );
		}
	} ).post( '/post', async ( ctx: IContext, requestParam?: IRequestParam ) => {
		const task: string | void = typeof ( ctx.req.query.task ) === "string" ? ctx.req.query.task.toString() : void 0;
		const parser: IBodyParser = getBodyParser( ctx.req, tempDir );
		if ( parser.isMultipart() ) {
			return ctx.next( 404 );
		}
		expect(ctx.req.isMobile).toBeTruthy();
		expect(ctx.req.isMobile).toBeTruthy();
		if ( task && task === "ERROR" ) {
			try {
				await parser.parseSync();
			} catch ( e ) {
				expect( e ).toBeInstanceOf( Error );
			}
		}
		parser.parse( ( err ) => {
			const result: { [key: string]: any; } = {};
			if ( parser.isAppJson() ) {
				result.isJson = true;
			}
			expect( shouldBeError( () => {
				parser.saveAsSync( downloadDir );
			} ) ).toBeInstanceOf( Error );
			expect( shouldBeError( () => {
				parser.getFiles( ( pf ) => { return; } );
			} ) ).toBeInstanceOf( Error );
			expect( shouldBeError( () => {
				parser.getUploadFileInfo();
			} ) ).toBeInstanceOf( Error );
			if ( err && err instanceof Error ) {
				ctx.res.json( Util.extend( result, { error: true, msg: err.message } ) );
			} else {
				ctx.res.json( Util.extend( result, parser.getJson() ) );
			}
			return ctx.next( 200 );
		} );
	} ).post( '/post-async/:id', async ( ctx: IContext, requestParam?: IRequestParam ) => {
		const parser: IBodyParser = getBodyParser( ctx.req, tempDir );
		if ( parser.isUrlEncoded() || parser.isAppJson() ) {
			await parser.parseSync();
			return ctx.res.asHTML( 200 ).end( JSON.stringify( parser.getJson() ) );
		}
		parser.saveAsSync( downloadDir );
		parser.dispose();
		return ctx.res.asHTML( 200 ).end( "<h1>success</h1>" );
	} ).post( '/post-data', ( ctx: IContext, requestParam?: IRequestParam ): void => {
		const parser: IBodyParser = getBodyParser( ctx.req );
		expect( shouldBeError( () => {
			parser.setMaxBuffLength( 0 );
		} ) ).toBeInstanceOf( Error );
		expect( shouldBeError( () => {
			parser.setMaxBuffLength( -1 );
		} ) ).toBeInstanceOf( Error );
		parser.setMaxBuffLength( 1024 * 1 );// 1kb
		parser.parse( ( err?: Error ): void => {
			expect( err ).toBeInstanceOf( Error );
			if ( err )
				return ctx.transferError( err );
			return ctx.res.status( 200 ).json( parser.getUploadFileInfo() );
		} );
	} ).post( '/upload-invalid-file', async ( ctx: IContext, requestParam?: IRequestParam ): Promise<void> => {
		const parser: IBodyParser = getBodyParser( ctx.req );
		try {
			await parser.readDataAsync();
			ctx.res.status( 200 ).json( parser.getUploadFileInfo() );
		} catch ( e ) {
			parser.dispose();
			ctx.transferError( e );
		}
	} ).post( '/abort-error', async ( ctx: IContext, requestParam?: IRequestParam ): Promise<void> => {
		const parser: IBodyParser = getBodyParser( ctx.req, tempDir );
		let err: Error | undefined;
		try {
			parser.setMaxBuffLength( 1024 * 1024 * 20 );
			await parser.parseSync();
		} catch ( e ) {
			err = e;
		}
		parser.dispose();
		if ( err ) {
			if ( err.message.indexOf( "CLIENET_DISCONNECTED" ) > -1 ) return ctx.next( -500 );
			console.log( err );
			ctx.transferError( err );
			return;
		}
		throw new Error( "Should not here..." );
	} ).post( '/upload-malformed-data', async ( ctx: IContext, requestParam?: IRequestParam ): Promise<void> => {
		ctx.req.push( "This is normal line\n".repeat( 5 ) );
		const parser: IBodyParser = getBodyParser( ctx.req, tempDir );
		let err: Error | undefined;
		try {
			await parser.parseSync();
		} catch ( e ) {
			err = e;
		}
		parser.dispose();
		if ( err ) {
			server.addError( ctx, err );
			return server.transferRequest( ctx, 500 );
		}
		// throw new Error( "Should not here..." );
	} ).post( '/upload-test', async ( ctx: IContext, requestParam?: IRequestParam ): Promise<void> => {
		try {
			const parser: IBodyParser = getBodyParser( ctx.req, tempDir );
			expect( shouldBeError( () => {
				parser.getFiles( ( pf ) => {
					console.log( pf );
				} );
			} ) ).toBeInstanceOf( Error );
			expect( shouldBeError( () => {
				parser.getUploadFileInfo();
			} ) ).toBeInstanceOf( Error );
			expect( shouldBeError( () => {
				parser.getData();
			} ) ).toBeInstanceOf( Error );
			await parser.parseSync();
			const data: UploadFileInfo[] = parser.getUploadFileInfo();
			parser.saveAsSync( downloadDir );
			parser.dispose();
			ctx.res.json( data.shift() || {} );
			ctx.next( 200 );
		} catch ( e ) {
			throw e;
		}
	} ).post( '/upload-non-bolock', ( ctx: IContext, requestParam?: IRequestParam ): void => {
		if ( ctx.res.isAlive ) {
			expect( ctx.req.get( "content-type" ) ).toBeDefined();
			const parser: IBodyParser = getBodyParser( ctx.req, tempDir );
			return parser.parse( ( err ) => {
				assert( err === undefined, "parser.parse" );
				const data: UploadFileInfo[] = parser.getUploadFileInfo();
				return parser.getFiles( ( file?: IPostedFileInfo, done?: () => void ): void => {
					if ( !file || !done ) return ctx.res.status( 200 ).send( data.shift() || {} );
					expect( parser.getData() ).toBeDefined();
					return file.read( ( rerr: Error | NodeJS.ErrnoException | null, buff: Buffer ): void => {
						assert( rerr === null, "file.read" );
						expect( buff ).toBeInstanceOf( Buffer );
						return parser.saveAs( downloadDir, ( serr: Error | NodeJS.ErrnoException | null ): void => {
							assert( serr === null, "file.saveAs" );
							expect( shouldBeError( () => {
								ctx.res.status( 0 );
							} ) ).toBeInstanceOf( Error );
							ctx.res.status( 200 ).send( data.shift() || {} );
							expect( shouldBeError( () => {
								ctx.res.send( "Nothing...." );
							} ) ).toBeInstanceOf( Error );
						}, ctx.handleError.bind( ctx ) );
					} );
				} );
			} );
		}
	} ).post( '/upload', async ( ctx: IContext, requestParam?: IRequestParam ): Promise<void> => {
		const saveTo = typeof ( ctx.req.query.saveto ) === "string" ? ctx.req.query.saveto.toString() : void 0;
		const parser: IBodyParser = getBodyParser( ctx.req, tempDir );
		expect( shouldBeError( () => {
			parser.saveAsSync( downloadDir );
		} ) ).toBeInstanceOf( Error );
		parser.readData( ( err ) => {
			assert( err === undefined, "parser.parse" );
			if ( !parser.isMultipart() ) {
				ctx.next( 404 );
			} else {
				const data: UploadFileInfo[] = parser.getUploadFileInfo();
				parser.getFilesSync( ( file: IPostedFileInfo ): void => {
					expect( file.readSync() ).toBeInstanceOf( Buffer );
					if ( saveTo ) {
						if ( saveTo === "C" ) {
							file.clear();
						}
						return;
					}
					file.saveAsSync( `${downloadDir}/${Util.guid()}_${file.getFileName()}` );
					expect( shouldBeError( () => {
						file.readSync();
					} ) ).toBeInstanceOf( Error );
					expect( shouldBeError( () => {
						file.saveAsSync( `${downloadDir}/${Util.guid()}_${file.getFileName()}` );
					} ) ).toBeInstanceOf( Error );
				} );
				if ( saveTo && saveTo !== "C" ) {
					expect( shouldBeError( () => {
						parser.saveAsSync( server.mapPath( "/upload/data/schema.json" ) );
					} ) ).toBeInstanceOf( Error );
					parser.saveAsSync( downloadDir );
				}
				ctx.res.json( data.shift() || {} );
				ctx.next( 200 );
			}
			parser.dispose();
			expect( parser.dispose() ).not.toBeInstanceOf( Error );
		} );
	} );
} );
global.sow.server.on( "register-view", ( app: IApplication, controller: IController, server: ISowServer ) => {
	controller
		.get( "/test-context", ( ctx: IContext, requestParam?: IRequestParam ): void => {
			try {
				expect( escapePath() ).toBeDefined();
				const mCtx: IContext = server.createContext( Object.create( {
					id: "1010", dispose() {
						// Nothing to do
					},
					path: "/index.html"
				} ), Object.create( {
					id: "1010", dispose() {
						// Nothing to do
					}
				} ), () => {
					// Nothing to do
				} );
				removeContext( "10101" );
				getMyContext( "10101" );
				removeContext( "1010" );
				mCtx.dispose();
				mCtx.transferError(new Error("Test"));
				mCtx.handleError(null, ()=>{
					// Nothing to do
				});
				mCtx.redirect("/test");
				mCtx.write("");
				mCtx.transferRequest(0);
				mCtx.signOut();
				mCtx.setSession("Test","Test",{});
				const nctx: IContext = server.createContext( ctx.req, ctx.res, ctx.next );
				nctx.path = "/not-found/404/";
				nctx.req.path = "/not-found/404/";
				nctx.next = ( code, transfer ) => {
					// Nothing to do....!
					expect( code ).toEqual( 404 );
				}
				const oldDoc: string[] = server.config.defaultDoc;
				server.config.defaultDoc = [];
				controller.processAny( nctx );
				server.config.defaultDoc = oldDoc;
				nctx.path = "";
				nctx.req.path = "";
				controller.processAny( nctx );
				const oldext: string = server.config.defaultExt;
				server.config.defaultExt = "";
				server.config.defaultDoc = [];
				controller.processAny( nctx );
				nctx.path = "/not-found/";
				nctx.req.path = "/not-found/";
				controller.processAny( nctx );
				server.config.defaultExt = oldext;
				server.config.defaultDoc = oldDoc;
				nctx.path = "/not-found/index";
				nctx.req.path = "/not-found/index";
				controller.processAny( nctx );
				const oldEncoding = ctx.req.headers['accept-encoding'];
				ctx.req.headers['accept-encoding'] = void 0;
				expect( SowHttpCache.isAcceptedEncoding( ctx.req.headers, "NOTHING" ) ).toBeFalsy();
				ctx.req.headers['accept-encoding'] = oldEncoding;
				const treq = ctx.transferRequest;
				ctx.transferRequest = ( toPath: string | number ): void => {
					if ( typeof ( toPath ) === "string" )
						expect( toPath.indexOf( "404" ) ).toBeGreaterThan( -1 );
					else
						expect( toPath ).toEqual( 404 );
				}
				mimeHandler.render( ctx );
				expect( mimeHandler.isValidExtension( ctx.extension ) ).toBeFalsy();
				ctx.transferRequest = treq;
				( () => {
					const oldEnd = ctx.res.end;
					ctx.res.end = ( ...arg: any[] ): void => {
						expect( arg.length ).toBeGreaterThanOrEqual( 0 );
					}
					ctx.res.status( 204 ).send();
					expect( shouldBeError( () => {
						ctx.res.status( 200 ).send();
					} ) ).toBeInstanceOf( Error );
					ctx.res.status( 200 ).send( "Nothing to do..." );
					ctx.res.setHeader( 'Content-Type', "" );
					ctx.res.send( true );
					ctx.res.setHeader( 'Content-Type', "" );
					ctx.res.send( 1000 );
					ctx.res.setHeader( 'Content-Type', "" );
					ctx.res.send( Buffer.from( "Nothing to do...." ) );
					ctx.res.end = oldEnd;
				} )();
				( () => {
					const parser: IBodyParser = getBodyParser( ctx.req, server.mapPath( "/upload/temp/" ) );
					expect( shouldBeError( () => {
						parser.getData();
					} ) ).toBeInstanceOf( Error );
					parser.dispose();
				} )();
				( () => {
					expect( shouldBeError( () => {
						decodeBodyBuffer( Buffer.from( "data==10&p=10&c=10" ), ( k: string, b: string ): void => {
							// Nothing to do
						} )
					} ) ).toBeInstanceOf( Error );
					expect( shouldBeError( () => {
						decodeBodyBuffer( Buffer.from( "&data==10&p=10&c=10" ), ( k: string, b: string ): void => {
							// Nothing to do
						} )
					} ) ).toBeInstanceOf( Error );
				} )();
				( () => {
					const parser = new PayloadParser( ctx.req, server.mapPath( "/upload/temp/" ) );
					parser.clear();
				} )();
				process.env.TASK_TYPE = 'TESTX';
				ctx.req.cleanSocket = true;
				ctx.res.cleanSocket = true;
				ctx.res.json( {
					done: true
				} );
			} catch ( e ) {
				console.log( e );
				ctx.res.json( {
					done: true
				} );
			}
		} )
		.get( '/controller-error', ( ctx: IContext, requestParam?: IRequestParam ): void => {
			throw new Error( "runtime-error" );
		} )
		.any( '/test-any/*', ( ctx: IContext, requestParam?: IRequestParam ): void => {
			ctx.res.setHeader( 'cache-control', 'no-store, no-cache, must-revalidate, immutable' );
			ctx.res.noCache();
			ctx.res.setHeader( 'cache-control', 'max-age=300' );
			ctx.res.noCache();
			expect( server.passError( ctx ) ).toBeFalsy();
			ctx.res.status( 200, { 'cache-control': void 0 } );
			ctx.res.status( 200 ).json( { reqPath: ctx.path, servedFrom: "/test-any/*", q: requestParam } );
			ctx.res.send = () => {
				return void 0;
			}
			server.addError( ctx, new Error( "__INVALID___" ) );
			expect( server.passError( ctx ) ).toBeTruthy();
			disposeContext( ctx );
			disposeContext( ctx );
			removeContext( "12" );
			getMyContext( "12" );
		} )
		.get( '/task/:id/*', ( ctx: IContext, requestParam?: IRequestParam ): void => {
			return ctx.res.json( { reqPath: ctx.path, servedFrom: "/task/:id/*", q: requestParam } );
		} )
		.get( '/test-c/:id', ( ctx: IContext, requestParam?: IRequestParam ): void => {
			return ctx.res.json( { reqPath: ctx.path, servedFrom: "/test-c/:id", q: requestParam } );
		} )
		.get( '/dist/*', ( ctx: IContext, requestParam?: IRequestParam ): void => {
			return ctx.res.json( { reqPath: ctx.path, servedFrom: "/dist/*", q: requestParam } );
		} )
		.get( '/user/:id/settings', ( ctx: IContext, requestParam?: IRequestParam ): void => {
			return ctx.res.json( { reqPath: ctx.path, servedFrom: "/user/:id/settings", q: requestParam } );
		} )
		.get( '/404', ( ctx: IContext, requestParam?: IRequestParam ): void => {
			return Util.sendResponse( ctx, "/invalid/not-found/no.html" );
		} );

} );
global.sow.server.on( "register-view", ( app: IApplication, controller: IController, server: ISowServer ) => {
	controller
		.get( '/get-file', ( ctx: IContext, requestParam?: IRequestParam ): void => {
			return Util.sendResponse( ctx, server.mapPath( "index.html" ), "text/plain" );
		} )
		.any( '/cookie', ( ctx: IContext, requestParam?: IRequestParam ): void => {
			ctx.res.cookie( "test-1", "test", {
				domain: "localhost", path: "/",
				expires: new Date(), secure: true,
				sameSite: true
			} );
			ctx.res.cookie( "test-2", "test", {
				domain: "localhost", path: "/",
				expires: new Date(), secure: true,
				sameSite: 'lax'
			} );
			ctx.res.cookie( "test-3", "test", {
				domain: "localhost", path: "/",
				expires: new Date(), secure: true,
				sameSite: 'none'
			} );
			ctx.res.cookie( "test-4", "test", {
				domain: "localhost", path: "/",
				expires: new Date(), secure: true,
				sameSite: 'strict'
			} );
			expect( ctx.req.cookies ).toBeInstanceOf( Object );
			expect( ctx.req.ip ).toBeDefined();
			expect( ctx.req.ip ).toBeDefined();
			expect( ctx.res.get( 'Set-Cookie' ) ).toBeDefined();
			expect( ctx.req.get( 'cookie' ) ).toBeDefined();
			expect( ctx.res.get( 'server' ) ).toEqual( "SOW Frontend" );
			expect( ctx.res.isAlive ).toBeTruthy();
			server.setDefaultProtectionHeader( ctx.res );
			expect( shouldBeError( () => {
				server.transferRequest( ctx, 200 );
			} ) ).toBeInstanceOf( Error );
			ctx.res.json( { task: "done" } );
			return void 0;
		} )
		.any( '/echo', ( ctx: IContext, requestParam?: IRequestParam ): void => {
			ctx.res.writeHead( 200, {
				"Content-Type": ctx.req.headers["content-type"] || "text/plain"
			} );
			ctx.req.pipe( ctx.res );
			return void 0;
		} )
		.any( '/response', ( ctx: IContext, requestParam?: IRequestParam ): void => {
			if ( ctx.req.method === "GET" ) {
				if ( ctx.req.query.task === "gzip" ) {
					const data = ctx.req.query.data;
					return ctx.res.json( typeof ( data ) === "string" ? JSON.parse( data ) : data, true, ( err ) => {
						ctx.server.addError( ctx, err || "" );
						ctx.next( 500 );
					} ), void 0;
				}
			}
			return ctx.next( 404 );
		} )
		.get( '/is-authenticate', ( ctx: IContext, requestParam?: IRequestParam ): void => {
			if ( !ctx.req.query.loginId ) return ctx.next( 401 );
			if ( ctx.session.loginId !== ctx.req.query.loginId ) return ctx.next( 401 );
			ctx.res.json( ctx.session ); return ctx.next( 200 );
		} )
		.get( '/signout', ( ctx: IContext, requestParam?: IRequestParam ): void => {
			if ( !ctx.session.isAuthenticated ) {
				return ctx.next( 401, true );
			}
			ctx.signOut().redirect( "/", true ).next( 302, true );
		} )
		.any( '/redirect', ( ctx: IContext, requestParam?: IRequestParam ): void => {
			return ctx.redirect( "/", true ), ctx.next( 302, false );
		} )
		.any( '/pass-error', ( ctx: IContext, requestParam?: IRequestParam ): void => {
			server.addError( ctx, new Error( 'test pass-error' ) );
			server.addError( ctx, 'test pass-error' );
			return server.passError( ctx ), void 0;
		} )
		.get( '/authenticate', ( ctx: IContext, requestParam?: IRequestParam ): void => {
			if ( !ctx.req.query.loginId ) {
				if ( !ctx.req.session.isAuthenticated ) return ctx.next( 401 );
				return ctx.res.status( 302 ).redirect( "/" ), ctx.next( 302, false );
			}
			const loginID = ctx.req.query.loginId.toString();
			const result = {
				code: 200,
				data: {
					token: "",
					hash: "",
					userInfo: {
						loginId: ""
					},
					error: false
				}
			};
			if ( ctx.req.session.isAuthenticated ) {
				result.data.hash = Encryption.toMd5( ctx.req.session.loginId );
				result.data.userInfo.loginId = ctx.req.session.loginId;
			} else {
				// server.db.query()
				// perform pgsql here with this incomming token
				result.data.token = Util.guid();
				result.data.hash = Encryption.toMd5( loginID );
				result.data.userInfo.loginId = loginID;
				result.data.error = false;
				// res, loginId, roleId, userData
				ctx.setSession( /*loginId*/loginID,/*roleId*/"Admin", /*userData*/{ token: result.data.token } );
			}
			ctx.res.writeHead( result.code, { 'Content-Type': 'application/json' } );
			ctx.write( JSON.stringify( result.data ) );
			ctx.res.end();
			ctx.next( 200 );
		} );
} );