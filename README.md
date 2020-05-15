# ```cwserver``` Complete Node Web Server (All in one)<br/>
Install ```cwserver``` by this command ```npm i cwserver```<br/>
Create ```createProjectTemplate.js``` as following
```
const { createProjectTemplate } = require( 'cwserver' );
createProjectTemplate( {
    appRoot: __dirname,
    projectRoot: "www" /** Your project root folder name*/,
    allExample: false
} );
```
Then run this commmand ```node createProjectTemplate```<br/>
It will create default project template for ```cwserver``` in your application root.<br/>
Now your appRoot look like this
```
appRoot 
├─┬ wwww ( projectRoot )
│ └─┬ config
│   ├ lib
│   ├ template (this contains master template file)
│   ├ web (this contains temp and cache files)
│   └ index.html
├─ node_modules
├─ server.js
├─ package.json
└─ README.md
```
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
# Nested Master Template<br/>
```#extends``` keyword define my master template<br/>
You can add multiple file by ```#attach``` keyword
```
www
├─┬ template
│ └─┬ master.html 
│   ├ footer.html
│   ├ header.html
│   └ readme.html
├─ index.html

index.html  ==> #extends /template/readme.html
==> index.html impliment placeholder id of readme.html (parent master)
-------------------------------------------
#extends /template/readme.html
<impl-placeholder id="container">
    container here
</impl-placeholder>
-------------------------------------------
readme.html ==> #extends /template/master.html (parent master)
==> readme.html like as master template and its contains own placeholder and impliment placeholder id of master.html
-------------------------------------------
#extends /template/master.html
<impl-placeholder id="body">
    <!--Here create new placeholder-->
    <placeholder id="container">
    </placeholder>
</impl-placeholder>
<impl-placeholder id="header">
    #attach /template/header.html
</impl-placeholder>
-------------------------------------------
master.html ==> root master template
--------------------------------------------
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<placeholder id="header">
</placeholder>
<body>
    <placeholder id="body">
    </placeholder>
    #attach /template/footer.html
</body>
</html>
--------------------------------------------
```
see more about template /dist/project_template/www <br/><br/>
# server.js
You may create server.js file by you:
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
