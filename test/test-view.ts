// 4:38 AM 5/22/2020
// import expect from 'expect';
import * as path from "path";
import * as fs from "fs";
import { IApps } from '../lib/sow-server-core';
import { IController } from '../lib/sow-controller';
import { ISowServer, IContext } from '../lib/sow-server';
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
	const tempDir = server.mapPath( "/upload/temp/" );
	const vDir = path.join( path.resolve( server.getRoot(), '..' ), "/project_template/test/" );
	server.addVirtualDir( "/vtest", vDir, ( ctx ) => {
		if ( !mimeHandler.isValidExtension( ctx.extension ) ) return ctx.next( 404 );
		mimeHandler.getMimeType( ctx.extension );
		return mimeHandler.render( ctx, vDir, true );
	} );
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
	controller
		.get( '/ws-server-event', ( ctx ) => {
			ctx.res.json( ws.wsEvent ); ctx.next( 200 );
			return void 0;
		} )
		.get( '/get-file', ( ctx ) => {
			return Util.sendResponse( ctx, server.mapPath( "index.html" ), "text/plain" );
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
							file_size: file.getFileSize()
						} );
					} );
					ctx.res.json( data.shift() || {} );
					ctx.next( 200 );
				}
				parser.clear();
			} );
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
			server.addError( ctx, new Error('test pass-error') );
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
					ctx.res.writeHead( 200, { 'Content-Type': 'application/json' } );
					return ctx.res.end( JSON.stringify( parser.getJson() ) ), ctx.next( 200 ), void 0;
				}
				return ctx.next( 404 );
			} );
		} );
} );