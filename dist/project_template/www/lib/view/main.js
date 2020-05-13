//#!/usr/bin/env node
/**
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
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
global.sow.server.registerView( ( app, controller, server ) => {
	const { PayloadParser, Encryption, socketInitilizer } = require( 'cwserver' );
	//const ws = socketInitilizer(server, require("../socket-client"));
	//ws.create(require("socket.io"));
	
	// Create your virtual dir
	// server.addVirtualDir( "/sow", _path.resolve( server.getRoot() + "\\sow\\" ) );
	const tempDir = server.mapPath( "/upload/temp/" );
	const downloadDir = server.mapPath( "/upload/data/" );
	function getSize( size ) {
		if ( size < 1024 ) return `${size}Byte`;
		let kb = ( size / 1024 );
		if ( kb <= 1024 ) return `${kb.toFixed( 2 )}KB`;
		let mb = ( kb / 1024 );
		if ( mb <= 1024 ) return `${mb.toFixed( 2 )}MB`;
		return `${( mb / 1024 ).toFixed( 2 )}GB`;
	}
	//controller.get('/ws', (ctx)=>{
	//	ctx.res.json(ws.wsEvent,true, (err)=>{
	//		if(err){
	//			server.addError(err);
	//			return ctx.next(500), void 0;
	//		}
	//		ctx.next(200);
	//	});
	//});
	controller
		.get( '/', ( ctx ) => {
			return server.render( ctx, server.mapPath( `/index${server.config.defaultExt || ".html"}` ) );
		} ).get( '/authenticate', ( ctx ) => {
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
			ctx.res.writeHead( result.code, { 'Content-Type': 'application/json' } );
			ctx.res.end( JSON.stringify( result.data ) );
			ctx.next( 200 );
		} ).any( "/post_data_async", async ( ctx ) => {
			if ( ctx.req.method !== "POST" ) return ctx.next( 404 );
			try {
				let parser = new PayloadParser( ctx.req, tempDir );
				await parser.readDataAsync();
				if ( parser.isUrlEncoded() ) {
					ctx.res.writeHead( 200, { 'Content-Type': 'application/json' } );
					ctx.res.end( JSON.stringify( parser.getJson() ) );
				} else {
					parser.saveAs( downloadDir );
					ctx.res.writeHead( 200, { 'Content-Type': 'text/html' } );
					ctx.res.end( "File uploaded..." );
				}
				parser.clear();
				return ctx.next( 200 );
			} catch ( err ) {
				parser.clear();
				server.addError( ctx, err.message );
				return ctx.next( 500 );
			}

		} ).any( "/post_data", ( ctx ) => {
			if ( ctx.req.method !== "POST" ) return ctx.next( 404 );
			let parser = new PayloadParser( ctx.req, tempDir );
			parser.readData( ( err ) => {
				if ( err ) {
					if ( typeof ( err ) === "string" && err === "CLIENET_DISCONNECTED" ) return ctx.next( -500 );
					parser.clear();
					server.addError( ctx, err.message );
					return ctx.next( 500 );
				}
				if ( parser.isUrlEncoded() ) {
					ctx.res.writeHead( 200, { 'Content-Type': 'application/json' } );
					ctx.res.end( JSON.stringify( parser.getJson() ) );
				} else {
					let count = 1;
					let fileInfo = "<ul>";
					parser.getFiles( ( file ) => {
						fileInfo += `<li>SL:${count}</li>`;
						fileInfo += `<li>content_type:${file.getContentType()}</li>`;
						fileInfo += `<li>name:${file.getName()}</li>`;
						fileInfo += `<li>file_name:${file.getFileName()}</li>`;
						fileInfo += `<li>content_disposition:${file.getContentDisposition()}</li>`;
						fileInfo += `<li>file Size: ${getSize( file.getFileSize() )}</li>`;
						fileInfo += `<li>Writing file ${file.getFileName()}</li>`;
						file.saveAs( `${downloadDir}/${_generateRandomNumber()}_${file.getFileName()}` );
						count++;
					} );
					fileInfo += "</ul>";
					//parser.saveAs( downloadDir );
					ctx.res.writeHead( 200, { 'Content-Type': 'text/html' } );
					ctx.res.end( fileInfo );
				}
				parser.clear();
				ctx.next( 200 );
			} );
			return;
		} );
} );