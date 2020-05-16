const cwserver = require( "./index" );
let server, app;
describe( "cwserver", function () {
    it( "createProjectTemplate", function () {
        cwserver.createProjectTemplate( {
            appRoot: __dirname,
            projectRoot: "www",
            allExample: false,
            force: true, // Delete if projectRoot exists 
            isTest: true // add test view
        } );
    } );
    it( "initilizeServer", function () {
        server = cwserver.initilizeServer( __dirname, "www" );
    } );
    it( "server.init", function () {
        app = server.init();
    } );
    it( "app.listen", function () {
        app.listen( server.port, () => {
            server.log.write( `
[+] Maintance      : https://www.safeonline.world
[+] Server         : http://localhost:${server.port}
[~] Running Server...
            `, cwserver.ConsoleColor.FgMagenta );
            app.getHttpServer().close();
        } );
    } );
} );