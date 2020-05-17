module.exports.__isRunOnly = true;
const { PayloadParser, socketInitilizer } = require( '../../../index' );
global.sow.server.registerView( ( app, controller, server ) => {
	const ws = socketInitilizer( server, require( "../socket-client" ) );
	ws.create( require( "socket.io" ) );
	const tempDir = server.mapPath( "/upload/temp/" );
	controller
		.get( '/', ( ctx ) => {
			return ctx.res.render( ctx, server.mapPath( `/index${server.config.defaultExt || ".html"}` ) ), void 0;
		} )
		.get( '/ws-server-event', ( ctx ) => {
			ctx.res.json( ws.wsEvent ); ctx.next( 200 );
			return void 0;
		} )
		.any( '/response', ( ctx ) => {
			if ( ctx.req.method === "GET" ) {
				if ( ctx.req.query["task"] === "gzip" ) {
					const data = ctx.req.query["data"];
					return ctx.res.json( typeof ( data ) === "string" ? JSON.parse( data ) : data, true, ( err ) => {
						ctx.server.addError( ctx, err );
						ctx.next( 500 );
					} ), void 0;
				}
			}
			return ctx.next( 404 );
		} )
		.post( '/upload', ( ctx ) => {
			let parser = new PayloadParser( ctx.req, tempDir );
			parser.readData( ( err ) => {
				if ( err ) {
					if ( typeof ( err ) === "string" && err === "CLIENET_DISCONNECTED" ) return ctx.next( -500 );
					parser.clear();
					server.addError( ctx, err.message );
					return ctx.next( 500 );
				}
				if ( !parser.isMultipart() ) {
					ctx.next( 404 );
				} else {
					const data = [];
					parser.getFiles( ( file ) => {
						data.push( {
							content_type: file.getContentType(),
							name: file.getName(),
							file_name: file.getFileName(),
							content_disposition: file.getContentDisposition(),
							file_size: file.getFileSize()
						} );
					} );
					ctx.res.json( data.shift() );
					ctx.next( 200 );
				}
				parser.clear();
			} );
		} )
		.post( '/post', ( ctx ) => {
			let parser = new PayloadParser( ctx.req, tempDir );
			parser.readData( ( err ) => {
				if ( parser.isUrlEncoded() || parser.isAppJson() ) {
					ctx.res.writeHead( 200, { 'Content-Type': 'application/json' } );
					return ctx.res.end( JSON.stringify( parser.getJson() ) ), ctx.next( 200 ), void 0;
				}
				return ctx.next( 404 );
			} );
		} );
} );