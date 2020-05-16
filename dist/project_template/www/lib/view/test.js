module.exports.__isRunOnly = true;
global.sow.server.registerView( ( app, controller, server ) => {
	controller
		.get( '/', ( ctx ) => {
			return ctx.res.render( ctx, server.mapPath( `/index${server.config.defaultExt || ".html"}` ) );
		} );
} );