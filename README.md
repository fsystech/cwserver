# ```cwserver``` Complete Node Web Server (All in one)<br/>
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
After, run this command ```node server www /**your project root*/```<br/>
# Template Engine<br/>
Template can run ```config.defaultExt``` file extension or ```ctx.res.render( ctx, to_file_path )``` <br/>
Example of server-side script in ```config.defaultExt``` or ```.htm|.html```<br/>
Code block:
```
{%
    if( !ctx.session.isAuthenticated ){
       return ctx.next( 401, true );
    } else {
       ctx.write( JSON.stringify( ctx.session ) );
    }
%}
```
Response write: ```{= myVar =}``` or ```ctx.write(myVar)```<br/>
```
{%
    const result = await ctx.server.db.pgsql.executeIoAsync( "my_shcema.__get_dataset", JSON.stringify( {
        login_id: ctx.req.session.loginId
    } ), JSON.stringify( {
        trade_date: "2020-02-03"
    } ) );
%}
{% if ( result.ret_val < 0) { %}
    <span style="color:red">No Data Found...</span>
{% } else { %}
<table style="width:100%">
   <thead>
      <tr>
         <th>Firstname</th>
         <th>Lastname</th>
         <th>Age</th>
      </tr>
   </thead>
   <tbody>
   {% for( const row of result.ret_data_table ){ %}
        <tr>
            <td>{= row.first_name =}</td>
            <td>{= row.last_name =}</td>
            <td>{= row.age_name =}</td>
        </tr>
   {% } %}
   </tbody>
</table>
{% } %}
```


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
    [+] Socket         : ws://localhost:${server.port}${server.socketPath}
    [~] Running Server...
`, ConsoleColor.FgMagenta ) );
```
Read more about [app.config.json](https://github.com/safeonlineworld/cwserver/blob/master/schema.json)<br/> 
run ```node server your_app_dir_name``` or ```npm start your_app_dir_name```
