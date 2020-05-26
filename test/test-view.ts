// 4:38 AM 5/22/2020
import expect from 'expect';
import * as path from "path";
import * as fs from "fs";
import { IApps } from '../lib/sow-server-core';
import { IController } from '../lib/sow-controller';
import { ISowServer } from '../lib/sow-server';
import { SocketClient } from './socket-client';
import { PayloadParser, socketInitilizer, HttpMimeHandler, Streamer, Util, Encryption } from '../index';
const mimeHandler = new HttpMimeHandler();
export function shouldBeError( next: () => void ): Error | void {
	try {
		next();
	} catch ( e ) {
		return e;
	}
};
global.sow.server.on( "register-view", ( app: IApps, controller: IController, server: ISowServer ) => {
	app.use( "/app-error", ( req, res, next ) => {
		throw new Error( "Application should be fire Error event" );
	} );
	const ws = socketInitilizer( server, SocketClient() );
	ws.create( require( "socket.io" ) );
	const tempDir: string = server.mapPath( "/upload/temp/" );
	const vDir: string = path.join( path.resolve( server.getRoot(), '..' ), "/project_template/test/" );
	server.addVirtualDir( "/vtest", vDir, ( ctx ) => {
		if ( !mimeHandler.isValidExtension( ctx.extension ) ) return ctx.next( 404 );
		mimeHandler.getMimeType( ctx.extension );
		return mimeHandler.render( ctx, vDir, true );
	} );
	expect( shouldBeError( () => {
		server.addVirtualDir( "/vtest", vDir );
	} ) ).toBeInstanceOf( Error );
	server.addVirtualDir( "/test-virtual", vDir );
	const streamDir = path.join( path.resolve( server.getRoot(), '..' ), "/project_template/test/" );
	server.addVirtualDir( "/web-stream", streamDir, ( ctx ) => {
		if ( ctx.server.config.liveStream.indexOf( ctx.extension ) > -1 ) {
			const absPath = path.resolve( `${streamDir}/${ctx.path}` );
			if ( !Util.isExists( absPath, ctx.next ) ) return;
			const mimeType = mimeHandler.getMimeType( ctx.extension );
			return Streamer.stream( ctx, absPath, mimeType, fs.statSync( absPath ) );
		}
		return ctx.next( 404 );
	} );
	server.addVirtualDir( "/static-file", streamDir, ( ctx ) => {
		return mimeHandler.render( ctx, streamDir, true );
	} );
	const downloadDir = server.mapPath( "/upload/data/" );
	if ( !fs.existsSync( downloadDir ) ) {
		Util.mkdirSync( server.mapPath( "/" ), "/upload/data/" );
	}
	controller
		.get( '/ws-server-event', ( ctx ) => {
			ctx.res.json( ws.wsEvent ); ctx.next( 200 );
			return void 0;
		} )
		.get( '/get-file', ( ctx ) => {
			return Util.sendResponse( ctx, server.mapPath( "index.html" ), "text/plain" );
		} )
		.any( '/cookie', ( ctx ) => {
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
		.any( '/echo', ( ctx ) => {
			ctx.res.writeHead( 200, {
				"Content-Type": ctx.req.headers["content-type"] || "text/plain"
			} );
			ctx.req.pipe( ctx.res );
			return void 0;
		} )
		.any( '/response', ( ctx ) => {
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
		.get( '/is-authenticate', ( ctx ) => {
			if ( !ctx.req.query.loginId ) return ctx.next( 401 );
			if ( ctx.session.loginId !== ctx.req.query.loginId ) return ctx.next( 401 );
			ctx.res.json( ctx.session ); return ctx.next( 200 );
		} )
		.any( '/redirect', ( ctx ) => {
			return ctx.redirect( "/" ), ctx.next( 301, false );
		} )
		.any( '/pass-error', ( ctx ) => {
			server.addError( ctx, new Error( 'test pass-error' ) );
			server.addError( ctx, 'test pass-error' );
			return server.passError( ctx ), void 0;
		} )
		.get( '/authenticate', ( ctx ) => {
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
			ctx.res.end( );
			ctx.next( 200 );
		} )
		.post( '/post', ( ctx ) => {
			const parser = new PayloadParser( ctx.req, tempDir );
			parser.readData( ( err ) => {
				if ( parser.isUrlEncoded() || parser.isAppJson() ) {
					expect( shouldBeError( () => {
						parser.saveAs( downloadDir );
					} ) ).toBeInstanceOf( Error );
					expect( shouldBeError( () => {
						parser.getFiles( ( pf ) => { return; } );
					} ) ).toBeInstanceOf( Error );
					return ctx.res.json( parser.getJson() ), ctx.next( 200 ), void 0;
				}
				return ctx.next( 404 );
			} );
		} ).post( '/post-async', async ( ctx ) => {
			const parser = new PayloadParser( ctx.req, tempDir );
			await parser.readDataAsync();
			if ( parser.isUrlEncoded() || parser.isAppJson() ) {
				ctx.res.writeHead( 200, { 'Content-Type': 'application/json' } );
				return ctx.res.end( JSON.stringify( parser.getJson() ) ), ctx.next( 200 ), void 0;
			}
			return ctx.next( 404 );
		} )
		.post( '/upload', ( ctx ) => {
			const parser = new PayloadParser( ctx.req, tempDir );
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
					const saveTo = typeof ( ctx.req.query.saveto ) === "string";
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
						if ( saveTo ) return;
						file.saveAs( `${downloadDir}/${Util.guid()}_${file.getFileName()}` );
					} );
					if ( saveTo )
						parser.saveAs( downloadDir );
					expect( shouldBeError(()=>{
						parser.getData();
					}) ).toBeInstanceOf( Error );
					ctx.res.json( data.shift() || {} );
					ctx.next( 200 );
				}
				parser.clear();
			} );
		} );
} );