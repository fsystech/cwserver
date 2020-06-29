//#!/usr/bin/env node
/**
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
//7:10 PM 5/10/2020
module.exports.__isRunOnly = true;
//const _path = require( 'path' );
function _generateRandomNumber( num ) {
	if ( typeof ( num ) !== "number" ) num = 10;
	let
		charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
		result = "";
	// Set 3 capital letters
	for ( let i = 0, n = charset.length; i < num; ++i ) {
		result += charset.charAt( Math.floor( Math.random() * n ) );
	}
	return result;
}
global.sow.server.on( "register-view", ( app, controller, server ) => {
	const { getBodyParser, Encryption, fsw } = require( 'cwserver' );
	// const { PayloadParser, Encryption, socketInitilizer } = require( 'cwserver' );
	// const ws = socketInitilizer(server, require("../socket-client"));
	//ws.create(require("socket.io"));

	// Create your virtual dir
	// server.addVirtualDir( "/sow", _path.resolve( server.getRoot() + "\\sow\\" ) );
	const tempDir = server.mapPath( "/upload/temp/" );
	const downloadDir = server.mapPath( "/upload/data/" );
	fsw.mkdirSync( tempDir );
	fsw.mkdirSync( downloadDir );
	//controller.get('/ws', (ctx)=>{
	//	ctx.res.json(ws.wsEvent,true, (err)=>{
	//		if(err){
	//			server.addError(err);
	//			return ctx.next(500), void 0;
	//		}
	//		ctx.next(200);
	//	});
	//});
	global.sow.server.on( "register-view", ( app, controller, server ) => {
		controller.get( '/authenticate/:loginId/:roleid', ( ctx, requestParam ) => {
			if ( ctx.req.session.isAuthenticated ) {
				ctx.res.status( 200 ).type( "html" ).send( `Hello ${ctx.req.session.loginId}` );
			} else {
				ctx.setSession(/*loginId*/requestParam.query.loginId,/*roleId*/requestParam.query.roleId, /*userData*/{ token: ctx.req.query.token } );
				ctx.res.status( 200 ).type( "html" ).send( `Authentication success ${ctx.req.query.loginId}` );
			}
			return ctx.next( 200 );
		} );
	} );
	controller
		.get( '/', ( ctx ) => {
			return ctx.res.render( ctx, server.mapPath( `/index${server.config.defaultExt || ".html"}` ) );
		} )
		.get( '/task/:id', ( ctx, match ) => {
			return ctx.res.status( 200 ).json( { reqPath: ctx.path, servedFrom: "/task/:id", q: match } );
		} )
		.get( '/dist/*', ( ctx, match ) => {
			return ctx.res.status( 200 ).json( { reqPath: ctx.path, servedFrom: "/dist/*", q: match } );
		} )
		.get( '/user/:id/settings', ( ctx, match ) => {
			return ctx.res.status( 200 ).json( { reqPath: ctx.path, servedFrom: "/user/:id/settings", q: match } );
		} )
		.get( '/user/:id/:name/settings', ( ctx, match ) => {
			return ctx.res.status( 200 ).json( { reqPath: ctx.path, servedFrom: "/user/:id/:name/settings", q: match } );
		} )
		.get( '/authenticate', ( ctx ) => {
			let result = {
				code: 200,
				data: void 0
			};
			if ( ctx.req.session.isAuthenticated ) {
				result.data = {
					token: ctx.req.session.userData.token,
					hash: Encryption.toMd5( ctx.req.session.loginId ),
					user_info: {
						loginId: ctx.req.session.loginId
					},
					ws: void 0
				};
			} else {
				if ( !ctx.req.query.token ) {
					result.data = {
						error: true,
						msg: "No token found..."
					};
				} else {
					//server.db.query()
					//perform pgsql here with this incomming token
					result.data = {
						token: ctx.req.query.token,
						hash: Encryption.utf8ToHex( "rajib" ),
						userInfo: {
							loginId: void 0
						},
						ws: void 0
					};
					result.data.error = false;
					//res, loginId, roleId, userData
					server.setSession( ctx, /*loginId*/"rajib",/*roleId*/"Admin", /*userData*/{ token: ctx.req.query.token } );
				}
			}
			ctx.res.status( 200 ).json( result.data );
			ctx.next( 200 );
		} ).any( "/post_data_async", async ( ctx ) => {
			if ( ctx.req.method !== "POST" ) return ctx.next( 404 );
			try {
				let parser = getBodyParser( ctx.req, tempDir );
				await parser.parseSync();
				if ( parser.isUrlEncoded() ) {
					ctx.res.status( 200 ).json( parser.getJson() );
				} else {
					parser.saveAsSync( downloadDir );
					ctx.res.type( "html" ).status( 200 ).send( "File uploaded..." );
				}
				parser.dispose();
				return ctx.next( 200 );
			} catch ( err ) {
				parser.clear();
				ctx.transferError( err );
			}
		} ).any( "/post_data", ( ctx ) => {
			if ( ctx.req.method !== "POST" ) return ctx.next( 404 );
			let parser = getBodyParser( ctx.req, tempDir );
			parser.parse( ( err ) => {
				if ( err ) {
					if ( typeof ( err ) === "string" && err === "CLIENET_DISCONNECTED" ) return ctx.next( -500 );
					parser.clear();
					return ctx.transferError( err );
				}
				if ( parser.isUrlEncoded() ) {
					ctx.res.status( 200 ).json( parser.getJson() );
				} else {
					let count = 1;
					let fileInfo = "<ul>";
					parser.getFilesSync( ( file ) => {
						fileInfo += `<li>SL:${count}</li>`;
						fileInfo += `<li>content_type:${file.getContentType()}</li>`;
						fileInfo += `<li>name:${file.getName()}</li>`;
						fileInfo += `<li>file_name:${file.getFileName()}</li>`;
						fileInfo += `<li>content_disposition:${file.getContentDisposition()}</li>`;
						fileInfo += `<li>Writing file ${file.getFileName()}</li>`;
						file.saveAsSync( `${downloadDir}/${_generateRandomNumber()}_${file.getFileName()}` );
						count++;
					} );
					fileInfo += "</ul>";
					//parser.saveAsSync( downloadDir );
					ctx.res.status( 200, { 'Content-Type': 'text/html' } ).send( fileInfo );
				}
				parser.clear();
				ctx.next( 200 );
			} );
			return;
		} );
} );