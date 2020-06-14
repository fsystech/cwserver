function shouldBeError( next ) {
	try {
		next();
	} catch ( e ) {
		return e;
	}
};
global.sow.server.on( "register-view", ( app, controller, server ) => {
	console.assert( shouldBeError( () => { app.use( "ERROR", "ERROR" ) } ) instanceof Error );
	console.assert( shouldBeError( () => { app.prerequisites( "ERROR" ) } ) instanceof Error );
	console.assert( shouldBeError( () => { server.createBundle(  ) } ) instanceof Error );
} );