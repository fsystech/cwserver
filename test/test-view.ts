// 4:38 AM 5/22/2020
import expect from 'expect';
import * as path from "path";
import * as fs from "fs";
import {
	IRequestParam
} from '../lib/sow-router';
import {
	IApps, IRequest, IResponse, NextFunction,
	parseCookie
} from '../lib/sow-server-core';
import { IController } from '../lib/sow-controller';
import {
	ISowServer, IContext,
	disposeContext, getMyContext, removeContext
} from '../lib/sow-server';
import { SowHttpCache } from '../lib/sow-http-cache';
import { SocketClient, SocketErr1, SocketErr2 } from './socket-client';
import { PayloadParser, socketInitilizer, HttpMimeHandler, Streamer, Util, Encryption } from '../index';
const mimeHandler = new HttpMimeHandler();
export function shouldBeError( next: () => void, printerr?: boolean ): Error | void {
	try {
		 next();
	} catch ( e ) {
		if ( printerr === true ) console.log( e );
		return e;
	}
};
global.sow.server.on( "register-view", ( app: IApps, controller: IController, server: ISowServer ) => {
	expect( parseCookie( ["test"] ) ).toBeInstanceOf( Object );
	expect( parseCookie( {} ) ).toBeInstanceOf( Object );
	app.use( "/app-error", ( req: IRequest, res: IResponse, next: NextFunction ) => {
		throw new Error( "Application should be fire Error event" );
	} );
	expect( shouldBeError( () => { socketInitilizer( server, SocketErr1() ) } ) ).toBeInstanceOf( Error );
	expect( shouldBeError( () => { socketInitilizer( server, SocketErr2() ) } ) ).toBeInstanceOf( Error );
	const ws = socketInitilizer( server, SocketClient() );
	const io = require( "socket.io" );
	ws.create( io );
	expect( ws.create( io ) ).toEqual( false );
	expect( ws.isConnectd ).toEqual( true );
	controller.get( '/ws-server-event', ( ctx: IContext, requestParam?: IRequestParam  ): void => {
		const event = ws.wsEvent;
		expect( event ).toBeInstanceOf( Object );
		ctx.res.json( ws.wsEvent || {} ); ctx.next( 200 );
		return void 0;
	} );
} );
global.sow.server.on( "register-view", ( app: IApps, controller: IController, server: ISowServer ) => {
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
global.sow.server.on( "register-view", ( app: IApps, controller: IController, server: ISowServer ) => {
	const streamDir = path.join( path.resolve( server.getRoot(), '..' ), "/project_template/test/" );
	server.addVirtualDir( "/web-stream", streamDir, ( ctx: IContext, requestParam?: IRequestParam  ): void => {
		if ( ctx.server.config.liveStream.indexOf( ctx.extension ) > -1 ) {
			const absPath = path.resolve( `${streamDir}/${ctx.path}` );
			if ( !Util.isExists( absPath, ctx.next ) ) return;
			const mimeType = mimeHandler.getMimeType( ctx.extension );
			return Streamer.stream( ctx, absPath, mimeType, fs.statSync( absPath ) );
		}
		return ctx.next( 404 );
	} );
	server.addVirtualDir( "/static-file", streamDir, ( ctx: IContext, requestParam?: IRequestParam  ): void => {
		return mimeHandler.render( ctx, streamDir, true );
	} );
	expect( shouldBeError( () => {
		server.addVirtualDir( "/static-file/*", streamDir );
	} ) ).toBeInstanceOf( Error );
	expect( shouldBeError( () => {
		server.addVirtualDir( "/:static-file", streamDir );
	} ) ).toBeInstanceOf( Error );
} );
global.sow.server.on( "register-view", ( app: IApps, controller: IController, server: ISowServer ) => {
	const downloadDir = server.mapPath( "/upload/data/" );
	if ( !fs.existsSync( downloadDir ) ) {
		Util.mkdirSync( server.mapPath( "/" ), "/upload/data/" );
	}
	const tempDir: string = server.mapPath( "/upload/temp/" );
	controller.post( '/post', async ( ctx: IContext, requestParam?: IRequestParam  ) => {
		const task: string | void = typeof ( ctx.req.query.task ) === "string" ? ctx.req.query.task.toString() : void 0;
		const parser = new PayloadParser( ctx.req, tempDir );
		if ( parser.isMultipart() ) {
			return ctx.next( 404 );
		}
		if ( task && task === "ERROR" ) {
			try {
				await parser.readDataAsync();
			} catch ( e ) {
				expect( e ).toBeInstanceOf( Error );
			}
		}
		parser.readData( ( err ) => {
			const result: { [key: string]: any; } = {};
			if ( parser.isAppJson() ) {
				result.isJson = true;
			}
			expect( shouldBeError( () => {
				parser.saveAs( downloadDir );
			} ) ).toBeInstanceOf( Error );
			expect( shouldBeError( () => {
				parser.getFiles( ( pf ) => { return; } );
			} ) ).toBeInstanceOf( Error );
			if ( err && err instanceof Error ) {
				ctx.res.json( Util.extend( result, { error: true, msg: err.message } ) );
			} else {
				ctx.res.json( Util.extend( result, parser.getJson() ) );
			}
			return ctx.next( 200 );
		} );
	} ).post( '/post-async/:id', async ( ctx: IContext, requestParam?: IRequestParam ) => {
		const parser = new PayloadParser( ctx.req, tempDir );
		if ( parser.isUrlEncoded() || parser.isAppJson() ) {
			await parser.readDataAsync();
			ctx.res.writeHead( 200, { 'Content-Type': 'application/json' } );
			return ctx.res.end( JSON.stringify( parser.getJson() ) ), ctx.next( 200 );
		}
		parser.saveAs( downloadDir );
		return ctx.res.asHTML( 200 ).end( "<h1>success</h1>" );
	} ).post( '/upload', async ( ctx ) => {
		const saveTo = typeof ( ctx.req.query.saveto ) === "string" ? ctx.req.query.saveto.toString() : void 0;
		const parser = new PayloadParser( ctx.req, tempDir );
		expect( shouldBeError( () => {
			parser.saveAs( downloadDir );
		} ) ).toBeInstanceOf( Error );
		parser.readData( ( err ) => {
			if ( err ) {
				if ( typeof ( err ) === "string" && err === "CLIENET_DISCONNECTED" ) return ctx.next( -500 );
				parser.clear();
				server.addError( ctx, err instanceof Error ? err.message : err );
				return ctx.next( 500 );
			}
			if ( !parser.isMultipart() ) {
				ctx.next( 404 );
			} else {
				const data: {
					[key: string]: any;
					content_type: string;
					name: string;
					file_name: string;
					content_disposition: string;
					file_size: number;
				}[] = [];
				parser.getFiles( ( file ) => {
					data.push( {
						content_type: file.getContentType(),
						name: file.getName(),
						file_name: file.getFileName(),
						content_disposition: file.getContentDisposition(),
						file_size: file.getFileSize(),
						temp_path: file.getTempPath()
					} );
					expect( file.read() ).toBeInstanceOf( Buffer );
					if ( saveTo ) {
						if ( saveTo === "C" )
							file.clear();
						return;
					}
					file.saveAs( `${downloadDir}/${Util.guid()}_${file.getFileName()}` );
					expect( shouldBeError( () => {
						file.read();
					} ) ).toBeInstanceOf( Error );
					expect( shouldBeError( () => {
						file.saveAs( `${downloadDir}/${Util.guid()}_${file.getFileName()}` );
					} ) ).toBeInstanceOf( Error );
				} );
				if ( saveTo && saveTo !== "C" ) {
					parser.saveAs( downloadDir );
				}
				expect( shouldBeError( () => {
					parser.getData();
				} ) ).toBeInstanceOf( Error );
				ctx.res.json( data.shift() || {} );
				ctx.next( 200 );
			}
			parser.clear();
		} );
	} );
} );
global.sow.server.on( "register-view", ( app: IApps, controller: IController, server: ISowServer ) => {
	controller
		.get( "/test-context", ( ctx: IContext, requestParam?: IRequestParam ): void => {
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
			ctx.transferRequest = ( toPath: string ): void => {
				expect( toPath.indexOf( "404" ) ).toBeGreaterThan( -1 );
			}
			mimeHandler.render( ctx );
			expect( mimeHandler.isValidExtension( ctx.extension ) ).toBeFalsy();
			ctx.transferRequest = treq;
			// ctx.extension = "";
			ctx.res.json( {
				done: true
			} );
		} )
		.any( '/test-any/*', ( ctx: IContext, requestParam?: IRequestParam ): void => {
			expect( server.passError( ctx ) ).toBeFalsy();
			ctx.res.json( { reqPath: ctx.path, servedFrom: "/test-any/*", q: requestParam } );
			server.addError( ctx, new Error( "__INVALID___" ) );
			expect( server.passError( ctx ) ).toBeFalsy( );
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
global.sow.server.on( "register-view", ( app: IApps, controller: IController, server: ISowServer ) => {
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
		.any( '/redirect', ( ctx: IContext, requestParam?: IRequestParam ): void => {
			return ctx.redirect( "/" ), ctx.next( 301, false );
		} )
		.any( '/pass-error', ( ctx: IContext, requestParam?: IRequestParam ): void => {
			server.addError( ctx, new Error( 'test pass-error' ) );
			server.addError( ctx, 'test pass-error' );
			return server.passError( ctx ), void 0;
		} )
		.get( '/authenticate', ( ctx: IContext, requestParam?: IRequestParam ): void => {
			if ( !ctx.req.query.loginId ) {
				if ( !ctx.req.session.isAuthenticated ) return ctx.next( 401 );
				return ctx.res.status( 301 ).redirect( "/" ), ctx.next( 301, false );
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
				server.setSession( ctx, /*loginId*/loginID,/*roleId*/"Admin", /*userData*/{ token: result.data.token } );
			}
			ctx.res.writeHead( result.code, { 'Content-Type': 'application/json' } );
			ctx.write( JSON.stringify( result.data ) );
			ctx.res.end();
			ctx.next( 200 );
		} );
} );