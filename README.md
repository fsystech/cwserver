# ```cwserver``` Complete Node Web Server<br/>
Install ```cwserver``` by this command ```npm i cwserver```<br/>
Create ```createProjectTemplate.js``` as following
```
const { createProjectTemplate } = require( 'cwserver' );
createProjectTemplate( {
    appRoot: __dirname,
    projectRoot: "www" /** Your project root folder name*/
} );
```
Then run this commmand ```node createProjectTemplate```<br/>
It will create default project template for ```cwserver``` in your application root.<br/>
After run this command ```node server www /**your project root*/```<br/><br/><br/>
Or you may create by yourself as following:<br/>
Create server.js file:
```
const { ConsoleColor, initilizeServer } = require( 'cwserver' );
let wwwName = void 0;
if ( process.argv.length > 2 ) {
    wwwName = process.argv[2];
} else {
    if ( process.env.APP_POOL_ID ) {
        wwwName = process.env[process.env.APP_POOL_ID];
    }
}
const server = initilizeServer( __dirname, wwwName );
const app = server.init();
process.on( 'exit', () => {
    console.log( "Exited..." );
} );
process.on( 'SIGINT', () => {
    server.log.error( "Caught interrupt signal" );
    server.log.error( "Application Exited..." );
    server.log.reset(); server.log.dispose();
    setTimeout( () => {
        process.exit( 0 );
    }, 200 );
} );
app.listen( server.port, () => server.log.write( `
    [+] Maintance      : https://www.safeonline.world
    [+] Server         : http://localhost:${server.port}
    [+] Socket         : ws://localhost:${server.port}/app/hub/ws/
    [~] Running Server...
`, ConsoleColor.FgMagenta ) );
```
follow ```app_config.json``` and 
run ```node server your_app_dir_name```
